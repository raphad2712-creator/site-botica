import { notFound } from "next/navigation";
import { AddProduct } from "@/components/add-product";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Produto } from "@/lib/types";
import Link from "next/link";
import { comImagemCatalogo, imagemCatalogoEscura } from "@/lib/product-images";

const moeda = (valor: number) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("produtos").select("*").eq("id", id).single();
  if (!data) notFound();
  const produto = comImagemCatalogo(data as Produto);
  const imagemEscura = imagemCatalogoEscura(produto.nome);

  return (
    <><nav className="product-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>›</span><Link href={`/?categoria=${encodeURIComponent(produto.categoria)}#produtos`}>{produto.categoria}</Link><span>›</span><b>{produto.nome}</b></nav><section className="product-page">
      <div className="product-page-visual">
        {produto.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <>
            <img className={imagemEscura ? "product-image-light catalog-product-image" : "catalog-product-image"} src={produto.imagem_url} alt={produto.nome} />
            {imagemEscura && <img className="product-image-dark catalog-product-image" src={imagemEscura} alt="" aria-hidden="true" />}
          </>
        ) : (
          <div className="bottle large"><i /><b>BOTICA</b><small>{produto.categoria}</small></div>
        )}
      </div>
      <div className="product-info">
        <small>{produto.categoria}</small>
        <h1>{produto.nome}</h1>
        <p>{produto.descricao}</p>
        {produto.preco_antigo && <del>{moeda(produto.preco_antigo)}</del>}
        <strong>{moeda(produto.preco)}</strong>
        <span>{produto.estoque} unidades disponíveis</span>
        <AddProduct produto={produto} />
        <div className="product-benefits"><span><b>✓</b> Compra segura</span><span><b>↗</b> Frete calculado no checkout</span><span><b>♡</b> Cuidado selecionado</span></div>
        <div className="care-note">
          <b>Informação importante</b>
          <p>Confira o rótulo e procure orientação profissional quando necessário. Medicamentos manipulados exigem avaliação da farmácia.</p>
        </div>
      </div>
    </section></>
  );
}
