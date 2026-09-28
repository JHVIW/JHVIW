// Generates the animated SVGs for the JHVIW profile README.
// All text is converted to outlines so it renders identically everywhere
// (SVGs loaded through <img> can't fetch web fonts).
//
// Usage (from this folder):
//   npm i opentype.js@1.3.4
//   Put geist-400.ttf, geist-500.ttf and geistmono-400.ttf (Google Fonts) here
//   node generate.mjs .
import opentype from 'opentype.js';
import fs from 'node:fs';

const OUT = process.argv[2] || '.';
fs.mkdirSync(OUT, { recursive: true });

const F = {
  r: opentype.loadSync('geist-400.ttf'),
  m: opentype.loadSync('geist-500.ttf'),
  mono: opentype.loadSync('geistmono-400.ttf'),
};

const W = 1200, P = 48;
const EXPO = 'cubic-bezier(.16,1,.3,1)', QUART = 'cubic-bezier(.76,0,.24,1)';

function measure(font, str, size, tracking = 0) {
  const s = size / font.unitsPerEm;
  let w = 0, prev = null;
  for (const c of str) {
    const g = font.charToGlyph(c);
    if (prev) w += font.getKerningValue(prev, g) * s;
    w += g.advanceWidth * s + tracking * size;
    prev = g;
  }
  return w - tracking * size;
}

// Returns one path per character: [{ d, x }]
function glyphs(font, str, x, y, size, tracking = 0) {
  const s = size / font.unitsPerEm;
  const out = [];
  let prev = null;
  for (const c of str) {
    const g = font.charToGlyph(c);
    if (prev) x += font.getKerningValue(prev, g) * s;
    if (c !== ' ') out.push({ d: g.getPath(x, y, size).toPathData(1), x });
    x += g.advanceWidth * s + tracking * size;
    prev = g;
  }
  return out;
}

// Whole string as a single path; align: 'start' | 'end'
function text(font, str, x, y, size, { tracking = 0, align = 'start', cls = '', style = '' } = {}) {
  if (align === 'end') x -= measure(font, str, size, tracking);
  const d = glyphs(font, str, x, y, size, tracking).map(g => g.d).join('');
  return `<path class="${cls}"${style ? ` style="${style}"` : ''} d="${d}"/>`;
}

const THEME = `
  .bg { fill: #efeee9; }
  .fg { fill: #0f0f0e; }
  .mu { fill: #67655f; }
  .ac { fill: #ff5a1f; }
  .st { stroke: #0f0f0e; }
  .hl { stroke: rgba(15,15,14,.18); }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #0f0f0e; }
    .fg { fill: #efeee9; }
    .mu { fill: #8f8c85; }
    .st { stroke: #efeee9; }
    .hl { stroke: rgba(239,238,233,.2); }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
  }`;

const svg = (h, title, style, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>${THEME}
${style}
</style>
<rect class="bg" width="${W}" height="${h}"/>
${body}
</svg>
`;

/* ------------------------------------------------------------------
   Header
   ------------------------------------------------------------------ */
{
  const nameSize = (W - 2 * P) / (measure(F.m, 'Iwaarden', 1, -0.055));
  const cap = F.m.charToGlyph('I').getBoundingBox().y2 / F.m.unitsPerEm * nameSize;
  const topY = 76;
  const y1 = topY + 64 + cap;
  const y2 = y1 + nameSize * 0.8;
  const ruleY = y2 + 40;
  const footY = ruleY + 40;
  const H = footY + P - 8;

  const line = (str, y, align, baseDelay, id) => {
    let x = align === 'end' ? W - P - measure(F.m, str, nameSize, -0.055) + nameSize * 0.02 : P - nameSize * 0.035;
    const gs = glyphs(F.m, str, x, y, nameSize, -0.055);
    return `<clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${y + 6}"/></clipPath>
<g clip-path="url(#${id})">${gs.map((g, i) => `<path class="c fg" style="animation-delay:${baseDelay + i * 55}ms" d="${g.d}"/>`).join('')}</g>`;
  };

  const role = text(F.m, 'Software Developer, AI Lead & Cybersecurity', P, topY, 23, { tracking: -0.02, cls: 'fg f', style: 'animation-delay:.9s' });
  const statusStr = 'Open to projects & conversations';
  const statusW = measure(F.r, statusStr, 17);
  const status = text(F.r, statusStr, W - P, topY, 17, { align: 'end', cls: 'mu f', style: 'animation-delay:1s' });
  const dotX = W - P - statusW - 16, dotY = topY - 6;

  const monoL = text(F.mono, 'Tilburg, NL', P, footY, 14, { cls: 'mu f', style: 'animation-delay:1.5s' });
  const monoM = text(F.mono, 'AI Lead @ Bodegro · Founder @ CS2Locker', P + (W - 2 * P) * 0.25 + 6, footY, 14, { cls: 'mu f', style: 'animation-delay:1.6s' });
  const monoR = text(F.mono, 'jhviw.github.io', W - P, footY, 14, { align: 'end', cls: 'fg f', style: 'animation-delay:1.7s' });

  const style = `
  .c { animation: rise 1.5s ${EXPO} both; }
  @keyframes rise { from { transform: translateY(${Math.round(nameSize * 1.05)}px); } }
  .f { animation: fade 1.2s ${EXPO} both; }
  @keyframes fade { from { opacity: 0; transform: translateY(10px); } }
  .rule { stroke-width: 1.5; transform-origin: ${P}px ${ruleY}px; animation: draw 1.8s ${QUART} .7s both; }
  @keyframes draw { from { transform: scaleX(0); } }
  .ring { fill: none; stroke: #ff5a1f; stroke-width: 1.2; transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ${EXPO} 1.2s infinite; }
  @keyframes pulse { from { transform: scale(1); opacity: 1; } to { transform: scale(3.4); opacity: 0; } }`;

  const body = `${role}
<g class="f" style="animation-delay:1s"><circle class="ac" cx="${dotX}" cy="${dotY}" r="5"/><circle class="ring" cx="${dotX}" cy="${dotY}" r="5"/></g>
${status}
${line('Rick van', y1, 'start', 250, 'l1')}
${line('Iwaarden', y2, 'end', 420, 'l2')}
<line class="rule st" x1="${P}" y1="${ruleY}" x2="${W - P}" y2="${ruleY}"/>
${monoL}
${monoM}
${monoR}`;
  fs.writeFileSync(`${OUT}/header.svg`, svg(Math.round(H), 'Rick van Iwaarden — Software Developer, AI Lead and Cybersecurity. Tilburg, NL.', style, body));
  console.log('header', Math.round(H), 'nameSize', nameSize.toFixed(1));
}

/* ------------------------------------------------------------------
   CS2Locker figure: stats + data flow
   ------------------------------------------------------------------ */
{
  const L = W - 2 * P;
  const gut = 24, colW = (L - 3 * gut) / 4;
  const capY = 52, statLblY = 112, statNumY = 196, lineY = 262;
  const nodeLblY = lineY + 44, nodeTY = nodeLblY + 32, nodeDY = nodeTY + 26;
  const H = nodeDY + P;
  const T = 3.6, TAIL = 0.26;

  const stats = [['Visitors per day', '~5K'], ['Market integrations', '20+'], ['Catalog items', '~50K'], ['API endpoints', '260+']];
  const nodes = [
    ['01 — Sources', '20+ marketplaces', 'Steam, CSFloat, Buff163 …'],
    ['02 — Ingest', 'NDJSON streams', 'Backoff, hourly cron'],
    ['03 — Store', 'PostgreSQL', 'PgBouncer pooling'],
    ['04 — Render', 'Nuxt 3 SSR', 'Nitro ISR, live SSE'],
    ['05 — Edge', 'Cloudflare', 'Multi-tier cache'],
    ['06 — Users', '~5K a day', 'EN + RU, web-push'],
  ];
  const nodeW = L / 6;

  let body = '';
  body += text(F.mono, 'Fig. 01 — CS2Locker, data flow', P, capY, 14, { cls: 'mu f', style: 'animation-delay:.1s' });
  body += text(F.mono, 'Simplified', W - P, capY, 14, { align: 'end', cls: 'mu f', style: 'animation-delay:.2s' });
  body += `<line class="rule st" x1="${P}" y1="${capY + 22}" x2="${W - P}" y2="${capY + 22}"/>`;

  stats.forEach(([lbl, num], i) => {
    const x = P + i * (colW + gut);
    body += text(F.mono, lbl, x, statLblY, 14, { cls: 'mu f', style: `animation-delay:${.35 + i * .1}s` });
    const gs = glyphs(F.r, num, x - 3, statNumY, 76, -0.05);
    body += `<clipPath id="s${i}"><rect x="${x - 10}" y="0" width="${colW + 20}" height="${statNumY + 4}"/></clipPath><g clip-path="url(#s${i})">`;
    body += gs.map((g, j) => `<path class="n fg" style="animation-delay:${450 + i * 110 + j * 45}ms" d="${g.d}"/>`).join('');
    body += '</g>';
  });

  // Track, comet and nodes
  body += `<clipPath id="trk"><rect x="${P}" y="${lineY - 8}" width="${L}" height="16"/></clipPath>`;
  body += `<line class="track hl" x1="${P}" y1="${lineY}" x2="${W - P}" y2="${lineY}"/>`;
  body += `<defs><linearGradient id="tail" x1="0" x2="1"><stop offset="0" stop-color="#ff5a1f" stop-opacity="0"/><stop offset="1" stop-color="#ff5a1f"/></linearGradient></defs>`;
  body += `<g clip-path="url(#trk)"><g class="comet"><rect x="${P - L * TAIL}" y="${lineY - .75}" width="${L * TAIL}" height="1.5" fill="url(#tail)"/><circle cx="${P}" cy="${lineY}" r="4" fill="#ff5a1f"/></g></g>`;
  nodes.forEach(([k, t, d], i) => {
    const x = P + i * nodeW;
    const delay = 1 + i * .12;
    const flash = 2.2 + T * (i * nodeW) / (L * (1 + TAIL));
    body += `<g class="f" style="animation-delay:${delay}s"><circle class="node bg st" cx="${x + 5}" cy="${lineY}" r="5"/><circle class="hit ac" style="animation-delay:${flash.toFixed(3)}s" cx="${x + 5}" cy="${lineY}" r="5"/></g>`;
    body += text(F.mono, k, x, nodeLblY, 13, { cls: 'mu f', style: `animation-delay:${delay + .05}s` });
    body += text(F.m, t, x, nodeTY, 20, { tracking: -0.02, cls: 'fg f', style: `animation-delay:${delay + .1}s` });
    body += text(F.r, d, x, nodeDY, 14.5, { cls: 'mu f', style: `animation-delay:${delay + .15}s` });
    const wT = measure(F.m, t, 20, -0.02), wD = measure(F.r, d, 14.5);
    if (Math.max(wT, wD) > nodeW - 14) console.warn('node text too wide', i, Math.round(wT), Math.round(wD), Math.round(nodeW));
  });

  const style = `
  .f { animation: fade 1.1s ${EXPO} both; }
  @keyframes fade { from { opacity: 0; transform: translateY(8px); } }
  .n { animation: rise 1.3s ${EXPO} both; }
  @keyframes rise { from { transform: translateY(90px); } }
  .rule { stroke-width: 1.5; transform-origin: ${P}px 0; animation: draw 1.6s ${QUART} .1s both; }
  .track { stroke-width: 1.5; transform-origin: ${P}px 0; animation: draw 1.8s ${QUART} .9s both; }
  @keyframes draw { from { transform: scaleX(0); } }
  .node { stroke-width: 1.3; }
  .comet { transform: translateX(0); animation: flow ${T}s linear 2.2s infinite; opacity: 0; }
  @keyframes flow { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(${(L * (1 + TAIL)).toFixed(1)}px); opacity: 1; } }
  .hit { opacity: 0; transform-box: fill-box; transform-origin: center; animation: hit ${T}s linear infinite; }
  @keyframes hit { 0% { opacity: 1; transform: scale(1.5); } 16%, 100% { opacity: 0; transform: scale(.6); } }`;

  fs.writeFileSync(`${OUT}/cs2locker.svg`, svg(Math.round(H), 'CS2Locker data flow: 20+ marketplaces, NDJSON ingest, PostgreSQL, Nuxt 3 SSR, Cloudflare edge, about 5K visitors a day.', style, body));
  console.log('figure', Math.round(H));
}
