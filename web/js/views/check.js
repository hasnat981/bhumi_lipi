// "Check before you buy" (Problem P5). A citizen sees a Green / Amber / Red verdict in plain words.
import { h, icon } from '../dom.js';
import { api, docUrl } from '../api.js';
import { state, T, LL, fmtDate, fmtMoney, fmtNum, shortHash, getView, setView } from '../i18n.js';
import { shareFraction } from '../a11y.js';
import { copyText } from '../dom.js';
import { verdictBanner, flagList, kindLabel, stateChip, pageHead, threeWord, threeWordBn, listenButton, statusBadge } from './ui.js';
import { createChainView } from '../components/chain-view.js';

const VERDICT_TITLE = { green: ['নিরাপদ মনে হচ্ছে', 'Looks safe'], amber: ['সাবধানে এগোন', 'Proceed with caution'], red: ['ঝুঁকি অনেক বেশি', 'High risk'] };

export default async function check([id], ctx) {
  if (!id) return picker(ctx);
  const r = await api('/plots/' + encodeURIComponent(id));
  const p = r.plot;
  const chips = [h('span', { class: 'chip' }, p.mouza), h('span', { class: 'chip' }, `${fmtNum(p.area_decimal)} ${T('শতাংশ', 'decimal')}`)];
  if (p.locked) chips.push(h('span', { class: 'chip amber' }, icon('lock'), T('লক · নামজারি বাকি', 'Locked · mutation pending')));
  if (p.khas) chips.push(h('span', { class: 'chip red' }, T('খাস জমি', 'Khas land')));
  if (p.acquisition) chips.push(h('span', { class: 'chip red' }, T('অধিগ্রহণ', 'Under acquisition')));
  if (p.court_case) chips.push(h('span', { class: 'chip amber' }, T('মামলা চলছে', 'Court case')));
  if (r.lien) chips.push(h('span', { class: 'chip red' }, icon('bank'), T('ব্যাংক বন্ধক', 'Bank lien')));
  chips.push(r.chain.ok ? h('span', { class: 'chip green' }, icon('check'), T('সিল যাচাই হয়েছে', 'Seals verified')) : h('span', { class: 'chip red' }, icon('x'), T('সিল ভাঙা', 'Seal broken')));

  const history = createChainView({ history: r.history, chain: r.chain, plotId: p.plot_id });

  const mut = r.mutation && h('div', { class: 'card' }, h('h3', {}, T('নামজারির অবস্থা', 'Mutation status')),
    h('div', { class: 'row' }, stateChip(r.mutation.state, r.mutation.label), h('a', { href: '#/mutation/' + r.mutation.tracking_id }, r.mutation.tracking_id)));

  const survey = r.survey.records.length ? h('div', { class: 'card' }, h('h3', {}, T('জরিপের ইতিহাস (CS · SA · RS · BS)', 'Survey history (CS · SA · RS · BS)')),
    h('div', { class: 'scroll-x' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['জরিপ|Survey', 'খতিয়ান|Khatian', 'নামে|Holder', 'শতাংশ|Decimal'].map((c) => h('th', {}, T(...c.split('|')))))),
      h('tbody', {}, r.survey.records.map((s) => h('tr', {}, h('td', {}, h('strong', {}, s.survey)), h('td', { class: 'mono' }, s.khatian_no), h('td', {}, s.holder), h('td', {}, fmtNum(s.area_decimal))))))),
    r.survey.mismatch ? h('p', { class: 'notice', style: 'margin-top:12px' }, T('জরিপগুলোর মধ্যে জমির পরিমাণ মিলছে না। কেনার আগে ভূমি অফিস থেকে নিশ্চিত হোন।', 'Land area differs between surveys. Confirm with the land office before buying.')) : null) : null;

  // Simple view (default for citizens): verdict, owner, reasons, advice and the big buttons only.
  const saved = getView();
  let simple = saved ? saved === 'simple' : state.role === 'citizen';
  const root = h('div', { class: `wrap checkpage${simple ? ' simple' : ''}`, style: 'padding:28px 20px 0' });
  const viewBtn = h('button', { class: 'btn ghost lg', type: 'button', id: 'viewtoggle', onclick: () => {
    simple = !simple; setView(simple ? 'simple' : 'full'); root.classList.toggle('simple', simple); label();
  } });
  const label = () => viewBtn.replaceChildren(simple ? T('বিস্তারিত দেখুন', 'Full details') : T('সহজ দেখুন', 'Simple view'));
  label();
  const bnText = () => `সিদ্ধান্ত: ${threeWordBn(r.verdict)}। ${r.headline.bn} মালিক: ${p.owner}। ` + r.reasons.map((x) => x.bn).join(' ');
  const bigButtons = h('div', { class: 'bigbtns noprint' },
    listenButton(bnText, ctx),
    h('button', { class: 'btn ghost lg', type: 'button', onclick: () => window.print() }, icon('print'), T('প্রিন্ট', 'Print')),
    navigator.share ? h('button', { class: 'btn ghost lg', type: 'button', onclick: () => navigator.share({ title: `${p.plot_id} · Bhumi Lipi`, url: location.href }).catch(() => {}) }, icon('share'), T('শেয়ার', 'Share')) : null,
    viewBtn);

  root.append(
    h('div', { class: 'row noprint', style: 'margin-bottom:14px' }, h('a', { class: 'btn ghost sm', href: '#/check' }, '← ', T('সব প্লট', 'All plots')),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost sm detail', onclick: () => copyText(location.href) }, icon('copy'), T('লিংক কপি', 'Copy link'))),
    h('h1', { class: 'mono nowrap', style: 'font-family:var(--mono);font-size:clamp(24px,4vw,36px);margin-bottom:10px' }, p.plot_id),
    h('div', { class: 'row detail', style: 'margin-bottom:16px' }, ...chips),
    verdictBanner(r.verdict, T(...VERDICT_TITLE[r.verdict]), LL(r.headline), threeWord(r.verdict)),
    bigButtons,
    h('div', { class: 'grid g2', style: 'margin-top:18px' },
      h('div', { class: 'card' }, h('h3', {}, T('বর্তমান মালিক', 'Current owner')), h('div', { class: 'owner' }, p.owner),
        r.reasons.length ? h('div', { style: 'margin-top:16px' }, h('h3', {}, T('কেন এই ফলাফল', 'Why this result')), flagList(r.reasons)) : h('p', { class: 'muted', style: 'margin-top:12px' }, T('কোনো সতর্কতা নেই।', 'No warnings.'))),
      h('div', { class: 'card' }, h('h3', {}, T('এখন কী করবেন', 'What to do next')),
        h('ul', { class: 'reasons' }, r.advice.map((a) => h('li', {}, icon('arrow'), h('div', {}, LL(a))))),
        h('p', { class: 'small muted', style: 'margin-top:14px' }, T('এই পাতা পরামর্শ মাত্র, আইনি সিদ্ধান্ত নয়।', 'This page is guidance, not a legal decision.')))),
    anaGondaCard(p.area_decimal),
    h('div', { class: 'grid g2 detail', style: 'margin-top:18px' }, mut, survey),
    h('div', { class: 'card detail', style: 'margin-top:18px' }, h('h3', { style: 'margin-bottom:16px' }, T('মালিকানার ইতিহাস', 'Ownership history')), history,
      r.chain.ok ? null : h('p', { class: 'notice' }, T(`রেকর্ড #${r.chain.first_bad_seq} এ সিল মিলছে না (${r.chain.reason}).`, `Seal mismatch at record #${r.chain.first_bad_seq} (${r.chain.reason}).`))));
  return root;
}

// Helper for people who hear shares in the traditional units. 1 taka = 16 ana; 1 ana = 20 gonda; 1 gonda = 4 kora; 1 kora = 3 kranti.
function anaGondaCard(area) {
  const parts = [['ana', 'আনা', 'Ana', 8], ['gonda', 'গণ্ডা', 'Gonda', 0], ['kora', 'কড়া', 'Kora', 0], ['kranti', 'ক্রান্তি', 'Kranti', 0]];
  const inputs = Object.fromEntries(parts.map(([k, , , v]) => [k, h('input', { id: `ag-${k}`, type: 'number', min: 0, step: 1, inputmode: 'numeric', value: v })]));
  const out = h('p', { class: 'owner', style: 'font-size:24px;margin:14px 0 0', 'aria-live': 'polite' });
  const calc = () => {
    const f = shareFraction(Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value])));
    if (f > 1) { out.textContent = T('১৬ আনার (পূর্ণ অংশের) বেশি হতে পারে না।', 'It cannot be more than 16 ana (the whole).'); return; }
    out.textContent = T(`= ${fmtNum(f * 100)}% অংশ ≈ ${fmtNum(f * area)} শতাংশ (এই প্লট ${fmtNum(area)} শতাংশ)`, `= ${fmtNum(f * 100)}% share ≈ ${fmtNum(f * area)} decimal (this plot is ${fmtNum(area)} decimal)`);
  };
  let calcRaf = null;
  const debouncedCalc = () => {
    if (calcRaf) cancelAnimationFrame(calcRaf);
    calcRaf = requestAnimationFrame(calc);
  };
  Object.values(inputs).forEach((i) => i.addEventListener('input', debouncedCalc));
  calc();
  return h('details', { class: 'card agcalc', style: 'margin-top:18px' },
    h('summary', {}, T('আনা-গণ্ডা থেকে শতাংশ হিসাব', 'Convert ana-gonda to decimal')),
    h('p', { class: 'muted small', style: 'margin-top:10px' }, T('১৬ আনা = পূর্ণ (১ টাকা)। ১ আনা = ২০ গণ্ডা, ১ গণ্ডা = ৪ কড়া, ১ কড়া = ৩ ক্রান্তি।', '16 ana = the whole (1 taka). 1 ana = 20 gonda, 1 gonda = 4 kora, 1 kora = 3 kranti.')),
    h('div', { class: 'grid g4' }, parts.map(([k, bn, en]) => h('div', {}, h('label', { for: `ag-${k}` }, T(bn, en)), inputs[k]))),
    out,
    h('p', { class: 'small muted', style: 'margin-top:8px' }, T('এটি আনুমানিক হিসাব, আইনি দলিল নয়। স্থানীয় ভূমি অফিস থেকে নিশ্চিত হোন।', 'This is an estimate, not a legal document. Confirm with the local land office.')));
}

async function picker(ctx) {
  const plots = await api('/plots');
  const go = (v) => ctx.navigate('/check/' + encodeURIComponent(v.trim().toUpperCase()));
  const input = h('input', { placeholder: 'DHK-UTT-0142', 'aria-label': T('প্লট নম্বর', 'Plot number'), autocapitalize: 'characters', spellcheck: 'false' });
  const dotFor = { green: 'green', amber: 'amber', red: 'red' };
  return h('div', { class: 'wrap', style: 'padding:32px 20px 0' },
    pageHead(T('জমি যাচাই করুন', 'Check a plot'), T('প্লট নম্বর লিখুন অথবা নিচের নমুনা বেছে নিন।', 'Type a plot number or pick a sample below.')),
    h('form', { class: 'search', style: 'margin-bottom:26px', onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) go(input.value); } },
      input, h('button', { class: 'btn', type: 'submit' }, icon('search'), T('যাচাই', 'Check'))),
    h('div', { class: 'grid g3' }, plots.map((p) => h('a', { class: 'card', href: '#/check/' + p.plot_id, style: 'text-decoration:none;color:inherit' },
      h('div', { class: 'plot-card-head' }, h('strong', { class: 'mono nowrap' }, p.plot_id), statusBadge(p.verdict)),
      h('div', { class: 'muted small' },
        p.mouza, ' · ', fmtNum(p.area_decimal), ' ', T('শতাংশ', 'decimal'),
        p.locked ? [' · ', h('span', { class: 'amber-text', style: 'font-weight:600' }, icon('lock'), ' ', T('লক', 'Locked'))] : null),
      h('div', { style: 'margin-top:6px' }, p.owner)))));
}
