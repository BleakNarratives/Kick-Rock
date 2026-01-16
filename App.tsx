import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import MessageDisplay from './components/MessageDisplay';
import { BreakupFormData } from './types';
import { generateBreakupMessageStream } from './services/geminiService';

const App: React.FC = () => {
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (formData: BreakupFormData, isEasterEggMode: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setGeneratedMessage(''); // Clear previous message
    let currentMessage = '';

    const onChunk = (chunk: string) => {
      currentMessage += chunk;
      setGeneratedMessage(currentMessage);
    };

    const onError = (errorMessage: string) => {
      setError(errorMessage);
    };

    try {
      await generateBreakupMessageStream(formData, onChunk, onError, isEasterEggMode);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
    setGeneratedMessage('');
    setError(null);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen">
      <Header />
      <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} clearOutput={clearOutput} />
      {(generatedMessage || error || isLoading) && (
        <MessageDisplay message={generatedMessage} error={error} isLoading={isLoading} />
      )}
    </div>
  );
};

export default App;