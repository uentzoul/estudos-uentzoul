"""Verifica que a aba de IA Tzoul está desativada no celular, sem afetar a navegação."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

OUT=Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
checks=[]
with sync_playwright() as pw:
    for name, engine in [("chromium",pw.chromium),("webkit",pw.webkit)]:
        browser=engine.launch(headless=True)
        try:
            for width in (320,390,430):
                ctx=browser.new_context(
                    viewport={"width":width,"height":820},
                    is_mobile=True,has_touch=True,device_scale_factor=2,locale="pt-BR"
                )
                ctx.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
                page=ctx.new_page()
                try:
                    page.goto("http://127.0.0.1:8765/index.html",wait_until="domcontentloaded",timeout=30000)
                    page.locator("#nav").wait_for(state="attached",timeout=25000)
                    info=page.evaluate("""() => ({
                      iaNav:document.querySelectorAll('#nav [data-page="ai"]').length,
                      aiPersonalButtons:document.querySelectorAll('[data-pc-tab="ai"]').length,
                      activeAi:document.querySelectorAll('.tz-shell').length,
                      extrasNav:document.querySelectorAll('#nav [data-page="extras"]').length,
                      homeNav:document.querySelectorAll('#nav [data-page="home"]').length,
                      overflow:document.documentElement.scrollWidth-window.innerWidth
                    })""")
                    assert info["iaNav"]==0, f"IA ainda aparece no menu: {name} {width}: {info}"
                    assert info["aiPersonalButtons"]==0, f"Atalho de IA ainda renderizado: {info}"
                    assert info["activeAi"]==0, f"IA ainda aberta: {info}"
                    assert info["extrasNav"]==1 and info["homeNav"]==1, f"Navegação afetada: {info}"
                    assert info["overflow"]<=4, f"Rolagem horizontal indevida: {info}"
                    page.screenshot(path=str(OUT/f"ia_desativada_{name}_{width}.png"))
                    checks.append({"browser":name,"width":width,"ai_disabled":True,"navigation_ok":True})
                finally:
                    ctx.close()
        finally:
            browser.close()
print(json.dumps({"success":True,"checks":checks},ensure_ascii=False))
