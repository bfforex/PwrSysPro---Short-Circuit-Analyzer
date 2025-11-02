/**
 * Demand and Diversity Factors Module
 * NEC-compliant demand factor tables and calculations
 * 
 * @author bfforex
 * @date 2025-10-29 08:39:34 UTC
 * @version 1.0.0 - Feature #5 Implementation
 * 
 * References:
 * - NEC Article 220 - Branch-Circuit, Feeder, and Service Load Calculations
 * - NEC Table 220.42 - Lighting Unit Load by Occupancy
 * - NEC Table 220.56 - Demand Factors for Kitchen Equipment
 * - NEC Article 430.24 - Several Motors or a Motor(s) and Other Load(s)
 * - IEEE 141-1993 (Red Book) - Diversity Factors
 */

console.log('⚡ Loading Demand & Diversity Factors Module...');

// ═══════════════════════════════════════════════════════════════════════════
// NEC DEMAND FACTOR TABLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NEC Table 220.42 - Lighting Load Demand Factors
 * Portion of Lighting Load (VA) | Demand Factor (%)
 */
const NEC_LIGHTING_DEMAND_FACTORS = {
    residential: [
        { range: [0, 3000], factor: 1.00 },           // First 3,000 VA: 100%
        { range: [3000, 120000], factor: 0.35 },      // Next 117,000 VA: 35%
        { range: [120000, Infinity], factor: 0.25 }   // Remainder: 25%
    ],
    hospital: [
        { range: [0, 50000], factor: 1.00 },          // First 50,000 VA: 100%
        { range: [50000, Infinity], factor: 0.40 }    // Remainder: 40%
    ],
    hotel_motel: [
        { range: [0, 20000], factor: 1.00 },          // First 20,000 VA: 100%
        { range: [20000, 100000], factor: 0.70 },     // Next 80,000 VA: 70%
        { range: [100000, Infinity], factor: 0.50 }   // Remainder: 50%
    ],
    warehouse: [
        { range: [0, 12500], factor: 1.00 },          // First 12,500 VA: 100%
        { range: [12500, Infinity], factor: 0.50 }    // Remainder: 50%
    ],
    commercial: [
        { range: [0, Infinity], factor: 1.00 }        // All: 100%
    ]
};

/**
 * NEC Table 220.56 - Kitchen Equipment Demand Factors
 * Number of Units | Demand Factor (%)
 */
const NEC_KITCHEN_DEMAND_FACTORS = [
    { units: 1, factor: 1.00 },      // 1 unit: 100%
    { units: 2, factor: 1.00 },      // 2 units: 100%
    { units: 3, factor: 0.90 },      // 3 units: 90%
    { units: 4, factor: 0.80 },      // 4 units: 80%
    { units: 5, factor: 0.70 },      // 5 units: 70%
    { units: 6, factor: 0.65 }       // 6+ units: 65%
];

/**
 * NEC Article 430.24 - Motor Demand Factors (Typical Industrial Practice)
 */
const NEC_MOTOR_DEMAND_FACTORS = {
    continuous: 1.00,                // Continuous duty: 100%
    intermittent: 0.90,              // Intermittent duty: 90%
    standby: 0.00,                   // Standby: 0%
    multiple_small: 0.75,            // Multiple small motors: 75%
    multiple_large: 0.90             // Multiple large motors: 90%
};

/**
 * IEEE 141 / Industry Standard Diversity Factors
 * Based on equipment type and quantity
 */
const IEEE_DIVERSITY_FACTORS = {
    lighting: {
        small: 1.00,                 // < 10 fixtures: 100%
        medium: 0.85,                // 10-100 fixtures: 85%
        large: 0.75                  // > 100 fixtures: 75%
    },
    receptacles: {
        small: 0.50,                 // < 10 receptacles: 50%
        medium: 0.40,                // 10-50 receptacles: 40%
        large: 0.30                  // > 50 receptacles: 30%
    },
    motors: {
        small: 0.85,                 // < 5 motors: 85%
        medium: 0.75,                // 5-20 motors: 75%
        large: 0.65                  // > 20 motors: 65%
    },
    hvac: {
        small: 0.90,                 // < 3 units: 90%
        medium: 0.80,                // 3-10 units: 80%
        large: 0.70                  // > 10 units: 70%
    },
    kitchen: {
        small: 0.80,                 // < 3 appliances: 80%
        medium: 0.70,                // 3-6 appliances: 70%
        large: 0.65                  // > 6 appliances: 65%
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEMAND FACTOR CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate demand factor for lighting loads (NEC Table 220.42)
 * 
 * @param {Number} connectedLoad - Connected lighting load in VA
 * @param {String} occupancyType - Type of occupancy (residential, hospital, etc.)
 * @returns {Object} { demandLoad, demandFactor, breakdown }
 */
function calculateLightingDemand(connectedLoad, occupancyType = 'commercial') {
    const table = NEC_LIGHTING_DEMAND_FACTORS[occupancyType] || NEC_LIGHTING_DEMAND_FACTORS.commercial;
    
    let demandLoad = 0;
    let remainingLoad = connectedLoad;
    const breakdown = [];
    
    for (const tier of table) {
        const tierMin = tier.range[0];
        const tierMax = tier.range[1];
        const tierRange = Math.min(tierMax - tierMin, remainingLoad);
        
        if (tierRange > 0) {
            const tierDemand = tierRange * tier.factor;
            demandLoad += tierDemand;
            
            breakdown.push({
                range: `${tierMin.toLocaleString()} - ${tierMax === Infinity ? '∞' : tierMax.toLocaleString()} VA`,
                connected: tierRange,
                factor: tier.factor,
                demand: tierDemand
            });
            
            remainingLoad -= tierRange;
        }
        
        if (remainingLoad <= 0) break;
    }
    
    return {
        connectedLoad: connectedLoad,
        demandLoad: demandLoad,
        demandFactor: connectedLoad > 0 ? demandLoad / connectedLoad : 0,
        occupancyType: occupancyType,
        breakdown: breakdown
    };
}

/**
 * Calculate demand factor for kitchen equipment (NEC Table 220.56)
 * 
 * @param {Number} numberOfUnits - Number of kitchen equipment units
 * @param {Number} loadPerUnit - Load per unit in VA
 * @returns {Object} { demandLoad, demandFactor, breakdown }
 */
function calculateKitchenDemand(numberOfUnits, loadPerUnit) {
    const connectedLoad = numberOfUnits * loadPerUnit;
    
    // Find applicable demand factor
    let demandFactorObj = NEC_KITCHEN_DEMAND_FACTORS[0];
    for (const df of NEC_KITCHEN_DEMAND_FACTORS) {
        if (numberOfUnits <= df.units) {
            demandFactorObj = df;
            break;
        }
    }
    
    // Use last entry for > 6 units
    if (numberOfUnits > 6) {
        demandFactorObj = NEC_KITCHEN_DEMAND_FACTORS[NEC_KITCHEN_DEMAND_FACTORS.length - 1];
    }
    
    const demandLoad = connectedLoad * demandFactorObj.factor;
    
    return {
        connectedLoad: connectedLoad,
        demandLoad: demandLoad,
        demandFactor: demandFactorObj.factor,
        numberOfUnits: numberOfUnits,
        loadPerUnit: loadPerUnit,
        necReference: 'NEC Table 220.56'
    };
}

/**
 * Calculate motor demand factor (NEC Article 430.24)
 * 
 * @param {Number} connectedLoad - Connected motor load in VA or HP
 * @param {String} dutyType - Motor duty type (continuous, intermittent, standby)
 * @param {Number} numberOfMotors - Number of motors
 * @returns {Object} { demandLoad, demandFactor }
 */
function calculateMotorDemand(connectedLoad, dutyType = 'continuous', numberOfMotors = 1) {
    let demandFactor = NEC_MOTOR_DEMAND_FACTORS[dutyType] || NEC_MOTOR_DEMAND_FACTORS.continuous;
    
    // Apply additional diversity for multiple motors
    if (numberOfMotors > 1) {
        if (numberOfMotors <= 5) {
            demandFactor *= 0.95; // Small group: 95%
        } else if (numberOfMotors <= 20) {
            demandFactor *= 0.90; // Medium group: 90%
        } else {
            demandFactor *= 0.85; // Large group: 85%
        }
    }
    
    const demandLoad = connectedLoad * demandFactor;
    
    return {
        connectedLoad: connectedLoad,
        demandLoad: demandLoad,
        demandFactor: demandFactor,
        dutyType: dutyType,
        numberOfMotors: numberOfMotors,
        necReference: 'NEC Article 430.24'
    };
}

/**
 * Apply custom demand factor to any load
 * 
 * @param {Number} connectedLoad - Connected load
 * @param {Number} demandFactor - Demand factor (0.0 to 1.0)
 * @param {String} description - Load description
 * @returns {Object} { demandLoad, demandFactor, description }
 */
function applyDemandFactor(connectedLoad, demandFactor, description = '') {
    // Validate demand factor
    if (demandFactor < 0) demandFactor = 0;
    if (demandFactor > 1) demandFactor = 1;
    
    const demandLoad = connectedLoad * demandFactor;
    
    return {
        connectedLoad: connectedLoad,
        demandLoad: demandLoad,
        demandFactor: demandFactor,
        description: description
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DIVERSITY FACTOR CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate system diversity factor based on load type and quantity
 * 
 * @param {String} loadType - Type of load (lighting, motors, hvac, etc.)
 * @param {Number} quantity - Number of units/devices
 * @returns {Number} Diversity factor (0.0 to 1.0)
 */
function calculateDiversityFactor(loadType, quantity) {
    const diversityTable = IEEE_DIVERSITY_FACTORS[loadType];
    
    if (!diversityTable) {
        console.warn(`⚠️ Unknown load type: ${loadType}, using 1.0`);
        return 1.0;
    }
    
    // Determine size category
    if (quantity < 5) {
        return diversityTable.small || 1.0;
    } else if (quantity < 20) {
        return diversityTable.medium || 0.85;
    } else {
        return diversityTable.large || 0.75;
    }
}

/**
 * Apply diversity factor to combined loads
 * 
 * @param {Array} loads - Array of load objects with {type, quantity, demand}
 * @param {Number} customDiversityFactor - Optional custom diversity factor
 * @returns {Object} { totalDemand, diversityLoad, diversityFactor, breakdown }
 */
function applyDiversityFactor(loads, customDiversityFactor = null) {
    let totalDemand = 0;
    const breakdown = [];
    
    // Sum all demand loads
    loads.forEach(load => {
        totalDemand += load.demand || load.demandLoad || 0;
        breakdown.push({
            type: load.type,
            quantity: load.quantity || 1,
            demand: load.demand || load.demandLoad || 0
        });
    });
    
    // Calculate overall diversity factor
    let diversityFactor = customDiversityFactor;
    
    if (diversityFactor === null) {
        // Auto-calculate based on load mix
        const totalQuantity = loads.reduce((sum, load) => sum + (load.quantity || 1), 0);
        
        if (totalQuantity < 10) {
            diversityFactor = 0.90;
        } else if (totalQuantity < 50) {
            diversityFactor = 0.85;
        } else if (totalQuantity < 100) {
            diversityFactor = 0.80;
        } else {
            diversityFactor = 0.75;
        }
    }
    
    const diversityLoad = totalDemand * diversityFactor;
    
    return {
        totalDemand: totalDemand,
        diversityLoad: diversityLoad,
        diversityFactor: diversityFactor,
        reduction: totalDemand - diversityLoad,
        breakdown: breakdown,
        reference: 'IEEE 141-1993 Red Book'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get recommended demand factor based on load type
 * 
 * @param {String} loadType - Type of load
 * @param {Object} options - Additional options (quantity, duty, etc.)
 * @returns {Number} Recommended demand factor
 */
function getRecommendedDemandFactor(loadType, options = {}) {
    switch (loadType.toLowerCase()) {
        case 'lighting':
            return 1.0; // Use NEC table calculation instead
        case 'receptacle':
            return 0.50;
        case 'motor':
            return options.duty === 'continuous' ? 1.0 : 0.90;
        case 'hvac':
            return 0.90;
        case 'kitchen':
            return 0.80;
        case 'transformer':
            return 0.80; // Typical transformer loading
        case 'continuous':
            return 1.0;
        case 'non-continuous':
            return 0.75;
        default:
            return 1.0; // Default: 100%
    }
}

/**
 * Format demand factor result for display
 * 
 * @param {Object} result - Demand calculation result
 * @returns {String} Formatted string
 */
function formatDemandResult(result) {
    return `Connected: ${result.connectedLoad.toFixed(2)} VA | ` +
           `Demand: ${result.demandLoad.toFixed(2)} VA | ` +
           `Factor: ${(result.demandFactor * 100).toFixed(1)}%`;
}

/**
 * Validate demand factor value
 * 
 * @param {Number} factor - Demand factor to validate
 * @returns {Boolean} True if valid
 */
function isValidDemandFactor(factor) {
    return typeof factor === 'number' && factor >= 0 && factor <= 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

window.DemandFactors = {
    // Tables
    NEC_LIGHTING_DEMAND_FACTORS,
    NEC_KITCHEN_DEMAND_FACTORS,
    NEC_MOTOR_DEMAND_FACTORS,
    IEEE_DIVERSITY_FACTORS,
    
    // Calculation Functions
    calculateLightingDemand,
    calculateKitchenDemand,
    calculateMotorDemand,
    applyDemandFactor,
    calculateDiversityFactor,
    applyDiversityFactor,
    
    // Utility Functions
    getRecommendedDemandFactor,
    formatDemandResult,
    isValidDemandFactor
};

console.log('✅ Demand & Diversity Factors Module loaded');
console.log('   - NEC Tables: LOADED');
console.log('   - IEEE Diversity: LOADED');
console.log('   - Calculation Functions: READY');