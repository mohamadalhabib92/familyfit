import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useData } from '@/lib/data';
import { checkDemoOtp, isEmail, isPhone, makeDemoOtp, normContact, OtpError, sendOtp, supabaseConfigured, verifyOtp, type Channel, type DemoOtp } from '@/lib/supabase';
import { uid } from '@/lib/storage';
import { Button, Card, DemoBanner, Eyebrow, Field, H1, Muted, Notice, Row, Screen, Segmented, Spacer, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

const COOLDOWN = 30;

export default function Auth() {
  const { setSession } = useData();
  const router = useRouter();
  const [ch, setCh] = useState<Channel>('email');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'ask' | 'verify'>('ask');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const demo = useRef<DemoOtp | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const c = normContact(contact, ch);
  const valid = ch === 'email' ? isEmail(c) : isPhone(c);

  const request = async () => {
    setErr(null);
    if (!valid) return setErr(ch === 'email' ? 'Adresse e-mail invalide.' : 'Numéro invalide : format international, ex. +41 79 123 45 67.');
    setBusy(true);
    try {
      if (supabaseConfigured) await sendOtp(c, ch);
      else {
        demo.current = makeDemoOtp(c);
        setDemoCode(demo.current.code);
      }
      setStep('verify');
      setCode('');
      setLeft(COOLDOWN);
    } catch (e) {
      setErr(e instanceof OtpError ? e.message : 'Erreur inattendue. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr(null);
    if (!/^\d{6}$/.test(code)) return setErr('Saisissez les 6 chiffres reçus.');
    setBusy(true);
    try {
      if (supabaseConfigured) setSession(await verifyOtp(c, ch, code));
      else {
        checkDemoOtp(demo.current, code);
        setSession({ mode: 'demo', contact: c, userId: uid('usr_') });
      }
      router.replace('/');
    } catch (e) {
      setErr(e instanceof OtpError ? e.message : 'Erreur inattendue. Réessayez.');
      if (e instanceof OtpError && e.code === 'expired') setLeft(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>FamilyFit</Eyebrow>
      <H1>Connexion sans mot de passe</H1>
      <Muted>Recevez un code à 6 chiffres. Aucune donnée n’est partagée hors de votre famille.</Muted>
      <Spacer />
      {!supabaseConfigured ? <DemoBanner text="Mode démo : aucun e-mail ni SMS n’est envoyé. Le code est simulé et affiché ci-dessous." /> : null}
      {step === 'ask' ? (
        <>
          <Segmented options={[{ label: 'E-mail', value: 'email' as const }, { label: 'SMS', value: 'sms' as const }]} value={ch} onChange={(v) => { setCh(v); setErr(null); }} />
          <Spacer h={8} />
          <Field
            label={ch === 'email' ? 'Adresse e-mail' : 'Numéro de mobile'}
            value={contact}
            onChangeText={setContact}
            placeholder={ch === 'email' ? 'prenom@exemple.ch' : '+41 79 123 45 67'}
            keyboardType={ch === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoComplete={ch === 'email' ? 'email' : 'tel'}
            onSubmitEditing={request}
          />
          {ch === 'sms' && supabaseConfigured ? <Muted style={{ fontSize: 13 }}>Le SMS nécessite un fournisseur configuré dans Supabase.</Muted> : null}
          {err ? <Notice tone="danger" title={err} /> : null}
          <Button title="Recevoir un code" icon="paper-plane-outline" onPress={request} loading={busy} disabled={!contact.trim()} />
        </>
      ) : (
        <>
          <Muted>Code envoyé à <Text style={{ color: t.text, fontWeight: '700' }}>{c}</Text></Muted>
          <Spacer h={8} />
          {demoCode && !supabaseConfigured ? (
            <Card>
              <Muted style={{ fontSize: 12 }}>CODE DE DÉMONSTRATION (simulé, valable 10 min)</Muted>
              <Text selectable style={{ color: t.primary, fontSize: 30, fontWeight: '800', letterSpacing: 8 }}>{demoCode}</Text>
            </Card>
          ) : null}
          <Text style={styles.label}>Code à 6 chiffres</Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            accessibilityLabel="Code à 6 chiffres"
            style={[styles.input, { fontSize: 26, letterSpacing: 10, textAlign: 'center', fontWeight: '700' }]}
            onSubmitEditing={verify}
          />
          <Spacer h={8} />
          {err ? <Notice tone="danger" title={err} /> : null}
          <Button title="Vérifier" icon="checkmark" onPress={verify} loading={busy} disabled={code.length !== 6} />
          <Spacer h={8} />
          <Row wrap>
            <Button small variant="ghost" title={left > 0 ? `Renvoyer (${left}s)` : 'Renvoyer le code'} onPress={request} disabled={left > 0 || busy} />
            <Button small variant="ghost" title="Changer de contact" onPress={() => { setStep('ask'); setErr(null); }} />
          </Row>
        </>
      )}
      <Spacer h={20} />
      <Button small variant="ghost" icon="settings-outline" title="Configuration" onPress={() => router.push('/config')} />
    </Screen>
  );
}
