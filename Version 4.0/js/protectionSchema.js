/**
 * Protection Schema Module
 * PwrSys Pro - Protection Device Data Model
 *
 * Defines protection-related asset schemas, association schemas, and
 * results schemas for integration with the existing buses/components model
 * and bus.results analysis structure.
 *
 * Design intent:
 * - Breakers and fuses may be stored as normal series components in the
 *   global `components` collection (fromBus/toBus topology)
 * - Relays, CTs, and VTs may be linked to breakers, buses, transformers,
 *   feeders, motors, generators, or protection zones
 * - Protection study results are intended to live under bus.results.protection
 *
 * @author M365 Copilot for Engr. B. P. Faraon
 * @date 2026-03-04
 * @version 1.0.0
 */

console.log('🔧 Loading Protection Schema Module v1.0.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON ENUM / CONSTANT SETS
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTION_DEVICE_TYPES = Object.freeze({
  BREAKER: 'breaker',
  FUSE: 'fuse',
  RELAY: 'relay',
  CT: 'ct',
  VT: 'vt'
});

const PROTECTION_DEVICE_STATUS = Object.freeze({
  ACTIVE: 'active',
  SPARE: 'spare',
  OUT_OF_SERVICE: 'out-of-service',
  FUTURE: 'future'
});

const BREAKER_CLASSES = Object.freeze({
  MCB: 'MCB',
  MCCB: 'MCCB',
  ACB: 'ACB',
  VCB: 'VCB',
  SF6: 'SF6',
  GIS: 'GIS',
  RECLOSER: 'RECLOSER',
  SWITCH_FUSE: 'SWITCH_FUSE'
});

const FUSE_CLASSES = Object.freeze({
  HRC: 'HRC',
  CURRENT_LIMITING: 'CURRENT_LIMITING',
  EXPULSION: 'EXPULSION',
  POWER_FUSE: 'POWER_FUSE',
  BRANCH_FUSE: 'BRANCH_FUSE'
});

const RELAY_FAMILIES = Object.freeze({
  NUMERICAL: 'numerical',
  ELECTROMECHANICAL: 'electromechanical',
  SOLID_STATE: 'solid-state'
});

const TRIP_UNIT_TYPES = Object.freeze({
  THERMAL_MAGNETIC: 'thermal-magnetic',
  ELECTRONIC: 'electronic',
  RELAY_CONTROLLED: 'relay-controlled',
  FIXED: 'fixed'
});

const PROTECTION_ZONE_TYPES = Object.freeze({
  FEEDER: 'feeder',
  TRANSFORMER: 'transformer',
  BUS: 'bus',
  MOTOR: 'motor',
  GENERATOR: 'generator',
  INCOMER: 'incomer',
  TIE: 'tie',
  PANEL: 'panel',
  LOAD_CENTER: 'load-center'
});

const PROTECTION_ASSOCIATION_TYPES = Object.freeze({
  PROTECTS_BUS: 'protects-bus',
  PROTECTS_FEEDER: 'protects-feeder',
  PROTECTS_TRANSFORMER: 'protects-transformer',
  PROTECTS_MOTOR: 'protects-motor',
  PROTECTS_GENERATOR: 'protects-generator',
  PRIMARY_FOR: 'primary-for',
  BACKUP_FOR: 'backup-for',
  MONITORS: 'monitors'
});

const PROTECTION_RESULT_STATUS = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  PASS: 'PASS',
  MARGINAL: 'MARGINAL',
  FAIL: 'FAIL',
  NOT_APPLICABLE: 'NOT-APPLICABLE',
  COORDINATED: 'COORDINATED',
  MISCOORDINATED: 'MISCOORDINATED'
});

const RELAY_DEVICE_FUNCTIONS = Object.freeze([
  '50', '51', '50N', '51N', '50G', '51G',
  '67', '67N', '27', '59', '49', '46', '47',
  '81O', '81U', '87T', '87B', '87G', '86',
  '25', '79', '74', '32', '24', '64', '63'
]);

const CURVE_FAMILIES = Object.freeze({
  IEC_NORMAL_INVERSE: 'IEC_NormalInverse',
  IEC_VERY_INVERSE: 'IEC_VeryInverse',
  IEC_EXTREMELY_INVERSE: 'IEC_ExtremelyInverse',
  ANSI_MODERATELY_INVERSE: 'ANSI_ModeratelyInverse',
  ANSI_VERY_INVERSE: 'ANSI_VeryInverse',
  ANSI_EXTREMELY_INVERSE: 'ANSI_ExtremelyInverse',
  DEFINITE_TIME: 'DefiniteTime',
  USER_DEFINED: 'UserDefined'
});

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isoNow() {
  return new Date().toISOString();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DEVICE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTION_DEVICE_BASE = {
  id: '',
  tag: '',
  name: '',
  type: '',
  status: PROTECTION_DEVICE_STATUS.ACTIVE,

  voltage: 0,
  frequencyHz: 60,
  phases: 3,

  // Series-device topology (used by breakers/fuses where applicable)
  fromBus: null,
  toBus: null,

  // Non-series device mounting / location
  locationBusId: null,
  mountedOnComponentId: null,

  description: '',
  manufacturer: '',
  model: '',
  standard: '',
  notes: '',

  metadata: {
    createdDate: '',
    modifiedDate: '',
    source: '' // user | imported | template | generated
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const BREAKER_SCHEMA = {
  ...PROTECTION_DEVICE_BASE,
  type: PROTECTION_DEVICE_TYPES.BREAKER,

  breakerClass: BREAKER_CLASSES.MCCB,
  frameSizeA: 0,
  continuousAmpRating: 0,
  sensorRatingA: 0,
  poles: 3,

  interruptingRatingSymKA: 0,
  interruptingRatingAsymKA: 0,
  momentaryRatingKA: 0,
  closeLatchRatingKA: 0,
  shortTimeWithstandKA: 0,
  shortTimeWithstandSec: 0,

  insulationClassKV: 0,
  BILkV: 0,

  tripUnitType: TRIP_UNIT_TYPES.ELECTRONIC,
  curveFamily: '',
  curveId: '',

  settings: {
    longTimePickupA: null,
    longTimeDelaySec: null,
    shortTimePickupA: null,
    shortTimeDelaySec: null,
    instantaneousPickupA: null,
    groundFaultPickupA: null,
    groundFaultDelaySec: null,
    zoneSelectiveInterlock: false
  },

  control: {
    relayId: null,
    ctSetId: null,
    vtSetId: null,
    controlPower: '',
    breakerFailureScheme: false,
    remoteTripEnabled: false,
    reclosingEnabled: false
  },

  protectedElementIds: [],
  parentLineupId: null,
  coordinationGroup: null
};

const FUSE_SCHEMA = {
  ...PROTECTION_DEVICE_BASE,
  type: PROTECTION_DEVICE_TYPES.FUSE,

  fuseClass: FUSE_CLASSES.HRC,
  ampereRating: 0,
  voltageClassV: 0,
  interruptingRatingKA: 0,

  speedClass: '',
  curveId: '',
  minimumMeltingCurveId: '',
  totalClearingCurveId: '',

  application: {
    currentLimiting: false,
    transformerPrimaryProtection: false,
    motorCircuitProtection: false,
    capacitorProtection: false,
    controlPowerProtection: false
  },

  protectedElementIds: [],
  coordinationGroup: null
};

const RELAY_SCHEMA = {
  ...PROTECTION_DEVICE_BASE,
  type: PROTECTION_DEVICE_TYPES.RELAY,

  relayFamily: RELAY_FAMILIES.NUMERICAL,
  firmwareVersion: '',

  controlledBreakerId: null,
  monitoredBusId: null,
  monitoredComponentId: null,
  protectedZoneId: null,

  deviceFunctions: [],
  ctSetId: null,
  vtSetId: null,

  settings: {
    phaseInstantaneous: {
      enabled: false,
      pickupA: null,
      delaySec: 0
    },
    phaseTimeOvercurrent: {
      enabled: false,
      pickupA: null,
      curveType: '',
      timeDial: null,
      timeMultiplier: null
    },
    groundInstantaneous: {
      enabled: false,
      pickupA: null,
      delaySec: 0
    },
    groundTimeOvercurrent: {
      enabled: false,
      pickupA: null,
      curveType: '',
      timeDial: null,
      timeMultiplier: null
    },
    directional: {
      enabled: false,
      characteristicAngleDeg: null
    },
    differential: {
      enabled: false,
      slope1: null,
      slope2: null,
      pickupA: null
    },
    thermal: {
      enabled: false,
      pickupA: null,
      timeConstantMin: null
    },
    underVoltage: {
      enabled: false,
      pickupPU: null,
      delaySec: null
    },
    overVoltage: {
      enabled: false,
      pickupPU: null,
      delaySec: null
    },
    frequency: {
      enabled: false,
      overHz: null,
      underHz: null,
      delaySec: null
    }
  },

  logic: {
    breakerFailureEnabled: false,
    reclosingEnabled: false,
    syncCheckEnabled: false,
    intertrippingEnabled: false,
    lockoutRelayEnabled: false
  },

  coordinationGroup: null
};

const CT_SCHEMA = {
  ...PROTECTION_DEVICE_BASE,
  type: PROTECTION_DEVICE_TYPES.CT,

  ratioPrimaryA: 0,
  ratioSecondaryA: 5,
  accuracyClass: '',
  burdenVA: 0,
  saturationClass: '',
  kneePointVoltage: null,

  associatedRelayIds: [],
  associatedBreakerId: null,
  mountedAtBusId: null,
  mountedOnComponentId: null
};

const VT_SCHEMA = {
  ...PROTECTION_DEVICE_BASE,
  type: PROTECTION_DEVICE_TYPES.VT,

  ratioPrimaryV: 0,
  ratioSecondaryV: 110,
  accuracyClass: '',
  burdenVA: 0,

  associatedRelayIds: [],
  mountedAtBusId: null,
  mountedOnComponentId: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASSOCIATION / ZONE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTION_ZONE_SCHEMA = {
  id: '',
  tag: '',
  name: '',

  zoneType: PROTECTION_ZONE_TYPES.FEEDER,
  primaryDeviceId: null,
  backupDeviceIds: [],

  protectedBusIds: [],
  protectedComponentIds: [],

  relayIds: [],
  ctSetIds: [],
  vtSetIds: [],

  parentZoneId: null,
  description: ''
};

const PROTECTION_ASSOCIATION_SCHEMA = {
  id: '',
  primaryDeviceId: null,
  backupDeviceIds: [],

  busId: null,
  componentId: null,
  relayId: null,

  associationType: PROTECTION_ASSOCIATION_TYPES.PROTECTS_FEEDER,
  notes: ''
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const PROTECTION_DEVICE_ADEQUACY_RESULT = {
 deviceId: '',
 deviceType: '',
 deviceLabel: '',
 deviceTag: '',
 deviceName: '',
 fromBusName: '',
 toBusName: '',
 evaluatedAtBusId: '',
 voltage: 0,
 duties: {
  threePhaseSymKA: 0,
  threePhaseAsymKA: 0,
  peakKA: 0,
  lineToGroundKA: 0,
  lineToLineKA: 0,
  doubleLineToGroundKA: 0
 },
 ratings: {
  interruptingSymKA: null,
  interruptingAsymKA: null,
  momentaryKA: null,
  closeLatchKA: null,
  continuousA: null
 },
 utilizationPercent: {
  interrupting: null,
  momentary: null,
  continuous: null
 },
 status: PROTECTION_RESULT_STATUS.UNKNOWN,
 limitingCriterion: '',
 notes: ''
};

const PROTECTION_COORDINATION_RESULT = {
  primaryDeviceId: '',
  primaryDeviceType: '',
  primaryDeviceLabel: '',
  primaryDeviceTag: '',
  primaryDeviceName: '',

  backupDeviceId: '',
  backupDeviceType: '',
  backupDeviceLabel: '',
  backupDeviceTag: '',
  backupDeviceName: '',

  faultAtBusId: '',
  faultType: '',

  primaryOperateTimeSec: null,
  backupOperateTimeSec: null,
  timeMarginSec: null,
  requiredMarginSec: null,

  selectivityStatus: PROTECTION_RESULT_STATUS.UNKNOWN,
  status: PROTECTION_RESULT_STATUS.UNKNOWN,

  limitingCriterion: '',
  notes: ''
};


const RELAY_OPERATION_RESULT = {
  relayId: '',
  breakerId: null,
  faultAtBusId: '',
  faultType: '',

  inputCurrentA: 0,
  pickupA: null,
  curveType: '',
  timeDial: null,
  timeMultiplier: null,

  operateTimeSec: null,
  operated: false,
  blocked: false,

  notes: ''
};

const PROTECTION_RESULTS_SCHEMA = {
 adequacy: {
  evaluated: false,
  primaryDeviceId: null,
  primaryDeviceLabel: null,
  devices: []
 },
 coordination: {
  evaluated: false,
  coordinationPairs: [],
  selectivityStatus: PROTECTION_RESULT_STATUS.UNKNOWN
 },
 relayOperation: {
  evaluated: false,
  operations: []
 },
 clearing: {
  clearingDeviceId: null,
  clearingDeviceType: null,
  clearingDeviceLabel: null,
  clearingDeviceTag: null,
  clearingDeviceName: null,
  clearingTimeSec: null,
  clearingTimeCycles: null,
  reason: '',
  basis: ''
 },
 duties: {
  threePhaseSymKA: 0,
  threePhaseAsymKA: 0,
  peakKA: 0,
  lineToGroundKA: 0,
  lineToLineKA: 0,
  doubleLineToGroundKA: 0
 },
 loadCurrentA: 0,
 overallStatus: PROTECTION_RESULT_STATUS.UNKNOWN,
 recommendations: [],
 calculationDate: '',
 calculationMethod: '',
 calculationSteps: ''
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getProtectionDeviceSchema(deviceType) {
  switch (String(deviceType || '').toLowerCase()) {
    case PROTECTION_DEVICE_TYPES.BREAKER:
      return BREAKER_SCHEMA;
    case PROTECTION_DEVICE_TYPES.FUSE:
      return FUSE_SCHEMA;
    case PROTECTION_DEVICE_TYPES.RELAY:
      return RELAY_SCHEMA;
    case PROTECTION_DEVICE_TYPES.CT:
      return CT_SCHEMA;
    case PROTECTION_DEVICE_TYPES.VT:
      return VT_SCHEMA;
    default:
      return PROTECTION_DEVICE_BASE;
  }
}

function createProtectionDevice(deviceType, overrides = {}) {
  const base = deepClone(getProtectionDeviceSchema(deviceType));
  const out = { ...base, ...deepClone(overrides) };
  out.type = String(deviceType || out.type || '').toLowerCase();
  out.metadata = { ...deepClone(base.metadata), ...(overrides.metadata || {}) };
  if (!out.metadata.createdDate) out.metadata.createdDate = isoNow();
  out.metadata.modifiedDate = isoNow();
  return out;
}

function createBreaker(overrides = {}) {
  return createProtectionDevice(PROTECTION_DEVICE_TYPES.BREAKER, overrides);
}

function createFuse(overrides = {}) {
  return createProtectionDevice(PROTECTION_DEVICE_TYPES.FUSE, overrides);
}

function createRelay(overrides = {}) {
  return createProtectionDevice(PROTECTION_DEVICE_TYPES.RELAY, overrides);
}

function createCT(overrides = {}) {
  return createProtectionDevice(PROTECTION_DEVICE_TYPES.CT, overrides);
}

function createVT(overrides = {}) {
  return createProtectionDevice(PROTECTION_DEVICE_TYPES.VT, overrides);
}

function createProtectionZone(overrides = {}) {
  return {
    ...deepClone(PROTECTION_ZONE_SCHEMA),
    ...deepClone(overrides)
  };
}

function createProtectionAssociation(overrides = {}) {
  return {
    ...deepClone(PROTECTION_ASSOCIATION_SCHEMA),
    ...deepClone(overrides)
  };
}

function createProtectionDeviceAdequacyResult(overrides = {}) {
  return {
    ...deepClone(PROTECTION_DEVICE_ADEQUACY_RESULT),
    ...deepClone(overrides)
  };
}

function createProtectionCoordinationResult(overrides = {}) {
  return {
    ...deepClone(PROTECTION_COORDINATION_RESULT),
    ...deepClone(overrides)
  };
}

function createRelayOperationResult(overrides = {}) {
  return {
    ...deepClone(RELAY_OPERATION_RESULT),
    ...deepClone(overrides)
  };
}

function createProtectionResults(overrides = {}) {
  const result = {
    ...deepClone(PROTECTION_RESULTS_SCHEMA),
    ...deepClone(overrides)
  };
  if (!result.calculationDate) result.calculationDate = isoNow();
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function validateProtectionDevice(device) {
  const errors = [];
  if (!device || typeof device !== 'object') {
    errors.push('Device must be an object');
    return { valid: false, errors };
  }

  if (!device.type) {
    errors.push('Missing device.type');
  }

  if (!device.id) {
    errors.push('Missing device.id');
  }

  if (device.type === PROTECTION_DEVICE_TYPES.BREAKER || device.type === PROTECTION_DEVICE_TYPES.FUSE) {
    if (!device.fromBus) errors.push('Series device missing fromBus');
    if (!device.toBus) errors.push('Series device missing toBus');
  }

  if (isFiniteNumber(device.voltage) && device.voltage < 0) {
    errors.push('Device voltage cannot be negative');
  }

  if (device.type === PROTECTION_DEVICE_TYPES.RELAY) {
    device.deviceFunctions = ensureArray(device.deviceFunctions);
    const invalidFunctions = device.deviceFunctions.filter(fn => !RELAY_DEVICE_FUNCTIONS.includes(fn));
    if (invalidFunctions.length > 0) {
      errors.push('Invalid relay deviceFunctions: ' + invalidFunctions.join(', '));
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateProtectionZone(zone) {
  const errors = [];
  if (!zone || typeof zone !== 'object') {
    errors.push('Zone must be an object');
    return { valid: false, errors };
  }
  if (!zone.id) errors.push('Missing zone.id');
  if (!zone.name) errors.push('Missing zone.name');
  return { valid: errors.length === 0, errors };
}

function validateProtectionResults(results) {
  const errors = [];
  if (!results || typeof results !== 'object') {
    errors.push('Protection results must be an object');
    return { valid: false, errors };
  }
  if (!results.adequacy) errors.push('Missing adequacy block');
  if (!results.coordination) errors.push('Missing coordination block');
  if (!results.relayOperation) errors.push('Missing relayOperation block');
  if (!results.clearing) errors.push('Missing clearing block');
  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIONAL INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ensure bus.results.protection exists in the expected schema shape.
 * Safe helper for later integration with calculations.js / resultsSchema.js.
 */
function ensureBusProtectionResults(bus) {
  if (!bus || typeof bus !== 'object') return null;
  if (!bus.results) bus.results = {};
  if (!bus.results.protection) {
    bus.results.protection = createProtectionResults();
  }
  return bus.results.protection;
}

/**
 * Identify whether a component should be treated as a series protection device.
 */
function isSeriesProtectionDevice(component) {
  const t = String(component?.type || '').toLowerCase();
  return t === PROTECTION_DEVICE_TYPES.BREAKER || t === PROTECTION_DEVICE_TYPES.FUSE;
}

/**
 * Identify whether an object is a relay-like associated protection device.
 */
function isRelayLikeDevice(device) {
  const t = String(device?.type || '').toLowerCase();
  return t === PROTECTION_DEVICE_TYPES.RELAY || t === PROTECTION_DEVICE_TYPES.CT || t === PROTECTION_DEVICE_TYPES.VT;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.PROTECTION_DEVICE_TYPES = PROTECTION_DEVICE_TYPES;
  window.PROTECTION_DEVICE_STATUS = PROTECTION_DEVICE_STATUS;
  window.BREAKER_CLASSES = BREAKER_CLASSES;
  window.FUSE_CLASSES = FUSE_CLASSES;
  window.RELAY_FAMILIES = RELAY_FAMILIES;
  window.TRIP_UNIT_TYPES = TRIP_UNIT_TYPES;
  window.PROTECTION_ZONE_TYPES = PROTECTION_ZONE_TYPES;
  window.PROTECTION_ASSOCIATION_TYPES = PROTECTION_ASSOCIATION_TYPES;
  window.PROTECTION_RESULT_STATUS = PROTECTION_RESULT_STATUS;
  window.RELAY_DEVICE_FUNCTIONS = RELAY_DEVICE_FUNCTIONS;
  window.CURVE_FAMILIES = CURVE_FAMILIES;

  window.PROTECTION_DEVICE_BASE = PROTECTION_DEVICE_BASE;
  window.BREAKER_SCHEMA = BREAKER_SCHEMA;
  window.FUSE_SCHEMA = FUSE_SCHEMA;
  window.RELAY_SCHEMA = RELAY_SCHEMA;
  window.CT_SCHEMA = CT_SCHEMA;
  window.VT_SCHEMA = VT_SCHEMA;
  window.PROTECTION_ZONE_SCHEMA = PROTECTION_ZONE_SCHEMA;
  window.PROTECTION_ASSOCIATION_SCHEMA = PROTECTION_ASSOCIATION_SCHEMA;
  window.PROTECTION_DEVICE_ADEQUACY_RESULT = PROTECTION_DEVICE_ADEQUACY_RESULT;
  window.PROTECTION_COORDINATION_RESULT = PROTECTION_COORDINATION_RESULT;
  window.RELAY_OPERATION_RESULT = RELAY_OPERATION_RESULT;
  window.PROTECTION_RESULTS_SCHEMA = PROTECTION_RESULTS_SCHEMA;

  window.getProtectionDeviceSchema = getProtectionDeviceSchema;
  window.createProtectionDevice = createProtectionDevice;
  window.createBreaker = createBreaker;
  window.createFuse = createFuse;
  window.createRelay = createRelay;
  window.createCT = createCT;
  window.createVT = createVT;
  window.createProtectionZone = createProtectionZone;
  window.createProtectionAssociation = createProtectionAssociation;
  window.createProtectionDeviceAdequacyResult = createProtectionDeviceAdequacyResult;
  window.createProtectionCoordinationResult = createProtectionCoordinationResult;
  window.createRelayOperationResult = createRelayOperationResult;
  window.createProtectionResults = createProtectionResults;
  window.validateProtectionDevice = validateProtectionDevice;
  window.validateProtectionZone = validateProtectionZone;
  window.validateProtectionResults = validateProtectionResults;
  window.ensureBusProtectionResults = ensureBusProtectionResults;
  window.isSeriesProtectionDevice = isSeriesProtectionDevice;
  window.isRelayLikeDevice = isRelayLikeDevice;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PROTECTION_DEVICE_TYPES,
    PROTECTION_DEVICE_STATUS,
    BREAKER_CLASSES,
    FUSE_CLASSES,
    RELAY_FAMILIES,
    TRIP_UNIT_TYPES,
    PROTECTION_ZONE_TYPES,
    PROTECTION_ASSOCIATION_TYPES,
    PROTECTION_RESULT_STATUS,
    RELAY_DEVICE_FUNCTIONS,
    CURVE_FAMILIES,

    PROTECTION_DEVICE_BASE,
    BREAKER_SCHEMA,
    FUSE_SCHEMA,
    RELAY_SCHEMA,
    CT_SCHEMA,
    VT_SCHEMA,
    PROTECTION_ZONE_SCHEMA,
    PROTECTION_ASSOCIATION_SCHEMA,
    PROTECTION_DEVICE_ADEQUACY_RESULT,
    PROTECTION_COORDINATION_RESULT,
    RELAY_OPERATION_RESULT,
    PROTECTION_RESULTS_SCHEMA,

    getProtectionDeviceSchema,
    createProtectionDevice,
    createBreaker,
    createFuse,
    createRelay,
    createCT,
    createVT,
    createProtectionZone,
    createProtectionAssociation,
    createProtectionDeviceAdequacyResult,
    createProtectionCoordinationResult,
    createRelayOperationResult,
    createProtectionResults,
    validateProtectionDevice,
    validateProtectionZone,
    validateProtectionResults,
    ensureBusProtectionResults,
    isSeriesProtectionDevice,
    isRelayLikeDevice
  };
}

console.log('✅ Protection Schema Module v1.0.0 loaded');
console.log(' - Breaker schema: READY');
console.log(' - Fuse schema: READY');
console.log(' - Relay schema: READY');
console.log(' - CT/VT schemas: READY');
console.log(' - Protection zone schema: READY');
console.log(' - Protection results schema: READY');
console.log(' - Factory functions: READY');
console.log(' - Validation helpers: READY');
