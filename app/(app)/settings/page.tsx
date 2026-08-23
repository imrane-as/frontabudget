import { Settings, ShieldCheck, Sparkles } from "lucide-react";
import CheckoutButtons from "@/components/CheckoutButtons";
import LogoutButton from "@/components/LogoutButton";
import PageIntro from "@/components/PageIntro";
import ProfileEditor from "@/components/ProfileEditor";
import SmartPreferencesForm from "@/components/SmartPreferencesForm";
import { requireUser } from "@/lib/auth";

type ProfileData = {
  full_name: string | null;
  residence_country: string | null;
  work_country: string | null;
  weather_city: string | null;
  budget_alert_threshold: number | null;
  monthly_savings_target: number | string | null;
  birth_year?: number | null;
  household_size?: number | null;
  employment_status?: "employee" | "self_employed" | "student" | "job_seeker" | "retired" | "other" | null;
  skills?: string | null;
  grocery_budget_weekly?: number | string | null;
  avatar_path?: string | null;
  updated_at?: string | null;
};

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const extendedProfileResult = await supabase
    .from("profiles")
    .select("full_name,residence_country,work_country,weather_city,budget_alert_threshold,monthly_savings_target,birth_year,household_size,employment_status,skills,grocery_budget_weekly,avatar_path,updated_at")
    .eq("id", user.id)
    .single();

  let profile = extendedProfileResult.data as ProfileData | null;
  if (extendedProfileResult.error) {
    const fallbackProfileResult = await supabase
      .from("profiles")
      .select("full_name,residence_country,work_country,weather_city,budget_alert_threshold,monthly_savings_target,updated_at")
      .eq("id", user.id)
      .single();
    profile = fallbackProfileResult.data as ProfileData | null;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="page-shell settings-page">
      <PageIntro
        eyebrow="Compte et préférences"
        title="Paramètres"
        tone="violet"
        icon={<Settings size={26} />}
        description="Personnalise ton copilote financier et garde la maîtrise de tes données."
        aside={<span className="page-feature-pill"><ShieldCheck size={14} /> Espace privé</span>}
      />

      <section className="grid grid-2 content-section settings-overview-grid">
        <div className="card account-card">
          <span className="eyebrow">Profil</span>
          <h3>Mon compte</h3>
          <p><strong>{profile?.full_name || "Utilisateur"}</strong></p>
          <p className="muted">{user.email}</p>
          <p className="muted">
            {profile?.residence_country || "France"} → {profile?.work_country || "Luxembourg"}
          </p>
          <LogoutButton />
        </div>

        <div className="card subscription-card">
          <span className="eyebrow">Formule</span>
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

      <section className="card section settings-card profile-settings-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Profil personnalisé</span>
            <h3>Mieux te connaître pour mieux t’aider</h3>
          </div>
          <span className="card-heading-icon"><Sparkles size={18} /></span>
        </div>
        <p className="muted">
          Ces informations restent privées et servent à adapter les budgets courses et les suggestions à ta situation.
        </p>
        <ProfileEditor
          initialFullName={profile?.full_name || ""}
          initialBirthYear={profile?.birth_year || null}
          initialHouseholdSize={profile?.household_size || 1}
          initialEmploymentStatus={profile?.employment_status || null}
          initialSkills={profile?.skills || ""}
          initialGroceryBudgetWeekly={
            profile?.grocery_budget_weekly === null || profile?.grocery_budget_weekly === undefined
              ? null
              : Number(profile.grocery_budget_weekly)
          }
          initialHasAvatar={Boolean(profile?.avatar_path)}
          profileVersion={profile?.updated_at || null}
        />
      </section>

      <section className="card section settings-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Assistant budget</span>
            <h3>Préférences du coach</h3>
          </div>
          <span className="card-heading-icon"><Sparkles size={18} /></span>
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
