import Link from "next/link";
import { BellRing, BrainCircuit, Calculator, CloudSun } from "lucide-react";

export default function HomePage() {
  return (
    <main className="shell landing">
      <div className="container hero">
        <div className="hero-inner">
          <span className="badge">Le copilote budget des frontaliers 🇫🇷 → 🇱🇺</span>
          <h1>Ton budget te prévient avant qu’il soit trop tard.</h1>
          <p className="lead">
            FrontaBudget analyse tes dépenses, prévoit la fin du mois et transforme
            tes chiffres en décisions simples — sans tableur compliqué.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/signup">
              Commencer gratuitement
            </Link>
            <Link className="btn" href="/login">
              Se connecter
            </Link>
          </div>
          <p className="hero-proof">Analyse locale gratuite · IA à la demande · Données protégées par utilisateur</p>
        </div>
      </div>

      <section className="container feature-section">
        <div className="section-intro">
          <span className="eyebrow">Simple, utile, intelligent</span>
          <h2>Les informations dont tu as besoin, au bon moment.</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <BrainCircuit />
            <h3>Coach budget</h3>
            <p>Conseils basés sur tes vrais totaux, avec IA activée uniquement à ta demande.</p>
          </article>
          <article className="feature-card">
            <BellRing />
            <h3>Alertes prédictives</h3>
            <p>Détecte un plafond atteint et prévoit les dépenses probables en fin de mois.</p>
          </article>
          <article className="feature-card">
            <Calculator />
            <h3>Simulateur d’économies</h3>
            <p>Teste une réduction par catégorie et découvre son impact mensuel et annuel.</p>
          </article>
          <article className="feature-card">
            <CloudSun />
            <h3>Météo utile</h3>
            <p>Prévisions générales et astuce contextuelle pour économiser sur tes déplacements.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
