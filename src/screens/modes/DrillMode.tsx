import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PressToTalk } from '../../components/PressToTalk';
import { colors, radius, spacing, type } from '../../theme/colors';
import { Module } from '../../types';
import { startListening, stopListening, destroyListener } from '../../services/stt';
import { Grade, grade } from '../../services/grading';
import { speak } from '../../services/tts';
import { markComplete } from '../../services/storage';

type Props = { mod: Module };

type Phase = 'idle' | 'listening' | 'grading' | 'graded';

export function DrillMode({ mod }: Props) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [partial, setPartial] = useState('');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<Grade | null>(null);
  const [typeFallback, setTypeFallback] = useState(false);
  const [typed, setTyped] = useState('');

  const prompt = mod.drills[i];

  useEffect(() => () => void destroyListener(), []);

  if (!prompt) {
    return (
      <Screen>
        <Text style={styles.title}>No drills in this module yet.</Text>
      </Screen>
    );
  }

  const reset = () => {
    setPhase('idle');
    setPartial('');
    setHeard('');
    setResult(null);
    setTyped('');
  };

  const next = () => {
    reset();
    setI((n) => (n + 1) % mod.drills.length);
  };

  const submit = async (text: string) => {
    setHeard(text);
    setPhase('grading');
    const g = await grade(text, prompt);
    setResult(g);
    setPhase('graded');
    if (g.score >= 0.7) void markComplete(mod.id, prompt.id);
  };

  const onPressIn = async () => {
    if (typeFallback) return;
    setPartial('');
    setHeard('');
    setResult(null);
    setPhase('listening');
    try {
      await startListening(prompt.region, {
        onPartial: (t) => setPartial(t),
        onFinal: (t) => void submit(t),
        onError: (e) => {
          setPhase('idle');
          setHeard(`(mic error: ${e})`);
        },
      });
    } catch (e: any) {
      setPhase('idle');
      setHeard(`(mic unavailable: ${e?.message ?? 'unknown'})`);
    }
  };

  const onPressOut = async () => {
    if (phase === 'listening') {
      await stopListening();
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>
          DRILL · {i + 1}/{mod.drills.length}
        </Text>
        <Text style={styles.situation}>{prompt.situation}</Text>
        {prompt.hint ? <Text style={styles.hint}>{prompt.hint}</Text> : null}
      </View>

      {!typeFallback ? (
        <View style={styles.center}>
          <PressToTalk
            recording={phase === 'listening'}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={phase === 'grading'}
            hint={
              phase === 'listening'
                ? 'Release when you finish your sentence'
                : phase === 'grading'
                  ? 'Grading…'
                  : 'Hold the button and say it in Spanish'
            }
          />
          {partial ? <Text style={styles.partial}>{partial}</Text> : null}
        </View>
      ) : (
        <View style={styles.typeWrap}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder="Type your Spanish answer"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
          />
          <PrimaryButton
            title="Check"
            onPress={() => typed.trim() && void submit(typed.trim())}
            disabled={!typed.trim() || phase === 'grading'}
            loading={phase === 'grading'}
          />
        </View>
      )}

      {heard && phase !== 'listening' ? (
        <View style={styles.heardBox}>
          <Text style={styles.heardLabel}>YOU SAID</Text>
          <Text style={styles.heardText}>{heard}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={[styles.resultBox, { borderColor: verdictColor(result.verdict) }]}>
          <Text style={[styles.verdict, { color: verdictColor(result.verdict) }]}>
            {result.verdict.toUpperCase()}
          </Text>
          <Text style={styles.feedback}>{result.feedback}</Text>
          {result.suggestion ? (
            <View style={styles.sugRow}>
              <Text style={styles.sugLabel}>Better: </Text>
              <Text style={styles.sugText}>{result.suggestion}</Text>
            </View>
          ) : null}
          <View style={styles.sugRow}>
            <Text style={styles.sugLabel}>Target: </Text>
            <Text style={styles.sugText}>{prompt.target}</Text>
          </View>
          <PrimaryButton
            title="Hear it"
            variant="secondary"
            onPress={() => speak(prompt.target, { region: prompt.region })}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          title={result ? 'Next drill' : 'Skip'}
          variant={result ? 'primary' : 'ghost'}
          onPress={next}
        />
        <PrimaryButton
          title={typeFallback ? 'Use voice' : 'Type instead'}
          variant="ghost"
          onPress={() => {
            setTypeFallback((v) => !v);
            reset();
          }}
        />
      </View>
    </Screen>
  );
}

function verdictColor(v: Grade['verdict']): string {
  switch (v) {
    case 'great':
      return colors.good;
    case 'okay':
      return colors.warn;
    case 'off':
      return colors.bad;
  }
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  kicker: { ...type.caption, color: colors.textMuted },
  situation: { ...type.title, color: colors.text },
  hint: { ...type.small, color: colors.textMuted, fontStyle: 'italic' },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  partial: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  typeWrap: { gap: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    minHeight: 100,
    ...type.body,
  },
  heardBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  heardLabel: { ...type.caption, color: colors.textMuted },
  heardText: { ...type.body, color: colors.text },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  verdict: { ...type.caption, fontSize: 13 },
  feedback: { ...type.body, color: colors.text },
  sugRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  sugLabel: { ...type.bodyStrong, color: colors.textMuted },
  sugText: { ...type.body, color: colors.text, flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
