"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RoomsSection from "@/components/RoomsSection";
import LeisureSection from "@/components/LeisureSection";
import Footer from "@/components/Footer";
import CheckoutModal from "@/components/CheckoutModal";
import type { RoomSearchParams, RoomType } from "@/types";
import Map from "@/components/Map";

export default function LandingPage() {
  const [searchParams, setSearchParams] = useState<
    RoomSearchParams | undefined
  >(undefined);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [bookingContext, setBookingContext] = useState({
    nights: 1,
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const isCheckoutOpen = useMemo(() => Boolean(selectedRoom), [selectedRoom]);

  function handleSearch(params: RoomSearchParams) {
    setSearchParams(params);
  }

  function handleOpenCheckout(
    room: RoomType,
    nights: number,
    checkIn: string,
    checkOut: string,
    guests: number,
  ) {
    setSelectedRoom(room);
    setBookingContext({
      nights: Math.max(1, nights),
      checkIn,
      checkOut,
      guests,
    });
  }

  function handleCloseCheckout() {
    setSelectedRoom(null);
  }

  return (
    <main className="bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header />
      <Hero onSearch={handleSearch} />
      <RoomsSection searchParams={searchParams} onBook={handleOpenCheckout} />
      <LeisureSection />
      <Map />
      <Footer />

      <CheckoutModal
        open={isCheckoutOpen}
        room={selectedRoom}
        bookingContext={bookingContext}
        onClose={handleCloseCheckout}
      />
    </main>
  );
}
