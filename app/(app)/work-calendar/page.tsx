import { BriefcaseBusiness, CalendarCheck2, HeartPulse, House, Palmtree, Sparkles } from "lucide-react";
import WorkDayForm from "@/components/WorkDayForm";
import MetricCard from "@/components/MetricCard";
import MonthNavigator from "@/components/MonthNavigator";
import PageIntro from "@/components/PageIntro";
import { requireUser } from "@/lib/auth";
import { resolveMonthPeriod } from "@/lib/month-period";

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function WorkCalendarPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const period = resolveMonthPeriod(params.month, params.year);

  const { data: days, error } = await supabase
    .from("work_days")
    .select("*")
    .eq("user_id", user.id)
    .gte("work_date", period.start)
    .lte("work_date", period.end)
    .order("work_date", { ascending: false });

  const count = (type: string) => days?.filter((d) => d.day_type === type).length ?? 0;

  return (
    <div className="page-shell work-page">
      <PageIntro
        eyebrow={`Suivi mensuel · ${period.label}`}
        title="Jours de travail"
        tone="mint"
        icon={<CalendarCheck2 size={26} />}
        description="Ton rythme France–Luxembourg résumé dans un calendrier simple et vivant."
        aside={<span className="page-feature-pill"><Sparkles size={14} /> {days?.length || 0} jours suivis</span>}
      />

      <MonthNavigator
        basePath="/work-calendar"
        monthKey={period.key}
        periodLabel={period.label}
        previousKey={period.previousKey}
        nextKey={period.nextKey}
        isCurrent={period.isCurrent}
      />

      {error && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger les journées de cette période.
        </div>
      )}

      <section className="grid grid-4 content-section metric-grid">
        <MetricCard label="Luxembourg" value={`${count("luxembourg")} j`} accent="blue" icon={<BriefcaseBusiness size={18} />} />
        <MetricCard label="Télétravail" value={`${count("remote")} j`} accent="violet" icon={<House size={18} />} />
        <MetricCard label="Congés" value={`${count("leave")} j`} icon={<Palmtree size={18} />} />
        <MetricCard label="Maladie" value={`${count("sick")} j`} accent="rose" icon={<HeartPulse size={18} />} />
      </section>

      <section className="grid grid-2 section">
        <div className="card form-feature-card work-form-card">
          <span className="eyebrow">Mise à jour rapide</span>
          <h3>Ajouter / modifier une journée</h3>
          <WorkDayForm
            key={period.key}
            initialDate={period.isCurrent ? undefined : period.start}
          />
        </div>

        <div className="card work-history-card">
          <div className="card-title-row"><div><span className="eyebrow">Historique du mois</span><h3>{period.label}</h3></div><span className="card-heading-icon"><CalendarCheck2 size={18} /></span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th></tr>
              </thead>
              <tbody>
                {days?.map((day) => (
                  <tr key={day.id}>
                    <td>{day.work_date}</td>
                    <td>{day.day_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Le compteur est informatif. Les règles fiscales/sociales doivent être
            vérifiées avec des sources officielles avant d’afficher des seuils.
          </p>
        </div>
      </section>
    </div>
  );
}
