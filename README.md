# GymAdvisor

Suivi de coachings sportifs à distance (programmes, exercices, vidéos, retours).

## Démarrage

1. Copier `.env.example` vers `.env` et renseigner l’URL et la clé publishable Supabase.
2. Installer les dépendances : `npm.cmd install`
3. Exécuter les migrations SQL dans l’éditeur Supabase (`supabase/migrations/`).
4. Lancer l’app : `npm.cmd run dev`

Sur PowerShell, utiliser `npm.cmd` (et non `npm`) si l’exécution des scripts est désactivée.
Le script `dev` utilise Webpack (`--webpack`) : Turbopack est souvent bloqué par les politiques Windows.

## Fonctionnalités V1

- Coach : sportifs, éditeur de programme, bibliothèque + vidéos MP4, dashboard, paiements (échéance 25 / blocage J+5), fiche suivi (feedbacks, tonnage, check-ins)
- Sportif : consultation programme, saisie séances (séries, RPE), check-in, alerte nouveau programme
- Rappels coach : retard de saisie, 2 séances restantes, programme à préparer (todos dashboard)
