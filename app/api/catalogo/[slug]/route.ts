import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { consultationProducts, consultationImage, matchConsultationProduct } from "@/lib/consultation-products";
import { limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

// Cadastro inicial da linha demonstrativa autorizada pela loja.
// O banco gera um ID livre, sem risco de substituir cadastros existentes.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (await limiteExcedido(request, "catalogo", 12, 60)) return respostaMuitasTentativas(60);
  const { slug } = await params;
  const label = consultationProducts.find(product => product.slug === slug);
  if (!label) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  try {
    const admin = criarClienteAdmin();
    const found = await admin.from("produtos").select("*").ilike("nome", `${label.nome}%`);
    if (found.error) throw found.error;
    let product = found.data?.find(product => matchConsultationProduct(product.nome)?.slug === slug);
    if (!product) {
      const inserted = await admin.from("produtos").insert({
        nome: `${label.nome} ${label.dose}`, categoria: label.categoria,
        descricao: `${label.nome} ${label.dose}, ${label.apresentacao}, Botica Bioenergética.`,
        preco: label.precoDemonstrativo, preco_antigo: null, estoque: 100,
        imagem_url: consultationImage(label), ativo: true,
      }).select("*").single();
      if (inserted.error) throw inserted.error;
      product = inserted.data;
    }
    if (!product.ativo || product.estoque < 1) return NextResponse.json({ erro: "Produto indisponível no momento." }, { status: 409 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ erro: "Não foi possível adicionar o produto. Tente novamente em instantes." }, { status: 503 });
  }
}
