import { mkdir, rm, access, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import {
  DocClient,
  GoogleDocsClient,
  MockDocClient,
  findUnansweredTags,
  findAnsweredResponses,
  formatResponseHeader,
  formatResponseBody,
} from "./doc-monitor.js";
import { createGeminiClient } from "./gemini-client.js";
import { Changelog } from "./changelog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = path.resolve(__dirname, "..");
const MOCK_DOC_PATH = path.join(AGENT_ROOT, "tests", "mock-doc.json");
const CHANGELOG_PATH = path.join(AGENT_ROOT, "changelog.json");
const LOCK_PATH = path.join(AGENT_ROOT, ".agent-running");

const TRIGGER_PATTERN = /\bwrite with g(?:emini)?\b/i;
const STOP_PATTERN = /\bstop\b/i;
const REPORT_PATTERN = /\bwhat did g(?:emini)? say\b/i;

interface Cli {
  message?: string;
  once: boolean;
  forceMock: boolean;
}

function parseArgs(argv: string[]): Cli {
  const cli: Cli = { once: false, forceMock: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--message") cli.message = argv[++i];
    else if (argv[i] === "--once") cli.once = true;
    else if (argv[i] === "--mock") cli.forceMock = true;
  }
  return cli;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** One pass: find unanswered @Gemini tags, answer each, log every step. */
async function runPass(docClient: DocClient, changelog: Changelog): Promise<number> {
  const gemini = createGeminiClient(loadConfig().geminiApiKey);
  const text = await docClient.getText();
  const tags = findUnansweredTags(text);

  await changelog.append({
    timestamp: new Date().toISOString(),
    actor: "agent",
    action: "poll",
    status: "success",
    detail: `found ${tags.length} unanswered @Gemini tag(s)`,
  });

  // Insert from the end of the doc backwards so earlier insertions don't
  // shift the offsets of tags that come later in the same pass.
  const tagsInReverse = [...tags].sort((a, b) => b.insertAt - a.insertAt);

  for (const tag of tagsInReverse) {
    const timestamp = new Date().toISOString();
    try {
      const response = await gemini.generate(tag.prompt, tag.context);
      await docClient.insertAnsweredBlock(
        tag.insertAt,
        formatResponseHeader(timestamp),
        formatResponseBody(response)
      );
      await changelog.append({
        timestamp,
        actor: "Gemini",
        action: "answered @Gemini tag",
        prompt: tag.prompt,
        status: "success",
      });
    } catch (err) {
      await changelog.append({
        timestamp,
        actor: "Gemini",
        action: "answered @Gemini tag",
        prompt: tag.prompt,
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return tags.length;
}

async function buildDocClient(forceMock: boolean): Promise<DocClient> {
  const config = loadConfig();
  if (forceMock || config.useMockDoc) {
    console.log(`[agent-collab] using mock doc at ${MOCK_DOC_PATH}`);
    return new MockDocClient(MOCK_DOC_PATH);
  }
  console.log(`[agent-collab] using live Google Doc ${config.googleDocId}`);
  return new GoogleDocsClient(config.googleDocId as string, config.googleCredentials as string);
}

async function startMonitoring(cli: Cli): Promise<void> {
  const config = loadConfig();
  const docClient = await buildDocClient(cli.forceMock);
  const changelog = new Changelog(CHANGELOG_PATH);

  await changelog.append({
    timestamp: new Date().toISOString(),
    actor: "Jimmy",
    action: "triggered monitoring",
    status: "success",
    detail: cli.message,
  });

  await mkdir(AGENT_ROOT, { recursive: true });
  await writeFile(LOCK_PATH, "running", "utf-8");

  console.log("[agent-collab] monitoring started. Send a message containing \"stop\" to end it.");

  const poll = async () => {
    if (!(await fileExists(LOCK_PATH))) {
      console.log("[agent-collab] lock file removed, stopping.");
      clearInterval(interval);
      process.exit(0);
    }
    const found = await runPass(docClient, changelog);
    if (found > 0) {
      console.log(`[agent-collab] answered ${found} tag(s).`);
    }
    if (cli.once) {
      clearInterval(interval);
      await rm(LOCK_PATH, { force: true });
      process.exit(0);
    }
  };

  const interval = setInterval(poll, config.pollIntervalMs);
  process.on("SIGINT", async () => {
    console.log("\n[agent-collab] SIGINT received, stopping.");
    clearInterval(interval);
    await rm(LOCK_PATH, { force: true });
    process.exit(0);
  });

  await poll();
}

async function stopMonitoring(changelog: Changelog): Promise<void> {
  await rm(LOCK_PATH, { force: true });
  await changelog.append({
    timestamp: new Date().toISOString(),
    actor: "Jimmy",
    action: "stopped monitoring",
    status: "success",
  });
  console.log("[agent-collab] stop signal recorded. A running monitor loop will exit on its next poll.");
}

/** Reads the doc and prints the most recent answered @Gemini response, for Claude to relay. */
async function reportLatest(cli: Cli, changelog: Changelog): Promise<void> {
  const docClient = await buildDocClient(cli.forceMock);
  const text = await docClient.getText();
  const responses = findAnsweredResponses(text);
  const latest = responses[responses.length - 1];

  if (!latest) {
    console.log("[agent-collab] no answered @Gemini tags found yet.");
  } else {
    console.log(`[agent-collab] latest Gemini response (${latest.timestamp}):`);
    console.log(`  prompt: ${latest.prompt}`);
    console.log(`  response: ${latest.response}`);
  }

  await changelog.append({
    timestamp: new Date().toISOString(),
    actor: "Claude",
    action: "checked latest Gemini response",
    status: "success",
    detail: latest
      ? `found ${responses.length} answered tag(s); latest timestamp ${latest.timestamp}`
      : "no answered tags found",
  });
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const changelog = new Changelog(CHANGELOG_PATH);

  if (cli.message && REPORT_PATTERN.test(cli.message)) {
    await reportLatest(cli, changelog);
    return;
  }

  if (cli.message && STOP_PATTERN.test(cli.message) && !TRIGGER_PATTERN.test(cli.message)) {
    await stopMonitoring(changelog);
    return;
  }

  if (!cli.message || TRIGGER_PATTERN.test(cli.message) || cli.once) {
    await startMonitoring(cli);
    return;
  }

  console.log(
    '[agent-collab] no action taken. Pass --message "Write with Gemini <topic>" to start, ' +
      '--message "What did Gemini say?" to check the latest response, or --message "stop" to stop.'
  );
}

main().catch((err) => {
  console.error("[agent-collab] fatal error:", err);
  process.exitCode = 1;
});
