import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

const memoria = new Map<string, { quantidade: number; expiraEm: number }>();

function ipDaRequisicao(request: Request) {
  // A Vercel sobrescreve este cabeçalho. Não aceitar cf-connecting-ip enviado pelo visitante.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}

export async function limiteExcedido(request: Request, escopo: string, limite: number, janelaSegundos: number) {
  const segredo = process.env.RATE_LIMIT_SECRET || process.env.PAGBANK_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!segredo) return true;
  const identificador = createHash("sha256").update(`${segredo}:${escopo}:${ipDaRequisicao(request)}`).digest("hex");
  try {
    const { data, error } = await criarClienteAdmin().rpc("consumir_limite_api", {
      p_chave: identificador,
      p_limite: limite,
      p_janela_segundos: janelaSegundos,
    });
    if (!error && typeof data === "boolean") return !data;
  } catch { /* Sem banco, produção falha fechada para não permitir abuso entre instâncias. */ }
  if (process.env.NODE_ENV === "production") return true;

  const agora = Date.now();
  // Bound the serverless fallback even under requests from many different IPs.
  if (memoria.size >= 5000) {
    for (const [chave, valor] of memoria) if (valor.expiraEm <= agora) memoria.delete(chave);
    if (memoria.size >= 5000 && !memoria.has(identificador)) return true;
  }
  const atual = memoria.get(identificador);
  if (!atual || atual.expiraEm <= agora) {
    memoria.set(identificador, { quantidade: 1, expiraEm: agora + janelaSegundos * 1000 });
    return false;
  }
  atual.quantidade++;
  return atual.quantidade > limite;
}

/** Consulta de frete: se o limitador compartilhado falhar, usa limite local para manter a cotação disponível. */
export async function limiteFreteExcedido(request: Request) {
  const escopo = "frete";
  const limite = 30;
  const janelaSegundos = 60;
  const segredo = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const identificador = createHash("sha256").update(`${segredo || "frete"}:${escopo}:${ipDaRequisicao(request)}`).digest("hex");
  if (segredo) {
    try {
      const { data, error } = await criarClienteAdmin().rpc("consumir_limite_api", {
        p_chave: identificador, p_limite: limite, p_janela_segundos: janelaSegundos,
      });
      if (!error && typeof data === "boolean") return !data;
    } catch { /* A cotação pública usa o limite local abaixo. */ }
  }
  const agora = Date.now();
  if (memoria.size >= 5000) {
    for (const [chave, valor] of memoria) if (valor.expiraEm <= agora) memoria.delete(chave);
    if (memoria.size >= 5000 && !memoria.has(identificador)) return true;
  }
  const atual = memoria.get(identificador);
  if (!atual || atual.expiraEm <= agora) {
    memoria.set(identificador, { quantidade: 1, expiraEm: agora + janelaSegundos * 1000 });
    return false;
  }
  atual.quantidade++;
  return atual.quantidade > limite;
}

export function respostaMuitasTentativas(segundos = 60) {
  return NextResponse.json({ erro: "Muitas tentativas. Aguarde um pouco e tente novamente." }, {
    status: 429,
    headers: { "Retry-After": String(segundos), "Cache-Control": "no-store" },
  });
}

export function emailValido(valor: unknown) {
  const email = String(valor ?? "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function assinaturaArquivoValida(arquivo: File) {
  const bytes = new Uint8Array(await arquivo.slice(0, 16).arrayBuffer());
  const comeca = (...assinatura: number[]) => assinatura.every((byte, indice) => bytes[indice] === byte);
  if (arquivo.type === "application/pdf") return comeca(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (arquivo.type === "image/png") return comeca(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (arquivo.type === "image/jpeg") return comeca(0xff, 0xd8, 0xff);
  if (arquivo.type === "image/webp") return comeca(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}
