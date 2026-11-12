(function(){
'use strict';
const file=decodeURIComponent(location.pathname.split('/').pop()||'');
const sheets=[...document.querySelectorAll('.sheet')];
if(!sheets.length)return;
const h=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const decode=s=>{const box=document.createElement('textarea');box.innerHTML=s;return box.value};
const tidy=s=>String(s||'').replace(/\s+/g,' ').trim()
 .replace(/cogniYv/g,'cognitiv').replace(/CogniSvismo/g,'Cognitivismo')
 .replace(/comportamentais[ ]{2,}/gi,'comportamentais ')
 .replace(/Introdução¿aos/g,'Introdução aos');
const examRe=/\b(prova|avaliação|ps|g2|feriado|semana acadêmica)\b/i;
const raw=sheets.map(sh=>decode(sh.querySelector('pre')?.innerHTML||''));
function sourceBlock(text){
 const details=document.createElement('details');details.className='doc-source-details';
 const sum=document.createElement('summary');sum.textContent='Conferir transcrição da página original';details.appendChild(sum);
 const pre=document.createElement('pre');pre.textContent=text;details.appendChild(pre);return details;
}
function documentFlow(text){
 const root=document.createElement('div');root.className='doc-flow';
 let paragraph=[],list=[],meta=[],nodes=[];
 function flushP(){if(paragraph.length){const p=document.createElement('p');p.textContent=tidy(paragraph.join(' '));nodes.push(p);paragraph=[]}}
 function flushList(){if(list.length){const ul=document.createElement('ul');list.forEach(t=>{const li=document.createElement('li');li.textContent=tidy(t);ul.appendChild(li)});nodes.push(ul);list=[]}}
 function flushMeta(){if(meta.length){const div=document.createElement('div');div.className='doc-meta';meta.forEach(t=>{const span=document.createElement('span');span.textContent=tidy(t);div.appendChild(span)});nodes.push(div);meta=[]}}
 const lines=String(text||'').split(/\r?\n/);
 for(let line of lines){
  const t=line.trim();
  if(!t){flushP();flushList();flushMeta();continue}
  if(/^Av\. Ipiranga|^Fone:\s*\(51\)|^www\.pucrs\.br/i.test(t))continue;
  if(/^\d+\s*$/.test(t))continue;
  const upper=t.toUpperCase()===t&&/[A-ZÁÂÃÉÊÍÓÔÕÚÇ]/.test(t);
  const heading=upper&&t.length>=5&&t.length<105&&!/\b(\d{4}|https?:|@)\b/.test(t)&&!/^(\d+\.)/.test(t);
  const label=/^(ESCOLA|DISCIPLINA|CÓDIGO|CRÉDITOS|PER[IÍ]ODO|SEMESTRE|CARGA HORÁRIA|TURMA|PROFESSOR \(ES\)|NOME|E-MAIL)\s*:/i.test(t);
  if(heading){flushP();flushList();flushMeta();const el=document.createElement('h3');el.textContent=tidy(t);nodes.push(el);continue}
  if(label){flushP();flushList();meta.push(t);continue}
  if(/^(?:[•●–-]\s+|\d+(?:\.\d+)*[.)]\s+)/.test(t)){
    flushP();flushMeta();list.push(t.replace(/^(?:[•●–-]\s+|\d+(?:\.\d+)*[.)]\s+)/,''));
    continue;
  }
  flushList();flushMeta();paragraph.push(t);
 }
 flushP();flushList();flushMeta();
 nodes.forEach(node=>root.appendChild(node));return root;
}
function mkTable(rows,labels){
 const wrap=document.createElement('div');wrap.className='doc-table-wrap';
 const table=document.createElement('table');table.className='doc-schedule';
 const th=document.createElement('thead');
 th.innerHTML='<tr>'+labels.map(x=>'<th scope="col">'+h(x)+'</th>').join('')+'</tr>';
 table.appendChild(th);
 const body=document.createElement('tbody');
 rows.forEach((row)=>{
  let tr=document.createElement('tr');if(examRe.test((row[2]||'')+' '+(row[3]||'')))tr.className='doc-important';
  row.forEach(t=>{const td=document.createElement('td');td.textContent=tidy(t);tr.appendChild(td)});body.appendChild(tr);
 });table.appendChild(body);wrap.appendChild(table);return wrap;
}
function addSummaryPage(pageIndex,rows,labels,intro){
 const sh=sheets[pageIndex];if(!sh)return;
 const pres=sh.querySelector('pre');const text=raw[pageIndex];
 const wrap=document.createElement('div');
 const p=document.createElement('p');p.className='doc-table-intro';p.textContent=intro;wrap.appendChild(p);
 wrap.appendChild(mkTable(rows,labels));
 const more=document.createElement('p');more.className='doc-note';more.textContent='Os conteúdos foram organizados por aula e data para facilitar a consulta. Para conferir referências e detalhes exatamente como extraídos do documento, abra a transcrição original abaixo.';wrap.appendChild(more);
 wrap.appendChild(sourceBlock(text));pres.replaceWith(wrap);
}
function stylePlanPage(index){const sh=sheets[index];if(!sh)return;const pre=sh.querySelector('pre');if(!pre)return;const wrap=document.createElement('div');wrap.appendChild(documentFlow(raw[index]));wrap.appendChild(sourceBlock(raw[index]));pre.replaceWith(wrap);}
function trimEndNonSchedule(){
 for(const sh of sheets){
  if(sh.classList.contains('doc-schedule-done'))continue;
  const pre=sh.querySelector('pre');if(!pre)continue;
  const d=document.createElement('div');d.appendChild(sourceBlock(decode(pre.innerHTML)));pre.replaceWith(d);
 }
}
const tcc=[
['1','5/8','Apresentação da disciplina',''],
['2','6/8','Panorama geral e introdução aos modelos cognitivos e comportamentais',''],
['3','12/8','Aspectos históricos e bases filosóficas do Behaviorismo Metodológico e do Behaviorismo Radical','Watson (1913/2008); Skinner (1953), capítulos 1 a 3'],
['4','13/8','Análise do comportamento e tipos de comportamento','Moreira & Medeiros (2019), capítulo 9'],
['5','19/8','Condicionamento Respondente 1','Moreira & Medeiros (2019), capítulos 1 e 2'],
['6','20/8','Condicionamento Respondente 2',''],
['7','26/8','Evento alusivo ao Dia do Psicólogo — não haverá aula entre 17h30 e 21h',''],
['8','27/8','Condicionamento Operante 1 e 2: definição, reforço, punição e extinção; positivo e negativo; discriminação','Moreira & Medeiros (2019), capítulos 3, 4 e 5'],
['9','2/9','Exercício em aula: treinamento dos conceitos de análise do comportamento',''],
['10','3/9','Exercício avaliativo 1 (1,5 ponto): presencial, em duplas, com consulta a materiais da disciplina',''],
['11','9/9','Correção do exercício avaliativo 1; Condicionamento Operante 3: esquemas de reforçamento','Moreira & Medeiros (2019), capítulos 6, 7 e 8'],
['12','10/9','Análise funcional e topográfica: exemplos aplicados de análise do comportamento',''],
['13','16/9','Cognitivismo: aspectos históricos e bases filosóficas','De Lima Junior et al. (2023); Gardner (1985), capítulos 1 e 2'],
['14','17/9','Terapias cognitivas: Terapia Racional Emotiva Comportamental','Rangé (2011)'],
['15','23/9','Revisão para a Prova 1; data limite para entrega da cola a ser usada na prova',''],
['16','24/9','Prova 1 (3,5 pontos): presencial, individual, com consulta à cola',''],
['17','30/9','Terapias cognitivas: Terapia Cognitiva de Beck 1','Wright et al. (2008), capítulos 1 e 2'],
['18','1/10','Terapias cognitivas: Terapia Cognitiva de Beck 2','Wright et al. (2008), capítulo 3'],
['19','7/10','Terapias cognitivas: Terapia Cognitiva de Beck 3',''],
['20','8/10','Aula on-line (não haverá aula presencial): simulado do exercício avaliativo 2 e produção de cola',''],
['21','14/10','Exercício avaliativo 2 (1,5 ponto): presencial, em duplas, com consulta à cola',''],
['22','15/10','Terapias cognitivas: Terapia do Esquema 1','Young et al. (2008), capítulo 1'],
['23','21/10','Semana Acadêmica',''],
['24','22/10','Semana Acadêmica',''],
['25','28/10','Terapias cognitivas: Terapia do Esquema 2','Young et al. (2008), capítulo 2'],
['26','29/10','Terapias cognitivas: Terapia do Esquema 3','Lucena-Santos, Pinto-Gouveia e Oliveira (2015)'],
['26','04/11','Atividade em aula: Terapia do Esquema',''],
['27','05/11','Introdução às terapias de terceira onda','Hayes et al. (2008)'],
['28','11/11','Terapia de Aceitação e Compromisso 1',''],
['29','12/11','Terapia de Aceitação e Compromisso 2',''],
['30','18/11','Fechamento da disciplina e revisão para a Prova 2',''],
['31','19/11','Prova 2 (3,5 pontos): presencial, individual, sem consulta',''],
['32','25/11','Encerramento da disciplina: orientações para PS e G2',''],
['33','26/11','Prova de Substituição',''],
['34','02/12','Período de G2 — sem aula',''],
['35','03/12','Prova de G2','']
];
function parseNumbered(pages,kind){
 const found=[];let current=null;
 const rowRx=kind==='avaliacao'?/^\s*(\d{1,2})\.\s+(\d{1,2}\/\d{1,2})\s*(.*)$/:
 /^\s*(\d{1,2}|#)\s+(\d{1,2}\/(?:\d{1,2}|ago|set|out|nov|dez))\s*(.*)$/i;
 const offset=kind==='avaliacao'?55:kind==='familia'?49:kind==='grupos'?54:49;
 const pref=kind==='avaliacao'?15:kind==='familia'?13:kind==='grupos'?17:14;
 for(const page of pages){
  for(const rawLine of page.split(/\r?\n/)){
   const line=decode(rawLine);
   if(/Av\. Ipiranga|^\s*Fone:|^\s*(Aula\s+Data|Data\s+Conteúdo|ATIVIDADES AVALIATIVAS)/i.test(line))continue;
   const match=line.match(rowRx);
   if(match){
    current={no:match[1],date:match[2],subject:'',refs:''};found.push(current);
    const pos=match.index+match[0].indexOf(match[3]);
    const rest=match[3];
    if(rest?.trim()){
     const abs=pos>=0?pos:pref;
     const front=abs<offset?line.slice(abs,offset).trim():'';
     const back=line.slice(offset).trim();
     current.subject=front||rest.trim();if(front&&back)current.refs=back;
    }
    continue;
   }
   if(!current)continue;
   if(!line.trim()||/^\s*(CRONOGRAMA|TURMA |Professora:|\d+ªFG)/i.test(line))continue;
   const indent=(line.match(/^\s*/)||[''])[0].length;
   const part=line.trim();
   if(indent>=offset||(/^(?:-\s*(?:Texto|HUTZ|REPPOLD|CONSELHO)|https?:)/i.test(part)&&indent>=pref+10)){
    current.refs+=' '+part;
   }else if(indent>=pref&&indent<offset)current.subject+=' '+part;
   else if(indent>=5)current.refs+=' '+part;
  }
 }
 return found.filter(x=>x.subject||x.refs).map(x=>[x.no,x.date,x.subject,x.refs]);
}
function parseDated(page){
 const rows=[];let current=null;
 for(let line of page.split(/\r?\n/)){
  const r=line.match(/^\s*((?:\d{1,2}(?:,\s*\d{1,2})*)\s*\/\s*\d{1,2}|\d{1,2}\s*e\s*\d{1,2}\s*\/\s*\d{1,2})\s+(.*)$/i);
  if(r){current=['',r[1],r[2].trim(),''];rows.push(current);continue}
  if(!current)continue;
  if(!line.trim()||/Av\. Ipiranga|^\s*Fone:/.test(line))continue;
  const indent=(line.match(/^\s*/)||[''])[0].length;
  if(indent>80)current[3]+=' '+line.trim();
  else if(indent>=7&&indent<80)current[2]+=' '+line.trim();
 }
 return rows.filter(x=>x[2]);
}
if(file==='tcc-cronograma.html'){
 addSummaryPage(0,tcc,['Aula','Data','Conteúdo programático','Referências'],'Cronograma da turma 357, reorganizado em colunas como no documento original.');
 const note=document.createElement('p');note.className='doc-note';note.textContent='A numeração 26 aparece duas vezes (29/10 e 04/11) no arquivo fornecido. Foi mantida sem presumir correção.';sheets[0].querySelector('.doc-table-wrap')?.after(note);
}else if(file==='familia-cronograma.html'||file==='avaliacao-cronograma.html'){
 const kind=file.startsWith('familia')?'familia':'avaliacao';
 const rows=parseNumbered(raw,kind);
 if(rows.length>=20){
  addSummaryPage(0,rows,['Aula','Data','Conteúdo programático','Metodologia / referências'],'Quadro cronológico integrado das páginas do documento, com assuntos e leituras separados por coluna.');
  for(let i=1;i<sheets.length;i++)sheets[i].hidden=true;
 }else sheets.forEach((_,i)=>stylePlanPage(i));
}else if(file==='grupos-plano-e-cronograma.html'){
 stylePlanPage(0);
 const rows=parseNumbered(raw.slice(1),'grupos');
 if(rows.length>=10){
   addSummaryPage(1,rows,['Aula','Data','Conteúdo programático','Referências'],'Cronograma reunido em um único quadro de consulta, com atividades e leituras correspondentes.');
   sheets[2].hidden=true;
 }else{stylePlanPage(1);stylePlanPage(2)}
}else if(file==='metapsicologia-plano-e-cronograma.html'){
 stylePlanPage(0);stylePlanPage(1);
 const rows=parseDated(raw[2]);
 if(rows.length>=8)addSummaryPage(2,rows,['Aula','Data','Conteúdo / atividade','Recursos e textos'],'Calendário das aulas retirado do plano original. Confira no documento as observações e referências completas.');
 else stylePlanPage(2);
}else if(file==='social-plano-e-cronograma.html'){
 stylePlanPage(0);stylePlanPage(1);
 for(let i=2;i<sheets.length;i++)stylePlanPage(i);
}else{
 sheets.forEach((_,i)=>stylePlanPage(i));
}
})();