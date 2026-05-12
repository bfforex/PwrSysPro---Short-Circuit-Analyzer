/**
 * Harmonic Analysis Module
 * 
 * Basic harmonic analysis estimating THD for systems with non-linear loads
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE 519-2022 - Harmonic Control in Electric Power Systems
 */

console.log('🔧 Loading Harmonic Analysis Module v1.0.0...');

// Typical harmonic sources and their THDi values
const HARMONIC_SOURCES = {
    'vfd-6pulse': { THDi: 80, description: 'Variable Frequency Drive (6-pulse)' },
    'vfd-12pulse': { THDi: 40, description: 'Variable Frequency Drive (12-pulse)' },
    'ups': { THDi: 30, description: 'Uninterruptible Power Supply' },
    'led-lighting': { THDi: 20, description: 'LED Lighting' },
    'computers': { THDi: 100, description: 'Computer/IT Equipment' },
    'welders': { THDi: 65, description: 'Arc Welders' },
    'battery-chargers': { THDi: 50, description: 'Battery Chargers' }
};

// IEEE 519-2022 THDv limits
const IEEE519_LIMITS = {
    'LV': { voltage: '<1kV', THDv: 8.0 },
    'MV': { voltage: '1kV-69kV', THDv: 5.0 },
    'HV-subtransmission': { voltage: '69kV-161kV', THDv: 2.5 },
    'HV-transmission': { voltage: '>161kV', THDv: 1.5 }
};

/**
 * Estimate system harmonics from load composition
 * 
 * @param {Array} loads - Array of load objects {type, kW, current}
 * @param {Number} systemVoltage - System voltage in volts
 * @param {Number} scRatio - Short circuit ratio (Isc/IL)
 * @returns {Object} Harmonic analysis results
 */
function estimateHarmonics(loads, systemVoltage = 480, scRatio = 10) {
    console.log('\n' + '═'.repeat(80));
    console.log('HARMONIC ANALYSIS');
    console.log('═'.repeat(80));
    
    let totalCurrent = 0;
    let weightedTHDi = 0;
    const loadBreakdown = [];
    
    console.log('\nLOAD COMPOSITION:');
    console.log('─'.repeat(80));
    
    for (const load of loads) {
        const source = HARMONIC_SOURCES[load.type] || { THDi: 5, description: 'Linear load' };
        const current = load.current || 0;
        
        totalCurrent += current;
        weightedTHDi += source.THDi * current;
        
        loadBreakdown.push({
            type: load.type,
            description: source.description,
            current: current,
            THDi: source.THDi
        });
        
        console.log(`${source.description.padEnd(30)} | ${current.toFixed(1)} A | THDi: ${source.THDi}%`);
    }
    
    // Calculate composite THDi
    const compositeTHDi = totalCurrent > 0 ? weightedTHDi / totalCurrent : 0;
    
    console.log('─'.repeat(80));
    console.log(`Total Load Current: ${totalCurrent.toFixed(1)} A`);
    console.log(`Composite THDi: ${compositeTHDi.toFixed(1)}%`);
    
    // Estimate THDv using simplified relationship
    // THDv ≈ THDi / SC_ratio
    const estimatedTHDv = compositeTHDi / scRatio;
    
    console.log(`\nShort Circuit Ratio: ${scRatio}`);
    console.log(`Estimated THDv: ${estimatedTHDv.toFixed(2)}%`);
    
    // Determine IEEE 519 limit
    let limit = IEEE519_LIMITS.LV;
    if (systemVoltage >= 1000 && systemVoltage < 69000) {
        limit = IEEE519_LIMITS.MV;
    } else if (systemVoltage >= 69000 && systemVoltage < 161000) {
        limit = IEEE519_LIMITS['HV-subtransmission'];
    } else if (systemVoltage >= 161000) {
        limit = IEEE519_LIMITS['HV-transmission'];
    }
    
    const compliant = estimatedTHDv <= limit.THDv;
    
    console.log(`\nIEEE 519-2022 COMPLIANCE:`);
    console.log('─'.repeat(80));
    console.log(`Voltage Level: ${limit.voltage}`);
    console.log(`THDv Limit: ${limit.THDv}%`);
    console.log(`Estimated THDv: ${estimatedTHDv.toFixed(2)}%`);
    console.log(`Compliant: ${compliant ? '✓ YES' : '✗ NO'}`);
    
    if (!compliant) {
        console.log(`\n⚠️  WARNING: Exceeds IEEE 519 limits!`);
        console.log(`   Consider harmonic mitigation:`);
        console.log(`   - Install harmonic filters`);
        console.log(`   - Use 12-pulse drives instead of 6-pulse`);
        console.log(`   - Increase system short circuit capacity`);
        console.log(`   - Install active harmonic compensation`);
    }
    
    // Recommendations
    const recommendations = [];
    if (compositeTHDi > 50) {
        recommendations.push('High harmonic content - consider K-rated transformers');
    }
    if (compositeTHDi > 80) {
        recommendations.push('Very high harmonics - active filtering recommended');
    }
    if (!compliant) {
        recommendations.push('Non-compliant with IEEE 519 - mitigation required');
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        systemVoltage: systemVoltage,
        totalCurrent: totalCurrent,
        compositeTHDi: compositeTHDi,
        estimatedTHDv: estimatedTHDv,
        scRatio: scRatio,
        ieee519Limit: limit,
        compliant: compliant,
        loadBreakdown: loadBreakdown,
        recommendations: recommendations,
        standard: 'IEEE 519-2022'
    };
}

/**
 * Calculate K-factor for transformer selection
 * 
 * @param {Number} THDi - Total harmonic distortion current (%)
 * @returns {Object} K-factor calculation
 */
function calculateKFactor(THDi) {
    // Simplified K-factor estimation
    // K-factor ≈ 1 + (THDi/100)²
    const kFactor = 1 + Math.pow(THDi / 100, 2);
    
    // Standard K-factors: 4, 9, 13, 20, 30, 40, 50
    let recommendedK = 4;
    if (kFactor > 4) recommendedK = 9;
    if (kFactor > 9) recommendedK = 13;
    if (kFactor > 13) recommendedK = 20;
    if (kFactor > 20) recommendedK = 30;
    
    console.log(`\nK-FACTOR CALCULATION:`);
    console.log(`  Calculated K-factor: ${kFactor.toFixed(1)}`);
    console.log(`  Recommended K-rated transformer: K-${recommendedK}`);
    
    return {
        calculated: kFactor,
        recommended: recommendedK
    };
}

// Export to global scope
window.estimateHarmonics = estimateHarmonics;
window.calculateKFactor = calculateKFactor;
window.HARMONIC_SOURCES = HARMONIC_SOURCES;
window.IEEE519_LIMITS = IEEE519_LIMITS;

console.log('✅ Harmonic Analysis Module loaded successfully');
