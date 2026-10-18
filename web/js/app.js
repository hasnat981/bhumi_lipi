// App shell + hash router. Each page is a module in views/ that exports a default async function.
import { h, $, clear, icon, skeleton } from './dom.js';
import { state, loadState, setLang, setRole, setTheme, setSize, T } from './i18n.js';
import { initCommandPaletteShortcuts } from './components/command-palette.js';
import { initGlobalAssistant } from './components/ai-assistant.js';

const VER = '1.0.1';
const ROUTES = [
  [/^\/$/, 'home', () => import(`./views/home.js?v=${VER}`)],
  [/^\/ai$/, 'ai', () => import(`./views/ai.js?v=${VER}`)],
  [/^\/assistant$/, 'ai', () => import(`./views/ai.js?v=${VER}`)],
  [/^\/check(?:\/([^/]+))?$/, 'check', () => import(`./views/check.js?v=${VER}`)],
  [/^\/verify$/, 'verify', () => import(`./views/verify.js?v=${VER}`)],
  [/^\/v\/([0-9a-fA-F]{64})$/, 'verify', () => import(`./views/verify.js?v=${VER}`)],
  [/^\/registrar$/, 'registrar', () => import(`./views/registrar.js?v=${VER}`)],
  [/^\/mutation(?:\/([^/]+))?$/, 'mutation', () => import(`./views/mutation.js?v=${VER}`)],
  [/^\/bank$/, 'bank', () => import(`./views/bank.js?v=${VER}`)],
  [/^\/integrity$/, 'integrity', () => import(`./views/integrity.js?v=${VER}`)],
  [/^\/lab$/, 'lab', () => import(`./views/lab.js?v=${VER}`)],
  [/^\/about$/, 'about', () => import(`./views/about.js?v=${VER}`)],
];
const PRIMARY_NAV = [
  ['ai', '/ai', 'এআই সহকারী', 'AI Assistant'],
  ['check', '/check', 'জমি দেখুন', 'Check'],
  ['verify', '/verify', 'দলিল যাচাই', 'Verify'],
  ['about', '/about', 'পরিচিতি', 'About'],
];

const TOOLS_NAV = [
  { id: 'integrity', path: '/integrity', bn: 'লেজার সুরক্ষা', en: 'Integrity', subBn: 'ব্লকচেইন ও টেম্পার-প্রুফ লেজার', subEn: 'Tamper-evident chain & root', ic: 'shield' },
  { id: 'registrar', path: '/registrar', bn: 'রেজিস্ট্রার', en: 'Registrar', subBn: 'দলিল নিবন্ধন ও ডিজিটাল সিল', subEn: 'Deed registration & seal', ic: 'user' },
  { id: 'mutation', path: '/mutation', bn: 'নামজারি', en: 'Mutation', subBn: 'ডিজিটাল ই-নামজারি ট্র্যাকিং', subEn: 'Tracking & approval', ic: 'clock' },
  { id: 'bank', path: '/bank', bn: 'ব্যাংক লিয়েন', en: 'Bank Lien', subBn: 'বন্ধক ও দ্বৈত ঋণ প্রতিরোধ', subEn: 'Mortgages & double lien', ic: 'bank' },
  { id: 'lab', path: '/lab', bn: 'অ্যাটাক ল্যাব', en: 'Attack Lab', subBn: '৫টি ভূমি জালিয়াতি ডেমো', subEn: 'Fraud shield simulations', ic: 'flask' },
];

const NAV = [
  ...PRIMARY_NAV,
  ...TOOLS_NAV.map(t => [t.id, t.path, t.bn, t.en]),
];
const ROLE_LABELS = { citizen: ['নাগরিক', 'Citizen'], registrar: ['সাব-রেজিস্ট্রার', 'Sub-registrar'], ac_land: ['এসি ল্যান্ড', 'AC Land'], bank: ['ব্যাংক', 'Bank'] };

let current = 'home', leaveFns = [], token = 0;
export const navigate = (path) => { location.hash = '#' + path; };
const ctx = { onLeave: (fn) => leaveFns.push(fn), navigate, rerender: () => route() };

if (typeof window !== 'undefined' && !window._headerClickListenerAttached) {
  window._headerClickListenerAttached = true;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tools-dropdown-box')) {
      const tp = document.getElementById('tools-popover');
      if (tp) tp.classList.remove('is-open');
    }
    if (!e.target.closest('.settings-dropdown-box')) {
      const sp = document.getElementById('settings-popover');
      if (sp) sp.classList.remove('is-open');
    }
    if (!e.target.closest('.role-select-box')) {
      const rp = document.getElementById('role-popover');
      if (rp) rp.classList.remove('is-open');
    }
  });
}

let moreSheetEl = null;
let moreBackdropEl = null;

function closeMoreSheet() {
  if (moreSheetEl) moreSheetEl.classList.remove('is-open');
  if (moreBackdropEl) moreBackdropEl.classList.remove('is-open');
}

function openMoreSheet() {
  if (!moreSheetEl || !moreBackdropEl) return;
  renderMoreSheetContent();
  moreSheetEl.classList.add('is-open');
  moreBackdropEl.classList.add('is-open');
}

function toggleMoreSheet() {
  if (moreSheetEl && moreSheetEl.classList.contains('is-open')) closeMoreSheet();
  else openMoreSheet();
}

function renderMoreSheetContent() {
  if (!moreSheetEl) return;
  clear(moreSheetEl);

  const moreItems = [
    { id: 'integrity', path: '/integrity', bn: 'লেজার সুরক্ষা', en: 'Integrity', subBn: 'ব্লকচেইন ও টেম্পার-প্রুফ লেজার', subEn: 'Tamper-evident chain & root', ic: 'shield' },
    { id: 'registrar', path: '/registrar', bn: 'রেজিস্ট্রার', en: 'Registrar', subBn: 'দলিল নিবন্ধন ও ডিজিটাল সিল', subEn: 'Deed registration & seal', ic: 'user' },
    { id: 'mutation', path: '/mutation', bn: 'নামজারি', en: 'Mutation', subBn: 'ডিজিটাল ই-নামজারি ট্র্যাকিং', subEn: 'Tracking & approval', ic: 'clock' },
    { id: 'bank', path: '/bank', bn: 'ব্যাংক লিয়েন', en: 'Bank Lien', subBn: 'বন্ধক ও দ্বৈত ঋণ প্রতিরোধ', subEn: 'Mortgages & double lien', ic: 'bank' },
    { id: 'lab', path: '/lab', bn: 'অ্যাটাক ল্যাব', en: 'Attack Lab', subBn: '৫টি ভূমি জালিয়াতি ডেমো', subEn: 'Fraud shield simulations', ic: 'flask' },
    { id: 'ai', path: '/ai', bn: 'এআই সহকারী', en: 'AI Assistant', subBn: 'ভূমি লিপি এআই মডেল', subEn: 'Bhumi Lipi AI Model', ic: 'bot' },
  ];

  moreSheetEl.append(
    h('div', { class: 'more-sheet-handle' }),
    h('div', { class: 'more-sheet-head' },
      h('h3', {}, T('আরও সেবা ও ফিচার', 'More Features & Services')),
      h('button', {
        class: 'iconbtn sm',
        type: 'button',
        'aria-label': T('বন্ধ করুন', 'Close'),
        onclick: closeMoreSheet
      }, icon('close'))),
    h('div', { class: 'more-sheet-grid' },
      moreItems.map((item) =>
        h('a', {
          href: '#' + item.path,
          class: `more-sheet-item ${current === item.id ? 'is-active' : ''}`,
          onclick: (e) => {
            e.preventDefault();
            closeMoreSheet();
            navigate(item.path);
          }
        },
          icon(item.ic),
          h('div', { class: 'more-sheet-item-text' },
            h('span', { class: 'more-sheet-item-title' }, T(item.bn, item.en)),
            h('small', { class: 'more-sheet-item-sub' }, T(item.subBn, item.subEn))))))
  );
}

function shell() {
  const top = clear($('#top'));

  const brand = h('a', { class: 'brand', href: '#/', 'aria-label': 'Bhumi Lipi home' },
    h('img', { src: '/assets/logo.png', alt: 'Bhumi Lipi', class: 'brand-logo-img' }),
    h('div', { class: 'brand-text' },
      h('span', { class: 'brand-title' }, 'ভূমি লিপি'),
      h('small', { class: 'brand-sub' }, 'BHUMI LIPI')));

  const isToolActive = TOOLS_NAV.some(t => t.id === current);
  const toolsPopover = h('div', { class: 'tools-menu-popover', id: 'tools-popover' },
    TOOLS_NAV.map((item) =>
      h('a', {
        href: '#' + item.path,
        class: `tools-popover-item ${current === item.id ? 'is-active' : ''}`,
        onclick: (e) => {
          e.preventDefault();
          toolsPopover.classList.remove('is-open');
          navigate(item.path);
        }
      },
        icon(item.ic),
        h('div', { class: 'tools-popover-text' },
          h('span', { class: 'tools-popover-title' }, T(item.bn, item.en)),
          h('small', { class: 'tools-popover-sub' }, T(item.subBn, item.subEn))))));

  const toolsBtn = h('button', {
    class: `nav-link nav-menu-btn tools-dropdown-btn ${isToolActive ? 'is-active' : ''}`,
    id: 'tools-dropdown-btn',
    type: 'button',
    'aria-expanded': 'false',
    'aria-haspopup': 'true',
    onclick: (e) => {
      e.stopPropagation();
      const isOpen = toolsPopover.classList.toggle('is-open');
      toolsBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const sp = document.getElementById('settings-popover');
      if (sp) sp.classList.remove('is-open');
      const rp = document.getElementById('role-popover');
      if (rp) rp.classList.remove('is-open');
    }
  },
    icon('grid'),
    h('span', { class: 'tools-btn-label' }, T('মেনু', 'Menu')),
    icon('chevronDown'));

  const toolsBox = h('div', { class: 'dropdown-wrapper menu-dropdown-box tools-dropdown-box' }, toolsBtn, toolsPopover);

  const nav = h('nav', { class: 'nav primary-nav', 'aria-label': T('প্রধান মেনু', 'Main menu') },
    PRIMARY_NAV.map(([id, path, bn, en]) =>
      h('a', {
        href: '#' + path,
        id: id === 'ai' ? 'header-ai-btn' : null,
        class: `nav-link ${id === 'ai' ? 'nav-ai-pill' : ''} ${id === current ? 'is-active' : ''}`,
        'aria-current': id === current ? 'page' : null
      }, T(bn, en))),
    toolsBox);

  const roleIcons = {
    citizen: 'user',
    registrar: 'stamp',
    ac_land: 'file',
    bank: 'bank'
  };
  const roleSubs = {
    citizen: ['নাগরিক সেবা ও অনুসন্ধান', 'Title search & verify'],
    registrar: ['দলিল নিবন্ধন ও ডিজিটাল সিল', 'Deed registration & seal'],
    ac_land: ['নামজারি ও খতিয়ান হালনাগাদ', 'Mutation & khatian update'],
    bank: ['বন্ধক যাচাই ও ঋণ ছাড়', 'Mortgages & lien clearance']
  };

  const rolePopover = h('div', { class: 'role-menu-popover', id: 'role-popover' },
    Object.entries(ROLE_LABELS).map(([v, l]) =>
      h('button', {
        type: 'button',
        class: `role-popover-item ${state.role === v ? 'is-active' : ''}`,
        onclick: (e) => {
          e.stopPropagation();
          rolePopover.classList.remove('is-open');
          setRole(v);
          if (roleSel) roleSel.value = v;
          shell();
          route();
        }
      },
        icon(roleIcons[v] || 'user'),
        h('div', { class: 'role-popover-text' },
          h('span', { class: 'role-popover-title' }, T(l[0], l[1])),
          h('small', { class: 'role-popover-sub' }, T(roleSubs[v][0], roleSubs[v][1]))),
        state.role === v ? icon('check', 'role-popover-check') : null)));

  const roleBtn = h('button', {
    class: 'header-pill-btn role-dropdown-btn',
    id: 'role-dropdown-btn',
    type: 'button',
    'aria-expanded': 'false',
    'aria-haspopup': 'true',
    onclick: (e) => {
      e.stopPropagation();
      const isOpen = rolePopover.classList.toggle('is-open');
      roleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const sp = document.getElementById('settings-popover');
      if (sp) sp.classList.remove('is-open');
      const tp = document.getElementById('tools-popover');
      if (tp) tp.classList.remove('is-open');
    }
  },
    icon(roleIcons[state.role] || 'user'),
    h('span', { class: 'role-btn-label' }, T(ROLE_LABELS[state.role][0], ROLE_LABELS[state.role][1])),
    icon('chevronDown'));

  const roleSel = h('select', {
    id: 'role',
    class: 'visually-hidden-select',
    'aria-label': T('ডেমো ভূমিকা', 'Demo role'),
    tabindex: '-1',
    onchange: (e) => { setRole(e.target.value); shell(); route(); }
  },
    Object.entries(ROLE_LABELS).map(([v, l]) => h('option', { value: v, selected: v === state.role }, T(l[0], l[1]))));

  const roleBox = h('div', { class: 'dropdown-wrapper role-select-box' }, roleBtn, rolePopover, roleSel);

  const langBtn = h('button', {
    class: 'header-pill-btn lang-pill-btn',
    id: 'langbtn',
    type: 'button',
    'aria-label': T('ভাষা বদলান', 'Switch language'),
    title: T('ভাষা বদলান', 'Switch language'),
    onclick: () => { setLang(state.lang === 'bn' ? 'en' : 'bn'); shell(); route(); }
  },
    h('span', { class: state.lang === 'bn' ? 'lang-cur' : 'lang-dim' }, 'বাং'),
    h('span', { class: 'lang-divider' }, '|'),
    h('span', { class: state.lang === 'en' ? 'lang-cur' : 'lang-dim' }, 'EN'));

  const isDark = state.theme === 'dark';
  const themeBtn = h('button', {
    class: 'iconbtn',
    id: 'themebtn',
    type: 'button',
    'aria-label': isDark ? T('উজ্জ্বল মোডে যান', 'Switch to bright mode') : T('ডার্ক মোডে যান', 'Switch to dark mode'),
    title: isDark ? T('উজ্জ্বল মোড', 'Bright mode') : T('ডার্ক মোড', 'Dark mode'),
    onclick: () => {
      setTheme(isDark ? 'light' : 'dark');
      shell();
    }
  }, icon(isDark ? 'sun' : 'moon'));

  const sizeBtn = h('button', {
    class: 'iconbtn',
    id: 'sizebtn',
    type: 'button',
    'data-size': state.size,
    'aria-label': T(`লেখার আকার: ${state.size}%`, `Text size: ${state.size}%`),
    title: T('লেখার আকার', 'Text size'),
    onclick: () => { setSize({ 100: '125', 125: '150', 150: '100' }[state.size]); shell(); }
  }, h('span', { style: 'font-weight:700' }, 'A', h('small', { style: 'font-size:.7em' }, state.size === '100' ? 'a' : '+')));

  const isHighContrast = document.documentElement.getAttribute('data-contrast') === 'high';
  const contrastBtn = h('button', {
    class: 'iconbtn',
    id: 'contrastbtn',
    type: 'button',
    'aria-label': T('উচ্চ কনট্রাস্ট', 'High contrast'),
    title: T('উচ্চ কনট্রাস্ট', 'High contrast'),
    onclick: () => {
      const isHigh = document.documentElement.getAttribute('data-contrast') === 'high';
      if (isHigh) document.documentElement.removeAttribute('data-contrast');
      else document.documentElement.setAttribute('data-contrast', 'high');
      shell();
    }
  }, icon(isHighContrast ? 'sun' : 'shield'));

  const settingsCluster = h('div', { class: 'settings-tools-cluster', id: 'settings-popover' },
    themeBtn, sizeBtn, contrastBtn);

  const settingsToggleBtn = h('button', {
    class: 'header-icon-btn settings-toggle-btn',
    id: 'settingsbtn',
    type: 'button',
    'aria-label': T('সেটিংস', 'Settings'),
    title: T('সেটিংস', 'Settings'),
    onclick: (e) => {
      e.stopPropagation();
      const isOpen = settingsCluster.classList.toggle('is-open');
      settingsToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (toolsPopover) toolsPopover.classList.remove('is-open');
      if (rolePopover) rolePopover.classList.remove('is-open');
    }
  }, icon('tune'));

  const settingsBox = h('div', { class: 'dropdown-wrapper settings-dropdown-box' }, settingsToggleBtn, settingsCluster);

  top.append(h('div', { class: 'wrap header header-island' },
    brand,
    nav,
    h('div', { class: 'tools actions header-actions' },
      roleBox,
      langBtn,
      settingsBox)));

  $('#demobar').textContent = T('ডেমো: সব তথ্য বানানো। কোনো আসল নাম, এনআইডি বা জমির রেকর্ড নেই।', 'Demo: all data is synthetic. No real names, NID numbers or land records.');
  $('#skip').textContent = T('মূল অংশে যান', 'Skip to content');

  clear($('#footer')).append(h('div', { class: 'wrap row' },
    h('div', { class: 'grow' }, h('strong', {}, 'ভূমি লিপি · Bhumi Lipi'), h('p', { class: 'small' },
      T('LandTech Innovation Hackathon 2026 · ডিজিটাল ভূমি রেকর্ড, যাচাই ও ডিজিটাইজেশন।',
        'LandTech Innovation Hackathon 2026 · Digital land records, verification and digitization.'))),
    h('div', { class: 'small' }, h('a', { href: '/tools/verify_anchor.py' }, T('স্বাধীন ভেরিফায়ার স্ক্রিপ্ট', 'Independent verifier script')))));

  // Setup bottom sheets if not yet in DOM
  if (!moreBackdropEl) {
    moreBackdropEl = document.getElementById('tab-more-backdrop') ||
      h('div', { id: 'tab-more-backdrop', class: 'more-sheet-backdrop noprint', onclick: closeMoreSheet });
    if (!moreBackdropEl.parentElement) document.body.append(moreBackdropEl);
  }
  if (!moreSheetEl) {
    moreSheetEl = document.getElementById('tab-more-sheet') ||
      h('div', { id: 'tab-more-sheet', class: 'more-sheet-panel noprint', 'aria-label': T('আরও সেবা', 'More Services') });
    if (!moreSheetEl.parentElement) document.body.append(moreSheetEl);
  }

  let tabbar = document.getElementById('tabbar');
  if (!tabbar) {
    tabbar = h('nav', { class: 'mobile-tab-bar noprint', id: 'tabbar', 'aria-label': T('মোবাইল মেনু', 'Mobile menu') });
    document.body.append(tabbar);
  }

  const isMoreActive = ['integrity', 'registrar', 'mutation', 'bank', 'lab'].includes(current);

  clear(tabbar).append(
    h('a', { href: '#/check', class: `tab-item ${current === 'check' ? 'is-active' : ''}` },
      icon('search'), h('span', {}, T('জমি দেখুন', 'Check'))),
    h('a', { href: '#/verify', class: `tab-item ${current === 'verify' ? 'is-active' : ''}` },
      icon('scan'), h('span', {}, T('দলিল যাচাই', 'Verify'))),
    h('a', { href: '#/ai', class: `tab-item ${current === 'ai' ? 'is-active' : ''}` },
      icon('sparkle'), h('span', {}, T('এআই', 'AI'))),
    h('a', { href: '#/about', class: `tab-item ${current === 'about' ? 'is-active' : ''}` },
      icon('info'), h('span', {}, T('পরিচিতি', 'About'))),
    h('button', {
      type: 'button',
      id: 'tab-more-btn',
      class: `tab-item tab-btn ${isMoreActive ? 'is-active' : ''}`,
      'aria-label': T('আরও মেনু', 'More menu'),
      onclick: toggleMoreSheet
    }, icon('grid'), h('span', {}, T('আরও', 'More')))
  );
}

async function route() {
  const my = ++token;
  closeMoreSheet();
  const popover = document.getElementById('settings-popover');
  if (popover) popover.classList.remove('is-open');
  leaveFns.forEach((f) => { try { f(); } catch { /* ignore */ } });
  leaveFns = [];
  const path = (location.hash.slice(1) || '/').split('?')[0];
  let hit = null;
  for (const [rx, nav, load] of ROUTES) { const m = rx.exec(path); if (m) { hit = { nav, load, params: m.slice(1) }; break; } }
  current = hit ? hit.nav : 'home';
  shell();
  const main = clear($('#main'));
  if (!hit) hit = { nav: 'home', load: ROUTES[0][2], params: [] };
  main.append(skeleton());
  try {
    const mod = await hit.load();
    const node = await mod.default(hit.params, ctx);
    if (my !== token) return;
    clear(main).append(node);
  } catch (e) {
    if (my !== token) return;
    console.error(e);
    clear(main).append(h('div', { class: 'wrap', style: 'padding:48px 20px' }, h('div', { class: 'card empty' },
      h('h2', {}, T('কিছু ভুল হয়েছে', 'Something went wrong')), h('p', {}, e.error ? (state.lang === 'bn' ? e.error.bn : e.error.en) : String(e.message || e)),
      h('button', { class: 'btn', onclick: () => { window.location.reload(); } }, T('আবার চেষ্টা করুন', 'Try again')))));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const pop = document.getElementById('settings-popover');
  const btn = document.getElementById('settingsbtn');
  if (pop && pop.classList.contains('is-open')) {
    if (!pop.contains(e.target) && !btn?.contains(e.target)) {
      pop.classList.remove('is-open');
    }
  }
});

// Pretty URLs from the server (/check/ID) become hash routes
if (location.pathname !== '/' && location.pathname.length > 1) location.replace('/#' + location.pathname + location.search);
loadState();
initCommandPaletteShortcuts(ctx);
initGlobalAssistant(ctx);
window.addEventListener('hashchange', route);
route();
