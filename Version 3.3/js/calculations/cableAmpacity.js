/**
 * Cable Ampacity Derating Module
 * 
 * Calculates cable ampacity with derating factors per NEC 310.15
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard NEC 2023 - Article 310.15
 */

console.log('🔧 Loading Cable Ampacity Derating Module v1.0.0...');

// Temperature derating factors per NEC Table 310.15(B)(1)
const TEMP_DERATING = {
    30: 1.00,
    35: 0.94,
    40: 0.88,
    45: 0.82,
    50: 0.75
};

// Conduit fill derating factors per NEC 310.15(C)(1)
const CONDUIT_FILL_DERATING = {
    '1-3': 1.00,
    '4-6': 0.80,
    '7-9': 0.70,
    '10-20': 0.50,
    '21-30': 0.45,
    '31-40': 0.40
};

/**
 * Calculate derated cable ampacity
 * 
 * @param {Number} baseAmpacity - Base ampacity from NEC tables
 * @param {Number} ambientTemp - Ambient temperature in °C
 * @param {Number} conductorCount - Number of current-carrying conductors
 * @returns {Object} Derating calculation results
 */
function calculateCableAmpacity(baseAmpacity, ambientTemp = 30, conductorCount = 3) {
    console.log('\n' + '═'.repeat(80));
    console.log('CABLE AMPACITY DERATING CALCULATION');
    console.log('═'.repeat(80));
    
    // Get temperature derating factor
    let tempFactor = 1.0;
    if (TEMP_DERATING[ambientTemp]) {
        tempFactor = TEMP_DERATING[ambientTemp];
    } else {
        // Interpolate
        const temps = Object.keys(TEMP_DERATING).map(Number).sort((a, b) => a - b);
        for (let i = 0; i < temps.length - 1; i++) {
            if (ambientTemp >= temps[i] && ambientTemp <= temps[i + 1]) {
                const factor1 = TEMP_DERATING[temps[i]];
                const factor2 = TEMP_DERATING[temps[i + 1]];
                const ratio = (ambientTemp - temps[i]) / (temps[i + 1] - temps[i]);
                tempFactor = factor1 + ratio * (factor2 - factor1);
                break;
            }
        }
    }
    
    // Get conduit fill derating factor
    let conduitFactor = 0.40; // Default for >40 conductors
    if (conductorCount <= 3) {
        conduitFactor = CONDUIT_FILL_DERATING['1-3'];
    } else if (conductorCount <= 6) {
        conduitFactor = CONDUIT_FILL_DERATING['4-6'];
    } else if (conductorCount <= 9) {
        conduitFactor = CONDUIT_FILL_DERATING['7-9'];
    } else if (conductorCount <= 20) {
        conduitFactor = CONDUIT_FILL_DERATING['10-20'];
    } else if (conductorCount <= 30) {
        conduitFactor = CONDUIT_FILL_DERATING['21-30'];
    } else if (conductorCount <= 40) {
        conduitFactor = CONDUIT_FILL_DERATING['31-40'];
    }
    
    // Calculate final ampacity
    const finalAmpacity = baseAmpacity * tempFactor * conduitFactor;
    
    console.log(`Base Ampacity: ${baseAmpacity} A`);
    console.log(`Ambient Temperature: ${ambientTemp}°C`);
    console.log(`Conductors in Conduit: ${conductorCount}`);
    console.log(`\nDerating Factors:`);
    console.log(`  Temperature Factor: ${tempFactor.toFixed(3)}`);
    console.log(`  Conduit Fill Factor: ${conduitFactor.toFixed(3)}`);
    console.log(`\nCalculation:`);
    console.log(`  Final Ampacity = Base × Temp Factor × Conduit Fill Factor`);
    console.log(`  Final Ampacity = ${baseAmpacity} A × ${tempFactor.toFixed(3)} × ${conduitFactor.toFixed(3)}`);
    console.log(`  Final Ampacity = ${finalAmpacity.toFixed(2)} A`);
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        baseAmpacity: baseAmpacity,
        ambientTemp: ambientTemp,
        conductorCount: conductorCount,
        tempFactor: tempFactor,
        conduitFillFactor: conduitFactor,
        finalAmpacity: finalAmpacity,
        standard: 'NEC 2023 Article 310.15'
    };
}

// Export to global scope
window.calculateCableAmpacity = calculateCableAmpacity;

console.log('✅ Cable Ampacity Derating Module loaded successfully');
