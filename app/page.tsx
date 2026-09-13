import { Storefront } from "@/components/storefront";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Produto } from "@/lib/types";
import { comImagemCatalogo } from "@/lib/product-images";

export const revalidate = 0;

export default async function Home() {
  let produtos: Produto[] = [];
  let erro: string | undefined;
  try {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase.from("produtos").select("*").eq("ativo", true).order("id");
    produtos = ((data ?? []) as Produto[]).map(comImagemCatalogo);
    erro = error?.message;
  } catch {
    erro = "Catálogo temporariamente indisponível";
  }
  return <Storefront produtos={produtos} erro={erro} />;
}
