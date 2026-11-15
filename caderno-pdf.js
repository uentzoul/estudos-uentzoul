/* Estudos Uentzoul — exportação local do caderno em PDF/A4.
   Sem serviços externos: o PDF é criado no próprio navegador. */
(function(){
 'use strict';
 const WIDTH=780,HEIGHT=1240,LINEROW=34,LINETOP=28;
 const palette={black:'#24242e',blue:'#2559a4',red:'#bb3d43'};
 const enc=new TextEncoder();
 function colorOf(key){return palette[key]||palette.blue}
 function pfont(ctx,size,cursive){
  ctx.font=(cursive?'600 ':'500 ')+Math.round(size)+'px '+
   (cursive?'"Caveat","Segoe Print",cursive':'"Patrick Hand","Segoe Print",cursive');
 }
 function rounded(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 }
 function drawWrapped(ctx,text,x,y,maxWidth,step,maxLines){
  let line='',lines=0;
  const paint=t=>{if(lines<maxLines)ctx.fillText(t,x,y+lines*step);lines++};
  for(const paragraph of String(text||'').split(/\n/)){
   const words=paragraph.split(/\s+/);
   line='';
   for(const word of words){
    const proposal=line?line+' '+word:word;
    if(line&&ctx.measureText(proposal).width>maxWidth){paint(line);line=word;}
    else line=proposal;
   }
   paint(line);
  }
 }
 function drawPaper(ctx,pg,index,total){
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#f9f3e8';ctx.fillRect(0,0,9,HEIGHT);
  for(let y=LINETOP;y<HEIGHT-35;y+=LINEROW){
   ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(WIDTH,y+.5);
   ctx.strokeStyle='#bad3e3';ctx.lineWidth=.7;ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(85,0);ctx.lineTo(85,HEIGHT);
  ctx.strokeStyle='#dfa3a8';ctx.lineWidth=1.4;ctx.stroke();
  for(let y=73;y<HEIGHT-55;y+=148){
   ctx.beginPath();ctx.arc(28,y,6.4,0,Math.PI*2);ctx.fillStyle='#cccac4';ctx.fill();
   ctx.beginPath();ctx.arc(28,y,4.2,0,Math.PI*2);ctx.fillStyle='#f7f6f0';ctx.fill();
  }
  ctx.textBaseline='alphabetic';ctx.textAlign='left';
  ctx.fillStyle='#6a607c';ctx.font='600 13px Arial,sans-serif';
  ctx.fillText('Data',510,57);
  if(pg.date){
   const m=String(pg.date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
   ctx.font='600 16px Arial,sans-serif';
   ctx.fillText(m?m[3]+'/'+m[2]+'/'+m[1]:String(pg.date),557,57);
  }
  // A gramática é reproduzida tal como está na folha no momento da exportação.
  for(const note of pg.notes||[]){
   const scale=Math.min(3,Math.max(1,Number(note.size)||1));
   const small=scale*26;
   const left=Math.min(720,Math.max(85,Number(note.x)||110));
   const top=LINETOP+(Number(note.line)||0)*LINEROW+(Number(note.offsetY)||0);
   const scaleX=Math.min(3.8,Math.max(.35,Number(note.scaleX)||1));
   const scaleY=Math.min(3.8,Math.max(.35,Number(note.scaleY)||1));
   const width=Math.max(70,Number(note.frameW)||620);
   ctx.save();ctx.translate(left,top+27);ctx.scale(scaleX,scaleY);
   let x=0,y=0;
   const cursive=note.font==='cursive';
   ctx.fillStyle=colorOf(note.ink);
   const chars=Array.from(String(note.text||''));
   for(const ch of chars){
    if(ch==='\n'){x=0;y+=small*1.13;continue;}
    const upper=ch.toUpperCase()===ch&&ch.toLowerCase()!==ch;
    pfont(ctx,small+(upper?34:0),cursive);
    const size=ctx.measureText(ch).width;
    if(x+size>width){x=0;y+=small*1.13;}
    if(top+y>HEIGHT-35)break;
    ctx.fillText(ch,x,y);
    x+=size;
   }
   ctx.restore();
  }
  for(const stroke of pg.strokes||[]){
   const points=stroke.points||[];if(!points.length)continue;
   ctx.beginPath();ctx.strokeStyle=colorOf(stroke.ink);
   ctx.lineWidth=Math.min(10,Math.max(1,Number(stroke.width)||2.6));
   ctx.lineJoin='round';ctx.lineCap='round';
   ctx.moveTo(points[0].x,points[0].y);
   if(stroke.corrected&&points.length>2){
    for(let i=1;i<points.length-1;i++){
     const mid={x:(points[i].x+points[i+1].x)/2,y:(points[i].y+points[i+1].y)/2};
     ctx.quadraticCurveTo(points[i].x,points[i].y,mid.x,mid.y);
    }
   }
   for(let i=stroke.corrected&&points.length>2?points.length-1:1;i<points.length;i++)
    ctx.lineTo(points[i].x,points[i].y);
   ctx.stroke();
  }
  for(const sticky of pg.stickies||[]){
   const x=Number(sticky.x)||110,y=Number(sticky.y)||200,
    w=Math.min(460,Math.max(65,Number(sticky.w)||170)),
    h=Math.min(460,Math.max(65,Number(sticky.h)||146));
   ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(-1.4*Math.PI/180);
   ctx.shadowColor='#3d2f4340';ctx.shadowBlur=11;ctx.shadowOffsetX=5;ctx.shadowOffsetY=6;
   ctx.fillStyle={pink:'#ffc1d5',violet:'#dfcafa',yellow:'#faeb93'}[sticky.tone]||'#faeb93';
   rounded(ctx,-w/2,-h/2,w,h,6);ctx.fill();
   ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
   ctx.fillStyle='#4d4254';pfont(ctx,19,false);
   drawWrapped(ctx,String(sticky.text||'').slice(0,650),-w/2+12,-h/2+28,w-24,21,Math.floor((h-20)/21));
   ctx.restore();
  }
  ctx.font='600 15px "Patrick Hand",cursive';
  ctx.fillStyle='#9b92a0';ctx.textAlign='right';
  ctx.fillText(String(index+1).padStart(2,'0')+' / '+total,WIDTH-35,HEIGHT-24);
 }
 function jpegBytes(canvas){
  const uri=canvas.toDataURL('image/jpeg',.88),base64=uri.split(',')[1];
  if(!base64)throw Error('O navegador não gerou a imagem da folha.');
  const binary=atob(base64),arr=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);
  return arr;
 }
 function assemblePdf(images){
  // PDF 1.4, páginas A4; JPEGs embutidos individualmente.
  const count=images.length,parts=[],offsets=[0];
  let length=0;
  const write=x=>{
   const bytes=typeof x==='string'?enc.encode(x):x;
   parts.push(bytes);length+=bytes.length;
  };
  const obj=(id,contents)=>{
   offsets[id]=length;write(id+' 0 obj\n');
   if(Array.isArray(contents)){for(const part of contents)write(part);}
   else write(contents);
   write('\nendobj\n');
  };
  write(new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]));
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  const kids=images.map((_,i)=>(3+i*3)+' 0 R').join(' ');
  obj(2,'<< /Type /Pages /Kids ['+kids+'] /Count '+count+' >>');
  for(let i=0;i<count;i++){
   const page=3+i*3,image=page+1,stream=page+2,data=images[i];
   obj(page,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] '+
    '/Resources << /XObject << /Im0 '+image+' 0 R >> >> /Contents '+stream+' 0 R >>');
   obj(image,['<< /Type /XObject /Subtype /Image /Width '+WIDTH+' /Height '+HEIGHT+
    ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+data.length+
    ' >>\nstream\n',data,'\nendstream']);
   const commands='q\n529.5 0 0 841.89 32.89 0 cm\n/Im0 Do\nQ\n';
   obj(stream,'<< /Length '+enc.encode(commands).length+' >>\nstream\n'+commands+'endstream');
  }
  const xref=length;write('xref\n0 '+(3+count*3)+'\n0000000000 65535 f \n');
  for(let i=1;i<3+count*3;i++)
   write(String(offsets[i]||0).padStart(10,'0')+' 00000 n \n');
  write('trailer\n<< /Size '+(3+count*3)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
 }
 async function exportBook(book,notify){
  const pages=Array.isArray(book?.pages)?book.pages.filter(pg=>
   (pg.notes||[]).some(n=>String(n.text||'').trim())||
   (pg.strokes||[]).some(st=>(st.points||[]).length)||
   (pg.stickies||[]).length):[];
  if(!pages.length){notify?.('Escreva ou desenhe em uma folha antes de exportar o PDF.','error');return}
  notify?.('Gerando PDF das '+pages.length+' folhas…','');
  try{
   if(document.fonts?.ready)await document.fonts.ready;
   const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Não foi possível preparar as páginas.');
   const images=[];
   for(let i=0;i<pages.length;i++){
    drawPaper(ctx,pages[i],i,pages.length);images.push(jpegBytes(canvas));
    if(i%5===4)await new Promise(resolve=>requestAnimationFrame(resolve));
   }
   const pdf=assemblePdf(images),url=URL.createObjectURL(pdf),a=document.createElement('a');
   a.href=url;
   const cleanName=String(book.name||'Caderno').replace(/[^\p{L}\p{N}_ -]/gu,'').trim().slice(0,65)||'Caderno';
   a.download=cleanName+' - Estudos Uentzoul.pdf';
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   notify?.('PDF criado com '+pages.length+' '+(pages.length===1?'folha.':'folhas.'),'success');
  }catch(e){
   console.error('Exportação de caderno em PDF',e);
   notify?.('Não foi possível gerar o PDF neste navegador.','error');
  }
 }
 window.uentzoulCadernoPDF={exportBook};
})();