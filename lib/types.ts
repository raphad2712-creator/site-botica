export type Produto = {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  preco_antigo: number | null;
  estoque: number;
  imagem_url: string | null;
  ativo: boolean;
};

export type ItemCarrinho = Produto & { quantidade: number };
