import Image from "next/image";

export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-logo brand-logo-compact" : "brand-logo"}>
      <Image
        src="/frontabudget-logo.png"
        alt="FrontaBudget"
        width={2048}
        height={768}
        priority
      />
    </span>
  );
}
