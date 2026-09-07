import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";

const BUCKET = "fotos-perfil";
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

async function garantirBucket() {
  const admin = criarClienteAdmin();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 3 * 1024 * 1024, allowedMimeTypes: [...TIPOS] });
    if (error && !error.message.toLowerCase().includes("already")) throw error;
  }
  return admin;
}

export async function POST(request: Request) {
  try {
    const supabase = await criarClienteServidor();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta para adicionar uma foto." }, { status: 401 });
    const form = await request.formData(); const foto = form.get("foto");
    if (!(foto instanceof File)) return NextResponse.json({ erro: "Selecione uma foto." }, { status: 400 });
    if (!TIPOS.has(foto.type)) return NextResponse.json({ erro: "Use uma imagem JPG, PNG ou WebP." }, { status: 400 });
    if (foto.size > 3 * 1024 * 1024) return NextResponse.json({ erro: "A foto deve ter no máximo 3 MB." }, { status: 400 });
    const admin = await garantirBucket(); const extensao = foto.type.split("/")[1].replace("jpeg", "jpg"); const caminho = `${auth.user.id}/perfil.${extensao}`;
    const existentes = await admin.storage.from(BUCKET).list(auth.user.id);
    if (existentes.data?.length) await admin.storage.from(BUCKET).remove(existentes.data.map((item) => `${auth.user!.id}/${item.name}`));
    const { error } = await admin.storage.from(BUCKET).upload(caminho, foto, { contentType: foto.type, cacheControl: "3600", upsert: true });
    if (error) throw error;
    const { data } = admin.storage.from(BUCKET).getPublicUrl(caminho);
    const fotoUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: authError } = await supabase.auth.updateUser({ data: { ...auth.user.user_metadata, foto_url: fotoUrl } });
    if (authError) throw authError;
    return NextResponse.json({ foto_url: fotoUrl });
  } catch { return NextResponse.json({ erro: "Não foi possível salvar a foto agora." }, { status: 500 }); }
}

export async function DELETE() {
  try {
    const supabase = await criarClienteServidor(); const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const admin = await garantirBucket(); const existentes = await admin.storage.from(BUCKET).list(auth.user.id);
    if (existentes.data?.length) await admin.storage.from(BUCKET).remove(existentes.data.map((item) => `${auth.user!.id}/${item.name}`));
    const metadados = { ...auth.user.user_metadata }; delete metadados.foto_url;
    const { error } = await supabase.auth.updateUser({ data: metadados }); if (error) throw error;
    return NextResponse.json({ mensagem: "Foto removida." });
  } catch { return NextResponse.json({ erro: "Não foi possível remover a foto agora." }, { status: 500 }); }
}
