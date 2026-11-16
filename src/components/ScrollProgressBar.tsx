"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export interface ScrollProgressBarProps {
  className?: string;
}

/**
 * ScrollProgressBar
 * Barra horizontal de progresso de rolagem fixada no topo (acoplada ao Header).
 *
 * Inspirada na implementação da Landing Page Pratagy, adaptada rigorosamente
 * ao design system da Pousada Viva Mar:
 * - Física de mola (stiffness: 120, damping: 24) para animação suave e orgânica.
 * - Gradiente temático Viva Mar:
 *     #454a3a (verde oliva escuro / floresta costeira)
 *     #bd9a5f (dourado areia primário / sol)
 *     #d4b877 (dourado areia suave / champagne)
 * - Brilho suave (shadow glow) na cor dourado areia (#bd9a5f / rgba(189, 154, 95, 0.45)).
 */
export function ScrollProgressBar({ className = "" }: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[2.5px] origin-left bg-gradient-to-r from-[#454a3a] via-[#bd9a5f] to-[#d4b877] shadow-[0_1px_6px_rgba(189,154,95,0.45)] ${className}`}
      style={{ scaleX }}
    />
  );
}

export default ScrollProgressBar;

