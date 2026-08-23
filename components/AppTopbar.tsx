import Link from "next/link";
import { LockKeyhole, Plus, Sparkles } from "lucide-react";

function getInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "F";
}

export default function AppTopbar({ email }: { email: string }) {
  return (
    <header className="app-topbar">
      <Link href="/dashboard" className="topbar-mobile-brand" aria-label="FrontaBudget">
        <span className="logo-mark">F</span>
        <span>
          Fronta<strong>Budget</strong>
        </span>
      </Link>

      <div className="topbar-status">
        <span className="sync-orb" aria-hidden="true">
          <Sparkles size={13} />
        </span>
        <div>
          <strong>Ton espace budget</strong>
          <span><LockKeyhole size={11} /> Données privées et synchronisées</span>
        </div>
      </div>

      <div className="topbar-actions">
        <Link href="/transactions" className="btn btn-primary topbar-add">
          <Plus size={17} />
          <span>Nouvelle opération</span>
        </Link>
        <Link href="/settings" className="topbar-avatar" aria-label="Ouvrir les paramètres">
          {getInitial(email)}
        </Link>
      </div>
    </header>
  );
}
