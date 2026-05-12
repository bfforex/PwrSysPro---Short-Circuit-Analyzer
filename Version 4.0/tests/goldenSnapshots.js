/*
 * Golden snapshot helper for capture/compare of per-bus regression outputs.
 * Intended for one-time baseline capture on Version 4.0 before refactors.
 */
(function initGoldenSnapshot(globalScope) {
  function toNumberOrNull(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function pull(obj, paths) {
    for (const path of paths) {
      const value = path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
      if (value !== undefined) return value;
    }
    return null;
  }

  function buildBusSnapshot(bus) {
    const resultRoot = bus?.results || {};

    return {
      busId: bus?.id || null,
      busName: bus?.name || null,
      shortCircuit: {
        symmetricalFaultCurrentKA: toNumberOrNull(pull(bus, ['faultCurrentKA', 'systemFault.symmetricalFaultCurrentKA', 'results.shortCircuit.faultCurrentKA', 'results.shortCircuit.symmetricalFaultCurrentKA'])),
        asymmetricalFaultCurrentKA: toNumberOrNull(pull(bus, ['asymFaultCurrentKA', 'systemFault.asymmetricalFaultCurrentKA', 'results.shortCircuit.asymFaultCurrentKA', 'results.shortCircuit.asymmetricalFaultCurrentKA'])),
        xrRatio: toNumberOrNull(pull(bus, ['xrRatio', 'systemFault.xrRatio', 'results.shortCircuit.xrRatio'])),
        totalImpedanceMagnitude: toNumberOrNull(pull(bus, ['totalImpedanceMagnitude', 'results.shortCircuit.totalImpedanceMagnitude', 'results.shortCircuit.totalZ'])),
        method: pull(bus, ['results.shortCircuit.method', 'method'])
      },
      voltageDrop: {
        dropPercent: toNumberOrNull(pull(bus, ['results.voltageDrop.dropPercent', 'results.voltageDrop.voltageDropPercent', 'voltageDropPercent'])),
        dropVolts: toNumberOrNull(pull(bus, ['results.voltageDrop.dropVolts', 'results.voltageDrop.voltageDropVolts', 'voltageDropVolts'])),
        severity: pull(bus, ['results.voltageDrop.severity', 'voltageDropSeverity'])
      },
      arcFlash: {
        incidentEnergyCalCm2: toNumberOrNull(pull(bus, ['results.arcFlash.incidentEnergyCalCm2', 'results.arcFlash.incidentEnergy'])),
        ppeCategory: pull(bus, ['results.arcFlash.ppeCategory']),
        arcFlashBoundaryFt: toNumberOrNull(pull(bus, ['results.arcFlash.arcFlashBoundaryFt', 'results.arcFlash.arcFlashBoundary']))
      },
      loadFlow: {
        busVoltage: toNumberOrNull(pull(bus, ['results.loadFlow.busVoltage', 'voltage'])),
        activePowerKW: toNumberOrNull(pull(bus, ['results.loadFlow.activePowerKW', 'results.loadFlow.realPowerKW'])),
        reactivePowerKVAR: toNumberOrNull(pull(bus, ['results.loadFlow.reactivePowerKVAR']))
      },
      rawResultKeys: Object.keys(resultRoot)
    };
  }

  function downloadSnapshot(snapshot) {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `golden_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function compareValues(busId, category, key, expected, actual, tolerance, mismatches) {
    if (typeof expected === 'number' && typeof actual === 'number') {
      const denominator = expected === 0 ? 1 : Math.abs(expected);
      const deviation = Math.abs(actual - expected) / denominator;
      if (deviation > tolerance) {
        mismatches.push({ busId, field: `${category}.${key}`, expected, actual, deviation });
      }
      return;
    }

    if (expected !== actual) {
      mismatches.push({ busId, field: `${category}.${key}`, expected, actual, deviation: null });
    }
  }

  globalScope.GoldenSnapshot = {
    capture(projectData) {
      const buses = Array.isArray(globalScope.buses) ? globalScope.buses : [];

      const snapshot = {
        createdAt: new Date().toISOString(),
        appVersion: projectData?.version || globalScope.VERSION || '4.0',
        projectSchema: projectData?.schema || null,
        metadata: {
          busCount: buses.length,
          componentCount: Array.isArray(globalScope.components) ? globalScope.components.length : 0
        },
        buses: buses.map(buildBusSnapshot)
      };

      console.log('⚠️ Run this ONCE on v4.0 before any refactoring. Save the downloaded JSON as tests/fixtures/golden_v4.0.json');
      downloadSnapshot(snapshot);
      return snapshot;
    },

    compare(goldenSnapshot, tolerance = 0.001) {
      const baselineBuses = Array.isArray(goldenSnapshot?.buses) ? goldenSnapshot.buses : [];
      const currentBuses = Array.isArray(globalScope.buses) ? globalScope.buses.map(buildBusSnapshot) : [];
      const byId = new Map(currentBuses.map((bus) => [bus.busId, bus]));
      const mismatches = [];

      baselineBuses.forEach((expectedBus) => {
        const actualBus = byId.get(expectedBus.busId);
        if (!actualBus) {
          mismatches.push({ busId: expectedBus.busId, field: 'bus', expected: 'present', actual: 'missing', deviation: null });
          return;
        }

        ['shortCircuit', 'voltageDrop', 'arcFlash', 'loadFlow'].forEach((category) => {
          const expectedCategory = expectedBus[category] || {};
          const actualCategory = actualBus[category] || {};

          Object.keys(expectedCategory).forEach((key) => {
            compareValues(expectedBus.busId, category, key, expectedCategory[key], actualCategory[key], tolerance, mismatches);
          });
        });
      });

      return {
        passed: mismatches.length === 0,
        failed: mismatches.length,
        mismatches
      };
    }
  };
})(window);
