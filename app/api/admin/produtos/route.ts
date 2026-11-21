import { randomUUID } from "node:crypto";
import { usuarioAdminAutorizado } from "@/lib/admin-access";
import { assinaturaArquivoValida } from "@/lib/security";
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

const BUCKET = "fotos-produtos";
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const LIMITE_FOTO = 3 * 1024 * 1024;

async function autenticarAdmin() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { erro: NextResponse.json({ erro: "Faça login como administrador." }, { status: 401 }) };
  if (!await usuarioAdminAutorizado(auth.user, supabase)) return { erro: NextResponse.json({ erro: "Sua conta não possui acesso administrativo." }, { status: 403 }) };
  return { admin: criarClienteAdmin() };
}

function texto(valor: unknown, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite) : "";
}

function dadosProduto(body: Record<string, unknown>) {
  const nome = texto(body.nome, 120);
  const descricao = texto(body.descricao, 4000);
  const categoria = texto(body.categoria, 60);
  const preco = Number(body.preco);
  const precoAntigo = body.preco_antigo === "" || body.preco_antigo == null ? null : Number(body.preco_antigo);
  const estoque = Number(body.estoque);
  const medida = (valor: unknown) => valor === "" || valor == null ? null : Number(valor);
  const peso = medida(body.peso_kg);
  const altura = medida(body.altura_cm);
  const largura = medida(body.largura_cm);
  const comprimento = medida(body.comprimento_cm);
  if (!nome || !descricao || !categoria || !Number.isFinite(preco) || preco <= 0 || preco > 1000000 ||
    (precoAntigo !== null && (!Number.isFinite(precoAntigo) || precoAntigo <= 0 || precoAntigo > 1000000)) ||
    !Number.isInteger(estoque) || estoque < 0 || estoque > 100000 ||
    [peso, altura, largura, comprimento].some((valor) => valor !== null && (!Number.isFinite(valor) || valor <= 0 || valor > 10000))) return null;
  return { nome, descricao, categoria, preco, preco_antigo: precoAntigo, estoque, estoque_confirmado: true,
    peso_kg: peso, altura_cm: altura, largura_cm: largura, comprimento_cm: comprimento };
}

async function receberDados(request: Request) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return { body: await request.json() as Record<string, unknown>, foto: null as File | null };
  }
  const form = await request.formData();
  const foto = form.get("foto");
  return { body: Object.fromEntries(form.entries()) as Record<string, unknown>, foto: foto instanceof File && foto.size ? foto : null };
}

async function enviarFoto(admin: ReturnType<typeof criarClienteAdmin>, foto: File) {
  if (!TIPOS.has(foto.type) || foto.size > LIMITE_FOTO || !await assinaturaArquivoValida(foto)) {
    throw new Error("FOTO_INVALIDA");
  }
  const { data: existente } = await admin.storage.getBucket(BUCKET);
  if (!existente) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true, fileSizeLimit: LIMITE_FOTO, allowedMimeTypes: [...TIPOS],
    });
    if (error && !error.message.toLowerCase().includes("already")) throw error;
  }
  const extensao = foto.type === "image/jpeg" ? "jpg" : foto.type.split("/")[1];
  const caminho = `${randomUUID()}.${extensao}`;
  const bucket = admin.storage.from(BUCKET);
  const { error } = await bucket.upload(caminho, foto, { contentType: foto.type, cacheControl: "3600", upsert: false });
  if (error) throw error;
  return { caminho, url: bucket.getPublicUrl(caminho).data.publicUrl };
}

async function removerFoto(admin: ReturnType<typeof criarClienteAdmin>, caminho: string) {
  await admin.storage.from(BUCKET).remove([caminho]);
}

function caminhoFotoPropria(url: string | null | undefined) {
  if (!url) return null;
  const prefixo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefixo)) return null;
  const caminho = url.slice(prefixo.length);
  return /^[a-f\d-]{36}\.(jpg|png|webp)$/.test(caminho) ? caminho : null;
}

export async function POST(request: Request) {
  try {
    const acesso = await autenticarAdmin();
    if (acesso.erro) return acesso.erro;
    const { body, foto } = await receberDados(request);
    const produto = dadosProduto(body);
    if (!produto) return NextResponse.json({ erro: "Confira nome, descrição, preço, estoque e medidas do produto." }, { status: 400 });
    let imagem: Awaited<ReturnType<typeof enviarFoto>> | null = null;
    try {
      if (foto) imagem = await enviarFoto(acesso.admin, foto);
      const { data, error } = await acesso.admin.from("produtos").insert({ ...produto, imagem_url: imagem?.url ?? null, ativo: true }).select().single();
      if (error) throw error;
      return NextResponse.json({ mensagem: "Produto cadastrado com sucesso.", produto: data }, { status: 201 });
    } catch (erro) {
      if (imagem) await removerFoto(acesso.admin, imagem.caminho).catch(() => {});
      if (erro instanceof Error && erro.message === "FOTO_INVALIDA") return NextResponse.json({ erro: "Use uma foto JPG, PNG ou WebP de até 3 MB." }, { status: 400 });
      throw erro;
    }
  } catch (erro) {
    console.error("CADASTRAR_PRODUTO", erro);
    return NextResponse.json({ erro: "Não foi possível cadastrar o produto." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const acesso = await autenticarAdmin();
    if (acesso.erro) return acesso.erro;
    const { body, foto } = await receberDados(request);
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ erro: "Produto inválido." }, { status: 400 });
    const admin = acesso.admin;
    if (typeof body.ativo === "boolean") {
      const { data, error } = await admin.from("produtos").update({ ativo: body.ativo }).eq("id", id).select().single();
      if (error) return NextResponse.json({ erro: "Não foi possível alterar o produto." }, { status: 500 });
      return NextResponse.json({ produto: data });
    }
    const produto = dadosProduto(body);
    if (!produto) return NextResponse.json({ erro: "Confira nome, descrição, preço, estoque e medidas do produto." }, { status: 400 });
    const { data: anterior, error: erroAnterior } = await admin.from("produtos").select("imagem_url").eq("id", id).single();
    if (erroAnterior) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    let imagem: Awaited<ReturnType<typeof enviarFoto>> | null = null;
    try {
      if (foto) imagem = await enviarFoto(admin, foto);
      const { data, error } = await admin.from("produtos").update({ ...produto, ...(imagem ? { imagem_url: imagem.url } : {}) }).eq("id", id).select().single();
      if (error) throw error;
      if (imagem) {
        const caminhoAnterior = caminhoFotoPropria(anterior.imagem_url);
        if (caminhoAnterior) await removerFoto(admin, caminhoAnterior).catch(() => {});
      }
      return NextResponse.json({ mensagem: "Produto atualizado.", produto: data });
    } catch (erro) {
      if (imagem) await removerFoto(admin, imagem.caminho).catch(() => {});
      if (erro instanceof Error && erro.message === "FOTO_INVALIDA") return NextResponse.json({ erro: "Use uma foto JPG, PNG ou WebP de até 3 MB." }, { status: 400 });
      throw erro;
    }
  } catch (erro) {
    console.error("ATUALIZAR_PRODUTO", erro);
    return NextResponse.json({ erro: "Não foi possível atualizar o produto." }, { status: 500 });
  }
}
