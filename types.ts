
export enum RelationshipType {
  ROMANTIC = 'Romantic',
  FRIENDSHIP = 'Friendship',
  FAMILIAL = 'Familial',
  PROFESSIONAL = 'Professional',
  OTHER = 'Other',
}

export enum Tone {
  WITTY = 'Witty',
  DRAMATIC = 'Dramatic',
  POETIC = 'Poetic',
  BLUNT_BUT_KIND = 'Blunt but Kind',
  COUNTRY_SONG = 'Country Song Style',
  HUMOROUS = 'Humorous',
  SARCASTIC = 'Sarcastic',
  FORMAL = 'Formal',
  EMPATHETIC = 'Empathetic',
  PASSIVE_AGGRESSIVE = 'Passive-Aggressive',
  SHAKESPEAREAN = 'Shakespearean',
}

export interface BreakupFormData {
  recipientName: string;
  userName: string;
  relationshipType: RelationshipType;
  reason: string;
  tone: Tone;
}

// User Authentication Types
export interface User {
  username: string;
  musicGenerationsToday: number;
  lastLoginDate: string;
}

// Music Generation Types
export enum MusicAIType {
  SUNO_MOCK = 'Suno-like AI',
  RIFFUSION_MOCK = 'Riffusion-like AI',
}

export interface MusicFormData {
  prompt: string;
  style: string;
  aiType: MusicAIType;
}

// Global SpeechRecognition type declarations (moved from InputForm.tsx for global access)
/**
 * Declares the SpeechRecognition interface and related types for TypeScript.
 * These types are part of the Web Speech API and may not be fully available
 * in all TypeScript environments by default, especially for vendor-prefixed versions.
 */
interface SpeechRecognition extends EventTarget {
  // Properties
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
    interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  // Methods
  start(): void;
  stop(): void;
  abort(): void;

  // Event handlers
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent;
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
}

interface SpeechRecognition extends EventTarget {
  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface SpeechGrammarList {
  readonly length: number;
  addFromString(grammar: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
}

interface SpeechGrammar {
  readonly src: string;
  readonly weight: number;
}

type SpeechRecognitionErrorCode =
    "no-speech" | "aborted" | "audio-capture" | "network" | "warn" | "not-allowed" | "service-not-allowed" | "bad-grammar" | "language-not-supported";

// Extend Window interface for global objects
declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
    webkitAudioContext: {
      prototype: AudioContext;
      new(): AudioContext;
    };
  }
}
