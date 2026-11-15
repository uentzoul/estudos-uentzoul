"""Smoke test do PsicoMoodle: visitante, três semestres, desktop e celulares.
Executado no GitHub Actions com Chromium e WebKit (motor do Safari).
As capturas e o relatório ficam em qa-artifacts/. Não utiliza contas reais.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json
import re
import sys
import time

BASE="http://127.0.0.1:8765/index.html"
OUT=Path("qa-artifacts")
OUT.mkdir(exist_ok=True)
SEMESTERS=("2026/1","2026/2","2027/1")
ERRORS=[]
RESULTS=[]

def record(device,semester,**details):
    RESULTS.append({"device":device,"semester":semester,**details})

def run_case(browser,device,settings,semester):
    issues=[]
    errors=[]
    ctx=browser.new_context(locale="pt-BR",timezone_id="America/Sao_Paulo",**settings)
    # QA: não registrar visitas automatizadas como pessoas reais no Supabase.
    ctx.add_init_script("window.PSICO_VISIT_PATH={status:()=>({qa:true,ready:false})};")
    ctx.add_init_script("localStorage.setItem('uentzoul_semester_v1',"+json.dumps(semester)+")")
    page=ctx.new_page()
    page.on("pageerror",lambda error: errors.append(str(error)[:350]))
    page.on("console",lambda message: errors.append("Console: "+message.text[:250]) if message.type=="error" else None)
    prefix=device+"_"+semester.replace("/","-")
    subject_opened=False
    n_cards=0
    try:
        page.goto(BASE,wait_until="domcontentloaded",timeout=30000)
        try:
            page.locator(".course-card").first.wait_for(state="visible",timeout=25000)
        except PlaywrightTimeout:
            issues.append("Cartões de disciplinas não ficaram visíveis após carregar")
        n_cards=page.locator(".course-card").count()
        if n_cards<6:
            issues.append("Quantidade inesperada de cartões: "+str(n_cards))
        if page.locator(".course-toolbar").count():
            issues.append("Barra oval antiga voltou ao DOM")
        if page.locator("#libraryCourseSearch,#libraryCourseOrder,#libraryCourseMode").count():
            issues.append("Controles de busca/ordenação removidos reapareceram")
        dims=page.evaluate("""() => ({
            viewport:window.innerWidth,
            document:document.documentElement.scrollWidth,
            body:document.body.scrollWidth,
            main:document.querySelector('main')?.scrollWidth||0,
            height:document.documentElement.scrollHeight
        })""")
        if dims["document"]>dims["viewport"]+4:
            issues.append("Possível rolagem horizontal: "+str(dims))
        headings=page.locator("h1").all_text_contents()
        if not headings or not any("Psico" in h for h in headings):
            issues.append("Título principal ausente ou inesperado")
        buttons=page.get_by_role("button").all_text_contents()
        informal=re.compile(r"^\s*(?:Clica|Confere|Marca|Ouve|Revê|Lê|Faz|Escolhe)\b",re.IGNORECASE)
        for label in buttons:
            if informal.search(label):
                issues.append("Imperativo informal em botão: "+repr(label[:100]))
        page.screenshot(path=str(OUT/(prefix+"_home.png")),full_page=True,timeout=20000)
        # Valida a revisão pública com sessão realmente anônima (sem cookies nem login).
        if semester in ("2026/1","2026/2"):
            try:
                page.wait_for_function("Boolean(window.PSICO_VACATION_REVIEW?.show)",timeout=20000)
                page.evaluate("() => window.PSICO_VACATION_REVIEW.show()")
                page.locator("#vr-root .vr-month").first.wait_for(state="visible",timeout=20000)
                expected_events=21 if semester=="2026/1" else 24
                real_events=page.locator("#vr-root .vr-event").count()
                if real_events!=expected_events:
                    issues.append("Revisão pública incompleta: "+str(real_events)+"/"+str(expected_events))
                if page.locator("#vr-root").get_by_text("Não foi possível carregar a revisão").count():
                    issues.append("Revisão pública falhou ao buscar dados")
                if page.locator("#vr-root .vr-month").count()!=4:
                    issues.append("Linha do tempo não mostra quatro meses")
                page.locator("#vr-root .vr-month").first.click(timeout=8000)
                page.screenshot(path=str(OUT/(prefix+"_revisao.png")),full_page=True,timeout=20000)
                page.evaluate("() => window.PSICO_VACATION_REVIEW.close()")
            except Exception as exc:
                issues.append("Revisão pública anônima não abriu: "+str(exc)[:300])
        card=page.locator(".course-card button").first
        if card.count():
            try:
                card.click(timeout=8000)
                page.wait_for_timeout(300)
                subject_opened=page.locator(".course-detail-hero,.course-docs-page,.subject-hub,.subject-page,.course-subject").count()>0
                page.screenshot(path=str(OUT/(prefix+"_disciplina.png")),full_page=True,timeout=20000)
                if page.locator(".course-toolbar").count():
                    issues.append("Barra oval antiga apareceu na página de disciplina")
            except Exception as exc:
                issues.append("Não foi possível abrir a disciplina: "+str(exc)[:250])
    except Exception as exc:
        issues.append("Erro na navegação: "+str(exc)[:450])
    finally:
        record(device,semester,course_cards=n_cards,subject_opened=subject_opened,
               issues=issues,console_errors=errors[:12])
        ERRORS.extend({"device":device,"semester":semester,"problem":x} for x in issues)
        ctx.close()

with sync_playwright() as p:
    profiles=[
      ("desktop_chromium",p.chromium,dict(viewport={"width":1440,"height":900},device_scale_factor=1)),
      ("android_chromium",p.chromium,dict(viewport={"width":393,"height":852},is_mobile=True,has_touch=True,device_scale_factor=2)),
      ("iphone_webkit",p.webkit,dict(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=2))
    ]
    for device,engine,settings in profiles:
        browser=engine.launch(headless=True)
        try:
            for semester in SEMESTERS:
                run_case(browser,device,settings,semester)
        finally:
            browser.close()

report={"total_scenarios":len(RESULTS),"failed_scenarios":len(set((e["device"],e["semester"]) for e in ERRORS)),
        "errors":ERRORS,"results":RESULTS}
(OUT/"qa-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
if ERRORS:
    sys.exit(1)
