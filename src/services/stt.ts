import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';
import { Region } from '../types';

/**
 * Thin wrapper around @react-native-voice/voice. Requires a custom dev client
 * (run `npx expo prebuild` then `npx expo run:ios` or `run:android`) — Voice
 * is not in Expo Go.
 *
 * On-device recognition is fast, free, and good enough for short utterances.
 * If quality bites, swap this module for an audio-record-then-Whisper flow
 * without changing the calling screens.
 */

function localeFor(region: Region): string {
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

export type ListenHandlers = {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
};

let attached = false;
let handlers: ListenHandlers | null = null;

function attachOnce() {
  if (attached) return;
  attached = true;
  Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0];
    if (text && handlers?.onPartial) handlers.onPartial(text);
  };
  Voice.onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0];
    if (text && handlers) handlers.onFinal(text);
  };
  Voice.onSpeechError = (e: SpeechErrorEvent) => {
    handlers?.onError?.(e.error?.message ?? 'speech error');
  };
}

export async function startListening(region: Region, h: ListenHandlers): Promise<void> {
  attachOnce();
  handlers = h;
  await Voice.start(localeFor(region));
}

export async function stopListening(): Promise<void> {
  try {
    await Voice.stop();
  } catch {
    // already stopped — ignore
  }
}

export async function cancelListening(): Promise<void> {
  try {
    await Voice.cancel();
  } catch {
    // already cancelled — ignore
  }
}

export async function destroyListener(): Promise<void> {
  try {
    await Voice.destroy();
  } finally {
    attached = false;
    handlers = null;
  }
}
