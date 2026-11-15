"""Percurso completo do tutorial: iPhone Safari, Android e tela pequena.
Não cria usuários, não grava visitas e não altera dados do site.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import sys

BASE = "http://127.0.0.1:8765/index.html"
OUT = Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
RESULTS = []
FAILURES = []

def run(browser, name, settings):
    ctx = browser.new_context(locale="pt-BR", timezone_id="America/Sao_Paulo", **settings)
    ctx.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:280]))
    screenshots = {0, 2, 7, 12, 15, 17}
    issues = []
    step_count = 0
    try:
        page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
        page.locator("#pmTourLaunch").wait_for(state="visible", timeout=25000)
        page.evaluate("""() => {
            window.__pmTourScrollCalls = [];
            const native = window.scrollTo.bind(window);
            window.scrollTo = function(...args) {
                if (args[0] && typeof args[0] === 'object' && args[0].behavior === 'smooth' &&
                    document.documentElement.classList.contains('pm-tour-running')) {
                    window.__pmTourScrollCalls.push({
                        stage: document.querySelector('.pm-spotlight-counter')?.textContent,
                        top: args[0].top
                    });
                }
                return native(...args);
            };
        }""")
        page.locator("#pmTourLaunch").click()
        page.locator(".pm-spotlight-popover").wait_for(state="visible", timeout=15000)
        step_count = int(page.locator(".pm-spotlight-counter").inner_text().split("/")[-1].strip())
        if step_count != 18:
            issues.append(f"Visitante móvel deveria ter 18 etapas, encontrou {step_count}")
        for step in range(step_count):
            page.wait_for_timeout(650)
            state = page.evaluate("""() => {
                const p=document.querySelector('.pm-spotlight-popover');
                const a=p?.querySelector('.pm-spotlight-actions');
                const b=p?.getBoundingClientRect();
                const ab=a?.getBoundingClientRect();
                return {
                    title:document.querySelector('#pmSpotlightTitle')?.textContent,
                    counter:document.querySelector('.pm-spotlight-counter')?.textContent,
                    panel:b?{top:b.top,bottom:b.bottom,height:b.height}:null,
                    actions:ab?{top:ab.top,bottom:ab.bottom}:null,
                    vw:innerWidth,vh:innerHeight,
                    scrollWidth:document.documentElement.scrollWidth,
                    smoothCalls:window.__pmTourScrollCalls||[]
                };
            }""")
            if not state["title"]:
                issues.append(f"Etapa {step+1}: título ausente")
            panel = state["panel"]
            actions = state["actions"]
            if not panel or panel["top"] < -3 or panel["bottom"] > state["vh"]+3:
                issues.append(f"Etapa {step+1}: painel fora da área visível: {panel}")
            if not actions or actions["top"] < (panel or {}).get("top",0)-3 or actions["bottom"] > (panel or {}).get("bottom",0)+3:
                issues.append(f"Etapa {step+1}: ações fora do painel: {actions}")
            if state["scrollWidth"] > state["vw"]+5:
                issues.append(f"Etapa {step+1}: rolagem horizontal inesperada")
            calls = [c for c in state["smoothCalls"] if c["stage"] == state["counter"]]
            if len(calls) > 1:
                issues.append(f"Etapa {step+1}: {len(calls)} movimentos suaves no mesmo passo")
            if step in screenshots:
                page.screenshot(path=str(OUT/f"{name}_tutorial_{step+1:02}.png"), timeout=20000)
            if step < step_count-1:
                page.locator(".pm-spotlight-next").click(timeout=15000)
        page.locator(".pm-spotlight-next").click(timeout=15000)
        page.wait_for_timeout(200)
        if page.locator("html.pm-tour-running").count():
            issues.append("O bloqueio de rolagem permaneceu após o tutorial")
    except Exception as e:
        issues.append("Falha no percurso: "+str(e)[:400])
    finally:
        RESULTS.append({"device":name,"steps":step_count,"issues":issues,"javascript_errors":errors[:5]})
        FAILURES.extend({"device":name,"problem":x} for x in issues)
        ctx.close()

with sync_playwright() as p:
    configurations = [
        ("iphone_webkit",p.webkit,dict(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=3)),
        ("android_chromium",p.chromium,dict(viewport={"width":393,"height":852},is_mobile=True,has_touch=True,device_scale_factor=2)),
        ("android_small",p.chromium,dict(viewport={"width":320,"height":700},is_mobile=True,has_touch=True,device_scale_factor=2))
    ]
    for name,engine,settings in configurations:
        browser=engine.launch(headless=True)
        try:
            run(browser,name,settings)
        finally:
            browser.close()

report={"results":RESULTS,"errors":FAILURES}
(OUT/"tutorial-mobile-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
if FAILURES:
    sys.exit(1)
