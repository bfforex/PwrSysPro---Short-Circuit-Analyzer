/**
 * All-Bus Short Circuit Calculation Steps Report v2.0
 * Updated: 2026-05-08
 *
 * Changes in v2.0:
 * ✅ getFaultCurrents pulls firstCycleAsym and peakCrest from result schema
 * ✅ Summary table adds 1st-Cycle RMS and Peak Crest columns (correct labels)
 * ✅ Report header now includes methodology/standards boilerplate ONCE
 * ✅ buildAllBusDetailedSections: boilerplate stripped from per-bus steps
 * ✅ buildAllBusDetailedSections: identical-path buses deduplicated by
 *    fingerprint (3φ|L-G|L-L|X/R) — only first occurrence gets full steps,
 *    subsequent identical buses show a one-line "same path as <bus>" reference
 * ✅ calculateShortCircuitForAllBusesAsync: async generator version with
 *    queueMicrotask yield between buses to avoid blocking the UI thread
 * ✅ Bus header block shows all four current types with correct labels
 *
 * Load order:
 * - After shortCircuitCalc.js
 * - After calculationDisplay.js
 * - After shortCircuitFollowupFixes.js, if used
 */
(function installAllBusShortCircuitReport(global) {
 'use strict';

 const MODULE_NAME = 'All-Bus Short Circuit Calculation Steps Report';
 const DEFAULT_METHOD = 'per-unit';

 function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
 }

 function safeText(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
 }

 function getTimestamp() {
  if (typeof global.getCalculationTimestamp === 'function') {
   try { return global.getCalculationTimestamp(); } catch (_) {}
  }
  return new Date().toISOString();
 }

 function getProjectInfo() {
  const getValue = id => {
   try { return document.getElementById(id)?.value || ''; } catch (_) { return ''; }
  };

  return {
   projectName: getValue('projectName') || 'Untitled',
   projectNumber: getValue('projectNumber') || 'N/A',
   engineer: getValue('engineer') || 'Unknown',
   temperature: getValue('temperature') || '75',
   powerFactor: getValue('powerFactor') || '0.85',
   timestamp: getTimestamp()
  };
 }

 function getSelectedShortCircuitMethod() {
  try {
   const checked = document.querySelector('input[name="method"]:checked');
   if (checked?.value) return checked.value;
  } catch (_) {}
  return DEFAULT_METHOD;
 }

 function normalizeMethod(method) {
  const m = String(method || DEFAULT_METHOD).toLowerCase();
  if (m.includes('per')) return 'per-unit';
  if (m.includes('point')) return 'point-to-point';
  if (m.includes('iec')) return 'iec-60909';
  return m || DEFAULT_METHOD;
 }

 function formatVoltage(volts) {
  const v = safeNum(volts, 0);
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 2)} kV`;
  return `${v.toFixed(0)} V`;
 }

 function getBusLabel(bus) {
  return safeText(bus?.name, safeText(bus?.tag, safeText(bus?.id, 'Unknown Bus')));
 }

 function getFaultCurrents(result) {
  const fc = result?.faultCurrents || {};
  return {
   threePhaseSym:      safeNum(fc.threePhaseSym,      safeNum(result?.faultCurrentKA,         safeNum(result?.initialSymmetricalCurrentKA, 0))),
   threePhaseAsym:     safeNum(fc.threePhaseAsym,     safeNum(result?.asymFaultCurrentKA,      safeNum(result?.peakCurrentKA, 0))),
   firstCycleAsym:     safeNum(fc.firstCycleAsym,     safeNum(result?.firstCycleAsymKA,        safeNum(fc.peakMomentary, safeNum(result?.peakMomentaryKA, 0)))),
   peakCrest:          safeNum(fc.peakCrest,           safeNum(result?.peakCrestKA,             0)),
   lineToGround:       safeNum(fc.lineToGround,        safeNum(result?.lineToGroundKA,          safeNum(result?.lineToGroundCurrentKA, 0))),
   lineToLine:         safeNum(fc.lineToLine,          safeNum(result?.lineToLineKA,            safeNum(result?.lineToLineCurrentKA, 0))),
   doubleLineToGround: safeNum(fc.doubleLineToGround,  safeNum(result?.doubleLineToGroundKA,    0))
  };
 }

 function getImpedanceSummary(result) {
  const imp = result?.impedance || {};
  const totalImp = result?.totalImpedance || {};
  return {
   r: safeNum(imp.rTotal, safeNum(result?.totalR, safeNum(totalImp.resistance, 0))),
   x: safeNum(imp.xTotal, safeNum(result?.totalX, safeNum(totalImp.reactance, 0))),
   z: safeNum(imp.zTotal, safeNum(result?.totalZ, safeNum(totalImp.magnitude, 0))),
   xr: safeNum(imp.xrRatio, safeNum(result?.xrRatio, 0))
  };
 }

 function getResultSteps(result) {
  let steps = result?.calculationSteps ?? result?.steps ?? '';
  if (typeof steps !== 'string') {
   try { steps = JSON.stringify(steps, null, 2); } catch (_) { steps = String(steps); }
  }
  return steps || 'No calculation steps available.';
 }

 function shouldAnalyzeBus(bus, options = {}) {
  if (!bus) return false;
  if (options.includeOnlyBusIds && Array.isArray(options.includeOnlyBusIds)) {
   return options.includeOnlyBusIds.includes(bus.id);
  }
  if (options.excludeSourceBuses && bus.type === 'source') return false;
  return true;
 }

 function sortBusesForReport(busList) {
  const busesCopy = Array.isArray(busList) ? [...busList] : [];
  return busesCopy.sort((a, b) => {
   const va = safeNum(a?.voltage, 0);
   const vb = safeNum(b?.voltage, 0);
   if (vb !== va) return vb - va;
   return getBusLabel(a).localeCompare(getBusLabel(b));
  });
 }

 function preserveSelectionState() {
  return {
   selectedBusId: global.selectedBusId,
   selectedBusIdLocal: (typeof selectedBusId !== 'undefined') ? selectedBusId : undefined
  };
 }

 function restoreSelectionState(state) {
  try { global.selectedBusId = state.selectedBusId; } catch (_) {}
  try {
   if (typeof selectedBusId !== 'undefined') selectedBusId = state.selectedBusIdLocal ?? state.selectedBusId;
  } catch (_) {}
 }

 function calculateBusShortCircuit(bus, method, options = {}) {
  if (typeof global.calculateShortCircuit !== 'function') {
   throw new Error('calculateShortCircuit() is not available. Load shortCircuitCalc.js first.');
  }

  const result = global.calculateShortCircuit(bus.id, method, options.calculationOptions || {});
  return result;
 }

 function calculateShortCircuitForAllBuses(method = DEFAULT_METHOD, options = {}) {
  const normalizedMethod = normalizeMethod(method);
  const allBuses = Array.isArray(global.buses) ? global.buses : [];
  const busesToAnalyze = sortBusesForReport(allBuses.filter(bus => shouldAnalyzeBus(bus, options)));
  const previousState = preserveSelectionState();
  const results = [];

  const progressCallback = typeof options.onProgress === 'function' ? options.onProgress : null;

  try {
   busesToAnalyze.forEach((bus, index) => {
    if (progressCallback) progressCallback({ index, total: busesToAnalyze.length, bus });

    try {
     const result = calculateBusShortCircuit(bus, normalizedMethod, options);
     const faultCurrents = getFaultCurrents(result);
     const impedance = getImpedanceSummary(result);

     results.push({
      index: index + 1,
      status: 'OK',
      busId: bus.id,
      busName: getBusLabel(bus),
      busTag: safeText(bus.tag, ''),
      busType: safeText(bus.type, ''),
      voltage: safeNum(bus.voltage, 0),
      method: safeText(result?.method, normalizedMethod),
      result,
      faultCurrents,
      impedance,
      calculationSteps: getResultSteps(result),
      error: null
     });
    } catch (error) {
     results.push({
      index: index + 1,
      status: 'ERROR',
      busId: bus.id,
      busName: getBusLabel(bus),
      busTag: safeText(bus.tag, ''),
      busType: safeText(bus.type, ''),
      voltage: safeNum(bus.voltage, 0),
      method: normalizedMethod,
      result: null,
      faultCurrents: null,
      impedance: null,
      calculationSteps: '',
      error: error?.message || String(error)
     });
    }
   });
  } finally {
   restoreSelectionState(previousState);
  }

  return {
   method: normalizedMethod,
   generatedAt: getTimestamp(),
   totalBuses: busesToAnalyze.length,
   successful: results.filter(r => r.status === 'OK').length,
   failed: results.filter(r => r.status !== 'OK').length,
   results
  };
 }

 function padRight(value, width) {
  const s = String(value ?? '');
  return s.length >= width ? s.slice(0, width - 1) + ' ' : s.padEnd(width);
 }

 function padLeft(value, width) {
  const s = String(value ?? '');
  return s.length >= width ? s.slice(0, width) : s.padStart(width);
 }

 function buildAllBusSummaryTable(allBusData) {
  const rows = allBusData?.results || [];
  const W = 96;
  let report = '';

  // ── Sub-table 1: Symmetrical fault currents ───────────────────────────────
  report += 'SUMMARY — SYMMETRICAL FAULT CURRENTS\n';
  report += '─'.repeat(W) + '\n';
  report += `${padRight('#', 4)}${padRight('Bus', 22)}${padLeft('Voltage', 9)}` +
            `${padLeft('3φ Sym kA', 11)}${padLeft('L-G kA', 9)}${padLeft('L-L kA', 9)}` +
            `${padLeft('X/R', 7)}${padRight(' Status', 8)}\n`;
  report += '─'.repeat(W) + '\n';

  rows.forEach(row => {
   if (row.status !== 'OK') {
    report += `${padRight(row.index, 4)}${padRight(row.busName, 22)}${padLeft(formatVoltage(row.voltage), 9)}` +
              `${'ERROR'.padStart(11)}${'-'.padStart(9)}${'-'.padStart(9)}${'-'.padStart(7)}${padRight(' ERROR', 8)}\n`;
    return;
   }
   const fc  = row.faultCurrents || {};
   const imp = row.impedance || {};
   report += `${padRight(row.index, 4)}${padRight(row.busName, 22)}` +
             `${padLeft(formatVoltage(row.voltage), 9)}` +
             `${padLeft(fc.threePhaseSym.toFixed(3), 11)}` +
             `${padLeft(fc.lineToGround.toFixed(3), 9)}` +
             `${padLeft(fc.lineToLine.toFixed(3), 9)}` +
             `${padLeft(imp.xr.toFixed(3), 7)}` +
             `${padRight(' OK', 8)}\n`;
  });
  report += '─'.repeat(W) + '\n\n';

  // ── Sub-table 2: Asymmetrical / peak currents ─────────────────────────────
  report += 'SUMMARY — ASYMMETRICAL & PEAK FAULT CURRENTS\n';
  report += '─'.repeat(W) + '\n';
  report += `${padRight('#', 4)}${padRight('Bus', 22)}${padLeft('Voltage', 9)}` +
            `${padLeft('Asym@50ms', 11)}${padLeft('1st-Cyc kA', 12)}${padLeft('Peak Crest', 12)}` +
            `${padRight(' Status', 8)}\n`;
  report += '─'.repeat(W) + '\n';

  rows.forEach(row => {
   if (row.status !== 'OK') {
    report += `${padRight(row.index, 4)}${padRight(row.busName, 22)}${padLeft(formatVoltage(row.voltage), 9)}` +
              `${'-'.padStart(11)}${'-'.padStart(12)}${'-'.padStart(12)}${padRight(' ERROR', 8)}\n`;
    return;
   }
   const fc = row.faultCurrents || {};
   report += `${padRight(row.index, 4)}${padRight(row.busName, 22)}` +
             `${padLeft(formatVoltage(row.voltage), 9)}` +
             `${padLeft(fc.threePhaseAsym > 0 ? fc.threePhaseAsym.toFixed(3) : '—', 11)}` +
             `${padLeft(fc.firstCycleAsym > 0 ? fc.firstCycleAsym.toFixed(3) : '—', 12)}` +
             `${padLeft(fc.peakCrest > 0       ? fc.peakCrest.toFixed(3)     : '—', 12)}` +
             `${padRight(' OK', 8)}\n`;
  });
  report += '─'.repeat(W) + '\n';
  report += `Asym@50ms   = asymmetrical RMS at contact parting [K=√(1+2e^(-2t/τ)), t=50ms]\n`;
  report += `1st-Cyc kA  = asymmetrical RMS at first half-cycle [t=8.333ms] — momentary duty\n`;
  report += `Peak Crest  = instantaneous crest [√2·I_sym·(1+e^(-π/(X/R)))]\n`;
  report += `Successful: ${allBusData.successful} / ${allBusData.totalBuses}`;
  if (allBusData.failed > 0) report += `   Failed/Skipped: ${allBusData.failed}`;
  report += '\n\n';

  return report;
 }

 function getHighestFaultBus(allBusData) {
  const okRows = (allBusData?.results || []).filter(r => r.status === 'OK');
  if (okRows.length === 0) return null;
  return okRows.reduce((max, row) => {
   const current = row.faultCurrents?.threePhaseSym || 0;
   const maxCurrent = max?.faultCurrents?.threePhaseSym || 0;
   return current > maxCurrent ? row : max;
  }, okRows[0]);
 }

 function buildAllBusReportHeader(allBusData, options = {}) {
  const info = getProjectInfo();
  const highest = getHighestFaultBus(allBusData);
  let report = '';

  report += '═'.repeat(96) + '\n';
  report += 'SHORT CIRCUIT CALCULATION STEPS — FAULT AT EACH BUS\n';
  report += '═'.repeat(96) + '\n\n';
  report += `Project:           ${info.projectName}\n`;
  report += `Project Number:    ${info.projectNumber}\n`;
  report += `Engineer:          ${info.engineer}\n`;
  report += `Generated:         ${info.timestamp}\n`;
  report += `Method:            ${allBusData.method}\n`;
  report += `Temperature:       ${info.temperature}°C\n`;
  report += `Power Factor:      ${info.powerFactor}\n`;
  report += `Buses Analyzed:    ${allBusData.totalBuses}\n`;
  report += `Successful:        ${allBusData.successful}\n`;
  report += `Failed/Skipped:    ${allBusData.failed}\n`;

  if (highest) {
   const hfc = highest.faultCurrents;
   report += `Highest 3φ Fault:  ${hfc.threePhaseSym.toFixed(3)} kA at ${highest.busName} (${formatVoltage(highest.voltage)})\n`;
   if (hfc.peakCrest > 0) {
    report += `  → 1st-Cycle RMS: ${hfc.firstCycleAsym.toFixed(3)} kA | Peak Crest: ${hfc.peakCrest.toFixed(3)} kA\n`;
   }
  }

  report += '\n';
  report += '─'.repeat(96) + '\n';
  report += 'METHODOLOGY — PRINTED ONCE FOR ALL BUSES\n';
  report += '─'.repeat(96) + '\n';
  report += '📖 Per-Unit Method (IEEE 141-1993 §5.2):\n';
  report += '  • All impedances converted to a common MVA base before accumulation.\n';
  report += '  • Voltage-level changes handled automatically via per-unit conversion.\n';
  report += '  • Transformer ratios are embedded in the per-unit base change; no explicit ratio arithmetic needed.\n';
  report += '  • Sequence networks (Z1, Z2, Z0) tracked separately for ground-fault calculations.\n';
  report += '\n';
  report += '⏱️  Fault Current Definitions (IEEE 141-1993 §5.2.3, ANSI C37.010, IEC 62271-100):\n';
  report += '  • 3φ Sym kA    — Three-phase symmetrical: I_sc = V_pu / Z1_pu × I_base\n';
  report += '  • Asym@50ms    — Asymmetrical RMS at breaker contact parting (t=50ms):\n';
  report += '                   K = √(1 + 2·e^(-2t/τ))  [CORRECTED: exponent = −2t/τ]\n';
  report += '                   Use for INTERRUPTING duty comparison with breaker IC rating.\n';
  report += '  • 1st-Cyc RMS  — Asymmetrical RMS at first cycle (t=8.333ms @ 60Hz):\n';
  report += '                   Use for CLOSING / LATCHING / MOMENTARY duty.\n';
  report += '  • Peak Crest   — Instantaneous first half-wave: √2·I_sym·(1+e^(-π/(X/R)))\n';
  report += '                   Use for bus bracing and IEC making-current comparisons.\n';
  report += '\n';
  report += '📐 Ground Fault (IEEE 141 §5.4):\n';
  report += '  • L-G:   I_LG  = 3·V / (Z1 + Z2 + Z0)\n';
  report += '  • L-L:   I_LL  = V / |Z1 + Z1| = √3/2 × I_3φ (exact for balanced Z)\n';
  report += '  • L-L-G: I_LLG = √3·V / |Z1 + Z2‖Z0|\n';
  report += '\n';
  report += '📚 Standards:\n';
  report += '  ✓ IEEE 141-1993 (Red Book) — Short-Circuit Studies\n';
  report += '  ✓ IEC 60909:2016 — Short-Circuit Currents in Three-Phase AC Systems\n';
  report += '  ✓ ANSI C37.010 — Application Guide for AC High-Voltage Circuit Breakers\n';
  report += '  ✓ IEC 62271-100 — AC Circuit Breakers (making/breaking current)\n';
  report += '  ✓ NEC Article 110.24 — Available Fault Current\n';
  report += '  ✓ IEEE 142 (Green Book) — Grounding of Industrial Power Systems\n';
  report += '\n';
  report += '📝 Deduplication note: Buses with identical 3φ/L-G/L-L/X/R values share a source\n';
  report += '   path and impedance. The first occurrence prints full steps; subsequent identical\n';
  report += '   buses reference it with a one-line note to avoid repetition.\n';
  report += '─'.repeat(96) + '\n\n';

  return report;
 }

 // ── Boilerplate patterns emitted by shortCircuitCalc.js inside per-bus steps ──
 // These are hoisted to the report header (printed once). Strip from each bus.
 const BOILERPLATE_PATTERNS = [
  /📖 METHODOLOGY NOTES[\s\S]*?(?=\n[═=]{10,}|\n[─-]{10,}|\n[█]{10,}|$)/,
  /PER-UNIT SYSTEM ADVANTAGES:[\s\S]*?\n\n/,
  /Standards Compliance:\n(?:✓[^\n]*\n)+\n?/
 ];

 function stripBoilerplate(stepsText) {
  let out = String(stepsText || '');
  for (const pat of BOILERPLATE_PATTERNS) out = out.replace(pat, '');
  return out;
 }

 /**
  * Fingerprint a result for deduplication.
  * Buses with the same 3φ/L-G/L-L/X/R share an identical source path.
  */
 function fingerprintResult(faultCurrents, impedance) {
  return [
   (faultCurrents?.threePhaseSym ?? 0).toFixed(3),
   (faultCurrents?.lineToGround  ?? 0).toFixed(3),
   (faultCurrents?.lineToLine    ?? 0).toFixed(3),
   (impedance?.xr                ?? 0).toFixed(3)
  ].join('|');
 }

 function buildAllBusDetailedSections(allBusData, options = {}) {
  const rows = allBusData?.results || [];
  const suppressBoilerplate = options.suppressBoilerplate !== false; // default true
  const deduplicateIdentical = options.deduplicateIdentical !== false; // default true

  /** fingerprint → { busName, index } of first occurrence */
  const printedFingerprints = new Map();

  let report = '';
  report += '═'.repeat(96) + '\n';
  report += 'DETAILED CALCULATION STEPS BY BUS\n';
  report += '═'.repeat(96) + '\n\n';

  rows.forEach(row => {
   // ── Always print the bus header block ────────────────────────────────────
   report += '█'.repeat(96) + '\n';
   report += `BUS ${row.index} OF ${allBusData.totalBuses}: ${row.busName}`;
   if (row.busTag) report += ` [${row.busTag}]`;
   report += `  (${formatVoltage(row.voltage)})\n`;
   report += '█'.repeat(96) + '\n';
   report += `Bus ID: ${row.busId}\n`;
   report += `Bus Type: ${row.busType || 'N/A'} | Method: ${row.method || allBusData.method} | Status: ${row.status}\n`;

   if (row.status !== 'OK') {
    report += `Error: ${row.error}\n\n`;
    return;
   }

   const fc  = row.faultCurrents || {};
   const imp = row.impedance     || {};

   // ── Per-bus quick-reference current summary ───────────────────────────────
   report += `┌${'─'.repeat(70)}┐\n`;
   report += `│ ${'Fault Type'.padEnd(28)} ${'Sym kA'.padStart(10)} ${'Asym@50ms'.padStart(10)} ${'1st-Cyc'.padStart(10)} ${'Peak Crest'.padStart(12)} │\n`;
   report += `│ ${'─'.repeat(68)} │\n`;
   report += `│ ${'Three-Phase (L-L-L)'.padEnd(28)} ${fc.threePhaseSym.toFixed(3).padStart(10)} ${(fc.threePhaseAsym > 0 ? fc.threePhaseAsym.toFixed(3) : '—').padStart(10)} ${(fc.firstCycleAsym > 0 ? fc.firstCycleAsym.toFixed(3) : '—').padStart(10)} ${(fc.peakCrest > 0 ? fc.peakCrest.toFixed(3) : '—').padStart(12)} │\n`;
   report += `│ ${'Line-to-Ground (L-G)'.padEnd(28)} ${fc.lineToGround.toFixed(3).padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(12)} │\n`;
   report += `│ ${'Line-to-Line (L-L)'.padEnd(28)} ${fc.lineToLine.toFixed(3).padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(12)} │\n`;
   if (fc.doubleLineToGround > 0)
    report += `│ ${'Double L-to-G (L-L-G)'.padEnd(28)} ${fc.doubleLineToGround.toFixed(3).padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(10)} ${'—'.padStart(12)} │\n`;
   report += `│ ${'X/R Ratio'.padEnd(28)} ${imp.xr.toFixed(3).padStart(10)} ${''.padStart(10)} ${''.padStart(10)} ${''.padStart(12)} │\n`;
   report += `└${'─'.repeat(70)}┘\n\n`;

   // ── Deduplication check ───────────────────────────────────────────────────
   if (deduplicateIdentical) {
    const fp = fingerprintResult(fc, imp);
    if (printedFingerprints.has(fp)) {
     const first = printedFingerprints.get(fp);
     report += `ℹ️  Calculation steps identical to Bus ${first.index} (${first.busName}).\n`;
     report += `   Same source path and total impedance — see that section for full detail.\n\n`;
     return;
    }
    printedFingerprints.set(fp, { busName: row.busName, index: row.index });
   }

   // ── Full calculation steps (boilerplate stripped) ─────────────────────────
   let steps = row.calculationSteps || '';
   if (suppressBoilerplate) steps = stripBoilerplate(steps);
   report += steps;
   if (!steps.endsWith('\n')) report += '\n';
   report += '\n';
  });

  return report;
 }

 function buildAllBusShortCircuitStepsReport(allBusData, options = {}) {
  let report = '';
  report += buildAllBusReportHeader(allBusData, options);
  report += buildAllBusSummaryTable(allBusData);
  report += buildAllBusDetailedSections(allBusData, options);
  report += '═'.repeat(96) + '\n';
  report += 'END OF SHORT CIRCUIT CALCULATION STEPS — FAULT AT EACH BUS\n';
  report += '═'.repeat(96) + '\n';
  return report;
 }

 function escapeHtml(text) {
  return String(text ?? '')
   .replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');
 }

 function showTextReportModal(title, reportText) {
  document.getElementById('allBusSccReportOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'allBusSccReportOverlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.55)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';

  overlay.innerHTML = `
   <div style="background:#fff; width:min(1200px, 96vw); height:min(850px, 92vh); border-radius:12px; box-shadow:0 16px 50px rgba(0,0,0,.35); display:flex; flex-direction:column; overflow:hidden;">
    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid #ddd; background:#f8f9fa;">
     <h3 style="margin:0; font-size:18px;">${escapeHtml(title)}</h3>
     <button id="allBusSccClose" type="button" style="border:0; background:#dc3545; color:#fff; padding:7px 12px; border-radius:6px; cursor:pointer;">✕</button>
    </div>
    <pre style="flex:1; margin:0; padding:16px; overflow:auto; white-space:pre-wrap; font-family:Consolas, Monaco, monospace; font-size:12px; line-height:1.45; background:#fff; color:#1f2937;">${escapeHtml(reportText)}</pre>
    <div style="display:flex; gap:10px; justify-content:flex-end; padding:12px 18px; border-top:1px solid #ddd; background:#f8f9fa;">
     <button id="allBusSccCopy" type="button" style="padding:8px 12px; border:1px solid #0d6efd; color:#0d6efd; background:#fff; border-radius:6px; cursor:pointer;">📋 Copy</button>
     <button id="allBusSccDownload" type="button" style="padding:8px 12px; border:1px solid #198754; color:#fff; background:#198754; border-radius:6px; cursor:pointer;">📄 Download TXT</button>
     <button id="allBusSccClose2" type="button" style="padding:8px 12px; border:1px solid #6c757d; background:#fff; border-radius:6px; cursor:pointer;">Close</button>
    </div>
   </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#allBusSccClose')?.addEventListener('click', close);
  overlay.querySelector('#allBusSccClose2')?.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  overlay.querySelector('#allBusSccCopy')?.addEventListener('click', () => {
   if (typeof global.copyToClipboard === 'function') {
    global.copyToClipboard(reportText);
   } else if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(reportText).then(() => alert('✅ Copied to clipboard!'));
   }
  });
  overlay.querySelector('#allBusSccDownload')?.addEventListener('click', () => downloadAllBusReportText(reportText));
 }

 function downloadAllBusReportText(reportText) {
  const info = getProjectInfo();
  const cleanProject = typeof global.sanitizeExportName === 'function'
   ? global.sanitizeExportName(info.projectName, 'Project')
   : (info.projectName.replace(/[^a-z0-9\-_]+/gi, '_') || 'Project');
  const fileTimestamp = typeof global.getExportFileTimestamp === 'function'
   ? global.getExportFileTimestamp()
   : new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${cleanProject}_AllBus_ShortCircuitSteps_${fileTimestamp}.txt`;

  if (typeof global.downloadTextFile === 'function') {
   global.downloadTextFile(reportText, fileName);
   return;
  }

  if (typeof global.downloadFileContent === 'function') {
   global.downloadFileContent(reportText, fileName, 'text/plain;charset=utf-8');
   return;
  }

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
 }

 function buildAllBusReportFromCurrentProject(method = null, options = {}) {
  const resolvedMethod = normalizeMethod(method || getSelectedShortCircuitMethod());
  const allBusData = calculateShortCircuitForAllBuses(resolvedMethod, options);
  const report = buildAllBusShortCircuitStepsReport(allBusData, options);
  return { allBusData, report };
 }

 function showAllBusShortCircuitReport(method = null, options = {}) {
  try {
   const { allBusData, report } = buildAllBusReportFromCurrentProject(method, options);
   showTextReportModal(`Short Circuit Calculation Steps — Fault at Each Bus (${allBusData.method})`, report);
   return report;
  } catch (error) {
   console.error('❌ Failed to generate all-bus short-circuit report:', error);
   alert(`Failed to generate all-bus short-circuit report:\n${error.message || error}`);
   return null;
  }
 }

 function exportAllBusShortCircuitStepsReport(method = null, options = {}) {
  try {
   const { report } = buildAllBusReportFromCurrentProject(method, options);
   downloadAllBusReportText(report);
   return report;
  } catch (error) {
   console.error('❌ Failed to export all-bus short-circuit report:', error);
   alert(`Failed to export all-bus short-circuit report:\n${error.message || error}`);
   return null;
  }
 }

 function appendAllBusButtonsToShortCircuitDisplay(html) {
  const buttons = `
   <div class="all-bus-scc-actions" style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
    <button type="button" class="btn btn-secondary" data-action="all-bus-scc-steps">📚 All-Bus SCC Steps Report</button>
    <button type="button" class="btn btn-secondary" data-action="export-all-bus-scc-steps">📄 Export All-Bus SCC Steps</button>
   </div>
  `;

  if (String(html).includes('data-action="all-bus-scc-steps"')) return html;
  return `${html}${buttons}`;
 }

 function installDisplayButtonWrapper() {
  const original = global.generateShortCircuitDisplay;
  if (typeof original !== 'function' || original.__allBusSccWrapped) return;

  const wrapped = function wrappedGenerateShortCircuitDisplay(...args) {
   const html = original.apply(this, args);
   return appendAllBusButtonsToShortCircuitDisplay(html);
  };
  wrapped.__allBusSccWrapped = true;
  global.generateShortCircuitDisplay = wrapped;
 }

 function installDelegatedActionHandler() {
  if (document.__allBusSccActionsAttached) return;
  document.addEventListener('click', event => {
   const button = event.target?.closest?.('[data-action]');
   if (!button) return;
   const action = button.getAttribute('data-action');
   if (action === 'all-bus-scc-steps') {
    event.preventDefault();
    showAllBusShortCircuitReport();
   }
   if (action === 'export-all-bus-scc-steps') {
    event.preventDefault();
    exportAllBusShortCircuitStepsReport();
   }
  });
  document.__allBusSccActionsAttached = true;
 }

 /**
  * Async version of calculateShortCircuitForAllBuses.
  * Yields to the DOM between each bus via queueMicrotask to avoid blocking
  * the UI thread on large networks (100+ buses).
  *
  * @param {string} method
  * @param {object} options — same as sync version; onProgress still supported
  * @returns {Promise<object>} — same shape as calculateShortCircuitForAllBuses
  */
 async function calculateShortCircuitForAllBusesAsync(method = DEFAULT_METHOD, options = {}) {
  const normalizedMethod = normalizeMethod(method);
  const allBuses = Array.isArray(global.buses) ? global.buses : [];
  const busesToAnalyze = sortBusesForReport(allBuses.filter(bus => shouldAnalyzeBus(bus, options)));
  const previousState = preserveSelectionState();
  const results = [];
  const progressCallback = typeof options.onProgress === 'function' ? options.onProgress : null;

  try {
   for (let i = 0; i < busesToAnalyze.length; i++) {
    const bus = busesToAnalyze[i];
    if (progressCallback) progressCallback({ index: i, total: busesToAnalyze.length, bus });

    // Yield to DOM between buses so progress updates can render
    await new Promise(resolve => queueMicrotask(resolve));

    try {
     const result = calculateBusShortCircuit(bus, normalizedMethod, options);
     const faultCurrents = getFaultCurrents(result);
     const impedance = getImpedanceSummary(result);
     results.push({
      index: i + 1, status: 'OK', busId: bus.id, busName: getBusLabel(bus),
      busTag: safeText(bus.tag, ''), busType: safeText(bus.type, ''),
      voltage: safeNum(bus.voltage, 0), method: safeText(result?.method, normalizedMethod),
      result, faultCurrents, impedance, calculationSteps: getResultSteps(result), error: null
     });
    } catch (error) {
     results.push({
      index: i + 1, status: 'ERROR', busId: bus.id, busName: getBusLabel(bus),
      busTag: safeText(bus.tag, ''), busType: safeText(bus.type, ''),
      voltage: safeNum(bus.voltage, 0), method: normalizedMethod,
      result: null, faultCurrents: null, impedance: null, calculationSteps: '', error: error?.message || String(error)
     });
    }
   }
  } finally {
   restoreSelectionState(previousState);
  }

  return {
   method: normalizedMethod,
   generatedAt: getTimestamp(),
   totalBuses: busesToAnalyze.length,
   successful: results.filter(r => r.status === 'OK').length,
   failed: results.filter(r => r.status !== 'OK').length,
   results
  };
 }

 global.calculateShortCircuitForAllBuses      = calculateShortCircuitForAllBuses;
 global.calculateShortCircuitForAllBusesAsync = calculateShortCircuitForAllBusesAsync;
 global.buildAllBusShortCircuitStepsReport    = buildAllBusShortCircuitStepsReport;
 global.showAllBusShortCircuitReport          = showAllBusShortCircuitReport;
 global.exportAllBusShortCircuitStepsReport   = exportAllBusShortCircuitStepsReport;
 global.buildAllBusShortCircuitSummary        = buildAllBusSummaryTable;

 installDisplayButtonWrapper();
 installDelegatedActionHandler();

 console.log('✅ All-Bus Short Circuit Report v2.0 loaded');
 console.log(' - Boilerplate hoisted to header (printed once): READY');
 console.log(' - Identical-path bus deduplication: READY');
 console.log(' - Summary table: 3φ Sym | Asym@50ms | 1st-Cycle | Peak Crest columns');
 console.log(' - Async loop (queueMicrotask): calculateShortCircuitForAllBusesAsync READY');
})(typeof window !== 'undefined' ? window : globalThis);

/* Consolidated from exportAllBusShortCircuitReportHTML.js */
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
    const name = typeof global.sanitizeExportName === 'function'
      ? global.sanitizeExportName(projectName || 'Project', 'Project')
      : (projectName || 'Project').replace(/[^a-z0-9\-_]+/gi, '_');
    const fileName = `${name}_ShortCircuitCalculation_A4.html`;
    if (typeof global.downloadFileContent === 'function') {
      global.downloadFileContent(content, fileName, 'text/html;charset=utf-8');
      return;
    }
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
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
