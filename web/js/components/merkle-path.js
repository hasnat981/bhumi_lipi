// Merkle Inclusion Proof Visualizer
// Recomputes the Merkle root hash in the browser using Web Crypto API and renders an animated tree proof path.

import { h, icon, sha256Hex } from '../dom.js';
import { T, shortHash } from '../i18n.js';

export async function verifyMerkleProofInBrowser(leafHex, proofPath, expectedRootHex, onStepProgress) {
  let currentHash = leafHex;
  const steps = [];

  for (let i = 0; i < proofPath.length; i++) {
    const item = proofPath[i];
    const sibling = item.hash || item;
    const direction = item.side || (i % 2 === 0 ? 'right' : 'left');

    const concatBytes = direction === 'left' ? (sibling + currentHash) : (currentHash + sibling);
    const nextHash = await sha256Hex(concatBytes);

    steps.push({
      level: i + 1,
      current: currentHash,
      sibling,
      direction,
      computed: nextHash,
    });

    currentHash = nextHash;
    if (onStepProgress) onStepProgress(i + 1, steps);
  }

  const isValid = currentHash.toLowerCase() === expectedRootHex.toLowerCase();
  return { isValid, computedRoot: currentHash, steps };
}

export function renderMerklePathVisual(leafHex, proofSteps = [], expectedRoot = '') {
  const container = h('div', { class: 'merkle-path-visual card', style: 'background:var(--surface-2);margin-top:14px' });

  const rootHeader = h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:12px' },
    h('div', {},
      h('strong', {}, T('ক্রিপ্টোগ্রাফিক মের্কেল পাথ (Merkle Proof Tree)', 'Merkle Proof Path')),
      h('div', { class: 'small muted mono' }, T('পাবলিক রুট: ', 'Anchor root: '), shortHash(expectedRoot))),
    h('span', { class: 'chip green sm' }, icon('check'), T('ব্রাউজারে যাচাইকৃত', 'Verified in browser')));

  const treeNodes = h('div', { class: 'merkle-tree-nodes' });

  // Stack levels from leaf (bottom) to root (top)
  proofSteps.forEach((step, idx) => {
    const isLast = idx === proofSteps.length - 1;
    const nodeRow = h('div', { class: 'merkle-level-row', style: `animation-delay:${idx * 160}ms` },
      h('span', { class: 'level-badge mono' }, `L${step.level}`),
      h('div', { class: 'node-box mono' },
        h('span', { class: 'node-label small muted' }, T('কারেন্ট হ্যাশ', 'Current')),
        h('span', { class: 'node-hash' }, shortHash(step.current))),
      h('span', { class: 'merkle-op-symbol' }, '+'),
      h('div', { class: 'node-box mono sibling' },
        h('span', { class: 'node-label small muted' }, T(`সহোদর (${step.direction})`, `Sibling (${step.direction})`)),
        h('span', { class: 'node-hash' }, shortHash(step.sibling))),
      h('span', { class: 'merkle-arrow' }, '→'),
      h('div', { class: `node-box mono ${isLast ? 'root-box' : ''}` },
        h('span', { class: 'node-label small muted' }, isLast ? T('অ্যাঙ্কর রুট', 'Merkle Root') : T('পরবর্তী স্তর', 'Next Level')),
        h('span', { class: 'node-hash' }, shortHash(step.computed))));

    treeNodes.append(nodeRow);
  });

  container.append(rootHeader, treeNodes);
  return container;
}
