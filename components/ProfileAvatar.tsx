"use client";

import Image from "next/image";
import { useState } from "react";

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "F";
}

export default function ProfileAvatar({
  label,
  hasAvatar,
  version,
  size = "medium"
}: {
  label: string;
  hasAvatar: boolean;
  version?: string | null;
  size?: "small" | "medium" | "large";
}) {
  const [failedVersion, setFailedVersion] = useState<string | null>(null);
  const currentVersion = version || "1";
  const showImage = hasAvatar && failedVersion !== currentVersion;

  return (
    <span className={`profile-avatar profile-avatar-${size}`} aria-hidden="true">
      <span>{getInitial(label)}</span>
      {showImage && (
        <Image
          src={`/api/avatar?v=${encodeURIComponent(currentVersion)}`}
          alt=""
          fill
          sizes={size === "large" ? "96px" : "48px"}
          unoptimized
          onError={() => setFailedVersion(currentVersion)}
        />
      )}
    </span>
  );
}
