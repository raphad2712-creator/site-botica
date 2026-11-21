import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { ProfileEditor } from "@/components/profile-editor";
import { OrderAftercare } from "@/components/order-aftercare";
import { ProfilePhoto } from "@/components/profile-photo";
import { AccountNavigation } from "./account-navigation";

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
    supabase.from("pedidos").select("id,total,status,pagamento_id,criado_em,transportadora,codigo_rastreio,link_rastreio,status_entrega,rastreio_atualizado_em,itens_pedido(quantidade,preco_unitario,produto:produtos(id,nome,imagem_url,categoria))").eq("usuario_id", auth.user.id).order("criado_em", { ascending: false }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  const pedidos = pedidosResposta?.data ?? [];
  const { data: perfilSalvo } = await supabase.from("perfil_clientes").select("*").eq("usuario_id", auth.user.id).maybeSingle();
  const nome = perfilSalvo?.nome || auth.user.user_metadata.nome || auth.user.email?.split("@")[0] || "cliente";
  const inicial = nome.trim().charAt(0).toUpperCase();
  const pedidosVisiveis = pedidos.filter((pedido) => pedido.itens_pedido?.length);

  return (
    <section className="account-page account-dashboard" data-account-tab="orders">
      <div className="account-dashboard-title"><div><Link className="account-breadcrumb" href="/">Início <span aria-hidden="true">/</span> <span>Minha conta</span></Link><small>SEU ESPAÇO NA BOTICA</small><h1>Minha conta</h1><p>Olá, {nome}. Acompanhe suas compras e mantenha seus dados atualizados.</p></div><LogoutButton /></div>
      <div className="account-dashboard-grid">
        <aside className="account-side">
          <div className="account-side-welcome"><ProfilePhoto fotoUrl={auth.user.user_metadata.foto_url} inicial={inicial} nome={nome} email={auth.user.email} compact /></div>
          <p>Minha área</p>
          <AccountNavigation pedidos={pedidosVisiveis.length} />
        </aside>

        <div className="account-main">
          <ProfileEditor perfil={{ nome, email: auth.user.email, telefone: auth.user.user_metadata.telefone, ...(perfilSalvo ?? {}), foto_url: auth.user.user_metadata.foto_url }} inicial={inicial} />

          <section className="account-history" id="pedidos">
            <div className="account-orders-head"><div><small>HISTÓRICO DE COMPRAS</small><h2>Meus pedidos</h2><p>Confira os detalhes e acompanhe cada entrega.</p></div><span>{pedidosVisiveis.length} {pedidosVisiveis.length === 1 ? "pedido" : "pedidos"}</span></div>
            <OrderAftercare pedidos={pedidosVisiveis} />
          </section>
        </div>
      </div>
    </section>
  );
}
