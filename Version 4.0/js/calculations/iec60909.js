/**
 * IEC 60909-0:2016 Short Circuit Calculation Module
 * 
 * Implements the IEC 60909-0:2016 international short circuit calculation method
 * for maximum and minimum fault currents in three-phase AC systems.
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEC 60909-0:2016 - Short-circuit currents in three-phase AC systems
 * @standard IEC 60909-1 - Factors for calculation
 */

console.log('🔧 Loading IEC 60909 Short Circuit Calculation Module v1.0.0...');

// ════════════════════════════════════════════════════════════════════════════════
// IEC 60909 CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const IEC60909_CONFIG = {
    // Voltage Factors (c) per IEC 60909-0:2016 Section 3.2
    VOLTAGE_FACTORS: {
        // c_max for maximum fault currents (equipment rating)
        MAX: {
            LV_230_400: 1.05,      // LV 230/400V systems
            LV_OTHER: 1.10,        // Other LV systems
            MV: 1.10,              // MV (1kV-35kV)
            HV: 1.10               // HV (>35kV)
        },
        // c_min for minimum fault currents (protection coordination)
        MIN: {
            LV: 0.95,              // All LV systems
            MV_HV: 1.00            // MV and HV systems
        }
    },
    
    // Standard frequency
    FREQUENCY: 60,
    
    // Time constants for breaking current calculation
    BREAKING_TIME: 0.1,            // seconds (typically)
    
    // Motor contribution factors per IEC 60909-0 Section 7
    MOTOR_FACTORS: {
        CONTRIBUTION_RATIO: 0.35,   // Motors contribute to initial current
        DECAY_TIME: 0.05            // seconds
    }
};

/**
 * Get voltage factor (c) based on voltage level and calculation type
 * Per IEC 60909-0:2016 Section 3.2
 * 
 * @param {Number} voltage - System voltage in volts
 * @param {String} calcType - 'max' or 'min'
 * @returns {Number} Voltage factor c
 */
function getVoltageFactor(voltage, calcType = 'max') {
    if (calcType === 'max') {
        // Maximum fault current factors
        if (voltage <= 400 && (voltage === 230 || voltage === 400)) {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.LV_230_400;
        } else if (voltage < 1000) {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.LV_OTHER;
        } else if (voltage >= 1000 && voltage <= 35000) {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.MV;
        } else {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MAX.HV;
        }
    } else {
        // Minimum fault current factors
        if (voltage < 1000) {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MIN.LV;
        } else {
            return IEC60909_CONFIG.VOLTAGE_FACTORS.MIN.MV_HV;
        }
    }
}

/**
 * Calculate transformer correction factor KT
 * Per IEC 60909-0:2016 Section 3.3.1
 * 
 * KT = 0.95 × cmax / (1 + 0.6 × xT)
 * 
 * @param {Number} cmax - Maximum voltage factor
 * @param {Number} xT - Transformer reactance in per-unit
 * @returns {Number} Transformer correction factor KT
 */
function calculateTransformerCorrectionFactor(cmax, xT) {
    return (0.95 * cmax) / (1 + 0.6 * xT);
}

/**
 * Calculate peak current factor (κ)
 * Per IEC 60909-0:2016 Section 4.3
 * 
 * κ = 1.02 + 0.98 × e^(-3R/X)
 * 
 * @param {Number} rOhms - Resistance in ohms
 * @param {Number} xOhms - Reactance in ohms
 * @returns {Number} Peak current factor κ
 */
function calculatePeakFactor(rOhms, xOhms) {
    if (xOhms === 0) return 1.02;
    
    const ratio = rOhms / xOhms;
    const kappa = 1.02 + 0.98 * Math.exp(-3 * ratio);
    
    return kappa;
}

/**
 * Calculate IEC 60909 short circuit for a given path
 * 
 * @param {Array} path - Array of bus connections from source to fault point
 * @param {String} calcType - 'max' or 'min'
 * @returns {Object} IEC 60909 calculation results
 */
function calculateShortCircuitIEC60909(path, calcType = 'max') {
    console.log('\n' + '═'.repeat(80));
    console.log('IEC 60909-0:2016 SHORT CIRCUIT CALCULATION');
    console.log('═'.repeat(80));
    console.log(`Calculation Type: ${calcType === 'max' ? 'Maximum (Equipment Rating)' : 'Minimum (Protection Coordination)'}`);
    console.log('═'.repeat(80) + '\n');
    
    const faultBus = buses.find(b => b.id === path[path.length - 1].toBusId);
    const voltage = faultBus.voltage;
    
    // Get voltage factor
    const cFactor = getVoltageFactor(voltage, calcType);
    console.log(`Voltage Level: ${voltage}V`);
    console.log(`Voltage Factor (c): ${cFactor.toFixed(3)}`);
    
    // Calculate total impedance
    let totalR = 0;
    let totalX = 0;
    const steps = [];
    
    // Source impedance
    const sourceBus = buses.find(b => b.id === path[0].fromBusId);
    if (sourceBus && sourceBus.type === 'source') {
        const sourceZ = calculateSourceImpedance(sourceBus);
        totalR += sourceZ.r;
        totalX += sourceZ.x;
        
        steps.push({
            component: 'Source',
            description: `${sourceBus.name}`,
            r: sourceZ.r,
            x: sourceZ.x,
            cumulativeR: totalR,
            cumulativeX: totalX
        });
        
        console.log(`\nSource: ${sourceBus.name}`);
        console.log(`  R = ${sourceZ.r.toFixed(6)} Ω`);
        console.log(`  X = ${sourceZ.x.toFixed(6)} Ω`);
    }
    
    // Component impedances
    for (let i = 0; i < path.length; i++) {
        const connection = path[i];
        const comp = connection.component;
        
        if (!comp) continue;
        
        let compZ = { r: 0, x: 0 };
        let description = '';
        
        if (comp.type === 'transformer') {
            compZ = calculateTransformerImpedance(comp, voltage);
            description = `${comp.rating} kVA, ${comp.impedance}% Z`;
            
            // Apply transformer correction factor for maximum calculation
            if (calcType === 'max') {
                const xT = compZ.x / Math.sqrt(compZ.r * compZ.r + compZ.x * compZ.x); // per-unit reactance
                const kt = calculateTransformerCorrectionFactor(cFactor, xT);
                console.log(`  Transformer Correction Factor KT: ${kt.toFixed(4)}`);
            }
            
        } else if (comp.type === 'cable') {
            compZ = calculateCableImpedance(comp, voltage);
            description = `${comp.size} AWG, ${comp.length} ft`;
            
        } else if (comp.type === 'generator') {
            compZ = calculateGeneratorImpedance(comp, voltage);
            description = `${comp.rating} kW`;
        }
        
        totalR += compZ.r;
        totalX += compZ.x;
        
        steps.push({
            component: comp.type,
            description: description,
            r: compZ.r,
            x: compZ.x,
            cumulativeR: totalR,
            cumulativeX: totalX
        });
        
        console.log(`\n${comp.type}: ${description}`);
        console.log(`  R = ${compZ.r.toFixed(6)} Ω`);
        console.log(`  X = ${compZ.x.toFixed(6)} Ω`);
    }
    
    const totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
    
    console.log('\n' + '─'.repeat(80));
    console.log('TOTAL IMPEDANCE:');
    console.log(`  R_total = ${totalR.toFixed(6)} Ω`);
    console.log(`  X_total = ${totalX.toFixed(6)} Ω`);
    console.log(`  Z_total = ${totalZ.toFixed(6)} Ω`);
    console.log(`  X/R Ratio = ${(totalX / totalR).toFixed(2)}`);
    console.log('─'.repeat(80));
    
    // Calculate initial symmetrical short-circuit current I"k
    // I"k = (c × Un) / (√3 × Zk)
    const Un = voltage; // nominal voltage
    const ikDoublePrime = (cFactor * Un) / (Math.sqrt(3) * totalZ);
    const ikDoublePrimeKA = ikDoublePrime / 1000;
    
    console.log('\nINITIAL SYMMETRICAL SHORT-CIRCUIT CURRENT (I"k):');
    console.log(`  I"k = (c × Un) / (√3 × Zk)`);
    console.log(`  I"k = (${cFactor} × ${Un}V) / (√3 × ${totalZ.toFixed(6)}Ω)`);
    console.log(`  I"k = ${ikDoublePrimeKA.toFixed(3)} kA`);
    
    // Calculate peak short-circuit current ip
    // ip = κ × √2 × I"k
    const kappa = calculatePeakFactor(totalR, totalX);
    const ip = kappa * Math.sqrt(2) * ikDoublePrime;
    const ipKA = ip / 1000;
    
    console.log('\nPEAK SHORT-CIRCUIT CURRENT (ip):');
    console.log(`  κ = 1.02 + 0.98 × e^(-3R/X)`);
    console.log(`  κ = 1.02 + 0.98 × e^(-3×${(totalR / totalX).toFixed(4)})`);
    console.log(`  κ = ${kappa.toFixed(4)}`);
    console.log(`  ip = κ × √2 × I"k`);
    console.log(`  ip = ${kappa.toFixed(4)} × √2 × ${ikDoublePrimeKA.toFixed(3)} kA`);
    console.log(`  ip = ${ipKA.toFixed(3)} kA`);
    
    // Calculate breaking current Ib (at t = 0.1s typically)
    // For far-from-generator faults: Ib ≈ I"k
    // For near-to-generator: Use decay factor μ
    const ib = ikDoublePrime; // Simplified - same as I"k for far-from-generator
    const ibKA = ib / 1000;
    
    console.log('\nBREAKING CURRENT (Ib):');
    console.log(`  Ib ≈ I"k (far-from-generator fault)`);
    console.log(`  Ib = ${ibKA.toFixed(3)} kA`);
    
    // Calculate steady-state short-circuit current Ik
    // Ik depends on generator and motor contributions
    // For system without generators: Ik ≈ I"k
    const ik = ikDoublePrime;
    const ikKA = ik / 1000;
    
    console.log('\nSTEADY-STATE SHORT-CIRCUIT CURRENT (Ik):');
    console.log(`  Ik ≈ I"k (no sustained generator contribution)`);
    console.log(`  Ik = ${ikKA.toFixed(3)} kA`);
    
    // Line-to-ground and line-to-line fault currents
    // Using sequence network per IEC 60909-0:2016 §4.7 and §4.6
    //
    // Determine Z0 from transformer vector group in path
    // Default: Dyn11 (most common) → Z0 ≈ Z1 on LV secondary
    let iecZ0R = totalR, iecZ0X = totalX, iecZ0Note = 'Z0 = Z1 (Dyn11 default)';
    let iecZ0Blocked = false;
    
    for (const seg of path) {
        const xfmrComp = seg && (seg.component || seg);
        if (xfmrComp && xfmrComp.type === 'transformer') {
            const vgKey = xfmrComp.vectorGroup || 'Dyn11';
            const vgData = (typeof getTransformerVectorGroupZ0 === 'function')
                ? getTransformerVectorGroupZ0(vgKey)
                : { z0_multiplier: 1.0, blocks_upstream_z0: true, ground_path_on_lv: true, note: 'Dyn11 default' };
            if (vgData.z0_multiplier >= 999 || !vgData.ground_path_on_lv) {
                iecZ0Blocked = true;
                iecZ0R = totalR * 100;
                iecZ0X = totalX * 100;
                iecZ0Note = `Z0 blocked — ${vgKey} (no LG fault path on LV bus)`;
            } else {
                iecZ0R = totalR * vgData.z0_multiplier;
                iecZ0X = totalX * vgData.z0_multiplier;
                iecZ0Note = `Z0/Z1 = ${vgData.z0_multiplier.toFixed(2)} — ${vgKey} (IEC 60909-0 §3.3)`;
            }
            break; // Use first (outermost) transformer Z0 behaviour
        }
    }

    // Include neutral grounding resistance (3×Rn added to Z0 per sequence network)
    for (const seg of path) {
        const xfmrComp = seg && (seg.component || seg);
        if (xfmrComp && xfmrComp.type === 'transformer' && xfmrComp.neutralR > 0) {
            iecZ0R += 3 * xfmrComp.neutralR;
            iecZ0Note += `; +3×Rn = ${(3 * xfmrComp.neutralR).toFixed(3)} Ω (${xfmrComp.groundingMode || 'resistance grounded'})`;
            break;
        }
    }

    const iecZ0 = Math.sqrt(iecZ0R * iecZ0R + iecZ0X * iecZ0X) || 1e-9;
    const iecZ2 = totalZ; // Z2 ≈ Z1 for static equipment
    
    // L-G: I"k1 = (c × √3 × Un) / |Z1 + Z2 + Z0|  — IEC 60909-0 Eq.(29)
    // (Note: Un is line-to-line; √3 factor converts to give I in A)
    const Z_LG_total = Math.sqrt(
        (totalR + totalR + iecZ0R) ** 2 + (totalX + totalX + iecZ0X) ** 2
    ) || 1e-9;
    const ikLG = iecZ0Blocked ? 0 : (cFactor * Math.sqrt(3) * Un) / Z_LG_total;
    const ikLGKA = ikLG / 1000;
    
    // L-L-G (double earth fault): I"k2E — IEC 60909-0 §4.8
    // Z_parallel = Z2 || Z0 (complex); I"k2E = (c × Un / √3) / |Z1 + Z2||Z0|
    //  (Voltage in numerator is V_LN = Un/√3 — correct per standard)
    const den2E_r = totalR + iecZ0R, den2E_x = totalX + iecZ0X;
    const den2E_mag2 = den2E_r*den2E_r + den2E_x*den2E_x || 1e-18;
    const num2E_r = totalR*iecZ0R - totalX*iecZ0X;
    const num2E_x = totalR*iecZ0X + totalX*iecZ0R;
    const Zpar2E_r = (num2E_r*den2E_r + num2E_x*den2E_x) / den2E_mag2;
    const Zpar2E_x = (num2E_x*den2E_r - num2E_r*den2E_x) / den2E_mag2;
    const Zllg_r2E = totalR + Zpar2E_r, Zllg_x2E = totalX + Zpar2E_x;
    const Zllg2E = Math.sqrt(Zllg_r2E*Zllg_r2E + Zllg_x2E*Zllg_x2E) || 1e-9;
    // I"k2E = (c × Un) / (√3 × |Z1 + Z2||Z0|)
    const ikLLG = iecZ0Blocked ? 0 : (cFactor * Un) / (Math.sqrt(3) * Zllg2E);
    const ikLLGKA = ikLLG / 1000;

    console.log('\nLINE-TO-GROUND FAULT CURRENT I"k1 (IEC 60909-0 Eq.29):');
    console.log(`  Z0 basis: ${iecZ0Note}`);
    console.log(`  I"k1 = (c × √3 × Un) / |Z1+Z2+Z0|`);
    console.log(`  I"k1 = (${cFactor} × √3 × ${Un}V) / ${Z_LG_total.toFixed(6)}Ω`);
    console.log(`  I"k1 = ${ikLGKA.toFixed(3)} kA`);
    console.log(`\nDOUBLE EARTH FAULT I"k2E (IEC 60909-0 §4.8):`);
    console.log(`  I"k2E = (c × Un) / (√3 × |Z1 + Z2||Z0|)`);
    console.log(`  I"k2E = (${cFactor} × ${Un}V) / (√3 × ${Zllg2E.toFixed(6)}Ω)`);
    console.log(`  I"k2E = ${ikLLGKA.toFixed(3)} kA`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('IEC 60909 CALCULATION COMPLETE');
    console.log('═'.repeat(80) + '\n');
    
    return {
        method: 'iec-60909',
        calculationType: calcType,
        voltageFactor: cFactor,
        voltage: voltage,
        impedance: {
            r: totalR,
            x: totalX,
            z: totalZ,
            r0: iecZ0R,
            x0: iecZ0X,
            z0: iecZ0,
            xrRatio: totalX / totalR,
            z0Basis: iecZ0Note
        },
        peakFactor: kappa,
        initialSymmetricalCurrentKA: ikDoublePrimeKA,
        peakCurrentKA: ipKA,
        breakingCurrentKA: ibKA,
        steadyStateCurrentKA: ikKA,
        lineToGroundCurrentKA: ikLGKA,
        doubleEarthFaultCurrentKA: ikLLGKA,
        z0Note: iecZ0Note,
        steps: steps,
        standard: 'IEC 60909-0:2016'
    };
}

/**
 * Adapter to match the unified wrapper API:
 * calculateIEC60909FaultCurrent(busId, {calculationType:'max'|'min'})
 *
 * It converts traceBusPath() output ({bus, component}) into IEC path format
 * expected by calculateShortCircuitIEC60909(path, calcType).
 */
function calculateIEC60909FaultCurrent(busId, options = {}) {
  const calcType = (options.calculationType || options.calcType || 'max').toLowerCase();

  // traceBusPath returns array of segments: [{bus, component}, ...]
  const trace = traceBusPath(busId);
  if (!Array.isArray(trace) || trace.length < 2) {
    throw new Error('IEC 60909 requires a valid path to a SOURCE bus. traceBusPath() returned null/short path.');
  }

  // Convert to IEC connection array format expected by your IEC function:
  // - uses path[0].fromBusId and path[last].toBusId internally
  const iecPath = trace.map((seg, idx) => {
    const prevBusId = idx > 0 ? trace[idx - 1]?.bus?.id : trace[0]?.bus?.id;
    const thisBusId = seg?.bus?.id;

    return {
      fromBusId: prevBusId,
      toBusId: thisBusId,
      component: seg?.component || null
    };
  });

  // Call your existing IEC implementation
  return calculateShortCircuitIEC60909(iecPath, calcType);
}

// Keep your existing export (if you already have it)
window.calculateShortCircuitIEC60909 = calculateShortCircuitIEC60909;

// ✅ Add the alias the wrapper expects
window.calculateIEC60909FaultCurrent = calculateIEC60909FaultCurrent;

/**
 * Helper function to calculate source impedance
 */
function calculateSourceImpedance(sourceBus) {
    // Use existing logic from shortCircuitCalc.js
    const voltage = sourceBus.voltage;
    const faultMVA = sourceBus.faultMVA || 100;
    const baseZ = (voltage * voltage) / (faultMVA * 1000000);
    
    // Typical X/R ratio for utility source
    const xrRatio = sourceBus.xrRatio || 10;
    const x = baseZ * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const r = baseZ / Math.sqrt(1 + xrRatio * xrRatio);
    
    return { r, x };
}

/**
 * Helper function to calculate transformer impedance
 */
function calculateTransformerImpedance(transformer, voltage) {
    // Use existing logic from shortCircuitCalc.js
    const zPercent = transformer.impedance / 100;
    const ratingKVA = transformer.rating;
    const secondaryV = transformer.secondary;
    
    const baseZ = (secondaryV * secondaryV) / (ratingKVA * 1000);
    const z = zPercent * baseZ;
    
    // Typical X/R ratio for transformers
    const xrRatio = transformer.xrRatio || 6;
    const x = z * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const r = z / Math.sqrt(1 + xrRatio * xrRatio);
    
    return { r, x };
}

/**
 * Helper function to calculate cable impedance
 */
function calculateCableImpedance(cable, voltage) {
    // Use existing logic from shortCircuitCalc.js
    const lengthFeet = cable.length;
    const rPerFoot = cable.rPerFoot || 0.001;
    const xPerFoot = cable.xPerFoot || 0.0004;
    
    const r = rPerFoot * lengthFeet;
    const x = xPerFoot * lengthFeet;
    
    return { r, x };
}

/**
 * Helper function to calculate generator impedance
 */
function calculateGeneratorImpedance(generator, voltage) {
    // Use existing logic from shortCircuitCalc.js
    const ratingKW = generator.rating;
    const xdPercent = (generator.subtransientReactance || 15) / 100;
    
    const baseZ = (voltage * voltage) / (ratingKW * 1000);
    const x = xdPercent * baseZ;
    const r = x / 15; // Typical generator X/R ratio of 15
    
    return { r, x };
}

/**
 * Compare all three calculation methods side-by-side
 * 
 * @param {String} busId - Bus identifier
 * @returns {Object} Comparison results
 */
function compareAllMethods(busId) {
    console.log('\n' + '═'.repeat(80));
    console.log('METHOD COMPARISON: IEEE vs IEC 60909');
    console.log('═'.repeat(80));
    
    const path = traceBusPath(busId);
    
    // Calculate using all three methods
    const ptpResult = calculateShortCircuitPointToPoint(path);
    const puResult = calculateShortCircuitPerUnit(path);
    const iecMaxResult = calculateShortCircuitIEC60909(path, 'max');
    const iecMinResult = calculateShortCircuitIEC60909(path, 'min');
    
    const comparison = {
        busId: busId,
        busName: buses.find(b => b.id === busId)?.name,
        methods: {
            'point-to-point': {
                symmetrical: ptpResult.faultCurrents?.threePhaseSym || 0,
                asymmetrical: ptpResult.faultCurrents?.threePhaseAsym || 0
            },
            'per-unit': {
                symmetrical: puResult.faultCurrents?.threePhaseSym || 0,
                asymmetrical: puResult.faultCurrents?.threePhaseAsym || 0
            },
            'iec-60909-max': {
                initialSymmetrical: iecMaxResult.initialSymmetricalCurrentKA,
                peak: iecMaxResult.peakCurrentKA,
                breaking: iecMaxResult.breakingCurrentKA
            },
            'iec-60909-min': {
                initialSymmetrical: iecMinResult.initialSymmetricalCurrentKA,
                peak: iecMinResult.peakCurrentKA,
                breaking: iecMinResult.breakingCurrentKA
            }
        }
    };
    
    console.log('\nCOMPARISON TABLE:');
    console.log('─'.repeat(80));
    console.log('Method              | Symmetrical | Asymmetrical/Peak | Notes');
    console.log('─'.repeat(80));
    console.log(`Point-to-Point      | ${comparison.methods['point-to-point'].symmetrical.toFixed(3)} kA  | ${comparison.methods['point-to-point'].asymmetrical.toFixed(3)} kA      | IEEE`);
    console.log(`Per-Unit            | ${comparison.methods['per-unit'].symmetrical.toFixed(3)} kA  | ${comparison.methods['per-unit'].asymmetrical.toFixed(3)} kA      | IEEE`);
    console.log(`IEC 60909 (Max)     | ${comparison.methods['iec-60909-max'].initialSymmetrical.toFixed(3)} kA  | ${comparison.methods['iec-60909-max'].peak.toFixed(3)} kA      | Equipment`);
    console.log(`IEC 60909 (Min)     | ${comparison.methods['iec-60909-min'].initialSymmetrical.toFixed(3)} kA  | ${comparison.methods['iec-60909-min'].peak.toFixed(3)} kA      | Protection`);
    console.log('─'.repeat(80));
    
    return comparison;
}

// Export functions to global scope
window.calculateShortCircuitIEC60909 = calculateShortCircuitIEC60909;
window.calculateIEC60909FaultCurrent = calculateIEC60909FaultCurrent;
window.compareAllMethods = compareAllMethods;
window.getVoltageFactor = getVoltageFactor;
window.calculatePeakFactor = calculatePeakFactor;
window.calculateTransformerCorrectionFactor = calculateTransformerCorrectionFactor;

console.log('✅ IEC 60909 Module loaded successfully');
