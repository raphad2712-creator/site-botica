import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { AdminProducts } from "./products";
import type { Produto } from "@/lib/types";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { AdminAftercare } from "./aftercare";

export default async function AdminPage() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).single();
  if (perfil?.funcao !== "admin") return <section className="empty-page"><h1>Acesso restrito</h1><p>Sua conta ainda não é administradora.</p></section>;

  const { data } = await supabase.from("produtos").select("*").order("id");
  const admin = criarClienteAdmin();
  const [{ data: pedidos }, { data: solicitacoes }] = await Promise.all([
    admin.from("pedidos").select("id,total,status,status_entrega,transportadora,codigo_rastreio,link_rastreio,criado_em").order("criado_em", { ascending: false }).limit(50),
    admin.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,motivo,detalhes,status,resposta_admin,criado_em").order("criado_em", { ascending: false }).limit(50),
  ]);
  const produtos = (data ?? []) as Produto[];
  const pedidosLista = pedidos ?? [];
  const solicitacoesLista = solicitacoes ?? [];
  return <main className="admin-dashboard">
    <header className="admin-dashboard-hero">
      <div><small>GESTÃO BOTICA</small><h1>Painel administrativo</h1><p>Produtos, entregas e atendimento organizados em um só lugar.</p></div>
      <a href="/">VER LOJA ↗</a>
    </header>
    <nav className="admin-dashboard-nav" aria-label="Seções do painel"><a href="#visao-geral">Visão geral</a><a href="#produtos-admin">Produtos</a><a href="#entregas-admin">Entregas</a><a href="#pos-venda-admin">Pós-venda</a></nav>
    <section className="admin-overview" id="visao-geral">
      <article><span>▣</span><div><small>PRODUTOS</small><strong>{produtos.length}</strong><p>{produtos.filter((produto) => produto.ativo).length} ativos na loja</p></div></article>
      <article><span>▤</span><div><small>PEDIDOS</small><strong>{pedidosLista.length}</strong><p>{pedidosLista.filter((pedido) => pedido.status_entrega !== "entregue").length} em andamento</p></div></article>
      <article><span>◎</span><div><small>EM ENTREGA</small><strong>{pedidosLista.filter((pedido) => ["postado", "em_transito", "saiu_para_entrega"].includes(pedido.status_entrega || "")).length}</strong><p>Acompanhe e atualize abaixo</p></div></article>
      <article><span>!</span><div><small>EM ANÁLISE</small><strong>{solicitacoesLista.filter((item) => item.status === "em_analise").length}</strong><p>Solicitações de pós-venda</p></div></article>
    </section>
    <AdminProducts produtosIniciais={produtos} />
    <AdminAftercare pedidos={pedidosLista} solicitacoes={solicitacoesLista} />
  </main>;
}
