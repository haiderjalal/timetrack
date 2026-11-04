import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { revokeInvitation } from "../actions/revokeInvitation";

import { PendingInvitationRow } from "./PendingInvitationRow";

import type { PendingInvitation } from "../types/invitation";

// The server actions need the database and the mail provider; the row only decides
// what to show while they run.
vi.mock("../actions/inviteMembers", () => ({
  inviteMembers: vi.fn(),
}));
vi.mock("../actions/revokeInvitation", () => ({
  revokeInvitation: vi.fn(),
}));

const revoke = vi.mocked(revokeInvitation);

const invitation: PendingInvitation = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ana@example.com",
  role: "member",
  expiresAt: "2026-11-11T00:00:00Z",
  isExpired: false,
};

function renderRow(): void {
  render(
    <ul>
      <PendingInvitationRow
        orgSlug="acme"
        invitation={invitation}
        expiry="Expires 11 Nov 2026"
      />
    </ul>,
  );
}

describe("PendingInvitationRow", () => {
  beforeEach(() => {
    revoke.mockReset();
  });

  it("hides the invitation before the server answers", () => {
    // Never resolves, so the test sees only what the row shows while waiting.
    revoke.mockReturnValue(new Promise<never>(() => {}));
    renderRow();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke invitation to ana@example.com",
      }),
    );

    expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument();
  });

  it("shows the row again with the reason when the revoke fails", async () => {
    revoke.mockResolvedValue({
      success: false,
      message: "This invitation is no longer valid. Ask for a new one.",
    });
    renderRow();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke invitation to ana@example.com",
      }),
    );

    await waitFor(() =>
      expect(screen.getByText("ana@example.com")).toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "This invitation is no longer valid.",
    );
  });
});
