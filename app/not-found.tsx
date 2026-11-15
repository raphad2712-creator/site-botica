import Link from "next/link";

export default function NotFound() {
  return <section className="empty-page"><h1>Página não encontrada</h1><p>Confira o endereço ou volte à loja para encontrar seus produtos.</p><Link href="/">VOLTAR À LOJA</Link></section>;
}
