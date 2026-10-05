import { readFile, writeFile } from "node:fs/promises";
import { google, docs_v1 } from "googleapis";
import { GoogleAuth } from "google-auth-library";

/** A single @Gemini tag found in the document. */
export interface GeminiTag {
  /** The instruction text after "@Gemini". */
  prompt: string;
  /** A few hundred characters of surrounding text, given to Gemini as context. */
  context: string;
  /** Character offset in the plain-text doc, right after the tag's line. */
  insertAt: number;
}

export const ANSWERED_MARKER = "[agent-collab:answered]";

/**
 * Backend-agnostic view of a document: plain text in, plain text out. Both the
 * real Google Docs client and the local mock client implement this so
 * doc-monitor's tag-scanning logic is shared between them.
 */
export interface DocClient {
  /** Returns the document's current plain text. */
  getText(): Promise<string>;
  /** Inserts `text` at character offset `insertAt` in the plain text. */
  insertText(insertAt: number, text: string): Promise<void>;
  /**
   * Inserts a response block at `insertAt`: a header line followed by the
   * body text, with the header bolded where the backend supports rich
   * formatting.
   */
  insertAnsweredBlock(insertAt: number, header: string, body: string): Promise<void>;
}

const TAG_PATTERN = /@Gemini\s+([^\n]+)/g;
const CONTEXT_RADIUS = 400;

/** Finds unanswered @Gemini tags in `text`. */
export function findUnansweredTags(text: string): GeminiTag[] {
  const tags: GeminiTag[] = [];
  for (const match of text.matchAll(TAG_PATTERN)) {
    const prompt = match[1].trim();
    const tagEnd = (match.index ?? 0) + match[0].length;

    // Skip tags that already have a response written under them.
    const lookahead = text.slice(tagEnd, tagEnd + ANSWERED_MARKER.length + 200);
    if (lookahead.includes(ANSWERED_MARKER)) {
      continue;
    }

    const contextStart = Math.max(0, (match.index ?? 0) - CONTEXT_RADIUS);
    const context = text.slice(contextStart, match.index ?? 0);

    tags.push({ prompt, context, insertAt: tagEnd });
  }
  return tags;
}

/** A tag that already has a Gemini response written under it. */
export interface AnsweredResponse {
  prompt: string;
  timestamp: string;
  response: string;
}

const HEADER_PATTERN = /Gemini response \(([^)]+)\) \[agent-collab:answered\]\n/;

/** Finds every already-answered @Gemini tag and its response, in doc order. */
export function findAnsweredResponses(text: string): AnsweredResponse[] {
  const results: AnsweredResponse[] = [];
  for (const match of text.matchAll(TAG_PATTERN)) {
    const prompt = match[1].trim();
    const tagEnd = (match.index ?? 0) + match[0].length;
    const after = text.slice(tagEnd, tagEnd + ANSWERED_MARKER.length + 200);
    const headerMatch = after.match(HEADER_PATTERN);
    if (!headerMatch || headerMatch.index === undefined) {
      continue;
    }

    const bodyStart = tagEnd + headerMatch.index + headerMatch[0].length;
    const rest = text.slice(bodyStart);
    const nextTag = rest.match(/\n@Gemini\s/);
    const bodyEnd = nextTag && nextTag.index !== undefined ? bodyStart + nextTag.index : text.length;

    results.push({
      prompt,
      timestamp: headerMatch[1],
      response: text.slice(bodyStart, bodyEnd).trim(),
    });
  }
  return results;
}

/** The bolded header line placed above each Gemini response. */
export function formatResponseHeader(timestamp: string): string {
  return `\nGemini response (${timestamp}) ${ANSWERED_MARKER}\n`;
}

/** The plain-text response body, placed under the header. */
export function formatResponseBody(response: string): string {
  return `${response}\n`;
}

/** Real backend: reads/writes a live Google Doc via the Docs API. */
export class GoogleDocsClient implements DocClient {
  private readonly docs: docs_v1.Docs;
  private readonly docId: string;

  /**
   * `credentials` is either a path to a service-account JSON key file, or
   * the raw JSON key content itself (useful when the key is injected via an
   * environment variable rather than a file on disk).
   */
  constructor(docId: string, credentials: string) {
    const trimmed = credentials.trim();
    const authOptions = trimmed.startsWith("{")
      ? { credentials: JSON.parse(trimmed) }
      : { keyFile: trimmed };
    const auth = new GoogleAuth({
      ...authOptions,
      scopes: ["https://www.googleapis.com/auth/documents"],
    });
    this.docs = google.docs({ version: "v1", auth });
    this.docId = docId;
  }

  async getText(): Promise<string> {
    const { data } = await this.docs.documents.get({ documentId: this.docId });
    return extractPlainText(data);
  }

  async insertText(insertAt: number, text: string): Promise<void> {
    await this.docs.documents.batchUpdate({
      documentId: this.docId,
      requestBody: {
        requests: [
          {
            insertText: {
              text,
              location: { index: insertAt },
            },
          },
        ],
      },
    });
  }

  async insertAnsweredBlock(insertAt: number, header: string, body: string): Promise<void> {
    await this.docs.documents.batchUpdate({
      documentId: this.docId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: header + body,
              location: { index: insertAt },
            },
          },
          {
            updateTextStyle: {
              range: {
                startIndex: insertAt,
                endIndex: insertAt + header.length,
              },
              textStyle: { bold: true },
              fields: "bold",
            },
          },
        ],
      },
    });
  }
}

/** Flattens a Docs API document body into plain text, Docs-index-aligned. */
function extractPlainText(document: docs_v1.Schema$Document): string {
  let text = "";
  for (const element of document.body?.content ?? []) {
    for (const run of element.paragraph?.elements ?? []) {
      text += run.textRun?.content ?? "";
    }
  }
  return text;
}

/**
 * Mock backend: reads/writes tests/mock-doc.json so the full pipeline can be
 * exercised locally with no Google credentials.
 */
export class MockDocClient implements DocClient {
  constructor(private readonly filePath: string) {}

  async getText(): Promise<string> {
    const raw = await readFile(this.filePath, "utf-8");
    return JSON.parse(raw).content as string;
  }

  async insertText(insertAt: number, text: string): Promise<void> {
    const raw = await readFile(this.filePath, "utf-8");
    const doc = JSON.parse(raw) as { title: string; content: string };
    doc.content = doc.content.slice(0, insertAt) + text + doc.content.slice(insertAt);
    await writeFile(this.filePath, JSON.stringify(doc, null, 2), "utf-8");
  }

  // The mock backend has no rich-text model, so the header is written as
  // plain text like the body; there's nothing to bold.
  async insertAnsweredBlock(insertAt: number, header: string, body: string): Promise<void> {
    await this.insertText(insertAt, header + body);
  }
}
