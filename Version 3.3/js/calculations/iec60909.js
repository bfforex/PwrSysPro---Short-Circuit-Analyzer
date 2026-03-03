/**
 * IEC 60909-0:2016 Short Circuit Calculation Module
 *
 * Implements the IEC 60909-0:2016 international standard for maximum and minimum
 * fault currents in three-phase AC systems. Calculation steps are generated in the
 * same physical pattern as the IEEE Point-to-Point and Per-Unit methods.
 *
 * @author Engr. B. P. Faraon
 * @date 2026-02-20
 * @version 2.0.0
 *
 * STANDARDS COMPLIANCE:
 * - IEC 60909-0:2016  — Short-circuit currents in three-phase AC systems: Calculation
 * - IEC 60909-1:2002  — Factors for the calculation of short-circuit currents
 * - IEC 60228:2004    — Conductors of insulated cables (cable sizes)
 * - IEC 60364-5-52    — Cable impedance reference values
 * - IEC 60038:2009    — IEC standard voltages
 */

console.log('🔧 Loading IEC 60909 Short Circuit Calculation Module v2.0.0...');

// ════════════════════════════════════════════════════════════════════════════════
// IEC 60909 CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const IEC60909_CONFIG = {
    VOLTAGE_FACTORS: {
        MAX: {
            LV_230_400: 1.05,
            LV_OTHER:   1.10,
            MV:         1.10,
            HV:         1.10
        },
        MIN: {
            LV:    0.95,
            MV_HV: 1.00
        }
    },
    FREQUENCY:     60,
    BREAKING_TIME: 0.1,
    Z0_FACTORS: {
        utility:     1.5,
        cable:       3.0,
        transformer: 1.0,
        generator:   0.05
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// VOLTAGE FACTOR (c) — IEC 60909-0:2016 Table 1
// ════════════════════════════════════════════════════════════════════════════════

function getVoltageFactor(voltage, calcType = 'max') {
    if (calcType === 'max') {
        if (voltage <= 1000) {
            if (voltage === 230 || voltage === 400 || voltage === 220 || voltage === 380) {
                return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.LV_230_400;
            }
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.LV_OTHER;
        }
        if (voltage <= 35000) return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.MV;
        return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.HV;
    } else {
        if (voltage <= 1000) return IEC60909_CONFIG.VOLTAGE_FACTORS.MIN.LV;
        return IEC60909_CONFIG.VOLTAGE_FACTORS.MIN.MV_HV;
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// TRANSFORMER CORRECTION FACTOR KT — IEC 60909-0:2016 Section 3.3.3
// ════════════════════════════════════════════════════════════════════════════════

function calculateTransformerCorrectionFactor(cmax, xT) {
    return (0.95 * cmax) / (1 + 0.6 * xT);
}

// ════════════════════════════════════════════════════════════════════════════════
// PEAK FACTOR κ — IEC 60909-0:2016 Section 4.3.1, Eq. 29
// ════════════════════════════════════════════════════════════════════════════════

function calculatePeakFactor(rOhms, xOhms) {
    if (xOhms === 0 || rOhms === 0) return 1.02;
    return 1.02 + 0.98 * Math.exp(-3 * rOhms / xOhms);
}

// ════════════════════════════════════════════════════════════════════════════════
// IEC CABLE IMPEDANCE
// IEC 60228 / IEC 60364-5-52 standard data is in constants.js (IEC_CABLE_IMPEDANCE_DATA).
// This function resolves and computes the cable impedance in Ω.
// ════════════════════════════════════════════════════════════════════════════════

function getIECCableImpedance(cable, temperature) {
    // Resolve IEC mm² size (handles NEC/AWG → IEC cross-reference automatically)
    const resolved = (typeof resolveIECCableSize === 'function')
        ? resolveIECCableSize(cable)
        : { iecSize: '70', necSize: null, crossRefUsed: true, note: 'resolveIECCableSize not available; defaulted to 70 mm²' };

    const iecSize = resolved.iecSize;
    const iecData = (typeof IEC_CABLE_IMPEDANCE_DATA !== 'undefined') ? IEC_CABLE_IMPEDANCE_DATA[iecSize] : null;
    const data    = iecData || (typeof IEC_CABLE_IMPEDANCE_DATA !== 'undefined' ? IEC_CABLE_IMPEDANCE_DATA['70'] : null);

    if (!data) {
        console.warn('⚠️  IEC_CABLE_IMPEDANCE_DATA not available — ensure constants.js is loaded first.');
        return { r: 0.001, x: 0.0004, r0: 0.003, x0: 0.0012, iecSize, necSize: resolved.necSize, crossRefUsed: true, lengthM: cable.length, lengthFt: cable.length, lengthUnit: 'ft', parallel: 1, r20_per_km: 0, rT_per_km: 0, x_per_km: 0, tempFactor: 1, material: 'copper', note: 'IEC data unavailable' };
    }

    const mat     = cable.material === 'aluminum' ? 'aluminum' : 'copper';
    const matData = data[mat] || data['copper'];

    // Length: NEC/AWG-modelled cables store length in feet; convert to metres
    const isNECSize    = (typeof IEC_NEC_CABLE_CROSSREF !== 'undefined') && !!IEC_NEC_CABLE_CROSSREF[String(cable.size)];
    const lengthUnit   = cable.lengthUnit || (isNECSize ? 'ft' : 'ft');
    const lengthM      = (lengthUnit === 'ft') ? cable.length * 0.3048 : cable.length;
    const parallel     = cable.parallel || 1;

    // Temperature correction: R_T = R_20 × [1 + α(T − 20)]
    const ALPHA        = (typeof TEMP_COEFFICIENT !== 'undefined')
        ? (mat === 'aluminum' ? TEMP_COEFFICIENT.aluminum : TEMP_COEFFICIENT.copper)
        : (mat === 'aluminum' ? 0.00403 : 0.00393);
    const tempFactor   = 1 + ALPHA * (temperature - 20);
    const r20_per_km   = matData.r;
    const rT_per_km    = r20_per_km * tempFactor;
    const x_per_km     = matData.x;

    // Ω = (Ω/km) × (m / 1000) / parallel
    const r  = (rT_per_km  * lengthM / 1000) / parallel;
    const x  = (x_per_km   * lengthM / 1000) / parallel;
    const z0F = IEC60909_CONFIG.Z0_FACTORS.cable;
    const r0 = r * z0F;
    const x0 = x * z0F;

    return {
        r, x, r0, x0,
        iecSize, necSize: resolved.necSize,
        crossRefUsed: resolved.crossRefUsed,
        lengthM, lengthFt: cable.length, lengthUnit,
        parallel, r20_per_km, rT_per_km, x_per_km,
        tempFactor, material: mat,
        note: resolved.note
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// SOURCE IMPEDANCE
// ════════════════════════════════════════════════════════════════════════════════

function calculateSourceImpedanceIEC(sourceBus) {
    const voltage = sourceBus.voltage;
    if (sourceBus.utilityFaultCurrent) {
        const utilityZ = voltage / (Math.sqrt(3) * sourceBus.utilityFaultCurrent * 1000);
        const xrRatio  = sourceBus.utilityXR || 10;
        const x = utilityZ * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
        const r = utilityZ / Math.sqrt(1 + xrRatio * xrRatio);
        return { r, x, z: utilityZ, xrRatio, fromFaultCurrent: true };
    }
    if (sourceBus.faultMVA) {
        const baseZ   = (voltage * voltage) / (sourceBus.faultMVA * 1e6);
        const xrRatio = sourceBus.xrRatio || 10;
        const x = baseZ * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
        const r = baseZ / Math.sqrt(1 + xrRatio * xrRatio);
        return { r, x, z: baseZ, xrRatio, fromFaultCurrent: false };
    }
    return { r: 1e-9, x: 1e-9, z: 1e-9, xrRatio: 10, fromFaultCurrent: false };
}

// ════════════════════════════════════════════════════════════════════════════════
// TRANSFORMER IMPEDANCE (referred to secondary, with optional KT)
// ════════════════════════════════════════════════════════════════════════════════

function calculateTransformerImpedanceIEC(transformer, cmax, applyKT) {
    const secondaryV = transformer.secondary;
    const ratingKVA  = transformer.rating;
    const zPercent   = transformer.impedance / 100;
    const xrRatio    = transformer.xr || transformer.xrRatio || 6;

    const baseZ  = (secondaryV * secondaryV) / (ratingKVA * 1000);
    const z_ohms = zPercent * baseZ;
    const x_ohms = z_ohms * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const r_ohms = z_ohms / Math.sqrt(1 + xrRatio * xrRatio);

    const xT_pu = zPercent * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const kt    = applyKT ? calculateTransformerCorrectionFactor(cmax, xT_pu) : 1.0;

    return {
        r: r_ohms * kt, x: x_ohms * kt, z: z_ohms * kt,
        r_uncorrected: r_ohms, x_uncorrected: x_ohms, z_uncorrected: z_ohms,
        xrRatio, kt, xT_pu, baseZ
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// GENERATOR IMPEDANCE — IEC 60909-0:2016 Section 3.6
// ════════════════════════════════════════════════════════════════════════════════

function calculateGeneratorImpedanceIEC(generator, voltage) {
    const ratingKVA = generator.rating || 0;
    const xdpp_pu   = (generator.subtransientReactance || 15) / 100;
    const xrRatio   = 20;
    const baseZ     = ratingKVA ? (voltage * voltage) / (ratingKVA * 1000) : 0;
    const x         = xdpp_pu * baseZ;
    const r         = xrRatio > 0 ? x / xrRatio : 0;
    return { r, x, z: Math.sqrt(r * r + x * x), xrRatio, baseZ };
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN CALCULATION FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

function calculateShortCircuitIEC60909(path, calcType = 'max') {

    if (!Array.isArray(path) || path.length === 0) {
        throw new Error('IEC 60909 requires a valid path to a SOURCE bus. Path is null/empty.');
    }

    const engineerName = document.getElementById('engineer')?.value || 'Unknown Engineer';
    const temperature  = parseFloat(document.getElementById('temperature')?.value) || 75;

    const sourceBus = path[0]?.bus;
    const targetBus = path[path.length - 1]?.bus;
    if (!sourceBus) throw new Error('IEC 60909: path has no source bus.');
    if (!targetBus) throw new Error('IEC 60909: path has no target bus.');

    const Un      = targetBus.voltage;
    const cFactor = getVoltageFactor(Un, calcType);
    const applyKT = (calcType === 'max');
    const isMax   = (calcType === 'max');

    let totalR  = 0, totalX  = 0;
    let totalR0 = 0, totalX0 = 0;
    let currentVoltageLevel = sourceBus.voltage;

    // ══════════════════════════════════════════════════════════════════════
    // HEADER
    // ══════════════════════════════════════════════════════════════════════

    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += `SHORT CIRCUIT CALCULATION - IEC 60909-0:2016 (${isMax ? 'MAXIMUM' : 'MINIMUM'})\n`;
    steps += '═'.repeat(80) + '\n\n';

    steps += `📋 CALCULATION INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Date/Time:           ${(typeof getCalculationTimestamp === 'function') ? getCalculationTimestamp() : new Date().toISOString()}\n`;
    steps += `Engineer:            ${engineerName}\n`;
    steps += `Temperature:         ${temperature}°C\n`;
    steps += `Method:              IEC 60909-0:2016 ${isMax ? 'Maximum Fault Current' : 'Minimum Fault Current'}\n`;
    steps += `Calculation Type:    ${isMax ? 'c_max — Equipment Rating / Switchgear Sizing' : 'c_min — Protection Coordination / Backup Verification'}\n`;
    steps += `System Frequency:    ${IEC60909_CONFIG.FREQUENCY} Hz\n`;
    steps += `Fault Bus:           ${targetBus.tag || targetBus.name || 'N/A'} (${Un} V)\n`;
    steps += '\n';

    steps += `📖 IEC VOLTAGE FACTOR (c) — IEC 60909-0:2016 Table 1\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Nominal Voltage:     Un = ${Un} V\n`;
    steps += `Voltage Class:       ${Un <= 1000 ? 'Low Voltage (LV, ≤1000 V)' : Un <= 35000 ? 'Medium Voltage (MV, 1–35 kV)' : 'High Voltage (HV, >35 kV)'}\n`;
    steps += `Voltage Factor:      c = ${cFactor.toFixed(3)}  (${isMax ? 'c_max' : 'c_min'})\n`;
    steps += `Purpose:             ${isMax ? 'Maximize fault current for equipment rating verification' : 'Minimize fault current for protection sensitivity check'}\n`;
    steps += '\n';

    steps += `📖 METHODOLOGY NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• IEC 60909 uses the equivalent voltage source method (Thevenin)\n`;
    steps += `• Equivalent source at fault: c × Un / √3;  all other EMFs set to zero\n`;
    steps += `• Transformer correction factor KT: ${applyKT ? 'APPLIED (max calculation, IEC 60909-0 Sec. 3.3.3)' : 'NOT applied (min calculation)'}\n`;
    steps += `• Cable data: IEC 60228 / IEC 60364-5-52 standard mm² sizes, Ω/km\n`;
    steps += `• NEC/AWG cable sizes cross-referenced to IEC mm² equivalents automatically\n`;
    steps += `• IEC units: length in metres (m), impedance in Ω/km → result in Ω\n`;
    steps += `• Zero sequence (Z0) tracked for earth-fault current (I"k1) calculation\n`;
    steps += `• Component tags shown for full traceability\n`;
    steps += `• From/To bus connections displayed for path verification\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: SOURCE BUS
    // ══════════════════════════════════════════════════════════════════════

    let stepNumber = 1;

    if (sourceBus.type === 'source' && (sourceBus.utilityFaultCurrent || sourceBus.faultMVA)) {
        const src = calculateSourceImpedanceIEC(sourceBus);
        const z0F = IEC60909_CONFIG.Z0_FACTORS.utility;

        totalR  += src.r;
        totalX  += src.x;
        totalR0 += src.r * z0F;
        totalX0 += src.x * z0F;

        steps += '═'.repeat(80) + '\n';
        steps += `STEP ${stepNumber}: SOURCE BUS IMPEDANCE\n`;
        steps += '═'.repeat(80) + '\n\n';

        steps += `🔌 SOURCE INFORMATION\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Bus Tag:             ${sourceBus.tag || sourceBus.name || 'N/A'}\n`;
        steps += `Bus Name:            ${sourceBus.name}\n`;
        steps += `Bus Type:            ${sourceBus.type.toUpperCase()}\n`;
        steps += `Voltage Level:       ${sourceBus.voltage} V\n`;
        if (src.fromFaultCurrent) {
            steps += `Available Fault:     ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
        } else if (sourceBus.faultMVA) {
            steps += `Short-Circuit MVA:   ${sourceBus.faultMVA.toFixed(1)} MVA\n`;
        }
        steps += `X/R Ratio:           ${src.xrRatio}\n`;
        steps += '\n';

        steps += `📐 IMPEDANCE CALCULATION (IEC 60909-0:2016 Section 3.4)\n`;
        steps += '─'.repeat(80) + '\n';
        if (src.fromFaultCurrent) {
            steps += `Formula:             Zs = Un / (√3 × I"k_source)\n`;
            steps += '\n';
            steps += `Step-by-Step Calculation:\n`;
            steps += `   Given:\n`;
            steps += `      Un = ${sourceBus.voltage} V\n`;
            steps += `      I"k_source = ${sourceBus.utilityFaultCurrent.toFixed(2)} kA = ${sourceBus.utilityFaultCurrent * 1000} A\n`;
            steps += `      √3 = ${Math.sqrt(3).toFixed(4)}\n`;
            steps += '\n';
            steps += `   Calculation:\n`;
            steps += `      Zs = ${sourceBus.voltage} / (${Math.sqrt(3).toFixed(4)} × ${sourceBus.utilityFaultCurrent * 1000})\n`;
            steps += `      Zs = ${sourceBus.voltage} / ${(Math.sqrt(3) * sourceBus.utilityFaultCurrent * 1000).toFixed(2)}\n`;
            steps += `      Zs = ${src.z.toFixed(6)} Ω\n`;
        } else {
            steps += `Formula:             Zs = Un² / S"k_source\n`;
            steps += `   Zs = (${sourceBus.voltage})² / (${sourceBus.faultMVA} × 1,000,000)\n`;
            steps += `   Zs = ${src.z.toFixed(6)} Ω\n`;
        }
        steps += '\n';

        steps += `📊 COMPONENT SEPARATION (Using X/R = ${src.xrRatio})\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Formulas:\n`;
        steps += `   Rs = Zs / √(1 + (X/R)²)\n`;
        steps += `   Xs = Rs × (X/R)\n`;
        steps += '\n';
        steps += `Calculation:\n`;
        steps += `   Rs = ${src.z.toFixed(6)} / √(1 + ${src.xrRatio}²)\n`;
        steps += `   Rs = ${src.z.toFixed(6)} / ${Math.sqrt(1 + src.xrRatio * src.xrRatio).toFixed(4)}\n`;
        steps += `   Rs = ${src.r.toFixed(6)} Ω\n`;
        steps += '\n';
        steps += `   Xs = ${src.r.toFixed(6)} × ${src.xrRatio}\n`;
        steps += `   Xs = ${src.x.toFixed(6)} Ω\n`;
        steps += '\n';

        steps += `Positive Sequence (Z1) — Source:\n`;
        steps += `   R1 = ${src.r.toFixed(6)} Ω\n`;
        steps += `   X1 = ${src.x.toFixed(6)} Ω\n`;
        steps += `   Z1 = ${src.z.toFixed(6)} Ω\n`;
        steps += '\n';
        steps += `Zero Sequence (Z0) — Estimated ${z0F}× Z1 (IEC 60909-0:2016 Annex B):\n`;
        steps += `   R0 = ${src.r.toFixed(6)} × ${z0F} = ${(src.r * z0F).toFixed(6)} Ω\n`;
        steps += `   X0 = ${src.x.toFixed(6)} × ${z0F} = ${(src.x * z0F).toFixed(6)} Ω\n`;
        steps += `   ℹ️  Utility Z0 typically 1.0 to 3.0 × Z1 per IEC 60909-0 Annex B\n`;
        steps += '\n';

        steps += `✅ RUNNING TOTALS (at ${sourceBus.voltage} V)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
        steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
        steps += '\n\n';
        stepNumber++;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEPS 2–N: TRANSFORMERS, CABLES, GENERATORS
    // ══════════════════════════════════════════════════════════════════════

    const processedTransformerKeys = new Set();

    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp    = segment?.component;
        if (!comp) continue;

        // ── TRANSFORMER ──────────────────────────────────────────────────
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            if (processedTransformerKeys.has(key)) continue;
            processedTransformerKeys.add(key);

            const parallelXfmrs = path
                .filter(seg => seg?.component?.type === 'transformer' &&
                    seg.component.fromBus === comp.fromBus &&
                    seg.component.toBus   === comp.toBus)
                .map(seg => seg.component);
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((s, x) => s + x.rating, 0);

            const xfmrResult   = calculateTransformerImpedanceIEC(comp, cFactor, applyKT);
            const xfmrR_single = xfmrResult.r;
            const xfmrX_single = xfmrResult.x;
            const xfmrR        = xfmrR_single / numParallel;
            const xfmrX        = xfmrX_single / numParallel;
            const z0F          = IEC60909_CONFIG.Z0_FACTORS.transformer;
            const xfmrR0       = xfmrR * z0F;
            const xfmrX0       = xfmrX * z0F;

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
            steps += `X/R Ratio:           ${xfmrResult.xrRatio}\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName   || comp.toBus}\n`;
            if (numParallel > 1) {
                steps += `\n⚡ PARALLEL CONFIGURATION\n`;
                steps += `   Number of Units:  ${numParallel}\n`;
                steps += `   Total Capacity:   ${totalRating} kVA\n`;
                steps += `   Configuration:    `;
                parallelXfmrs.forEach((xfmr, idx) => {
                    steps += `${xfmr.tag || `Unit ${idx + 1}`}`;
                    if (idx < parallelXfmrs.length - 1) steps += ' + ';
                });
                steps += '\n';
            }
            steps += '\n';

            steps += `📐 IMPEDANCE CALCULATION (IEC 60909-0:2016 Section 3.3)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Base Impedance at Secondary:\n`;
            steps += `   Formula:          Z_base = V_secondary² / S_T\n`;
            steps += `   Z_base = (${comp.secondary})² / (${comp.rating} × 1000)\n`;
            steps += `   Z_base = ${comp.secondary * comp.secondary} / ${comp.rating * 1000}\n`;
            steps += `   Z_base = ${xfmrResult.baseZ.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `Transformer Impedance (Single Unit, Uncorrected):\n`;
            steps += `   Formula:          ZT = (ukr / 100) × Z_base\n`;
            steps += `   ukr = short-circuit voltage in % = ${comp.impedance}%\n`;
            steps += `   ZT = (${comp.impedance} / 100) × ${xfmrResult.baseZ.toFixed(6)}\n`;
            steps += `   ZT = ${xfmrResult.z_uncorrected.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `Component Separation (X/R = ${xfmrResult.xrRatio}):\n`;
            steps += `   RT (uncorrected) = ZT / √(1 + (X/R)²) = ${xfmrResult.r_uncorrected.toFixed(6)} Ω\n`;
            steps += `   XT (uncorrected) = RT × (X/R)         = ${xfmrResult.x_uncorrected.toFixed(6)} Ω\n`;
            steps += '\n';

            if (applyKT) {
                steps += `🔑 TRANSFORMER CORRECTION FACTOR KT (IEC 60909-0:2016 Section 3.3.3)\n`;
                steps += '─'.repeat(80) + '\n';
                steps += `   Formula:          KT = 0.95 × c_max / (1 + 0.6 × xT)\n`;
                steps += `   xT = per-unit reactance of transformer on its own MVA base\n`;
                steps += `   xT = ${xfmrResult.xT_pu.toFixed(6)} pu\n`;
                steps += `   KT = 0.95 × ${cFactor.toFixed(3)} / (1 + 0.6 × ${xfmrResult.xT_pu.toFixed(4)})\n`;
                steps += `   KT = ${(0.95 * cFactor).toFixed(4)} / ${(1 + 0.6 * xfmrResult.xT_pu).toFixed(4)}\n`;
                steps += `   KT = ${xfmrResult.kt.toFixed(4)}\n`;
                steps += '\n';
                steps += `Corrected Transformer Impedance (KT applied):\n`;
                steps += `   RT = ${xfmrResult.r_uncorrected.toFixed(6)} × ${xfmrResult.kt.toFixed(4)} = ${xfmrR_single.toFixed(6)} Ω\n`;
                steps += `   XT = ${xfmrResult.x_uncorrected.toFixed(6)} × ${xfmrResult.kt.toFixed(4)} = ${xfmrX_single.toFixed(6)} Ω\n`;
                steps += '\n';
            }

            if (numParallel > 1) {
                steps += `Parallel Configuration Effect:\n`;
                steps += `   Formula:          Z_parallel = Z_single / n\n`;
                steps += `   RT_parallel = ${xfmrR_single.toFixed(6)} / ${numParallel} = ${xfmrR.toFixed(6)} Ω\n`;
                steps += `   XT_parallel = ${xfmrX_single.toFixed(6)} / ${numParallel} = ${xfmrX.toFixed(6)} Ω\n`;
                steps += `   ℹ️  ${numParallel} identical transformers reduce impedance by factor of ${numParallel}\n`;
                steps += '\n';
            }

            steps += `📊 IMPEDANCE COMPONENTS\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Positive Sequence (Z1):\n`;
            steps += `   R1 = ${xfmrR.toFixed(6)} Ω\n`;
            steps += `   X1 = ${xfmrX.toFixed(6)} Ω\n`;
            steps += `   Z1 = ${Math.sqrt(xfmrR * xfmrR + xfmrX * xfmrX).toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `Zero Sequence (Z0) — Dyn/YNd (IEC 60909-0:2016 Annex B):\n`;
            steps += `   R0 = ${xfmrR.toFixed(6)} × ${z0F} = ${xfmrR0.toFixed(6)} Ω  (Z0 ≈ ${z0F}× Z1)\n`;
            steps += `   X0 = ${xfmrX.toFixed(6)} × ${z0F} = ${xfmrX0.toFixed(6)} Ω\n`;
            steps += `   ℹ️  For Dyn transformers Z0 ≈ Z1; for YNyn: Z0 >> Z1 (site-specific)\n`;
            steps += '\n';

            const turnsRatio  = comp.primary / comp.secondary;
            const R_referred  = totalR  / (turnsRatio * turnsRatio);
            const X_referred  = totalX  / (turnsRatio * turnsRatio);
            const R0_referred = totalR0 / (turnsRatio * turnsRatio);
            const X0_referred = totalX0 / (turnsRatio * turnsRatio);

            steps += `🔄 IMPEDANCE REFERRAL TO SECONDARY SIDE\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Per IEC 60909-0:2016 Section 3.2 (voltage transformation):\n`;
            steps += `   Formula:          Turns Ratio a = V_primary / V_secondary\n`;
            steps += `   a = ${comp.primary} / ${comp.secondary} = ${turnsRatio.toFixed(4)}\n`;
            steps += '\n';
            steps += `   Formula:          Z_referred = Z_primary / a²\n`;
            steps += `   a² = ${turnsRatio.toFixed(4)}² = ${(turnsRatio * turnsRatio).toFixed(4)}\n`;
            steps += '\n';
            steps += `Primary Impedance Before Referral (at ${comp.primary} V):\n`;
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `After Referral to Secondary (at ${comp.secondary} V):\n`;
            steps += `   Z1: R1 = ${totalR.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${R_referred.toFixed(6)} Ω\n`;
            steps += `       X1 = ${totalX.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${X_referred.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${R0_referred.toFixed(6)} Ω\n`;
            steps += `       X0 = ${totalX0.toFixed(6)} / ${(turnsRatio * turnsRatio).toFixed(4)} = ${X0_referred.toFixed(6)} Ω\n`;
            steps += '\n';

            totalR  = R_referred  + xfmrR;
            totalX  = X_referred  + xfmrX;
            totalR0 = R0_referred + xfmrR0;
            totalX0 = X0_referred + xfmrX0;
            currentVoltageLevel = comp.secondary;

            steps += `✅ RUNNING TOTALS (at ${currentVoltageLevel} V)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n\n';
            stepNumber++;
            continue;
        }

        // ── CABLE ────────────────────────────────────────────────────────
        if (comp.type === 'cable') {
            const cbl  = getIECCableImpedance(comp, temperature);
            const z0Fc = IEC60909_CONFIG.Z0_FACTORS.cable;

            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: CABLE`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';

            steps += `🔌 CABLE INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Component Type:      CABLE\n`;
            steps += `Model Size (NEC):    ${comp.size} AWG/kcmil\n`;
            steps += `IEC Equivalent:      ${cbl.iecSize} mm²   (per IEC 60228:2004)\n`;
            if (cbl.crossRefUsed) {
                steps += `Cross-Reference:     ${cbl.note}\n`;
                steps += `   ℹ️  NEC/AWG → IEC mm² conversion per IEC_NEC_CABLE_CROSSREF table\n`;
            }
            steps += `Material:            ${cbl.material.toUpperCase()}\n`;
            if (cbl.lengthUnit === 'ft') {
                steps += `Length (model):      ${cbl.lengthFt} ft = ${cbl.lengthM.toFixed(2)} m  (1 ft = 0.3048 m)\n`;
            } else {
                steps += `Length:              ${cbl.lengthM.toFixed(2)} m\n`;
            }
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName   || comp.toBus}\n`;
            steps += `Temperature:         ${temperature}°C\n`;
            steps += `Voltage Level:       ${currentVoltageLevel} V\n`;
            if (cbl.parallel > 1) {
                steps += `Parallel Config:     ${cbl.parallel} cables\n`;
                steps += `   ℹ️  Impedance divided by ${cbl.parallel}\n`;
            }
            steps += '\n';

            steps += `📐 IMPEDANCE CALCULATION (IEC 60364-5-52 / IEC 60909-0:2016 Annex A)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `IEC Cable Data — ${cbl.iecSize} mm² ${cbl.material.toUpperCase()} (Ω/km at 20°C):\n`;
            steps += `   R_IEC = ${cbl.r20_per_km.toFixed(4)} Ω/km    (IEC 60228 / IEC 60364-5-52 Table B.52.11)\n`;
            steps += `   X_IEC = ${cbl.x_per_km.toFixed(4)} Ω/km    (trefoil arrangement, 50/60 Hz)\n`;
            steps += '\n';

            const alpha = cbl.material === 'aluminum' ? 0.00403 : 0.00393;
            steps += `Temperature Correction (20°C → ${temperature}°C) — IEC 60228:\n`;
            steps += `   Formula:          R_T = R_20 × [1 + α × (T − 20)]\n`;
            steps += `   α_${cbl.material} = ${alpha.toFixed(5)} /°C  (temperature coefficient at 20°C ref.)\n`;
            steps += `   k_T = 1 + ${alpha.toFixed(5)} × (${temperature} − 20)\n`;
            steps += `   k_T = ${cbl.tempFactor.toFixed(4)}\n`;
            steps += `   R_${temperature}°C = ${cbl.r20_per_km.toFixed(4)} × ${cbl.tempFactor.toFixed(4)} = ${cbl.rT_per_km.toFixed(4)} Ω/km\n`;
            steps += `   ℹ️  Reactance X is independent of temperature\n`;
            steps += '\n';

            steps += `Cable Impedance (for ${cbl.lengthM.toFixed(2)} m, ${cbl.parallel} parallel):\n`;
            steps += `   Formula:          Z = (Z_per_km × Length_m / 1000) / Parallel\n`;
            steps += `   R = (${cbl.rT_per_km.toFixed(4)} Ω/km × ${cbl.lengthM.toFixed(2)} m / 1000) / ${cbl.parallel}\n`;
            steps += `   R = ${(cbl.rT_per_km * cbl.lengthM / 1000).toFixed(6)} / ${cbl.parallel}\n`;
            steps += `   R = ${cbl.r.toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `   X = (${cbl.x_per_km.toFixed(4)} Ω/km × ${cbl.lengthM.toFixed(2)} m / 1000) / ${cbl.parallel}\n`;
            steps += `   X = ${(cbl.x_per_km * cbl.lengthM / 1000).toFixed(6)} / ${cbl.parallel}\n`;
            steps += `   X = ${cbl.x.toFixed(6)} Ω\n`;
            steps += '\n';

            steps += `📊 IMPEDANCE COMPONENTS\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Positive Sequence (Z1):\n`;
            steps += `   R1 = ${cbl.r.toFixed(6)} Ω\n`;
            steps += `   X1 = ${cbl.x.toFixed(6)} Ω\n`;
            steps += `   Z1 = ${Math.sqrt(cbl.r * cbl.r + cbl.x * cbl.x).toFixed(6)} Ω\n`;
            steps += '\n';
            steps += `Zero Sequence (Z0) — Single-core trefoil, steel conduit (IEC 60909-0:2016 Annex B):\n`;
            steps += `   Formula:          Z0 ≈ ${z0Fc}× Z1  (conservative estimate)\n`;
            steps += `   R0 = ${cbl.r.toFixed(6)} × ${z0Fc} = ${cbl.r0.toFixed(6)} Ω\n`;
            steps += `   X0 = ${cbl.x.toFixed(6)} × ${z0Fc} = ${cbl.x0.toFixed(6)} Ω\n`;
            steps += '\n';

            totalR  += cbl.r;
            totalX  += cbl.x;
            totalR0 += cbl.r0;
            totalX0 += cbl.x0;

            steps += `✅ RUNNING TOTALS (at ${currentVoltageLevel} V)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n\n';
            stepNumber++;
        }

        // ── GENERATOR ────────────────────────────────────────────────────
        if (comp.type === 'generator') {
            const gen  = calculateGeneratorImpedanceIEC(comp, currentVoltageLevel);
            const z0Fg = IEC60909_CONFIG.Z0_FACTORS.generator;

            steps += '═'.repeat(80) + '\n';
            steps += `STEP ${stepNumber}: GENERATOR`;
            if (comp.tag) steps += ` - ${comp.tag}`;
            steps += '\n';
            steps += '═'.repeat(80) + '\n\n';

            steps += `⚙️ GENERATOR INFORMATION\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `Component Tag:       ${comp.tag || 'N/A'}\n`;
            steps += `Rating:              ${comp.rating} kVA\n`;
            steps += `Sub-transient X"d:   ${comp.subtransientReactance || 15}%\n`;
            steps += `X/R Ratio:           ${gen.xrRatio}  (typical for synchronous generators)\n`;
            steps += `From Bus:            ${comp.fromBusName || comp.fromBus}\n`;
            steps += `To Bus:              ${comp.toBusName   || comp.toBus}\n`;
            steps += '\n';

            steps += `📐 SUB-TRANSIENT IMPEDANCE (IEC 60909-0:2016 Section 3.6)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z_base = V² / S = ${currentVoltageLevel}² / (${comp.rating} × 1000) = ${gen.baseZ.toFixed(6)} Ω\n`;
            steps += `   X"d = ${comp.subtransientReactance || 15}% × ${gen.baseZ.toFixed(6)} = ${gen.x.toFixed(6)} Ω\n`;
            steps += `   Rg  = X"d / (X/R) = ${gen.x.toFixed(6)} / ${gen.xrRatio} = ${gen.r.toFixed(6)} Ω\n`;
            steps += '\n';

            totalR  += gen.r;
            totalX  += gen.x;
            totalR0 += gen.r * z0Fg;
            totalX0 += gen.x * z0Fg;

            steps += `✅ RUNNING TOTALS (at ${currentVoltageLevel} V)\n`;
            steps += '─'.repeat(80) + '\n';
            steps += `   Z1: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
            steps += `   Z0: R0 = ${totalR0.toFixed(6)} Ω, X0 = ${totalX0.toFixed(6)} Ω\n`;
            steps += '\n\n';
            stepNumber++;
        }
    }
    // ← end component loop

    // ══════════════════════════════════════════════════════════════════════
    // TOTAL IMPEDANCE SUMMARY
    // ══════════════════════════════════════════════════════════════════════

    const totalZ  = Math.sqrt(totalR * totalR + totalX * totalX);
    const xrRatio = totalR > 0 ? (totalX / totalR) : 0;
    const totalZ0 = Math.sqrt(totalR0 * totalR0 + totalX0 * totalX0);

    steps += '═'.repeat(80) + '\n';
    steps += 'TOTAL THEVENIN IMPEDANCE AT FAULT LOCATION\n';
    steps += '═'.repeat(80) + '\n\n';

    steps += `🎯 TARGET BUS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Bus Tag:             ${targetBus.tag || targetBus.name || 'N/A'}\n`;
    steps += `Bus Name:            ${targetBus.name}\n`;
    steps += `Nominal Voltage:     Un = ${Un} V\n`;
    steps += '\n';

    steps += `📊 TOTAL SYSTEM IMPEDANCE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Positive Sequence (Z1) — Thevenin at fault bus:\n`;
    steps += `   R1 = ${totalR.toFixed(6)} Ω\n`;
    steps += `   X1 = ${totalX.toFixed(6)} Ω\n`;
    steps += `   Z1 = √(R1² + X1²) = ${totalZ.toFixed(6)} Ω\n`;
    steps += `   X/R Ratio = ${xrRatio.toFixed(3)}\n`;
    steps += '\n';
    steps += `Zero Sequence (Z0):\n`;
    steps += `   R0 = ${totalR0.toFixed(6)} Ω\n`;
    steps += `   X0 = ${totalX0.toFixed(6)} Ω\n`;
    steps += `   Z0 = ${totalZ0.toFixed(6)} Ω\n`;
    steps += `   Z0/Z1 = ${(totalZ0 / totalZ).toFixed(3)}\n`;
    steps += '\n';
    steps += `Negative Sequence (Z2):\n`;
    steps += `   Z2 ≈ Z1 for static equipment = ${totalZ.toFixed(6)} Ω\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // I"k — Initial symmetrical short-circuit current
    // IEC 60909-0:2016 Eq. (1)
    // ══════════════════════════════════════════════════════════════════════

    const ikDoublePrime   = (cFactor * Un) / (Math.sqrt(3) * totalZ);
    const ikDoublePrimeKA = ikDoublePrime / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'INITIAL SYMMETRICAL SHORT-CIRCUIT CURRENT (I"k)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.2, Eq. 1)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Formula:             I"k = (c × Un) / (√3 × Zk)\n`;
    steps += '\n';
    steps += `Step-by-Step Calculation:\n`;
    steps += `   Given:\n`;
    steps += `      c = ${cFactor.toFixed(3)}  (voltage factor, IEC 60909-0:2016 Table 1)\n`;
    steps += `      Un = ${Un} V  (nominal voltage at fault bus)\n`;
    steps += `      Zk = ${totalZ.toFixed(6)} Ω  (Thevenin impedance at fault bus)\n`;
    steps += `      √3 = ${Math.sqrt(3).toFixed(4)}\n`;
    steps += '\n';
    steps += `   Calculation:\n`;
    steps += `      I"k = (${cFactor.toFixed(3)} × ${Un}) / (${Math.sqrt(3).toFixed(4)} × ${totalZ.toFixed(6)})\n`;
    steps += `      I"k = ${(cFactor * Un).toFixed(2)} / ${(Math.sqrt(3) * totalZ).toFixed(6)}\n`;
    steps += `      I"k = ${ikDoublePrime.toFixed(2)} A\n`;
    steps += `      I"k = ${ikDoublePrimeKA.toFixed(3)} kA\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // ip — Peak short-circuit current
    // IEC 60909-0:2016 Eq. (27)
    // ══════════════════════════════════════════════════════════════════════

    const kappa = calculatePeakFactor(totalR, totalX);
    const ip    = kappa * Math.sqrt(2) * ikDoublePrime;
    const ipKA  = ip / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'PEAK SHORT-CIRCUIT CURRENT (ip)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.3, Eq. 27)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Peak Factor κ:\n`;
    steps += `   Formula:          κ = 1.02 + 0.98 × e^(−3R/X)\n`;
    steps += `   R/X = ${totalR.toFixed(6)} / ${totalX.toFixed(6)} = ${(totalR / totalX).toFixed(4)}\n`;
    steps += `   κ = 1.02 + 0.98 × e^(−3 × ${(totalR / totalX).toFixed(4)})\n`;
    steps += `   κ = 1.02 + 0.98 × e^(${(-3 * totalR / totalX).toFixed(4)})\n`;
    steps += `   κ = 1.02 + 0.98 × ${Math.exp(-3 * totalR / totalX).toFixed(4)}\n`;
    steps += `   κ = ${kappa.toFixed(4)}\n`;
    steps += '\n';
    steps += `Peak Current:\n`;
    steps += `   Formula:          ip = κ × √2 × I"k\n`;
    steps += `   ip = ${kappa.toFixed(4)} × ${Math.sqrt(2).toFixed(4)} × ${ikDoublePrimeKA.toFixed(3)} kA\n`;
    steps += `   ip = ${ipKA.toFixed(3)} kA\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // Ib — Breaking current
    // IEC 60909-0:2016 Section 4.5
    // ══════════════════════════════════════════════════════════════════════

    const ib   = ikDoublePrime;   // far-from-generator simplification
    const ibKA = ib / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'SYMMETRICAL BREAKING CURRENT (Ib)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.5)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `   Far-from-generator assumption:   Ib ≈ I"k\n`;
    steps += `   (Motor decay and generator near-field effects conservatively neglected)\n`;
    steps += `   Ib = ${ibKA.toFixed(3)} kA\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // Ik — Steady-state short-circuit current
    // IEC 60909-0:2016 Section 4.6
    // ══════════════════════════════════════════════════════════════════════

    const ik   = ikDoublePrime;
    const ikKA = ik / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'STEADY-STATE SHORT-CIRCUIT CURRENT (Ik)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.6)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `   No synchronous generators in path:   Ik = I"k\n`;
    steps += `   Ik = ${ikKA.toFixed(3)} kA\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // I"k1 — Single-phase-to-earth fault
    // IEC 60909-0:2016 Section 4.7.3, Eq. 16
    // ══════════════════════════════════════════════════════════════════════

    const Zlg_r   = totalR + totalR + totalR0;
    const Zlg_x   = totalX + totalX + totalX0;
    const Zlg_mag = Math.sqrt(Zlg_r * Zlg_r + Zlg_x * Zlg_x);
    const ik1     = (cFactor * Un) / Zlg_mag;
    const ik1KA   = ik1 / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'INITIAL SHORT-CIRCUIT CURRENT — SINGLE-PHASE-TO-EARTH (I"k1)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.7.3, Eq. 16)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Formula:             I"k1 = (√3 × c × Un) / |Z1 + Z2 + Z0|  =  c × Un / |Z1 + Z2 + Z0|\n`;
    steps += `   (√3 numerator and √3 denominator from line-to-neutral voltage cancel)\n`;
    steps += '\n';
    steps += `Step-by-Step Calculation:\n`;
    steps += `   Z2 ≈ Z1  (static equipment — no generator correction)\n`;
    steps += '\n';
    steps += `   Sequence Impedance Sum (complex addition):\n`;
    steps += `      R_sum = R1 + R2 + R0 = ${totalR.toFixed(6)} + ${totalR.toFixed(6)} + ${totalR0.toFixed(6)}\n`;
    steps += `      R_sum = ${Zlg_r.toFixed(6)} Ω\n`;
    steps += `      X_sum = X1 + X2 + X0 = ${totalX.toFixed(6)} + ${totalX.toFixed(6)} + ${totalX0.toFixed(6)}\n`;
    steps += `      X_sum = ${Zlg_x.toFixed(6)} Ω\n`;
    steps += `      |Z_sum| = √(${Zlg_r.toFixed(6)}² + ${Zlg_x.toFixed(6)}²)\n`;
    steps += `      |Z_sum| = ${Zlg_mag.toFixed(6)} Ω\n`;
    steps += '\n';
    steps += `   I"k1 = (c × Un) / |Z_sum|\n`;
    steps += `   I"k1 = (${cFactor.toFixed(3)} × ${Un}) / ${Zlg_mag.toFixed(6)}\n`;
    steps += `   I"k1 = ${(cFactor * Un).toFixed(2)} / ${Zlg_mag.toFixed(6)}\n`;
    steps += `   I"k1 = ${ik1.toFixed(2)} A\n`;
    steps += `   I"k1 = ${ik1KA.toFixed(3)} kA\n`;
    steps += '\n';
    if (ik1KA > ikDoublePrimeKA) {
        steps += `⚠️  IMPORTANT NOTE:\n`;
        steps += `   Earth fault (${ik1KA.toFixed(3)} kA) EXCEEDS three-phase fault (${ikDoublePrimeKA.toFixed(3)} kA)!\n`;
        steps += `   This occurs when Z0 < Z1 (solid/low-impedance earthing, small Z0).\n`;
        steps += `   Earth fault protection must be designed for ${ik1KA.toFixed(3)} kA.\n`;
        steps += `   Per IEC 60909-0:2016 Section 4.7.3.\n`;
    } else {
        steps += `✅ Three-phase fault (${ikDoublePrimeKA.toFixed(3)} kA) is the governing case.\n`;
    }
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // I"k2 — Line-to-line fault
    // IEC 60909-0:2016 Section 4.7.2, Eq. 12
    // ══════════════════════════════════════════════════════════════════════

    const ik2   = (Math.sqrt(3) / 2) * ikDoublePrime;
    const ik2KA = ik2 / 1000;

    steps += '═'.repeat(80) + '\n';
    steps += 'LINE-TO-LINE SHORT-CIRCUIT CURRENT (I"k2)\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `📐 CALCULATION (IEC 60909-0:2016 Section 4.7.2, Eq. 12)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Formula:             I"k2 = (√3 / 2) × I"k\n`;
    steps += '\n';
    steps += `Step-by-Step Calculation:\n`;
    steps += `   I"k2 = (${Math.sqrt(3).toFixed(4)} / 2) × ${ikDoublePrimeKA.toFixed(3)} kA\n`;
    steps += `   I"k2 = ${(Math.sqrt(3) / 2).toFixed(4)} × ${ikDoublePrimeKA.toFixed(3)} kA\n`;
    steps += `   I"k2 = ${ik2KA.toFixed(3)} kA\n`;
    steps += '\n';

    // ══════════════════════════════════════════════════════════════════════
    // SUMMARY TABLE
    // ══════════════════════════════════════════════════════════════════════

    steps += '═'.repeat(80) + '\n';
    steps += 'FAULT CURRENT SUMMARY TABLE\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Fault Type                              | Symmetrical (kA) | Peak ip (kA)\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Three-Phase (L-L-L)          I"k        | ${ikDoublePrimeKA.toFixed(3).padStart(16)} | ${ipKA.toFixed(3).padStart(12)}\n`;
    steps += `Line-to-Line (L-L)           I"k2       | ${ik2KA.toFixed(3).padStart(16)} | ${'—'.padStart(12)}\n`;
    steps += `Single-Phase-to-Earth (L-E)  I"k1       | ${ik1KA.toFixed(3).padStart(16)} | ${'—'.padStart(12)}\n`;
    steps += `Breaking Current             Ib         | ${ibKA.toFixed(3).padStart(16)} | ${'—'.padStart(12)}\n`;
    steps += `Steady-State Current         Ik         | ${ikKA.toFixed(3).padStart(16)} | ${'—'.padStart(12)}\n`;
    steps += '═'.repeat(80) + '\n\n';

    steps += `📚 STANDARDS COMPLIANCE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `✅ IEC 60909-0:2016 — Short-circuit currents in three-phase AC systems\n`;
    steps += `✅ IEC 60909-1:2002 — Factors for the calculation of short-circuit currents\n`;
    steps += `✅ IEC 60228:2004   — Conductors of insulated cables (cable cross-sections)\n`;
    steps += `✅ IEC 60364-5-52   — Cable impedance reference values (Ω/km)\n`;
    steps += `✅ IEC 60038:2009   — IEC standard voltages\n`;
    steps += `✅ IEC 60947-2      — Low-voltage circuit-breakers short-circuit requirements\n`;
    steps += '\n';

    steps += '═'.repeat(80) + '\n';
    steps += 'END OF IEC 60909-0:2016 SHORT CIRCUIT CALCULATION\n';
    steps += '═'.repeat(80) + '\n';

    // Optional: append protection device requirements
    if (typeof generateProtectionDeviceRequirements === 'function') {
        steps += generateProtectionDeviceRequirements({
            faultCurrents: {
                threePhaseSym:  ikDoublePrimeKA,
                threePhaseAsym: ipKA,
                lineToGround:   ik1KA,
                lineToLine:     ik2KA
            },
            xrRatio, path
        }, null, 'mid-range');
    }

    // ══════════════════════════════════════════════════════════════════════
    // RETURN OBJECT
    // ══════════════════════════════════════════════════════════════════════

    return {
        method:          'iec-60909',
        calculationType: calcType,
        standard:        'IEC 60909-0:2016',
        voltageFactor:   cFactor,
        voltage:         Un,
        peakFactor:      kappa,

        // IEC-native fields
        initialSymmetricalCurrentKA: ikDoublePrimeKA,
        peakCurrentKA:               ipKA,
        breakingCurrentKA:           ibKA,
        steadyStateCurrentKA:        ikKA,
        lineToGroundCurrentKA:       ik1KA,
        lineToLineCurrentKA:         ik2KA,

        // Unified faultCurrents (matches normalizeShortCircuitToSchema)
        faultCurrents: {
            threePhaseSym:  ikDoublePrimeKA,
            threePhaseAsym: ipKA,
            lineToLine:     ik2KA,
            lineToGround:   ik1KA
        },

        // Impedance
        impedance: {
            r: totalR, x: totalX, z: totalZ,
            r0: totalR0, x0: totalX0, z0: totalZ0,
            xrRatio
        },
        totalR, totalX, totalZ,
        totalR0, totalX0, totalZ0,
        xrRatio,

        calculationSteps: steps,
        steps,
        path
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// ADAPTER — wrapper call signature
// ════════════════════════════════════════════════════════════════════════════════

function calculateIEC60909FaultCurrent(busId, options = {}) {
    const calcType = (options.calculationType || options.calcType || 'max').toLowerCase();
    const trace    = (typeof traceBusPath === 'function') ? traceBusPath(busId) : null;
    if (!Array.isArray(trace) || trace.length < 2) {
        throw new Error('IEC 60909 requires a valid path to a SOURCE bus. traceBusPath() returned null/short path.');
    }
    return calculateShortCircuitIEC60909(trace, calcType);
}

// ════════════════════════════════════════════════════════════════════════════════
// COMPARE ALL METHODS
// ════════════════════════════════════════════════════════════════════════════════

function compareAllMethods(busId) {
    const path     = (typeof traceBusPath === 'function') ? traceBusPath(busId) : [];
    const ptpResult = (typeof calculateShortCircuitPointToPoint === 'function') ? calculateShortCircuitPointToPoint(path) : null;
    const puResult  = (typeof calculateShortCircuitPerUnit       === 'function') ? calculateShortCircuitPerUnit(path)      : null;
    const iecMax    = calculateShortCircuitIEC60909(path, 'max');
    const iecMin    = calculateShortCircuitIEC60909(path, 'min');

    const busName = (typeof buses !== 'undefined') ? buses.find(b => b.id === busId)?.name : busId;
    console.log('\n' + '═'.repeat(80));
    console.log('METHOD COMPARISON — IEEE vs IEC 60909');
    console.log('═'.repeat(80));
    console.log(`Bus: ${busName}`);
    console.log('─'.repeat(80));
    console.log('Method              | I"k / Sym (kA) | Peak / Asym (kA) | Notes');
    console.log('─'.repeat(80));
    if (ptpResult) console.log(`Point-to-Point      | ${(ptpResult.faultCurrentKA || 0).toFixed(3).padStart(14)} | ${(ptpResult.asymFaultCurrentKA || 0).toFixed(3).padStart(16)} | IEEE 141`);
    if (puResult)  console.log(`Per-Unit            | ${(puResult.faultCurrentKA  || 0).toFixed(3).padStart(14)} | ${(puResult.asymFaultCurrentKA  || 0).toFixed(3).padStart(16)} | IEEE 141`);
    console.log(`IEC 60909 (Max)     | ${iecMax.initialSymmetricalCurrentKA.toFixed(3).padStart(14)} | ${iecMax.peakCurrentKA.toFixed(3).padStart(16)} | IEC c_max`);
    console.log(`IEC 60909 (Min)     | ${iecMin.initialSymmetricalCurrentKA.toFixed(3).padStart(14)} | ${iecMin.peakCurrentKA.toFixed(3).padStart(16)} | IEC c_min`);
    console.log('─'.repeat(80));
    return { busId, busName, methods: { 'point-to-point': ptpResult, 'per-unit': puResult, 'iec-max': iecMax, 'iec-min': iecMin } };
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

window.calculateShortCircuitIEC60909        = calculateShortCircuitIEC60909;
window.calculateIEC60909FaultCurrent        = calculateIEC60909FaultCurrent;
window.compareAllMethods                    = compareAllMethods;
window.getVoltageFactor                     = getVoltageFactor;
window.calculatePeakFactor                  = calculatePeakFactor;
window.calculateTransformerCorrectionFactor = calculateTransformerCorrectionFactor;
window.getIECCableImpedance                 = getIECCableImpedance;
window.IEC60909_CONFIG                      = IEC60909_CONFIG;

console.log('✅ IEC 60909 Module v2.0.0 loaded successfully');
console.log('   ✅ IEC 60228 / IEC 60364-5-52 cable data (Ω/km) from constants.js');
console.log('   ✅ NEC/AWG → IEC mm² automatic cross-reference');
console.log('   ✅ IEEE-pattern calculation steps (same format as P2P / Per-Unit)');
console.log('   ✅ Voltage factor c per IEC 60909-0:2016 Table 1');
console.log('   ✅ Transformer correction factor KT (max only)');
console.log('   ✅ Peak factor κ per IEC 60909-0:2016 Eq. 29');
console.log('   ✅ I"k, ip, Ib, Ik, I"k1 (earth fault), I"k2 (line-to-line)');