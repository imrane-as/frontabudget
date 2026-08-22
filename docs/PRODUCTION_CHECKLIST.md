# Checklist avant lancement

## Produit
- [ ] Onboarding testé avec au moins 10 utilisateurs
- [ ] Responsive iPhone/Android vérifié
- [ ] Messages d'erreur utilisateurs propres
- [ ] États vides
- [ ] Chargements
- [ ] Suppression/modification des transactions
- [ ] Export des données
- [ ] Suppression du compte

## Sécurité
- [ ] Migration `0006_security_hardening.sql` appliquée sans erreur
- [ ] RLS activé sur chaque table publique
- [ ] Test croisé avec deux comptes
- [ ] Aucun secret dans le bundle client
- [ ] Service role uniquement dans webhook/backend
- [ ] Webhooks Stripe signés
- [ ] Rate limiting vérifié sur coach, météo et paiement
- [ ] Validation Zod vérifiée sur toutes les routes sensibles
- [ ] Supabase Security Advisor sans alerte critique
- [ ] `npm audit --omit=dev --audit-level=high` sans vulnérabilité élevée

## Données
- [ ] Sauvegardes activées
- [ ] Restauration testée
- [ ] Index de base de données
- [ ] Politique de rétention
- [ ] Politique de confidentialité

## Paiement
- [ ] Stripe en mode test
- [ ] Mensuel testé
- [ ] Annuel testé
- [ ] Annulation testée
- [ ] Webhook testé
- [ ] Customer Portal ajouté
- [ ] TVA/facturation validées avec un professionnel

## Production
- [ ] Domaine
- [ ] HTTPS
- [ ] Supabase production séparé
- [ ] Vercel production séparé
- [ ] Previews Vercel protégées par authentification
- [ ] Secrets Vercel marqués « Sensitive » et limités au bon environnement
- [ ] Error monitoring
- [ ] Analytics respectueux de la vie privée
- [ ] Email transactionnel

## Réglages Supabase Auth obligatoires

- [ ] **Confirm email** activé
- [ ] Longueur minimale du mot de passe : **12 caractères**
- [ ] Protection contre les mots de passe compromis activée
- [ ] Limites Auth vérifiées dans `Authentication > Rate Limits`
- [ ] CAPTCHA activé sur l'inscription et la récupération de mot de passe
- [ ] `Site URL` réglée sur l'URL HTTPS de production
- [ ] Redirect URLs limitées aux URL exactes nécessaires, sans wildcard global
- [ ] MFA proposée aux utilisateurs avant de stocker des données financières réelles

## Ordre d'un déploiement sécurisé

1. Créer un projet Supabase réservé à la production.
2. Exécuter les migrations `0001` à `0006` dans l'ordre.
3. Relancer **Security Advisor** et corriger toute alerte critique.
4. Configurer Auth, les URL autorisées et le CAPTCHA.
5. Ajouter les variables Vercel séparément pour Preview et Production.
6. Protéger les Preview Deployments avec Vercel Authentication.
7. Déployer d'abord une preview et tester avec deux comptes distincts.
8. Fusionner dans `master` uniquement après validation de la preview.
9. Vérifier les en-têtes HTTPS, l'authentification et les limites d'API en production.
10. Activer les sauvegardes et tester une restauration.
