import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  PET_LOVE_MS,
  PET_SLEEP_AFTER_MS,
  moodToState,
  reactToMoodChange,
  type PetMood,
  type PetState,
  type PetTransition,
} from "../chat/pet-state";
import { nuoNuoStyles, renderNuoNuo } from "./chat-pet.art";

/**
 * Nuo Nuo, the chat companion. The host passes a `mood` derived from chat
 * state; the element adds the transient reactions on top (a happy bounce
 * once a reply lands, a blush when clicked, dozing off after a long idle).
 */
@customElement("chat-pet")
export class ChatPet extends LitElement {
  @property({ type: String }) mood: PetMood = "idle";
  @state() private shown: PetState = "idle";

  private asleep = false;
  private holdTimer: number | null = null;
  private sleepTimer: number | null = null;

  static styles = nuoNuoStyles;

  /** The expression currently drawn (exposed for tests and tooling). */
  get currentState(): PetState {
    return this.shown;
  }

  willUpdate(changed: PropertyValues<this>) {
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
    return html`
      <button
        type="button"
        class="pet"
        title="Nuo Nuo"
        aria-label=${`Nuo Nuo, the chat pet (${this.shown})`}
        @click=${this.handleClick}
      >
        ${renderNuoNuo(this.shown)}
      </button>
    `;
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
