import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { tracks } from '../content/tracks';
import { colors, spacing, type } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>VOICE-FIRST · CARIBBEAN & MEXICAN SPANISH</Text>
        <Text style={styles.title}>What are we working on?</Text>
      </View>
      {tracks.map((t) => (
        <Card
          key={t.id}
          meta={t.modules.filter((m) => m.available).length + ' module(s) ready'}
          title={t.title}
          subtitle={t.blurb}
          onPress={() => navigation.navigate('Track', { trackId: t.id })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  kicker: { ...type.caption, color: colors.textMuted },
  title: { ...type.display, color: colors.text },
});
