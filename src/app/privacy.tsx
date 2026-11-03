import { Body, Card, H2, Muted, Screen } from '@/ui/kit';

const P: [string, string][] = [
  ['Isolation par famille', 'Chaque donnée porte un family_id. Côté serveur, les politiques RLS Supabase n’autorisent la lecture et l’écriture qu’aux membres de cette famille : aucune autre famille ne peut y accéder.'],
  ['Profils mineurs', 'Un enfant n’a qu’un prénom et une couleur : pas d’e-mail, pas de téléphone, pas de date de naissance, pas de photo. Il ne peut pas être administrateur et n’apparaît jamais publiquement.'],
  ['Consentement parental', 'Le prénom d’un mineur n’est visible des membres invités (non parents) qu’avec l’accord explicite d’un parent (réglage « Partage autorisé » sur sa fiche). Sinon il s’affiche « Enfant ».'],
  ['Aucune géolocalisation', 'FamilyFit ne collecte aucune position, ni pour du marketing ni pour autre chose.'],
  ['Pas de conseil médical', 'Les objectifs et les séances sont des repères légers. FamilyFit ne pose aucun diagnostic. Consultez un professionnel de santé. Aucun poids, IMC ou calorie n’est suivi pour les enfants.'],
  ['Vos droits', 'Export complet (JSON) depuis l’onglet Famille. « Supprimer mon compte » efface les données de cet appareil et, si un compte en ligne existe et que la fonction a été installée, le compte sur le serveur. Aucune publicité, aucun traceur.'],
  ['Conditions d’utilisation (à valider)', 'Texte à valider. FamilyFit aide à organiser le quotidien familial. Ce n’est pas un dispositif médical. Les données de santé déclaratives ne servent pas à la publicité.'],
];

export default function Privacy() {
  return (
    <Screen>
      {P.map(([h, b]) => (
        <Card key={h}>
          <H2>{h}</H2>
          <Body>{b}</Body>
        </Card>
      ))}
      <Muted style={{ fontSize: 12 }}>Mode démo : les données restent uniquement sur cet appareil.</Muted>
    </Screen>
  );
}
