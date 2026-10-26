import { describe, expect, it } from "vitest";

import {
  PET_HAPPY_AFTER_REPLY_MS,
  PET_WAKE_MS,
  derivePetMood,
  moodToState,
  reactToMoodChange,
  resolvePetSkinUrl,
} from "./pet-state";

const base = {
  connected: true,
  sending: false,
  stream: null,
  draft: "",
  error: null,
};

describe("derivePetMood", () => {
  it("idles when nothing is happening", () => {
    expect(derivePetMood(base)).toBe("idle");
  });

  it("listens while the user has a draft", () => {
    expect(derivePetMood({ ...base, draft: "hello" })).toBe("listen");
    expect(derivePetMood({ ...base, draft: "   " })).toBe("idle");
  });

  it("thinks while a message is sending or the reply has not started", () => {
    expect(derivePetMood({ ...base, sending: true, draft: "queued" })).toBe("think");
    expect(derivePetMood({ ...base, stream: "" })).toBe("think");
  });

  it("replies while assistant text is streaming", () => {
    expect(derivePetMood({ ...base, stream: "Sure, here is" })).toBe("reply");
  });

  it("lets an error win over everything else", () => {
    expect(derivePetMood({ ...base, stream: "partial", error: "boom" })).toBe("error");
  });

  it("idles when disconnected even with a draft", () => {
    expect(derivePetMood({ ...base, connected: false, draft: "typing" })).toBe("idle");
  });
});

describe("reactToMoodChange", () => {
  it("maps moods straight to expressions", () => {
    expect(moodToState("idle")).toBe("idle");
    expect(moodToState("listen")).toBe("listen");
    expect(moodToState("think")).toBe("think");
    expect(moodToState("reply")).toBe("happy");
    expect(moodToState("error")).toBe("surprised");
    expect(reactToMoodChange("idle", "think", false)).toEqual({ state: "think", holdMs: null });
  });

  it("bounces happily for a moment once a reply lands", () => {
    expect(reactToMoodChange("reply", "idle", false)).toEqual({
      state: "happy",
      holdMs: PET_HAPPY_AFTER_REPLY_MS,
    });
    expect(reactToMoodChange("reply", "listen", false)).toEqual({
      state: "happy",
      holdMs: PET_HAPPY_AFTER_REPLY_MS,
    });
  });

  it("does not celebrate when a reply is aborted into an error", () => {
    expect(reactToMoodChange("reply", "error", false)).toEqual({
      state: "surprised",
      holdMs: null,
    });
  });

  it("startles awake before showing the new mood", () => {
    expect(reactToMoodChange("idle", "listen", true)).toEqual({
      state: "surprised",
      holdMs: PET_WAKE_MS,
    });
  });
});

describe("resolvePetSkinUrl", () => {
  it("returns null for the built-in artwork", () => {
    expect(resolvePetSkinUrl("", "idle")).toBeNull();
    expect(resolvePetSkinUrl("   ", "happy")).toBeNull();
  });

  it("fills a {state} template", () => {
    expect(resolvePetSkinUrl("pet/{state}.png", "think")).toBe("pet/think.png");
    expect(resolvePetSkinUrl("https://example.com/lulu/{state}.gif", "sleep")).toBe(
      "https://example.com/lulu/sleep.gif",
    );
  });

  it("treats a plain template as a folder of <state>.png files", () => {
    expect(resolvePetSkinUrl("pet", "idle")).toBe("pet/idle.png");
    expect(resolvePetSkinUrl("/skins/lulu/", "love")).toBe("/skins/lulu/love.png");
  });
});
