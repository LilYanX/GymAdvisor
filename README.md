# GymAdvisor

Application web de **suivi de coachings sportifs à distance** : le coach programme et suit, le sportif exécute et renseigne.

Stack : **Next.js (App Router)** · **React** · **TypeScript** · **Tailwind CSS** · **Supabase** (Auth, Postgres, Storage).

## Démarrage

1. Copier `.env.example` vers `.env` et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (création de comptes sportifs côté serveur)
   - `NEXT_PUBLIC_SITE_URL` (URL publique en prod : sitemap, OG, invitations)
2. Installer : `npm.cmd install`
3. Appliquer les migrations SQL dans Supabase (`supabase/migrations/`, dans l’ordre)
4. Lancer : `npm.cmd run dev`

> Sur PowerShell, préférer `npm.cmd` si l’exécution des scripts est restreinte.  
> Le script `dev` utilise Webpack (`--webpack`) : Turbopack est souvent bloqué sous Windows.

## Espaces

### Coach
- Dashboard (todos, statuts sportifs)
- Sportifs : fiche, paiement du mois, charge cumulée, retours
- Suivi hebdo / mensuel : KPI, ressentis (radar), charges par zone, UA + RPE, ratio aigu/chronique, export Excel
- Éditeur de programme (semaines, supersets, sous-programmes / templates)
- Bibliothèque d’exercices + vidéos
- Paiements (échéance / blocage selon réglages profil)

### Sportif
- Accueil : semaine en cours, progression, séance du jour, rattrapage si retard
- Check-in pré-séance + **heure de début**
- Séance : séries, RPE, commentaires, **heure de fin** (gère le passage minuit)
- Programme de la semaine, activités libres
- Profil : dashboard métriques (sans export)

### Public
- Connexion / mot de passe oublié
- CGU (`/cgu`), confidentialité RGPD (`/rgpd`)
- Bannière cookies + analytics (Vercel) uniquement après consentement
- 404 custom, sitemap, robots.txt, Open Graph, favicon

## Concepts métier

| Concept | Définition |
|--------|------------|
| **UA** | Unité arbitraire = durée réelle (min) × (RPE moyen / 10) |
| **Semaine courante** | Avance automatiquement selon le calendrier des séances planifiées (pas selon la complétion) ; le coach peut forcer le numéro |
| **Aigu / chronique** | Charge 7 j / moyenne hebdo sur 28 j |

## Structure utile

```
src/app/                 # routes (coach, sportif, login, légal)
src/components/          # UI
src/lib/                 # domaine, actions serveur, Supabase
src/proxy.ts             # session Auth + redirect HTTPS (prod)
supabase/migrations/     # schéma & seeds
```

## Export Excel / Dashboard BI

L’export coach (`/sportifs/[id]/dashboard.xlsx`) produit un classeur avec :
- onglet **Dashboard** (KPI + aperçus)
- onglets **Ressenti**, **Charges UA**, **Charges par zone** (même structure de données)
- tableaux Excel nommés (`TbRessentiSerie`, `TbChargesUA`, `TbZones`) adaptés au volume de lignes

Pour un fichier BI avec **graphiques Excel natifs** à partir d’un export déjà téléchargé :

```bash
python scripts/generate-dashboard-bi.py "chemin/vers/suivi-….xlsx"
```

Sorties : `templates/GymAdvisor-Dashboard-BI.xlsx` et une copie dans `Downloads/`.

## Scripts npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |

## Sécurité & qualité (checklist site)

- HTTPS forcé en prod (redirect + HSTS)
- Cookies essentiels + consentement analytics
- Validation formulaires + honeypot anti-spam (login)
- Métadonnées SEO / partage social
- Contraste et layouts responsive soignés
