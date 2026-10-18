// Attack lab: five real attacks, run on a private COPY of the database. Shows what stops each one.
import { h, icon } from '../dom.js';
import { api } from '../api.js';
import { T, LL } from '../i18n.js';
import { pageHead } from './ui.js';

export default async function lab() {
  const list = h('div', { class: 'stack', style: 'margin-top:20px', 'aria-live': 'polite' });
  const btn = h('button', { class: 'btn lg', onclick: async () => {
    btn.disabled = true; btn.replaceChildren(T('চলছে…', 'Running…')); list.replaceChildren();
    try {
      const res = await api('/lab/run', { method: 'POST', body: {} });
      for (const [i, r] of res.entries()) {
        await new Promise((ok) => setTimeout(ok, 260));
        list.append(h('div', { class: 'card attack' }, h('div', { class: 'num' }, i + 1),
          h('div', {}, h('h3', {}, LL(r.title)), h('p', { class: 'muted', style: 'margin:4px 0 8px' }, T('আক্রমণ: ', 'Attack: '), LL(r.attack)),
            h('div', { class: 'row small' }, icon(r.stopped ? 'shield' : 'warn'), h('span', {}, h('strong', {}, r.outcome === 'DETECTED' ? T('ধরেছে: ', 'Caught by: ') : T('ঠেকিয়েছে: ', 'Stopped by: ')), LL(r.control))),
            r.detail ? h('div', { class: 'seal', style: 'margin-top:6px' }, r.detail) : null),
          h('span', { class: `chip ${r.stopped ? 'green' : 'red'}` }, !r.stopped ? T('ঠেকানো যায়নি', 'NOT STOPPED') : r.outcome === 'DETECTED' ? T('ধরা পড়েছে', 'CAUGHT') : T('ঠেকানো গেছে', 'STOPPED'))));
      }
      const all = res.every((r) => r.stopped);
      list.append(h('div', { class: `verdict ${all ? 'green' : 'red'} pop` }, h('div', { class: 'big' }, icon(all ? 'shield' : 'x')),
        h('div', {}, h('h2', {}, all ? T('৫টির ৫টি আক্রমণ ঠেকানো বা ধরা গেছে', 'All 5 attacks were stopped or caught') : T('কিছু আক্রমণ ঠেকানো যায়নি', 'Some attacks got through')),
          h('p', {}, T('আসল ডাটাবেসে কিছু বদলায়নি। সব আক্রমণ একটি আলাদা কপিতে চালানো হয়েছে।', 'Nothing changed in the real database. Every attack ran on a separate copy.')))));
    } catch (e) { list.append(h('div', { class: 'verdict red' }, h('div', { class: 'big' }, icon('x')), h('div', {}, h('h2', {}, T('চালানো যায়নি', 'Could not run')), h('p', {}, e.error ? LL(e.error) : String(e.message))))); }
    btn.disabled = false; btn.replaceChildren(icon('flask'), T('আবার চালান', 'Run again'));
  } }, icon('flask'), T('সব আক্রমণ চালান', 'Run all attacks'));
  return h('div', { class: 'wrap', style: 'padding:32px 20px 0;max-width:860px' },
    pageHead(T('অ্যাটাক ল্যাব', 'Attack lab'), T('আমরা নিজেরাই জালিয়াতি চালিয়ে দেখাই কোন নিয়ম কোনটি ঠেকায়। শেষ আক্রমণটি সবচেয়ে কঠিন: চাবিসহ ভেতরের লোক।', 'We attack our own system and show what stops each attack. The last one is the hardest: an insider with a key.')),
    h('div', { class: 'row' }, btn, h('span', { class: 'muted small' }, T('আসল ডেটা অক্ষত থাকে।', 'Real data stays untouched.'))), list,
    h('div', { class: 'card flat', style: 'margin-top:26px' }, h('h3', {}, T('শেষ আক্রমণটি কেন গুরুত্বপূর্ণ', 'Why the last attack matters')),
      h('p', { class: 'muted' }, T('চাবি থাকলে একজন ভেতরের লোক পুরো ইতিহাস নতুন করে সাইন করতে পারে, তখন শিকল ঠিকই দেখায়। কিন্তু আগে প্রকাশিত Merkle root আর মিলে না। তাই প্রতিদিন এই root প্রকাশ করা জরুরি। এটি প্রতিরোধ নয়, ধরা পড়া নিশ্চিত করে।', 'With the key, an insider can re-sign the whole history and the chain still looks valid. But the previously published Merkle root no longer matches. That is why we publish the root every day. It does not prevent the rewrite, it guarantees it is caught.'))));
}
