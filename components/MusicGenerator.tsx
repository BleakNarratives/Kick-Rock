import React, { useState, useRef, useEffect } from 'react';
import { generateMusic } from '../services/musicService';
import { MusicAIType, MusicFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MUSIC_GENERATION_LIMIT_FREE_TIER } from '../constants';

const MusicGenerator: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('uplifting electronic');
  const [aiType, setAiType] = useState<MusicAIType>(MusicAIType.SUNO_MOCK);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Clear audio when component mounts or user changes
    setGeneratedAudioUrl(null);
    setError(null);
    setProgressMessage('');
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Seriously? Log in first, buddy, before you try to drop a beat.");
      return;
    }
    setIsLoading(true);
    setGeneratedAudioUrl(null);
    setProgressMessage('');
    setError(null);

    const formData: MusicFormData = { prompt, style, aiType };

    try {
      const response = await generateMusic(
        formData,
        (msg) => setProgressMessage(msg),
        (err) => setError(err)
      );
      if (response) {
        setGeneratedAudioUrl(response.audioUrl);
        setProgressMessage(response.message);
        refreshUser(); // Update user's generation count
      }
    } catch (e: any) {
      setError(e.message || "Oops! Looks like the music machine got a case of the Mondays. Try again, superstar!");
    } finally {
      setIsLoading(false);
    }
  };

  const remainingGenerations = currentUser ? Math.max(0, MUSIC_GENERATION_LIMIT_FREE_TIER - currentUser.musicGenerationsToday) : 0;

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        🎧 Jam Out, Jerkface! 🤘
      </h2>

      {currentUser && (
        <div className="text-center text-gray-600 mb-4">
          <p>Logged in as: <span className="font-extrabold">{currentUser.username}</span></p>
          <p>Your daily dose of discord tracks left: <span className="font-extrabold">{remainingGenerations} / {MUSIC_GENERATION_LIMIT_FREE_TIER}</span></p>
          {remainingGenerations === 0 && (
            <p className="text-red-500 text-sm mt-1 font-extrabold animate-pulse-fast">Aw, shucks! Looks like you've maxed out your mayhem for today, tough luck! Get a life!</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="musicPrompt" className="text-gray-700 font-semibold mb-2">
            Tell us what sonic shenanigans you want: <span className="text-red-500">*</span>
          </label>
          <textarea
            id="musicPrompt"
            rows={3}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200 resize-y"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'a triumphant 'I told you so' anthem', 'a whiny breakup ballad', 'a cheesy victory jig for my nemesis'"
            required
            disabled={!currentUser || remainingGenerations === 0}
          ></textarea>
        </div>

        <div className="flex flex-col">
          <label htmlFor="musicStyle" className="text-gray-700 font-semibold mb-2">
            Musical Style (Optional, make it weird)
          </label>
          <input
            type="text"
            id="musicStyle"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="E.g., 'dubstep-polka fusion', 'ominous kazoo', '80s power ballad with excessive sax'"
            disabled={!currentUser || remainingGenerations === 0}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="musicAiType" className="text-gray-700 font-semibold mb-2">
            Pick Your Poison (AI Type - Mock) <span className="text-red-500">*</span>
          </label>
          <select
            id="musicAiType"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200 bg-white"
            value={aiType}
            onChange={(e) => setAiType(e.target.value as MusicAIType)}
            required
            disabled={!currentUser || remainingGenerations === 0}
          >
            {Object.values(MusicAIType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative font-bold" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-6 bg-green-600 text-white font-extrabold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 active:scale-95
            ${isLoading || !currentUser || remainingGenerations === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || !currentUser || remainingGenerations === 0}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Beep boop, crafting a banger for your boo...
            </span>
          ) : (
            'DROP THE BEATDOWN!'
          )}
        </button>
      </form>

      {progressMessage && !generatedAudioUrl && !error && (
        <div className="text-center text-gray-600 italic mt-4 animate-pulse">
          <p>{progressMessage}</p>
        </div>
      )}

      {generatedAudioUrl && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-xl font-extrabold text-gray-800 mb-3 text-center">🔊 Your Soundtrack to Sweet Revenge! 🎶</h3>
          <audio ref={audioRef} controls src={generatedAudioUrl} className="w-full"></audio>
          <p className="text-center text-sm text-gray-600 mt-2">{progressMessage}</p>
          <a
            href={generatedAudioUrl}
            download="kick_rocks_music.mp3"
            className="mt-4 block text-center py-3 px-4 bg-blue-600 text-white font-extrabold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105 active:scale-95"
          >
            Snag That Sound! 👇
          </a>
        </div>
      )}
    </div>
  );
};

export default MusicGenerator;