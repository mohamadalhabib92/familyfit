import { Alert, Platform } from 'react-native';
export function confirmAsk(msg: string, yes: () => void, okLabel = 'Confirmer') {
  if (Platform.OS === 'web') { if (typeof window === 'undefined' || window.confirm(msg)) yes(); return; }
  Alert.alert('Confirmation', msg, [{ text: 'Annuler', style: 'cancel' }, { text: okLabel, style: 'destructive', onPress: yes }]);
}
