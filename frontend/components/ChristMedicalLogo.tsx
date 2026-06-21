import Image from "next/image";
import { CHRIST_MEDICAL_LOGO_SRC } from "@/lib/branding";

type ChristMedicalLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/** Square Christ Medical emblem (no wordmark) for nav, auth, marketing, and PWA. */
export function ChristMedicalLogo({
  size = 44,
  className = "rounded-lg object-contain object-center",
  alt = "Christ Medical",
  priority = false,
}: ChristMedicalLogoProps) {
  return (
    <Image
      src={CHRIST_MEDICAL_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
