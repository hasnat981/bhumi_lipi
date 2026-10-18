// Guided Demo Tour (Judge mode)
// 10-step interactive walkthrough taking judges through journeys J1 to J9 with automatic route and role management.

import { h, icon } from '../dom.js';
import { T, setRole } from '../i18n.js';

const TOUR_STEPS = [
  {
    step: 1,
    route: '#/',
    role: 'citizen',
    targetSel: '#q, .search',
    titleBn: '১. দ্রুত জমি যাচাই',
    titleEn: '1. Instant Plot Check',
    textBn: 'যেকোনো প্লট নম্বর লিখুন। অথবা নিচে প্রস্তুত রাখা যেকোনো নমুনা প্লট বেছে নিন।',
    textEn: 'Type any plot number. Or pick one of our live synthetic sample plots below.',
  },
  {
    step: 2,
    route: '#/check/DHK-UTT-0142',
    role: 'citizen',
    targetSel: '.verdict',
    titleBn: '২. নিষ্কণ্টক জমি (সবুজ সিল)',
    titleEn: '2. Clean Plot (Green Genuine Seal)',
    textBn: 'সবুজ মানে: দলিল খাঁটি, ডিজিটাল সিল মিলেছে, কোনো খাস বা বন্ধক সংক্রান্ত সমস্যা নেই।',
    textEn: 'Green means: genuine deed, digital seals match, no government claims or mortgages.',
  },
  {
    step: 3,
    route: '#/check/DHK-GUL-0309',
    role: 'citizen',
    targetSel: '.verdict',
    titleBn: '৩. নামজারি বাকি (হলুদ সতর্কতা)',
    titleEn: '3. Mutation Pending (Amber Caution)',
    textBn: 'হলুদ মানে: জমি বিক্রি হয়েছে কিন্তু নামজারি প্রক্রিয়া এখনো শেষ হয়নি। জমি স্বয়ংক্রিয়ভাবে লক।',
    textEn: 'Amber means: land was sold but mutation is pending. Plot is locked against double sale.',
  },
  {
    step: 4,
    route: '#/verify',
    role: 'citizen',
    targetSel: '.tabs',
    titleBn: '৪. ক্রিপ্টোগ্রাফিক জালিয়াতি পরীক্ষা',
    titleEn: '4. Cryptographic Tamper Test',
    textBn: '"জাল করে দেখুন" ট্যাবে একটিমাত্র অক্ষর পরিবর্তন করলে পুরো ফিঙ্গারপ্রিন্ট আমূল বদলে যায়।',
    textEn: 'In "Try to cheat", modifying even a single character causes a total hash avalanche.',
  },
  {
    step: 5,
    route: '#/registrar',
    role: 'registrar',
    targetSel: '.card',
    titleBn: '৫. ভুয়া বিক্রেতা প্রতিরোধ',
    titleEn: '5. Fake Seller Blocked',
    textBn: 'রেজিস্ট্রার ডেস্কে ভুয়া বিক্রেতার নাম বসানোর সাথে সাথেই প্রিভিউতে লাল সতর্কতায় বিক্রি আটকে যায়।',
    textEn: 'On Registrar Desk, trying a fake seller is instantly blocked before any deed can be made.',
  },
  {
    step: 6,
    route: '#/registrar',
    role: 'registrar',
    targetSel: '.btn.lg, button[type="submit"]',
    titleBn: '৬. সিল ও QR কোড তৈরি',
    titleEn: '6. Sealed Record & QR Generation',
    textBn: 'আসল বিক্রিতে Ed25519 সিল এবং যাচাইযোগ্য অফিশিয়াল QR কোড তৈরি হয়। জমি সাথে সাথে লক হয়।',
    textEn: 'A valid sale is sealed with the registrar key, generates a QR, and locks the plot.',
  },
  {
    step: 7,
    route: '#/mutation',
    role: 'ac_land',
    targetSel: '.card',
    titleBn: '৭. এসি ল্যান্ড ও নামজারি অনুমোদন',
    titleEn: '7. AC Land Mutation Approval',
    textBn: 'এসি ল্যান্ড কর্মকর্তা ৮টি স্বয়ংক্রিয় পরীক্ষা দেখে অনুমোদন দিলে জমির লক খুলে বিক্রিযোগ্য হয়।',
    textEn: 'The AC Land officer reviews 8 automated checks; approving unlocks the plot for future sale.',
  },
  {
    step: 8,
    route: '#/bank',
    role: 'bank',
    targetSel: '.card',
    titleBn: '৮. ব্যাংক লিয়েন ও দ্বৈত বন্ধক রোধ',
    titleEn: '8. Bank Lien & Double Mortgage Shield',
    textBn: 'একই জমি একই সাথে একাধিক ব্যাংকে বন্ধক রাখা অসম্ভব—দ্বিতীয় বন্ধক সাথে সাথে ব্লক হয়।',
    textEn: 'Taking land as collateral checks registered liens; a double mortgage is blocked instantly.',
  },
  {
    step: 9,
    route: '#/integrity',
    role: 'citizen',
    targetSel: '.card',
    titleBn: '৯. পাবলিক মের্কেল অ্যাংকর প্রমাণ',
    titleEn: '9. Independent Browser Proof',
    textBn: 'আমাদের সার্ভার বিশ্বাস করার প্রয়োজন নেই; ব্রাউজার নিজেই Web Crypto দিয়ে মের্কেল রুট প্রমাণ যাচাই করে।',
    textEn: 'No need to trust our server; your browser independently verifies the Merkle inclusion proof.',
  },
  {
    step: 10,
    route: '#/lab',
    role: 'citizen',
    targetSel: '.btn',
    titleBn: '১০. অ্যাটাক ল্যাব (৫টি আক্রমণ)',
    titleEn: '10. Attack Lab (5 Attacks)',
    textBn: 'আমরা সিস্টেমের উপর ৫ ধরনের আক্রমণ চালাই: ৪টি সক্রিয়ভাবে আটকানো এবং ১টি অভ্যন্তরীণ পুনর্লিখন নিশ্চিত ধরা পড়ে।',
    textEn: 'We attack our own registry: 4 attacks are stopped, and 1 insider rewrite is guaranteed caught.',
  },
];

let currentStepIndex = 0;
let tourOverlay = null;

export function startTour(ctx) {
  currentStepIndex = 0;
  showStep(currentStepIndex, ctx);
}

function showStep(index, ctx) {
  if (index < 0 || index >= TOUR_STEPS.length) {
    endTour();
    return;
  }
  currentStepIndex = index;
  const s = TOUR_STEPS[index];

  // Set role and navigate if needed
  setRole(s.role);
  if (location.hash !== s.route) {
    location.hash = s.route;
  }
  ctx.rerender();

  setTimeout(() => {
    renderTourModal(s, ctx);
  }, 350);
}

function renderTourModal(s, ctx) {
  tourOverlay?.remove();

  const total = TOUR_STEPS.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === total - 1;

  const prevBtn = h('button', {
    class: 'btn ghost sm',
    disabled: isFirst,
    onclick: () => showStep(currentStepIndex - 1, ctx),
  }, '← ', T('আগের', 'Back'));

  const nextBtn = h('button', {
    class: 'btn sm',
    onclick: () => showStep(currentStepIndex + 1, ctx),
  }, isLast ? T('সম্পন্ন', 'Finish') : T('পরবর্তী', 'Next'), ' →');

  const skipBtn = h('button', {
    class: 'btn ghost sm',
    onclick: () => endTour(),
  }, T('বাদ দিন', 'Skip'));

  const popover = h('div', { class: 'tour-popover card' },
    h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:8px' },
      h('span', { class: 'chip gold sm' }, `${currentStepIndex + 1} / ${total}`),
      skipBtn),
    h('h3', { style: 'margin-bottom:6px' }, T(s.titleBn, s.titleEn)),
    h('p', { class: 'muted small', style: 'margin-bottom:14px;line-height:1.55' }, T(s.textBn, s.textEn)),
    h('div', { class: 'row', style: 'justify-content:space-between' },
      prevBtn,
      nextBtn));

  const overlay = h('div', { class: 'tour-overlay', onclick: (e) => { if (e.target === overlay) endTour(); } },
    popover);

  tourOverlay = overlay;
  document.body.append(overlay);

  // Keyboard navigation
  const onKey = (e) => {
    if (e.key === 'ArrowRight') showStep(currentStepIndex + 1, ctx);
    else if (e.key === 'ArrowLeft' && currentStepIndex > 0) showStep(currentStepIndex - 1, ctx);
    else if (e.key === 'Escape') endTour();
  };
  window.addEventListener('keydown', onKey, { once: true });
}

export function endTour() {
  tourOverlay?.remove();
  tourOverlay = null;
  localStorage.setItem('bl.tour_done', '1');
}
