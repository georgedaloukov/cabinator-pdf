function parseConfig(raw) {
  const cfg = raw.configuration;
  const modules = cfg.modules;

  const countertop = modules.find(m => m.type === 'countertop');
  const splashback = modules.find(m => m.type === 'splashback');
  const plinths = modules.filter(m => m.type === 'plinth');

  // Zone boundaries in JSON y-coords (y=0 = floor, increases upward)
  const lowerZoneTop = countertop ? countertop.y : cfg.heightMM;
  const upperZoneBottom = splashback ? splashback.y + splashback.heightMM : lowerZoneTop;
  const plinthHeight = plinths.length ? Math.max(...plinths.map(m => m.heightMM)) : 0;

  const lowerCorpus = modules.filter(m => m.type === 'corpus' && m.y + m.heightMM <= lowerZoneTop + 5);
  const upperCorpus = modules.filter(m => m.type === 'corpus' && m.y >= upperZoneBottom - 5);

  const baseDepth = lowerCorpus.length ? Math.max(...lowerCorpus.map(m => m.depthMM)) : cfg.depthMM;
  const upperDepth = upperCorpus.length ? Math.max(...upperCorpus.map(m => m.depthMM)) : 300;

  const isCeiling = (cfg.walls || []).includes('ceiling');

  // Compute left-face and right-face column profiles for side views
  const leftFace = getColumnProfile(modules, 0);
  const rightFace = getColumnProfile(modules, cfg.widthMM);

  return {
    filename: raw.filename,
    widthMM: cfg.widthMM,
    heightMM: cfg.heightMM,
    depthMM: cfg.depthMM,
    walls: cfg.walls || [],
    modules,

    lowerZoneTop,
    upperZoneBottom,
    plinthHeight,

    leftFace,
    rightFace,

    summary: {
      totalWidth: cfg.widthMM,
      totalHeight: cfg.heightMM,
      baseDepth,
      upperDepth: upperCorpus.length && upperDepth !== baseDepth ? upperDepth : null,
      countertopHeight: countertop ? countertop.y : null,
      splashbackHeight: splashback ? splashback.heightMM : null,
      config: isCeiling ? 'Ceiling wall' : 'Floor standing',
    },

    materials: {
      corpus: 'Kronospan melamine',
      fronts: 'MDF & Walnut Veneer',
      plinths: 'MDF & Walnut Veneer',
      ...(countertop ? { countertop: 'Quartzforms Terrazzo' } : {}),
      ...(splashback ? { splashback: 'Quartzforms Terrazzo' } : {}),
    },

    moduleThickness: cfg.moduleThicknessMM || 18,
    frontThickness: cfg.frontsThicknessMM || 19,
    shelvesThickness: cfg.shelvesThicknessMM || 18,
    backwallThickness: cfg.backwallThicknessMM || 10,
  };
}

// Returns the distinct depth profile visible from one end of the wall.
// For left face: modules that start at x=0.
// For right face: find the rightmost interior side panel, then grab modules ending there.
function getColumnProfile(modules, totalWidth) {
  const isLeft = totalWidth === 0;

  let edgeX;
  if (isLeft) {
    // Find the leftmost side panel; corpus modules sit just inside its right face
    const leftPanels = modules
      .filter(m => m.type === 'panel' && m.orientation === 'side')
      .sort((a, b) => a.x - b.x);
    edgeX = leftPanels.length ? leftPanels[0].x + leftPanels[0].widthMM : 0;
  } else {
    // Find the rightmost edge panel (right edge flush with totalWidth)
    const rightPanels = modules
      .filter(m => m.type === 'panel' && m.orientation === 'side' && m.x + m.widthMM >= totalWidth - 2)
      .sort((a, b) => b.x - a.x);
    edgeX = rightPanels.length ? rightPanels[0].x : totalWidth;
  }

  const col = [];
  for (const m of modules) {
    // Skip structural side panels (used as edge references) but keep front/decorative panels
    if (m.type === 'panel' && m.orientation === 'side') continue;

    const touchesEdge = isLeft
      ? Math.abs(m.x - edgeX) <= 2
      : m.x < edgeX && m.x + m.widthMM >= edgeX - 2;

    if (touchesEdge) {
      col.push({ y: m.y, h: m.heightMM, depth: m.depthMM, type: m.type });
    }
  }

  return col.sort((a, b) => a.y - b.y);
}



// Summarise per-module interior fittings for sidebar
function describeInteriors(modules) {
  const result = [];
  for (const m of modules) {
    if (m.type !== 'corpus') continue;
    if (!m.partitions || m.partitions.length === 0) {
      if (!m.doors || m.doors.length === 0) continue;
    }
    const parts = (m.partitions || []);
    const descs = [];
    const shelves = parts.filter(p => p.type === 'shelf').length;
    const dividers = parts.filter(p => p.type === 'verticalDivider').length;
    const drawerSets = parts.filter(p => p.type === 'drawerSet');
    const led = parts.some(p => p.type === 'led');

    if (dividers) descs.push(`${dividers}× divider`);
    if (shelves) descs.push(`${shelves}× shelf`);
    drawerSets.forEach(ds => {
      const n = ds.drawersOptions?.drawersNum || 1;
      const depth = ds.drawersOptions?.drawersDepthMM || '';
      descs.push(`${n}× drawer (${depth}mm pull)`);
    });
    if (led) descs.push('LED groove');

    if (descs.length) result.push({ name: m.name, desc: descs.join(', ') });
    else if (m.doors && m.doors.length > 0) result.push({ name: m.name, desc: 'open' });
  }
  return result;
}

// Summarise per-module door schedule for sidebar
function describeDoors(modules) {
  const result = [];
  for (const m of modules) {
    if (m.type !== 'corpus') continue;
    if (!m.doors || m.doors.length === 0) continue;

    const parts = [];
    for (const d of m.doors) {
      const label = {
        'single-left': 'Single-left',
        'single-right': 'Single-right',
        'flap-up': 'Flap-up',
        'fixed-panel': 'Fixed panel',
        'double': 'Double',
      }[d.type] || d.type;
      parts.push(`${label} · ${d.widthMM}×${d.heightMM}`);
    }
    result.push({ name: m.name, desc: parts.join(' + ') });
  }
  return result;
}

// Bill of materials rows
function buildBOM(config) {
  const { modules } = config;
  const rows = [];

  const sorted = [...modules].sort((a, b) => {
    const nameA = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
    const nameB = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
    return nameA - nameB;
  });

  for (const m of sorted) {
    const doors = (m.doors || []);
    const parts = (m.partitions || []);

    const doorDesc = doors.length === 0
      ? 'None'
      : doors.map(d => ({
          'single-left': 'Single-Left',
          'single-right': 'Single-Right',
          'flap-up': 'Flap-Up',
          'fixed-panel': 'Fixed Panel',
          'double': 'Double',
        }[d.type] || d.type)).join(' + ');

    const internalsDesc = (() => {
      const items = [];
      const dividers = parts.filter(p => p.type === 'verticalDivider').length;
      const shelves = parts.filter(p => p.type === 'shelf').length;
      const drawerSets = parts.filter(p => p.type === 'drawerSet');
      const led = parts.find(p => p.type === 'led');
      if (dividers) items.push('V.Divider');
      if (shelves) items.push(`Shelf`);
      drawerSets.forEach(ds => {
        const n = ds.drawersOptions?.drawersNum || 1;
        const depth = ds.drawersOptions?.drawersDepthMM || '';
        items.push(`${n}× drawer (${depth}mm pull)`);
      });
      if (led) items.push('LED top');
      return items.join(', ') || '—';
    })();

    const openingDesc = (() => {
      const mechanisms = [...new Set(doors.filter(d => d.openingMechanism).map(d => d.openingMechanism))];
      if (!mechanisms.length) return '—';
      return mechanisms.map(m => m === 'gripProfile' ? 'Grip profile' : m).join(', ');
    })();

    rows.push({
      name: m.name,
      type: m.type.charAt(0).toUpperCase() + m.type.slice(1),
      width: m.widthMM,
      height: m.heightMM,
      depth: m.depthMM,
      doors: doorDesc,
      internals: internalsDesc,
      opening: openingDesc,
    });
  }

  return rows;
}

module.exports = { parseConfig, describeInteriors, describeDoors, buildBOM };
