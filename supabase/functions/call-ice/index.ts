// Secure TURN credential broker for Estudos Uentzoul.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectKey():string{
 try{const keys=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}');if(typeof keys.default==='string')return keys.default;}catch(_){}
 return Deno.env.get('SUPABASE_ANON_KEY')||'';
}
async function canJoin(req:Request,room:any):Promise<boolean>{
 const jwt=/^Bearer\s+(\S+)$/i.exec(req.headers.get('Authorization')||'')?.[1];
 const endpoint=Deno.env.get('SUPABASE_URL'),key=projectKey();
 if(!jwt||!endpoint||!key)return false;
 const db=createClient(endpoint,key,{global:{headers:{Authorization:'Bearer '+jwt}},
  auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(jwt);
 if(error||!user||user.is_anonymous)return false;
 if(room?.kind==='group'&&typeof room.id==='string'&&uuid.test(room.id)){
  const {data:group,error:groupError}=await db.from('uentzoul_chat_rooms')
   .select('kind,owner_id').eq('id',room.id).maybeSingle();
  if(groupError||group?.kind!=='group')return false;
  if(group.owner_id===user.id)return true;
  const {data:member,error:memberError}=await db.from('uentzoul_chat_members')
   .select('user_id').eq('room_id',room.id).eq('user_id',user.id).maybeSingle();
  return !memberError&&!!member;
 }
 if(room?.kind==='private'&&typeof room.peerId==='string'&&uuid.test(room.peerId)&&room.peerId!==user.id){
  const {data:peer,error:peerError}=await db.from('uentzoul_profiles')
   .select('user_id').eq('user_id',room.peerId).maybeSingle();
  return !peerError&&!!peer;
 }
 return false;
}
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}
});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 // The Supabase gateway additionally verifies the user's access JWT.
 if(!/^Bearer\s+\S+$/i.test(req.headers.get('authorization')||''))return json({error:'unauthorized'},401);
 const roomInput=await req.json().catch(()=>({}));
 const room=roomInput?.room&&typeof roomInput.room==='object'&&!Array.isArray(roomInput.room)?roomInput.room:{};
 const keyId=Deno.env.get('CF_TURN_KEY_ID');
 const token=Deno.env.get('CF_TURN_KEY_TOKEN');
 if(!keyId||!token)return json({error:'turn_not_configured'},503);
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(keyId))return json({error:'turn_configuration_invalid'},503);
 try{
  if(!await canJoin(req,room))return json({error:'not_allowed'},403);
  const response=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+encodeURIComponent(keyId)+'/credentials/generate-ice-servers',{
   method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({ttl:3600}),signal:AbortSignal.timeout(7000)
  });
  if(!response.ok){console.error('TURN provider could not mint credentials: HTTP',response.status);return json({error:'turn_provider_unavailable'},502);}
  const body=await response.json();
  const servers=(Array.isArray(body?.iceServers)?body.iceServers:[])
   .map((s:unknown)=>{
    if(!s||typeof s!=='object')return null;
    const item=s as Record<string,unknown>;
    const urls=(Array.isArray(item.urls)?item.urls:[item.urls]).filter((u):u is string=>
      typeof u==='string'&&/^(?:stun:stun\.cloudflare\.com:3478|turns?:turn\.cloudflare\.com:(?:3478|5349|443|80)(?:\?transport=(?:tcp|udp))?)$/.test(u));
    if(!urls.length)return null;
    if(urls.every(u=>u.startsWith('stun:')))return {urls};
    if(typeof item.username!=='string'||typeof item.credential!=='string')return null;
    return {urls,username:item.username,credential:item.credential};
   }).filter(Boolean);
  if(!servers.some((s:any)=>s.urls.some((u:string)=>u.startsWith('turn:')||u.startsWith('turns:'))))
   return json({error:'turn_provider_bad_response'},502);
  return json({iceServers:servers,expiresIn:3600});
 }catch(e){
  console.error('TURN broker error',e instanceof Error?e.name:'unknown');
  return json({error:'turn_provider_unavailable'},502);
 }
});