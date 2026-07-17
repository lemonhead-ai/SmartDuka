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
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{const p=localStorage.getItem('smart-duka-theme')||'system';const t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch{}" }} /></head><body><Providers>{children}</Providers></body></html>;
}
