/**
 * Voltage Drop Calculation Module
 * Dedicated calculations for voltage drop analysis
 *
 * @author bfforex
 * @date 2025-10-28 11:00:04 UTC
 * @version 1.2.2 (V1 with safe V2 backports)
 * - No API changes; same function signature and global export
 * - Backports from V2: defensive DOM/globals, cable/transformer guards, downstream-load preference
 * - Totals normalized to SOURCE voltage base for correctness across transformers
 * - IEEE 141 source-impedance exclusion preserved in steps/logs
 */

/**
 * Perform voltage drop analysis for a bus path
 * Returns detailed voltage drop calculations
 *
 * @param {String} busId           - Bus identifier
 * @param {Array}  path            - Path from source to target bus (array of {bus, component})
 * @param {Object} loadFlowData    - Load flow results (optional)
 * @returns {Object} Voltage drop results with detailed breakdown
 */
function calculateVoltageDrop(busId, path, loadFlowData = null) {
  // √3: use global if present, else define (non-breaking)
  const SQRT3 =
    (typeof window !== 'undefined' && typeof window.SQRT3 === 'number')
      ? window.SQRT3
      : (typeof globalThis !== 'undefined' && typeof globalThis.SQRT3 === 'number')
        ? globalThis.SQRT3
        : Math.sqrt(3);

  // Resolve 'buses' defensively (non-breaking)
  const busesArr = (typeof window !== 'undefined' && Array.isArray(window.buses))
    ? window.buses
    : (typeof buses !== 'undefined' && Array.isArray(buses)) ? buses : [];

  const bus = busesArr.find(b => b && b.id === busId);
  if (!bus) {
    // Preserve throw behavior
    throw new Error(`Bus ${busId} not found`);
  }

  // Console banner (kept)
  console.log('\n' + '═'.repeat(80));
  console.log('VOLTAGE DROP ANALYSIS');
  console.log('═'.repeat(80));
  console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
  console.log('═'.repeat(80) + '\n');

  // Defensive DOM reads (backported from V2, non-breaking)
  const pfEl   = (typeof document !== 'undefined') ? document.getElementById('powerFactor') : null;
  const tempEl = (typeof document !== 'undefined') ? document.getElementById('temperature') : null;
  const engrEl = (typeof document !== 'undefined') ? document.getElementById('engineer') : null;

  const powerFactor = (pfEl && !Number.isNaN(parseFloat(pfEl.value))) ? parseFloat(pfEl.value) : 0.85;
  const temperature = (tempEl && !Number.isNaN(parseFloat(tempEl.value))) ? parseFloat(tempEl.value) : 75;
  const engineerName = (engrEl && typeof engrEl.value === 'string' && engrEl.value.trim().length > 0)
    ? engrEl.value.trim()
    : 'Unknown';

  // Initialize result (kept shape)
  const vdData = {
    busId: bus.id,
    busName: bus.name,
    busVoltage: bus.voltage,
    powerFactor: powerFactor,
    temperature: temperature,
    components: [],
    cumulativeDropVolts: 0,     // normalized to SOURCE base
    cumulativeDropPercent: 0,   // normalized to SOURCE base
    maxDropPercent: 0,
    maxDropComponent: null,
    criticalComponents: [],
    compliance: {
      feederLimit: 3,
      branchLimit: 5,
      combinedLimit: 7,
      status: 'UNKNOWN'
    },
    calculationSteps: '',
    calculationDate: (typeof getCalculationTimestamp === 'function')
      ? getCalculationTimestamp()
      : new Date().toISOString()
  };

  // Steps header (kept)
  let steps = 'VOLTAGE DROP CALCULATION\n';
  steps += '='.repeat(80) + '\n\n';
  steps += `Date/Time: ${vdData.calculationDate}\n`;
  steps += `Engineer: ${engineerName}\n`;
  steps += `Bus: ${bus.name} (${bus.voltage}V)\n`;
  steps += `Power Factor: ${powerFactor}\n`;
  steps += `Temperature: ${temperature}°C\n`;
  steps += `Method: Component-by-Component Analysis\n\n`;
  steps += `IEEE 141 STANDARDS:\n`;
  steps += ` • Feeder Circuits: ${vdData.compliance.feederLimit}% maximum\n`;
  steps += ` • Branch Circuits: ${vdData.compliance.branchLimit}% maximum\n`;
  steps += ` • Combined System: ${vdData.compliance.combinedLimit}% maximum\n\n`;

  // Voltage base setup
  const initialVoltageLevel =
    (Array.isArray(path) && path.length > 0 && path[0] && path[0].bus && Number(path[0].bus.voltage))
      ? Number(path[0].bus.voltage)
      : Number(bus.voltage);

  let currentVoltageLevel = initialVoltageLevel;
  const sourceVoltageBase = initialVoltageLevel > 0 ? initialVoltageLevel : (Number(bus.voltage) || 1);
  let cumulativeDropVoltsOnSource = 0;

  let stepNumber = 1;

  // Source impedance exclusion (kept & clarified)
  const sourceBus = (Array.isArray(path) && path.length > 0) ? path[0].bus : null;
  if (sourceBus && sourceBus.type === 'source') {
    steps += `SOURCE IMPEDANCE HANDLING:\n`;
    steps += '-'.repeat(80) + '\n';
    steps += `Source Bus: ${sourceBus.name} (${sourceBus.voltage}V)\n`;
    if (sourceBus.utilityFaultCurrent) {
      const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
      const utilityXR = (typeof sourceBus.utilityXR === 'number') ? sourceBus.utilityXR : 3;
      steps += `Available Fault Current: ${Number(sourceBus.utilityFaultCurrent).toFixed(2)} kA\n`;
      steps += `Source Impedance: ${utilityZ.toFixed(6)} Ω (X/R: ${utilityXR})\n\n`;
    }
    steps += `⚠️ IMPORTANT: Per IEEE 141-1993 Section 3.2.1:\n`;
    steps += ` "Voltage drop calculations shall begin at the first\n`;
    steps += `  distribution point, NOT including utility source impedance."\n\n`;
    steps += `✅ SOURCE IMPEDANCE EXCLUDED FROM VOLTAGE DROP CALCULATION\n`;
    steps += `  Source impedance is ONLY used for short circuit analysis.\n`;
    steps += `  Voltage drop starts from FIRST COMPONENT after source.\n\n`;
    console.log('ℹ️ Source impedance detected and EXCLUDED from voltage drop');
    console.log(' Per IEEE 141-1993 Section 3.2.1');
    console.log(' Starting voltage drop from first distribution component');
  }

  // Helper: update totals on SOURCE base
  const updateTotals = (localDropVolts, localDropPercent, componentVoltageBase) => {
    const vBase = (Number(componentVoltageBase) > 0) ? Number(componentVoltageBase) : currentVoltageLevel;
    const normalize = (vBase > 0 && sourceVoltageBase > 0) ? (vBase / sourceVoltageBase) : 1;

    cumulativeDropVoltsOnSource += Number(localDropVolts || 0) * normalize;

    vdData.cumulativeDropVolts = cumulativeDropVoltsOnSource;
    vdData.cumulativeDropPercent = (sourceVoltageBase > 0)
      ? (cumulativeDropVoltsOnSource / sourceVoltageBase) * 100
      : vdData.cumulativeDropPercent;

    if (Number(localDropPercent) > vdData.maxDropPercent) {
      vdData.maxDropPercent = Number(localDropPercent);
      vdData.maxDropComponent = {
        step: stepNumber,
        name: (vdData.components[vdData.components.length - 1] || {}).name,
        type: (vdData.components[vdData.components.length - 1] || {}).type
      };
    }
  };


// Self-healing: find first segment with a real component (skip any source/no-component steps)
let startIndex = 1; // default: first step after source
while (Array.isArray(path) && startIndex < path.length) {
  const seg = path[startIndex];
  const isSource = seg?.bus?.type === 'source';
  const noComponent = !seg?.component;
  if (isSource || noComponent) {
    steps += `VD Self-Healing: Skipped path step ${startIndex + 1} `
          + `(${seg?.bus?.name || 'Unknown'}) — source/no-component excluded by design.\n`;
    startIndex++;
  } else {
    break;
  }
}

// If nothing left after skipping, return clean/empty VD (zero totals, with steps)
if (startIndex >= path.length) {
  steps += `Path contained only source/no-component segments — no VD applicable.\n`;
  vdData.calculationSteps = steps;
  return vdData;
}

// Process components (start at first real component)
for (let i = startIndex; Array.isArray(path) && i < path.length; i++) {
  const segment = path[i];
  const comp = segment && segment.component ? segment.component : null;
  if (!comp) continue;


    // ──────────────────────────
    // CABLE (with V2 guards)
    // ──────────────────────────
    if (comp.type === 'cable') {
      steps += `STEP ${stepNumber}: CABLE\n`;
      steps += '-'.repeat(80) + '\n';

      // Safer cable data/material
      const allCableData = (typeof CABLE_IMPEDANCE_DATA !== 'undefined') ? CABLE_IMPEDANCE_DATA : {};
      const cableData =
        allCableData && comp.size && allCableData[comp.size]
          ? allCableData[comp.size]
          : (Object.values(allCableData)[0] || {});

      const material = (comp.material || 'copper').toLowerCase();
      const parallel = Number(comp.parallel) > 0 ? Number(comp.parallel) : 1;
      const lengthFt = Number(comp.length) > 0 ? Number(comp.length) : 0;

      const rBase20 =
        (cableData && cableData[material] && typeof cableData[material].r === 'number')
          ? cableData[material].r
          : (cableData && cableData.copper && typeof cableData.copper.r === 'number' ? cableData.copper.r : 0);

      const xBase =
        (cableData && cableData[material] && typeof cableData[material].x === 'number')
          ? cableData[material].x
          : (cableData && cableData.copper && typeof cableData.copper.x === 'number' ? cableData.copper.x : 0);

      const rBaseTemp = (typeof temperatureCorrection === 'function')
        ? temperatureCorrection(rBase20, temperature, material)
        : rBase20;

      const cableR = (rBaseTemp * lengthFt) / parallel;
      const cableX = (xBase * lengthFt) / parallel;

      // Prefer downstream load at toBus, then fallback
      let loadCurrent = 0;
      try {
        const targetBusId = comp?.toBus ?? segment?.bus?.id ?? null;
        if (typeof calculateDownstreamLoad === 'function' && targetBusId) {
          const downstreamLoad = Number(calculateDownstreamLoad(targetBusId));
          if (downstreamLoad > 0) loadCurrent = downstreamLoad;
        }
      } catch (_) {}

      if (!(loadCurrent > 0)) {
        try {
          if (typeof getLoadCurrent === 'function') {
            loadCurrent = Number(getLoadCurrent(segment && segment.bus ? segment.bus : null, comp, 100));
          } else {
            loadCurrent = 100;
          }
        } catch (_) {
          loadCurrent = 100;
        }
      }

      const cableVD = (typeof calculateComponentVoltageDrop === 'function')
        ? calculateComponentVoltageDrop(comp, loadCurrent, currentVoltageLevel, cableR, cableX, powerFactor)
        : { dropVolts: 0, dropPercent: 0, severity: 'LOW', current: loadCurrent };

      vdData.components.push({
        step: stepNumber,
        type: 'cable',
        name: `${comp.size || 'N/A'} ${String(material).toUpperCase()}${parallel > 1 ? ` (${parallel}×)` : ''} - ${lengthFt}ft`,
        length: lengthFt,
        size: comp.size,
        material: material,
        parallel: parallel,
        current: (typeof cableVD.current === 'number') ? cableVD.current : loadCurrent,
        dropVolts: Number(cableVD.dropVolts) || 0,
        dropPercent: Number(cableVD.dropPercent) || 0,
        severity: cableVD.severity || 'LOW',
        resistance: cableR,
        reactance: cableX
      });

      updateTotals(cableVD.dropVolts, cableVD.dropPercent, currentVoltageLevel);

      if (cableVD.severity === 'HIGH' || cableVD.severity === 'CRITICAL') {
        vdData.criticalComponents.push({ step: stepNumber, component: comp, voltageDrop: cableVD });
      }

      steps += `Cable: ${comp.size || 'N/A'} ${String(material).toUpperCase()}\n`;
      steps += `Length: ${lengthFt} ft\n`;
      if (parallel > 1) steps += `Parallel Conductors: ${parallel} (Z ÷ ${parallel})\n`;
      steps += `Temperature: ${temperature}°C\n`;
      steps += `Impedance: R = ${cableR.toFixed(6)} Ω, X = ${cableX.toFixed(6)} Ω\n`;
      steps += `Load Current: ${Number(loadCurrent).toFixed(2)} A\n`;
      steps += `Voltage Drop: ${(Number(cableVD.dropVolts) || 0).toFixed(3)} V (${(Number(cableVD.dropPercent) || 0).toFixed(3)}%)\n`;
      steps += `Status: ${cableVD.severity || 'LOW'}\n`;
      if (cableVD.severity === 'HIGH' || cableVD.severity === 'CRITICAL') {
        steps += `⚠️ WARNING: Exceeds recommended limits!\n`;
        steps += ` Recommendations:\n`;
        if ((Number(cableVD.dropPercent) || 0) > 5) {
          steps += `  - Consider ${comp.size} → larger size\n`;
          steps += `  - Consider ${parallel} → ${parallel + 1} parallel conductors\n`;
        } else {
          steps += `  - Review cable sizing\n`;
          steps += `  - Consider parallel conductors\n`;
        }
      }
      steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;

      stepNumber++;
    }

    // ──────────────────────────
    // TRANSFORMER (secondary-base R/X)
    // ──────────────────────────
    else if (comp.type === 'transformer') {
      steps += `STEP ${stepNumber}: TRANSFORMER\n`;
      steps += '-'.repeat(80) + '\n';

      const rating     = Number(comp.rating)   || 0;
      const primaryV   = Number(comp.primary)  || 0;
      const secondaryV = Number(comp.secondary)|| 0;
      const impPct     = Number(comp.impedance)|| 0;
      const xr         = (typeof comp.xr === 'number') ? comp.xr : 7;

      const zBase = (secondaryV * secondaryV) / (rating * 1000 || 1);
      const z = (impPct / 100) * zBase;
      const x = z * xr / Math.sqrt(1 + xr * xr);
      const r = z / Math.sqrt(1 + xr * xr);

      // Prefer downstream on secondary side
      let secondaryCurrent = 0;
      try {
        if (typeof calculateDownstreamLoad === 'function' && comp.toBus) {
          const downstream = Number(calculateDownstreamLoad(comp.toBus));
          if (downstream > 0) secondaryCurrent = downstream;
        }
      } catch (_) {}

      if (!(secondaryCurrent > 0) &&
          loadFlowData && loadFlowData.breakdown && Array.isArray(loadFlowData.breakdown.transformers)) {
        const t = loadFlowData.breakdown.transformers.find(t =>
          Number(t.rating) === rating && Number(t.primaryVoltage) === primaryV
        );
        if (t && t.secondaryCurrent) {
          const sc = Number(t.secondaryCurrent);
          if (sc > 0) secondaryCurrent = sc;
        }
      }

      if (!(secondaryCurrent > 0)) {
        const secondaryBus = busesArr.find(b => b && b.id === comp.toBus);
        try {
          if (typeof getLoadCurrent === 'function') {
            secondaryCurrent = Number(getLoadCurrent(secondaryBus || null, comp, 100));
          } else {
            secondaryCurrent = 100;
          }
        } catch (_) {
          secondaryCurrent = 100;
        }
      }

      const turnsRatio = (secondaryV > 0) ? (primaryV / secondaryV) : 1;
      const primaryCurrent = (turnsRatio > 0) ? (secondaryCurrent / turnsRatio) : secondaryCurrent;

      const xfmrVD = (typeof calculateComponentVoltageDrop === 'function')
        ? calculateComponentVoltageDrop(comp, secondaryCurrent, secondaryV, r, x, powerFactor)
        : { dropVolts: 0, dropPercent: 0, severity: 'LOW', current: secondaryCurrent };

      vdData.components.push({
        step: stepNumber,
        type: 'transformer',
        name: `${rating} kVA (${primaryV}V / ${secondaryV}V)`,
        rating: rating,
        primaryVoltage: primaryV,
        secondaryVoltage: secondaryV,
        impedance: impPct,
        primaryCurrent: primaryCurrent,
        secondaryCurrent: secondaryCurrent,
        current: secondaryCurrent, // keeps table happy
        dropVolts: Number(xfmrVD.dropVolts) || 0,
        dropPercent: Number(xfmrVD.dropPercent) || 0,
        severity: xfmrVD.severity || 'LOW',
        resistance: r,
        reactance: x
      });

      updateTotals(xfmrVD.dropVolts, xfmrVD.dropPercent, secondaryV);

      const fullLoadCurrent = (rating * 1000) / (SQRT3 * (secondaryV || 1));
      const loading = (fullLoadCurrent > 0) ? (secondaryCurrent / fullLoadCurrent) * 100 : 0;

      steps += `Transformer: ${rating} kVA\n`;
      steps += `Voltage: ${primaryV}V / ${secondaryV}V\n`;
      steps += `Turns Ratio: ${turnsRatio.toFixed(4)}:1\n`;
      steps += `Impedance: ${impPct}%, X/R: ${xr}\n`;
      steps += `Impedance (Ω): R = ${r.toFixed(6)} Ω, X = ${x.toFixed(6)} Ω\n\n`;
      steps += `PRIMARY SIDE (${primaryV}V):\n`;
      steps += ` Current: ${Number(primaryCurrent).toFixed(2)} A\n\n`;
      steps += `SECONDARY SIDE (${secondaryV}V):\n`;
      steps += ` Current: ${Number(secondaryCurrent).toFixed(2)} A\n`;
      steps += ` Full Load Current: ${Number(fullLoadCurrent).toFixed(2)} A\n`;
      steps += ` Loading: ${Number(loading).toFixed(1)}%\n\n`;
      steps += `VOLTAGE DROP:\n`;
      steps += ` Formula: ΔV = √3 × I × (R×cosφ + X×sinφ)\n`;
      steps += ` Drop: ${(Number(xfmrVD.dropVolts) || 0).toFixed(3)} V (${(Number(xfmrVD.dropPercent) || 0).toFixed(3)}%)\n`;
      steps += ` Status: ${xfmrVD.severity || 'LOW'}\n`;

      if (loading > 100) {
        vdData.criticalComponents.push({ step: stepNumber, component: comp, voltageDrop: xfmrVD });
        steps += `\n⚠️ CRITICAL: Transformer is OVERLOADED!\n`;
        steps += ` Current Loading: ${loading.toFixed(1)}%\n`;
        steps += ` Rated: ${fullLoadCurrent.toFixed(0)}A, Actual: ${secondaryCurrent.toFixed(0)}A\n`;
        steps += ` IMMEDIATE ACTION REQUIRED!\n`;
        steps += ` Recommendations:\n`;
        steps += `  - Install larger transformer (minimum ${Math.ceil(rating * loading / 80)}kVA)\n`;
        steps += `  - Reduce load on secondary side\n`;
        steps += `  - Add parallel transformer\n`;
      } else if (xfmrVD.severity === 'HIGH' || xfmrVD.severity === 'CRITICAL') {
        vdData.criticalComponents.push({ step: stepNumber, component: comp, voltageDrop: xfmrVD });
        steps += `\n⚠️ WARNING: High voltage drop!\n`;
        steps += ` Recommendations:\n`;
        steps += `  - Review transformer tap settings\n`;
        steps += `  - Consider lower impedance transformer\n`;
        if (loading > 80) {
          steps += `  - Loading is ${loading.toFixed(1)}% - consider larger transformer\n`;
        }
      }

      steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;

      // IMPORTANT: switch downstream base
      currentVoltageLevel = secondaryV;
      stepNumber++;
    }

    // ──────────────────────────
    // OTHER COMPONENTS (best-effort)
    // ──────────────────────────
    else {
      steps += `STEP ${stepNumber}: ${String(comp.type).toUpperCase()}\n`;
      steps += '-'.repeat(80) + '\n';

      const compR = Number(comp.r || comp.resistance || 0);
      const compX = Number(comp.x || comp.reactance || 0);

      let compCurrent = 0;
      if (Number(comp.loadCurrent) > 0) compCurrent = Number(comp.loadCurrent);
      else {
        try {
          if (typeof getLoadCurrent === 'function') {
            compCurrent = Number(getLoadCurrent(segment && segment.bus ? segment.bus : null, comp, 0));
          }
        } catch (_) { compCurrent = 0; }
      }

      if (compR > 0 || compX > 0) {
        const compVD = (typeof calculateComponentVoltageDrop === 'function')
          ? calculateComponentVoltageDrop(comp, compCurrent, currentVoltageLevel, compR, compX, powerFactor)
          : { dropVolts: 0, dropPercent: 0, severity: 'LOW', current: compCurrent };

        vdData.components.push({
          step: stepNumber,
          type: comp.type,
          name: comp.name || `${comp.type}`,
          current: (typeof compVD.current === 'number') ? compVD.current : compCurrent,
          dropVolts: Number(compVD.dropVolts) || 0,
          dropPercent: Number(compVD.dropPercent) || 0,
          severity: compVD.severity || 'LOW',
          resistance: compR,
          reactance: compX
        });

        updateTotals(compVD.dropVolts, compVD.dropPercent, currentVoltageLevel);

        if (compVD.severity === 'HIGH' || compVD.severity === 'CRITICAL') {
          vdData.criticalComponents.push({ step: stepNumber, component: comp, voltageDrop: compVD });
        }

        steps += `Estimated R=${compR.toFixed(6)} Ω, X=${compX.toFixed(6)} Ω, I=${Number(compCurrent).toFixed(2)} A => `
              + `${(Number(compVD.dropVolts) || 0).toFixed(3)} V (${(Number(compVD.dropPercent) || 0).toFixed(3)}%)\n\n`;
      } else {
        steps += `No usable impedance info for component: ${comp.name || comp.type}. Skipping voltage drop calc for this component.\n\n`;
      }
      stepNumber++;
    }
  } // end for-loop

  // Summary (totals already normalized to SOURCE base)
  steps += '═'.repeat(80) + '\n';
  steps += 'VOLTAGE DROP SUMMARY\n';
  steps += '═'.repeat(80) + '\n\n';
  steps += `Total Voltage Drop: ${vdData.cumulativeDropPercent.toFixed(3)}% (${vdData.cumulativeDropVolts.toFixed(3)} V)\n`;
  steps += `Maximum Single Component: ${vdData.maxDropPercent.toFixed(3)}%`;
  if (vdData.maxDropComponent) steps += ` (${vdData.maxDropComponent.name})`;
  steps += `\n\n`;

  if (vdData.cumulativeDropPercent <= vdData.compliance.feederLimit) {
    vdData.compliance.status = 'EXCELLENT';
    steps += `✅ EXCELLENT - Well within recommended limits\n`;
  } else if (vdData.cumulativeDropPercent <= vdData.compliance.branchLimit) {
    vdData.compliance.status = 'ACCEPTABLE';
    steps += `✅ ACCEPTABLE - Within branch circuit limits\n`;
  } else if (vdData.cumulativeDropPercent <= vdData.compliance.combinedLimit) {
    vdData.compliance.status = 'WARNING';
    steps += `⚠️ WARNING - Approaching maximum limit\n`;
  } else {
    vdData.compliance.status = 'NON-COMPLIANT';
    steps += `❌ NON-COMPLIANT - Exceeds IEEE 141 maximum\n`;
  }

  steps += `\nIEEE 141 COMPLIANCE: ${vdData.compliance.status}\n`;
  steps += ` Feeder Limit: ${vdData.compliance.feederLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.feederLimit ? '✓' : '✗'}\n`;
  steps += ` Branch Limit: ${vdData.compliance.branchLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.branchLimit ? '✓' : '✗'}\n`;
  steps += ` Combined Limit: ${vdData.compliance.combinedLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.combinedLimit ? '✓' : '✗'}\n\n`;

  if (vdData.criticalComponents.length > 0) {
    steps += `CRITICAL COMPONENTS (${vdData.criticalComponents.length}):\n`;
    steps += '-'.repeat(80) + '\n';
    vdData.criticalComponents.forEach(item => {
      const dropP = (item && item.voltageDrop && typeof item.voltageDrop.dropPercent === 'number')
        ? item.voltageDrop.dropPercent : 0;
      const sev = (item && item.voltageDrop && item.voltageDrop.severity) ? item.voltageDrop.severity : 'HIGH';
      const compName = (item && item.component && (item.component.name || item.component.fromBusName))
        ? (item.component.name || item.component.fromBusName) : 'Unknown';
      steps += `Step ${item.step}: ${String((item && item.component && item.component.type) || 'COMP').toUpperCase()}\n`;
      steps += ` Name: ${compName}\n`;
      steps += ` Drop: ${Number(dropP).toFixed(3)}% (${sev})\n\n`;
    });
  }

  steps += 'COMPONENT BREAKDOWN:\n';
  steps += '-'.repeat(80) + '\n';
  steps += 'Step  Type       Name                    Current(A)  Drop(V)  Drop(%) Status\n';
  steps += '-'.repeat(80) + '\n';
  vdData.components.forEach(c => {
    const stepStr   = String(c.step).padEnd(5);
    const typeStr   = String(c.type).padEnd(10);
    const nameStr   = String(c.name || 'N/A').substring(0, 24).padEnd(24);
    const currVal   = (Number.isFinite(Number(c.current)) ? Number(c.current) : 0);
    const dropVVal  = (Number.isFinite(Number(c.dropVolts)) ? Number(c.dropVolts) : 0);
    const dropPVal  = (Number.isFinite(Number(c.dropPercent)) ? Number(c.dropPercent) : 0);
    const currentStr= currVal.toFixed(1).padStart(10);
    const dropVStr  = dropVVal.toFixed(3).padStart(7);
    const dropPStr  = dropPVal.toFixed(3).padStart(7);
    const statusStr = String(c.severity || 'LOW');
    steps += `${stepStr} ${typeStr} ${nameStr} ${currentStr} ${dropVStr} ${dropPStr} ${statusStr}\n`;
  });
  steps += '-'.repeat(80) + '\n\n';

  vdData.calculationSteps = steps;

  // Console summary (kept)
  console.log('✅ Voltage Drop Analysis Complete');
  console.log(` Total Drop: ${vdData.cumulativeDropPercent.toFixed(3)}%`);
  console.log(` Compliance: ${vdData.compliance.status}`);
  console.log('');

  return vdData;
}

// Global export (kept)
window.calculateVoltageDrop = calculateVoltageDrop;
console.log('✅ Voltage Drop Calculation module loaded');
console.log(' - Version: 1.2.2 (V1 with safe V2 backports)');
console.log(' - Source impedance excluded per IEEE 141 (short circuit only)');
console.log(' - Totals normalized to SOURCE base across transformers');
console.log(' - Transformer secondary-side VD and loading preserved');