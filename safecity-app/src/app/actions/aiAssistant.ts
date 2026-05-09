'use server';

import { askSentinelAgent } from '@/lib/gemini';

export async function processSafetyQuery(query: string, cityState: any) {
  try {
    const response = await askSentinelAgent(query, cityState);
    return { success: true, response };
  } catch (error) {
    console.error("Action Error (AI Assistant):", error);
    return { success: false, response: "Critical system link failure. Please check terminal connection." };
  }
}
