import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function MinhaContaPage() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id,total,status,criado_em")
    .order("criado_em", { ascending: false });

  return (
    <section className="account-page">
      <div className="account-head">
        <div><small>MINHA CONTA</small><h1>Olá, {auth.user.user_metadata.nome || auth.user.email}</h1></div>
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
