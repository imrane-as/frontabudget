import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <div className="container hero">
        <div className="hero-inner">
          <span className="badge">Pensé pour les frontaliers 🇫🇷 → 🇱🇺</span>
          <h1>Ton salaire, ton budget, tes trajets. Enfin au même endroit.</h1>
          <p className="lead">
            FrontaBudget t’aide à suivre revenus, dépenses, budgets, épargne,
            mobilité et jours de travail sans transformer ta vie en tableur.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/signup">
              Commencer gratuitement
            </Link>
            <Link className="btn" href="/login">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
