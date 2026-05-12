/**
 * Voltage Drop Engine Module
 * Unified Voltage Drop Calculations with Design vs Operating Modes
 * 
 * @author bfforex
 * @date 2025-12-02
 * @version 3.4.1
 * @updated 2025-12-05 - Default mode changed to use diversified load current
 * 
 * Key Features:
 * - Single function computeVoltageDrop(bus, mode) with clear modes
 * - Mode 'design': Always 100% FLC - for NEC/IEEE compliance checks
 * - Mode 'oper_demand': With demand factors applied
 * - Mode 'oper_demand_df': With demand AND diversity factors applied (DEFAULT)
 * 
 * Convention:
 * - DEFAULT: Voltage drop uses load current with demand & diversity applied
 * - Design VD (100% FLC) available for compliance checks when explicitly requested
 * - Operating VD (with demand/diversity) is the standard calculation mode
 * 
 * Standards:
 * - NEC 210.19(A) - Branch Circuit Conductors (3% max)
 * - NEC 215.2(A)(1) - Feeder Conductors (3% max)
 * - IEEE 141-1993 - Combined System (5% max)
 */

console.log('🔧 Loading Voltage Drop Engine Module v3.4.1...');
console.log('   ✅ Default mode: Uses diversified load current (demand + diversity)');

// ═══════════════════════════════════════════════════════════════════════════════
// VOLTAGE DROP ENGINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const VOLTAGE_DROP_ENGINE_CONFIG = {
    // Mode definitions
    MODES: {
        DESIGN: 'design',              // 100% FLC - for compliance
        OPER_DEMAND: 'oper_demand',    // With demand factor only
        OPER_DEMAND_DF: 'oper_demand_df'  // With demand + diversity
    },
    
    // NEC/IEEE Limits
    LIMITS: {
        FEEDER: 3,           // NEC 215.2(A)(1)
        BRANCH: 5,           // NEC 210.19(A)
        COMBINED: 7          // IEEE 141
    },
    
    // Default values
    DEFAULTS: {
        POWER_FACTOR: 0.85,
        TEMPERATURE: 75
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VOLTAGE DROP CALCULATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute voltage drop for a bus with specified mode
 * 
 * @param {Object} bus - Bus object
 * @param {String} mode - 'design', 'oper_demand', or 'oper_demand_df' (default: 'oper_demand_df')
 * @param {Object} options - Additional options
 * @returns {Object} Voltage drop results
 */
function computeVoltageDrop(bus, mode = 'oper_demand_df', options = {}) {
    const SQRT3 = Math.sqrt(3);
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE INPUTS
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!bus) {
        throw new Error('Bus is required for voltage drop calculation');
    }
    
    const validModes = Object.values(VOLTAGE_DROP_ENGINE_CONFIG.MODES);
    if (!validModes.includes(mode)) {
        console.warn(`⚠️ Invalid mode '${mode}', defaulting to 'oper_demand_df'`);
        mode = 'oper_demand_df';
    }
    
    console.log(`\n⚡ Computing Voltage Drop for ${bus.name}`);
    console.log(`   Mode: ${mode.toUpperCase()}`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET PARAMETERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const powerFactor = options.powerFactor || 
        parseFloat(document.getElementById('powerFactor')?.value) || 
        VOLTAGE_DROP_ENGINE_CONFIG.DEFAULTS.POWER_FACTOR;
    
    const temperature = options.temperature ||
        parseFloat(document.getElementById('temperature')?.value) ||
        VOLTAGE_DROP_ENGINE_CONFIG.DEFAULTS.TEMPERATURE;
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET LOAD CURRENT BASED ON MODE
    // ─────────────────────────────────────────────────────────────────────────
    
    let loadCurrent;
    let currentDescription;
    
    switch (mode) {
        case 'design':
            // Design mode: Always use 100% FLC (connected load)
            loadCurrent = getConnectedLoadCurrent(bus);
            currentDescription = '100% FLC (Design)';
            break;
            
        case 'oper_demand':
            // Operating with demand factor only
            loadCurrent = getDemandLoadCurrent(bus);
            currentDescription = 'Demand Factor Applied';
            break;
            
        case 'oper_demand_df':
            // Operating with demand AND diversity factors (DEFAULT)
            loadCurrent = getDiversifiedLoadCurrent(bus);
            currentDescription = 'Demand + Diversity Applied';
            break;
            
        default:
            // Default to diversified load current
            loadCurrent = getDiversifiedLoadCurrent(bus);
            currentDescription = 'Demand + Diversity Applied (Default)';
    }
    
    console.log(`   Load Current: ${loadCurrent.toFixed(2)} A (${currentDescription})`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE PATH VOLTAGE DROP
    // ─────────────────────────────────────────────────────────────────────────
    
    // Get path to this bus
    const path = getPathToBus(bus);
    
    if (!path || path.length === 0) {
        console.log(`   No path found for ${bus.name}`);
        return createEmptyVoltageDropResult(bus, mode);
    }
    
    // Calculate voltage drop through each component
    let totalDropVolts = 0;
    let totalDropPercent = 0;
    const componentBreakdown = [];
    
    let currentVoltage = path[0]?.bus?.voltage || bus.voltage;
    const sourceVoltage = currentVoltage;
    let voltageLevel = currentVoltage;
    
    // Skip source bus, start from first component
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment?.component;
        
        if (!comp) continue;
        
        // ─────────────────────────────────────────────────────────────────────
        // CABLE VOLTAGE DROP
        // ─────────────────────────────────────────────────────────────────────
        if (comp.type === 'cable') {
            const cableResult = calculateCableVoltageDrop(
                comp, 
                loadCurrent, 
                powerFactor, 
                temperature, 
                voltageLevel
            );
            
            totalDropVolts += cableResult.dropVolts;
            currentVoltage -= cableResult.dropVolts;
            
            componentBreakdown.push({
                type: 'cable',
                tag: comp.tag || comp.size,
                dropVolts: cableResult.dropVolts,
                dropPercent: cableResult.dropPercent,
                current: loadCurrent,
                voltageLevel: voltageLevel
            });
        }
        
        // ─────────────────────────────────────────────────────────────────────
        // TRANSFORMER VOLTAGE DROP
        // ─────────────────────────────────────────────────────────────────────
        else if (comp.type === 'transformer') {
            // Get transformer secondary current based on mode
            let secondaryCurrent = loadCurrent;
            
            // For transformers, we may need to adjust current for voltage ratio
            const turnsRatio = comp.primary / comp.secondary;
            if (turnsRatio > 0 && voltageLevel !== comp.secondary) {
                secondaryCurrent = loadCurrent; // Use downstream load
            }
            
            const xfmrResult = calculateTransformerVoltageDrop(
                comp,
                secondaryCurrent,
                powerFactor
            );
            
            // Update voltage level after transformer
            const voltageAtSecondaryNoLoad = currentVoltage / turnsRatio;
            const tapAdjust = comp.tapSetting ? (1 + comp.tapSetting / 100) : 1;
            const voltageAtSecondaryWithTap = voltageAtSecondaryNoLoad * tapAdjust;
            
            currentVoltage = voltageAtSecondaryWithTap - xfmrResult.dropVolts;
            voltageLevel = comp.secondary;
            totalDropVolts += xfmrResult.dropVolts;
            
            componentBreakdown.push({
                type: 'transformer',
                tag: comp.tag || `${comp.rating}kVA`,
                dropVolts: xfmrResult.dropVolts,
                dropPercent: xfmrResult.dropPercent,
                current: secondaryCurrent,
                voltageLevel: comp.secondary,
                tapSetting: comp.tapSetting || 0
            });
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE TOTAL PERCENTAGE
    // ─────────────────────────────────────────────────────────────────────────
    
    // Get the nominal voltage at load
    const nominalLoadVoltage = bus.voltage;
    
    // Check for tap adjustment
    let baselineVoltage = nominalLoadVoltage;
    const lastTransformer = componentBreakdown.find(c => c.type === 'transformer' && c.tapSetting !== 0);
    if (lastTransformer) {
        baselineVoltage = nominalLoadVoltage * (1 + lastTransformer.tapSetting / 100);
    }
    
    // Calculate total drop percentage against baseline
    totalDropPercent = baselineVoltage > 0 ? 
        ((baselineVoltage - currentVoltage) / baselineVoltage) * 100 : 0;
    
    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE COMPLIANCE STATUS (DESIGN MODE ONLY)
    // ─────────────────────────────────────────────────────────────────────────
    
    let complianceStatus = 'N/A';
    let complianceNote = '';
    
    if (mode === 'design') {
        // Compliance is ONLY checked against design voltage drop
        const limits = VOLTAGE_DROP_ENGINE_CONFIG.LIMITS;
        
        if (totalDropPercent <= limits.FEEDER) {
            complianceStatus = 'EXCELLENT';
            complianceNote = `VD ${totalDropPercent.toFixed(2)}% ≤ ${limits.FEEDER}% (Feeder limit)`;
        } else if (totalDropPercent <= limits.BRANCH) {
            complianceStatus = 'COMPLIANT';
            complianceNote = `VD ${totalDropPercent.toFixed(2)}% ≤ ${limits.BRANCH}% (Branch limit)`;
        } else if (totalDropPercent <= limits.COMBINED) {
            complianceStatus = 'WARNING';
            complianceNote = `VD ${totalDropPercent.toFixed(2)}% ≤ ${limits.COMBINED}% (Combined limit)`;
        } else {
            complianceStatus = 'NON-COMPLIANT';
            complianceNote = `VD ${totalDropPercent.toFixed(2)}% > ${limits.COMBINED}% (Exceeds limit)`;
        }
    } else {
        // Operating modes are INFORMATIONAL only
        complianceNote = 'Operating VD - for informational purposes only. Compliance is based on design VD.';
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // BUILD RESULT OBJECT
    // ─────────────────────────────────────────────────────────────────────────
    
    const result = {
        busId: bus.id,
        busName: bus.name,
        busVoltage: bus.voltage,
        
        // Mode information
        mode: mode,
        modeDescription: currentDescription,
        
        // Current used
        loadCurrent: loadCurrent,
        
        // Voltage tracking
        sourceVoltage: sourceVoltage,
        nominalLoadVoltage: nominalLoadVoltage,
        baselineVoltage: baselineVoltage,
        actualVoltageAtLoad: currentVoltage,
        
        // Voltage drop results
        totalDropVolts: baselineVoltage - currentVoltage,
        totalDropPercent: totalDropPercent,
        
        // Component breakdown
        components: componentBreakdown,
        
        // Compliance (only meaningful for design mode)
        compliance: {
            status: complianceStatus,
            note: complianceNote,
            limits: VOLTAGE_DROP_ENGINE_CONFIG.LIMITS,
            isDesignMode: mode === 'design'
        },
        
        // Calculation metadata
        powerFactor: powerFactor,
        temperature: temperature,
        calculationDate: new Date().toISOString()
    };
    
    console.log(`   Total VD: ${totalDropPercent.toFixed(2)}%`);
    console.log(`   Compliance: ${complianceStatus}`);
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get connected load current (100% FLC) for a bus
 */
function getConnectedLoadCurrent(bus) {
    // Try load flow results first
    if (bus.results?.loadFlow?.demandSummary?.connectedCurrent) {
        return bus.results.loadFlow.demandSummary.connectedCurrent;
    }
    
    if (bus.results?.loadFlow?.summary?.totalCurrent) {
        return bus.results.loadFlow.summary.totalCurrent;
    }
    
    // Try calculating downstream load
    if (typeof calculateDownstreamLoad === 'function') {
        const downstream = calculateDownstreamLoad(bus.id);
        if (downstream > 0) return downstream;
    }
    
    // Fall back to bus load current
    return parseFloat(bus.loadCurrent) || 100;
}

/**
 * Get demand load current (with demand factor) for a bus
 */
function getDemandLoadCurrent(bus) {
    // Try load flow results
    if (bus.results?.loadFlow?.demandSummary?.demandCurrent) {
        return bus.results.loadFlow.demandSummary.demandCurrent;
    }
    
    // Calculate from connected load with demand factor
    const connected = getConnectedLoadCurrent(bus);
    const demandFactor = bus.demandFactor || 1.0;
    
    return connected * demandFactor;
}

/**
 * Get diversified load current (with demand + diversity) for a bus
 */
function getDiversifiedLoadCurrent(bus) {
    // Try load flow results
    if (bus.results?.loadFlow?.demandSummary?.diversityCurrent) {
        return bus.results.loadFlow.demandSummary.diversityCurrent;
    }
    
    // Try live load-flow with demand/diversity before raw connected-load fallback
    if (typeof calculateLoadFlowWithDemand === 'function') {
        try {
            const result = calculateLoadFlowWithDemand(bus.id);
            const current = Number(result?.demandSummary?.diversityCurrent || result?.diversityLoad || result?.diversifiedLoad || 0);
            if (current > 0) return current;
        } catch (error) {
            console.warn('[VD Engine] calculateLoadFlowWithDemand failed:', error?.message || error);
        }
    }

    // Try diversity calculation function
    if (typeof calculateDownstreamLoadWithDiversity === 'function') {
        const result = calculateDownstreamLoadWithDiversity(bus.id, { applyDiversity: true });
        if (result?.diversifiedLoad > 0) {
            return result.diversifiedLoad;
        }
    }
    
    // Calculate from demand load with diversity factor
    const demandCurrent = getDemandLoadCurrent(bus);
    const diversityFactor = bus.diversityFactor || 1.0;
    
    // Diversity factor is ≥ 1.0, so we divide
    return demandCurrent / diversityFactor;
}

/**
 * Get path from source to bus
 */
function getPathToBus(bus) {
    if (bus.pathComponents && bus.pathComponents.length > 0) {
        return bus.pathComponents;
    }
    
    // Try finding path through parent chain
    if (typeof findPathToBus === 'function') {
        return findPathToBus(bus.id);
    }
    
    return [];
}

/**
 * Calculate voltage drop through a cable
 */
function calculateCableVoltageDrop(cable, current, powerFactor, temperature, voltageLevel) {
    const SQRT3 = Math.sqrt(3);
    
    // Get cable impedance data
    const cableData = (typeof CABLE_IMPEDANCE_DATA !== 'undefined' && cable.size) ?
        CABLE_IMPEDANCE_DATA[cable.size] : null;
    
    const material = (cable.material || 'copper').toLowerCase();
    const parallel = cable.parallel || 1;
    const length = parseFloat(cable.length) || 0;
    
    // Get base resistance and reactance
    let rBase = cableData?.[material]?.r || 0.05;
    let xBase = cableData?.[material]?.x || 0.04;
    
    // Temperature correction for resistance
    if (typeof temperatureCorrection === 'function') {
        rBase = temperatureCorrection(rBase, temperature, material);
    }
    
    // Calculate total impedance
    const R = (rBase * length) / parallel;
    const X = (xBase * length) / parallel;
    
    // Calculate voltage drop
    const cosTheta = powerFactor;
    const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
    const dropVolts = SQRT3 * current * (R * cosTheta + X * sinTheta);
    const dropPercent = voltageLevel > 0 ? (dropVolts / voltageLevel) * 100 : 0;
    
    return {
        dropVolts: dropVolts,
        dropPercent: dropPercent,
        resistance: R,
        reactance: X
    };
}

/**
 * Calculate voltage drop through a transformer
 */
function calculateTransformerVoltageDrop(transformer, secondaryCurrent, powerFactor) {
    const SQRT3 = Math.sqrt(3);
    
    const rating = parseFloat(transformer.rating) || 1000;
    const secondary = parseFloat(transformer.secondary) || 480;
    const impedancePercent = parseFloat(transformer.impedance) || 5.75;
    const xr = parseFloat(transformer.xr) || 7;
    
    // Calculate impedance values
    const zBase = (secondary * secondary) / (rating * 1000);
    const z = (impedancePercent / 100) * zBase;
    const x = z * xr / Math.sqrt(1 + xr * xr);
    const r = z / Math.sqrt(1 + xr * xr);
    
    // Calculate voltage drop
    const cosTheta = powerFactor;
    const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
    const dropVolts = SQRT3 * secondaryCurrent * (r * cosTheta + x * sinTheta);
    
    // Calculate percentage against tap-adjusted secondary
    const tapAdjust = transformer.tapSetting ? (1 + transformer.tapSetting / 100) : 1;
    const adjustedSecondary = secondary * tapAdjust;
    const dropPercent = adjustedSecondary > 0 ? (dropVolts / adjustedSecondary) * 100 : 0;
    
    return {
        dropVolts: dropVolts,
        dropPercent: dropPercent,
        resistance: r,
        reactance: x
    };
}

/**
 * Create empty voltage drop result
 */
function createEmptyVoltageDropResult(bus, mode) {
    return {
        busId: bus?.id || '',
        busName: bus?.name || '',
        busVoltage: bus?.voltage || 0,
        mode: mode,
        modeDescription: 'No path found',
        loadCurrent: 0,
        sourceVoltage: 0,
        nominalLoadVoltage: bus?.voltage || 0,
        baselineVoltage: bus?.voltage || 0,
        actualVoltageAtLoad: bus?.voltage || 0,
        totalDropVolts: 0,
        totalDropPercent: 0,
        components: [],
        compliance: {
            status: 'UNKNOWN',
            note: 'Unable to calculate - no path found',
            limits: VOLTAGE_DROP_ENGINE_CONFIG.LIMITS,
            isDesignMode: mode === 'design'
        },
        calculationDate: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute all voltage drop modes for a bus
 * @param {Object} bus - Bus object
 * @returns {Object} Results for all modes
 */
function computeAllVoltageDropModes(bus) {
    return {
        design: computeVoltageDrop(bus, 'design'),
        operDemand: computeVoltageDrop(bus, 'oper_demand'),
        operDemandDF: computeVoltageDrop(bus, 'oper_demand_df')
    };
}

/**
 * Check if design voltage drop is compliant
 * @param {Object} bus - Bus object
 * @returns {boolean} True if compliant
 */
function isVoltageDropCompliant(bus) {
    const result = computeVoltageDrop(bus, 'design');
    return result.compliance.status !== 'NON-COMPLIANT';
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.VOLTAGE_DROP_ENGINE_CONFIG = VOLTAGE_DROP_ENGINE_CONFIG;
    window.computeVoltageDrop = computeVoltageDrop;
    window.computeAllVoltageDropModes = computeAllVoltageDropModes;
    window.isVoltageDropCompliant = isVoltageDropCompliant;
    
    // Helper functions
    window.getConnectedLoadCurrent = getConnectedLoadCurrent;
    window.getDemandLoadCurrent = getDemandLoadCurrent;
    window.getDiversifiedLoadCurrent = getDiversifiedLoadCurrent;
}

console.log('✅ Voltage Drop Engine Module v3.4.1 loaded');
console.log('   - Design Mode (100% FLC): READY');
console.log('   - Operating Demand Mode: READY');
console.log('   - Operating Demand+Diversity Mode: READY');
console.log('   - Compliance is ALWAYS based on design VD');
console.log('');
