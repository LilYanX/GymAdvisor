import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description: "Conditions générales d’utilisation de GymAdvisor.",
};

export default function CguPage() {
  return (
    <LegalPageShell title="Conditions générales d’utilisation">
      <p>
        Les présentes CGU régissent l’accès et l’utilisation de{" "}
        <strong>GymAdvisor</strong>, plateforme de suivi de coachings sportifs
        à distance.
      </p>

      <h2>1. Objet</h2>
      <p>
        GymAdvisor permet à un coach de programmer des séances, suivre les
        retours de ses sportifs, et aux sportifs de consulter et renseigner
        leurs entraînements.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        L’accès nécessite un compte nominatif. Les identifiants sont
        personnels et confidentiels. L’utilisateur est responsable de leur
        usage.
      </p>

      <h2>3. Rôles</h2>
      <ul>
        <li>
          <strong>Coach</strong> : crée et publie les programmes, suit les
          sportifs et les paiements éventuels.
        </li>
        <li>
          <strong>Sportif</strong> : consulte son programme, renseigne ses
          séances et ressentis.
        </li>
      </ul>

      <h2>4. Contenu et responsabilité</h2>
      <p>
        Les prescriptions d’entraînement relèvent de la responsabilité du
        coach. GymAdvisor est un outil de suivi et ne remplace pas un avis
        médical. En cas de douleur ou de doute, consultez un professionnel de
        santé.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <a href="/rgpd" className="text-ga-lime hover:underline">
          politique de confidentialité
        </a>
        .
      </p>

      <h2>6. Disponibilité</h2>
      <p>
        Nous nous efforçons d’assurer une disponibilité continue du service,
        sans garantie d’absence d’interruption (maintenance, incidents réseau).
      </p>

      <h2>7. Modification</h2>
      <p>
        Les CGU peuvent évoluer. La version applicable est celle publiée sur
        cette page.
      </p>

      <p className="pt-2 text-xs">Dernière mise à jour : septembre 2026.</p>
    </LegalPageShell>
  );
}
