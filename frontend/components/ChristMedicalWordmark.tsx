import Image from "next/image";
import { CHRIST_MEDICAL_WORDMARK_SRC } from "@/lib/branding";

type ChristMedicalWordmarkProps = {
  width?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/** Full Christ Medical logo with wordmark — use once on the marketing home hero. */
export function ChristMedicalWordmark({
  width = 320,
  className = "h-auto w-full max-w-[min(100%,20rem)] object-contain sm:max-w-[24rem]",
  alt = "Christ Medical",
  priority = false,
}: ChristMedicalWordmarkProps) {
  return (
    <Image
      src={CHRIST_MEDICAL_WORDMARK_SRC}
      alt={alt}
      width={width}
      height={width}
      className={className}
      priority={priority}
    />
  );
}
