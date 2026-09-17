import { NextResponse, type NextRequest } from "next/server";

// A autenticação é conferida nas próprias páginas protegidas.
// O proxy não faz chamadas externas, evitando timeout na Vercel.
export function proxy(request: NextRequest) {
  const mutacao = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const webhook = request.nextUrl.pathname === "/api/mercado-pago/webhook";

  if (mutacao && request.nextUrl.pathname.startsWith("/api/") && !webhook) {
    const origem = request.headers.get("origin");
    const site = request.headers.get("sec-fetch-site");
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
      .split(",")[0]
      .trim();
    let origemValida = true;

    try {
      if (origem && new URL(origem).host !== host) origemValida = false;
    } catch {
      origemValida = false;
    }

    if (site === "cross-site" || !origemValida) {
      return NextResponse.json(
        { erro: "Origem da requisição não autorizada." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/minha-conta/:path*", "/admin/:path*"],
};
