import { DrillPrompt } from '../types';
import { chat, completeJSON } from './claude';

export type Grade = {
  /** 0..1, where ~0.7+ is "she'd be understood by a patient". */
  score: number;
  verdict: 'great' | 'okay' | 'off';
  /** One-line, plain English. Direct, no praise sandwich. */
  feedback: string;
  /** Optional cleaned-up version of what she should have said. */
  suggestion?: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp("[\u0300-\u036f]", "g"), '')
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Cheap local pass — if she nailed it word-for-word or near a known variant,
 *  we don't burn a Claude call. */
export function localGrade(spoken: string, prompt: DrillPrompt): Grade | null {
  const said = norm(spoken);
  if (!said) return { score: 0, verdict: 'off', feedback: 'I didn\'t catch anything. Try again.' };
  const candidates = [prompt.target, ...(prompt.acceptableVariants ?? [])].map(norm);
  for (const c of candidates) {
    if (said === c) {
      return { score: 1, verdict: 'great', feedback: 'Exactly right.' };
    }
    if (overlapRatio(said, c) >= 0.85) {
      return {
        score: 0.9,
        verdict: 'great',
        feedback: 'Close enough — a patient would understand you.',
        suggestion: prompt.target,
      };
    }
  }
  return null;
}

function overlapRatio(a: string, b: string): number {
  const at = new Set(a.split(' '));
  const bt = new Set(b.split(' '));
  let hit = 0;
  at.forEach((w) => {
    if (bt.has(w)) hit++;
  });
  return hit / Math.max(at.size, bt.size);
}

/** AI semantic grade — meaning over exact match. */
export async function aiGrade(spoken: string, prompt: DrillPrompt): Promise<Grade> {
  const system = `You grade spoken Spanish from a U.S. medical front-desk worker learning to talk with Spanish-speaking patients in Delaware. Weight Caribbean (PR/DO) and Mexican Spanish. Castilian forms ("vosotros", "tío", lisped c/z) should be flagged as off-region.

Grade on whether a real patient would understand and respond naturally — not on textbook grammar. Tiny errors (gender, missing article) that don't impair meaning = "great" or "okay". Wrong meaning, wrong tense in a way that confuses, or English filler = "off".

Be direct. No praise sandwich. One line of feedback, plain English.`;

  const user = `Situation (English): ${prompt.situation}
Target Spanish (one acceptable answer): ${prompt.target}
She said (transcribed): ${spoken}

Return JSON: {"score": 0..1, "verdict": "great"|"okay"|"off", "feedback": "...", "suggestion": "..."}
"suggestion" only if her line was off — otherwise omit it.`;

  try {
    return await completeJSON<Grade>({ system, user, maxTokens: 250 });
  } catch {
    // Network / parse failure — soft-fall to a neutral grade so the loop keeps moving.
    return {
      score: 0.5,
      verdict: 'okay',
      feedback: 'Couldn\'t reach the grader. Heard you, moving on.',
    };
  }
}

export async function grade(spoken: string, prompt: DrillPrompt): Promise<Grade> {
  const local = localGrade(spoken, prompt);
  if (local) return local;
  return aiGrade(spoken, prompt);
}

/** End-of-roleplay coach feedback. */
export async function roleplayFeedback(opts: {
  scenarioTitle: string;
  scenarioPersona: string;
  transcript: { role: 'user' | 'assistant'; content: string }[];
}): Promise<string> {
  const system = `You are a Spanish coach for a U.S. psych-clinic front-desk worker who's also training to be a psych nurse. After a roleplay, give her a short debrief.

Format:
- 1 sentence on what she did well.
- 2-3 specific things to fix (with the better Spanish phrasing in quotes).
- 1 line on what to try next time.

Direct. Caribbean/Mexican Spanish. No filler. No emojis.`;

  const transcript = opts.transcript
    .map((m) => `${m.role === 'user' ? 'HER' : 'PATIENT'}: ${m.content}`)
    .join('\n');

  const user = `Scenario: ${opts.scenarioTitle}
Persona: ${opts.scenarioPersona}

Transcript:
${transcript}

Give her the debrief.`;

  try {
    return await chat({
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens: 500,
      temperature: 0.4,
    });
  } catch (e) {
    return 'Couldn\'t reach the coach. Save the transcript and try again later.';
  }
}
