// Diagnóstico somente-leitura. Nunca imprime valores de credenciais ou dados de clientes.
import { createClient } from '@supabase/supabase-js';
const env=process.env;
const report={banco_seguro:false,pagamento_producao_configurado:Boolean(env.PAGBANK_TOKEN)&&env.PAGBANK_SANDBOX==='false'&&env.MODO_PEDIDO_TESTE!=='true',entrega_configurada:Boolean(env.MELHOR_ENVIO_TOKEN)||env.FRETE_TABELA_APROVADA==='true',estoque_conferido:false,remetente_brevo_ativo:false,homologacao_compra_e_recebimento_email:'pendente_de_teste_real'};
const timeoutFetch=(input,options={})=>fetch(input,{...options,signal:AbortSignal.timeout(6000)});
const checks=[];
if(env.NEXT_PUBLIC_SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY){
 const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:timeoutFetch}});
 checks.push((async()=>{const {data,error}=await db.rpc('seguranca_lancamento_pronta');report.banco_seguro=!error&&data===true;})());
 checks.push((async()=>{const {data,error}=await db.from('produtos').select('estoque_confirmado').eq('ativo',true);report.estoque_conferido=!error&&data?.length>0&&data.every(p=>p.estoque_confirmado===true);})());
}
if(env.BREVO_API_KEY&&env.EMAIL_REMETENTE){
 checks.push((async()=>{const response=await timeoutFetch('https://api.brevo.com/v3/senders',{headers:{'api-key':env.BREVO_API_KEY}});report.brevo_http_status=response.status;if(response.ok){const data=await response.json();report.remetente_brevo_ativo=Array.isArray(data.senders)&&data.senders.some(s=>s.active===true&&s.email?.toLowerCase()===env.EMAIL_REMETENTE.toLowerCase());}})());
}
await Promise.allSettled(checks);
console.log('DIAGNOSTICO_LANCAMENTO',JSON.stringify(report));
// Falhas não impedem publicar correções: a liberação de compra falha fechada no servidor.
