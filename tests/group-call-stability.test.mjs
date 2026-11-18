// Regressões de chamada: mídia, presença e reconexões sem depender de contas reais.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source=fs.readFileSync(path.resolve(import.meta.dirname,'../group-call.js'),'utf8');
const self='12345678-1234-1234-1234-123456789abc';
const member='87654321-4321-4321-4321-cba987654321';

class Track{
 constructor(kind,id){this.kind=kind;this.id=id;this.readyState='live';this.muted=false;this.enabled=true;}
 stop(){this.readyState='ended';}
 addEventListener(){}
}
class Stream{
 constructor(tracks=[]){this.tracks=[...tracks];}
 getTracks(){return [...this.tracks];}
 getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}
 getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}
 addTrack(t){this.tracks.push(t);}
 removeTrack(t){this.tracks=this.tracks.filter(x=>x!==t);}
}
function mockSender(original,fail=()=>false){
 return {
  track:original,
  async replaceTrack(next){
   if(fail(next))throw new Error('Substituição de sender rejeitada');
   this.track=next;
  },
  getParameters(){return {encodings:[]};}
 };
}
function rig(){
 const timers=new Map();let tick=0,sequence=0;
 const context={
  window:{uentzoulGroupCallBridge:{
   client:()=>null,user:()=>({id:self,is_anonymous:false}),state:()=>({rooms:[]}),
   person:()=>({display_name:'Participante'}),profile:()=>null,refresh:()=>{}
  }},
  navigator:{mediaDevices:{getUserMedia:async request=>{
   const kind=request.audio?'audio':'video';
   return new Stream([new Track(kind,kind+'-'+(++sequence))]);
  }}},
  document:{visibilityState:'visible'},
  MediaStream:Stream,
  localStorage:{getItem:()=>null,setItem(){}},
  setTimeout(fn,delay){const id=++tick;timers.set(id,{fn,delay});return id;},
  clearTimeout(id){timers.delete(id);},
  setInterval:()=>0,clearInterval(){},console
 };
 const instrumented=source.replace(
  'if(!init()){',
  'window.__testCall={S,captureAudio,captureCamera,toggleCam,toggleMic,replaceVideo,endScreen,publish,synchronize};if(false){'
 );
 assert.notEqual(instrumented,source,'controlador de teste exposto');
 vm.runInNewContext(instrumented,context,{filename:'group-call.js'});
 const methods=context.window.__testCall;
 const S=methods.S;
 S.stage='live';S.generation=1;S.key='self';S.room={id:'mock-group',kind:'group'};
 S.stream=new Stream();S.presence.set('self',{userId:self,name:'Você'});
 return {S,methods,context,timers,Track,Stream};
}
function addPeer(S,key,video=null,audio=null,failVideo=()=>false,failAudio=()=>false){
 const peer={
  key,pc:{signalingState:'stable',connectionState:'new',iceConnectionState:'new',
   close(){this.connectionState='closed';this.signalingState='closed';}},
  videoSender:mockSender(video,failVideo),audioSender:mockSender(audio,failAudio),
  stream:new Stream(),audioStream:new Stream(),recoveryTimer:null,departTimer:null
 };
 S.peers.set(key,peer);
 return peer;
}

test('troca de microfone falha em um participante e restaura os demais sem parar o anterior',async()=>{
 const {S,methods}=rig();
 const old=new Track('audio','old');
 S.audio=old;S.mic=true;S.stream.addTrack(old);
 const first=addPeer(S,'peer1',null,old);
 const second=addPeer(S,'peer2',null,old,()=>false,next=>next?.id!=='old');
 await assert.rejects(methods.captureAudio(),/Substituição de sender rejeitada/);
 assert.equal(S.stage,'live');
 assert.equal(S.audio,old);
 assert.equal(old.readyState,'live','microfone anterior permanece utilizável');
 assert.equal(first.audioSender.track,old,'substituição parcial sofreu rollback');
 assert.equal(second.audioSender.track,old);
 assert.deepEqual(S.stream.getAudioTracks(),[old]);
});
test('troca de câmera falha e preserva o vídeo anterior e o áudio',async()=>{
 const {S,methods}=rig();
 const old=new Track('video','old-video'),voice=new Track('audio','voice');
 S.camera=old;S.cam=true;S.audio=voice;S.stream.addTrack(old);S.stream.addTrack(voice);
 const first=addPeer(S,'peer1',old,voice);
 const second=addPeer(S,'peer2',old,voice,next=>next?.id!=='old-video');
 await assert.rejects(methods.captureCamera(),/Substituição de sender rejeitada/);
 assert.equal(S.stage,'live');
 assert.equal(S.camera,old);
 assert.equal(old.readyState,'live');
 assert.equal(first.videoSender.track,old);
 assert.equal(second.videoSender.track,old);
 assert.equal(S.audio,voice);
 assert.equal(voice.readyState,'live');
});
test('desligar câmera não mata a faixa se algum destino rejeitar replaceTrack(null)',async()=>{
 const {S,methods}=rig();
 const old=new Track('video','working');
 S.camera=old;S.cam=true;S.stream.addTrack(old);
 addPeer(S,'peer1',old,null,track=>track===null);
 await methods.toggleCam();
 assert.equal(S.stage,'live');
 assert.equal(S.cam,true,'estado anterior restaurado');
 assert.equal(S.camera,old);
 assert.equal(old.readyState,'live');
});
test('desligamento de tela com falha não interrompe compartilhamento nem chamada',async()=>{
 const {S,methods}=rig();
 const old=new Track('video','display');
 S.display=old;S.screen=true;S.stream.addTrack(old);
 addPeer(S,'peer1',old,null,next=>next===null);
 await assert.rejects(methods.endScreen(),/Substituição de sender rejeitada/);
 assert.equal(S.stage,'live');
 assert.equal(S.display,old);
 assert.equal(S.screen,true);
 assert.equal(old.readyState,'live');
});
test('cliques rápidos na câmera produzem uma captura por vez',async()=>{
 const {S,methods,context}=rig();
 let capture,requests=0;
 context.navigator.mediaDevices.getUserMedia=()=>{
  requests++;
  return new Promise(resolve=>capture=()=>resolve(new Stream([new Track('video','fresh')])));
 };
 const a=methods.toggleCam(),b=methods.toggleCam();
 assert.equal(requests,1);
 capture();await Promise.all([a,b]);
 assert.equal(S.stage,'live');
 assert.equal(S.cam,true);
 assert.equal(S.camera.readyState,'live');
});
test('publicação de Presence agrupa cliques e não exige nova conexão',async()=>{
 const {S,methods,timers}=rig();
 let updates=0;
 S.channel={track:async()=>{updates++;}};
 await methods.publish();await methods.publish();
 assert.equal(updates,0,'Presence não envia uma atualização a cada clique');
 const changes=[...timers.values()].filter(t=>t.delay>=350&&t.delay<=1100);
 assert.equal(changes.length,1,'resta uma atualização pendente');
 await changes[0].fn();
 assert.equal(updates,1);
 assert.equal(S.stage,'live');
});
test('presença transitória ausente não fecha peer nem corta áudio; retorno cancela saída',()=>{
 const {S,methods,timers}=rig();
 let snapshot={'self':[{userId:self,name:'Você'}]};
 S.channel={presenceState:()=>snapshot};
 S.presence.set('peer1',{userId:member,name:'Outro participante'});
 const p=addPeer(S,'peer1');
 methods.synchronize();
 assert.equal(S.peers.get('peer1'),p);
 assert.equal(p.pc.connectionState,'new','nenhuma conexão fechada na primeira ausência');
 assert.ok([...timers.values()].some(t=>t.delay===6000));
 snapshot['peer1']=[{userId:member,name:'Outro participante'}];
 methods.synchronize();
 assert.equal(p.departTimer,null);
 assert.equal(S.peers.get('peer1'),p);
});
test('retorno do canal de sinalização não fecha nem limpa as conexões WebRTC',()=>{
 const start=source.indexOf('channel.subscribe(async statusValue=>');
 const end=source.indexOf('  });\n }catch(e)',start);
 assert.ok(start>0&&end>start);
 const code=source.slice(start,end);
 assert.doesNotMatch(code,/S\.peers\.clear\(\)|peer\.pc\.close\(\)/);
 assert.match(code,/await channel\.track\(meta\(\)\)/);
 assert.match(code,/if\(returning\)/);
});
