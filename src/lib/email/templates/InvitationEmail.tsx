import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

// Email clients can't read CSS variables, so these copy the brand tokens in
// src/app/globals.css: --canvas, --background, --border, --foreground,
// --muted-foreground, --brand-mark and --brand-mark-foreground.
const COLORS = {
  canvas: "#FAFAFA",
  background: "#FFFFFF",
  border: "#E4E4E7",
  foreground: "#18181B",
  mutedForeground: "#6B6B74",
  brandMark: "#4F46E5",
  brandMarkForeground: "#FFFFFF",
} as const;

export interface InvitationEmailProps {
  organizationName: string;
  /** "Admin" or "Member". */
  roleLabel: string;
  acceptUrl: string;
  validDays: number;
}

/** The email an admin's invitation sends. The link carries the only copy of the token. */
export function InvitationEmail({
  organizationName,
  roleLabel,
  acceptUrl,
  validDays,
}: InvitationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Join ${organizationName} on TimeTrack`}</Preview>
      <Body
        style={{
          backgroundColor: COLORS.canvas,
          fontFamily: "Inter, Arial, sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: COLORS.background,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            margin: "0 auto",
            maxWidth: 480,
            padding: 32,
          }}
        >
          <Heading
            as="h1"
            style={{
              color: COLORS.foreground,
              fontSize: 22,
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            Join {organizationName}
          </Heading>
          <Text
            style={{
              color: COLORS.foreground,
              fontSize: 15,
              lineHeight: "24px",
            }}
          >
            You&apos;ve been invited to {organizationName} on TimeTrack with the{" "}
            {roleLabel} role. Sign in with this Google account to accept.
          </Text>
          <Button
            href={acceptUrl}
            style={{
              backgroundColor: COLORS.brandMark,
              borderRadius: 8,
              color: COLORS.brandMarkForeground,
              display: "inline-block",
              fontSize: 15,
              fontWeight: 500,
              padding: "12px 20px",
              textDecoration: "none",
            }}
          >
            Accept invitation
          </Button>
          <Text
            style={{
              color: COLORS.mutedForeground,
              fontSize: 13,
              lineHeight: "20px",
            }}
          >
            This link works once and expires in {validDays} days. If the button
            doesn&apos;t work, open this address: {acceptUrl}
          </Text>
          <Text
            style={{
              color: COLORS.mutedForeground,
              fontSize: 13,
              lineHeight: "20px",
            }}
          >
            Weren&apos;t expecting this? You can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
