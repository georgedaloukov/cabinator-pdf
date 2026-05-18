const { header, footer } = require('./layout');
const { buildBOM } = require('../parser');
const C = require('../colors');

function page4(config) {
  const rows = buildBOM(config);
  const { summary, materials, moduleThickness, frontThickness, shelvesThickness, backwallThickness } = config;

  const tableRows = rows.map((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#F7F6F2';
    return `
    <tr style="background:${bg}">
      <td style="color:${C.accent};font-weight:600;">${r.name}</td>
      <td>${r.type}</td>
      <td>${r.width} mm</td>
      <td>${r.height} mm</td>
      <td>${r.depth} mm</td>
      <td>${r.doors}</td>
      <td>${r.internals}</td>
      <td>${r.opening}</td>
    </tr>`;
  }).join('');

  const matNotes = `
    <div class="bom-bottom">
      <div class="bom-box">
        <div class="bom-box-title">Materials Specification</div>
        <table class="mat-table">
          <tr><td class="mt-key">Corpus:</td><td class="mt-val">${materials.corpus}</td></tr>
          <tr><td class="mt-key">Fronts / Doors:</td><td class="mt-val">${materials.fronts}</td></tr>
          <tr><td class="mt-key">Plinths:</td><td class="mt-val">${materials.plinths}</td></tr>
          <tr><td class="mt-key">Shelves:</td><td class="mt-val">${materials.fronts} · ${shelvesThickness}mm</td></tr>
          <tr><td class="mt-key">Countertop (M2):</td><td class="mt-val">${materials.countertop}</td></tr>
          <tr><td class="mt-key">Backsplash (M9):</td><td class="mt-val">${materials.splashback}</td></tr>
        </table>
      </div>
      <div class="bom-box">
        <div class="bom-box-title">Configuration Notes</div>
        <div class="cfg-notes">
          <div>Wall type: ${summary.config}</div>
          <div>Backwall: ${backwallThickness}mm, all corpus modules</div>
          <div>Corpus thickness: ${moduleThickness}mm throughout</div>
          <div>Front thickness: ${frontThickness}mm throughout</div>
          ${summary.upperDepth ? `<div>Depth varies: ${summary.upperDepth}mm (upper wall) / ${summary.baseDepth}mm (base)</div>` : `<div>Depth: ${summary.baseDepth}mm</div>`}
          ${config.modules.some(m => m.partitions && m.partitions.some(p => p.type === 'led'))
            ? '<div>LED lighting: splashback, top groove, inside</div>' : ''}
        </div>
      </div>
    </div>`;

  return `
  <div class="page">
    ${header('Bill of Materials', config, 4, 4)}
    <div class="page-body" style="flex-direction:column;padding:5mm 6mm;">
      <table class="bom-table">
        <thead>
          <tr>
            <th>Module</th><th>Type</th><th>Width</th><th>Height</th><th>Depth</th>
            <th>Doors / Fronts</th><th>Internals</th><th>Opening</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="8">${rows.length} items · ${config.filename} production set</td>
          </tr>
        </tfoot>
      </table>
      ${matNotes}
    </div>
    ${footer(config)}
  </div>`;
}

module.exports = page4;
