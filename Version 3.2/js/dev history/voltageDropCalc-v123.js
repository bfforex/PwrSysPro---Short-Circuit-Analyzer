/**
 * Voltage Drop Calculator
 * PwrSys Pro — Self-healing implementation
 *
 * Design (unchanged):
 *  - Source impedance is EXCLUDED from voltage drop calculation.
 *  - Transformer voltage drop is computed on the SECONDARY side only.
 *  - Totals normalized to the SOURCE BASE voltage for consistent % across path.
 *
 * @author Engr. B. P. Faraon (update by Copilot)
 * @version 1.2.3
 * @date 2025-10-31
 */

(function () {
  'use strict';

  /**
   * Public API — calculate voltage drop for a given busId
   * @param {string} busId
   * @returns {Object} voltageDrop result object the UI expects
   */
  function calculateVoltageDrop(busId) {
    const stepsLog = [];
    try {
      // ---------- Preconditions ----------
      if (!Array.isArray(window.buses)) {
        return _vdError('buses array not available', stepsLog);
      }
      const bus = buses.find(b => b.id === busId);
      if (!bus) {
        return _vdError(`bus ${busId} not found`, stepsLog);
      }

      // Get source-to-target path (array of {bus, component})
      if (typeof traceBusPath !== 'function') {
        stepsLog.push('WARN: traceBusPath helper not found; VD cannot trace path.');
        return _vdError('traceBusPath missing', stepsLog);
      }
      const path = traceBusPath(busId);
      if (!Array.isArray(path) || path.length === 0) {
        stepsLog.push('WARN: Path is empty or invalid; skipping VD.');
        return _emptyVD(stepsLog);
      }

      // Source base voltage — normalize all % to this base
      const sourceBus = path[0]?.bus;
      const sourceVoltage = Number(sourceBus?.voltage || bus.voltage || 0);
      if (!(sourceVoltage > 0)) {
        stepsLog.push('WARN: Source voltage missing; using target bus voltage for normalization.');
      }
      const normBaseVolts = sourceVoltage > 0 ? sourceVoltage : Number(bus.voltage || 1);

      // Effective load & PF for the target bus
      const pf =
        (bus?.load?.powerFactor && Number(bus.load.powerFactor)) ||
        _readNumber(document.getElementById('powerFactor')?.value, 0.85);
      let segmentCurrent = _getSafeLoadCurrent(bus, pf, stepsLog); // downstream load current at target bus

      // ---------- Self-healing: exclude source element(s) ----------
      // Some path builders include a first segment with component=null or a "source" type.
      // We explicitly skip any initial segment that is source or has no component.
      let startIndex = 0;
      while (startIndex < path.length) {
        const seg = path[startIndex];
        const isSourceBus = seg?.bus?.type === 'source';
        const hasNoComponent = !seg?.component;
        if (isSourceBus || hasNoComponent) {
          stepsLog.push(
            `VD Self-Healing: Skipped path step ${startIndex + 1} ` +
            `(${seg?.bus?.name || 'Unknown'}) — source/no-component excluded by design.`
          );
          startIndex++;
        } else {
          break;
        }
      }
      if (startIndex >= path.length) {
        stepsLog.push('Path had only source/no-component segments — no VD applicable.');
        return _emptyVD(stepsLog, normBaseVolts);
      }

      // ---------- Walk path from first real component to target ----------
      const componentsVD = [];
      let cumulativeDropVolts = 0;
      let maxDropPercent = 0;
      let stepCounter = 0;

      for (let i = startIndex; i < path.length; i++) {
        const seg = path[i];
        const comp = seg.component;
        const segBus = seg.bus;
        stepCounter++;

        if (!comp || !segBus) {
          stepsLog.push(`Step ${stepCounter}: missing bus/component; skipped.`);
          continue;
        }

        const segType = String(comp.type || 'unknown').toLowerCase();
        const segName =
          comp.name ||
          (segType === 'cable' && comp.tag ? `Cable ${comp.tag}` : 'Unnamed Component');

        // Power factor for this segment — prefer bus PF if present
        const pfThis = (segBus?.load?.powerFactor && Number(segBus.load.powerFactor)) || pf;

        // Compute segment current, handling transformers (current referral across windings)
        if (segType === 'transformer') {
          // Refer current across transformer: primary->secondary or vice versa
          if (typeof referCurrentAcrossTransformer === 'function') {
            const fromV = _prevBusVoltage(path, i) || segBus.voltage || normBaseVolts;
            const toV = segBus.voltage || normBaseVolts;
            const referred = referCurrentAcrossTransformer(segmentCurrent, fromV, toV);
            stepsLog.push(
              `Step ${stepCounter}: Transformer current referred ` +
              `(from ${fromV}V to ${toV}V): ${segmentCurrent.toFixed(2)}A → ${referred.toFixed(2)}A.`
            );
            segmentCurrent = referred; // downstream current on secondary side
          } else {
            stepsLog.push('WARN: referCurrentAcrossTransformer missing; using same current across transformer.');
          }
        }

        // Determine segment impedance (R, X) in ohms at the segment bus voltage
        const { R, X, info } = _segmentImpedanceOhms(comp, segBus);
        if (info) stepsLog.push(`Step ${stepCounter} Impedance: ${info}`);

        // Compute ΔV for this segment (component-level voltage drop)
        const vd = _safeComponentVD(comp, segmentCurrent, segBus.voltage || normBaseVolts, R, X, pfThis);
        // Normalize % to source base as per design
        const dropPercentNorm = (vd.dropVolts / normBaseVolts) * 100;

        cumulativeDropVolts += vd.dropVolts;
        maxDropPercent = Math.max(maxDropPercent, dropPercentNorm);

        componentsVD.push({
          step: stepCounter,
          type: segType,
          name: segName,
          current: Number(vd.current || segmentCurrent),
          dropVolts: vd.dropVolts,
          dropPercent: dropPercentNorm,
          severity: vd.severity
        });
      }

      const cumulativeDropPercent = (cumulativeDropVolts / normBaseVolts) * 100;

      // ---------- Compliance (IEEE 141 limits) ----------
      const compliance = _vdCompliance(cumulativeDropPercent);

      // Assemble final result object
      const result = {
        components: componentsVD,
        cumulativeDropVolts,
        cumulativeDropPercent,
        maxDropPercent,
        compliance,
        calculationSteps: stepsLog.join('\n')
      };

      return result;
    } catch (err) {
      return _vdError(`VD calc error: ${String(err?.message || err)}`, stepsLog);
    }
  }

  // ------------------------ Helpers ------------------------

  function _vdError(message, stepsLog) {
    const log = stepsLog || [];
    log.push(`ERROR: ${message}`);
    return {
      components: [],
      cumulativeDropVolts: 0,
      cumulativeDropPercent: 0,
      maxDropPercent: 0,
      compliance: _vdCompliance(0),
      calculationSteps: log.join('\n')
    };
  }

  function _emptyVD(stepsLog, normBaseVolts = 1) {
    return {
      components: [],
      cumulativeDropVolts: 0,
      cumulativeDropPercent: 0,
      maxDropPercent: 0,
      compliance: _vdCompliance(0),
      calculationSteps: stepsLog.join('\n')
    };
  }

  function _getSafeLoadCurrent(bus, pf, stepsLog) {
    if (typeof getLoadCurrent === 'function') {
      try {
        const A = Number(getLoadCurrent(bus, null, _readNumber(document.getElementById('loadCurrent')?.value, 100)));
        stepsLog.push(`Target Bus Load Current: ${A.toFixed(2)}A (PF=${pf.toFixed(2)})`);
        return A;
      } catch (e) {
        stepsLog.push(`WARN: getLoadCurrent failed — ${String(e?.message || e)}; using 100A default.`);
      }
    } else {
      stepsLog.push('WARN: getLoadCurrent missing; using 100A default.');
    }
    return _readNumber(document.getElementById('loadCurrent')?.value, 100);
  }

  function _safeComponentVD(component, current, segVolts, R, X, pf) {
    if (typeof calculateComponentVoltageDrop === 'function') {
      return calculateComponentVoltageDrop(component, current, segVolts, R, X, pf);
    }
    // Fallback — reproduce ΔV logic locally
    const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
    const dropVolts = Math.sqrt(3) * current * (R * pf + X * sinPhi);
    const dropPercent = (segVolts > 0) ? (dropVolts / segVolts) * 100 : 0;
    let severity = 'OK';
    if (dropPercent > 7) severity = 'CRITICAL';
    else if (dropPercent > 5) severity = 'HIGH';
    else if (dropPercent > 3) severity = 'MEDIUM';
    return { dropVolts, dropPercent, severity, current, powerFactor: pf };
  }

  /**
   * Compute impedance in ohms for a path segment (component) at the bus voltage.
   * - Transformer: use %Z and X/R to derive R,X; base: V_secondary & rating kVA.
   * - Cable: use length & (size, material) table if available; allow parallel runs.
   * - Generator/Motor: typically ignored for VD; return 0 unless you wish to model cable to machine.
   * - Unknown: return 0 ohms and annotate.
   */
  function _segmentImpedanceOhms(comp, segBus) {
    const type = String(comp.type || 'unknown').toLowerCase();
    const vBus = Number(segBus?.voltage || 0);
    let R = 0, X = 0, info = '';

    if (type === 'transformer') {
      const kVA = Number(comp.rating || 0);
      const Zpct = Number(comp.impedance || 0); // %
      const xr = Number(comp.xr || 0);
      const vSec = Number(comp.secondary || vBus || 0);
      if (kVA > 0 && Zpct > 0 && vSec > 0) {
        // Z magnitude in ohms on secondary: Z = (Z%/100) * (V^2 / S)
        const S = kVA * 1000;
        const Zmag = (Zpct / 100) * ((vSec * vSec) / S);
        if (xr > 0) {
          const Rcalc = Zmag / Math.sqrt(1 + xr * xr);
          const Xcalc = Rcalc * xr;
          R = Rcalc; X = Xcalc;
          info = `XFMR Z%=${Zpct}%, X/R=${xr}, Z(Ω)=${Zmag.toFixed(6)} → R=${R.toFixed(6)}Ω, X=${X.toFixed(6)}Ω`;
        } else {
          // If no X/R, put all in X for conservative starting-drop estimate
          X = Zmag; R = 0;
          info = `XFMR Z%=${Zpct}%, no X/R; using X=${X.toFixed(6)}Ω on secondary`;
        }
      } else {
        info = 'XFMR missing rating/impedance/voltage; treated as R=X=0Ω';
      }
      return { R, X, info };
    }

    if (type === 'cable') {
      const lengthFt = Number(comp.length || 0);
      const parallel = Number(comp.parallel || 1);
      const mat = String(comp.material || '').toLowerCase(); // 'copper' / 'aluminum'
      const size = String(comp.size || '').toUpperCase();    // e.g., '3/0 AWG', '500 kcmil'

      // Try lookup table if available
      let RperFt = 0, XperFt = 0;
      if (typeof CABLE_IMPEDANCE_DATA !== 'undefined') {
        const key = `${size}|${mat}`;
        const row = CABLE_IMPEDANCE_DATA[key];
        if (row && typeof row.RperFt === 'number') RperFt = row.RperFt;
        if (row && typeof row.XperFt === 'number') XperFt = row.XperFt;
      }
      // Fallback approximations (light-touch): 60 Hz reactance ~ 0.00008–0.00010 Ω/ft for large Cu
      if (!(RperFt > 0)) {
        // Use 20°C DC resistance if TEMP_COEFFICIENT present
        const baseR = _approxRperFt(size, mat);
        const temp = _readNumber(document.getElementById('temperature')?.value, 75);
        if (typeof temperatureCorrection === 'function') {
          RperFt = temperatureCorrection(baseR, temp, mat || 'copper');
        } else {
          RperFt = baseR * (1 + 0.00393 * (temp - 20)); // copper alpha fallback
        }
      }
      if (!(XperFt > 0)) {
        XperFt = 0.000095; // conservative typical reactance per ft for sizeable conductors
      }

      // Apply length and parallel runs
      const Rtot = (lengthFt * RperFt) / Math.max(1, parallel);
      const Xtot = (lengthFt * XperFt) / Math.max(1, parallel);
      R = Rtot; X = Xtot;
      info = `Cable ${size} ${mat}, L=${lengthFt}ft, parallel=${parallel} → R=${R.toFixed(6)}Ω, X=${X.toFixed(6)}Ω`;
      return { R, X, info };
    }

    // Generators/motors for VD — typically we consider cable segments to the machine
    if (type === 'generator' || type === 'motor') {
      info = `${type} segment — no cable impedance provided; treating as R=X=0Ω for VD.`;
      return { R: 0, X: 0, info };
    }

    // Unknown or unsupported type
    return { R: 0, X: 0, info: `Unknown segment type "${type}" — R=X=0Ω` };
  }

  function _prevBusVoltage(path, idx) {
    for (let j = idx - 1; j >= 0; j--) {
      const v = Number(path[j]?.bus?.voltage || 0);
      if (v > 0) return v;
    }
    return Number(path[0]?.bus?.voltage || 0);
  }

  function _vdCompliance(totalPercent) {
    const feederLimit =
      IndustryStandards?.voltageDrop?.feeder?.maximum ?? 3;
    const branchLimit =
      IndustryStandards?.voltageDrop?.branch?.maximum ?? 5;
    const combinedLimit =
      IndustryStandards?.voltageDrop?.combined?.maximum ?? 7;

    let status = 'COMPLIANT';
    if (totalPercent > combinedLimit * 1.2) status = 'NON-COMPLIANT';
    else if (totalPercent > combinedLimit) status = 'WARNING';
    else status = 'COMPLIANT';

    return {
      feederLimit,
      branchLimit,
      combinedLimit,
      status
    };
  }

  function _readNumber(val, def = 0) {
    const n = Number(val);
    return Number.isFinite(n) ? n : def;
  }

  function _approxRperFt(size, material) {
    // Extremely lightweight map; your CABLE_IMPEDANCE_DATA should be preferred when present.
    const mat = (material || 'copper').toLowerCase();
    const base = {
      COPPER: {
        '14 AWG': 0.002525, '12 AWG': 0.001588, '10 AWG': 0.000999,
        '8 AWG': 0.000628, '6 AWG': 0.000395, '4 AWG': 0.000249,
        '3 AWG': 0.000198, '2 AWG': 0.000157, '1 AWG': 0.000125,
        '1/0 AWG': 0.000099, '2/0 AWG': 0.000079, '3/0 AWG': 0.000063,
        '4/0 AWG': 0.000050, '250 KCMIL': 0.000041, '300 KCMIL': 0.000034,
        '350 KCMIL': 0.000030, '400 KCMIL': 0.000026, '500 KCMIL': 0.000021,
        '600 KCMIL': 0.000018, '750 KCMIL': 0.000014, '1000 KCMIL': 0.000011
      },
      ALUMINUM: {
        // ~1.6x copper resistance as quick approximation
        '4/0 AWG': 0.000080, '250 KCMIL': 0.000065, '300 KCMIL': 0.000054,
        '350 KCMIL': 0.000048, '400 KCMIL': 0.000043, '500 KCMIL': 0.000035,
        '600 KCMIL': 0.000030, '750 KCMIL': 0.000024, '1000 KCMIL': 0.000019
      }
    };
    const table = mat === 'aluminum' ? base.ALUMINUM : base.COPPER;
    const key = size.replace('kcmil', 'KCMIL').toUpperCase();
    return table[key] ?? 0.000021; // fallback ~500 kcmil Cu
  }

  // ---------- Export ----------
  window.calculateVoltageDrop = calculateVoltageDrop;
  console.log('✅ Voltage Drop Calculator v1.2.3 loaded — self-healing enabled');
})();
``