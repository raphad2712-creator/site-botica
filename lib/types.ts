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
  peso_kg: number | null;
  altura_cm: number | null;
  largura_cm: number | null;
  comprimento_cm: number | null;
};

export type ItemCarrinho = Produto & { quantidade: number };
