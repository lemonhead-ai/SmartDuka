import { GameShell } from "@/components/layout/GameShell";

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameShell>{children}</GameShell>;
}
