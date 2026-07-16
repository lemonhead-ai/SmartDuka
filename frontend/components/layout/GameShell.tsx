import { GameNavigation } from "@/components/navigation/GameNavigation";

export function GameShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-canvas"><GameNavigation /><main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:ml-[272px] lg:px-10 lg:py-9">{children}</main></div>;
}
