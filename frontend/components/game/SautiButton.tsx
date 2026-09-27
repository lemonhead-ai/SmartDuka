"use client";

import React, { useState } from "react";
import { Mic01Icon, VolumeHighIcon } from "hugeicons-react";
import { useTTS } from "@/hooks/useTTS";

interface SautiButtonProps {
  promptText?: string;
  onVoiceInput?: (transcript: string) => void;
}

export function SautiButton(_props: SautiButtonProps) {
  return null;
}
