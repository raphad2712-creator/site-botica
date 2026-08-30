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
    admin.from("pedidos").select("id,status,status_entrega,transportadora,codigo_rastreio,link_rastreio,criado_em").order("criado_em", { ascending: false }).limit(50),
    admin.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,motivo,detalhes,status,resposta_admin,criado_em").order("criado_em", { ascending: false }).limit(50),
  ]);
  return <><AdminProducts produtosIniciais={(data ?? []) as Produto[]} /><AdminAftercare pedidos={pedidos ?? []} solicitacoes={solicitacoes ?? []} /></>;
}
