import Link from "next/link";
import { AlertTriangle, BellRing, CircleCheck } from "lucide-react";
import { euro } from "@/lib/money";
import type { BudgetItem } from "@/lib/smart-budget";

export default function BudgetAlerts({ budgets }: { budgets: BudgetItem[] }) {
  const alerts = budgets.filter(
    (budget) => budget.status !== "safe" || budget.projectedPercentage >= 100
  );

  if (!budgets.length) {
    return (
      <div className="status-banner status-neutral">
        <BellRing aria-hidden="true" />
        <div>
          <strong>Active tes premières alertes</strong>
          <p>Définis tes plafonds mensuels pour détecter un dépassement.</p>
        </div>
        <Link href="/budgets">Créer un budget</Link>
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="status-banner status-ok">
        <CircleCheck aria-hidden="true" />
        <div>
          <strong>Tous tes budgets sont sous contrôle</strong>
          <p>Aucun dépassement détecté pour le moment.</p>
        </div>
      </div>
    );
  }

  const first = alerts[0];
  const exceeded = first.status === "exceeded";

  return (
    <div className={`status-banner ${exceeded ? "status-danger" : "status-warning"}`}>
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>
          {exceeded ? "Budget dépassé" : "Budget bientôt atteint"} · {first.categoryName}
        </strong>
        <p>
          {euro(first.spent)} consommés sur {euro(first.planned)}
          {first.projectedPercentage >= 100 && !exceeded
            ? ` · projection ${euro(first.projected)}`
            : ""}
        </p>
      </div>
      <Link href="/budgets">Voir le détail</Link>
    </div>
  );
}
