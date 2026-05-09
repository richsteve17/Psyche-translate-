import * as Speech from 'expo-speech';
import { Region } from '../types';

/**
 * Maps a content region to a BCP-47 language tag we hand to expo-speech.
 * iOS and Android both accept es-MX; PR/DO Spanish doesn't have widely-shipped
 * voices, so we fall back to es-US (which on iOS uses Caribbean-leaning voices)
 * or es-MX. This keeps us close to the speech the user hears in Delaware
 * without requiring custom voice models.
 */
function languageTagFor(region: Region): string {
  switch (region) {
    case 'pr':
    case 'do':
      return 'es-US';
    case 'mx':
      return 'es-MX';
    case 'general':
      return 'es-MX';
  }
}

export type SpeakOptions = {
  region?: Region;
  /** 1.0 is "native speed". The brief is explicit: do not slow down. */
  rate?: number;
  pitch?: number;
  onDone?: () => void;
};

export function speak(text: string, opts: SpeakOptions = {}): void {
  const language = languageTagFor(opts.region ?? 'general');
  Speech.stop();
  Speech.speak(text, {
    language,
    rate: opts.rate ?? 1.0,
    pitch: opts.pitch ?? 1.0,
    onDone: opts.onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
