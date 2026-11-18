/* Nomes de exibição dos materiais.
   Nunca renomeia arquivos no armazenamento, URLs ou chaves de progresso. */
(function(){
 'use strict';
 const editorial={
  'Caderno Integrado — versão completa':'Caderno Integrado de Psicologia — versão completa',
  'Cronograma de TCC':'Cronograma da disciplina',
  'Terapia do Esquema — 41 slides':'Terapia do Esquema',
  'TCCs de Terceira Onda — 39 slides':'TCCs de terceira onda',
  'Roteiro A2 — leituras anteriores':'Roteiro de estudos para a A2',
  'Apostila de TREC e Beck':'TREC e Terapia Cognitiva de Beck',
  'Plano de ensino de TCC':'Plano de ensino da disciplina',
  'Plano de ensino de Psicologia da Família':'Plano de ensino da disciplina',
  'Cronograma de Psicologia da Família':'Cronograma da disciplina',
  'Plano de ensino e cronograma de Metapsicologia':'Plano de ensino e cronograma',
  'Segunda Tópica — slides':'Segunda tópica do aparelho psíquico',
  'Édipo — slides':'Complexo de Édipo',
  'Pulsão — slides':'Teoria das pulsões',
  'Estudo Dirigido P2':'Estudo dirigido para a P2',
  'Leitura das aulas 19 e 26 de outubro':'Leituras das aulas de 19 e 26 de outubro',
  'Plano de ensino e cronograma de Psicologia Social I':'Plano de ensino e cronograma',
  'Seminário sobre algoritmos e polarização':'Algoritmos e polarização social — trabalho escrito',
  'Cronograma de Avaliação Psicológica':'Cronograma da disciplina',
  'Entrevista de devolução — slides':'Entrevista de devolução',
  'Avaliação Psicológica — matéria da prova anterior':'Conteúdos para a prova de Avaliação Psicológica',
  'Entrevista de Anamnese':'Entrevista de anamnese',
  'Elaboração de documentos — slides':'Elaboração de documentos psicológicos',
  'Rovinski e Lago — documentos':'Elaboração de documentos — Rovinski e Lago',
  'Validade e Precisão — slides':'Validade e precisão dos testes psicológicos',
  'Padronização e normas — Rabelo e colaboradores':'Padronização e normatização — Rabelo e colaboradores',
  'Pasquali — elaboração de escalas':'Princípios de elaboração de escalas — Pasquali',
  'Adaptação de Instrumentos':'Adaptação de instrumentos',
  'Bateria de Testes — slides':'Bateria de testes psicológicos',
  'Entrevista simulada de devolução — vídeo':'Entrevista simulada de devolução',
  'Plano de ensino de Avaliação Psicológica':'Plano de ensino da disciplina',
  'Plano de ensino e cronograma de Psicologia dos Grupos I':'Plano de ensino e cronograma',
  'Escritores da Liberdade — guia de estudo (PDF)':'Escritores da Liberdade — guia de estudo'
 };
 function materialPresentation(m){
  const original=String(m?.title||m?._libraryUpload?.display_title||m?._libraryUpload?.filename||m?.source||'Material sem título').trim();
  let title=editorial[original]||original;
  if(!editorial[original]){
   title=title.replace(/\.(?:pdf|docx?|pptx?|html?)$/i,'')
    .replace(/_/g,' ')
    .replace(/\s*\((?:c[oó]pia|\d+)\)\s*$/i,'')
    .replace(/\s+[-—–]\s+slides?\s+sem\s+anotaç(?:ão|ões)\s*$/i,'')
    .replace(/\s+[-—–]\s+\d+\s+slides?\s*$/i,'')
    .replace(/\s{2,}/g,' ').trim();
  }
  if(!title)title='Material sem título';
  const source=String(m?._libraryUpload?.filename||m?.source||'');
  const hint=(original+' '+source+' '+String(m?.kind||'')).toLocaleLowerCase('pt-BR');
  const group=typeof materialGroup==='function'?materialGroup(m):'';
  let type='Material';
  if(/vídeo|video|youtu(?:\.be|be\.com)|\.mp4\b/.test(hint))type='Vídeo';
  else if(/\blink\b/.test(hint)||m?.kind==='Link')type='Link';
  else if(/plano de ensino/.test(hint))type='Plano de ensino';
  else if(/cronograma|calendário/.test(hint))type='Cronograma';
  else if(/estudo dirigido/.test(hint))type='Estudo dirigido';
  else if(/roteiro de estudo|roteiro a2/.test(hint))type='Roteiro de estudos';
  else if(/apostila/.test(hint))type='Apostila';
  else if(/guia de estudo|matéria da prova|revisão|exercícios e citações/.test(hint))type='Material de revisão';
  else if(/trabalho_|trabalho escrito|seminário sobre algoritmos/.test(hint))type='Trabalho acadêmico';
  else if(/dicionário|vocabulário|livro|manual/.test(hint))type='Livro de referência';
  else if(/artigo|texto.base|capítulo|bibliografia/.test(hint)||group==='Textos-base e bibliografia')type='Texto-base';
  else if(/slides?|lâminas|apresentação|\.pptx?\b|\baula\b/.test(hint)||group==='Aulas e apresentações')type='Apresentação';
  else if(/caderno integrado/.test(hint))type='Caderno de estudos';
  else if(group==='Guias e materiais de revisão')type='Material de revisão';
  else if(/\.docx?\b/.test(hint))type='Documento';
  else if(/\.pdf\b/.test(hint)||String(m?.kind).toLowerCase()==='pdf')type='PDF';
  const glyph=type==='Vídeo'?'▶':type==='Link'?'↗':
   type==='Apresentação'?'SLD':type==='Cronograma'?'CAL':
   type==='Plano de ensino'?'PLN':type==='Texto-base'?'TXT':
   type==='Estudo dirigido'||type==='Roteiro de estudos'?'EST':
   type==='Livro de referência'?'LIV':type==='Documento'?'DOC':
   type==='Caderno de estudos'?'CAD':type==='Apostila'?'APO':'PDF';
  return {title,type,glyph};
 }
 window.materialPresentation=materialPresentation;
})();
