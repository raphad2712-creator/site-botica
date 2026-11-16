import { criarClienteAdmin } from "@/lib/supabase/admin";

export function pagamentosProducaoConfigurados() {
  return Boolean(process.env.PAGBANK_TOKEN && process.env.SUPABASE_SERVICE_ROLE_KEY)
    && process.env.PAGBANK_SANDBOX === "false"
    && process.env.MODO_PEDIDO_TESTE !== "true"
    && Boolean(process.env.MELHOR_ENVIO_TOKEN || process.env.FRETE_TABELA_APROVADA === "true");
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
