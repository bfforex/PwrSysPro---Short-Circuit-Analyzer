/**
 * Unified Results Schema Module
 * Single Source of Truth for Calculation Results
 *
 * @author bfforex
 * @date 2025-12-02
 * @version 3.3.1
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
 *
 * Key Changes from Version 3.3.1:
 * - Adds protection schema factory wrapper: createProtectionResultsObject()
 * - Preserves / initializes bus.results.protection during migration
 */
console.log('🔧 Loading Unified Results Schema Module v3.3.1...');

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
    threePhaseSym: 0, // kA - Three-phase symmetrical fault current
    threePhaseAsym: 0, // kA - Three-phase asymmetrical (peak) fault current
    lineToLine: 0, // kA - Line-to-line fault current
    lineToGround: 0 // kA - Line-to-ground fault current
  },

  // System impedance at bus
  impedance: {
    rTotal: 0, // Ω - Total resistance to bus
    xTotal: 0, // Ω - Total reactance to bus
    zTotal: 0, // Ω - Total impedance to bus
    xrRatio: 0 // X/R ratio at bus
  },

  // Motor contribution
  motorContribution: {
    totalCurrent: 0, // kA - Total motor contribution
    motorCount: 0, // Number of motors contributing
    decayFactor: 0 // Decay factor applied
  },

  // Arc flash sub-object (IEEE 1584-2018, NFPA 70E-2021)
  arcFlash: {
    incidentEnergy: 0, // cal/cm² - Incident energy at working distance
    ppeCategory: 0, // 0-4 PPE category
    arcFlashBoundary: 0, // inches - Distance where IE = 1.2 cal/cm²
    clearingTime: 0, // seconds - Protective device clearing time
    workingDistance: 18, // inches - Working distance for calculation
    method: 'IEEE 1584-2018',
    electrodeConfig: 'VCB',
    hazardLevel: 'Low',
    arcingCurrent: 0 // kA - Arcing fault current
  },

  // Calculation metadata
  calculationMethod: '', // 'point-to-point' or 'per-unit' or 'iec-60909'
  calculationSteps: '', // Detailed calculation steps
  calculationDate: '' // ISO timestamp
};

/**
 * Schema for bus.results.loadFlow
 * Contains all load flow related calculations
 */
const LOAD_FLOW_SCHEMA = {
  // Summary of loads at bus
  summary: {
    totalCurrent: 0, // A - Total current at bus (connected load)

    // ✅ Canonical names used by engine (loadFlowCalc.js):
    totalPowerKVA: 0, // kVA - Total apparent power
    totalPowerKW: 0, // kW - Total real power

    // ✅ Backward compatible aliases:
    totalKVA: 0, // kVA - alias of totalPowerKVA
    totalKW: 0, // kW - alias of totalPowerKW

    powerFactor: 0.85 // Power factor
  },

  // Voltage drop with clear design vs operating distinction
  voltageDrop: {
    // Design voltage drop - ALWAYS based on 100% FLC (for compliance checks)
    designPercent: 0, // % - Voltage drop at 100% full load current
    designVolts: 0, // V - Voltage drop in volts at 100% FLC

    // Operating voltage drop - with demand factor only
    operDemandPercent: 0, // %
    operDemandVolts: 0, // V

    // Operating voltage drop - with demand AND diversity factors
    operDemandDiversityPercent: 0, // %
    operDemandDiversityVolts: 0, // V

    // Compliance (always against design values)
    compliance: {
      status: 'UNKNOWN', // 'COMPLIANT', 'WARNING', 'NON-COMPLIANT'
      feederLimit: 3, // %
      branchLimit: 5, // %
      combinedLimit: 7 // %
    },

    // Voltage tracking
    sourceVoltage: 0, // V
    loadVoltage: 0, // V
    nominalVoltage: 0, // V
    tapAdjustedNominal: 0 // V
  },

  // Demand summary with clear factor breakdown
  demandSummary: {
    connectedCurrent: 0, // A - Total connected load current (100% FLC)
    demandCurrent: 0, // A - Current with demand factor applied
    diversityCurrent: 0, // A - Current with demand+diversity applied
    demandFactor: 1.0, // ≤ 1.0
    diversityFactor: 1.0, // ≥ 1.0
    combinedFactor: 1.0,
    connectedKVA: 0, // kVA - Connected load
    demandKVA: 0, // kVA - With demand factor
    diversityKVA: 0 // kVA - With demand+diversity
  },

  // Calculation flags
  demandFactorsApplied: false,
  diversityFactorsApplied: false,
  calculationDate: ''
};

/**
 * Schema for bus.results.protection
 * Contains protection adequacy, clearing device, and future coordination data
 */
const PROTECTION_SCHEMA = {
  adequacy: {
    evaluated: false,
    primaryDeviceId: null,
    devices: []
  },

  coordination: {
    evaluated: false,
    coordinationPairs: [],
    selectivityStatus: 'UNKNOWN'
  },

  relayOperation: {
    evaluated: false,
    operations: []
  },

  clearing: {
    clearingDeviceId: null,
    clearingDeviceType: null,
    clearingTimeSec: null,
    clearingTimeCycles: null,
    basis: ''
  },

  recommendations: [],
  calculationDate: '',
  calculationMethod: '',
  calculationSteps: ''
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
      substations: [],

      // Level 2: System-wide combined MD
      sumOfSubstationMDs: 0,
      systemDiversityFactor: 1.0,
      totalSystemMD: 0,
      totalSystemKVA: 0,

      // Reduction metrics
      connectedLoad: 0,
      reductionFromConnected: 0,
      reductionPercent: 0
    }
  },

  // Calculation metadata
  calculationMeta: {
    shortCircuitVersion: '3.3.1',
    loadFlowVersion: '3.3.1',
    arcFlashVersion: '3.3.1',
    demandDiversityVersion: '3.3.1',
    protectionVersion: '3.3.1',
    lastCalculated: '',
    calculationMethod: ''
  }
};

/**
 * Schema for project.scenarios
 * Supports bus-tie analysis and scenario comparison
 */
const SCENARIO_SCHEMA = {
  id: '',
  name: '',
  description: '',
  busTies: {}, // {busTieId: 'open' | 'closed'}
  busResults: {}, // {busId: {shortCircuit, loadFlow, protection, voltageDrop}}
  isBaseline: false,
  createdDate: '',
  calculatedDate: ''
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createShortCircuitResults() {
  return JSON.parse(JSON.stringify(SHORT_CIRCUIT_SCHEMA));
}

function createLoadFlowResults() {
  return JSON.parse(JSON.stringify(LOAD_FLOW_SCHEMA));
}

/**
 * Create a protection results object.
 * If protectionSchema.js is loaded, prefer its canonical factory.
 */
function createProtectionResultsObject() {
  if (typeof createProtectionResults === 'function') {
    try {
      return createProtectionResults();
    } catch (_) {
      // Fall through to local schema clone
    }
  }
  return JSON.parse(JSON.stringify(PROTECTION_SCHEMA));
}

function createProjectResults() {
  return JSON.parse(JSON.stringify(PROJECT_RESULTS_SCHEMA));
}

function createScenario(id, name) {
  const scenario = JSON.parse(JSON.stringify(SCENARIO_SCHEMA));
  scenario.id = id;
  scenario.name = name;
  scenario.createdDate = new Date().toISOString();
  return scenario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize load flow summary power fields so both pairs are in sync.
 * Ensures summary.totalKVA/totalKW mirror summary.totalPowerKVA/totalPowerKW.
 */
function normalizeLoadFlowSummary(summary) {
  if (!summary) return;

  if (typeof summary.totalPowerKVA === 'number') {
    summary.totalKVA = summary.totalPowerKVA;
  } else if (typeof summary.totalKVA === 'number') {
    summary.totalPowerKVA = summary.totalKVA;
  }

  if (typeof summary.totalPowerKW === 'number') {
    summary.totalKW = summary.totalPowerKW;
  } else if (typeof summary.totalKW === 'number') {
    summary.totalPowerKW = summary.totalKW;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function validateShortCircuitResults(results) {
  const errors = [];

  if (!results) {
    errors.push('Results object is null or undefined');
    return { valid: false, errors };
  }

  if (!results.faultCurrents) {
    errors.push('Missing faultCurrents object');
  } else {
    if (typeof results.faultCurrents.threePhaseSym !== 'number') {
      errors.push('faultCurrents.threePhaseSym must be a number');
    }
  }

  if (!results.impedance) errors.push('Missing impedance object');
  if (!results.arcFlash) errors.push('Missing arcFlash object');

  return { valid: errors.length === 0, errors };
}

function validateLoadFlowResults(results) {
  const errors = [];

  if (!results) {
    errors.push('Results object is null or undefined');
    return { valid: false, errors };
  }

  if (!results.summary) errors.push('Missing summary object');

  if (!results.voltageDrop) {
    errors.push('Missing voltageDrop object');
  } else {
    if (typeof results.voltageDrop.designPercent !== 'number') {
      errors.push('voltageDrop.designPercent must be a number');
    }
  }

  if (!results.demandSummary) errors.push('Missing demandSummary object');

  return { valid: errors.length === 0, errors };
}

function validateProtectionResultsObject(results) {
  const errors = [];

  if (!results) {
    errors.push('Results object is null or undefined');
    return { valid: false, errors };
  }

  if (!results.adequacy) errors.push('Missing adequacy object');
  if (!results.coordination) errors.push('Missing coordination object');
  if (!results.relayOperation) errors.push('Missing relayOperation object');
  if (!results.clearing) errors.push('Missing clearing object');

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA MIGRATION FUNCTIONS (Convert v3.2 to v3.3+ format)
// ═══════════════════════════════════════════════════════════════════════════════

function migrateToUnifiedSchema(bus) {
  if (!bus || !bus.results) {
    console.warn('⚠️ Cannot migrate bus without results');
    return bus;
  }

  const oldResults = bus.results;

  // Create new unified results structure
  const shortCircuit = createShortCircuitResults();
  const loadFlow = createLoadFlowResults();
  const protection = createProtectionResultsObject();

  // ─────────────────────────────────────────────────────────────────────────
  // MIGRATE SHORT CIRCUIT DATA
  // ─────────────────────────────────────────────────────────────────────────
  const faultCurrents = oldResults.faultCurrents || oldResults.shortCircuit?.faultCurrents || {};

  shortCircuit.faultCurrents.threePhaseSym = faultCurrents.threePhaseSym || 0;
  shortCircuit.faultCurrents.threePhaseAsym = faultCurrents.threePhaseAsym || faultCurrents.asymmetrical || 0;
  shortCircuit.faultCurrents.lineToLine = faultCurrents.lineToLine || 0;
  shortCircuit.faultCurrents.lineToGround = faultCurrents.lineToGround || 0;

  shortCircuit.impedance.xrRatio = oldResults.xrRatio || oldResults.shortCircuit?.xrRatio || 0;
  shortCircuit.impedance.zTotal = oldResults.totalImpedance || oldResults.shortCircuit?.totalImpedance?.magnitude || 0;

  if (oldResults.arcFlash) {
    shortCircuit.arcFlash = { ...shortCircuit.arcFlash, ...oldResults.arcFlash };
  }

  shortCircuit.calculationMethod = oldResults.method || oldResults.shortCircuit?.calculationMethod || 'point-to-point';
  shortCircuit.calculationSteps = oldResults.calculationSteps || oldResults.shortCircuit?.calculationSteps || '';
  shortCircuit.calculationDate = oldResults.calculationDate || oldResults.shortCircuit?.calculationDate || new Date().toISOString();

  // ─────────────────────────────────────────────────────────────────────────
  // MIGRATE LOAD FLOW DATA
  // ─────────────────────────────────────────────────────────────────────────
  const oldLoadFlow = oldResults.loadFlow || {};
  const oldSummary = oldLoadFlow.summary || {};

  loadFlow.summary.totalCurrent = oldSummary.totalCurrent || 0;
  loadFlow.summary.totalPowerKVA = (oldSummary.totalPowerKVA ?? oldSummary.totalKVA ?? 0);
  loadFlow.summary.totalPowerKW = (oldSummary.totalPowerKW ?? oldSummary.totalKW ?? 0);
  loadFlow.summary.totalKVA = loadFlow.summary.totalPowerKVA;
  loadFlow.summary.totalKW = loadFlow.summary.totalPowerKW;
  loadFlow.summary.powerFactor = oldSummary.powerFactor || 0.85;
  normalizeLoadFlowSummary(loadFlow.summary);

  const oldVD = oldResults.voltageDrop || {};
  loadFlow.voltageDrop.designPercent = oldVD.cumulativeDropPercent ?? oldVD.totalDropPercent ?? oldVD.dropPercent ?? 0;
  loadFlow.voltageDrop.designVolts = oldVD.cumulativeDropVolts ?? oldVD.totalDropVolts ?? oldVD.dropVolts ?? 0;
  loadFlow.voltageDrop.operDemandPercent = oldVD.operDemandPercent ?? loadFlow.voltageDrop.designPercent;
  loadFlow.voltageDrop.operDemandDiversityPercent = oldVD.operDemandDiversityPercent ?? loadFlow.voltageDrop.designPercent;
  loadFlow.voltageDrop.compliance.status = oldVD.compliance?.status || 'UNKNOWN';
  loadFlow.voltageDrop.sourceVoltage = oldVD.sourceVoltage || 0;
  loadFlow.voltageDrop.loadVoltage = oldVD.loadVoltage || oldVD.actualVoltageAtLoad || 0;
  loadFlow.voltageDrop.nominalVoltage = oldVD.nominalLoadVoltage || bus.voltage || 0;
  loadFlow.voltageDrop.tapAdjustedNominal = oldVD.tapAdjustedNominal || loadFlow.voltageDrop.nominalVoltage;

  const oldDemand = oldLoadFlow.demandSummary || {};
  loadFlow.demandSummary.connectedCurrent = oldDemand.connectedCurrent || oldSummary.totalCurrent || 0;
  loadFlow.demandSummary.demandCurrent = oldDemand.demandCurrent || loadFlow.demandSummary.connectedCurrent;
  loadFlow.demandSummary.diversityCurrent = oldDemand.diversityCurrent || loadFlow.demandSummary.demandCurrent;
  loadFlow.demandSummary.demandFactor = oldDemand.demandFactor || 1.0;
  loadFlow.demandSummary.diversityFactor = oldDemand.diversityFactor || 1.0;
  loadFlow.demandFactorsApplied = oldLoadFlow.demandFactorsApplied || false;
  loadFlow.diversityFactorsApplied = oldLoadFlow.diversityFactorsApplied || false;
  loadFlow.calculationDate = oldLoadFlow.calculationDate || new Date().toISOString();

  // ─────────────────────────────────────────────────────────────────────────
  // MIGRATE PROTECTION DATA
  // ─────────────────────────────────────────────────────────────────────────
  if (oldResults.protection) {
    protection.adequacy = { ...protection.adequacy, ...(oldResults.protection.adequacy || {}) };
    protection.coordination = { ...protection.coordination, ...(oldResults.protection.coordination || {}) };
    protection.relayOperation = { ...protection.relayOperation, ...(oldResults.protection.relayOperation || {}) };
    protection.clearing = { ...protection.clearing, ...(oldResults.protection.clearing || {}) };
    protection.recommendations = Array.isArray(oldResults.protection.recommendations)
      ? oldResults.protection.recommendations
      : [];
    protection.calculationDate = oldResults.protection.calculationDate || new Date().toISOString();
    protection.calculationMethod = oldResults.protection.calculationMethod || '';
    protection.calculationSteps = oldResults.protection.calculationSteps || '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE BUS RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  bus.results = {
    shortCircuit,
    loadFlow,
    protection,

    // Backward compatibility aliases
    faultCurrents: shortCircuit.faultCurrents,
    xrRatio: shortCircuit.impedance.xrRatio,
    voltageDrop: {
      cumulativeDropPercent: loadFlow.voltageDrop.designPercent,
      totalDropPercent: loadFlow.voltageDrop.designPercent,
      dropPercent: loadFlow.voltageDrop.designPercent,
      cumulativeDropVolts: loadFlow.voltageDrop.designVolts,
      totalDropVolts: loadFlow.voltageDrop.designVolts,
      compliance: loadFlow.voltageDrop.compliance,
      sourceVoltage: loadFlow.voltageDrop.sourceVoltage,
      loadVoltage: loadFlow.voltageDrop.loadVoltage,
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
    _schemaVersion: '3.3.1'
  };

  console.log(`✅ Migrated bus ${bus.name} to unified schema v3.3.1`);
  return bus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR ACCESSING RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

function getDesignVoltageDrop(bus) {
  if (!bus?.results) return 0;
  if (bus.results.loadFlow?.voltageDrop?.designPercent !== undefined) {
    return bus.results.loadFlow.voltageDrop.designPercent;
  }
  return (
    bus.results.voltageDrop?.cumulativeDropPercent ??
    bus.results.voltageDrop?.totalDropPercent ??
    bus.results.voltageDrop?.dropPercent ??
    0
  );
}

function getOperatingVoltageDrop(bus, mode = 'demand_diversity') {
  if (!bus?.results) return 0;
  if (bus.results.loadFlow?.voltageDrop) {
    const vd = bus.results.loadFlow.voltageDrop;
    if (mode === 'demand') {
      return vd.operDemandPercent ?? vd.designPercent;
    }
    return vd.operDemandDiversityPercent ?? vd.designPercent;
  }
  return getDesignVoltageDrop(bus);
}

function getIncidentEnergy(bus) {
  if (!bus?.results) return 0;
  if (bus.results.shortCircuit?.arcFlash?.incidentEnergy !== undefined) {
    return bus.results.shortCircuit.arcFlash.incidentEnergy;
  }
  return bus.results.arcFlash?.incidentEnergy ?? 0;
}

function getPPECategory(bus) {
  if (!bus?.results) return 0;
  if (bus.results.shortCircuit?.arcFlash?.ppeCategory !== undefined) {
    return bus.results.shortCircuit.arcFlash.ppeCategory;
  }
  return bus.results.arcFlash?.ppeCategory ?? 0;
}

function getFaultCurrent(bus, type = 'threePhaseSym') {
  if (!bus?.results) return 0;
  if (bus.results.shortCircuit?.faultCurrents?.[type] !== undefined) {
    return bus.results.shortCircuit.faultCurrents[type];
  }
  return bus.results.faultCurrents?.[type] ?? 0;
}

function getProtectionResults(bus) {
  if (!bus?.results) return null;
  return bus.results.protection || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  // Schema definitions
  window.SHORT_CIRCUIT_SCHEMA = SHORT_CIRCUIT_SCHEMA;
  window.LOAD_FLOW_SCHEMA = LOAD_FLOW_SCHEMA;
  window.PROTECTION_SCHEMA = PROTECTION_SCHEMA;
  window.PROJECT_RESULTS_SCHEMA = PROJECT_RESULTS_SCHEMA;
  window.SCENARIO_SCHEMA = SCENARIO_SCHEMA;

  // Factory functions
  window.createShortCircuitResults = createShortCircuitResults;
  window.createLoadFlowResults = createLoadFlowResults;
  window.createProtectionResultsObject = createProtectionResultsObject;
  window.createProjectResults = createProjectResults;
  window.createScenario = createScenario;

  // Validation functions
  window.validateShortCircuitResults = validateShortCircuitResults;
  window.validateLoadFlowResults = validateLoadFlowResults;
  window.validateProtectionResultsObject = validateProtectionResultsObject;

  // Migration functions
  window.migrateToUnifiedSchema = migrateToUnifiedSchema;

  // Helper functions
  window.getDesignVoltageDrop = getDesignVoltageDrop;
  window.getOperatingVoltageDrop = getOperatingVoltageDrop;
  window.getIncidentEnergy = getIncidentEnergy;
  window.getPPECategory = getPPECategory;
  window.getFaultCurrent = getFaultCurrent;
  window.getProtectionResults = getProtectionResults;
  window.normalizeLoadFlowSummary = normalizeLoadFlowSummary;
}

console.log('✅ Unified Results Schema Module v3.3.1 loaded');
console.log(' - Short Circuit Schema: DEFINED');
console.log(' - Load Flow Schema: DEFINED');
console.log(' - Protection Schema: DEFINED');
console.log(' - Project Results Schema: DEFINED');
console.log(' - Scenario Schema: DEFINED');
console.log(' - Migration Functions: READY');
console.log(' - Helper Functions: READY');
console.log('');