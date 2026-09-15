"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import React from "react";

interface MascotConfig {
  name: string;
  src: string;
  className: string;
  size: number;
  initialRotate: number;
  floatY: number[];
  rotateRange: number[];
  duration: number;
  delay: number;
  glowColor: string;
}

const MASCOTS: MascotConfig[] = [
  {
    name: "Mario",
    src: "/illustrations/mario.PNG",
    className: "top-4 left-4 sm:top-10 sm:left-10 md:top-14 md:left-16 lg:left-24",
    size: 210,
    initialRotate: -8,
    floatY: [0, -14, 0],
    rotateRange: [-8, -4, -8],
    duration: 5.2,
    delay: 0,
    glowColor: "rgba(255, 90, 90, 0.12)",
  },
  {
    name: "Kirby",
    src: "/illustrations/kirby.PNG",
    className: "top-4 right-4 sm:top-10 sm:right-10 md:top-12 md:right-16 lg:right-24",
    size: 200,
    initialRotate: 10,
    floatY: [0, -16, 0],
    rotateRange: [10, 15, 10],
    duration: 4.8,
    delay: 0.6,
    glowColor: "rgba(244, 114, 182, 0.15)",
  },
  {
    name: "Milo",
    src: "/mascots/milo.PNG",
    className: "bottom-4 left-4 sm:bottom-10 sm:left-10 md:bottom-12 md:left-16 lg:left-24",
    size: 230,
    initialRotate: -6,
    floatY: [0, 14, 0],
    rotateRange: [-6, -2, -6],
    duration: 5.6,
    delay: 1.2,
    glowColor: "rgba(34, 197, 94, 0.15)",
  },
  {
    name: "Stitch",
    src: "/illustrations/stitch.PNG",
    className: "bottom-4 right-4 sm:bottom-10 sm:right-10 md:bottom-12 md:right-16 lg:right-24",
    size: 220,
    initialRotate: 8,
    floatY: [0, 16, 0],
    rotateRange: [8, 4, 8],
    duration: 5.0,
    delay: 1.8,
    glowColor: "rgba(56, 189, 248, 0.14)",
  },
];

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main-content"
      className="relative min-h-dvh w-full overflow-hidden bg-canvas flex items-center justify-center px-4 py-10"
    >
      {/* Ambient background glows to eliminate harsh empty white spaces */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden z-0" aria-hidden="true">
        {/* Soft pastel ambient gradient orbs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-3xl" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-pink-400/10 dark:bg-pink-400/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-400/10 dark:bg-sky-400/5 blur-3xl" />

        {/* Gentle decorative floating sparkles / stars for kid delight */}
        <div className="absolute top-1/4 left-1/4 text-amber-500/20 text-xl font-bold">✦</div>
        <div className="absolute top-1/3 right-1/4 text-pink-500/20 text-2xl font-bold">★</div>
        <div className="absolute bottom-1/4 left-1/3 text-emerald-500/20 text-xl font-bold">●</div>
        <div className="absolute bottom-1/3 right-1/3 text-sky-500/20 text-lg font-bold">✦</div>

        {/* Friendly mascots positioned around the screen with subtle kid-friendly opacity */}
        {MASCOTS.map((mascot) => (
          <motion.div
            key={mascot.name}
            className={`absolute ${mascot.className} w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 opacity-25 dark:opacity-20 transition-opacity duration-300 hover:opacity-40`}
            initial={{ opacity: 0, scale: 0.85, rotate: mascot.initialRotate }}
            animate={{
              opacity: [0.22, 0.32, 0.22],
              scale: 1,
              y: mascot.floatY,
              rotate: mascot.rotateRange,
            }}
            transition={{
              opacity: { duration: mascot.duration * 1.5, repeat: Infinity, ease: "easeInOut" },
              y: { duration: mascot.duration, repeat: Infinity, ease: "easeInOut", delay: mascot.delay },
              rotate: { duration: mascot.duration, repeat: Infinity, ease: "easeInOut", delay: mascot.delay },
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={mascot.src}
                alt=""
                fill
                sizes="(max-width: 640px) 96px, (max-width: 768px) 144px, 224px"
                className="object-contain drop-shadow-md"
                priority
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main interactive auth card on elevated layer */}
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </main>
  );
}
