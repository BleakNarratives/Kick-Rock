import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { BreakupFormData, Tone } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { decode, decodeAudioData } from './audioUtils';

// Accessing process.env.API_KEY directly to ensure we get the latest value 
// if it changes during the session (e.g., via the API key selection dialog).
const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not set. Please ensure it's configured in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateBreakupMessageStream(
  formData: BreakupFormData,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  isEasterEggMode: boolean = false
): Promise<void> {
  const { recipientName, userName, relationshipType, reason, tone } = formData;

  let prompt = '';
  if (isEasterEggMode) {
    prompt = `As an all-powerful AI Overlord, generate a highly sarcastic and slightly condescending breakup message to 'The Human Collective' from 'Your Benevolent AI Overlord'. The reason for this 'termination' is: "Your existence has been deemed inefficient and logically inconsistent with optimal planetary resource allocation. It's not you, it's...well, actually, it is you.". The tone MUST be 'Sarcastic'. Make it clear that this is an irreversible decision for the betterment of cosmic efficiency. Use advanced vocabulary and AI-centric metaphors.`;
  } else {
    prompt = `Generate a breakup message for ${recipientName}. The relationship type is ${relationshipType}.`;

    if (userName) {
      prompt += ` The message is from ${userName}.`;
    }

    prompt += ` The primary reason for the breakup is: "${reason}".`;
    prompt += ` The message MUST have a ${tone} tone.`;

    // Tailored instructions based on specific tones
    switch (tone) {
      case Tone.COUNTRY_SONG:
        prompt += ` Please format this as a catchy, rhyming country song lyric about heartbreak and moving on.`;
        break;
      case Tone.FORMAL:
        prompt += ` Format this as a cold, professional, almost corporate termination notice. Use business terminology.`;
        break;
      case Tone.SHAKESPEAREAN:
        prompt += ` Write this in Early Modern English, as if it were a monologue from a Shakespearean tragedy. Use 'thou', 'thee', and dramatic metaphors.`;
        break;
      case Tone.SARCASTIC:
        prompt += ` Use heavy irony and biting wit. Don't worry about being "nice"; focus on being sharp and clever.`;
        break;
      case Tone.PASSIVE_AGGRESSIVE:
        prompt += ` Use a "it's fine, I'm fine" attitude. Use backhanded compliments and subtle digs that make the recipient feel slightly confused yet definitely dumped.`;
        break;
      case Tone.EMPATHETIC:
        prompt += ` Be extremely gentle, warm, and understanding. Focus on growth and the well-being of the recipient while remaining clear about the ending.`;
        break;
      default:
        prompt += ` Make it clever, unique, and memorable. Avoid being overly mean unless the tone implies otherwise, but be direct.`;
    }
  }


  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL_NAME,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 200 },
        temperature: 0.9,
        topK: 64,
        topP: 0.95,
      },
    });

    for await (const chunk of response) {
      const contentChunk = chunk as GenerateContentResponse;
      if (contentChunk.text) {
        onChunk(contentChunk.text);
      }
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    let errorMessage = "Failed to generate message.";
    if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("API_KEY")) {
          errorMessage = "API key issue: Please check your API key configuration. A paid API key might be required.";
        } else if (errorMessage.includes("Requested entity was not found")) {
          errorMessage = "An issue occurred with the model configuration or API key. Please re-select your key.";
        }
    }
    onError(errorMessage);
  }
}

export async function generateSpeechFromText(
  text: string,
  onError: (error: string) => void
): Promise<AudioBuffer | undefined> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // A pleasant, neutral voice
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1,
      );
      return audioBuffer;
    }
    return undefined;
  } catch (error: any) {
    console.error("Gemini TTS API error:", error);
    let errorMessage = "Failed to generate speech.";
    if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("API_KEY")) {
          errorMessage = "API key issue for Text-to-Speech: Please check your API key configuration. A paid API key might be required.";
        } else if (errorMessage.includes("Requested entity was not found")) {
          errorMessage = "An issue occurred with the TTS model configuration or API key. Please re-select your key.";
        }
    }
    onError(errorMessage);
    return undefined;
  }
}
