"use client";

import { motion } from "framer-motion";
import { useTTS } from "@/hooks/useTTS";

type AudioSpeakerButtonProps = {
  text: string;
  lang?: "en" | "sw";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AudioSpeakerButton(_props: AudioSpeakerButtonProps) {
  return null;
}
