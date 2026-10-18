// Command Palette (Ctrl/⌘ + K or /)
// Instant keyboard-driven navigation across plots, pages, roles, language, and hackathon demo flows.

import { h, icon } from '../dom.js';
import { T, state, setRole, setLang, setTheme } from '../i18n.js';
import { startTour } from './tour.js';

const DEMO_PLOTS = [
  { id: 'DHK-UTT-0142', v: 'green', descBn: 'পরিষ্কার জমি · জেনুইন', descEn: 'Clean plot · Genuine' },
  { id: 'DHK-UTT-0143', v: 'green', descBn: 'স্বাভাবিক ইতিহাস · ৩টি রেকর্ড', descEn: 'Normal history · 3 records' },
  { id: 'DHK-GUL-0309', v: 'amber', descBn: 'নামজারি অপেক্ষমাণ · জমি লক', descEn: 'Mutation pending · Locked' },
  { id: 'CTG-PAT-0120', v: 'amber', descBn: 'দ্রুত হস্তান্তর সতর্কতা', descEn: 'Rapid resale warning' },
  { id: 'KHL-DUM-0033', v: 'red', descBn: 'খাস জমি · বিক্রয় নিষিদ্ধ', descEn: 'Khas land · Sale prohibited' },
  { id: 'SYL-ZKJ-0210', v: 'red', descBn: 'ব্যাংক বন্ধক · দ্বিতীয় বন্ধক নিষিদ্ধ', descEn: 'Bank lien · Mortgage locked' },
  { id: 'RAJ-BOA-0401', v: 'green', descBn: 'রাজশাহী জরিপ সম্পন্ন', descEn: 'Rajshahi clean plot' },
  { id: 'BAR-KOT-0512', v: 'amber', descBn: 'জরিপ গরমিল সতর্কতা', descEn: 'Survey area mismatch' },
  { id: 'COM-CAN-0610', v: 'green', descBn: 'মালিকানা যাচাইকৃত', descEn: 'Verified ownership' },
  { id: 'MYM-SDR-0720', v: 'red', descBn: 'অধিগ্রহণকৃত জমি', descEn: 'Under acquisition' },
  { id: 'RNG-PIR-0830', v: 'green', descBn: 'রংপুর নিষ্কণ্টক জমি', descEn: 'Clean plot' },
];

const PAGES = [
  { path: '#/', icon: 'shield', bn: 'হোম পেজ', en: 'Home page' },
  { path: '#/check', icon: 'search', bn: 'জমি যাচাই ও প্লট ফাইন্ডার', en: 'Plot finder & check' },
  { path: '#/verify', icon: 'scan', bn: 'দলিল যাচাই (QR / ফাইল / জাল পরীক্ষা)', en: 'Verify deed (QR, File, Cheat)' },
  { path: '#/registrar', icon: 'stamp', bn: 'সাব-রেজিস্ট্রার ডেস্ক (বিক্রি ও সিল)', en: 'Sub-registrar desk' },
  { path: '#/mutation', icon: 'file', bn: 'নামজারি ট্র্যাকার ও এসি ল্যান্ড কিউ', en: 'Mutation tracker & queue' },
  { path: '#/bank', icon: 'bank', bn: 'ব্যাংক লিয়েন ও বন্ধক ডেস্ক', en: 'Bank lien desk' },
  { path: '#/integrity', icon: 'link', bn: 'সুরক্ষা ও পাবলিক মের্কেল অ্যাংকর', en: 'Trust & public Merkle anchor' },
  { path: '#/lab', icon: 'flask', bn: 'অ্যাটাক ল্যাব (৫টি আক্রমণ পরীক্ষা)', en: 'Attack lab (5 simulated attacks)' },
  { path: '#/about', icon: 'file', bn: 'পরিচিতি ও বাস্তবায়ন পরিকল্পনা', en: 'About & implementation plan' },
];

let modalElement = null;

export function openCommandPalette(ctx) {
  if (modalElement) modalElement.remove();

  const input = h('input', {
    class: 'cmd-input',
    placeholder: T('প্লট খুঁজুন, পেজে যান, বা কাজ বেছে নিন… (Esc দিয়ে বন্ধ)', 'Search plots, jump to page, or actions… (Esc to close)'),
    'aria-label': T('কমান্ড প্যালেট ইনপুট', 'Command palette input'),
    autofocus: true,
  });

  const resultsList = h('div', { class: 'cmd-results', role: 'listbox' });
  let selectedIndex = 0;
  let currentItems = [];

  const close = () => {
    modalElement?.remove();
    modalElement = null;
    document.removeEventListener('keydown', handleGlobalKey);
  };

  const executeItem = (item) => {
    close();
    if (item.action) {
      item.action();
    } else if (item.path) {
      location.hash = item.path;
    }
  };

  const renderResults = (query = '') => {
    resultsList.replaceChildren();
    const q = query.trim().toLowerCase();
    currentItems = [];

    // Filter plots
    const matchedPlots = DEMO_PLOTS.filter(p =>
      !q || p.id.toLowerCase().includes(q) || p.descBn.toLowerCase().includes(q) || p.descEn.toLowerCase().includes(q)
    ).map(p => ({
      type: 'plot',
      title: p.id,
      subtitle: T(p.descBn, p.descEn),
      vDot: p.v,
      path: `#/check/${p.id}`,
    }));

    // Filter pages
    const matchedPages = PAGES.filter(p =>
      !q || p.bn.toLowerCase().includes(q) || p.en.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
    ).map(p => ({
      type: 'page',
      title: T(p.bn, p.en),
      subtitle: p.path,
      iconName: p.icon,
      path: p.path,
    }));

    // Actions
    const actions = [
      {
        title: T('ট্যুর শুরু করুন (Judge Demo Tour)', 'Start Guided Tour (Judge Demo)'),
        subtitle: T('১০ ধাপে সম্পূর্ণ সিস্টেমের গল্প', '10-step complete system walk-through'),
        iconName: 'shield',
        action: () => startTour(ctx),
      },
      {
        title: T('অ্যাটাক ল্যাব চালান', 'Run Attack Lab'),
        subtitle: T('৫টি আক্রমণ চালিয়ে প্রতিরোধ দেখুন', 'Simulate 5 attacks'),
        iconName: 'flask',
        path: '#/lab',
      },
      {
        title: T('ভূমিকা পরিবর্তন: সাব-রেজিস্ট্রার', 'Switch role: Sub-registrar'),
        subtitle: T('রেজিস্ট্রার ডেস্ক ব্যবহারের জন্য', 'Access registrar desk'),
        iconName: 'user',
        action: () => { setRole('registrar'); ctx.rerender(); },
      },
      {
        title: T('ভূমিকা পরিবর্তন: এসি ল্যান্ড', 'Switch role: AC Land officer'),
        subtitle: T('নামজারি অনুমোদনের জন্য', 'Decide mutations'),
        iconName: 'user',
        action: () => { setRole('ac_land'); ctx.rerender(); },
      },
      {
        title: T('ভূমিকা পরিবর্তন: ব্যাংক', 'Switch role: Bank officer'),
        subtitle: T('লিয়েন বন্ধক দেওয়ার জন্য', 'Collateral management'),
        iconName: 'bank',
        action: () => { setRole('bank'); ctx.rerender(); },
      },
      {
        title: T('ভাষা পরিবর্তন (বাং / EN)', 'Switch Language (বাং / EN)'),
        subtitle: state.lang === 'bn' ? 'Switch to English' : 'বাংলায় রূপান্তর',
        iconName: 'link',
        action: () => { setLang(state.lang === 'bn' ? 'en' : 'bn'); ctx.rerender(); },
      },
      {
        title: T('থিম টগল (Light / Dark)', 'Toggle Theme (Light / Dark)'),
        subtitle: state.theme === 'dark' ? 'Light mode' : 'Dark mode',
        iconName: 'moon',
        action: () => { setTheme(state.theme === 'dark' ? 'light' : 'dark'); },
      },
    ].filter(a => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q))
      .map(a => ({ type: 'action', ...a }));

    // Append Groups
    const groups = [
      { name: T('প্লটসমূহ (Plots)', 'Demo Plots'), items: matchedPlots },
      { name: T('পেজসমূহ (Pages)', 'Pages'), items: matchedPages },
      { name: T('অ্যাকশন ও ভূমিকা (Actions)', 'Actions & Roles'), items: actions },
    ].filter(g => g.items.length > 0);

    let globalIdx = 0;
    groups.forEach(g => {
      resultsList.append(h('div', { class: 'cmd-group-label' }, g.name));
      g.items.forEach(item => {
        const itemIdx = globalIdx++;
        currentItems.push(item);
        const isSelected = itemIdx === selectedIndex;

        const el = h('div', {
          class: `cmd-item ${isSelected ? 'is-selected' : ''}`,
          role: 'option',
          'aria-selected': isSelected,
          onclick: () => executeItem(item),
          onmouseenter: () => {
            selectedIndex = itemIdx;
            updateSelection();
          },
        },
          item.vDot ? h('span', { class: `dot ${item.vDot}` }) : null,
          item.iconName ? icon(item.iconName) : null,
          h('div', { class: 'cmd-item-text' },
            h('strong', {}, item.title),
            item.subtitle ? h('span', { class: 'cmd-item-sub small muted' }, item.subtitle) : null));

        resultsList.append(el);
      });
    });

    if (!currentItems.length) {
      resultsList.append(h('div', { class: 'empty small' },
        T('কোনো ফলাফল পাওয়া যায়নি। যেমন DHK-UTT-0142 লিখে চেষ্টা করুন।',
          'No matching results found. Try typing a plot like DHK-UTT-0142.')));
    }
  };

  const updateSelection = () => {
    const items = resultsList.querySelectorAll('.cmd-item');
    items.forEach((el, idx) => {
      const sel = idx === selectedIndex;
      el.classList.toggle('is-selected', sel);
      el.setAttribute('aria-selected', sel);
      if (sel) el.scrollIntoView({ block: 'nearest' });
    });
  };

  let paletteRaf = null;
  input.addEventListener('input', (e) => {
    if (paletteRaf) cancelAnimationFrame(paletteRaf);
    paletteRaf = requestAnimationFrame(() => {
      selectedIndex = 0;
      renderResults(e.target.value);
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItems[selectedIndex]) executeItem(currentItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  const handleGlobalKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', handleGlobalKey);

  const backdrop = h('div', { class: 'cmd-palette-backdrop', onclick: (e) => { if (e.target === backdrop) close(); } },
    h('div', { class: 'cmd-palette-box card' },
      h('div', { class: 'cmd-input-row' },
        icon('search'),
        input,
        h('kbd', { class: 'cmd-kbd' }, 'ESC')),
      resultsList));

  modalElement = backdrop;
  document.body.append(backdrop);
  renderResults('');
  input.focus();
}

// Global keyboard shortcut setup (Ctrl/Cmd + K or /)
export function initCommandPaletteShortcuts(ctx) {
  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is actively typing in another form field
    const active = document.activeElement;
    const isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette(ctx);
    } else if (e.key === '/' && !isEditing) {
      e.preventDefault();
      openCommandPalette(ctx);
    }
  });
}
