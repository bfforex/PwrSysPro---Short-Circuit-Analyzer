/**
 * Conductor Sizing Verification Module
 * 
 * Multi-criteria conductor sizing check:
 * 1. Ampacity (125% for continuous loads)
 * 2. Voltage drop (3% feeders, 5% branch circuits)
 * 3. Short circuit withstand
 * 4. Equipment grounding conductor per NEC 250.122
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard NEC 2023 - Articles 210, 215, 250, 310
 */

console.log('🔧 Loading Conductor Sizing Verification Module v1.0.0...');

/**
 * Verify conductor sizing against all criteria
 * 
 * @param {Object} conductor - Conductor specifications
 * @param {Object} load - Load requirements
 * @param {Object} system - System parameters
 * @returns {Object} Verification results
 */
function verifyConductorSizing(conductor, load, system) {
    console.log('\n' + '═'.repeat(80));
    console.log('CONDUCTOR SIZING VERIFICATION');
    console.log('═'.repeat(80));
    
    const results = {
        conductor: conductor,
        checks: {},
        overallPass: true
    };
    
    // 1. AMPACITY CHECK
    console.log('\n1. AMPACITY CHECK (NEC 310.15)');
    console.log('─'.repeat(80));
    
    const requiredAmpacity = load.continuous ? load.current * 1.25 : load.current;
    const ampacityPass = conductor.ampacity >= requiredAmpacity;
    
    console.log(`Load Current: ${load.current} A ${load.continuous ? '(continuous)' : '(non-continuous)'}`);
    console.log(`Required Ampacity: ${requiredAmpacity.toFixed(2)} A ${load.continuous ? '(125% of continuous)' : ''}`);
    console.log(`Conductor Ampacity: ${conductor.ampacity} A`);
    console.log(`Result: ${ampacityPass ? '✓ PASS' : '✗ FAIL'}`);
    
    results.checks.ampacity = {
        requiredAmpacity: requiredAmpacity,
        conductorAmpacity: conductor.ampacity,
        pass: ampacityPass
    };
    
    if (!ampacityPass) results.overallPass = false;
    
    // 2. VOLTAGE DROP CHECK
    console.log('\n2. VOLTAGE DROP CHECK (NEC 210.19, 215.2)');
    console.log('─'.repeat(80));
    
    const maxVdPercent = load.circuitType === 'branch' ? 5.0 : 3.0;
    const vd = calculateVoltageDropForConductor(conductor, load, system);
    const vdPass = vd.percent <= maxVdPercent;
    
    console.log(`Circuit Type: ${load.circuitType || 'feeder'}`);
    console.log(`Length: ${conductor.lengthFeet} feet`);
    console.log(`Voltage Drop: ${vd.volts.toFixed(2)} V (${vd.percent.toFixed(2)}%)`);
    console.log(`Maximum Allowed: ${maxVdPercent}%`);
    console.log(`Result: ${vdPass ? '✓ PASS' : '✗ FAIL'}`);
    
    results.checks.voltageDrop = {
        calculatedPercent: vd.percent,
        maxAllowedPercent: maxVdPercent,
        pass: vdPass
    };
    
    if (!vdPass) results.overallPass = false;
    
    // 3. SHORT CIRCUIT WITHSTAND
    console.log('\n3. SHORT CIRCUIT WITHSTAND CHECK (IEEE 242)');
    console.log('─'.repeat(80));
    
    if (system.faultCurrentKA && system.clearingTimeSec) {
        const withstandResult = verifyConductorWithstand(
            system.faultCurrentKA,
            system.clearingTimeSec,
            conductor.areaMM2,
            conductor.type || 'copper-XLPE'
        );
        
        results.checks.withstand = withstandResult;
        
        if (!withstandResult.acceptable) results.overallPass = false;
    } else {
        console.log('⚠️  Skipped - fault current data not provided');
        results.checks.withstand = { skipped: true };
    }
    
    // 4. EQUIPMENT GROUNDING CONDUCTOR
    console.log('\n4. EQUIPMENT GROUNDING CONDUCTOR (NEC 250.122)');
    console.log('─'.repeat(80));
    
    const egc = determineEGCSize(load.breakerSize || requiredAmpacity);
    console.log(`Overcurrent Device: ${load.breakerSize || requiredAmpacity.toFixed(0)} A`);
    console.log(`Minimum EGC (Copper): ${egc.copper}`);
    console.log(`Minimum EGC (Aluminum): ${egc.aluminum}`);
    
    results.checks.egc = egc;
    
    // SUMMARY
    console.log('\n' + '═'.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Overall Result: ${results.overallPass ? '✓ PASS - Conductor adequately sized' : '✗ FAIL - Conductor inadequate'}`);
    console.log('═'.repeat(80) + '\n');
    
    return results;
}

/**
 * Calculate voltage drop for a conductor
 */
function calculateVoltageDropForConductor(conductor, load, system) {
    const voltage = system.voltage || 480;
    const lengthFeet = conductor.lengthFeet || 100;
    const current = load.current;
    const rPerFoot = conductor.rPerFoot || 0.001;
    
    // For 3-phase: VD = √3 × I × R × L
    const vd = Math.sqrt(3) * current * rPerFoot * lengthFeet;
    const vdPercent = (vd / voltage) * 100;
    
    return {
        volts: vd,
        percent: vdPercent
    };
}

/**
 * Determine equipment grounding conductor size per NEC 250.122
 */
function determineEGCSize(breakerAmps) {
    // NEC Table 250.122
    if (breakerAmps <= 15) return { copper: '14 AWG', aluminum: '12 AWG' };
    if (breakerAmps <= 20) return { copper: '12 AWG', aluminum: '10 AWG' };
    if (breakerAmps <= 60) return { copper: '10 AWG', aluminum: '8 AWG' };
    if (breakerAmps <= 100) return { copper: '8 AWG', aluminum: '6 AWG' };
    if (breakerAmps <= 200) return { copper: '6 AWG', aluminum: '4 AWG' };
    if (breakerAmps <= 300) return { copper: '4 AWG', aluminum: '2 AWG' };
    if (breakerAmps <= 400) return { copper: '3 AWG', aluminum: '1 AWG' };
    if (breakerAmps <= 500) return { copper: '2 AWG', aluminum: '1/0 AWG' };
    if (breakerAmps <= 600) return { copper: '1 AWG', aluminum: '2/0 AWG' };
    if (breakerAmps <= 800) return { copper: '1/0 AWG', aluminum: '3/0 AWG' };
    if (breakerAmps <= 1000) return { copper: '2/0 AWG', aluminum: '4/0 AWG' };
    if (breakerAmps <= 1200) return { copper: '3/0 AWG', aluminum: '250 kcmil' };
    return { copper: '4/0 AWG', aluminum: '350 kcmil' };
}

// Export to global scope
window.verifyConductorSizing = verifyConductorSizing;
window.determineEGCSize = determineEGCSize;

console.log('✅ Conductor Sizing Verification Module loaded successfully');
