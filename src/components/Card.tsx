import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ title, subtitle, meta, onPress, right, style }: Props) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        pressed && onPress && { backgroundColor: colors.surfaceAlt },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          {meta ? <Text style={styles.meta}>{meta.toUpperCase()}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 80,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
  meta: { ...type.caption, color: colors.textMuted },
  title: { ...type.title, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
});
