import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES, invitePath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";
import type { CurrentUser } from "@/features/auth/types/currentUser";
import { AcceptInvitationPanel } from "@/features/invitations/components/AcceptInvitationPanel";
import { getInvitationPreview } from "@/features/invitations/services/acceptInvitation";
import type {
  InvitationPreview,
  InvitationPreviewState,
} from "@/features/invitations/types/invitation";
import { ROLE_LABELS } from "@/features/organizations/utils/roles";
import { INVITATION_TOKEN_PATTERN } from "@/lib/validations/invitation.schema";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join a team",
  robots: { index: false },
};

/**
 * The page an invitation email links to. It only reads the invitation; nothing
 * changes until the person presses Join.
 */
export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-12">
      <Suspense fallback={<InviteSkeleton />}>
        <InviteCard params={params} />
      </Suspense>
    </main>
  );
}

async function InviteCard({
  params,
}: Pick<PageProps<"/invite/[token]">, "params">) {
  const { token } = await params;
  if (!INVITATION_TOKEN_PATTERN.test(token)) notFound();

  const user = await requireUser(invitePath(token));
  const preview = await getInvitationPreview(token);

  return (
    <section
      aria-labelledby="invite-title"
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
    >
      <InviteContent token={token} preview={preview} user={user} />
    </section>
  );
}

interface InviteContentProps {
  token: string;
  preview: InvitationPreview;
  user: CurrentUser;
}

function InviteContent({ token, preview, user }: InviteContentProps) {
  const { state, organizationName, role } = preview;

  if (state === "ready" && organizationName && role) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <h1
            id="invite-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Join {organizationName}
          </h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited as {ROLE_LABELS[role]}. You&apos;re signed
            in as {user.email}.
          </p>
        </div>
        <AcceptInvitationPanel
          token={token}
          organizationName={organizationName}
        />
      </>
    );
  }

  const notice = getNotice(
    state === "ready" ? "unavailable" : state,
    user.email,
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 id="invite-title" className="text-2xl font-semibold tracking-tight">
          {notice.title}
        </h1>
        <p className="text-sm text-muted-foreground">{notice.body}</p>
      </div>
      <Link
        href={ROUTES.account}
        className={buttonVariants({ variant: "outline" })}
      >
        Go to your account
      </Link>
    </>
  );
}

/** Says what went wrong and what to do, without revealing who the invitation was for. */
function getNotice(
  state: Exclude<InvitationPreviewState, "ready">,
  signedInEmail: string,
): { title: string; body: string } {
  switch (state) {
    case "wrong_account":
      return {
        title: "This invitation is for another account",
        body: `You're signed in as ${signedInEmail}. Sign out, then sign in with the Google account the invitation was sent to.`,
      };
    case "expired":
      return {
        title: "This invitation has expired",
        body: "Ask the person who invited you to send a new one.",
      };
    case "unavailable":
      return {
        title: "This invitation is no longer valid",
        body: "It may have been used, replaced or cancelled. Ask for a new one.",
      };
  }
}

function InviteSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8"
    >
      <span className="h-8 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
      <span className="h-4 w-full rounded bg-muted motion-safe:animate-pulse" />
      <span className="h-11 w-full rounded-lg bg-muted motion-safe:animate-pulse" />
    </section>
  );
}
