import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RelationshipTier } from "../types";

// Helper to get the AI client
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    throw new Error("API Key is required for Gemini services.");
  }
  return new GoogleGenAI({ apiKey });
};

export const getRelationshipAdvice = async (
  relationshipName: string,
  tier: RelationshipTier,
  lastInteraction: string,
  context: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-flash-preview"; 

    const prompt = `
      You are a warm, empathetic relationship advisor for the 'Connect Everyone' app. 
      The user wants to reconnect or strengthen a bond with: "${relationshipName}".
      
      Relationship Details:
      - Tier Level: ${tier} (1=Acquaintance, 5=Soulmate)
      - Last Interaction: ${lastInteraction}
      - User's context/worry: "${context}"

      Please provide a short, actionable, and warm piece of advice (max 100 words). 
      Suggest a specific small action (e.g., a message template, a gift idea, or a shared activity) appropriate for Tier ${tier}.
      Respond in the same language as the context (Detect if Vietnamese or English).
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Sorry, I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error fetching advice from Gemini:", error);
    return "Could not connect to the relationship advisor. Please try again later.";
  }
};

export const analyzeMemorySentiment = async (memoryContent: string): Promise<string> => {
    try {
        const ai = getAIClient();
        const modelId = "gemini-3-flash-preview";
        
        const prompt = `
          Analyze the sentiment and emotional tone of this memory note: "${memoryContent}".
          Return a single emoji that best represents this memory followed by a 3-word summary.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt
        });

        return response.text || "✨ Precious Memory";
    } catch (error) {
        return "✨ Precious Memory";
    }
}