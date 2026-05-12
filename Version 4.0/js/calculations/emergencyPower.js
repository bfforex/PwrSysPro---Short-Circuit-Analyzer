/**
 * Emergency Power Calculations Module
 * 
 * Generator and Automatic Transfer Switch (ATS) sizing calculations
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard NFPA 110 - Emergency and Standby Power Systems
 * @standard NEC 2023 - Article 700, 701, 702
 */

console.log('🔧 Loading Emergency Power Calculations Module v1.0.0...');

/**
 * Calculate generator sizing requirements
 * 
 * @param {Object} loads - Load requirements object
 * @returns {Object} Generator sizing results
 */
function calculateGeneratorSizing(loads) {
    console.log('\n' + '═'.repeat(80));
    console.log('GENERATOR SIZING CALCULATION');
    console.log('═'.repeat(80));
    
    const connectedLoad = loads.connectedLoad || 0;
    const demandFactor = loads.demandFactor || 0.8;
    const demandLoad = connectedLoad * demandFactor;
    
    // Largest motor starting load (typically 25-30% of motor HP for 6x starting)
    const largestMotorHP = loads.largestMotorHP || 0;
    const startingLoad = largestMotorHP * 0.25; // Simplified - actual depends on starting method
    
    // Total required capacity
    const requiredKW = demandLoad + startingLoad;
    
    // Apply factors
    const loadFactor = loads.loadFactor || 0.8; // 80% loading recommended
    const futureGrowth = loads.futureGrowth || 1.25; // 25% expansion
    const altitudeDerating = loads.altitudeDerating || 1.0;
    const temperatureDerating = loads.temperatureDerating || 1.0;
    
    const generatorSizeKW = (requiredKW / loadFactor) * futureGrowth * altitudeDerating * temperatureDerating;
    
    // Round up to standard size
    const standardSizes = [20, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1250, 1500, 2000];
    let recommendedSize = standardSizes[0];
    for (const size of standardSizes) {
        if (size >= generatorSizeKW) {
            recommendedSize = size;
            break;
        }
    }
    
    console.log(`Connected Load: ${connectedLoad} kW`);
    console.log(`Demand Factor: ${(demandFactor * 100).toFixed(0)}%`);
    console.log(`Demand Load: ${demandLoad.toFixed(2)} kW`);
    console.log(`Largest Motor: ${largestMotorHP} HP`);
    console.log(`Starting Load Addition: ${startingLoad.toFixed(2)} kW`);
    console.log(`\nRequired Capacity: ${requiredKW.toFixed(2)} kW`);
    console.log(`\nDerating Factors:`);
    console.log(`  Load Factor: ${(loadFactor * 100).toFixed(0)}% (run at 80% max)`);
    console.log(`  Future Growth: ${((futureGrowth - 1) * 100).toFixed(0)}%`);
    console.log(`  Altitude Derating: ${(altitudeDerating * 100).toFixed(0)}%`);
    console.log(`  Temperature Derating: ${(temperatureDerating * 100).toFixed(0)}%`);
    console.log(`\nCalculated Generator Size: ${generatorSizeKW.toFixed(2)} kW`);
    console.log(`Recommended Standard Size: ${recommendedSize} kW`);
    
    // Calculate fuel requirements (simplified)
    const fuelConsumptionGalPerHr = recommendedSize * 0.08; // Approximate
    const runtimeHours = loads.runtimeHours || 48;
    const fuelCapacity = fuelConsumptionGalPerHr * runtimeHours;
    
    console.log(`\nFUEL REQUIREMENTS (Diesel):`);
    console.log(`  Consumption Rate: ${fuelConsumptionGalPerHr.toFixed(1)} gal/hr at full load`);
    console.log(`  Runtime Required: ${runtimeHours} hours`);
    console.log(`  Minimum Tank Capacity: ${fuelCapacity.toFixed(0)} gallons`);
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        loads: {
            connected: connectedLoad,
            demand: demandLoad,
            starting: startingLoad,
            required: requiredKW
        },
        factors: {
            loadFactor: loadFactor,
            futureGrowth: futureGrowth,
            altitudeDerating: altitudeDerating,
            temperatureDerating: temperatureDerating
        },
        generator: {
            calculatedKW: generatorSizeKW,
            recommendedKW: recommendedSize
        },
        fuel: {
            consumptionGalPerHr: fuelConsumptionGalPerHr,
            runtimeHours: runtimeHours,
            tankCapacityGal: fuelCapacity
        },
        standard: 'NFPA 110 / NEC 700-701-702'
    };
}

/**
 * Calculate ATS (Automatic Transfer Switch) requirements
 * 
 * @param {Number} generatorKW - Generator size in kW
 * @param {Number} voltage - System voltage
 * @param {Number} faultCurrentKA - Available fault current at ATS location
 * @returns {Object} ATS sizing results
 */
function calculateATSRequirements(generatorKW, voltage = 480, faultCurrentKA = 42) {
    console.log('\n' + '═'.repeat(80));
    console.log('AUTOMATIC TRANSFER SWITCH (ATS) SIZING');
    console.log('═'.repeat(80));
    
    // Calculate current rating needed
    const sqrt3 = Math.sqrt(3);
    const current = (generatorKW * 1000) / (sqrt3 * voltage * 0.8); // Assuming 0.8 PF
    
    // Apply 125% for continuous duty (NEC 700.5)
    const requiredCurrent = current * 1.25;
    
    // Round up to standard ATS sizes
    const standardATS = [30, 60, 100, 150, 200, 260, 400, 600, 800, 1000, 1200, 1600, 2000, 3000, 4000];
    let recommendedATS = standardATS[0];
    for (const size of standardATS) {
        if (size >= requiredCurrent) {
            recommendedATS = size;
            break;
        }
    }
    
    // Withstand rating should be at least equal to available fault current
    const withstandRating = Math.ceil(faultCurrentKA / 5) * 5; // Round up to nearest 5kA
    
    console.log(`Generator Size: ${generatorKW} kW`);
    console.log(`System Voltage: ${voltage}V`);
    console.log(`\nCurrent Calculation:`);
    console.log(`  I = P / (√3 × V × PF)`);
    console.log(`  I = ${generatorKW} kW / (√3 × ${voltage}V × 0.8)`);
    console.log(`  I = ${current.toFixed(1)} A`);
    console.log(`  Required (125%): ${requiredCurrent.toFixed(1)} A`);
    console.log(`\nRecommended ATS Rating: ${recommendedATS} A`);
    console.log(`\nFault Current at Location: ${faultCurrentKA} kA`);
    console.log(`ATS Withstand Rating Required: ${withstandRating} kA min`);
    console.log(`\nATS Type: Automatic, 4-pole (3P+N)`);
    console.log(`Transfer Time: <10 seconds (open transition)`);
    console.log(`\nFeatures Required:`);
    console.log(`  - Voltage & frequency sensing`);
    console.log(`  - Engine start signal`);
    console.log(`  - Time delay adjustable`);
    console.log(`  - Neutral switching (4-pole)`);
    console.log(`  - Exercise timer`);
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        generator: {
            kW: generatorKW,
            voltage: voltage
        },
        current: {
            calculated: current,
            required: requiredCurrent,
            atsRating: recommendedATS
        },
        withstand: {
            availableFaultKA: faultCurrentKA,
            requiredRatingKA: withstandRating
        },
        specifications: {
            type: 'automatic',
            poles: 4,
            transferTimeSeconds: 10,
            features: [
                'Voltage & frequency sensing',
                'Engine start signal',
                'Time delay adjustable',
                'Neutral switching',
                'Exercise timer'
            ]
        },
        standard: 'NFPA 110 / NEC 700.5'
    };
}

/**
 * Calculate complete emergency power system
 * 
 * @param {Object} params - System parameters
 * @returns {Object} Complete emergency power system sizing
 */
function calculateEmergencyPowerSystem(params) {
    console.log('\n' + '═'.repeat(80));
    console.log('COMPLETE EMERGENCY POWER SYSTEM DESIGN');
    console.log('═'.repeat(80) + '\n');
    
    const generatorResults = calculateGeneratorSizing(params.loads);
    const atsResults = calculateATSRequirements(
        generatorResults.generator.recommendedKW,
        params.voltage || 480,
        params.faultCurrentKA || 42
    );
    
    console.log('SYSTEM SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`Generator: ${generatorResults.generator.recommendedKW} kW`);
    console.log(`Transfer Switch: ${atsResults.current.atsRating} A, ${atsResults.withstand.requiredRatingKA} kA withstand`);
    console.log(`Fuel Tank: ${generatorResults.fuel.tankCapacityGal.toFixed(0)} gallons minimum`);
    console.log('─'.repeat(80) + '\n');
    
    return {
        generator: generatorResults,
        ats: atsResults,
        standard: 'NFPA 110 / NEC Articles 700, 701, 702'
    };
}

// Export to global scope
window.calculateGeneratorSizing = calculateGeneratorSizing;
window.calculateATSRequirements = calculateATSRequirements;
window.calculateEmergencyPowerSystem = calculateEmergencyPowerSystem;

console.log('✅ Emergency Power Calculations Module loaded successfully');
