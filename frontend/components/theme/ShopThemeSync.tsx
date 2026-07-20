"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { gameplayApi } from "@/features/gameplay/api";

export function ShopThemeSync() {
  const shop = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop, retry: false });

  useEffect(() => {
    document.documentElement.dataset.shopTheme = shop.data?.theme ?? "leaf";
  }, [shop.data?.theme]);

  return null;
}
