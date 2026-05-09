import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
};

export function Screen({ children, scroll = true, style, edges = ['top', 'bottom'] }: Props) {
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <Inner
        style={styles.flex}
        contentContainerStyle={scroll ? [styles.content, style] : undefined}
      >
        {scroll ? children : <View style={[styles.content, style]}>{children}</View>}
      </Inner>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
});
