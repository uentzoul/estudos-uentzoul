// Verifica TURN público usando ICE relay-only, em vez de confundir STUN com retransmissão.
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const result=await page.evaluate(async()=>{
 const expiry=String(Math.floor(Date.now()/1000)+3600)+':uentzoul-probe';
 const secret='openrelayprojectsecret'; // Chave divulgada pela documentação oficial do Open Relay para static-auth.
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(expiry));
 const password=btoa(String.fromCharCode(...new Uint8Array(digest)));
 const iceServers=[{urls:[
   'turn:staticauth.openrelay.metered.ca:80?transport=udp',
   'turn:staticauth.openrelay.metered.ca:80?transport=tcp',
   'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
   'turns:staticauth.openrelay.metered.ca:443?transport=tcp'
 ],username:expiry,credential:password}];
 const first=new RTCPeerConnection({iceServers,iceTransportPolicy:'relay'});
 const second=new RTCPeerConnection({iceServers,iceTransportPolicy:'relay'});
 const cand1=[],cand2=[],errors=[];
 const relaySeen=new Set();
 for(const [pc,other,out] of [[first,second,cand1],[second,first,cand2]]){
  pc.onicecandidate=({candidate})=>{
   if(!candidate)return;
   out.push(candidate.candidate);
   if(candidate.candidate.includes(' typ relay '))relaySeen.add(candidate.protocol);
   other.addIceCandidate(candidate).catch(e=>errors.push(e.message));
  };
  pc.onicecandidateerror=e=>errors.push(String(e.errorCode||'')+':'+String(e.errorText||''));
 }
 const channel=first.createDataChannel('probe');
 const opened=new Promise(resolve=>{channel.onopen=()=>{channel.send('relay');resolve(true);};});
 const reply=new Promise(resolve=>{second.ondatachannel=e=>{e.channel.onmessage=()=>resolve(true);};});
 try{
  const offer=await first.createOffer();await first.setLocalDescription(offer);await second.setRemoteDescription(offer);
  const answer=await second.createAnswer();await second.setLocalDescription(answer);await first.setRemoteDescription(answer);
  const connected=await Promise.race([Promise.all([opened,reply]).then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),17000))]);
  const summary={connected,relayCandidatesA:cand1.filter(x=>x.includes(' typ relay ')).length,
   relayCandidatesB:cand2.filter(x=>x.includes(' typ relay ')).length,
   selectedProtocol:[...relaySeen],iceA:first.iceConnectionState,iceB:second.iceConnectionState,errors:errors.slice(0,7)};
  return summary;
 }finally{first.close();second.close();}
});
console.log(JSON.stringify(result));
await browser.close();
if(!result.connected||!result.relayCandidatesA||!result.relayCandidatesB)process.exitCode=1;
