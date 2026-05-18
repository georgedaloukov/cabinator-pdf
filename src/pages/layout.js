const C = require('../colors');

function header(title, config, pageNum, totalPages) {
  const dims = `${config.widthMM} × ${config.heightMM} mm`;
  const page = `PAGE ${pageNum} / ${totalPages}`;
  return `
  <div class="page-header">
    <div class="hdr-left">
      <span class="brand">CABINATOR</span>
      <span class="hdr-sub">Production Documentation · ${config.filename || 'Cabinet'}</span>
    </div>
    <div class="hdr-center">${pageNum} — <strong>${title}</strong></div>
    <div class="hdr-right">
      <span class="hdr-dims">${dims}</span>
      <span class="hdr-page">${page}</span>
    </div>
  </div>`;
}

function footer(config) {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `
  <div class="page-footer">
    <span>Cabinator · ${config.filename || 'Cabinet'} · Production Documentation Set</span>
    <span>${date}</span>
  </div>`;
}

const baseCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:ital,wght@0,400;0,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: A3 landscape; margin: 0; }

  html, body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 10px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 420mm;
    height: 297mm;
    background: ${C.pageBg};
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  .page-header {
    background: ${C.headerBg};
    color: ${C.headerText};
    height: 11mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6mm;
    flex-shrink: 0;
  }
  .hdr-left { display: flex; flex-direction: column; gap: 1px; }
  .brand { font-size: 8.5px; font-weight: 600; letter-spacing: 0.08em; color: ${C.accent}; }
  .hdr-sub { font-size: 7px; color: #888; letter-spacing: 0.02em; }
  .hdr-center { font-size: 13px; font-weight: 300; letter-spacing: 0.04em; }
  .hdr-center strong { font-weight: 600; }
  .hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .hdr-dims { font-size: 8.5px; color: ${C.accent}; font-weight: 500; }
  .hdr-page { font-size: 7px; color: #888; }

  .page-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .page-footer {
    background: ${C.headerBg};
    color: ${C.footerText};
    height: 8mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6mm;
    font-size: 7px;
    flex-shrink: 0;
  }

  /* Sidebar */
  .sidebar {
    width: 49mm;
    background: #fff;
    border-right: 0.3mm solid ${C.borderLight};
    padding: 4mm 4mm 4mm 5mm;
    display: flex;
    flex-direction: column;
    gap: 4mm;
    overflow: hidden;
    flex-shrink: 0;
  }
  .sidebar-section { display: flex; flex-direction: column; gap: 1.5mm; }
  .sidebar-section + .sidebar-section {
    border-top: 0.25mm solid ${C.borderLight};
    padding-top: 4mm;
  }
  .section-title {
    font-size: 7.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: ${C.textMuted};
    text-transform: uppercase;
    margin-bottom: 0.5mm;
  }
  .kv { display: flex; flex-direction: column; gap: 0.3mm; }
  .kv-key { font-size: 8px; color: ${C.textMuted}; }
  .kv-val { font-size: 10.5px; font-weight: 500; color: ${C.textPrimary}; }

  /* Legend */
  .legend-item { display: flex; align-items: center; gap: 2mm; margin-bottom: 1mm; }
  .swatch {
    width: 8px; height: 8px; border: 0.5px solid rgba(0,0,0,0.15); flex-shrink: 0;
  }
  .sw-corpus   { background: ${C.corpusFill}; border-color: ${C.corpusStroke}; }
  .sw-countertop { background: ${C.countertopFill}; }
  .sw-splashback { background: ${C.splashbackFill}; }
  .sw-panel    { background: ${C.panelFill}; }
  .sw-plinth   { background: ${C.plinthFill}; }
  .sw-led      { background: ${C.ledColor}; border: none; }
  .sw-shelf    { background: ${C.shelfFill}; border: none; }
  .sw-drawer   { background: ${C.drawerFill}; border: none; }
  .sw-divider  { background: ${C.dividerFill}; border: none; }
  .legend-item span { font-size: 9px; color: ${C.textPrimary}; }

  /* Material entries */
  .mat-item { margin-bottom: 2mm; display: flex; align-items: flex-start; gap: 2mm; }
  .mat-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
  .mat-text { display: flex; flex-direction: column; gap: 0.5mm; }
  .mat-label { font-size: 8px; color: ${C.textMuted}; }
  .mat-name  { font-size: 9.5px; font-weight: 500; color: ${C.textPrimary}; }

  /* Schedule lists (pages 2 & 3) */
  .schedule-list { display: flex; flex-direction: column; gap: 2mm; max-height: 120mm; overflow: hidden; }
  .schedule-item { }
  .schedule-item .s-name { font-size: 9px; color: ${C.accent}; font-weight: 600; }
  .schedule-item .s-desc { font-size: 9px; color: ${C.textPrimary}; }

  .thickness-list { display: flex; flex-direction: column; gap: 1.5mm; }
  .thickness-item .t-key { font-size: 8px; color: ${C.textMuted}; }
  .thickness-item .t-val { font-size: 10px; font-weight: 500; color: ${C.textPrimary}; }

  /* Drawing area */
  .drawing-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 3mm 3mm 3mm 2mm;
    overflow: hidden;
    min-width: 0;
  }
  .drawing-label {
    font-size: 6.5px; color: ${C.textMuted}; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 2mm; font-weight: 500;
  }
  .elevation-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
  }
  .elevation-wrap svg { width: 100%; height: 100%; }

  /* Side views (page 1) — width set inline from page1.js based on computed proportions */
  .side-views {
    display: flex;
    flex-direction: row;
    gap: 2mm;
    padding-left: 2mm;
    flex-shrink: 0;
    min-height: 0;
    overflow: hidden;
  }
  .side-view-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }
  .side-view-label {
    font-size: 6px; letter-spacing: 0.08em; text-transform: uppercase;
    color: #fff; font-weight: 500; margin-bottom: 1mm;
    background: ${C.headerBg}; padding: 1.5mm 2mm;
    flex-shrink: 0;
  }
  .side-view-svg { flex: 1; min-height: 0; overflow: hidden; }
  .side-view-svg svg { width: 100%; height: 100%; }

  /* Main drawing row (page 1 has side views) */
  .drawing-row {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: 0;
  }
`;

module.exports = { header, footer, baseCSS };
