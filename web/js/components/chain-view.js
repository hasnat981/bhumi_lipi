// Chain View component: interconnected block cards with animated link lines,
// cryptographic signatures, full seal inspection, and visible tamper crack states.

import { h, icon, copyText } from '../dom.js';
import { T, fmtDate, fmtMoney, shortHash } from '../i18n.js';
import { docUrl } from '../api.js';
import { kindLabel } from '../views/ui.js';

export function createChainView({ history = [], chain = { ok: true }, plotId = '' } = {}) {
  const container = h('div', { class: 'chain-view-wrapper', 'aria-label': T('মালিকানার ব্লক চেইন', 'Ownership block chain') });

  if (!history.length) {
    container.append(h('p', { class: 'muted' }, T('কোনো রেকর্ড নেই।', 'No records.')));
    return container;
  }

  const list = h('ol', { class: 'timeline chain-cards-list' });

  history.forEach((b, idx) => {
    const isCurrent = b.seq === history.length;
    const isTampered = !chain.ok && b.seq >= chain.first_bad_seq;
    const isFirstBad = !chain.ok && b.seq === chain.first_bad_seq;

    // If this is the broken link position, render the prominent broken connector notice
    if (isFirstBad && idx > 0) {
      const brokenNotice = h('li', { class: 'chain-broken-divider', role: 'alert' },
        h('div', { class: 'broken-connector-badge' },
          icon('brokenLink'),
          h('strong', {}, T('শিকল ভাঙা · সিল গরমিল', 'Chain Broken · Seal Mismatch')),
          h('span', {}, T(`রেকর্ড #${chain.first_bad_seq} এ সিল মিলছে না (${chain.reason || 'altered data'})।`,
            `Seal mismatch at record #${chain.first_bad_seq} (${chain.reason || 'altered data'}).`))));
      list.append(brokenNotice);
    } else if (idx > 0) {
      // Normal animated link line
      const linkConnector = h('li', { class: 'chain-link-connector', 'aria-hidden': 'true' },
        h('div', { class: 'connector-line' }));
      list.append(linkConnector);
    }

    // Block card
    const cardClasses = [
      'chain-card',
      'card',
      isCurrent ? 'is-current' : '',
      isTampered ? 'is-tampered' : '',
      `kind-${b.kind.toLowerCase()}`,
    ].filter(Boolean).join(' ');

    const kindIcons = {
      INIT: 'file',
      SALE: 'stamp',
      REVERSAL: 'arrow',
    };

    // Details expander drawer
    const detailsDrawer = h('div', { class: 'block-details-drawer', hidden: true },
      h('dl', { class: 'kv small', style: 'margin-top:12px;padding-top:10px;border-top:1px dashed var(--line)' },
        b.deed_no ? [h('dt', {}, T('দলিল নম্বর', 'Deed no')), h('dd', { class: 'mono' }, b.deed_no)] : null,
        b.doc_hash ? [h('dt', {}, T('দলিল হ্যাশ', 'Doc hash')), h('dd', { class: 'mono' }, shortHash(b.doc_hash))] : null,
        b.sig ? [h('dt', {}, T('স্বাক্ষর', 'Signature')), h('dd', { class: 'mono' }, b.sig.slice(0, 16) + '…')] : null,
        h('dt', {}, T('পূর্বের সিল', 'Previous seal')), h('dd', { class: 'mono' }, b.prev_hash === '0'.repeat(64) ? T('আদি রেকর্ড (Genesis)', 'Genesis (first block)') : shortHash(b.prev_hash)),
        h('dt', {}, T('পূর্ণ সিল', 'Full seal')), h('dd', { class: 'mono', style: 'font-size:12.5px;word-break:break-all' }, b.hash)),
      h('div', { class: 'row', style: 'margin-top:10px' },
        h('button', { class: 'btn ghost sm', onclick: () => copyText(b.hash) }, icon('copy'), T('সিল কপি', 'Copy seal')),
        h('a', { class: 'btn ghost sm', href: '#/v/' + b.hash }, icon('shield'), T('সিল যাচাই', 'Verify seal')),
        h('a', { class: 'btn ghost sm', href: docUrl(b.hash), download: '' }, icon('download'), T('দলিলের কপি', 'Deed copy'))));

    const toggleBtn = h('button', {
      class: 'chain-toggle-btn iconbtn sm',
      'aria-label': T('বিস্তারিত দেখুন', 'Toggle details'),
      onclick: (e) => {
        e.stopPropagation();
        const isHidden = detailsDrawer.hidden;
        detailsDrawer.hidden = !isHidden;
        toggleBtn.textContent = isHidden ? '▲' : '▼';
      },
    }, '▼');

    const card = h('li', { class: cardClasses },
      // Header row with sequence, kind, chips
      h('div', { class: 'chain-card-header' },
        h('div', { class: 'chain-card-header-left' },
          h('span', { class: 'seq-badge' }, `#${b.seq}`),
          h('span', { class: 'kind-pill' }, icon(kindIcons[b.kind] || 'file'), h('span', {}, kindLabel(b.kind)))),
        h('div', { class: 'chain-card-header-right' },
          isCurrent ? h('span', { class: 'chip green sm' }, icon('check'), T('বর্তমান রেকর্ড', 'Current record')) : null,
          isTampered ? h('span', { class: 'chip red sm' }, icon('crack'), T('ভাঙা রেকর্ড', 'Tampered')) : null,
          toggleBtn)),
      // Parties transfer line
      h('div', { class: 'parties-row' },
        h('strong', { class: 'party-from' }, b.frm || T('নিবন্ধন', 'Origin')),
        h('span', { class: 'transfer-arrow' }, ' → '),
        h('strong', { class: 'party-to' }, b.to)),
      // Meta row: date, price, office
      h('div', { class: 'chain-meta-row' },
        h('span', { class: 'when' }, fmtDate(b.ts)),
        b.price_bdt ? h('span', { class: 'price' }, `· ${fmtMoney(b.price_bdt)}`) : null,
        h('span', { class: 'office-chip' }, `· ${b.office_id}`),
        h('span', { class: 'signed-chip' }, `✓ Signed`)),
      // Short seal row
      h('div', { class: 'seal-row' },
        h('span', { class: 'seal mono' }, T('সিল: ', 'Seal: '), h('code', {}, shortHash(b.hash))),
        h('div', { class: 'chain-actions noprint' },
          h('a', { class: 'btn ghost sm', href: '#/v/' + b.hash }, icon('shield'), T('যাচাই', 'Verify')),
          h('a', { class: 'btn ghost sm', href: docUrl(b.hash), download: '' }, icon('download'), T('কপি', 'Copy')))),
      detailsDrawer);

    list.append(card);
  });

  container.append(list);
  return container;
}
