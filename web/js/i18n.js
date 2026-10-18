// Language state. T(bn, en) picks the text for the current language.
// Server messages arrive as {bn, en}; LL(obj) picks one.
export const state = { lang: 'bn', role: 'citizen', theme: 'light', size: '100', contrast: 'normal' };

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked: keep going */ } },
};

export function loadState() {
  const lang = store.get('bl.lang'), role = store.get('bl.role'), theme = store.get('bl.theme');
  const size = store.get('bl.size');
  if (lang === 'bn' || lang === 'en') state.lang = lang;
  if (['citizen', 'registrar', 'ac_land', 'bank'].includes(role)) state.role = role;
  if (theme === 'dark' || theme === 'light') {
    state.theme = theme;
  } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    state.theme = 'dark';
  } else {
    state.theme = 'light';
  }
  if (['100', '125', '150'].includes(size)) state.size = size;
  state.contrast = 'normal';
  try { localStorage.removeItem('bl.contrast'); } catch {}
  applyTheme();
  document.documentElement.lang = state.lang;
}
export function setLang(l) { state.lang = l; store.set('bl.lang', l); document.documentElement.lang = l; }
export function setRole(r) { state.role = r; store.set('bl.role', r); }
export function setTheme(t) { state.theme = t; store.set('bl.theme', t); applyTheme(); }
export function setSize(v) { state.size = v; store.set('bl.size', v); applyTheme(); }
export function setContrast(v) { state.contrast = 'normal'; applyTheme(); }
export const getView = () => store.get('bl.view');
export const setView = (v) => store.set('bl.view', v);
function applyTheme() {
  document.documentElement.style.setProperty('--scale', String(Number(state.size) / 100));
  document.documentElement.setAttribute('data-scale', state.size);
  document.documentElement.removeAttribute('data-contrast');
  if (state.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.setAttribute('data-theme', 'light');
}

export const T = (bn, en) => (state.lang === 'bn' ? bn : en);
export const LL = (o) => (o ? (state.lang === 'bn' ? o.bn : o.en) : '');

const locale = () => (state.lang === 'bn' ? 'bn-BD' : 'en-GB');
export const fmtDate = (ts) => new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(new Date(ts * 1000));
export const fmtDateTime = (ts) => new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts * 1000));
export const fmtMoney = (n) => `৳ ${Number(n).toLocaleString(state.lang === 'bn' ? 'bn-BD' : 'en-US')}`;
export const fmtNum = (n) => Number(n).toLocaleString(state.lang === 'bn' ? 'bn-BD' : 'en-US');
export const shortHash = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : '');
