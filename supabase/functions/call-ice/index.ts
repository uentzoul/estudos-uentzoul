// Chamadas temporariamente desativadas a pedido do administrador.
// Mantida somente a rota para que clientes antigos não obtenham novas
// credenciais TURN. Nenhum contato com serviço de mídia é realizado.
const headers={
 "Content-Type":"application/json",
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Cache-Control":"no-store"
};
Deno.serve((request:Request)=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 return new Response(JSON.stringify({error:"calls_disabled"}),{status:410,headers});
});
