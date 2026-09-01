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
    <img className="footer-logo-light" src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" />
    <img className="footer-logo-dark" src="/botica-logo-dark.png" alt="Botica Bioenergética" />
  </>;
}
