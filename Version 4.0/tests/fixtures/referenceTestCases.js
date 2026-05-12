/*
 * IEEE/NEC reference cases used as immutable regression fixtures.
 * These values are hand-calculated reference anchors for PR validation.
 */
window.REFERENCE_TEST_CASES = [
  {
    id: 'TC01',
    description: 'IEEE 141 Simple Radial — 480V bus, 1000kVA transformer (5.75% Z, X/R=6), 13.8kV 500MVA source',
    input: {
      sourceVoltage: 13800,
      sourceFaultMVA: 500,
      transformerKVA: 1000,
      transformerPrimaryV: 13800,
      transformerSecondaryV: 480,
      transformerImpedancePercent: 5.75,
      transformerXR: 6
    },
    expected: {
      threePhaseFaultKA: { value: 20.1, tolerance: 0.05 }
    }
  },
  {
    id: 'TC02',
    description: 'NEC Table 9 Voltage Drop — 480V, 200A, 100ft #2/0 AWG copper in magnetic conduit, PF=0.85',
    input: {
      voltage: 480,
      currentA: 200,
      lengthFt: 100,
      conductorSize: '2/0',
      material: 'copper',
      conduit: 'magnetic',
      powerFactor: 0.85
    },
    expected: {
      voltageDropPercent: { value: 1.47, tolerance: 0.1 }
    }
  },
  {
    id: 'TC03',
    description: 'IEEE 1584-2018 Arc Flash — 480V switchgear, 20kA arcing current, 18-inch working distance, 6-cycle clearing',
    input: {
      voltage: 480,
      arcingCurrentKA: 20,
      workingDistanceIn: 18,
      clearingCycles: 6,
      equipmentType: 'switchgear'
    },
    expected: {
      incidentEnergyCalCm2: { value: 8.5, tolerance: 0.2 },
      ppeCategory: { value: 2, tolerance: 0 }
    }
  },
  {
    id: 'TC04',
    description: 'IEEE 141 Motor Contribution — 200HP at 480V, efficiency=0.93, PF=0.88, X"d=16.7%',
    input: {
      horsepower: 200,
      voltage: 480,
      efficiency: 0.93,
      powerFactor: 0.88,
      xDoublePrimePercent: 16.7
    },
    expected: {
      motorContributionKA: { value: 1.34, tolerance: 0.1 },
      fullLoadCurrentA: { value: 240, tolerance: 0.05 }
    }
  },
  {
    id: 'TC05',
    description: 'Asymmetrical Fault — 20kA symmetrical, X/R=6',
    input: {
      symmetricalFaultKA: 20,
      xrRatio: 6
    },
    expected: {
      multiplyingFactor: { value: 1.152, tolerance: 0.02 },
      asymmetricalFaultKA: { value: 23.04, tolerance: 0.03 }
    }
  },
  {
    id: 'TC06',
    description: 'Sequence Fault Types — Z1=0.01342Ω, Z2=Z1, Z0=3×Z1, V=480V',
    input: {
      z1Ohms: 0.01342,
      z2Ohms: 0.01342,
      z0Ohms: 0.04026,
      voltage: 480
    },
    expected: {
      lineToLineFaultKA: { value: 17.4, tolerance: 0.05 },
      lineToLineToThreePhaseRatio: { value: 0.866, tolerance: 0.02 }
    }
  }
];
