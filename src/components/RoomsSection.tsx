"use client";

import type { RoomSearchParams, RoomType } from "@/types";
import RoomList from "@/components/rooms/RoomList";

interface RoomsSectionProps {
  searchParams?: RoomSearchParams;
  onBook: (
    room: RoomType,
    nights: number,
    checkIn: string,
    checkOut: string,
    guests: number,
  ) => void;
}

export default function RoomsSection({
  searchParams,
  onBook,
}: RoomsSectionProps) {
  return (
    <section
      id="quartos"
      className="bg-[#ececec] py-16 md:py-24"
      aria-labelledby="quartos-heading"
    >
      <div className="container-wide">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <h2
            id="quartos-heading"
            className="mb-8 text-center uppercase text-[#2f3134] md:mb-12"
            style={{
              fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
              letterSpacing: "0.36em",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            CONHEÇA BEM DE PERTO
          </h2>

          <RoomList searchParams={searchParams} onBook={onBook} />
        </div>
      </div>
    </section>
  );
}
