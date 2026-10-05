import { config as loadEnv } from "dotenv";

loadEnv();

export interface AgentConfig {
  geminiApiKey: string | undefined;
  googleDocId: string | undefined;
  /** Either a path to a service-account key file, or the raw key JSON itself. */
  googleCredentials: string | undefined;
  pollIntervalMs: number;
  useMockDoc: boolean;
}

function parseBool(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

export function loadConfig(): AgentConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleDocId = process.env.GOOGLE_DOC_ID;
  const googleCredentials =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? 15000);

  // Fall back to the mock doc whenever real Google Docs access isn't configured,
  // so the agent is runnable without any credentials (see TESTING in the spec).
  const useMockDoc =
    parseBool(process.env.USE_MOCK_DOC) || !googleDocId || !googleCredentials;

  return {
    geminiApiKey,
    googleDocId,
    googleCredentials,
    pollIntervalMs,
    useMockDoc,
  };
}
