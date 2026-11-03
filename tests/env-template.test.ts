// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// .env.example is committed, so it must stay a template: real values belong in
// .env.local (git-ignored). This guards against pasting keys into the wrong file.
const ALLOWED_VALUES: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

const SECRET_PATTERNS = [
  /sb_secret_/,
  /sb_publishable_/,
  /eyJ[A-Za-z0-9_-]{10,}/, // JWT (legacy Supabase keys)
  /\bre_[A-Za-z0-9]{10,}/, // Resend
  /https:\/\/[a-z0-9]{20}\.supabase\.co/, // a real project URL
];

function readTemplate(): [key: string, value: string][] {
  const file = readFileSync(join(process.cwd(), ".env.example"), "utf8");

  return file
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    });
}

describe(".env.example", () => {
  it("documents variables without real values", () => {
    for (const [key, value] of readTemplate()) {
      expect(value, `${key} must be empty in .env.example`).toBe(
        ALLOWED_VALUES[key] ?? "",
      );
    }
  });

  it("contains nothing that looks like a key", () => {
    const file = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    for (const pattern of SECRET_PATTERNS) {
      expect(file).not.toMatch(pattern);
    }
  });
});
