"use client";

import { FormEvent, useState } from "react";
import type { Produto } from "@/lib/types";
import { ProductImage } from "@/components/product-image";

export function AdminProducts({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState<number | "novo" | null>(null);

  async function lerResposta(resposta: Response) {
    const texto = await resposta.text();
    try {
      return texto ? JSON.parse(texto) : {};
    } catch {
      if (resposta.status === 404) return { erro: "A rota de cadastro não foi encontrada. Faça um novo deploy da versão atualizada na Vercel." };
      if (resposta.status >= 500) return { erro: "Erro interno na Vercel. Confira as variáveis do Supabase e os logs do deploy." };
      return { erro: `O servidor respondeu de forma inesperada (status ${resposta.status}).` };
    }
  }

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formulario = event.currentTarget;
    const form = new FormData(formulario);
    setSalvando("novo");
    setMensagem("");
    try {
      const resposta = await fetch("/api/admin/produtos", { method: "POST", credentials: "same-origin", body: form });
      const resultado = await lerResposta(resposta);
      if (!resposta.ok) return setMensagem(resultado.erro || "Não foi possível cadastrar o produto.");
      setProdutos((atuais) => [...atuais, resultado.produto as Produto]);
      formulario.reset();
      setMensagem("Produto cadastrado. Ele já aparece na loja.");
    } catch {
      setMensagem("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(null);
    }
  }

  async function alternar(produto: Produto) {
    const resposta = await fetch("/api/admin/produtos", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ id: produto.id, ativo: !produto.ativo }) });
    const resultado = await lerResposta(resposta);
    if (!resposta.ok) return setMensagem(resultado.erro || "Não foi possível alterar o produto.");
    setProdutos((atuais) => atuais.map((p) => p.id === produto.id ? resultado.produto as Produto : p));
    setMensagem("Produto atualizado.");
  }

  async function salvarProduto(event: FormEvent<HTMLFormElement>, produto: Produto) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("id", String(produto.id));
    setSalvando(produto.id);
    setMensagem("");
    try {
      const resposta = await fetch("/api/admin/produtos", {
        method: "PATCH", credentials: "same-origin", body: form,
      });
      const resultado = await lerResposta(resposta);
      if (!resposta.ok) return setMensagem(resultado.erro || "Não foi possível salvar o produto.");
      setProdutos((atuais) => atuais.map((atual) => atual.id === produto.id ? resultado.produto as Produto : atual));
      setMensagem(`Alterações de ${produto.nome} salvas e disponíveis na loja.`);
    } catch {
      setMensagem("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <section className="admin-page admin-products-panel" id="produtos-admin">
      <div className="admin-panel-heading"><div><small>CATÁLOGO</small><h2>Produtos da loja</h2><p>Cadastre, fotografe e atualize os produtos. As alterações salvas aparecem na loja.</p></div><span>{produtos.filter((produto) => produto.ativo).length} ATIVOS</span></div>
      <form className="admin-product-form" onSubmit={cadastrar}>
        <h3>Adicionar produto</h3>
        <p>Preencha os dados e escolha uma foto do aparelho. Formatos JPG, PNG ou WebP, até 3 MB.</p>
        <label>Nome do produto<input name="nome" placeholder="Ex.: Creatina Monohidratada 300g" maxLength={120} required /></label>
        <label>Categoria<input name="categoria" list="categorias-botica" placeholder="Ex.: Academia" maxLength={60} required /></label>
        <datalist id="categorias-botica"><option value="Naturais" /><option value="Academia" /><option value="Sono" /><option value="Florais" /><option value="Vitaminas" /><option value="Emagrecimento" /><option value="Beleza" /></datalist>
        <label className="admin-description">Descrição<textarea name="descricao" placeholder="Composição, apresentação, modo de uso e informações da loja" maxLength={4000} required /></label>
        <label>Preço (R$)<input name="preco" type="number" min="0.01" step="0.01" placeholder="55,90" required /></label>
        <label>Preço anterior (opcional)<input name="preco_antigo" type="number" min="0.01" step="0.01" placeholder="Se houver promoção" /></label>
        <label>Quantidade em estoque<input name="estoque" type="number" min="0" max="100000" step="1" placeholder="15" required /></label>
        <label className="admin-photo-field">Foto do produto<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
        <p className="admin-measures-hint">Medidas para calcular o frete com a transportadora. Você pode preenchê-las depois em Editar.</p>
        <label>Peso (kg)<input name="peso_kg" type="number" min="0.001" step="0.001" placeholder="Ex.: 0.300" /></label>
        <label>Altura (cm)<input name="altura_cm" type="number" min="0.1" step="0.1" placeholder="Ex.: 12" /></label>
        <label>Largura (cm)<input name="largura_cm" type="number" min="0.1" step="0.1" placeholder="Ex.: 10" /></label>
        <label>Comprimento (cm)<input name="comprimento_cm" type="number" min="0.1" step="0.1" placeholder="Ex.: 15" /></label>
        <button disabled={salvando !== null}>{salvando === "novo" ? "SALVANDO PRODUTO..." : "ADICIONAR À LOJA"}</button>
      </form>
      {mensagem && <p className="form-message" role="status">{mensagem}</p>}
      <h3 className="admin-products-list-heading">Produtos cadastrados <span>{produtos.length}</span></h3>
      <div className="admin-list admin-product-list">
        {produtos.map((produto) => (
          <article key={produto.id}>
            <div className="admin-product-thumb"><ProductImage nome={produto.nome} imagemAtual={produto.imagem_url} /></div>
            <div><b>{produto.nome}</b><small>{produto.categoria} • {produto.estoque_confirmado ? `${produto.estoque} unidades conferidas` : "Estoque precisa de conferência"}</small><em className={produto.ativo ? "is-active" : "is-inactive"}>{produto.ativo ? "Ativo" : "Inativo"}</em></div>
            <strong>R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</strong>
            <button type="button" disabled={salvando !== null} onClick={() => alternar(produto)}>{produto.ativo ? "DESATIVAR" : "ATIVAR"}</button>
            <details className="admin-product-edit"><summary>Editar foto e informações</summary>
              <form onSubmit={(event) => salvarProduto(event, produto)}>
                <label>Nome<input name="nome" defaultValue={produto.nome} maxLength={120} required /></label>
                <label>Categoria<input name="categoria" defaultValue={produto.categoria} list="categorias-botica" maxLength={60} required /></label>
                <label className="admin-description">Descrição<textarea name="descricao" defaultValue={produto.descricao} maxLength={4000} required /></label>
                <label>Preço (R$)<input name="preco" type="number" min="0.01" step="0.01" defaultValue={produto.preco} required /></label>
                <label>Preço anterior (opcional)<input name="preco_antigo" type="number" min="0.01" step="0.01" defaultValue={produto.preco_antigo ?? ""} /></label>
                <label>Estoque<input name="estoque" type="number" min="0" max="100000" step="1" defaultValue={produto.estoque} required /></label>
                <label className="admin-photo-field">Trocar foto (opcional)<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                <label>Peso (kg)<input name="peso_kg" type="number" min="0.001" step="0.001" defaultValue={produto.peso_kg ?? ""} /></label>
                <label>Altura (cm)<input name="altura_cm" type="number" min="0.1" step="0.1" defaultValue={produto.altura_cm ?? ""} /></label>
                <label>Largura (cm)<input name="largura_cm" type="number" min="0.1" step="0.1" defaultValue={produto.largura_cm ?? ""} /></label>
                <label>Comprimento (cm)<input name="comprimento_cm" type="number" min="0.1" step="0.1" defaultValue={produto.comprimento_cm ?? ""} /></label>
                <button disabled={salvando !== null}>{salvando === produto.id ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</button>
              </form>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
