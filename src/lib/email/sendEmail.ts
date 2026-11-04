import "server-only";

import { render } from "@react-email/components";
import { Resend } from "resend";

import { logger } from "@/lib/logger";

import { getEmailSettings } from "./emailSettings";

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

export type SendEmailResult = { ok: true } | { ok: false; reason: string };

/**
 * Sends one transactional email through Resend. It never throws. A failure comes
 * back as a short reason, never the address, so the caller can tell the admin
 * what went wrong. The invitation stays valid, so it can be sent again.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailInput): Promise<SendEmailResult> {
  const settings = getEmailSettings(process.env);

  if (!settings) {
    logger.error("email.not_configured");
    return { ok: false, reason: "not_configured" };
  }

  try {
    // Rendered here rather than by the SDK, which loads its renderer from a package this app doesn't install.
    const html = await render(react);
    const { error } = await withTimeout(
      new Resend(settings.apiKey).emails.send({
        from: settings.from,
        to,
        subject,
        html,
      }),
      SEND_TIMEOUT_MS,
    );

    if (error) {
      logger.error("email.send_failed", { reason: error.name });
      return { ok: false, reason: error.name };
    }

    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    logger.error("email.send_failed", { reason });
    return { ok: false, reason };
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
