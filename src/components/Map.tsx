"use client";

export default function Map() {
  return (
    <div className="bg-white">
      <h2
        className="text-center text-[#2f3134] uppercase mb-12 md:mb-16 BG-"
        style={{
          fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
          letterSpacing: "0.36em",
          fontWeight: 500,
          fontFamily: "var(--font-body)",
        }}
      >
        ONDE ESTAMOS
      </h2>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3674.4981345533624!2d-42.576149223932745!3d-22.931874738769693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x99e18bbaad5bdd%3A0x54e5f8f8de15981a!2sAv.%20Min.%20Salgado%20Filho%2C%208484%20-%20Barra%20Nova%2C%20Saquarema%20-%20RJ%2C%2028990-000!5e0!3m2!1spt-BR!2sbr!4v1775149674718!5m2!1spt-BR!2sbr"
        width="100%"
        height="450"
      ></iframe>
    </div>
  );
}
