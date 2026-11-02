import { supportEmail, teenMinAge } from '@/lib/config';
import { HEALTH_DISCLAIMER } from '@/lib/health';
import { Body, Card, H2, Muted, Screen } from '@/ui/kit';

const P: [string, string][] = [
  ['Isolation par famille', 'Chaque donnée porte un family_id. Côté serveur, les politiques RLS Supabase n’autorisent la lecture et l’écriture qu’aux membres de cette famille : aucune autre famille ne peut y accéder. Preuve automatisée : npm test (scripts/test-rls.mjs).'],
  ['Profils mineurs', 'Un enfant n’a qu’un prénom et une couleur : pas d’e-mail, pas de téléphone, pas de date de naissance, pas de photo. Il ne peut pas être administrateur et n’apparaît jamais publiquement.'],
  ['Consentement parental', 'Le prénom d’un mineur n’est visible des membres invités (non parents) qu’avec l’accord explicite d’un parent (réglage « Partage autorisé » sur sa fiche). Sinon il s’affiche « Enfant ».'],
  ['Compte ado', `L’accès autonome d’un adolescent (âge minimal ${teenMinAge()} ans, réglable par l’éditeur) n’est pas encore ouvert. Aucun compte enfant n’est créé.`],
  ['Aucune géolocalisation', 'FamilyFit ne collecte aucune position, ni pour du marketing ni pour autre chose.'],
  ['Pas de conseil médical', HEALTH_DISCLAIMER],
  ['Suppression du compte', 'Depuis l’onglet Famille, « Supprimer mon compte » efface les données de cet appareil. Avec un compte en ligne, le serveur retire votre accès et transmet le rôle d’administrateur à un autre adulte s’il en existe un. S’il n’y a pas d’autre adulte, la famille est supprimée. Texte à valider (nLPD, Apple 5.1.1).'],
  ['Vos droits', 'Export complet (JSON) et suppression depuis l’onglet Famille. Aucune publicité, aucun traceur, aucun SDK d’analyse tiers. Hébergement : région UE ou Suisse, au choix de l’éditeur (à valider).'],
  ['Conditions d’utilisation', 'Le texte juridique complet est à valider par l’éditeur. FamilyFit sert à organiser la famille. Ce n’est pas un service médical, et les données de santé ne sont pas utilisées pour de la publicité.'],
];

export default function Privacy() {
  const mail = supportEmail();
  return (
    <Screen>
      {P.map(([h, b]) => (
        <Card key={h}>
          <H2>{h}</H2>
          <Body>{b}</Body>
        </Card>
      ))}
      <Muted style={{ fontSize: 12 }}>Mode essai : les données restent uniquement sur cet appareil. {mail ? `Support : ${mail}` : 'Support : YOUR_SUPPORT_EMAIL (à renseigner).'} Politique à valider — pas un texte juridique final.</Muted>
    </Screen>
  );
}
