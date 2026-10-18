// Helpers for "Simple mode": reading aloud in Bangla and the traditional share calculator.

// ---- Read aloud (browser speech synthesis; only offered when a Bangla voice exists)
const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const banglaVoice = () => (hasSpeech() ? speechSynthesis.getVoices().find((v) => /^bn/i.test(v.lang)) : undefined);

// Calls cb(true/false) now and whenever the voice list changes. Returns a function that stops listening.
export function watchBanglaVoice(cb) {
  if (!hasSpeech()) { cb(false); return () => {}; }
  const check = () => cb(Boolean(banglaVoice()));
  check();
  speechSynthesis.addEventListener('voiceschanged', check);
  return () => speechSynthesis.removeEventListener('voiceschanged', check);
}
export function stopSpeaking() { if (hasSpeech()) speechSynthesis.cancel(); }
export function speakBangla(text) {
  if (!hasSpeech()) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text), v = banglaVoice();
  if (v) u.voice = v;
  u.lang = v ? v.lang : 'bn-BD';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

// ---- Ana / Gonda / Kora / Kranti to a fraction of the whole (traditional land share units)
// 1 taka (whole) = 16 ana; 1 ana = 20 gonda; 1 gonda = 4 kora; 1 kora = 3 kranti.
// So the whole = 16 ana = 320 gonda = 1280 kora = 3840 kranti.
export const KRANTI_IN_WHOLE = 16 * 20 * 4 * 3;
export function shareFraction({ ana = 0, gonda = 0, kora = 0, kranti = 0 }) {
  const n = (x) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : 0);
  const kr = n(ana) * 20 * 4 * 3 + n(gonda) * 4 * 3 + n(kora) * 3 + n(kranti);
  return kr / KRANTI_IN_WHOLE;
}
// Area in decimal (shotok) that a share corresponds to, for a plot of `areaDecimal`.
export const shareToDecimal = (parts, areaDecimal) => shareFraction(parts) * Number(areaDecimal);
