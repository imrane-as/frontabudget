"use client";

import { CalendarRange, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  monthKey: string;
  periodLabel: string;
  previousHref: string | null;
  nextHref: string | null;
  isCurrent: boolean;
  reportHref: string;
};

export default function DashboardMonthNavigator({
  monthKey,
  periodLabel,
  previousHref,
  nextHref,
  isCurrent,
  reportHref
}: Props) {
  const router = useRouter();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <section className="dashboard-period-bar" aria-label="Période du tableau de bord">
      <div className="dashboard-period-copy">
        <span><CalendarRange size={18} /></span>
        <div><small>Période consultée</small><strong>{periodLabel}</strong></div>
      </div>

      <div className="dashboard-period-controls">
        {previousHref ? (
          <Link className="period-arrow" href={previousHref} aria-label="Voir le mois précédent">
            <ChevronLeft size={18} />
          </Link>
        ) : (
          <button className="period-arrow" type="button" disabled aria-label="Mois précédent indisponible">
            <ChevronLeft size={18} />
          </button>
        )}
        <label className="period-month-input">
          <span className="sr-only">Choisir un mois</span>
          <input
            type="month"
            min="2020-01"
            max={currentMonth}
            value={monthKey}
            onChange={(event) => {
              const [year, month] = event.target.value.split("-");
              if (year && month) router.push(`/dashboard?month=${Number(month)}&year=${year}`);
            }}
          />
        </label>
        {nextHref ? (
          <Link className="period-arrow" href={nextHref} aria-label="Voir le mois suivant">
            <ChevronRight size={18} />
          </Link>
        ) : (
          <button className="period-arrow" type="button" disabled aria-label="Mois suivant indisponible">
            <ChevronRight size={18} />
          </button>
        )}
        {!isCurrent && (
          <Link className="period-current" href="/dashboard">
            <RotateCcw size={14} /> Mois actuel
          </Link>
        )}
      </div>

      <a className="btn btn-primary dashboard-report-download" href={reportHref}>
        <Download size={17} />
        <span>Télécharger le rapport PDF</span>
      </a>
    </section>
  );
}
