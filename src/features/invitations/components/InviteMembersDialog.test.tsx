import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inviteMembers } from "../actions/inviteMembers";

import { InviteMembersDialog } from "./InviteMembersDialog";

// The server action needs the database and the mail provider; the dialog only
// decides what to show with its result.
vi.mock("../actions/inviteMembers", () => ({
  inviteMembers: vi.fn(),
}));

const invite = vi.mocked(inviteMembers);

function openDialog(): void {
  fireEvent.click(screen.getByRole("button", { name: "Invite people" }));
}

function typeAddresses(text: string): void {
  fireEvent.change(screen.getByLabelText("Email addresses"), {
    target: { value: text },
  });
}

function submit(): void {
  fireEvent.click(screen.getByRole("button", { name: "Send invitations" }));
}

describe("InviteMembersDialog", () => {
  beforeEach(() => {
    invite.mockReset();
  });

  it("closes and shows the success on the page", async () => {
    invite.mockResolvedValue({
      success: true,
      message: "Sent 1 invitation.",
      data: { invited: ["ana@example.com"], alreadyMembers: [], failed: [] },
    });
    render(<InviteMembersDialog orgSlug="acme" actorRole="owner" />);

    openDialog();
    typeAddresses("ana@example.com");
    submit();

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Sent 1 invitation.");
    expect(invite).toHaveBeenCalledWith("acme", {
      emails: ["ana@example.com"],
      role: "member",
    });
  });

  it("closes, shows the error on the page, and keeps the addresses", async () => {
    invite.mockResolvedValue({
      success: false,
      message: "Email isn't set up yet, so no invitations were sent.",
    });
    render(<InviteMembersDialog orgSlug="acme" actorRole="owner" />);

    openDialog();
    typeAddresses("ana@example.com");
    submit();

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Email isn't set up yet, so no invitations were sent.",
    );

    openDialog();
    expect(screen.getByLabelText("Email addresses")).toHaveValue(
      "ana@example.com",
    );
  });
});
