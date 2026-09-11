import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import "./enhancements.css";
import "./mobile.css";
import "./backend.css";
import "./front-match.css";
import "./shop-polish.css";
import "./catalog-refresh.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SupportWidget } from "@/components/support-widget";
import { CookieConsent, CookieSettingsButton } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Botica Bioenergética",
  description: "Loja de suplementos, cosméticos e produtos naturais.",
  applicationName: "Botica Bioenergética",
  openGraph: {
    title: "Botica Bioenergética",
    description: "Fórmulas personalizadas, suplementos e produtos naturais.",
    type: "website",
  },
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
            <section className="footer-benefits" aria-label="Vantagens da Botica">
              <article><span aria-hidden="true">◇</span><div><strong>Compra segura</strong><small>Ambiente protegido e confiável</small></div></article>
              <article><span aria-hidden="true">✦</span><div><strong>Qualidade farmacêutica</strong><small>Cuidado em cada fórmula</small></div></article>
              <article><span aria-hidden="true">▱</span><div><strong>Envie sua receita</strong><small>Solicite seu orçamento online</small></div></article>
              <article><span aria-hidden="true">✓</span><div><strong>Atendimento especializado</strong><small>Suporte em toda a sua compra</small></div></article>
            </section>
            <footer className="official-style-footer">
              <section className="footer-primary">
                <div className="footer-brand-column">
                  <div className="footer-logo"><ImageFooter /></div>
                  <p>Produtos naturais, suplementos e fórmulas manipuladas com cuidado, segurança e responsabilidade.</p>
                  <a className="footer-contact-button" href="mailto:raphad2712@gmail.com?subject=Atendimento%20Botica">Falar com a Botica <span aria-hidden="true">→</span></a>
                </div>
                <nav aria-label="Institucional"><b>INSTITUCIONAL</b><a href="/#sobre">Sobre a Botica</a><a href="/politica-de-privacidade">Política de privacidade</a><a href="/termos-de-uso">Termos de uso</a><CookieSettingsButton /></nav>
                <nav aria-label="Ajuda e atendimento"><b>AJUDA E ATENDIMENTO</b><a href="mailto:raphad2712@gmail.com?subject=Atendimento%20Botica">Fale conosco</a><a href="/#receita">Envie sua receita</a><a href="/minha-conta">Meus pedidos</a><a href="/politica-de-trocas-e-devolucoes">Trocas e devoluções</a></nav>
                <div className="footer-shopping"><b>PAGAMENTO</b><div className="payment-flags" aria-label="Formas de pagamento aceitas"><span>PIX</span><span>VISA</span><span>MASTER</span></div><b>SEGURANÇA</b><div className="security-stamps"><span><strong>🔒 SSL</strong><small>Ambiente protegido</small></span><span><strong>LGPD</strong><small>Seus dados seguros</small></span></div></div>
              </section>
              <section className="footer-legal" aria-label="Informações legais da Botica Bioenergética">
                <div><strong>FARMACÊUTICO RESPONSÁVEL</strong><span>Dr. Flávio Luís Alves</span><span>CRF-SP 42216</span></div>
                <div><strong>LICENÇAS E AUTORIZAÇÕES</strong><span>CEVS: 355030801-477-008234-1-4</span><span>MS: 7.40921.9 • CRF-SP: 57419</span></div>
                <div><strong>DADOS DA EMPRESA</strong><span>CNPJ: 13.013.360/0001-70</span></div>
                <div><strong>ENDEREÇO</strong><address>Rua Sol da Meia-Noite, 990<br />Jardim Maia — São Miguel Paulista<br />São Paulo/SP — CEP 08180-050</address></div>
              </section>
              <section className="footer-disclaimer"><p>As informações deste site não substituem a orientação de um profissional de saúde. Fórmulas manipuladas estão sujeitas à análise farmacêutica.</p><p>© {new Date().getFullYear()} Botica Bioenergética. Todos os direitos reservados.</p></section>
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
    <img className="footer-logo-light" src="/botica-logo-transparente.png" alt="Botica Bioenergética — Produtos Naturais" />
    <img className="footer-logo-dark" src="/botica-logo-dark-transparent.png" alt="Botica Bioenergética — Produtos Naturais" />
  </>;
}
