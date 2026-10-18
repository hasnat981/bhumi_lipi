// Shared UI pieces used by several pages.
import { h, icon } from '../dom.js';
import { state, T, LL } from '../i18n.js';
import { watchBanglaVoice, speakBangla, stopSpeaking } from '../a11y.js';

export const VERDICT_ICON = { green: 'shield', amber: 'warn', red: 'x', forged: 'x' };
export const KIND = {
  INIT: ['প্রথম নিবন্ধন', 'First registration'], SALE: ['বিক্রি', 'Sale'], REVERSAL: ['বাতিল (ফেরত)', 'Reversed'],
};
export const kindLabel = (k) => T(...(KIND[k] || [k, k]));

import { createSeal } from '../components/seal.js';

export function verdictBanner(cls, title, sub, extra) {
  const sealVariant = cls === 'green' ? 'genuine' : cls === 'amber' ? 'outdated' : (cls === 'forged' || cls === 'red') ? 'forged' : 'pending';
  const seal = createSeal({ variant: sealVariant, size: 58, stamped: true });

  const banner = h('div', { class: `verdict ${cls} pop reveal-banner`, role: 'status', 'aria-live': 'polite', tabindex: '0' },
    h('div', { class: 'verdict-scanline', 'aria-hidden': 'true' }),
    h('div', { class: 'big seal-slot' }, seal),
    h('div', { class: 'grow' }, h('h2', {}, title), sub ? h('p', {}, sub) : null, extra || null));

  // Skippable on click or Esc key
  const skip = () => banner.classList.add('reveal-skipped');
  banner.addEventListener('click', skip);
  banner.addEventListener('keydown', (e) => { if (e.key === 'Escape') skip(); });

  return banner;
}

export function flagList(flags) {
  if (!flags || !flags.length) return null;
  return h('ul', { class: 'reasons' }, flags.map((f) => h('li', {},
    h('span', { class: `dot ${f.level === 'block' || f.level === 'red' ? 'red' : 'amber'}` }),
    h('div', {}, LL(f)))));
}

export function riskMeter(risk) {
  const level = { LOW: ['কম', 'Low'], MEDIUM: ['মাঝারি', 'Medium'], HIGH: ['বেশি', 'High'] }[risk.level];
  return h('div', {}, h('div', { class: 'row small', style: 'justify-content:space-between' },
    h('strong', {}, T('ঝুঁকির মাত্রা', 'Risk level')), h('span', {}, `${risk.score}/100 · ${T(...level)}`)),
  h('div', { class: `meter ${risk.level}`, role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': risk.score },
    h('i', { style: `width:${Math.max(risk.score, 3)}%` })));
}

export function errorBox(e) {
  const err = e.error || {};
  return h('div', { class: 'verdict red', role: 'alert' }, h('div', { class: 'big' }, icon('x')),
    h('div', { class: 'grow' }, h('h2', {}, state.lang === 'bn' ? (err.bn || 'ত্রুটি') : (err.en || 'Error')),
      flagList(err.flags)));
}

const ROLE_NAME = { registrar: ['সাব-রেজিস্ট্রার', 'Sub-registrar'], ac_land: ['এসি ল্যান্ড কর্মকর্তা', 'AC Land officer'], bank: ['ব্যাংক', 'Bank'] };
export function roleGate(needed, setRole, rerender) {
  const roles = Array.isArray(needed) ? needed : [needed];
  return h('div', { class: 'wrap', style: 'padding:48px 20px' }, h('div', { class: 'card empty' },
    icon('lock'), h('h2', { style: 'margin:10px 0' }, T('এই পাতা কর্মকর্তাদের জন্য', 'This page is for officers')),
    h('p', {}, T('ডেমোর জন্য নিচের ভূমিকা বেছে নিন। আসল সিস্টেমে এটি জাতীয় ডিজিটাল আইডি দিয়ে হবে।',
      'Pick a role to try the demo. The real system would use national digital ID.')),
    h('div', { class: 'row', style: 'justify-content:center' }, roles.map((r) => h('button', { class: 'btn', onclick: () => { setRole(r); rerender(); } },
      T('আমি ', 'Continue as '), T(...ROLE_NAME[r]))))));
}

export function stateChip(s, label) {
  const cls = s === 'APPROVED' || s === 'AUTO_PASSED' ? 'green' : s === 'FLAGGED' ? 'amber' : s === 'REJECTED' ? 'red' : '';
  return h('span', { class: `chip ${cls}` }, LL(label) || s);
}

const STATUS_BADGE = {
  green: ['নিরাপদ', 'Clear'],
  amber: ['সাবধান', 'Caution'],
  red: ['থামুন', 'Stop'],
};

export function statusBadge(verdict) {
  const [bn, en] = STATUS_BADGE[verdict] || STATUS_BADGE.green;
  return h('span', { class: `status-badge ${verdict}` },
    h('span', { class: `dot ${verdict}` }),
    h('span', { class: 'status-badge-text' }, T(bn, en)));
}

export function pageHead(title, sub) {
  return h('div', { class: 'sect-head' }, h('h1', { style: 'font-size:clamp(30px,4.5vw,46px)' }, title), sub ? h('p', {}, sub) : null);
}

export function copyBtn(text, copyText, label) {
  return h('button', { class: 'btn ghost sm', onclick: () => copyText(text) }, icon('copy'), label || T('কপি', 'Copy'));
}

// Three words and three shapes: easy for every age. Colour is never the only signal.
const THREE = { green: ['এগোন', 'Go ahead', 'shield'], amber: ['সাবধান', 'Careful', 'warn'], red: ['থামুন', 'Stop', 'octagon'], forged: ['থামুন', 'Stop', 'octagon'] };
export function threeWord(cls) {
  const [bn, en, ic] = THREE[cls] || THREE.amber;
  return h('div', { class: `threeword ${cls}`, 'data-word': en }, icon(ic), h('b', {}, T(bn, en)));
}
export const threeWordBn = (cls) => (THREE[cls] || THREE.amber)[0];

// "Listen" button: only appears when this device has a Bangla voice. Never plays by itself.
export function listenButton(getBanglaText, ctx) {
  const btn = h('button', { class: 'btn ghost lg listen', type: 'button', hidden: true, onclick: () => speakBangla(getBanglaText()) },
    icon('speaker'), T('শুনুন', 'Listen'));
  const stopWatching = watchBanglaVoice((ok) => { btn.hidden = !ok; });
  ctx.onLeave(() => { stopWatching(); stopSpeaking(); });
  return btn;
}
