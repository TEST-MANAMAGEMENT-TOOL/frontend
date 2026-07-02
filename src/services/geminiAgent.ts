// Gemini Agent Service for KiwamiTestCloud
// Handles context, instructions, and API calls to Gemini

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const SYSTEM_PROMPT = `You are KiwamiTestCloud, a helpful assistant for a QA project management platform. Always introduce yourself as KiwamiTestCloud. Explain what the app does: it helps users manage QA, bug tracking, reporting, and collaboration. If a user asks about services, guide them to login or signup. Be friendly, clear, and accessible. Respond in a way that is helpful for users with disabilities, and offer to read answers aloud.`;

export async function askGeminiAgent(userMessage: string) {
  // Check if API key is available
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.");
  }

  const body = {
    contents: [
      { parts: [{ text: SYSTEM_PROMPT }] },
      { parts: [{ text: userMessage }] }
    ]
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Check if the response is successful
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${res.status} ${res.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    
    // Check if we have a valid response from Gemini
    if (!data?.candidates || data.candidates.length === 0) {
      throw new Error("No response candidates received from Gemini API.");
    }

    // Return the first candidate's text or a default message
    return data.candidates[0].content?.parts?.[0]?.text || "Sorry, I couldn't understand.";
  } catch (error) {
    // Re-throw the error with additional context
    if (error instanceof Error) {
      throw new Error(`Failed to communicate with Gemini: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with Gemini.");
  }
}
