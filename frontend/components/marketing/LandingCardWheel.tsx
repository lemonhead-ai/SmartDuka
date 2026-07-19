"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef, useState, type PointerEvent, type WheelEvent } from "react";

import { playCarouselTick } from "@/features/feedback/sensory-feedback";

const cards = [
  { title: "Mango maths", detail: "Count & add", image: "/illustrations/fruits_mascot.png", color: "#ffb347" },
  { title: "Milo helps", detail: "Little hints", image: "/mascots/milo.PNG", color: "#66d9c8" },
  { title: "Money smart", detail: "Give change", image: "/illustrations/snacks_mascot.png", color: "#f78ca0" },
  { title: "Word shelf", detail: "Read & learn", image: "/illustrations/school_mascot.png", color: "#8b7cf6" },
  { title: "Shop hero", detail: "Grow your duka", image: "/illustrations/household_mascot.png", color: "#4d8cff" }
];

function circularOffset(index: number, activeIndex: number): number {
  let offset = index - activeIndex;
  if (offset > cards.length / 2) offset -= cards.length;
  if (offset < -cards.length / 2) offset += cards.length;
  return offset;
}

export function LandingCardWheel() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastWheelChange = useRef(0);
  const dragStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);

  const cardWidth = 160; // drag distance per card shift

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + cards.length) % cards.length);
    playCarouselTick();
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelChange.current < 140) return;
    lastWheelChange.current = now;
    move(event.deltaY > 0 ? 1 : -1);
  };

  const finishDrag = () => {
    if (dragStartX.current === null) return;
    const cardsToMove = Math.round(-dragOffsetRef.current / cardWidth);
    if (cardsToMove !== 0) {
      move(cardsToMove);
    }
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    dragStartX.current = null;
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    // Limit drag to a maximum of 2 cards swipe in either direction
    const nextOffset = Math.max(-cardWidth * 2, Math.min(cardWidth * 2, event.clientX - dragStartX.current));
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  // Continuous current position based on active index and drag offset
  const currentPosition = activeIndex - (dragOffset / cardWidth);

  return (
    <section className="relative h-[clamp(205px,34vh,360px)] shrink-0" aria-label="Smart Duka learning activities">
      <div 
        className="absolute inset-x-0 bottom-0 top-0 cursor-grab touch-none select-none active:cursor-grabbing outline-none" 
        onWheel={handleWheel} 
        onPointerDown={startDrag} 
        onPointerMove={updateDrag} 
        onPointerUp={finishDrag} 
        onPointerCancel={finishDrag} 
        onKeyDown={(event) => { 
          if (event.key === "ArrowLeft") move(-1); 
          if (event.key === "ArrowRight") move(1); 
        }} 
        tabIndex={0} 
        role="region" 
        aria-label="Learning activity card wheel. Drag left or right, use the mouse wheel, or use arrow keys to browse."
      >
        <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-center overflow-hidden px-2 sm:top-5">
          {cards.map((card, index) => {
            // Calculate continuous circular offset
            let offset = index - currentPosition;
            const totalCards = cards.length;
            while (offset > totalCards / 2) offset -= totalCards;
            while (offset < -totalCards / 2) offset += totalCards;

            const distance = Math.abs(offset);

            return (
              <motion.article 
                key={card.title} 
                initial={false} 
                animate={{ 
                  x: offset * 180, // Spacing remains fixed relative to the center
                  y: distance * 28, 
                  scale: distance === 0 ? 1.08 : distance === 1 ? 0.88 : 0.72, 
                  rotate: offset * 8, 
                  opacity: distance > 2 ? 0 : 1 - (distance * 0.4)
                }} 
                transition={{ 
                  duration: isDragging ? 0 : 0.28, 
                  ease: [0.32, 0.72, 0, 1] 
                }} 
                className="absolute bottom-2 flex h-[clamp(165px,27vh,300px)] w-[148px] sm:w-[230px] flex-col overflow-visible rounded-[26px] p-4 sm:p-5 text-left shadow-2xl group cursor-pointer" 
                style={{ 
                  backgroundColor: card.color, 
                  zIndex: Math.round(10 - distance * 2) 
                }} 
                aria-hidden={distance > 2}
              >
                <p className="text-base font-black text-[#122116] sm:text-2xl uppercase leading-tight">
                  {card.title.split(" ")[0]} <span className="block text-sm opacity-80 sm:text-base font-bold">{card.title.split(" ").slice(1).join(" ")}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-[#122116]/65 sm:text-sm uppercase">
                  {card.detail}
                </p>

                {/* Overlapping Mascot Character Asset */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-[65%] pointer-events-none z-10">
                  <Image 
                    src={card.image} 
                    alt={`${card.title} mascot`} 
                    width={200} 
                    height={200} 
                    className="w-full h-full object-contain object-bottom filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2"
                    priority
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
