import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { consultationProducts, matchConsultationProduct, aplicarPrecoCatalogo } from "@/lib/consultation-products";
import { limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

// Consulta somente o cadastro real. Nunca cria produto nem inventa estoque.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (await limiteExcedido(request, "catalogo", 12, 60)) return respostaMuitasTentativas(60);
  const { slug } = await params;
  const label = consultationProducts.find(product => product.slug === slug);
  if (!label) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  try {
    const admin = await criarClienteServidor();
    const found = await admin.from("produtos").select("*").ilike("nome", `${label.nome}%`);
    if (found.error) throw found.error;
    const product = found.data?.find(product => matchConsultationProduct(product.nome)?.slug === slug);
    if (!product) return NextResponse.json({ erro: "Consulte a disponibilidade deste produto com a Botica." }, { status: 409 });
    if (!product.ativo || product.estoque_confirmado !== true || product.estoque < 1) return NextResponse.json({ erro: "Produto indisponível no momento." }, { status: 409 });
    return NextResponse.json(aplicarPrecoCatalogo(product));
  } catch {
    return NextResponse.json({ erro: "Não foi possível adicionar o produto. Tente novamente em instantes." }, { status: 503 });
  }
}
