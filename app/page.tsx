import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  Calculator,
  Check,
  CloudSun,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet
} from "lucide-react";
import MerchantMark from "@/components/MerchantMark";

export default function HomePage() {
  return (
    <main className="shell landing landing-v2">
      <header className="container marketing-nav">
        <Link href="/" className="marketing-brand">
          <span className="logo-mark">F</span>
          <span>Fronta<strong>Budget</strong></span>
        </Link>
        <nav aria-label="Navigation principale">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#securite">Sécurité</a>
        </nav>
        <div className="marketing-nav-actions">
          <Link className="marketing-login" href="/login">Se connecter</Link>
          <Link className="btn btn-primary" href="/signup">Créer mon espace</Link>
        </div>
      </header>

      <section className="container landing-hero">
        <div className="landing-copy">
          <span className="badge"><Sparkles size={14} /> Le copilote joyeux des frontaliers 🇫🇷 → 🇱🇺</span>
          <h1>Ton argent devient enfin <span>simple et motivant.</span></h1>
          <p className="lead">
            FrontaBudget classe tes dépenses, protège ton épargne et prévoit la fin du
            mois dans une application claire qui donne envie de suivre son budget.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary landing-primary" href="/signup">
              Commencer gratuitement <ArrowRight size={17} />
            </Link>
            <Link className="btn" href="/login">Voir mon espace</Link>
          </div>
          <div className="landing-trust">
            <span><Check size={13} /> Gratuit pour commencer</span>
            <span><LockKeyhole size={13} /> Données isolées par utilisateur</span>
            <span><Sparkles size={13} /> IA à la demande</span>
          </div>
        </div>

        <div className="landing-preview" aria-label="Aperçu de FrontaBudget">
          <span className="preview-glow preview-glow-one" aria-hidden="true" />
          <span className="preview-glow preview-glow-two" aria-hidden="true" />
          <div className="preview-window">
            <div className="preview-window-top">
              <div><i /><i /><i /></div>
              <span><ShieldCheck size={12} /> Espace sécurisé</span>
            </div>
            <div className="preview-welcome">
              <div><small>Bonjour Imrane 👋</small><strong>Ton mois en un regard</strong></div>
              <span>✨</span>
            </div>
            <div className="preview-balance">
              <span><Wallet size={14} /> Disponible à dépenser</span>
              <strong>1 284,50 €</strong>
              <small>300 € d’épargne déjà protégés</small>
              <div className="preview-balance-stats">
                <span><small>Par jour</small><strong>142,72 €</strong></span>
                <span><small>Santé</small><strong>82 / 100</strong></span>
              </div>
            </div>
            <div className="preview-mini-grid">
              <div><span>Revenus</span><strong>3 500 €</strong><small className="amount-income">+ ce mois</small></div>
              <div><span>Dépenses</span><strong>1 615 €</strong><small className="amount-expense">73 € / jour</small></div>
            </div>
            <div className="preview-transactions">
              <div className="preview-section-head"><strong>Dernières dépenses</strong><span>Voir tout</span></div>
              <div className="preview-transaction"><MerchantMark name="Netflix" categoryName="Abonnements" /><span><strong>Netflix</strong><small>📺 Abonnements</small></span><b>- 19,99 €</b></div>
              <div className="preview-transaction"><MerchantMark name="Cetelem" categoryName="Crédit" /><span><strong>Cetelem</strong><small>🏦 Crédit</small></span><b>- 189,00 €</b></div>
              <div className="preview-ai-note"><BrainCircuit size={15} /><span><strong>Conseil du jour</strong><small>Tu peux économiser 46 € ce mois-ci.</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-proof-row">
        <span>Construit pour le quotidien</span>
        <div><strong>Budget</strong><strong>Météo</strong><strong>Trajets</strong><strong>Objectifs</strong><strong>IA</strong></div>
      </section>

      <section className="container feature-section landing-features" id="fonctionnalites">
        <div className="section-intro">
          <span className="eyebrow">Simple, utile, intelligent</span>
          <h2>Tout ce qu’il faut pour avancer avec le sourire.</h2>
          <p className="muted">Des chiffres compréhensibles, des alertes utiles et zéro tableur compliqué.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-mint">
            <span className="feature-icon"><BrainCircuit /></span>
            <h3>Coach budget</h3>
            <p>Des conseils basés sur tes vrais totaux, avec IA activée uniquement à ta demande.</p>
            <span className="feature-tag">Intelligent</span>
          </article>
          <article className="feature-card feature-coral">
            <span className="feature-icon"><BellRing /></span>
            <h3>Alertes prédictives</h3>
            <p>Détecte un plafond atteint et prévoit les dépenses probables en fin de mois.</p>
            <span className="feature-tag">Préventif</span>
          </article>
          <article className="feature-card feature-violet">
            <span className="feature-icon"><Calculator /></span>
            <h3>Simulateur d’économies</h3>
            <p>Teste une réduction et découvre immédiatement son impact mensuel et annuel.</p>
            <span className="feature-tag">Motivant</span>
          </article>
          <article className="feature-card feature-blue">
            <span className="feature-icon"><CloudSun /></span>
            <h3>Météo utile</h3>
            <p>Prévisions générales et astuce contextuelle pour économiser sur tes déplacements.</p>
            <span className="feature-tag">Pratique</span>
          </article>
        </div>
      </section>

      <section className="container landing-security" id="securite">
        <div className="security-visual"><ShieldCheck size={44} /><span /><span /></div>
        <div>
          <span className="eyebrow">Conçu avec prudence</span>
          <h2>Intelligent, mais jamais curieux.</h2>
          <p>Les calculs essentiels restent locaux. L’IA reçoit uniquement les informations nécessaires et uniquement lorsque tu la demandes.</p>
          <div className="security-points">
            <span><Check size={14} /> Accès authentifié</span>
            <span><Check size={14} /> Isolation Supabase RLS</span>
            <span><Check size={14} /> Limites d’API</span>
            <span><Check size={14} /> Aucun montant pour la recherche commerçant</span>
          </div>
        </div>
      </section>

      <section className="container landing-cta">
        <span className="cta-orb" aria-hidden="true" />
        <div><TrendingUp size={27} /><span>Prêt à mieux profiter de ton argent ?</span></div>
        <h2>Commence aujourd’hui, ton futur budget te remerciera.</h2>
        <Link className="btn btn-primary" href="/signup">Créer mon espace gratuit <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}
