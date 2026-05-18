const { header, footer } = require('./layout');
const { elevationSVG } = require('../svg');
const { describeInteriors } = require('../parser');
const C = require('../colors');

function page2(config) {
  const fittings = describeInteriors(config.modules);

  const sidebar = `
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-title">Interior Fittings</div>
      <div class="schedule-list">
        ${fittings.map(f => `
          <div class="schedule-item">
            <div class="s-name">${f.name}</div>
            <div class="s-desc">${f.desc}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">Fitting Legend</div>
      <div class="legend-item"><div class="swatch sw-shelf" style="width:16px;height:5px;"></div><span>Shelf (18mm thick)</span></div>
      <div class="legend-item"><div class="swatch sw-drawer"></div><span>Drawer set</span></div>
      <div class="legend-item"><div class="swatch sw-divider" style="width:5px;height:12px;"></div><span>Vertical divider</span></div>
      <div class="legend-item"><div class="swatch sw-led" style="width:16px;height:4px;border-radius:1px;"></div><span>LED groove (M9)</span></div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">Shelf Thickness</div>
      <div class="thickness-list">
        <div class="thickness-item">
          <div class="t-key">Shelves</div>
          <div class="t-val">${config.shelvesThickness} mm</div>
        </div>
        <div class="thickness-item">
          <div class="t-key">Backwall</div>
          <div class="t-val">${config.backwallThickness} mm</div>
        </div>
        <div class="thickness-item">
          <div class="t-key">Fronts</div>
          <div class="t-val">${config.frontThickness} mm</div>
        </div>
      </div>
    </div>
  </div>`;

  return `
  <div class="page">
    ${header('Interiors', config, 2, 4)}
    <div class="page-body">
      ${sidebar}
      <div class="drawing-area">
        <div class="drawing-label">Front Face · Interior View</div>
        <div class="elevation-wrap">
          ${elevationSVG(config, 'interiors')}
        </div>
      </div>
    </div>
    ${footer(config)}
  </div>`;
}

module.exports = page2;
