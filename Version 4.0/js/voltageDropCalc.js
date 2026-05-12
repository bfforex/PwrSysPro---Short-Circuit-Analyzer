/**
 * Voltage Drop Calculation Module
 * Dedicated calculations for voltage drop analysis
 *
 * @author bfforex
 * @date 2025-11-02 15:21:31 UTC
 * @version 2.3.0
 * @enhanced Component tags display throughout calculation steps
 * @enhanced Visual hierarchy with icons and better formatting
 * @enhanced From/To bus information for traceability
 * @enhanced Helper functions for load current calculations
 * @fixed Issue #2: Base voltage handling - voltage tracked properly across transformers
 * @fixed Issue #3: CRITICAL - Voltage drop % now calculated against tap-adjusted nominal per IEEE 141-1993
 * @enhanced Load voltage calculation - now shows actual voltage at load
 * @enhanced Per NEC/IEEE 141 - voltage drop % relative to load voltage
 * @enhanced Transformer tap settings - ±5% voltage adjustment support
 * 
 * Issue #3 FIX (2025-12-01):
 * - Voltage drop % now calculated against TAP-ADJUSTED nominal voltage
 * - Per IEEE 141-1993 Section 3.4: "Voltage regulation calculations shall use
 *   the actual secondary voltage considering tap settings"
 * - Example: +2.5% tap on 440V = 451V baseline for VD% calculation
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

console.log('🔧 Loading Voltage Drop Calculation Module v2.3.0...');
console.log('   ✅ Component tags display - ENHANCED');
console.log('   ✅ Visual hierarchy with icons - NEW');
console.log('   ✅ From/To bus information - NEW');
console.log('   ✅ Helper functions added - NEW');
console.log('   ✅ Issue #3 FIX: Tap-adjusted baseline for VD% - FIXED');
console.log('   ✅ All v2.0.0 features maintained');
console.log('   ✅ FIXED: VD current basis uses load-flow diversified current first');
console.log('   ✅ FIXED: Cable impedance units and manufacturer MV cable data integration');

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const VOLTAGE_DROP_CONFIG = {
    // NEC Recommended Limits
    FEEDER_LIMIT: 3,           // NEC 215.2(A)(1)
    BRANCH_LIMIT: 3,           // NEC 210.19(A)
    COMBINED_LIMIT: 5,         // IEEE 141
    
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
// VOLTAGE DROP CURRENT / IMPEDANCE HELPERS
// Added 2026-05-11: keep voltage-drop loading aligned with load-flow MD.
// ════════════════════════════════════════════════════════════════════════════════

function vdSafeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function vdGetBusesArray() {
    if (typeof window !== 'undefined' && Array.isArray(window.buses)) return window.buses;
    if (typeof buses !== 'undefined' && Array.isArray(buses)) return buses;
    return [];
}

function vdFindBus(busId) {
    return vdGetBusesArray().find(b => b && String(b.id) === String(busId)) || null;
}

function vdIsLoadFlowForBus(loadFlowData, busId) {
    return !!(loadFlowData && busId && String(loadFlowData.busId || '') === String(busId));
}

function vdCurrentFromLoadFlowObject(loadFlow, preferred = 'diversity') {
    if (!loadFlow || typeof loadFlow !== 'object') return null;

    const ds = loadFlow.demandSummary || {};
    const candidates = preferred === 'demand'
        ? [
            { value: ds.demandCurrent, source: 'load-flow demand current', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor },
            { value: loadFlow.demandLoad, source: 'load-flow demand load', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor }
          ]
        : [
            { value: ds.diversityCurrent, source: 'load-flow diversified current', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor },
            { value: loadFlow.diversityLoad, source: 'load-flow diversified load', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor },
            { value: loadFlow.diversifiedLoad, source: 'load-flow diversified load', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor },
            { value: ds.demandCurrent, source: 'load-flow demand current', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor },
            { value: loadFlow.demandLoad, source: 'load-flow demand load', demandFactor: ds.demandFactor, diversityFactor: ds.diversityFactor }
          ];

    for (const c of candidates) {
        const current = vdSafeNumber(c.value, 0);
        if (current > 0) {
            const dfText = Number.isFinite(Number(c.demandFactor)) ? Number(c.demandFactor).toFixed(2) : 'N/A';
            const divText = Number.isFinite(Number(c.diversityFactor)) ? Number(c.diversityFactor).toFixed(2) : 'N/A';
            return {
                current,
                source: `${c.source} (DF=${dfText}, DivF=${divText})`,
                demandFactor: c.demandFactor,
                diversityFactor: c.diversityFactor,
                loadFlow
            };
        }
    }
    return null;
}

function getVoltageDropCurrentForBus(busId, loadFlowData = null, options = {}) {
    const preferred = options.preferred || 'diversity';
    const bus = vdFindBus(busId);

    if (vdIsLoadFlowForBus(loadFlowData, busId)) {
        const fromPassed = vdCurrentFromLoadFlowObject(loadFlowData, preferred);
        if (fromPassed) return fromPassed;
    }

    const storedLoadFlow = bus?.results?.loadFlow || bus?.loadFlow || null;
    const fromStored = vdCurrentFromLoadFlowObject(storedLoadFlow, preferred);
    if (fromStored) return fromStored;

    if (typeof calculateLoadFlowWithDemand === 'function' && busId) {
        try {
            const calculated = calculateLoadFlowWithDemand(busId);
            const fromCalculated = vdCurrentFromLoadFlowObject(calculated, preferred);
            if (fromCalculated) {
                if (bus) {
                    bus.results = bus.results || {};
                    bus.results.loadFlow = calculated;
                }
                return {
                    ...fromCalculated,
                    source: fromCalculated.source.replace('load-flow', 'live load-flow')
                };
            }
        } catch (error) {
            console.warn(`[VD] calculateLoadFlowWithDemand failed for bus ${busId}:`, error?.message || error);
        }
    }

    if (typeof calculateDownstreamLoadWithDiversity === 'function' && busId) {
        try {
            const result = calculateDownstreamLoadWithDiversity(busId, { applyDiversity: true });
            const current = vdSafeNumber(result?.diversifiedLoad ?? result?.diversityCurrent ?? result?.totalCurrent, 0);
            if (current > 0) {
                return { current, source: 'downstream diversity calc', loadFlow: result };
            }
        } catch (error) {
            console.warn(`[VD] calculateDownstreamLoadWithDiversity failed for bus ${busId}:`, error?.message || error);
        }
    }

    if (typeof calculateDownstreamLoad === 'function' && busId) {
        try {
            const current = vdSafeNumber(calculateDownstreamLoad(busId), 0);
            if (current > 0) {
                return { current, source: 'downstream connected load fallback' };
            }
        } catch (error) {
            console.warn(`[VD] calculateDownstreamLoad failed for bus ${busId}:`, error?.message || error);
        }
    }

    const manualCurrent = vdSafeNumber(bus?.loadCurrent ?? bus?.manualLoadCurrent ?? bus?.connectedLoadA, 0);
    if (manualCurrent > 0) {
        return { current: manualCurrent, source: 'bus manual load current fallback' };
    }

    return { current: vdSafeNumber(options.fallbackCurrent, 100), source: `default ${vdSafeNumber(options.fallbackCurrent, 100)} A fallback` };
}

function getVoltageDropCurrentForComponent(comp, segment, loadFlowData = null, options = {}) {
    const targetBusId = options.busId || comp?.toBus || segment?.bus?.id || null;
    return getVoltageDropCurrentForBus(targetBusId, loadFlowData, options);
}

function getCableImpedanceForVoltageDrop(comp, temperature) {
    const manufacturerKey = comp?.manufacturerCableDataKey || comp?.cableDataKey || '';
    if (manufacturerKey && typeof calculateManufacturerCableImpedance === 'function') {
        try {
            const manufacturerResult = calculateManufacturerCableImpedance(comp, { temperatureC: temperature });
            if (manufacturerResult && (manufacturerResult.rOhms > 0 || manufacturerResult.xOhms > 0)) {
                return {
                    source: 'manufacturer',
                    sourceLabel: 'Manufacturer MV cable data',
                    rOhms: vdSafeNumber(manufacturerResult.rOhms, 0),
                    xOhms: vdSafeNumber(manufacturerResult.xOhms, 0),
                    manufacturerResult,
                    steps: (typeof buildManufacturerCableImpedanceSteps === 'function')
                        ? buildManufacturerCableImpedanceSteps(comp, manufacturerResult)
                        : ''
                };
            }
        } catch (error) {
            console.warn(`[VD] Manufacturer cable impedance failed for ${comp?.tag || comp?.id || 'cable'}:`, error?.message || error);
        }
    }

    const allCableData = (typeof CABLE_IMPEDANCE_DATA !== 'undefined') ? CABLE_IMPEDANCE_DATA : {};
    const cableData =
        allCableData && comp?.size && allCableData[comp.size]
            ? allCableData[comp.size]
            : (Object.values(allCableData)[0] || {});

    const material = (comp?.material || 'copper').toLowerCase();
    const parallel = Number(comp?.parallel) > 0 ? Number(comp.parallel) : 1;
    const lengthFt = Number(comp?.length) > 0 ? Number(comp.length) : 0;

    const rPerFt =
        (cableData && cableData[material] && typeof cableData[material].r === 'number')
            ? cableData[material].r
            : (cableData && cableData.copper && typeof cableData.copper.r === 'number' ? cableData.copper.r : 0);

    let xPerFt =
        (cableData && cableData[material] && typeof cableData[material].x === 'number')
            ? cableData[material].x
            : (cableData && cableData.copper && typeof cableData.copper.x === 'number' ? cableData.copper.x : 0);

    const installationFactors = (typeof getCableInstallationFactors === 'function')
        ? getCableInstallationFactors(comp?.installationMethod)
        : null;
    if (installationFactors && Number.isFinite(Number(installationFactors.x_factor))) {
        xPerFt = xPerFt * Number(installationFactors.x_factor);
    }

    const rOhms = (rPerFt * lengthFt) / parallel;
    const xOhms = (xPerFt * lengthFt) / parallel;

    return {
        source: 'nec-table',
        sourceLabel: 'NEC Ch. 9 Table 9 / constants.js',
        cableData,
        material,
        parallel,
        lengthFt,
        rPerFt,
        xPerFt,
        rPer1000Ft: rPerFt * 1000,
        xPer1000Ft: xPerFt * 1000,
        rOhms,
        xOhms,
        installationFactors
    };
}

function vdClamp01(value, fallback = 0.9) {
    const n = vdSafeNumber(value, fallback);
    return Math.min(1, Math.max(0, n));
}

function vdGetFormulaDetailsSqrt3() {
    if (typeof window !== 'undefined' && typeof window.SQRT3 === 'number') return window.SQRT3;
    if (typeof globalThis !== 'undefined' && typeof globalThis.SQRT3 === 'number') return globalThis.SQRT3;
    return Math.sqrt(3);
}

function vdGetFormulaDetailsTemperature(temperature) {
    if (Number.isFinite(Number(temperature))) return Number(temperature);
    const tempEl = (typeof document !== 'undefined') ? document.getElementById('temperature') : null;
    if (tempEl && Number.isFinite(Number(tempEl.value))) return Number(tempEl.value);
    return VOLTAGE_DROP_CONFIG.DEFAULT_TEMPERATURE;
}

function vdGetFormulaDetailComponentLabel(component) {
    return component?.tag || component?.name || component?.id || 'Component';
}

function vdFindMatchingResultComponent(component, resultComponents, fallbackIndex) {
    if (!component || !Array.isArray(resultComponents)) return {};

    const label = vdGetFormulaDetailComponentLabel(component);

    const matched = resultComponents.find(function (candidate) {
        return candidate === component ||
            candidate?.tag === component.tag ||
            candidate?.name === component.name ||
            candidate?.id === component.id ||
            candidate?.tag === label ||
            candidate?.name === label;
    });

    return matched ||
        resultComponents[fallbackIndex - 1] ||
        resultComponents[fallbackIndex] ||
        {};
}

function vdAddVoltageDropFormulaDetails(result, path, options = {}) {
    if (!result || !Array.isArray(path)) return result;

    const resultComponents = Array.isArray(result.components) ? result.components : [];
    const details = [];
    const sqrt3 = vdGetFormulaDetailsSqrt3();
    const defaultPowerFactor = vdClamp01(options.powerFactor, VOLTAGE_DROP_CONFIG.DEFAULT_POWER_FACTOR);
    const temperature = vdGetFormulaDetailsTemperature(options.temperature);
    const loadFlowData = options.loadFlowData || null;
    const fallbackCurrent = vdSafeNumber(options.fallbackCurrent, 100);

    path.forEach(function (segment, index) {
        const component = segment?.component;
        if (!component) return;

        const resultComponent = vdFindMatchingResultComponent(component, resultComponents, index);
        const componentType = String(component?.type || resultComponent?.type || '').toLowerCase();

        if (componentType === 'transformer') {
            const tapPercent = vdSafeNumber(
                component?.tapPercent ??
                component?.tapSettingPercent ??
                component?.tapSetting ??
                component?.tap ??
                resultComponent?.tapPercent,
                0
            );

            details.push({
                step: index,
                type: 'transformer',
                component: vdGetFormulaDetailComponentLabel(component),
                tapPercent,
                dropVolts: vdSafeNumber(resultComponent?.dropVolts, 0),
                dropPercent: vdSafeNumber(resultComponent?.dropPercent, 0),
                note: 'Transformer regulation/tap shown separately; conductor voltage-drop compliance excludes transformer internal regulation.'
            });
            return;
        }

        if (componentType !== 'cable') {
            return;
        }

        const currentInfo = getVoltageDropCurrentForComponent(component, segment, loadFlowData, {
            busId: component?.toBus || segment?.bus?.id || result?.busId,
            fallbackCurrent
        });

        const currentA = vdSafeNumber(
            resultComponent?.current ??
            resultComponent?.currentA ??
            component?.current ??
            component?.loadCurrent ??
            component?.designCurrent,
            vdSafeNumber(currentInfo?.current ?? result?.loadCurrent, 0)
        );

        const powerFactor = vdClamp01(
            resultComponent?.powerFactor ??
            component?.powerFactor ??
            component?.pf,
            defaultPowerFactor
        );
        const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));

        let resistance = vdSafeNumber(
            resultComponent?.rOhms ??
            resultComponent?.resistanceOhms ??
            resultComponent?.resistance ??
            component?.rOhms ??
            component?.resistanceOhms ??
            component?.resistance,
            NaN
        );

        let reactance = vdSafeNumber(
            resultComponent?.xOhms ??
            resultComponent?.reactanceOhms ??
            resultComponent?.reactance ??
            component?.xOhms ??
            component?.reactanceOhms ??
            component?.reactance,
            NaN
        );

        let impedanceSource = resultComponent?.impedanceSource || component?.impedanceSource || 'component/result';
        const impedance = getCableImpedanceForVoltageDrop(component, temperature);

        if (!Number.isFinite(resistance)) {
            resistance = vdSafeNumber(impedance?.rOhms, 0);
        }
        if (!Number.isFinite(reactance)) {
            reactance = vdSafeNumber(impedance?.xOhms, 0);
        }
        if (impedance?.source === 'manufacturer') {
            impedanceSource = 'manufacturerCableData.js';
        } else if (!resultComponent?.impedanceSource && !component?.impedanceSource && impedance?.sourceLabel) {
            impedanceSource = impedance.sourceLabel;
        }

        const calculatedDropVolts = sqrt3 * currentA * ((resistance * powerFactor) + (reactance * sinTheta));
        const usedDropVolts = vdSafeNumber(
            resultComponent?.dropVolts ??
            resultComponent?.voltageDropVolts,
            calculatedDropVolts
        );

        const voltageLevel = vdSafeNumber(
            resultComponent?.voltageLevel ??
            resultComponent?.nominalVoltage ??
            component?.voltage ??
            segment?.bus?.voltage ??
            result?.busVoltage ??
            result?.loadVoltage,
            0
        );

        details.push({
            step: index,
            type: 'cable',
            component: vdGetFormulaDetailComponentLabel(component),
            currentA,
            rOhms: resistance,
            xOhms: reactance,
            powerFactor,
            sinTheta,
            calculatedDropVolts,
            usedDropVolts,
            voltageLevel,
            dropPercent: voltageLevel > 0 ? usedDropVolts / voltageLevel * 100 : 0,
            impedanceSource,
            formula: 'VD = √3 × I × (R cosθ + X sinθ)'
        });
    });

    result.voltageDropFormulaDetails = details;
    return result;
}

function addVoltageDropFormulaDetails(result, path, options = {}) {
    return vdAddVoltageDropFormulaDetails(result, path, options);
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
    
    // ✅ Issue #3 FIX: Track tap adjustment for correct VD% baseline
    tapAdjustment: {
      hasTransformerWithTap: false,
      tapPercent: 0,
      nominalSecondary: loadVoltage,
      tapAdjustedNominal: loadVoltage  // Will be updated when transformer with tap is processed
    },
    
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

      // Get cable impedance data.
      // Priority: manufacturer MV cable data when available, otherwise NEC Table 9 constants.
      const cableImpedance = getCableImpedanceForVoltageDrop(comp, temperature);
      const material = (comp.material || cableImpedance.material || 'copper').toLowerCase();
      const parallel = Number(comp.parallel) > 0 ? Number(comp.parallel) : (cableImpedance.parallel || 1);
      const lengthFt = Number(comp.length) > 0 ? Number(comp.length) : (cableImpedance.lengthFt || 0);
      const cableR = cableImpedance.rOhms;
      const cableX = cableImpedance.xOhms;

      // Get load current from load-flow maximum demand/diversified current first.
      const currentInfo = getVoltageDropCurrentForComponent(comp, segment, loadFlowData, {
        preferred: 'diversity',
        fallbackCurrent: 100
      });
      const loadCurrent = currentInfo.current;
      const loadCurrentSource = currentInfo.source;
      console.log(`  ✅ VD: Using ${loadCurrent.toFixed(2)} A for ${comp.tag || comp.id || 'cable'} (${loadCurrentSource})`);

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
      if (cableImpedance.source === 'manufacturer') {
        steps += `${cableImpedance.steps}\n`;
      } else {
        steps += `Data Source: ${cableImpedance.sourceLabel}\n`;
        if (cableImpedance.installationFactors) {
          steps += `Installation: ${cableImpedance.installationFactors.label}\n`;
          steps += `Reactance Factor: ${Number(cableImpedance.installationFactors.x_factor || 1).toFixed(3)}\n`;
        }
        steps += `Table value from constants.js is stored in Ω/ft. Equivalent Ω/1000ft is shown for readability.\n`;
        steps += `   R_table = ${cableImpedance.rPerFt.toFixed(8)} Ω/ft = ${cableImpedance.rPer1000Ft.toFixed(6)} Ω/1000ft\n`;
        steps += `   X_table = ${cableImpedance.xPerFt.toFixed(8)} Ω/ft = ${cableImpedance.xPer1000Ft.toFixed(6)} Ω/1000ft\n\n`;
        steps += `Temperature Handling:\n`;
        steps += `   NEC Table 9 AC resistance is used directly as the table basis in constants.js.\n`;
        steps += `   No additional 20°C → ${temperature}°C correction applied for NEC-table cable data.\n`;
        steps += `   ${VOLTAGE_DROP_CONFIG.ICONS.info} Reactance is not temperature-corrected.\n\n`;
        if (parallel > 1) {
          steps += `Parallel Configuration:\n`;
          steps += `   R_total = (${cableImpedance.rPerFt.toFixed(8)} × ${lengthFt}) / ${parallel} = ${cableR.toFixed(6)} Ω\n`;
          steps += `   X_total = (${cableImpedance.xPerFt.toFixed(8)} × ${lengthFt}) / ${parallel} = ${cableX.toFixed(6)} Ω\n\n`;
        } else {
          steps += `Total Cable Impedance:\n`;
          steps += `   R_total = ${cableImpedance.rPerFt.toFixed(8)} × ${lengthFt} = ${cableR.toFixed(6)} Ω\n`;
          steps += `   X_total = ${cableImpedance.xPerFt.toFixed(8)} × ${lengthFt} = ${cableX.toFixed(6)} Ω\n\n`;
        }
      }

      steps += `📊 VOLTAGE DROP CALCULATION\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `Load Current:        ${loadCurrent.toFixed(2)} A  (source: ${loadCurrentSource || 'N/A'})\n`;
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
        currentSource: loadCurrentSource,
        impedanceSource: cableImpedance.source,
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

      // FIX-3: Guard against missing transformer rating or secondary voltage.
      // Previously: (rating * 1000 || 1) was used as denominator, turning a
      // rating of 0 into a divisor of 1 and giving zBase = V² = ~230 000 Ω
      // for a 480 V transformer → astronomically inflated VD.
      // Correct behaviour when rating/voltage is not entered: treat transformer
      // as ideal (z = 0, VD = 0) and emit a console warning so the engineer
      // knows the data is incomplete.
      let z = 0, x = 0, r = 0;
      if (rating > 0 && secondaryV > 0 && impPct > 0) {
        const zBase = (secondaryV * secondaryV) / (rating * 1000);
        z = (impPct / 100) * zBase;
        x = z * xr / Math.sqrt(1 + xr * xr);
        r = z / Math.sqrt(1 + xr * xr);
      } else {
        const missing = [];
        if (!(rating > 0))    missing.push('rating (kVA)');
        if (!(secondaryV > 0)) missing.push('secondary voltage');
        if (!(impPct > 0))    missing.push('impedance %');
        if (missing.length > 0) {
          console.warn(`[VD] Transformer ${comp.tag || comp.id}: missing ${missing.join(', ')} — treating as ideal (z = 0)`);
          steps += `⚠️  NOTE: Transformer impedance cannot be calculated — missing ${missing.join(', ')}.\n`;
          steps += `   Transformer treated as ideal (no internal voltage drop).\n`;
          steps += `   Enter transformer data to get accurate results.\n\n`;
        }
      }

      // Get transformer secondary current from load-flow maximum demand/diversified current first.
      const transformerCurrentInfo = getVoltageDropCurrentForComponent(comp, segment, loadFlowData, {
        busId: comp.toBus,
        preferred: 'diversity',
        fallbackCurrent: 100
      });
      const secondaryCurrent = transformerCurrentInfo.current;
      const secondaryCurrentSource = transformerCurrentInfo.source;
      console.log(`  ✅ VD: Using transformer secondary current ${secondaryCurrent.toFixed(2)} A for ${comp.tag || comp.id || 'transformer'} (${secondaryCurrentSource})`);

      const turnsRatio = (secondaryV > 0) ? (primaryV / secondaryV) : 1;
      const primaryCurrent = (turnsRatio > 0) ? (secondaryCurrent / turnsRatio) : secondaryCurrent;

      // Calculate voltage drop
      const cosTheta = powerFactor;
      const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
      const dropVolts = SQRT3 * secondaryCurrent * (r * cosTheta + x * sinTheta);
      
      // ✅ Issue #3 FIX: Calculate drop % against TAP-ADJUSTED nominal (NOT original nominal)
      // Per IEEE 141-1993 Section 3.4: "Voltage regulation shall be calculated
      // using the actual secondary voltage considering tap settings"
      const tapAdjustedBaseline = secondaryV * (1 + tapSetting / 100);
      const dropPercent = (tapAdjustedBaseline > 0) ? (dropVolts / tapAdjustedBaseline) * 100 : 0;

      let severity = 'LOW';
      if (dropPercent > 3) severity = 'HIGH';
      else if (dropPercent > 2) severity = 'MEDIUM';

      // Update voltage tracking
      const voltageAtSecondaryNoLoad = currentVoltage / turnsRatio;
      const voltageAtSecondaryWithTap = voltageAtSecondaryNoLoad * (1 + tapSetting / 100);
      currentVoltage = voltageAtSecondaryWithTap - dropVolts;
      currentVoltageLevel = secondaryV;
      
      // ✅ Issue #3 FIX: Track tap adjustment for final VD% calculation
      if (tapSetting !== 0) {
        vdData.tapAdjustment.hasTransformerWithTap = true;
        vdData.tapAdjustment.tapPercent = tapSetting;
        vdData.tapAdjustment.nominalSecondary = secondaryV;
        vdData.tapAdjustment.tapAdjustedNominal = tapAdjustedBaseline;
      }

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
      if (rating > 0 && secondaryV > 0) {
        const zBaseDisplay = (secondaryV * secondaryV) / (rating * 1000);
        steps += `Z_base = V² / S = ${secondaryV}² / (${rating} × 1000) = ${zBaseDisplay.toFixed(6)} Ω\n`;
        steps += `Z = ${impPct}% × ${zBaseDisplay.toFixed(6)} = ${z.toFixed(6)} Ω\n`;
      }
      steps += `Using X/R = ${xr}:\n`;
      steps += `R = ${r.toFixed(6)} Ω\n`;
      steps += `X = ${x.toFixed(6)} Ω\n`;
      steps += `Z = ${z.toFixed(6)} Ω\n\n`;

      steps += `📊 LOADING ANALYSIS\n`;
      steps += '─'.repeat(80) + '\n';
      steps += `PRIMARY SIDE (${primaryV}V):\n`;
      steps += `   Voltage Entering: ${(voltageAtSecondaryNoLoad * turnsRatio).toFixed(2)} V\n`;
      steps += `   Current:          ${primaryCurrent.toFixed(2)} A\n\n`;
      
      const loadingKVA = (secondaryCurrent * secondaryV * SQRT3) / 1000;
      steps += `SECONDARY SIDE (${secondaryV}V):\n`;
      steps += `   Current:          ${secondaryCurrent.toFixed(2)} A\n`;
      steps += `   Current Basis:    ${secondaryCurrentSource || 'N/A'}\n`;
      steps += `   Demand kVA:       ${loadingKVA.toFixed(2)} kVA\n`;
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
  // ✅ Issue #3 FIX: Use tap-adjusted nominal for VD% calculation
  // ══════════════════════════════════════════════════════════════════════════════
  
  const finalVoltageAtLoad = currentVoltage;
  const finalVoltageLevel = currentVoltageLevel;
  
  // ✅ Issue #3 FIX: Determine correct baseline for VD% calculation
  // If transformer has tap, use tap-adjusted nominal; otherwise use standard nominal
  let nominalLoadVoltage = loadVoltage || finalVoltageLevel;
  let baselineForVDPercent = nominalLoadVoltage;
  let baselineDescription = 'Nominal Voltage';
  
  if (vdData.tapAdjustment.hasTransformerWithTap) {
    // Use tap-adjusted nominal as baseline per IEEE 141-1993 Section 3.4
    baselineForVDPercent = vdData.tapAdjustment.tapAdjustedNominal;
    baselineDescription = `Tap-Adjusted Nominal (${vdData.tapAdjustment.tapPercent > 0 ? '+' : ''}${vdData.tapAdjustment.tapPercent}% tap)`;
    console.log(`${VOLTAGE_DROP_CONFIG.ICONS.info} Issue #3 FIX: Using tap-adjusted nominal ${baselineForVDPercent}V for VD% calculation`);
  }
  
  const totalVoltageDrop = baselineForVDPercent - finalVoltageAtLoad;
  
  // ✅ Issue #3 FIX: Calculate VD% against TAP-ADJUSTED baseline (CORRECT)
  const totalVoltageDropPercent = (baselineForVDPercent > 0) 
    ? (totalVoltageDrop / baselineForVDPercent) * 100 
    : 0;
  
  // Also calculate legacy (incorrect) percentage for comparison/reference
  const legacyVoltageDropPercent = (nominalLoadVoltage > 0)
    ? ((nominalLoadVoltage - finalVoltageAtLoad) / nominalLoadVoltage) * 100
    : 0;
  
  vdData.loadVoltage = finalVoltageAtLoad;
  vdData.actualVoltageAtLoad = finalVoltageAtLoad;
  vdData.totalDropVolts = totalVoltageDrop;
  vdData.cumulativeDropVolts = totalVoltageDrop;
  vdData.totalDropPercent = totalVoltageDropPercent;
  vdData.cumulativeDropPercent = totalVoltageDropPercent;

  // ══════════════════════════════════════════════════════════════════════════════
  // SEPARATED VOLTAGE DROP RESULT BASIS
  // Conductor VD = compliance basis.
  // Transformer regulation = equipment/loading item.
  // System voltage profile = complete voltage result.
  // ══════════════════════════════════════════════════════════════════════════════
  const conductorComponents = (vdData.components || []).filter(c =>
    String(c.type || '').toLowerCase() !== 'transformer'
  );

  const transformerComponents = (vdData.components || []).filter(c =>
    String(c.type || '').toLowerCase() === 'transformer'
  );

  const conductorDropVoltsAtLoadVoltage = conductorComponents.reduce((sum, c) => {
    const componentVoltage = Number(
      c.voltageLevel ||
      c.nominalVoltage ||
      baselineForVDPercent ||
      loadVoltage ||
      0
    );

    const componentDrop = Number(c.dropVolts || 0);

    if (componentVoltage > 0 && baselineForVDPercent > 0) {
      return sum + componentDrop * (baselineForVDPercent / componentVoltage);
    }

    return sum + componentDrop;
  }, 0);

  const conductorDropPercent = (baselineForVDPercent > 0)
    ? (conductorDropVoltsAtLoadVoltage / baselineForVDPercent) * 100
    : 0;

  const transformerRegulationVolts = transformerComponents.reduce((sum, c) => {
    return sum + Number(c.dropVolts || 0);
  }, 0);

  const transformerRegulationPercent = transformerComponents.reduce((sum, c) => {
    return sum + Number(c.dropPercent || 0);
  }, 0);

  const highestTransformerLoading = transformerComponents.reduce((max, c) => {
    return Math.max(max, Number(c.loading || 0));
  }, 0);

  vdData.conductorVoltageDrop = {
    totalDropVolts: conductorDropVoltsAtLoadVoltage,
    totalDropPercent: conductorDropPercent,
    components: conductorComponents,
    basisVoltage: baselineForVDPercent,
    basis: 'Conductor voltage drop only; transformer regulation excluded.'
  };

  vdData.transformerRegulation = {
    totalDropVolts: transformerRegulationVolts,
    totalDropPercent: transformerRegulationPercent,
    highestLoading: highestTransformerLoading,
    transformers: transformerComponents,
    basis: 'Transformer regulation/loading only; excluded from conductor voltage-drop compliance.'
  };

  vdData.systemVoltageProfile = {
    totalDropVolts: totalVoltageDrop,
    totalDropPercent: totalVoltageDropPercent,
    voltageAtLoad: finalVoltageAtLoad,
    includesConductorDrop: true,
    includesTransformerRegulation: transformerComponents.length > 0,
    basis: 'Complete system voltage profile including conductor voltage drop and transformer regulation.'
  };


  // ✅ Issue #3 FIX: Store tap-related data for exports
  if (vdData.tapAdjustment.hasTransformerWithTap) {
    vdData.nominalVoltage = nominalLoadVoltage;
    vdData.tapPercent = vdData.tapAdjustment.tapPercent;
    vdData.tapAdjustedNominal = baselineForVDPercent;
    vdData.legacyDropPercent = legacyVoltageDropPercent;  // For reference only
  }

  // Compliance checking - against tap-adjusted baseline
  const feederLimit = vdData.compliance.feederLimit;
  const branchLimit = vdData.compliance.branchLimit;
  const combinedLimit = vdData.compliance.combinedLimit;
  
  if (conductorDropPercent <= feederLimit) {
    vdData.compliance.status = 'COMPLIANT';
    vdData.compliance.message = 'Conductor voltage drop is within feeder/branch recommended limits.';
  } else if (conductorDropPercent <= branchLimit) {
    vdData.compliance.status = 'ACCEPTABLE';
    vdData.compliance.message = 'Conductor voltage drop is within branch-circuit recommended limit.';
  } else if (conductorDropPercent <= combinedLimit) {
    vdData.compliance.status = 'WARNING';
    vdData.compliance.message = 'Conductor voltage drop exceeds individual feeder/branch recommendation but is within combined conductor limit.';
  } else {
    vdData.compliance.status = 'NON-COMPLIANT';
    vdData.compliance.message = 'Conductor voltage drop exceeds combined recommended limit.';
  }

  vdData.compliance.checkedDropPercent = conductorDropPercent;
  vdData.compliance.checkedDropVolts = conductorDropVoltsAtLoadVoltage;
  vdData.compliance.checkedBasis = 'Conductor voltage drop only';

  // Generate summary
  steps += '═'.repeat(80) + '\n';
  steps += 'VOLTAGE DROP SUMMARY\n';
  steps += '═'.repeat(80) + '\n\n';
  
  steps += `📊 FINAL RESULTS\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Source Voltage: ${sourceVoltage.toFixed(2)} V\n`;
  steps += `Nominal Load Voltage: ${nominalLoadVoltage.toFixed(2)} V\n`;
  steps += `Actual Voltage at Load: ${finalVoltageAtLoad.toFixed(2)} V (${((finalVoltageAtLoad / baselineForVDPercent) * 100).toFixed(2)}% of baseline)\n\n`;

  steps += `A. CONDUCTOR VOLTAGE DROP COMPLIANCE\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Conductor Voltage Drop: ${vdData.conductorVoltageDrop.totalDropVolts.toFixed(3)} V (${vdData.conductorVoltageDrop.totalDropPercent.toFixed(3)}%)\n`;
  steps += `Compliance Status: ${vdData.compliance.status}\n`;
  steps += `Checked Basis: Conductors only. Transformer regulation is excluded from this compliance value.\n\n`;

  if (vdData.conductorVoltageDrop.components.length > 0) {
    steps += `Conductor Components Included:\n`;

    vdData.conductorVoltageDrop.components.forEach(component => {
      const tag = component.tag || component.name || `Step ${component.step || ''}`;
      const componentVoltage = Number(component.voltageLevel || component.nominalVoltage || baselineForVDPercent || 0);
      const originalDrop = Number(component.dropVolts || 0);
      const equivalentDrop = (componentVoltage > 0 && baselineForVDPercent > 0)
        ? originalDrop * (baselineForVDPercent / componentVoltage)
        : originalDrop;
      const equivalentPercent = (baselineForVDPercent > 0)
        ? (equivalentDrop / baselineForVDPercent) * 100
        : 0;

      steps += `   - ${tag}: ${originalDrop.toFixed(3)} V at ${componentVoltage.toFixed(0)} V`;
      steps += ` → ${equivalentDrop.toFixed(3)} V at ${baselineForVDPercent.toFixed(0)} V basis`;
      steps += ` (${equivalentPercent.toFixed(3)}%)\n`;
    });

    steps += '\n';
  }

  steps += `B. TRANSFORMER REGULATION / LOADING\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `Transformer Regulation: ${vdData.transformerRegulation.totalDropVolts.toFixed(3)} V (${vdData.transformerRegulation.totalDropPercent.toFixed(3)}%)\n`;
  steps += `Highest Transformer Loading: ${vdData.transformerRegulation.highestLoading.toFixed(1)}%\n`;
  steps += `Checked Basis: Transformer internal regulation/loading. Shown separately from conductor compliance.\n\n`;

  if (vdData.transformerRegulation.transformers.length > 0) {
    steps += `Transformer Components:\n`;

    vdData.transformerRegulation.transformers.forEach(component => {
      const tag = component.tag || component.name || `Step ${component.step || ''}`;

      steps += `   - ${tag}: ${Number(component.dropVolts || 0).toFixed(3)} V`;
      steps += ` (${Number(component.dropPercent || 0).toFixed(3)}%)`;

      if (component.loading !== undefined) {
        steps += `, Loading ${Number(component.loading || 0).toFixed(1)}%`;
      }

      steps += `\n`;
    });

    steps += '\n';
  }

  steps += `C. SYSTEM VOLTAGE PROFILE\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `System Voltage Profile Deviation: ${vdData.systemVoltageProfile.totalDropVolts.toFixed(3)} V (${vdData.systemVoltageProfile.totalDropPercent.toFixed(3)}%)\n`;
  steps += `Voltage at Load: ${vdData.systemVoltageProfile.voltageAtLoad.toFixed(2)} V\n`;
  steps += `Checked Basis: Complete voltage profile including conductor voltage drop and transformer regulation.\n\n`;
  steps += '─'.repeat(80) + '\n';
  
  
  if (vdData.compliance.status === 'COMPLIANT') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.pass} COMPLIANT - Conductor voltage drop is within recommended limits\n`;
  } else if (vdData.compliance.status === 'ACCEPTABLE') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.pass} ACCEPTABLE - Conductor voltage drop is within branch-circuit recommended limit\n`;
  } else if (vdData.compliance.status === 'WARNING') {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.warning} WARNING - Conductor voltage drop exceeds individual recommendation but is within combined conductor limit\n`;
  } else {
    steps += `${VOLTAGE_DROP_CONFIG.ICONS.fail} NON-COMPLIANT - Conductor voltage drop exceeds combined recommended limit\n`;
  }

  
  steps += `\nCOMPLIANCE LIMITS:\n`;
  steps += `Feeder Conductors: ${feederLimit}% ${conductorDropPercent <= feederLimit ? '✅' : '❌'}\n`;
  steps += `Branch Circuits: ${branchLimit}% ${conductorDropPercent <= branchLimit ? '✅' : '❌'}\n`;
  steps += `Combined Conductors: ${combinedLimit}% ${conductorDropPercent <= combinedLimit ? '✅' : '❌'}\n\n`;

  steps += `📚 STANDARDS REFERENCED\n`;
  steps += '─'.repeat(80) + '\n';
  steps += `✓ NEC 210.19(A) - Branch Circuit Conductors\n`;
  steps += `✓ NEC 215.2(A)(1) - Feeder Conductors\n`;
  steps += `✓ IEEE 141-1993 Section 3.4 - Voltage Drop Calculations\n`;
  
  // ✅ Issue #3 FIX: Note about tap adjustment compliance
  if (vdData.tapAdjustment.hasTransformerWithTap) {
    steps += `✓ IEEE 141-1993 Section 3.4.2 - Transformer Tap Adjustment Applied\n`;
  }
  steps += '\n';

  steps += '═'.repeat(80) + '\n';
  steps += 'END OF VOLTAGE DROP CALCULATION\n';
  steps += '═'.repeat(80) + '\n';
  
  vdData.calculationSteps = steps;
  
  console.log('✅ Voltage Drop Analysis Complete (v2.4.0)');
  console.log(`   Total Drop: ${totalVoltageDropPercent.toFixed(3)}%`);
  if (vdData.tapAdjustment.hasTransformerWithTap) {
    console.log(`   Baseline: ${baselineForVDPercent.toFixed(2)}V (tap-adjusted)`);
  }
  console.log(`   Voltage at Load: ${finalVoltageAtLoad.toFixed(2)}V`);
  console.log(`   Compliance: ${vdData.compliance.status}`);
  console.log('');

  vdAddVoltageDropFormulaDetails(vdData, path, {
    powerFactor,
    temperature,
    loadFlowData,
    fallbackCurrent: 100
  });

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
    window.addVoltageDropFormulaDetails = addVoltageDropFormulaDetails;
    window.VOLTAGE_DROP_CONFIG = VOLTAGE_DROP_CONFIG;
}

console.log('✅ Voltage Drop Calculation module v2.3.0 loaded');
console.log('   - ENHANCED: Component tags display');
console.log('   - ENHANCED: Visual hierarchy with icons');
console.log('   - ENHANCED: From/To bus information');
console.log('   - NEW: Helper functions for load calculations');
console.log('   - FIXED: Issue #3 - Tap-adjusted baseline for VD% (IEEE 141-1993)');
console.log('   - MAINTAINED: All v2.0.0 features');
console.log('   - Standards: NEC 2023, IEEE 141-1993');
console.log('   - Date: 2025-12-01');
console.log('   - Author: bfforex');
console.log('');
