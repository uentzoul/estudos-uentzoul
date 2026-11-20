/* PsicoMoodle — Conferência de slides e textos (prévia administrativa).
   Arquivos são convertidos para texto no navegador; apenas o texto extraído
   é enviado sob demanda à função privada de revisão. */
(()=>{
'use strict';
const MAX_FILE_BYTES=12*1024*1024;
const MAX_TEXT=32000;
const FORMATS='.pdf,.pptx,.docx,.txt,.md';
const sessions=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const access=()=>window.PSICO_WORKS?.hasAccess?.()===true;
let zipPromise=null,pdfPromise=null;
function state(work){
 if(!work?.id)return null;
 if(!sessions.has(work.id))sessions.set(work.id,{
  slides:{text:'',name:'',status:'',warning:'',loading:false},
  written:{text:'',name:'',status:'',warning:'',loading:false},
  working:false,error:'',result:null,loadedFromSaved:false
 });
 return sessions.get(work.id);
}
function openScript(src,ready){
 if(ready())return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=src;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>ready()?resolve():reject(Error('A biblioteca de leitura não carregou.'));
  script.onerror=()=>reject(Error('Não foi possível carregar o leitor do arquivo. Verifique a conexão.'));
  document.head.appendChild(script);
 });
}
function jszip(){
 if(window.JSZip)return Promise.resolve(window.JSZip);
 if(!zipPromise)zipPromise=openScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',()=>!!window.JSZip).then(()=>window.JSZip).catch(e=>{zipPromise=null;throw e;});
 return zipPromise;
}
function pdfjs(){
 if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
 if(!pdfPromise)pdfPromise=openScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',()=>!!window.pdfjsLib).then(()=>{
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return window.pdfjsLib;
 }).catch(e=>{pdfPromise=null;throw e;});
 return pdfPromise;
}
function safeText(text){
 text=String(text||'').replace(/\u0000/g,'').trim();
 return {text:text.slice(0,MAX_TEXT),truncated:text.length>MAX_TEXT};
}
function xmlParagraphs(xml){
 const parsed=new DOMParser().parseFromString(xml,'application/xml');
 if(parsed.getElementsByTagName('parsererror').length)throw Error('O documento contém XML que não pôde ser lido.');
 const paras=Array.from(parsed.getElementsByTagNameNS('*','p'));
 return paras.map(p=>Array.from(p.getElementsByTagNameNS('*','t')).map(t=>t.textContent||'').join('')).filter(s=>s.trim()).join('\n');
}
async function extractOffice(file,extension){
 const JSZip=await jszip();
 const zip=await JSZip.loadAsync(await file.arrayBuffer());
 if(extension==='docx'){
  const entry=zip.file('word/document.xml');
  if(!entry)throw Error('O Word não contém um texto reconhecível.');
  return xmlParagraphs(await entry.async('string'));
 }
 const keys=Object.keys(zip.files).filter(key=>/^ppt\/slides\/slide\d+\.xml$/i.test(key));
 keys.sort((a,b)=>Number(a.match(/slide(\d+)\.xml/i)?.[1])-Number(b.match(/slide(\d+)\.xml/i)?.[1]));
 if(!keys.length)throw Error('Não foram encontrados slides com texto.');
 let out='';
 for(const key of keys.slice(0,120)){
  const num=Number(key.match(/slide(\d+)\.xml/i)?.[1])||'?';
  const content=xmlParagraphs(await zip.file(key).async('string'));
  out+='\n[SLIDE '+num+']\n'+(content||'(sem texto extraível)')+'\n';
  if(out.length>MAX_TEXT+1000)break;
 }
 return out;
}
async function extractPdf(file){
 const pdf=await pdfjs();
 const task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer())});
 let doc;
 try{
  doc=await task.promise;
  let out='';
  for(let i=1;i<=Math.min(doc.numPages,100);i++){
   const page=await doc.getPage(i);
   const content=await page.getTextContent();
   let line='',lastY=null,lines=[];
   for(const item of content.items){
    const word=String(item.str||'').trim();
    if(!word)continue;
    const y=Number(item.transform?.[5]);
    if(lastY!==null&&Number.isFinite(y)&&Math.abs(y-lastY)>3){
     if(line.trim())lines.push(line.trim());
     line='';
    }
    line+=(line?' ':'')+word;
    if(Number.isFinite(y))lastY=y;
   }
   if(line.trim())lines.push(line.trim());
   out+='\n[PÁGINA '+i+']\n'+lines.join('\n')+'\n';
   page.cleanup?.();
   if(out.length>MAX_TEXT+1000)break;
  }
  if(out.replace(/\[PÁGINA \d+\]/g,'').trim().length<35)throw Error('Este PDF não tem texto selecionável suficiente. Se for digitalizado, converta por OCR ou cole o texto manualmente.');
  return {text:out,truncated:doc.numPages>100};
 }finally{try{await doc?.destroy?.()}catch(_){}}
}
async function extract(file){
 if(!file||file.size===0)throw Error('Escolha um arquivo com conteúdo.');
 if(file.size>MAX_FILE_BYTES)throw Error('O tamanho máximo por arquivo é 12 MB.');
 const extension=(file.name.split('.').pop()||'').toLowerCase();
 if(!['pdf','pptx','docx','txt','md'].includes(extension))throw Error('Use PDF, PPTX, DOCX, TXT ou MD.');
 if(extension==='pdf')return extractPdf(file);
 const text=['txt','md'].includes(extension)?await file.text():await extractOffice(file,extension);
 return {text,truncated:false};
}
function updateLabel(kind,s){
 const label=document.querySelector('#pmWorks [data-pw-review-status="'+kind+'"]');
 const entry=s[kind];if(!label)return;
 label.textContent=entry.status||'';
 label.classList.toggle('pw-review-error',!!entry.warning&&entry.warning.startsWith('Erro:'));
 const info=document.querySelector('#pmWorks [data-pw-review-warning="'+kind+'"]');
 if(info)info.textContent=entry.warning||'';
}
async function selectFile(e,kind){
 const input=e.target,file=input.files?.[0];
 if(!file)return;
 const work=window.PSICO_WORKS?.getSelected?.(),s=state(work);if(!s)return;
 const current=s[kind];
 current.loading=true;current.status='Lendo '+file.name+'…';current.warning='';s.error='';updateLabel(kind,s);
 try{
  const result=await extract(file);
  const trimmed=safeText(result.text);
  if(trimmed.text.replace(/\[[^\]]+\]/g,'').trim().length<40)throw Error('O arquivo não possui texto extraível suficiente. Você pode colar o conteúdo diretamente.');
  current.text=trimmed.text;current.name=file.name;
  current.status='Texto extraído de '+file.name+' · '+current.text.length.toLocaleString('pt-BR')+' caracteres';
  current.warning=trimmed.truncated||result.truncated?'Documento longo: só a primeira parte do texto será conferida.':'';
  const area=document.querySelector('#pmWorks [data-pw-review-text="'+kind+'"]');
  if(area){area.value=current.text;area.dispatchEvent(new Event('input',{bubbles:true}));}
 }catch(err){
  current.status='Não foi possível ler '+file.name+(current.text?' · o conteúdo anterior foi mantido':'');
  current.warning='Erro: '+(err?.message||'Falha na leitura do documento.');
 }finally{
  current.loading=false;input.value='';updateLabel(kind,s);
 }
}
function renderField(kind,label,explain,placeholder,s){
 const value=s[kind];
 return '<section class="pw-review-card"><div class="pw-review-card-heading"><h3>'+label+'</h3><p>'+explain+'</p></div>'+
 '<label class="pw-review-drop"><span>Selecionar arquivo</span><input type="file" data-pw-review-file="'+kind+'" accept="'+FORMATS+'"></label>'+
 '<p class="pw-review-status" data-pw-review-status="'+kind+'">'+esc(value.status)+'</p>'+
 '<p class="pw-review-warning" data-pw-review-warning="'+kind+'">'+esc(value.warning)+'</p>'+
 '<label class="pw-field"><span>Ou cole / revise o texto extraído</span><textarea data-pw-review-text="'+kind+'" rows="10" maxlength="'+MAX_TEXT+'" placeholder="'+esc(placeholder)+'">'+esc(value.text)+'</textarea></label></section>';
}
function report(r,previous=false){
 if(!r)return '';
 const locations={slides:'Apresentação',texto:'Parte escrita',ambos:'Comparação',enunciado:'Enunciado'};
 const priorities={alta:'Prioridade alta',media:'Prioridade média',baixa:'Ajuste opcional'};
 const scope={somente_slides:'Apresentação',somente_texto:'Parte escrita',comparacao:'Comparação dos dois materiais'};
 const findings=Array.isArray(r.findings)?r.findings:[];
 return '<section class="pw-review-report"><div class="pw-review-report-head"><div><p class="pw-label">'+(previous?'Análise anterior':'Relatório de conferência')+'</p><h2>O que a revisão encontrou</h2><p>'+esc(scope[r.scope]||'Conferência acadêmica')+'</p></div><button type="button" class="pw-btn" data-pw-review-download>Salvar parecer (.txt)</button></div>'+
 '<p class="pw-review-summary">'+esc(r.summary||'')+'</p>'+
 (r.strengths?.length?'<div class="pw-review-positives"><h3>O que está funcionando</h3>'+r.strengths.map(t=>'<p>✓ '+esc(t)+'</p>').join('')+'</div>':'')+
 '<div class="pw-review-feedback"><div class="pw-review-subhead"><h3>Pontos de atenção</h3><span>'+findings.length+' recomendações</span></div>'+
 (findings.length?findings.map((item,i)=>{
  const p=['alta','media','baixa'].includes(item.priority)?item.priority:'media';
  return '<article class="pw-review-finding"><div class="pw-review-finding-top"><span class="pw-priority pw-priority-'+p+'">'+esc(priorities[p])+'</span><span>'+esc(locations[item.location]||'Material analisado')+'</span></div>'+
   '<h4>'+(i+1)+'. '+esc(item.title)+'</h4>'+
   (item.evidence?'<p><strong>Onde aparece:</strong> '+esc(item.evidence)+'</p>':'')+
   '<p><strong>Por que vale ajustar:</strong> '+esc(item.why)+'</p>'+
   '<p><strong>Sugestão:</strong> '+esc(item.suggestion)+'</p></article>';
 }).join(''):'<p class="pw-muted">Não surgiram problemas suficientemente sustentados para recomendações específicas neste material.</p>')+'</div>'+
 (r.next_steps?.length?'<div class="pw-review-next"><h3>Próximos ajustes sugeridos</h3><ol>'+r.next_steps.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></div>':'')+
 (r.limitations?.length?'<div class="pw-review-limit"><h3>O que esta análise não verificou</h3>'+r.limitations.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>':'')+
 '</section>';
}
function render(work){
 if(!access()||!work)return '<section class="pw-empty"><p>Conferência indisponível.</p></section>';
 const s=state(work);const hasAny=!!(s.slides.text.trim()||s.written.text.trim());
 const latest=s.result||work.review||null,old=!s.result&&!!work.review;
 return '<section class="pw-review-page"><div class="pw-workbar"><div><button type="button" class="pw-back" data-pw-nav="route">‹ Voltar à minha rota</button><h2>Conferir o trabalho</h2><p>'+esc(work.title)+'</p></div></div>'+
 '<div class="pw-review-intro"><h2>Revisão de conteúdo e organização</h2><p>Coloque os slides, o texto escrito ou os dois para receber sugestões específicas de coerência, estrutura, fundamentação e correspondência entre formatos. O enunciado já registrado será usado como prioridade na análise.</p>'+
 '<div class="pw-review-mode"><span>✓ Apenas slides</span><span>✓ Apenas parte escrita</span><span>✓ Comparar os dois</span></div></div>'+
 '<div class="pw-review-docs">'+
 renderField('slides','Apresentação de slides','PPTX, PDF, TXT ou MD. O conteúdo será identificado por slide ou página quando possível.','Cole o texto da apresentação, identificando os slides se possível…',s)+
 renderField('written','Parte escrita','DOCX, PDF, TXT ou MD. Se for uma resenha, artigo ou relatório, inclua o texto completo ou o trecho a conferir.','Cole a parte escrita do trabalho…',s)+
 '</div><div class="pw-review-controls"><div><p><strong>Privacidade e limites</strong></p><p>Os arquivos são lidos neste navegador. Ao clicar em “Analisar”, apenas o texto extraído é enviado à IA para revisão. Arquivos, imagens e textos integrais não são salvos pelo módulo; o último parecer fica salvo neste navegador. A análise usa a cota de IA Tzoul.</p><p>A revisão examina conteúdo textual: não avalia diretamente a aparência visual dos slides, diagramas e imagens.</p></div><button type="button" class="pw-btn pw-primary" data-pw-review-run '+(!hasAny||s.working?'disabled':'')+'>'+(s.working?'Analisando documentos…':'Analisar meu trabalho')+'</button></div>'+
 (s.error?'<p class="pw-review-alert" role="alert">'+esc(s.error)+'</p>':'')+
 (s.working?'<p class="pw-review-processing" role="status">Comparando as ideias e verificando organização, evidências e lacunas. Os arquivos selecionados não foram armazenados no site.</p>':'')+
 (latest?report(latest,old):'<div class="pw-review-placeholder"><h3>Seu parecer aparecerá aqui</h3><p>O resultado não é uma nota: cada observação deve explicar o problema, mostrar de onde surgiu e sugerir como melhorar.</p></div>')+
 '</section>';
}
async function run(){
 const work=window.PSICO_WORKS?.getSelected?.(),s=state(work);
 if(!access()||!work||!s||s.working)return;
 if(s.slides.loading||s.written.loading){s.error='A leitura dos arquivos ainda não terminou.';refresh();return;}
 const slides=s.slides.text.trim(),written=s.written.text.trim();
 if(!slides&&!written){s.error='Adicione pelo menos um dos materiais para a conferência.';refresh();return;}
 if(slides.length<80&&written.length<80){s.error='O texto é curto demais para uma conferência fundamentada. Inclua mais conteúdo.';refresh();return;}
 const client=window.uentzoulAIAuth?.client?.();
 if(!client?.functions?.invoke){s.error='A conexão de análise não está disponível. Entre novamente em sua conta.';refresh();return;}
 s.working=true;s.error='';refresh();
 try{
  const body={
   title:work.title,type:work.type,
   subject:work.subject,prompt:work.prompt||'',
   slides,written,
   slidesTruncated:/Documento longo/.test(s.slides.warning),
   writtenTruncated:/Documento longo/.test(s.written.warning)
  };
  const {data,error}=await client.functions.invoke('trabalhos-revisao',{body});
  if(error){
   let message=error.message||'Falha de comunicação com o servidor.';
   if(error.context instanceof Response){
    const detail=await error.context.clone().json().catch(()=>null);
    if(detail?.error)message=detail.error;
   }
   throw Error(message);
  }
  if(!data?.review||!Array.isArray(data.review.findings))throw Error('O servidor retornou uma análise incompleta.');
  s.result=data.review;
  const saved=window.PSICO_WORKS?.saveReview?.({review:data.review,reviewedAt:new Date().toISOString()});
  if(saved===false)s.error='Análise concluída, mas não foi possível guardar o parecer neste navegador.';
 }catch(err){s.error=err?.message||'A conferência não pôde ser realizada.';}
 finally{s.working=false;refresh();}
}
function refresh(){
 if(!access())return;
 window.PSICO_WORKS.forceRender=true;
 try{window.uentzoulAdminBridge?.refreshCurrent?.();}
 finally{window.PSICO_WORKS.forceRender=false;}
}
function download(){
 const work=window.PSICO_WORKS?.getSelected?.(),s=state(work);
 const r=s?.result||work?.review;if(!work||!r)return;
 const lines=['CONFERÊNCIA FORMATIVA — '+work.title,r.summary,'','PONTOS POSITIVOS',...(r.strengths||[]).map(t=>'• '+t),'','RECOMENDAÇÕES'];
 (r.findings||[]).forEach((f,i)=>lines.push((i+1)+'. ['+f.priority+'] '+f.title,'Local: '+f.location,'Evidência: '+f.evidence,'Justificativa: '+f.why,'Sugestão: '+f.suggestion,''));
 lines.push('PRÓXIMOS PASSOS',...(r.next_steps||[]).map((t,i)=>(i+1)+'. '+t),'','LIMITAÇÕES',...(r.limitations||[]).map(t=>'• '+t));
 const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='conferencia-trabalho-'+work.id.slice(0,8)+'.txt';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('change',e=>{
 if(!access()||!e.target.closest('#pmWorks'))return;
 const input=e.target.closest('[data-pw-review-file]');
 if(input){selectFile(e,input.dataset.pwReviewFile);return;}
});
document.addEventListener('input',e=>{
 if(!access()||!e.target.closest('#pmWorks'))return;
 const area=e.target.closest('[data-pw-review-text]');
 if(!area)return;
 const work=window.PSICO_WORKS?.getSelected?.(),s=state(work);
 if(!s)return;
 const kind=area.dataset.pwReviewText;
 s[kind].text=area.value;
 s[kind].status=area.value.trim()?(s[kind].name?'Arquivo: '+s[kind].name+' · ':'Texto pronto para conferir · ')+area.value.length.toLocaleString('pt-BR')+' caracteres':'';
 if(s[kind].name&&!area.value.trim())s[kind].name='';
 updateLabel(kind,s);
 const button=document.querySelector('#pmWorks [data-pw-review-run]');
 if(button)button.disabled=s.working||!(s.slides.text.trim()||s.written.text.trim());
});
document.addEventListener('click',e=>{
 if(!access()||!e.target.closest('#pmWorks'))return;
 if(e.target.closest('[data-pw-review-run]')){run();return;}
 if(e.target.closest('[data-pw-review-download]')){download();return;}
});
window.PSICO_WORK_REVIEW={render};
})();