"use client";

import { FormEvent, useState } from "react";
import type { Produto } from "@/lib/types";

export function AdminProducts({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const novo = {
      nome: String(form.get("nome")),
      descricao: String(form.get("descricao")),
      categoria: String(form.get("categoria")),
      preco: Number(form.get("preco")),
      preco_antigo: form.get("preco_antigo") ? Number(form.get("preco_antigo")) : null,
      estoque: Number(form.get("estoque")),
      imagem_url: String(form.get("imagem_url") || "") || null,
      ativo: true,
    };
    setSalvando(true);
    setMensagem("");
    try {
      const resposta = await fetch("/api/admin/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novo) });
      const resultado = await resposta.json();
      if (!resposta.ok) return setMensagem(resultado.erro || "Não foi possível cadastrar o produto.");
      setProdutos((atuais) => [...atuais, resultado.produto as Produto]);
      event.currentTarget.reset();
      setMensagem("Produto cadastrado com sucesso.");
    } catch {
      setMensagem("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternar(produto: Produto) {
    const resposta = await fetch("/api/admin/produtos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: produto.id, ativo: !produto.ativo }) });
    const resultado = await resposta.json();
    if (!resposta.ok) return setMensagem(resultado.erro || "Não foi possível alterar o produto.");
    setProdutos((atuais) => atuais.map((p) => p.id === produto.id ? resultado.produto as Produto : p));
    setMensagem("Produto atualizado.");
  }

  return (
    <section className="admin-page admin-products-panel" id="produtos-admin">
      <div className="admin-panel-heading"><div><small>CATÁLOGO</small><h2>Produtos da loja</h2><p>Cadastre produtos novos e escolha quais ficam disponíveis para compra.</p></div><span>{produtos.filter((produto) => produto.ativo).length} ATIVOS</span></div>
      <form className="admin-product-form" onSubmit={cadastrar}>
        <label>Nome do produto<input name="nome" placeholder="Ex.: Creatina Monohidratada 300g" required /></label>
        <label>Categoria<input name="categoria" placeholder="Ex.: Academia" required /></label>
        <label className="admin-description">Descrição<textarea name="descricao" placeholder="Descreva os principais detalhes do produto" required /></label>
        <label>Preço atual<input name="preco" type="number" step="0.01" placeholder="0,00" required /></label>
        <label>Preço anterior<input name="preco_antigo" type="number" step="0.01" placeholder="Opcional" /></label>
        <label>Quantidade em estoque<input name="estoque" type="number" min="0" placeholder="0" required /></label>
        <label>Imagem do produto<input name="imagem_url" type="url" placeholder="Cole a URL da imagem (opcional)" /></label>
        <button disabled={salvando}>{salvando ? "CADASTRANDO..." : "+ CADASTRAR PRODUTO"}</button>
      </form>
      <p className="form-message">{mensagem}</p>
      <div className="admin-list admin-product-list">
        {produtos.map((produto) => (
          <article key={produto.id}>
            <div className="admin-product-thumb">{produto.imagem_url ? <img src={produto.imagem_url} alt="" /> : <span>BOTICA</span>}</div>
            <div><b>{produto.nome}</b><small>{produto.categoria} • {produto.estoque} unidades</small><em className={produto.ativo ? "is-active" : "is-inactive"}>{produto.ativo ? "Ativo" : "Inativo"}</em></div>
            <strong>R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</strong>
            <button onClick={() => alternar(produto)}>{produto.ativo ? "DESATIVAR" : "ATIVAR"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
