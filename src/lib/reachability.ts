/** `null` (inconnu) n’est pas hors ligne : on n’affiche pas le bandeau au démarrage. */
export function isOffline(connected: boolean | null | undefined): boolean {
  return connected === false;
}
