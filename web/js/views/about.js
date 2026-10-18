import { h, icon } from '../dom.js';
import { T } from '../i18n.js';
import { pageHead } from './ui.js';

const STAGES = [
  ['১. পাইলট', '1. Pilot', 'একটি সাব-রেজিস্ট্রি ও এসি ল্যান্ড অফিস', 'One sub-registry office with its AC Land office', 'অফিসভিত্তিক হার্ডওয়্যার চাবি, কর্মকর্তাদের প্রশিক্ষণ, বর্তমান প্রক্রিয়ার সাথে সমান্তরাল পরীক্ষণ।', 'Hardware keys per office, officer training, parallel run beside the existing process, review by staff and experts.'],
  ['২. জেলা', '2. District', 'এক জেলার সব অফিস', 'All offices in one district', 'PostgreSQL, ভূমিকা-ভিত্তিক আসল লগইন, মনিটরিং, অফলাইন-ভেরিফায়েবল QR ও PWA মোড, SMS/USSD।', 'PostgreSQL, role-based real login, monitoring, offline-verifiable QR and low-bandwidth/PWA mode, SMS/USSD.'],
  ['৩. বিভাগ', '3. Division', 'কয়েকটি জেলা ও মন্ত্রণালয়', 'Several districts', 'জাতীয় আইডি ও বিদ্যমান ই-নামজারি পোর্টালে সংযুক্তি; তিন অফিসের সাক্ষী স্বাক্ষরে অ্যাংকর।', 'Integration with national ID and existing land portals; witness co-signing of anchors by three offices.'],
  ['৪. জাতীয়', '4. National', 'সারাদেশের সব ভূমি অফিস', 'All offices nationwide', 'উন্মুক্ত পাবলিক অ্যাংকর, সর্বসাধারণের জন্য স্বাধীন ভেরিফায়ার এবং বাংলা OCR-সহ পুরোনো খতিয়ান ডিজিটাইজ।', 'Shared public anchor, independent verifier for the public, scheduled digitization of old records with Bangla OCR.']
];

const LIMITS = [
  ['একটি ডাটাবেসের হ্যাশ-শিকল "ছোঁয়া গেলে ধরা পড়ে" (tamper-evident), "অভেদ্য" নয়।', 'A single-operator hash chain is tamper-evident, not magically tamper-proof.'],
  ['চাবি চুরি বা ভেতরের লোকের ঝুঁকি আছে। উত্তর: অফিসভিত্তিক চাবি, পাবলিক দৈনিক অ্যাংকর, স্বাধীন ভেরিফায়ার, পরে একাধিক অফিসের সাক্ষী নোড।', 'Key theft and insiders are real risks. Answer: per-office keys, a public daily anchor, an independent verifier, later multi-office witness nodes.'],
  ['ডেমো ভূমিকা আসল লগইন নয়। আসল সিস্টেমে জাতীয় ডিজিটাল আইডি ও হার্ডওয়্যার চাবি লাগবে।', 'Demo roles are not real login. Production needs national digital ID and hardware-held keys.'],
  ['পুরোনো কাগুজে রেকর্ড ডিজিটাইজ (OCR) এখনও করা হয়নি। এটি রোডম্যাপে।', 'Digitizing old paper records (OCR) is not built yet. It is on the roadmap.'],
];

const TECH_ITEMS = [
  {
    title: ['ব্রাউজার ও ফ্রন্টএন্ড', 'Browser & Frontend'],
    desc: ['ভ্যানিলা জাভাস্ক্রিপ্ট (কোনো বিল্ড স্টেপ নেই), বাংলা ও ইংরেজি ইন্টারফেস, প্রবীণদের জন্য সহজ মোড এবং কঠোর Content Security Policy (CSP)।',
           'Vanilla JavaScript with zero build step, bilingual UI (Bangla & English), accessible Simple mode for elders, and strict Content Security Policy.'],
    badge: 'Vanilla JS',
    iconName: 'file'
  },
  {
    title: ['সার্ভার ও এপিআই', 'Server & REST API'],
    desc: ['পাইথন স্ট্যান্ডার্ড লাইব্রেরি (http.server), ফ্রেমওয়ার্ক-হীন পিওর পাইথন সার্ভিস লেয়ার, ডেমো ভূমিকা এবং স্লাইডিং-উইন্ডো রেট লিমিট।',
           'Python 3 standard library HTTP server, framework-free pure Python service layer, demo roles, and sliding-window rate limiting.'],
    badge: 'Python 3',
    iconName: 'terminal'
  },
  {
    title: ['ক্রিপ্টোগ্রাফিক সুরক্ষা', 'Cryptographic Security'],
    desc: ['SHA-256 হ্যাশ-শিকল, অফিসভিত্তিক Ed25519 ডিজিটাল স্বাক্ষর, দৈনিক পাবলিক মের্কেল ট্রি রুট এবং ইন-ব্রাউজার প্রমাণ যাচাই।',
           'SHA-256 hash chains, per-office Ed25519 digital signatures, daily public Merkle tree root, and in-browser cryptographic proofs.'],
    badge: 'Ed25519 · Hash',
    iconName: 'shield'
  },
  {
    title: ['ডাটাবেস ও চেইন গার্ড', 'Database & Chain Guard'],
    desc: ['SQLite (পরবর্তীতে PostgreSQL), ব্লক ও অডিট লগে অ্যাপেন্ড-অনলি ডাটাবেস ট্রিগার এবং ইতিহাস পরিবর্তন রোধে স্বয়ংক্রিয় চেইন-গার্ড।',
           'SQLite (PostgreSQL planned), append-only triggers on blocks & audit logs, and automatic chain-guard protection against tampering.'],
    badge: 'SQLite · Triggers',
    iconName: 'database'
  },
  {
    title: ['১১টি ব্যাখ্যামূলক নিয়ম', '11 Explainable Fraud Rules'],
    desc: ['ভুয়া বিক্রেতা, খাস জমি, দ্রুত হাতবদল, বন্ধক ও সার্ভে অসঙ্গতি শনাক্তকরণে ১১টি পিওর-ফাংশন রুলস; প্রতিটি সিদ্ধান্তের স্পষ্ট কারণ প্রদর্শন।',
           '11 pure-function rules catching fake sellers, khas land, rapid transfers, liens, and survey mismatches with explainable bilingual reasons.'],
    badge: '11 Pure Rules',
    iconName: 'lock'
  },
  {
    title: ['ডিপ্লয়মেন্ট ও স্বাধীন অডিট', 'Deployment & Independent Audit'],
    desc: ['ডকার, Render.yaml, সিআই অটোমেশন (৫৩টি টেস্ট), সার্ভার ছাড়া যাচাইয়ের স্বাধীন স্ক্রিপ্ট (verify_anchor.py) এবং ৫-স্তরের আক্রমণ ল্যাব।',
           'Docker, Render.yaml, CI automated test suite (53/53 tests pass), standalone verifier script (verify_anchor.py), and 5-way attack lab.'],
    badge: 'Docker · CI · Tests',
    iconName: 'flask'
  }
];

export default async function about() {
  const flow = ['রেজিস্টার|Register', 'সিল|Seal', 'তালা|Lock', 'নামজারি|Mutation', 'যাচাই|Check'];
  return h('div', { class: 'wrap', style: 'padding:32px 20px 0' },
    pageHead(T('ভূমি লিপি সম্পর্কে', 'About Bhumi Lipi'), T('একটি সমস্যা, গভীরভাবে সমাধান: দলিল ও মালিকানা যাচাই (P2), সাথে জালিয়াতি রোধ (P3), নামজারি (P4) ও ক্রেতার যাচাই (P5)।', 'One problem solved deeply: deed and ownership verification (P2), plus fraud rules (P3), mutation (P4) and buyer check (P5).')),
    h('div', { class: 'card' }, h('h3', {}, T('একটি জীবনচক্র, দুই অফিস', 'One lifecycle, two offices')),
      h('p', { class: 'muted' }, T('আজ রেজিস্ট্রেশন (সাব-রেজিস্ট্রি) আর নামজারি (এসি ল্যান্ড) আলাদা কাগজে, আলাদা অফিসে। ভূমি লিপিতে এগুলো একই সিল করা শিকল।', 'Today registration (sub-registry) and mutation (AC Land) are separate papers in separate offices. In Bhumi Lipi they are one sealed chain.')),
      h('div', { class: 'flow-row' }, flow.map((s, i) => [
        h('span', { class: 'flow-pill' },
          h('span', { class: 'flow-num' }, String(i + 1)),
          h('span', { class: 'flow-text' }, T(...s.split('|')))
        ),
        i < flow.length - 1 ? h('span', { class: 'flow-arrow' }, icon('arrow')) : null
      ]))),
    h('div', { class: 'card', style: 'margin-top:18px' },
      h('h3', { style: 'margin-bottom:14px' }, T('ব্যবহৃত মূল প্রযুক্তি', 'Core technologies')),
      h('div', { class: 'grid tech-grid' }, TECH_ITEMS.map((item) =>
        h('div', { class: 'tech-card' },
          h('div', { class: 'tech-header' },
            h('div', { class: 'tech-header-left' },
              icon(item.iconName),
              h('span', { class: 'tech-title' }, T(item.title[0], item.title[1]))
            ),
            h('span', { class: 'tech-badge' }, item.badge)
          ),
          h('p', { class: 'tech-desc' }, T(item.desc[0], item.desc[1]))
        )
      ))),
    h('div', { class: 'card', style: 'margin-top:18px' },
      h('h3', { style: 'margin-bottom:10px' }, T('সারাদেশে বাস্তবায়নের ৪ ধাপ', 'Plan for countrywide implementation')),
      h('div', { class: 'stages-grid' },
        STAGES.map(([stBn, stEn, scBn, scEn, wBn, wEn]) =>
          h('div', { class: 'stage-card' },
            h('div', { class: 'stage-header' },
              h('strong', { class: 'stage-badge' }, T(stBn, stEn)),
              h('span', { class: 'stage-scope muted' }, T(scBn, scEn))),
            h('p', { class: 'stage-work' }, T(wBn, wEn)))))),
    h('div', { class: 'grid g2', style: 'margin-top:18px' },
      h('div', { class: 'card' }, h('h3', {}, T('আমরা নিজেরাই যা বলি: সীমাবদ্ধতা', 'Honest limits (we say them first)')),
        h('ul', { class: 'reasons' }, LIMITS.map(([bn, en]) => h('li', {}, h('span', { class: 'dot amber' }), h('div', {}, T(bn, en)))))),
      h('div', { class: 'card' }, h('h3', {}, T('ডেটা ও প্রযুক্তি নীতি', ['Data ', h('span', { class: 'sans-amp' }, '&'), ' technology disclosure'])),
        h('ul', { class: 'reasons' },
          h('li', {}, icon('shield'), h('div', {}, T('১০০% সিন্থেটিক ডেটা। কোনো আসল নাম, এনআইডি, ফোন বা সরকারি রেকর্ড নেই। কোনো স্ক্র্যাপিং বা সরকারি সিস্টেম পরীক্ষা করা হয়নি।', '100% synthetic data. No real names, NID, phone numbers or land records. No scraping or testing of government systems.'))),
          h('li', {}, icon('file'), h('div', {}, T('ওপেন সোর্স পাইথন ও ক্রিপ্টোগ্রাফি: Python standard library, cryptography (Ed25519/SHA-256), SQLite triggers, vanilla JS frontend.', 'Open-source Python & cryptography: standard library, cryptography (Ed25519/SHA-256), SQLite triggers, vanilla JS frontend.')))))));
}
