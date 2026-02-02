/**
 * Grounding System Analysis Module
 * 
 * Ground fault and electrode sizing per NEC requirements
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard NEC 2023 - Article 250 (Grounding and Bonding)
 * @standard IEEE 80 - Guide for Safety in AC Substation Grounding
 */

console.log('🔧 Loading Grounding System Analysis Module v1.0.0...');

// Equipment Grounding Conductor sizing per NEC Table 250.122
const EGC_TABLE_250_122 = [
    { breakerMax: 15, copper: '14 AWG', aluminum: '12 AWG' },
    { breakerMax: 20, copper: '12 AWG', aluminum: '10 AWG' },
    { breakerMax: 30, copper: '10 AWG', aluminum: '8 AWG' },
    { breakerMax: 40, copper: '10 AWG', aluminum: '8 AWG' },
    { breakerMax: 60, copper: '10 AWG', aluminum: '8 AWG' },
    { breakerMax: 100, copper: '8 AWG', aluminum: '6 AWG' },
    { breakerMax: 200, copper: '6 AWG', aluminum: '4 AWG' },
    { breakerMax: 300, copper: '4 AWG', aluminum: '2 AWG' },
    { breakerMax: 400, copper: '3 AWG', aluminum: '1 AWG' },
    { breakerMax: 500, copper: '2 AWG', aluminum: '1/0 AWG' },
    { breakerMax: 600, copper: '1 AWG', aluminum: '2/0 AWG' },
    { breakerMax: 800, copper: '1/0 AWG', aluminum: '3/0 AWG' },
    { breakerMax: 1000, copper: '2/0 AWG', aluminum: '4/0 AWG' },
    { breakerMax: 1200, copper: '3/0 AWG', aluminum: '250 kcmil' },
    { breakerMax: 1600, copper: '4/0 AWG', aluminum: '350 kcmil' },
    { breakerMax: 2000, copper: '250 kcmil', aluminum: '400 kcmil' },
    { breakerMax: 2500, copper: '350 kcmil', aluminum: '600 kcmil' },
    { breakerMax: 3000, copper: '400 kcmil', aluminum: '750 kcmil' },
    { breakerMax: 4000, copper: '500 kcmil', aluminum: '1000 kcmil' },
    { breakerMax: 5000, copper: '700 kcmil', aluminum: '1200 kcmil' },
    { breakerMax: 6000, copper: '800 kcmil', aluminum: '1200 kcmil' }
];

/**
 * Determine Equipment Grounding Conductor (EGC) size
 * 
 * @param {Number} breakerRating - Overcurrent device rating in amperes
 * @returns {Object} EGC sizing per NEC 250.122
 */
function determineEGCSize(breakerRating) {
    console.log('\n' + '═'.repeat(80));
    console.log('EQUIPMENT GROUNDING CONDUCTOR (EGC) SIZING');
    console.log('═'.repeat(80));
    
    console.log(`Overcurrent Protective Device: ${breakerRating} A`);
    
    let egc = EGC_TABLE_250_122[EGC_TABLE_250_122.length - 1];
    
    for (const entry of EGC_TABLE_250_122) {
        if (breakerRating <= entry.breakerMax) {
            egc = entry;
            break;
        }
    }
    
    console.log(`\nPer NEC Table 250.122:`);
    console.log(`  Copper EGC: ${egc.copper}`);
    console.log(`  Aluminum EGC: ${egc.aluminum}`);
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        breakerRating: breakerRating,
        copper: egc.copper,
        aluminum: egc.aluminum,
        standard: 'NEC 250.122'
    };
}

/**
 * Analyze ground electrode resistance
 * 
 * @param {Object} electrode - Electrode specifications
 * @returns {Object} Ground electrode analysis
 */
function analyzeGroundElectrode(electrode) {
    console.log('\n' + '═'.repeat(80));
    console.log('GROUND ELECTRODE RESISTANCE ANALYSIS');
    console.log('═'.repeat(80));
    
    const measuredResistance = electrode.measuredResistance || 0;
    const necMaximum = 25; // Ohms per NEC 250.53(A)(2)
    const recommendedMax = 5; // Ohms for sensitive equipment
    
    const meetsNEC = measuredResistance <= necMaximum;
    const meetsRecommended = measuredResistance <= recommendedMax;
    
    console.log(`Electrode Type: ${electrode.type || 'Ground rod'}`);
    console.log(`Measured Resistance: ${measuredResistance} Ω`);
    console.log(`\nNEC Requirement (250.53):`);
    console.log(`  Maximum Allowed: ${necMaximum} Ω`);
    console.log(`  Status: ${meetsNEC ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}`);
    console.log(`\nRecommended for Sensitive Equipment:`);
    console.log(`  Target: ≤ ${recommendedMax} Ω`);
    console.log(`  Status: ${meetsRecommended ? '✓ MEETS' : '⚠️ EXCEEDS'}`);
    
    if (!meetsNEC) {
        console.log(`\n⚠️  CRITICAL: Ground resistance exceeds NEC maximum!`);
        console.log(`   Required Actions:`);
        console.log(`   - Install additional ground rods (NEC 250.53(A)(3))`);
        console.log(`   - Space rods at least 6 feet apart`);
        console.log(`   - Consider chemical ground enhancement`);
        console.log(`   - Use ground ring if space available`);
    } else if (!meetsRecommended) {
        console.log(`\n⚠️  Note: Complies with NEC but exceeds recommended limit`);
        console.log(`   For improved performance consider:`);
        console.log(`   - Additional ground rods`);
        console.log(`   - Ground enhancement materials`);
        console.log(`   - Increased grounding electrode conductor size`);
    }
    
    // Calculate number of rods needed (simplified formula)
    if (!meetsNEC || !meetsRecommended) {
        const targetResistance = meetsNEC ? recommendedMax : necMaximum;
        const estimatedRodsNeeded = Math.ceil(measuredResistance / targetResistance);
        console.log(`\nEstimated additional rods needed: ${estimatedRodsNeeded - 1}`);
        console.log(`(Actual number may vary based on soil conditions)`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        electrode: electrode,
        measuredResistance: measuredResistance,
        necMaximum: necMaximum,
        recommendedMaximum: recommendedMax,
        meetsNEC: meetsNEC,
        meetsRecommended: meetsRecommended,
        standard: 'NEC 250.53 / IEEE 80'
    };
}

/**
 * Calculate ground fault current
 * 
 * @param {Number} voltage - System voltage (line-to-ground)
 * @param {Number} zeroSequenceImpedance - Zero-sequence impedance in ohms
 * @param {Number} groundResistance - Ground electrode resistance in ohms
 * @returns {Object} Ground fault analysis
 */
function calculateGroundFaultCurrent(voltage, zeroSequenceImpedance, groundResistance = 5) {
    console.log('\n' + '═'.repeat(80));
    console.log('GROUND FAULT CURRENT CALCULATION');
    console.log('═'.repeat(80));
    
    // Single line-to-ground fault
    // Ig = 3 × V_LN / (Z1 + Z2 + Z0 + 3Rg)
    // Simplified: Ig ≈ V_LN / (Z0 + Rg)
    
    const vLN = voltage / Math.sqrt(3);
    const totalZ = zeroSequenceImpedance + groundResistance;
    const groundFaultCurrent = vLN / totalZ;
    const groundFaultCurrentKA = groundFaultCurrent / 1000;
    
    console.log(`System Voltage: ${voltage}V (${vLN.toFixed(1)}V L-N)`);
    console.log(`Zero-Sequence Impedance: ${zeroSequenceImpedance.toFixed(4)} Ω`);
    console.log(`Ground Resistance: ${groundResistance} Ω`);
    console.log(`\nGround Fault Current:`);
    console.log(`  Ig = V_LN / (Z0 + Rg)`);
    console.log(`  Ig = ${vLN.toFixed(1)}V / (${zeroSequenceImpedance.toFixed(4)} + ${groundResistance})Ω`);
    console.log(`  Ig = ${groundFaultCurrent.toFixed(1)} A (${groundFaultCurrentKA.toFixed(3)} kA)`);
    
    // Calculate touch and step voltages (simplified)
    const touchVoltage = groundFaultCurrent * groundResistance * 0.5; // Simplified
    const stepVoltage = groundFaultCurrent * groundResistance * 0.3; // Simplified
    
    console.log(`\nVoltages During Fault:`);
    console.log(`  Touch Voltage: ${touchVoltage.toFixed(1)} V`);
    console.log(`  Step Voltage: ${stepVoltage.toFixed(1)} V`);
    
    // Safety check (IEEE 80 tolerable limits ~50V for 0.5s)
    const safe = touchVoltage < 50 && stepVoltage < 50;
    console.log(`\nSafety Status: ${safe ? '✓ SAFE' : '⚠️ MAY EXCEED SAFE LIMITS'}`);
    
    if (!safe) {
        console.log(`\n⚠️  WARNING: Touch/step voltages may be hazardous!`);
        console.log(`   Recommendations:`);
        console.log(`   - Reduce ground resistance`);
        console.log(`   - Install ground grid`);
        console.log(`   - Use crushed rock surface layer`);
        console.log(`   - Install ground fault protection`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        voltage: voltage,
        zeroSequenceImpedance: zeroSequenceImpedance,
        groundResistance: groundResistance,
        groundFaultCurrent: groundFaultCurrent,
        groundFaultCurrentKA: groundFaultCurrentKA,
        touchVoltage: touchVoltage,
        stepVoltage: stepVoltage,
        safe: safe,
        standard: 'IEEE 80 / NEC 250'
    };
}

/**
 * Complete grounding system analysis
 * 
 * @param {Object} system - System parameters
 * @returns {Object} Complete grounding analysis
 */
function analyzeGroundingSystem(system) {
    console.log('\n' + '═'.repeat(80));
    console.log('COMPLETE GROUNDING SYSTEM ANALYSIS');
    console.log('═'.repeat(80) + '\n');
    
    const egc = determineEGCSize(system.breakerRating || 100);
    const electrode = analyzeGroundElectrode(system.electrode || { measuredResistance: 10, type: 'Ground rod' });
    const fault = calculateGroundFaultCurrent(
        system.voltage || 480,
        system.zeroSequenceImpedance || 0.1,
        electrode.measuredResistance
    );
    
    console.log('GROUNDING SYSTEM SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`EGC Size (Copper): ${egc.copper}`);
    console.log(`Ground Resistance: ${electrode.measuredResistance} Ω ${electrode.meetsNEC ? '✓' : '✗'}`);
    console.log(`Ground Fault Current: ${fault.groundFaultCurrentKA.toFixed(3)} kA`);
    console.log(`Safety Status: ${fault.safe ? '✓ SAFE' : '⚠️ REVIEW REQUIRED'}`);
    console.log('─'.repeat(80) + '\n');
    
    return {
        egc: egc,
        electrode: electrode,
        fault: fault,
        standard: 'NEC Article 250 / IEEE 80'
    };
}

// Export to global scope
window.determineEGCSize = determineEGCSize;
window.analyzeGroundElectrode = analyzeGroundElectrode;
window.calculateGroundFaultCurrent = calculateGroundFaultCurrent;
window.analyzeGroundingSystem = analyzeGroundingSystem;

console.log('✅ Grounding System Analysis Module loaded successfully');
