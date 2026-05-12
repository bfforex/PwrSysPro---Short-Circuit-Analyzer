/**
 * Short Circuit Follow-up Fixes v3.2
 * Updated: 2026-05-08
 *
 * Fixes in v3.2 (over v3.1):
 * 1) estimatePeakMomentaryKA replaced with correct formula families:
 *    - asymRmsAtContactParting: √(1 + 2·e^(-2·t_contact/τ)) × I_sym  [50 ms]
 *    - firstCycleAsymKA:        √(1 + 2·e^(-2·t_1cycle/τ))  × I_sym  [8.333 ms]
 *    - peakCrestKA:             √2 × I_sym × (1 + e^(-π/(X/R)))
 *    These are sourced from result.firstCycleAsymKA / result.peakCrestKA when
 *    available (set by shortCircuitCalc.js v1.6.0), falling back to estimation
 *    from X/R when those fields are absent (backward compatibility).
 * 2) patchProtectionMomentaryBasisText now annotates the basis text with all
 *    three current types and their correct labels, not just √2 × I_asym.
 * 3) Referred through-fault section: unchanged from v3.1 (actual path only).
 * 4) faultCurrents schema: firstCycleAsymKA and peakCrestKA now populated.
 * 5) NOT-APPLICABLE wording fix: unchanged from v3.1.
 * 6) LV cable Z0 note: unchanged from v3.1.
 *
 * Load order:
 * - after shortCircuitCalc.js
 * - after protection report modules
 */
(function installShortCircuitFollowupFixesV32(global) {
 'use strict';

 function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
 }

 const SYSTEM_FREQUENCY = 60;
 const CONTACT_PARTING_TIME = 0.05;       // 50 ms — interrupting duty
 const FIRST_CYCLE_TIME = 1 / (2 * SYSTEM_FREQUENCY); // 8.333 ms — momentary duty

 /**
  * Estimate asymmetrical RMS multiplier K = √(1 + 2·e^(-2t/τ)).
  * τ is derived from X/R: τ = (X/R) / (2πf).
  */
 function asymMultiplierFromXR(xr, t) {
  if (!(xr > 0)) return 1.0;
  const tau = xr / (2 * Math.PI * SYSTEM_FREQUENCY);
  return Math.sqrt(1 + 2 * Math.exp(-2 * t / tau));
 }

 /**
  * Estimate peak crest: √2 × I_sym × (1 + e^(-π/(X/R))).
  * Returns 0 if I_sym is 0.
  */
 function peakCrestFromXR(symKA, xr) {
  if (!(symKA > 0)) return 0;
  if (!(xr > 0)) return Math.SQRT2 * symKA;
  return Math.SQRT2 * symKA * (1 + Math.exp(-Math.PI / xr));
 }

 function getFaultCurrentsFromResult(result) {
  const fc = result?.faultCurrents || {};
  const xr = safeNum(result?.xrRatio, safeNum(result?.xr, 0));

  const threePhaseSym = safeNum(
   fc.threePhaseSym,
   safeNum(result?.faultCurrentKA, safeNum(result?.initialSymmetricalCurrentKA, 0))
  );

  // Asymmetrical @ contact parting (50 ms) — use stored value or estimate
  const threePhaseAsym = safeNum(
   fc.threePhaseAsym,
   safeNum(result?.asymFaultCurrentKA,
    threePhaseSym * asymMultiplierFromXR(xr, CONTACT_PARTING_TIME)
   )
  );

  // First-cycle (momentary / closing duty) — use stored value or estimate
  const firstCycleAsym = safeNum(
   fc.firstCycleAsym,
   safeNum(result?.firstCycleAsymKA,
    threePhaseSym * asymMultiplierFromXR(xr, FIRST_CYCLE_TIME)
   )
  );

  // Instantaneous peak crest — use stored value or estimate
  const peakCrest = safeNum(
   fc.peakCrest,
   safeNum(result?.peakCrestKA, peakCrestFromXR(threePhaseSym, xr))
  );

  return {
   threePhaseSym,
   threePhaseAsym,
   firstCycleAsym,
   peakCrest,
   lineToGround: safeNum(fc.lineToGround, safeNum(result?.lineToGroundKA, threePhaseSym * 0.85)),
   lineToLine:   safeNum(fc.lineToLine,   safeNum(result?.lineToLineKA,   threePhaseSym * 0.866)),
   doubleLineToGround: safeNum(fc.doubleLineToGround, safeNum(result?.doubleLineToGroundKA, 0))
  };
 }

 function findBusById(busId) {
  if (!busId || !Array.isArray(global.buses)) return null;
  return global.buses.find(bus => String(bus.id) === String(busId)) || null;
 }

 function getDeviceVoltage(device) {
  const candidates = [device?.voltage];
  const fromBus = findBusById(device?.fromBus);
  const toBus = findBusById(device?.toBus);
  if (fromBus) candidates.push(fromBus.voltage);
  if (toBus) candidates.push(toBus.voltage);
  for (const value of candidates) {
   const n = safeNum(value, 0);
   if (n > 0) return n;
  }
  return 0;
 }

 function getDeviceInterruptingKA(device) {
  const candidates = [device?.interruptingRatingSymKA, device?.interruptingRatingKA, device?.interruptingSymKA, device?.interruptingKA, device?.ratingKA];
  for (const value of candidates) {
   const n = safeNum(value, 0);
   if (n > 0) return n;
  }
  return 0;
 }

 function getDeviceContinuousA(device) {
  const candidates = [device?.continuousAmpRating, device?.ampereRating, device?.rating, device?.continuousA];
  for (const value of candidates) {
   const n = safeNum(value, 0);
   if (n > 0) return n;
  }
  return 0;
 }

 function getPathBusIds(path) {
  if (!Array.isArray(path)) return [];
  return path.map(segment => segment?.bus?.id).filter(Boolean).map(String);
 }

 function getPathEdgeSet(path) {
  const ids = getPathBusIds(path);
  const edges = new Set();
  for (let i = 1; i < ids.length; i++) {
   const a = ids[i - 1];
   const b = ids[i];
   edges.add(`${a}|${b}`);
   edges.add(`${b}|${a}`);
  }
  return edges;
 }

 function isDeviceOnActualPath(device, path) {
  if (!device || !device.fromBus || !device.toBus) return false;
  return getPathEdgeSet(path).has(`${String(device.fromBus)}|${String(device.toBus)}`);
 }

 function getTransformersDownstreamOfDeviceOnActualPath(device, path) {
  if (!isDeviceOnActualPath(device, path) || !Array.isArray(path)) return [];
  const ids = getPathBusIds(path);
  const fromIndex = ids.indexOf(String(device.fromBus));
  const toIndex = ids.indexOf(String(device.toBus));
  const deviceIndex = Math.max(fromIndex, toIndex);
  if (deviceIndex < 0) return [];

  const downstreamTransformers = [];
  for (let i = deviceIndex + 1; i < path.length; i++) {
   const comp = path[i]?.component;
   if (comp?.type === 'transformer') downstreamTransformers.push(comp);
  }
  return downstreamTransformers;
 }

 function generatePathOnlyReferredThroughFaultSupplement(result) {
  const path = result?.path;
  const targetBus = Array.isArray(path) ? path[path.length - 1]?.bus : null;
  const targetVoltage = safeNum(targetBus?.voltage, 0);
  const faultCurrents = getFaultCurrentsFromResult(result);
  const targetFaultKA = faultCurrents.threePhaseSym;

  if (!Array.isArray(path) || !targetBus || targetVoltage <= 0 || targetFaultKA <= 0 || !Array.isArray(global.components)) return '';

  const pathDevices = global.components.filter(device => device && (device.type === 'breaker' || device.type === 'fuse') && isDeviceOnActualPath(device, path));
  const rows = [];

  pathDevices.forEach(device => {
   const downstreamTransformers = getTransformersDownstreamOfDeviceOnActualPath(device, path);
   if (downstreamTransformers.length === 0) return;

   const deviceVoltage = getDeviceVoltage(device);
   if (deviceVoltage <= 0) return;

   const referredKA = targetFaultKA * (targetVoltage / deviceVoltage);
   const interruptingKA = getDeviceInterruptingKA(device);
   const continuousA = getDeviceContinuousA(device);
   const utilization = interruptingKA > 0 ? referredKA / interruptingKA * 100 : null;
   const resultText = interruptingKA > 0 ? (referredKA <= interruptingKA ? 'PASS' : 'FAIL') : 'CHECK REQUIRED';
   rows.push({ device, downstreamTransformers, deviceVoltage, referredKA, interruptingKA, continuousA, utilization, resultText });
  });

  if (rows.length === 0) return '';

  let text = '';
  text += '════════════════════════════════════════════════════════════════════════════════\n';
  text += 'REFERRED THROUGH-FAULT CHECKS ACROSS TRANSFORMERS — ACTUAL PATH ONLY\n';
  text += '════════════════════════════════════════════════════════════════════════════════\n';
  text += `Target Bus: ${targetBus.name || targetBus.id} (${targetVoltage} V)\n`;
  text += `Target 3φ Fault Current: ${targetFaultKA.toFixed(3)} kA\n`;
  text += 'Basis: I_referred = I_target × (V_target / V_device). Only protective devices located on the traced fault-current path are listed. Direct device duty is evaluated by referred current when a transformer is between the device and the target bus.\n\n';

  rows.forEach((row, index) => {
   const device = row.device;
   const deviceName = device.tag || device.name || `${device.type || 'Device'} ${index + 1}`;
   const transformerTags = row.downstreamTransformers.map(t => t.tag || t.name || t.id || 'Transformer').join(', ');
   text += `${index + 1}. ${String(device.type || 'device').toUpperCase()} ${deviceName}\n`;
   text += `   From Bus: ${device.fromBusName || device.fromBus}\n`;
   text += `   To Bus: ${device.toBusName || device.toBus}\n`;
   text += `   Downstream transformer boundary: ${transformerTags}\n`;
   text += `   Device voltage basis: ${row.deviceVoltage.toFixed(0)} V\n`;
   text += `   Referred through-fault current: ${row.referredKA.toFixed(3)} kA\n`;
   text += `   Formula: ${targetFaultKA.toFixed(3)} × (${targetVoltage.toFixed(0)} / ${row.deviceVoltage.toFixed(0)}) = ${row.referredKA.toFixed(3)} kA\n`;
   if (row.continuousA > 0) text += `   Existing continuous rating: ${row.continuousA.toFixed(2)} A\n`;
   if (row.interruptingKA > 0) {
    text += `   Existing interrupting rating: ${row.interruptingKA.toFixed(3)} kA\n`;
    text += `   Interrupting utilization: ${row.utilization.toFixed(2)}%\n`;
   } else {
    text += '   Existing interrupting rating: Not entered\n';
   }
   text += `   Referred through-fault result: ${row.resultText}\n\n`;
  });
  return text;
 }

 function stripExistingReferredThroughFaultSection(text) {
  return String(text || '').replace(/════════════════════════════════════════════════════════════════════════════════\nREFERRED THROUGH-FAULT CHECKS ACROSS TRANSFORMERS[\s\S]*$/, '');
 }

 function patchNoNotApplicableWording(text) {
  let patched = String(text || '');
  patched = patched.replace(/\(upstream of transformer - reference\)/g, '(upstream across transformer boundary - referred check below)');
  patched = patched.replace(/Direct interrupting check at target bus: NOT APPLIED across transformer/g, 'Direct interrupting check at target bus: Deferred across transformer boundary');
  patched = patched.replace(/Adequacy result: NOT-APPLICABLE/g, 'Adequacy result: REFERRED-CHECK');
  patched = patched.replace(/Overall protection adequacy status: NOT-APPLICABLE/g, 'Overall protection adequacy status: SEE REFERRED THROUGH-FAULT CHECKS');
  patched = patched.replace(/NOT-APPLICABLE/g, 'REFERRED-CHECK');
  patched = patched.replace(/NOT APPLICABLE/g, 'REFERRED CHECK');
  patched = patched.replace(/not applicable/g, 'evaluated by referred check');
  return patched;
 }

 function patchLvZ0Note(text) {
  return String(text || '').replace(/ℹ️ For MV shielded cables, Z0 depends on shield bonding and earth return\./g, 'ℹ️ Z0 is estimated from installation method; actual return impedance depends on raceway, bonding, grounding conductor, and return path.');
 }

 function patchProtectionMomentaryBasisText(text, result) {
  const faultCurrents = getFaultCurrentsFromResult(result);
  const fc = faultCurrents;
  if (!(fc.threePhaseAsym > 0) && !(fc.firstCycleAsym > 0) && !(fc.peakCrest > 0)) return text;

  const replacement =
   `Basis Peak / Momentary:\n` +
   `   Asym RMS @ 50ms (interrupting):    ${fc.threePhaseAsym.toFixed(3)} kA  [K=√(1+2e^(-2t/τ)), t=50ms]\n` +
   `   1st-Cycle Asym RMS (momentary):    ${fc.firstCycleAsym.toFixed(3)} kA  [K=√(1+2e^(-2t/τ)), t=8.333ms]\n` +
   `   Peak Crest (instantaneous):        ${fc.peakCrest.toFixed(3)} kA  [√2·I_sym·(1+e^(-π/(X/R)))]`;

  return String(text || '')
   .replace(/Basis Peak \/ Momentary:\s*[\d.]+\s*kA[^\n]*/g, replacement)
   .replace(/Basis Peak \/ Momentary:\s*0\.000 kA[^\n]*/g, replacement);
 }

 function patchCalculationTextV32(text, result) {
  let patched = String(text || '');
  patched = patchProtectionMomentaryBasisText(patched, result);
  patched = patchLvZ0Note(patched);
  patched = patchNoNotApplicableWording(patched);
  patched = stripExistingReferredThroughFaultSection(patched);
  const referred = generatePathOnlyReferredThroughFaultSupplement(result);
  if (referred) {
   if (!patched.endsWith('\n')) patched += '\n';
   patched += referred;
  }
  return patched;
 }

 function patchResultV32(result) {
  if (!result || typeof result !== 'object') return result;

  const faultCurrents = getFaultCurrentsFromResult(result);

  result.faultCurrents = Object.assign({}, result.faultCurrents || {}, {
   threePhaseSym:      faultCurrents.threePhaseSym,
   threePhaseAsym:     faultCurrents.threePhaseAsym,
   firstCycleAsym:     faultCurrents.firstCycleAsym,
   peakCrest:          faultCurrents.peakCrest,
   lineToGround:       faultCurrents.lineToGround,
   lineToLine:         faultCurrents.lineToLine,
   doubleLineToGround: faultCurrents.doubleLineToGround,
   // legacy aliases kept for downstream consumers
   peakMomentary:    faultCurrents.firstCycleAsym,
   peakMomentaryKA:  faultCurrents.firstCycleAsym
  });

  // Preserve legacy top-level aliases expected elsewhere in the app.
  result.faultCurrentKA        = safeNum(result.faultCurrentKA,        faultCurrents.threePhaseSym);
  result.asymFaultCurrentKA    = safeNum(result.asymFaultCurrentKA,    faultCurrents.threePhaseAsym);
  result.firstCycleAsymKA      = safeNum(result.firstCycleAsymKA,      faultCurrents.firstCycleAsym);
  result.peakCrestKA           = safeNum(result.peakCrestKA,           faultCurrents.peakCrest);
  result.peakMomentaryKA       = safeNum(result.peakMomentaryKA,       faultCurrents.firstCycleAsym);
  result.lineToGroundKA        = safeNum(result.lineToGroundKA,        faultCurrents.lineToGround);
  result.lineToLineKA          = safeNum(result.lineToLineKA,          faultCurrents.lineToLine);
  result.doubleLineToGroundKA  = safeNum(result.doubleLineToGroundKA,  faultCurrents.doubleLineToGround);

  const currentText  = result.calculationSteps || result.steps || '';
  const patchedText  = patchCalculationTextV32(currentText, result);
  result.calculationSteps = patchedText;
  result.steps            = patchedText;

  return result;
 }

 function wrapCalculationFunction(name) {
  const original = global[name];
  if (typeof original !== 'function' || original.__shortCircuitFollowupFixesV32Wrapped) return;
  const wrapped = function wrappedShortCircuitFollowupFixesV32(...args) {
   const result = original.apply(this, args);
   return patchResultV32(result);
  };
  wrapped.__shortCircuitFollowupFixesV32Wrapped = true;
  global[name] = wrapped;
 }

 global.generateReferredThroughFaultSupplement = generatePathOnlyReferredThroughFaultSupplement;
 global.patchShortCircuitFollowupTextV3        = patchCalculationTextV32;
 global.patchShortCircuitResultFollowupV3      = patchResultV32;

 wrapCalculationFunction('calculateShortCircuit');
 wrapCalculationFunction('calculateShortCircuitPointToPoint');
 wrapCalculationFunction('calculateShortCircuitPerUnit');

 console.log('✅ Short Circuit follow-up fixes v3.2 loaded');
 console.log(' - Asymmetrical @ 50ms:        uses K=√(1+2e^(-2t/τ)) — corrected exponent');
 console.log(' - First-cycle momentary:       sourced from result.firstCycleAsymKA or estimated');
 console.log(' - Peak crest:                  √2·I_sym·(1+e^(-π/(X/R))) — not √2·I_asym');
 console.log(' - Referred through-fault:      ACTUAL PATH ONLY');
 console.log(' - NOT-APPLICABLE wording:      REMOVED');
 console.log(' - LV Z0 note wording:          GENERIC');
 console.log(' - faultCurrents schema:        firstCycleAsym + peakCrest populated');
})(typeof window !== 'undefined' ? window : globalThis);
