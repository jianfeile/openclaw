/**
 * Mood + reaction logic for the chat pet (Nuo Nuo). Kept free of DOM so it
 * can be unit tested; `<chat-pet>` turns these into timers and renders.
 */

/** What the chat is doing right now, as far as the pet cares. */
export type PetMood = "idle" | "listen" | "think" | "reply" | "error";

/** The expression the pet is drawn with (matches the SVG `data-state`). */
export type PetState = "idle" | "listen" | "think" | "happy" | "love" | "sleep" | "surprised";

export type PetMoodInput = {
  connected: boolean;
  sending: boolean;
  stream: string | null;
  draft: string;
  error: string | null;
};

/**
 * Builds the image URL for a custom skin. The template either contains
 * `{state}` (for example `pet/{state}.png`) or names a folder that holds
 * `<state>.png` files. An empty template means the built-in artwork.
 */
export function resolvePetSkinUrl(template: string, state: PetState): string | null {
  const trimmed = template.trim();
  if (!trimmed) return null;
  if (trimmed.includes("{state}")) return trimmed.split("{state}").join(state);
  return `${trimmed.replace(/\/+$/, "")}/${state}.png`;
}

export const PET_HAPPY_AFTER_REPLY_MS = 2400;
export const PET_LOVE_MS = 2000;
export const PET_WAKE_MS = 900;
export const PET_SLEEP_AFTER_MS = 90_000;

/**
 * Maps live chat state to a mood. Precedence: an error wins, then busy
 * states (waiting / streaming), then whether the user is typing.
 */
export function derivePetMood(input: PetMoodInput): PetMood {
  if (input.error) return "error";
  if (!input.connected) return "idle";
  if (input.stream !== null && input.stream.trim().length > 0) return "reply";
  if (input.sending || input.stream !== null) return "think";
  if (input.draft.trim().length > 0) return "listen";
  return "idle";
}

export function moodToState(mood: PetMood): PetState {
  switch (mood) {
    case "listen":
      return "listen";
    case "think":
      return "think";
    case "reply":
      return "happy";
    case "error":
      return "surprised";
    default:
      return "idle";
  }
}

export type PetTransition = {
  state: PetState;
  /** Transient expression: revert to the current mood after this many ms. */
  holdMs: number | null;
};

/**
 * What the pet shows when the mood changes. Waking up always startles it
 * first; a finished reply earns a short happy bounce before settling.
 */
export function reactToMoodChange(prev: PetMood, next: PetMood, asleep: boolean): PetTransition {
  if (asleep) return { state: "surprised", holdMs: PET_WAKE_MS };
  if (prev === "reply" && (next === "idle" || next === "listen")) {
    return { state: "happy", holdMs: PET_HAPPY_AFTER_REPLY_MS };
  }
  return { state: moodToState(next), holdMs: null };
}
