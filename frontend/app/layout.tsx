import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Smart Duka",
  description: "A learning adventure in every duka.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = { themeColor: "#FF8A3D" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
