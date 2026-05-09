export type Region = 'mx' | 'pr' | 'do' | 'general';

export type TrackId = 'front-desk' | 'psych-nursing';

export type ModeId = 'listen' | 'drill' | 'roleplay';

export type Phrase = {
  id: string;
  /** English meaning the user is trying to express or understand. */
  en: string;
  /** Spanish line said by the patient/family/staff. Native speed, idiomatic. */
  es: string;
  /** Region this phrasing leans toward. 'general' if it works everywhere. */
  region: Region;
  /** Optional pronunciation/usage note shown when transcript is revealed. */
  note?: string;
  /** Optional speaker hint for TTS voice selection ("patient", "family", "staff"). */
  speaker?: 'patient' | 'family' | 'staff';
};

export type DrillPrompt = {
  id: string;
  /** English situation the user must respond to in Spanish. */
  situation: string;
  /** One reasonable target Spanish answer; AI grades semantic match, not exact. */
  target: string;
  /** Optional acceptable variants used by the local fallback grader. */
  acceptableVariants?: string[];
  region: Region;
  hint?: string;
};

export type RoleplayScenario = {
  id: string;
  title: string;
  /** Short blurb shown to the user before starting. */
  setup: string;
  /** Persona Claude plays. Plain English; injected into the system prompt. */
  persona: string;
  /** Opening Spanish line Claude should say to start the scene. */
  opener: string;
  region: Region;
};

export type Module = {
  id: string;
  title: string;
  blurb: string;
  /** When false, the module is visible but not yet built out. */
  available: boolean;
  phrases: Phrase[];
  drills: DrillPrompt[];
  scenarios: RoleplayScenario[];
};

export type Track = {
  id: TrackId;
  title: string;
  blurb: string;
  modules: Module[];
};
