import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { AftercareCenter } from "@/components/aftercare-center";
import { CustomerRequests } from "@/components/customer-requests";

export default async function PosVendaPage() {
  const supabase = await criarClienteServidor();
  const { data: autenticacao } = await supabase.auth.getUser();
  if (!autenticacao.user) redirect("/login?next=%2Fpos-venda");

  const [{ data: pedidos }, { data: solicitacoes }] = await Promise.all([
    supabase.from("pedidos").select("id,status,pagamento_id,criado_em").eq("usuario_id", autenticacao.user.id).order("criado_em", { ascending: false }),
    supabase.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,status,motivo,resposta_admin,criado_em").eq("usuario_id", autenticacao.user.id).order("criado_em", { ascending: false }),
  ]);

  return <section className="account-page account-dashboard account-aftercare-page">
    <div className="account-dashboard-title"><div><Link className="account-breadcrumb" href="/">Início <span aria-hidden="true">/</span> <span>Atendimento</span></Link><small>CENTRAL DE ATENDIMENTO</small><h1>Trocas e reembolsos</h1><p>Abra uma solicitação relacionada a uma compra e acompanhe as orientações da Botica.</p></div></div>
    <Link className="aftercare-back" href="/minha-conta#pedidos">← Voltar para meus pedidos</Link>
    <section className="account-history account-requests">
      <div className="account-orders-head"><div><small>PÓS-VENDA</small><h2>Nova solicitação</h2><p>Selecione um pedido e conte o que aconteceu.</p></div></div>
      <AftercareCenter pedidos={pedidos ?? []} />
      <div className="account-requests-history"><h3>Suas solicitações</h3><span>{solicitacoes?.length ?? 0} {(solicitacoes?.length ?? 0) === 1 ? "solicitação" : "solicitações"}</span></div>
      <CustomerRequests solicitacoes={solicitacoes ?? []} />
    </section>
  </section>;
}
