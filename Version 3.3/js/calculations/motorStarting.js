/**
 * Motor Starting Analysis Module
 * 
 * Analyzes voltage drop during motor starting with various starting methods
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard NEMA MG 1 - Motors and Generators
 */

console.log('🔧 Loading Motor Starting Analysis Module v1.0.0...');


// Starting method characteristics
const STARTING_METHODS = {
    'across-the-line': {
        currentMultiplier: 6.0,
        torquePercent: 100,
        description: 'Direct-on-line (DOL) starting'
    },
    'star-delta': {
        currentMultiplier: 2.0,
        torquePercent: 33,
        description: 'Star-Delta (Y-Δ) starter'
    },
    'autotransformer-65': {
        currentMultiplier: 2.7,
        torquePercent: 42,
        description: 'Autotransformer 65% tap'
    },
    'autotransformer-80': {
        currentMultiplier: 4.0,
        torquePercent: 64,
        description: 'Autotransformer 80% tap'
    },
    'soft-starter': {
        currentMultiplier: 3.0,
        torquePercent: 50,
        description: 'Solid-state soft starter'
    },
    'vfd': {
        currentMultiplier: 1.0,
        torquePercent: 150,
        description: 'Variable Frequency Drive'
    }
};

/**
 * Analyze motor starting voltage drop
 * 
 * @param {Object} motor - Motor object {hp, voltage, efficiency, pf}
 * @param {String} startMethod - Starting method key
 * @param {Number} systemImpedanceOhms - System impedance in ohms
 * @returns {Object} Motor starting analysis results
 */
function analyzeMotorStarting(motor, startMethod = 'across-the-line', systemImpedanceOhms = 0.01) {
    console.log('\n' + '═'.repeat(80));
    console.log('MOTOR STARTING ANALYSIS');
    console.log('═'.repeat(80));
    
    const method = STARTING_METHODS[startMethod] || STARTING_METHODS['across-the-line'];
    
    // Calculate full load current
    const hp = motor.hp || motor.rating;
    const voltage = motor.voltage || 480;
    const efficiency = motor.efficiency || 0.90;
    const pf = motor.powerFactor || 0.85;
    
    const flc = (hp * 746) / (SQRT3 * voltage * efficiency * pf);
    
    // Calculate starting current
    const startingCurrent = flc * method.currentMultiplier;
    
    // Calculate voltage drop during starting
    const voltageDrop = startingCurrent * systemImpedanceOhms * SQRT3;
    const voltageDropPercent = (voltageDrop / voltage) * 100;
    
    // Remaining voltage
    const remainingVoltage = voltage - voltageDrop;
    const remainingPercent = (remainingVoltage / voltage) * 100;
    
    // Check if acceptable (typically 15% max drop)
    const acceptable = voltageDropPercent <= 15;
    
    console.log(`Motor: ${hp} HP, ${voltage}V`);
    console.log(`Starting Method: ${method.description}`);
    console.log(`\nFull Load Current:`);
    console.log(`  FLC = (HP × 746) / (√3 × V × η × PF)`);
    console.log(`  FLC = (${hp} × 746) / (√3 × ${voltage} × ${efficiency} × ${pf})`);
    console.log(`  FLC = ${flc.toFixed(2)} A`);
    console.log(`\nStarting Current:`);
    console.log(`  I_start = FLC × ${method.currentMultiplier}`);
    console.log(`  I_start = ${flc.toFixed(2)} A × ${method.currentMultiplier}`);
    console.log(`  I_start = ${startingCurrent.toFixed(2)} A`);
    console.log(`\nVoltage Drop:`);
    console.log(`  VD = I_start × Z_system × √3`);
    console.log(`  VD = ${startingCurrent.toFixed(2)} A × ${systemImpedanceOhms.toFixed(6)}Ω × √3`);
    console.log(`  VD = ${voltageDrop.toFixed(2)} V (${voltageDropPercent.toFixed(2)}%)`);
    console.log(`\nRemaining Voltage: ${remainingVoltage.toFixed(2)} V (${remainingPercent.toFixed(1)}%)`);
    console.log(`Starting Torque: ${method.torquePercent}% of rated`);
    console.log(`\nAcceptable: ${acceptable ? '✓ YES' : '✗ NO'} (limit: 15% max)`);
    console.log('═'.repeat(80) + '\n');
    
    return {
        motor: {
            hp: hp,
            voltage: voltage,
            flc: flc
        },
        startingMethod: {
            name: startMethod,
            description: method.description,
            currentMultiplier: method.currentMultiplier,
            torquePercent: method.torquePercent
        },
        startingCurrent: startingCurrent,
        voltageDrop: {
            volts: voltageDrop,
            percent: voltageDropPercent
        },
        remainingVoltage: {
            volts: remainingVoltage,
            percent: remainingPercent
        },
        acceptable: acceptable,
        maxAllowableDropPercent: 15,
        standard: 'NEMA MG 1'
    };
}

/**
 * Compare all starting methods for a motor
 * 
 * @param {Object} motor - Motor object
 * @param {Number} systemImpedanceOhms - System impedance
 * @returns {Object} Comparison of all methods
 */
function compareStartingMethods(motor, systemImpedanceOhms = 0.01) {
    console.log('\n' + '═'.repeat(80));
    console.log('MOTOR STARTING METHOD COMPARISON');
    console.log('═'.repeat(80));
    
    const results = {};
    
    for (const methodKey in STARTING_METHODS) {
        results[methodKey] = analyzeMotorStarting(motor, methodKey, systemImpedanceOhms);
    }
    
    console.log('\nCOMPARISON TABLE:');
    console.log('─'.repeat(80));
    console.log('Method              | I_start (A) | VD (%) | Torque (%) | Acceptable');
    console.log('─'.repeat(80));
    
    for (const methodKey in results) {
        const r = results[methodKey];
        console.log(`${r.startingMethod.description.padEnd(19)} | ${r.startingCurrent.toFixed(1).padStart(11)} | ${r.voltageDrop.percent.toFixed(1).padStart(6)} | ${r.startingMethod.torquePercent.toString().padStart(10)} | ${r.acceptable ? '✓' : '✗'}`);
    }
    
    console.log('─'.repeat(80));
    console.log('═'.repeat(80) + '\n');
    
    return results;
}

// Export to global scope
window.analyzeMotorStarting = analyzeMotorStarting;
window.compareStartingMethods = compareStartingMethods;
window.STARTING_METHODS = STARTING_METHODS;

console.log('✅ Motor Starting Analysis Module loaded successfully');
