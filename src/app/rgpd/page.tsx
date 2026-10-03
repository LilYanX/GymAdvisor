import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Confidentialité (RGPD)",
  description:
    "Politique de confidentialité et informations relatives au RGPD pour GymAdvisor.",
};

export default function RgpdPage() {
  return (
    <LegalPageShell title="Politique de confidentialité (RGPD)">
      <p>
        La présente politique décrit comment <strong>GymAdvisor</strong>{" "}
        traite les données personnelles dans le cadre du suivi de coachings
        sportifs à distance.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l’éditeur de GymAdvisor (le coach ou
        l’organisme utilisant l’application). Pour toute question relative à
        vos données, contactez votre coach via l’application ou l’adresse
        e-mail associée à votre compte.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Identité et contact : prénom, nom, adresse e-mail</li>
        <li>
          Données d’entraînement : séances, charges, RPE, horaires, activités
          libres
        </li>
        <li>
          Ressentis pré-séance McLean (fatigue, sommeil, courbatures, stress,
          humeur) et
          commentaires éventuels
        </li>
        <li>Données techniques : cookies de session, journaux de connexion</li>
      </ul>

      <h2>3. Finalités</h2>
      <ul>
        <li>Fournir le service de suivi coach / sportif</li>
        <li>Sécuriser l’accès aux comptes</li>
        <li>
          Améliorer le service (mesure d’audience anonymisée, uniquement avec
          consentement)
        </li>
      </ul>

      <h2>4. Bases légales</h2>
      <p>
        Exécution du contrat de coaching / service, intérêt légitime
        (sécurité), et consentement pour les cookies non essentiels et
        l’analytics.
      </p>

      <h2>5. Destinataires</h2>
      <p>
        Les données sont accessibles au coach concerné et aux prestataires
        techniques nécessaires au fonctionnement (hébergement, authentification
        — ex. Supabase). Elles ne sont pas vendues.
      </p>

      <h2>6. Durée de conservation</h2>
      <p>
        Les données sont conservées pendant la durée de la relation de
        coaching, puis archivées ou supprimées selon les besoins légitimes du
        coach et les obligations applicables.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de
        rectification, d’effacement, de limitation, de portabilité et
        d’opposition. Vous pouvez aussi introduire une réclamation auprès de la
        CNIL (<a href="https://www.cnil.fr" className="text-ga-lime hover:underline">cnil.fr</a>).
      </p>

      <h2>8. Cookies</h2>
      <p>
        Des cookies strictement nécessaires assurent la connexion sécurisée.
        Les cookies / balises de mesure d’audience ne sont déposés qu’après
        acceptation via la bannière cookies.
      </p>

      <p className="pt-2 text-xs">Dernière mise à jour : septembre 2026.</p>
    </LegalPageShell>
  );
}
