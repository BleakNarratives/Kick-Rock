import { MusicFormData, User } from '../types';
import { MOCK_AUDIO_URL, MUSIC_GENERATION_LIMIT_FREE_TIER } from '../constants';
import { getCurrentUser, updateCurrentUser } from './authService';

interface MockMusicGenerationResponse {
  audioUrl: string;
  message: string;
}

// Simulate a delay for API calls
const simulateNetworkDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateMusic(
  formData: MusicFormData,
  onProgress: (message: string) => void,
  onError: (error: string) => void
): Promise<MockMusicGenerationResponse | undefined> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    onError("User not authenticated.");
    return;
  }

  // Check free tier limit
  const today = new Date().toISOString().split('T')[0];
  if (currentUser.lastLoginDate !== today) {
    currentUser.musicGenerationsToday = 0; // Reset for a new day
    currentUser.lastLoginDate = today;
  }

  if (currentUser.musicGenerationsToday >= MUSIC_GENERATION_LIMIT_FREE_TIER) {
    onError(`Free tier limit reached (${MUSIC_GENERATION_LIMIT_FREE_TIER} generations per day). Please log in with another account or wait until tomorrow.`);
    return;
  }

  onProgress("Initiating music generation...");
  await simulateNetworkDelay(1000);
  onProgress(`Prompt received: "${formData.prompt}". Style: ${formData.style}. AI Type: ${formData.aiType}.`);
  await simulateNetworkDelay(2000);
  onProgress("Analyzing request and composing melody...");
  await simulateNetworkDelay(2000);
  onProgress("Adding rhythm and instrumentation...");
  await simulateNetworkDelay(2000);

  const mockAudioUrl = MOCK_AUDIO_URL;
  const mockMessage = `Music generated successfully by ${formData.aiType}! Imagine a vibrant, ${formData.style} piece inspired by "${formData.prompt}".`;

  // Increment usage
  currentUser.musicGenerationsToday++;
  updateCurrentUser(currentUser);

  return {
    audioUrl: mockAudioUrl,
    message: mockMessage,
  };
}
