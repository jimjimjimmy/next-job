# agent-collab

Multi-AI collaboration agent for interview prep. Watches a Google Doc for
`@Gemini <instruction>` tags, calls the Gemini API, writes the response back
under the tag, and keeps a changelog of who changed what and when.

## MVP scope

- Read a Google Doc via the Docs API (or a local mock doc with no credentials)
- Detect `@Gemini <instruction>` tags
- Call the Gemini API with the instruction + surrounding context
- Write the response back into the doc, tagged with a timestamp and an
  "answered" marker so it isn't re-answered on the next poll
- Log every step to `changelog.json` (and render it as markdown)
- Manual trigger/stop: a message containing "Write with Gemini ..." (or the
  shorthand "Write with G...") starts monitoring; a message containing "stop"
  ends it; a message containing "What did Gemini say?" (or "What did G
  say?") reads the doc and reports the latest answered response without
  starting/stopping anything
- Claude review: after reading a Gemini response, Claude can review it,
  optionally edit it, and write the edit plus a short reasoning line back
  into the doc under Gemini's answer (`--claude-review`)

Not in this MVP: scheduling/background daemons, automatic (unattended)
review, real-time multi-AI sync, or a UI — see the project brief for phase 2.

## Setup

```bash
cd agent-collab
npm install
cp .env.example .env
```

### Run against the local mock doc (no credentials needed)

```bash
npm run test:mock
```

This runs one pass against `tests/mock-doc.json`, answers every unanswered
`@Gemini` tag with a canned mock response (no `GEMINI_API_KEY` required),
and writes `changelog.json` next to this README. Open `tests/mock-doc.json`
before and after to see the before/after state.

### Run against a real Google Doc

1. Create a Google Cloud service account and download its JSON key.
2. Enable the Google Docs API for that project.
3. Share your Google Doc with the service account's `client_email` (Editor
   access).
4. In `.env` (or as environment variables, e.g. in a cloud sandbox), set:
   - `GOOGLE_DOC_ID` — the ID from the doc's URL
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the service account key JSON content (one
     line), **or** `GOOGLE_APPLICATION_CREDENTIALS` — a path to the key file
   - `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
5. Start monitoring:

   ```bash
   npm start -- --message "Write with Gemini interview prep"
   ```

   The agent polls the doc every `POLL_INTERVAL_MS` (default 15s), answers
   any new `@Gemini` tags, and keeps running until you either press Ctrl-C or
   send a stop message:

   ```bash
   npm start -- --message "stop"
   ```

6. Check the latest answer without starting/stopping the monitor:

   ```bash
   npm start -- --message "What did Gemini say?"
   ```

   Prints the most recently answered `@Gemini` tag's prompt and response, and
   logs a `Claude` changelog entry. This is how the round trip back to Claude
   works today: say the phrase in chat, Claude runs this command, and relays
   the result — there's no automatic push notification when the doc changes.

7. Have Claude review the latest unreviewed Gemini response:

   ```bash
   npm start -- --claude-review --reasoning "<why this edit, or why none was needed>" [--edit "<improved response text>"]
   ```

   Claude runs this after reading a response (step 6) and deciding whether
   it needs improving. It finds the oldest Gemini response that doesn't yet
   have a Claude review, writes `--edit`'s text (or, if omitted, Gemini's
   original response unchanged) under it in bold, with the `--reasoning`
   text above it in italics, and logs a `Claude` changelog entry. Like step
   6, there's no automatic trigger — Claude invokes this manually, in
   response to being asked to check in on the doc.

## How tag detection works

- A tag is any line containing `@Gemini <instruction text>`.
- Context sent to Gemini is the ~400 characters of doc text immediately
  before the tag.
- After answering, the agent inserts a block directly under the tag: a
  plain (non-bold) header line, a blank line, then the response in bold —

  ```
  Gemini response (2026-01-01T00:00:00.000Z) [agent-collab:answered]

  <response text, bold>
  ```

  The `[agent-collab:answered]` marker is how the agent recognizes a tag has
  already been handled and skips it on future polls.
- If Claude reviews that response (`--claude-review`), a second block is
  appended the same way, right under it:

  ```
  Claude review (2026-01-01T00:05:00.000Z) [agent-collab:claude-reviewed]
  Reasoning: <why this edit, or why none was needed — italic>

  <final response text, bold>
  ```

  The `[agent-collab:claude-reviewed]` marker is how `--claude-review` finds
  the next *unreviewed* response, so re-running it doesn't review the same
  one twice.

## Changelog

Every poll, every tag answered (success or error), every start/stop, every
"What did Gemini say?" check, and every Claude review is appended to
`changelog.json` as a structured entry:

```json
{
  "timestamp": "2026-01-01T00:00:00.000Z",
  "actor": "Gemini",
  "action": "answered @Gemini tag",
  "prompt": "Draft a STAR-format answer about ...",
  "status": "success"
}
```

`actor` distinguishes `Jimmy` (manual triggers/stops), `agent` (poll
events), `Gemini` (tag answers), and `Claude` (checking the latest response
and reviewing/editing it). Call `Changelog.toMarkdown()` (see
`src/changelog.ts`) to render a readable table.

## File structure

```
agent-collab/
  src/
    index.ts         - CLI entry: keyword trigger/stop, poll loop
    doc-monitor.ts    - tag detection + Google Docs / mock doc backends
    gemini-client.ts  - Gemini API client (+ mock client when no API key)
    changelog.ts      - append-only change log and markdown renderer
    config.ts         - env/config loading
  tests/
    mock-doc.json     - local test doc, mutated in place by test runs
  .env.example
  README.md
```
