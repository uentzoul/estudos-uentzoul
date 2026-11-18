"""Regressão: materiais chegam depois da navegação e não podem sumir no acervo.
Executa com documentos fictícios, sem login, sem alterar o Supabase ou dados reais.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

BASE="http://127.0.0.1:8765/index.html"
OUT=Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
RESULTS=[]
with sync_playwright() as p:
    profiles=[
        ("desktop",p.chromium,dict(viewport={"width":1440,"height":900})),
        ("android",p.chromium,dict(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=2)),
        ("iphone",p.webkit,dict(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=2)),
    ]
    for name,engine,options in profiles:
        browser=engine.launch(headless=True)
        context=browser.new_context(locale="pt-BR",timezone_id="America/Sao_Paulo",**options)
        context.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
        context.add_init_script("localStorage.setItem('uentzoul_semester_v1','2026/2')")
        page=context.new_page()
        try:
            page.goto(BASE,wait_until="domcontentloaded",timeout=30000)
            page.wait_for_function("typeof window.uentzoulLibraryApp?.applyRows === 'function'",timeout=20000)
            state=page.evaluate("""() => {
                const subject=document.querySelector('[data-action="subject:tcc"]');
                if(!subject)throw Error('Disciplina TCC não encontrada');
                subject.click();
                const docs=document.querySelector('[data-action="subjectArea:docs"]');
                if(!docs)throw Error('Botão Materiais e textos não encontrado');
                docs.click();
                if(!document.querySelector('#docs .pm-material-group'))throw Error('Acervo não abriu');
                const first=[...document.querySelectorAll('#docs .docname')].map(e=>e.textContent.trim());
                // Emula a resposta de uma busca que termina depois que a pessoa abriu a aba.
                const fake=[
                  {resource_key:'qa::cronograma-novo',file_subject:'tcc',display_title:'CRONOGRAMA TURMA 357',filename:'CRONOGRAMA TCC.pdf',
                   storage_path:'materials/qa-cronograma.pdf',updated_at:'2026-11-18T15:00:00Z',
                   exam_scope:false,publish_at:null,library_public:true},
                  {resource_key:'qa::plano',file_subject:'tcc',display_title:'Plano de Ensino TCC 2026',filename:'Plano de Ensino.pdf',
                   storage_path:'materials/qa-plano.pdf',updated_at:'2026-11-18T15:00:00Z',
                   exam_scope:false,publish_at:null,library_public:true},
                  {resource_key:'qa::aula',file_subject:'tcc',display_title:'Aula de validação de materiais',filename:'Aula de validação.pdf',
                   storage_path:'materials/qa-aula.pdf',updated_at:'2026-11-18T15:00:00Z',
                   exam_scope:false,publish_at:null,library_public:true}
                ];
                window.uentzoulLibraryApp.applyRows(fake);
                const after=[...document.querySelectorAll('#docs .docname')].map(e=>e.textContent.trim());
                const plan=document.querySelector('#docs [data-pm-group="plans"] > .doclist');
                const firstCard=plan?.querySelector('.doc-compact');
                const width=plan&&firstCard?{
                  list:plan.getBoundingClientRect().width,
                  card:firstCard.getBoundingClientRect().width,
                  grid:getComputedStyle(plan).gridTemplateColumns
                }:null;
                return {before:first,after,width,stillDocs:!!document.querySelector('#docs'),
                        categories:[...document.querySelectorAll('#docs [data-pm-group]')].map(x=>x.dataset.pmGroup)};
            }""")
            assert state["stillDocs"],f"{name}: saiu da aba após carregar registros: {state}"
            assert "Cronograma" in state["after"],f"{name}: cronograma não visível: {state}"
            assert "Plano de ensino" in state["after"],f"{name}: plano não visível: {state}"
            assert "Aula de validação de materiais" in state["after"],f"{name}: aula não carregou: {state}"
            assert state["after"].count("Cronograma")==1,f"{name}: cronogramas duplicados: {state}"
            assert state["width"] and state["width"]["card"]>=state["width"]["list"]-5,(
                f"{name}: cartão do cronograma ocupa apenas meia linha: {state}")
            page.screenshot(path=str(OUT/("material_load_"+name+".png")),full_page=True)
            # A organização por semanas não pode esconder arquivos públicos fora da prova.
            week=page.evaluate("""() => {
                const button=document.querySelector('#docs [data-pm-material-tab="weeks"]');
                if(!button)throw Error('Aba Por semanas não encontrada');
                button.click();
                return {isWeeks:!!document.querySelector('#docs .pm-weeks-intro'),
                  titles:[...document.querySelectorAll('#docs .pm-week-unassigned .docname')]
                    .map(e=>e.textContent.trim())};
            }""")
            assert week["isWeeks"],f"{name}: a aba Por semanas não abriu: {week}"
            assert "Aula de validação de materiais" in week["titles"],(
                f"{name}: material público fora da prova sumiu em Por semanas: {week}")
            RESULTS.append({"device":name,"visible":state["after"],"width":state["width"],"week":week})
        finally:
            context.close()
            browser.close()
print(json.dumps({"success":True,"results":RESULTS},ensure_ascii=False))
