import Link from "next/link";
import { ArrowUpRight, BadgeEuro, BriefcaseBusiness, PackageOpen } from "lucide-react";

type EmploymentStatus =
  | "employee"
  | "self_employed"
  | "student"
  | "job_seeker"
  | "retired"
  | "other"
  | null;

type Idea = { title: string; detail: string; icon: "work" | "sell" | "skill" };

function buildIdeas({
  birthYear,
  employmentStatus,
  skills
}: {
  birthYear: number | null;
  employmentStatus: EmploymentStatus;
  skills: string;
}): Idea[] {
  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - birthYear : null;
  const cleanSkills = skills.trim();
  const skillSummary = cleanSkills.split(",").slice(0, 2).join(" et ");

  const ideas: Idea[] = [
    {
      title: cleanSkills ? `Transformer ${skillSummary} en micro-service` : "Créer un micro-service simple",
      detail: cleanSkills
        ? "Définis une offre très précise, un délai court et commence par une seule mission test."
        : "Ajoute tes compétences au profil pour obtenir une piste plus adaptée.",
      icon: "skill"
    },
    {
      title: "Vendre ce qui ne sert plus",
      detail: "Sélectionne cinq objets en bon état, photographie-les ensemble et publie-les cette semaine.",
      icon: "sell"
    }
  ];

  if (employmentStatus === "employee") {
    ideas.push({
      title: "Vérifier les revenus disponibles au travail",
      detail: "Regarde les primes, cooptations, heures autorisées et avantages non réclamés avant une activité externe.",
      icon: "work"
    });
  } else if (employmentStatus === "self_employed") {
    ideas.push({
      title: "Créer une offre récurrente",
      detail: "Propose à un client existant un suivi mensuel simple plutôt qu’une prestation unique.",
      icon: "work"
    });
  } else if (employmentStatus === "student") {
    ideas.push({
      title: "Choisir une mission compatible avec les études",
      detail: "Privilégie une mission courte le week-end ou une aide ponctuelle liée à ta formation.",
      icon: "work"
    });
  } else if (employmentStatus === "job_seeker") {
    ideas.push({
      title: "Valoriser une mission courte",
      detail: "Cible une prestation qui renforce aussi ton portfolio et vérifie son impact sur tes droits.",
      icon: "work"
    });
  } else if (employmentStatus === "retired" || (age !== null && age >= 58)) {
    ideas.push({
      title: "Transmettre ton expérience",
      detail: "Teste le mentorat, l’aide pratique ou un atelier ponctuel dans un domaine que tu maîtrises.",
      icon: "work"
    });
  } else {
    ideas.push({
      title: "Tester un service local ponctuel",
      detail: "Commence par une demande réelle de ton entourage et évite tout investissement avant le premier client.",
      icon: "work"
    });
  }

  return ideas;
}

const icons = {
  work: BriefcaseBusiness,
  sell: PackageOpen,
  skill: BadgeEuro
};

export default function IncomeIdeasCard({
  birthYear,
  employmentStatus,
  skills
}: {
  birthYear: number | null;
  employmentStatus: EmploymentStatus;
  skills: string;
}) {
  const ideas = buildIdeas({ birthYear, employmentStatus, skills });
  const incomplete = !birthYear || !employmentStatus || !skills.trim();

  return (
    <article className="card income-ideas-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">Revenus complémentaires</span>
          <h3>Des pistes réalistes pour toi</h3>
        </div>
        <span className="card-heading-icon"><ArrowUpRight size={18} /></span>
      </div>

      <div className="income-idea-list">
        {ideas.map((idea) => {
          const Icon = icons[idea.icon];
          return (
            <div className="income-idea" key={idea.title}>
              <span><Icon size={16} /></span>
              <div><strong>{idea.title}</strong><p>{idea.detail}</p></div>
            </div>
          );
        })}
      </div>

      {incomplete && <Link href="/settings" className="income-profile-link">Compléter mon profil <ArrowUpRight size={13} /></Link>}
      <small className="income-disclaimer">Vérifie ton contrat de travail, les règles fiscales et les autorisations applicables avant de commencer.</small>
    </article>
  );
}
