// Sub-registrar desk: register a sale. Rules run first, then the deed is sealed, the plot locks and mutation starts.
import { h, icon } from '../dom.js';
import { api, docUrl, sealUrl } from '../api.js';
import { state, setRole, T, LL, fmtDateTime, fmtMoney } from '../i18n.js';
import { qrSvg } from '../qr.js';
import { copyText } from '../dom.js';
import { roleGate, flagList, riskMeter, errorBox, pageHead, stateChip } from './ui.js';

export default async function registrar(_, ctx) {
  if (state.role !== 'registrar') return roleGate('registrar', setRole, ctx.rerender);
  const [plots, alerts] = await Promise.all([api('/plots'), api('/alerts').catch(() => [])]);
  const plotSel = h('select', { id: 'plot' }, plots.map((p) => h('option', { value: p.plot_id }, `${p.plot_id} — ${p.mouza} (${p.area_decimal} dec)`)));
  const plotHint = h('div', { class: 'field-hint mono', style: 'margin-top:4px;font-size:13.5px' });
  const seller = h('input', { id: 'seller', maxlength: 80 }), buyer = h('input', { id: 'buyer', value: 'Dummy Buyer B', maxlength: 80 });
  const price = h('input', { id: 'price', type: 'number', min: 0, step: 1000, value: 6000000, inputmode: 'numeric' });
  const priceHint = h('div', { class: 'field-hint', style: 'margin-top:4px' });
  const updatePriceHint = () => {
    const n = Number(price.value) || 0;
    priceHint.textContent = `≈ ৳ ${n.toLocaleString('en-IN')}`;
  };
  const preview = h('div', { 'aria-live': 'polite', style: 'margin-top:16px' });
  const result = h('div', { 'aria-live': 'polite', style: 'margin-top:18px' });
  const byId = Object.fromEntries(plots.map((p) => [p.plot_id, p]));
  const body = () => ({ plot_id: plotSel.value, seller: seller.value, buyer: buyer.value, price_bdt: Number(price.value) });

  let t;
  const refresh = () => { clearTimeout(t); t = setTimeout(async () => {
    try {
      const r = await api('/risk', { method: 'POST', body: body() });
      preview.replaceChildren(h('div', { class: 'card flat' }, riskMeter(r.risk),
        r.flags.length ? flagList(r.flags) : h('p', { class: 'muted small', style: 'margin:10px 0 0' }, T('কোনো সমস্যা পাওয়া যায়নি।', 'No problems found.')),
        h('p', { class: `chip ${r.allowed ? 'green' : 'red'}`, style: 'margin-top:12px' }, r.allowed ? T('রেজিস্ট্রি করা যাবে', 'Can be registered') : T('আটকানো হবে', 'Will be blocked'))));
    } catch (e) { preview.replaceChildren(errorBox(e)); }
  }, 300); };
  const useOwner = () => {
    const sel = byId[plotSel.value];
    if (sel) {
      seller.value = sel.owner;
      plotHint.textContent = `${sel.plot_id} · ${sel.mouza} · ${sel.area_decimal} decimal`;
    }
  };
  plotSel.addEventListener('change', () => { useOwner(); refresh(); });
  [seller, buyer, price].forEach((i) => i.addEventListener('input', () => { updatePriceHint(); refresh(); }));
  useOwner(); updatePriceHint(); refresh();

  const preset = (bn, en, fn) => h('button', { type: 'button', class: 'sample', onclick: () => { fn(); updatePriceHint(); refresh(); } }, T(bn, en));
  const setPlot = (id) => { plotSel.value = id; useOwner(); };

  const submit = async (e) => {
    e.preventDefault(); result.replaceChildren();
    try {
      const r = await api('/deeds', { method: 'POST', body: body() });
      const url = sealUrl(r.hash);
      result.replaceChildren(h('div', { class: 'verdict green pop' }, h('div', { class: 'big' }, icon('stamp')),
        h('div', { class: 'grow' }, h('h2', {}, T('দলিল সিল হয়েছে', 'Deed sealed')),
          h('p', {}, T('জমি এখন লক। নামজারি শেষ না হলে আর বিক্রি করা যাবে না।', 'The plot is now locked. It cannot be sold again until mutation is finished.')),
          h('div', { class: 'grid g2', style: 'margin-top:16px' },
            h('div', {}, h('div', { class: 'qrbox', html: qrSvg(url, { scale: 5 }) }), h('p', { class: 'seal', style: 'margin-top:8px;color:var(--ink)' }, r.hash)),
            h('div', { class: 'stack' },
              h('dl', { class: 'kv' }, h('dt', {}, T('দলিল নং', 'Deed no')), h('dd', {}, r.deed_no), h('dt', {}, T('ট্র্যাকিং', 'Tracking')), h('dd', {}, h('a', { href: '#/mutation/' + r.tracking_id }, r.tracking_id)),
                h('dt', {}, T('নামজারি', 'Mutation')), h('dd', {}, stateChip(r.mutation_state, { bn: r.mutation_state === 'FLAGGED' ? 'কর্মকর্তার নজর প্রয়োজন' : 'স্বয়ংক্রিয় যাচাই সফল', en: r.mutation_state === 'FLAGGED' ? 'Needs officer review' : 'Automatic checks passed' }))),
              riskMeter(r.risk), r.flags.length ? flagList(r.flags) : null,
              h('div', { class: 'row noprint' }, h('a', { class: 'btn sm', href: docUrl(r.hash), download: '' }, icon('download'), T('দলিলের কপি', 'Deed copy')),
                h('button', { class: 'btn ghost sm', type: 'button', onclick: () => window.print() }, icon('print'), T('সিল প্রিন্ট', 'Print seal')),
                h('button', { class: 'btn ghost sm', type: 'button', onclick: () => copyText(url) }, icon('copy'), T('লিংক', 'Link'))))))));
      const fresh = await api('/plots'); fresh.forEach((p) => { byId[p.plot_id] = p; }); useOwner(); refresh();
    } catch (err) { result.replaceChildren(errorBox(err)); refresh(); }
  };

  const alertCard = h('div', { class: 'card' }, h('h3', {}, icon('warn'), ' ', T('সাম্প্রতিক সতর্কতা', 'Recent alerts')),
    alerts.length ? h('ul', { class: 'reasons' }, alerts.slice(0, 6).map((a) => h('li', {}, h('span', { class: `dot ${a.level === 'block' ? 'red' : 'amber'}` }),
      h('div', {}, h('strong', { class: 'mono' }, a.plot_id), ' · ', LL(a.message), h('div', { class: 'small muted' }, fmtDateTime(a.ts)))))) : h('p', { class: 'muted' }, T('কোনো সতর্কতা নেই।', 'No alerts.')));

  return h('div', { class: 'wrap', style: 'padding:32px 20px 0' },
    pageHead(T('দলিল রেজিস্ট্রি', 'Register a deed'), T('আগে নিয়ম চলে, তারপর সিল। জাল বিক্রেতা বা দ্বিতীয় বিক্রি এখানেই আটকে যায়।', 'Rules run first, then the seal. Fake sellers and second sales are stopped here.')),
    h('div', { class: 'grid g2' },
      h('form', { class: 'card', onsubmit: submit },
        h('div', { class: 'samples noprint', style: 'margin:0 0 6px' }, h('span', { class: 'muted small' }, T('চেষ্টা করুন:', 'Try:')),
          preset('স্বাভাবিক বিক্রি', 'Normal sale', () => { setPlot('DHK-UTT-0142'); buyer.value = 'Dummy Buyer B'; price.value = 6000000; }),
          preset('জাল বিক্রেতা', 'Fake seller', () => { setPlot('DHK-UTT-0142'); seller.value = 'Fraud Seller X'; }),
          preset('দ্বিতীয় বিক্রি', 'Second sale', () => { setPlot('DHK-GUL-0309'); }),
          preset('খুব কম দাম', 'Very low price', () => { setPlot('DHK-UTT-0142'); price.value = 500000; }),
          preset('খাস জমি', 'Khas land', () => { setPlot('KHL-DUM-0033'); })),
        h('label', { for: 'plot' }, T('প্লট', 'Plot')), plotSel, plotHint,
        h('label', { for: 'seller' }, T('বিক্রেতা', 'Seller')), seller,
        h('div', { class: 'field-hint' }, T('রেকর্ডের মালিকের নাম আগে থেকে বসানো। বদলে দেখুন কী হয়।', 'Pre-filled with the registered owner. Change it and see what happens.')),
        h('label', { for: 'buyer' }, T('ক্রেতা', 'Buyer')), buyer,
        h('label', { for: 'price' }, T('দাম (টাকা)', 'Price (BDT)')), price, priceHint,
        preview,
        h('div', { class: 'row', style: 'margin-top:18px' }, h('button', { class: 'btn lg full-mobile', type: 'submit' }, icon('stamp'), T('রেজিস্টার ও সিল করুন', 'Register and seal')))),
      alertCard),
    result);
}
