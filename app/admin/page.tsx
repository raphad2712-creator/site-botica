import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { AdminProducts } from "./products";
import type { Produto } from "@/lib/types";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { AdminAftercare } from "./aftercare";
import { AdminTabs } from "./tabs";
import { AdminNewsletter } from "./newsletter";
import { AdminRecipes } from "./recipes";

export default async function AdminPage() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");

  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).single();
  if (perfil?.funcao !== "admin") redirect("/admin/login");

  const { data } = await supabase.from("produtos").select("*").order("id");
  const admin = criarClienteAdmin();
  const [{ data: pedidos }, { data: solicitacoes }, { count: totalInscritos }, { data: receitas, error: receitasError }] = await Promise.all([
    admin.from("pedidos").select("id,usuario_id,endereco_id,total,status,status_entrega,transportadora,codigo_rastreio,link_rastreio,criado_em,endereco:enderecos(cep,rua,numero,complemento,bairro,cidade,estado)").order("criado_em", { ascending: false }).limit(50),
    admin.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,motivo,detalhes,status,resposta_admin,criado_em").order("criado_em", { ascending: false }).limit(50),
    admin.from("newsletter_inscritos").select("id", { count: "exact", head: true }).eq("ativo", true),
    admin.from("receitas").select("id,usuario_id,observacao,status,criado_em").order("criado_em", { ascending: false }).limit(50),
  ]);
  const produtos = (data ?? []) as Produto[];
  const pedidosBase = pedidos ?? [];
  const receitasBase = receitas ?? [];
  const usuariosIds = [...new Set([...pedidosBase.map((pedido) => pedido.usuario_id), ...receitasBase.map((receita) => receita.usuario_id)].filter(Boolean))];
  const { data: perfisClientes } = usuariosIds.length
    ? await admin.from("perfil_clientes").select("usuario_id,nome,cpf,telefone").in("usuario_id", usuariosIds)
    : { data: [] };
  const perfisPorUsuario = new Map((perfisClientes ?? []).map((perfil) => [perfil.usuario_id, perfil]));
  const emails = await Promise.all(usuariosIds.map(async (id) => {
    const { data: usuario } = await admin.auth.admin.getUserById(id);
    return [id, usuario.user?.email ?? ""] as const;
  }));
  const emailsPorUsuario = new Map(emails);
  const pedidosLista = pedidosBase.map((pedido) => ({
    ...pedido,
    endereco: Array.isArray(pedido.endereco) ? (pedido.endereco[0] ?? null) : pedido.endereco,
    cliente: { ...perfisPorUsuario.get(pedido.usuario_id), email: emailsPorUsuario.get(pedido.usuario_id) || "" },
  }));
  const receitasLista = receitasBase.map((receita) => ({ ...receita, cliente: { ...perfisPorUsuario.get(receita.usuario_id), email: emailsPorUsuario.get(receita.usuario_id) || "" } }));
  const solicitacoesLista = solicitacoes ?? [];
  const pendentes = solicitacoesLista.filter((item) => item.status !== "concluida").length;
  return <main className="admin-dashboard" data-admin-tab="overview">
    <header className="admin-dashboard-hero">
      <div><small>GESTÃO BOTICA</small><h1>Painel administrativo</h1><p>Produtos, entregas e atendimento organizados em um só lugar.</p></div>
      <a href="/">VER LOJA ↗</a>
    </header>
    <AdminTabs numeros={{ products: produtos.length, deliveries: pedidosLista.filter((pedido) => pedido.status_entrega !== "entregue").length, requests: pendentes, completed: solicitacoesLista.filter((item) => item.status === "concluida").length, newsletter: totalInscritos ?? 0, recipes: receitasLista.filter((item) => item.status === "em_analise").length }} />
    <section className="admin-overview" id="visao-geral">
      <article><span>▣</span><div><small>PRODUTOS</small><strong>{produtos.length}</strong><p>{produtos.filter((produto) => produto.ativo).length} ativos na loja</p></div></article>
      <article><span>▤</span><div><small>PEDIDOS</small><strong>{pedidosLista.length}</strong><p>{pedidosLista.filter((pedido) => pedido.status_entrega !== "entregue").length} em andamento</p></div></article>
      <article><span>◎</span><div><small>EM ENTREGA</small><strong>{pedidosLista.filter((pedido) => ["postado", "em_transito", "saiu_para_entrega"].includes(pedido.status_entrega || "")).length}</strong><p>Acompanhe e atualize abaixo</p></div></article>
      <article><span>!</span><div><small>EM ANÁLISE</small><strong>{solicitacoesLista.filter((item) => item.status === "em_analise").length}</strong><p>Solicitações de pós-venda</p></div></article>
    </section>
    <AdminProducts produtosIniciais={produtos} />
    <AdminAftercare pedidos={pedidosLista} solicitacoes={solicitacoesLista} />
    <AdminNewsletter total={totalInscritos ?? 0} />
    <AdminRecipes receitas={receitasLista} erroConfiguracao={receitasError ? "O banco ainda não está preparado para receber receitas. Execute supabase/receitas.sql no SQL Editor do Supabase." : undefined} />
  </main>;
}
