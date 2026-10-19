import { css, html, svg, type TemplateResult } from "lit";
import type { PetState } from "../chat/pet-state";

/**
 * Nuo Nuo artwork: a mochi cat with a sprout on its head, drawn on a
 * 200x200 canvas. Every expression is in the markup; `data-state` on the
 * root picks which eyes/mouth/effects are visible and which animations run.
 */

const BODY =
  "M100,60 C140,60 166,84 166,118 C166,154 138,173 100,173 C62,173 34,154 34,118 C34,84 60,60 100,60 Z";
const STAR = "M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z";
const HEART =
  "M0,3 C-5,-3 -7,-7 -3.5,-8 C-1.5,-8.5 0,-6.5 0,-5.5 C0,-6.5 1.5,-8.5 3.5,-8 C7,-7 5,-3 0,3 Z";
const PETAL_ANGLES = [0, 72, 144, 216, 288];

export function renderNuoNuo(state: PetState): TemplateResult {
  const petals = PETAL_ANGLES.map(
    (angle) =>
      svg`<ellipse rx="3" ry="4.6" transform="rotate(${angle}) translate(0,-4.8)"></ellipse>`,
  );
  return html`<svg class="nn" data-state=${state} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><clipPath id="nn-body-clip"><path d=${BODY}></path></clipPath></defs>
    <ellipse class="nn-shadow" cx="100" cy="181" rx="46" ry="5"></ellipse>
    <g class="nn-pet"><g class="nn-breath">
      <g class="nn-tail"><path class="nn-tail-o" d="M156,146 C178,134 192,156 172,166"></path><path class="nn-tail-i" d="M156,146 C178,134 192,156 172,166"></path></g>
      <g class="nn-ear nn-ear-l"><path class="nn-ear-out" d="M60,82 C50,62 44,44 50,38 C57,33 74,48 92,64 Z"></path><path class="nn-ear-in" d="M62,76 C56,64 52,50 56,46 C61,43 72,54 82,63 Z"></path></g>
      <g class="nn-ear nn-ear-r"><path class="nn-ear-out" d="M140,82 C150,62 156,44 150,38 C143,33 126,48 108,64 Z"></path><path class="nn-ear-in" d="M138,76 C144,64 148,50 144,46 C139,43 128,54 118,63 Z"></path></g>
      <path class="nn-body" d=${BODY}></path>
      <ellipse class="nn-belly" clip-path="url(#nn-body-clip)" cx="100" cy="164" rx="58" ry="20"></ellipse>
      <g class="nn-face">
        <g class="nn-blush"><ellipse cx="63" cy="126" rx="9" ry="5"></ellipse><ellipse cx="137" cy="126" rx="9" ry="5"></ellipse></g>
        <g class="nn-eyes-pos"><g class="nn-eyes nn-v" data-on="idle listen think">
          <circle class="nn-eye" cx="78" cy="108" r="9"></circle><circle class="nn-hl" cx="75" cy="105" r="3.4"></circle><circle class="nn-hl" cx="81.5" cy="111" r="1.6"></circle>
          <circle class="nn-eye" cx="122" cy="108" r="9"></circle><circle class="nn-hl" cx="119" cy="105" r="3.4"></circle><circle class="nn-hl" cx="125.5" cy="111" r="1.6"></circle>
        </g></g>
        <g class="nn-v" data-on="happy love"><path class="nn-line3" d="M69,111 C72,100 84,100 87,111"></path><path class="nn-line3" d="M113,111 C116,100 128,100 131,111"></path></g>
        <g class="nn-v" data-on="sleep"><path class="nn-line3" d="M70,107 C73,113 83,113 86,107"></path><path class="nn-line3" d="M114,107 C117,113 127,113 130,107"></path></g>
        <g class="nn-v" data-on="surprised">
          <circle class="nn-eye-ring" cx="78" cy="108" r="11"></circle><circle class="nn-eye" cx="78" cy="109" r="4.6"></circle><circle class="nn-hl" cx="76.4" cy="107.2" r="1.6"></circle>
          <circle class="nn-eye-ring" cx="122" cy="108" r="11"></circle><circle class="nn-eye" cx="122" cy="109" r="4.6"></circle><circle class="nn-hl" cx="120.4" cy="107.2" r="1.6"></circle>
        </g>
        <ellipse class="nn-nose" cx="100" cy="118" rx="2.4" ry="1.8"></ellipse>
        <path class="nn-mouth nn-v" data-on="idle listen think sleep love" d="M93,121 C95,126 98,126 100,122 C102,126 105,126 107,121"></path>
        <g class="nn-v" data-on="happy"><path class="nn-mouth-open" d="M89,120 C92,134 108,134 111,120 Z"></path><ellipse class="nn-tongue" cx="100" cy="128.6" rx="4" ry="2.3"></ellipse></g>
        <ellipse class="nn-mouth-o nn-v" data-on="surprised" cx="100" cy="125" rx="3.4" ry="4.4"></ellipse>
      </g>
      <g class="nn-paws"><ellipse cx="78" cy="170" rx="13" ry="7"></ellipse><ellipse cx="122" cy="170" rx="13" ry="7"></ellipse><path class="nn-toes" d="M73,166 v5 M83,166 v5 M117,166 v5 M127,166 v5"></path></g>
      <g class="nn-sprout">
        <path class="nn-stem" d="M100,61 C100,54 101,48 104,42"></path>
        <path class="nn-leaf" d="M104,42 C94,42 86,34 90,26 C98,24 104,33 104,42 Z"></path>
        <path class="nn-leaf" d="M104,42 C104,32 110,22 118,25 C121,33 113,42 104,42 Z"></path>
        <path class="nn-vein" d="M103,41 C99,37 95,33 92,28 M105,41 C108,36 112,30 116,27"></path>
        <g transform="translate(104,38)"><g class="nn-flower nn-v" data-on="happy">${petals}<circle r="2.6"></circle></g></g>
      </g>
      <g class="nn-fx">
        <g class="nn-v nn-fx-listen" data-on="listen"><path d="M162,54 a10,10 0 0 1 0,22"></path><path d="M169,47 a17,17 0 0 1 0,36"></path></g>
        <g class="nn-v" data-on="think"><circle class="nn-cloud" cx="170" cy="28" r="12"></circle><circle class="nn-cloud" cx="158" cy="42" r="3.2"></circle><circle class="nn-dot" cx="164" cy="28" r="2"></circle><circle class="nn-dot" cx="170" cy="28" r="2"></circle><circle class="nn-dot" cx="176" cy="28" r="2"></circle></g>
        <g class="nn-v" data-on="sleep"><text class="nn-zzz" x="156" y="72" font-size="12">z</text><text class="nn-zzz" x="166" y="58" font-size="16">z</text><text class="nn-zzz" x="178" y="40" font-size="21">z</text></g>
        <g class="nn-v" data-on="surprised"><g transform="translate(170,46) rotate(12)"><g class="nn-bang"><rect x="-3" y="-16" width="6" height="18" rx="3"></rect><circle cy="8" r="3.4"></circle></g></g></g>
        <g class="nn-v" data-on="happy"><g transform="translate(36,62)"><path class="nn-spark" d=${STAR}></path></g><g transform="translate(170,60)"><path class="nn-spark nn-delay-2" d=${STAR}></path></g><g transform="translate(30,126)"><path class="nn-spark nn-delay-3" d=${STAR}></path></g></g>
        <g class="nn-v" data-on="love"><g transform="translate(165,78)"><path class="nn-heart" d=${HEART}></path></g><g transform="translate(38,72)"><path class="nn-heart nn-delay-2" d=${HEART}></path></g><g transform="translate(174,112)"><path class="nn-heart nn-delay-3" d=${HEART}></path></g></g>
      </g>
    </g></g>
  </svg>`;
}

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
  .nn .nn-paws ellipse,
  .nn .nn-ear-out {
    fill: #fff6e9;
    stroke: #4a3b32;
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .nn .nn-belly {
    fill: #f2dfc3;
    opacity: 0.55;
  }
  .nn .nn-ear-in {
    fill: #ffc9c2;
  }
  .nn .nn-tail-o {
    fill: none;
    stroke: #4a3b32;
    stroke-width: 13;
    stroke-linecap: round;
  }
  .nn .nn-tail-i {
    fill: none;
    stroke: #fff6e9;
    stroke-width: 8;
    stroke-linecap: round;
  }
  .nn .nn-blush ellipse {
    fill: #ffb4a8;
    opacity: 0.85;
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
    fill: #e8907f;
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
  .nn .nn-stem {
    fill: none;
    stroke: #5fb573;
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .nn .nn-leaf {
    fill: #8cd39b;
    stroke: #5fb573;
    stroke-width: 1.8;
    stroke-linejoin: round;
  }
  .nn .nn-vein {
    fill: none;
    stroke: #5fb573;
    stroke-width: 1.2;
    opacity: 0.8;
  }
  .nn .nn-flower ellipse {
    fill: #ffb7c9;
    stroke: #e98aa6;
    stroke-width: 1;
  }
  .nn .nn-flower circle {
    fill: #ffe08a;
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
  .nn .nn-delay-2 {
    animation-delay: 0.5s;
  }
  .nn .nn-delay-3 {
    animation-delay: 1s;
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
  .nn .nn-sprout {
    transform-origin: 50% 100%;
    animation: nn-sway 3.2s ease-in-out infinite alternate;
    transition: transform 0.5s ease;
  }
  .nn .nn-ear {
    transform-origin: 50% 100%;
    transition: transform 0.4s ease;
  }
  .nn .nn-blush {
    transform-origin: 50% 50%;
    transition: transform 0.4s ease;
  }
  .nn[data-state="listen"] .nn-pet {
    animation: nn-tilt 1.8s ease-in-out infinite alternate;
  }
  .nn[data-state="listen"] .nn-ear-l {
    transform: rotate(10deg);
  }
  .nn[data-state="listen"] .nn-ear-r {
    transform: rotate(-10deg);
  }
  .nn[data-state="listen"] .nn-eyes-pos {
    transform: scale(1.08);
  }
  .nn[data-state="think"] .nn-eyes-pos {
    transform: translate(3px, -4px);
  }
  .nn[data-state="think"] .nn-sprout {
    animation-duration: 1.1s;
  }
  .nn[data-state="happy"] .nn-pet {
    animation: nn-bounce 0.75s cubic-bezier(0.4, 0.8, 0.5, 1.1) infinite;
  }
  .nn[data-state="happy"] .nn-tail {
    animation-duration: 0.5s;
  }
  .nn[data-state="happy"] .nn-flower {
    transform-origin: 50% 50%;
    animation: nn-pop 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) both;
  }
  .nn[data-state="love"] .nn-pet {
    animation: nn-wiggle 1.1s ease-in-out infinite;
  }
  .nn[data-state="love"] .nn-blush {
    transform: scale(1.3);
  }
  .nn[data-state="sleep"] .nn-breath {
    animation-duration: 5.2s;
  }
  .nn[data-state="sleep"] .nn-sprout {
    transform: rotate(28deg);
    animation: none;
  }
  .nn[data-state="sleep"] .nn-ear-l {
    transform: rotate(-16deg);
  }
  .nn[data-state="sleep"] .nn-ear-r {
    transform: rotate(16deg);
  }
  .nn[data-state="sleep"] .nn-tail {
    animation-duration: 5s;
  }
  .nn[data-state="surprised"] .nn-pet {
    animation: nn-shake 0.35s ease-in-out 3;
  }
  .nn[data-state="surprised"] .nn-ear-l {
    transform: rotate(14deg);
  }
  .nn[data-state="surprised"] .nn-ear-r {
    transform: rotate(-14deg);
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
  @keyframes nn-sway {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(6deg);
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
