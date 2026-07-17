import Image from "next/image";

type SmartDukaLogoProps = { compact?: boolean };

export function SmartDukaLogo({ compact = false }: SmartDukaLogoProps) {
  return (
    <div className="flex items-center" aria-label="Smart Duka">
      <Image
        src="/logo/logo.PNG"
        alt="Smart Duka"
        width={compact ? 64 : 220}
        height={compact ? 64 : 74}
        className={compact ? "size-16 object-contain" : "h-[70px] w-auto object-contain"}
        priority
      />
    </div>
  );
}
