type Email = { para: string; assunto: string; html: string };

export function escaparHtml(valor: unknown) {
  return String(valor ?? "").replace(/[&<>'"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[caractere] || caractere);
}

export async function enviarEmail({ para, assunto, html }: Email) {
  const apiKey = process.env.BREVO_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;
  if (!apiKey || !remetente) return { enviado: false, motivo: "EMAIL_NAO_CONFIGURADO" };

  const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: "Botica Bioenergética", email: remetente },
      to: [{ email: para }],
      subject: assunto,
      htmlContent: html,
    }),
  });
  if (!resposta.ok) return { enviado: false, motivo: `BREVO_${resposta.status}` };
  return { enviado: true };
}
