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

/** Formats the block written back into the doc under an answered tag. */
export function formatResponseBlock(response: string, timestamp: string): string {
  return (
    `\n> Gemini response (${timestamp}) ${ANSWERED_MARKER}\n` +
    response
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n") +
    "\n"
  );
}

/** Real backend: reads/writes a live Google Doc via the Docs API. */
export class GoogleDocsClient implements DocClient {
  private readonly docs: docs_v1.Docs;
  private readonly docId: string;

  constructor(docId: string, credentialsPath: string) {
    const auth = new GoogleAuth({
      keyFile: credentialsPath,
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
}
