import CheckoutButtons from "@/components/CheckoutButtons";
import LogoutButton from "@/components/LogoutButton";
import SmartPreferencesForm from "@/components/SmartPreferencesForm";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,residence_country,work_country,weather_city,budget_alert_threshold,monthly_savings_target")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <div className="page-head">
        <p className="muted">Compte et abonnement</p>
        <h1>Paramètres</h1>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h3>Mon compte</h3>
          <p><strong>{profile?.full_name || "Utilisateur"}</strong></p>
          <p className="muted">{user.email}</p>
          <p className="muted">
            {profile?.residence_country || "France"} → {profile?.work_country || "Luxembourg"}
          </p>
          <LogoutButton />
        </div>

        <div className="card">
          <h3>Abonnement</h3>
          <p>
            Plan actuel : <strong>{subscription?.plan || "free"}</strong>
          </p>
          <p className="muted">
            Statut : {subscription?.status || "actif gratuit"}
          </p>
          <CheckoutButtons />
        </div>
      </section>

      <section className="card section settings-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Assistant intelligent</span>
            <h3>Préférences intelligentes</h3>
          </div>
        </div>
        <p className="muted">
          Personnalise les calculs du coach, la météo et ton niveau de prudence.
        </p>
        <SmartPreferencesForm
          initialCity={profile?.weather_city || "Metz"}
          initialThreshold={Number(profile?.budget_alert_threshold) || 80}
          initialSavingsTarget={Number(profile?.monthly_savings_target) || 300}
        />
      </section>
    </div>
  );
}
