// @vitest-environment node
import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { InvitationEmail } from "./InvitationEmail";

// Rendering on the server is what sendEmail does before it calls Resend, so a
// template that can't render would fail every invitation.
describe("InvitationEmail", () => {
  it("renders the organization, role, accept link and button", async () => {
    const html = await render(
      <InvitationEmail
        organizationName="Rumiq"
        roleLabel="Member"
        acceptUrl="https://example.com/invite/abc"
        validDays={7}
      />,
    );

    expect(html).toContain("Rumiq");
    expect(html).toContain("Member");
    expect(html).toContain('href="https://example.com/invite/abc"');
    expect(html).toContain("Accept invitation");
  });
});
