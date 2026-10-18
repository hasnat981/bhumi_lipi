// Bank desk: place and release liens. A second mortgage on the same land is blocked (double mortgaging).
import { h, icon } from '../dom.js';
import { api } from '../api.js';
import { state, setRole, T, LL, fmtDate, fmtMoney } from '../i18n.js';
import { roleGate, pageHead, errorBox, verdictBanner } from './ui.js';

export default async function bank(_, ctx) {
  if (state.role !== 'bank') return roleGate('bank', setRole, ctx.rerender);
  const [plots, liens] = await Promise.all([api('/plots'), api('/liens')]);
  const sel = h('select', { id: 'bp' }, plots.map((p) => h('option', { value: p.plot_id }, `${p.plot_id} · ${p.owner}`)));
  const bankName = h('input', { id: 'bn', value: 'Dummy Bank Ltd', maxlength: 80 }), amount = h('input', { id: 'am', type: 'number', min: 0, value: 2000000, step: 10000 });
  const msg = h('div', { 'aria-live': 'polite', style: 'margin-top:14px' });
  const place = async (e) => {
    e.preventDefault();
    try { await api('/liens', { method: 'POST', body: { plot_id: sel.value, bank: bankName.value, amount_bdt: Number(amount.value) } }); ctx.rerender(); }
    catch (err) { msg.replaceChildren(errorBox(err)); }
  };
  const release = (id) => async () => { await api(`/liens/${id}/release`, { method: 'POST', body: {} }); ctx.rerender(); };
  const active = liens.filter((l) => !l.released);
  return h('div', { class: 'wrap', style: 'padding:32px 20px 0' },
    pageHead(T('ব্যাংক ডেস্ক', 'Bank desk'), T('জমি বন্ধক রাখার আগে মালিকানা যাচাই। একই জমি দুই ব্যাংকে বন্ধক রাখা যায় না।', 'Check ownership before taking land as collateral. The same land cannot be mortgaged twice.')),
    h('div', { class: 'grid g2' },
      h('form', { class: 'card', onsubmit: place }, h('h3', {}, T('নতুন বন্ধক', 'New lien')),
        h('label', { for: 'bp' }, T('প্লট', 'Plot')), sel, h('label', { for: 'bn' }, T('ব্যাংক', 'Bank')), bankName, h('label', { for: 'am' }, T('ঋণের পরিমাণ (টাকা)', 'Loan amount (BDT)')), amount,
        h('p', { class: 'field-hint' }, T('চেষ্টা করুন: SYL-ZKJ-0210 (আগেই বন্ধক), DHK-GUL-0309 (লক করা)।', 'Try: SYL-ZKJ-0210 (already mortgaged), DHK-GUL-0309 (locked).')),
        h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn', type: 'submit' }, icon('bank'), T('বন্ধক নিবন্ধন', 'Register lien'))), msg),
      h('div', { class: 'card' }, h('h3', {}, T('সক্রিয় বন্ধক', 'Active liens'), ` (${active.length})`),
        active.length ? h('div', { class: 'stack' }, active.map((l) => h('div', { class: 'row', style: 'justify-content:space-between' },
          h('div', {}, h('strong', { class: 'mono' }, l.plot_id), h('div', { class: 'small muted' }, `${l.bank} · ${fmtMoney(l.amount_bdt)} · ${fmtDate(l.ts)}`)),
          h('button', { class: 'btn ghost sm', onclick: release(l.id) }, T('মুক্ত করুন', 'Release'))))) : h('p', { class: 'muted' }, T('কোনো সক্রিয় বন্ধক নেই।', 'No active liens.')))));
}
