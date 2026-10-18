// Verify a deed (Problem P2): scan its QR, paste its seal code, drop the file, or try to cheat.
import { h, icon, sha256Hex, copyText } from '../dom.js';
import { api, docUrl } from '../api.js';
import { T, LL, fmtDate, shortHash } from '../i18n.js';
import { verdictBanner, pageHead, kindLabel, listenButton, threeWord, copyBtn } from './ui.js';
import { renderDiffViewer, renderAvalancheBox } from '../components/diff.js';

const CLS = { GENUINE: 'green', OUTDATED: 'amber', FORGED: 'forged', CHAIN_BROKEN: 'red' };
const TITLE = {
  GENUINE: ['খাঁটি দলিল', 'Genuine deed'], OUTDATED: ['আসল, কিন্তু পুরোনো', 'Real, but outdated'],
  FORGED: ['জাল বা বদলানো', 'Forged or altered'], CHAIN_BROKEN: ['রেকর্ড ভাঙা', 'Record chain broken'],
};

export default async function verify([hash], ctx) {
  const out = h('div', { 'aria-live': 'polite', style: 'margin-top:20px' });
  const show = (res, extra) => {
    out.replaceChildren(verdictBanner(CLS[res.result], T(...TITLE[res.result]), LL(res), threeWord(CLS[res.result] === 'forged' ? 'red' : CLS[res.result])), h('div', { class: 'bigbtns noprint', style: 'margin-top:14px' }, listenButton(() => res.bn, ctx)), res.plot_id ? h('div', { class: 'card', style: 'margin-top:14px' },
      h('dl', { class: 'kv' },
        h('dt', {}, T('প্লট', 'Plot')), h('dd', {}, h('a', { href: '#/check/' + res.plot_id, class: 'mono nowrap' }, res.plot_id)),
        h('dt', {}, T('দলিল', 'Deed')), h('dd', {}, `${res.deed_no} · ${kindLabel(res.kind)}`),
        h('dt', {}, T('হাতবদল', 'Transfer')), h('dd', {}, `${res.frm} → ${res.to}`),
        h('dt', {}, T('তারিখ', 'Date')), h('dd', {}, fmtDate(res.ts)),
        h('dt', {}, T('সিল', 'Seal')), h('dd', { class: 'seal-wrap' }, h('span', { class: 'seal' }, shortHash(res.hash)), copyBtn(res.hash, copyText)),
        extra ? [h('dt', {}, T('আপনার ফাইল', 'Your file')), h('dd', { class: 'seal-wrap' }, h('span', { class: 'seal' }, shortHash(extra)), copyBtn(extra, copyText))] : null)) : (extra ? h('p', { class: 'seal-wrap', style: 'margin-top:10px' }, T('ফাইলের ফিঙ্গারপ্রিন্ট: ', 'File fingerprint: '), h('span', { class: 'seal' }, shortHash(extra)), copyBtn(extra, copyText)) : null));
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const fail = (e) => out.replaceChildren(verdictBanner('red', T('যাচাই করা যায়নি', 'Could not verify'), LL(e.error || { bn: String(e.message), en: String(e.message) })));
  const byHash = async (code) => { try { show(await api('/verify', { method: 'POST', body: { hash: code } })); } catch (e) { fail(e); } };
  const byDoc = async (docHash) => { try { show(await api('/verify', { method: 'POST', body: { doc_hash: docHash } }), docHash); } catch (e) { fail(e); } };

  // ---- tab bodies
  const pasteIn = h('input', { placeholder: T('৬৪ অক্ষরের সিল কোড বা লিংক', '64-character seal code or link'), 'aria-label': T('সিল কোড', 'Seal code'), style: 'font-family:var(--mono)', value: hash || '' });
  const paste = h('div', {}, h('p', { class: 'muted' }, T('দলিলের QR এর নিচের কোড, বা QR থেকে পাওয়া লিংক এখানে দিন।', 'Paste the code under the deed QR, or the link from the QR.')),
    h('form', { class: 'row verify-form-row', onsubmit: (e) => { e.preventDefault(); byHash(pasteIn.value); } }, h('div', { class: 'grow' }, pasteIn), h('button', { class: 'btn verify-submit-btn', type: 'submit' }, icon('shield'), T('যাচাই', 'Verify'))));

  const fileIn = h('input', { type: 'file', class: 'sr', id: 'f', onchange: async (e) => { if (e.target.files[0]) await doFile(e.target.files[0]); } });
  const drop = h('label', { class: 'drop', for: 'f', ondragover: (e) => { e.preventDefault(); drop.classList.add('over'); }, ondragleave: () => drop.classList.remove('over'),
    ondrop: async (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) await doFile(e.dataTransfer.files[0]); } },
  icon('file'), h('div', { style: 'font-weight:700;color:var(--ink);margin-top:8px' }, T('দলিলের ফাইল এখানে ফেলুন বা বেছে নিন', 'Drop a deed file here or choose one')),
  h('div', { class: 'small' }, T('ফাইল আপনার ফোন থেকে বের হয় না। শুধু ফিঙ্গারপ্রিন্ট পাঠানো হয়।', 'The file never leaves your device. Only its fingerprint is sent.')), fileIn);
  async function doFile(f) { if (f.size > 5_000_000) return fail({ message: T('ফাইল ৫ MB এর বেশি।', 'File is over 5 MB.') }); byDoc(await sha256Hex(await f.arrayBuffer())); }
  const file = h('div', {}, drop);

  const video = h('video', { class: 'cam', playsinline: '', muted: '', hidden: '' });
  const camMsg = h('p', { class: 'muted' }, T('ক্যামেরা চালু করে QR দেখান।', 'Turn on the camera and show the QR.'));
  let stream, timer;
  const stop = () => { clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); stream = null; video.hidden = true; };
  ctx.onLeave(stop);
  const camBtn = h('button', { class: 'btn', onclick: async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) { camMsg.textContent = T('এই ব্রাউজারে QR স্ক্যান চলে না। "কোড/লিংক" ট্যাব ব্যবহার করুন।', 'This browser cannot scan QR codes. Use the "Code / link" tab.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream; video.hidden = false; await video.play(); camMsg.textContent = T('QR ক্যামেরার সামনে ধরুন…', 'Hold the QR in front of the camera…');
      const det = new BarcodeDetector({ formats: ['qr_code'] });
      timer = setInterval(async () => { const c = await det.detect(video).catch(() => []); if (c.length) { stop(); byHash(c[0].rawValue); } }, 350);
    } catch { camMsg.textContent = T('ক্যামেরার অনুমতি পাওয়া যায়নি।', 'Camera permission was not granted.'); }
  } }, icon('scan'), T('ক্যামেরা চালু', 'Start camera'));
  const scan = h('div', { class: 'stack' }, camMsg, video, camBtn);

  const area = h('textarea', { 'aria-label': T('দলিলের লেখা', 'Deed text'), spellcheck: 'false' });
  let origDeedText = '';
  let origDeedHash = '';
  const diffSlot = h('div', { class: 'diff-slot' });

  const updateDiffAndAvalanche = async () => {
    if (!origDeedText) {
      diffSlot.replaceChildren();
      return;
    }
    const currentText = area.value;
    const currentHash = await sha256Hex(currentText);
    diffSlot.replaceChildren(
      renderDiffViewer(origDeedText, currentText),
      renderAvalancheBox(origDeedHash, currentHash)
    );
  };

  let diffRaf = null;
  area.addEventListener('input', () => {
    if (diffRaf) cancelAnimationFrame(diffRaf);
    diffRaf = requestAnimationFrame(() => {
      updateDiffAndAvalanche();
    });
  });

  const cheat = h('div', { class: 'stack' },
    h('p', { class: 'muted' }, T('একটি আসল দলিলের কপি নিন, একটি সংখ্যা বা অক্ষর বদলান, তারপর যাচাই করুন। সিল মিলবে না।', 'Load a real deed copy, change one number or letter, then verify. The seal will not match.')),
    h('button', { class: 'btn ghost', onclick: async () => {
      const r = await api('/plots/DHK-UTT-0143'); const last = r.history[r.history.length - 1];
      origDeedText = await (await fetch(docUrl(last.hash))).text();
      origDeedHash = await sha256Hex(origDeedText);
      area.value = origDeedText;
      out.replaceChildren();
      await updateDiffAndAvalanche();
    } }, icon('file'), T('নমুনা দলিল নিন', 'Load sample deed')),
    area,
    diffSlot,
    h('button', { class: 'btn', onclick: async () => { if (area.value) byDoc(await sha256Hex(area.value)); } }, icon('shield'), T('এই লেখা যাচাই', 'Verify this text')));

  const tabs = [['paste', 'link', 'কোড / লিংক', 'Code / link', paste], ['scan', 'scan', 'QR স্ক্যান', 'Scan QR', scan], ['file', 'file', 'ফাইল', 'File', file], ['cheat', 'flask', 'জাল করে দেখুন', 'Try to cheat', cheat]];
  const body = h('div', { style: 'margin-top:18px' });
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const pick = (i) => { stop(); [...bar.children].forEach((b, j) => b.setAttribute('aria-selected', String(i === j))); body.replaceChildren(tabs[i][4]); };
  tabs.forEach((t, i) => bar.append(h('button', { role: 'tab', onclick: () => pick(i) }, icon(t[1]), T(t[2], t[3]))));
  pick(0);
  if (hash) byHash(hash);

  return h('div', { class: 'wrap', style: 'padding:32px 20px 0;max-width:820px' },
    pageHead(T('দলিল যাচাই', 'Verify a deed'), T('আসল, পুরোনো, না জাল? ১০ সেকেন্ডে জানুন।', 'Real, outdated or forged? Find out in 10 seconds.')),
    h('div', { class: 'card' }, bar, body), out);
}
