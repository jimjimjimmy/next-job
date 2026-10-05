import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiClient {
  generate(prompt: string, contextText: string): Promise<string>;
}

const SYSTEM_PREAMBLE =
  "You are collaborating inside a shared interview-prep document. " +
  "Answer the instruction concisely and usefully, using the surrounding " +
  "document text as context. Do not repeat the instruction back verbatim.";

/** Real Gemini API client, used when GEMINI_API_KEY is configured. */
export class RealGeminiClient implements GeminiClient {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName = "gemini-flash-lite-latest") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generate(prompt: string, contextText: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const fullPrompt = `${SYSTEM_PREAMBLE}\n\n--- Document context ---\n${contextText}\n\n--- Instruction ---\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
  }
}

/**
 * Deterministic stand-in used in mock mode (no GEMINI_API_KEY) so the full
 * detect -> call -> write -> log pipeline can be exercised without network
 * access or a real API key.
 */
export class MockGeminiClient implements GeminiClient {
  async generate(prompt: string, _contextText: string): Promise<string> {
    return `[mock Gemini response] Here is a draft answer for: "${prompt}". ` +
      "Replace GEMINI_API_KEY with a real key to get a live response.";
  }
}

export function createGeminiClient(apiKey: string | undefined): GeminiClient {
  if (!apiKey) {
    return new MockGeminiClient();
  }
  return new RealGeminiClient(apiKey);
}
