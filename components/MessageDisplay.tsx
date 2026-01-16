import React, { useState, useRef } from 'react';
import { generateSpeechFromText } from '../services/geminiService';

interface MessageDisplayProps {
  message: string;
  error: string | null;
  isLoading: boolean;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, error, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  const handleListen = async () => {
    if (!message) return;

    if (isSpeaking) {
      // Stop current playback
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioBuffer = await generateSpeechFromText(message, (err) => {
        console.error("TTS generation error:", err);
        // Display error to user if needed
      });

      if (audioBuffer) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsSpeaking(false);
          audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error("Error playing audio:", e);
      setIsSpeaking(false);
    }
  };

  const handleShareSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const handleShareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent("Your Epic Kick Rocks Goodbye")}&body=${encodeURIComponent(message)}`;
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Your Epic Kick Rocks Goodbye',
        text: message,
      })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      alert("Your browser is a party pooper! It doesn't support sharing this awesome message directly. Just copy it!");
    }
  };


  if (isLoading && !message && !error) {
    return (
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl mt-8 text-center text-gray-600">
        <p className="text-lg animate-pulse">Hold your horses, wordsmith is brewing up a storm...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl mt-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 font-bold" role="alert">
          <strong className="font-extrabold">Whoopsie!</strong>
          <span className="block sm:inline ml-2">{error} Looks like the AI got stage fright. Try again, hot shot!</span>
        </div>
      )}

      {message ? (
        <>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">💥 BAM! Here's the BOOT! 💥</h2>
          <div className="whitespace-pre-wrap font-mono text-gray-700 bg-gray-50 p-4 rounded-lg border-4 border-dashed border-gray-300 overflow-auto max-h-96 ring-4 ring-pink-300/50">
            {message}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-lg font-extrabold transition duration-300 transform hover:scale-105 active:scale-95
                ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {copied ? 'Copied! ✅' : 'Yoink! (Copy That Sarcasm)'}
            </button>
            <button
              onClick={handleListen}
              className={`flex-1 py-3 px-4 rounded-lg font-extrabold transition duration-300 transform hover:scale-105 active:scale-95
                ${isSpeaking ? 'bg-pink-600 text-white animate-pulse' : 'bg-purple-600 text-white hover:bg-purple-700'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isSpeaking ? 'Silence, Minion! 🔇' : 'Hear the Burn! 🔊'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-extrabold text-gray-800 mb-3 text-center">Rub It In Their Face! Share The Shame! 😈</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={handleShareSMS} className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 transform hover:scale-105 active:scale-95 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.521.197.03.385.065.572.103V10.5a8.25 8.25 0 0 1-1.5 5.297c-.686.924-1.745 1.772-2.997 2.544a36.846 36.846 0 0 1-10.548 0c-1.252-.772-2.311-1.62-2.997-2.544A8.25 8.25 0 0 1 3 10.5V3.394c.187-.038.38-.073.572-.103ZM12 6A2.25 2.25 0 0 0 9.75 8.25h-1.5a.75.75 0 0 0 0 1.5h1.5A2.25 2.25 0 0 0 12 12.75V15a.75.75 0 0 0 1.5 0v-2.25c1.241 0 2.25-1.009 2.25-2.25V8.25A2.25 2.25 0 0 0 12 6Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold">Text 'Em!</span>
              </button>
              <button onClick={handleShareEmail} className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 transform hover:scale-105 active:scale-95 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.58 4.77a3 3 0 0 1-2.84 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.408a4.5 4.5 0 0 0 4.572 0L22.5 6.908Z" />
                </svg>
                <span className="text-sm font-bold">Mail Slap!</span>
              </button>
              <button onClick={handleShareWhatsApp} className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 transform hover:scale-105 active:scale-95 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                  <path d="M12.04 2C6.582 2 2.158 6.42 2.158 11.879c0 1.745.45 3.454 1.314 4.965L2 22l4.432-1.282a9.7 9.7 0 0 0 5.607 1.636h.001c5.458 0 9.883-4.42 9.883-9.882 0-2.65-.99-5.144-2.775-7.026C17.18 2.99 14.69 2 12.04 2zM12.04 3.635c2.463 0 4.802.96 6.545 2.678 1.687 1.762 2.583 4.09 2.583 6.567 0 4.52-3.69 8.21-8.21 8.21-.99 0-1.98-.222-2.887-.655l-2.618.756.77-2.527c-.504-.897-.775-1.922-.775-2.984C3.83 7.326 7.52 3.635 12.04 3.635zM7.17 6.897c-.2-.007-.442-.014-.684.587-.607 1.517-.99 3.067-.99 4.67 0 2.215 1.125 4.148 2.972 5.253.19.112.443.19.605.19h.008c.15 0 .25-.09.34-.18l.78-.89c.137-.146.21-.26.21-.497s-.175-.386-.34-.523c-.35-.29-.824-.515-.99-.684-.176-.17-.4-.36-.28-.564.135-.227.47-.53.72-.85.34-.43.72-.92 1.08-1.393.18-.242.33-.293.43-.293.116 0 .21.01.29.02.106.02.26.06.37.075.25.02.72.07 1.35.7.07.08.17.16.27.227.09.07.16.08.23.08.204 0 .34-.08.48-.18.2-.14.61-.43 1.17-1.02.57-.6.94-1.23 1.11-1.52.17-.29.2-.49.14-.61-.05-.1-.18-.16-.36-.24-.16-.07-.37-.11-.57-.15-.1-.01-.22-.04-.36-.08s-.2-.04-.3-.15c-.44-.46-1.04-1.1-1.04-1.1s.02-.02.04-.04c.05-.07.09-.12.1-.14.07-.1.14-.15.2-.23.1-.13.2-.25.29-.38.16-.2.27-.37.4-.55.13-.17.2-.27.2-.42 0-.27-.08-.4-.2-.5-.12-.1-.28-.15-.46-.15-.177 0-.404.04-.575.05-.224.01-.48.04-.73.08-.22.04-.44.09-.64.08-.2-.007-.4-.02-.6-.02-.15 0-.3-.005-.44-.005-.33 0-.67.04-.97.08-.5.06-1.17-.03-1.97-.04-.79-.01-1.48-.02-2.12.3-.64.33-1.12 1.03-1.15 1.07-.03.04-.53.64-1.02 1.15z" />
                </svg>
                <span className="text-sm font-bold">WhatsApp Whack!</span>
              </button>
              {navigator.share && (
                <button onClick={handleShareNative} className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-200 transform hover:scale-105 active:scale-95 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                    <path fillRule="evenodd" d="M13.5 4.938a7.5 7.5 0 0 1 6.703 6.703C18.17 19.342 12 22.5 12 22.5S5.829 19.342 3.797 11.641A7.5 7.5 0 0 1 10.5 4.938v1.614a.75.75 0 0 0 1.5 0V4.938ZM12 4.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v1.875a.75.75 0 0 1-1.5 0V5.25h-.75V4.5ZM7.5 7.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V8.25a.75.75 0 0 0-.75-.75Zm9 0a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V8.25a.75.75 0 0 0-.75-.75Zm-7.5 3a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0v-.75a.75.75 0 0 0-.75-.75Zm6 0a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0v-.75a.75.75 0 0 0-.75-.75Zm-3 3a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0v-.75a.75.75 0 0 0-.75-.75Zm0 3a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0v-.75a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-bold">Native Share!</span>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-600 text-center text-lg italic">
          Your unique breakup message will appear here. Get ready to drop some truth bombs! 💣
        </p>
      )}
    </div>
  );
};

export default MessageDisplay;