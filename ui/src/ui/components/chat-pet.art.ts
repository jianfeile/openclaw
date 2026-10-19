import { css, html, type TemplateResult } from "lit";
import type { PetState } from "../chat/pet-state";

/**
 * Nuo Nuo artwork: a mochi otter hugging its favourite pebble, drawn on a
 * 200x200 canvas. Every expression is in the markup; `data-state` on the
 * root picks which eyes/mouth/effects are visible and which animations run.
 * Generated from the character sheet (nuonuo.html); keep the two in sync.
 */
export function renderNuoNuo(state: PetState): TemplateResult {
  return html`<svg class="nn" data-state=${state} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><clipPath id="nn-body-clip"><path d="M100,60 C140,60 166,84 166,118 C166,154 138,173 100,173 C62,173 34,154 34,118 C34,84 60,60 100,60 Z"></path></clipPath></defs>
<ellipse class="nn-shadow" cx="100" cy="181" rx="46" ry="5"></ellipse>
<g class="nn-pet"><g class="nn-breath">
    <path class="nn-tail" d="M148,144 C172,138 194,150 190,168 C188,178 176,176 168,170 C160,164 154,160 148,160 Z"></path>
    <g class="nn-ear nn-ear-l"><circle class="nn-ear-out" cx="46" cy="80" r="10"></circle><circle class="nn-ear-in" cx="47" cy="80" r="5"></circle></g>
    <g class="nn-ear nn-ear-r"><circle class="nn-ear-out" cx="154" cy="80" r="10"></circle><circle class="nn-ear-in" cx="153" cy="80" r="5"></circle></g>
    <path class="nn-body" d="M100,60 C140,60 166,84 166,118 C166,154 138,173 100,173 C62,173 34,154 34,118 C34,84 60,60 100,60 Z"></path>
    <path class="nn-face-patch" clip-path="url(#nn-body-clip)" d="M56,114 C56,86 144,86 144,114 C144,152 128,170 100,170 C72,170 56,152 56,114 Z"></path>
    <g class="nn-face">
      <g class="nn-blush"><ellipse cx="62" cy="128" rx="9" ry="5"></ellipse><ellipse cx="138" cy="128" rx="9" ry="5"></ellipse></g>
      <path class="nn-whiskers" d="M70,120 l-12,-3 M70,126 l-12,2 M130,120 l12,-3 M130,126 l12,2"></path>
      <g class="nn-eyes-pos"><g class="nn-eyes nn-v" data-on="idle listen think"><circle class="nn-eye" cx="78" cy="108" r="9"></circle><circle class="nn-hl" cx="75" cy="105" r="3.4"></circle><circle class="nn-hl" cx="81.5" cy="111" r="1.6"></circle><circle class="nn-eye" cx="122" cy="108" r="9"></circle><circle class="nn-hl" cx="119" cy="105" r="3.4"></circle><circle class="nn-hl" cx="125.5" cy="111" r="1.6"></circle></g></g>
      <g class="nn-v" data-on="happy love"><path class="nn-line3" d="M69,111 C72,100 84,100 87,111"></path><path class="nn-line3" d="M113,111 C116,100 128,100 131,111"></path></g>
      <g class="nn-v" data-on="sleep"><path class="nn-line3" d="M70,107 C73,113 83,113 86,107"></path><path class="nn-line3" d="M114,107 C117,113 127,113 130,107"></path></g>
      <g class="nn-v" data-on="surprised"><circle class="nn-eye-ring" cx="78" cy="108" r="11"></circle><circle class="nn-eye" cx="78" cy="109" r="4.6"></circle><circle class="nn-hl" cx="76.4" cy="107.2" r="1.6"></circle><circle class="nn-eye-ring" cx="122" cy="108" r="11"></circle><circle class="nn-eye" cx="122" cy="109" r="4.6"></circle><circle class="nn-hl" cx="120.4" cy="107.2" r="1.6"></circle></g>
      <ellipse class="nn-nose" cx="100" cy="120" rx="5.2" ry="3.8"></ellipse><circle class="nn-nose-hl" cx="98" cy="118.6" r="1.3"></circle>
      <path class="nn-mouth nn-v" data-on="idle listen think sleep love" d="M94,126 C96,130 99,130 100,127 C101,130 104,130 106,126"></path>
      <g class="nn-v" data-on="happy"><path class="nn-mouth-open" d="M90,125 C93,137 107,137 110,125 Z"></path><ellipse class="nn-tongue" cx="100" cy="132.5" rx="3.6" ry="2"></ellipse></g>
      <ellipse class="nn-mouth-o nn-v" data-on="surprised" cx="100" cy="129" rx="3.2" ry="4"></ellipse>
    </g>
    <g class="nn-feet"><ellipse cx="76" cy="170" rx="12" ry="6.5"></ellipse><ellipse cx="124" cy="170" rx="12" ry="6.5"></ellipse><path class="nn-toes" d="M71,166 v5 M81,166 v5 M119,166 v5 M129,166 v5"></path></g>
    <g class="nn-hold">
      <g class="nn-pebble nn-v" data-on="idle listen think love sleep surprised"><ellipse cx="100" cy="150" rx="12" ry="9.5"></ellipse><ellipse class="nn-pebble-hl" cx="95" cy="146" rx="3.5" ry="2"></ellipse></g>
      <g class="nn-shell nn-v" data-on="happy"><path class="nn-shell-half" d="M88,152 C88,162 112,162 112,152 Z"></path><path class="nn-shell-ridge" d="M94,153 v6 M100,153 v7 M106,153 v6"></path><g transform="translate(88,152)"><path class="nn-shell-half nn-shell-lid" d="M0,0 C0,-10 24,-10 24,0 Z"></path></g><g class="nn-pearl"><circle cx="100" cy="147" r="4.2"></circle><circle class="nn-pearl-hl" cx="98.6" cy="145.6" r="1.2"></circle></g></g>
      <g class="nn-paws"><ellipse cx="86" cy="156" rx="9" ry="6.5"></ellipse><ellipse cx="114" cy="156" rx="9" ry="6.5"></ellipse><path class="nn-toes" d="M82,153 v5 M90,153 v5 M110,153 v5 M118,153 v5"></path></g>
    </g>
    <g class="nn-fx">
      <g class="nn-v nn-fx-listen" data-on="listen"><path d="M168,60 a10,10 0 0 1 0,22"></path><path d="M175,53 a17,17 0 0 1 0,36"></path></g>
      <g class="nn-v" data-on="think"><circle class="nn-cloud" cx="170" cy="28" r="12"></circle><circle class="nn-cloud" cx="158" cy="42" r="3.2"></circle><circle class="nn-dot" cx="164" cy="28" r="2"></circle><circle class="nn-dot" cx="170" cy="28" r="2"></circle><circle class="nn-dot" cx="176" cy="28" r="2"></circle></g>
      <g class="nn-v" data-on="sleep"><text class="nn-zzz" x="156" y="64" font-size="12">z</text><text class="nn-zzz" x="166" y="50" font-size="16">z</text><text class="nn-zzz" x="178" y="34" font-size="21">z</text></g>
      <g class="nn-v" data-on="surprised"><g transform="translate(170,46) rotate(12)"><g class="nn-bang"><rect x="-3" y="-16" width="6" height="18" rx="3"></rect><circle cy="8" r="3.4"></circle></g></g></g>
      <g class="nn-v" data-on="happy"><g transform="translate(34,62)"><path class="nn-spark" d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z"></path></g><g transform="translate(170,62)"><path class="nn-spark" style="animation-delay:.45s" d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z"></path></g><g transform="translate(28,126)"><path class="nn-spark" style="animation-delay:.9s" d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z"></path></g></g>
      <g class="nn-v" data-on="love"><g transform="translate(168,70)"><path class="nn-heart" d="M0,3 C-5,-3 -7,-7 -3.5,-8 C-1.5,-8.5 0,-6.5 0,-5.5 C0,-6.5 1.5,-8.5 3.5,-8 C7,-7 5,-3 0,3 Z"></path></g><g transform="translate(34,70)"><path class="nn-heart" style="animation-delay:.6s" d="M0,3 C-5,-3 -7,-7 -3.5,-8 C-1.5,-8.5 0,-6.5 0,-5.5 C0,-6.5 1.5,-8.5 3.5,-8 C7,-7 5,-3 0,3 Z"></path></g><g transform="translate(176,112)"><path class="nn-heart" style="animation-delay:1.2s" d="M0,3 C-5,-3 -7,-7 -3.5,-8 C-1.5,-8.5 0,-6.5 0,-5.5 C0,-6.5 1.5,-8.5 3.5,-8 C7,-7 5,-3 0,3 Z"></path></g></g>
    </g>
</g></g>
</svg>`;
}

/* Character styles are kept compact (one rule per line) to match the sheet. */
export const nuoNuoStyles = css`
  :host {
    display: block;
    width: var(--chat-pet-size, 72px);
    height: var(--chat-pet-size, 72px);
  }
  .pet {
    all: unset;
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    border-radius: 50%;
  }
  .pet:focus-visible {
    outline: 2px solid var(--accent, #ff5c5c);
    outline-offset: 2px;
  }
  .nn {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .nn * {
    transform-box: fill-box;
  }
  .nn .nn-shadow {
    fill: var(--chat-pet-shadow, rgba(0, 0, 0, 0.35));
  }
  .nn .nn-body,
  .nn .nn-ear-out,
  .nn .nn-feet ellipse,
  .nn .nn-paws ellipse,
  .nn .nn-tail {
    fill: #c08f5f;
    stroke: #4a3b32;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .nn .nn-face-patch {
    fill: #f7e8d0;
  }
  .nn .nn-ear-in {
    fill: #e9b9a3;
  }
  .nn .nn-blush ellipse {
    fill: #ffb4a8;
    opacity: 0.85;
  }
  .nn .nn-whiskers {
    fill: none;
    stroke: #4a3b32;
    stroke-width: 1.4;
    stroke-linecap: round;
    opacity: 0.65;
  }
  .nn .nn-eye {
    fill: #3a2e2a;
  }
  .nn .nn-hl {
    fill: #fff;
  }
  .nn .nn-eye-ring {
    fill: #fff;
    stroke: #3a2e2a;
    stroke-width: 2.5;
  }
  .nn .nn-line3 {
    fill: none;
    stroke: #3a2e2a;
    stroke-width: 3;
    stroke-linecap: round;
  }
  .nn .nn-nose {
    fill: #3a2e2a;
  }
  .nn .nn-nose-hl {
    fill: #fff;
    opacity: 0.8;
  }
  .nn .nn-mouth {
    fill: none;
    stroke: #6b4e44;
    stroke-width: 1.8;
    stroke-linecap: round;
  }
  .nn .nn-mouth-open {
    fill: #d9736a;
    stroke: #4a3b32;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .nn .nn-tongue {
    fill: #ffa3aa;
  }
  .nn .nn-mouth-o {
    fill: #6b4e44;
  }
  .nn .nn-toes {
    fill: none;
    stroke: #4a3b32;
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  .nn .nn-pebble ellipse {
    fill: #aeb7c2;
    stroke: #4a3b32;
    stroke-width: 2.2;
  }
  .nn .nn-pebble .nn-pebble-hl {
    fill: #e6ebf0;
    stroke: none;
  }
  .nn .nn-shell-half {
    fill: #f4cdb4;
    stroke: #b5775a;
    stroke-width: 1.8;
    stroke-linejoin: round;
  }
  .nn .nn-shell-ridge {
    fill: none;
    stroke: #d9a88c;
    stroke-width: 1.2;
  }
  .nn .nn-pearl circle {
    fill: #fff6e3;
    stroke: #b5775a;
    stroke-width: 1;
  }
  .nn .nn-pearl .nn-pearl-hl {
    fill: #fff;
    stroke: none;
  }
  .nn .nn-fx-listen path {
    fill: none;
    stroke: #ef8c86;
    stroke-width: 2.4;
    stroke-linecap: round;
    animation: nn-pulse 1.2s ease-in-out infinite;
  }
  .nn .nn-fx-listen path + path {
    animation-delay: 0.3s;
  }
  .nn .nn-cloud {
    fill: #fff;
    stroke: #4a3b32;
    stroke-width: 2;
  }
  .nn .nn-dot {
    fill: #4a3b32;
    animation: nn-dots 1.2s ease-in-out infinite;
  }
  .nn .nn-dot:nth-of-type(2) {
    animation-delay: 0.2s;
  }
  .nn .nn-dot:nth-of-type(3) {
    animation-delay: 0.4s;
  }
  .nn .nn-zzz {
    fill: #4a3b32;
    font-family: var(--font-body, sans-serif);
    font-weight: 700;
    animation: nn-zzz 2.7s ease-out infinite;
  }
  .nn .nn-zzz:nth-of-type(2) {
    animation-delay: 0.9s;
  }
  .nn .nn-zzz:nth-of-type(3) {
    animation-delay: 1.8s;
  }
  .nn .nn-bang * {
    fill: #ef8c86;
    stroke: #4a3b32;
    stroke-width: 2;
  }
  .nn .nn-spark {
    fill: #ffd36e;
    animation: nn-twinkle 1.4s ease-in-out infinite;
  }
  .nn .nn-heart {
    fill: #ef8c86;
    animation: nn-heart 1.9s ease-out infinite;
  }
  .nn .nn-v {
    display: none;
  }
  .nn[data-state="idle"] [data-on~="idle"],
  .nn[data-state="listen"] [data-on~="listen"],
  .nn[data-state="think"] [data-on~="think"],
  .nn[data-state="happy"] [data-on~="happy"],
  .nn[data-state="love"] [data-on~="love"],
  .nn[data-state="sleep"] [data-on~="sleep"],
  .nn[data-state="surprised"] [data-on~="surprised"] {
    display: inline;
  }
  .nn .nn-pet {
    transform-origin: 50% 100%;
  }
  .nn .nn-breath {
    transform-origin: 50% 100%;
    animation: nn-breathe 3.4s ease-in-out infinite;
  }
  .nn .nn-eyes {
    transform-origin: 50% 50%;
    animation: nn-blink 4.6s ease-in-out infinite;
  }
  .nn .nn-eyes-pos {
    transform-origin: 50% 50%;
    transition: transform 0.35s ease;
  }
  .nn .nn-tail {
    transform-origin: 0% 50%;
    animation: nn-tail 2.6s ease-in-out infinite alternate;
  }
  .nn .nn-ear {
    transform-origin: 50% 50%;
    transition: transform 0.4s ease;
  }
  .nn .nn-paws {
    transform-origin: 50% 50%;
    transition: transform 0.4s ease;
  }
  .nn .nn-blush {
    transform-origin: 50% 50%;
    transition: transform 0.4s ease;
  }
  .nn[data-state="listen"] .nn-pet {
    animation: nn-tilt 1.8s ease-in-out infinite alternate;
  }
  .nn[data-state="listen"] .nn-ear {
    animation: nn-ear-wiggle 0.6s ease-in-out infinite alternate;
  }
  .nn[data-state="listen"] .nn-eyes-pos {
    transform: scale(1.08);
  }
  .nn[data-state="think"] .nn-eyes-pos {
    transform: translate(3px, -4px);
  }
  .nn[data-state="happy"] .nn-pet {
    animation: nn-bounce 0.75s cubic-bezier(0.4, 0.8, 0.5, 1.1) infinite;
  }
  .nn[data-state="happy"] .nn-tail {
    animation-duration: 0.5s;
  }
  .nn[data-state="happy"] .nn-shell-lid {
    transform-origin: 0% 100%;
    animation: nn-open 0.55s cubic-bezier(0.3, 1.4, 0.5, 1) both;
  }
  .nn[data-state="happy"] .nn-pearl {
    transform-origin: 50% 50%;
    animation: nn-pop 0.5s 0.15s cubic-bezier(0.3, 1.5, 0.5, 1) both;
  }
  .nn[data-state="love"] .nn-pet {
    animation: nn-wiggle 1.1s ease-in-out infinite;
  }
  .nn[data-state="love"] .nn-blush {
    transform: scale(1.3);
  }
  .nn[data-state="love"] .nn-paws {
    transform: scale(0.92);
  }
  .nn[data-state="sleep"] .nn-breath {
    animation-duration: 5.2s;
  }
  .nn[data-state="sleep"] .nn-paws {
    transform: translateY(-2px) scale(0.94);
  }
  .nn[data-state="sleep"] .nn-tail {
    animation-duration: 5s;
  }
  .nn[data-state="surprised"] .nn-pet {
    animation: nn-shake 0.35s ease-in-out 3;
  }
  .nn[data-state="surprised"] .nn-ear {
    transform: scale(1.18);
  }
  .nn[data-state="surprised"] .nn-pebble {
    animation: nn-hop 0.5s ease-out both;
  }
  .nn[data-state="surprised"] .nn-bang {
    transform-origin: 50% 100%;
    animation: nn-pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  }
  @keyframes nn-breathe {
    0%,
    100% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(1.025, 0.975);
    }
  }
  @keyframes nn-blink {
    0%,
    90%,
    100% {
      transform: scaleY(1);
    }
    94% {
      transform: scaleY(0.08);
    }
  }
  @keyframes nn-tail {
    from {
      transform: rotate(-7deg);
    }
    to {
      transform: rotate(7deg);
    }
  }
  @keyframes nn-ear-wiggle {
    from {
      transform: rotate(-9deg);
    }
    to {
      transform: rotate(9deg);
    }
  }
  @keyframes nn-hop {
    0% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-9px);
    }
    70% {
      transform: translateY(2px);
    }
    100% {
      transform: translateY(0);
    }
  }
  @keyframes nn-open {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(-55deg);
    }
  }
  @keyframes nn-tilt {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(4deg);
    }
  }
  @keyframes nn-bounce {
    0%,
    100% {
      transform: translateY(0) scale(1.03, 0.97);
    }
    45% {
      transform: translateY(-12px) scale(0.98, 1.04);
    }
  }
  @keyframes nn-wiggle {
    0%,
    100% {
      transform: rotate(-3deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }
  @keyframes nn-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-4px);
    }
    75% {
      transform: translateX(4px);
    }
  }
  @keyframes nn-pop {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
  @keyframes nn-dots {
    0%,
    100% {
      opacity: 0.25;
    }
    30% {
      opacity: 1;
    }
  }
  @keyframes nn-zzz {
    0% {
      opacity: 0;
      transform: translate(0, 6px);
    }
    30% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(6px, -14px);
    }
  }
  @keyframes nn-twinkle {
    0%,
    100% {
      opacity: 0;
      transform: scale(0.4) rotate(0);
    }
    50% {
      opacity: 1;
      transform: scale(1) rotate(20deg);
    }
  }
  @keyframes nn-heart {
    0% {
      opacity: 0;
      transform: translate(0, 4px) scale(0.6);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(0, -30px) scale(1.1);
    }
  }
  @keyframes nn-pulse {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .nn * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
