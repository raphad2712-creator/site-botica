import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail, escaparHtml } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await criarClienteServidor();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ erro: "Faça login como administrador." }, { status: 401 });
    const { data: perfil } = await supabase.from("perfis").select("funcao").eq("id", auth.user.id).maybeSingle();
    if (perfil?.funcao !== "admin") return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });

    const body = await request.json();
    const assunto = String(body.assunto ?? "").trim().slice(0, 120);
    const titulo = String(body.titulo ?? "").trim().slice(0, 120);
    const mensagem = String(body.mensagem ?? "").trim().slice(0, 4000);
    const textoBotao = String(body.texto_botao ?? "").trim().slice(0, 40);
    const linkBotao = String(body.link_botao ?? "").trim();
    if (!assunto || !titulo || !mensagem) return NextResponse.json({ erro: "Preencha assunto, título e mensagem." }, { status: 400 });
    if (linkBotao && !/^https:\/\//i.test(linkBotao)) return NextResponse.json({ erro: "O link do botão precisa começar com https://" }, { status: 400 });

    const admin = criarClienteAdmin();
    const { data: inscritos, error } = await admin.from("newsletter_inscritos").select("email").eq("ativo", true).limit(300);
    if (error) throw error;
    if (!inscritos?.length) return NextResponse.json({ erro: "Não existem inscritos ativos." }, { status: 400 });
    const conteudo = escaparHtml(mensagem).replaceAll("\n", "<br />");
    const botao = textoBotao && linkBotao ? `<p style="margin:28px 0"><a href="${escaparHtml(linkBotao)}" style="padding:14px 22px;background:#14503c;color:#fff;text-decoration:none;border-radius:24px;font-weight:bold">${escaparHtml(textoBotao)}</a></p>` : "";
    const html = `<div style="max-width:620px;margin:auto;font-family:Arial;color:#33483e"><div style="padding:25px;background:#14503c;color:#fff"><b>BOTICA BIOENERGÉTICA</b></div><div style="padding:30px;border:1px solid #dfe8e2"><h1 style="font-family:Georgia;color:#14503c">${escaparHtml(titulo)}</h1><p style="line-height:1.7">${conteudo}</p>${botao}<hr style="border:0;border-top:1px solid #e3e9e5;margin:28px 0"><small>Você recebeu esta mensagem porque se cadastrou para receber novidades da Botica. Para deixar de receber, responda este e-mail solicitando o cancelamento.</small></div></div>`;
    let enviados = 0; let falhas = 0;
    for (let inicio = 0; inicio < inscritos.length; inicio += 10) {
      const lote = inscritos.slice(inicio, inicio + 10);
      const resultados = await Promise.all(lote.map((item) => enviarEmail({ para: item.email, assunto, html })));
      resultados.forEach((resultado) => resultado.enviado ? enviados++ : falhas++);
    }
    if (!enviados) return NextResponse.json({ erro: "Nenhum e-mail foi enviado. Verifique BREVO_API_KEY e EMAIL_REMETENTE na Vercel." }, { status: 500 });
    return NextResponse.json({ mensagem: `Comunicado enviado para ${enviados} inscrito${enviados === 1 ? "" : "s"}.${falhas ? ` ${falhas} envio(s) falharam.` : ""}` });
  } catch (error) {
    console.error("ADMIN_NEWSLETTER_ERRO", error);
    return NextResponse.json({ erro: "Não foi possível enviar o comunicado." }, { status: 500 });
  }
}
