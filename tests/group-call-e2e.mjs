// E2E de WebRTC real entre duas abas Chromium usando o código do site.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const script=readFileSync(path.resolve(dir,'../group-call.js'));
const html=String.raw`<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
const U=new URL(location.href).searchParams.get('u');
const users={a:'11111111-1111-4111-8111-111111111111',b:'99999999-9999-4999-8999-999999999999'};
const id=users[U],groupId='22222222-2222-4222-8222-222222222222';
const room={id:groupId,kind:'group',name:'Teste de mídia',owner_id:id};
const usersState={rooms:[room]};
window.uentzoulMessenger={onLogout:()=>{}};
window.uentzoulGroupCallBridge={
  client:()=>({
    from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{user_id:id},error:null})}),
    channel:(topic,config)=>makeChannel(topic,config),
    removeChannel:async c=>{c._close();return 'ok'},
    storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:''}})})}
  }),
  user:()=>({id,is_anonymous:false}),state:()=>usersState,
  profile:()=>({display_name:U==='a'?'Pessoa A':'Pessoa B'}),
  person:()=>({display_name:'Pessoa '+U.toUpperCase()}),refresh:()=>{}
};
function makeChannel(topic,config){
 const handlers=[],states=new Map();
 let bus=null;
 const key=config.presence.key;
 function sync(){for(const h of handlers)if(h.type==='presence'&&h.event==='sync')h.fn();}
 function sendBus(data){bus?.postMessage(data);}
 const chan={
  on(type,filter,fn){handlers.push({type,event:filter?.event,fn});return this;},
  subscribe(fn){
   bus=new BroadcastChannel('test:'+topic);
   bus.onmessage=e=>{
    const m=e.data;
    if(m.type==='hello'){if(states.has(key))sendBus({type:'presence',key,meta:states.get(key)});}
    else if(m.type==='presence'){states.set(m.key,m.meta);sync();}
    else if(m.type==='leave'){states.delete(m.key);sync();}
    else if(m.type==='broadcast'){
      for(const h of handlers)if(h.type==='broadcast'&&h.event===m.event)h.fn({payload:m.payload});
    }
   };
   queueMicrotask(()=>{fn('SUBSCRIBED');sendBus({type:'hello'});});
   return this;
  },
  track:async meta=>{states.set(key,meta);sync();sendBus({type:'presence',key,meta});return 'ok';},
  presenceState:()=>Object.fromEntries([...states].map(([k,v])=>[k,[v]])),
  send:async obj=>{sendBus({type:'broadcast',event:obj.event,payload:obj.payload});return 'ok';},
  untrack:async()=>{states.delete(key);sendBus({type:'leave',key});return 'ok';},
  _close(){bus?.close();}
 };
 return chan;
}
navigator.mediaDevices.getDisplayMedia=async()=>{
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
 const context=canvas.getContext('2d');
 const paint=()=>{context.fillStyle='#05a';context.fillRect(0,0,640,360);context.fillStyle='white';context.font='52px sans-serif';context.fillText('TELA',50,160);};
 paint();window.__paint=setInterval(paint,250);
 return canvas.captureStream(10);
};
</script><script src="/group-call.js"></script></body></html>`;
const server=createServer((req,res)=>{
 if(req.url.startsWith('/group-call.js')){res.setHeader('Content-Type','text/javascript');res.end(script);}
 else{res.setHeader('Content-Type','text/html');res.end(html);}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const root='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:[
 '--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',
 '--autoplay-policy=no-user-gesture-required','--no-sandbox'
]});
const context=await browser.newContext({permissions:['camera','microphone']});
const a=await context.newPage(),b=await context.newPage(),errors=[];
for(const [p,name] of [[a,'A'],[b,'B']]){
 p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errors.push(name+':'+m.text());});
 p.on('pageerror',e=>errors.push(name+': PAGE ERROR: '+e.message));
 p.on('dialog',dialog=>{errors.push(name+': DIALOG '+dialog.message());void dialog.dismiss();});
}
async function waitFor(p,fn,msg,timeout=22000){
 await p.waitForFunction(fn,{timeout}).catch(e=>{throw Error(msg+' | '+e.message);});
}
try{
 await Promise.all([a.goto(root+'/?u=a'),b.goto(root+'/?u=b')]);
 await Promise.all([a.evaluate(id=>window.uentzoulGroupCalls.open(id),'22222222-2222-4222-8222-222222222222'),b.evaluate(id=>window.uentzoulGroupCalls.open(id),'22222222-2222-4222-8222-222222222222')]);
 await Promise.all([a.locator('[data-gc-action="join"]').click(),b.locator('[data-gc-action="join"]').click()]);
 await waitFor(a,()=>window.uentzoulGroupCalls.active,'Pessoa A não entrou');
 await waitFor(b,()=>window.uentzoulGroupCalls.active,'Pessoa B não entrou');
 await b.locator('[data-gc-action="cam"]').click();
 await waitFor(a,()=>[...document.querySelectorAll('.gc-tile:not(.gc-is-self) video')].some(v=>v.videoWidth>0&&v.videoHeight>0),'A não recebeu câmera de B');
 await a.locator('[data-gc-action="screen"]').click();
 await waitFor(b,()=>[...document.querySelectorAll('.gc-tile:not(.gc-is-self) video')].some(v=>v.videoWidth>0&&v.videoHeight>0),'B não recebeu a tela de A');
 console.log('PASS: câmera e tela recebidas por outro navegador via WebRTC real');
}catch(e){
 console.error('FAIL:',e.message);
 for(const [p,label] of [[a,'A'],[b,'B']]){
  console.error('STATE '+label,await p.evaluate(()=>{
   const S=window.__callInspect?.S;
   return {active:window.uentzoulGroupCalls?.active,dialog:document.querySelector('.gc-window')?.innerText.slice(0,700),status:document.querySelector('[data-gc-status]')?.textContent,stats:S?{stage:S.stage,peers:S.peers.size}:null};
  }).catch(err=>'Page exception: '+err.message));
 }
 console.error(errors.join('\n'));process.exitCode=1;
}
finally{await browser.close();server.close();}
