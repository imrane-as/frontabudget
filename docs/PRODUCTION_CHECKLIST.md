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
- [ ] RLS activé sur chaque table
- [ ] Test croisé avec deux comptes
- [ ] Aucun secret dans le bundle client
- [ ] Service role uniquement dans webhook/backend
- [ ] Webhooks Stripe signés
- [ ] Rate limiting
- [ ] Validation Zod sur toutes les routes d'écriture sensibles

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
- [ ] Error monitoring
- [ ] Analytics respectueux de la vie privée
- [ ] Email transactionnel
