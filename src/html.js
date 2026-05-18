const { baseCSS } = require('./pages/layout');
const page1 = require('./pages/page1');
const page2 = require('./pages/page2');
const page3 = require('./pages/page3');
const page4 = require('./pages/page4');
const C = require('./colors');

const extraCSS = `
  /* BOM table */
  .bom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8px;
    margin-bottom: 5mm;
  }
  .bom-table thead tr {
    background: ${C.headerBg};
    color: #fff;
  }
  .bom-table th {
    padding: 2.5mm 3mm;
    text-align: left;
    font-weight: 500;
    font-size: 7px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .bom-table td {
    padding: 2mm 3mm;
    font-size: 8px;
    border-bottom: 0.25mm solid ${C.borderLight};
    color: ${C.textPrimary};
    vertical-align: middle;
  }
  .bom-table tfoot td {
    background: ${C.headerBg};
    color: #666;
    font-size: 7px;
    padding: 2mm 3mm;
    border: none;
  }

  /* BOM bottom panels */
  .bom-bottom {
    display: flex;
    gap: 6mm;
    margin-top: 4mm;
  }
  .bom-box {
    flex: 1;
    border: 0.25mm solid ${C.borderLight};
    padding: 3mm 4mm;
  }
  .bom-box-title {
    font-size: 6px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${C.textMuted};
    margin-bottom: 2.5mm;
    padding-bottom: 1.5mm;
    border-bottom: 0.25mm solid ${C.borderLight};
  }
  .mat-table { border-collapse: collapse; width: 100%; }
  .mat-table td { padding: 1mm 0; font-size: 8px; }
  .mt-key { color: ${C.textMuted}; width: 45%; font-size: 7.5px; }
  .mt-val { color: ${C.textPrimary}; font-weight: 500; }

  .cfg-notes { display: flex; flex-direction: column; gap: 1.5mm; }
  .cfg-notes div { font-size: 8px; color: ${C.textPrimary}; }
`;

function buildHTML(config) {
  const pages = [
    page1(config),
    page2(config),
    page3(config),
    page4(config),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cabinator · ${config.filename}</title>
  <style>
    ${baseCSS}
    ${extraCSS}
  </style>
</head>
<body>
  ${pages}
</body>
</html>`;
}

module.exports = { buildHTML };
