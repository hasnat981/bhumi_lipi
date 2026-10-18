// e-Mutation tracker (Problem P4). Citizens follow their application; AC Land officers decide with one click.
import { h, icon } from '../dom.js';
import { api } from '../api.js';
import { state, setRole, T, LL, fmtDateTime, fmtMoney, fmtNum } from '../i18n.js';
import { pageHead, stateChip, verdictBanner, errorBox } from './ui.js';

const agingChip = (m) => (m.aging ? h('span', { class: `chip ${m.aging === 'red' ? 'red' : m.aging === 'amber' ? 'amber' : ''}`, 'data-aging': m.aging }, icon('clock'), T(`অপেক্ষমাণ ${fmtNum(m.waiting_days)} দিন`, `Waiting ${fmtNum(m.waiting_days)} days`)) : null);

const STEPS = ['SUBMITTED', 'AUTO_CHECKING', 'AUTO_PASSED', 'APPROVED'];

function checklist(checks) {
  return h('div', {}, checks.map((c) => h('div', { class: `check ${c.ok ? 'ok' : 'no'}` }, icon(c.ok ? 'check' : 'x'), h('span', {}, LL(c)))));
}

export default async function mutation([id], ctx) {
  if (id) return detail(id, ctx);
  const input = h('input', { placeholder: 'MUT-1A2B3C4D', style: 'font-family:var(--mono)', 'aria-label': T('ট্র্যাকিং নম্বর', 'Tracking number') });
  const out = [];
  if (state.role === 'ac_land' || state.role === 'registrar') {
    const q = await api('/mutations/queue');
    out.push(h('div', { class: 'card', style: 'margin-top:20px' }, h('h3', {}, T('অপেক্ষমাণ আবেদন', 'Pending applications'), ` (${q.length})`),
      q.length ? h('div', { class: 'mutation-queue-wrap' },
        h('div', { class: 'scroll-x mutation-table-desk' }, h('table', { class: 't' }, h('tbody', {}, q.map((m) => h('tr', {},
          h('td', {}, h('a', { href: '#/mutation/' + m.tracking_id, class: 'mono nowrap' }, m.tracking_id)), h('td', { class: 'mono nowrap' }, m.plot_id),
          h('td', {}, m.deed ? `${m.deed.frm} → ${m.deed.to}` : ''), h('td', { class: 'nowrap' }, stateChip(m.state, m.label), ' ', agingChip(m)),
          h('td', {}, h('a', { class: 'btn sm', href: '#/mutation/' + m.tracking_id }, T('দেখুন', 'Open')))))))),
        h('div', { class: 'mutation-cards-mobile' }, q.map((m) => h('div', { class: 'mutation-item-card' },
          h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' },
            h('a', { href: '#/mutation/' + m.tracking_id, class: 'mono nowrap font-bold', style: 'font-size:16px;font-weight:750' }, m.tracking_id),
            h('div', { class: 'row', style: 'gap:6px' }, stateChip(m.state, m.label), agingChip(m))),
          h('div', { class: 'muted small', style: 'margin-top:8px' },
            h('span', { class: 'mono nowrap' }, m.plot_id),
            m.deed ? ` · ${m.deed.frm} → ${m.deed.to}` : ''),
          h('div', { style: 'margin-top:12px' },
            h('a', { class: 'btn sm full-mobile', href: '#/mutation/' + m.tracking_id }, T('দেখুন', 'Open'))))))) : h('p', { class: 'muted' }, T('কোনো অপেক্ষমাণ আবেদন নেই।', 'No pending applications.'))));
  }
  return h('div', { class: 'wrap', style: 'padding:32px 20px 0;max-width:860px' },
    pageHead(T('নামজারি ট্র্যাকার', 'Mutation tracker'), T('দলিল রেজিস্ট্রির পর নামজারি নিজে থেকেই শুরু হয়। অবস্থা এখানে দেখুন।', 'Mutation starts automatically after registration. Follow it here.')),
    h('form', { class: 'search', onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) ctx.navigate('/mutation/' + encodeURIComponent(input.value.trim())); } }, input, h('button', { class: 'btn', type: 'submit' }, icon('search'), T('দেখুন', 'Track'))),
    state.role === 'citizen' ? h('p', { class: 'notice', style: 'margin-top:18px' }, T('এসি ল্যান্ড কর্মকর্তার কাজ দেখতে উপরে ভূমিকা "এসি ল্যান্ড" বেছে নিন।', 'To see the AC Land officer queue, choose the role "AC Land" at the top.')) : null, ...out);
}

async function detail(id, ctx) {
  const m = await api('/mutations/' + encodeURIComponent(id));
  const note = h('textarea', { 'aria-label': T('কারণ', 'Reason'), style: 'min-height:80px;font-family:var(--font);font-size:16.5px', placeholder: T('কারণ লিখুন (সতর্কতাযুক্ত আবেদনে বাধ্যতামূলক)', 'Write a reason (required for flagged applications)') });
  const msg = h('div', { 'aria-live': 'polite', style: 'margin-top:12px' });
  const decide = (d) => async () => {
    try { await api(`/mutations/${m.tracking_id}/decision`, { method: 'POST', body: { decision: d, note: note.value } }); ctx.rerender(); } catch (e) { msg.replaceChildren(errorBox(e)); }
  };
  const done = new Map(m.events.map((e) => [e.state, e]));
  const rejected = m.state === 'REJECTED', flagged = done.has('FLAGGED');
  const steps = [['SUBMITTED', 'SUBMITTED'], ['AUTO_CHECKING', 'AUTO_CHECKING'], [flagged ? 'FLAGGED' : 'AUTO_PASSED', flagged ? 'FLAGGED' : 'AUTO_PASSED'], [rejected ? 'REJECTED' : 'APPROVED', rejected ? 'REJECTED' : 'APPROVED']];
  const labels = { SUBMITTED: ['আবেদন জমা', 'Application submitted'], AUTO_CHECKING: ['স্বয়ংক্রিয় যাচাই', 'Automatic checks'], AUTO_PASSED: ['যাচাই সফল', 'Checks passed'], FLAGGED: ['কর্মকর্তার নজর', 'Officer review'], APPROVED: ['অনুমোদিত', 'Approved'], REJECTED: ['বাতিল', 'Rejected'] };
  const timeline = h('ol', { class: 'timeline' }, steps.map(([s]) => {
    const e = done.get(s);
    return h('li', { class: e ? (s === 'REJECTED' ? 'fail' : s === 'FLAGGED' ? 'warn' : 'done') : '' }, h('span', { class: 'node' }, e ? '✓' : ''),
      h('strong', {}, T(...labels[s])), e ? h('div', { class: 'when' }, fmtDateTime(e.ts), ` · ${e.actor}`, e.note ? ` · ${e.note}` : '') : h('div', { class: 'when' }, T('অপেক্ষায়', 'Waiting')));
  }));
  const pending = m.state === 'AUTO_PASSED' || m.state === 'FLAGGED';
  const cls = m.state === 'APPROVED' ? 'green' : m.state === 'REJECTED' ? 'red' : m.state === 'FLAGGED' ? 'amber' : 'green';
  return h('div', { class: 'wrap', style: 'padding:28px 20px 0;max-width:860px' },
    h('a', { class: 'btn ghost sm', href: '#/mutation' }, '← ', T('ট্র্যাকার', 'Tracker')),
    h('div', { class: 'row', style: 'margin:16px 0' }, h('h1', { class: 'mono nowrap', style: 'font:700 clamp(20px,4vw,34px) var(--mono)' }, m.tracking_id), stateChip(m.state, m.label), agingChip(m),
      !m.aging ? h('span', { class: 'chip' }, icon('clock'), T(`${fmtNum(m.waiting_days)} দিনে সম্পন্ন`, `Took ${fmtNum(m.waiting_days)} days`)) : null),
    verdictBanner(cls, LL(m.label), T(`প্লট ${m.plot_id} · ${m.deed.frm} → ${m.deed.to} · ${fmtMoney(m.deed.price_bdt)}`, `Plot ${m.plot_id} · ${m.deed.frm} → ${m.deed.to} · ${fmtMoney(m.deed.price_bdt)}`)),
    h('div', { class: 'grid g2', style: 'margin-top:18px' },
      h('div', { class: 'card' }, h('h3', { style: 'margin-bottom:14px' }, T('অগ্রগতি', 'Progress')), timeline),
      h('div', { class: 'card' }, h('h3', {}, T('স্বয়ংক্রিয় যাচাই', 'Automatic checks')), checklist(m.checks))),
    pending ? (state.role === 'ac_land' ? h('div', { class: 'card', style: 'margin-top:18px' }, h('h3', {}, T('আপনার সিদ্ধান্ত', 'Your decision')),
      m.state === 'FLAGGED' ? h('p', { class: 'notice' }, T('এই আবেদনে সতর্কতা আছে। অনুমোদনের কারণ লিখতে হবে।', 'This application has warnings. A reason is required.')) : null, note,
      h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn ok', onclick: decide('approve') }, icon('check'), T('অনুমোদন (জমি আনলক)', 'Approve (unlock land)')),
        h('button', { class: 'btn bad', onclick: decide('reject') }, icon('x'), T('বাতিল (বিক্রি ফেরত)', 'Reject (reverse sale)'))), msg)
      : h('p', { class: 'notice', style: 'margin-top:18px' }, T('সিদ্ধান্ত নিতে ভূমিকা "এসি ল্যান্ড" বেছে নিন।', 'Choose the role "AC Land" at the top to decide.'))) : null,
    h('p', { style: 'margin-top:18px' }, h('a', { href: '#/check/' + m.plot_id }, T('প্লটের পূর্ণ তথ্য দেখুন →', 'See the full plot record →'))));
}
