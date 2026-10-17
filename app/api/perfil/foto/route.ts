import { randomUUID } from "node:crypto";
import { caminhoFotoPerfil } from "@/lib/profile-photo";
import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { assinaturaArquivoValida, limiteExcedido, respostaMuitasTentativas } from "@/lib/security";

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
    if (await limiteExcedido(request, "foto-perfil", 6, 3600)) return respostaMuitasTentativas(3600);
    const supabase = await criarClienteServidor();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta para adicionar uma foto." }, { status: 401 });
    const form = await request.formData(); const foto = form.get("foto");
    if (!(foto instanceof File)) return NextResponse.json({ erro: "Selecione uma foto." }, { status: 400 });
    if (!TIPOS.has(foto.type)) return NextResponse.json({ erro: "Use uma imagem JPG, PNG ou WebP." }, { status: 400 });
    if (!foto.size || foto.size > 3 * 1024 * 1024) return NextResponse.json({ erro: "A foto deve ter no máximo 3 MB." }, { status: 400 });
    if (!await assinaturaArquivoValida(foto)) return NextResponse.json({ erro: "O conteúdo da imagem não corresponde ao formato informado." }, { status: 400 });
    const admin = await garantirBucket();
    const extensao = foto.type === "image/jpeg" ? "jpg" : foto.type.split("/")[1];
    const caminho = `${auth.user.id}/${randomUUID()}.${extensao}`;
    const anterior = caminhoFotoPerfil(auth.user.user_metadata.foto_url, process.env.NEXT_PUBLIC_SUPABASE_URL, auth.user.id);
    const bucket = admin.storage.from(BUCKET);
    // Preserve the previous photo until the upload AND the profile update succeed.
    const { error } = await bucket.upload(caminho, foto, { contentType: foto.type, cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = bucket.getPublicUrl(caminho);
    const fotoUrl = data.publicUrl;
    const { error: authError } = await supabase.auth.updateUser({ data: { foto_url: fotoUrl } });
    if (authError) {
      await bucket.remove([caminho]).catch(() => {});
      throw authError;
    }
    if (anterior) await bucket.remove([anterior]).catch(() => {});
    return NextResponse.json({ foto_url: fotoUrl });
  } catch { return NextResponse.json({ erro: "Não foi possível salvar a foto agora." }, { status: 500 }); }
}

export async function DELETE() {
  try {
    const supabase = await criarClienteServidor(); const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const anterior = caminhoFotoPerfil(auth.user.user_metadata.foto_url, process.env.NEXT_PUBLIC_SUPABASE_URL, auth.user.id);
    if (anterior) {
      const { error } = await criarClienteAdmin().storage.from(BUCKET).remove([anterior]);
      if (error) throw error;
    }
    // Metadata updates merge keys; explicitly clear the photo instead of omitting it.
    const { error } = await supabase.auth.updateUser({ data: { foto_url: null } });
    if (error) throw error;
    return NextResponse.json({ mensagem: "Foto removida." });
  } catch { return NextResponse.json({ erro: "Não foi possível remover a foto agora." }, { status: 500 }); }
}
