/* Testes de regressão: prévia administrativa de Trabalhos e Conferência. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const works=read('trabalhos.js');
const review=read('trabalhos-conferencia.js');
const index=read('index.html');
const edge=read('supabase/functions/trabalhos-revisao/index.ts');

test('Conferência conserva a navegação pública bloqueada e exige administrador em todas as camadas',()=>{
 assert.match(index,/class="sidebtn nav-upcoming" role="note" tabindex="0" aria-disabled="true" aria-label="Trabalhos — em breve"/);
 assert.match(index,/id="navTrabalhosAdmin" hidden/);
 assert.match(index,/data-page="works"/);
 assert.match(index,/if\(page==='works'&&!window\.uentzoulAdminConfig\?\.isAdmin\?\.\(\)\)page='home'/);
 assert.match(works,/hasAccess:permitted/);
 assert.match(review,/const access=\(\)=>window\.PSICO_WORKS\?\.hasAccess\?\.\(\)===true/);
 assert.match(edge,/scoped\.rpc\("uentzoul_is_admin"\)/);
 assert.match(edge,/store:false/);
 assert.match(edge,/ia_tzoul_consume_quota/);
 assert.match(index,/trabalhos-conferencia\.js\?v=/);
 assert.match(index,/trabalhos-conferencia\.css\?v=/);
});

test('Conferência oferece leitura de arquivos e revisão por evidência, sem alegar análise visual',()=>{
 for(const format of ['pdf','pptx','docx','txt','md'])assert.ok(review.includes("'"+format+"'"),format);
 assert.match(review,/getTextContent\(\)/);
 assert.match(review,/word\/document\.xml/);
 assert.ok(review.includes('ppt\\/slides'));

 for(const text of ['Onde aparece:', 'Por que vale ajustar:', 'Sugestão:', 'Análise baseada no texto', 'Salvar parecer'])assert.ok((review+edge).includes(text),text);
 assert.match(edge,/Não invente páginas, trechos, fontes/);
 assert.match(edge,/Slides não precisam repetir o texto inteiro/);
 assert.match(edge,/Normas como obrigação universal|Não use normas como obrigação universal/);
});

function createHarness(){
 const handlers=new Map(),storage=new Map();
 let admin=true,invokes=0,renderCount=0,id=0;
 const userId='admin-qa';
 const report={
  summary:'Há uma lacuna entre a hipótese e a conclusão.',
  scope:'somente_slides',strengths:['O tema está delimitado.'],
  findings:[{priority:'media',location:'slides',title:'Transição incompleta',evidence:'Slide 3 e slide 7',why:'A conclusão não retoma a hipótese.',suggestion:'Conectar as evidências à conclusão.'}],
  next_steps:['Reorganizar o fechamento.'],
  limitations:['Não foram verificadas imagens.']
 };
 const window={
  uentzoulAdminConfig:{isAdmin:()=>admin},
  uentzoulAIAuth:{
   user:()=>({id:userId}),
   client:()=>({functions:{invoke:async(name,{body})=>{
    invokes++;
    assert.equal(name,'trabalhos-revisao');
    assert.equal(body.slides.includes('SLIDE 1'),true);
    assert.equal(body.written,'');
    return {data:{review:report},error:null};
   }}})
  },
  uentzoulAdminBridge:{refreshCurrent:()=>{renderCount++;window.PSICO_WORKS.render()}}
 };
 const document={
  addEventListener:(event,fn)=>handlers.set(event,[...(handlers.get(event)||[]),fn]),
  querySelector:()=>null
 };
 const localStorage={
  getItem:k=>storage.get(k)||null,
  setItem:(k,v)=>storage.set(k,v)
 };
 class FakeFormData{constructor(element){this.fields=element._fields||{}}get(k){return this.fields[k]??null}}
 const context={window,document,localStorage,crypto:{randomUUID:()=>String(++id)},FormData:FakeFormData,
  Blob:class{},URL:{},setTimeout,confirm:()=>true,console};
 vm.runInNewContext(works,context);
 vm.runInNewContext(review,context);
 const element=(selector,props={})=>({
  ...props,closest(query){return query==='#pmWorks'||query===selector?this:null}
 });
 function dispatch(type,evt){for(const listener of handlers.get(type)||[])listener(evt)}
 return {window,storage,element,dispatch,setAdmin:v=>{admin=v},stats:()=>({invokes,renderCount})};
}

test('Estudante pode abrir Conferência apenas como administrador e o parecer guarda apenas resultado',async()=>{
 const h=createHarness();
 const create=h.element('missing',{id:'pw-create',_fields:{title:'Estudo de caso',type:'analise',prompt:'Analisar conceitos'}});
 h.dispatch('submit',{target:create,preventDefault(){}});
 assert.equal(h.window.PSICO_WORKS.getSelected().title,'Estudo de caso');
 const nav=h.element('[data-pw-nav]',{dataset:{pwNav:'review'}});
 h.dispatch('click',{target:nav});
 let html=h.window.PSICO_WORKS.render();
 assert.ok(html.includes('Conferir o trabalho'));
 assert.ok(html.includes('Apenas slides'));
 const area=h.element('[data-pw-review-text]',{dataset:{pwReviewText:'slides'},value:'[SLIDE 1] Delimitação da hipótese. [SLIDE 3] Discussão do problema. [SLIDE 7] Conclusão e proposta do grupo.'});
 h.dispatch('input',{target:area});
 html=h.window.PSICO_WORKS.render();
 assert.ok(html.includes('SLIDE 1'));
 const run=h.element('[data-pw-review-run]');
 h.dispatch('click',{target:run});
 await new Promise(resolve=>setTimeout(resolve,8));
 const saved=h.window.PSICO_WORKS.getSelected();
 assert.equal(h.stats().invokes,1);
 assert.equal(saved.review.findings.length,1);
 assert.equal(saved.review.findings[0].suggestion,'Conectar as evidências à conclusão.');
 assert.ok(!JSON.stringify(saved).includes('Delimitação da hipótese'),'material enviado não fica gravado no rascunho');
 assert.ok(h.window.PSICO_WORKS.render().includes('Conectar as evidências à conclusão.'));
 h.setAdmin(false);
 assert.ok(h.window.PSICO_WORKS.render().includes('Acesso restrito'));
 assert.ok(!h.window.PSICO_WORKS.render().includes('Conectar as evidências'));
});
