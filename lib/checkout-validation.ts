export type ItemRecebido = { produto_id: number; quantidade: number };

/** Consolidate duplicate lines BEFORE checking stock and calculating shipping. */
export function validarItens(value: unknown): ItemRecebido[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new Error("Informe de 1 a 100 itens no carrinho.");
  const items = new Map<number, number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || !Number.isSafeInteger(item.produto_id) || item.produto_id < 1 || !Number.isSafeInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 100) {
      throw new Error("Produto ou quantidade inválidos. Use quantidades inteiras de 1 a 100.");
    }
    const quantity = (items.get(item.produto_id) ?? 0) + item.quantidade;
    if (quantity > 100) throw new Error("O limite é de 100 unidades por produto.");
    items.set(item.produto_id, quantity);
  }
  return [...items].map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
}

const limites = { nome: 120, email: 254, cpf: 18, telefone: 25, cep: 10, rua: 160, numero: 20, complemento: 120, bairro: 90, cidade: 90, estado: 2 };
export function cpfValido(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export function validarCliente(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Preencha os dados de entrega.");
  const cliente = {} as Record<keyof typeof limites, string>;
  for (const [campo, limite] of Object.entries(limites)) {
    const dado = (value as Record<string, unknown>)[campo] ?? "";
    if (typeof dado !== "string" || dado.trim().length > limite) throw new Error("Confira o tamanho dos dados do comprador e do endereço.");
    cliente[campo as keyof typeof limites] = dado.trim();
  }
  if (cliente.nome.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email) || !cpfValido(cliente.cpf)) {
    throw new Error("Informe seu nome, um e-mail válido e um CPF válido.");
  }
  if (![cliente.rua, cliente.numero, cliente.bairro, cliente.cidade].every(Boolean) || !/^\d{5}-?\d{3}$/.test(cliente.cep) || !/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i.test(cliente.estado)) {
    throw new Error("Confira o CEP e preencha o endereço de entrega completo, com a sigla do estado.");
  }
  return cliente;
}
