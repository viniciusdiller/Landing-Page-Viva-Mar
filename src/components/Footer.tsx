import { Instagram, Facebook, Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="section-sm border-t border-[var(--color-border)] bg-[#f7f5f0]"
    >
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3
              className="mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 600,
              }}
            >
              Pousada Viva Mar
            </h3>
            <p
              className="text-[var(--color-text-muted)]"
              style={{ fontSize: "var(--text-sm)" }}
            >
              Av. Min. Salgado Filho, 8484 - Barra Nova, Saquarema/RJ.
            </p>
          </div>

          <div>
            <h4
              className="mb-3"
              style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
            >
              Links úteis
            </h4>
            <ul
              className="space-y-2 text-[var(--color-text-muted)]"
              style={{ fontSize: "var(--text-sm)" }}
            >
              <li>
                <a href="#hero" className="hover:text-[var(--color-text)]">
                  Início
                </a>
              </li>
              <li>
                <a href="#quartos" className="hover:text-[var(--color-text)]">
                  Quartos
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="mb-3"
              style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
            >
              Contato
            </h4>
            <ul
              className="space-y-2 text-[var(--color-text-muted)]"
              style={{ fontSize: "var(--text-sm)" }}
            >
              <li className="flex items-center gap-2">
                <Phone size={14} /> +55 48 4002-8922
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} /> reservas@vivamar.com.br
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="mb-3"
              style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
            >
              Redes sociais
            </h4>
            <div className="flex gap-3 text-[var(--color-text-muted)]">
              <a
                target="_blank"
                href="https://www.instagram.com/pousadavivamar/?hl=en"
                aria-label="Instagram"
                className="p-2 rounded-md hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="p-2 rounded-md hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="p-2 rounded-md hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>

        <div
          className="pt-5 border-t border-[var(--color-border)] text-[var(--color-text-faint)] flex items-center justify-between gap-4"
          style={{ fontSize: "var(--text-xs)" }}
        >
          <span>
            © {new Date().getFullYear()} Pousada Viva Mar. Powered by
            contato@totalsoftware.com
          </span>
          <img
            src="/Logo Completa TotalSoftware.png"
            alt="TotalSoftware"
            className="w-[10%] min-w-[80px]"
          />
        </div>
      </div>
    </footer>
  );
}
