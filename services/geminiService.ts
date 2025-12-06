import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameState, PlayUpdate, Team } from "../types";

// Models
const MODEL_LOGIC = 'gemini-2.5-flash';
const MODEL_IMAGE = 'gemini-2.5-flash-image'; // Nano Banana
const MODEL_VIDEO = 'veo-3.1-fast-generate-preview'; // Veo Fast
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// Helper to get client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Generate the Game Logic (Play result, score, commentary)
export const generateNextPlay = async (currentState: GameState): Promise<PlayUpdate> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are the engine for 'ChaosBall', an AI sports network.
    Current Game: ${currentState.homeTeam.name} vs ${currentState.awayTeam.name}.
    Score: ${currentState.homeScore} - ${currentState.awayScore}.
    Period: ${currentState.quarter}. Time: ${currentState.timeRemaining}.
    
    Generate the next play. It can be normal sports action or slightly chaotic/absurd (robots, magic, unexpected events).
    Update the odds based on the new game state.
    Provide a visual prompt for an image generator that captures the scene.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_LOGIC,
    contents: "Simulate the next play. Return JSON.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          homeScoreDelta: { type: Type.INTEGER, description: "Points scored by home team this play" },
          awayScoreDelta: { type: Type.INTEGER, description: "Points scored by away team this play" },
          timeElapsedSeconds: { type: Type.INTEGER, description: "Seconds elapsed during this play" },
          playDescription: { type: Type.STRING, description: "Short technical description of the play" },
          commentary: { type: Type.STRING, description: "Exciting color commentary, slightly unhinged" },
          visualPrompt: { type: Type.STRING, description: "Detailed visual description for an image generator. Focus on the action, the arena, and the visual style (photorealistic, cinematic)." },
          isBigPlay: { type: Type.BOOLEAN, description: "True if this was a major scoring event or spectacular crash" },
          newOdds: {
            type: Type.OBJECT,
            properties: {
              homeWin: { type: Type.NUMBER },
              awayWin: { type: Type.NUMBER },
              overUnder: { type: Type.NUMBER }
            },
            required: ["homeWin", "awayWin", "overUnder"]
          }
        },
        required: ["homeScoreDelta", "awayScoreDelta", "timeElapsedSeconds", "playDescription", "commentary", "visualPrompt", "isBigPlay", "newOdds"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as PlayUpdate;
  }
  throw new Error("Failed to generate play logic");
};

// 2. Generate Keyframe (Nano Banana)
export const generateKeyframe = async (prompt: string): Promise<string> => {
  const ai = getClient();
  
  // Nano Banana supports text-to-image via generateContent
  // Note: Docs say to use generateContent for Nano Banana
  const response = await ai.models.generateContent({
    model: MODEL_IMAGE,
    contents: prompt,
    config: {
        // No specific imageConfig for Nano Banana beyond defaults usually, 
        // but let's ensure we just ask for the content.
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
       return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  // Fallback check if it returns text instead of image (sometimes happens on error)
  if (response.text) {
      console.warn("Nano Banana returned text:", response.text);
  }
  
  throw new Error("No image generated");
};

// 3. Generate Video Replay (Veo)
export const generateReplay = async (prompt: string): Promise<string> => {
  const ai = getClient();
  
  // We need to re-instantiate client or ensure we have the paid key selected in UI before this call
  // This is handled by the component logic ensuring we have a key.

  let operation = await ai.models.generateVideos({
    model: MODEL_VIDEO,
    prompt: `Cinematic highlight replay of sports action: ${prompt}. High quality, dynamic camera angle.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Append Key for fetch
  return `${videoUri}&key=${process.env.API_KEY}`;
};

// 4. Generate Audio Commentary (TTS)
export const generateCommentaryAudio = async (text: string): Promise<ArrayBuffer> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' } // Fenrir sounds deep and intense
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// 5. Initial Game Setup
export const generateMatchSetup = async (theme: string): Promise<{ home: Team, away: Team, venue: string }> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: MODEL_LOGIC,
        contents: `Create two fictional sports teams and a venue based on the theme: "${theme}". Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    home: { 
                        type: Type.OBJECT,
                        properties: { name: {type: Type.STRING}, color: {type: Type.STRING}, mascot: {type: Type.STRING}}
                    },
                    away: { 
                        type: Type.OBJECT,
                        properties: { name: {type: Type.STRING}, color: {type: Type.STRING}, mascot: {type: Type.STRING}}
                    },
                    venue: { type: Type.STRING }
                }
            }
        }
    });
    
    if (response.text) return JSON.parse(response.text);
    throw new Error("Failed to generate matchup");
}
