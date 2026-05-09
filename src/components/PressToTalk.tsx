import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = {
  recording: boolean;
  disabled?: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  label?: string;
  hint?: string;
};

export function PressToTalk({ recording, disabled, onPressIn, onPressOut, label, hint }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!recording) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: recording ? colors.recording : colors.accent,
              opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.label}>{label ?? (recording ? 'Listening' : 'Hold to speak')}</Text>
        </Pressable>
      </Animated.View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  btn: {
    width: 180,
    height: 180,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  label: { ...type.bodyStrong, color: '#0B1220', textAlign: 'center' },
  hint: { ...type.small, color: colors.textMuted, textAlign: 'center' },
});
