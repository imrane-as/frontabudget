import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, MapPin, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { euro } from "@/lib/money";
import type { GroceryMarketData } from "@/lib/grocery-market";

export default function GroceryMarketCard({
  market,
  groceryBudgetWeekly,
  monthlyGrocerySpent,
  dayOfMonth
}: {
  market: GroceryMarketData | null;
  groceryBudgetWeekly: number | null;
  monthlyGrocerySpent: number;
  dayOfMonth: number;
}) {
  const weeklyPace = dayOfMonth > 0 ? (monthlyGrocerySpent / dayOfMonth) * 7 : 0;
  const overBudget =
    groceryBudgetWeekly !== null && groceryBudgetWeekly > 0 && weeklyPace > groceryBudgetWeekly;

  return (
    <article className="card grocery-market-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">Courses près de chez toi</span>
          <h3>Prix récemment relevés</h3>
        </div>
        <span className="card-heading-icon"><ShoppingBasket size={18} /></span>
      </div>

      <div className={`grocery-pace ${overBudget ? "grocery-pace-warning" : ""}`}>
        <div>
          <span>Ton rythme cette semaine</span>
          <strong>{euro(weeklyPace)}</strong>
        </div>
        <div>
          <span>Ton objectif</span>
          {groceryBudgetWeekly !== null ? (
            <strong>{euro(groceryBudgetWeekly)}</strong>
          ) : (
            <Link href="/settings">À définir</Link>
          )}
        </div>
      </div>

      {market?.prices.length ? (
        <div className="grocery-price-list">
          {market.prices.slice(0, 4).map((item) => (
            <div className="grocery-price" key={item.id}>
              <span className="grocery-product-icon" aria-hidden="true">{item.productName.charAt(0)}</span>
              <div>
                <strong>{item.productName}</strong>
                <span><MapPin size={11} /> {item.store} · {item.city}</span>
              </div>
              <strong>{euro(item.price)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="compact-empty">
          Aucun relevé récent disponible autour de {market?.city || "ta ville"}.
        </div>
      )}

      <div className="market-source-row">
        <span>
          {market?.observedAt
            ? `Relevés du ${format(new Date(`${market.observedAt}T12:00:00`), "d MMMM yyyy", { locale: fr })}`
            : "Données communautaires actualisées périodiquement"}
        </span>
        <a href="https://prices.openfoodfacts.org" target="_blank" rel="noreferrer noopener">
          Open Prices <ExternalLink size={11} />
        </a>
      </div>
    </article>
  );
}
