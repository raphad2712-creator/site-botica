import Link from "next/link";
import Image from "next/image";
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
    <section className="account-page">
      <div className="account-welcome">
        <div className="account-head">
          <div className="account-identity"><span className="account-avatar">{inicial}</span><div><small>ÁREA DO CLIENTE</small><h1>Olá, {nome}</h1><p>{auth.user.email}</p></div></div>
          <LogoutButton />
        </div>
        <div className="account-welcome-brand"><Image src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" width={190} height={57} /><p>Que bom ter você por aqui.</p></div>
      </div>
      <nav className="account-shortcuts" aria-label="Atalhos da conta">
        <Link href="/#produtos"><span>⌕</span><div><b>Comprar produtos</b><small>Conheça o catálogo</small></div><i>→</i></Link>
        <Link href="/#receita"><span>＋</span><div><b>Enviar receita</b><small>Solicite um orçamento</small></div><i>→</i></Link>
        <Link href="/#produtos"><span>♡</span><div><b>Meus favoritos</b><small>Continue suas escolhas</small></div><i>→</i></Link>
      </nav>
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
  );
}
