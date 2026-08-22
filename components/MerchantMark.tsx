"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";
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
  const [failedDomain, setFailedDomain] = useState<string | null>(null);
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
      <span className="merchant-mark-fallback">{merchant.logoText}</span>
      {merchant.domain && failedDomain !== merchant.domain && (
        <Image
          alt=""
          aria-hidden="true"
          className="merchant-logo-image"
          height={42}
          width={42}
          unoptimized
          src={`/api/merchant-logo?domain=${encodeURIComponent(merchant.domain)}`}
          onError={() => setFailedDomain(merchant.domain)}
        />
      )}
    </span>
  );
}
