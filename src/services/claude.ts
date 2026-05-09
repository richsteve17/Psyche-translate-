import Anthropic from '@anthropic-ai/sdk';
import Constants from 'expo-constants';

const MODEL = 'claude-sonnet-4-6';

function apiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  const fromExtra = (Constants.expoConfig?.extra as { anthropicApiKey?: string } | undefined)
    ?.anthropicApiKey;
  const key = fromEnv ?? fromExtra ?? '';
  if (!key || key.startsWith('$')) {
    throw new Error(
      'Missing EXPO_PUBLIC_ANTHROPIC_API_KEY. Copy .env.example to .env and set the key.',
    );
  }
  return key;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: apiKey() });
  }
  return _client;
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function chat(opts: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 512,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: opts.messages,
  });
  const block = res.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text.trim() : '';
}

export async function completeJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await chat({
    system: opts.system + '\n\nRespond with ONLY valid JSON. No prose, no code fences.',
    messages: [{ role: 'user', content: opts.user }],
    maxTokens: opts.maxTokens ?? 1500,
    temperature: 0.4,
  });
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
