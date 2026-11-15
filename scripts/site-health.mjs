// Auditoria de layout na versão publicada. Somente leitura; nenhuma conta ou dado é alterado.
import {chromium,devices} from 'playwright';
import fs from 'node:fs/promises';
const url=process.env.SITE_URL||'https://uentzoul.github.io/estudos-uentzoul/';
const results=[]; const errors=[];
await fs.mkdir('site-health-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const profiles=[
  {name:'desktop',viewport:{width:1440,height:900}},
  {name:'tablet',viewport:{width:768,height:1024},isMobile:true,hasTouch:true},
  {name:'iphone',...devices['iPhone 13']},
  {name:'android',...devices['Pixel 7']}
];
for(const profile of profiles){
 const {name,...settings}=profile;
 const ctx=await browser.newContext({...settings,serviceWorkers:'block'});
 const page=await ctx.newPage();
 const row={device:name,url,status:'unknown',checks:[],warnings:[],errors:[]};
 page.on('pageerror',err=>row.errors.push('JavaScript: '+String(err.message).slice(0,250)));
 page.on('console',msg=>{if(msg.type()==='error')row.warnings.push('Console: '+msg.text().slice(0,220))});
 page.on('response',res=>{if(res.status()>=400 && new URL(res.url()).origin===new URL(url).origin)row.warnings.push('HTTP '+res.status()+': '+res.url().slice(0,180))});
 try{
  const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(3500);
  row.http=res?.status()||null;
  if(!res?.ok())row.errors.push('Página principal retornou HTTP '+row.http);
  const layout=await page.evaluate(()=>{
   const vw=document.documentElement.clientWidth;
   const root=document.documentElement;
   const shown=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
   const offenders=[...document.querySelectorAll('main,nav,header,section,article,button,input,textarea,select,[role="textbox"],.panel,.modal,.card')].filter(shown).filter(el=>{const r=el.getBoundingClientRect();return r.right>vw+8||r.left< -8}).slice(0,12).map(el=>({tag:el.tagName,id:el.id||'',className:String(el.className||'').slice(0,70),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}));
   const inputs=[...document.querySelectorAll('textarea,input,[contenteditable="true"]')].filter(shown).map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,width:Math.round(r.width),right:Math.round(r.right),left:Math.round(r.left)}});
   return {title:document.title,viewport:vw,scrollWidth:root.scrollWidth,bodyWidth:document.body.scrollWidth,hasMain:!!document.querySelector('main,#main'),offenders,inputs};
  });
  row.layout=layout;
  if(!layout.hasMain)row.errors.push('Área principal ausente');
  if(layout.scrollWidth>layout.viewport+10)row.errors.push('Rolagem horizontal: '+layout.scrollWidth+'px / '+layout.viewport+'px');
  if(layout.offenders.length)row.warnings.push('Elementos fora do viewport: '+JSON.stringify(layout.offenders));
  if(!layout.title)row.warnings.push('Título da página ausente');
  // Navegação anônima: só aciona botões de seções públicas que não enviam formulários.
  const sections=['home','library','calendar','exams','messages','ai'];
  for(const section of sections){
    const el=page.locator('#nav [data-page="'+section+'"]');
    if(await el.count()&&await el.first().isVisible()){
      try{
        await el.first().click({timeout:2500});
        await page.waitForTimeout(300);
        const h=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
        if(h.scroll>h.width+10)row.warnings.push('Rolagem horizontal em '+section+': '+h.scroll+'/'+h.width);
        row.checks.push(section);
      }catch(e){row.warnings.push('Não foi possível abrir '+section+': '+String(e.message).slice(0,90))}
    }
  }
  row.status=row.errors.length?'critical':row.warnings.length?'warning':'ok';
  await page.screenshot({path:'site-health-artifacts/'+name+'.png',fullPage:true,timeout:15000}).catch(()=>{});
 }catch(err){row.status='critical';row.errors.push(String(err.message).slice(0,400))}
 results.push(row); await ctx.close();
}
await browser.close();
const report={checkedAt:new Date().toISOString(),url,profiles:results,summary:{critical:results.filter(x=>x.status==='critical').length,warning:results.filter(x=>x.status==='warning').length,ok:results.filter(x=>x.status==='ok').length}};
await fs.writeFile('site-health-artifacts/report.json',JSON.stringify(report,null,2));
await fs.writeFile('site-health-artifacts/summary.md','# Saúde do Site\n\n'+results.map(r=>'- '+r.device+': '+r.status+' — '+[...r.errors,...r.warnings].slice(0,4).join(' | ')).join('\n')+'\n');
console.log(JSON.stringify(report.summary));
if(report.summary.critical)process.exitCode=1;
