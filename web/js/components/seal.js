// The Seal (ভূমি লিপি সিল) - Signature guilloche verification seal component.
// Pure SVG with 4 variants: genuine (green), outdated (amber), forged (red with crack), pending (gold dashed).
// Accessible: role="img", aria-label in Bangla and English. Text inserted safely.

import { h } from '../dom.js';

let sealIdCounter = 0;

export function createSeal({
  variant = 'genuine', // 'genuine' | 'outdated' | 'forged' | 'pending'
  size = 160,
  animated = true,
  stamped = true,
  caption = '',
} = {}) {
  sealIdCounter++;
  const uid = `seal-${sealIdCounter}`;

  const colors = {
    genuine: { stroke: 'var(--green, #1c7a44)', bg: 'var(--green-bg, #e4f3ea)' },
    outdated: { stroke: 'var(--amber, #94630a)', bg: 'var(--amber-bg, #fbf0d0)' },
    forged: { stroke: 'var(--red, #a6301d)', bg: 'var(--red-bg, #fbe3dd)' },
    pending: { stroke: 'var(--gold, #b8963c)', bg: 'var(--gold-soft, #f3e8c4)' },
  };
  const c = colors[variant] || colors.genuine;

  const labels = {
    genuine: 'খাঁটি দলিল সিল · Genuine sealed record',
    outdated: 'পুরোনো রেকর্ড সিল · Outdated sealed record',
    forged: 'জাল বা বদলানো সিল · Forged / Altered record seal',
    pending: 'অপেক্ষমাণ সিল · Pending verification seal',
  };

  const isMini = size <= 64;
  const strokeW = isMini ? 2 : 1.5;

  // Emblems for center of seal
  let emblemPaths = '';
  if (variant === 'genuine') {
    // Shield + Check
    emblemPaths = `
      <path d="M80 50 L102 59 C102 75 92 89 80 95 C68 89 58 75 58 59 Z" fill="${c.bg}" stroke="${c.stroke}" stroke-width="${strokeW + 0.5}" stroke-linejoin="round"/>
      <path d="M71 73 L77 79 L89 67" fill="none" stroke="${c.stroke}" stroke-width="${strokeW + 1}" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  } else if (variant === 'outdated') {
    // Triangle + Warning (half-faded)
    emblemPaths = `
      <g opacity="0.85">
        <path d="M80 52 L103 91 H57 Z" fill="${c.bg}" stroke="${c.stroke}" stroke-width="${strokeW + 0.5}" stroke-linejoin="round"/>
        <path d="M80 66 V76 M80 82.5 V83" fill="none" stroke="${c.stroke}" stroke-width="${strokeW + 0.8}" stroke-linecap="round"/>
      </g>
    `;
  } else if (variant === 'forged') {
    // Octagon + X + diagonal jagged crack that breaks the ring
    emblemPaths = `
      <path d="M68 52 H92 L104 64 V88 L92 100 H68 L56 88 V64 Z" fill="${c.bg}" stroke="${c.stroke}" stroke-width="${strokeW + 0.5}" stroke-linejoin="round"/>
      <path d="M70 66 L90 86 M90 66 L70 86" fill="none" stroke="${c.stroke}" stroke-width="${strokeW + 1}" stroke-linecap="round"/>
      <!-- Diagonal jagged crack splitting the seal -->
      <path class="seal-crack-line" d="M30 38 L64 74 L58 84 L102 124 L132 144" fill="none" stroke="var(--red, #a6301d)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="seal-crack-line" d="M64 74 L84 66" fill="none" stroke="var(--red, #a6301d)" stroke-width="1.8" stroke-linecap="round"/>
    `;
  } else {
    // Pending: Dashed lock/clock
    emblemPaths = `
      <rect x="65" y="70" width="30" height="22" rx="4" fill="${c.bg}" stroke="${c.stroke}" stroke-width="${strokeW}"/>
      <path d="M71 70 V62 C71 57 75 53 80 53 C85 53 89 57 89 62 V70" fill="none" stroke="${c.stroke}" stroke-width="${strokeW}" stroke-dasharray="2 2"/>
      <circle cx="80" cy="80" r="2.5" fill="${c.stroke}"/>
    `;
  }

  const svgHtml = `
    <defs>
      <filter id="ink-bleed-${uid}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"/>
      </filter>
      ${!isMini ? `<path id="text-path-${uid}" d="M 80, 80 m -56, 0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"/>` : ''}
    </defs>

    <!-- Outer Guilloche / Decorative Ring -->
    <circle cx="80" cy="80" r="76" class="seal-ring-outer" stroke="${c.stroke}" stroke-width="${strokeW}" fill="none" stroke-opacity="0.9"/>
    <circle cx="80" cy="80" r="72" class="seal-ring-teeth" stroke="${c.stroke}" stroke-width="${strokeW * 1.5}" stroke-dasharray="3.5 3.5" fill="none" stroke-opacity="0.55"/>
    <circle cx="80" cy="80" r="67" class="seal-ring-mid" stroke="${c.stroke}" stroke-width="${strokeW * 0.75}" fill="none" stroke-opacity="0.7"/>

    <!-- Rotating Curved Text Ring (full seal only) -->
    ${!isMini ? `
      <g class="seal-rotator ${animated ? 'is-spinning' : ''}" style="transform-origin: 80px 80px;">
        <text class="seal-curved-text" font-size="8.8" font-weight="700" fill="${c.stroke}" letter-spacing="1.4">
          <textPath href="#text-path-${uid}" xlink:href="#text-path-${uid}" startOffset="50%" text-anchor="middle">
            ভূমি লিপি • BHUMI LIPI • SEALED &amp; VERIFIED •
          </textPath>
        </text>
      </g>
    ` : ''}

    <!-- Inner Rings -->
    <circle cx="80" cy="80" r="${isMini ? 58 : 47}" class="seal-ring-inner" stroke="${c.stroke}" stroke-width="${strokeW}" fill="none"/>
    <circle cx="80" cy="80" r="${isMini ? 52 : 43}" class="seal-ring-inner-dots" stroke="${c.stroke}" stroke-width="${strokeW * 0.75}" stroke-dasharray="2 2" fill="none" stroke-opacity="0.6"/>

    <!-- Emblem -->
    <g class="seal-emblem">
      ${emblemPaths}
    </g>
  `;

  const containerClasses = [
    'seal-badge',
    `seal-${variant}`,
    isMini ? 'seal-mini' : 'seal-full',
    animated && stamped ? 'seal-stamped' : '',
  ].filter(Boolean).join(' ');

  const wrapper = h('div', {
    class: containerClasses,
    role: 'img',
    'aria-label': labels[variant] || labels.genuine,
    style: `width:${size}px;height:${size}px;color:${c.stroke}`,
  });

  const svg = h('svg', {
    viewBox: '0 0 160 160',
    width: size,
    height: size,
    class: 'seal-svg',
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    html: svgHtml,
  });

  wrapper.append(svg);

  if (caption) {
    wrapper.append(h('span', { class: 'seal-caption sr' }, caption));
  }

  return wrapper;
}
