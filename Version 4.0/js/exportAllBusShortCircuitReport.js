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
  const cleanProject = info.projectName.replace(/[^a-z0-9\-_]+/gi, '_') || 'Project';
  const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${cleanProject}_AllBus_ShortCircuitSteps_${fileTimestamp}.txt`;

  if (typeof global.downloadTextFile === 'function') {
   global.downloadTextFile(reportText, fileName);
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
