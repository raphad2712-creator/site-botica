import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import "./enhancements.css";
import "./mobile.css";
import "./backend.css";
import "./front-match.css";
import "./shop-polish.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SupportWidget } from "@/components/support-widget";
import { CookieConsent, CookieSettingsButton } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Botica Bioenergética",
  description: "Loja de suplementos, cosméticos e produtos naturais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('botica-theme')||'auto';document.documentElement.dataset.theme=t==='dark'?'dark':'light';document.documentElement.dataset.themePreference=t}catch(e){}})()` }} /></head>
      <body>
        <CartProvider>
          <FavoritesProvider>
            <Header />
            <main>{children}</main>
            <footer>
            <div className="footer-logo"><ImageFooter /></div>
            <div><b>INSTITUCIONAL</b><a>Sobre a Botica</a><a href="/politica-de-privacidade">Política de privacidade</a><a>Termos de uso</a><CookieSettingsButton /></div>
            <div><b>ATENDIMENTO</b><a href="mailto:raphad2712@gmail.com?subject=Atendimento%20Botica">Fale conosco</a><a href="/#receita">Envie sua receita</a><a href="/minha-conta">Meus pedidos</a><a href="/politica-de-trocas-e-devolucoes">Trocas e devoluções</a></div>
            <div><b>FORMAS DE PAGAMENTO</b><p>PIX • VISA • MASTERCARD</p></div>
            <div className="footer-legal" aria-label="Informações legais da Botica Bioenergética">
              <div><strong>FARMACÊUTICO RESPONSÁVEL</strong><span>Dr. Flávio Luís Alves</span><span>CRF-SP 42216</span></div>
              <div><strong>LICENÇAS E AUTORIZAÇÕES</strong><span>CEVS: 355030801-477-008234-1-4</span><span>MS: 7.40921.9 • CRF-SP: 57419</span></div>
              <div><strong>DADOS DA EMPRESA</strong><span>CNPJ: 13.013.360/0001-70</span></div>
              <div><strong>ENDEREÇO</strong><address>Rua Sol da Meia-Noite, 990<br />Jardim Maia — São Miguel Paulista<br />São Paulo/SP — CEP 08180-050</address></div>
            </div>
            </footer>
            <SupportWidget />
            <CookieConsent />
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}

function ImageFooter() {
  return <>
    <img className="footer-logo-light" src="/botica-logo-sem-frase.png" alt="Botica Bioenergética — Produtos Naturais" />
    <img className="footer-logo-dark" src="/botica-logo-dark-clean.png" alt="Botica Bioenergética — Produtos Naturais" />
  </>;
}
