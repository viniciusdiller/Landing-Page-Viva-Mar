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

export default function LandingPage() {
  const [searchParams, setSearchParams] = useState<
    RoomSearchParams | undefined
  >(undefined);

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
