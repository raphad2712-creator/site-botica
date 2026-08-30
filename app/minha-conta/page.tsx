import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

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
    supabase.from("pedidos").select("id,total,status,criado_em").order("criado_em", { ascending: false }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  const pedidos = pedidosResposta?.data ?? [];
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
            <a href="#dados"><i>♙</i><span>Dados pessoais</span><b>›</b></a>
            <Link href="/#produtos"><i>♡</i><span>Produtos favoritos</span><b>›</b></Link>
            <Link href="/#receita"><i>＋</i><span>Enviar receita</span><b>›</b></Link>
            <Link href="/#produtos"><i>⌕</i><span>Continuar comprando</span><b>›</b></Link>
          </nav>
        </aside>

        <div className="account-main">
          <section className="account-profile" id="dados">
            <div className="account-profile-avatar">{inicial}</div>
            <small>SEUS DADOS</small><h2>Meus dados</h2>
            <dl>
              <div><dt>Nome</dt><dd>{nome}</dd></div>
              <div><dt>E-mail</dt><dd>{auth.user.email}</dd></div>
              <div><dt>Telefone</dt><dd>{auth.user.user_metadata.telefone || "Não informado"}</dd></div>
              <div><dt>Conta criada em</dt><dd>{new Date(auth.user.created_at).toLocaleDateString("pt-BR")}</dd></div>
            </dl>
            <div className="account-verified"><span>✓</span><div><b>Conta protegida</b><small>Seu acesso e seus dados são protegidos pelo Supabase.</small></div></div>
          </section>

          <section className="account-history" id="pedidos">
            <div className="account-orders-head"><div><small>HISTÓRICO DE COMPRAS</small><h2>Meus pedidos</h2></div><span>{pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}</span></div>
            {pedidos?.length ? <div className="account-orders">{pedidos.map((pedido) => (
              <article key={pedido.id}>
                <div className="order-number"><small>PEDIDO</small><b>#{pedido.id}</b></div>
                <div><small>DATA</small><span>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span></div>
                <div><small>STATUS</small><span className={`order-status status-${pedido.status}`}>{pedido.status.replaceAll("_", " ")}</span></div>
                <div className="order-total"><small>TOTAL</small><strong>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
              </article>
            ))}</div> : <div className="account-empty"><span>⌑</span><h3>Você ainda não fez nenhum pedido</h3><p>Explore nossos produtos e encontre o cuidado ideal para você.</p><Link href="/#produtos">VER PRODUTOS</Link></div>}
          </section>
        </div>
      </div>
    </section>
  );
}
