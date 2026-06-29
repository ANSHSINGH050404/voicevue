import fs from "fs";
import path from "path";

const promptsDir = path.join(process.cwd(), "src/lib/prompts");

const promptCache = new Map<string, string>();

export function loadPrompt(filename: string): string {
  if (promptCache.has(filename)) {
    return promptCache.get(filename)!;
  }
  const filePath = path.join(promptsDir, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  promptCache.set(filename, content);
  return content;
}
