import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  hint?: string;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  hint,
}: Props) {
  const palette = paletteFor(variant);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { opacity: 0.85 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        )}
      </View>
      {hint ? <Text style={[styles.hint, { color: palette.hint }]}>{hint}</Text> : null}
    </Pressable>
  );
}

function paletteFor(v: Variant) {
  switch (v) {
    case 'primary':
      return { bg: colors.accent, border: colors.accent, text: '#0B1220', hint: '#0B1220' };
    case 'secondary':
      return {
        bg: colors.surface,
        border: colors.border,
        text: colors.text,
        hint: colors.textMuted,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        border: 'transparent',
        text: colors.text,
        hint: colors.textMuted,
      };
    case 'danger':
      return { bg: colors.bad, border: colors.bad, text: '#1B0D0D', hint: '#1B0D0D' };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { ...type.bodyStrong },
  hint: { ...type.small, marginTop: 2, textAlign: 'center', opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
