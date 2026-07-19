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
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{let p=JSON.parse(localStorage.getItem('smart-duka-preferences-v2')||'null');if(!p){const t=localStorage.getItem('smart-duka-theme');const o=localStorage.getItem('smart-duka-preferences');p=o?JSON.parse(o):{theme:'system',largeText:false,reducedMotion:false,sound:true};if(t)p.theme=t}const th=p.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(p.theme||'light');document.documentElement.dataset.theme=th;document.documentElement.style.colorScheme=th;if(p.largeText)document.documentElement.dataset.largeText='true';if(p.reducedMotion)document.documentElement.dataset.reducedMotion='true';}catch{}" }} /></head><body suppressHydrationWarning><a href="#main-content" className="skip-link">Skip to main content</a><Providers>{children}</Providers></body></html>;
}
