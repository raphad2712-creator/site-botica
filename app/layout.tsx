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

export const metadata: Metadata = {
  title: "Botica Bioenergética",
  description: "Loja de suplementos, cosméticos e produtos naturais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <footer>
            <div className="footer-logo"><ImageFooter /></div>
            <div><b>INSTITUCIONAL</b><a>Sobre a Botica</a><a>Política de privacidade</a><a>Termos de uso</a></div>
            <div><b>ATENDIMENTO</b><a>Central de ajuda</a><a>Fale conosco</a><a>Meus pedidos</a></div>
            <div><b>FORMAS DE PAGAMENTO</b><p>PIX • VISA • MASTERCARD</p></div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}

function ImageFooter() {
  return <img src="/botica-logo-nova.jpeg" alt="Botica Bioenergética" />;
}
