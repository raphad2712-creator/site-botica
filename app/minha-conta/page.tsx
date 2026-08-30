import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { ProfileEditor } from "@/components/profile-editor";
import { OrderAftercare } from "@/components/order-aftercare";
import { CustomerRequests } from "@/components/customer-requests";

export default async function MinhaContaPage() {
  const supabase = await criarClienteServidor();
  const autenticacao = await Promise.race([
    supabase.auth.getUser(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  if (!autenticacao) return <section className="account-page account-timeout"><h1>Não foi possível carregar sua conta</h1><p>O servidor demorou para responder.</p><Link href="/minha-conta">TENTAR NOVAMENTE</Link></section>;
  const { data: auth } = autenticacao;
  if (!auth.user) redirect("/login");

  const pedidosResposta = await Promise.race([
    supabase.from("pedidos").select("id,total,status,criado_em,transportadora,codigo_rastreio,link_rastreio,status_entrega,rastreio_atualizado_em,itens_pedido(quantidade,preco_unitario,produto:produtos(id,nome,imagem_url,categoria))").order("criado_em", { ascending: false }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  const pedidos = pedidosResposta?.data ?? [];
  const { data: solicitacoes } = await supabase.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,status,motivo,resposta_admin,criado_em").order("criado_em", { ascending: false });
  const { data: perfilSalvo } = await supabase.from("perfil_clientes").select("*").eq("usuario_id", auth.user.id).maybeSingle();
  const nome = auth.user.user_metadata.nome || auth.user.email?.split("@")[0] || "cliente";
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <section className="account-page account-dashboard">
      <div className="account-dashboard-title"><div><small>ÁREA DO CLIENTE</small><h1>Minha conta</h1></div><LogoutButton /></div>
      <div className="account-dashboard-grid">
        <aside className="account-side">
          <div className="account-side-welcome"><span>{inicial}</span><div><small>BEM-VINDO(A)</small><b>{nome}</b></div></div>
          <p>O que você está procurando?</p>
          <nav aria-label="Opções da conta">
            <a href="#pedidos"><i>▣</i><span>Meus pedidos</span><b>›</b></a>
            <a href="#solicitacoes"><i>↻</i><span>Minhas solicitações</span><b>›</b></a>
            <a href="#dados"><i>♙</i><span>Dados pessoais</span><b>›</b></a>
            <Link href="/#produtos"><i>♡</i><span>Produtos favoritos</span><b>›</b></Link>
            <Link href="/#receita"><i>＋</i><span>Enviar receita</span><b>›</b></Link>
            <Link href="/#produtos"><i>⌕</i><span>Continuar comprando</span><b>›</b></Link>
          </nav>
        </aside>

        <div className="account-main">
          <ProfileEditor perfil={{ nome, email: auth.user.email, telefone: auth.user.user_metadata.telefone, ...(perfilSalvo ?? {}) }} inicial={inicial} />

          <section className="account-history" id="pedidos">
            <div className="account-orders-head"><div><small>HISTÓRICO DE COMPRAS</small><h2>Meus pedidos</h2></div><span>{pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}</span></div>
            <OrderAftercare pedidos={pedidos} solicitacoes={solicitacoes ?? []} />
          </section>
          <section className="account-history account-requests" id="solicitacoes">
            <div className="account-orders-head"><div><small>ATENDIMENTO E PÓS-VENDA</small><h2>Minhas solicitações</h2></div><span>{solicitacoes?.length ?? 0} {(solicitacoes?.length ?? 0) === 1 ? "solicitação" : "solicitações"}</span></div>
            <CustomerRequests solicitacoes={solicitacoes ?? []} pedidos={pedidos} />
          </section>
        </div>
      </div>
    </section>
  );
}
