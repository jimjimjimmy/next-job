import { readFile, writeFile } from "node:fs/promises";

export type Actor = "Jimmy" | "Claude" | "Gemini" | "agent";

export interface ChangelogEntry {
  timestamp: string;
  actor: Actor;
  action: string;
  prompt?: string;
  status: "success" | "error";
  detail?: string;
}

/** Append-only JSON changelog, plus a markdown renderer for quick review. */
export class Changelog {
  constructor(private readonly filePath: string) {}

  async append(entry: ChangelogEntry): Promise<void> {
    const entries = await this.readAll();
    entries.push(entry);
    await writeFile(this.filePath, JSON.stringify(entries, null, 2), "utf-8");
  }

  async readAll(): Promise<ChangelogEntry[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as ChangelogEntry[];
    } catch {
      return [];
    }
  }

  async toMarkdown(): Promise<string> {
    const entries = await this.readAll();
    if (entries.length === 0) {
      return "# Changelog\n\n_No changes yet._\n";
    }
    const rows = entries
      .map(
        (e) =>
          `| ${e.timestamp} | ${e.actor} | ${e.action} | ${e.status} | ${
            e.prompt ?? ""
          } | ${e.detail ?? ""} |`
      )
      .join("\n");
    return (
      "# Changelog\n\n" +
      "| Timestamp | Actor | Action | Status | Prompt | Detail |\n" +
      "| --- | --- | --- | --- | --- | --- |\n" +
      rows +
      "\n"
    );
  }
}
