import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source=fs.readFileSync(path.resolve(import.meta.dirname,'../group-call.js'),'utf8');
const id='12345678-1234-4234-8234-123456789abc';

function rig(invoke){
 const context={
  window:{uentzoulGroupCallBridge:{
   client:()=>invoke?{functions:{invoke}}:{},user:()=>({id,is_anonymous:false}),
   state:()=>({rooms:[]}),person:()=>({display_name:'Participante'}),
   profile:()=>null,refresh:()=>{}
  }},
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  document:{},navigator:{},localStorage:{getItem:()=>null,setItem(){}}
 };
 const injected=source.replace('if(!init()){','window.__turnTests={S,iceConfig,hasTurn,loadTurnServers};if(false){');
 assert.notEqual(injected,source);
 vm.runInNewContext(injected,context,{filename:'group-call.js'});
 const api=context.window.__turnTests;
 api.S.stage='joining';api.S.generation=7;
 return api;
}
test('credenciais temporárias ficam disponíveis para RTCPeerConnection antes de entrar na call',async()=>{
 const api=rig(async()=>({data:{iceServers:[
  {urls:['turn:turn.cloudflare.com:3478?transport=udp','turns:turn.cloudflare.com:443?transport=tcp'],
    username:'ephemeral-user',credential:'temporary-password'},
  {urls:'stun:stun.cloudflare.com:3478'}
 ]},error:null}));
 await api.loadTurnServers(7);
 assert.equal(api.S.turnStatus,'ready');
 assert.equal(api.hasTurn(),true);
 const config=api.iceConfig();
 const relay=config.iceServers.find(s=>s.username==='ephemeral-user');
 assert.equal(relay.credential,'temporary-password');
 assert.equal(relay.urls.length,2);
});
test('resposta 503 do corretor TURN mantém STUN sem alegar conectividade',async()=>{
 const api=rig(async()=>({data:null,error:{message:'Not configured',context:{status:503}}}));
 await api.loadTurnServers(7);
 assert.equal(api.S.turnStatus,'unconfigured');
 assert.equal(api.hasTurn(),false);
 assert.equal(api.iceConfig().iceServers.length,2);
});
test('sem provedor as credenciais TURN não são inventadas',async()=>{
 const api=rig(null);
 await api.loadTurnServers(7);
 assert.equal(api.hasTurn(),false);
 assert.equal(api.S.turnStatus,'none');
});
test('TURN sem senha é rejeitado',async()=>{
 const api=rig(async()=>({data:{iceServers:[{urls:'turn:turn.cloudflare.com:3478?transport=udp',username:'test'}]}}));
 await api.loadTurnServers(7);
 assert.equal(api.hasTurn(),false);
 assert.equal(api.S.turnStatus,'unavailable');
});
