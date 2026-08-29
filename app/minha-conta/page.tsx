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

  return (
    <section className="account-page">
      <div className="account-head">
        <div className="account-identity"><Image src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" width={190} height={57} /><div><small>MINHA CONTA</small><h1>Olá, {auth.user.user_metadata.nome || auth.user.email}</h1><p>{auth.user.email}</p></div></div>
        <LogoutButton />
      </div>
      <h2>Meus pedidos</h2>
      {pedidos?.length ? pedidos.map((pedido) => (
        <article key={pedido.id}>
          <b>Pedido #{pedido.id}</b>
          <span>{new Date(pedido.criado_em).toLocaleDateString("pt-BR")}</span>
          <span>{pedido.status.replaceAll("_", " ")}</span>
          <strong>{Number(pedido.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
        </article>
      )) : <div className="notice">Você ainda não possui pedidos. <Link href="/">Ver produtos</Link></div>}
    </section>
  );
}
