const C = require('./colors');

// ── Coordinate system ────────────────────────────────────────────────────────
// JSON: y=0 at the floor, increases upward.
// SVG:  y=0 at the top, increases downward.
// All drawing coordinates are in mm (the viewBox unit).
// Annotation padding around the cabinet drawing:
const AL = 185; // left  (vertical dimension labels)
const AR = 30;  // right
const AT = 70;  // top   (zone labels + top dim lines)
const AB = 148; // bottom (width dimension labels)

function svgRect(m, H) {
  return {
    x: AL + m.x,
    y: AT + H - m.y - m.heightMM,
    w: m.widthMM,
    h: m.heightMM,
  };
}

function vb(W, H) {
  return `0 0 ${AL + W + AR} ${AT + H + AB}`;
}

// ── Stroke helpers ────────────────────────────────────────────────────────────
const NS = 'vector-effect="non-scaling-stroke"';

function rect(x, y, w, h, fill, stroke, sw, extra = '') {
  const s = stroke ? `stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${s} ${NS} ${extra}/>`;
}

function line(x1, y1, x2, y2, stroke, sw, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${NS} ${extra}/>`;
}

function text(x, y, content, fontSize, fill, anchor = 'start', weight = 'normal', extra = '') {
  return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}" font-family="'DM Mono', monospace" font-weight="${weight}" text-anchor="${anchor}" ${extra}>${content}</text>`;
}

// ── Module base rendering (Page 1 style) ─────────────────────────────────────
function renderModuleBase(m, x, y, w, h) {
  let out = '';

  if (m.type === 'plinth') {
    out += rect(x, y, w, h, C.plinthFill, 'none', 0);
  } else if (m.type === 'panel') {
    out += rect(x, y, w, h, C.panelFill, C.panelStroke, 2);
  } else if (m.type === 'countertop') {
    out += rect(x, y, w, h, C.countertopFill, C.corpusStroke, 2);
  } else if (m.type === 'splashback') {
    out += rect(x, y, w, h, C.splashbackFill, C.corpusStroke, 2);
    // LED groove: orange line at the top of the LED partition (inset from module top)
    const led = (m.partitions || []).find(p => p.type === 'led');
    if (led && (led.ledSides || []).includes('top')) {
      const ledY = y + h - led.y - led.heightMM;
      out += line(x + led.x, ledY, x + led.x + led.widthMM, ledY, C.ledColor, 5);
    }
  } else {
    // corpus
    out += rect(x, y, w, h, C.corpusFill, C.corpusStroke, 3);
  }

  return out;
}

// ── Module label badge ────────────────────────────────────────────────────────
function moduleLabel(m, x, y) {
  if (!m.name) return '';
  const lx = x + 9;
  const ly = y + 9;
  const fs = 28;
  const padL = 7;
  const padR = 14;
  const bw = m.name.length * 17 + padL + padR;
  const bh = fs + padL * 1.5;
  return `
    <rect x="${lx}" y="${ly}" width="${bw}" height="${bh}" rx="3" fill="${C.labelBg}" ${NS}/>
    ${text(lx + padL, ly + bh - padL - 1, m.name, fs, C.labelText, 'start', '500')}
  `;
}

// ── Interior elements ─────────────────────────────────────────────────────────
function renderDrawerSet(x, y, w, h, opts) {
  const num = opts?.drawersNum || 1;
  const space = opts?.spaceBetweenDrawersMM || 25;
  const drawerH = (h - (num - 1) * space) / num;
  let out = rect(x, y, w, h, C.drawerFill, 'none', 0);

  for (let i = 0; i < num; i++) {
    const dy = y + i * (drawerH + space);
    // Drawer face with slight inset
    out += rect(x + 4, dy + 4, w - 8, drawerH - 8, C.drawerFaceFill, 'none', 0);
    // Pull line
    const py = dy + drawerH / 2;
    out += line(x + w * 0.3, py, x + w * 0.7, py, C.pageBg, 2);
  }
  return out;
}

function renderInteriorPartitions(m, H) {
  let out = '';
  for (const p of (m.partitions || [])) {
    const px = AL + m.x + p.x;
    const py = AT + H - (m.y + p.y) - p.heightMM;

    if (p.type === 'shelf') {
      out += rect(px, py, p.widthMM, p.heightMM, C.shelfFill, 'none', 0);
    } else if (p.type === 'verticalDivider') {
      out += rect(px, py, p.widthMM, p.heightMM, C.dividerFill, 'none', 0);
    } else if (p.type === 'drawerSet') {
      out += renderDrawerSet(px, py, p.widthMM, p.heightMM, p.drawersOptions);
    } else if (p.type === 'led') {
      // Draw only the sides specified in ledSides as orange lines
      const ledSides = p.ledSides || ['top'];
      if (ledSides.includes('top'))    out += line(px, py,                    px + p.widthMM, py,                    C.ledColor, 5);
      if (ledSides.includes('bottom')) out += line(px, py + p.heightMM,       px + p.widthMM, py + p.heightMM,       C.ledColor, 5);
      if (ledSides.includes('left'))   out += line(px, py,                    px,             py + p.heightMM,       C.ledColor, 5);
      if (ledSides.includes('right'))  out += line(px + p.widthMM, py,        px + p.widthMM, py + p.heightMM,       C.ledColor, 5);
    }
  }
  return out;
}

function renderInteriorDimensions(m, H) {
  const parts    = m.partitions || [];
  const shelves  = parts.filter(p => p.type === 'shelf').sort((a, b) => a.y - b.y);
  const dividers = parts.filter(p => p.type === 'verticalDivider').sort((a, b) => a.x - b.x);

  if (!shelves.length && !dividers.length) return '';

  const mLeft   = AL + m.x;
  const mBottom = AT + H - m.y;

  let out = '';
  const DIM_FS   = 26;
  const DIM_TICK = 10;
  const MIN_GAP  = 30;

  // Build columns from divider positions
  const cols = [];
  let prevX = 0;
  for (const d of dividers) {
    cols.push({ left: prevX, right: d.x });
    prevX = d.x + d.widthMM;
  }
  cols.push({ left: prevX, right: m.widthMM });

  // Vertical dims per column — near each column's right wall
  if (shelves.length) {
    for (const col of cols) {
      const colShelves = shelves
        .filter(s => s.x < col.right && s.x + s.widthMM > col.left)
        .sort((a, b) => a.y - b.y);
      if (!colShelves.length) continue;

      const ys   = [0, ...colShelves.flatMap(s => [s.y, s.y + s.heightMM]), m.heightMM];
      const dimX = mLeft + col.right - 30;

      for (let i = 0; i < ys.length - 1; i += 2) {
        const clearH = ys[i + 1] - ys[i];
        if (clearH < MIN_GAP) continue;
        const svgTop    = AT + H - m.y - ys[i + 1];
        const svgBottom = AT + H - m.y - ys[i];
        out += dimV(svgTop, svgBottom, dimX, `${clearH}`, { fs: DIM_FS, tickLen: DIM_TICK });
      }
    }
  }

  // Horizontal dims at the bottom of the module
  if (dividers.length) {
    const xs   = [0, ...dividers.flatMap(d => [d.x, d.x + d.widthMM]), m.widthMM];
    const dimY = mBottom - 40;
    for (let i = 0; i < xs.length - 1; i += 2) {
      const clearW = xs[i + 1] - xs[i];
      if (clearW < MIN_GAP) continue;
      out += dimH(mLeft + xs[i], mLeft + xs[i + 1], dimY, `${clearW}`, { fs: DIM_FS, tickLen: DIM_TICK });
    }
  }

  return out;
}

function renderDoorDimensions(m, H) {
  const doors = m.doors || [];
  if (!doors.length) return '';

  let out = '';
  const DIM_FS   = 26;
  const DIM_TICK = 10;

  for (const d of doors) {
    const dx      = AL + d.x;
    const dTop    = AT + H - d.y - d.heightMM;
    const dBottom = AT + H - d.y;

    // Width at the bottom of each door
    out += dimH(dx, dx + d.widthMM, dBottom - 40, `${d.widthMM}`, { fs: DIM_FS, tickLen: DIM_TICK });

    // Height near the right edge of each door
    out += dimV(dTop, dBottom, dx + d.widthMM - 30, `${d.heightMM}`, { fs: DIM_FS, tickLen: DIM_TICK });
  }

  return out;
}

// ── Door graphics (Page 3 style) ──────────────────────────────────────────────
function doorLineOpts() {
  return `stroke="${C.doorLine}" stroke-width="1.5" stroke-linecap="round" ${NS}`;
}

function doorGraphicSingleLeft(x, y, w, h) {
  // Hinged left → opens right → > shape (apex at right-center)
  const lx = x + w * 0.08;
  const ax = x + w * 0.72;
  const cy = y + h * 0.5;
  const o = doorLineOpts();
  return `
    <line x1="${lx}" y1="${y + h * 0.08}" x2="${ax}" y2="${cy}" ${o}/>
    <line x1="${lx}" y1="${y + h * 0.92}" x2="${ax}" y2="${cy}" ${o}/>
  `;
}

function doorGraphicSingleRight(x, y, w, h) {
  // Hinged right → opens left → < shape (apex at left-center)
  const rx = x + w * 0.92;
  const ax = x + w * 0.28;
  const cy = y + h * 0.5;
  const o = doorLineOpts();
  return `
    <line x1="${rx}" y1="${y + h * 0.08}" x2="${ax}" y2="${cy}" ${o}/>
    <line x1="${rx}" y1="${y + h * 0.92}" x2="${ax}" y2="${cy}" ${o}/>
  `;
}

function doorGraphicFlapUp(x, y, w, h) {
  // Hinged top → opens upward → ^ shape (apex at top-center)
  const tx = x + w * 0.5;
  const ty = y + h * 0.08;
  const o = doorLineOpts();
  return `
    <line x1="${x + w * 0.08}" y1="${y + h * 0.92}" x2="${tx}" y2="${ty}" ${o}/>
    <line x1="${x + w * 0.92}" y1="${y + h * 0.92}" x2="${tx}" y2="${ty}" ${o}/>
  `;
}

function doorGraphicDouble(x, y, w, h) {
  // Two doors hinged at outer edges, meeting at centre — X / diamond pattern
  const cx = x + w / 2;
  const cy = y + h / 2;
  const topY = y + h * 0.08;
  const botY = y + h * 0.92;
  const lx  = x + w * 0.04;
  const rx  = x + w * 0.96;
  const o = doorLineOpts();
  return `
    <line x1="${lx}" y1="${topY}" x2="${cx}" y2="${cy}" ${o}/>
    <line x1="${lx}" y1="${botY}" x2="${cx}" y2="${cy}" ${o}/>
    <line x1="${rx}" y1="${topY}" x2="${cx}" y2="${cy}" ${o}/>
    <line x1="${rx}" y1="${botY}" x2="${cx}" y2="${cy}" ${o}/>
  `;
}

function renderDoorFronts(m, x, y, w, h, H) {
  if (m.type !== 'corpus') return renderModuleBase(m, x, y, w, h);

  const doors = m.doors || [];
  if (doors.length === 0) {
    // Open module — white with "open" label
    let out = rect(x, y, w, h, C.corpusFill, C.corpusStroke, 3);
    out += text(x + w / 2, y + h / 2 + 20, 'open', 55, C.textMuted, 'middle');
    return out;
  }

  // Corpus background (dark)
  let out = rect(x, y, w, h, C.doorFill, C.corpusStroke, 3);

  for (const d of doors) {
    const dx = AL + d.x;
    const dy = AT + H - d.y - d.heightMM;
    const dw = d.widthMM;
    const dh = d.heightMM;

    if (d.type === 'fixed-panel') {
      out += rect(dx, dy, dw, dh, C.fixedPanelFill, 'none', 0);
    } else if (d.type === 'single-left') {
      out += doorGraphicSingleLeft(dx, dy, dw, dh);
    } else if (d.type === 'single-right') {
      out += doorGraphicSingleRight(dx, dy, dw, dh);
    } else if (d.type === 'flap-up') {
      out += doorGraphicFlapUp(dx, dy, dw, dh);
    } else if (d.type === 'double') {
      out += doorGraphicDouble(dx, dy, dw, dh);
    }
  }

  return out;
}

// ── Dimension lines ───────────────────────────────────────────────────────────
function dimH(x1, x2, y, label, opts = {}) {
  const { fs = 38, tickLen = 18 } = opts;
  const mx = (x1 + x2) / 2;
  return `
    ${line(x1, y, x2, y, C.dimColor, 1.5)}
    ${line(x1, y - tickLen / 2, x1, y + tickLen / 2, C.dimColor, 1.5)}
    ${line(x2, y - tickLen / 2, x2, y + tickLen / 2, C.dimColor, 1.5)}
    ${text(mx, y - 10, label, fs, C.dimColor, 'middle')}
  `;
}

function dimV(y1, y2, x, label, opts = {}) {
  const { fs = 38, tickLen = 18 } = opts;
  const my = (y1 + y2) / 2;
  return `
    ${line(x, y1, x, y2, C.dimColor, 1.5)}
    ${line(x - tickLen / 2, y1, x + tickLen / 2, y1, C.dimColor, 1.5)}
    ${line(x - tickLen / 2, y2, x + tickLen / 2, y2, C.dimColor, 1.5)}
    <text x="${x - 12}" y="${my}" font-size="${fs}" fill="${C.dimColor}" font-family="'DM Mono', monospace"
      text-anchor="middle" transform="rotate(-90,${x - 12},${my})">${label}</text>
  `;
}

function renderDimensions(config) {
  const { widthMM: W, heightMM: H, modules, lowerZoneTop, upperZoneBottom, plinthHeight } = config;
  let d = '';

  // ── Bottom: individual module widths (all modules at floor level) ────────────
  // Includes side panels so their 19mm widths are annotated too.
  const colY = AT + H + 48;
  const floorModules = modules
    .filter(m => m.y === 0)
    .sort((a, b) => a.x - b.x);

  // Draw a continuous tick-line at colY spanning full width
  d += line(AL, colY, AL + W, colY, C.dimColor, 1.5);

  for (const m of floorModules) {
    const x1 = AL + m.x;
    const x2 = AL + m.x + m.widthMM;
    const isNarrow = m.widthMM < 50;
    const fs = isNarrow ? 22 : 30;
    const tickLen = isNarrow ? 10 : 14;
    const mx = (x1 + x2) / 2;

    // End ticks only (no centre-line duplicate — the continuous line is already there)
    d += line(x1, colY - tickLen / 2, x1, colY + tickLen / 2, C.dimColor, 1.5);
    d += line(x2, colY - tickLen / 2, x2, colY + tickLen / 2, C.dimColor, 1.5);
    d += text(mx, colY - 12, `${m.widthMM}`, fs, C.dimColor, 'middle');
  }

  // ── Bottom: total width (below the per-module row) ────────────────────────
  const bottomY = AT + H + 105;
  d += dimH(AL, AL + W, bottomY, `${W} mm`, { fs: 42 });

  // ── Left: zone heights ──────────────────────────────────────────────────────
  const leftX = AL - 130;

  // Total height
  d += dimV(AT, AT + H, leftX, `${H} mm`, { fs: 42 });

  const zoneX = AL - 65;

  // Plinth zone
  if (plinthHeight > 0) {
    const pTop = AT + H - plinthHeight;
    d += dimV(pTop, AT + H, zoneX, `${plinthHeight}`, { fs: 28, tickLen: 10 });
  }

  // Lower zone (above plinth to countertop)
  if (lowerZoneTop > plinthHeight) {
    const lBot = AT + H - plinthHeight;
    const lTop = AT + H - lowerZoneTop;
    d += dimV(lTop, lBot, zoneX, `${lowerZoneTop - plinthHeight}`, { fs: 28, tickLen: 10 });
  }

  // Countertop + splashback zone
  if (upperZoneBottom > lowerZoneTop) {
    const cBot = AT + H - lowerZoneTop;
    const cTop = AT + H - upperZoneBottom;
    d += dimV(cTop, cBot, zoneX, `${upperZoneBottom - lowerZoneTop}`, { fs: 28, tickLen: 10 });
  }

  // Upper zone (only if meaningfully tall — suppresses island countertop-only sliver)
  if (H - upperZoneBottom > 50) {
    const uBot = AT + H - upperZoneBottom;
    const uTop = AT;
    d += dimV(uTop, uBot, zoneX, `${H - upperZoneBottom}`, { fs: 28, tickLen: 10 });
  }

  // ── Top: zone labels ────────────────────────────────────────────────────────
  const topY = AT - 30;

  // Upper zone: modules that START at the upper zone boundary (shallow wall cabinets)
  const upperOnly = modules.filter(m =>
    m.type === 'corpus' &&
    m.y >= upperZoneBottom - 5 &&
    m.y <= upperZoneBottom + 30  // excludes M7/M8 which start higher (mid-column tops)
  );
  if (upperOnly.length) {
    const uLeft = Math.min(...upperOnly.map(m => m.x));
    const uRight = Math.max(...upperOnly.map(m => m.x + m.widthMM));
    d += dimH(AL + uLeft, AL + uRight, topY, `${uRight - uLeft} mm · upper zone`, { fs: 34 });
  }

  // Tall zone: significantly taller than upper-zone cabinets (floor-to-near-ceiling columns)
  const tallCorpus = modules.filter(m =>
    m.type === 'corpus' && m.heightMM >= H * 0.6
  );
  if (tallCorpus.length) {
    const tLeft = Math.min(...tallCorpus.map(m => m.x));
    const tRight = Math.max(...tallCorpus.map(m => m.x + m.widthMM));
    d += dimH(AL + tLeft, AL + tRight, topY, `${tRight - tLeft} mm · tall zone`, { fs: 34 });
  }

  return d;
}

function renderDimensionsSimple(config) {
  const { widthMM: W, heightMM: H } = config;
  let d = '';
  d += dimH(AL, AL + W, AT + H + 50, `${W} mm`, { fs: 38 });
  return d;
}

// ── Side view SVG (section cut) ───────────────────────────────────────────────
// PAD_T and PAD_B intentionally match AT/AB so the cabinet body occupies the
// same vertical band as in the main elevation when both SVGs scale to the same height.
function sideViewSVG(profile, totalH, maxDepth, label) {
  const PAD_L = SIDE_PAD_L;
  const PAD_R = SIDE_PAD_R;
  const VW = maxDepth + PAD_L + PAD_R;
  const VH = totalH + AT + AB;

  const FILL = {
    corpus: C.corpusFill,
    countertop: C.countertopFill,
    splashback: C.splashbackFill,
    plinth: C.plinthFill,
    panel: C.panelFill,
  };

  let rects = '';
  for (const seg of profile) {
    const rx = PAD_L;
    const ry = AT + (totalH - seg.y - seg.h);
    const rw = seg.depth;
    const rh = seg.h;
    const fill = FILL[seg.type] || C.corpusFill;
    const stroke = seg.type === 'plinth' ? 'none' : C.corpusStroke;
    rects += rect(rx, ry, rw, rh, fill, stroke, 2);
  }

  // Bottom annotation for the maximum depth
  const depthY = AT + totalH + 105;
  rects += dimH(PAD_L, PAD_L + maxDepth, depthY, `${maxDepth} mm`, { fs: 42 });

  // Top-area annotation for the uppermost zone with a distinct depth —
  // mirrors how the front face draws zone labels at AT - 30
  const topSeg = profile
    .filter(s => s.depth < maxDepth && s.depth > 50 && (s.type === 'corpus' || s.type === 'countertop'))
    .sort((a, b) => b.y - a.y)[0];

  if (topSeg) {
    const topY = AT - 30;
    rects += dimH(PAD_L, PAD_L + topSeg.depth, topY, `${topSeg.depth} mm`, { fs: 34 });
  }

  return `<svg viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    ${rects}
  </svg>`;
}

// ── Main elevation SVG ────────────────────────────────────────────────────────
function elevationSVG(config, mode = 'modules') {
  const { widthMM: W, heightMM: H, modules } = config;

  const drawOrder = { plinth: 0, panel: 1, countertop: 2, splashback: 3, corpus: 4 };
  const sorted = [...modules].sort((a, b) => (drawOrder[a.type] ?? 5) - (drawOrder[b.type] ?? 5));

  let bodies = '';
  let labels = '';

  for (const m of sorted) {
    const { x, y, w, h } = svgRect(m, H);

    if (mode === 'modules') {
      bodies += renderModuleBase(m, x, y, w, h);
      labels += moduleLabel(m, x, y);
    } else if (mode === 'interiors') {
      // Draw base then overlay interior elements
      if (m.type === 'corpus') {
        bodies += rect(x, y, w, h, C.corpusFill, C.corpusStroke, 3);
        bodies += renderInteriorPartitions(m, H);
        bodies += renderInteriorDimensions(m, H);
      } else {
        bodies += renderModuleBase(m, x, y, w, h);
      }
      labels += moduleLabel(m, x, y);
    } else if (mode === 'doors') {
      bodies += renderDoorFronts(m, x, y, w, h, H);
      if (m.type === 'corpus') bodies += renderDoorDimensions(m, H);
      labels += moduleLabel(m, x, y);
    }
  }

  const dims = mode === 'modules'
    ? renderDimensions(config)
    : renderDimensionsSimple(config);

  // Outer cabinet boundary line
  const boundary = `<rect x="${AL}" y="${AT}" width="${W}" height="${H}" fill="none" stroke="${C.borderLight}" stroke-width="1" ${NS}/>`;

  return `<svg viewBox="${vb(W, H)}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    ${boundary}
    ${bodies}
    ${labels}
    ${dims}
  </svg>`;
}

const SIDE_PAD_L = 15;
const SIDE_PAD_R = 30;

module.exports = { elevationSVG, sideViewSVG, vb, AL, AB, AT, AR, SIDE_PAD_L, SIDE_PAD_R };
