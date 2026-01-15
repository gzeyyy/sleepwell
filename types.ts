export enum VoiceName {
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Puck = 'Puck',
  Charon = 'Charon',
  Zephyr = 'Zephyr',
}

export interface SessionConfig {
  voiceName: VoiceName;
  systemInstruction: string;
}

export interface VisualizerState {
  volume: number; // 0 to 1
  isTalking: boolean; // Is the AI talking?
}

// Helper types for raw audio processing
export interface AudioQueueItem {
  buffer: AudioBuffer;
  source: AudioBufferSourceNode;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface TranscriptState {
  user: string;
  ai: string;
}