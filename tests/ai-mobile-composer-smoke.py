"""Verifica campo da IA Tzoul no celular: sem sugestões sobrepostas nem corte."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

OUT=Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
checks=[]
with sync_playwright() as pw:
    for name,engine in [('chromium',pw.chromium),('webkit',pw.webkit)]:
        browser=engine.launch(headless=True)
        try:
            for width in (320,390,430):
                ctx=browser.new_context(viewport={'width':width,'height':820},is_mobile=True,has_touch=True,
                                        device_scale_factor=2,locale='pt-BR')
                ctx.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
                page=ctx.new_page()
                try:
                    page.goto('http://127.0.0.1:8765/index.html',wait_until='domcontentloaded',timeout=30000)
                    page.wait_for_function("Boolean(document.querySelector('#nav [data-page=ai]'))",timeout=25000)
                    page.evaluate("document.querySelector('#nav [data-page=ai]').click()")
                    page.locator('.tz-shell #tzPrompt').wait_for(state='visible',timeout=12000)
                    page.locator('.tz-shell .tz-composer').scroll_into_view_if_needed()
                    info=page.evaluate("""() => {
                        const root=document.querySelector('.tz-shell');
                        const box=root.querySelector('.tz-composer');
                        const input=root.querySelector('#tzPrompt');
                        const buttons=[...root.querySelectorAll('.tz-composer .tz-upload-btn,.tz-composer .tz-send')];
                        const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
                        return {hints:root.querySelectorAll('.tz-hints').length,
                                placeholder:input.placeholder,
                                input:rect(input),composer:rect(box),
                                buttons:buttons.map(rect),
                                overflow:document.documentElement.scrollWidth-window.innerWidth,
                                bodyTheme:document.documentElement.dataset.theme||''};
                    }""")
                    assert info['hints']==0, f"Frases animadas ainda renderizadas: {name} {width}"
                    assert info['placeholder']=='Escreva aqui…',f"Placeholder incorreto: {info}"
                    assert info['input']['width']>=100,f"Campo estreito: {name} {width}: {info}"
                    assert info['input']['left']>info['buttons'][1]['right']-2,f"Sobreposição com foto: {info}"
                    assert info['input']['right']<info['buttons'][2]['left']+2,f"Sobreposição com enviar: {info}"
                    assert info['overflow']<=4,f"Rolagem horizontal indevida: {info}"
                    page.locator('.tz-shell #tzPrompt').evaluate("(el)=>el.disabled=false")
                    page.locator('.tz-shell #tzPrompt').fill('Mensagem de teste no celular')
                    assert page.locator('.tz-shell #tzPrompt').input_value()=='Mensagem de teste no celular'
                    page.locator('.tz-shell #tzPrompt').fill('')
                    page.locator('.tz-shell').screenshot(path=str(OUT/f'tzoul_input_{name}_{width}.png'))
                    checks.append({'browser':name,'width':width,'input_width':info['input']['width'],
                                   'suggestions':info['hints'],'input_ok':True})
                finally:
                    ctx.close()
        finally:
            browser.close()
print(json.dumps({'success':True,'checks':checks},ensure_ascii=False))
