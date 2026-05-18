const { header, footer } = require('./layout');
const { elevationSVG } = require('../svg');
const { describeDoors } = require('../parser');
const C = require('../colors');

function page3(config) {
  const doors = describeDoors(config.modules);

  // Key legend indicator (small visual)
  function keyDot(color) {
    return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:2mm;vertical-align:middle;"></span>`;
  }

  const sidebar = `
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-title">Door Schedule</div>
      <div class="schedule-list">
        ${doors.map(d => `
          <div class="schedule-item">
            <div class="s-name">${d.name}</div>
            <div class="s-desc">${d.desc}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">Hardware</div>
      <div class="kv"><div class="kv-key">Opening Mechanism</div><div class="kv-val">Grip profile (all)</div></div>
      <div class="kv"><div class="kv-key">Fixed panels</div><div class="kv-val">No mechanism</div></div>
      <div class="kv"><div class="kv-key">Front thickness</div><div class="kv-val">${config.frontThickness} mm</div></div>
      <div class="kv"><div class="kv-key">Material</div><div class="kv-val">${config.materials.fronts}</div></div>
    </div>
  </div>`;

  return `
  <div class="page">
    ${header('Fronts & Doors', config, 3, 4)}
    <div class="page-body">
      ${sidebar}
      <div class="drawing-area">
        <div class="drawing-label">Front Face · Doors & Fronts</div>
        <div class="elevation-wrap">
          ${elevationSVG(config, 'doors')}
        </div>
      </div>
    </div>
    ${footer(config)}
  </div>`;
}

module.exports = page3;
