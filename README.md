# Psyche

Voice-first Spanish for a psych-clinic front-desk worker / future psych nurse.
Caribbean (PR/DO) and Mexican Spanish — not Castilian, not "neutral LatAm."

Reading Spanish isn't the bottleneck. Understanding native-speed speech and
producing it under pressure is. Every lesson is listening + speaking. Typing is
a fallback.

## What's in v0.1

Two tracks:
- **Front Desk** — current job. Module 1, **Greetings & Check-in**, is fully
  seeded (Listen + Drill + Roleplay end-to-end). The other modules are stubs
  waiting for content.
- **Psych Nursing** — future role. All modules are stubs.

Three modes per module:
- **Listen** — native-speed clips, tap to reveal transcript + translation,
  replay unlimited.
- **Drill** — English prompt → you speak Spanish → AI grades for meaning, not
  exact match.
- **Roleplay** — pick a scenario, have a voice-in/voice-out conversation with
  Claude playing the patient/family member, get a coach debrief at the end.

No accounts. No streaks. No XP. No payments. Progress is just "modules done."

## Setup

```bash
# 1. install
npm install

# 2. add your Anthropic key
cp .env.example .env
# edit .env, paste sk-ant-...

# 3. you need a custom dev client (Voice + native deps don't run in Expo Go)
npx expo prebuild
npx expo run:ios       # or run:android (mac required for ios)
```

After that, daily dev:

```bash
npm start              # opens Metro for the dev client
```

### Heads up

- The Anthropic key is bundled into the client (`EXPO_PUBLIC_*`). Fine for a
  personal MVP. If you ever distribute the app, move the API call behind a
  backend — see `src/services/claude.ts`.
- Speech-to-text is `@react-native-voice/voice` (on-device). Free, fast,
  decent on short utterances. Swap for a Whisper API call without changing
  screens — see `src/services/stt.ts`.
- TTS is `expo-speech` set to `es-MX` for Mexican content and `es-US` for
  Caribbean (closest available shipping voice). It's not perfect Caribbean
  Spanish but it's directionally right.

## Adding content

The hand-seeded `frontdesk-greetings` module is the reference for tone and
shape. To generate a new module:

```bash
ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/regen-content.ts \
  --id frontdesk-phones \
  --title "Phone Scripts" \
  --blurb "Answer, transfer, take a message, schedule." \
  --brief "Front-desk phone language for a psych clinic in Delaware. Caribbean and Mexican Spanish." \
  --region general --phrases 18 --drills 8 --scenarios 3
```

The script writes `src/content/modules/<id>.ts`. Then in
`src/content/tracks.ts`, replace the stub with the import — that's the only
wiring change. Edit the generated file by hand to taste; the AI gets you 80%
there.

## Project layout

```
App.tsx                  navigation root
src/
  components/            Screen, Card, PrimaryButton, PressToTalk
  content/
    tracks.ts            track + module index
    modules/             one .ts per module
  navigation/types.ts    typed routes
  screens/
    HomeScreen.tsx       track picker
    TrackScreen.tsx      module list
    ModuleScreen.tsx     mode picker
    ModeScreen.tsx       routes to mode
    modes/
      ListenMode.tsx
      DrillMode.tsx
      RoleplayMode.tsx
  services/
    tts.ts               expo-speech wrapper, region -> locale
    stt.ts               @react-native-voice/voice wrapper
    claude.ts            Anthropic SDK wrapper
    grading.ts           local + AI grader, roleplay debrief
    storage.ts           AsyncStorage progress
  theme/colors.ts        dark palette, spacing, type scale
  types.ts               domain types
scripts/
  regen-content.ts       admin: generate a module from a brief
```

## Design notes

- Dark default. Calm and clinical. No mascot, no XP bar, no streak counter.
- Big tap targets (56pt minimum), one-handed reachable controls.
- The hold-to-talk button is huge on purpose — it's the thing she'll use most.
- Voice in, voice out. Reading the transcript is opt-in; it doesn't appear
  until tapped.

## Build the next thing

The architecture is intentionally trivial to extend: add a module file, wire
it in `tracks.ts`, set `available: true`, and the three modes work. Build
**one module at a time** to the same depth as Greetings before adding more.
