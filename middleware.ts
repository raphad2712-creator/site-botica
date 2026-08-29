import { NextResponse, type NextRequest } from "next/server";

// A autenticação é conferida nas próprias páginas protegidas.
// O middleware não faz chamadas externas, evitando timeout na Vercel.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ["/minha-conta/:path*", "/admin/:path*"] };
