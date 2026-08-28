"use client";

import { FormEvent, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";
import type { Produto } from "@/lib/types";

export function AdminProducts({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [mensagem, setMensagem] = useState("");

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
    const { data, error } = await criarClienteSupabase().from("produtos").insert(novo).select().single();
    if (error) return setMensagem(error.message);
    setProdutos((atuais) => [...atuais, data as Produto]);
    event.currentTarget.reset();
    setMensagem("Produto cadastrado.");
  }

  async function alternar(produto: Produto) {
    const { error } = await criarClienteSupabase().from("produtos").update({ ativo: !produto.ativo }).eq("id", produto.id);
    if (error) return setMensagem(error.message);
    setProdutos((atuais) => atuais.map((p) => p.id === produto.id ? { ...p, ativo: !p.ativo } : p));
  }

  return (
    <section className="admin-page">
      <h1>Painel administrativo</h1>
      <form onSubmit={cadastrar}>
        <input name="nome" placeholder="Nome do produto" required />
        <textarea name="descricao" placeholder="Descrição" required />
        <input name="categoria" placeholder="Categoria" required />
        <input name="preco" type="number" step="0.01" placeholder="Preço" required />
        <input name="preco_antigo" type="number" step="0.01" placeholder="Preço antigo (opcional)" />
        <input name="estoque" type="number" min="0" placeholder="Estoque" required />
        <input name="imagem_url" type="url" placeholder="URL da imagem (opcional)" />
        <button>CADASTRAR PRODUTO</button>
      </form>
      <p className="form-message">{mensagem}</p>
      <div className="admin-list">
        {produtos.map((produto) => (
          <article key={produto.id}>
            <div><b>{produto.nome}</b><small>{produto.categoria} • estoque {produto.estoque}</small></div>
            <strong>R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</strong>
            <button onClick={() => alternar(produto)}>{produto.ativo ? "DESATIVAR" : "ATIVAR"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
