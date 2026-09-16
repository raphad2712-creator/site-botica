import { Icon } from "@/components/ui-icon";
import { notFound } from "next/navigation";
import { AddProduct } from "@/components/add-product";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Produto } from "@/lib/types";
import Link from "next/link";
import { comImagemCatalogo } from "@/lib/product-images";
import { ProductImage } from "@/components/product-image";
import { consultationProducts, matchConsultationProduct } from "@/lib/consultation-products";
import { ConsultationProductPage } from "@/components/consultation-product-page";
import { ProductInformation } from "@/components/product-information";
import { ProductArtwork } from "@/components/product-artwork";
import { ShippingCalculator } from "@/components/shipping-calculator";

const moeda = (valor: number) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rotulo = consultationProducts.find((product) => product.slug === id);
  if (!rotulo && !/^\d+$/.test(id)) notFound();
  let data: Produto | null = null;
  if (rotulo) {
    // Se a loja cadastrar esta apresentação, o mesmo link passa a exibir
    // seu preço, estoque e botão de compra reais, sem duplicar o produto.
    try {
      const supabase = await criarClienteServidor();
      const { data: cadastrados } = await supabase.from("produtos").select("*").eq("ativo", true).ilike("nome", `${rotulo.nome}%`);
      data = (cadastrados as Produto[] | null)?.find((product) => matchConsultationProduct(product.nome)?.slug === rotulo.slug) ?? null;
    } catch { /* O rótulo continua disponível durante uma falha de conexão. */ }
    if (!data) return <ConsultationProductPage produto={rotulo} />;
  } else {
    const supabase = await criarClienteServidor();
    const result = await supabase.from("produtos").select("*").eq("id", id).eq("ativo", true).single();
    data = result.data;
  }
  if (!data) notFound();
  const produto = comImagemCatalogo(data as Produto);
  const informacoes = rotulo ?? matchConsultationProduct(produto.nome);

  return (
    <><nav className="product-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>›</span><Link href={`/?categoria=${encodeURIComponent(produto.categoria)}#produtos`}>{produto.categoria}</Link><span>›</span><b>{produto.nome}</b></nav><section className="product-page">
      {informacoes ? <ProductArtwork produto={informacoes} /> : <div className="product-page-visual">
        <ProductImage nome={produto.nome} imagemAtual={produto.imagem_url} />
      </div>}
      <div className="product-info">
        <small>{produto.categoria}</small>
        <h1>{produto.nome}</h1>
        <p>{produto.descricao}</p>
        {produto.preco_antigo && <del>{moeda(produto.preco_antigo)}</del>}
        <strong>{moeda(produto.preco)}</strong>
        <span>{produto.estoque} unidades disponíveis</span>
        <AddProduct produto={produto} />
        <ShippingCalculator subtotal={Number(produto.preco)} produtoId={Number(produto.id)} />
        <div className="product-benefits"><span><b><Icon name="check" /></b> Compra segura</span><span><b><Icon name="truck" /></b> Frete calculado pelo CEP</span><span><b><Icon name="heart" /></b> Cuidado selecionado</span></div>
        <div className="care-note">
          <b>Informação importante</b>
          <p>Confira o rótulo e procure orientação profissional quando necessário. Medicamentos manipulados exigem avaliação da farmácia.</p>
        </div>
      </div>
    </section>{informacoes && <ProductInformation produto={informacoes} descricao={produto.descricao} />}</>
  );
}
