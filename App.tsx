import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import MessageDisplay from './components/MessageDisplay';
import MusicGenerator from './components/MusicGenerator';
import AuthForm from './components/AuthForm';
import { BreakupFormData } from './types';
import { generateBreakupMessageStream } from './services/geminiService';
import { AuthProvider, useAuth } from './contexts/AuthContext';


const AppContent: React.FC = () => {
  const { currentUser, isLoadingAuth } = useAuth();
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);
  const [errorGemini, setErrorGemini] = useState<string | null>(null);
  const [isMusicMode, setIsMusicMode] = useState<boolean>(false); // State to switch between modes

  const handleFormSubmit = useCallback(async (formData: BreakupFormData, isEasterEggMode: boolean = false) => {
    setIsLoadingGemini(true);
    setErrorGemini(null);
    setGeneratedMessage(''); // Clear previous message
    let currentMessage = '';

    const onChunk = (chunk: string) => {
      currentMessage += chunk;
      setGeneratedMessage(currentMessage);
    };

    const onError = (errorMessage: string) => {
      setErrorGemini(errorMessage);
    };

    try {
      await generateBreakupMessageStream(formData, onChunk, onError, isEasterEggMode);
    } finally {
      setIsLoadingGemini(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
    setGeneratedMessage('');
    setErrorGemini(null);
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-4 text-white text-lg mt-4 animate-pulse">Ugh, fine, loading your awesomeness...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen">
        <Header />
        <AuthForm onAuthSuccess={() => {}} /> {/* onAuthSuccess is a no-op as context refreshes */}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen">
      <Header />
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setIsMusicMode(false)}
          className={`px-6 py-3 rounded-lg font-extrabold text-lg transition duration-300 transform hover:scale-105 active:scale-95
            ${!isMusicMode ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          👋 Sayonara, Sucker!
        </button>
        <button
          onClick={() => setIsMusicMode(true)}
          className={`px-6 py-3 rounded-lg font-extrabold text-lg transition duration-300 transform hover:scale-105 active:scale-95
            ${isMusicMode ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          🎵 Make 'Em Move (On)!
        </button>
      </div>

      {isMusicMode ? (
        <MusicGenerator />
      ) : (
        <>
          <InputForm
            onSubmit={handleFormSubmit}
            isLoading={isLoadingGemini}
            clearOutput={clearOutput}
            isMusicMode={isMusicMode}
          />
          {(generatedMessage || errorGemini || isLoadingGemini) && (
            <MessageDisplay message={generatedMessage} error={errorGemini} isLoading={isLoadingGemini} />
          )}
        </>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;