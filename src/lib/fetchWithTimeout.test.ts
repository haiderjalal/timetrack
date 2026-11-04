import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "./fetchWithTimeout";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives every request a deadline", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithTimeout("https://example.com/rest/v1/profiles");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeDefined();
    expect(init.signal?.aborted).toBe(false);
  });

  it("still cancels when the caller cancels", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await fetchWithTimeout("https://example.com", {
      signal: controller.signal,
    });
    controller.abort();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal?.aborted).toBe(true);
  });
});
