import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOrganization } from "../actions/createOrganization";
import { describeCreateOrganizationFailure } from "../utils/createOrganizationErrors";
import { OnboardingForm } from "./OnboardingForm";

vi.mock("../actions/createOrganization", () => ({
  createOrganization: vi.fn(),
}));

const createOrganizationMock = vi.mocked(createOrganization);

function renderForm() {
  render(
    <OnboardingForm
      timezones={["Asia/Karachi", "Europe/London", "UTC"]}
      siteHost="timetrack.example"
    />,
  );
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create organization" }));
}

function type(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("OnboardingForm", () => {
  beforeEach(() => {
    createOrganizationMock.mockReset();
  });

  it("explains what is missing instead of submitting", async () => {
    renderForm();
    submit();

    expect(
      await screen.findByText("Enter a name with at least 2 characters."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Organization name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Web address")).toHaveAccessibleDescription(
      expect.stringContaining("Use 3–40 lowercase letters"),
    );
    expect(createOrganizationMock).not.toHaveBeenCalled();
  });

  it("suggests the web address from the name until it is edited", () => {
    renderForm();

    type("Organization name", "Acme Café & Co");
    expect(screen.getByLabelText("Web address")).toHaveValue("acme-cafe-co");

    type("Web address", "acme");
    type("Organization name", "Something else");
    expect(screen.getByLabelText("Web address")).toHaveValue("acme");
  });

  it("starts with Mon–Fri 09:00–18:00 and lets a day be switched off", () => {
    renderForm();

    const monday = screen.getByRole("checkbox", {
      name: "Monday is a working day",
    });
    expect(monday).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Saturday is a working day" }),
    ).not.toBeChecked();
    expect(screen.getAllByLabelText("Start")).toHaveLength(5);

    fireEvent.click(monday);
    expect(screen.getAllByLabelText("Start")).toHaveLength(4);
  });

  it("checks the hours on working days", async () => {
    renderForm();
    type("Organization name", "Acme");
    const [mondayHours] = screen.getAllByLabelText("Hours required");
    if (!mondayHours) throw new Error("expected Monday's hours field");
    fireEvent.change(mondayHours, { target: { value: "" } });
    submit();

    expect(await screen.findByText("Enter 0 to 24 hours.")).toBeInTheDocument();
    expect(createOrganizationMock).not.toHaveBeenCalled();
  });

  it("sends the cleaned-up values to the server", async () => {
    createOrganizationMock.mockResolvedValue({
      success: false,
      message: "unused",
    });
    renderForm();

    type("Organization name", "  Acme Inc  ");
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "Europe/London" },
    });
    submit();

    await waitFor(() => expect(createOrganizationMock).toHaveBeenCalledOnce());
    const [values] = createOrganizationMock.mock.calls[0] ?? [];
    expect(values).toMatchObject({
      name: "Acme Inc",
      slug: "acme-inc",
      timezone: "Europe/London",
      schedule: { graceMinutes: "15" },
    });
    expect(values?.schedule.days).toHaveLength(7);
  });

  it("shows the server's answer on the right field", async () => {
    createOrganizationMock.mockResolvedValue(
      describeCreateOrganizationFailure("slug_taken"),
    );
    renderForm();

    type("Organization name", "Acme");
    submit();

    expect(
      await screen.findByText("That URL is already taken. Try another one."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Web address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows a general error when no field is to blame", async () => {
    createOrganizationMock.mockResolvedValue(
      describeCreateOrganizationFailure("unknown"),
    );
    renderForm();

    type("Organization name", "Acme");
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't create your organization. Please try again.",
    );
  });
});
