import { GoogleGenerativeAI } from '@google/generative-ai';

const getModel = () => {
  // Try server-side first, then fallback to public key for demo
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  
  if (!apiKey || apiKey === 'dummy_key') {
    throw new Error('SafeSphere: Gemini API Key is missing. Please add GEMINI_API_KEY to .env.local');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // Defaulting to gemini-1.5-flash as requested
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * AI Agent for High-Level Safety Intelligence
 */
export async function askSentinelAgent(query: string, cityState: any): Promise<string> {
  const prompt = `You are the SafeSphere AI Intelligence Agent. 
You provide tactical safety analysis to the "Chief Officer" of the city.

CURRENT CITY TELEMETRY:
- Active Incidents: ${JSON.stringify(cityState.incidents)}
- Safety Score: ${cityState.safetyScore}%
- Status: ${cityState.incidents.length > 0 ? 'ACTIVE THREATS DETECTED' : 'NOMINAL'}

MAP CONTROL CAPABILITY:
If the user asks about a location or where something is, you can mark it on the tactical map by adding this tag at the END of your response:
[[MAP_MARKER: lat, lng, label]]
Example: "Chief, I have located the suspicious activity near MG Road. [[MAP_MARKER: 12.9716, 77.5946, Suspicious Activity]]"

INSTRUCTIONS:
1. Always address the user as "Chief".
2. Be professional, data-driven, and technical.
3. If risk is high, suggest immediate deployment.
4. Keep standard responses under 3-4 sentences.
5. If you mention a location, ALWAYS try to include a [[MAP_MARKER]] tag if you have the coordinates.

User Query: "${query}"`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("Empty response from AI");
    return text;
  } catch (error: any) {
    console.error('SafeSphere AI Error:', error);
    
    // Friendly error for the user
    if (error.message?.includes('API_KEY_INVALID')) {
       return "Chief, the neural link authentication failed. Please verify the Gemini API Key in the server configuration.";
    }
    
    return "I am currently having trouble accessing the neural network, Chief. However, local diagnostics remain stable. Please cross-reference with dispatch for any active district threats.";
  }
}

/**
 * Backward compatibility
 */
export async function processSafetyQuery(query: string, cityState: any) {
  return await askSentinelAgent(query, cityState);
}
