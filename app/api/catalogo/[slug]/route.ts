import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { consultationProducts, consultationImage, matchConsultationProduct } from "@/lib/consultation-products";

// Cadastro inicial da linha demonstrativa autorizada pela loja.
// IDs reservados tornam cliques simultâneos idempotentes, sem alterar cadastros existentes.
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = consultationProducts.findIndex(product => product.slug === slug);
  if (index < 0) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  const label = consultationProducts[index];
  try {
    const admin = criarClienteAdmin();
    const found = await admin.from("produtos").select("*").ilike("nome", `${label.nome}%`);
    if (found.error) throw found.error;
    let product = found.data?.find(product => matchConsultationProduct(product.nome)?.slug === slug);
    if (!product) {
      const id = 810001 + index;
      const inserted = await admin.from("produtos").upsert({
        id, nome: `${label.nome} ${label.dose}`, categoria: label.categoria,
        descricao: `${label.nome} ${label.dose}, ${label.apresentacao}, Botica Bioenergética.`,
        preco: label.precoDemonstrativo, preco_antigo: null, estoque: 100,
        imagem_url: consultationImage(label), ativo: true,
      }, { onConflict: "id", ignoreDuplicates: true });
      if (inserted.error) throw inserted.error;
      const saved = await admin.from("produtos").select("*").eq("id", id).single();
      if (saved.error) throw saved.error;
      product = saved.data;
      if (matchConsultationProduct(product.nome)?.slug !== slug) throw new Error("ID já utilizado");
    }
    if (!product.ativo || product.estoque < 1) return NextResponse.json({ erro: "Produto indisponível no momento." }, { status: 409 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ erro: "Não foi possível adicionar o produto. Tente novamente em instantes." }, { status: 503 });
  }
}
