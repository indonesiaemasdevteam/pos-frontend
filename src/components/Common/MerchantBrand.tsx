"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MerchantBrandProps = {
  compact?: boolean;
  light?: boolean;
};

export default function MerchantBrand({
  compact = false,
  light = false,
}: MerchantBrandProps) {
  const [merchantName, setMerchantName] = useState("POS Merchant");

  const loadMerchant = useCallback(async () => {
    try {
      const response = await fetch("/api/apps/auth/merchant-info", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.response?.merchant_name) {
        setMerchantName(payload.response.merchant_name);
      }
    } catch {
      // Keep the fallback brand when merchant information is unavailable.
    }
  }, []);

  useEffect(() => {
    void loadMerchant();
    window.addEventListener("merchant-info-updated", loadMerchant);
    return () =>
      window.removeEventListener("merchant-info-updated", loadMerchant);
  }, [loadMerchant]);

  const initials = useMemo(
    () =>
      merchantName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase(),
    [merchantName]
  );

  if (compact) {
    return (
      <span className="avatar-xs d-inline-flex">
        <span className="avatar-title rounded bg-primary text-white fw-semibold">
          {initials || "POS"}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`d-inline-block text-truncate fw-semibold fs-16 ${light ? "text-white" : "text-body-emphasis"}`}
      style={{ maxWidth: 170 }}
      title={merchantName}
    >
      {merchantName}
    </span>
  );
}
