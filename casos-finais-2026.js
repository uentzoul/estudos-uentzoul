/* Casos autorais para arquivos recentes de Família e Avaliação. */
(()=>{
'use strict';
const extra={
 familia:[{
 id:'ritos-transgeracionalidade-final',title:'Um ritual que já não faz sentido para todos',area:'Rituais, mitos e transgeracionalidade',
 intro:'Após uma mudança de cidade, uma família discute manter o encontro anual. Algumas pessoas sentem pertencimento, outras relatam cobrança e conflitos antigos.',
 stages:[
 {prompt:'Qual leitura considera melhor os mitos e rituais familiares?',choices:[
 {label:'Investigar os sentidos do encontro para integrantes e gerações diferentes.',outcome:'A família reconhece vínculos importantes e também tensões associadas à obrigação.',reason:'Rituais são construções relacionais e podem assumir significados distintos conforme histórias e contextos.'},
 {label:'Determinar que todo ritual deve permanecer inalterado.',outcome:'Parte da família se afasta do diálogo.',reason:'O sentido de um ritual não é fixo nem igual para todos.'},
 {label:'Concluir que o desconforto de alguém prova ausência de vínculo.',outcome:'A discordância é interpretada como rejeição pessoal.',reason:'Uma experiência específica não justifica uma conclusão totalizante sobre os vínculos.'}
 ]},
 {prompt:'Os familiares identificam regras herdadas de outras gerações. Como prosseguir?',choices:[
 {label:'Examinar a transmissão das expectativas e negociar novas formas de participação.',outcome:'Os integrantes constroem alternativas que valorizam pertencimento e autonomia.',reason:'A transgeracionalidade permite compreender permanências e transformações, sem afirmar destino inevitável.'},
 {label:'Afirmar que todos repetirão necessariamente o comportamento dos avós.',outcome:'A família deixa de considerar mudanças possíveis.',reason:'A repetição transgeracional não equivale a determinismo.'},
 {label:'Descartar completamente a história familiar das decisões atuais.',outcome:'Expectativas não declaradas continuam interferindo na conversa.',reason:'A história ajuda a contextualizar as relações, sem substituir a escuta do presente.'}
 ]}
 ],wrapUp:'O caso articula pertencimento, rituais, papéis, transgeracionalidade e possibilidade de mudança.'}],
 avaliacao:[{
 id:'laudo-parecer-final',title:'Qual documento responde à demanda?',area:'Laudo, parecer e ética',
 intro:'Uma instituição solicita a uma psicóloga um documento técnico sobre um processo de avaliação já realizado. A solicitação pede detalhes íntimos que não são necessários à finalidade declarada.',
 stages:[
 {prompt:'Qual cuidado vem antes da escolha do documento?',choices:[
 {label:'Delimitar a demanda, a finalidade, a autorização e a necessidade das informações.',outcome:'A profissional identifica o alcance legítimo da solicitação e preserva dados sem pertinência.',reason:'Documentos psicológicos exigem finalidade, fundamentação, sigilo e minimização das informações.'},
 {label:'Compartilhar todo o registro pessoal para demonstrar transparência.',outcome:'Informações sensíveis são expostas desnecessariamente.',reason:'A comunicação deve respeitar finalidade e proteção das informações.'},
 {label:'Escolher o formato mais breve sem considerar a demanda.',outcome:'O documento pode deixar de responder à questão técnica.',reason:'O tipo de documento depende do objetivo e do trabalho realizado.'}
 ]},
 {prompt:'Se a demanda é responder a uma questão-problema técnica sobre documentos já existentes, qual caminho é coerente?',choices:[
 {label:'Avaliar a pertinência de um parecer psicológico fundamentado, dentro dos limites da atuação.',outcome:'O documento responde à questão delimitada sem simular uma nova avaliação psicológica.',reason:'O parecer aborda uma questão-problema técnica; o laudo decorre de processo de avaliação.'},
 {label:'Emitir automaticamente laudo sem realizar ou examinar o processo de avaliação correspondente.',outcome:'O documento apresenta conclusões sem base suficiente.',reason:'Laudo requer processo avaliativo fundamentado e não substitui outras modalidades.'},
 {label:'Redigir conclusões categóricas apenas a partir de uma solicitação verbal.',outcome:'A fundamentação do documento fica comprometida.',reason:'A formulação de documentos exige evidências e limites técnicos.'}
 ]}
 ],wrapUp:'O caso favorece a distinção entre laudo e parecer e a aplicação ética de normas e sigilo.'}]
};
for(const [subject,items] of Object.entries(extra)){
 const bag=window.PSICO_CASES||(window.PSICO_CASES={});
 const list=bag[subject]||(bag[subject]=[]);
 const ids=new Set(list.map(x=>x.id));
 for(const item of items)if(!ids.has(item.id))list.push(item);
}
})();