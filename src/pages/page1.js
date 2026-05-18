const { header, footer } = require('./layout');
const { elevationSVG, sideViewSVG, AL, AR, AT, AB, SIDE_PAD_L, SIDE_PAD_R } = require('../svg');
const C = require('../colors');

// Drawing-area content width in mm: 420 page − 49 sidebar − 2 pad-left − 3 pad-right = 366
const DRAW_W = 366;
// Gap between the two side-view blocks (from .side-views CSS gap)
const SIDE_GAP = 2;

function page1(config) {
  const { summary, materials, leftFace, rightFace, heightMM, widthMM } = config;

  const maxDepthLeft  = leftFace.length  ? Math.max(...leftFace.map(s => s.depth))  : config.depthMM;
  const maxDepthRight = rightFace.length ? Math.max(...rightFace.map(s => s.depth)) : config.depthMM;

  // Shared viewBox height for all three SVGs
  const VH = AT + heightMM + AB;
  // Individual viewBox widths
  const mainVW  = AL + widthMM + AR;
  const leftVW  = SIDE_PAD_L + maxDepthLeft  + SIDE_PAD_R;
  const rightVW = SIDE_PAD_L + maxDepthRight + SIDE_PAD_R;
  const sumVW   = mainVW + leftVW + rightVW;

  // Row height and CSS widths so every SVG fills its container at the same height
  const rowH   = (DRAW_W - SIDE_GAP) * VH / sumVW;
  const wMain  = rowH * mainVW  / VH;
  const wLeft  = rowH * leftVW  / VH;
  const wRight = rowH * rightVW / VH;
  const wSides = wLeft + wRight + SIDE_GAP;

  const leftSVG  = sideViewSVG(leftFace,  heightMM, maxDepthLeft,  'LEFT FACE');
  const rightSVG = sideViewSVG(rightFace, heightMM, maxDepthRight, 'RIGHT FACE');

  const sidebar = `
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-title">Wall Summary</div>
      <div class="kv"><div class="kv-key">Total Width</div><div class="kv-val">${summary.totalWidth} mm</div></div>
      <div class="kv"><div class="kv-key">Total Height</div><div class="kv-val">${summary.totalHeight} mm</div></div>
      <div class="kv"><div class="kv-key">Base Depth</div><div class="kv-val">${summary.baseDepth} mm</div></div>
      ${summary.upperDepth ? `<div class="kv"><div class="kv-key">Upper Depth</div><div class="kv-val">${summary.upperDepth} mm</div></div>` : ''}
      ${summary.countertopHeight != null ? `<div class="kv"><div class="kv-key">Countertop height</div><div class="kv-val">${summary.countertopHeight} mm</div></div>` : ''}
      ${summary.splashbackHeight != null ? `<div class="kv"><div class="kv-key">Splashback</div><div class="kv-val">${summary.splashbackHeight} mm h</div></div>` : ''}
      <div class="kv"><div class="kv-key">Config</div><div class="kv-val">${summary.config}</div></div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">Type Legend</div>
      <div class="legend-item"><div class="swatch sw-corpus"></div><span>Corpus</span></div>
      <div class="legend-item"><div class="swatch sw-countertop"></div><span>Countertop</span></div>
      <div class="legend-item"><div class="swatch sw-splashback"></div><span>Splashback</span></div>
      <div class="legend-item"><div class="swatch sw-panel"></div><span>Side panel</span></div>
      <div class="legend-item"><div class="swatch sw-plinth"></div><span>Plinth</span></div>
      <div class="legend-item"><div class="swatch sw-led" style="width:16px;height:4px;border-radius:1px;"></div><span>LED strip</span></div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">Materials</div>
      <div class="mat-item">
        <span class="mat-dot" style="background:${C.accent}"></span>
        <div class="mat-text"><span class="mat-label">Corpus</span><span class="mat-name">${materials.corpus}</span></div>
      </div>
      <div class="mat-item">
        <span class="mat-dot" style="background:${C.accent}"></span>
        <div class="mat-text"><span class="mat-label">Side panels</span><span class="mat-name">${materials.fronts}</span></div>
      </div>
      ${materials.countertop ? `
      <div class="mat-item">
        <span class="mat-dot" style="background:${C.accent}"></span>
        <div class="mat-text"><span class="mat-label">Worktop</span><span class="mat-name">${materials.countertop}</span></div>
      </div>` : ''}
      ${materials.splashback ? `
      <div class="mat-item">
        <span class="mat-dot" style="background:${C.accent}"></span>
        <div class="mat-text"><span class="mat-label">Backsplash</span><span class="mat-name">${materials.splashback}</span></div>
      </div>` : ''}
    </div>
  </div>`;

  const elevation = elevationSVG(config, 'modules');

  return `
  <div class="page">
    ${header('Module Overview', config, 1, 4)}
    <div class="page-body">
      ${sidebar}
      <div class="drawing-area">
        <div class="drawing-row" style="height:${rowH.toFixed(1)}mm; flex:none; overflow:hidden;">
          <div class="side-view-block" style="width:${wMain.toFixed(1)}mm; flex:none;">
            <div class="side-view-label">Front Face</div>
            <div class="side-view-svg">${elevation}</div>
          </div>
          <div class="side-views" style="width:${wSides.toFixed(1)}mm;">
            <div class="side-view-block" style="width:${wLeft.toFixed(1)}mm; flex:none;">
              <div class="side-view-label">A · Left Face</div>
              <div class="side-view-svg">${leftSVG}</div>
            </div>
            <div class="side-view-block" style="width:${wRight.toFixed(1)}mm; flex:none;">
              <div class="side-view-label">B · Right Face</div>
              <div class="side-view-svg">${rightSVG}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${footer(config)}
  </div>`;
}

module.exports = page1;
