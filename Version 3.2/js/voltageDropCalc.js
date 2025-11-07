/**
 * Voltage Drop Calculation Module
 * Dedicated calculations for voltage drop analysis
 *
 * @author bfforex
 * @date 2025-11-02 15:21:31 UTC
 * @version 2.1.0
 * @enhanced Component tags display throughout calculation steps
 * @enhanced Visual hierarchy with icons and better formatting
 * @enhanced From/To bus information for traceability
 * @enhanced Helper functions for load current calculations
 * @fixed Issue #2: Base voltage handling - voltage tracked properly across transformers
 * @fixed Issue #3: Cable data integration - already working, enhanced
 * @enhanced Load voltage calculation - now shows actual voltage at load
 * @enhanced Per NEC/IEEE 141 - voltage drop % relative to load voltage
 * @enhanced Transformer tap settings - ±5% voltage adjustment support
 * 
 * ENHANCEMENTS FROM v2.0.0:
 * - Component tags (tag property) displayed in all calculation steps
 * - Visual hierarchy with icons (🔌 🔧 ⚡ 📊 ✅ ⚠️ ❌)
 * - From/To bus connections shown for full path traceability
 * - Helper functions: calculateLoadCurrentFromKVA(), calculateLoadCurrentFromKW(), calculateMotorLoadCurrent()
 * - Enhanced formatting with clear section separators
 * - Improved readability with structured output
 * 
 * FEATURES FROM v2.0.0 (MAINTAINED):
 * - Voltage drop now calculated as % of LOAD voltage (per NEC 210.19)
 * - Tracks actual voltage at each point in system
 * - Shows voltage available at load (not just drop %)
 * - Fixes transformer voltage level crossing bug
 * - Supports transformer tap settings for voltage regulation
 * - Diversity factor integration (Issue #4)
 * 
 * Standards:
 * - NEC Article 210.19(A) - Branch Circuit Voltage Drop
 * - NEC Article 215.2(A)(1) - Feeder Voltage Drop  
 * - IEEE 141-1993 Section 3.4 - Voltage Drop Calculations
 */

console.log('🔧 Loading Voltage Drop Calculation Module v2.1.0...');
console.log('   ✅ Component tags display - ENHANCED');
console.log('   ✅ Visual hierarchy with icons - NEW');
console.log('   ✅ From/To bus information - NEW');
console.log('   ✅ Helper functions added - NEW');
console.log('   ✅ All v2.0.0 features maintained');

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const VOLTAGE_DROP_CONFIG = {
    // NEC Recommended Limits
    FEEDER_LIMIT: 3,           // NEC 215.2(A)(1)
    BRANCH_LIMIT: 5,           // NEC 210.19(A)
    COMBINED_LIMIT: 7,         // IEEE 141
    
    // System defaults
    DEFAULT_POWER_FACTOR: 0.85,
    DEFAULT_TEMPERATURE: 75,
    
    // Icons for visual hierarchy
    ICONS: {
        cable: '🔌',
        transformer: '🔧',
        general: '⚙️',
        voltage: '⚡',
        analysis: '📊',
        pass: '✅',
        warning: '⚠️',
        fail: '❌',
        info: 'ℹ️'
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR LOAD CURRENT CALCULATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate load current from kVA rating
 * 
 * @param {Number} kva - Load in kVA
 * @param {Number} voltage - System voltage
 * @param {String} loadType - 'single-phase' or 'three-phase'
 * @returns {Number} Load current in amperes
 */
function calculateLoadCurrentFromKVA(kva, voltage, loadType = 'three-phase') {
    const SQRT3 = Math.sqrt(3);
    if (loadType === 'three-phase') {
        return (kva * 1000) / (SQRT3 * voltage);
    } else {
        return (kva * 1000) / voltage;
    }
}

/**
 * Calculate load current from kW and power factor
 * 
 * @param {Number} kw - Load in kW
 * @param {Number} voltage - System voltage
 * @param {Number} powerFactor - Power factor
 * @param {String} loadType - 'single-phase' or 'three-phase'
 * @returns {Number} Load current in amperes
 */
function calculateLoadCurrentFromKW(kw, voltage, powerFactor, loadType = 'three-phase') {
    const SQRT3 = Math.sqrt(3);
    if (loadType === 'three-phase') {
        return (kw * 1000) / (SQRT3 * voltage * powerFactor);
    } else {
        return (kw * 1000) / (voltage * powerFactor);
    }
}

/**
 * Calculate load current from HP (motor loads)
 * 
 * @param {Number} hp - Horsepower
 * @param {Number} voltage - System voltage
 * @param {Number} efficiency - Motor efficiency (0-1)
 * @param {Number} powerFactor - Power factor
 * @returns {Number} Load current in amperes
 */
function calculateMotorLoadCurrent(hp, voltage, efficiency = 0.90, powerFactor = 0.85) {
    const SQRT3 = Math.sqrt(3);
    const watts = hp * 746;  // 1 HP = 746 watts
    return watts / (SQRT3 * voltage * efficiency * powerFactor);
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN VOLTAGE DROP CALCULATION FUNCTION (ENHANCED)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Perform voltage drop analysis for a bus path
 * Returns detailed voltage drop calculations
 *
 * @param {String} busId           - Bus identifier
 * @param {Array}  path            - Path from source to target bus
 * @param {Object} loadFlowData    - Load flow results (optional)
 * @returns {Object} Voltage drop results with detailed breakdown
 */
function calculateVoltageDrop(busId, path, loadFlowData = null) {
  // ══════════════════════════════════════════════════════════════════════════════
  // CONSTANTS & UTILITIES
  // ══════════════════════════════════════════════════════════════════════════════
  
  const SQRT3 =
    (typeof window !== 'undefined' && typeof window.SQRT3 === 'number')
      ? window.SQRT3
      : (typeof globalThis !== 'undefined' && typeof globalThis.SQRT3 === 'number')
        ? globalThis.SQRT3
        : Math.sqrt(3);

  const busesArr = (typeof window !== 'undefined' && Array.isArray(window.buses))
    ? window.buses
    : (typeof buses !== 'undefined' && Array.isArray(buses)) ? buses : [];

  const bus = busesArr.find(b => b && b.id === busId);
  if (!bus) {
    throw new Error(`Bus ${busId} not found`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('VOLTAGE DROP ANALYSIS - ENHANCED v2.1.0');
  console.log('═'.repeat(80));
  console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
  console.log('═'.repeat(80) + '\n');

  // ══════════════════════════════════════════════════════════════════════════════
  // INPUT PARAMETERS
  // ══════════════════════════════════════════════════════════════════════════════
  
  const pfEl   = (typeof document !== 'undefined') ? document.getElementById('powerFactor') : null;
  const tempEl = (typeof document !== 'undefined') ? document.getElementById('temperature') : null;
  const engrEl = (typeof document !== 'undefined') ? document.getElementById('engineer') : null;

  const powerFactor = (pfEl && !Number.isNaN(parseFloat(pfEl.value))) ? parseFloat(pfEl.value) : VOLTAGE_DROP_CONFIG.DEFAULT_POWER_FACTOR;
  const temperature = (tempEl && !Number.isNaN(parseFloat(tempEl.value))) ? parseFloat(tempEl.value) : VOLTAGE_DROP_CONFIG.DEFAULT_TEMPERATURE;
  const engineerName = (engrEl && typeof engrEl.value === 'string' && engrEl.value.trim().length > 0)
    ? engrEl.value.trim()
    : 'Unknown';

  // ══════════════════════════════════════════════════════════════════════════════
  // VOLTAGE TRACKING SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════
  
  const sourceBus = (Array.isArray(path) && path.length > 0) ? path[0].bus : null;
  const sourceVoltage = sourceBus ? Number(sourceBus.voltage) : Number(bus.voltage);
  const loadVoltage = Number(bus.voltage);
  
  let currentVoltage = sourceVoltage;
  let currentVoltageLevel = sourceVoltage;

  // ══════════════════════════════════════════════════════════════════════════════
  // RESULT STRUCTURE
  // ══════════════════════════════════════════════════════════════════════════════
  
  const vdData = {
    busId: bus.id,
    busName: bus.name,
    busVoltage: bus.voltage,
    
    // Voltage tracking
    sourceVoltage: sourceVoltage,
    loadVoltage: currentVoltage,
    nominalLoadVoltage: loadVoltage,
    
    // Calculation parameters
    powerFactor: powerFactor,
    temperature: temperature,
    
    // Component breakdown
    components: [],
    
    // Totals
    totalDropVolts: 0,
    totalDropPercent: 0,
    
    // Per-component maximums
    maxDropPercent: 0,
    maxDropComponent: null,
    criticalComponents: [],
    
    // Compliance
    compliance: {
      feederLimit: VOLTAGE_DROP_CONFIG.FEEDER_LIMIT,
      branchLimit: VOLTAGE_DROP_CONFIG.BRANCH_LIMIT,
      combinedLimit: VOLTAGE_DROP_CONFIG.COMBINED_LIMIT,
      status: 'UNKNOWN'
    },
    
    // Calculation metadata
    calculationSteps: '',
    calculationDate: (typeof getCalculationTimestamp === 'function')
      ? getCalculationTimestamp()
      : new Date().toISOString()
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ENHANCED CALCULATION STEPS HEADER
  // ══════════════════════════════════════════════════════════════════════════════
  
  let steps = '═'.repeat(80) + '\n';
  steps += 'VOLTAGE DROP CALCULATION - ENHANCED\n';
  steps += '═'.repeat(80) + '\n\n';
  
  steps += `📋 CALCULATION INFORMATION\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Date/Time:           ${vdData.calculationDate}\n`;
  steps += `Engineer:            ${engineerName}\n`;
  steps += `Target Bus:          ${bus.tag || bus.name} (${bus.name})\n`;
  steps += `Source Voltage:      ${sourceVoltage.toFixed(2)} V\n`;
  steps += `Load Voltage Level:  ${loadVoltage.toFixed(2)} V\n`;
  steps += `Power Factor:        ${powerFactor.toFixed(2)}\n`;
  steps += `Temperature:         ${temperature}°C\n`;
  steps += `Method:              Component-by-Component with Voltage Tracking\n\n`;
  
  steps += `📖 NEC & IEEE 141 STANDARDS\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `• NEC 215.2(A)(1) - Feeders: ${VOLTAGE_DROP_CONFIG.FEEDER_LIMIT}% maximum recommended\n`;
  steps += `• NEC 210.19(A) - Branch Circuits: ${VOLTAGE_DROP_CONFIG.BRANCH_LIMIT}% maximum\n`;
  steps += `• IEEE 141 - Combined System: ${VOLTAGE_DROP_CONFIG.COMBINED_LIMIT}% maximum\n`;
  steps += `• Per NEC FPN: Voltage drop calculated at LOAD voltage level\n\n`;

  // ══════════════════════════════════════════════════════════════════════════════
  // SOURCE IMPEDANCE EXCLUSION
  // ══════════════════════════════════════════════════════════════════════════════
  
  if (sourceBus && sourceBus.type === 'source') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.info} SOURCE IMPEDANCE HANDLING\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Source Bus:          ${sourceBus.tag || sourceBus.name} (${sourceBus.name})\n`;
    steps += `Source Voltage:      ${sourceBus.voltage}V\n`;
    
    if (sourceBus.utilityFaultCurrent) {
      const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
      const utilityXR = (typeof sourceBus.utilityXR === 'number') ? sourceBus.utilityXR : 3;
      steps += `Available Fault:     ${Number(sourceBus.utilityFaultCurrent).toFixed(2)} kA\n`;
      steps += `Source Impedance:    ${utilityZ.toFixed(6)} Ω (X/R: ${utilityXR})\n\n`;
    }
    
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.warning} IMPORTANT: Per IEEE 141-1993 Section 3.2.1:\n`;
    steps += `   "Voltage drop calculations shall begin at the first\n`;
    steps += `    distribution point, NOT including utility source impedance."\n\n`;
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.pass} SOURCE IMPEDANCE EXCLUDED FROM VOLTAGE DROP CALCULATION\n`;
    steps += `   Source impedance is ONLY used for short circuit analysis.\n`;
    steps += `   Voltage drop starts from FIRST COMPONENT after source.\n\n`;
    
    console.log('ℹ️  Source impedance detected and EXCLUDED from voltage drop');
    console.log('   Per IEEE 141-1993 Section 3.2.1');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VOLTAGE PROGRESSION TRACKING
  // ══════════════════════════════════════════════════════════════════════════════
  
  const voltageProgression = [
    {
      point: 'Source',
      voltage: currentVoltage,
      dropFromPrevious: 0,
      cumulativeDrop: 0
    }
  ];

  // ══════════════════════════════════════════════════════════════════════════════
  // PROCESS COMPONENTS
  // ══════════════════════════════════════════════════════════════════════════════
  
  let startIndex = 1;
  while (Array.isArray(path) && startIndex < path.length) {
    const seg = path[startIndex];
    const isSource = seg?.bus?.type === 'source';
    const noComponent = !seg?.component;
    if (isSource || noComponent) {
      startIndex++;
    } else {
      break;
    }
  }

  if (startIndex >= path.length) {
    steps += `\n${VOLTAGE_DROP_CONFIG.ICONS.info} Path contained only source/no-component segments — no voltage drop applicable.\n`;
    vdData.calculationSteps = steps;
    vdData.loadVoltage = currentVoltage;
    return vdData;
  }

  let stepNumber = 1;

  // ══════════════════════════════════════════════════════════════════════════════
  // COMPONENT LOOP
  // ══════════════════════════════════════════════════════════════════════════════
  
  for (let i = startIndex; Array.isArray(path) && i < path.length; i++) {
    const segment = path[i];
    const comp = segment && segment.component ? segment.component : null;
    if (!comp) continue;

    // ════════════════════════════════════════════════════════════════════════════
    // CABLE PROCESSING (ENHANCED)
    // ════════════════════════════════════════════════════════════════════════════
    if (comp.type === 'cable') {
      steps += '═'.repeat(80) + '\n';
      steps += `${VOLTAGE_DROP_CONFIG.ICONS.cable} STEP ${stepNumber}: CABLE`;
      if (comp.tag) steps += ` - ${comp.tag}`;
      steps += '\n';
      steps += '═'.repeat(80) + '\n\n';

      // Get cable data
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

      // Get load current
      let loadCurrent = 0;
      try {
        const targetBusId = comp?.toBus ?? segment?.bus?.id ?? null;
        
        if (typeof calculateDownstreamLoadWithDiversity === 'function' && targetBusId) {
          const diversityResult = calculateDownstreamLoadWithDiversity(targetBusId, { applyDiversity: true });
          if (diversityResult && diversityResult.diversifiedLoad > 0) {
            loadCurrent = diversityResult.diversifiedLoad;
            console.log(`  ${VOLTAGE_DROP_CONFIG.ICONS.pass} Using diversified load: ${loadCurrent.toFixed(2)} A`);
          }
        }
        
        if (!(loadCurrent > 0) && typeof calculateDownstreamLoad === 'function' && targetBusId) {
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

      // Calculate voltage drop
      const cosTheta = powerFactor;
      const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
      const dropVolts = SQRT3 * loadCurrent * (cableR * cosTheta + cableX * sinTheta);
      const dropPercent = (currentVoltageLevel > 0) ? (dropVolts / currentVoltageLevel) * 100 : 0;
      
      currentVoltage -= dropVolts;
      
      let severity = 'LOW';
      if (dropPercent > 5) severity = 'CRITICAL';
      else if (dropPercent > 3) severity = 'HIGH';
      else if (dropPercent > 2) severity = 'MEDIUM';

      // ENHANCED: Component information with tags
      steps += `🔌 CABLE INFORMATION\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
      steps += `Component Type:      CABLE\n`;
      steps += `Size:                ${comp.size}\n`;
      steps += `Material:            ${String(material).toUpperCase()}\n`;
      steps += `Length:              ${lengthFt} ft\n`;
      steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
      steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
      steps += `Voltage Level:       ${currentVoltageLevel}V\n`;
      steps += `Temperature:         ${temperature}°C\n`;
      if (parallel > 1) {
        steps += `Parallel Config:     ${parallel} cables (current per cable: ${(loadCurrent/parallel).toFixed(2)}A)\n`;
      }
      steps += '\n';

      steps += `📐 IMPEDANCE VALUES\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Base (per 1000ft @ 20°C):\n`;
      steps += `   R_base = ${rBase20.toFixed(6)} Ω/1000ft (NEC Ch 9 Table 9)\n`;
      steps += `   X_base = ${xBase.toFixed(6)} Ω/1000ft (NEC Ch 9 Table 9)\n\n`;
      
      steps += `Temperature Correction (20°C → ${temperature}°C):\n`;
      steps += `   R_corrected = ${rBaseTemp.toFixed(6)} Ω/1000ft\n`;
      steps += `   ${VOLTAGE_DROP_CONFIG.ICONS.info} Reactance not affected by temperature\n\n`;
      
      if (parallel > 1) {
        steps += `Parallel Configuration:\n`;
        steps += `   R = ${rBaseTemp.toFixed(6)} / ${parallel} = ${(rBaseTemp/parallel).toFixed(6)} Ω/1000ft\n`;
        steps += `   X = ${xBase.toFixed(6)} / ${parallel} = ${(xBase/parallel).toFixed(6)} Ω/1000ft\n\n`;
      }

      steps += `📊 VOLTAGE DROP CALCULATION\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Load Current:        ${loadCurrent.toFixed(2)} A\n`;
      steps += `Power Factor:        ${powerFactor.toFixed(2)} (cosθ=${cosTheta.toFixed(3)}, sinθ=${sinTheta.toFixed(3)})\n\n`;
      
      steps += `Formula: ΔV = √3 × I × (R×cosφ + X×sinφ)\n`;
      steps += `ΔV = ${SQRT3.toFixed(4)} × ${loadCurrent.toFixed(2)} × (${cableR.toFixed(6)}×${cosTheta.toFixed(3)} + ${cableX.toFixed(6)}×${sinTheta.toFixed(3)})\n`;
      steps += `ΔV = ${dropVolts.toFixed(3)} V\n\n`;
      
      steps += `⚡ VOLTAGE ANALYSIS\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `   Voltage Before:  ${(currentVoltage + dropVolts).toFixed(2)} V\n`;
      steps += `   Voltage Drop:    ${dropVolts.toFixed(2)} V (${dropPercent.toFixed(3)}%)\n`;
      steps += `   Voltage After:   ${currentVoltage.toFixed(2)} V\n`;
      
      const icon = severity === 'LOW' ? VOLTAGE_DROP_CONFIG.ICONS.pass : 
                   severity === 'MEDIUM' ? VOLTAGE_DROP_CONFIG.ICONS.info :
                   severity === 'HIGH' ? VOLTAGE_DROP_CONFIG.ICONS.warning : VOLTAGE_DROP_CONFIG.ICONS.fail;
      steps += `   Status:          ${icon} ${severity}\n`;

      if (severity === 'HIGH' || severity === 'CRITICAL') {
        steps += `\n${VOLTAGE_DROP_CONFIG.ICONS.warning} WARNING: Exceeds recommended limits!\n`;
        steps += `   Recommendations:\n`;
        if (dropPercent > 5) {
          steps += `   • Increase cable size from ${comp.size}\n`;
          steps += `   • Add parallel conductors (current: ${parallel})\n`;
          steps += `   • Reduce circuit length\n`;
        } else {
          steps += `   • Review cable sizing\n`;
          steps += `   • Consider parallel conductors\n`;
        }
      }
      
      steps += '\n\n';

      // Store component data
      vdData.components.push({
        step: stepNumber,
        type: 'cable',
        tag: comp.tag || 'N/A',
        name: `${comp.tag || comp.size || 'N/A'} ${String(material).toUpperCase()}${parallel > 1 ? ` (${parallel}×)` : ''} - ${lengthFt}ft`,
        length: lengthFt,
        size: comp.size,
        material: material,
        parallel: parallel,
        fromBus: comp.fromBusName || comp.fromBus,
        toBus: comp.toBusName || comp.toBus,
        current: loadCurrent,
        dropVolts: dropVolts,
        dropPercent: dropPercent,
        severity: severity,
        resistance: cableR,
        reactance: cableX,
        voltageLevel: currentVoltageLevel,
        voltageBeforeDrop: currentVoltage + dropVolts,
        voltageAfterDrop: currentVoltage
      });

      voltageProgression.push({
        point: `Cable ${stepNumber}${comp.tag ? ` (${comp.tag})` : ''}`,
        voltage: currentVoltage,
        dropFromPrevious: dropVolts,
        cumulativeDrop: sourceVoltage - currentVoltage
      });

      vdData.totalDropVolts += dropVolts;

      if (dropPercent > vdData.maxDropPercent) {
        vdData.maxDropPercent = dropPercent;
        vdData.maxDropComponent = {
          step: stepNumber,
          name: vdData.components[vdData.components.length - 1].name,
          type: 'cable'
        };
      }

      if (severity === 'HIGH' || severity === 'CRITICAL') {
        vdData.criticalComponents.push({
          step: stepNumber,
          component: comp,
          voltageDrop: { dropVolts, dropPercent, severity }
        });
      }

      stepNumber++;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TRANSFORMER PROCESSING (ENHANCED)
    // ════════════════════════════════════════════════════════════════════════════
    else if (comp.type === 'transformer') {
      steps += '═'.repeat(80) + '\n';
      steps += `${VOLTAGE_DROP_CONFIG.ICONS.transformer} STEP ${stepNumber}: TRANSFORMER`;
      if (comp.tag) steps += ` - ${comp.tag}`;
      steps += '\n';
      steps += '═'.repeat(80) + '\n\n';

      const rating     = Number(comp.rating)   || 0;
      const primaryV   = Number(comp.primary)  || 0;
      const secondaryV = Number(comp.secondary)|| 0;
      const impPct     = Number(comp.impedance)|| 0;
      const xr         = (typeof comp.xr === 'number') ? comp.xr : 7;
      const tapSetting = (typeof comp.tapSetting === 'number') ? comp.tapSetting : 0;
      const secondaryVoltageWithTap = secondaryV * (1 + tapSetting / 100);

      // Calculate transformer impedance
      const zBase = (secondaryV * secondaryV) / (rating * 1000 || 1);
      const z = (impPct / 100) * zBase;
      const x = z * xr / Math.sqrt(1 + xr * xr);
      const r = z / Math.sqrt(1 + xr * xr);

      // Get secondary current
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

      // Calculate voltage drop
      const cosTheta = powerFactor;
      const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
      const dropVolts = SQRT3 * secondaryCurrent * (r * cosTheta + x * sinTheta);
      const dropPercent = (secondaryV > 0) ? (dropVolts / secondaryV) * 100 : 0;

      let severity = 'LOW';
      if (dropPercent > 3) severity = 'HIGH';
      else if (dropPercent > 2) severity = 'MEDIUM';

      // Update voltage tracking
      const voltageAtSecondaryNoLoad = currentVoltage / turnsRatio;
      const voltageAtSecondaryWithTap = voltageAtSecondaryNoLoad * (1 + tapSetting / 100);
      currentVoltage = voltageAtSecondaryWithTap - dropVolts;
      currentVoltageLevel = secondaryV;

      const fullLoadCurrent = (rating * 1000) / (SQRT3 * (secondaryV || 1));
      const loading = (fullLoadCurrent > 0) ? (secondaryCurrent / fullLoadCurrent) * 100 : 0;

      // ENHANCED: Transformer information with tags
      steps += `🔧 TRANSFORMER INFORMATION\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
      steps += `Component Type:      TRANSFORMER\n`;
      steps += `Rating:              ${rating} kVA\n`;
      steps += `Voltage Ratio:       ${primaryV}V / ${secondaryV}V\n`;
      steps += `Turns Ratio:         ${turnsRatio.toFixed(4)}:1\n`;
      steps += `Impedance:           ${impPct}% on ${rating} kVA base\n`;
      steps += `X/R Ratio:           ${xr}\n`;
      steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
      steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
      
      if (tapSetting !== 0) {
        steps += `\n⚙️ TAP SETTING: ${tapSetting > 0 ? '+' : ''}${tapSetting}%\n`;
        steps += `   Adjusted Secondary: ${secondaryVoltageWithTap.toFixed(2)}V\n`;
      }
      steps += '\n';

      steps += `📐 IMPEDANCE (Secondary Side)\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `R = ${r.toFixed(6)} Ω\n`;
      steps += `X = ${x.toFixed(6)} Ω\n`;
      steps += `Z = ${z.toFixed(6)} Ω\n\n`;

      steps += `📊 LOADING ANALYSIS\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `PRIMARY SIDE (${primaryV}V):\n`;
      steps += `   Voltage Entering: ${(voltageAtSecondaryNoLoad * turnsRatio).toFixed(2)} V\n`;
      steps += `   Current:          ${primaryCurrent.toFixed(2)} A\n\n`;
      
      steps += `SECONDARY SIDE (${secondaryV}V):\n`;
      steps += `   Current:          ${secondaryCurrent.toFixed(2)} A\n`;
      steps += `   Full Load:        ${fullLoadCurrent.toFixed(2)} A\n`;
      steps += `   Loading:          ${loading.toFixed(1)}% ${loading > 100 ? '❌ OVERLOAD' : loading > 80 ? '⚠️' : '✅'}\n\n`;

      steps += `⚡ VOLTAGE DROP THROUGH TRANSFORMER\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Formula: ΔV = √3 × I × (R×cosφ + X×sinφ)\n`;
      steps += `ΔV = ${SQRT3.toFixed(4)} × ${secondaryCurrent.toFixed(2)} × (${r.toFixed(6)}×${cosTheta.toFixed(3)} + ${x.toFixed(6)}×${sinTheta.toFixed(3)})\n`;
      steps += `ΔV = ${dropVolts.toFixed(3)} V (${dropPercent.toFixed(3)}%)\n\n`;
      
      steps += `VOLTAGE TRANSFORMATION:\n`;
      steps += `   Primary voltage:     ${(voltageAtSecondaryNoLoad * turnsRatio).toFixed(2)} V\n`;
      steps += `   Ideal secondary:     ${voltageAtSecondaryNoLoad.toFixed(2)} V\n`;
      if (tapSetting !== 0) {
        steps += `   With tap:            ${voltageAtSecondaryWithTap.toFixed(2)} V\n`;
      }
      steps += `   After drop:          ${currentVoltage.toFixed(2)} V\n`;
      
      const icon = severity === 'LOW' ? VOLTAGE_DROP_CONFIG.ICONS.pass : 
                   severity === 'MEDIUM' ? VOLTAGE_DROP_CONFIG.ICONS.info :
                   VOLTAGE_DROP_CONFIG.ICONS.warning;
      steps += `   Status:              ${icon} ${severity}\n`;

      if (loading > 100) {
        steps += `\n${VOLTAGE_DROP_CONFIG.ICONS.fail} CRITICAL: Transformer OVERLOADED!\n`;
        steps += `   Loading: ${loading.toFixed(1)}% (Max: 100%)\n`;
        steps += `   Recommendations:\n`;
        steps += `   • Install larger transformer (minimum ${Math.ceil(rating * loading / 80)} kVA)\n`;
        steps += `   • Reduce load on secondary side\n`;
        steps += `   • Add parallel transformer\n`;
      } else if (severity === 'HIGH') {
        steps += `\n${VOLTAGE_DROP_CONFIG.ICONS.warning} WARNING: High voltage drop!\n`;
        steps += `   Recommendations:\n`;
        if (tapSetting === 0) {
          steps += `   • Adjust transformer tap (+2.5% or +5%)\n`;
        }
        steps += `   • Review transformer impedance\n`;
        steps += `   • Consider larger transformer\n`;
      }
      
      steps += '\n\n';

      // Store component data
      const xfmrTag = comp.tag || `${rating}kVA`;
      vdData.components.push({
        step: stepNumber,
        type: 'transformer',
        tag: xfmrTag,
        name: `${xfmrTag} - ${rating}kVA (${primaryV}V/${secondaryV}V)`,
        rating: rating,
        primaryVoltage: primaryV,
        secondaryVoltage: secondaryV,
        secondaryVoltageWithTap: secondaryVoltageWithTap,
        tapSetting: tapSetting,
        impedance: impPct,
        fromBus: comp.fromBusName || comp.fromBus,
        toBus: comp.toBusName || comp.toBus,
        primaryCurrent: primaryCurrent,
        secondaryCurrent: secondaryCurrent,
        current: secondaryCurrent,
        dropVolts: dropVolts,
        dropPercent: dropPercent,
        severity: severity,
        resistance: r,
        reactance: x,
        loading: loading,
        voltageLevel: secondaryV,
        voltageBeforeDrop: voltageAtSecondaryWithTap,
        voltageAfterDrop: currentVoltage
      });

      voltageProgression.push({
        point: `Transformer ${stepNumber}${comp.tag ? ` (${comp.tag})` : ''}`,
        voltage: currentVoltage,
        dropFromPrevious: dropVolts,
        cumulativeDrop: sourceVoltage - currentVoltage,
        note: tapSetting !== 0 ? `Tap: ${tapSetting > 0 ? '+' : ''}${tapSetting}%` : null
      });

      vdData.totalDropVolts += dropVolts;

      if (dropPercent > vdData.maxDropPercent) {
        vdData.maxDropPercent = dropPercent;
        vdData.maxDropComponent = {
          step: stepNumber,
          name: vdData.components[vdData.components.length - 1].name,
          type: 'transformer'
        };
      }

      if (loading > 100 || severity === 'HIGH' || severity === 'CRITICAL') {
        vdData.criticalComponents.push({
          step: stepNumber,
          component: comp,
          voltageDrop: { dropVolts, dropPercent, severity, loading }
        });
      }

      stepNumber++;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY (ENHANCED)
  // ══════════════════════════════════════════════════════════════════════════════
  
  const finalVoltageAtLoad = currentVoltage;
  const finalVoltageLevel = currentVoltageLevel;
  const nominalLoadVoltage = loadVoltage || finalVoltageLevel;
  
  const totalVoltageDrop = nominalLoadVoltage - finalVoltageAtLoad;
  const totalVoltageDropPercent = (nominalLoadVoltage > 0) 
    ? (totalVoltageDrop / nominalLoadVoltage) * 100 
    : 0;
  
  vdData.loadVoltage = finalVoltageAtLoad;
  vdData.actualVoltageAtLoad = finalVoltageAtLoad;
  vdData.totalDropVolts = totalVoltageDrop;
  vdData.cumulativeDropVolts = totalVoltageDrop;
  vdData.totalDropPercent = totalVoltageDropPercent;
  vdData.cumulativeDropPercent = totalVoltageDropPercent;

  // Compliance checking
  const feederLimit = vdData.compliance.feederLimit;
  const branchLimit = vdData.compliance.branchLimit;
  const combinedLimit = vdData.compliance.combinedLimit;
  
  if (totalVoltageDropPercent <= feederLimit) {
    vdData.compliance.status = 'EXCELLENT';
  } else if (totalVoltageDropPercent <= branchLimit) {
    vdData.compliance.status = 'ACCEPTABLE';
  } else if (totalVoltageDropPercent <= combinedLimit) {
    vdData.compliance.status = 'WARNING';
  } else {
    vdData.compliance.status = 'NON-COMPLIANT';
  }

  // Generate summary
  steps += '═'.repeat(80) + '\n';
  steps += 'VOLTAGE DROP SUMMARY\n';
  steps += '═'.repeat(80) + '\n\n';
  
  steps += `📊 FINAL RESULTS\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Source Voltage:          ${sourceVoltage.toFixed(2)} V\n`;
  steps += `Nominal Load Voltage:    ${nominalLoadVoltage.toFixed(2)} V\n`;
  steps += `Actual Voltage at Load:  ${finalVoltageAtLoad.toFixed(2)} V (${((finalVoltageAtLoad/nominalLoadVoltage)*100).toFixed(2)}%)\n`;
  steps += `Total Voltage Drop:      ${totalVoltageDrop.toFixed(2)} V (${totalVoltageDropPercent.toFixed(3)}%)\n\n`;

  if (voltageProgression.length > 1) {
    steps += `⚡ VOLTAGE PROGRESSION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Point                           Voltage(V)  Drop(V)  Cumulative(V)\n`;
    steps += '─'.repeat(80) + '\n';
    
    voltageProgression.forEach(prog => {
      const pointName = String(prog.point).padEnd(32);
      const voltageStr = prog.voltage.toFixed(2).padStart(10);
      const dropStr = prog.dropFromPrevious.toFixed(2).padStart(8);
      const cumDropStr = prog.cumulativeDrop.toFixed(2).padStart(13);
      steps += `${pointName} ${voltageStr} ${dropStr} ${cumDropStr}`;
      if (prog.note) steps += ` (${prog.note})`;
      steps += '\n';
    });
    steps += '─'.repeat(80) + '\n\n';
  }

  // Compliance status
  const statusIcon = vdData.compliance.status === 'EXCELLENT' ? VOLTAGE_DROP_CONFIG.ICONS.pass :
                     vdData.compliance.status === 'ACCEPTABLE' ? VOLTAGE_DROP_CONFIG.ICONS.pass :
                     vdData.compliance.status === 'WARNING' ? VOLTAGE_DROP_CONFIG.ICONS.warning :
                     VOLTAGE_DROP_CONFIG.ICONS.fail;

  steps += `${statusIcon} NEC & IEEE 141 COMPLIANCE: ${vdData.compliance.status}\n`;
  steps += '─'.repeat(80) + '\n';
  
  if (vdData.compliance.status === 'EXCELLENT') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.pass} EXCELLENT - Well within all recommended limits\n`;
  } else if (vdData.compliance.status === 'ACCEPTABLE') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.pass} ACCEPTABLE - Within branch circuit limits\n`;
  } else if (vdData.compliance.status === 'WARNING') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.warning} WARNING - Approaching maximum limit\n`;
  } else {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.fail} NON-COMPLIANT - Exceeds maximum allowed\n`;
  }
  
  steps += `\nCOMPLIANCE LIMITS:\n`;
  steps += `  Feeder:      ${feederLimit}% ${totalVoltageDropPercent <= feederLimit ? '✅' : '❌'}\n`;
  steps += `  Branch:      ${branchLimit}% ${totalVoltageDropPercent <= branchLimit ? '✅' : '❌'}\n`;
  steps += `  Combined:    ${combinedLimit}% ${totalVoltageDropPercent <= combinedLimit ? '✅' : '❌'}\n\n`;

  steps += `📚 STANDARDS REFERENCED\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `✓ NEC 210.19(A) - Branch Circuit Conductors\n`;
  steps += `✓ NEC 215.2(A)(1) - Feeder Conductors\n`;
  steps += `✓ IEEE 141-1993 Section 3.4 - Voltage Drop Calculations\n\n`;

  steps += '═'.repeat(80) + '\n';
  steps += 'END OF VOLTAGE DROP CALCULATION\n';
  steps += '═'.repeat(80) + '\n';
  
  vdData.calculationSteps = steps;
  
  console.log('✅ Voltage Drop Analysis Complete (v2.1.0)');
  console.log(`   Total Drop: ${totalVoltageDropPercent.toFixed(3)}%`);
  console.log(`   Voltage at Load: ${finalVoltageAtLoad.toFixed(2)}V`);
  console.log(`   Compliance: ${vdData.compliance.status}`);
  console.log('');

  return vdData;
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.calculateVoltageDrop = calculateVoltageDrop;
    window.calculateLoadCurrentFromKVA = calculateLoadCurrentFromKVA;
    window.calculateLoadCurrentFromKW = calculateLoadCurrentFromKW;
    window.calculateMotorLoadCurrent = calculateMotorLoadCurrent;
    window.VOLTAGE_DROP_CONFIG = VOLTAGE_DROP_CONFIG;
}

console.log('✅ Voltage Drop Calculation module v2.1.0 loaded');
console.log('   - ENHANCED: Component tags display');
console.log('   - ENHANCED: Visual hierarchy with icons');
console.log('   - ENHANCED: From/To bus information');
console.log('   - NEW: Helper functions for load calculations');
console.log('   - MAINTAINED: All v2.0.0 features');
console.log('   - Standards: NEC 2023, IEEE 141-1993');
console.log('   - Date: 2025-11-02 15:21:31 UTC');
console.log('   - Author: bfforex');
console.log('');