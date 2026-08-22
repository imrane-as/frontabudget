import WorkDayForm from "@/components/WorkDayForm";
import MetricCard from "@/components/MetricCard";
import { requireUser } from "@/lib/auth";

export default async function WorkCalendarPage() {
  const { supabase, user } = await requireUser();
  const year = new Date().getFullYear();

  const { data: days } = await supabase
    .from("work_days")
    .select("*")
    .eq("user_id", user.id)
    .gte("work_date", `${year}-01-01`)
    .lte("work_date", `${year}-12-31`)
    .order("work_date", { ascending: false });

  const count = (type: string) => days?.filter((d) => d.day_type === type).length ?? 0;

  return (
    <div>
      <div className="page-head">
        <p className="muted">Suivi annuel {year}</p>
        <h1>Jours de travail</h1>
      </div>

      <section className="grid grid-4">
        <MetricCard label="Luxembourg" value={`${count("luxembourg")} j`} />
        <MetricCard label="Télétravail" value={`${count("remote")} j`} />
        <MetricCard label="Congés" value={`${count("leave")} j`} />
        <MetricCard label="Maladie" value={`${count("sick")} j`} />
      </section>

      <section className="grid grid-2 section">
        <div className="card">
          <h3>Ajouter / modifier une journée</h3>
          <WorkDayForm />
        </div>

        <div className="card">
          <h3>Dernières journées</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th></tr>
              </thead>
              <tbody>
                {days?.slice(0, 30).map((day) => (
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
