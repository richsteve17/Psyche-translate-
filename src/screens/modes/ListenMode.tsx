import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing, type } from '../../theme/colors';
import { Module, Phrase } from '../../types';
import { speak, stopSpeaking } from '../../services/tts';
import { markComplete } from '../../services/storage';

type Props = { mod: Module };

export function ListenMode({ mod }: Props) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => () => stopSpeaking(), []);

  const play = (p: Phrase) => {
    setPlaying(p.id);
    speak(p.es, {
      region: p.region,
      onDone: () => setPlaying((cur) => (cur === p.id ? null : cur)),
    });
    void markComplete(mod.id, p.id);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>LISTEN · NATIVE SPEED</Text>
        <Text style={styles.title}>
          Tap play, then tap the card to reveal the transcript and translation. Replay as much as you need.
        </Text>
      </View>

      {mod.phrases.map((p) => {
        const isRevealed = !!revealed[p.id];
        const isPlaying = playing === p.id;
        return (
          <View key={p.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.metaCol}>
                <Text style={styles.regionTag}>{regionLabel(p.region)}</Text>
                {p.speaker ? <Text style={styles.speakerTag}>{p.speaker}</Text> : null}
              </View>
              <Pressable
                onPress={() => play(p)}
                style={({ pressed }) => [
                  styles.playBtn,
                  isPlaying && { backgroundColor: colors.accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.playLabel, isPlaying && { color: '#0B1220' }]}>
                  {isPlaying ? '▶︎ Playing' : '▶︎ Play'}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setRevealed((r) => ({ ...r, [p.id]: !r[p.id] }))}>
              {isRevealed ? (
                <View style={styles.revealed}>
                  <Text style={styles.es}>{p.es}</Text>
                  <Text style={styles.en}>{p.en}</Text>
                  {p.note ? <Text style={styles.note}>{p.note}</Text> : null}
                </View>
              ) : (
                <Text style={styles.tapHint}>Tap to reveal transcript & translation</Text>
              )}
            </Pressable>
          </View>
        );
      })}

      <PrimaryButton
        title="Play all in order"
        variant="secondary"
        onPress={() => playSequentially(mod.phrases, setPlaying)}
      />
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function playSequentially(phrases: Phrase[], setPlaying: (id: string | null) => void) {
  let i = 0;
  const next = () => {
    if (i >= phrases.length) {
      setPlaying(null);
      return;
    }
    const p = phrases[i++];
    setPlaying(p.id);
    speak(p.es, { region: p.region, onDone: next });
  };
  next();
}

function regionLabel(r: Phrase['region']): string {
  switch (r) {
    case 'mx':
      return 'MX';
    case 'pr':
      return 'PR';
    case 'do':
      return 'DO';
    case 'general':
      return 'GEN';
  }
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  kicker: { ...type.caption, color: colors.textMuted },
  title: { ...type.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  metaCol: { gap: 4 },
  regionTag: {
    ...type.caption,
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  speakerTag: { ...type.caption, color: colors.textMuted, alignSelf: 'flex-start' },
  playBtn: {
    minWidth: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  playLabel: { ...type.bodyStrong, color: colors.text },
  revealed: { gap: spacing.xs },
  es: { ...type.title, color: colors.text },
  en: { ...type.body, color: colors.textMuted },
  note: { ...type.small, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.xs },
  tapHint: { ...type.body, color: colors.textMuted },
});
