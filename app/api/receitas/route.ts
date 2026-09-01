import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail, escaparHtml } from "@/lib/email";

const tiposPermitidos = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function POST(request: Request) {
  try {
    const supabase = await criarClienteServidor();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Entre na sua conta para enviar a receita." }, { status: 401 });
    const admin = criarClienteAdmin();
    const { data: perfil } = await admin.from("perfil_clientes").select("nome,cpf,telefone,cep,rua,numero,bairro,cidade,estado").eq("usuario_id", auth.user.id).maybeSingle();
    const camposObrigatorios = [
      ["nome", "nome completo"], ["cpf", "CPF"], ["telefone", "telefone"], ["cep", "CEP"],
      ["rua", "rua"], ["numero", "número"], ["bairro", "bairro"], ["cidade", "cidade"], ["estado", "estado"],
    ] as const;
    const faltando = camposObrigatorios.filter(([campo]) => !String(perfil?.[campo] ?? "").trim()).map(([, rotulo]) => rotulo);
    if (faltando.length) return NextResponse.json({ erro: `Antes de enviar, preencha em Minha conta: ${faltando.join(", ")}.`, cadastro_incompleto: true }, { status: 400 });
    const form = await request.formData();
    const arquivo = form.get("arquivo");
    const observacao = String(form.get("observacao") ?? "").trim().slice(0, 600);
    if (!(arquivo instanceof File) || !arquivo.size) return NextResponse.json({ erro: "Selecione um arquivo." }, { status: 400 });
    if (!tiposPermitidos.has(arquivo.type)) return NextResponse.json({ erro: "Envie um arquivo PDF, JPG ou PNG." }, { status: 400 });
    if (arquivo.size > 10 * 1024 * 1024) return NextResponse.json({ erro: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });

    const bucket = "receitas-privadas";
    const { data: bucketAtual } = await admin.storage.getBucket(bucket);
    if (!bucketAtual) {
      const { error: bucketError } = await admin.storage.createBucket(bucket, { public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: [...tiposPermitidos] });
      if (bucketError && !bucketError.message.toLowerCase().includes("already")) throw bucketError;
    }
    const extensao = arquivo.type === "application/pdf" ? "pdf" : arquivo.type === "image/png" ? "png" : "jpg";
    const caminho = `${auth.user.id}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;
    const { error: uploadError } = await admin.storage.from(bucket).upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: receita, error: bancoError } = await admin.from("receitas").insert({ usuario_id: auth.user.id, arquivo_url: caminho, observacao: observacao || null, status: "em_analise" }).select("id").single();
    if (bancoError) {
      await admin.storage.from(bucket).remove([caminho]);
      if (bancoError.code === "42P01" || bancoError.message.toLowerCase().includes("receitas")) {
        return NextResponse.json({ erro: "O recebimento de receitas ainda precisa ser ativado no Supabase. Execute o arquivo supabase/receitas.sql e tente novamente." }, { status: 503 });
      }
      throw bancoError;
    }

    const emailAdmin = process.env.ADMIN_EMAIL;
    if (emailAdmin) await enviarEmail({ para: emailAdmin, assunto: `Nova receita #${receita.id} para análise`, html: `<h2>Nova receita recebida</h2><p><b>Cliente:</b> ${escaparHtml(auth.user.email)}</p><p><b>Observação:</b> ${escaparHtml(observacao || "Não informada")}</p><p>Acesse a aba Receitas no painel administrativo para visualizar o arquivo e responder.</p>` });
    return NextResponse.json({ mensagem: `Receita #${receita.id} enviada com sucesso. Nossa equipe fará a análise.` });
  } catch (error) {
    console.error("ENVIAR_RECEITA_ERRO", error);
    return NextResponse.json({ erro: "Não foi possível enviar a receita. Tente novamente." }, { status: 500 });
  }
}
