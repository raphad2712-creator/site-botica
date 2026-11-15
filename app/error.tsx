"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="empty-page" role="alert"><h1>Não foi possível carregar esta página</h1><p>Tente novamente em instantes. Se precisar, entre em contato com a Botica.</p><button type="button" onClick={reset}>TENTAR NOVAMENTE</button><p><Link href="/">Voltar à loja</Link></p></section>;
}
