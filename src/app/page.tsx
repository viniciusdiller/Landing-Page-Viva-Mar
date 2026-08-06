"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WelcomeIntro from "@/components/WelcomeIntro";
import RoomsSection from "@/components/RoomsSection";
import LeisureSection from "@/components/LeisureSection";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { RoomSearchParams } from "@/types";
import Map from "@/components/Map";

// Mesmo antes de o hóspede pesquisar uma data, a lista de quartos já busca
// disponibilidade pra hoje/amanhã por padrão (mesmo default já pré-marcado
// no SearchWidget) — sem isso, um quarto bloqueado hoje pelo dono no painel
// admin aparecia como "Disponível" na home até alguém pesquisar uma data,
// porque sem checkIn/checkOut a API só considera a quantidade total do
// quarto, não a disponibilidade real do dia.
function getDefaultSearchParams(): RoomSearchParams {
  const checkIn = new Date().toISOString().split("T")[0];
  const checkOut = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  return { checkIn, checkOut, guests: 2 };
}

export default function LandingPage() {
  const [searchParams, setSearchParams] = useState<RoomSearchParams>(
    getDefaultSearchParams,
  );

  function handleSearch(params: RoomSearchParams) {
    setSearchParams(params);
  }

  return (
    <main className="bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header />
      <Hero onSearch={handleSearch} />
      <WelcomeIntro />
      <RoomsSection searchParams={searchParams} />
      <LeisureSection />
      <Gallery />
      <Map />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
