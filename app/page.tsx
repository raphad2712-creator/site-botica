import { Storefront } from "@/components/storefront";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Produto } from "@/lib/types";
import { comImagemCatalogo } from "@/lib/product-images";

export const revalidate = 0;

export default async function Home() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("produtos").select("*").eq("ativo", true).order("id");
  const produtos = ((data ?? []) as Produto[]).map(comImagemCatalogo);
  return <Storefront produtos={produtos} erro={error?.message} />;
}
