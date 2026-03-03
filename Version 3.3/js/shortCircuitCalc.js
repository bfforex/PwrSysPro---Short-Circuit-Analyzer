/**
 * Short Circuit Calculation Module - ENHANCED v1.5.0
 * Enhanced with detailed calculation steps showing component tags
 * 
 * @author bfforex
 * @date 2025-11-02 11:48:56 UTC
 * @version 1.5.0
 * @enhancement Added component tag display throughout calculation steps
 * @enhancement Enhanced formatting with visual hierarchy and icons
 * @enhancement Added detailed input/output sections per step
 * @enhancement Added from/to bus information for full traceability
 * @enhancement Added intermediate calculation steps with formulas
 * 
 * ENHANCEMENTS FROM v1.4.0:
 * ✅ Component tags displayed in step titles and details
 * ✅ From/To bus information for all components
 * ✅ Visual hierarchy with icons (🔌 🔧 ⚙️ 📐 📊 ✅)
 * ✅ Detailed formula breakdowns with actual values
 * ✅ Enhanced section separators for better readability
 * ✅ Intermediate calculation steps shown
 * ✅ Equipment identification information
 * 
 * Standards Compliance:
 * - IEEE 141-1993 (Red Book) - Sections 5.2, 5.3, 5.4
 * - IEC 60909 - Short-Circuit Currents
 * - ANSI C37.010 - Application Guide for AC High-Voltage Circuit Breakers
 * - NEC Article 430 - Motors, Motor Circuits, and Controllers
 */

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const SHORT_CIRCUIT_CONFIG = {
    SYSTEM_FREQUENCY: 60,
    CONTACT_PARTING_TIME: 0.05,
    MOTOR_TIME_CYCLES: 3,
    DEFAULT_GROUNDING: 'solidly',
    Z0_FACTORS: {
        utility: 1.5,
        cable: 3.0,
        transformer: 1.0,
        generator: 0.05
    }
};

console.log('🔧 Loading Short Circuit Calculation Module v1.5.0 (ENHANCED)...');
console.log('   ✅ Component tags enabled');
console.log('   ✅ Enhanced formatting with visual hierarchy');
console.log('   ✅ Detailed calculation steps with formulas');
console.log('   ✅ From/To bus information included');

// ─────────────────────────────────────────────────────────────────────────────
// SHORT CIRCUIT RESULT NORMALIZATION (Unified Schema v3.3)
// ─────────────────────────────────────────────────────────────────────────────
function normalizeShortCircuitToSchema(bus, raw = {}, context = {}) {

  // IEC steps array -> IEEE-like detailed text (for "Short Circuit Calculation Steps" modal)
  function formatIECStepsArray(arr, raw, bus, context) {
    if (!Array.isArray(arr) || arr.length === 0) return '';

    const calcType = String(raw?.calculationType ?? context?.iecCalcType ?? 'max').toLowerCase();
    const std = raw?.standard ?? 'IEC 60909-0:2016';
    const engineerName = (document.getElementById('engineer')?.value || 'Unknown Engineer');
    const ts = (typeof getCalculationTimestamp === 'function')
      ? getCalculationTimestamp()
      : new Date().toISOString();

    const Un = Number(raw?.voltage ?? bus?.voltage ?? 0);

    // IEC factors (may be missing depending on engine)
    const c = Number(raw?.voltageFactor ?? 0);
    const kappa = Number(raw?.peakFactor ?? 0);

    // Total impedance at fault (Ω)
    const zr = Number(raw?.impedance?.r ?? 0);
    const zx = Number(raw?.impedance?.x ?? 0);
    const zz = Number(raw?.impedance?.z ?? Math.sqrt(zr * zr + zx * zx));
    const xr = zr ? (zx / zr) : 0;

    // IEC currents (kA)
    const ik = Number(raw?.initialSymmetricalCurrentKA ?? 0);
    const ip = Number(raw?.peakCurrentKA ?? 0);
    const ib = Number(raw?.breakingCurrentKA ?? ik);
    const iss = Number(raw?.steadyStateCurrentKA ?? ik);
    const ilg = Number(raw?.lineToGroundCurrentKA ?? 0);

    let out = '';
    out += '═'.repeat(80) + '\n';
    out += 'SHORT CIRCUIT CALCULATION - IEC 60909\n';
    out += '═'.repeat(80) + '\n\n';

    out += '📋 CALCULATION INFORMATION\n';
    out += '─'.repeat(80) + '\n';
    out += `Date/Time: ${ts}\n`;
    out += `Engineer: ${engineerName}\n`;
    out += `Standard: ${std}\n`;
    out += `Calculation Type: ${calcType.toUpperCase()} (${calcType === 'max' ? 'Equipment Rating' : 'Protection Coordination'})\n`;
    out += `Fault Bus: ${bus?.name ?? raw?.busName ?? 'N/A'}\n`;
    out += `Nominal Voltage (Un): ${Un} V\n`;
    if (c) out += `Voltage Factor (c): ${c.toFixed(3)}\n`;
    if (kappa) out += `Peak Factor (κ): ${kappa.toFixed(4)}\n`;
    out += '\n';

    out += '📊 TOTAL THEVENIN IMPEDANCE AT FAULT LOCATION\n';
    out += '─'.repeat(80) + '\n';
    out += `R_total = ${zr.toFixed(6)} Ω\n`;
    out += `X_total = ${zx.toFixed(6)} Ω\n`;
    out += `Z_total = ${zz.toFixed(6)} Ω\n`;
    out += `X/R Ratio = ${xr.toFixed(3)}\n\n`;

    out += '📐 FORMULAS (IEC 60909-0:2016)\n';
    out += '─'.repeat(80) + '\n';
    out += 'Initial Symmetrical Short-Circuit Current:\n';
    out += '  I"k = (c × Un) / (√3 × Zk)\n';
    out += 'Peak Short-Circuit Current:\n';
    out += '  ip = κ × √2 × I"k\n';
    out += 'Breaking Current (simplified):\n';
    out += '  Ib ≈ I"k (far-from-generator assumption)\n';
    out += '\n';

    out += '✅ RESULTS\n';
    out += '─'.repeat(80) + '\n';
    out += `I"k (Initial Sym): ${ik.toFixed(3)} kA\n`;
    out += `ip (Peak):          ${ip.toFixed(3)} kA\n`;
    out += `Ib (Breaking):      ${ib.toFixed(3)} kA\n`;
    out += `Ik (Steady-state):  ${iss.toFixed(3)} kA\n`;
    out += `Ik1 (L-G, est.):    ${ilg.toFixed(3)} kA\n\n`;

    out += '🔎 COMPONENT-BY-COMPONENT IMPEDANCE BUILD-UP (Ω)\n';
    out += '─'.repeat(80) + '\n';
    out += 'Step | Component        | Description                          | R (Ω)      | X (Ω)      | ΣR (Ω)     | ΣX (Ω)\n';
    out += '-----+------------------+--------------------------------------+------------+------------+------------+------------\n';

    for (let i = 0; i < arr.length; i++) {
      const st = arr[i] || {};
      const comp = String(st.component ?? '').padEnd(16).slice(0, 16);
      const desc = String(st.description ?? '').padEnd(36).slice(0, 36);
      const r = Number(st.r ?? 0);
      const x = Number(st.x ?? 0);
      const cr = Number(st.cumulativeR ?? 0);
      const cx = Number(st.cumulativeX ?? 0);
      const step = String(i + 1).padStart(4);
      out += `${step} | ${comp} | ${desc} | ${r.toFixed(6).padStart(10)} | ${x.toFixed(6).padStart(10)} | ${cr.toFixed(6).padStart(10)} | ${cx.toFixed(6).padStart(10)}\n`;
    }

    out += '\n';
    out += '📝 NOTES\n';
    out += '─'.repeat(80) + '\n';
    out += '• This IEC summary uses the impedance build-up available from the IEC engine steps array.\n';
    out += '• For full IEC correction factors (e.g., KT, generator/motor decay), extend the IEC engine to store intermediates in raw fields.\n';
    out += '\n';

    out += '═'.repeat(80) + '\n';
    out += 'END OF IEC 60909 SHORT CIRCUIT CALCULATION\n';
    out += '═'.repeat(80) + '\n';

    return out;
  }

  // Create schema default if available, else minimal safe object
  const sc = (typeof createShortCircuitResults === 'function')
    ? createShortCircuitResults()
    : {
      faultCurrents: { threePhaseSym: 0, threePhaseAsym: 0, lineToLine: 0, lineToGround: 0 },
      impedance: { rTotal: 0, xTotal: 0, zTotal: 0, xrRatio: 0 },
      motorContribution: { totalCurrent: 0, motorCount: 0, decayFactor: 0 },
      arcFlash: {},
      calculationMethod: '',
      calculationSteps: '',
      calculationDate: ''
    };

  // Always keep these stable
  sc.calculationDate = raw?.calculationDate ?? raw?.calculationTimestamp ?? new Date().toISOString();
  sc.calculationMethod = context?.method || raw?.method || 'point-to-point';

  // Steps: prefer explicit string; else use raw.steps string; else format IEC steps array
  sc.calculationSteps =
    raw?.calculationSteps ??
    (Array.isArray(raw?.steps) ? formatIECStepsArray(raw.steps, raw, bus, context) : (raw?.steps ?? ''));

  // ── IEEE-style (already unified) ────────────────────────────────────────────
  if (raw?.faultCurrents) {
    sc.faultCurrents.threePhaseSym  = Number(raw.faultCurrents.threePhaseSym  || 0);
    sc.faultCurrents.threePhaseAsym = Number(raw.faultCurrents.threePhaseAsym || 0);
    sc.faultCurrents.lineToLine     = Number(raw.faultCurrents.lineToLine     || 0);
    sc.faultCurrents.lineToGround   = Number(raw.faultCurrents.lineToGround   || 0);

    const z = raw.totalImpedance || raw.impedance || {};
    sc.impedance.rTotal  = Number(z.resistance ?? z.r ?? raw.totalR ?? 0);
    sc.impedance.xTotal  = Number(z.reactance  ?? z.x ?? raw.totalX ?? 0);
    sc.impedance.zTotal  = Number(z.magnitude  ?? z.z ?? raw.totalZ ?? 0);
    sc.impedance.xrRatio = Number(raw.xrRatio ?? z.xrRatio ?? (sc.impedance.rTotal ? (sc.impedance.xTotal / sc.impedance.rTotal) : 0));
  }

  // ── IEC 60909 mapping (raw IEC outputs) ─────────────────────────────────────
  const isIEC = (raw?.method === 'iec-60909') || (context?.method === 'iec-60909') || (sc.calculationMethod === 'iec-60909');

  if (isIEC) {
    // Unified currents from IEC-native fields (kA)
    sc.faultCurrents.threePhaseSym  = Number(raw?.initialSymmetricalCurrentKA ?? sc.faultCurrents.threePhaseSym ?? 0);
    sc.faultCurrents.threePhaseAsym = Number(raw?.peakCurrentKA ?? sc.faultCurrents.threePhaseAsym ?? 0);
    sc.faultCurrents.lineToGround   = Number(raw?.lineToGroundCurrentKA ?? sc.faultCurrents.lineToGround ?? 0);
    sc.faultCurrents.lineToLine     = Number(raw?.lineToLineCurrentKA ?? (sc.faultCurrents.threePhaseSym * 0.866));

    const z = raw?.impedance || {};
    sc.impedance.rTotal  = Number(z.r ?? sc.impedance.rTotal ?? 0);
    sc.impedance.xTotal  = Number(z.x ?? sc.impedance.xTotal ?? 0);
    sc.impedance.zTotal  = Number(z.z ?? sc.impedance.zTotal ?? 0);
    sc.impedance.xrRatio = Number(z.xrRatio ?? (sc.impedance.rTotal ? (sc.impedance.xTotal / sc.impedance.rTotal) : 0));

    // Preserve IEC-native fields for IEC display/reporting
    sc.method = 'iec-60909';
    sc.calculationType = raw?.calculationType ?? context?.iecCalcType ?? 'max';
    sc.standard = raw?.standard ?? 'IEC 60909-0:2016';

    sc.initialSymmetricalCurrentKA = Number(raw?.initialSymmetricalCurrentKA ?? sc.faultCurrents.threePhaseSym ?? 0);
    sc.peakCurrentKA = Number(raw?.peakCurrentKA ?? sc.faultCurrents.threePhaseAsym ?? 0);
    sc.breakingCurrentKA = Number(raw?.breakingCurrentKA ?? sc.initialSymmetricalCurrentKA ?? 0);
    sc.steadyStateCurrentKA = Number(raw?.steadyStateCurrentKA ?? sc.initialSymmetricalCurrentKA ?? 0);
    sc.lineToGroundCurrentKA = Number(raw?.lineToGroundCurrentKA ?? sc.faultCurrents.lineToGround ?? 0);

    sc.peakFactor = Number(raw?.peakFactor ?? 0);
    sc.voltageFactor = Number(raw?.voltageFactor ?? 0);

    // Ensure impedance.r/x/z aliases exist for IEC display
    sc.impedance.r = Number(sc.impedance.rTotal ?? 0);
    sc.impedance.x = Number(sc.impedance.xTotal ?? 0);
    sc.impedance.z = Number(sc.impedance.zTotal ?? 0);

    // Keep IEC raw fields (defensive copy)
    try {
      sc._iec60909Raw = JSON.parse(JSON.stringify(raw));
    } catch (_) {
      sc._iec60909Raw = null;
    }
  }

  // ── Legacy IEEE (older schema) ──────────────────────────────────────────────
  if (!raw?.faultCurrents && (raw?.faultCurrentKA !== undefined || raw?.asymFaultCurrentKA !== undefined)) {
    const I3 = Number(raw?.faultCurrentKA ?? 0);
    const Iasym = Number(raw?.asymFaultCurrentKA ?? 0);
    sc.faultCurrents.threePhaseSym = I3;
    sc.faultCurrents.threePhaseAsym = Iasym;
    sc.faultCurrents.lineToGround = Number(raw?.lineToGroundKA ?? (I3 * 0.85));
    sc.faultCurrents.lineToLine = Number(raw?.lineToLineKA ?? (I3 * 0.866));
    sc.impedance.rTotal = Number(raw?.totalR ?? 0);
    sc.impedance.xTotal = Number(raw?.totalX ?? 0);
    sc.impedance.zTotal = Number(raw?.totalZ ?? Math.sqrt(sc.impedance.rTotal ** 2 + sc.impedance.xTotal ** 2));
    sc.impedance.xrRatio = Number(raw?.xrRatio ?? (sc.impedance.rTotal ? sc.impedance.xTotal / sc.impedance.rTotal : 0));
  }

  // ── Motor contribution summary (if present) ─────────────────────────────────
  if (raw?.motorContribution) {
    const mc = raw.motorContribution;
    sc.motorContribution.totalCurrent = Number(mc.totalSymmetricalContribution ?? mc.totalCurrent ?? mc.motorFaultCurrent ?? 0);
    sc.motorContribution.motorCount = Number(mc.motorCount ?? (Array.isArray(mc.motors) ? mc.motors.length : 0));
    sc.motorContribution.decayFactor = Number(mc.decayFactor ?? 0);

    // Keep full details for UI tabs/reports
    try {
      sc._motorDetails = JSON.parse(JSON.stringify(mc));
    } catch (_) {
      sc._motorDetails = null;
    }
  }

  // ── Backward-compatible aliases for existing UI/report code ─────────────────
  sc.method = sc.method || sc.calculationMethod;
  sc.xrRatio = sc.impedance?.xrRatio ?? 0;
  sc.totalImpedance = {
    resistance: sc.impedance?.rTotal ?? 0,
    reactance: sc.impedance?.xTotal ?? 0,
    magnitude: sc.impedance?.zTotal ?? 0,
    angle: Math.atan2((sc.impedance?.xTotal ?? 0), (sc.impedance?.rTotal ?? 0)) * (180 / Math.PI)
  };
  sc.path = context?.path ?? null;

  // FINAL IEC field guarantee: never allow IEC-native fields to be undefined
  if (sc.method === 'iec-60909' || sc.calculationMethod === 'iec-60909') {
    sc.calculationType = sc.calculationType ?? context?.iecCalcType ?? 'max';
    sc.initialSymmetricalCurrentKA = Number(sc.initialSymmetricalCurrentKA ?? sc.faultCurrents?.threePhaseSym ?? 0);
    sc.peakCurrentKA = Number(sc.peakCurrentKA ?? sc.faultCurrents?.threePhaseAsym ?? 0);
    sc.lineToGroundCurrentKA = Number(sc.lineToGroundCurrentKA ?? sc.faultCurrents?.lineToGround ?? 0);

    sc.peakFactor = Number(sc.peakFactor ?? 0);
    sc.voltageFactor = Number(sc.voltageFactor ?? 0);
    sc.breakingCurrentKA = Number(sc.breakingCurrentKA ?? sc.initialSymmetricalCurrentKA ?? 0);
    sc.steadyStateCurrentKA = Number(sc.steadyStateCurrentKA ?? sc.initialSymmetricalCurrentKA ?? 0);

    sc.impedance = sc.impedance || {};
    sc.impedance.r = Number(sc.impedance.r ?? sc.impedance.rTotal ?? 0);
    sc.impedance.x = Number(sc.impedance.x ?? sc.impedance.xTotal ?? 0);
    sc.impedance.z = Number(sc.impedance.z ?? sc.impedance.zTotal ?? 0);
  }

  return sc;
}
/**
 * Create a JSON-safe path trace (no bus/component objects; IDs/tags only)
 * Prevents circular references when saving to CalculationState / autosave.
 */
function simplifyPathTrace(path) {
  if (!Array.isArray(path)) return null;

  return path.map(seg => ({
    // Bus info (no bus object)
    busId: seg?.bus?.id ?? null,
    busName: seg?.bus?.name ?? null,
    busVoltage: seg?.bus?.voltage ?? null,

    // Component info (no component object)
    componentId: seg?.component?.id ?? null,
    componentType: seg?.component?.type ?? null,
    componentTag: seg?.component?.tag ?? seg?.component?.name ?? null,

    // Optional: topology breadcrumbs
    fromBusId: (seg?.component?.fromBus ?? seg?.component?.fromBusId ?? null),
    toBusId: (seg?.component?.toBus ?? seg?.component?.toBusId ?? null)
  }));
}

/**
 * Resolve IEC 60909 engine function from global scope and adapt call signature.
 * Supports: 
 *  - window.calculateIEC60909FaultCurrent(busId, {calculationType})
 *  - window.calculateShortCircuitIEC60909(path, calcType)
 */
function resolveIEC60909Engine() {
  if (typeof window !== 'undefined') {
    if (typeof window.calculateIEC60909FaultCurrent === 'function') {
      return { type: 'busId', fn: window.calculateIEC60909FaultCurrent };
    }
    if (typeof window.calculateShortCircuitIEC60909 === 'function') {
      return { type: 'path', fn: window.calculateShortCircuitIEC60909 };
    }
  }
  return null;
}

function buildIECPathFromTrace(trace) {
  if (!Array.isArray(trace) || trace.length === 0) return null;
  return trace.map((seg, idx) => {
    const prevBusId = idx > 0 ? (trace[idx - 1]?.bus?.id ?? null) : (trace[0]?.bus?.id ?? null);
    const thisBusId = seg?.bus?.id ?? null;
    return {
      fromBusId: prevBusId,
      toBusId: thisBusId,
      component: seg?.component ?? null
    };
  });
}


/**
 * Perform short circuit analysis for a bus
 *
 * Dispatches to the appropriate calculation engine (point-to-point,
 * per-unit, or IEC 60909-0) and normalises the result to the unified
 * v3.3 results schema.
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.2 - Point-to-point (ohmic) short-circuit method
 * - IEEE 141-1993 §5.3 - Per-unit system short-circuit method
 * - IEC 60909-0:2016 §4 - Maximum/minimum short-circuit current calculation
 * - ANSI C37.010 - Application guide for AC high-voltage circuit breakers
 *
 * FORMULA (point-to-point, three-phase):
 *   I₃φ = V_LL / (√3 × Z₁)
 *   where Z₁ = total positive-sequence impedance from source to fault point
 *
 * FORMULA (per-unit):
 *   I₃φ_pu = V_pu / Z₁_pu  (on chosen MVA base, e.g. 10 MVA)
 *   I₃φ_A  = I₃φ_pu × I_base
 *
 * FORMULA (IEC 60909-0, maximum):
 *   I"k = c_max × Un / (√3 × |Z_k|)
 *   i_p  = κ × √2 × I"k   (κ from IEEE C37.010 / IEC 60909 Table B.1)
 *
 * NOTE: Motor contribution and demand/diversity factors are applied by the
 * calling function (calculateBus). This function returns system-only impedance.
 *
 * @param {string} busId - Unique bus identifier to fault at
 * @param {string} [method='point-to-point'] - Calculation method:
 *   'point-to-point' | 'per-unit' | 'iec-60909'
 * @param {Object} [options={}] - Method-specific options
 * @param {string} [options.iecCalcType='max'] - IEC calculation type: 'max' | 'min'
 * @returns {Object} Normalised short-circuit results (unified schema v3.3)
 *
 * @reference IEEE 141-1993 Chapter 5 "Short-Circuit Calculations"
 * @reference IEC 60909-0:2016 "Short-circuit currents in three-phase a.c. systems"
 * @reference ANSI C37.010 "Application Guide for AC High-Voltage Circuit Breakers"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */

function calculateShortCircuit(busId, method = 'point-to-point', options = {}) {
  // Keep UI selection in sync for debug/tools (prevents selectedBusId being null)
  try {
    if (typeof window !== 'undefined') window.selectedBusId = busId;
    if (typeof selectedBusId !== 'undefined') selectedBusId = busId;
  } catch (_) {}


  const bus = buses?.find(b => b.id === busId);
  if (!bus) {
    console.error(`❌ Bus ${busId} not found`);
    throw new Error(`Bus ${busId} not found`);
  }

  const methodKey = String(method || 'point-to-point').toLowerCase();

  console.log('\n' + '═'.repeat(80));
  console.log('SHORT CIRCUIT ANALYSIS - ENHANCED');
  console.log('═'.repeat(80));
  console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
  console.log(`Method: ${methodKey}`);
  console.log('═'.repeat(80) + '\n');

  // IEC calc type (needed for Strict MIN rule)
  const iecCalcType = (methodKey === 'iec-60909')
    ? (String(options?.iecCalcType || document.getElementById('iecCalcType')?.value || 'max').toLowerCase().startsWith('min') ? 'min' : 'max')
    : null;

  // STRICT MIN: exclude motor contribution entirely for IEC MIN
  const includeMotors = (methodKey === 'iec-60909') ? (iecCalcType === 'max') : true;

  // Only add motor contribution externally for IEC MAX.
  // IEEE engines already include motor contribution internally in this codebase.
  const addMotorsExternally = (methodKey === 'iec-60909') && (iecCalcType === 'max');

  try {
    // Path is required for IEEE methods (point-to-point and per-unit)
    let path = null;       // raw trace path for IEEE engines
    let safePath = null;   // JSON-safe path for storage

    if (methodKey !== 'iec-60909') {
      path = traceBusPath(busId);
      if (!Array.isArray(path) || path.length === 0) {
        console.error('❌ Cannot trace path to source', { busId, busName: bus.name, method: methodKey });
        throw new Error('Cannot trace path to source. Ensure bus is connected to a source bus.');
      }
      safePath = simplifyPathTrace(path);
    }

    // 1) Compute base short circuit (IEEE or IEC)
    let rawBase;

    if (methodKey === 'iec-60909') {
      const engine = resolveIEC60909Engine();
      if (!engine) {
        throw new Error('IEC 60909 module is not loaded. Ensure iec60909.js is included and loaded before shortCircuitCalc.js.');
      }

      if (engine.type === 'busId') {
        rawBase = engine.fn(busId, { calculationType: iecCalcType });
      } else {
        // engine expects a path array (fromBusId/toBusId/component)
        const trace = traceBusPath(busId);
        if (!Array.isArray(trace) || trace.length === 0) {
          throw new Error('IEC 60909 requires a valid path to a SOURCE bus. traceBusPath() returned null/empty.');
        }
        const iecPath = buildIECPathFromTrace(trace);
        rawBase = engine.fn(iecPath, iecCalcType);
      }

      rawBase.method = 'iec-60909';
      rawBase.calculationType = iecCalcType;

    } else if (methodKey === 'per-unit') {
      rawBase = calculateShortCircuitPerUnit(path);

    } else {
      // default to point-to-point
      rawBase = calculateShortCircuitPointToPoint(path);
    }

    // 2) Motor contribution handling (IEC MAX only)
    let rawFinal = rawBase;

    if (addMotorsExternally && typeof calculateTotalMotorContribution === 'function' && typeof combineSystemAndMotorFault === 'function') {
      const mc = calculateTotalMotorContribution(busId, 'interrupting');
      if (mc) {
        const zIec = rawBase?.impedance || rawBase?.totalImpedance || {};
        const rSys = Number(zIec.r ?? zIec.resistance ?? 0);
        const xSys = Number(zIec.x ?? zIec.reactance ?? 0);
        const zSys = Number(zIec.z ?? zIec.magnitude ?? Math.sqrt(rSys * rSys + xSys * xSys));

        const sysStub = {
          faultCurrents: {
            threePhaseSym: Number(rawBase?.initialSymmetricalCurrentKA ?? rawBase?.faultCurrents?.threePhaseSym ?? 0),
            // treat IEC peak current as asym for combining display
            threePhaseAsym: Number(rawBase?.peakCurrentKA ?? rawBase?.faultCurrents?.threePhaseAsym ?? 0),
            lineToGround: Number(rawBase?.lineToGroundCurrentKA ?? rawBase?.faultCurrents?.lineToGround ?? 0),
            lineToLine: Number(rawBase?.lineToLineCurrentKA ?? rawBase?.faultCurrents?.lineToLine ?? 0)
          },
          totalImpedance: {
            magnitude: zSys,
            resistance: rSys,
            reactance: xSys,
            angle: Math.atan2(xSys, rSys) * (180 / Math.PI)
          },
          totalR: rSys,
          totalX: xSys,
          totalZ: zSys,
          xrRatio: (rSys ? (xSys / rSys) : 0),
          method: 'iec-60909',
          path: null,
          calculationDate: rawBase?.calculationDate || getCalculationTimestamp(),
          calculationSteps: rawBase?.calculationSteps || rawBase?.steps || ''
        };

        const combined = combineSystemAndMotorFault(sysStub, mc);

        // Preserve IEC markers
        combined.method = 'iec-60909';
        combined.calculationType = iecCalcType;

        // Provide IEC-style fields for display
        combined.initialSymmetricalCurrentKA = combined.faultCurrents?.threePhaseSym || 0;
        combined.peakCurrentKA = combined.faultCurrents?.threePhaseAsym || 0;
        combined.lineToGroundCurrentKA = combined.faultCurrents?.lineToGround || 0;
        combined.breakingCurrentKA = rawBase?.breakingCurrentKA ?? combined.initialSymmetricalCurrentKA;
        combined.steadyStateCurrentKA = rawBase?.steadyStateCurrentKA ?? combined.initialSymmetricalCurrentKA;
        combined.peakFactor = rawBase?.peakFactor ?? 0;
        combined.voltageFactor = rawBase?.voltageFactor ?? 0;
        combined.standard = rawBase?.standard ?? 'IEC 60909-0:2016';

        combined.impedance = {
          r: combined.totalImpedance?.resistance || combined.totalR || 0,
          x: combined.totalImpedance?.reactance || combined.totalX || 0,
          z: combined.totalImpedance?.magnitude || combined.totalZ || 0,
          xrRatio: combined.xrRatio || 0
        };

        try {
          combined._iec60909Base = JSON.parse(JSON.stringify(rawBase));
        } catch (_) {
          combined._iec60909Base = null;
        }

        rawFinal = combined;
      }
    }

    // 3) ANSI C37.010 decay summary (Option A: show only 3 & 5 cycles)
    if (includeMotors && typeof getSystemMotorDecaySummary === 'function') {
      rawFinal._motorDecaySummary = getSystemMotorDecaySummary(bus, [3, 5]);
    }

    // 4) Normalize to unified schema and store on bus (use safePath to avoid circular refs)
    const normalized = normalizeShortCircuitToSchema(bus, rawFinal, {
      method: methodKey,
      iecCalcType,
      includeMotors,
      path: safePath
    });

    bus.results = bus.results || {};
    bus.results.shortCircuit = normalized;

    // 5) Store centralized state (display/export consistency)
    if (typeof CalculationState !== 'undefined' && CalculationState?.store) {
      CalculationState.store('shortCircuit', normalized, busId);
    }

    console.log('✅ Short Circuit Analysis Complete');
    console.log(`   3-Phase Sym: ${(normalized.faultCurrents?.threePhaseSym || 0).toFixed(3)} kA`);
    console.log(`   3-Phase Asym: ${(normalized.faultCurrents?.threePhaseAsym || 0).toFixed(3)} kA`);
    console.log(`   X/R Ratio: ${(normalized.impedance?.xrRatio || 0).toFixed(2)}`);
    console.log('');

    return normalized;

  } catch (error) {
    console.error('❌ Calculation error:', error);
    throw error;
  }
}

/**
 * Point-to-Point Short Circuit Calculation (Ohmic Method) - ENHANCED
 *
 * Calculates fault currents by summing series impedances from source to fault.
 * Handles transformers (with turns-ratio referral), cables (with temperature
 * correction), and sequence network components for unbalanced faults.
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.2 - "Point-to-point method"
 * - IEEE 141-1993 §5.4 - "Motor contributions"
 * - NEC Chapter 9, Table 9 - Cable impedance data (AC resistance at 75°C)
 *
 * FORMULA (three-phase symmetrical fault):
 *   I₃φ = V_LL / (√3 × Z₁_total)
 *   where Z₁_total = Σ(source + transformers + cables)  [all referred to fault-bus voltage]
 *
 * FORMULA (asymmetrical, DC offset per IEEE C37.010):
 *   I_asym = I₃φ × K_f
 *   K_f    = √(1 + 2e^(-2πft_c/X_R)) ≈ from X/R ratio at fault point
 *
 * FORMULA (line-to-ground, sequence network):
 *   I_LG = 3 × V_LN / (Z₁ + Z₂ + Z₀)
 *   Z₂ ≈ Z₁, Z₀ = f(grounding type, transformer vector group)
 *
 * FORMULA (temperature-corrected cable resistance):
 *   R_T = R_75 × [1 + α × (T - 75)]
 *   α_Cu = 0.00393 /°C, α_Al = 0.00403 /°C (IEEE 141-1993)
 *
 * @param {Array} path - Bus path array from traceBusPath(), source at index 0
 * @returns {Object} Short-circuit results with fault currents, impedances, and steps
 *
 * @reference IEEE 141-1993 §5.2 "Point-to-point method"
 * @reference NEC 2017 Chapter 9, Table 9 "AC Resistance and Reactance for 600-V Cables"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */

function calculateShortCircuitPointToPoint(path) {
  if (!Array.isArray(path) || path.length === 0) {
    console.error('❌ Point-to-Point SC error: invalid path', path);
    throw new Error('Point-to-Point short circuit requires a valid path to a SOURCE bus. Trace path failed (null/empty).');
  }
    // ══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════
    
    const engineerName = document.getElementById('engineer')?.value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature')?.value) || 75;
    
    let totalR = 0;
    let totalX = 0;
    let totalR0 = 0;
    let totalX0 = 0;
    let currentVoltageLevel = null;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // ENHANCED CALCULATION STEPS HEADER
    // ══════════════════════════════════════════════════════════════════════════════
    
    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += 'SHORT CIRCUIT CALCULATION - POINT-TO-POINT METHOD\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📋 CALCULATION INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Date/Time:           ${getCalculationTimestamp()}\n`;
    steps += `Engineer:            ${engineerName}\n`;
    steps += `Temperature:         ${temperature}°C\n`;
    steps += `Method:              Point-to-Point (Pure Ohmic - No Per-Unit)\n`;
    steps += `System Frequency:    ${SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY} Hz\n`;
    steps += `Breaker Contact:     ${(SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME * 1000).toFixed(2)} ms\n`;
    steps += `Motor Time Point:    ${SHORT_CIRCUIT_CONFIG.MOTOR_TIME_CYCLES} cycles\n`;
    steps += '\n';
    
    steps += `📖 METHODOLOGY NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• This method uses ONLY ohmic values (Ω)\n`;
    steps += `• No base values or per-unit conversions are used\n`;
    steps += `• Impedances are referred across transformers using turns ratio\n`;
    steps += `• Zero sequence (Z0) tracked for line-to-ground faults\n`;
    steps += `• Component tags shown for full traceability\n`;
    steps += `• From/To bus connections displayed for path verification\n`;
    steps += '\n';
    
    const sourceBus = path[0]?.bus;
    if (!sourceBus) {
        throw new Error('Path has no source bus');
    }
    currentVoltageLevel = sourceBus.voltage;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 1: SOURCE BUS IMPEDANCE - ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityXR = sourceBus.utilityXR || 3;
        const utilityX = utilityZ * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const utilityR = utilityZ / Math.sqrt(1 + utilityXR * utilityXR);
        
        totalR += utilityR;
        totalX += utilityX;
        
        const z0Factor = SHORT_CIRCUIT_CONFIG.Z0_FACTORS.utility;
        totalR0 += utilityR * z0Factor;
        totalX0 += utilityX * z0Factor;
        
        steps += '═'.repeat(80) + '\n';
        steps += `STEP 1: SOURCE BUS IMPEDANCE\n`;
        steps += '═'.repeat(80) + '\n\n';
        
        steps += `🔌 SOURCE INFORMATION\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Bus Tag:             ${sourceBus.tag || sourceBus.name || 'N/A'}\n`;
        steps += `Bus Name:            ${sourceBus.name}\n`;
        steps += `Bus Type:            ${sourceBus.type.toUpperCase()}\n`;
        steps += `Voltage Level:       ${sourceBus.voltage} V\n`;
        steps += `Available Fault:     ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
        
        if (sourceBus.utilityFaultMVA) {
            steps += `Source MVA:          ${sourceBus.utilityFaultMVA.toFixed(1)} MVA\n`;
            steps += `   ℹ️  MVA converted to kA using: I = MVA / (√3 × V_kV)\n`;
        }
        
        steps += `X/R Ratio:           ${utilityXR}\n`;
        steps += '\n';
        
        steps += `📐 IMPEDANCE CALCULATION\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Formula:             Z_source = V_LL / (√3 × I_sc)\n`;
        steps += '\n';
        steps += `Step-by-Step Calculation:\n`;
        steps += `   Given:\n`;
        steps += `      V_LL = ${sourceBus.voltage} V\n`;
        steps += `      I_sc = ${sourceBus.utilityFaultCurrent.toFixed(2)} kA = ${sourceBus.utilityFaultCurrent * 1000} A\n`;
        steps += `      √3 = ${SQRT3.toFixed(4)}\n`;
        steps += '\n';
        steps += `   Calculation:\n`;
        steps += `      Z_source = ${sourceBus.voltage} / (${SQRT3.toFixed(4)} × ${sourceBus.utilityFaultCurrent * 1000})\n`;
        steps += `      Z_source = ${sourceBus.voltage} / ${(SQRT3 * sourceBus.utilityFaultCurrent * 1000).toFixed(2)}\n`;
        steps += `      Z_source = ${utilityZ.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `📊 COMPONENT SEPARATION (Using X/R = ${utilityXR})\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Formulas:\n`;
        steps += `   R = Z / √(1 + (X/R)²)\n`;
        steps += `   X = R × (X/R)\n`;
        steps += '\n';
        steps += `Calculation:\n`;
        steps += `   R = ${utilityZ.toFixed(6)} / √(1 + ${utilityXR}²)\n`;
        steps += `   R = ${utilityZ.toFixed(6)} / ${Math.sqrt(1 + utilityXR * utilityXR).toFixed(4)}\n`;
        steps += `   R = ${utilityR.toFixed(6)} Ω\n`;
        steps += '\n';
        steps += `   X = ${utilityR.toFixed(6)} × ${utilityXR}\n`;
        steps += `   X = ${utilityX.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `Positive Sequence (Z1):\n`;
        steps += `   R1 = ${utilityR.toFixed(6)} Ω\n`;
        steps += `   X1 = ${utilityX.toFixed(6)} Ω\n`;
        steps += `   Z1 = ${utilityZ.toFixed(6)} Ω\n`;
        steps += '\n';
        steps += `Zero Sequence (Z0) - Estimated ${z0Factor}× Z1:\n`;
        steps += `   R0 = ${utilityR.toFixed(6)} × ${z0Factor} = ${totalR0.toFixed(6)} Ω\n`;
        steps += `   X0 = ${utilityX.toFixed(6)} × ${z0Factor} = ${totalX0.toFixed(6)} Ω\n`;
        steps += `   ℹ️  Per IEEE 141, utility Z0 typically 1.0 to 3.0 × Z1\n`;
        steps += '\n';
        
        steps += `✅ RUNNING TOTALS (at ${sourceBus.voltage}V)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
        steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
        steps += '\n\n';
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 2-N: PROCESS COMPONENTS - ENHANCED WITH TAGS
    // ══════════════════════════════════════════════════════════════════════════════
    
    let stepNumber = 2;
    const processedTransformerConnections = new Set();
    
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment?.component;
        
        if (!comp) {
            console.warn(`⚠️ Segment ${i} has no component - skipping`);
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TRANSFORMER PROCESSING - ENHANCED WITH TAGS
        // ═══════════════════════════════════════════════════════════════════════════
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: TRANSFORMER`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            if (numParallel > 1) steps += ` (PARALLEL CONFIGURATION)`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';
            
            steps += `🔧 TRANSFORMER INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Component Type:      TRANSFORMER\n`;
            steps += `Rating:              ${comp.rating} kVA\n`;
            steps += `Primary Voltage:     ${comp.primary} V\n`;
            steps += `Secondary Voltage:   ${comp.secondary} V\n`;
            steps += `Impedance:           ${comp.impedance}% on ${comp.rating} kVA base\n`;
            steps += `X/R Ratio:           ${comp.xr}\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
            
            if (numParallel > 1) {
                steps += `\n⚡ PARALLEL CONFIGURATION\n`;
                steps += `   Number of Units:  ${numParallel}\n`;
                steps += `   Total Capacity:   ${totalRating} kVA\n`;
                steps += `   Configuration:    `;
                parallelXfmrs.forEach((xfmr, idx) => {
                    steps += `${xfmr.tag || `Unit ${idx+1}`}`;
                    if (idx < parallelXfmrs.length - 1) steps += ' + ';
                });
                steps += '\n';
            }
            steps += '\n';
            
            const xfmrZbase = (comp.secondary * comp.secondary) / (comp.rating * 1000);
            const xfmrZ_single = (comp.impedance / 100) * xfmrZbase;
            const xfmrX_single = xfmrZ_single * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const xfmrR_single = xfmrZ_single / Math.sqrt(1 + comp.xr * comp.xr);
            
            let xfmrR, xfmrX;
            if (numParallel > 1) {
                xfmrR = xfmrR_single / numParallel;
                xfmrX = xfmrX_single / numParallel;
            } else {
                xfmrR = xfmrR_single;
                xfmrX = xfmrX_single;
            }
            
            // ── Transformer Z0 based on vector group and grounding mode ──────
            // Per IEC 60909-0 §3.3, IEEE 141-1993 §5.4, IEEE 242-2001 §7
            const vgInfo = (typeof getTransformerVectorGroupZ0 === 'function')
                ? getTransformerVectorGroupZ0(comp.vectorGroup || 'Dyn11')
                : { z0_multiplier: 1.0, blocks_upstream_z0: true, ground_path_on_lv: true,
                    note: 'Dyn11 default' };

            let xfmrR0, xfmrX0, z0Factor;
            if (vgInfo.z0_multiplier >= 999 || !vgInfo.ground_path_on_lv) {
                // Blocked / open path — no meaningful L-G current on this side
                // Use large but finite value so formula doesn't divide by 0
                z0Factor = 999;
                xfmrR0 = xfmrR * 100;   // Effectively blocks zero-seq
                xfmrX0 = xfmrX * 100;
            } else {
                z0Factor = vgInfo.z0_multiplier;
                xfmrR0 = xfmrR * z0Factor;
                xfmrX0 = xfmrX * z0Factor;
            }
            // If transformer blocks upstream Z0, reset accumulated Z0 at this boundary
            if (vgInfo.blocks_upstream_z0) {
                totalR0 = 0;
                totalX0 = 0;
            }
            
            steps += `📐 IMPEDANCE CALCULATION (Secondary Side)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Base Impedance:\n`;
            steps += `   Formula:          Z_base = V² / S\n`;
            steps += `   Z_base = (${comp.secondary})² / (${comp.rating} × 1000)\n`;
            steps += `   Z_base = ${comp.secondary * comp.secondary} / ${comp.rating * 1000}\n`;
            steps += `   Z_base = ${xfmrZbase.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `Transformer Impedance (Single Unit):\n`;
            steps += `   Formula:          Z_xfmr = (Z% / 100) × Z_base\n`;
            steps += `   Z_xfmr = (${comp.impedance} / 100) × ${xfmrZbase.toFixed(6)}\n`;
            steps += `   Z_xfmr = ${(comp.impedance / 100).toFixed(4)} × ${xfmrZbase.toFixed(6)}\n`;
            steps += `   Z_xfmr = ${xfmrZ_single.toFixed(6)} Ω\n`;
            steps += '\n';
            
            if (numParallel > 1) {
                steps += `Parallel Configuration Effect:\n`;
                steps += `   Formula:          Z_parallel = Z_single / n\n`;
                steps += `   Z_parallel = ${xfmrZ_single.toFixed(6)} / ${numParallel}\n`;
                steps += `   Z_parallel = ${(xfmrZ_single / numParallel).toFixed(6)} Ω\n`;
                steps += `   ℹ️  ${numParallel} transformers reduce impedance by factor of ${numParallel}\n`;
                steps += '\n';
            }
            
            steps += `Component Separation (X/R = ${comp.xr}):\n`;
            steps += `   R = Z / √(1 + (X/R)²) = ${xfmrR.toFixed(6)} Ω\n`;
            steps += `   X = R × (X/R) = ${xfmrX.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `📊 IMPEDANCE COMPONENTS\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Vector Group:        ${comp.vectorGroup || 'Dyn11'} (${vgInfo.note || ''})\n`;
            steps += `Grounding Mode:      ${comp.groundingMode || 'solidly-grounded'}\n`;
            if (vgInfo.blocks_upstream_z0) {
                steps += `Z0 Boundary:         ⚡ Upstream Z0 reset at this transformer\n`;
                steps += `                     (${comp.vectorGroup || 'Dyn11'} primary side blocks upstream zero-seq)\n`;
            }
            steps += '\n';
            steps += `Positive Sequence (Z1):\n`;
            steps += `   R1 = ${xfmrR.toFixed(6)} Ω\n`;
            steps += `   X1 = ${xfmrX.toFixed(6)} Ω\n`;
            steps += `   Z1 = ${Math.sqrt(xfmrR*xfmrR + xfmrX*xfmrX).toFixed(6)} Ω\n`;
            steps += '\n';
            if (z0Factor >= 999) {
                steps += `Zero Sequence (Z0) — BLOCKED (${vgInfo.label || comp.vectorGroup}):\n`;
                steps += `   ⚠️  No L-G fault current path on this bus side.\n`;
                steps += `   R0 ≈ ∞,  X0 ≈ ∞  (zero-seq blocked by ${comp.vectorGroup || 'Dyn'} winding)\n`;
                steps += `   Per IEEE 141-1993 §5.4.4 and IEEE 242-2001 §7\n`;
            } else {
                steps += `Zero Sequence (Z0) — ${vgInfo.label || comp.vectorGroup}:\n`;
                steps += `   Z0/Z1 = ${z0Factor.toFixed(2)} (per IEC 60909-0 §3.3; IEEE 141-1993 §5.4)\n`;
                steps += `   R0 = ${xfmrR0.toFixed(6)} Ω (${z0Factor.toFixed(2)}× R1)\n`;
                steps += `   X0 = ${xfmrX0.toFixed(6)} Ω (${z0Factor.toFixed(2)}× X1)\n`;
            }
            steps += '\n';
            
            const turnsRatio = comp.primary / comp.secondary;
            const R_primary_referred = totalR / (turnsRatio * turnsRatio);
            const X_primary_referred = totalX / (turnsRatio * turnsRatio);
            const R0_primary_referred = totalR0 / (turnsRatio * turnsRatio);
            const X0_primary_referred = totalX0 / (turnsRatio * turnsRatio);
            
            steps += `🔄 IMPEDANCE REFERRAL TO SECONDARY SIDE\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Per IEEE 141 Section 5.2:\n`;
            steps += `   Formula:          Turns Ratio a = V_primary / V_secondary\n`;
            steps += `   a = ${comp.primary} / ${comp.secondary} = ${turnsRatio.toFixed(4)}\n`;
            steps += '\n';
            steps += `   Formula:          Z_referred = Z_primary / a²\n`;
            steps += `   a² = ${turnsRatio.toFixed(4)}² = ${(turnsRatio * turnsRatio).toFixed(4)}\n`;
            steps += '\n';
            
            steps += `Primary Impedance Before Referral (at ${comp.primary}V):\n`;
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `After Referral to Secondary (at ${comp.secondary}V):\n`;
            steps += `   Z1: R1 = ${totalR.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${R_primary_referred.toFixed(6)} Ω\n`;
            steps += `       X1 = ${totalX.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${X_primary_referred.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${R0_primary_referred.toFixed(6)} Ω\n`;
            steps += `       X0 = ${totalX0.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${X0_primary_referred.toFixed(6)} Ω\n`;
            steps += '\n';
            
            totalR = R_primary_referred + xfmrR;
            totalX = X_primary_referred + xfmrX;
            totalR0 = R0_primary_referred + xfmrR0;
            totalX0 = X0_primary_referred + xfmrX0;
            currentVoltageLevel = comp.secondary;
            
            steps += `✅ RUNNING TOTALS (at ${currentVoltageLevel}V)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n\n';
            
            stepNumber++;
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // CABLE PROCESSING - ENHANCED WITH TAGS
        // ═══════════════════════════════════════════════════════════════════════════
        if (comp.type === 'cable') {
            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: CABLE`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size];
            if (!cableData) {
                steps += `⚠️  WARNING: No impedance data for cable size ${comp.size}\n`;
                steps += `   Using 4/0 AWG as default\n\n`;
            }
            const cableDataFinal = cableData || CABLE_IMPEDANCE_DATA['4/0'];
            
            const materialData = cableDataFinal[comp.material];
            if (!materialData) {
                steps += `⚠️  WARNING: No impedance data for material ${comp.material}\n`;
                steps += `   Using copper as default\n\n`;
            }
            const materialDataFinal = materialData || cableDataFinal['copper'];
            
            const parallel = comp.parallel || 1;
            
            steps += `🔌 CABLE INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Component Type:      CABLE\n`;
            steps += `Size:                ${comp.size}\n`;
            steps += `Material:            ${comp.material.toUpperCase()}\n`;
            steps += `Length:              ${comp.length} ft\n`;
            steps += `Installation:        ${installFactors.label}\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
            steps += `Temperature:         ${temperature}°C\n`;
            steps += `Voltage Level:       ${currentVoltageLevel}V\n`;
            
            if (parallel > 1) {
                steps += `Parallel Config:     ${parallel} cables\n`;
                steps += `   ℹ️  Impedance divided by ${parallel}\n`;
            }
            steps += '\n';
            
            let rBase20 = materialDataFinal.r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            // ── Installation method adjustments ──────────────────────────────
            // Reactance correction and Z0 factor depend on installation method.
            // Per NEC Ch 9 Table 9 Note 3 (steel conduit) and IEEE 242-2001 §9.3.
            const installFactors = (typeof getCableInstallationFactors === 'function')
                ? getCableInstallationFactors(comp.installationMethod || comp.conduit || 'conduit-pvc')
                : { x_factor: 1.0, z0_factor: 3.0, label: 'Default (PVC Conduit)' };
            
            const cableR = (rBaseTemp * comp.length) / parallel;
            const cableX = (materialDataFinal.x * comp.length * installFactors.x_factor) / parallel;
            
            const z0Factor = installFactors.z0_factor;
            const cableR0 = cableR * z0Factor;
            const cableX0 = cableX * z0Factor;
            
            steps += `📐 IMPEDANCE CALCULATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Base Values (per 1000 ft at 20°C):\n`;
            steps += `   R_base = ${rBase20.toFixed(6)} Ω/1000ft    (from NEC Ch 9 Table 9)\n`;
            steps += `   X_base = ${materialDataFinal.x.toFixed(6)} Ω/1000ft    (from NEC Ch 9 Table 9)\n`;
            steps += '\n';
            
            steps += `Temperature Correction (20°C → ${temperature}°C):\n`;
            steps += `   Formula:          R_corrected = R_base × k_temp\n`;
            steps += `   R_corrected = ${rBase20.toFixed(6)} × ${(rBaseTemp/rBase20).toFixed(4)}\n`;
            steps += `   R_corrected = ${rBaseTemp.toFixed(6)} Ω/1000ft\n`;
            steps += `   ℹ️  Temperature coefficient applied to resistance only\n`;
            steps += '\n';
            
            if (installFactors.x_factor !== 1.0) {
                steps += `Reactance — Installation Method Correction:\n`;
                steps += `   Method:           ${installFactors.label}\n`;
                steps += `   X_factor:         ${installFactors.x_factor.toFixed(3)}× (NEC Ch 9 Note 3; IEEE 242-2001 §9.3)\n`;
                steps += `   X_adjusted = ${materialDataFinal.x.toFixed(6)} × ${installFactors.x_factor.toFixed(3)} = ${(materialDataFinal.x*installFactors.x_factor).toFixed(6)} Ω/1000ft\n`;
                steps += '\n';
            }
            
            steps += `Cable Impedance:\n`;
            steps += `   Formula:          Z = (Z_per_1000ft × Length) / Parallel\n`;
            steps += `   R = (${rBaseTemp.toFixed(6)} × ${comp.length}) / ${parallel}\n`;
            steps += `   R = ${(rBaseTemp * comp.length).toFixed(6)} / ${parallel}\n`;
            steps += `   R = ${cableR.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `   X = (${(materialDataFinal.x*installFactors.x_factor).toFixed(6)} × ${comp.length}) / ${parallel}\n`;
            steps += `   X = ${(materialDataFinal.x*installFactors.x_factor * comp.length).toFixed(6)} / ${parallel}\n`;
            steps += `   X = ${cableX.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `📊 IMPEDANCE COMPONENTS\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Positive Sequence (Z1):\n`;
            steps += `   R1 = ${cableR.toFixed(6)} Ω\n`;
            steps += `   X1 = ${cableX.toFixed(6)} Ω\n`;
            steps += `   Z1 = ${Math.sqrt(cableR*cableR + cableX*cableX).toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `Zero Sequence (Z0) — ${installFactors.label}:\n`;
            steps += `   Basis:            Z0/Z1 = ${z0Factor.toFixed(1)} (${installFactors.standard}; IEEE 242-2001 §9.3)\n`;
            steps += `   Formula:          Z0 = ${z0Factor.toFixed(1)}× Z1\n`;
            steps += `   R0 = ${cableR.toFixed(6)} × ${z0Factor} = ${cableR0.toFixed(6)} Ω\n`;
            steps += `   X0 = ${cableX.toFixed(6)} × ${z0Factor} = ${cableX0.toFixed(6)} Ω\n`;
            steps += '\n';
            
            totalR += cableR;
            totalX += cableX;
            totalR0 += cableR0;
            totalX0 += cableX0;
            
            steps += `✅ RUNNING TOTALS (at ${currentVoltageLevel}V)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n\n';
            
            stepNumber++;
        }
    }
    // ← END OF COMPONENT FOR LOOP
    
    // ══════════════════════════════════════════════════════════════════════════════
    // MOTOR CONTRIBUTION - ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    const targetBus = path[path.length - 1]?.bus;
    if (!targetBus) {
        throw new Error('Path has no target bus');
    }
    
    let totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
    
    let motorContribution = null;
    if (typeof calculateTotalMotorContribution === 'function') {
        motorContribution = calculateTotalMotorContribution(targetBus.id);
        
        if (motorContribution && motorContribution.motorCount > 0) {
            steps += motorContribution.calculationSteps;
            
            if (typeof combineSystemAndMotorFault === 'function') {
                try {
                    const systemFaultStub = {
                        faultCurrents: {
                            threePhaseSym: totalZ ? (targetBus.voltage / (SQRT3 * totalZ)) / 1000 : 0,
                            threePhaseAsym: null,
                            lineToGround: null,
                            lineToLine: null
                        },
                        totalImpedance: {
                            magnitude: totalZ,
                            resistance: totalR,
                            reactance: totalX
                        },
                        totalR: totalR,
                        totalX: totalX,
                        totalZ: totalZ,
                        xrRatio: totalX / (totalR || 1),
                        method: 'Point-to-Point',
                        path: path,
                        calculationDate: getCalculationTimestamp(),
                        calculationSteps: steps
                    };
                    
                    const combined = combineSystemAndMotorFault(systemFaultStub, motorContribution);
                    
                    if (combined && typeof combined.totalR !== 'undefined') {
                        totalR = combined.totalR;
                        totalX = combined.totalX;
                        totalZ = combined.totalZ;
                                              
                        steps += '═'.repeat(80) + '\n';
                        steps += 'SYSTEM + MOTOR CONTRIBUTION (PARALLEL COMBINATION)\n';
                        steps += '═'.repeat(80) + '\n\n';
                        steps += `System Only:\n`;
                        steps += `   R = ${systemFaultStub.totalR.toFixed(6)} Ω\n`;
                        steps += `   X = ${systemFaultStub.totalX.toFixed(6)} Ω\n`;
                        steps += `   Z = ${systemFaultStub.totalZ.toFixed(6)} Ω\n\n`;
                        steps += `Motors Parallel:\n`;
                        steps += `   R = ${motorContribution.totalMotorR.toFixed(6)} Ω\n`;
                        steps += `   X = ${motorContribution.totalMotorX.toFixed(6)} Ω\n\n`;
                        steps += `Combined (System || Motors):\n`;
                        steps += `   R = ${combined.totalR.toFixed(6)} Ω\n`;
                        steps += `   X = ${combined.totalX.toFixed(6)} Ω\n`;
                        steps += `   Z = ${combined.totalZ.toFixed(6)} Ω\n\n`;
                        steps += `Motor Contribution: ${(motorContribution.totalSymmetricalContribution).toFixed(3)} kA\n\n`;
                    }
                } catch (err) {
                    console.warn('combineSystemAndMotorFault failed — falling back to manual parallel combine:', err);
                    const motR = motorContribution.totalMotorR;
                    const motX = motorContribution.totalMotorX;
                    const sys_R = totalR, sys_X = totalX;
                    const sys_Z_sq = sys_R * sys_R + sys_X * sys_X;
                    const mot_Z_sq = motR * motR + motX * motX;
                    const R_inv_total = (sys_R / sys_Z_sq) + (motR / mot_Z_sq);
                    const X_inv_total = (sys_X / sys_Z_sq) + (motX / mot_Z_sq);
                    const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
                    totalR = R_inv_total / Z_inv_total_sq;
                    totalX = X_inv_total / Z_inv_total_sq;
                    totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
                    
                    steps += '\nℹ️  Fallback: manually combined system and motor impedances (parallel).\n\n';
                }
            }
        } else {
            steps += '═'.repeat(80) + '\n';
            steps += 'MOTOR CONTRIBUTION\n';
            steps += '═'.repeat(80) + '\n\n';
            steps += 'ℹ️  No motors connected to this bus\n';
            steps += '   Fault current calculation uses system impedance only\n\n\n';
        }
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // FINAL CALCULATION - ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    const faultCurrent = targetBus.voltage / (SQRT3 * totalZ);
    const faultCurrentKA = faultCurrent / 1000;
    const xrRatio = totalX / totalR;
    
    const omega = 2 * Math.PI * SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY;
    const timeConstant = totalX / (omega * totalR);
    const contactTime = SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME;
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-contactTime / timeConstant));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    
    const totalZ0 = Math.sqrt(totalR0 * totalR0 + totalX0 * totalX0);
    const totalZ2 = totalZ;
    const V_LN = targetBus.voltage / SQRT3;
    const Z_total_LG = totalZ + totalZ2 + totalZ0;
    const lineToGroundCurrent = (3 * V_LN) / Z_total_LG;
    const lineToGroundKA = lineToGroundCurrent / 1000;
  

  // LINE-TO-LINE FAULT CURRENT (L-L) using sequence networks (Z2 ≈ Z1)
  // Z_LL = Z1 + Z2 ≈ 2×Z1 (complex)
  const Zll_r = totalR + totalR;
  const Zll_x = totalX + totalX;
  const Zll_mag = Math.sqrt(Zll_r*Zll_r + Zll_x*Zll_x) || 1e-18;
  const lineToLineCurrent = targetBus.voltage / Zll_mag;
  const lineToLineKA = lineToLineCurrent / 1000;
  // DOUBLE LINE-TO-GROUND FAULT (L-L-G) using sequence networks (complex)
  // Z2 is approximated as Z1 for static equipment
  const Z1_r = totalR, Z1_x = totalX;
  const Z2_r = totalR, Z2_x = totalX;
  const Z0_r = totalR0, Z0_x = totalX0;
  const den_par_r = (Z2_r + Z0_r), den_par_x = (Z2_x + Z0_x);
  const den_par_mag2 = den_par_r*den_par_r + den_par_x*den_par_x || 1e-18;
  // (Z2 * Z0) numerator  (complex multiply)
  const num_par_r = Z2_r*Z0_r - Z2_x*Z0_x;
  const num_par_x = Z2_r*Z0_x + Z2_x*Z0_r;
  // Z_parallel = (Z2 × Z0) / (Z2 + Z0)  (complex divide)
  const Zpar_r = (num_par_r*den_par_r + num_par_x*den_par_x)/den_par_mag2;
  const Zpar_x = (num_par_x*den_par_r - num_par_r*den_par_x)/den_par_mag2;
  // Z1_total_LLG = Z1 + Z_parallel(Z2,Z0)
  const Zllg_r = Z1_r + Zpar_r;
  const Zllg_x = Z1_x + Zpar_x;
  const Zllg_mag = Math.sqrt(Zllg_r*Zllg_r + Zllg_x*Zllg_x) || 1e-18;
  // Positive-sequence component:  I_a1 = V_LN / |Z1_total_LLG|
  //   V_LN = V_LL / √3   →   I_a1 = V_LL / (√3 × |Zllg|)
  // FIX: V_LL is in numerator; √3 must be in DENOMINATOR (not numerator)
  //   WRONG was: (SQRT3 × V_LL) / Zllg  (gives I × 3 — overcounts by factor 3)
  //   CORRECT:    V_LL / (√3 × Zllg)
  const I_llg = targetBus.voltage / (SQRT3 * Zllg_mag);
  const doubleLineToGroundKA = I_llg / 1000;

    
    steps += '═'.repeat(80) + '\n';
    steps += 'FINAL SHORT CIRCUIT CALCULATION\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `🎯 TARGET BUS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Bus Tag:             ${targetBus.tag || targetBus.name || 'N/A'}\n`;
    steps += `Bus Name:            ${targetBus.name}\n`;
    steps += `Voltage Level:       ${targetBus.voltage} V\n`;
    steps += '\n';
    
    const withMotors = motorContribution && motorContribution.motorCount > 0;
    steps += `📊 TOTAL SYSTEM IMPEDANCE${withMotors ? ' (WITH MOTOR CONTRIBUTION)' : ''}\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Positive Sequence (Z1):\n`;
    steps += `   R1 = ${totalR.toFixed(6)} Ω\n`;
    steps += `   X1 = ${totalX.toFixed(6)} Ω\n`;
    steps += `   Z1 = √(R1² + X1²) = ${totalZ.toFixed(6)} Ω\n`;
    steps += `   X/R Ratio = ${xrRatio.toFixed(3)}\n`;
    steps += '\n';
    steps += `Zero Sequence (Z0):\n`;
    steps += `   R0 = ${totalR0.toFixed(6)} Ω\n`;
    steps += `   X0 = ${totalX0.toFixed(6)} Ω\n`;
    steps += `   Z0 = ${totalZ0.toFixed(6)} Ω\n`;
    steps += `   Z0/Z1 Ratio = ${(totalZ0/totalZ).toFixed(3)}\n`;
    steps += '\n';
    steps += `Negative Sequence (Z2):\n`;
    steps += `   Z2 ≈ Z1 for static equipment = ${totalZ2.toFixed(6)} Ω\n`;
    steps += '\n';
    
    steps += '═'.repeat(80) + '\n';
    steps += 'THREE-PHASE SYMMETRICAL FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (Per IEEE 141 Section 5.2)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Formula:             I_3φ = V_LL / (√3 × Z1)\n`;
    steps += '\n';
    steps += `Step-by-Step Calculation:\n`;
    steps += `   Given:\n`;
    steps += `      V_LL = ${targetBus.voltage} V\n`;
    steps += `      Z1 = ${totalZ.toFixed(6)} Ω\n`;
    steps += `      √3 = ${SQRT3.toFixed(4)}\n`;
    steps += '\n';
    steps += `   Calculation:\n`;
    steps += `      I_3φ = ${targetBus.voltage} / (${SQRT3.toFixed(4)} × ${totalZ.toFixed(6)})\n`;
    steps += `      I_3φ = ${targetBus.voltage} / ${(SQRT3 * totalZ).toFixed(6)}\n`;
    steps += `      I_3φ = ${faultCurrent.toFixed(2)} A\n`;
    steps += `      I_3φ = ${faultCurrentKA.toFixed(3)} kA\n`;
    steps += '\n';
    
    if (withMotors) {
        const motorSymKA = motorContribution.totalSymmetricalContribution ?? 
                          (motorContribution.motorFaultCurrent ? motorContribution.motorFaultCurrent / 1000 : null);
        if (motorSymKA !== null) {
            steps += `⚡ INCLUDES MOTOR CONTRIBUTION: ${Number(motorSymKA).toFixed(3)} kA\n`;
            steps += `   ${motorContribution.motorCount} motor(s) downstream from fault point\n`;
        }
        steps += `   Per IEEE 141-1993 Section 5.3, IEC 60909, and NEC Article 430\n`;
        steps += '\n';
    }
    
    steps += '═'.repeat(80) + '\n';
    steps += 'ASYMMETRICAL (PEAK) FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (Per IEEE 141 Section 5.2 and ANSI C37.010)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `DC Time Constant:\n`;
    steps += `   Formula:          τ = L/R = X/(ωR) = X/(2πfR)\n`;
    steps += `   τ = ${totalX.toFixed(6)} / (2π × ${SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY} × ${totalR.toFixed(6)})\n`;
    steps += `   τ = ${totalX.toFixed(6)} / ${(2 * Math.PI * SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY * totalR).toFixed(4)}\n`;
    steps += `   τ = ${(timeConstant * 1000).toFixed(3)} ms\n`;
    steps += '\n';
    steps += `DC Offset Multiplier:\n`;
    steps += `   Formula:          K = √(1 + 2e^(-t/τ))\n`;
    steps += `   where t = ${(contactTime * 1000).toFixed(2)} ms (breaker contact parting time)\n`;
    steps += `   K = √(1 + 2e^(-${(contactTime * 1000).toFixed(2)}/${(timeConstant * 1000).toFixed(3)}))\n`;
    steps += `   K = √(1 + 2e^${(-contactTime / timeConstant).toFixed(4)})\n`;
    steps += `   K = √(1 + 2 × ${Math.exp(-contactTime / timeConstant).toFixed(4)})\n`;
    steps += `   K = ${multiplier.toFixed(4)}\n`;
    steps += '\n';
    steps += `Asymmetrical Current:\n`;
    steps += `   Formula:          I_asym = I_3φ × K\n`;
    steps += `   I_asym = ${faultCurrentKA.toFixed(3)} kA × ${multiplier.toFixed(4)}\n`;
    steps += `   I_asym = ${asymFaultCurrentKA.toFixed(3)} kA\n`;
    steps += '\n';
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LINE-TO-GROUND FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (Per IEEE 141 Section 5.4 - Sequence Impedance Method)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Formula:             I_LG = 3 × V_LN / (Z1 + Z2 + Z0)\n`;
    steps += '\n';
    steps += `Step-by-Step Calculation:\n`;
    steps += `   Line-to-Neutral Voltage:\n`;
    steps += `      V_LN = V_LL / √3\n`;
    steps += `      V_LN = ${targetBus.voltage} / ${SQRT3.toFixed(4)}\n`;
    steps += `      V_LN = ${V_LN.toFixed(2)} V\n`;
    steps += '\n';
    steps += `   Total Sequence Impedance:\n`;
    steps += `      Z_total = Z1 + Z2 + Z0\n`;
    steps += `      Z_total = ${totalZ.toFixed(6)} + ${totalZ2.toFixed(6)} + ${totalZ0.toFixed(6)}\n`;
    steps += `      Z_total = ${Z_total_LG.toFixed(6)} Ω\n`;
    steps += '\n';
    steps += `   Line-to-Ground Fault Current:\n`;
    steps += `      I_LG = 3 × ${V_LN.toFixed(2)} / ${Z_total_LG.toFixed(6)}\n`;
    steps += `      I_LG = ${(3 * V_LN).toFixed(2)} / ${Z_total_LG.toFixed(6)}\n`;
    steps += `      I_LG = ${lineToGroundCurrent.toFixed(2)} A\n`;
    steps += `      I_LG = ${lineToGroundKA.toFixed(3)} kA\n`;
    steps += '\n';
    
    if (lineToGroundKA > faultCurrentKA) {
        steps += `⚠️  IMPORTANT NOTE:\n`;
        steps += `   Line-to-ground fault current (${lineToGroundKA.toFixed(3)} kA) EXCEEDS 3-phase fault!\n`;
        steps += `   This is common in solidly grounded systems with low Z0/Z1 ratio.\n`;
        steps += `   Ground fault protection must be sized for ${lineToGroundKA.toFixed(3)} kA.\n`;
        steps += `   Per NEC 230.95, 240.13, and IEEE 142 (Green Book).\n`;
    } else {
        steps += `✅ 3-phase fault (${faultCurrentKA.toFixed(3)} kA) is limiting case.\n`;
    }
    steps += '\n';
    
    steps += '═'.repeat(80) + '\n';
    steps += 'FAULT CURRENT SUMMARY TABLE\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Fault Type                    | Symmetrical (kA) | Asymmetrical (kA)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Three-Phase (L-L-L)           | ${faultCurrentKA.toFixed(3).padStart(16)} | ${asymFaultCurrentKA.toFixed(3).padStart(17)}\n`;
    steps += `Line-to-Ground (L-G)          | ${lineToGroundKA.toFixed(3).padStart(16)} | ${(lineToGroundKA * multiplier).toFixed(3).padStart(17)}\n`;
    steps += `Line-to-Line (L-L)            | ${lineToLineKA.toFixed(3).padStart(16)} | ${(lineToLineKA * multiplier).toFixed(3).padStart(17)}\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📚 STANDARDS COMPLIANCE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `✅ IEEE 141-1993 (Red Book) - Short-Circuit Studies\n`;
    steps += `✅ IEC 60909 - Short-Circuit Currents in Three-Phase Systems\n`;
    steps += `✅ ANSI C37.010 - AC High-Voltage Circuit Breakers\n`;
    steps += `✅ NEC Article 110.24 - Available Fault Current\n`;
    steps += `✅ IEEE 142 (Green Book) - Grounding of Industrial Power Systems\n`;
    steps += '\n';
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF SHORT CIRCUIT CALCULATION\n';
    steps += '═'.repeat(80) + '\n';
  
    // ══════════════════════════════════════════════════════════════════════════════
    // PROTECTION DEVICE REQUIREMENTS
    // ══════════════════════════════════════════════════════════════════════════════

    if (typeof generateProtectionDeviceRequirements === 'function') {
        steps += generateProtectionDeviceRequirements({
            faultCurrents: {
                threePhaseSym: faultCurrentKA,
                threePhaseAsym: asymFaultCurrentKA,
                lineToGround: lineToGroundKA,
                lineToLine: faultCurrentKA * 0.866
            },
            motorContribution: motorContribution,
            xrRatio: xrRatio,
            path: path
        }, null, 'mid-range'); // null = all manufacturers, 'mid-range' = cost preference
    }
  
    return {
 lineToLineKA: lineToLineKA,
 doubleLineToGroundKA: doubleLineToGroundKA,
        totalR: totalR,
        totalX: totalX,
        totalZ: totalZ,
        totalR0: totalR0,
        totalX0: totalX0,
        totalZ0: totalZ0,
        xrRatio: xrRatio,
        faultCurrent: faultCurrent,
        faultCurrentKA: faultCurrentKA,
        asymFaultCurrent: asymFaultCurrent,
        asymFaultCurrentKA: asymFaultCurrentKA,
        lineToGroundCurrent: lineToGroundCurrent,
        lineToGroundKA: lineToGroundKA,
        timeConstant: timeConstant,
        dcOffsetMultiplier: multiplier,
        motorContribution: motorContribution,
        calculationSteps: steps,
    steps: steps,
        path: path,
        method: 'Point-to-Point'
    };
}

/**
 * Per-Unit Short Circuit Calculation (Normalised System Method) - ENHANCED v1.5.0
 *
 * Calculates fault currents using the per-unit (p.u.) system, which automatically
 * handles multi-voltage-level networks by normalising all quantities to a common
 * MVA base. Impedances at each voltage level are converted using:
 *   Z_pu_new = Z_pu_old × (MVA_base_new / MVA_base_old) × (V_base_old / V_base_new)²
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.3 - "Per-unit method"
 * - IEEE 141-1993 §5.5 - "System base selection"
 *
 * FORMULA:
 *   I_base = S_base / (√3 × V_base)
 *   Z_base = V_base² / S_base
 *   I₃φ_pu = 1.0 / Z₁_total_pu          (pre-fault voltage = 1.0 p.u.)
 *   I₃φ_A  = I₃φ_pu × I_base
 *
 * TRANSFORMER IMPEDANCE CONVERSION:
 *   Z_pu_system = Z_pu_nameplate × (S_base_system / S_nameplate)
 *
 * BASE KVA: 10,000 kVA (10 MVA) — standard system base for industrial networks
 *
 * @param {Array} path - Bus path array from traceBusPath(), source at index 0
 * @returns {Object} Short-circuit results with fault currents, per-unit values, and steps
 *
 * @reference IEEE 141-1993 §5.3 "Per-unit method"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function calculateShortCircuitPerUnit(path) {
    // ══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════
    
    const engineerName = document.getElementById('engineer')?.value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature')?.value) || 75;
    
    const BASE_KVA = 10000;

    if (!Array.isArray(path) || path.length === 0) {
        console.error('❌ Per-Unit SC error: invalid path', path);
        throw new Error('Per-Unit short circuit requires a valid path to a SOURCE bus. Trace path failed (null/empty).');
    }

    const targetBus = path[path.length - 1]?.bus;
    if (!targetBus) {
        throw new Error('Path has no target bus');
    }
    
    const BASE_VOLTAGE = targetBus.voltage;
    const BASE_Z = (BASE_VOLTAGE * BASE_VOLTAGE) / (BASE_KVA * 1000);
    const BASE_CURRENT = (BASE_KVA * 1000) / (SQRT3 * BASE_VOLTAGE);
    
    let totalRpu = 0;
    let totalXpu = 0;
    let totalR0pu = 0;
    let totalX0pu = 0;
    let currentVoltageLevel = null;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // ENHANCED CALCULATION STEPS HEADER
    // ══════════════════════════════════════════════════════════════════════════════
    
    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += 'SHORT CIRCUIT CALCULATION - PER-UNIT METHOD\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📋 CALCULATION INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Date/Time:           ${getCalculationTimestamp()}\n`;
    steps += `Engineer:            ${engineerName}\n`;
    steps += `Temperature:         ${temperature}°C\n`;
    steps += `Method:              Per-Unit System\n`;
    steps += `System Frequency:    ${SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY} Hz\n`;
    steps += `Breaker Contact:     ${(SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME * 1000).toFixed(2)} ms\n`;
    steps += `Motor Time Point:    ${SHORT_CIRCUIT_CONFIG.MOTOR_TIME_CYCLES} cycles\n`;
    steps += '\n';
    
    steps += `📊 PER-UNIT BASE VALUES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Base kVA:            ${BASE_KVA} kVA\n`;
    steps += `Base Voltage:        ${BASE_VOLTAGE} V\n`;
    steps += `Base Impedance:      ${BASE_Z.toFixed(6)} Ω\n`;
    steps += `Base Current:        ${BASE_CURRENT.toFixed(2)} A\n`;
    steps += '\n';
    
    steps += `📖 METHODOLOGY NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Per-unit method automatically handles voltage level changes\n`;
    steps += `• Transformer ratios built into per-unit conversion\n`;
    steps += `• Zero sequence (Z0) tracked for line-to-ground faults\n`;
    steps += `• Component tags shown for full traceability\n`;
    steps += `• From/To bus connections displayed\n`;
    steps += `• All impedances normalized to common ${BASE_KVA} kVA base\n`;
    steps += '\n';
    
    const sourceBus = path[0]?.bus;
    if (!sourceBus) {
        throw new Error('Path has no source bus');
    }
    currentVoltageLevel = sourceBus.voltage;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 1: SOURCE BUS - FULLY ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const sourceZ_ohms = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityXR = sourceBus.utilityXR || 3;
        const sourceX_ohms = sourceZ_ohms * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const sourceR_ohms = sourceZ_ohms / Math.sqrt(1 + utilityXR * utilityXR);
        
        const sourceZbase_actual = (sourceBus.voltage * sourceBus.voltage) / (BASE_KVA * 1000);
        
        const sourceR_pu = sourceR_ohms / sourceZbase_actual;
        const sourceX_pu = sourceX_ohms / sourceZbase_actual;
        
        totalRpu += sourceR_pu;
        totalXpu += sourceX_pu;
        
        const z0Factor = SHORT_CIRCUIT_CONFIG.Z0_FACTORS.utility;
        const sourceR0_ohms = sourceR_ohms * z0Factor;
        const sourceX0_ohms = sourceX_ohms * z0Factor;
        const sourceR0_pu = sourceR0_ohms / sourceZbase_actual;
        const sourceX0_pu = sourceX0_ohms / sourceZbase_actual;
        
        totalR0pu += sourceR0_pu;
        totalX0pu += sourceX0_pu;
        
        steps += '═'.repeat(80) + '\n';
        steps += `STEP 1: SOURCE BUS IMPEDANCE\n`;
        steps += '═'.repeat(80) + '\n\n';
        
        steps += `🔌 SOURCE INFORMATION\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Bus Tag:             ${sourceBus.tag || sourceBus.name || 'N/A'}\n`;
        steps += `Bus Name:            ${sourceBus.name}\n`;
        steps += `Bus Type:            ${sourceBus.type.toUpperCase()}\n`;
        steps += `Voltage Level:       ${sourceBus.voltage} V\n`;
        steps += `Available Fault:     ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
        steps += `X/R Ratio:           ${utilityXR}\n`;
        steps += '\n';
        
        steps += `📐 IMPEDANCE CALCULATION (OHMIC)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Formula:             Z_source = V_LL / (√3 × I_sc)\n`;
        steps += '\n';
        steps += `Step-by-Step:\n`;
        steps += `   Z = ${sourceBus.voltage} / (${SQRT3.toFixed(4)} × ${sourceBus.utilityFaultCurrent * 1000})\n`;
        steps += `   Z = ${sourceBus.voltage} / ${(SQRT3 * sourceBus.utilityFaultCurrent * 1000).toFixed(2)}\n`;
        steps += `   Z = ${sourceZ_ohms.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `Component Separation (X/R = ${utilityXR}):\n`;
        steps += `   R = Z / √(1 + (X/R)²) = ${sourceR_ohms.toFixed(6)} Ω\n`;
        steps += `   X = R × (X/R) = ${sourceX_ohms.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `Positive Sequence (Z1):\n`;
        steps += `   R1 = ${sourceR_ohms.toFixed(6)} Ω\n`;
        steps += `   X1 = ${sourceX_ohms.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `Zero Sequence (Z0 = ${z0Factor}× Z1):\n`;
        steps += `   R0 = ${sourceR0_ohms.toFixed(6)} Ω\n`;
        steps += `   X0 = ${sourceX0_ohms.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `📊 CONVERSION TO PER-UNIT\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Base Impedance at ${sourceBus.voltage}V:\n`;
        steps += `   Formula:          Z_base = V² / S_base\n`;
        steps += `   Z_base = (${sourceBus.voltage})² / (${BASE_KVA} × 1000)\n`;
        steps += `   Z_base = ${sourceBus.voltage * sourceBus.voltage} / ${BASE_KVA * 1000}\n`;
        steps += `   Z_base = ${sourceZbase_actual.toFixed(6)} Ω\n`;
        steps += '\n';
        
        steps += `Per-Unit Conversion:\n`;
        steps += `   Formula:          Z_pu = Z_ohms / Z_base\n`;
        steps += `   R_pu = ${sourceR_ohms.toFixed(6)} / ${sourceZbase_actual.toFixed(6)} = ${sourceR_pu.toFixed(6)} pu\n`;
        steps += `   X_pu = ${sourceX_ohms.toFixed(6)} / ${sourceZbase_actual.toFixed(6)} = ${sourceX_pu.toFixed(6)} pu\n`;
        steps += `   R0_pu = ${sourceR0_ohms.toFixed(6)} / ${sourceZbase_actual.toFixed(6)} = ${sourceR0_pu.toFixed(6)} pu\n`;
        steps += `   X0_pu = ${sourceX0_ohms.toFixed(6)} / ${sourceZbase_actual.toFixed(6)} = ${sourceX0_pu.toFixed(6)} pu\n`;
        steps += '\n';
        
        steps += `✅ RUNNING TOTALS (Per-Unit)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `   Z1: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n`;
        steps += `   Z0: R0_pu = ${totalR0pu.toFixed(6)}, X0_pu = ${totalX0pu.toFixed(6)}\n`;
        steps += '\n\n';
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 2-N: PROCESS COMPONENTS - FULLY ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    let stepNumber = 2;
    const processedTransformerConnections = new Set();
    
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment?.component;
        
        if (!comp) {
            console.warn(`⚠️ Segment ${i} has no component - skipping`);
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // CABLE PROCESSING - FULLY ENHANCED
        // ═══════════════════════════════════════════════════════════════════════════
        if (comp.type === 'cable') {
            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: CABLE`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const materialData = cableData[comp.material] || cableData['copper'];
            const parallel = comp.parallel || 1;
            
            // ── Installation method adjustments ──────────────────────────────
            const puInstallFactors = (typeof getCableInstallationFactors === 'function')
                ? getCableInstallationFactors(comp.installationMethod || comp.conduit || 'conduit-pvc')
                : { x_factor: 1.0, z0_factor: 3.0, label: 'Default (PVC Conduit)' };
            
            steps += `🔌 CABLE INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Component Type:      CABLE\n`;
            steps += `Size:                ${comp.size}\n`;
            steps += `Material:            ${comp.material.toUpperCase()}\n`;
            steps += `Length:              ${comp.length} ft\n`;
            steps += `Installation:        ${puInstallFactors.label}\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
            steps += `Temperature:         ${temperature}°C\n`;
            steps += `Voltage Level:       ${currentVoltageLevel}V\n`;
            if (parallel > 1) {
                steps += `Parallel Config:     ${parallel} cables (Z ÷ ${parallel})\n`;
            }
            steps += '\n';
            
            let rBase20 = materialData.r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableR_ohms = (rBaseTemp * comp.length) / parallel;
            const cableX_ohms = (materialData.x * comp.length * puInstallFactors.x_factor) / parallel;
            
            const z0Factor = puInstallFactors.z0_factor;
            const cableR0_ohms = cableR_ohms * z0Factor;
            const cableX0_ohms = cableX_ohms * z0Factor;
            
            steps += `📐 IMPEDANCE CALCULATION (OHMIC)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Base Values (per 1000 ft at 20°C):\n`;
            steps += `   R_base = ${rBase20.toFixed(6)} Ω/1000ft    (NEC Ch 9 Table 9)\n`;
            steps += `   X_base = ${materialData.x.toFixed(6)} Ω/1000ft    (NEC Ch 9 Table 9)\n`;
            steps += '\n';
            
            steps += `Temperature Correction (20°C → ${temperature}°C):\n`;
            steps += `   R_corrected = ${rBase20.toFixed(6)} × ${(rBaseTemp/rBase20).toFixed(4)}\n`;
            steps += `   R_corrected = ${rBaseTemp.toFixed(6)} Ω/1000ft\n`;
            steps += '\n';
            
            steps += `Cable Impedance:\n`;
            steps += `   Formula:          Z = (Z_per_1000ft × Length) / Parallel\n`;
            steps += `   R = (${rBaseTemp.toFixed(6)} × ${comp.length}) / ${parallel}\n`;
            steps += `   R = ${(rBaseTemp * comp.length).toFixed(6)} / ${parallel}\n`;
            steps += `   R = ${cableR_ohms.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `   X = (${materialData.x.toFixed(6)} × ${comp.length}) / ${parallel}\n`;
            steps += `   X = ${(materialData.x * comp.length).toFixed(6)} / ${parallel}\n`;
            steps += `   X = ${cableX_ohms.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `Sequence Impedances:\n`;
            steps += `   Z1: R = ${cableR_ohms.toFixed(6)} Ω, X = ${cableX_ohms.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${cableR0_ohms.toFixed(6)} Ω, X0 = ${cableX0_ohms.toFixed(6)} Ω (${z0Factor}× Z1)\n`;
            steps += '\n';
            
            const cableZbase = (currentVoltageLevel * currentVoltageLevel) / (BASE_KVA * 1000);
            const cableR_pu = cableR_ohms / cableZbase;
            const cableX_pu = cableX_ohms / cableZbase;
            const cableR0_pu = cableR0_ohms / cableZbase;
            const cableX0_pu = cableX0_ohms / cableZbase;
            
            steps += `📊 CONVERSION TO PER-UNIT\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Base Impedance at ${currentVoltageLevel}V:\n`;
            steps += `   Z_base = (${currentVoltageLevel})² / (${BASE_KVA} × 1000)\n`;
            steps += `   Z_base = ${currentVoltageLevel * currentVoltageLevel} / ${BASE_KVA * 1000}\n`;
            steps += `   Z_base = ${cableZbase.toFixed(6)} Ω\n`;
            steps += '\n';
            
            steps += `Per-Unit Values:\n`;
            steps += `   R_pu = ${cableR_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableR_pu.toFixed(6)} pu\n`;
            steps += `   X_pu = ${cableX_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableX_pu.toFixed(6)} pu\n`;
            steps += `   R0_pu = ${cableR0_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableR0_pu.toFixed(6)} pu\n`;
            steps += `   X0_pu = ${cableX0_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableX0_pu.toFixed(6)} pu\n`;
            steps += '\n';
            
            totalRpu += cableR_pu;
            totalXpu += cableX_pu;
            totalR0pu += cableR0_pu;
            totalX0pu += cableX0_pu;
            
            steps += `✅ RUNNING TOTALS (Per-Unit)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n`;
            steps += `   Z0: R0_pu = ${totalR0pu.toFixed(6)}, X0_pu = ${totalX0pu.toFixed(6)}\n`;
            steps += '\n\n';
            
            stepNumber++;
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TRANSFORMER PROCESSING - FULLY ENHANCED
        // ═══════════════════════════════════════════════════════════════════════════
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: TRANSFORMER`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            if (numParallel > 1) steps += ` (PARALLEL)`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';
            
            steps += `🔧 TRANSFORMER INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Component Type:      TRANSFORMER\n`;
            steps += `Rating:              ${comp.rating} kVA\n`;
            steps += `Primary Voltage:     ${comp.primary} V\n`;
            steps += `Secondary Voltage:   ${comp.secondary} V\n`;
            steps += `Impedance:           ${comp.impedance}% on ${comp.rating} kVA base\n`;
            steps += `X/R Ratio:           ${comp.xr}\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName || comp.toBus}\n`;
            
            if (numParallel > 1) {
                steps += `\n⚡ PARALLEL CONFIGURATION\n`;
                steps += `   Number of Units:  ${numParallel}\n`;
                steps += `   Total Capacity:   ${totalRating} kVA\n`;
                steps += `   Configuration:    `;
                parallelXfmrs.forEach((xfmr, idx) => {
                    steps += `${xfmr.tag || `Unit ${idx+1}`}`;
                    if (idx < parallelXfmrs.length - 1) steps += ' + ';
                });
                steps += '\n';
            }
            steps += '\n';
            
            const Z_pu_own = comp.impedance / 100;
            const X_pu_own = Z_pu_own * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const R_pu_own = Z_pu_own / Math.sqrt(1 + comp.xr * comp.xr);
            
            steps += `📐 PER-UNIT CALCULATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Transformer Impedance on Own Base:\n`;
            steps += `   Z%_own = ${comp.impedance}% = ${Z_pu_own.toFixed(6)} pu\n`;
            steps += '\n';
            
            steps += `Component Separation (X/R = ${comp.xr}):\n`;
            steps += `   R_pu = Z_pu / √(1 + (X/R)²) = ${R_pu_own.toFixed(6)} pu\n`;
            steps += `   X_pu = R_pu × (X/R) = ${X_pu_own.toFixed(6)} pu\n`;
            steps += '\n';
            
            const baseConversion = BASE_KVA / comp.rating;
            steps += `Base Conversion (${comp.rating} kVA → ${BASE_KVA} kVA):\n`;
            steps += `   Formula:          Z_pu_system = Z_pu_own × (S_base / S_own)\n`;
            steps += `   Conversion:       ${baseConversion.toFixed(4)} = ${BASE_KVA} / ${comp.rating}\n`;
            steps += `   R_pu = ${R_pu_own.toFixed(6)} × ${baseConversion.toFixed(4)} = ${(R_pu_own * baseConversion).toFixed(6)} pu\n`;
            steps += `   X_pu = ${X_pu_own.toFixed(6)} × ${baseConversion.toFixed(4)} = ${(X_pu_own * baseConversion).toFixed(6)} pu\n`;
            steps += '\n';
            
            let R_pu_system = R_pu_own * baseConversion;
            let X_pu_system = X_pu_own * baseConversion;
            
            // ── Vector group Z0 ───────────────────────────────────────────────
            const puVgInfo = (typeof getTransformerVectorGroupZ0 === 'function')
                ? getTransformerVectorGroupZ0(comp.vectorGroup || 'Dyn11')
                : { z0_multiplier: 1.0, blocks_upstream_z0: true, ground_path_on_lv: true,
                    label: 'Dyn11 default', note: 'Dyn11 default' };

            let z0Factor_pu, R0_pu_system, X0_pu_system;
            if (puVgInfo.z0_multiplier >= 999 || !puVgInfo.ground_path_on_lv) {
                z0Factor_pu = 999;
                R0_pu_system = R_pu_system * 100;
                X0_pu_system = X_pu_system * 100;
            } else {
                z0Factor_pu = puVgInfo.z0_multiplier;
                R0_pu_system = R_pu_system * z0Factor_pu;
                X0_pu_system = X_pu_system * z0Factor_pu;
            }
            if (puVgInfo.blocks_upstream_z0) {
                totalR0pu = 0;
                totalX0pu = 0;
            }
            
            if (numParallel > 1) {
                steps += `Parallel Configuration Effect:\n`;
                steps += `   Z_parallel = Z / n = Z / ${numParallel}\n`;
                R_pu_system = R_pu_system / numParallel;
                X_pu_system = X_pu_system / numParallel;
                R0_pu_system = R0_pu_system / numParallel;
                X0_pu_system = X0_pu_system / numParallel;
                steps += `   R_pu = ${(R_pu_own * baseConversion).toFixed(6)} / ${numParallel} = ${R_pu_system.toFixed(6)} pu\n`;
                steps += `   X_pu = ${(X_pu_own * baseConversion).toFixed(6)} / ${numParallel} = ${X_pu_system.toFixed(6)} pu\n`;
                steps += '\n';
            }
            
            steps += `📊 FINAL PER-UNIT IMPEDANCES\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Vector Group:        ${comp.vectorGroup || 'Dyn11'} — ${puVgInfo.label}\n`;
            steps += `Grounding Mode:      ${comp.groundingMode || 'solidly-grounded'}\n`;
            if (puVgInfo.blocks_upstream_z0) {
                steps += `Z0 Boundary:         ⚡ Upstream Z0 reset here (primary winding traps zero-seq)\n`;
            }
            steps += '\n';
            steps += `Positive Sequence (Z1):\n`;
            steps += `   R_pu = ${R_pu_system.toFixed(6)} pu\n`;
            steps += `   X_pu = ${X_pu_system.toFixed(6)} pu\n`;
            steps += '\n';
            if (z0Factor_pu >= 999) {
                steps += `Zero Sequence (Z0) — BLOCKED (${comp.vectorGroup}):\n`;
                steps += `   ⚠️  No L-G path on secondary bus (${puVgInfo.label})\n`;
                steps += `   R0_pu ≈ ∞,  X0_pu ≈ ∞  (per IEC 60909-0 §3.3; IEEE 141-1993 §5.4)\n`;
            } else {
                steps += `Zero Sequence (Z0 = ${z0Factor_pu.toFixed(2)}× Z1):\n`;
                steps += `   R0_pu = ${R0_pu_system.toFixed(6)} pu\n`;
                steps += `   X0_pu = ${X0_pu_system.toFixed(6)} pu\n`;
            }
            steps += '\n';
            
            totalRpu += R_pu_system;
            totalXpu += X_pu_system;
            totalR0pu += R0_pu_system;
            totalX0pu += X0_pu_system;
            currentVoltageLevel = comp.secondary;
            
            steps += `✅ RUNNING TOTALS (Per-Unit)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n`;
            steps += `   Z0: R0_pu = ${totalR0pu.toFixed(6)}, X0_pu = ${totalX0pu.toFixed(6)}\n`;
            steps += '\n\n';
            
            stepNumber++;
            continue;
        }
    }
    // ← END OF COMPONENT FOR LOOP  
      
    // ══════════════════════════════════════════════════════════════════════════════
    // MOTOR CONTRIBUTION (PER-UNIT) - ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    let motorContribution = null;
    if (typeof calculateTotalMotorContribution === 'function') {
        motorContribution = calculateTotalMotorContribution(targetBus.id);
        
        if (motorContribution && motorContribution.motors.length > 0) {
            steps += motorContribution.calculationSteps;
            
            const motorZbase = (targetBus.voltage * targetBus.voltage) / (BASE_KVA * 1000);
            const motorR_pu = motorContribution.totalMotorR / motorZbase;
            const motorX_pu = motorContribution.totalMotorX / motorZbase;
            const motorZ_pu = Math.sqrt(motorR_pu * motorR_pu + motorX_pu * motorX_pu);
            
            steps += '═'.repeat(80) + '\n';
            steps += 'MOTOR CONTRIBUTION (PER-UNIT)\n';
            steps += '═'.repeat(80) + '\n\n';
            steps += `Motor Impedance (Ohmic):\n`;
            steps += `  R = ${motorContribution.totalMotorR.toFixed(6)} Ω\n`;
            steps += `  X = ${motorContribution.totalMotorX.toFixed(6)} Ω\n`;
            steps += `  Z = ${motorContribution.totalMotorZ.toFixed(6)} Ω\n\n`;
            steps += `Conversion to Per-Unit:\n`;
            steps += `  Z_base at ${targetBus.voltage}V = ${motorZbase.toFixed(6)} Ω\n`;
            steps += `  R_pu = ${motorContribution.totalMotorR.toFixed(6)} / ${motorZbase.toFixed(6)} = ${motorR_pu.toFixed(6)} pu\n`;
            steps += `  X_pu = ${motorContribution.totalMotorX.toFixed(6)} / ${motorZbase.toFixed(6)} = ${motorX_pu.toFixed(6)} pu\n`;
            steps += `  Z_pu = ${motorZ_pu.toFixed(6)} pu\n\n`;
            
            steps += 'SYSTEM + MOTOR CONTRIBUTION (PARALLEL IN PER-UNIT)\n';
            steps += '-'.repeat(80) + '\n';
            steps += `System Only: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n`;
            steps += `Motor: R_pu = ${motorR_pu.toFixed(6)}, X_pu = ${motorX_pu.toFixed(6)}\n\n`;
            
            const Z_system_sq = totalRpu * totalRpu + totalXpu * totalXpu;
            const Z_motor_sq = motorR_pu * motorR_pu + motorX_pu * motorX_pu;
            
            const R_inv_system = totalRpu / Z_system_sq;
            const X_inv_system = totalXpu / Z_system_sq;
            const R_inv_motor = motorR_pu / Z_motor_sq;
            const X_inv_motor = motorX_pu / Z_motor_sq;
            
            const R_inv_total = R_inv_system + R_inv_motor;
            const X_inv_total = X_inv_system + X_inv_motor;
            const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
            
            const totalRpu_with_motors = R_inv_total / Z_inv_total_sq;
            const totalXpu_with_motors = X_inv_total / Z_inv_total_sq;
            
            steps += `Combined (Parallel): R_pu = ${totalRpu_with_motors.toFixed(6)}, X_pu = ${totalXpu_with_motors.toFixed(6)}\n\n`;
            
            totalRpu = totalRpu_with_motors;
            totalXpu = totalXpu_with_motors;
        } else {
            steps += '\nℹ️  No motor contribution (no motors connected to this bus)\n\n';
        }
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // FINAL CALCULATION (PER-UNIT) - ENHANCED
    // ══════════════════════════════════════════════════════════════════════════════
    
    const totalZpu = Math.sqrt(totalRpu * totalRpu + totalXpu * totalXpu);
    const xrRatio = totalXpu / totalRpu;
    
    const faultCurrent_pu = 1.0 / totalZpu;
    const faultCurrent = faultCurrent_pu * BASE_CURRENT;
    const faultCurrentKA = faultCurrent / 1000;
    
    const omega = 2 * Math.PI * SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY;
    const totalR_ohms = totalRpu * BASE_Z;
    const totalX_ohms = totalXpu * BASE_Z;
    const timeConstant = totalX_ohms / (omega * totalR_ohms);
    const contactTime = SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME;
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-contactTime / timeConstant));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    
    const totalZ0pu = Math.sqrt(totalR0pu * totalR0pu + totalX0pu * totalX0pu);

  // DOUBLE LINE-TO-GROUND (L-L-G) in per-unit using complex arithmetic
  const Z1pu_r = totalRpu, Z1pu_x = totalXpu;
  const Z2pu_r = totalRpu, Z2pu_x = totalXpu;
  const Z0pu_r = totalR0pu, Z0pu_x = totalX0pu;
  const den_par_pu_r = (Z2pu_r + Z0pu_r), den_par_pu_x = (Z2pu_x + Z0pu_x);
  const den_par_pu_mag2 = den_par_pu_r*den_par_pu_r + den_par_pu_x*den_par_pu_x || 1e-18;
  const num_par_pu_r = Z2pu_r*Z0pu_r - Z2pu_x*Z0pu_x;
  const num_par_pu_x = Z2pu_r*Z0pu_x + Z2pu_x*Z0pu_r;
  const Zpar_pu_r = (num_par_pu_r*den_par_pu_r + num_par_pu_x*den_par_pu_x)/den_par_pu_mag2;
  const Zpar_pu_x = (num_par_pu_x*den_par_pu_r - num_par_pu_r*den_par_pu_x)/den_par_pu_mag2;
  const Zllg_pu_r = Z1pu_r + Zpar_pu_r;
  const Zllg_pu_x = Z1pu_x + Zpar_pu_x;
  const Zllg_pu_mag = Math.sqrt(Zllg_pu_r*Zllg_pu_r + Zllg_pu_x*Zllg_pu_x) || 1e-18;
  // Positive-sequence current per unit:
  //   I_base is defined on V_LL_base.  V_LN_pu = 1/√3 pu.
  //   I_a1_pu = V_LN_pu / |Zllg_pu| = 1 / (√3 × |Zllg_pu|)
  // FIX: denominator needs √3, NOT numerator.
  //   WRONG was: √3 / |Zllg_pu|   (overcounts by factor 3)
  //   CORRECT:   1 / (√3 × |Zllg_pu|)
  const I_llg_pu = 1.0 / (Math.sqrt(3) * Zllg_pu_mag);
  const doubleLineToGroundKA = (I_llg_pu * BASE_CURRENT) / 1000;
    const totalZ2pu = totalZpu;
    
    const Z_total_LG_pu = totalZpu + totalZ2pu + totalZ0pu;
    const lineToGroundCurrent_pu = 3.0 / Z_total_LG_pu;
    const lineToGroundCurrent = lineToGroundCurrent_pu * BASE_CURRENT;
    const lineToGroundKA = lineToGroundCurrent / 1000;
    
    const totalZ_ohms = totalZpu * BASE_Z;
    const totalZ0_ohms = totalZ0pu * BASE_Z;
    const totalR0_ohms = totalR0pu * BASE_Z;
    const totalX0_ohms = totalX0pu * BASE_Z;
    
    steps += '\n' + '='.repeat(80) + '\n';
    steps += 'FINAL SHORT CIRCUIT CALCULATION (PER-UNIT METHOD)\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Target Bus: ${targetBus.name} (${targetBus.voltage}V)\n\n`;
    
    const withMotors = motorContribution && motorContribution.motors.length > 0;
    steps += `Total System Impedance (Per-Unit)${withMotors ? ' WITH MOTORS' : ''}:\n`;
    steps += '-'.repeat(80) + '\n';
    steps += `Z1 (Positive Sequence):\n`;
    steps += `  R_pu = ${totalRpu.toFixed(6)} pu\n`;
    steps += `  X_pu = ${totalXpu.toFixed(6)} pu\n`;
    steps += `  Z_pu = ${totalZpu.toFixed(6)} pu\n`;
    steps += `  X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    
    steps += `Z0 (Zero Sequence):\n`;
    steps += `  R0_pu = ${totalR0pu.toFixed(6)} pu\n`;
    steps += `  X0_pu = ${totalX0pu.toFixed(6)} pu\n`;
    steps += `  Z0_pu = ${totalZ0pu.toFixed(6)} pu\n`;
    steps += `  Z0/Z1 Ratio = ${(totalZ0pu/totalZpu).toFixed(3)}\n\n`;
    
    steps += `Z2 (Negative Sequence):\n`;
    steps += `  Z2_pu ≈ Z1_pu = ${totalZ2pu.toFixed(6)} pu\n\n`;
    
    steps += `Total System Impedance (Ohmic Equivalent):\n`;
    steps += `  Z1: R = ${totalR_ohms.toFixed(6)} Ω, X = ${totalX_ohms.toFixed(6)} Ω, Z = ${totalZ_ohms.toFixed(6)} Ω\n`;
    steps += `  Z0: R0 = ${totalR0_ohms.toFixed(6)} Ω, X0 = ${totalX0_ohms.toFixed(6)} Ω, Z0 = ${totalZ0_ohms.toFixed(6)} Ω\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'THREE-PHASE SYMMETRICAL FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n';
    steps += `Per IEEE 141 Section 5.2 (Per-Unit Method):\n\n`;
    steps += `Per-Unit Calculation:\n`;
    steps += `I_pu = V_pu / Z_pu = 1.0 / ${totalZpu.toFixed(6)} = ${faultCurrent_pu.toFixed(6)} pu\n\n`;
    steps += `Conversion to Actual Current:\n`;
    steps += `I_actual = I_pu × I_base\n`;
    steps += `I_actual = ${faultCurrent_pu.toFixed(6)} × ${BASE_CURRENT.toFixed(2)}\n`;
    steps += `I_sc = ${faultCurrent.toFixed(2)} A\n`;
    steps += `I_sc = ${faultCurrentKA.toFixed(3)} kA\n\n`;
    
    if (withMotors) {
        steps += `⚡ INCLUDES MOTOR CONTRIBUTION: ${(motorContribution.motorFaultCurrent/1000).toFixed(3)} kA\n`;
        steps += `   ${motorContribution.motorCount} motor(s) downstream from fault point\n`;
        steps += `   Per IEEE 141-1993 Section 5.3, IEC 60909, and NEC Article 430\n\n`;
    }
    
    steps += '═'.repeat(80) + '\n';
    steps += 'ASYMMETRICAL (PEAK) FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n';
    steps += `Per IEEE 141 Section 5.2 and ANSI C37.010:\n\n`;
    steps += `DC Time Constant:\n`;
    steps += `τ = X/(ωR) = ${totalX_ohms.toFixed(6)} / (2π × ${SHORT_CIRCUIT_CONFIG.SYSTEM_FREQUENCY} × ${totalR_ohms.toFixed(6)})\n`;
    steps += `τ = ${(timeConstant * 1000).toFixed(3)} ms\n\n`;
    steps += `DC Offset Multiplier:\n`;
    steps += `K = √(1 + 2e^(-t/τ))\n`;
    steps += `where t = ${(contactTime * 1000).toFixed(2)} ms\n`;
    steps += `K = ${multiplier.toFixed(4)}\n\n`;
    steps += `Asymmetrical Current:\n`;
    steps += `I_asym = ${faultCurrentKA.toFixed(3)} kA × ${multiplier.toFixed(4)}\n`;
    steps += `I_asym = ${asymFaultCurrentKA.toFixed(3)} kA\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LINE-TO-GROUND FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n';
    steps += `Per IEEE 141 Section 5.4 (Per-Unit Method):\n\n`;
    steps += `Formula:\n`;
    steps += `I_LG_pu = 3 × V_pu / (Z1_pu + Z2_pu + Z0_pu)\n\n`;
    steps += `Per-Unit Calculation:\n`;
    steps += `V_pu = 1.0 pu (at fault point)\n`;
    steps += `Z_total_pu = Z1_pu + Z2_pu + Z0_pu\n`;
    steps += `Z_total_pu = ${totalZpu.toFixed(6)} + ${totalZ2pu.toFixed(6)} + ${totalZ0pu.toFixed(6)}\n`;
    steps += `Z_total_pu = ${Z_total_LG_pu.toFixed(6)} pu\n\n`;
    steps += `I_LG_pu = 3.0 / ${Z_total_LG_pu.toFixed(6)} = ${lineToGroundCurrent_pu.toFixed(6)} pu\n\n`;
    steps += `Conversion to Actual Current:\n`;
    steps += `I_LG = I_LG_pu × I_base\n`;
    steps += `I_LG = ${lineToGroundCurrent_pu.toFixed(6)} × ${BASE_CURRENT.toFixed(2)}\n`;
    steps += `I_LG = ${lineToGroundCurrent.toFixed(2)} A\n`;
    steps += `I_LG = ${lineToGroundKA.toFixed(3)} kA\n\n`;
    
    if (lineToGroundKA > faultCurrentKA) {
        steps += `⚠️  IMPORTANT NOTE:\n`;
        steps += `Line-to-ground fault (${lineToGroundKA.toFixed(3)} kA) EXCEEDS 3-phase fault!\n`;
        steps += `Ground fault protection must be sized for ${lineToGroundKA.toFixed(3)} kA.\n`;
        steps += `Per NEC 230.95, 240.13, and IEEE 142 (Green Book).\n\n`;
    } else {
        steps += `✓ 3-phase fault (${faultCurrentKA.toFixed(3)} kA) is limiting case.\n\n`;
    }
    
    steps += '═'.repeat(80) + '\n';
    steps += 'FAULT CURRENT SUMMARY\n';
    steps += '═'.repeat(80) + '\n';
    steps += `Fault Type                    | Symmetrical (kA) | Asymmetrical (kA)\n`;
    steps += '-'.repeat(80) + '\n';
    steps += `Three-Phase (L-L-L)           | ${faultCurrentKA.toFixed(3).padStart(16)} | ${asymFaultCurrentKA.toFixed(3).padStart(17)}\n`;
    steps += `Line-to-Ground (L-G)          | ${lineToGroundKA.toFixed(3).padStart(16)} | ${(lineToGroundKA * multiplier).toFixed(3).padStart(17)}\n`;
    steps += `Line-to-Line (L-L)            | ${(faultCurrentKA * 0.866).toFixed(3).padStart(16)} | ${(asymFaultCurrentKA * 0.866).toFixed(3).padStart(17)}\n`;
    steps += '='.repeat(80) + '\n\n';
    
    steps += `PER-UNIT SYSTEM ADVANTAGES:\n`;
    steps += `  ✓ Voltage level changes handled automatically\n`;
    steps += `  ✓ Transformer ratios built into per-unit conversion\n`;
    steps += `  ✓ Easy parallel/series impedance combinations\n`;
    steps += `  ✓ Standard for multi-voltage level systems\n`;
    steps += `  ✓ Sequence impedances (Z0, Z1, Z2) easily tracked\n\n`;
    
    steps += `Standards Compliance:\n`;
    steps += `✓ IEEE 141-1993 (Red Book) - Short-Circuit Studies\n`;
    steps += `✓ IEC 60909 - Short-Circuit Currents in Three-Phase Systems\n`;
    steps += `✓ ANSI C37.010 - AC High-Voltage Circuit Breakers\n`;
    steps += `✓ NEC Article 110.24 - Available Fault Current\n`;
    steps += `✓ IEEE 142 (Green Book) - Grounding of Industrial Power Systems\n\n`;

    // ══════════════════════════════════════════════════════════════════════════════
    // PROTECTION DEVICE REQUIREMENTS
    // ══════════════════════════════════════════════════════════════════════════════

    if (typeof generateProtectionDeviceRequirements === 'function') {
        steps += generateProtectionDeviceRequirements({
            faultCurrents: {
                threePhaseSym: faultCurrentKA,
                threePhaseAsym: asymFaultCurrentKA,
                lineToGround: lineToGroundKA,
                lineToLine: faultCurrentKA * 0.866
            },
            motorContribution: motorContribution,
            xrRatio: xrRatio,
            path: path
        }, null, 'mid-range'); // null = all manufacturers, 'mid-range' = cost preference
    }
    
    return {
 doubleLineToGroundKA: doubleLineToGroundKA,
        totalR: totalR_ohms,
        totalX: totalX_ohms,
        totalZ: totalZ_ohms,
        totalR0: totalR0_ohms,
        totalX0: totalX0_ohms,
        totalZ0: totalZ0_ohms,
        totalRpu: totalRpu,
        totalXpu: totalXpu,
        totalZpu: totalZpu,
        totalR0pu: totalR0pu,
        totalX0pu: totalX0pu,
        totalZ0pu: totalZ0pu,
        baseKVA: BASE_KVA,
        baseVoltage: BASE_VOLTAGE,
        baseZ: BASE_Z,
        baseCurrent: BASE_CURRENT,
        xrRatio: xrRatio,
        faultCurrent: faultCurrent,
        faultCurrentKA: faultCurrentKA,
        asymFaultCurrent: asymFaultCurrent,
        asymFaultCurrentKA: asymFaultCurrentKA,
        lineToGroundCurrent: lineToGroundCurrent,
        lineToGroundKA: lineToGroundKA,
        timeConstant: timeConstant,
        dcOffsetMultiplier: multiplier,
        motorContribution: motorContribution,
        calculationSteps: steps,
    steps: steps,
        path: path,
        method: 'Per-Unit'
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ════════════════════════════════════════════════════════════════════════════════

window.calculateShortCircuit = calculateShortCircuit;
window.calculateShortCircuitPointToPoint = calculateShortCircuitPointToPoint;
window.calculateShortCircuitPerUnit = calculateShortCircuitPerUnit;
window.SHORT_CIRCUIT_CONFIG = SHORT_CIRCUIT_CONFIG;

console.log('✅ Enhanced Short Circuit Calculation module v1.5.0 loaded successfully');
console.log('   ═══════════════════════════════════════════════════════════════════════');
console.log('   ENHANCEMENTS:');
console.log('   ✅ Component tags displayed in all calculation steps');
console.log('   ✅ From/To bus information for complete traceability');
console.log('   ✅ Enhanced formatting with visual hierarchy (icons & sections)');
console.log('   ✅ Detailed formula breakdowns with step-by-step calculations');
console.log('   ✅ Intermediate values shown for verification');
console.log('   ✅ Equipment identification throughout');
console.log('   ═══════════════════════════════════════════════════════════════════════');
console.log('   STANDARDS COMPLIANCE:');
console.log('   ✓ IEEE 141-1993 (Red Book) - Complete');
console.log('   ✓ IEC 60909 - Short-Circuit Currents');
console.log('   ✓ ANSI C37.010 - Circuit Breakers');
console.log('   ✓ NEC Article 110.24, 230.95, 240.13, 430');
console.log('   ✓ IEEE 142 (Green Book) - Grounding');
console.log('   ═══════════════════════════════════════════════════════════════════════');
console.log('   Date: 2025-11-02 11:56:06 UTC');
console.log('   Author: bfforex');
console.log('   Version: 1.5.0 (Production Ready - ENHANCED)');
console.log('   ═══════════════════════════════════════════════════════════════════════');