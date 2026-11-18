// Regressões do handshake WebRTC: uma oferta enviada cedo não deve deixar a call sem vídeo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source=fs.readFileSync(path.resolve(import.meta.dirname,'../group-call.js'),'utf8');
const self='11111111-1111-1111-1111-111111111111';
const other='99999999-9999-9999-9999-999999999999';

class Track {
 constructor(kind){this.kind=kind;this.id=kind+'-test';this.readyState='live';this.muted=false;this.enabled=true;this.handlers=new Map();}
 addEventListener(name,fn){this.handlers.set(name,fn);}
 stop(){this.readyState='ended';}
}
class Stream {
 constructor(tracks=[]){this.tracks=[...tracks];}
 getTracks(){return [...this.tracks];}
 getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}
 getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}
 addTrack(t){this.tracks.push(t);}
 removeTrack(t){this.tracks=this.tracks.filter(x=>x!==t);}
}
class PeerConnection {
 constructor(){this.signalingState='stable';this.connectionState='new';this.iceConnectionState='new';this.offerCount=0;this.rollbackCount=0;this.lastOfferOptions=null;}
 addTransceiver(){return {sender:{track:null,async replaceTrack(t){this.track=t;},getParameters(){return {encodings:[]};}}};}
 async createOffer(options={}){this.lastOfferOptions=options;return {type:'offer',sdp:'offer-'+(++this.offerCount)};}
 async setLocalDescription(desc){
  if(desc.type==='rollback'){this.rollbackCount++;this.signalingState='stable';this.localDescription=null;}
  else{this.localDescription=desc;this.signalingState='have-local-offer';}
 }
 async setRemoteDescription(desc){this.remoteDescription=desc;this.signalingState='stable';}
 async createAnswer(){return {type:'answer',sdp:'answer'};}
 async addIceCandidate(){}
 close(){this.connectionState='closed';this.signalingState='closed';}
}
function rig(selfKey,remoteKey){
 const sent=[];
 const channel={
  send:async event=>{sent.push(event.payload);return 'ok';},
  presenceState:()=>({
   [selfKey]:[{userId:self,name:'Você'}],
   [remoteKey]:[{userId:other,name:'Amigo'}]
  }),
  track:async()=> 'ok'
 };
 const context={
  window:{uentzoulGroupCallBridge:{
   client:()=>null,user:()=>({id:self,is_anonymous:false}),state:()=>({rooms:[]}),
   person:()=>({display_name:'Participante'}),profile:()=>null,refresh:()=>{}
  }},
  document:{visibilityState:'visible'},
  navigator:{mediaDevices:{
   getUserMedia:async()=>new Stream([new Track('video')]),
   getDisplayMedia:async()=>new Stream([new Track('video')])
  }},
  MediaStream:Stream,RTCPeerConnection:PeerConnection,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  localStorage:{getItem:()=>null,setItem(){}},console
 };
 const injected=source.replace('if(!init()){',
  'window.__callTest={S,ensurePeer,receiveSignal,checkPeerConnections,recoverHandshake,offer,captureCamera,toggleScreen,synchronize};if(false){');
 assert.notEqual(injected,source,'controlador de teste disponível');
 vm.runInNewContext(injected,context,{filename:'group-call.js'});
 const methods=context.window.__callTest,S=methods.S;
 S.stage='live';S.generation=1;S.key=selfKey;S.room={id:'grupo-teste',kind:'group'};
 S.channel=channel;S.stream=new Stream();
 S.presence.set(selfKey,{userId:self,name:'Você'});
 S.presence.set(remoteKey,{userId:other,name:'Amigo'});
 return {methods,S,context,sent,remoteKey};
}
test('uma oferta perdida é refeita quando o navegador remoto fica pronto',async()=>{
 const {methods,S,sent,remoteKey}=rig('a-user','z-user');
 const peer=methods.ensurePeer(remoteKey);
 await methods.offer(peer); // primeira oferta, enviada enquanto o outro não ouvia
 assert.equal(sent.filter(x=>x.description?.type==='offer').length,1);
 assert.equal(peer.pc.signalingState,'have-local-offer');
 peer.lastOfferAt=Date.now()-7000;
 await methods.receiveSignal({from:remoteKey,to:S.key,ready:true});
 assert.equal(peer.pc.rollbackCount,1,'a oferta anterior é cancelada');
 assert.equal(peer.pc.lastOfferOptions.iceRestart,true,'candidatos ICE também são renovados');
 assert.equal(sent.filter(x=>x.description?.type==='offer').length,2,'nova oferta é enviada');
 assert.equal(S.stage,'live','a recuperação não derruba a chamada');
});
test('quem entra com chave maior avisa o outro navegador que está pronto',()=>{
 const {methods,sent,remoteKey}=rig('z-user','a-user');
 methods.synchronize();
 assert.ok(sent.some(x=>x.to===remoteKey&&x.ready===true),'envia confirmação de prontidão');
});
test('monitor reenvia aviso de prontidão quando mídia não conecta',()=>{
 const {methods,S,sent,remoteKey}=rig('z-user','a-user');
 const peer=methods.ensurePeer(remoteKey);
 methods.checkPeerConnections();
 assert.ok(sent.some(x=>x.to===remoteKey&&x.ready===true));
 peer.lastReadyAt=Date.now()-5000;
 methods.checkPeerConnections();
 assert.ok(sent.filter(x=>x.ready===true).length>=2,'aviso reenviado');
 assert.equal(S.stage,'live');
});
test('câmera e compartilhamento usam o sender da conexão remota',async()=>{
 const {methods,S,remoteKey}=rig('a-user','z-user');
 const peer=methods.ensurePeer(remoteKey);
 S.cam=true;
 await methods.captureCamera();
 const original=peer.videoSender.track;
 assert.equal(original?.kind,'video');
 assert.equal(S.stream.getVideoTracks().length,1);
 await methods.toggleScreen();
 assert.equal(S.screen,true);
 assert.equal(peer.videoSender.track,S.display,'apresentação substitui câmera no sender');
 assert.notEqual(peer.videoSender.track,original);
});
