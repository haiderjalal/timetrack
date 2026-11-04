import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { acceptMyInvitation } from "../actions/acceptMyInvitation";

import { JoinInvitationButton } from "./JoinInvitationButton";

// The server action needs the database; the button only shows the outcome.
vi.mock("../actions/acceptMyInvitation", () => ({
  acceptMyInvitation: vi.fn(),
}));

const accept = vi.mocked(acceptMyInvitation);
const INVITATION_ID = "11111111-1111-4111-8111-111111111111";

describe("JoinInvitationButton", () => {
  beforeEach(() => {
    accept.mockReset();
  });

  it("asks the server to join that invitation", async () => {
    accept.mockResolvedValue({
      success: false,
      message: "Something went wrong.",
    });
    render(
      <JoinInvitationButton
        invitationId={INVITATION_ID}
        organizationName="Acme"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Join Acme" }));

    await waitFor(() => expect(accept).toHaveBeenCalledWith(INVITATION_ID));
  });

  it("shows why joining failed, next to the invitation", async () => {
    accept.mockResolvedValue({
      success: false,
      message: "This invitation has expired. Ask for a new one.",
    });
    render(
      <JoinInvitationButton
        invitationId={INVITATION_ID}
        organizationName="Acme"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Join Acme" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This invitation has expired.",
      ),
    );
  });
});
