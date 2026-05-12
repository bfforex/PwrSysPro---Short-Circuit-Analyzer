/**
 * Utility Source Data Model — Canonical Sequence Impedance Normalizer
 *
 * Resolves Issue #70 Section 2: "Utility Source Data Input Support + Normalization"
 *
 * Accepts utility source data in any of the following forms and normalizes
 * all inputs into a single canonical Thevenin sequence model:
 *   { V_LL_kV, Z1_ohm(R1+jX1), Z2_ohm(R2+jX2), Z0_ohm(R0+jX0), freq_Hz }
 *
 * SUPPORTED INPUT MODES:
 *   Mode A — 3Φ fault duty (MVA) + X/R, optional SLG duty (MVA) + X/R
 *   Mode B — 3Φ fault current (kA) + X/R, optional SLG current (kA) + X/R
 *   Mode C — Sequence impedances in ohms (Z1/Z2/Z0 provided directly)
 *   Mode D — Mixed / multiple-form sheets (conflict detection + authority selection)
 *
 * PRECEDENCE (per Issue #70 §2.3):
 *   1. Explicit sequence impedances (Mode C) — most specific
 *   2. 3Φ fault duty/current → derive Z1
 *   3. SLG fault duty/current → derive Z0
 *   4. Heuristic fallback (ASSUMED) with warning
 *
 * PROVENANCE FLAGS per result field: "provided" | "derived_from_duty" | "assumed"
 *
 * REFERENCES:
 *   IEEE 141-1993 §5.2, 5.4 — Sequence impedance short-circuit methods
 *   IEC 60909-0:2016 §3.3 — Zero-sequence networks
 *   Issue #70 Test Vectors:
 *     V_LL=13.2 kV, MVA_3φ=156, MVA_SLG=22
 *     → I_3φ = 156/(√3×13.2) = 6.82 kA
 *     → I_SLG = 22/(√3×13.2) = 0.962 kA
 *
 * @author bfforex (Issue #70)
 * @version 1.0.0
 * @date 2026-03-04
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Default Z0/Z1 multiplier when Z0 is not derivable — flagged ASSUMED */
const UTILITY_Z0_DEFAULT_MULTIPLIER = 1.5;

/** Tolerance (fraction) for duty ↔ impedance ↔ current consistency check */
const UTILITY_CONSISTENCY_TOLERANCE = 0.02;  // ±2%

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: split |Z| into (R, X) using X/R ratio
// ─────────────────────────────────────────────────────────────────────────────
function _splitZByXR(zMag, xrRatio) {
    // |Z| = √(R² + X²),  X = R × (X/R)
    // → R = |Z| / √(1 + (X/R)²)
    if (!Number.isFinite(xrRatio) || xrRatio <= 0) xrRatio = 10; // default if missing
    const denom = Math.sqrt(1 + xrRatio * xrRatio);
    const r = zMag / denom;
    const x = r * xrRatio;
    return { r, x };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: complex magnitude
// ─────────────────────────────────────────────────────────────────────────────
function _cmag(r, x) {
    return Math.sqrt(r * r + x * x);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: normalizeUtilitySourceModel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize utility source data into a canonical Thevenin sequence model.
 *
 * @param {Object} params
 *   Common (always required):
 *     params.V_LL_kV      {number}  Nominal line-to-line voltage at POI (kV)
 *     params.freq_Hz      {number}  System frequency (default 60)
 *
 *   Mode A — Fault duty (MVA) + X/R:
 *     params.MVA_3ph      {number}  3-phase short-circuit duty (MVA)
 *     params.XR_3ph       {number}  3-phase X/R ratio
 *     params.MVA_SLG      {number}  [optional] SLG short-circuit duty (MVA)
 *     params.XR_SLG       {number}  [optional] SLG X/R ratio
 *
 *   Mode B — Fault current (kA) + X/R:
 *     params.kA_3ph       {number}  3-phase fault current (kA)
 *     params.XR_3ph       {number}  3-phase X/R ratio
 *     params.kA_SLG       {number}  [optional] SLG fault current (kA)
 *     params.XR_SLG       {number}  [optional] SLG X/R ratio
 *
 *   Mode C — Sequence impedances (Ω):
 *     params.Z1_r, params.Z1_x   {number}  R1, X1 of Z1 in ohms
 *     params.Z2_r, params.Z2_x   {number}  [optional] R2, X2 — defaults to Z1
 *     params.Z0_r, params.Z0_x   {number}  [optional] R0, X0 in ohms
 *
 *   Mode D (mixed):
 *     Supply multiple of the above; function detects inconsistency.
 *     params.authority    {string}  [optional] 'duty'|'impedance' to resolve conflicts
 *
 * @returns {Object} Canonical source model:
 *   {
 *     V_LL_kV,
 *     freq_Hz,
 *     mode,         // 'A' | 'B' | 'C' | 'D'
 *     Z1: { r, x, mag },
 *     Z2: { r, x, mag },
 *     Z0: { r, x, mag },
 *     provenance: { Z1, Z2, Z0 },  // 'provided'|'derived_from_duty'|'assumed'
 *     I_3ph_kA,     // 3-phase symmetrical fault current (kA) from canonical model
 *     I_SLG_kA,     // line-to-ground fault current (kA) from canonical model
 *     validation: { pass, warnings: [] },
 *     report        // human-readable text block
 *   }
 */
function normalizeUtilitySourceModel(params) {
    const V_LL_kV  = Number(params.V_LL_kV);
    const freq_Hz  = Number(params.freq_Hz  || 60);
    const SQRT3    = Math.sqrt(3);

    if (!V_LL_kV || V_LL_kV <= 0) {
        throw new Error('normalizeUtilitySourceModel: V_LL_kV is required and must be positive.');
    }

    const V_LN_kV  = V_LL_kV / SQRT3;         // kV (line-to-neutral)
    const V_LL_V   = V_LL_kV * 1000;           // V

    const warnings = [];
    const provenance = { Z1: 'assumed', Z2: 'assumed', Z0: 'assumed' };

    // ── Detect available inputs ──────────────────────────────────────────────
    const hasMVA3   = Number.isFinite(params.MVA_3ph)  && params.MVA_3ph  > 0;
    const hasMVASLG = Number.isFinite(params.MVA_SLG)  && params.MVA_SLG  > 0;
    const haskA3    = Number.isFinite(params.kA_3ph)   && params.kA_3ph   > 0;
    const haskASLG  = Number.isFinite(params.kA_SLG)   && params.kA_SLG   > 0;
    const hasZ1     = Number.isFinite(params.Z1_r)     || Number.isFinite(params.Z1_x);
    const hasZ0     = Number.isFinite(params.Z0_r)     || Number.isFinite(params.Z0_x);
    const hasXR3    = Number.isFinite(params.XR_3ph)   && params.XR_3ph  > 0;
    const hasXRSLG  = Number.isFinite(params.XR_SLG)   && params.XR_SLG  > 0;

    // Determine primary mode
    let mode;
    const hasMode_A = (hasMVA3 || hasMVASLG) && !haskA3 && !haskASLG && !hasZ1;
    const hasMode_B = (haskA3  || haskASLG)  && !hasMVA3 && !hasMVASLG && !hasZ1;
    const hasMode_C = hasZ1;
    const hasMode_D = (hasMode_C && (hasMVA3 || haskA3)) ||
                      (hasMVA3 && haskA3);   // multiple conflicting forms

    if (hasMode_D) {
        mode = 'D';
    } else if (hasMode_C) {
        mode = 'C';
    } else if (hasMode_A) {
        mode = 'A';
    } else if (hasMode_B) {
        mode = 'B';
    } else {
        throw new Error('normalizeUtilitySourceModel: Cannot determine input mode. Provide MVA+XR (Mode A), kA+XR (Mode B), or Z1/Z2/Z0 in ohms (Mode C).');
    }

    // ── Authority for Mode D conflict resolution ──────────────────────────────
    const authority = String(params.authority || '').toLowerCase();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Derive Z1
    // ─────────────────────────────────────────────────────────────────────────
    let Z1 = { r: 0, x: 0, mag: 0 };

    if (mode === 'C' || (mode === 'D' && authority === 'impedance')) {
        // Mode C (or D resolved to impedance): use provided Z1 directly
        Z1.r   = Number(params.Z1_r || 0);
        Z1.x   = Number(params.Z1_x || 0);
        Z1.mag = _cmag(Z1.r, Z1.x);
        provenance.Z1 = 'provided';

    } else if (mode === 'A' && hasMVA3) {
        // Mode A: |Z1| = V_LL² / MVA_3ph  (all in kV/MVA → Ω)
        const Z1_mag = (V_LL_kV * V_LL_kV) / params.MVA_3ph;
        const xr = hasXR3 ? params.XR_3ph : 10;
        Object.assign(Z1, _splitZByXR(Z1_mag, xr));
        Z1.mag = Z1_mag;
        provenance.Z1 = 'derived_from_duty';
        if (!hasXR3) warnings.push('Z1: X/R ratio not provided for 3Φ duty — defaulted to 10.');

    } else if (mode === 'B' && haskA3) {
        // Mode B: |Z1| = V_LL / (√3 × I_3ph)   (kV, kA → Ω)
        const Z1_mag = V_LL_kV / (SQRT3 * params.kA_3ph);
        const xr = hasXR3 ? params.XR_3ph : 10;
        Object.assign(Z1, _splitZByXR(Z1_mag, xr));
        Z1.mag = Z1_mag;
        provenance.Z1 = 'derived_from_duty';
        if (!hasXR3) warnings.push('Z1: X/R ratio not provided for 3Φ current — defaulted to 10.');

    } else if (mode === 'D') {
        // Mode D: prefer duty unless authority='impedance'
        if (hasMVA3) {
            const Z1_mag = (V_LL_kV * V_LL_kV) / params.MVA_3ph;
            const xr = hasXR3 ? params.XR_3ph : 10;
            Object.assign(Z1, _splitZByXR(Z1_mag, xr));
            Z1.mag = Z1_mag;
            provenance.Z1 = 'derived_from_duty';
        } else if (haskA3) {
            const Z1_mag = V_LL_kV / (SQRT3 * params.kA_3ph);
            const xr = hasXR3 ? params.XR_3ph : 10;
            Object.assign(Z1, _splitZByXR(Z1_mag, xr));
            Z1.mag = Z1_mag;
            provenance.Z1 = 'derived_from_duty';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Derive Z2 (default = Z1)
    // ─────────────────────────────────────────────────────────────────────────
    let Z2 = { r: 0, x: 0, mag: 0 };

    if (Number.isFinite(params.Z2_r) || Number.isFinite(params.Z2_x)) {
        Z2.r   = Number(params.Z2_r || 0);
        Z2.x   = Number(params.Z2_x || 0);
        Z2.mag = _cmag(Z2.r, Z2.x);
        provenance.Z2 = 'provided';
    } else {
        // Default: Z2 = Z1 (standard assumption for static equipment sources)
        Z2 = { ...Z1 };
        provenance.Z2 = (provenance.Z1 === 'provided') ? 'assumed' : 'derived_from_duty';
        if (provenance.Z2 === 'assumed') {
            warnings.push('Z2: Not provided — assumed equal to Z1 (standard assumption).');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Derive Z0
    // ─────────────────────────────────────────────────────────────────────────
    let Z0 = { r: 0, x: 0, mag: 0 };

    if (mode === 'C' || (mode === 'D' && authority === 'impedance' && hasZ0)) {
        // Mode C: use provided Z0
        Z0.r   = Number(params.Z0_r || 0);
        Z0.x   = Number(params.Z0_x || 0);
        Z0.mag = _cmag(Z0.r, Z0.x);
        provenance.Z0 = 'provided';

    } else if ((mode === 'A' && hasMVASLG) || (mode === 'D' && hasMVASLG)) {
        // Derive Z0 from SLG duty:
        // I_SLG = MVA_SLG / (√3 × V_LL_kV)  →  |Zsum| = 3×V_LN / I_SLG
        // Zsum = Z0 + Z1 + Z2  →  |Zsum_ohm| = 3×V_LN_V / I_SLG_A
        const I_SLG_kA  = params.MVA_SLG / (SQRT3 * V_LL_kV);
        const Zsum_mag  = 3 * (V_LL_V / SQRT3) / (I_SLG_kA * 1000);
        const xrSLG     = hasXRSLG ? params.XR_SLG : (Z1.x / (Z1.r || 1e-18));
        const Zsum      = _splitZByXR(Zsum_mag, xrSLG);
        // Z0 = Zsum − (Z1 + Z2) complex
        Z0.r   = Zsum.r - (Z1.r + Z2.r);
        Z0.x   = Zsum.x - (Z1.x + Z2.x);
        Z0.mag = _cmag(Z0.r, Z0.x);
        provenance.Z0  = 'derived_from_duty';
        if (!hasXRSLG) warnings.push('Z0: SLG X/R not provided — used Z1 X/R as approximation.');

    } else if ((mode === 'B' && haskASLG) || (mode === 'D' && haskASLG)) {
        // Derive Z0 from SLG current:
        const Zsum_mag  = 3 * (V_LL_V / SQRT3) / (params.kA_SLG * 1000);
        const xrSLG     = hasXRSLG ? params.XR_SLG : (Z1.x / (Z1.r || 1e-18));
        const Zsum      = _splitZByXR(Zsum_mag, xrSLG);
        Z0.r   = Zsum.r - (Z1.r + Z2.r);
        Z0.x   = Zsum.x - (Z1.x + Z2.x);
        Z0.mag = _cmag(Z0.r, Z0.x);
        provenance.Z0  = 'derived_from_duty';
        if (!hasXRSLG) warnings.push('Z0: SLG X/R not provided — used Z1 X/R as approximation.');

    } else {
        // Fallback heuristic: Z0 = UTILITY_Z0_DEFAULT_MULTIPLIER × Z1
        Z0.r   = Z1.r * UTILITY_Z0_DEFAULT_MULTIPLIER;
        Z0.x   = Z1.x * UTILITY_Z0_DEFAULT_MULTIPLIER;
        Z0.mag = _cmag(Z0.r, Z0.x);
        provenance.Z0 = 'assumed';
        warnings.push(`Z0: SLG data not provided — Z0 assumed = ${UTILITY_Z0_DEFAULT_MULTIPLIER}×Z1 (heuristic, ASSUMED). ` +
                      'Provide SLG MVA/kA or sequence impedances for accuracy.');
    }

    // Clamp Z0 components to ≥ 0 if derivation produced negative results
    // (can happen if Zsum < Z1+Z2, indicating data inconsistency)
    if (Z0.r < 0 || Z0.x < 0) {
        warnings.push('Z0: Derived Z0 has negative component(s) — SLG data may be inconsistent with 3Φ data. ' +
                      'Clamping to heuristic fallback: Z0 = ' + UTILITY_Z0_DEFAULT_MULTIPLIER + '×Z1.');
        Z0.r = Z1.r * UTILITY_Z0_DEFAULT_MULTIPLIER;
        Z0.x = Z1.x * UTILITY_Z0_DEFAULT_MULTIPLIER;
        Z0.mag = _cmag(Z0.r, Z0.x);
        provenance.Z0 = 'assumed';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Compute canonical currents
    // ─────────────────────────────────────────────────────────────────────────

    // 3-phase symmetrical:  I_3ph = V_LL / (√3 × |Z1|)
    const I_3ph_kA = Z1.mag > 0
        ? (V_LL_kV / (SQRT3 * Z1.mag))   // kV / Ω = kA
        : 0;

    // SLG (bolted, solidly grounded, Zf=0):
    //   I_SLG = |3 × V_LN / (Z0 + Z1 + Z2)|
    //   = 3 × (V_LL_kV/√3) / |(Z0.r+Z1.r+Z2.r) + j(Z0.x+Z1.x+Z2.x)|
    const Zseq_r  = Z0.r + Z1.r + Z2.r;
    const Zseq_x  = Z0.x + Z1.x + Z2.x;
    const Zseq_mag = _cmag(Zseq_r, Zseq_x) || 1e-18;
    const I_SLG_kA = (3 * V_LN_kV) / Zseq_mag;   // kV / Ω = kA

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Validation checks
    // ─────────────────────────────────────────────────────────────────────────
    let validationPass = true;

    // (a) Duty ↔ impedance ↔ current check for 3Φ
    if (hasMVA3) {
        const I_expected = params.MVA_3ph / (SQRT3 * V_LL_kV);
        const mismatch   = Math.abs(I_3ph_kA - I_expected) / (I_expected || 1);
        if (mismatch > UTILITY_CONSISTENCY_TOLERANCE) {
            validationPass = false;
            warnings.push(`VALIDATION FAIL (3Φ): Derived I_3ph=${I_3ph_kA.toFixed(3)} kA ` +
                          `vs duty-implied ${I_expected.toFixed(3)} kA — mismatch ${(mismatch*100).toFixed(1)}%. ` +
                          'Check POI basis voltage.');
        }
    }
    if (haskA3) {
        const mismatch = Math.abs(I_3ph_kA - params.kA_3ph) / (params.kA_3ph || 1);
        if (mismatch > UTILITY_CONSISTENCY_TOLERANCE) {
            validationPass = false;
            warnings.push(`VALIDATION FAIL (3Φ kA): Derived Z1 gives ${I_3ph_kA.toFixed(3)} kA ` +
                          `vs input ${params.kA_3ph.toFixed(3)} kA — mismatch ${(mismatch*100).toFixed(1)}%.`);
        }
    }

    // (b) SLG duty check
    if (hasMVASLG) {
        const I_SLG_exp  = params.MVA_SLG / (SQRT3 * V_LL_kV);
        const mismatch   = Math.abs(I_SLG_kA - I_SLG_exp) / (I_SLG_exp || 1);
        if (mismatch > UTILITY_CONSISTENCY_TOLERANCE) {
            validationPass = false;
            warnings.push(`VALIDATION FAIL (SLG): Derived I_SLG=${I_SLG_kA.toFixed(3)} kA ` +
                          `vs duty-implied ${I_SLG_exp.toFixed(3)} kA — mismatch ${(mismatch*100).toFixed(1)}%.`);
        }
    }
    if (haskASLG) {
        const mismatch = Math.abs(I_SLG_kA - params.kA_SLG) / (params.kA_SLG || 1);
        if (mismatch > UTILITY_CONSISTENCY_TOLERANCE) {
            validationPass = false;
            warnings.push(`VALIDATION FAIL (SLG kA): Derived Z0 gives ${I_SLG_kA.toFixed(3)} kA ` +
                          `vs input ${params.kA_SLG.toFixed(3)} kA — mismatch ${(mismatch*100).toFixed(1)}%.`);
        }
    }

    // (c) Mode D conflict detection
    if (mode === 'D' && !authority) {
        warnings.push('MODE D: Multiple conflicting utility data forms detected. ' +
                      'Set params.authority = "duty" or "impedance" to resolve. ' +
                      'Defaulting to duty model (Mode A/B).');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Build human-readable report block
    // ─────────────────────────────────────────────────────────────────────────
    let rpt = '';
    rpt += '═'.repeat(80) + '\n';
    rpt += 'UTILITY SOURCE MODEL — CANONICAL SEQUENCE IMPEDANCES\n';
    rpt += '═'.repeat(80) + '\n\n';

    rpt += `📋 INPUT MODE\n`;
    rpt += '─'.repeat(80) + '\n';
    const modeLabels = {
        A: 'Mode A — Fault Duty (MVA) + X/R',
        B: 'Mode B — Fault Current (kA) + X/R',
        C: 'Mode C — Sequence Impedances (Ω) — provided directly',
        D: 'Mode D — Mixed / Multiple forms (conflict detection)'
    };
    rpt += `Mode: ${modeLabels[mode] || mode}\n`;
    rpt += `POI Basis Voltage (V_LL): ${V_LL_kV} kV (L-L)\n`;
    rpt += `System Frequency: ${freq_Hz} Hz\n\n`;

    rpt += `📐 INPUTS RECEIVED\n`;
    rpt += '─'.repeat(80) + '\n';
    if (hasMVA3)   rpt += `  3Φ Fault Duty:  ${params.MVA_3ph.toFixed(1)} MVA,  X/R = ${params.XR_3ph || 'not provided'}\n`;
    if (hasMVASLG) rpt += `  SLG Fault Duty: ${params.MVA_SLG.toFixed(1)} MVA,  X/R = ${params.XR_SLG || 'not provided'}\n`;
    if (haskA3)    rpt += `  3Φ Fault Curr:  ${params.kA_3ph.toFixed(3)} kA,   X/R = ${params.XR_3ph || 'not provided'}\n`;
    if (haskASLG)  rpt += `  SLG Fault Curr: ${params.kA_SLG.toFixed(3)} kA,   X/R = ${params.XR_SLG || 'not provided'}\n`;
    if (hasZ1)     rpt += `  Z1: R = ${(params.Z1_r||0).toFixed(6)} Ω, X = ${(params.Z1_x||0).toFixed(6)} Ω (provided)\n`;
    if (hasZ0)     rpt += `  Z0: R = ${(params.Z0_r||0).toFixed(6)} Ω, X = ${(params.Z0_x||0).toFixed(6)} Ω (provided)\n`;
    rpt += '\n';

    rpt += `📊 CANONICAL SEQUENCE IMPEDANCES (Ω at POI)\n`;
    rpt += '─'.repeat(80) + '\n';
    rpt += `Z1 (Positive Seq): R1 = ${Z1.r.toFixed(6)} Ω, X1 = ${Z1.x.toFixed(6)} Ω, |Z1| = ${Z1.mag.toFixed(6)} Ω  [${provenance.Z1}]\n`;
    rpt += `Z2 (Negative Seq): R2 = ${Z2.r.toFixed(6)} Ω, X2 = ${Z2.x.toFixed(6)} Ω, |Z2| = ${Z2.mag.toFixed(6)} Ω  [${provenance.Z2}]\n`;
    rpt += `Z0 (Zero Seq):     R0 = ${Z0.r.toFixed(6)} Ω, X0 = ${Z0.x.toFixed(6)} Ω, |Z0| = ${Z0.mag.toFixed(6)} Ω  [${provenance.Z0}]\n\n`;

    rpt += `⚡ FAULT CURRENTS (from canonical model)\n`;
    rpt += '─'.repeat(80) + '\n';
    rpt += `I_3Φ  = V_LL / (√3 × |Z1|) = ${V_LL_kV} / (√3 × ${Z1.mag.toFixed(6)}) = ${I_3ph_kA.toFixed(3)} kA\n`;
    rpt += `I_SLG = |3×V_LN / (Z0+Z1+Z2)| = ${I_SLG_kA.toFixed(3)} kA  (bolted, solidly grounded, Zf=0)\n\n`;

    rpt += `✅ VALIDATION\n`;
    rpt += '─'.repeat(80) + '\n';
    rpt += `Status: ${validationPass ? 'PASS' : 'WARN — see warnings'}\n`;
    if (warnings.length > 0) {
        warnings.forEach(w => { rpt += `  ⚠️  ${w}\n`; });
    } else {
        rpt += `  No warnings.\n`;
    }
    rpt += '\n';

    rpt += `📝 PROVENANCE SUMMARY\n`;
    rpt += '─'.repeat(80) + '\n';
    rpt += `  Z1: ${provenance.Z1}\n`;
    rpt += `  Z2: ${provenance.Z2}\n`;
    rpt += `  Z0: ${provenance.Z0}\n`;
    rpt += `  Grounding assumed: solidly grounded (Zf=0) unless otherwise specified.\n`;
    rpt += '\n';

    rpt += '═'.repeat(80) + '\n';
    rpt += 'END OF UTILITY SOURCE MODEL\n';
    rpt += '═'.repeat(80) + '\n';

    return {
        V_LL_kV,
        freq_Hz,
        mode,
        Z1,
        Z2,
        Z0,
        provenance,
        I_3ph_kA,
        I_SLG_kA,
        validation: { pass: validationPass, warnings },
        report: rpt
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: convert canonical model to ohmic utility fault current (kA)
// Used by shortCircuitCalc.js source bus handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a bus's source data, build canonical utility model and return
 * the derived utilityFaultCurrent (kA) + Z0 data for use in calculations.
 *
 * @param {Object} bus - Source bus object from state.buses
 * @returns {Object|null} { utilityFaultCurrent, utilityR, utilityX, Z0_r, Z0_x, model }
 *                        or null if insufficient data
 */
function resolveUtilitySourceImpedances(bus) {
    if (!bus || bus.type !== 'source') return null;

    // Already has a canonical model stored?
    if (bus.utilitySourceModel) {
        const m = bus.utilitySourceModel;
        return {
            utilityFaultCurrent: m.I_3ph_kA,
            utilityR:            m.Z1.r,
            utilityX:            m.Z1.x,
            Z0_r:                m.Z0.r,
            Z0_x:                m.Z0.x,
            model:               m
        };
    }

    // Build from available bus fields
    const V_LL_kV = Number(bus.voltage) / 1000;  // bus.voltage in V
    const params  = { V_LL_kV };

    if (bus.utilityMode === 'MVA' && bus.utilityFaultMVA) {
        params.MVA_3ph = bus.utilityFaultMVA;
        params.XR_3ph  = bus.utilityXR || 10;
    } else if (bus.utilityFaultCurrent) {
        params.kA_3ph  = bus.utilityFaultCurrent;
        params.XR_3ph  = bus.utilityXR || 10;
    } else {
        return null;  // insufficient data
    }

    // SLG inputs if present
    if (bus.utilitySLGMVA)  { params.MVA_SLG = bus.utilitySLGMVA; params.XR_SLG = bus.utilitySLGXR; }
    if (bus.utilitySLGkA)   { params.kA_SLG  = bus.utilitySLGkA;  params.XR_SLG = bus.utilitySLGXR; }
    if (Number.isFinite(bus.utilityZ1_r)) { params.Z1_r = bus.utilityZ1_r; params.Z1_x = bus.utilityZ1_x; }
    if (Number.isFinite(bus.utilityZ0_r)) { params.Z0_r = bus.utilityZ0_r; params.Z0_x = bus.utilityZ0_x; }

    try {
        const model = normalizeUtilitySourceModel(params);
        return {
            utilityFaultCurrent: model.I_3ph_kA,
            utilityR:            model.Z1.r,
            utilityX:            model.Z1.x,
            Z0_r:                model.Z0.r,
            Z0_x:                model.Z0.x,
            model
        };
    } catch (e) {
        console.warn('resolveUtilitySourceImpedances failed:', e.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
window.normalizeUtilitySourceModel     = normalizeUtilitySourceModel;
window.resolveUtilitySourceImpedances  = resolveUtilitySourceImpedances;

console.log('✅ utilitySourceModel.js loaded — Modes A/B/C/D utility source normalization ready');
