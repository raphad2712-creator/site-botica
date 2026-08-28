import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { AdminProducts } from "./products";
import type { Produto } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).single();
  if (perfil?.funcao !== "admin") return <section className="empty-page"><h1>Acesso restrito</h1><p>Sua conta ainda não é administradora.</p></section>;

  const { data } = await supabase.from("produtos").select("*").order("id");
  return <AdminProducts produtosIniciais={(data ?? []) as Produto[]} />;
}
