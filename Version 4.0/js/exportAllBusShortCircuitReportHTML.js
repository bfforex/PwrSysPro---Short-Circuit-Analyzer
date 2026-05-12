(function installAllBusShortCircuitReportHTML(global) {
  'use strict';

  function n(value, fallback = 0) {
    const x = Number(value);
    return Number.isFinite(x) ? x : fallback;
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInputValue(id, fallback = '') {
    const el = document.getElementById(id);
    return el && el.value !== undefined && el.value !== '' ? el.value : fallback;
  }

  function projectInfo() {
    const now = new Date();
    return {
      projectName: getInputValue('projectName', 'Untitled Project'),
      projectNumber: getInputValue('projectNumber', 'N/A'),
      engineer: getInputValue('engineer', 'N/A'),
      temperature: getInputValue('temperature', '75'),
      date: now.toISOString().slice(0, 10)
    };
  }

  function ka(value) {
    const x = n(value, 0);
    return x > 0 ? x.toFixed(3) : '—';
  }

  function pct(value) {
    const x = n(value, 0);
    return x > 0 ? x.toFixed(3) : '—';
  }

  function volt(value) {
    const v = n(value, 0);
    return v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 2)} kV` : `${v.toFixed(0)} V`;
  }

  function amp(value) {
    const x = n(value, 0);
    return x > 0 ? `${x.toFixed(0)} A` : '—';
  }

  function aic(value) {
    const duty = n(value, 0);
    if (duty <= 0) return '—';
    const ratings = [10, 14, 18, 22, 25, 30, 35, 42, 50, 65, 85, 100, 150, 200];
    return `${ratings.find(r => r >= duty) || Math.ceil(duty / 10) * 10} kAIC`;
  }

  function fc(row) {
    return row?.faultCurrents || {};
  }

  function imp(row) {
    return row?.impedance || {};
  }

  function css() {
    return `
@page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
*, *::before, *::after { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #111; background: #d0d0d0; margin: 0; padding: 12mm; }
.a4-page { background: #fff; width: 210mm; min-height: 297mm; margin: 0 auto 8mm; padding: 12mm 12mm 14mm 12mm; box-shadow: 0 4px 18px rgba(0,0,0,.24); }
@media print { body { background: #fff; padding: 0; } .a4-page { box-shadow: none; margin: 0; padding: 0; width: 100%; min-height: 0; } .no-print { display: none !important; } .page-break { page-break-before: always; break-before: page; } .no-break { page-break-inside: avoid; break-inside: avoid; } }
.page-break { page-break-before: always; break-before: page; }
.no-break { page-break-inside: avoid; break-inside: avoid; }
.report-header { border-top: 3px solid #111; border-bottom: 2px solid #111; padding: 7pt 0 6pt; margin-bottom: 8pt; }
.report-title { font-size: 12pt; font-weight: 700; letter-spacing: .03em; margin-bottom: 4pt; }
.report-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2pt 12pt; font-size: 7.5pt; }
.meta-label { font-weight: 700; }
.section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; border-bottom: 1.5px solid #111; padding-bottom: 2pt; margin: 10pt 0 5pt; }
table { width: 100%; border-collapse: collapse; font-size: 7.15pt; margin: 0 0 6pt; }
th { background: #111; color: #fff; font-weight: 700; padding: 3pt 4pt; text-align: left; white-space: nowrap; }
th.num, td.num { text-align: right; }
td { padding: 2.5pt 4pt; vertical-align: top; border-bottom: .5px solid #c8c8c8; }
tbody tr:nth-child(even) { background: #f5f5f5; }
td.pass { color: #0b5a18; font-weight: 700; }
td.fail { color: #8b0000; font-weight: 700; }
.calc-box { border: 1px solid #c8c8c8; padding: 5pt 6pt; margin: 4pt 0 7pt; font-family: 'Courier New', Courier, monospace; font-size: 6.7pt; line-height: 1.32; white-space: pre-wrap; }
.path-title { display: flex; justify-content: space-between; align-items: baseline; border-top: 2px solid #111; border-bottom: 1px solid #111; padding: 4pt 0 3pt; margin: 6pt 0 4pt; }
.path-title strong { font-size: 9.5pt; }
.small { font-size: 6.8pt; color: #444; }
.print-toolbar { position: fixed; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 9999; background: rgba(255,255,255,.95); padding: 8px 12px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.25); font-family: system-ui, sans-serif; }
.print-toolbar button { padding: 6px 14px; border: 1px solid #111; background: #111; color: #fff; border-radius: 5px; cursor: pointer; font-size: 12px; }
.print-toolbar button.secondary { background: #fff; color: #111; }
@media print { .print-toolbar { display: none !important; } }
    `;
  }

  function extract(pattern, text, fallback = '') {
    const m = String(text || '').match(pattern);
    return m ? m[1].trim() : fallback;
  }

  function extractTotals(row) {
    const text = String(row.calculationSteps || '');
    return {
      baseKVA: extract(/Base kVA:\s*([0-9.,]+)/i, text, '10000'),
      baseVoltage: extract(/Base Voltage:\s*([0-9.,]+)\s*V/i, text, String(row.voltage || '')),
      baseCurrent: extract(/Base Current:\s*([0-9.,]+)\s*A/i, text, ''),
      z1r: extract(/Z1 \(Positive Sequence\):[\s\S]*?R_pu\s*=\s*([0-9.]+)/i, text, ''),
      z1x: extract(/Z1 \(Positive Sequence\):[\s\S]*?X_pu\s*=\s*([0-9.]+)/i, text, ''),
      z1z: extract(/Z1 \(Positive Sequence\):[\s\S]*?Z_pu\s*=\s*([0-9.]+)/i, text, ''),
      z0r: extract(/Z0 \(Zero Sequence\):[\s\S]*?R0_pu\s*=\s*([0-9.]+)/i, text, ''),
      z0x: extract(/Z0 \(Zero Sequence\):[\s\S]*?X0_pu\s*=\s*([0-9.]+)/i, text, ''),
      z0z: extract(/Z0 \(Zero Sequence\):[\s\S]*?Z0_pu\s*=\s*([0-9.]+)/i, text, ''),
      z1ohm: extract(/Z1:\s*R\s*=\s*([0-9.]+\s*Ω,\s*X\s*=\s*[0-9.]+\s*Ω,\s*Z\s*=\s*[0-9.]+\s*Ω)/i, text, ''),
      z0ohm: extract(/Z0:\s*R0\s*=\s*([0-9.]+\s*Ω,\s*X0\s*=\s*[0-9.]+\s*Ω,\s*Z0\s*=\s*[0-9.]+\s*Ω)/i, text, '')
    };
  }

  function extractComponents(text) {
    const items = [];
    const re = /STEP\s+\d+\s*:\s*(SOURCE BUS IMPEDANCE|CABLE\s*-\s*[^\n]+|TRANSFORMER\s*-\s*[^\n]+|MOTOR[^\n]*)/gi;
    let m;
    while ((m = re.exec(String(text || ''))) !== null) {
      const raw = m[1].replace(/\s+/g, ' ').trim();
      const type = raw.toUpperCase().startsWith('CABLE') ? 'Cable' : raw.toUpperCase().startsWith('TRANSFORMER') ? 'Transformer' : raw.toUpperCase().startsWith('SOURCE') ? 'Source' : 'Motor';
      const tag = raw.replace(/^CABLE\s*-\s*/i, '').replace(/^TRANSFORMER\s*-\s*/i, '').replace(/^SOURCE BUS IMPEDANCE/i, 'Utility Source');
      items.push({ type, tag });
    }
    return items;
  }

  function fingerprint(row) {
    const values = fc(row);
    const components = extractComponents(row.calculationSteps).map(c => `${c.type}:${c.tag}`).join('|');
    return [n(row.voltage, 0).toFixed(0), n(values.threePhaseSym, 0).toFixed(3), n(values.lineToGround, 0).toFixed(3), n(values.lineToLine, 0).toFixed(3), n(imp(row).xr, 0).toFixed(3), components].join('~');
  }

  function uniquePaths(allBusData) {
    const map = new Map();
    (allBusData.results || []).filter(r => r.status === 'OK').forEach(row => {
      const key = fingerprint(row);
      if (!map.has(key)) map.set(key, { row, buses: [], components: extractComponents(row.calculationSteps), totals: extractTotals(row) });
      map.get(key).buses.push(row);
    });
    return Array.from(map.values());
  }

  function highestRow(allBusData) {
    const rows = (allBusData.results || []).filter(r => r.status === 'OK');
    return rows.reduce((a, b) => n(fc(b).threePhaseSym) > n(fc(a).threePhaseSym) ? b : a, rows[0] || null);
  }

  function header(allBusData, info) {
    const h = highestRow(allBusData);
    return `<div class="report-header">
      <div class="report-title">SHORT CIRCUIT CALCULATION REPORT</div>
      <div class="report-meta">
        <div><span class="meta-label">Project:</span> ${esc(info.projectName)}</div>
        <div><span class="meta-label">Document No.:</span> ${esc(info.projectNumber)}</div>
        <div><span class="meta-label">Date:</span> ${esc(info.date)}</div>
        <div><span class="meta-label">Prepared By:</span> ${esc(info.engineer)}</div>
        <div><span class="meta-label">Calculation Method:</span> ${esc(allBusData.method || 'Per-Unit')}</div>
        <div><span class="meta-label">Conductor Temperature:</span> ${esc(info.temperature)} °C</div>
        <div><span class="meta-label">Buses Analyzed:</span> ${n(allBusData.totalBuses, 0)}</div>
        ${h ? `<div><span class="meta-label">Maximum 3φ Fault:</span> ${ka(fc(h).threePhaseSym)} kA at ${esc(h.busName)}</div>` : ''}
        ${h ? `<div><span class="meta-label">Maximum Peak:</span> ${ka(fc(h).peakCrest)} kA</div>` : ''}
      </div>
    </div>`;
  }

  function basisSection() {
    return `<div class="section-title">Calculation Basis</div>
    <table class="no-break">
      <thead><tr><th>Item</th><th>Basis</th></tr></thead>
      <tbody>
        <tr><td>Method</td><td>Per-unit short-circuit calculation using positive-, negative-, and zero-sequence impedance summation.</td></tr>
        <tr><td>Three-phase fault current</td><td>Isc = (1 / Z1pu) × Ibase</td></tr>
        <tr><td>Line-to-ground fault current</td><td>ILG = (3 / (Z1 + Z2 + Z0)) × Ibase</td></tr>
        <tr><td>Asymmetrical RMS current</td><td>Iasym = Isym × √(1 + 2e<sup>-2t/τ</sup>)</td></tr>
        <tr><td>Peak current</td><td>Ipeak = √2 × Isym × (1 + e<sup>-π/(X/R)</sup>)</td></tr>
      </tbody>
    </table>`;
  }

  function faultSummary(allBusData) {
    let html = '<div class="section-title">Fault Current Summary</div>';
    html += '<table><thead><tr><th>#</th><th>Bus</th><th>Voltage</th><th class="num">3φ Sym kA</th><th class="num">L-G kA</th><th class="num">L-L kA</th><th class="num">X/R</th><th class="num">Asym @ 50 ms kA</th><th class="num">1st-Cycle kA</th><th class="num">Peak kA</th><th>Status</th></tr></thead><tbody>';
    (allBusData.results || []).forEach(row => {
      const f = fc(row);
      html += `<tr><td>${row.index}</td><td>${esc(row.busName)}</td><td>${volt(row.voltage)}</td><td class="num">${ka(f.threePhaseSym)}</td><td class="num">${ka(f.lineToGround)}</td><td class="num">${ka(f.lineToLine)}</td><td class="num">${pct(imp(row).xr)}</td><td class="num">${ka(f.threePhaseAsym)}</td><td class="num">${ka(f.firstCycleAsym)}</td><td class="num">${ka(f.peakCrest)}</td><td class="pass">OK</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function aicSummary(allBusData) {
    let html = '<div class="section-title">Minimum Interrupting Rating</div>';
    html += '<table><thead><tr><th>#</th><th>Bus</th><th>Voltage</th><th class="num">Required 3φ Duty kA</th><th class="num">1st-Cycle kA</th><th class="num">Peak kA</th><th class="num">Minimum Interrupting Rating</th></tr></thead><tbody>';
    (allBusData.results || []).filter(r => r.status === 'OK').forEach(row => {
      const f = fc(row);
      html += `<tr><td>${row.index}</td><td>${esc(row.busName)}</td><td>${volt(row.voltage)}</td><td class="num">${ka(f.threePhaseSym)}</td><td class="num">${ka(f.firstCycleAsym)}</td><td class="num">${ka(f.peakCrest)}</td><td class="num">${aic(f.threePhaseSym)}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function componentRegister(paths) {
    const seen = new Map();
    paths.forEach((path, pidx) => {
      path.components.forEach(c => {
        const key = `${c.type}|${c.tag}`;
        if (!seen.has(key)) seen.set(key, { ...c, paths: [] });
        seen.get(key).paths.push(`SC-${String(pidx + 1).padStart(3, '0')}`);
      });
    });

    let html = '<div class="section-title">Component Impedance Register</div>';
    html += '<table><thead><tr><th>ID</th><th>Type</th><th>Component</th><th>Used In Path(s)</th></tr></thead><tbody>';
    Array.from(seen.values()).forEach((item, i) => {
      html += `<tr><td>Z-${String(i + 1).padStart(3, '0')}</td><td>${esc(item.type)}</td><td>${esc(item.tag)}</td><td>${esc(Array.from(new Set(item.paths)).join(', '))}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function pathRegister(paths) {
    let html = '<div class="section-title">Calculation Path Register</div>';
    html += '<table><thead><tr><th>Path</th><th>Representative Bus</th><th>Applicable Bus(es)</th><th class="num">3φ Sym kA</th><th class="num">L-G kA</th><th class="num">X/R</th><th>Components</th></tr></thead><tbody>';
    paths.forEach((path, i) => {
      const f = fc(path.row);
      html += `<tr><td>SC-${String(i + 1).padStart(3, '0')}</td><td>${esc(path.row.busName)}</td><td>${esc(path.buses.map(b => b.busName).join(', '))}</td><td class="num">${ka(f.threePhaseSym)}</td><td class="num">${ka(f.lineToGround)}</td><td class="num">${pct(imp(path.row).xr)}</td><td>${esc(path.components.map(c => c.tag).join(' → '))}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function calculationBox(path, index) {
    const row = path.row;
    const f = fc(row);
    const z = path.totals;
    const baseCurrent = z.baseCurrent || '';
    const zpu = z.z1z || '';
    const ilgpu = z.z1z && z.z0z ? (3 / (2 * Number(z.z1z) + Number(z.z0z))).toFixed(6) : '';
    const ipu = zpu ? (1 / Number(zpu)).toFixed(6) : '';

    return `<div class="path-title"><strong>SC-${String(index + 1).padStart(3, '0')} — ${esc(row.busName)}</strong><span>${volt(row.voltage)}</span></div>
    <div class="small">Applicable Bus(es): ${esc(path.buses.map(b => b.busName).join(', '))}</div>
    <table class="no-break"><thead><tr><th>Fault Type</th><th class="num">Sym kA</th><th class="num">Asym @ 50 ms kA</th><th class="num">1st-Cycle kA</th><th class="num">Peak kA</th><th class="num">X/R</th></tr></thead><tbody>
      <tr><td>Three-Phase</td><td class="num">${ka(f.threePhaseSym)}</td><td class="num">${ka(f.threePhaseAsym)}</td><td class="num">${ka(f.firstCycleAsym)}</td><td class="num">${ka(f.peakCrest)}</td><td class="num">${pct(imp(row).xr)}</td></tr>
      <tr><td>Line-to-Ground</td><td class="num">${ka(f.lineToGround)}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>
      <tr><td>Line-to-Line</td><td class="num">${ka(f.lineToLine)}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>
    </tbody></table>
    <div class="calc-box">Base: ${esc(z.baseKVA)} kVA, ${volt(z.baseVoltage)}, Ibase = ${esc(baseCurrent || '—')} A
Path: ${esc(path.components.map(c => c.tag).join(' → '))}
Z1 = ${esc(z.z1r || '—')} + j${esc(z.z1x || '—')} pu; |Z1| = ${esc(z.z1z || '—')} pu; X/R = ${pct(imp(row).xr)}
Z0 = ${esc(z.z0r || '—')} + j${esc(z.z0x || '—')} pu; |Z0| = ${esc(z.z0z || '—')} pu
Three-Phase Fault: Ipu = 1 / ${esc(zpu || 'Z1')} ${ipu ? '= ' + ipu : ''}; Isc = ${ka(f.threePhaseSym)} kA
Line-to-Ground Fault: Ipu = 3 / (Z1 + Z2 + Z0) ${ilgpu ? '= ' + ilgpu : ''}; ILG = ${ka(f.lineToGround)} kA
Peak Current: Ipeak = ${ka(f.peakCrest)} kA</div>`;
  }

  function detailedCalculations(paths) {
    let html = '';
    paths.forEach((path, i) => {
      if (i % 3 === 0) html += `<div class="a4-page page-break"><div class="section-title">Detailed Calculations by Path</div>`;
      html += calculationBox(path, i);
      if (i % 3 === 2 || i === paths.length - 1) html += '</div>';
    });
    return html;
  }

  function parseDevices(row) {
    const text = String(row.calculationSteps || '');
    const idx = text.indexOf('PROTECTION DEVICE REQUIREMENTS');
    if (idx < 0) return [];
    const section = text.slice(idx);
    return section.split(/\n(?=\d+\.\s+(?:BREAKER|FUSE|DEVICE)\s+)/i).slice(1).map(block => {
      const first = block.split('\n')[0] || '';
      const m = first.match(/^\d+\.\s+([A-Z]+)\s+(.+?)(?:\s+\(|$)/i);
      return {
        type: m ? m[1].toUpperCase() : 'DEVICE',
        tag: m ? m[2].trim() : first.trim(),
        from: extract(/From Bus:\s*([^\n]+)/i, block, ''),
        to: extract(/To Bus:\s*([^\n]+)/i, block, ''),
        rating: n(extract(/Existing continuous rating:\s*([0-9.]+)/i, block, extract(/Existing ampere rating:\s*([0-9.]+)/i, block, '0'))),
        ic: n(extract(/Existing interrupting rating:\s*([0-9.]+)/i, block, '0')),
        resultText: extract(/Adequacy result:\s*([^\n]+)/i, block, '')
      };
    });
  }

  function protectionSummary(allBusData) {
    const busDuty = new Map();
    (allBusData.results || []).forEach(row => busDuty.set(String(row.busName || '').trim(), row));

    const devices = new Map();
    (allBusData.results || []).filter(r => r.status === 'OK').forEach(row => {
      parseDevices(row).forEach(d => {
        const key = `${d.type}|${d.tag}|${d.from}|${d.to}`;
        if (!devices.has(key)) devices.set(key, { ...d, maxDuty: 0, maxAsym: 0, maxFirst: 0, maxPeak: 0, worstBus: '' });
        const rec = devices.get(key);

        const relatedBuses = [d.to, d.from].map(name => busDuty.get(String(name || '').trim())).filter(Boolean);
        const dutyRow = relatedBuses.length ? relatedBuses.reduce((a, b) => n(fc(b).threePhaseSym) > n(fc(a).threePhaseSym) ? b : a) : row;
        const duty = fc(dutyRow);
        if (n(duty.threePhaseSym) > rec.maxDuty) {
          rec.maxDuty = n(duty.threePhaseSym);
          rec.maxAsym = n(duty.threePhaseAsym);
          rec.maxFirst = n(duty.firstCycleAsym);
          rec.maxPeak = n(duty.peakCrest);
          rec.worstBus = dutyRow.busName;
        }
      });
    });

    let html = '<div class="section-title">Protection Device Adequacy Summary</div>';
    if (!devices.size) {
      html += '<table><thead><tr><th>Status</th></tr></thead><tbody><tr><td>No protective device data available.</td></tr></tbody></table>';
      return html;
    }
    html += '<table><thead><tr><th>Device</th><th>Type</th><th>Location</th><th class="num">Rating</th><th class="num">IC Rating</th><th class="num">Calculated Duty</th><th class="num">1st-Cycle</th><th class="num">Peak</th><th>Bus Basis</th><th>Result</th></tr></thead><tbody>';
    Array.from(devices.values()).forEach(d => {
      const pass = d.ic > 0 && d.ic >= d.maxDuty;
      html += `<tr><td>${esc(d.tag)}</td><td>${esc(d.type)}</td><td>${esc(d.from)} → ${esc(d.to)}</td><td class="num">${amp(d.rating)}</td><td class="num">${d.ic ? ka(d.ic) + ' kA' : '—'}</td><td class="num">${ka(d.maxDuty)} kA</td><td class="num">${ka(d.maxFirst)} kA</td><td class="num">${ka(d.maxPeak)} kA</td><td>${esc(d.worstBus)}</td><td class="${pass ? 'pass' : 'fail'}">${pass ? 'PASS' : 'FAIL'}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function buildAllBusShortCircuitStepsReportHTML(allBusData, options = {}) {
    const info = projectInfo();
    const paths = uniquePaths(allBusData);
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(info.projectNumber)} Short Circuit Calculation</title><style>${css()}</style></head><body>`;
    html += '<div class="print-toolbar no-print"><button onclick="window.print()">Print / Save PDF</button><button class="secondary" onclick="document.querySelector(\'.print-toolbar\').style.display=\'none\'">Hide</button></div>';
    html += `<div class="a4-page">${header(allBusData, info)}${basisSection()}${faultSummary(allBusData)}</div>`;
    html += `<div class="a4-page page-break">${aicSummary(allBusData)}${componentRegister(paths)}${pathRegister(paths)}</div>`;
    html += detailedCalculations(paths);
    html += `<div class="a4-page page-break">${protectionSummary(allBusData)}</div>`;
    html += '</body></html>';
    return html;
  }

  function resolveMethod(method) {
    if (method) return method;
    if (typeof global.getSelectedShortCircuitMethod === 'function') return global.getSelectedShortCircuitMethod();
    const checked = document.querySelector('input[name="method"]:checked');
    return checked?.value || 'per-unit';
  }

  function downloadHTML(content, projectName) {
    const name = (projectName || 'Project').replace(/[^a-z0-9\-_]+/gi, '_');
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_ShortCircuitCalculation_A4.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getReportData(method, options) {
    if (typeof global.calculateShortCircuitForAllBuses !== 'function') throw new Error('calculateShortCircuitForAllBuses() not found.');
    return global.calculateShortCircuitForAllBuses(resolveMethod(method), options);
  }

  function exportAllBusShortCircuitStepsReportHTML(method = null, options = {}) {
    try {
      const data = getReportData(method, options);
      const html = buildAllBusShortCircuitStepsReportHTML(data, options);
      downloadHTML(html, projectInfo().projectName);
      return html;
    } catch (err) {
      console.error(err);
      alert(`Failed to generate HTML report:\n${err.message || err}`);
      return null;
    }
  }

  function showAllBusShortCircuitReportHTML(method = null, options = {}) {
    try {
      const data = getReportData(method, options);
      const html = buildAllBusShortCircuitStepsReportHTML(data, options);
      const win = window.open('', '_blank');
      if (!win) { alert('Pop-up blocked. Use Download A4 HTML.'); return null; }
      win.document.open();
      win.document.write(html);
      win.document.close();
      return html;
    } catch (err) {
      console.error(err);
      alert(`Failed to show HTML report:\n${err.message || err}`);
      return null;
    }
  }

  function patchExistingModal() {
    const original = global.showAllBusShortCircuitReport;
    if (typeof original !== 'function' || original.__htmlPatchApplied) return;
    function findBar() {
      const overlay = document.getElementById('allBusSccReportOverlay');
      if (!overlay) return null;
      return overlay.querySelector('#allBusSccClose2')?.parentElement || overlay.querySelector('#allBusSccDownload')?.parentElement || overlay.querySelector('#allBusSccCopy')?.parentElement;
    }
    function addButton(label, cssText, handler) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = cssText;
      b.addEventListener('click', handler);
      return b;
    }
    const patched = function patchedShowAllBusShortCircuitReport(...args) {
      const result = original.apply(this, args);
      setTimeout(() => {
        const bar = findBar();
        if (!bar || bar.querySelector('[data-scc-html-button="1"]')) return;
        const open = addButton('🌐 Open A4 HTML', 'padding:8px 12px;border:1px solid #6610f2;color:#fff;background:#6610f2;border-radius:6px;cursor:pointer;', e => { e.preventDefault(); showAllBusShortCircuitReportHTML(...args); });
        open.setAttribute('data-scc-html-button', '1');
        const dl = addButton('📄 Download A4 HTML', 'padding:8px 12px;border:1px solid #495057;color:#fff;background:#495057;border-radius:6px;cursor:pointer;', e => { e.preventDefault(); exportAllBusShortCircuitStepsReportHTML(...args); });
        dl.setAttribute('data-scc-html-button', '1');
        bar.prepend(dl);
        bar.prepend(open);
      }, 0);
      return result;
    };
    patched.__htmlPatchApplied = true;
    global.showAllBusShortCircuitReport = patched;
    try { showAllBusShortCircuitReport = patched; } catch (_) {}
  }

  global.buildAllBusShortCircuitStepsReportHTML = buildAllBusShortCircuitStepsReportHTML;
  global.exportAllBusShortCircuitStepsReportHTML = exportAllBusShortCircuitStepsReportHTML;
  global.showAllBusShortCircuitReportHTML = showAllBusShortCircuitReportHTML;
  patchExistingModal();
})(typeof window !== 'undefined' ? window : globalThis);
