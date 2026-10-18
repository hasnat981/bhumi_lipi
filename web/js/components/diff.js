// Diff Viewer & Hash Avalanche component for "Try to cheat" and attack analysis.
// Shows character-level text diffs and side-by-side 64-hex SHA-256 avalanche comparison.

import { h } from '../dom.js';
import { T, fmtNum } from '../i18n.js';

// Hash avalanche comparison: counts differing nibbles/characters between two hex strings
export function avalanche(a, b) {
  let n = 0;
  const out = [];
  const maxLen = Math.max(a.length, b.length, 64);
  const padA = a.padEnd(maxLen, '0');
  const padB = b.padEnd(maxLen, '0');

  for (let i = 0; i < maxLen; i++) {
    const ca = padA[i] || '';
    const cb = padB[i] || '';
    const diff = ca !== cb;
    if (diff) n++;
    out.push({ pos: i, a: ca, b: cb, diff });
  }
  return { changed: n, total: maxLen, items: out };
}

// Render the visual avalanche comparison box
export function renderAvalancheBox(hashOriginal, hashModified) {
  const { changed, total, items } = avalanche(hashOriginal, hashModified);
  const percent = Math.round((changed / total) * 100);

  const container = h('div', { class: 'avalanche-container card', style: 'margin-top:14px;background:var(--surface-2)' },
    h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:8px' },
      h('strong', {}, T('হ্যাশ অ্যাভালাঞ্চ প্রভাব (Hash Avalanche Effect)', 'Hash Avalanche Effect')),
      h('span', { class: changed > 0 ? 'chip red sm' : 'chip green sm' },
        changed > 0 ? `${fmtNum(changed)}/${fmtNum(total)} (${fmtNum(percent)}%) ${T('অক্ষর পরিবর্তিত', 'characters flipped')}` : T('হুবহু এক', 'Identical'))),
    h('p', { class: 'small muted', style: 'margin-bottom:10px' },
      changed > 0
        ? T('মাত্র ১টি অক্ষর পরিবর্তনে সম্পূর্ণ ক্রিপ্টোগ্রাফিক ফিঙ্গারপ্রিন্ট আমূল বদলে গেছে।',
            'Changing just 1 character completely scrambled the cryptographic SHA-256 fingerprint.')
        : T('উভয় দলিলের ডিজিটাল ফিঙ্গারপ্রিন্ট শতভাগ অভিন্ন।',
            'Both deed texts have an identical cryptographic fingerprint.')),
    h('div', { class: 'grid g2', style: 'gap:12px' },
      h('div', {},
        h('div', { class: 'small muted', style: 'margin-bottom:4px' }, T('আসল ফিঙ্গারপ্রিন্ট (Original SHA-256)', 'Original SHA-256')),
        h('div', { class: 'hex-grid mono' },
          items.map(it => h('span', { class: it.diff ? 'hex-char hex-orig-diff' : 'hex-char' }, it.a)))),
      h('div', {},
        h('div', { class: 'small muted', style: 'margin-bottom:4px' }, T('আপনার টেক্সটের ফিঙ্গারপ্রিন্ট (Modified SHA-256)', 'Modified SHA-256')),
        h('div', { class: 'hex-grid mono' },
          items.map(it => h('span', { class: it.diff ? 'hex-char hex-mod-diff' : 'hex-char' }, it.b))))));

  return container;
}

// Simple line & character diff viewer
export function renderDiffViewer(origText, modText) {
  const origLines = origText.split('\n');
  const modLines = modText.split('\n');
  const maxLines = Math.max(origLines.length, modLines.length);

  let changedCount = 0;
  const rows = [];

  for (let i = 0; i < maxLines; i++) {
    const oLine = origLines[i] ?? '';
    const mLine = modLines[i] ?? '';

    if (oLine === mLine) {
      rows.push(h('div', { class: 'diff-line same' },
        h('span', { class: 'diff-num mono' }, i + 1),
        h('span', { class: 'diff-text mono' }, oLine)));
    } else {
      changedCount++;
      rows.push(
        h('div', { class: 'diff-line del' },
          h('span', { class: 'diff-num mono' }, i + 1),
          h('span', { class: 'diff-tag' }, '-'),
          h('span', { class: 'diff-text mono' }, oLine)),
        h('div', { class: 'diff-line ins' },
          h('span', { class: 'diff-num mono' }, i + 1),
          h('span', { class: 'diff-tag' }, '+'),
          h('span', { class: 'diff-text mono' }, mLine))
      );
    }
  }

  return h('div', { class: 'diff-viewer card', style: 'margin-top:14px;background:var(--surface-2)' },
    h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:8px' },
      h('strong', {}, T('পাঠ্য পরিবর্তন তুলনা (Text Diff)', 'Text Diff Comparison')),
      h('span', { class: changedCount > 0 ? 'chip amber sm' : 'chip green sm' },
        changedCount > 0 ? `${fmtNum(changedCount)} ${T('টি লাইনে অমিল', 'lines changed')}` : T('কোনো পরিবর্তন নেই', 'No changes'))),
    h('div', { class: 'diff-lines-container' }, rows));
}
