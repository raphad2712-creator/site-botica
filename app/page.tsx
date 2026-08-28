import { Storefront } from "@/components/storefront";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Produto } from "@/lib/types";

export const revalidate = 0;

export default async function Home() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("produtos").select("*").eq("ativo", true).order("id");
  return <Storefront produtos={(data ?? []) as Produto[]} erro={error?.message} />;
}
