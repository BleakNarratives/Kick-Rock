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

    // Tailored instructions based on specific tones for the "nah nah-nah, boo boo" vibe
    switch (tone) {
      case Tone.COUNTRY_SONG:
        prompt += ` Format this as a mournful, slightly whiny, yet catchy country song lyric about heartbreak and movin' on down the road. Make it sound like it's from a dive bar jukebox.`;
        break;
      case Tone.FORMAL:
        prompt += ` Format this as a ridiculously over-the-top, bureaucratic corporate termination notice. Use as much passive-aggressive, corporate jargon as possible to imply their utter insignificance. Make it sound like they're being downsized from your life.`;
        break;
      case Tone.SHAKESPEAREAN:
        prompt += ` Write this in the grand, dramatic, and slightly mocking style of a Shakespearean monologue, full of flowery insults and exaggerated woe. Use 'thou', 'thee', and metaphors that question their very being.`;
        break;
      case Tone.SARCASTIC:
        prompt += ` Use heavy irony, biting wit, and thinly veiled insults. Don't be subtle; make it clear you're done and they're the problem, but with a smug grin. Think playground taunt, but with bigger words.`;
        break;
      case Tone.PASSIVE_AGGRESSIVE:
        prompt += ` Craft a message dripping with sugary venom. Use backhanded compliments, veiled threats, and statements like "It's fine, I'm fine" while clearly implying the opposite. Make them feel slightly confused but definitely dumped.`;
        break;
      case Tone.EMPATHETIC:
        prompt += ` While still breaking up, try to sound overly sweet, almost condescendingly gentle. Focus on *their* growth and how *they* will overcome this, implying it's a blessing in disguise for them.`;
        break;
      case Tone.WITTY:
        prompt += ` Make it clever, sharp, and deliver a memorable verbal mic drop. Use intelligent wordplay that leaves them stunned and slightly impressed, despite being dumped.`;
        break;
      case Tone.DRAMATIC:
        prompt += ` Go full soap opera! Over-the-top declarations of anguish and inevitable doom, but with a theatrical flair that subtly mocks the severity.`;
        break;
      case Tone.POETIC:
        prompt += ` Write a short, rhyming poem or verse that's subtly insulting but sounds beautiful. The kind of 'artistic' breakup that leaves them scratching their head.`;
        break;
      case Tone.BLUNT_BUT_KIND:
        prompt += ` Be direct and to the point, but wrap it in a thin veneer of civility that still makes it clear there's no going back, like ripping off a band-aid quickly but with a soft pat afterward.`;
        break;
      case Tone.HUMOROUS:
        prompt += ` Inject lighthearted jokes and absurd comparisons. Make them laugh, but also realize they're officially on your 'kick rocks' list.`;
        break;
      default:
        prompt += ` Make it clever, unique, and memorable. Avoid being overly mean unless the tone implies otherwise, but be direct. Lean into a slight "nah nah-nah, boo boo" energy without being overtly offensive.`;
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