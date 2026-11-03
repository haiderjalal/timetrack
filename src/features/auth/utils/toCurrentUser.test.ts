import { describe, expect, it } from "vitest";

import { toCurrentUser } from "./toCurrentUser";

const GOOGLE_AVATAR = "https://lh3.googleusercontent.com/a/abc123=s96-c";

describe("toCurrentUser", () => {
  it("reads the Google profile from the JWT claims", () => {
    expect(
      toCurrentUser({
        sub: "user-1",
        email: "ayesha@example.com",
        user_metadata: { full_name: "Ayesha Khan", avatar_url: GOOGLE_AVATAR },
      }),
    ).toEqual({
      id: "user-1",
      email: "ayesha@example.com",
      name: "Ayesha Khan",
      avatarUrl: GOOGLE_AVATAR,
    });
  });

  it("falls back to other name fields, then the email", () => {
    expect(
      toCurrentUser({
        sub: "u",
        email: "a@example.com",
        user_metadata: { name: "Ayesha" },
      }).name,
    ).toBe("Ayesha");
    expect(
      toCurrentUser({
        sub: "u",
        email: "a@example.com",
        user_metadata: { full_name: "  " },
      }).name,
    ).toBe("a@example.com");
  });

  it("accepts only https Google avatar URLs", () => {
    const withAvatar = (avatar_url: unknown) =>
      toCurrentUser({ sub: "u", user_metadata: { avatar_url } }).avatarUrl;

    expect(withAvatar("http://lh3.googleusercontent.com/a/x")).toBeNull();
    expect(withAvatar("https://evil.example/a.png")).toBeNull();
    expect(withAvatar("javascript:alert(1)")).toBeNull();
    expect(withAvatar(123)).toBeNull();
  });

  it("copes with missing metadata", () => {
    expect(toCurrentUser({ sub: "u" })).toEqual({
      id: "u",
      email: "",
      name: "",
      avatarUrl: null,
    });
  });
});
