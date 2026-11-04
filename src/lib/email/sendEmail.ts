import "server-only";

import { Resend } from "resend";

import { logger } from "@/lib/logger";

import type { ReactElement } from "react";

const SEND_TIMEOUT_MS = 10_000;

class EmailTimeoutError extends Error {
  constructor() {
    super("Email send timed out");
    this.name = "EmailTimeoutError";
  }
}

export interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Sends one transactional email through Resend. It never throws: a failure is
 * logged by reason only (never the address) and reported as false, so the
 * invitation behind it stays valid and an admin can send it again.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    logger.error("email.not_configured");
    return false;
  }

  try {
    const { error } = await withTimeout(
      new Resend(apiKey).emails.send({ from, to, subject, react }),
      SEND_TIMEOUT_MS,
    );

    if (error) {
      logger.error("email.send_failed", { reason: error.name });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("email.send_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}

/** Rejects if the provider is slow, so one email can't hold a request open. */
function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new EmailTimeoutError()), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
