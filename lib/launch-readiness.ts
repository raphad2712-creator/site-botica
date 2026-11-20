import { criarClienteAdmin } from "@/lib/supabase/admin";

export function pagamentosProducaoConfigurados() {
  return Boolean(process.env.PAGBANK_TOKEN && process.env.SUPABASE_SERVICE_ROLE_KEY)
    && process.env.PAGBANK_SANDBOX === "false"
    && process.env.MODO_PEDIDO_TESTE !== "true"
    && Boolean(process.env.MELHOR_ENVIO_TOKEN || process.env.FRETE_TABELA_APROVADA === "true");
}


export function pendenciasConfiguracaoLoja() {
  const pendencias: string[] = [];
  if (!process.env.PAGBANK_TOKEN) pendencias.push("Configurar PAGBANK_TOKEN na produção da Vercel.");
  if (process.env.PAGBANK_SANDBOX !== "false") pendencias.push("Definir PAGBANK_SANDBOX como false para produção.");
  if (process.env.MODO_PEDIDO_TESTE === "true") pendencias.push("Desativar MODO_PEDIDO_TESTE na produção.");
  if (!process.env.MELHOR_ENVIO_TOKEN && process.env.FRETE_TABELA_APROVADA !== "true") pendencias.push("Configurar MELHOR_ENVIO_TOKEN ou aprovar FRETE_TABELA_APROVADA.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) pendencias.push("Configurar SUPABASE_SERVICE_ROLE_KEY no servidor.");
  return pendencias;
}

export async function segurancaBancoPronta() {
  try {
    const { data, error } = await criarClienteAdmin().rpc("seguranca_lancamento_pronta");
    return !error && data === true;
  } catch { return false; }
}

export async function comprasLiberadas() {
  return pagamentosProducaoConfigurados() && await segurancaBancoPronta();
}

export const mensagemManutencao = "Estamos finalizando uma atualização. Tente novamente mais tarde ou fale com a Botica.";
