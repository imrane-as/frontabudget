"use client";

import { useState } from "react";

export default function CheckoutButtons() {
  const [loading, setLoading] = useState(false);

  async function checkout(plan: "monthly" | "yearly") {
    setLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setLoading(false);
    alert(data.error || "Impossible de démarrer le paiement.");
  }

  return (
    <div className="actions" style={{ justifyContent: "flex-start" }}>
      <button className="btn btn-primary" disabled={loading} onClick={() => checkout("monthly")}>
        Premium mensuel
      </button>
      <button className="btn" disabled={loading} onClick={() => checkout("yearly")}>
        Premium annuel
      </button>
    </div>
  );
}
