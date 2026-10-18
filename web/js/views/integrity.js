// Trust page: are all chains and anchors intact? Anyone can verify a record against the public anchor, in their own browser.
import { h, icon, copyText } from '../dom.js';
import { api } from '../api.js';
import { T, fmtNum, fmtDateTime } from '../i18n.js';
import { pageHead, verdictBanner } from './ui.js';

const hex2 = (s) => Uint8Array.from(s.match(/../g).map((x) => parseInt(x, 16)));
const toHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (b) => new Uint8Array(await crypto.subtle.digest('SHA-256', b));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; a.forEach((x) => { o.set(x, i); i += x.length; }); return o; };
// Same rule as the server: leaf = SHA256(0x00 || hash), node = SHA256(0x01 || left || right)
async function verifyProof(leaf, proof, root) {
  let cur = await sha(cat(Uint8Array.of(0), hex2(leaf)));
  for (const s of proof) { const sib = hex2(s.h); cur = await sha(s.side === 'R' ? cat(Uint8Array.of(1), cur, sib) : cat(Uint8Array.of(1), sib, cur)); }
  return toHex(cur) === root;
}

export default async function integrity() {
  const [integ, keys, sample] = await Promise.all([api('/integrity'), api('/keys'), api('/plots/DHK-UTT-0142').catch(() => null)]);
  const a = integ.latest_anchor;
  const sampleHash = sample && sample.history && sample.history[0] ? sample.history[0].hash : '';
  const hashIn = h('textarea', {
    class: 'anchor-hash-box',
    rows: '2',
    spellcheck: 'false',
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    'aria-label': T('সিল কোড বা ব্লক হ্যাশ', 'Seal code or block hash')
  }, sampleHash);
  if (sampleHash) hashIn.value = sampleHash;

  const proofOut = h('div', { 'aria-live': 'polite' });
  const prove = async (e) => {
    e.preventDefault();
    try {
      const p = await api('/anchor/proof/' + encodeURIComponent(hashIn.value.trim()));
      const ok = await verifyProof(p.leaf, p.proof, p.root);
      proofOut.style.marginTop = '18px';
      proofOut.replaceChildren(verdictBanner(ok ? 'green' : 'red', ok ? T('প্রমাণ সঠিক ✓', 'Proof is valid ✓') : T('প্রমাণ মেলেনি', 'Proof does not match'),
        ok ? T(`রেকর্ডটি ${fmtNum(p.block_count)}টি রেকর্ডের Merkle root এ আছে। যাচাই হয়েছে আপনার ব্রাউজারে।`, `This record is inside the Merkle root of ${fmtNum(p.block_count)} records. Verified in your own browser.`) : ''));
    } catch (err) {
      proofOut.style.marginTop = '18px';
      proofOut.replaceChildren(verdictBanner('red', T('পাওয়া যায়নি', 'Not found'), err.error ? (T(err.error.bn, err.error.en)) : String(err.message)));
    }
  };

  const form = h('form', { onsubmit: prove, style: 'display:flex;flex-direction:column;justify-content:space-between;flex:1;margin:0' },
    h('div', {},
      h('h3', {}, T('প্রমাণ করুন: রেকর্ডটি অ্যাংকরে আছে', 'Prove a record is in the anchor')),
      h('p', { class: 'muted', style: 'font-size:16.5px;line-height:1.55;min-height:48px;margin-bottom:12px' },
        T('যেকোনো দলিল বা ব্লকের হ্যাশ দিয়ে চেইন ও মারকেল রুটে অন্তর্ভুক্তি প্রমাণ করুন।',
          'Verify cryptographic proof that a deed or block hash is included in the anchor.')),
      hashIn),
    h('div', { style: 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:14px;padding-top:4px' },
      h('span', { class: 'muted', style: 'font-size:16px;font-weight:500' },
        T('SHA-256 মারকেল প্রমাণ', 'SHA-256 Merkle proof')),
      h('button', { class: 'btn', type: 'submit' }, icon('shield'), T('প্রমাণ যাচাই', 'Verify proof'))));

  hashIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : prove(e);
    }
  });

  return h('div', { class: 'wrap', style: 'padding:32px 20px 0' },
    pageHead(T('সুরক্ষা ও সততা', 'Integrity and trust'), T('সব রেকর্ড এখনও অক্ষত কি না, নিজে যাচাই করুন। আমাদের কথায় বিশ্বাস না করলেও চলবে।', 'Check for yourself that every record is intact. You do not have to trust our word.')),
    verdictBanner(integ.healthy ? 'green' : 'red', integ.healthy ? T('সব রেকর্ড অক্ষত', 'All records intact') : T('সমস্যা পাওয়া গেছে', 'Problem detected'),
      T(`${fmtNum(integ.chains_ok)}/${fmtNum(integ.chains_total)} প্লট-শিকল ঠিক · ${fmtNum(integ.anchors.checked)}টি পাবলিক অ্যাংকর মিলেছে: ${integ.anchors.ok ? 'হ্যাঁ' : 'না'}`,
        `${fmtNum(integ.chains_ok)}/${fmtNum(integ.chains_total)} plot chains valid · ${fmtNum(integ.anchors.checked)} public anchors checked: ${integ.anchors.ok ? 'all match' : 'MISMATCH'}`)),
    h('div', { class: 'grid g2', style: 'margin-top:18px' },
      h('div', { class: 'card', style: 'display:flex;flex-direction:column;justify-content:space-between' },
        h('div', {},
          h('h3', {}, T('আজকের পাবলিক অ্যাংকর', 'Today’s public anchor')),
          h('p', { class: 'muted', style: 'font-size:16.5px;line-height:1.55;min-height:48px;margin-bottom:12px' },
            T('সব রেকর্ডের একটি সারাংশ-হ্যাশ (Merkle root)। এটি প্রকাশ করলে কেউ ইতিহাস বদলাতে পারে না।',
              'One summary hash (Merkle root) of every record. Once published, nobody can quietly rewrite history.')),
          a ? h('div', { class: 'anchor-hash-box' }, a.merkle_root) : null),
        a ? h('div', { style: 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:14px;padding-top:4px' },
          h('span', { class: 'muted', style: 'font-size:16px;font-weight:500' },
            T(`${fmtNum(a.block_count)}টি রেকর্ড · ${fmtDateTime(a.ts)}`, `${fmtNum(a.block_count)} records · ${fmtDateTime(a.ts)}`)),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => copyText(a.merkle_root) }, icon('copy'), T('কপি', 'Copy'))) : null),
      h('div', { class: 'card', style: 'display:flex;flex-direction:column;justify-content:space-between' },
        form)),
    proofOut,
    h('div', { class: 'card', style: 'margin-top:18px' }, h('h3', {}, T('নিজে যাচাই করুন', 'Verify it yourself')),
      h('ol', { class: 'stack', style: 'padding-left:20px;margin-top:10px' },
        h('li', {}, T('সব রেকর্ড নামান: ', 'Download all records: '), h('a', { href: '/api/export', download: 'bhumi-lipi-export.json' }, 'bhumi-lipi-export.json')),
        h('li', {}, T('স্বাধীন স্ক্রিপ্ট নামান: ', 'Download the independent script: '), h('a', { href: '/tools/verify_anchor.py', download: '' }, 'verify_anchor.py')),
        h('li', {}, T('চালান: ', 'Run: '), h('div', { class: 'code-copy-row' }, h('code', { class: 'scroll-code' }, 'python verify_anchor.py bhumi-lipi-export.json'), h('button', { class: 'iconbtn sm', type: 'button', 'aria-label': T('কোড কপি', 'Copy command'), onclick: () => copyText('python verify_anchor.py bhumi-lipi-export.json') }, icon('copy')))),
        h('li', {}, T('স্ক্রিপ্ট আমাদের সার্ভার ছাড়াই সিল, সাইন, শিকল ও Merkle root মিলিয়ে দেখে।', 'The script re-checks seals, signatures, chains and Merkle roots without our server.')))),
    h('div', { class: 'grid g2', style: 'margin-top:18px' },
      h('div', { class: 'card' }, h('h3', {}, T('প্লট-শিকলের অবস্থা', 'Plot chain status')),
        h('div', { class: 'scroll-x' }, h('table', { class: 't' }, h('tbody', {}, integ.plots.map((p) => h('tr', {}, h('td', {}, h('a', { href: '#/check/' + p.plot_id, class: 'mono nowrap' }, p.plot_id)),
          h('td', { class: 'nowrap' }, T(`${p.length}টি রেকর্ড`, `${p.length} records`)), h('td', { class: 'nowrap' }, p.ok ? h('span', { class: 'chip green' }, icon('check'), 'OK') : h('span', { class: 'chip red' }, icon('x'), `#${p.first_bad_seq} ${p.reason}`)))))))),
      h('div', { class: 'card' }, h('h3', {}, T('অফিসের পাবলিক কী', 'Office public keys')),
        h('p', { class: 'muted small' }, T('প্রতিটি অফিস নিজের চাবিতে সাইন করে। এখানে শুধু পাবলিক অংশ।', 'Each office signs with its own key. Only the public half is shown.')),
        h('div', { class: 'stack' }, Object.entries(keys).map(([o, k]) => h('div', {}, h('strong', {}, o), h('div', { class: 'seal' }, k)))))));
}
