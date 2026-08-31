export type CategoryId = 'animals' | 'jobs' | 'fruits' | 'school' | 'body' | 'transport' | 'all';

export interface Question {
  id?: string;
  name: string;
  clues: string[];
  choices: string[];
  answer: string;
  emojis: Record<string, string>;
  fact: string;
}

export type EnvironmentMode = 'auto' | 'headphones' | 'speaker' | 'quiet' | 'noisy' | 'studio';

export type BassBoostLevel = 'off' | 'subtle' | 'medium' | 'deep' | 'ultra';

export interface AudioSettings {
  volume: number; // 0 to 1
  ttsVolume: number; // 0 to 1
  ttsRate: number; // 0.5 to 1.5
  environmentMode: EnvironmentMode;
  noiseReduction: boolean;
  frequencyEnhancer: boolean;
  bassBoostLevel: BassBoostLevel;
  bassGain: number; // -12 to +15 dB
  midGain: number; // -12 to +12 dB
  trebleGain: number; // -12 to +12 dB
  vocalClarity: number; // 0 to 10
}
