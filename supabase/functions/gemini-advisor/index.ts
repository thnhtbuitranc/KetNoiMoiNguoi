// ==============================================================================
// SUPABASE EDGE FUNCTION: GEMINI-ADVISOR
// ==============================================================================
// Deploy instructions:
// 1. supabase functions new gemini-advisor
// 2. Paste this code into supabase/functions/gemini-advisor/index.ts
// 3. supabase secrets set GEMINI_API_KEY=your_key_here
// 4. supabase functions deploy gemini-advisor
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai@0.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    
    // Retrieve API Key from Secrets
    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY')
    }

    const ai = new GoogleGenAI({ apiKey });

    let responseText = "";

    // ----------------------------------------------------------------------
    // ACTION: ADVICE (Relationship Advisor)
    // ----------------------------------------------------------------------
    if (action === 'ADVICE') {
      const { relationshipName, tier, lastInteraction, context } = payload;
      
      const prompt = `
        You are a relationship advisor app.
        User wants to reconnect with: "${relationshipName}" (Tier ${tier}/5).
        Last interaction was: ${lastInteraction}.
        User Context: "${context}".
        
        Task: Provide a short, warm, actionable suggestion (max 80 words).
        Language: Detect the language of the 'context' (Vietnamese/English) and respond in that language.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      responseText = response.text || "No advice generated.";
    } 

    // ----------------------------------------------------------------------
    // ACTION: SENTIMENT (Memory Analysis)
    // ----------------------------------------------------------------------
    else if (action === 'SENTIMENT') {
      const { content } = payload;
      
      const prompt = `
        Analyze the emotional sentiment of this text: "${content}".
        Output ONLY a JSON string in this format: {"emoji": "❤️", "label": "Loving", "score": 0.9}
        Do not include markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      responseText = response.text || "{}";
    }

    else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ result: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})