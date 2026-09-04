import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Check,
  CloudSun,
  LockKeyhole,
  ShieldCheck,
  ShoppingBasket,
  TrendingUp,
  Wallet
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="shell landing landing-v3">
      <header className="container marketing-nav marketing-nav-clean">
        <Link href="/" className="marketing-brand" aria-label="FrontaBudget">
          <BrandLogo />
        </Link>
        <div className="marketing-nav-actions">
          <Link className="marketing-login" href="/login">Se connecter</Link>
          <Link className="btn btn-primary" href="/signup">Créer mon espace</Link>
        </div>
      </header>

      <section className="container landing-hero landing-hero-clean">
        <div className="landing-copy">
          <span className="badge">Budget personnel pour les frontaliers</span>
          <h1>Comprends ton budget.<br /><span>Décide plus sereinement.</span></h1>
          <p className="lead">
            Tes dépenses, tes objectifs, la météo et des conseils concrets dans un seul espace clair.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary landing-primary" href="/signup">
              Commencer gratuitement <ArrowRight size={17} />
            </Link>
            <Link className="btn" href="/login">J’ai déjà un compte</Link>
          </div>
          <div className="landing-trust landing-trust-clean">
            <span><Check size={13} /> Configuration rapide</span>
            <span><LockKeyhole size={13} /> Données privées</span>
            <span><ShieldCheck size={13} /> Connexion sécurisée</span>
          </div>
        </div>

        <div className="landing-dashboard-preview" aria-label="Aperçu du tableau de bord">
          <div className="landing-preview-head">
            <div><span>Bonjour Imrane</span><strong>Vue d’ensemble</strong></div>
            <span className="preview-secure"><ShieldCheck size={13} /> Privé</span>
          </div>
          <div className="landing-preview-balance">
            <span><Wallet size={15} /> Disponible ce mois</span>
            <strong>1 284,50 €</strong>
            <small>Après 300 € d’épargne protégée</small>
          </div>
          <div className="landing-preview-row">
            <div><span>Revenus</span><strong>3 500 €</strong></div>
            <div><span>Dépenses</span><strong>1 615 €</strong></div>
          </div>
          <div className="landing-weather-strip">
            <span>🌤️</span>
            <div><strong>22° à Metz</strong><small>Temps favorable pour un trajet à pied</small></div>
            <CloudSun size={18} />
          </div>
        </div>
      </section>

      <section className="container landing-benefits-clean" id="fonctionnalites">
        <div className="landing-benefits-heading">
          <span className="eyebrow">L’ESSENTIEL, BIEN ORGANISÉ</span>
          <h2>Trois usages, aucune distraction.</h2>
        </div>
        <div className="landing-benefit-grid">
          <article>
            <span><TrendingUp size={19} /></span>
            <div><h3>Piloter le mois</h3><p>Visualise ce que tu peux encore dépenser et anticipe les dépassements.</p></div>
          </article>
          <article>
            <span><ShoppingBasket size={19} /></span>
            <div><h3>Mieux acheter</h3><p>Suis ton budget courses et consulte des prix récemment relevés près de ta ville.</p></div>
          </article>
          <article>
            <span><BellRing size={19} /></span>
            <div><h3>Agir au bon moment</h3><p>Reçois des alertes utiles et des pistes adaptées à ton profil.</p></div>
          </article>
        </div>
      </section>

      <section className="container landing-cta landing-cta-clean">
        <div><ShieldCheck size={24} /><span>Simple à commencer, facile à garder.</span></div>
        <h2>Ton budget mérite une vue claire.</h2>
        <Link className="btn btn-primary" href="/signup">Créer mon espace <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}
