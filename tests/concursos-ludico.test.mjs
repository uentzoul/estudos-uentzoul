import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function fixture(){
 const callbacks = new Map();
 let markup='';
 let saves=0;
 class Element {
  constructor(action,data={}){this.dataset={ld:action,...data};this.value='';}
  closest(){return this;}
 }
 const document={
  addEventListener(type,fn){callbacks.set(type,fn);},
  querySelector(){return {};},
  activeElement:{tagName:'BODY'}
 };
 const window={speechSynthesis:{cancel(){}},SpeechSynthesisUtterance:class {}};
 const context={window,document,Element,console,Date,Math,Number,Object,String,Array,Map,Set,RegExp};
 const js=readFileSync(new URL('../concursos-ludico.js',import.meta.url),'utf8');
 runInNewContext(js,context,{filename:'concursos-ludico.js',timeout:2000});
 const subjects=[{id:'portugues',name:'Português'},{id:'especificos',name:'Conhecimentos específicos'}];
 const topics=[{id:'t1',subject:'portugues',title:'Acentuação',summary:'Regras',study:[{title:'Conceitos',body:'Acentos gráficos são sinais. Eles indicam casos específicos.'},{title:'Exemplos',body:'Palavras são exemplos da regra.'}],notes:[{term:'Oxítona',explanation:'Sílaba forte no fim'},{term:'Paroxítona',explanation:'Sílaba forte na penúltima posição'},{term:'Proparoxítona',explanation:'Sílaba forte na antepenúltima posição'}],check:['Consegue recordar a regra?']}];
 const questions=Array.from({length:6},(_,i)=>({id:'q'+i,subject:'portugues',topic:'t1',stem:'Enunciado '+i,options:['Alternativa correta','Errada','Outra'],answer:0,feedback:['A resposta está correta','Está incorreta','Está incorreta']}));
 const flashcards=[{id:'fc1',subject:'portugues',topic:'t1',front:'Pergunta do cartão',back:'Resposta do cartão'}];
 const store={settings:{},plan:[{day:1,date:'2026-11-21',topics:['t1']}],completed:{},answers:{},flashcards:{},notes:{}};
 const ctx={data:{subjects,topics,questions,flashcards},store,rights:{id:'usuario-teste',admin:false},view:'inicio',subject:'portugues',dayIndex:0,save(){saves++;},renderHTML(html){markup=html;},toast(){},generate(){},go(view){ctx.view=view;window.PMConcursoLudico.render(ctx);}};
 const click=(action,data={})=>{
  const e={target:new Element(action,data),preventDefault(){},stopImmediatePropagation(){}};
  callbacks.get('click')(e);
 };
 window.PMConcursoLudico.render(ctx);
 return {window,ctx,store,click,html:()=>markup,saves:()=>saves};
}

test('a interface abre em missões sem alterar dados de origem',()=>{
 const f=fixture();assert.match(f.html(),/Que tal uma missão rápida/);
 assert.match(f.html(),/HCPA/);assert.equal(f.store.plan.length,1);
});

test('a microaula preserva o material e cria um registro ao concluir',()=>{
 const f=fixture();f.click('learn-random');
 assert.match(f.html(),/Acentos gráficos/);
 for(let i=0;i<10&&!f.html().includes('Enunciado');i++)f.click('lesson-next');
 assert.ok(f.store.notes.__concursos_ludico.lessons.t1);
 assert.match(f.html(),/Enunciado/);
});

test('as questões guardam a resposta e agendam revisão',()=>{
 const f=fixture();f.click('quick');f.click('answer',{choice:'1'});
 assert.match(f.html(),/Vamos entender a resposta/);
 assert.equal(f.store.answers[Object.keys(f.store.answers)[0]].correct,false);
 assert.ok(f.saves()>0);
 assert.equal(f.store.notes.__concursos_ludico.sessions,0);
});

test('o vira-cartas e a conclusão do dia reutilizam o progresso existente',()=>{
 const f=fixture();f.click('flash-random');f.click('flip');
 assert.match(f.html(),/Resposta do cartão/);
 f.click('card-grade',{known:'true'});assert.equal(f.store.flashcards.fc1,true);
 f.click('nav',{page:'dia'});f.click('day-open',{index:'0'});f.click('day-complete',{index:'0'});
 assert.equal(f.store.completed['2026-11-21'],true);
});

test('a tela de administração não é substituída pelo modo lúdico',()=>{
 const f=fixture();assert.equal(f.window.PMConcursoLudico.render({...f.ctx,view:'admin'}),false);
});
