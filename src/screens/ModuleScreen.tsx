import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { findModule } from '../content/tracks';
import { colors, spacing, type } from '../theme/colors';
import { ModeId } from '../types';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Module'>;

const MODES: { id: ModeId; title: string; blurb: string }[] = [
  {
    id: 'listen',
    title: 'Listen',
    blurb: 'Native-speed clips. Tap to reveal. Replay as much as you want.',
  },
  {
    id: 'drill',
    title: 'Drill',
    blurb: 'English prompt → you say it in Spanish. Graded for meaning, not exact match.',
  },
  {
    id: 'roleplay',
    title: 'Roleplay',
    blurb: 'Pick a scenario, run the conversation, get coached at the end.',
  },
];

export function ModuleScreen({ route, navigation }: Props) {
  const { trackId, moduleId } = route.params;
  const mod = findModule(trackId, moduleId);

  useLayoutEffect(() => {
    if (mod) navigation.setOptions({ title: mod.title });
  }, [mod, navigation]);

  if (!mod) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Module not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{mod.title.toUpperCase()}</Text>
        <Text style={styles.title}>{mod.blurb}</Text>
      </View>
      {MODES.map((m) => (
        <Card
          key={m.id}
          title={m.title}
          subtitle={m.blurb}
          onPress={() =>
            navigation.navigate('Mode', { trackId, moduleId, mode: m.id })
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  kicker: { ...type.caption, color: colors.textMuted },
  title: { ...type.title, color: colors.text },
});
