/**
 * Application Constants for PwrSys Pro
 *
 * @author Engr. B. P. Faraon
 * @version 1.1
 * @date 2025-12-05 (updated 2026-05-08)
 *
 * CHANGES IN v1.1 (2026-05-08):
 * ✅ TRANSFORMER_VECTOR_GROUP_Z0: Dd0, Dy11, Yd11 z0_multiplier changed from
 *    999 → Infinity. A z0_multiplier of 999 was fragile — for very high Z1 it
 *    could produce a finite but incorrect Z0. Callers MUST use
 *    getTransformerZ0Ohms() which guards for Infinity and forces L-G to zero
 *    when ground_path_on_lv is false.
 * ✅ getCableZ0Factor() added as the single point of truth for Z0/Z1 ratio.
 *    SHORT_CIRCUIT_CONFIG.Z0_FACTORS.cable in shortCircuitCalc.js is deprecated
 *    — all code should call getCableInstallationFactors(method).z0_factor.
 *
 * STANDARDS COMPLIANCE:
 * - NEC 2017 Chapter 9, Table 9 - Cable impedance values
 * - IEEE 141-1993 - Temperature coefficients
 * - PEC 2017 - Philippine Electrical Code
 */

// Application Constants
const SQRT3 = Math.sqrt(3);
const VERSION = '1.0';
const AUTHOR = 'Engr. B. P. Faraon';

/**
 * Cable Impedance Data
 * 
 * SOURCE: NEC 2017 Chapter 9, Table 9
 *         "Alternating-Current Resistance and Reactance for 600-Volt Cables"
 * 
 * NOTES:
 * - Values are in Ohms per foot (Ω/ft)
 * - Based on three single conductors in PVC conduit
 * - AC resistance at 75°C conductor temperature (includes skin effect at 60 Hz)
 * - Reactance (X) at 0 feet spacing
 * - Power factor not applicable (X values are effective reactance)
 * 
 * VERIFICATION STATUS:
 * - Values sourced from NEC 2017 Chapter 9, Table 9
 * - Resistance values include AC effects (skin effect, proximity effect)
 * - Suitable for voltage drop and short-circuit calculations
 * 
 * USAGE:
 * - Voltage drop calculations per IEEE 141-1993 Chapter 4
 * - Short-circuit impedance calculations per IEEE 141-1993 Chapter 5
 * - Conductor sizing per NEC Article 310.15
 * 
 * @type {Object}
 * @property {Object} [size] - Wire size (AWG or kcmil)
 * @property {Object} [size].copper - Copper conductor impedance
 * @property {Number} [size].copper.r - AC resistance (Ω/ft)
 * @property {Number} [size].copper.x - Reactance (Ω/ft)
 * @property {Object} [size].aluminum - Aluminum conductor impedance
 * @property {Number} [size].aluminum.r - AC resistance (Ω/ft)
 * @property {Number} [size].aluminum.x - Reactance (Ω/ft)
 */
const CABLE_IMPEDANCE_DATA = {
    '14': { copper: { r: 0.00310, x: 0.000058 }, aluminum: { r: 0.00508, x: 0.000061 } },
    '12': { copper: { r: 0.00195, x: 0.000054 }, aluminum: { r: 0.00319, x: 0.000057 } },
    '10': { copper: { r: 0.00123, x: 0.000050 }, aluminum: { r: 0.00201, x: 0.000053 } },
    '8': { copper: { r: 0.000764, x: 0.000052 }, aluminum: { r: 0.00126, x: 0.000055 } },
    '6': { copper: { r: 0.000491, x: 0.000051 }, aluminum: { r: 0.000808, x: 0.000054 } },
    '4': { copper: { r: 0.000308, x: 0.000048 }, aluminum: { r: 0.000508, x: 0.000051 } },
    '2': { copper: { r: 0.000194, x: 0.000046 }, aluminum: { r: 0.000319, x: 0.000049 } },
    '1': { copper: { r: 0.000154, x: 0.000045 }, aluminum: { r: 0.000253, x: 0.000048 } },
    '1/0': { copper: { r: 0.000122, x: 0.000044 }, aluminum: { r: 0.000201, x: 0.000047 } },
    '2/0': { copper: { r: 0.0000967, x: 0.000042 }, aluminum: { r: 0.000159, x: 0.000045 } },
    '3/0': { copper: { r: 0.0000766, x: 0.000041 }, aluminum: { r: 0.000126, x: 0.000044 } },
    '4/0': { copper: { r: 0.0000608, x: 0.000040 }, aluminum: { r: 0.0000999, x: 0.000043 } },
    '250': { copper: { r: 0.0000515, x: 0.000039 }, aluminum: { r: 0.0000847, x: 0.000042 } },
    '300': { copper: { r: 0.0000429, x: 0.000038 }, aluminum: { r: 0.0000707, x: 0.000041 } },
    '350': { copper: { r: 0.0000367, x: 0.000037 }, aluminum: { r: 0.0000605, x: 0.000040 } },
    '400': { copper: { r: 0.0000321, x: 0.000037 }, aluminum: { r: 0.0000529, x: 0.000040 } },
    '500': { copper: { r: 0.0000258, x: 0.000036 }, aluminum: { r: 0.0000424, x: 0.000039 } },
    '600': { copper: { r: 0.0000214, x: 0.000035 }, aluminum: { r: 0.0000353, x: 0.000038 } },
    '750': { copper: { r: 0.0000171, x: 0.000034 }, aluminum: { r: 0.0000282, x: 0.000037 } },
    '1000': { copper: { r: 0.0000129, x: 0.000033 }, aluminum: { r: 0.0000212, x: 0.000036 } }
};

/**
 * Temperature Coefficient for Conductor Resistance
 * 
 * SOURCE: IEEE 141-1993, NEC Chapter 9 Notes
 * 
 * FORMULA:
 * R_T2 = R_T1 × [1 + α × (T2 - T1)]
 * 
 * Where:
 *   R_T2 = Resistance at temperature T2
 *   R_T1 = Resistance at temperature T1
 *   α = Temperature coefficient (per °C)
 *   T2 - T1 = Temperature difference
 * 
 * STANDARD VALUES:
 * - Copper: 0.00393 per °C (at 20°C reference)
 * - Aluminum: 0.00403 per °C (at 20°C reference)
 * 
 * TYPICAL TEMPERATURE RATINGS:
 * - 60°C: Type TW, UF
 * - 75°C: Type THW, THWN, XHHW (most common)
 * - 90°C: Type THHN, XHHW-2, RHW-2
 * 
 * STANDARDS:
 * - NEC Article 310.15 - Conductor temperature ratings
 * - IEEE 141-1993 - Temperature correction methods
 * 
 * @type {Object}
 * @property {Number} copper - Temperature coefficient for copper (per °C)
 * @property {Number} aluminum - Temperature coefficient for aluminum (per °C)
 */
const TEMP_COEFFICIENT = {
    copper: 0.00393,   // Per °C at 20°C reference (NEC Chapter 9)
    aluminum: 0.00403  // Per °C at 20°C reference (NEC Chapter 9)
};

/**
 * Cable Installation Method Impedance Adjustment Factors
 *
 * SOURCE:
 *   NEC 2017 Chapter 9, Table 9 — Base values are for PVC conduit
 *   IEEE 141-1993 Chapter 4 — Impedance of cables in various configurations
 *   IEEE Std 242-2001 (Buff Book) — Zero-sequence return path effects
 *   IEC 60364-5-52:2009 — Installation method reference letters
 *
 * x_factor : multiplier applied to the Table-9 reactance (X) base value.
 *   Steel conduit raises X ~8% due to magnetic flux coupling.
 *   Free air / large trefoil spacing reduces X slightly.
 *
 * z0_factor : ratio Z0/Z1 for this installation method.
 *   Steel conduit provides a low-impedance return path (lower Z0/Z1).
 *   Earth/soil return (direct buried, duct bank) gives the highest Z0/Z1.
 *   Per IEEE 242 Section 9.3 and IEC 60909-0 Annex B.
 *
 * nec_ampacity_ref : NEC 310.15 reference column for ampacity lookup.
 *
 * label : Human-readable description shown in calculation steps.
 */
const CABLE_INSTALLATION_FACTORS = {
    // ── Conduit ──────────────────────────────────────────────────────────────
    'conduit-pvc': {
        label:            'PVC / Non-Metallic Conduit',
        x_factor:         1.00,   // Base reference (NEC Ch 9 Table 9)
        z0_factor:        3.50,   // No magnetic return — higher zero-seq Z
        nec_ampacity_ref: '310.15(B)(16) — conduit/duct',
        standard:         'NEC Ch 9 Table 9 (base values)'
    },
    'conduit-steel': {
        label:            'Steel / EMT Conduit',
        x_factor:         1.08,   // ~8% higher X (magnetic proximity effect)
        z0_factor:        3.00,   // Steel provides partial low-Z return path
        nec_ampacity_ref: '310.15(B)(16) — conduit/duct',
        standard:         'NEC Ch 9 Table 9 Note 3; IEEE 242-2001 §9.3'
    },
    'conduit-aluminum': {
        label:            'Aluminum Conduit',
        x_factor:         1.02,   // Slight eddy-current effect
        z0_factor:        3.20,   // Al provides partial return, less than steel
        nec_ampacity_ref: '310.15(B)(16) — conduit/duct',
        standard:         'NEC Ch 9 Table 9; IEEE 141-1993 §4'
    },
    // ── Cable Tray ────────────────────────────────────────────────────────────
    'tray-trefoil': {
        label:            'Cable Tray — Trefoil (triangular) arrangement',
        x_factor:         0.97,   // Symmetrical arrangement reduces X slightly
        z0_factor:        3.50,   // No ferromagnetic enclosure
        nec_ampacity_ref: '310.15(B)(16) — cable tray 310.15(B)(22)',
        standard:         'NEC 392.80; IEC 60364-5-52 Method E/F'
    },
    'tray-flat-touching': {
        label:            'Cable Tray — Flat, touching (single layer)',
        x_factor:         1.04,   // Unsymmetrical arrangement raises X
        z0_factor:        3.80,   // Asymmetric spacing increases Z0
        nec_ampacity_ref: '310.15(B)(22) — cable tray, single layer touching',
        standard:         'NEC 392.80; IEC 60364-5-52 Method E'
    },
    'tray-flat-spaced': {
        label:            'Cable Tray — Flat, spaced (≥1 dia apart)',
        x_factor:         0.95,   // Extra spacing lowers X
        z0_factor:        3.70,
        nec_ampacity_ref: '310.15(B)(22) — cable tray, spaced',
        standard:         'NEC 392.80; IEC 60364-5-52 Method E'
    },
    // ── Free Air ──────────────────────────────────────────────────────────────
    'free-air': {
        label:            'In Free Air (open, no enclosure)',
        x_factor:         0.96,
        z0_factor:        3.50,
        nec_ampacity_ref: '310.15(B)(17) — free air, single conductors',
        standard:         'NEC 310.15(B)(17); IEC 60364-5-52 Method E'
    },
    // ── Underground ───────────────────────────────────────────────────────────
    'underground-direct': {
        label:            'Underground — Direct Buried',
        x_factor:         0.92,   // Earth spacing; X lower than conduit
        z0_factor:        4.00,   // Earth return: highest Z0/Z1 ratio
        nec_ampacity_ref: '310.15(B)(16) — underground — direct buried',
        standard:         'NEC 310.15(B)(16); IEEE 141-1993 §4; IEC 60287'
    },
    'underground-duct-pvc': {
        label:            'Underground — PVC Duct Bank',
        x_factor:         0.98,
        z0_factor:        3.80,   // Duct bank groups lower Z0 slightly vs direct
        nec_ampacity_ref: '310.15(B)(16) — underground — duct bank',
        standard:         'NEC 310.15(B)(16); NEC Annex B; IEC 60287'
    },
    'underground-duct-concrete': {
        label:            'Underground — Concrete-Encased Duct Bank',
        x_factor:         0.98,
        z0_factor:        3.80,
        nec_ampacity_ref: 'NEC Annex B — concrete-encased',
        standard:         'NEC Annex B; IEC 60287'
    }
};

/**
 * Get cable installation factors object.
 * Returns PVC conduit defaults for unknown methods.
 * @param {string} method - installationMethod from component data
 * @returns {Object} CABLE_INSTALLATION_FACTORS entry
 */
function getCableInstallationFactors(method) {
    return CABLE_INSTALLATION_FACTORS[method] || CABLE_INSTALLATION_FACTORS['conduit-pvc'];
}

/**
 * Transformer Vector Group — Zero-Sequence Behaviour
 *
 * SOURCE:
 *   IEC 60076-1:2011 — Transformer vector groups
 *   IEC 60909-0:2016 §3.3 — Zero-sequence networks
 *   IEEE 141-1993 §5.4 — Sequence impedances of transformers
 *   IEEE Std 242-2001 (Buff Book) §7 — Ground fault analysis
 *
 * z0_multiplier  : Transformer's own Z0 = z0_multiplier × Z1.
 *   For grounded-wye winding: ~0.85 – 1.0 × Z1.
 *   For delta winding acting as zero-seq source: 1.0 × Z1.
 *
 * blocks_upstream_z0  : true → delta or ungrounded winding on the
 *   source (upstream) side prevents utility zero-seq from reaching
 *   the fault bus. The transformer becomes the only Z0 source.
 *   false → zero-seq propagates through to the upstream system.
 *
 * ground_path_on_lv   : true → secondary side provides a zero-seq
 *   return path (grounded wye secondary).  false → LV side is delta
 *   or ungrounded wye — no zero-seq current can flow to/from load.
 *
 * description : short engineer-readable note for calculation steps.
 */
const TRANSFORMER_VECTOR_GROUP_Z0 = {
    // ── Most common distribution types ────────────────────────────────────────
    'Dyn11': {
        label:               'Delta-primary / Grounded-Wye-secondary (Dyn11)',
        z0_multiplier:       1.00,
        blocks_upstream_z0:  true,    // Delta primary traps upstream zero-seq
        ground_path_on_lv:   true,    // Grounded WYE on secondary → LG faults CAN flow
        note: 'Most common distribution: primary delta traps upstream Z0; LV grounded wye is Z0 source'
    },
    'Dyn1': {
        label:               'Delta-primary / Grounded-Wye-secondary (Dyn1)',
        z0_multiplier:       1.00,
        blocks_upstream_z0:  true,
        ground_path_on_lv:   true,
        note: 'Same Z0 behaviour as Dyn11; differs only in phase shift'
    },
    'YNd11': {
        label:               'Grounded-Wye-primary / Delta-secondary (YNd11)',
        z0_multiplier:       1.00,
        blocks_upstream_z0:  false,   // Grounded WYE primary → upstream Z0 can flow
        ground_path_on_lv:   false,   // Delta secondary → no LG path on secondary bus
        note: 'HV utility connection: upstream Z0 available on primary; secondary delta blocks LG faults'
    },
    'YNd1': {
        label:               'Grounded-Wye-primary / Delta-secondary (YNd1)',
        z0_multiplier:       1.00,
        blocks_upstream_z0:  false,
        ground_path_on_lv:   false,
        note: 'Same Z0 behaviour as YNd11'
    },
    'YNyn0': {
        label:               'Grounded-Wye / Grounded-Wye (YNyn0)',
        z0_multiplier:       0.85,    // Zero-seq couples through — slightly lower
        blocks_upstream_z0:  false,   // Upstream Z0 passes through
        ground_path_on_lv:   true,
        note: 'Zero-seq flows both sides; upstream Z0 reflected to secondary. Common for MV-MV ties'
    },
    'Yyn0': {
        label:               'Ungrounded-Wye-primary / Grounded-Wye-secondary (Yyn0)',
        z0_multiplier:       1.00,
        blocks_upstream_z0:  true,    // Ungrounded WYE primary — no upstream zero-seq
        ground_path_on_lv:   true,
        note: 'Primary neutral not grounded; secondary grounded WYE is the Z0 source'
    },
    'Yzn11': {
        label:               'Wye-primary / Zigzag-Grounded-secondary (Yzn11)',
        z0_multiplier:       0.50,    // Zigzag grounding has lower Z0
        blocks_upstream_z0:  true,
        ground_path_on_lv:   true,
        note: 'Zigzag grounding transformer — low Z0 on secondary; primary delta or ungrounded'
    },
    'Dd0': {
        label:               'Delta-primary / Delta-secondary (Dd0)',
        // Infinity = zero-seq completely blocked — no L-G path on either side.
        // Use getTransformerZ0Ohms() which guards for this and returns Infinity Ω.
        z0_multiplier:       Infinity,
        blocks_upstream_z0:  true,
        ground_path_on_lv:   false,
        note: 'Both sides delta — zero-seq completely blocked; no LG fault current can flow'
    },
    'Dy11': {
        label:               'Delta-primary / Ungrounded-Wye-secondary (Dy11)',
        z0_multiplier:       Infinity,
        blocks_upstream_z0:  true,
        ground_path_on_lv:   false,
        note: 'Ungrounded secondary — LG faults on secondary side carry negligible current'
    },
    'Yd11': {
        label:               'Ungrounded-Wye-primary / Delta-secondary (Yd11)',
        z0_multiplier:       Infinity,
        blocks_upstream_z0:  true,
        ground_path_on_lv:   false,
        note: 'No grounded winding — zero-seq blocked completely'
    }
};

/**
 * Get transformer Z0 behaviour by vector group.
 * Returns Dyn11 defaults (most conservative common case) if not found.
 * @param {string} vectorGroup
 * @returns {Object} TRANSFORMER_VECTOR_GROUP_Z0 entry
 */
function getTransformerVectorGroupZ0(vectorGroup) {
    return TRANSFORMER_VECTOR_GROUP_Z0[vectorGroup] || TRANSFORMER_VECTOR_GROUP_Z0['Dyn11'];
}

/**
 * Compute transformer Z0 in ohms, guarding for ungrounded (Infinity) types.
 *
 * When z0_multiplier is Infinity or ground_path_on_lv is false, L-G fault
 * current is zero — return Infinity so the calling code gets I_LG = 0
 * rather than a finite but incorrect number.
 *
 * @param {string} vectorGroup
 * @param {number} z1Ohms — positive-sequence impedance in ohms
 * @returns {number} Z0 in ohms (may be Infinity)
 */
function getTransformerZ0Ohms(vectorGroup, z1Ohms) {
    const vg = getTransformerVectorGroupZ0(vectorGroup);
    if (!vg.ground_path_on_lv || !Number.isFinite(vg.z0_multiplier)) return Infinity;
    return vg.z0_multiplier * z1Ohms;
}

/**
 * Single point of truth for cable Z0/Z1 ratio.
 *
 * SHORT_CIRCUIT_CONFIG.Z0_FACTORS.cable in shortCircuitCalc.js is DEPRECATED.
 * All code should call this function so installation-method-specific Z0 values
 * are used consistently (3.5 for PVC, 3.0 for steel conduit, etc.).
 *
 * @param {string} installationMethod — key from CABLE_INSTALLATION_FACTORS
 * @returns {number} z0_factor (Z0/Z1 ratio)
 */
function getCableZ0Factor(installationMethod) {
    return getCableInstallationFactors(installationMethod).z0_factor;
}

/**
 * Transformer Grounding Mode — Additional Z0 Resistance
 *
 * SOURCE: IEEE 142-2007 (Green Book); IEEE 141-1993 §5.4; NEC 250
 *
 * For resistance-grounded neutrals, the neutral resistance appears in
 * the zero-sequence network as 3×Rn (three times the neutral resistor).
 * This drastically limits L-G fault current.
 */
const TRANSFORMER_GROUNDING_MODES = {
    'solidly-grounded': {
        label:       'Solidly Grounded',
        Rn_ohms:     0,    // No intentional neutral impedance
        note:        'Maximum L-G fault current; common in ≤600 V systems (NEC 250.20(B))'
    },
    'low-resistance': {
        label:       'Low-Resistance Grounded (LRG)',
        Rn_ohms:     null, // User must supply actual Rn from neutral resistor rating
        note:        'Limits L-G fault to 200–600 A; IEEE 142 §2.2; typical in MV industrial'
    },
    'high-resistance': {
        label:       'High-Resistance Grounded (HRG)',
        Rn_ohms:     null, // Rn = V_LN / I_fault_target (typically 5-10 A ground fault)
        note:        'Limits L-G to <10 A; allows continuity of service; IEEE 142 §2.3'
    },
    'ungrounded': {
        label:       'Ungrounded (Isolated Neutral)',
        Rn_ohms:     1e9,  // Effectively infinite
        note:        'No intentional ground; capacitive ground faults only; IEEE 142 §2.1'
    },
    'impedance-grounded': {
        label:       'Impedance Grounded (Reactance)',
        Rn_ohms:     null, // User must supply Zn
        note:        'Reactor in neutral; limits L-G while maintaining transient suppression'
    }
};

window.CABLE_INSTALLATION_FACTORS    = CABLE_INSTALLATION_FACTORS;
window.TRANSFORMER_VECTOR_GROUP_Z0   = TRANSFORMER_VECTOR_GROUP_Z0;
window.TRANSFORMER_GROUNDING_MODES   = TRANSFORMER_GROUNDING_MODES;
window.getCableInstallationFactors   = getCableInstallationFactors;
window.getCableZ0Factor              = getCableZ0Factor;
window.getTransformerVectorGroupZ0   = getTransformerVectorGroupZ0;
window.getTransformerZ0Ohms         = getTransformerZ0Ohms;

console.log('✅ constants.js v1.1 loaded');
console.log('   getCableZ0Factor()     — single Z0/Z1 source of truth (replaces SHORT_CIRCUIT_CONFIG.Z0_FACTORS.cable)');
console.log('   getTransformerZ0Ohms() — guards Infinity for Dd0/Dy11/Yd11 ungrounded types');