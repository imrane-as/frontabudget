# Politique de sécurité

## Signaler une vulnérabilité

Ne publiez pas de vulnérabilité contenant des données utilisateur dans une issue
publique. Utilisez l'onglet **Security > Advisories > Report a vulnerability** du
dépôt GitHub afin de transmettre le problème de manière privée.

Incluez si possible :

- la route ou la fonctionnalité concernée ;
- les étapes minimales pour reproduire ;
- l'impact observé ;
- une proposition de correction, si disponible.

Ne joignez jamais de clé Supabase, Stripe, OpenAI ou Vercel au rapport.

## Secrets

Les secrets sont exclusivement stockés dans les variables d'environnement de
production. Seules l'URL Supabase, la clé Supabase publiable et l'URL publique de
l'application peuvent porter le préfixe `NEXT_PUBLIC_`.

En cas d'exposition supposée, révoquez immédiatement la clé concernée, créez-en
une nouvelle et redéployez l'application.
