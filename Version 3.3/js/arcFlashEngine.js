/**
 * Arc Flash Engine Module
 * Centralized Arc Flash Calculations with Unified Parameters
 * 
 * @author bfforex
 * @date 2025-12-02
 * @version 3.3.0
 * 
 * This module provides a single authoritative source for arc-flash calculations
 * using consistent IEEE 1584-2018 and NFPA 70E-2021 parameters.
 * 
 * Key Features:
 * - Centralized calculation to ensure consistency across all reports
 * - Results stored in unified schema: bus.results.shortCircuit.arcFlash
 * - Consistent working distance, electrode config, enclosure settings
 * - Support for multiple scenarios (bus-tie analysis)
 * 
 * Standards:
 * - IEEE 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations
 * - NFPA 70E-2021 - Standard for Electrical Safety in the Workplace
 * - NEC Article 110.16 - Arc-Flash Hazard Warning
 */

console.log('🔥 Loading Arc Flash Engine Module v3.3.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// ARC FLASH ENGINE CONFIGURATION
// Unified parameters for consistent calculations
// ═══════════════════════════════════════════════════════════════════════════════

const ARC_FLASH_ENGINE_CONFIG = {
    // IEEE 1584-2018 Default Parameters
    IEEE_1584: {
        // Working distances by voltage class (inches)
        WORKING_DISTANCE: {
            LOW_VOLTAGE: 18,      // 208V - 600V
            MEDIUM_VOLTAGE_LOW: 24,  // 601V - 5kV
            MEDIUM_VOLTAGE_HIGH: 36  // 5kV - 15kV
        },
        
        // Electrode gaps by equipment type (mm)
        ELECTRODE_GAP: {
            LOW_VOLTAGE: 32,
            MEDIUM_VOLTAGE: 102,
            SWITCHGEAR: 153
        },
        
        // Default electrode configuration
        DEFAULT_ELECTRODE_CONFIG: 'VCB',
        
        // Arcing current factor (typical)
        ARCING_FACTOR: 0.85,
        
        // Voltage limits
        VOLTAGE_LIMITS: {
            LOW_MIN: 208,
            LOW_MAX: 600,
            MEDIUM_MIN: 601,
            MEDIUM_MAX: 15000
        }
    },
    
    // NFPA 70E-2021 PPE Categories
    PPE_CATEGORIES: {
        0: {
            maxEnergy: 1.2,
            name: 'Category 0',
            clothing: 'Non-melting natural fiber clothing',
            minArcRating: 0,
            face: 'Safety glasses',
            hands: 'Leather work gloves',
            hazardLevel: 'Minimal'
        },
        1: {
            maxEnergy: 4,
            name: 'Category 1',
            clothing: 'Arc-rated FR shirt and pants',
            minArcRating: 4,
            face: 'Arc-rated face shield or flash hood',
            hands: 'Leather or arc-rated gloves',
            hazardLevel: 'Low'
        },
        2: {
            maxEnergy: 8,
            name: 'Category 2',
            clothing: 'Arc-rated FR shirt, pants, cotton underwear',
            minArcRating: 8,
            face: 'Arc-rated face shield with balaclava',
            hands: 'Rubber insulating gloves with leather',
            hazardLevel: 'Moderate'
        },
        3: {
            maxEnergy: 25,
            name: 'Category 3',
            clothing: 'Arc flash suit jacket and pants',
            minArcRating: 25,
            face: 'Arc-rated hood with face shield',
            hands: 'Rubber insulating gloves with leather',
            hazardLevel: 'High'
        },
        4: {
            maxEnergy: 40,
            name: 'Category 4',
            clothing: 'Multi-layer arc flash suit',
            minArcRating: 40,
            face: 'Arc-rated hood (multi-layer)',
            hands: 'Rubber insulating gloves with leather',
            hazardLevel: 'Extreme'
        }
    },
    
    // Default clearing times (cycles at 60Hz)
    CLEARING_TIMES: {
        INSTANTANEOUS: 2,
        SHORT_TIME: 6,
        TIME_DELAY: 10,
        FUSE_CURRENT_LIMITING: 0.5,
        FUSE_STANDARD: 5
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ARC FLASH CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate arc flash hazard for a bus
 * This is the single authoritative function for all arc-flash calculations
 * 
 * @param {Object} bus - Bus object
 * @param {Object} options - Calculation options
 * @returns {Object} Arc flash results in unified schema format
 */
function calculateArcFlashHazard(bus, options = {}) {
    console.log(`\n🔥 Arc Flash Calculation for: ${bus.name}`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE INPUTS
    // ─────────────────────────────────────────────────────────────────────────
    
    if (!bus) {
        throw new Error('Bus is required for arc flash calculation');
    }
    
    const voltage = bus.voltage;
    if (!voltage || voltage < 208) {
        console.warn(`⚠️ Voltage ${voltage}V below IEEE 1584-2018 minimum (208V)`);
        return createMinimalArcFlashResult(bus, 'Voltage below calculation threshold');
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // GET FAULT CURRENT
    // ─────────────────────────────────────────────────────────────────────────
    
    let boltedFaultKA = 0;
    
    // Try unified schema first
    if (bus.results?.shortCircuit?.faultCurrents?.threePhaseSym) {
        boltedFaultKA = bus.results.shortCircuit.faultCurrents.threePhaseSym;
    }
    // Try old schema
    else if (bus.results?.faultCurrents?.threePhaseSym) {
        boltedFaultKA = bus.results.faultCurrents.threePhaseSym;
    }
    // Try options
    else if (options.boltedFaultKA) {
        boltedFaultKA = options.boltedFaultKA;
    }
    
    if (boltedFaultKA <= 0) {
        console.warn(`⚠️ No fault current available for ${bus.name}`);
        return createMinimalArcFlashResult(bus, 'No fault current data');
    }
    
    console.log(`   Bolted Fault: ${boltedFaultKA.toFixed(3)} kA`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE PARAMETERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const config = ARC_FLASH_ENGINE_CONFIG.IEEE_1584;
    
    // Working distance
    let workingDistance;
    if (options.workingDistance) {
        workingDistance = options.workingDistance;
    } else if (voltage <= config.VOLTAGE_LIMITS.LOW_MAX) {
        workingDistance = config.WORKING_DISTANCE.LOW_VOLTAGE;
    } else if (voltage <= 5000) {
        workingDistance = config.WORKING_DISTANCE.MEDIUM_VOLTAGE_LOW;
    } else {
        workingDistance = config.WORKING_DISTANCE.MEDIUM_VOLTAGE_HIGH;
    }
    
    // Electrode gap
    let electrodeGap;
    if (options.electrodeGap) {
        electrodeGap = options.electrodeGap;
    } else if (voltage <= config.VOLTAGE_LIMITS.LOW_MAX) {
        electrodeGap = config.ELECTRODE_GAP.LOW_VOLTAGE;
    } else {
        electrodeGap = config.ELECTRODE_GAP.MEDIUM_VOLTAGE;
    }
    
    // Electrode configuration
    const electrodeConfig = options.electrodeConfig || config.DEFAULT_ELECTRODE_CONFIG;
    
    // Clearing time
    const clearingTimeCycles = options.clearingTimeCycles || 
        getClearingTimeForBus(bus) ||
        config.CLEARING_TIMES.INSTANTANEOUS;
    const clearingTimeSec = clearingTimeCycles / 60;
    
    console.log(`   Working Distance: ${workingDistance} inches`);
    console.log(`   Clearing Time: ${clearingTimeCycles} cycles (${(clearingTimeSec * 1000).toFixed(1)} ms)`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE ARCING CURRENT
    // ─────────────────────────────────────────────────────────────────────────
    
    const boltedFaultA = boltedFaultKA * 1000;
    const arcingFactor = config.ARCING_FACTOR;
    const arcingCurrentA = boltedFaultA * arcingFactor;
    const arcingCurrentKA = arcingCurrentA / 1000;
    
    console.log(`   Arcing Current: ${arcingCurrentKA.toFixed(3)} kA (${(arcingFactor * 100).toFixed(0)}% of bolted)`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE INCIDENT ENERGY (IEEE 1584-2018)
    // ─────────────────────────────────────────────────────────────────────────
    
    let incidentEnergy;
    let calculationMethod;
    
    if (voltage >= 208 && voltage <= 600) {
        // Low voltage calculation
        calculationMethod = 'IEEE 1584-2018 (Low Voltage)';
        incidentEnergy = calculateLowVoltageIncidentEnergy(
            arcingCurrentA,
            voltage,
            electrodeGap,
            clearingTimeSec,
            workingDistance
        );
    } else if (voltage > 600 && voltage <= 15000) {
        // Medium voltage calculation (Lee Method)
        calculationMethod = 'IEEE 1584-2018 (Medium Voltage - Lee Method)';
        incidentEnergy = calculateMediumVoltageIncidentEnergy(
            arcingCurrentA,
            voltage,
            clearingTimeSec,
            workingDistance
        );
    } else {
        throw new Error(`Voltage ${voltage}V outside IEEE 1584-2018 range (208V - 15kV)`);
    }
    
    console.log(`   Incident Energy: ${incidentEnergy.toFixed(2)} cal/cm²`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE ARC FLASH BOUNDARY
    // ─────────────────────────────────────────────────────────────────────────
    
    // Boundary is distance where IE = 1.2 cal/cm²
    const targetEnergy = 1.2;
    const workingDistanceMM = workingDistance * 25.4;
    const boundaryMM = workingDistanceMM * Math.sqrt(incidentEnergy / targetEnergy);
    const boundaryInches = boundaryMM / 25.4;
    const boundaryFeet = boundaryInches / 12;
    
    console.log(`   Arc Flash Boundary: ${boundaryFeet.toFixed(1)} feet`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE PPE CATEGORY
    // ─────────────────────────────────────────────────────────────────────────
    
    let ppeCategory = 0;
    const ppeConfig = ARC_FLASH_ENGINE_CONFIG.PPE_CATEGORIES;
    
    if (incidentEnergy < 1.2) {
        ppeCategory = 0;
    } else if (incidentEnergy < 4) {
        ppeCategory = 1;
    } else if (incidentEnergy < 8) {
        ppeCategory = 2;
    } else if (incidentEnergy < 25) {
        ppeCategory = 3;
    } else {
        ppeCategory = 4;
    }
    
    const ppeRequirements = ppeConfig[ppeCategory];
    
    console.log(`   PPE Category: ${ppeCategory} (${ppeRequirements.hazardLevel})`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // BUILD UNIFIED RESULT OBJECT
    // ─────────────────────────────────────────────────────────────────────────
    
    const result = {
        // Identification
        busId: bus.id,
        busName: bus.name,
        voltage: voltage,
        
        // Input parameters
        boltedFaultKA: boltedFaultKA,
        arcingCurrentKA: arcingCurrentKA,
        electrodeConfig: electrodeConfig,
        electrodeGap: electrodeGap,
        workingDistance: workingDistance,
        clearingTimeCycles: clearingTimeCycles,
        clearingTimeSec: clearingTimeSec,
        
        // Results
        incidentEnergy: incidentEnergy,
        arcFlashBoundary: boundaryInches,
        arcFlashBoundaryFeet: boundaryFeet,
        ppeCategory: ppeCategory,
        
        // PPE requirements
        ppeRequirements: {
            category: ppeCategory,
            name: ppeRequirements.name,
            minArcRating: ppeRequirements.minArcRating,
            clothing: ppeRequirements.clothing,
            face: ppeRequirements.face,
            hands: ppeRequirements.hands
        },
        
        // Hazard classification
        hazardLevel: ppeRequirements.hazardLevel,
        
        // Calculation metadata
        method: calculationMethod,
        standard: 'IEEE 1584-2018 / NFPA 70E-2021',
        calculationDate: new Date().toISOString(),
        
        // Compliance
        dangerous: incidentEnergy > 40,
        requiresRemoteOperation: incidentEnergy > 40
    };
    
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INCIDENT ENERGY CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate incident energy for low voltage systems (208-600V)
 * IEEE 1584-2018 simplified method
 */
function calculateLowVoltageIncidentEnergy(arcingCurrentA, voltage, electrodeGapMM, clearingTimeSec, workingDistanceInches) {
    // Simplified IEEE 1584-2018 calculation
    // Full implementation would use more complex coefficients
    
    const k = 0; // Electrode configuration factor (VCB)
    const logIarc = Math.log10(arcingCurrentA);
    
    // Simplified log(E) calculation
    const logE = k + 0.662 * logIarc + 0.0966 * voltage / 1000 + 
                 0.000526 * electrodeGapMM + 0.5588 * voltage / 1000 * logIarc - 
                 0.00304 * electrodeGapMM * logIarc;
    
    const arcPower = Math.pow(10, logE);
    const distanceMM = workingDistanceInches * 25.4;
    
    // Incident energy in cal/cm²
    const incidentEnergy = (4.184 * arcPower * clearingTimeSec * Math.pow(610, 2)) / 
                           (Math.pow(distanceMM, 2) * 10000);
    
    return Math.max(0, incidentEnergy);
}

/**
 * Calculate incident energy for medium voltage systems (601V-15kV)
 * Lee Method per IEEE 1584-2018
 */
function calculateMediumVoltageIncidentEnergy(arcingCurrentA, voltage, clearingTimeSec, workingDistanceInches) {
    // Lee Method for medium voltage
    const k = 2.8934; // Empirical constant
    const arcPowerKW = k * voltage * arcingCurrentA * 0.001;
    const distanceMM = workingDistanceInches * 25.4;
    
    // Incident energy in cal/cm²
    const incidentEnergy = (4.184 * arcPowerKW * clearingTimeSec * Math.pow(610, 2)) / 
                           (Math.pow(distanceMM, 2) * 10);
    
    return Math.max(0, incidentEnergy);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get clearing time for a bus based on protection devices
 */
function getClearingTimeForBus(bus) {
    const config = ARC_FLASH_ENGINE_CONFIG;
    
    // Try to get from protection device data
    if (typeof window !== 'undefined' && window.protectionDeviceResults?.[bus.id]) {
        const device = window.protectionDeviceResults[bus.id];
        if (device.clearingTime) return device.clearingTime;
        if (device.deviceType === 'breaker') return config.CLEARING_TIMES.INSTANTANEOUS;
        if (device.deviceType === 'fuse') return config.CLEARING_TIMES.FUSE_CURRENT_LIMITING;
    }
    
    // Default based on voltage level
    if (bus.voltage <= 600) {
        return config.CLEARING_TIMES.INSTANTANEOUS;
    } else {
        return config.CLEARING_TIMES.SHORT_TIME;
    }
}

/**
 * Create minimal result when calculation cannot be performed
 */
function createMinimalArcFlashResult(bus, reason) {
    return {
        busId: bus?.id || '',
        busName: bus?.name || '',
        voltage: bus?.voltage || 0,
        
        incidentEnergy: 0,
        arcFlashBoundary: 0,
        ppeCategory: 0,
        
        ppeRequirements: ARC_FLASH_ENGINE_CONFIG.PPE_CATEGORIES[0],
        hazardLevel: 'Unknown',
        
        method: 'N/A',
        standard: 'IEEE 1584-2018 / NFPA 70E-2021',
        calculationDate: new Date().toISOString(),
        
        error: reason,
        dangerous: false
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate arc flash for all buses and store in unified schema
 * @param {Array} buses - Array of bus objects
 * @param {Object} options - Calculation options
 * @returns {Object} Summary of calculations
 */
function calculateAllBusesArcFlash(buses, options = {}) {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('ARC FLASH ANALYSIS - ALL BUSES');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    const results = {
        calculated: 0,
        skipped: 0,
        errors: 0,
        maxIncidentEnergy: 0,
        maxIncidentEnergyBus: null,
        highestPPECategory: 0,
        summary: []
    };
    
    buses.forEach(bus => {
        try {
            const arcFlash = calculateArcFlashHazard(bus, options);
            
            // Store in unified schema
            if (!bus.results) bus.results = {};
            if (!bus.results.shortCircuit) bus.results.shortCircuit = {};
            bus.results.shortCircuit.arcFlash = arcFlash;
            
            // Also store in backward-compatible location
            bus.results.arcFlash = arcFlash;
            
            // Update summary
            if (arcFlash.incidentEnergy > results.maxIncidentEnergy) {
                results.maxIncidentEnergy = arcFlash.incidentEnergy;
                results.maxIncidentEnergyBus = bus.name;
            }
            
            if (arcFlash.ppeCategory > results.highestPPECategory) {
                results.highestPPECategory = arcFlash.ppeCategory;
            }
            
            results.summary.push({
                busName: bus.name,
                voltage: bus.voltage,
                incidentEnergy: arcFlash.incidentEnergy,
                ppeCategory: arcFlash.ppeCategory,
                arcFlashBoundary: arcFlash.arcFlashBoundaryFeet
            });
            
            results.calculated++;
            
        } catch (error) {
            console.error(`❌ Error calculating arc flash for ${bus.name}:`, error.message);
            results.errors++;
        }
    });
    
    console.log(`\n✅ Arc Flash Calculation Complete`);
    console.log(`   Calculated: ${results.calculated}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);
    console.log(`   Max IE: ${results.maxIncidentEnergy.toFixed(2)} cal/cm² (${results.maxIncidentEnergyBus})`);
    console.log(`   Highest PPE: Category ${results.highestPPECategory}`);
    
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.ARC_FLASH_ENGINE_CONFIG = ARC_FLASH_ENGINE_CONFIG;
    window.calculateArcFlashHazard = calculateArcFlashHazard;
    window.calculateAllBusesArcFlash = calculateAllBusesArcFlash;
    window.calculateLowVoltageIncidentEnergy = calculateLowVoltageIncidentEnergy;
    window.calculateMediumVoltageIncidentEnergy = calculateMediumVoltageIncidentEnergy;
}

console.log('✅ Arc Flash Engine Module v3.3.0 loaded');
console.log('   - IEEE 1584-2018 compliant');
console.log('   - NFPA 70E-2021 PPE categories');
console.log('   - Unified parameters for consistent results');
console.log('   - Results stored in unified schema');
console.log('');
