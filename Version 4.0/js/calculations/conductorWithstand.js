/**
 * Conductor Withstand Verification Module
 * 
 * Verifies conductor can withstand available fault current using I²t method
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE 242-2001 (Buff Book) - Section 8.5
 */

console.log('🔧 Loading Conductor Withstand Verification Module v1.0.0...');

// I²t constants (k values) for different conductor types
// k = A_mm² / √(I²t)
const K_VALUES = {
    // Copper conductors
    'copper-XLPE': 143,       // Copper with XLPE insulation (90°C)
    'copper-EPR': 143,        // Copper with EPR insulation
    'copper-PVC': 115,        // Copper with PVC insulation (75°C)
    'copper-bare': 171,       // Bare copper
    
    // Aluminum conductors
    'aluminum-XLPE': 94,      // Aluminum with XLPE insulation (90°C)
    'aluminum-EPR': 94,       // Aluminum with EPR insulation
    'aluminum-PVC': 76,       // Aluminum with PVC insulation (75°C)
    'aluminum-bare': 112      // Bare aluminum
};

/**
 * Verify conductor withstand capability
 * 
 * @param {Number} faultCurrentKA - Available fault current in kA
 * @param {Number} clearingTimeSec - Protection device clearing time in seconds
 * @param {Number} conductorAreaMM2 - Conductor cross-sectional area in mm²
 * @param {String} conductorType - Conductor type (e.g., 'copper-XLPE')
 * @returns {Object} Withstand verification results
 */
function verifyConductorWithstand(faultCurrentKA, clearingTimeSec, conductorAreaMM2, conductorType = 'copper-XLPE') {
    console.log('\n' + '═'.repeat(80));
    console.log('CONDUCTOR SHORT CIRCUIT WITHSTAND VERIFICATION');
    console.log('═'.repeat(80));
    
    const faultCurrentA = faultCurrentKA * 1000;
    const k = K_VALUES[conductorType] || K_VALUES['copper-XLPE'];
    
    // Calculate I²t available
    const i2tAvailable = Math.pow(faultCurrentA, 2) * clearingTimeSec;
    
    // Calculate I²t withstand
    const i2tWithstand = Math.pow((conductorAreaMM2 * k), 2);
    
    // Calculate margin
    const margin = i2tWithstand / i2tAvailable;
    const marginPercent = (margin - 1) * 100;
    
    // Determine if acceptable (margin > 1.0)
    const acceptable = margin >= 1.0;
    
    console.log(`Conductor: ${conductorAreaMM2} mm² ${conductorType}`);
    console.log(`k-value: ${k} A√s/mm²`);
    console.log(`\nFault Current: ${faultCurrentKA.toFixed(3)} kA`);
    console.log(`Clearing Time: ${clearingTimeSec.toFixed(3)} seconds`);
    console.log(`\nI²t Available:`);
    console.log(`  I²t_avail = I_fault² × t_clearing`);
    console.log(`  I²t_avail = (${faultCurrentA.toFixed(0)} A)² × ${clearingTimeSec.toFixed(3)} s`);
    console.log(`  I²t_avail = ${i2tAvailable.toExponential(3)} A²s`);
    console.log(`\nI²t Withstand:`);
    console.log(`  I²t_withstand = (A × k)²`);
    console.log(`  I²t_withstand = (${conductorAreaMM2} mm² × ${k})²`);
    console.log(`  I²t_withstand = ${i2tWithstand.toExponential(3)} A²s`);
    console.log(`\nMargin:`);
    console.log(`  Margin = I²t_withstand / I²t_available`);
    console.log(`  Margin = ${margin.toFixed(3)} (${marginPercent >= 0 ? '+' : ''}${marginPercent.toFixed(1)}%)`);
    console.log(`\nAcceptable: ${acceptable ? '✓ YES' : '✗ NO - UNDERSIZED!'}`);
    
    if (!acceptable) {
        // Calculate minimum required area
        const minAreaRequired = Math.sqrt(i2tAvailable) / k;
        console.log(`\n⚠️  WARNING: Conductor undersized!`);
        console.log(`   Minimum area required: ${minAreaRequired.toFixed(1)} mm²`);
    }
    
    console.log('═'.repeat(80) + '\n');
    
    return {
        faultCurrentKA: faultCurrentKA,
        clearingTimeSec: clearingTimeSec,
        conductor: {
            areaMM2: conductorAreaMM2,
            type: conductorType,
            kValue: k
        },
        i2tAvailable: i2tAvailable,
        i2tWithstand: i2tWithstand,
        margin: margin,
        marginPercent: marginPercent,
        acceptable: acceptable,
        standard: 'IEEE 242-2001 Section 8.5'
    };
}

/**
 * Calculate minimum conductor area required
 * 
 * @param {Number} faultCurrentKA - Available fault current in kA
 * @param {Number} clearingTimeSec - Protection device clearing time in seconds
 * @param {String} conductorType - Conductor type
 * @returns {Object} Minimum area calculation
 */
function calculateMinimumConductorArea(faultCurrentKA, clearingTimeSec, conductorType = 'copper-XLPE') {
    const faultCurrentA = faultCurrentKA * 1000;
    const k = K_VALUES[conductorType] || K_VALUES['copper-XLPE'];
    const i2t = Math.pow(faultCurrentA, 2) * clearingTimeSec;
    const minAreaMM2 = Math.sqrt(i2t) / k;
    
    console.log(`\nMinimum Conductor Area:`);
    console.log(`  A_min = √(I²t) / k`);
    console.log(`  A_min = √(${i2t.toExponential(3)}) / ${k}`);
    console.log(`  A_min = ${minAreaMM2.toFixed(2)} mm²`);
    
    return {
        minimumAreaMM2: minAreaMM2,
        i2t: i2t,
        kValue: k,
        conductorType: conductorType
    };
}

// Export to global scope
window.verifyConductorWithstand = verifyConductorWithstand;
window.calculateMinimumConductorArea = calculateMinimumConductorArea;
window.K_VALUES = K_VALUES;

console.log('✅ Conductor Withstand Verification Module loaded successfully');
