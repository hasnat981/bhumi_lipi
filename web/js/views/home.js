import { h, icon } from '../dom.js';
import { api } from '../api.js';
import { T, fmtNum, shortHash } from '../i18n.js';
import { kindLabel } from './ui.js';

const SAMPLES = [
  ['DHK-UTT-0142', 'green', 'পরিষ্কার জমি', 'Clean plot'], ['DHK-GUL-0309', 'amber', 'নামজারি বাকি', 'Mutation pending'],
  ['CTG-PAT-0120', 'amber', 'দ্রুত হাত বদল', 'Rapid transfers'], ['KHL-DUM-0033', 'red', 'খাস জমি', 'Khas land'], ['SYL-ZKJ-0210', 'red', 'ব্যাংক বন্ধক', 'Bank lien'],
];

export default async function home(_, ctx) {
  const [stats, demo] = await Promise.all([api('/stats').catch(() => null), api('/plots/DHK-UTT-0143').catch(() => null)]);
  const go = (id) => ctx.navigate('/check/' + encodeURIComponent(id.trim().toUpperCase()));
  const input = h('input', { id: 'q', placeholder: 'DHK-UTT-0142', 'aria-label': T('প্লট নম্বর', 'Plot number'), autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
  const form = h('form', { class: 'search', onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) go(input.value); } },
    input, h('button', { class: 'btn', type: 'submit' }, icon('search'), T('যাচাই', 'Check')));

  const chain = h('div', { class: 'chain-art', 'aria-label': T('একটি প্লটের সিল করা ইতিহাস', 'Sealed history of one plot') },
    h('div', { class: 'row small muted', style: 'margin-bottom:14px' }, icon('link'), T('একটি জমির ইতিহাস, একটির সাথে আরেকটি যুক্ত', 'One plot history, each record linked to the last')),
    ...(demo ? demo.history : [{ seq: 1, kind: 'INIT', to: 'Dummy Owner', hash: '0'.repeat(64) }]).map((b) => h('div', { class: 'cblock' },
      h('b', {}, `#${b.seq} ${kindLabel(b.kind)}`, ' → ', b.to), h('span', { class: 'mono' }, T('সিল ', 'seal '), shortHash(b.hash)))),
    h('div', { class: 'chain-stamp-row' },
      h('div', { class: 'stamp' }, T('সিল ✓', 'SEALED ✓'))));

  const stat = (n, bn, en) => h('div', { class: 'card stat' }, h('b', {}, n), h('span', { class: 'muted' }, T(bn, en)));
  const step = (n, ic, bn, en, dbn, den) => h('div', { class: 'card step' }, h('div', { class: 'num' }, n), icon(ic), h('h3', { style: 'margin-top:8px' }, T(bn, en)), h('p', { class: 'muted' }, T(dbn, den)));
  const who = [
    ['stamp', 'সাব-রেজিস্ট্রি অফিস', 'Sub-registry offices', 'দলিল নিবন্ধন ও ডিজিটাল সিল', 'Deed registration & seals'],
    ['file', 'এসি ল্যান্ড অফিস', 'AC Land offices', 'নামজারি ও খতিয়ান হালনাগাদ', 'Mutation & khatian updates'],
    ['bank', 'ব্যাংক ও আর্থিক প্রতিষ্ঠান', 'Banks & lenders', 'বন্ধক যাচাই ও ঋণ ছাড়', 'Lien checks & mortgage'],
    ['shield', 'ভূমি অধিগ্রহণ অফিস', 'Acquisition offices', 'অধিগ্রহণ নোটিশ ও লাল সতর্কতা', 'Acquisition notices & alerts'],
    ['file', 'জরিপ ও রেকর্ড অফিস', 'Survey & records offices', 'CS, SA, RS ও BS সমন্বয়', 'CS, SA, RS, BS records'],
    ['link', 'আদালত ও আইনজীবী', 'Courts and lawyers', 'মামলার স্থিতি ও দলিলের সত্যতা', 'Case status & title verification'],
    ['user', 'নাগরিক ও ক্রেতা', 'Citizens and buyers', 'তাৎক্ষণিক আসল দলিল যাচাই', 'Instant genuineness check'],
    ['stamp', 'রিয়েল এস্টেট ডেভেলপার', 'Real estate developers', 'নিরাপদ জমি ক্রয় ও দায়মুক্তি', 'Due diligence & clean transfers'],
  ];

  return h('div', {},
    h('section', { class: 'hero' }, h('div', { class: 'wrap hero-grid' },
      h('div', {},
        h('div', { class: 'eyebrow' }, icon('shield'), 'LandTech 2026 · P2 + P3 + P5'),
        h('h1', {}, T('জমির কাগজ। ', 'Land papers. '), h('em', {}, T('এখন প্রমাণসহ।', 'Now with proof.'))),
        h('p', { class: 'lead' }, T('১০ সেকেন্ডে জানুন: দলিল আসল কি না, মালিক কে, আর জমি আগেই বিক্রি হয়ে গেছে কি না।',
          'In 10 seconds, find out if a deed is real, who owns the land, and whether it was already sold.')),
        form,
        h('div', { class: 'samples', 'aria-label': T('নমুনা প্লট', 'Sample plots') }, SAMPLES.map(([id, v, bn, en]) =>
          h('button', { class: 'sample', type: 'button', onclick: () => go(id) }, h('span', { class: `dot ${v}` }), T(bn, en)))),
        h('div', { class: 'row', style: 'margin-top:22px; gap:10px; flex-wrap:wrap;' },
          h('a', { class: 'btn ghost', href: '#/verify' }, icon('scan'), T('QR স্ক্যান বা দলিল যাচাই', 'Scan QR or verify a deed')),
          h('a', { class: 'btn ghost', href: '#/lab' }, icon('flask'), T('অ্যাটাক ল্যাব দেখুন', 'See the attack lab')))),
      chain)),
    stats ? h('section', { class: 'band', style: 'padding-top:8px' }, h('div', { class: 'wrap' }, h('div', { class: 'grid g4' },
      stat(fmtNum(stats.records), 'সিল করা রেকর্ড', 'Records sealed'),
      stat(`${fmtNum(stats.chains_ok)}/${fmtNum(stats.plots)}`, 'যাচাই করা প্লট-শিকল', 'Plot chains verified'),
      stat(fmtNum(stats.attacks_stopped), 'আটকানো জালিয়াতি চেষ্টা', 'Fraud attempts stopped'),
      stat(fmtNum(stats.mutations_pending), 'নামজারি অপেক্ষমাণ', 'Mutations pending')))) : null,
    h('section', { class: 'band' }, h('div', { class: 'wrap' },
      h('div', { class: 'sect-head' }, h('h2', {}, T('কীভাবে কাজ করে', 'How it works')), h('p', {}, T('চারটি সহজ ধাপ। রেজিস্ট্রেশন আর নামজারি এখন একই শিকলে।', 'Four simple steps. Registration and mutation now share one chain.'))),
      h('div', { class: 'grid g4' },
        step(1, 'stamp', 'সিল', 'Seal', 'দলিল নিবন্ধন হলে ডিজিটাল সিল তৈরি হয়। অফিসের নিজস্ব চাবিতে সাইন হয়।', 'Registering a deed creates a digital seal, signed with the office key.'),
        step(2, 'link', 'শিকল', 'Chain', 'প্রতিটি দলিল আগেরটির সাথে যুক্ত। পুরোনো রেকর্ড বদলালে পরেরগুলো ভেঙে যায়।', 'Each deed is linked to the one before. Change an old record and the rest break.'),
        step(3, 'lock', 'তালা', 'Lock', 'বিক্রির পর জমি লক। নামজারি শেষ না হলে আবার বিক্রি করা যায় না।', 'After a sale the land is locked. It cannot be sold again until mutation is done.'),
        step(4, 'qr', 'যাচাই', 'Verify', 'ক্রেতা, ব্যাংক বা আদালত ফোন থেকেই QR স্ক্যান করে সত্যতা দেখতে পারেন।', 'Buyers, banks and courts scan the QR on a phone and see the truth.')))),
    h('section', { class: 'band', style: 'padding-top:0' }, h('div', { class: 'wrap' },
      h('div', { class: 'sect-head' }, h('h2', {}, T('কারা ব্যবহার করবেন', 'Who uses it')), h('p', {}, T('দেশজুড়ে আটটি পক্ষ, একই সত্য।', 'Eight groups across the country, one source of truth.'))),
      h('div', { class: 'who-grid' }, who.map(([ic, bn, en, sbn, sen]) =>
        h('div', { class: 'who-card' },
          h('div', { class: 'who-icon' }, icon(ic)),
          h('div', { class: 'who-body' },
            h('strong', { class: 'who-title' }, T(bn, en)),
            h('span', { class: 'who-sub' }, T(sbn, sen)))))),
      h('div', { class: 'row', style: 'margin-top:26px' }, h('a', { class: 'btn lg', href: '#/check' }, T('জমি যাচাই করুন', 'Check a plot'), icon('arrow')),
        h('a', { class: 'btn lg ghost', href: '#/about' }, T('আমাদের পরিচিতি', 'About Bhumi Lipi'))))));
}
