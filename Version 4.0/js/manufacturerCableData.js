/**
 * Manufacturer Cable Data Module
 * Phelps Dodge MXLP-CWS 12/20 kV cable data and impedance helpers
 *
 * Added: 2026-05-07 by M365 Copilot
 * Purpose:
 * - Use manufacturer Rdc20 instead of NEC Ch. 9 Table 9 for Phelps Dodge 12/20 kV MV cables
 * - Correct resistance from 20°C to selected conductor temperature
 * - Estimate positive-sequence reactance X1 from manufacturer geometry using GMD/GMR
 * - Keep zero-sequence impedance as explicit/manufacturer/user input or clearly estimated elsewhere
 */

(function initManufacturerCableData(global) {
 'use strict';

 const MANUFACTURER_CABLE_DATA = {
  'phelps-dodge-mxlp-cws-12-20kv': {
   manufacturer: 'Phelps Dodge',
   cableType: 'MXLP-CWS',
   voltageClass: '12/20 kV',
   referenceStandard: 'IEC 60502-2',
   conductorMaterial: 'copper',
   conductorConstruction: 'Compact round stranded copper',
   insulation: 'Cross-linked polyethylene (XLPE)',
   conductorShield: 'Semi-conducting cross-linked polyethylene',
   insulationShield: 'Semi-conducting cross-linked polyethylene',
   metallicShield: 'Annealed copper wire with copper contact tape',
   oversheath: 'Black PE (ST7); PVC available upon request',
   maxConductorTemperatureC: 90,
   acTestVoltage: '42 kV for 5 minutes',
   resistanceBasisTemperatureC: 20,
   resistanceBasis: 'Maximum DC conductor resistance at 20°C',
   resistanceUnit: 'ohm/km',
   insulationResistanceBasis: 'Minimum insulation resistance at 20°C',
   insulationResistanceUnit: 'MΩ-km',
   sourceNote: 'Manufacturer data tables provided by user: Phelps Dodge Cable Type MXLP-CWS electrical characteristics and construction dimensions.',
   sizes: {
    35: {
     rdc20_ohmPerKm: 0.524,
     minIR_MOhmKm: 1391,
     conductorWireCountMin: 6,
     conductorDiameter_mm: 7.0,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 19.3,
     copperWireShieldDiameter_mm: 0.80,
     copperWireShieldCount: 20,
     oversheathThickness_mm: 1.8,
     overallDiameter_mm: 27,
     cableWeight_kgPerKm: 815,
     standardPacking_m: '1000/R'
    },
    50: {
     rdc20_ohmPerKm: 0.387,
     minIR_MOhmKm: 1229,
     conductorWireCountMin: 6,
     conductorDiameter_mm: 8.0,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 20.3,
     copperWireShieldDiameter_mm: 0.80,
     copperWireShieldCount: 20,
     oversheathThickness_mm: 1.8,
     overallDiameter_mm: 28,
     cableWeight_kgPerKm: 955,
     standardPacking_m: '1000/R'
    },
    70: {
     rdc20_ohmPerKm: 0.268,
     minIR_MOhmKm: 1085,
     conductorWireCountMin: 12,
     conductorDiameter_mm: 9.7,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 22.0,
     copperWireShieldDiameter_mm: 0.80,
     copperWireShieldCount: 20,
     oversheathThickness_mm: 1.9,
     overallDiameter_mm: 30,
     cableWeight_kgPerKm: 1205,
     standardPacking_m: '1000/R'
    },
    95: {
     rdc20_ohmPerKm: 0.193,
     minIR_MOhmKm: 979,
     conductorWireCountMin: 15,
     conductorDiameter_mm: 11.3,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 23.6,
     copperWireShieldDiameter_mm: 0.80,
     copperWireShieldCount: 20,
     oversheathThickness_mm: 1.9,
     overallDiameter_mm: 31,
     cableWeight_kgPerKm: 1480,
     standardPacking_m: '1000/R'
    },
    120: {
     rdc20_ohmPerKm: 0.153,
     minIR_MOhmKm: 897,
     conductorWireCountMin: 18,
     conductorDiameter_mm: 12.8,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 25.1,
     copperWireShieldDiameter_mm: 0.80,
     copperWireShieldCount: 20,
     oversheathThickness_mm: 2.0,
     overallDiameter_mm: 33,
     cableWeight_kgPerKm: 1760,
     standardPacking_m: '1000/R'
    },
    150: {
     rdc20_ohmPerKm: 0.124,
     minIR_MOhmKm: 834,
     conductorWireCountMin: 18,
     conductorDiameter_mm: 14.2,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 26.5,
     copperWireShieldDiameter_mm: 0.90,
     copperWireShieldCount: 25,
     oversheathThickness_mm: 2.0,
     overallDiameter_mm: 35,
     cableWeight_kgPerKm: 2125,
     standardPacking_m: '1000/R'
    },
    185: {
     rdc20_ohmPerKm: 0.0991,
     minIR_MOhmKm: 770,
     conductorWireCountMin: 30,
     conductorDiameter_mm: 15.8,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 28.1,
     copperWireShieldDiameter_mm: 0.90,
     copperWireShieldCount: 25,
     oversheathThickness_mm: 2.1,
     overallDiameter_mm: 37,
     cableWeight_kgPerKm: 2515,
     standardPacking_m: '500/R'
    },
    240: {
     rdc20_ohmPerKm: 0.0754,
     minIR_MOhmKm: 692,
     conductorWireCountMin: 34,
     conductorDiameter_mm: 18.2,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 30.5,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.2,
     overallDiameter_mm: 40,
     cableWeight_kgPerKm: 3215,
     standardPacking_m: '500/R'
    },
    300: {
     rdc20_ohmPerKm: 0.0601,
     minIR_MOhmKm: 635,
     conductorWireCountMin: 34,
     conductorDiameter_mm: 20.3,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 32.6,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.2,
     overallDiameter_mm: 42,
     cableWeight_kgPerKm: 3825,
     standardPacking_m: '500/R'
    },
    400: {
     rdc20_ohmPerKm: 0.0470,
     minIR_MOhmKm: 575,
     conductorWireCountMin: 53,
     conductorDiameter_mm: 23.0,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 35.3,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.3,
     overallDiameter_mm: 45,
     cableWeight_kgPerKm: 4665,
     standardPacking_m: '500/R'
    },
    500: {
     rdc20_ohmPerKm: 0.0366,
     minIR_MOhmKm: 529,
     conductorWireCountMin: 53,
     conductorDiameter_mm: 25.9,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 38.5,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.4,
     overallDiameter_mm: 48,
     cableWeight_kgPerKm: 5780,
     standardPacking_m: '250/R'
    },
    630: {
     rdc20_ohmPerKm: 0.0283,
     minIR_MOhmKm: 470,
     conductorWireCountMin: 53,
     conductorDiameter_mm: 29.9,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 42.5,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.5,
     overallDiameter_mm: 52,
     cableWeight_kgPerKm: 7240,
     standardPacking_m: '250/R'
    },
    800: {
     rdc20_ohmPerKm: 0.0221,
     minIR_MOhmKm: 424,
     conductorWireCountMin: 53,
     conductorDiameter_mm: 33.8,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 46.4,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.7,
     overallDiameter_mm: 57,
     cableWeight_kgPerKm: 9040,
     standardPacking_m: '250/R'
    },
    1000: {
     rdc20_ohmPerKm: 0.0176,
     minIR_MOhmKm: 368,
     conductorWireCountMin: 53,
     conductorDiameter_mm: 39.8,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 52.4,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.8,
     overallDiameter_mm: 63,
     cableWeight_kgPerKm: 11205,
     standardPacking_m: '250/R'
    },
    1200: {
     rdc20_ohmPerKm: 0.0151,
     minIR_MOhmKm: 345,
     conductorWireCountMin: null,
     conductorDiameter_mm: 42.9,
     insulationThickness_mm: 5.5,
     diameterOverInsulation_mm: 55.5,
     copperWireShieldDiameter_mm: 1.03,
     copperWireShieldCount: 30,
     oversheathThickness_mm: 2.9,
     overallDiameter_mm: 66,
     cableWeight_kgPerKm: 12880,
     standardPacking_m: '250/R'
    }
   }
  }
 };

 function _num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
 }

 function normalizeCableSizeKey(size) {
  if (size === null || size === undefined) return '';
  return String(size).replace(/mm²|mm2|sq\.mm|sqmm|kcmil|awg|AWG|\s/gi, '').replace(/,/g, '');
 }

 function feetToKm(lengthFeet) {
  return _num(lengthFeet, 0) * 0.3048 / 1000;
 }

 function mmToM(mm) {
  return _num(mm, 0) / 1000;
 }

 function getCopperResistanceTempFactorFrom20C(targetTempC) {
  const t = _num(targetTempC, 20);
  const alpha20Cu = 0.00393;
  return 1 + alpha20Cu * (t - 20);
 }

 function getManufacturerCableSet(dataKey) {
  return MANUFACTURER_CABLE_DATA[dataKey] || null;
 }

 function getManufacturerCableSizeData(dataKey, size) {
  const cableSet = getManufacturerCableSet(dataKey);
  if (!cableSet || !cableSet.sizes) return null;
  const sizeKey = normalizeCableSizeKey(size);
  return cableSet.sizes[sizeKey] ? { cableSet, sizeKey, sizeData: cableSet.sizes[sizeKey] } : null;
 }

 function getManufacturerCableDataKeyForComponent(component) {
  if (!component) return '';
  return component.manufacturerCableDataKey || component.cableDataKey || '';
 }

 function calculateManufacturerCableResistance(component, options = {}) {
  const dataKey = options.dataKey || getManufacturerCableDataKeyForComponent(component);
  const info = getManufacturerCableSizeData(dataKey, component && component.size);
  if (!info) return null;

  const temperatureC = _num(options.temperatureC, _num(component && component.temperatureC, 75));
  const parallel = Math.max(1, _num(component && component.parallel, 1));
  const lengthKm = feetToKm(component && component.length);
  const r20 = _num(info.sizeData.rdc20_ohmPerKm, 0);
  const tempFactor = getCopperResistanceTempFactorFrom20C(temperatureC);
  const rCorrectedOhmPerKm = r20 * tempFactor;
  const rOhms = (rCorrectedOhmPerKm * lengthKm) / parallel;

  return {
   source: 'manufacturer-resistance',
   dataKey,
   cableSet: info.cableSet,
   sizeKey: info.sizeKey,
   sizeData: info.sizeData,
   temperatureC,
   basisTemperatureC: info.cableSet.resistanceBasisTemperatureC,
   tempFactor,
   r20_ohmPerKm: r20,
   rCorrectedOhmPerKm,
   lengthKm,
   lengthFeet: _num(component && component.length, 0),
   parallel,
   rOhms,
   minIR_MOhmKm: info.sizeData.minIR_MOhmKm
  };
 }

 function estimateGmrFromConductorDiameter(conductorDiameterMm) {
  const radiusM = mmToM(conductorDiameterMm) / 2;
  if (radiusM <= 0) return 0;
  return 0.7788 * radiusM;
 }

 function calculateEquivalentGmdM(sizeData, formation = 'trefoil-touching', spacing = {}) {
  const odM = mmToM(sizeData && sizeData.overallDiameter_mm);
  if (odM <= 0) return 0;

  const form = String(formation || 'trefoil-touching').toLowerCase();

  if (form === 'trefoil' || form === 'trefoil-touching') {
   return odM;
  }

  if (form === 'flat' || form === 'flat-touching') {
   return Math.cbrt(odM * odM * (2 * odM));
  }

  if (form === 'custom-spacing' || form === 'custom') {
   const dab = mmToM(spacing.dab_mm || spacing.dAB_mm || spacing.a12_mm);
   const dbc = mmToM(spacing.dbc_mm || spacing.dBC_mm || spacing.a23_mm);
   const dca = mmToM(spacing.dca_mm || spacing.dCA_mm || spacing.a31_mm);
   if (dab > 0 && dbc > 0 && dca > 0) {
    return Math.cbrt(dab * dbc * dca);
   }
  }

  if (form === 'flat-spaced') {
   const s = mmToM(spacing.spacing_mm || spacing.centerSpacing_mm || spacing.phaseSpacing_mm);
   if (s > 0) return Math.cbrt(s * s * (2 * s));
  }

  return odM;
 }

 function calculateManufacturerCableReactance(component, options = {}) {
  const dataKey = options.dataKey || getManufacturerCableDataKeyForComponent(component);
  const info = getManufacturerCableSizeData(dataKey, component && component.size);
  if (!info) return null;

  const frequencyHz = _num(options.frequencyHz, _num(component && component.frequencyHz, 60));
  const parallel = Math.max(1, _num(component && component.parallel, 1));
  const lengthKm = feetToKm(component && component.length);
  const formation = options.formation || component.cableFormation || component.installationFormation || 'trefoil-touching';
  const spacing = {
   dab_mm: options.dab_mm ?? component.dab_mm,
   dbc_mm: options.dbc_mm ?? component.dbc_mm,
   dca_mm: options.dca_mm ?? component.dca_mm,
   spacing_mm: options.spacing_mm ?? component.spacing_mm ?? component.phaseSpacing_mm
  };

  const gmrM = estimateGmrFromConductorDiameter(info.sizeData.conductorDiameter_mm);
  const gmdM = calculateEquivalentGmdM(info.sizeData, formation, spacing);

  if (gmrM <= 0 || gmdM <= 0 || gmdM <= gmrM) {
   return null;
  }

  const inductance_HPerM = 2e-7 * Math.log(gmdM / gmrM);
  const xOhmPerM = 2 * Math.PI * frequencyHz * inductance_HPerM;
  const xOhmPerKm = xOhmPerM * 1000;
  const xOhms = (xOhmPerKm * lengthKm) / parallel;

  return {
   source: 'geometry-estimated-reactance',
   dataKey,
   cableSet: info.cableSet,
   sizeKey: info.sizeKey,
   sizeData: info.sizeData,
   frequencyHz,
   formation,
   spacing,
   gmrM,
   gmrMm: gmrM * 1000,
   gmdM,
   gmdMm: gmdM * 1000,
   inductance_HPerM,
   xOhmPerM,
   xOhmPerKm,
   lengthKm,
   lengthFeet: _num(component && component.length, 0),
   parallel,
   xOhms,
   note: 'Positive-sequence reactance estimated from manufacturer geometry using GMD/GMR. Metallic shield, sheath, earth-return and zero-sequence effects are not included in this X1 estimate.'
  };
 }

 function calculateManufacturerCableImpedance(component, options = {}) {
  const resistance = calculateManufacturerCableResistance(component, options);
  const reactance = calculateManufacturerCableReactance(component, options);

  if (!resistance && !reactance) return null;

  const rOhms = resistance ? resistance.rOhms : 0;
  const xOhms = reactance ? reactance.xOhms : 0;
  const zOhms = Math.sqrt(rOhms * rOhms + xOhms * xOhms);

  return {
   source: 'manufacturer-resistance-plus-geometry-reactance',
   resistance,
   reactance,
   rOhms,
   xOhms,
   zOhms,
   notes: [
    resistance ? 'R is based on manufacturer Rdc20 corrected to selected conductor temperature.' : 'R not available from manufacturer dataset.',
    reactance ? 'X1 is estimated from manufacturer geometry and selected cable formation.' : 'X1 not available; enter manufacturer X1 or provide geometry/formation.'
   ]
  };
 }

 function buildManufacturerCableImpedanceSteps(component, impedanceResult) {
  if (!impedanceResult) return '';
  const resistance = impedanceResult.resistance;
  const reactance = impedanceResult.reactance;
  let text = '';

  text += 'Cable Data Source — Manufacturer MV Cable Data\n';
  text += '────────────────────────────────────────────────────────────────────────────────\n';

  const cableSet = resistance?.cableSet || reactance?.cableSet;
  const sizeData = resistance?.sizeData || reactance?.sizeData;
  const sizeKey = resistance?.sizeKey || reactance?.sizeKey || component?.size || '';

  if (cableSet) {
   text += ` Manufacturer: ${cableSet.manufacturer}\n`;
   text += ` Cable Type: ${cableSet.cableType}\n`;
   text += ` Voltage Class: ${cableSet.voltageClass}\n`;
   text += ` Reference Standard: ${cableSet.referenceStandard}\n`;
   text += ` Conductor: ${cableSet.conductorConstruction}\n`;
   text += ` Insulation: ${cableSet.insulation}\n`;
   text += ` Metallic Shield: ${cableSet.metallicShield}\n`;
   text += ` Max Conductor Temperature: ${cableSet.maxConductorTemperatureC}°C normal operation\n`;
  }

  if (sizeData) {
   text += ` Size: ${sizeKey} mm²\n`;
   text += ` Conductor Diameter: ${sizeData.conductorDiameter_mm} mm\n`;
   text += ` Overall Cable Diameter: ${sizeData.overallDiameter_mm} mm\n`;
   text += ` Copper Wire Shield: ${sizeData.copperWireShieldCount} × ${sizeData.copperWireShieldDiameter_mm} mm wires\n`;
  }

  if (resistance) {
   text += '\nResistance Calculation\n';
   text += '────────────────────────────────────────────────────────────────────────────────\n';
   text += ` Rdc20 = ${resistance.r20_ohmPerKm.toFixed(6)} Ω/km\n`;
   text += ` Basis Temperature = ${resistance.basisTemperatureC}°C\n`;
   text += ` Selected Conductor Temperature = ${resistance.temperatureC}°C\n`;
   text += ' Copper α20 = 0.00393 /°C\n';
   text += ` Temperature Factor = 1 + 0.00393 × (${resistance.temperatureC} - 20) = ${resistance.tempFactor.toFixed(5)}\n`;
   text += ` Rcorrected = ${resistance.r20_ohmPerKm.toFixed(6)} × ${resistance.tempFactor.toFixed(5)} = ${resistance.rCorrectedOhmPerKm.toFixed(6)} Ω/km\n`;
   text += ` Length = ${resistance.lengthFeet.toFixed(2)} ft = ${resistance.lengthKm.toFixed(6)} km\n`;
   text += ` Parallel Runs = ${resistance.parallel}\n`;
   text += ` R = (${resistance.rCorrectedOhmPerKm.toFixed(6)} × ${resistance.lengthKm.toFixed(6)}) / ${resistance.parallel}\n`;
   text += ` R = ${resistance.rOhms.toFixed(6)} Ω\n`;
  }

  if (reactance) {
   text += '\nPositive-Sequence Reactance Estimate\n';
   text += '────────────────────────────────────────────────────────────────────────────────\n';
   text += ` Formation: ${reactance.formation}\n`;
   text += ` Frequency: ${reactance.frequencyHz} Hz\n`;
   text += ` GMR ≈ 0.7788 × conductor radius = ${reactance.gmrMm.toFixed(4)} mm\n`;
   text += ` GMD = ${reactance.gmdMm.toFixed(4)} mm\n`;
   text += ' L = 2×10^-7 × ln(GMD/GMR) H/m\n';
   text += ` L = ${reactance.inductance_HPerM.toExponential(6)} H/m\n`;
   text += ' X1 = 2πfL × 1000 Ω/km\n';
   text += ` X1 = ${reactance.xOhmPerKm.toFixed(6)} Ω/km\n`;
   text += ` X = (${reactance.xOhmPerKm.toFixed(6)} × ${reactance.lengthKm.toFixed(6)}) / ${reactance.parallel}\n`;
   text += ` X = ${reactance.xOhms.toFixed(6)} Ω\n`;
   text += ` Note: ${reactance.note}\n`;
  }

  text += '\nManufacturer MV Cable Impedance Result\n';
  text += '────────────────────────────────────────────────────────────────────────────────\n';
  text += ` R = ${impedanceResult.rOhms.toFixed(6)} Ω\n`;
  text += ` X1 = ${impedanceResult.xOhms.toFixed(6)} Ω\n`;
  text += ` |Z1| = ${impedanceResult.zOhms.toFixed(6)} Ω\n`;

  return text;
 }

 global.MANUFACTURER_CABLE_DATA = MANUFACTURER_CABLE_DATA;
 global.getCopperResistanceTempFactorFrom20C = getCopperResistanceTempFactorFrom20C;
 global.feetToKm = feetToKm;
 global.getManufacturerCableSet = getManufacturerCableSet;
 global.getManufacturerCableSizeData = getManufacturerCableSizeData;
 global.calculateManufacturerCableResistance = calculateManufacturerCableResistance;
 global.calculateManufacturerCableReactance = calculateManufacturerCableReactance;
 global.calculateManufacturerCableImpedance = calculateManufacturerCableImpedance;
 global.buildManufacturerCableImpedanceSteps = buildManufacturerCableImpedanceSteps;
 global.calculateEquivalentGmdM = calculateEquivalentGmdM;
 global.estimateGmrFromConductorDiameter = estimateGmrFromConductorDiameter;

 console.log('✅ Manufacturer Cable Data loaded: Phelps Dodge MXLP-CWS 12/20 kV');
 console.log(' - Rdc20 manufacturer resistance table: READY');
 console.log(' - Temperature correction from 20°C: READY');
 console.log(' - Geometry-based X1 estimate using GMD/GMR: READY');

 // ─── Manufacturer Cable Use (formerly manufacturerCableUsePatch.js) ───────────
 // Automatically assigns the Phelps Dodge MXLP-CWS 12/20 kV data key to
 // matching MV copper cable components and wraps calculateVoltageDrop() so
 // that manufacturer impedance values are applied to the result.

 if (global.__manufacturerCableUsePatchInstalled) return;
 global.__manufacturerCableUsePatchInstalled = true;

 const MANUFACTURER_KEY = 'phelps-dodge-mxlp-cws-12-20kv';
 const SQRT3 = Math.sqrt(3);

 function getPowerFactor() {
  return Math.min(
   1,
   Math.max(
    0,
    _num(
     typeof document !== 'undefined'
      ? document.getElementById('powerFactor') && document.getElementById('powerFactor').value
      : undefined,
     0.90
    )
   )
  );
 }

 function getTemperature() {
  return _num(
   typeof document !== 'undefined'
    ? document.getElementById('temperature') && document.getElementById('temperature').value
    : undefined,
   75
  );
 }

 function isCable(component) {
  return String(component && component.type || '').toLowerCase() === 'cable';
 }

 function isCopper(component) {
  return String(
   (component && component.material) ||
   (component && component.conductorMaterial) ||
   ''
  ).toLowerCase().includes('copper');
 }

 function getVoltageLevel(component, resultComponent, result) {
  return _num(
   (resultComponent && (resultComponent.voltageLevel != null ? resultComponent.voltageLevel
    : resultComponent.nominalVoltage)) ||
   (component && (component.voltage != null ? component.voltage : component.voltageLevel)) ||
   (result && (result.busVoltage != null ? result.busVoltage : result.loadVoltage)),
   0
  );
 }

 function isMediumVoltageCable(component, resultComponent, result) {
  const voltageLevel = getVoltageLevel(component, resultComponent, result);
  return voltageLevel >= 1000 ||
   String((component && component.voltageClass) || '').includes('12/20') ||
   String((component && component.cableType) || '').toLowerCase().includes('mxlp');
 }

 function manufacturerSizeExists(component) {
  const sizeKey = normalizeCableSizeKey(component && component.size);
  const info = getManufacturerCableSizeData(MANUFACTURER_KEY, sizeKey);
  return !!info;
 }

 function ensureManufacturerCableKey(component, resultComponent, result) {
  if (!component || !isCable(component)) return false;

  if (component.manufacturerCableDataKey || component.cableDataKey) {
   return true;
  }

  if (!isCopper(component)) return false;
  if (!isMediumVoltageCable(component, resultComponent, result)) return false;
  if (!manufacturerSizeExists(component)) return false;

  component.manufacturerCableDataKey = MANUFACTURER_KEY;
  component.cableDataKey = MANUFACTURER_KEY;

  return true;
 }

 function getComponentLabel(component) {
  return (component && (component.tag || component.name || component.id)) || 'Cable';
 }

 function getCurrent(component, resultComponent, result) {
  return _num(
   (resultComponent && (
    resultComponent.current != null ? resultComponent.current :
    resultComponent.currentA != null ? resultComponent.currentA : undefined
   )) ||
   (component && (
    component.current != null ? component.current :
    component.loadCurrent != null ? component.loadCurrent :
    component.designCurrent != null ? component.designCurrent : undefined
   )) ||
   (result && result.loadCurrent != null ? result.loadCurrent : undefined),
   0
  );
 }

 function getComponentPowerFactor(component, resultComponent) {
  return Math.min(
   1,
   Math.max(
    0,
    _num(
     (resultComponent && resultComponent.powerFactor != null ? resultComponent.powerFactor : undefined) ||
     (component && (component.powerFactor != null ? component.powerFactor : component.pf)),
     getPowerFactor()
    )
   )
  );
 }

 function calculateDropVolts(currentA, rOhms, xOhms, powerFactor) {
  const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
  return SQRT3 * currentA * ((rOhms * powerFactor) + (xOhms * sinTheta));
 }

 function findMatchingResultComponent(component, resultComponents, fallbackIndex) {
  if (!component || !Array.isArray(resultComponents)) return {};

  const label = getComponentLabel(component);

  const matched = resultComponents.find(function (candidate) {
   return candidate === component ||
    (candidate && component.tag && candidate.tag === component.tag) ||
    (candidate && component.name && candidate.name === component.name) ||
    (candidate && component.id && candidate.id === component.id) ||
    (candidate && candidate.tag === label) ||
    (candidate && candidate.name === label);
  });

  return matched ||
   resultComponents[fallbackIndex - 1] ||
   resultComponents[fallbackIndex] ||
   {};
 }

 function _calculateManufacturerImpedance(component) {
  try {
   return calculateManufacturerCableImpedance(component, {
    temperatureC: getTemperature()
   });
  } catch (error) {
   console.warn('[Manufacturer Cable Data] Failed to calculate manufacturer impedance:', error);
   return null;
  }
 }

 function updateCalculationStepsText(result, componentLabel, impedance, dropVolts) {
  if (!result || typeof result.calculationSteps !== 'string') return;

  const note = [
   '',
   'Manufacturer Cable Data Applied',
   '────────────────────────────────────────────────────────────────────────────────',
   'Component: ' + componentLabel,
   'Data Source: Phelps Dodge MXLP-CWS 12/20 kV via manufacturerCableData.js',
   'Rdc20 corrected to selected conductor temperature.',
   'R = ' + impedance.rOhms.toFixed(6) + ' Ω',
   'X = ' + impedance.xOhms.toFixed(6) + ' Ω',
   'Manufacturer-based VD = ' + dropVolts.toFixed(3) + ' V',
   ''
  ].join('\n');

  if (!result.calculationSteps.includes('Manufacturer Cable Data Applied')) {
   result.calculationSteps += '\n' + note;
  }
 }

 function applyManufacturerCableDataToResult(result, path) {
  if (!result || !Array.isArray(path)) return result;

  const resultComponents = Array.isArray(result.components)
   ? result.components
   : [];

  const formulaDetails = Array.isArray(result.voltageDropFormulaDetails)
   ? result.voltageDropFormulaDetails
   : [];

  path.forEach(function (segment, index) {
   const component = segment && segment.component;

   if (!component || !isCable(component)) return;

   const resultComponent = findMatchingResultComponent(
    component,
    resultComponents,
    index
   );

   const keyReady = ensureManufacturerCableKey(
    component,
    resultComponent,
    result
   );

   if (!keyReady) return;

   const impedance = _calculateManufacturerImpedance(component);

   if (!impedance) return;

   const currentA = getCurrent(component, resultComponent, result);
   const powerFactor = getComponentPowerFactor(component, resultComponent);
   const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
   const dropVolts = calculateDropVolts(
    currentA,
    impedance.rOhms,
    impedance.xOhms,
    powerFactor
   );

   const voltageLevel = getVoltageLevel(
    component,
    resultComponent,
    result
   );

   const dropPercent = voltageLevel > 0
    ? dropVolts / voltageLevel * 100
    : 0;

   resultComponent.rOhms = impedance.rOhms;
   resultComponent.xOhms = impedance.xOhms;
   resultComponent.resistanceOhms = impedance.rOhms;
   resultComponent.reactanceOhms = impedance.xOhms;
   resultComponent.dropVolts = dropVolts;
   resultComponent.dropPercent = dropPercent;
   resultComponent.impedanceSource = 'manufacturerCableData.js';
   resultComponent.manufacturerCableDataKey = MANUFACTURER_KEY;

   const label = getComponentLabel(component);

   formulaDetails.push({
    step: index,
    type: 'cable',
    component: label,
    currentA: currentA,
    rOhms: impedance.rOhms,
    xOhms: impedance.xOhms,
    powerFactor: powerFactor,
    sinTheta: sinTheta,
    calculatedDropVolts: dropVolts,
    usedDropVolts: dropVolts,
    voltageLevel: voltageLevel,
    dropPercent: dropPercent,
    impedanceSource: 'manufacturerCableData.js',
    formula: 'VD = √3 × I × (R cosθ + X sinθ)'
   });

   updateCalculationStepsText(
    result,
    label,
    impedance,
    dropVolts
   );
  });

  result.voltageDropFormulaDetails = formulaDetails;

  return result;
 }

 function preTagManufacturerCables(path) {
  if (!Array.isArray(path)) return;

  path.forEach(function (segment) {
   const component = segment && segment.component;

   if (!component || !isCable(component)) return;

   ensureManufacturerCableKey(component, {}, {});
  });
 }

 function installManufacturerCableUse() {
  if (typeof global.calculateVoltageDrop !== 'function') return false;
  if (global.calculateVoltageDrop.__manufacturerCableUsePatchApplied) return true;

  const originalCalculateVoltageDrop = global.calculateVoltageDrop;

  const patchedCalculateVoltageDrop = function patchedCalculateVoltageDrop(busId, path, loadFlowData) {
   preTagManufacturerCables(path);
   const result = originalCalculateVoltageDrop.apply(this, arguments);
   return applyManufacturerCableDataToResult(result, path);
  };

  patchedCalculateVoltageDrop.__manufacturerCableUsePatchApplied = true;

  global.calculateVoltageDrop = patchedCalculateVoltageDrop;

  try {
   calculateVoltageDrop = patchedCalculateVoltageDrop;
  } catch (_) {}

  return true;
 }

 global.applyManufacturerCableDataToVoltageDropResult = applyManufacturerCableDataToResult;

 if (!installManufacturerCableUse()) {
  const _mcTimer = setInterval(function () {
   if (installManufacturerCableUse()) {
    clearInterval(_mcTimer);
   }
  }, 100);

  setTimeout(function () {
   clearInterval(_mcTimer);
  }, 5000);
 }

 console.log('✅ Manufacturer Cable Use integrated: voltage drop wrapper active');
})(typeof window !== 'undefined' ? window : globalThis);
