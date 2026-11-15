"""Teste da interface real do Admin Config com dados fictícios, sem contas reais."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

out=Path('qa-artifacts');out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={"width":1200,"height":850},locale='pt-BR')
    page.goto('http://127.0.0.1:8765/index.html',wait_until='domcontentloaded')
    page.wait_for_function("Boolean(window.uentzoulAdminConfig?.render && document.getElementById('main'))",timeout=25000)
    result=page.evaluate("""async () => {
       const fakeUid='11111111-1111-4111-8111-111111111111';
       const oldTime='2026-11-12T14:00:00Z';
       const nowTime='2026-11-14T20:00:00Z';
       const tables={
        uentzoul_access_log:[
         {id:1002,user_id:null,actor:'anonymous',entered_at:oldTime,last_seen_at:null,ended_at:null},
         {id:1001,user_id:fakeUid,actor:'account',entered_at:nowTime,last_seen_at:nowTime,ended_at:nowTime}
        ],
        uentzoul_profiles:[{user_id:fakeUid,display_name:'Conta de teste'}],
        uentzoul_access_log_labels:[],
        uentzoul_visit_steps:[
         {id:1,access_id:1001,kind:'entry',section:'home',detail:null,semester:'2026/2',happened_at:nowTime},
         {id:2,access_id:1001,kind:'navigate',section:'subject',detail:'tcc:docs',semester:'2026/2',happened_at:nowTime},
         {id:3,access_id:1001,kind:'navigate',section:'messages',detail:null,semester:'2026/2',happened_at:nowTime},
         {id:4,access_id:1001,kind:'exit',section:'home',detail:null,semester:'2026/2',happened_at:nowTime}
        ],
        uentzoul_presence:[{user_id:fakeUid,last_seen:new Date().toISOString()}],
        uentzoul_admin_topics:[],
        uentzoul_error_reports:[]
       };
       const fakeClient={
        rpc:async(name)=>({data:name==='uentzoul_is_admin'?true:name==='uentzoul_guest_online_count'?0:null,error:null}),
        from:(name)=>{
          const query={
           filtered:[],select(){return this},order(){return this},
           eq(field,value){this.filtered.push([field,value]);return this},
           limit(){return Promise.resolve({data:(tables[name]||[]).filter(row=>this.filtered.every(([k,v])=>String(row[k])===String(v))),error:null})},
           then(resolve,reject){return Promise.resolve({data:tables[name]||[],error:null}).then(resolve,reject)}
          };
          return query;
        }
       };
       window.uentzoulAIAuth={client:()=>fakeClient,user:()=>({id:fakeUid})};
       window.uentzoulAdminBridge={subjects:()=>({tcc:'TCC'}),refreshNav:()=>{},rerenderAdmin:()=>{},adminLibrary:()=>'',goHome:()=>{}};
       await window.uentzoulAdminConfig.refresh();
       document.getElementById('main').innerHTML=window.uentzoulAdminConfig.render();
       const details=document.getElementById('adminLogDisclosure');
       details.open=true;
       details.dispatchEvent(new Event('toggle',{bubbles:true}));
       return {adminVisible:!!details,logButtons:document.querySelectorAll('[data-admin-log-tab]').length};
    }""")
    assert result['adminVisible'],result
    page.locator('[data-admin-log-tab="entries"]').click()
    page.locator('[data-admin-open-visit="1002"]').wait_for(timeout=10000)
    assert page.locator('[data-admin-open-visit]').count()==2
    page.locator('[data-admin-open-visit="1002"]').click()
    page.get_by_text('Registro anterior a este recurso',exact=False).wait_for(timeout=10000)
    assert page.get_by_text('Saída não confirmada').count()==1
    page.locator('[data-admin-close-visit]').click()
    page.locator('[data-admin-open-visit="1001"]').click()
    page.get_by_text('Acessou TCC',exact=False).wait_for(timeout=10000)
    assert page.get_by_text('Acessou Mensagens').count()==1
    assert page.get_by_text('Saiu do site').count()==1
    page.screenshot(path=str(out/'admin-log-clickable.png'),full_page=True)
    print(json.dumps({'admin_visible':True,'legacy_clickable':True,'new_path_clickable':True,'exit_registered':True},ensure_ascii=False))
    browser.close()
