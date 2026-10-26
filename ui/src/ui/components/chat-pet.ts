import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  PET_LOVE_MS,
  PET_SLEEP_AFTER_MS,
  moodToState,
  reactToMoodChange,
  resolvePetSkinUrl,
  type PetMood,
  type PetState,
  type PetTransition,
} from "../chat/pet-state";
import { nuoNuoStyles, renderNuoNuo } from "./chat-pet.art";

/**
 * Nuo Nuo, the chat companion. The host passes a `mood` derived from chat
 * state; the element adds the transient reactions on top (a happy bounce
 * once a reply lands, a blush when clicked, dozing off after a long idle).
 * With a `skin` template the built-in artwork is replaced by the user's own
 * images, one per state; missing images fall back to the idle image, then to
 * the artwork.
 */
@customElement("chat-pet")
export class ChatPet extends LitElement {
  @property({ type: String }) mood: PetMood = "idle";
  @property({ type: String }) skin = "";
  @state() private shown: PetState = "idle";

  private asleep = false;
  private holdTimer: number | null = null;
  private sleepTimer: number | null = null;
  private failedSkins = new Set<string>();

  static styles = [
    nuoNuoStyles,
    css`
      .skin {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        transform-origin: 50% 100%;
        animation: nn-breathe 3.4s ease-in-out infinite;
      }
      .skin[data-state="listen"] {
        animation: nn-tilt 1.8s ease-in-out infinite alternate;
      }
      .skin[data-state="think"] {
        animation-duration: 2s;
      }
      .skin[data-state="happy"] {
        animation: nn-bounce 0.75s cubic-bezier(0.4, 0.8, 0.5, 1.1) infinite;
      }
      .skin[data-state="love"] {
        animation: nn-wiggle 1.1s ease-in-out infinite;
      }
      .skin[data-state="sleep"] {
        animation-duration: 5.2s;
      }
      .skin[data-state="surprised"] {
        animation: nn-shake 0.35s ease-in-out 3;
      }
      @media (prefers-reduced-motion: reduce) {
        .skin {
          animation: none !important;
        }
      }
    `,
  ];

  /** The expression currently drawn (exposed for tests and tooling). */
  get currentState(): PetState {
    return this.shown;
  }

  willUpdate(changed: PropertyValues<this>) {
    if (changed.has("skin")) this.failedSkins.clear();
    if (!changed.has("mood")) return;
    const prev = changed.get("mood") as PetMood | undefined;
    if (prev === undefined) {
      // First render: no reaction, just show the mood.
      this.showMood();
      return;
    }
    this.react(reactToMoodChange(prev, this.mood, this.asleep));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimers();
  }

  render() {
    const skinUrl = this.resolveSkinUrl();
    return html`
      <button
        type="button"
        class="pet"
        title="Nuo Nuo"
        aria-label=${`Nuo Nuo, the chat pet (${this.shown})`}
        @click=${this.handleClick}
      >
        ${
          skinUrl
            ? html`<img
              class="skin"
              data-state=${this.shown}
              src=${skinUrl}
              alt=""
              draggable="false"
              @error=${() => this.handleSkinError(skinUrl)}
            />`
            : renderNuoNuo(this.shown)
        }
      </button>
    `;
  }

  /** Current state's image, else the idle image, else null (built-in artwork). */
  private resolveSkinUrl(): string | null {
    if (!this.skin.trim()) return null;
    const candidates: PetState[] = this.shown === "idle" ? ["idle"] : [this.shown, "idle"];
    for (const state of candidates) {
      const url = resolvePetSkinUrl(this.skin, state);
      if (url && !this.failedSkins.has(url)) return url;
    }
    return null;
  }

  private handleSkinError(url: string) {
    if (this.failedSkins.has(url)) return;
    this.failedSkins.add(url);
    this.requestUpdate();
  }

  private handleClick = () => {
    if (this.asleep) {
      this.react(reactToMoodChange(this.mood, this.mood, true));
      return;
    }
    this.react({ state: "love", holdMs: PET_LOVE_MS });
  };

  private react(transition: PetTransition) {
    this.asleep = false;
    this.clearTimers();
    this.shown = transition.state;
    if (transition.holdMs === null) {
      this.armSleep();
      return;
    }
    this.holdTimer = window.setTimeout(() => {
      this.holdTimer = null;
      this.showMood();
    }, transition.holdMs);
  }

  private showMood() {
    this.shown = moodToState(this.mood);
    this.armSleep();
  }

  /** Only an idle pet dozes off; any mood change wakes it. */
  private armSleep() {
    if (this.sleepTimer !== null) window.clearTimeout(this.sleepTimer);
    this.sleepTimer = null;
    if (this.mood !== "idle") return;
    this.sleepTimer = window.setTimeout(() => {
      this.sleepTimer = null;
      this.asleep = true;
      this.shown = "sleep";
    }, PET_SLEEP_AFTER_MS);
  }

  private clearTimers() {
    if (this.holdTimer !== null) window.clearTimeout(this.holdTimer);
    if (this.sleepTimer !== null) window.clearTimeout(this.sleepTimer);
    this.holdTimer = null;
    this.sleepTimer = null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chat-pet": ChatPet;
  }
}
