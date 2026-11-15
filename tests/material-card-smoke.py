"""Teste anti-regressão: títulos de PDF devem ser legíveis em 320px/390px."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
OUT=Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
rows=[]
with sync_playwright() as p:
    for engine_name,engine in [("chromium",p.chromium),("webkit",p.webkit)]:
        browser=engine.launch(headless=True)
        try:
            for width in (320,390):
                context=browser.new_context(viewport={"width":width,"height":800},is_mobile=True,has_touch=True,
                                            device_scale_factor=2,locale="pt-BR")
                # Não contar testes automatizados como visitantes.
                context.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
                page=context.new_page()
                try:
                    page.goto("http://127.0.0.1:8765/index.html",wait_until="domcontentloaded",timeout=30000)
                    page.wait_for_function("""() => {
                        const s=[...document.styleSheets].find(x=>x.href?.includes('mobile-polish.css'));
                        if(!s)return false;
                        try{return s.cssRules.length>0}catch{return false}
                    }""",timeout=20000)
                    page.evaluate("""() => {
                        const fixture=document.createElement('section');
                        fixture.id='qa-mobile-materials';
                        fixture.className='subject-hub';
                        fixture.style.cssText='margin:24px auto;max-width:320px;width:calc(100% - 24px);padding:0';
                        fixture.innerHTML=`
                         <section id="docs" class="subject-hub-area">
                          <div class="material-block"><div class="doclist" style="display:grid;grid-template-columns:minmax(0,1fr)">
                           <div class="doc doc-compact is-available" data-qa-card="1">
                            <a class="doc-full-link" href="#qa" aria-label="Abrir Precisão">
                             <span class="docicon" aria-hidden="true">PDF</span>
                             <span class="docname">Precisão - slides de avaliação psicológica</span>
                             <span class="pm-exam-badge">Cai na prova</span>
                             <span class="doc-open-arrow" aria-hidden="true">↗</span>
                            </a>
                            <div class="doc-check"><label class="donecontrol"><input type="checkbox"> Marcar como visto</label></div>
                           </div>
                           <div class="doc doc-compact is-available" data-qa-card="2">
                            <a class="doc-full-link" href="#qa">
                             <span class="docicon" aria-hidden="true">PDF</span>
                             <span class="docname">Adaptação de Instrumentos Psicológicos — slides e anotações</span>
                             <span class="pm-exam-badge">Cai na prova</span>
                             <span class="doc-open-arrow" aria-hidden="true">↗</span>
                            </a>
                            <div class="doc-check"><label class="donecontrol"><input type="checkbox"> Marcar como visto</label></div>
                           </div>
                          </div></div>
                         </section>`;
                        document.body.appendChild(fixture);
                    }""")
                    page.locator("#qa-mobile-materials").scroll_into_view_if_needed()
                    page.locator("#qa-mobile-materials").screenshot(path=str(OUT/f"materiais_{engine_name}_{width}px.png"))
                    dimensions=page.evaluate("""() => {
                      const cards=[...document.querySelectorAll('[data-qa-card]')];
                      return cards.map(card=>{
                        const title=card.querySelector('.docname');
                        const badge=card.querySelector('.pm-exam-badge');
                        const docCheck=card.querySelector('.doc-check');
                        const docLink=card.querySelector('.doc-full-link');
                        const r=title.getBoundingClientRect();
                        const b=badge.getBoundingClientRect();
                        const action=docCheck.getBoundingClientRect();
                        const link=docLink.getBoundingClientRect();
                        return {titleWidth:r.width,titleHeight:r.height,
                                badgeTop:b.top,titleBottom:r.bottom,
                                actionTop:action.top,linkBottom:link.bottom,
                                cardHeight:card.getBoundingClientRect().height,
                                grid: getComputedStyle(card).display,
                                wordBreak:getComputedStyle(title).wordBreak,
                                text: title.textContent.trim()};
                      });
                    }""")
                    for item in dimensions:
                        assert item['grid']=='grid',f"{engine_name} {width}: cartão não empilhado {item}"
                        assert item['titleWidth'] >= 110,f"{engine_name} {width}: nome espremido {item}"
                        assert item['titleHeight'] <= 112,f"{engine_name} {width}: nome vertical {item}"
                        assert item['badgeTop']>=item['titleBottom']-5,f"{engine_name} {width}: selo conflita {item}"
                        assert item['actionTop']>=item['linkBottom']-2,f"{engine_name} {width}: marcar como visto sobreposto {item}"
                        assert item['cardHeight']<250,f"{engine_name} {width}: cartão alto demais {item}"
                        assert item['wordBreak']=='normal',f"{engine_name} {width}: quebra forçada {item}"
                    rows.append({"engine":engine_name,"width":width,"cards":dimensions})
                finally:
                    context.close()
        finally:
            browser.close()
print(json.dumps({"success":True,"mobile_cases":len(rows),"results":rows},ensure_ascii=False))
