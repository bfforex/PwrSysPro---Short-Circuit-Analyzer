/**
 * Load Flow Pass-Through Traversal Fix
 * Added: 2026-05-08 by M365 Copilot
 * Fixed: 2026-05-11
 *   FIX-1: Removed bus.loadCurrentCalculated from getManualBusLoad() candidates.
 *          This value is written by calculations.js after each run as a display-only
 *          cache. Including it caused total load to accumulate (×2, ×3, …) on every
 *          re-click because traverseDownstream added it as a direct bus load AND
 *          still recursed all downstream components.
 *   FIX-2: Added comp.primary / comp.secondary to getTransformerPrimaryVoltage() and
 *          getTransformerSecondaryVoltage() lookup chains. The data model uses these
 *          property names (per loadCalculations.js); the helpers previously only
 *          checked comp.primaryVoltage / comp.primaryV / bus.voltage, silently
 *          falling back to the bus voltage when the named fields were absent.
 *
 * Purpose:
 * - Fix load-flow traversal stopping at breakers/fuses.
 * - Treat breakers/fuses/switching devices as pass-through components.
 * - Preserve transformer load reflection from secondary to primary.
 * - Preserve cables as pass-through components, not loads.
 * - Ensure pathTrace uses real bus objects instead of Unknown/0V placeholder entries.
 *
 * Load order:
 * - after loadFlowCalc.js
 * - after loadCalculations.js
 * - before calculations are run
 */
(function installLoadFlowPassThroughFix(global) {
 'use strict';

 const SQRT3 = Math.sqrt(3);
 const PASS_THROUGH_TYPES = new Set([
  'breaker',
  'fuse',
  'switch',
  'isolator',
  'disconnect',
  'contactor',
  'relay',
  'busbar',
  'tie',
  'bus_tie',
  'protective_device'
 ]);
 const CABLE_TYPES = new Set(['cable', 'conductor', 'feeder']);
 const TRANSFORMER_TYPES = new Set(['transformer', 'xfmr']);
 const LOAD_TYPES = new Set(['load', 'directload', 'direct_load', 'panel', 'equipment', 'other_load']);
 const MOTOR_TYPES = new Set(['motor']);
 const GENERATOR_TYPES = new Set(['generator', 'source_generator']);

 function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
 }

 function normalizeType(type) {
  return String(type || '').trim().toLowerCase();
 }

 function getBusById(busId) {
  if (!Array.isArray(global.buses)) return null;
  return global.buses.find(bus => String(bus.id) === String(busId)) || null;
 }

 function getBusName(busId) {
  const bus = getBusById(busId);
  return bus?.name || bus?.tag || busId || 'Unknown';
 }

 function getOutgoingComponents(busId) {
  if (!Array.isArray(global.components)) return [];
  return global.components.filter(comp => String(comp.fromBus) === String(busId));
 }

 function getComponentLabel(comp) {
  return comp?.tag || comp?.name || comp?.description || comp?.id || 'Unnamed Component';
 }

 function getPowerFactor() {
  const pf = safeNum(document.getElementById('powerFactor')?.value, 0.87);
  return pf > 0 && pf <= 1 ? pf : 0.87;
 }

 function getTimestamp() {
  if (typeof global.getCalculationTimestamp === 'function') {
   try { return global.getCalculationTimestamp(); } catch (_) {}
  }
  return new Date().toISOString();
 }

 function currentToKVA(currentA, voltageV) {
  return safeNum(currentA, 0) * safeNum(voltageV, 0) * SQRT3 / 1000;
 }

 function kvaToCurrent(kva, voltageV) {
  const v = safeNum(voltageV, 0);
  return v > 0 ? safeNum(kva, 0) * 1000 / (SQRT3 * v) : 0;
 }

 function getManualBusLoad(bus) {
  if (!bus) return 0;
  // NOTE: bus.loadCurrentCalculated is intentionally EXCLUDED here.
  // It is set by calculations.js after each run as a display-only cache.
  // Including it caused load to accumulate (double, triple, …) on every
  // re-click because traverseDownstream would add it as a "direct bus load"
  // AND still recurse all downstream components.
  // Only true user-specified manual loads belong in this list.
  const candidates = [
   bus.loadCurrent,
   bus.manualLoadCurrent,
   bus.connectedLoadA
  ];

  for (const value of candidates) {
   const n = safeNum(value, 0);
   if (n > 0) return n;
  }
  return 0;
 }

 function getComponentLoadCurrent(comp, busVoltage) {
  const candidates = [
   comp.current,
   comp.loadCurrent,
   comp.fullLoadCurrent,
   comp.fla,
   comp.flc,
   comp.ratedCurrent
  ];

  for (const value of candidates) {
   const n = safeNum(value, 0);
   if (n > 0) return n;
  }

  const kva = safeNum(comp.kva, safeNum(comp.kVA, safeNum(comp.ratingKVA, 0)));
  if (kva > 0) return kvaToCurrent(kva, busVoltage);

  const hp = safeNum(comp.hp, safeNum(comp.motorHP, 0));
  if (hp > 0) {
   const efficiency = safeNum(comp.efficiency, 0.9);
   const pf = safeNum(comp.powerFactor, getPowerFactor());
   const voltage = safeNum(comp.voltage, busVoltage);
   return hp * 746 / (SQRT3 * voltage * efficiency * pf);
  }

  return 0;
 }

 function getTransformerRatingKVA(comp) {
  return safeNum(comp?.rating, safeNum(comp?.ratingKVA, safeNum(comp?.kva, safeNum(comp?.kVA, 0))));
 }

 function getTransformerPrimaryVoltage(comp, fromBus) {
  // Check all known property names for primary voltage.
  // The data model (loadCalculations.js) uses comp.primary;
  // newer schemas may use comp.primaryVoltage or comp.primaryV.
  return safeNum(comp?.primaryVoltage,
           safeNum(comp?.primaryV,
             safeNum(comp?.primary,
               safeNum(fromBus?.voltage, 0))));
 }

 function getTransformerSecondaryVoltage(comp, toBus) {
  // Check all known property names for secondary voltage.
  // The data model (loadCalculations.js) uses comp.secondary;
  // newer schemas may use comp.secondaryVoltage or comp.secondaryV.
  return safeNum(comp?.secondaryVoltage,
           safeNum(comp?.secondaryV,
             safeNum(comp?.secondary,
               safeNum(toBus?.voltage, 0))));
 }

 function formatIndent(depth) {
  return '  '.repeat(Math.max(0, depth));
 }

 function calculateLoadFlowPatched(busId) {
  const targetBus = getBusById(busId);
  if (!targetBus) {
   throw new Error(`Bus ${busId} not found`);
  }

  const pf = getPowerFactor();
  const loadData = {
   busId: targetBus.id,
   busName: targetBus.name,
   busVoltage: targetBus.voltage,
   totalLoad: 0,
   breakdown: {
    motors: [],
    transformers: [],
    cables: [],
    directLoads: [],
    generators: [],
    passThrough: []
   },
   summary: {
    totalCurrent: 0,
    totalPowerKVA: 0,
    totalPowerKW: 0,
    powerFactor: pf,
    connectedCurrent: 0
   },
   pathTrace: [],
   calculationSteps: '',
   calculationDate: getTimestamp(),
   traversalFix: 'breaker-fuse-pass-through-v1'
  };

  let steps = '';
  let componentCount = 0;
  const visitedEdges = new Set();
  const activeStack = new Set();

  steps += '═'.repeat(80) + '\n';
  steps += 'LOAD FLOW CALCULATION - ENHANCED\n';
  steps += '═'.repeat(80) + '\n\n';
  steps += '📋 CALCULATION INFORMATION\n';
  steps += '─'.repeat(80) + '\n';
  steps += `Date/Time: ${loadData.calculationDate}\n`;
  steps += `Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
  steps += `Target Bus: ${targetBus.tag || targetBus.name} (${targetBus.name})\n`;
  steps += `Bus Voltage: ${targetBus.voltage}V\n`;
  steps += `Power Factor: ${pf}\n`;
  steps += 'Method: Recursive Downstream Load Traversal with breaker/fuse pass-through\n\n';
  steps += '📖 CALCULATION METHODOLOGY\n';
  steps += '─'.repeat(80) + '\n';
  steps += '• Traces all downstream components from target bus\n';
  steps += '• Treats breakers, fuses, switches, and isolators as pass-through components\n';
  steps += '• Cables convey current but are not counted as loads\n';
  steps += '• Refers transformer secondary loads to primary side by kVA conservation\n';
  steps += '• Sums total current and power requirements at the target bus voltage\n\n';
  steps += '═'.repeat(80) + '\n';
  steps += 'LOAD FLOW TRAVERSAL\n';
  steps += '═'.repeat(80) + '\n\n';

  function addPathTrace(bus, depth, note) {
   loadData.pathTrace.push({
    busId: bus?.id || null,
    busName: bus?.name || 'Unknown',
    voltage: safeNum(bus?.voltage, 0),
    type: bus?.type || 'unknown',
    depth,
    note: note || ''
   });
  }

  function traverseDownstream(currentBusId, depth = 0) {
   const currentBus = getBusById(currentBusId);
   const indent = formatIndent(depth);

   if (!currentBus) {
    steps += `${indent}⚠️ Unknown bus ID: ${currentBusId}\n`;
    return 0;
   }

   if (activeStack.has(String(currentBusId))) {
    steps += `${indent}⚠️ Circular path detected at ${currentBus.name}; branch skipped.\n`;
    return 0;
   }

   activeStack.add(String(currentBusId));
   addPathTrace(currentBus, depth, 'visited');

   steps += `${indent}📍 ${currentBus.tag || currentBus.name} (${currentBus.name}) - ${currentBus.voltage}V\n`;

   let totalCurrentAtBus = 0;
   const directLoad = getManualBusLoad(currentBus);
   if (directLoad > 0) {
    const kva = currentToKVA(directLoad, currentBus.voltage);
    totalCurrentAtBus += directLoad;
    loadData.breakdown.directLoads.push({
     bus: currentBus.name,
     busTag: currentBus.tag || currentBus.name,
     current: directLoad,
     powerKVA: kva,
     voltage: currentBus.voltage
    });
    steps += `${indent}  💡 Direct Bus Load: ${directLoad.toFixed(2)} A (${kva.toFixed(2)} kVA)\n`;
   }

   const outgoing = getOutgoingComponents(currentBusId);
   if (outgoing.length === 0) {
    steps += `${indent}  ℹ️ No downstream components.\n`;
    activeStack.delete(String(currentBusId));
    return totalCurrentAtBus;
   }

   outgoing.forEach(comp => {
    const type = normalizeType(comp.type);
    const toBus = getBusById(comp.toBus);
    const edgeKey = `${comp.id || getComponentLabel(comp)}|${comp.fromBus}|${comp.toBus}`;

    if (visitedEdges.has(edgeKey)) return;
    visitedEdges.add(edgeKey);
    componentCount += 1;

    const label = getComponentLabel(comp);
    const toBusName = toBus?.name || comp.toBusName || comp.toBus || 'Unknown';

    if (PASS_THROUGH_TYPES.has(type)) {
     steps += `${indent}  🛡️ ${type.toUpperCase()} ${label}: pass-through to ${toBusName}\n`;
     loadData.breakdown.passThrough.push({
      type,
      tag: label,
      fromBus: currentBus.name,
      toBus: toBusName
     });

     const downstreamCurrentAtToBus = toBus ? traverseDownstream(toBus.id, depth + 1) : 0;
     const downstreamKVA = currentToKVA(downstreamCurrentAtToBus, toBus?.voltage || currentBus.voltage);
     const referredCurrent = kvaToCurrent(downstreamKVA, currentBus.voltage);
     totalCurrentAtBus += referredCurrent;
     steps += `${indent}     ↳ Referred through ${label}: ${referredCurrent.toFixed(2)} A at ${currentBus.voltage}V (${downstreamKVA.toFixed(2)} kVA)\n`;
     return;
    }

    if (CABLE_TYPES.has(type)) {
     steps += `${indent}  🔌 CABLE ${label}: pass-through to ${toBusName}\n`;
     const downstreamCurrentAtToBus = toBus ? traverseDownstream(toBus.id, depth + 1) : 0;
     const downstreamKVA = currentToKVA(downstreamCurrentAtToBus, toBus?.voltage || currentBus.voltage);
     const referredCurrent = kvaToCurrent(downstreamKVA, currentBus.voltage);
     totalCurrentAtBus += referredCurrent;
     loadData.breakdown.cables.push({
      tag: label,
      fromBus: currentBus.name,
      toBus: toBusName,
      current: referredCurrent,
      powerKVA: downstreamKVA,
      voltage: currentBus.voltage,
      length: comp.length,
      size: comp.size,
      material: comp.material
     });
     steps += `${indent}     ↳ Cable carried load: ${referredCurrent.toFixed(2)} A at ${currentBus.voltage}V (${downstreamKVA.toFixed(2)} kVA)\n`;
     return;
    }

    if (TRANSFORMER_TYPES.has(type)) {
     const primaryVoltage = getTransformerPrimaryVoltage(comp, currentBus);
     const secondaryVoltage = getTransformerSecondaryVoltage(comp, toBus);
     steps += `${indent}  🔧 TRANSFORMER ${label}: ${primaryVoltage}V → ${secondaryVoltage}V\n`;
     const secondaryCurrent = toBus ? traverseDownstream(toBus.id, depth + 1) : 0;
     const secondaryKVA = currentToKVA(secondaryCurrent, secondaryVoltage || toBus?.voltage || currentBus.voltage);
     const primaryCurrent = kvaToCurrent(secondaryKVA, primaryVoltage || currentBus.voltage);
     const ratingKVA = getTransformerRatingKVA(comp);
     const loadingPercent = ratingKVA > 0 ? secondaryKVA / ratingKVA * 100 : 0;

     totalCurrentAtBus += primaryCurrent;
     loadData.breakdown.transformers.push({
      tag: label,
      name: label,
      fromBus: currentBus.name,
      toBus: toBusName,
      primaryVoltage,
      secondaryVoltage,
      primaryCurrent,
      secondaryCurrent,
      powerKVA: secondaryKVA,
      rating: ratingKVA,
      loading: loadingPercent
     });
     steps += `${indent}     Secondary load: ${secondaryCurrent.toFixed(2)} A at ${secondaryVoltage}V = ${secondaryKVA.toFixed(2)} kVA\n`;
     steps += `${indent}     Primary current: ${secondaryKVA.toFixed(2)} kVA / (√3 × ${primaryVoltage}V) = ${primaryCurrent.toFixed(2)} A\n`;
     if (ratingKVA > 0) steps += `${indent}     Transformer loading: ${loadingPercent.toFixed(1)}% of ${ratingKVA} kVA\n`;
     return;
    }

    if (MOTOR_TYPES.has(type)) {
     const current = getComponentLoadCurrent(comp, currentBus.voltage);
     const kva = currentToKVA(current, currentBus.voltage);
     totalCurrentAtBus += current;
     loadData.breakdown.motors.push({
      tag: label,
      name: comp.name || label,
      fromBus: currentBus.name,
      toBus: toBusName,
      location: currentBus.name,
      hp: comp.hp || comp.motorHP,
      current,
      powerKVA: kva,
      powerKW: kva * pf,
      voltage: currentBus.voltage
     });
     steps += `${indent}  ⚙️ MOTOR ${label}: ${current.toFixed(2)} A (${kva.toFixed(2)} kVA)\n`;
     return;
    }

    if (LOAD_TYPES.has(type)) {
     const current = getComponentLoadCurrent(comp, toBus?.voltage || currentBus.voltage);
     const kvaAtLoad = currentToKVA(current, toBus?.voltage || currentBus.voltage);
     const referredCurrent = kvaToCurrent(kvaAtLoad, currentBus.voltage);
     totalCurrentAtBus += referredCurrent;
     loadData.breakdown.directLoads.push({
      tag: label,
      bus: toBusName,
      busTag: toBus?.tag || toBusName,
      fromBus: currentBus.name,
      toBus: toBusName,
      current: referredCurrent,
      loadCurrent: current,
      powerKVA: kvaAtLoad,
      voltage: currentBus.voltage
     });
     steps += `${indent}  💡 LOAD ${label}: ${referredCurrent.toFixed(2)} A at ${currentBus.voltage}V (${kvaAtLoad.toFixed(2)} kVA)\n`;
     return;
    }

    if (GENERATOR_TYPES.has(type)) {
     loadData.breakdown.generators.push({
      tag: label,
      name: label,
      fromBus: currentBus.name,
      toBus: toBusName,
      location: toBusName
     });
     steps += `${indent}  ⚡ GENERATOR ${label}: source, not counted as load\n`;
     return;
    }

    // Conservative fallback: if a component has a downstream bus, traverse it as pass-through.
    if (toBus) {
     steps += `${indent}  ℹ️ ${type || 'component'} ${label}: treated as pass-through to ${toBusName}\n`;
     const downstreamCurrent = traverseDownstream(toBus.id, depth + 1);
     const downstreamKVA = currentToKVA(downstreamCurrent, toBus.voltage || currentBus.voltage);
     const referredCurrent = kvaToCurrent(downstreamKVA, currentBus.voltage);
     totalCurrentAtBus += referredCurrent;
     steps += `${indent}     ↳ Referred load: ${referredCurrent.toFixed(2)} A at ${currentBus.voltage}V (${downstreamKVA.toFixed(2)} kVA)\n`;
    } else {
     steps += `${indent}  ⚠️ ${type || 'component'} ${label}: no valid toBus, skipped\n`;
    }
   });

   steps += `${indent}  ✅ Total at ${currentBus.name}: ${totalCurrentAtBus.toFixed(2)} A\n`;
   activeStack.delete(String(currentBusId));
   return totalCurrentAtBus;
  }

  loadData.totalLoad = traverseDownstream(busId, 0);
  loadData.summary.totalCurrent = loadData.totalLoad;
  loadData.summary.connectedCurrent = loadData.totalLoad;
  loadData.summary.totalPowerKVA = currentToKVA(loadData.totalLoad, targetBus.voltage);
  loadData.summary.totalPowerKW = loadData.summary.totalPowerKVA * pf;

  const motorTotal = loadData.breakdown.motors.filter(m => m.voltage === targetBus.voltage).reduce((sum, m) => sum + m.current, 0);
  const motorPower = loadData.breakdown.motors.filter(m => m.voltage === targetBus.voltage).reduce((sum, m) => sum + m.powerKVA, 0);
  const directLoadsAtThisBus = loadData.breakdown.directLoads.filter(d => d.bus === targetBus.name || d.toBus === targetBus.name);
  const directTotal = directLoadsAtThisBus.reduce((sum, d) => sum + d.current, 0);
  const directPower = directLoadsAtThisBus.reduce((sum, d) => sum + d.powerKVA, 0);
  const xfmrTotal = loadData.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
  const xfmrPower = loadData.breakdown.transformers.reduce((sum, t) => sum + (t.powerKVA || 0), 0);
  const totalAtThisLevel = motorTotal + directTotal + xfmrTotal;

  steps += '\n';
  steps += '═'.repeat(80) + '\n';
  steps += 'LOAD FLOW SUMMARY\n';
  steps += '═'.repeat(80) + '\n\n';
  steps += `📊 TOTAL LOAD AT ${targetBus.name}\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Total Load Current: ${loadData.summary.totalCurrent.toFixed(2)} A\n`;
  steps += `Total Apparent Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA\n`;
  steps += `Total Active Power: ${loadData.summary.totalPowerKW.toFixed(2)} kW\n`;
  steps += `Power Factor: ${pf}\n`;
  steps += `Components Analyzed: ${componentCount}\n\n`;
  steps += `📋 BREAKDOWN BY COMPONENT TYPE (AT ${targetBus.voltage}V LEVEL)\n`;
  steps += '─'.repeat(80) + '\n';
  steps += 'Type Count Current (A) Power (kVA) Percentage Note\n';
  steps += '─'.repeat(80) + '\n';

  if (directLoadsAtThisBus.length > 0) {
   const pct = totalAtThisLevel > 0 ? directTotal / totalAtThisLevel * 100 : 0;
   steps += `Direct Load ${String(directLoadsAtThisBus.length).padStart(5)} ${directTotal.toFixed(2).padStart(11)} ${directPower.toFixed(2).padStart(11)} ${pct.toFixed(1).padStart(10)}% At this bus\n`;
  }

  if (loadData.breakdown.transformers.length > 0) {
   const pct = totalAtThisLevel > 0 ? xfmrTotal / totalAtThisLevel * 100 : 0;
   steps += `Transformers ${String(loadData.breakdown.transformers.length).padStart(5)} ${xfmrTotal.toFixed(2).padStart(11)} ${xfmrPower.toFixed(2).padStart(11)} ${pct.toFixed(1).padStart(10)}% Reflected from secondary\n`;
  }

  if (motorTotal > 0) {
   const motorsAtLevel = loadData.breakdown.motors.filter(m => m.voltage === targetBus.voltage);
   const pct = totalAtThisLevel > 0 ? motorTotal / totalAtThisLevel * 100 : 0;
   steps += `Motors (${targetBus.voltage}V) ${String(motorsAtLevel.length).padStart(2)} ${motorTotal.toFixed(2).padStart(11)} ${motorPower.toFixed(2).padStart(11)} ${pct.toFixed(1).padStart(10)}% At this level\n`;
  }

  if (loadData.breakdown.cables.length > 0) {
   steps += `Cables ${String(loadData.breakdown.cables.length).padStart(5)} (conveyance) - - Pass-through only\n`;
  }

  if (loadData.breakdown.passThrough.length > 0) {
   steps += `Breakers/Fuses ${String(loadData.breakdown.passThrough.length).padStart(5)} (conveyance) - - Pass-through only\n`;
  }

  steps += '─'.repeat(80) + '\n';
  steps += `TOTAL AT ${targetBus.voltage}V ${' '.repeat(5)} ${loadData.summary.totalCurrent.toFixed(2).padStart(11)} ${loadData.summary.totalPowerKVA.toFixed(2).padStart(11)} ${' '.repeat(10)}100.0%\n`;
  steps += '─'.repeat(80) + '\n\n';
  steps += 'ℹ️ Note:\n';
  steps += ` • Direct load of ${directTotal.toFixed(2)}A is specified at this bus (${targetBus.voltage}V)\n`;
  steps += ' • Breakers, fuses, switches, and isolators are pass-through devices and are not counted as loads\n';
  steps += ' • Cables convey power but are not loads (not counted in percentages)\n';
  steps += ' • Transformers show primary current (reflected from secondary loads)\n';
  steps += ` • Total represents all downstream loads referred to ${targetBus.voltage}V\n`;
  steps += ` • Percentages are of ACTUAL consumed load (${totalAtThisLevel.toFixed(2)}A)\n\n`;
  steps += '═'.repeat(80) + '\n';
  steps += 'END OF LOAD FLOW CALCULATION\n';
  steps += '═'.repeat(80) + '\n';

  loadData.calculationSteps = steps;

  console.log(`✅ Load flow pass-through fixed result for ${targetBus.name}: ${loadData.summary.totalCurrent.toFixed(2)} A, ${loadData.summary.totalPowerKVA.toFixed(2)} kVA`);
  return loadData;
 }

 function calculateDownstreamLoadPatched(busId) {
  try {
   const lf = calculateLoadFlowPatched(busId);
   return lf?.summary?.totalCurrent || 0;
  } catch (error) {
   console.warn('⚠️ calculateDownstreamLoad pass-through fix failed:', error.message);
   return 0;
  }
 }

 function calculateLoadFlowWithDemandPatched(busId) {
  const standardLoadFlow = calculateLoadFlowPatched(busId);
  if (typeof global.applyDemandFactorsToLoadFlow === 'function') {
   return global.applyDemandFactorsToLoadFlow(standardLoadFlow);
  }
  return standardLoadFlow;
 }

 global.calculateLoadFlow = calculateLoadFlowPatched;
 global.calculateDownstreamLoad = calculateDownstreamLoadPatched;
 global.calculateLoadFlowWithDemand = calculateLoadFlowWithDemandPatched;

 console.log('✅ Load Flow Pass-Through Traversal Fix loaded');
 console.log(' - Breaker/fuse traversal: READY');
 console.log(' - Cable pass-through: READY');
 console.log(' - Transformer reflection: READY');
 console.log(' - calculateLoadFlow override: READY');
 console.log(' - calculateDownstreamLoad override: READY');
})(typeof window !== 'undefined' ? window : globalThis);
