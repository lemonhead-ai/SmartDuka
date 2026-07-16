type SmartDukaLogoProps = { compact?: boolean };

export function SmartDukaLogo({ compact = false }: SmartDukaLogoProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Smart Duka">
      <span className="grid size-11 place-items-center rounded-2xl border border-line bg-surface text-ink" aria-hidden="true"><Store01Icon size={24} color="currentColor" /></span>
      {!compact && <span className="text-xl font-semibold tracking-tight text-ink">Smart Duka</span>}
    </div>
  );
}
import { Store01Icon } from "hugeicons-react";
