import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KidAvatar = "🧑🏾‍🍳" | "👩🏾‍🔬" | "🧑🏾‍🎨" | "👨🏾‍🚀";
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
  { value: "🧑🏾‍🍳", label: "Chef" },
  { value: "👩🏾‍🔬", label: "Inventor" },
  { value: "🧑🏾‍🎨", label: "Artist" },
  { value: "👨🏾‍🚀", label: "Explorer" }
];

export const shopThemes: { value: ShopTheme; label: string; className: string }[] = [
  { value: "sunrise", label: "Sunrise", className: "bg-orange-100" },
  { value: "ocean", label: "Ocean", className: "bg-blue-100" },
  { value: "leaf", label: "Leaf", className: "bg-green-100" },
  { value: "berry", label: "Berry", className: "bg-pink-100" }
];

export const useKidProfileStore = create<KidProfile>()(persist((set) => ({
  avatar: "🧑🏾‍🍳",
  shopTheme: "sunrise",
  shopName: "My Smart Duka",
  setAvatar: (avatar) => set({ avatar }),
  setShopTheme: (shopTheme) => set({ shopTheme }),
  setShopName: (shopName) => set({ shopName })
}), { name: "smart-duka-kid-profile" }));
