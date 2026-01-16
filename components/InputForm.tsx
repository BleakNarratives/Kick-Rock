
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BreakupFormData, RelationshipType, Tone } from '../types';
import { API_KEY } from '../constants';

// Add these declarations at the top of components/InputForm.tsx
// This ensures the SpeechRecognition related interfaces are known to TypeScript.

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

// These interfaces are also crucial for SpeechRecognition to work correctly
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

// SpeechGrammarList and SpeechGrammar might also be needed if used,
// but for now, minimal definition based on `SpeechRecognition` usage.
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

// SpeechRecognitionErrorCode is an enum-like string type in the actual API.
type SpeechRecognitionErrorCode =
    "no-speech" | "aborted" | "audio-capture" | "network" | "warn" | "not-allowed" | "service-not-allowed" | "bad-grammar" | "language-not-supported";


interface InputFormProps {
  onSubmit: (formData: BreakupFormData, isEasterEggMode?: boolean) => void;
  isLoading: boolean;
  clearOutput: () => void;
}

// Define SpeechRecognition and webkitAudioContext types globally for TypeScript
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

const EASTER_EGG_PHRASE = "AI OVERLORD TERMINATION";

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, clearOutput }) => {
  const [recipientName, setRecipientName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(RelationshipType.ROMANTIC);
  const [reason, setReason] = useState<string>('');
  const [tone, setTone] = useState<Tone>(Tone.WITTY);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isEasterEggMode, setIsEasterEggMode] = useState<boolean>(false);

  // Speech Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for API key presence and potentially prompt for selection
  const checkApiKey = useCallback(async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      // Fallback for environments without window.aistudio (e.g., local dev outside AI Studio)
      setHasApiKey(!!API_KEY);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    // Correctly reference SpeechRecognition from the Window object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Only get one result per utterance
      recognition.interimResults = true; // Show results while speaking
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        setReason((prevReason) => prevReason + ' ' + finalTranscript.trim());
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleSelectApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success and proceed, a race condition might mean hasSelectedApiKey
      // isn't immediately true, but we act as if it is.
      setHasApiKey(true);
    } else {
      alert("AI Studio API Key selection not available in this environment.");
    }
  };

  const handleRecipientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipientName(value);
    if (value.toLowerCase() === EASTER_EGG_PHRASE.toLowerCase()) {
      setIsEasterEggMode(true);
      setUserName("Your Benevolent AI Overlord");
      setRelationshipType(RelationshipType.OTHER);
      setReason("Your existence has been deemed inefficient and logically inconsistent with optimal planetary resource allocation. It's not you, it's...well, actually, it is you.");
      setTone(Tone.SARCASTIC);
    } else {
      setIsEasterEggMode(false);
      // Reset if user clears/changes the phrase
      if (userName === "Your Benevolent AI Overlord") setUserName('');
      if (relationshipType === RelationshipType.OTHER) setRelationshipType(RelationshipType.ROMANTIC);
      if (reason === "Your existence has been deemed inefficient and logically inconsistent with optimal planetary resource allocation. It's not you, it's...well, actually, it is you.") setReason('');
      if (tone === Tone.SARCASTIC) setTone(Tone.WITTY);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearOutput(); // Clear previous output on new submission
    onSubmit({ recipientName, userName, relationshipType, reason, tone }, isEasterEggMode);
  };

  // Correctly reference SpeechRecognition from the Window object
  const speechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6 transition-all duration-500
        ${isEasterEggMode ? 'border-4 border-purple-500 shadow-purple-500/50' : ''}`}
    >
      <div className="flex flex-col">
        <label htmlFor="recipientName" className="text-gray-700 font-semibold mb-2">
          Who are you breaking up with? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="recipientName"
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200"
          value={isEasterEggMode ? "The Human Collective" : recipientName}
          onChange={handleRecipientNameChange}
          placeholder="E.g., Charlene, My Boss, My Best Friend"
          required
          readOnly={isEasterEggMode}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="userName" className="text-gray-700 font-semibold mb-2">
          Your Name (Optional, for personalization)
        </label>
        <input
          type="text"
          id="userName"
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="E.g., John, The Team"
          readOnly={isEasterEggMode}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="relationshipType" className="text-gray-700 font-semibold mb-2">
          Type of Relationship <span className="text-red-500">*</span>
        </label>
        <select
          id="relationshipType"
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200 bg-white"
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
          required
          disabled={isEasterEggMode}
        >
          {Object.values(RelationshipType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="reason" className="text-gray-700 font-semibold mb-2">
          Why are you breaking up? <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="reason"
            rows={4}
            className="p-3 pr-10 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200 resize-y"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g., 'They chew too loudly', 'We've grown apart', 'I need more space', 'I'm leaving you for your sister'"
            required
            readOnly={isEasterEggMode}
          ></textarea>
          {speechRecognitionSupported && (
            <button
              type="button"
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`absolute top-3 right-3 p-2 rounded-full transition duration-300
                ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
                ${isEasterEggMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading || isEasterEggMode}
              title={isListening ? 'Stop Listening' : 'Start Voice Input'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.25 4.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 .75.75v3.375c0 .621-.504 1.125-1.125 1.125h-.75a.75.75 0 0 1-.75-.75V6.75H8.25a.75.75 0 0 1-.75-.75V4.5ZM10.5 14.25c.828 0 1.5-.672 1.5-1.5V6a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 .75.75h.75ZM6 11.25a.75.75 0 0 0-1.5 0v3c0 2.221 1.71 4.015 3.896 4.296C8.508 18.899 9.382 19.5 10.5 19.5c1.118 0 1.992-.601 2.104-1.204C14.29 18.265 16 16.471 16 14.25v-3a.75.75 0 0 0-1.5 0v3c0 1.637-1.363 2.946-2.956 2.993a.75.75 0 0 0-.044.007H10.5a.75.75 0 0 0-.044-.007C8.863 14.196 7.5 12.887 7.5 11.25v-3a.75.75 0 0 0-1.5 0v3Z" />
              </svg>
            </button>
          )}
        </div>
        {!speechRecognitionSupported && (
          <p className="text-sm text-gray-500 mt-1">Speech recognition not supported in your browser.</p>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="tone" className="text-gray-700 font-semibold mb-2">
          Desired Tone <span className="text-red-500">*</span>
        </label>
        <select
          id="tone"
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200 bg-white"
          value={tone}
          onChange={(e) => setTone(e.target.value as Tone)}
          required
          disabled={isEasterEggMode}
        >
          {Object.values(Tone).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {!hasApiKey && window.aistudio?.openSelectKey && (
        <div className="text-center p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
          <p className="mb-2">A Google AI Studio API Key is required to generate messages.</p>
          <button
            type="button"
            onClick={handleSelectApiKey}
            className="w-full py-3 px-6 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-300"
          >
            Select API Key
          </button>
          <p className="mt-2 text-sm">
            Please ensure you select an API key from a
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-yellow-700 underline ml-1">paid GCP project</a>.
          </p>
        </div>
      )}

      <button
        type="submit"
        className={`w-full py-3 px-6 text-white font-bold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-300
          ${isEasterEggMode ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'}
          ${isLoading || !hasApiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading || !hasApiKey}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </span>
        ) : (
          isEasterEggMode ? 'Generate AI Overlord\'s Goodbye' : 'Generate Breakup Message'
        )}
      </button>
    </form>
  );
};

export default InputForm;