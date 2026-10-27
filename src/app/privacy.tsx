import { Body, Card, H2, Muted, Screen } from '@/ui/kit';

const P: [string, string][] = [
  ['Isolation par famille', 'Chaque donnée porte un family_id. Côté serveur, les politiques RLS Supabase n’autorisent la lecture et l’écriture qu’aux membres de cette famille : aucune autre famille ne peut y accéder.'],
  ['Profils mineurs', 'Un enfant n’a qu’un prénom et une couleur : pas d’e-mail, pas de téléphone, pas de date de naissance, pas de photo. Il ne peut pas être administrateur et n’apparaît jamais publiquement.'],
  ['Consentement parental', 'Le prénom d’un mineur n’est visible des membres invités (non parents) qu’avec l’accord explicite d’un parent (réglage « Partage autorisé » sur sa fiche). Sinon il s’affiche « Enfant ».'],
  ['Aucune géolocalisation', 'FamilyFit ne collecte aucune position, ni pour du marketing ni pour autre chose.'],
  ['Pas de conseil médical', 'Les objectifs bien-être sont des repères légers et encourageants. Ils ne remplacent pas un avis médical.'],
  ['Vos droits', 'Export complet (JSON) et suppression de toutes les données depuis l’onglet Famille. Aucune publicité, aucun traceur.'],
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
