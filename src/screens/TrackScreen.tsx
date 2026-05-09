import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { findTrack } from '../content/tracks';
import { colors, spacing, type } from '../theme/colors';
import { moduleCompletionCount } from '../services/storage';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Track'>;

export function TrackScreen({ route, navigation }: Props) {
  const track = findTrack(route.params.trackId);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    if (track) navigation.setOptions({ title: track.title });
  }, [track, navigation]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!track) return;
      const entries = await Promise.all(
        track.modules.map(async (m) => [m.id, await moduleCompletionCount(m.id)] as const),
      );
      if (alive) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [track]);

  if (!track) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Track not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{track.title.toUpperCase()}</Text>
        <Text style={styles.title}>{track.blurb}</Text>
      </View>
      {track.modules.map((m) => {
        const done = counts[m.id] ?? 0;
        const total = m.phrases.length + m.drills.length + m.scenarios.length;
        const meta = m.available
          ? total
            ? `${done}/${total} done`
            : 'ready'
          : 'coming soon';
        return (
          <Card
            key={m.id}
            meta={meta}
            title={m.title}
            subtitle={m.blurb}
            onPress={
              m.available
                ? () => navigation.navigate('Module', { trackId: track.id, moduleId: m.id })
                : undefined
            }
            style={!m.available ? styles.disabled : undefined}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  kicker: { ...type.caption, color: colors.textMuted },
  title: { ...type.title, color: colors.text },
  disabled: { opacity: 0.45 },
});
