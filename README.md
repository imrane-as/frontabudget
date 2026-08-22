# FrontaBudget

Application SaaS de budget destinée en priorité aux frontaliers France → Luxembourg.

## Fonctionnalités incluses

- Authentification Supabase avec email + mot de passe
- Confirmation email et callback PKCE
- Onboarding initial
- Dashboard mensuel
- Coach budget intelligent avec analyse locale et IA à la demande
- Prévision de fin de mois et détection des dépassements
- Météo générale Open-Meteo avec conseil d'économie contextuel
- Alertes WhatsApp de dépassement et résumé hebdomadaire
- Transactions et catégories
- Budgets mensuels
- Objectifs d'épargne
- Profil de mobilité France → Luxembourg
- Suivi des jours Luxembourg / télétravail / congé / maladie
- Row Level Security sur toutes les données utilisateur
- Base Stripe pour abonnements Premium
- UI responsive desktop/mobile
- Migrations SQL versionnées

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + PostgreSQL + RLS
- Stripe Billing
- Recharts
- Vercel pour l'hébergement

---

## 1. Prérequis

Installer :

- Node.js LTS
- npm
- Git

Vérifier :

```bash
node -v
npm -v
git --version
```

## 2. Installer le projet

```bash
npm install
```

Dupliquer :

```bash
cp .env.example .env.local
```

Sous Windows PowerShell :

```powershell
Copy-Item .env.example .env.local
```

## 3. Créer Supabase

Créer un projet sur Supabase.

Dans Project Settings / Connect, récupérer :

- Project URL
- Publishable key

Renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 4. Créer la base

Dans Supabase > SQL Editor, exécuter dans l'ordre :

1. `supabase/migrations/0001_initial.sql`
2. `supabase/migrations/0002_recurring_processor.sql`
3. `supabase/migrations/0003_smart_budget.sql`

La migration 0001 active RLS sur toutes les tables.

## 5. Configurer Auth

Dans Supabase > Authentication > URL Configuration :

Local :

```text
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
```

Pour la production, ajouter ensuite :

```text
https://votre-domaine.fr/auth/callback
```

## 6. Démarrer

```bash
npm run dev
```

Ouvrir :

```text
http://localhost:3000
```

Créer un compte, confirmer l'email, puis terminer l'onboarding.

## 7. Recurring transactions

La fonction SQL :

```text
materialize_due_recurring_transactions(user_id)
```

matérialise les échéances dues.

Pour la V1, elle peut être appelée après connexion ou depuis une route sécurisée.

Pour une vraie production à volume plus important, utiliser un job planifié (Supabase Cron/pg_cron, ou Vercel Cron) avec une stratégie idempotente.

## 8. Stripe

Créer dans Stripe :

- Produit : FrontaBudget Premium
- Prix mensuel
- Prix annuel

Renseigner :

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_MONTHLY_PRICE_ID=
STRIPE_PREMIUM_YEARLY_PRICE_ID=
```

Le webhook Stripe utilise aussi une clé serveur Supabase :

```env
SUPABASE_SERVICE_ROLE_KEY=
```

IMPORTANT : cette clé ne doit jamais commencer par `NEXT_PUBLIC_` et ne doit jamais être envoyée au navigateur.

Créer le webhook Stripe :

```text
POST https://votre-domaine.fr/api/stripe/webhook
```

Événements nécessaires :

```text
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

## 9. Assistant intelligent et météo

L'analyse locale, les prévisions, les alertes dans l'application et la météo
fonctionnent sans clé OpenAI. La météo utilise Open-Meteo et met les réponses en
cache afin de limiter les appels.

Pour activer le bouton « Affiner avec l'IA », ajouter :

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

L'application n'envoie à l'IA que des agrégats (totaux, catégories et budgets),
jamais les libellés détaillés des transactions. L'appel est manuel et limité à
3 analyses par utilisateur et par jour.

## 10. Alertes WhatsApp

Créer une application Meta avec WhatsApp Cloud API, puis renseigner :

```env
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_TEMPLATE_LANGUAGE=fr
WHATSAPP_TEMPLATE_BUDGET_ALERT=frontabudget_budget_alert
WHATSAPP_TEMPLATE_WEEKLY_SUMMARY=frontabudget_weekly_summary
CRON_SECRET=
```

Créer et faire approuver deux modèles WhatsApp avec ces corps :

```text
frontabudget_budget_alert
Alerte FrontaBudget : vous avez utilisé {{1}} % du budget {{2}} ({{3}} € sur {{4}} €).

frontabudget_weekly_summary
Résumé FrontaBudget : dépenses {{1}} €, revenus {{2}} €, disponible {{3}} €. Conseil : {{4}}
```

Le fichier `vercel.json` exécute `/api/cron/budget-alerts` chaque jour à 07:00 UTC.
Le moteur envoie une seule alerte par seuil et par budget, puis un résumé chaque
lundi si l'utilisateur l'a activé.

## 11. Déploiement Vercel

Créer un dépôt GitHub puis :

```bash
git init
git add .
git commit -m "Initial FrontaBudget production foundation"
git branch -M main
git remote add origin <URL_DU_REPO>
git push -u origin main
```

Dans Vercel :

1. Add New > Project
2. Importer le dépôt
3. Ajouter toutes les variables `.env.local`
4. Déployer

Mettre ensuite :

```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

ou votre vrai domaine.

Redéployer après changement de variable.

## 12. Avant ouverture au public

À faire avant de demander de l'argent à de vrais utilisateurs :

- Acheter/configurer un domaine
- Politique de confidentialité
- CGU/CGV
- Mentions légales
- Gestion du consentement si analytics/cookies non nécessaires
- Export/suppression des données
- Sauvegardes et procédure de restauration
- Logs d'erreurs
- Monitoring
- Rate limiting des API sensibles
- Tests de sécurité
- Environnements staging et production séparés
- Vérification des règles fiscales/sociales frontalières avec sources officielles
- Ne jamais présenter un calcul fiscal comme un conseil fiscal personnalisé

## 13. Roadmap recommandée

### Phase 1
- Tester inscription/login
- Tester RLS avec deux comptes différents
- Ajouter/modifier/supprimer transactions
- Améliorer onboarding

### Phase 2
- Charges récurrentes automatiques
- Exports CSV/PDF
- Import CSV
- Catégories personnalisées
- Contributions aux objectifs

### Phase 3
- Premium Stripe complet
- Customer Portal Stripe
- Entitlements Premium côté serveur
- Emails transactionnels

### Phase 4
- Open Banking si le produit est validé
- Notifications email de secours
- Tests d'évaluation des conseils IA

## Sécurité

Ne commitez jamais `.env.local`.

Variables publiques :

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

Variables strictement serveur :

```text
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
CRON_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```
