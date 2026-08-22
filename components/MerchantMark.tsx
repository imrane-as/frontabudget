import type { CSSProperties } from "react";
import { getMerchantPresentation } from "@/lib/transaction-categorizer";

type Props = {
  name: string;
  categoryName?: string | null;
  presentation?: ReturnType<typeof getMerchantPresentation>;
};

export default function MerchantMark({
  name,
  categoryName,
  presentation
}: Props) {
  const merchant =
    presentation || getMerchantPresentation(name, categoryName || "Autre");
  const style: CSSProperties = {
    backgroundColor: merchant.accent,
    color: merchant.foreground
  };

  return (
    <span
      aria-hidden="true"
      className={`merchant-mark${merchant.wide ? " merchant-mark-wide" : ""}`}
      style={style}
    >
      {merchant.logoText}
    </span>
  );
}
