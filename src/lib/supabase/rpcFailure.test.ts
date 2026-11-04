import { describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

import { matchRpcFailure, toRpcFailure } from "./rpcFailure";

const KNOWN = ["not_allowed", "last_owner"] as const;

describe("matchRpcFailure", () => {
  it("returns the known failure, and unknown for anything else", () => {
    expect(matchRpcFailure("last_owner", KNOWN)).toBe("last_owner");
    expect(matchRpcFailure("boom", KNOWN)).toBe("unknown");
    expect(matchRpcFailure(undefined, KNOWN)).toBe("unknown");
  });
});

describe("toRpcFailure", () => {
  it("logs only the operation and code for an unrecognized error", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);

    expect(
      toRpcFailure(
        "members.change_role",
        { message: "secret detail", code: "XX000" },
        KNOWN,
      ),
    ).toBe("unknown");
    expect(error).toHaveBeenCalledWith("db.query_failed", {
      operation: "members.change_role",
      code: "XX000",
    });
  });

  it("does not log a known failure", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);

    expect(
      toRpcFailure("members.change_role", { message: "not_allowed" }, KNOWN),
    ).toBe("not_allowed");
    expect(error).not.toHaveBeenCalled();
  });
});
