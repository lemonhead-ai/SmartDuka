import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KidAvatar = "mario" | "milo" | "stitch" | "kirby" | "jack";
export type ShopTheme = "sunrise" | "ocean" | "leaf" | "berry";

type KidProfile = {
  avatar: KidAvatar;
  shopTheme: ShopTheme;
  shopName: string;
  setAvatar: (avatar: KidAvatar) => void;
  setShopTheme: (theme: ShopTheme) => void;
  setShopName: (name: string) => void;
};

export const avatarChoices: { value: KidAvatar; label: string }[] = [
  { value: "mario", label: "Mario" },
  { value: "milo", label: "Milo" },
  { value: "stitch", label: "Stitch" },
  { value: "kirby", label: "Kirby" },
  { value: "jack", label: "Jack" }
];

export const shopThemes: { value: ShopTheme; label: string; className: string }[] = [
  { value: "sunrise", label: "Sunrise", className: "bg-orange-100/70 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-900/50" },
  { value: "ocean", label: "Ocean", className: "bg-blue-100/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-900/50" },
  { value: "leaf", label: "Leaf", className: "bg-green-100/70 dark:bg-green-950/40 text-green-900 dark:text-green-200 border-green-200 dark:border-green-900/50" },
  { value: "berry", label: "Berry", className: "bg-pink-100/70 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-900/50" }
];

export const useKidProfileStore = create<KidProfile>()(persist((set) => ({
  avatar: "milo",
  shopTheme: "sunrise",
  shopName: "My Smart Duka",
  setAvatar: (avatar) => set({ avatar }),
  setShopTheme: (shopTheme) => set({ shopTheme }),
  setShopName: (shopName) => set({ shopName })
}), { name: "smart-duka-kid-profile" }));
