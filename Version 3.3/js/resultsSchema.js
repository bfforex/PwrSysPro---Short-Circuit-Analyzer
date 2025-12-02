/**
 * Unified Results Schema Module
 * Single Source of Truth for Calculation Results
 * 
 * @author bfforex
 * @date 2025-12-02
 * @version 3.3.0
 * 
 * This module defines and documents the standard shape of calculation results
 * for each bus and for the overall project. All calculation engines and report
 * generators should read from and write to this unified schema.
 * 
 * Key Changes from Version 3.2:
 * - Centralized results structure
 * - Clear separation of design vs operating metrics
 * - Unified arc-flash sub-object
 * - Scenario support for bus-tie analysis
 * - Project-level calculation metadata
 */

console.log('🔧 Loading Unified Results Schema Module v3.3.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Schema for bus.results.shortCircuit
 * Contains all short-circuit related calculations
 */
const SHORT_CIRCUIT_SCHEMA = {
    // Fault currents
    faultCurrents: {
        threePhaseSym: 0,        // kA - Three-phase symmetrical fault current
        threePhaseAsym: 0,       // kA - Three-phase asymmetrical (peak) fault current
        lineToLine: 0,           // kA - Line-to-line fault current
        lineToGround: 0          // kA - Line-to-ground fault current
    },
    
    // System impedance at bus
    impedance: {
        rTotal: 0,               // Ω - Total resistance to bus
        xTotal: 0,               // Ω - Total reactance to bus
        zTotal: 0,               // Ω - Total impedance to bus
        xrRatio: 0               // X/R ratio at bus
    },
    
    // Motor contribution
    motorContribution: {
        totalCurrent: 0,         // kA - Total motor contribution
        motorCount: 0,           // Number of motors contributing
        decayFactor: 0           // Decay factor applied
    },
    
    // Arc flash sub-object (IEEE 1584-2018, NFPA 70E-2021)
    arcFlash: {
        incidentEnergy: 0,       // cal/cm² - Incident energy at working distance
        ppeCategory: 0,          // 0-4 PPE category
        arcFlashBoundary: 0,     // inches - Distance where IE = 1.2 cal/cm²
        clearingTime: 0,         // seconds - Protective device clearing time
        workingDistance: 18,     // inches - Working distance for calculation
        method: 'IEEE 1584-2018', // Calculation method used
        electrodeConfig: 'VCB',  // Electrode configuration
        hazardLevel: 'Low',      // Hazard level classification
        arcingCurrent: 0         // kA - Arcing fault current
    },
    
    // Calculation metadata
    calculationMethod: '',       // 'point-to-point' or 'per-unit'
    calculationSteps: '',        // Detailed calculation steps
    calculationDate: ''          // ISO timestamp
};

/**
 * Schema for bus.results.loadFlow
 * Contains all load flow related calculations
 */
const LOAD_FLOW_SCHEMA = {
    // Summary of loads at bus
    summary: {
        totalCurrent: 0,         // A - Total current at bus (connected load)
        totalKVA: 0,             // kVA - Total apparent power
        totalKW: 0,              // kW - Total real power
        powerFactor: 0.85        // Power factor
    },
    
    // Voltage drop with clear design vs operating distinction
    voltageDrop: {
        // Design voltage drop - ALWAYS based on 100% FLC (for compliance checks)
        designPercent: 0,        // % - Voltage drop at 100% full load current
        designVolts: 0,          // V - Voltage drop in volts at 100% FLC
        
        // Operating voltage drop - with demand factor only
        operDemandPercent: 0,    // % - Voltage drop with demand factor applied
        operDemandVolts: 0,      // V - Voltage drop in volts with demand
        
        // Operating voltage drop - with demand AND diversity factors
        operDemandDiversityPercent: 0,  // % - Voltage drop with demand+diversity
        operDemandDiversityVolts: 0,    // V - Voltage drop in volts with demand+diversity
        
        // Compliance (always against design values)
        compliance: {
            status: 'UNKNOWN',   // 'COMPLIANT', 'WARNING', 'NON-COMPLIANT'
            feederLimit: 3,      // % - NEC 215.2(A)(1)
            branchLimit: 5,      // % - NEC 210.19(A)
            combinedLimit: 7     // % - IEEE 141
        },
        
        // Voltage tracking
        sourceVoltage: 0,        // V - Voltage at source
        loadVoltage: 0,          // V - Voltage at load point
        nominalVoltage: 0,       // V - Nominal load voltage
        tapAdjustedNominal: 0    // V - Tap-adjusted nominal (if applicable)
    },
    
    // Demand summary with clear factor breakdown
    demandSummary: {
        connectedCurrent: 0,     // A - Total connected load current (100% FLC)
        demandCurrent: 0,        // A - Current with demand factor applied
        diversityCurrent: 0,     // A - Current with demand+diversity applied
        
        demandFactor: 1.0,       // Demand factor applied (≤ 1.0)
        diversityFactor: 1.0,    // Diversity factor applied (≥ 1.0)
        combinedFactor: 1.0,     // Combined reduction factor
        
        // Connected vs operating power
        connectedKVA: 0,         // kVA - Connected load
        demandKVA: 0,            // kVA - With demand factor
        diversityKVA: 0          // kVA - With demand+diversity
    },
    
    // Calculation flags
    demandFactorsApplied: false, // Whether demand factors were applied
    diversityFactorsApplied: false, // Whether diversity factors were applied
    calculationDate: ''          // ISO timestamp
};

/**
 * Schema for project.results
 * Contains project-wide calculation results
 */
const PROJECT_RESULTS_SCHEMA = {
    // Demand and diversity at system level
    demandAndDiversity: {
        systemLevel: {
            // Level 1: Individual substation MDs
            substations: [],     // Array of {busId, busName, md, kva, df}
            
            // Level 2: System-wide combined MD
            sumOfSubstationMDs: 0,       // A - Sum of all individual MDs
            systemDiversityFactor: 1.0,  // System-wide DF
            totalSystemMD: 0,            // A - Final system MD
            totalSystemKVA: 0,           // kVA - System apparent power
            
            // Reduction metrics
            connectedLoad: 0,            // A - Total connected load
            reductionFromConnected: 0,   // A - Reduction from connected
            reductionPercent: 0          // % - Percentage reduction
        }
    },
    
    // Calculation metadata
    calculationMeta: {
        shortCircuitVersion: '3.3.0',
        loadFlowVersion: '3.3.0',
        arcFlashVersion: '3.3.0',
        demandDiversityVersion: '3.3.0',
        lastCalculated: '',              // ISO timestamp
        calculationMethod: ''            // 'point-to-point' or 'per-unit'
    }
};

/**
 * Schema for project.scenarios
 * Supports bus-tie analysis and scenario comparison
 */
const SCENARIO_SCHEMA = {
    id: '',                      // Scenario identifier
    name: '',                    // Human-readable name
    description: '',             // Description of scenario
    
    // Bus tie state
    busTies: {},                 // {busTieId: 'open' | 'closed'}
    
    // Results for this scenario (per bus)
    busResults: {},              // {busId: {shortCircuit, loadFlow, voltageDrop}}
    
    // Scenario metadata
    isBaseline: false,           // Whether this is the baseline scenario
    createdDate: '',             // ISO timestamp
    calculatedDate: ''           // ISO timestamp
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new short circuit results object with default values
 * @returns {Object} Short circuit results object
 */
function createShortCircuitResults() {
    return JSON.parse(JSON.stringify(SHORT_CIRCUIT_SCHEMA));
}

/**
 * Create a new load flow results object with default values
 * @returns {Object} Load flow results object
 */
function createLoadFlowResults() {
    return JSON.parse(JSON.stringify(LOAD_FLOW_SCHEMA));
}

/**
 * Create a new project results object with default values
 * @returns {Object} Project results object
 */
function createProjectResults() {
    return JSON.parse(JSON.stringify(PROJECT_RESULTS_SCHEMA));
}

/**
 * Create a new scenario object with default values
 * @param {String} id - Scenario identifier
 * @param {String} name - Scenario name
 * @returns {Object} Scenario object
 */
function createScenario(id, name) {
    const scenario = JSON.parse(JSON.stringify(SCENARIO_SCHEMA));
    scenario.id = id;
    scenario.name = name;
    scenario.createdDate = new Date().toISOString();
    return scenario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate short circuit results against schema
 * @param {Object} results - Results object to validate
 * @returns {Object} {valid: boolean, errors: string[]}
 */
function validateShortCircuitResults(results) {
    const errors = [];
    
    if (!results) {
        errors.push('Results object is null or undefined');
        return { valid: false, errors };
    }
    
    // Check required fields
    if (!results.faultCurrents) {
        errors.push('Missing faultCurrents object');
    } else {
        if (typeof results.faultCurrents.threePhaseSym !== 'number') {
            errors.push('faultCurrents.threePhaseSym must be a number');
        }
    }
    
    if (!results.impedance) {
        errors.push('Missing impedance object');
    }
    
    if (!results.arcFlash) {
        errors.push('Missing arcFlash object');
    }
    
    return { valid: errors.length === 0, errors };
}

/**
 * Validate load flow results against schema
 * @param {Object} results - Results object to validate
 * @returns {Object} {valid: boolean, errors: string[]}
 */
function validateLoadFlowResults(results) {
    const errors = [];
    
    if (!results) {
        errors.push('Results object is null or undefined');
        return { valid: false, errors };
    }
    
    // Check required fields
    if (!results.summary) {
        errors.push('Missing summary object');
    }
    
    if (!results.voltageDrop) {
        errors.push('Missing voltageDrop object');
    } else {
        if (typeof results.voltageDrop.designPercent !== 'number') {
            errors.push('voltageDrop.designPercent must be a number');
        }
    }
    
    if (!results.demandSummary) {
        errors.push('Missing demandSummary object');
    }
    
    return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA MIGRATION FUNCTIONS (Convert v3.2 to v3.3 format)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Migrate bus results from v3.2 format to v3.3 unified schema
 * @param {Object} bus - Bus object with v3.2 results
 * @returns {Object} Updated bus with v3.3 results
 */
function migrateToUnifiedSchema(bus) {
    if (!bus || !bus.results) {
        console.warn('⚠️ Cannot migrate bus without results');
        return bus;
    }
    
    const oldResults = bus.results;
    
    // Create new unified results structure
    const shortCircuit = createShortCircuitResults();
    const loadFlow = createLoadFlowResults();
    
    // ─────────────────────────────────────────────────────────────────────────
    // MIGRATE SHORT CIRCUIT DATA
    // ─────────────────────────────────────────────────────────────────────────
    
    // Fault currents - check both old and new locations
    const faultCurrents = oldResults.faultCurrents || oldResults.shortCircuit?.faultCurrents || {};
    shortCircuit.faultCurrents.threePhaseSym = faultCurrents.threePhaseSym || 0;
    shortCircuit.faultCurrents.threePhaseAsym = faultCurrents.threePhaseAsym || faultCurrents.asymmetrical || 0;
    shortCircuit.faultCurrents.lineToLine = faultCurrents.lineToLine || 0;
    shortCircuit.faultCurrents.lineToGround = faultCurrents.lineToGround || 0;
    
    // Impedance
    shortCircuit.impedance.xrRatio = oldResults.xrRatio || oldResults.shortCircuit?.xrRatio || 0;
    shortCircuit.impedance.zTotal = oldResults.totalImpedance || 0;
    
    // Arc flash - use existing if present
    if (oldResults.arcFlash) {
        shortCircuit.arcFlash = { ...shortCircuit.arcFlash, ...oldResults.arcFlash };
    }
    
    shortCircuit.calculationMethod = oldResults.method || 'point-to-point';
    shortCircuit.calculationSteps = oldResults.calculationSteps || '';
    shortCircuit.calculationDate = oldResults.calculationDate || new Date().toISOString();
    
    // ─────────────────────────────────────────────────────────────────────────
    // MIGRATE LOAD FLOW DATA
    // ─────────────────────────────────────────────────────────────────────────
    
    const oldLoadFlow = oldResults.loadFlow || {};
    const oldSummary = oldLoadFlow.summary || {};
    
    loadFlow.summary.totalCurrent = oldSummary.totalCurrent || 0;
    loadFlow.summary.totalKVA = oldSummary.totalKVA || 0;
    loadFlow.summary.totalKW = oldSummary.totalKW || 0;
    loadFlow.summary.powerFactor = oldSummary.powerFactor || 0.85;
    
    // Voltage drop - migrate to new structure
    const oldVD = oldResults.voltageDrop || {};
    
    // Design voltage drop (at 100% FLC) - this is what was previously calculated
    loadFlow.voltageDrop.designPercent = oldVD.cumulativeDropPercent || oldVD.totalDropPercent || oldVD.dropPercent || 0;
    loadFlow.voltageDrop.designVolts = oldVD.cumulativeDropVolts || oldVD.totalDropVolts || oldVD.dropVolts || 0;
    
    // Operating voltage drops - initially same as design if not specified
    loadFlow.voltageDrop.operDemandPercent = oldVD.operDemandPercent || loadFlow.voltageDrop.designPercent;
    loadFlow.voltageDrop.operDemandDiversityPercent = oldVD.operDemandDiversityPercent || loadFlow.voltageDrop.designPercent;
    
    // Compliance
    loadFlow.voltageDrop.compliance.status = oldVD.compliance?.status || 'UNKNOWN';
    
    // Voltage tracking
    loadFlow.voltageDrop.sourceVoltage = oldVD.sourceVoltage || 0;
    loadFlow.voltageDrop.loadVoltage = oldVD.loadVoltage || oldVD.actualVoltageAtLoad || 0;
    loadFlow.voltageDrop.nominalVoltage = oldVD.nominalLoadVoltage || bus.voltage || 0;
    loadFlow.voltageDrop.tapAdjustedNominal = oldVD.tapAdjustedNominal || loadFlow.voltageDrop.nominalVoltage;
    
    // Demand summary
    const oldDemand = oldLoadFlow.demandSummary || {};
    loadFlow.demandSummary.connectedCurrent = oldDemand.connectedCurrent || oldSummary.totalCurrent || 0;
    loadFlow.demandSummary.demandCurrent = oldDemand.demandCurrent || loadFlow.demandSummary.connectedCurrent;
    loadFlow.demandSummary.diversityCurrent = oldDemand.diversityCurrent || loadFlow.demandSummary.demandCurrent;
    loadFlow.demandSummary.demandFactor = oldDemand.demandFactor || 1.0;
    loadFlow.demandSummary.diversityFactor = oldDemand.diversityFactor || 1.0;
    
    loadFlow.demandFactorsApplied = oldLoadFlow.demandFactorsApplied || false;
    loadFlow.diversityFactorsApplied = oldLoadFlow.diversityFactorsApplied || false;
    
    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE BUS RESULTS
    // ─────────────────────────────────────────────────────────────────────────
    
    bus.results = {
        shortCircuit: shortCircuit,
        loadFlow: loadFlow,
        
        // Keep backward compatibility aliases
        faultCurrents: shortCircuit.faultCurrents,
        xrRatio: shortCircuit.impedance.xrRatio,
        voltageDrop: {
            // Design values for backward compatibility
            cumulativeDropPercent: loadFlow.voltageDrop.designPercent,
            totalDropPercent: loadFlow.voltageDrop.designPercent,
            dropPercent: loadFlow.voltageDrop.designPercent,
            cumulativeDropVolts: loadFlow.voltageDrop.designVolts,
            totalDropVolts: loadFlow.voltageDrop.designVolts,
            compliance: loadFlow.voltageDrop.compliance,
            sourceVoltage: loadFlow.voltageDrop.sourceVoltage,
            loadVoltage: loadFlow.voltageDrop.loadVoltage,
            
            // New unified structure reference
            design: {
                percent: loadFlow.voltageDrop.designPercent,
                volts: loadFlow.voltageDrop.designVolts
            },
            operating: {
                demandPercent: loadFlow.voltageDrop.operDemandPercent,
                demandDiversityPercent: loadFlow.voltageDrop.operDemandDiversityPercent
            }
        },
        arcFlash: shortCircuit.arcFlash,
        
        // Schema version marker
        _schemaVersion: '3.3.0'
    };
    
    console.log(`✅ Migrated bus ${bus.name} to unified schema v3.3.0`);
    return bus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR ACCESSING RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get design voltage drop (always at 100% FLC - for compliance checks)
 * @param {Object} bus - Bus object
 * @returns {number} Design voltage drop percentage
 */
function getDesignVoltageDrop(bus) {
    if (!bus?.results) return 0;
    
    // Try new unified schema first
    if (bus.results.loadFlow?.voltageDrop?.designPercent !== undefined) {
        return bus.results.loadFlow.voltageDrop.designPercent;
    }
    
    // Fall back to old structure
    return bus.results.voltageDrop?.cumulativeDropPercent || 
           bus.results.voltageDrop?.totalDropPercent ||
           bus.results.voltageDrop?.dropPercent || 0;
}

/**
 * Get operating voltage drop (with demand and diversity)
 * @param {Object} bus - Bus object
 * @param {string} mode - 'demand' or 'demand_diversity'
 * @returns {number} Operating voltage drop percentage
 */
function getOperatingVoltageDrop(bus, mode = 'demand_diversity') {
    if (!bus?.results) return 0;
    
    // Try new unified schema first
    if (bus.results.loadFlow?.voltageDrop) {
        const vd = bus.results.loadFlow.voltageDrop;
        if (mode === 'demand') {
            return vd.operDemandPercent || vd.designPercent;
        }
        return vd.operDemandDiversityPercent || vd.designPercent;
    }
    
    // Fall back to design (old data doesn't have operating VD)
    return getDesignVoltageDrop(bus);
}

/**
 * Get arc flash incident energy for a bus
 * @param {Object} bus - Bus object
 * @returns {number} Incident energy in cal/cm²
 */
function getIncidentEnergy(bus) {
    if (!bus?.results) return 0;
    
    // Try new unified schema
    if (bus.results.shortCircuit?.arcFlash?.incidentEnergy !== undefined) {
        return bus.results.shortCircuit.arcFlash.incidentEnergy;
    }
    
    // Try old structure
    return bus.results.arcFlash?.incidentEnergy || 0;
}

/**
 * Get PPE category for a bus
 * @param {Object} bus - Bus object
 * @returns {number} PPE category (0-4)
 */
function getPPECategory(bus) {
    if (!bus?.results) return 0;
    
    // Try new unified schema
    if (bus.results.shortCircuit?.arcFlash?.ppeCategory !== undefined) {
        return bus.results.shortCircuit.arcFlash.ppeCategory;
    }
    
    // Try old structure
    return bus.results.arcFlash?.ppeCategory || 0;
}

/**
 * Get fault current for a bus
 * @param {Object} bus - Bus object
 * @param {string} type - 'threePhaseSym', 'threePhaseAsym', 'lineToLine', 'lineToGround'
 * @returns {number} Fault current in kA
 */
function getFaultCurrent(bus, type = 'threePhaseSym') {
    if (!bus?.results) return 0;
    
    // Try new unified schema
    if (bus.results.shortCircuit?.faultCurrents?.[type] !== undefined) {
        return bus.results.shortCircuit.faultCurrents[type];
    }
    
    // Try old structures
    return bus.results.faultCurrents?.[type] || 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    // Schema definitions
    window.SHORT_CIRCUIT_SCHEMA = SHORT_CIRCUIT_SCHEMA;
    window.LOAD_FLOW_SCHEMA = LOAD_FLOW_SCHEMA;
    window.PROJECT_RESULTS_SCHEMA = PROJECT_RESULTS_SCHEMA;
    window.SCENARIO_SCHEMA = SCENARIO_SCHEMA;
    
    // Factory functions
    window.createShortCircuitResults = createShortCircuitResults;
    window.createLoadFlowResults = createLoadFlowResults;
    window.createProjectResults = createProjectResults;
    window.createScenario = createScenario;
    
    // Validation functions
    window.validateShortCircuitResults = validateShortCircuitResults;
    window.validateLoadFlowResults = validateLoadFlowResults;
    
    // Migration functions
    window.migrateToUnifiedSchema = migrateToUnifiedSchema;
    
    // Helper functions
    window.getDesignVoltageDrop = getDesignVoltageDrop;
    window.getOperatingVoltageDrop = getOperatingVoltageDrop;
    window.getIncidentEnergy = getIncidentEnergy;
    window.getPPECategory = getPPECategory;
    window.getFaultCurrent = getFaultCurrent;
}

console.log('✅ Unified Results Schema Module v3.3.0 loaded');
console.log('   - Short Circuit Schema: DEFINED');
console.log('   - Load Flow Schema: DEFINED');
console.log('   - Project Results Schema: DEFINED');
console.log('   - Scenario Schema: DEFINED');
console.log('   - Migration Functions: READY');
console.log('   - Helper Functions: READY');
console.log('');
