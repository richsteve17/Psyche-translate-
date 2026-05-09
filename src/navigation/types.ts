import { ModeId } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Track: { trackId: string };
  Module: { trackId: string; moduleId: string };
  Mode: { trackId: string; moduleId: string; mode: ModeId };
};
