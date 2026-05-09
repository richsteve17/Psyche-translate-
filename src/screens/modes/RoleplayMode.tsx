import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PressToTalk } from '../../components/PressToTalk';
import { colors, radius, spacing, type } from '../../theme/colors';
import { Module, RoleplayScenario } from '../../types';
import { speak, stopSpeaking } from '../../services/tts';
import { destroyListener, startListening, stopListening } from '../../services/stt';
import { ChatMessage, chat } from '../../services/claude';
import { roleplayFeedback } from '../../services/grading';
import { markComplete } from '../../services/storage';

type Props = { mod: Module };

export function RoleplayMode({ mod }: Props) {
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);

  if (!scenario) {
    return (
      <Screen>
        <Text style={styles.kicker}>ROLEPLAY · PICK A SCENARIO</Text>
        <Text style={styles.title}>
          Claude plays the patient or family member in Spanish. You hold to talk back. End the scene
          when you want a coach debrief.
        </Text>
        {mod.scenarios.map((s) => (
          <Card
            key={s.id}
            meta={regionLabel(s.region)}
            title={s.title}
            subtitle={s.setup}
            onPress={() => setScenario(s)}
          />
        ))}
      </Screen>
    );
  }

  return <RoleplaySession mod={mod} scenario={scenario} onExit={() => setScenario(null)} />;
}

function RoleplaySession({
  mod,
  scenario,
  onExit,
}: {
  mod: Module;
  scenario: RoleplayScenario;
  onExit: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: scenario.opener },
  ]);
  const [partial, setPartial] = useState('');
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    speak(scenario.opener, { region: scenario.region });
    return () => {
      stopSpeaking();
      void destroyListener();
    };
  }, [scenario]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, feedback]);

  const send = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setThinking(true);
    try {
      const reply = await chat({
        system: systemPromptFor(scenario),
        messages: next,
        maxTokens: 250,
        temperature: 0.85,
      });
      const final: ChatMessage[] = [...next, { role: 'assistant', content: reply }];
      setMessages(final);
      speak(reply, { region: scenario.region });
    } catch (e: any) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `(no se pudo conectar: ${e?.message ?? 'error'})`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const onPressIn = async () => {
    stopSpeaking();
    setPartial('');
    setRecording(true);
    try {
      await startListening(scenario.region, {
        onPartial: setPartial,
        onFinal: (t) => {
          setRecording(false);
          setPartial('');
          void send(t);
        },
        onError: () => setRecording(false),
      });
    } catch {
      setRecording(false);
    }
  };

  const onPressOut = async () => {
    if (recording) await stopListening();
  };

  const endScene = async () => {
    setFeedbackLoading(true);
    try {
      const fb = await roleplayFeedback({
        scenarioTitle: scenario.title,
        scenarioPersona: scenario.persona,
        transcript: messages,
      });
      setFeedback(fb);
      void markComplete(mod.id, scenario.id);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.scenarioBar}>
        <Text style={styles.scenarioMeta}>SCENE · {regionLabel(scenario.region)}</Text>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={{ gap: spacing.sm }}>
        {messages.map((m, idx) => (
          <View
            key={idx}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[styles.bubbleLabel, { color: m.role === 'user' ? '#0B1220' : colors.textMuted }]}
            >
              {m.role === 'user' ? 'YOU' : 'PATIENT'}
            </Text>
            <Text style={[styles.bubbleText, m.role === 'user' && { color: '#0B1220' }]}>
              {m.content}
            </Text>
            {m.role === 'assistant' ? (
              <Text
                onPress={() => speak(m.content, { region: scenario.region })}
                style={styles.replay}
              >
                ▶︎ Replay
              </Text>
            ) : null}
          </View>
        ))}
        {thinking ? <Text style={styles.thinking}>…</Text> : null}
        {partial ? <Text style={styles.partial}>{partial}</Text> : null}

        {feedback ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitle}>COACH</Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}
      </ScrollView>

      {!feedback ? (
        <View style={styles.controls}>
          <PressToTalk
            recording={recording}
            disabled={thinking}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            hint={recording ? 'Release when done' : 'Hold to speak Spanish'}
          />
          <View style={styles.controlRow}>
            <PrimaryButton
              title="End scene & get feedback"
              variant="secondary"
              onPress={endScene}
              loading={feedbackLoading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <View style={styles.controls}>
          <PrimaryButton title="Done" onPress={onExit} />
        </View>
      )}
    </Screen>
  );
}

function systemPromptFor(s: RoleplayScenario): string {
  return `You are roleplaying with a U.S. psychiatric front-desk worker in Delaware who is practicing her medical Spanish.

Persona: ${s.persona}

Rules:
- Stay 100% in character. Never break character to coach or explain.
- Speak only Spanish, weighted toward Caribbean (PR/DO) or Mexican Spanish per the persona. Never Castilian. Never "neutral textbook" Spanish.
- Match a real patient's register: short sentences, fillers ("eh", "pues", "ay"), occasional code-switching only if the persona would.
- If she says something unclear or wrong, react like a real patient would — ask "¿cómo?", look confused, or answer based on what you think she meant. Don't correct her.
- Keep replies to 1-3 sentences. Real lobby pace.
- If she says "fin" or "end scene" or switches fully to English to break character, ask once if everything is okay, then go quiet.`;
}

function regionLabel(r: RoleplayScenario['region']): string {
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
  kicker: { ...type.caption, color: colors.textMuted },
  title: { ...type.body, color: colors.textMuted, marginBottom: spacing.sm },
  scenarioBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    marginBottom: spacing.sm,
  },
  scenarioMeta: { ...type.caption, color: colors.textMuted },
  scenarioTitle: { ...type.bodyStrong, color: colors.text },
  thread: { flex: 1 },
  bubble: { borderRadius: radius.md, padding: spacing.md, maxWidth: '92%', gap: 4 },
  botBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  userBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  bubbleLabel: { ...type.caption },
  bubbleText: { ...type.body, color: colors.text },
  replay: { ...type.small, color: colors.accent, marginTop: spacing.xs },
  thinking: { ...type.body, color: colors.textMuted, alignSelf: 'flex-start' },
  partial: { ...type.body, color: colors.textMuted, alignSelf: 'flex-end', fontStyle: 'italic' },
  feedbackBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  feedbackTitle: { ...type.caption, color: colors.accent },
  feedbackText: { ...type.body, color: colors.text },
  controls: { gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  controlRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
});
