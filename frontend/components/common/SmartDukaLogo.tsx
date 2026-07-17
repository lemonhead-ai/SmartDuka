import Image from "next/image";

type SmartDukaLogoProps = { compact?: boolean };

export function SmartDukaLogo({ compact = false }: SmartDukaLogoProps) {
  return (
    <div className="flex items-center" aria-label="Smart Duka">
      {/* Light Mode Logo */}
      <Image
        src="/logo/logo.PNG"
        alt="Smart Duka"
        width={compact ? 64 : 220}
        height={compact ? 64 : 74}
        className={`logo-light ${compact ? "size-16 object-contain" : "h-[70px] w-auto object-contain"}`}
        priority
      />
      {/* Dark Mode Logo */}
      <Image
        src="/logo/logodark.PNG"
        alt="Smart Duka"
        width={compact ? 64 : 220}
        height={compact ? 64 : 74}
        className={`logo-dark ${compact ? "size-16 object-contain" : "h-[70px] w-auto object-contain"}`}
        priority
      />
    </div>
  );
}
