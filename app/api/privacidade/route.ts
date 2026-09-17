import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { limiteExcedido, respostaMuitasTentativas } from "@/lib/security";
import { enviarEmail, escaparHtml } from "@/lib/email";

const tipos = new Set(["acesso", "correcao", "eliminacao", "portabilidade", "revogacao", "oposicao", "outro"]);

export async function GET(request: Request) {
  if (await limiteExcedido(request, "exportacao-lgpd", 3, 3600)) return respostaMuitasTentativas(3600);
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na conta para acessar seus dados." }, { status: 401 });
  const [perfil, enderecos, pedidos, receitas, solicitacoes] = await Promise.all([
    supabase.from("perfil_clientes").select("nome,cpf,telefone,nascimento,genero,cep,rua,numero,complemento,bairro,cidade,estado,atualizado_em").eq("usuario_id", auth.user.id).maybeSingle(),
    supabase.from("enderecos").select("id,cep,rua,numero,complemento,bairro,cidade,estado,criado_em").eq("usuario_id", auth.user.id),
    supabase.from("pedidos").select("id,total,frete,status,transportadora,codigo_rastreio,status_entrega,criado_em,itens_pedido(quantidade,preco_unitario,produto_id)").eq("usuario_id", auth.user.id),
    supabase.from("receitas").select("id,observacao,resposta_admin,status,status_entrega,criado_em").eq("usuario_id", auth.user.id),
    supabase.from("solicitacoes_pos_venda").select("id,pedido_id,tipo,motivo,detalhes,status,resposta_admin,criado_em,atualizado_em").eq("usuario_id", auth.user.id),
  ]);
  let newsletter: { data: unknown } = { data: null };
  if (auth.user.email) {
    const admin = criarClienteAdmin();
    const completa = await admin.from("newsletter_inscritos").select("email,ativo,consentimento_em,politica_versao,cancelado_em").eq("email", auth.user.email.toLowerCase()).maybeSingle();
    newsletter = completa.error ? await admin.from("newsletter_inscritos").select("email,ativo").eq("email", auth.user.email.toLowerCase()).maybeSingle() : completa;
  }
  const exportacao = { gerado_em: new Date().toISOString(), conta: { id: auth.user.id, email: auth.user.email, criado_em: auth.user.created_at }, perfil: perfil.data, enderecos: enderecos.data ?? [], pedidos: pedidos.data ?? [], receitas: receitas.data ?? [], pos_venda: solicitacoes.data ?? [], newsletter: newsletter.data };
  return new NextResponse(JSON.stringify(exportacao, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=meus-dados-botica.json", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (await limiteExcedido(request, "solicitacao-lgpd", 5, 86400)) return respostaMuitasTentativas(86400);
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ erro: "Entre na conta para enviar a solicitação." }, { status: 401 });
  const body = await request.json();
  const tipo = String(body.tipo ?? "");
  const detalhes = String(body.detalhes ?? "").trim().slice(0, 2000);
  if (!tipos.has(tipo) || detalhes.length < 10) return NextResponse.json({ erro: "Escolha o direito e descreva sua solicitação." }, { status: 400 });
  const { data, error } = await supabase.from("solicitacoes_lgpd").insert({ usuario_id: auth.user.id, tipo, detalhes }).select("id,status,criado_em").single();
  if (error) return NextResponse.json({ erro: "A Central de Privacidade precisa ser ativada no banco de dados." }, { status: 503 });
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_REMETENTE;
  if (adminEmail) await enviarEmail({ para: adminEmail, assunto: `Solicitação LGPD #${data.id}`, html: `<h2>Nova solicitação de privacidade</h2><p><b>Tipo:</b> ${escaparHtml(tipo)}</p><p><b>Titular:</b> ${escaparHtml(auth.user.email)}</p><p><b>Detalhes:</b> ${escaparHtml(detalhes)}</p><p>A solicitação foi registrada no Supabase com o protocolo #${data.id}.</p>` });
  if (auth.user.email) await enviarEmail({ para: auth.user.email, assunto: `Recebemos sua solicitação de privacidade #${data.id}`, html: `<h2>Solicitação recebida</h2><p>Seu pedido sobre <b>${escaparHtml(tipo)}</b> foi registrado com o protocolo <b>#${data.id}</b>.</p><p>A Botica poderá solicitar informações adicionais para confirmar sua identidade.</p>` });
  return NextResponse.json({ mensagem: "Solicitação registrada. A Botica fará a verificação de identidade antes do atendimento.", solicitacao: data }, { status: 201 });
}
