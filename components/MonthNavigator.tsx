"use client";

import { CalendarRange, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  basePath: string;
  monthKey: string;
  periodLabel: string;
  previousKey: string | null;
  nextKey: string | null;
  isCurrent: boolean;
  reportHref?: string;
};

function periodHref(basePath: string, key: string) {
  const [year, month] = key.split("-");
  return `${basePath}?month=${Number(month)}&year=${year}`;
}

export default function MonthNavigator({
  basePath,
  monthKey,
  periodLabel,
  previousKey,
  nextKey,
  isCurrent,
  reportHref
}: Props) {
  const router = useRouter();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <section
      className={`dashboard-period-bar ${reportHref ? "has-report" : "period-only"}`}
      aria-label="Période affichée"
    >
      <div className="dashboard-period-copy">
        <span><CalendarRange size={18} /></span>
        <div><small>Période consultée</small><strong>{periodLabel}</strong></div>
      </div>

      <div className="dashboard-period-controls">
        {previousKey ? (
          <Link className="period-arrow" href={periodHref(basePath, previousKey)} aria-label="Voir le mois précédent">
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
              if (event.target.value) router.push(periodHref(basePath, event.target.value));
            }}
          />
        </label>
        {nextKey ? (
          <Link className="period-arrow" href={periodHref(basePath, nextKey)} aria-label="Voir le mois suivant">
            <ChevronRight size={18} />
          </Link>
        ) : (
          <button className="period-arrow" type="button" disabled aria-label="Mois suivant indisponible">
            <ChevronRight size={18} />
          </button>
        )}
        {!isCurrent && (
          <Link className="period-current" href={basePath}>
            <RotateCcw size={14} /> Mois actuel
          </Link>
        )}
      </div>

      {reportHref && (
        <a className="btn btn-primary dashboard-report-download" href={reportHref}>
          <Download size={17} />
          <span>Télécharger le rapport PDF</span>
        </a>
      )}
    </section>
  );
}

