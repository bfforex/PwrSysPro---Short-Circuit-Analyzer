/**
 * Complete Fault Type Calculations Module
 * 
 * Implements all fault types with proper sequence network analysis:
 * - Three-Phase Fault (L-L-L)
 * - Line-to-Line Fault (L-L)
 * - Single Line-to-Ground Fault (L-G)
 * - Double Line-to-Ground Fault (L-L-G)
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE 141-1993 (Red Book) - Chapter 5
 * @standard IEC 60909-0:2016 - Section 4
 */

console.log('🔧 Loading Complete Fault Type Calculations Module v1.0.0...');

// ════════════════════════════════════════════════════════════════════════════════
// SEQUENCE NETWORK CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const FAULT_TYPE_CONFIG = {
    // Zero-sequence impedance factors (Z0/Z1 ratio)
    ZERO_SEQUENCE_FACTORS: {
        UTILITY: 1.5,          // Typical for utility source
        CABLE_UNDERGROUND: 3.0, // Underground cables
        CABLE_OVERHEAD: 2.5,   // Overhead lines
        TRANSFORMER_WYE: 1.0,  // Wye-connected with neutral
        TRANSFORMER_DELTA: 999, // Delta blocks zero-sequence (very high)
        GENERATOR: 0.1         // Generators typically low Z0
    },
    
    // For balanced systems: Z2 ≈ Z1 (negative sequence ≈ positive sequence)
    NEGATIVE_SEQUENCE_FACTOR: 1.0,
    
    // Typical fault current ratios (for validation)
    TYPICAL_RATIOS: {
        LL_TO_3PH: 0.866,     // √3/2
        LG_MIN: 0.5,          // Minimum L-G to 3-phase ratio
        LG_MAX: 2.0           // Maximum L-G to 3-phase ratio (solidly grounded)
    }
};

/**
 * Calculate zero-sequence impedance for a component
 * 
 * @param {Object} component - Component object
 * @param {Object} z1 - Positive sequence impedance {r, x}
 * @returns {Object} Zero-sequence impedance {r, x}
 */
function calculateZeroSequenceImpedance(component, z1) {
    let z0Factor = 1.0;
    
    switch (component.type) {
        case 'utility':
        case 'source':
            z0Factor = FAULT_TYPE_CONFIG.ZERO_SEQUENCE_FACTORS.UTILITY;
            break;
            
        case 'cable':
            z0Factor = FAULT_TYPE_CONFIG.ZERO_SEQUENCE_FACTORS.CABLE_UNDERGROUND;
            break;
            
        case 'transformer':
            // Check winding configuration
            if (component.connection === 'delta' || component.connection === 'Delta') {
                z0Factor = FAULT_TYPE_CONFIG.ZERO_SEQUENCE_FACTORS.TRANSFORMER_DELTA;
            } else {
                z0Factor = FAULT_TYPE_CONFIG.ZERO_SEQUENCE_FACTORS.TRANSFORMER_WYE;
            }
            break;
            
        case 'generator':
            z0Factor = FAULT_TYPE_CONFIG.ZERO_SEQUENCE_FACTORS.GENERATOR;
            break;
            
        default:
            z0Factor = 1.5; // Default assumption
    }
    
    return {
        r: z1.r * z0Factor,
        x: z1.x * z0Factor
    };
}

/**
 * Calculate sequence impedances for entire path
 * 
 * @param {Array} path - Path from source to fault point
 * @returns {Object} Sequence impedances {z1, z2, z0}
 */
function calculateSequenceImpedances(path) {
    let z1 = { r: 0, x: 0 };
    let z0 = { r: 0, x: 0 };
    
    // Source impedance
    const sourceBus = buses.find(b => b.id === path[0].fromBusId);
    if (sourceBus && sourceBus.type === 'source') {
        const sourceZ = calculateSourceImpedanceForSequence(sourceBus);
        z1.r += sourceZ.r;
        z1.x += sourceZ.x;
        
        const sourceZ0 = calculateZeroSequenceImpedance({ type: 'source' }, sourceZ);
        z0.r += sourceZ0.r;
        z0.x += sourceZ0.x;
    }
    
    // Component impedances
    for (let conn of path) {
        const comp = conn.component;
        if (!comp) continue;
        
        let compZ1 = { r: 0, x: 0 };
        
        if (comp.type === 'transformer') {
            compZ1 = calculateTransformerImpedanceForSequence(comp);
        } else if (comp.type === 'cable') {
            compZ1 = calculateCableImpedanceForSequence(comp);
        } else if (comp.type === 'generator') {
            compZ1 = calculateGeneratorImpedanceForSequence(comp);
        }
        
        z1.r += compZ1.r;
        z1.x += compZ1.x;
        
        const compZ0 = calculateZeroSequenceImpedance(comp, compZ1);
        z0.r += compZ0.r;
        z0.x += compZ0.x;
    }
    
    // Z2 ≈ Z1 for static equipment
    const z2 = { ...z1 };
    
    return {
        z1: {
            r: z1.r,
            x: z1.x,
            magnitude: Math.sqrt(z1.r * z1.r + z1.x * z1.x)
        },
        z2: {
            r: z2.r,
            x: z2.x,
            magnitude: Math.sqrt(z2.r * z2.r + z2.x * z2.x)
        },
        z0: {
            r: z0.r,
            x: z0.x,
            magnitude: Math.sqrt(z0.r * z0.r + z0.x * z0.x)
        }
    };
}

/**
 * Calculate all fault types for a bus
 * 
 * @param {String} busId - Bus identifier
 * @returns {Object} All fault type results
 */
function calculateAllFaultTypes(busId) {
    console.log('\n' + '═'.repeat(80));
    console.log('COMPLETE FAULT TYPE ANALYSIS');
    console.log('═'.repeat(80));
    
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    const path = traceBusPath(busId);
    const voltage = bus.voltage;
    const vLN = voltage / Math.sqrt(3); // Line-to-neutral voltage
    
    console.log(`Bus: ${bus.name}`);
    console.log(`Voltage: ${voltage}V (${vLN.toFixed(1)}V L-N)`);
    
    // Calculate sequence impedances
    const seqZ = calculateSequenceImpedances(path);
    
    console.log('\nSEQUENCE IMPEDANCES:');
    console.log(`  Z1 = ${seqZ.z1.r.toFixed(6)} + j${seqZ.z1.x.toFixed(6)} Ω  (|Z1| = ${seqZ.z1.magnitude.toFixed(6)} Ω)`);
    console.log(`  Z2 = ${seqZ.z2.r.toFixed(6)} + j${seqZ.z2.x.toFixed(6)} Ω  (|Z2| = ${seqZ.z2.magnitude.toFixed(6)} Ω)`);
    console.log(`  Z0 = ${seqZ.z0.r.toFixed(6)} + j${seqZ.z0.x.toFixed(6)} Ω  (|Z0| = ${seqZ.z0.magnitude.toFixed(6)} Ω)`);
    
    // 1. Three-Phase Fault (L-L-L)
    console.log('\n' + '─'.repeat(80));
    console.log('1. THREE-PHASE FAULT (L-L-L)');
    console.log('─'.repeat(80));
    
    const i3ph = voltage / (Math.sqrt(3) * seqZ.z1.magnitude);
    const i3phKA = i3ph / 1000;
    
    console.log(`Formula: I_3φ = V / (√3 × Z1)`);
    console.log(`I_3φ = ${voltage}V / (√3 × ${seqZ.z1.magnitude.toFixed(6)}Ω)`);
    console.log(`I_3φ = ${i3phKA.toFixed(3)} kA`);
    
    // 2. Line-to-Line Fault (L-L)
    console.log('\n' + '─'.repeat(80));
    console.log('2. LINE-TO-LINE FAULT (L-L)');
    console.log('─'.repeat(80));
    
    const zLL = seqZ.z1.magnitude + seqZ.z2.magnitude;
    const iLL = voltage / zLL;
    const iLLKA = iLL / 1000;
    const llRatio = iLL / i3ph;
    
    console.log(`Formula: I_LL = V / (Z1 + Z2)`);
    console.log(`I_LL = ${voltage}V / (${seqZ.z1.magnitude.toFixed(6)} + ${seqZ.z2.magnitude.toFixed(6)})Ω`);
    console.log(`I_LL = ${iLLKA.toFixed(3)} kA`);
    console.log(`Ratio: I_LL / I_3φ = ${llRatio.toFixed(3)} (typical: 0.866)`);
    
    // 3. Single Line-to-Ground Fault (L-G)
    console.log('\n' + '─'.repeat(80));
    console.log('3. SINGLE LINE-TO-GROUND FAULT (L-G)');
    console.log('─'.repeat(80));
    
    const zLG = seqZ.z1.magnitude + seqZ.z2.magnitude + seqZ.z0.magnitude;
    const iLG = 3 * vLN / zLG;
    const iLGKA = iLG / 1000;
    const lgRatio = iLG / i3ph;
    
    console.log(`Formula: I_LG = 3 × V_LN / (Z1 + Z2 + Z0)`);
    console.log(`I_LG = 3 × ${vLN.toFixed(1)}V / (${seqZ.z1.magnitude.toFixed(6)} + ${seqZ.z2.magnitude.toFixed(6)} + ${seqZ.z0.magnitude.toFixed(6)})Ω`);
    console.log(`I_LG = ${iLGKA.toFixed(3)} kA`);
    console.log(`Ratio: I_LG / I_3φ = ${lgRatio.toFixed(3)}`);
    
    if (lgRatio > 1.0) {
        console.log(`⚠️  WARNING: L-G fault (${iLGKA.toFixed(3)} kA) exceeds 3-phase fault (${i3phKA.toFixed(3)} kA)!`);
        console.log(`    This is typical for solidly grounded systems with low Z0.`);
    }
    
    // 4. Double Line-to-Ground Fault (L-L-G)
    console.log('\n' + '─'.repeat(80));
    console.log('4. DOUBLE LINE-TO-GROUND FAULT (L-L-G)');
    console.log('─'.repeat(80));
    
    // Z_parallel = (Z2 × Z0) / (Z2 + Z0)
    const z2z0Product = seqZ.z2.magnitude * seqZ.z0.magnitude;
    const z2z0Sum = seqZ.z2.magnitude + seqZ.z0.magnitude;
    const zParallel = z2z0Product / z2z0Sum;
    
    const iLLG = Math.sqrt(3) * voltage / (seqZ.z1.magnitude + zParallel);
    const iLLGKA = iLLG / 1000;
    const llgRatio = iLLG / i3ph;
    
    console.log(`Formula: Z_parallel = (Z2 × Z0) / (Z2 + Z0)`);
    console.log(`Z_parallel = (${seqZ.z2.magnitude.toFixed(6)} × ${seqZ.z0.magnitude.toFixed(6)}) / (${seqZ.z2.magnitude.toFixed(6)} + ${seqZ.z0.magnitude.toFixed(6)})`);
    console.log(`Z_parallel = ${zParallel.toFixed(6)} Ω`);
    console.log(`Formula: I_LLG = √3 × V / (Z1 + Z_parallel)`);
    console.log(`I_LLG = √3 × ${voltage}V / (${seqZ.z1.magnitude.toFixed(6)} + ${zParallel.toFixed(6)})Ω`);
    console.log(`I_LLG = ${iLLGKA.toFixed(3)} kA`);
    console.log(`Ratio: I_LLG / I_3φ = ${llgRatio.toFixed(3)}`);
    
    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('FAULT TYPE SUMMARY');
    console.log('═'.repeat(80));
    console.log('Fault Type    | Current (kA) | Ratio to 3φ | Notes');
    console.log('─'.repeat(80));
    console.log(`3-Phase (L-L-L) | ${i3phKA.toFixed(3)}      | 1.000       | Base case`);
    console.log(`Line-Line (L-L) | ${iLLKA.toFixed(3)}      | ${llRatio.toFixed(3)}       | ${Math.abs(llRatio - 0.866) < 0.05 ? '✓' : ''} Typical`);
    console.log(`L-Ground (L-G)  | ${iLGKA.toFixed(3)}      | ${lgRatio.toFixed(3)}       | ${lgRatio > 1.0 ? '⚠️ Exceeds 3φ' : ''}`);
    console.log(`2L-Ground (L-L-G)| ${iLLGKA.toFixed(3)}     | ${llgRatio.toFixed(3)}       |`);
    console.log('─'.repeat(80));
    console.log(`Maximum Fault:  | ${Math.max(i3phKA, iLLKA, iLGKA, iLLGKA).toFixed(3)} kA`);
    console.log('═'.repeat(80) + '\n');
    
    return {
        busId: busId,
        busName: bus.name,
        voltage: voltage,
        sequenceImpedances: seqZ,
        faults: {
            threePhaseLLL: {
                currentKA: i3phKA,
                ratio: 1.0,
                description: 'Balanced three-phase fault',
                formula: 'I_3φ = V / (√3 × Z1)'
            },
            lineToLineLL: {
                currentKA: iLLKA,
                ratio: llRatio,
                description: 'Line-to-line fault',
                formula: 'I_LL = V / (Z1 + Z2)',
                typical: Math.abs(llRatio - 0.866) < 0.05
            },
            lineToGroundLG: {
                currentKA: iLGKA,
                ratio: lgRatio,
                description: 'Single line-to-ground fault',
                formula: 'I_LG = 3 × V_LN / (Z1 + Z2 + Z0)',
                exceedsThreePhase: lgRatio > 1.0
            },
            doubleLineToGroundLLG: {
                currentKA: iLLGKA,
                ratio: llgRatio,
                description: 'Double line-to-ground fault',
                formula: 'I_LLG = √3 × V / (Z1 + Z_parallel)'
            }
        },
        maximumFaultCurrentKA: Math.max(i3phKA, iLLKA, iLGKA, iLLGKA)
    };
}

/**
 * Helper functions for sequence impedance calculations
 */
function calculateSourceImpedanceForSequence(sourceBus) {
    const voltage = sourceBus.voltage;
    const faultMVA = sourceBus.faultMVA || 100;
    const baseZ = (voltage * voltage) / (faultMVA * 1000000);
    const xrRatio = sourceBus.xrRatio || 10;
    const x = baseZ * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const r = baseZ / Math.sqrt(1 + xrRatio * xrRatio);
    return { r, x };
}

function calculateTransformerImpedanceForSequence(transformer) {
    const zPercent = transformer.impedance / 100;
    const ratingKVA = transformer.rating;
    const secondaryV = transformer.secondary;
    const baseZ = (secondaryV * secondaryV) / (ratingKVA * 1000);
    const z = zPercent * baseZ;
    const xrRatio = transformer.xrRatio || 6;
    const x = z * xrRatio / Math.sqrt(1 + xrRatio * xrRatio);
    const r = z / Math.sqrt(1 + xrRatio * xrRatio);
    return { r, x };
}

function calculateCableImpedanceForSequence(cable) {
    const lengthFeet = cable.length;
    const rPerFoot = cable.rPerFoot || 0.001;
    const xPerFoot = cable.xPerFoot || 0.0004;
    const r = rPerFoot * lengthFeet;
    const x = xPerFoot * lengthFeet;
    return { r, x };
}

function calculateGeneratorImpedanceForSequence(generator) {
    const ratingKW = generator.rating;
    const voltage = generator.voltage || 480;
    const xdPercent = (generator.subtransientReactance || 15) / 100;
    const baseZ = (voltage * voltage) / (ratingKW * 1000);
    const x = xdPercent * baseZ;
    const r = x / 15;
    return { r, x };
}

// Export to global scope
window.FaultTypeCalculations = {
    calculateAllFaultTypes: calculateAllFaultTypes,
    calculateSequenceImpedances: calculateSequenceImpedances,
    calculateZeroSequenceImpedance: calculateZeroSequenceImpedance
};

console.log('✅ Complete Fault Type Calculations Module loaded successfully');
