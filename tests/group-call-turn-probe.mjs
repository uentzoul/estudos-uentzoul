// Verifica TURN público usando ICE relay-only, em vez de confundir STUN com retransmissão.
import { chromium } from 'playwright';
import { createHmac } from 'node:crypto';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const expiry=String(Math.floor(Date.now()/1000)+3600)+':uentzoul-probe';
const password=createHmac('sha1','openrelayprojectsecret').update(expiry).digest('base64');
const result=await page.evaluate(async({expiry,password})=>{
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
},{expiry,password});
console.log(JSON.stringify(result));
await browser.close();
if(!result.connected||!result.relayCandidatesA||!result.relayCandidatesB)process.exitCode=1;
