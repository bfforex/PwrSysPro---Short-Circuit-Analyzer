/**
 * Enhanced Diversity Factors Module
 * IEEE 141-1993 Table 3-5 compliant diversity factor calculations
 * 
 * @author bfforex
 * @date 2025-12-05
 * @version 3.4.0
 * 
 * Features:
 * - Motor group diversity: 1 motor=1.00, 2-5=1.10, 6-10=1.15, 11-20=1.20, >20=1.25
 * - Load type diversity: Lighting=1.00, Receptacles=1.30-1.40
 * - Composite diversity weighted by kVA contribution
 * - Per-bus diversity breakdown stored in bus.results.loadFlow.diversitySummary
 * - Diversity table generation for reports
 * 
 * Standards Compliance:
 * - IEEE 141-1993 Table 3-5 - Diversity Factors for Industrial Loads
 * - NEC 2017 Article 220 - Branch-Circuit and Feeder Load Calculations
 */

console.log('🔧 Loading Enhanced Diversity Factors Module v3.4.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DIVERSITY_FACTORS_CONFIG = {
    // Motor group diversity factors per IEEE 141-1993 Table 3-5
    // Values match demandFactors.js getDiversityFactor() for consistency
    MOTOR_DIVERSITY: {
        1:  1.00,   // 1 motor  - no diversity
        2:  1.05,   // 2 motors
        3:  1.10,   // 3 motors
        4:  1.15,   // 4 motors
        5:  1.18,   // 5 motors
        10: 1.25,   // 6-10 motors
        15: 1.30,   // 11-15 motors
        20: 1.35    // >15 motors
    },
    
    // Load type diversity factors
    LOAD_TYPE_DIVERSITY: {
        lighting_continuous: 1.00,      // Continuous lighting - no diversity
        lighting_general: 1.20,         // General lighting
        receptacles: 1.35,              // Receptacle outlets (average)
        receptacles_min: 1.30,          // Receptacle outlets (minimum)
        receptacles_max: 1.40,          // Receptacle outlets (maximum)
        hvac: 1.10,                     // HVAC loads
        welding: 1.50,                  // Welding loads
        other: 1.15                     // Other loads
    },
    
    // Default diversity factor if no specific data available
    DEFAULT_DIVERSITY: 1.20
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DIVERSITY FACTOR CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate diversity factor based on number of motors per IEEE 141 Table 3-5
 * Values match demandFactors.js getDiversityFactor() for consistency.
 * 
 * @param {Number} motorCount - Number of motors in the group
 * @returns {Number} Diversity factor
 */
function getMotorDiversityFactor(motorCount) {
    if (motorCount <= 1)  return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[1];   // 1.00
    if (motorCount === 2) return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[2];   // 1.05
    if (motorCount <= 3)  return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[3];   // 1.10
    if (motorCount <= 4)  return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[4];   // 1.15
    if (motorCount <= 5)  return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[5];   // 1.18
    if (motorCount <= 10) return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[10];  // 1.25
    if (motorCount <= 15) return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[15];  // 1.30
    return DIVERSITY_FACTORS_CONFIG.MOTOR_DIVERSITY[20];                        // 1.35
}

/**
 * Calculate diversity factor for a specific load type
 * 
 * @param {String} loadType - Type of load ('lighting', 'receptacles', 'hvac', etc.)
 * @returns {Number} Diversity factor
 */
function getLoadTypeDiversityFactor(loadType) {
    const normalizedType = loadType?.toLowerCase() || 'other';
    
    if (normalizedType.includes('light')) {
        if (normalizedType.includes('continuous')) {
            return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.lighting_continuous;
        }
        return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.lighting_general;
    } else if (normalizedType.includes('receptacle') || normalizedType.includes('outlet')) {
        return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.receptacles;
    } else if (normalizedType.includes('hvac') || normalizedType.includes('air')) {
        return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.hvac;
    } else if (normalizedType.includes('weld')) {
        return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.welding;
    }
    
    return DIVERSITY_FACTORS_CONFIG.LOAD_TYPE_DIVERSITY.other;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUS-LEVEL DIVERSITY FACTOR CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate composite diversity factor for a bus based on its loads
 * Returns weighted diversity factor based on kVA contribution of each load type
 * 
 * @param {Object} bus - Bus object
 * @returns {Object} Diversity factor calculation breakdown
 */
function calculateBusDiversityFactor(bus) {
    // Get all components connected to this bus
    const busComponents = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.fromBus === bus.id || c.fromBusName === bus.name) 
        : [];

    if (busComponents.length === 0) {
        return {
            diversityFactor: 1.00,
            motorCount: 0,
            motorDF: 1.00,
            motorKVA: 0,
            otherKVA: 0,
            totalKVA: 0,
            breakdown: []
        };
    }

    // Separate motors from other loads
    const motors = busComponents.filter(c => c.type === 'motor');
    const otherLoads = busComponents.filter(c => c.type !== 'motor');

    // Calculate motor diversity
    const motorCount = motors.length;
    const motorDF = getMotorDiversityFactor(motorCount);

    // Calculate motor kVA
    const motorKVA = motors.reduce((sum, motor) => {
        const hp = motor.hp || motor.power || 0;
        const kw = hp * 0.746; // Convert HP to kW
        const voltage = motor.voltage || bus.voltage || 480;
        const pf = 0.85; // Assume 0.85 power factor for motors
        const kva = kw / pf;
        return sum + kva;
    }, 0);

    // Calculate other loads kVA and diversity
    let otherKVA = 0;
    let otherWeightedDF = 0;
    const loadBreakdown = [];

    otherLoads.forEach(load => {
        const loadType = load.loadType || load.type || 'other';
        const loadDF = getLoadTypeDiversityFactor(loadType);
        
        let loadKVA = 0;
        if (load.kva) {
            loadKVA = load.kva;
        } else if (load.kw) {
            loadKVA = load.kw / 0.85; // Assume 0.85 PF
        } else if (load.current) {
            const voltage = load.voltage || bus.voltage || 480;
            loadKVA = (load.current * voltage * Math.sqrt(3)) / 1000;
        }
        
        otherKVA += loadKVA;
        otherWeightedDF += loadKVA * loadDF;
        
        loadBreakdown.push({
            type: loadType,
            kva: loadKVA,
            diversityFactor: loadDF
        });
    });

    // Calculate weighted average diversity factor for other loads
    const otherDF = otherKVA > 0 ? otherWeightedDF / otherKVA : 1.00;

    // Calculate composite diversity factor
    const totalKVA = motorKVA + otherKVA;
    let compositeDiversityFactor;
    
    if (totalKVA > 0) {
        const motorWeight = motorKVA / totalKVA;
        const otherWeight = otherKVA / totalKVA;
        compositeDiversityFactor = (motorDF * motorWeight) + (otherDF * otherWeight);
    } else {
        compositeDiversityFactor = 1.00;
    }

    return {
        diversityFactor: compositeDiversityFactor,
        motorCount,
        motorDF,
        motorKVA,
        otherDF,
        otherKVA,
        totalKVA,
        breakdown: [
            {
                category: 'Motors',
                count: motorCount,
                kva: motorKVA,
                diversityFactor: motorDF,
                weight: totalKVA > 0 ? motorKVA / totalKVA : 0
            },
            {
                category: 'Other Loads',
                count: otherLoads.length,
                kva: otherKVA,
                diversityFactor: otherDF,
                weight: totalKVA > 0 ? otherKVA / totalKVA : 0
            }
        ],
        loadTypeBreakdown: loadBreakdown
    };
}

/**
 * Apply enhanced diversity factors to all buses
 * Stores diversity summary in bus.results.loadFlow.diversitySummary
 * 
 * @param {Array} buses - Array of all buses
 */
function applyEnhancedDiversityFactors(buses) {
    buses.forEach(bus => {
        // Ensure results structure exists
        if (!bus.results) {
            bus.results = {};
        }
        if (!bus.results.loadFlow) {
            bus.results.loadFlow = {};
        }

        // Calculate and store diversity factor breakdown
        const diversitySummary = calculateBusDiversityFactor(bus);
        bus.results.loadFlow.diversitySummary = diversitySummary;

        // Update load flow calculations with diversity factor
        if (bus.results.loadFlow.summary) {
            const connectedCurrent = bus.results.loadFlow.summary.totalCurrent || 0;
            const diversifiedCurrent = connectedCurrent / diversitySummary.diversityFactor;
            
            bus.results.loadFlow.summary.diversityFactor = diversitySummary.diversityFactor;
            bus.results.loadFlow.summary.diversifiedCurrent = diversifiedCurrent;
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate diversity factors table for report
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Diversity factors report section
 */
function generateDiversityFactorsReport(buses) {
    let report = `${'='.repeat(100)}
DIVERSITY FACTORS ANALYSIS (IEEE 141-1993 Table 3-5)
${'='.repeat(100)}

`;

    // Filter buses with diversity data
    const busesWithDiversity = buses.filter(b => 
        b.results?.loadFlow?.diversitySummary
    );

    if (busesWithDiversity.length === 0) {
        report += 'No diversity factor data available.\n\n';
        return report;
    }

    report += `Buses Analyzed: ${busesWithDiversity.length}\n\n`;

    // Summary by motor count
    report += `MOTOR GROUP DIVERSITY FACTORS (IEEE 141-1993):\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `${'Motor Group'.padEnd(25)}${'Diversity Factor'.padEnd(20)}${'Buses in Group'.padEnd(20)}\n`;
    report += `${'-'.repeat(100)}\n`;

    const motorGroups = {
        'Single Motor (1)':    { df: 1.00, buses: [] },
        '2 Motors':            { df: 1.05, buses: [] },
        '3 Motors':            { df: 1.10, buses: [] },
        '4 Motors':            { df: 1.15, buses: [] },
        '5 Motors':            { df: 1.18, buses: [] },
        'Group (6-10)':        { df: 1.25, buses: [] },
        'Group (11-15)':       { df: 1.30, buses: [] },
        'Large Group (>15)':   { df: 1.35, buses: [] }
    };

    busesWithDiversity.forEach(bus => {
        const motorCount = bus.results.loadFlow.diversitySummary.motorCount;
        if (motorCount <= 1) {
            motorGroups['Single Motor (1)'].buses.push(bus);
        } else if (motorCount === 2) {
            motorGroups['2 Motors'].buses.push(bus);
        } else if (motorCount === 3) {
            motorGroups['3 Motors'].buses.push(bus);
        } else if (motorCount === 4) {
            motorGroups['4 Motors'].buses.push(bus);
        } else if (motorCount === 5) {
            motorGroups['5 Motors'].buses.push(bus);
        } else if (motorCount <= 10) {
            motorGroups['Group (6-10)'].buses.push(bus);
        } else if (motorCount <= 15) {
            motorGroups['Group (11-15)'].buses.push(bus);
        } else {
            motorGroups['Large Group (>15)'].buses.push(bus);
        }
    });

    Object.keys(motorGroups).forEach(groupName => {
        const group = motorGroups[groupName];
        if (group.buses.length > 0) {
            report += `${groupName.padEnd(25)}${group.df.toFixed(2).padEnd(20)}${group.buses.length.toString().padEnd(20)}\n`;
        }
    });

    report += `\n`;

    // Detailed bus-level diversity table
    report += `DETAILED BUS-LEVEL DIVERSITY FACTORS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `${'Bus'.padEnd(25)}${'Motors'.padEnd(12)}${'DF'.padEnd(10)}${'Connected(A)'.padEnd(15)}${'Diversified(A)'.padEnd(18)}\n`;
    report += `${'-'.repeat(100)}\n`;

    busesWithDiversity.forEach(bus => {
        const summary = bus.results.loadFlow.diversitySummary;
        const motorCount = summary.motorCount;
        const df = summary.diversityFactor;
        const connected = bus.results.loadFlow.summary?.totalCurrent || 0;
        const diversified = bus.results.loadFlow.summary?.diversifiedCurrent || connected / df;

        report += `${bus.name.padEnd(25)}${motorCount.toString().padEnd(12)}${df.toFixed(2).padEnd(10)}${connected.toFixed(2).padEnd(15)}${diversified.toFixed(2).padEnd(18)}\n`;
    });

    report += `\n`;

    // System totals
    const totalConnected = busesWithDiversity.reduce((sum, b) => 
        sum + (b.results.loadFlow.summary?.totalCurrent || 0), 0);
    const totalDiversified = busesWithDiversity.reduce((sum, b) => 
        sum + (b.results.loadFlow.summary?.diversifiedCurrent || 0), 0);
    const avgDF = totalConnected > 0 ? totalConnected / totalDiversified : 1.00;

    report += `SYSTEM TOTALS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Connected Load: ${totalConnected.toFixed(2)} A\n`;
    report += `Total Diversified Load: ${totalDiversified.toFixed(2)} A\n`;
    report += `Average System Diversity Factor: ${avgDF.toFixed(2)}\n`;
    report += `Load Reduction: ${((totalConnected - totalDiversified) / totalConnected * 100).toFixed(1)}%\n`;
    report += `\n`;

    // Standards reference
    report += `STANDARDS REFERENCE:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `IEEE 141-1993 (Red Book) Table 3-5:\n`;
    report += `  • Single motor (1): DF = 1.00 (no diversity)\n`;
    report += `  • 2 motors: DF = 1.05\n`;
    report += `  • 3 motors: DF = 1.10\n`;
    report += `  • 4 motors: DF = 1.15\n`;
    report += `  • 5 motors: DF = 1.18\n`;
    report += `  • 6-10 motors: DF = 1.25\n`;
    report += `  • 11-15 motors: DF = 1.30\n`;
    report += `  • >15 motors: DF = 1.35\n`;
    report += `\n`;
    report += `Composite diversity weighted by kVA contribution:\n`;
    report += `  DF_composite = (DF_motor × Motor_kVA + DF_other × Other_kVA) / Total_kVA\n`;
    report += `\n`;

    return report;
}

/**
 * Generate diversity factor breakdown for a specific bus
 * 
 * @param {Object} bus - Bus object
 * @returns {String} Bus diversity breakdown
 */
function generateBusDiversityBreakdown(bus) {
    const summary = bus.results?.loadFlow?.diversitySummary;
    
    if (!summary) {
        return `No diversity data available for bus ${bus.name}\n`;
    }

    let report = `DIVERSITY FACTOR BREAKDOWN: ${bus.name}\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Composite Diversity Factor: ${summary.diversityFactor.toFixed(2)}\n\n`;

    report += `${'Category'.padEnd(20)}${'Count'.padEnd(12)}${'kVA'.padEnd(15)}${'DF'.padEnd(10)}${'Weight'.padEnd(15)}\n`;
    report += `${'-'.repeat(100)}\n`;

    summary.breakdown.forEach(item => {
        const weight = (item.weight * 100).toFixed(1) + '%';
        report += `${item.category.padEnd(20)}${item.count.toString().padEnd(12)}${item.kva.toFixed(2).padEnd(15)}${item.diversityFactor.toFixed(2).padEnd(10)}${weight.padEnd(15)}\n`;
    });

    report += `${'-'.repeat(100)}\n`;
    report += `Total: ${summary.totalKVA.toFixed(2)} kVA\n\n`;

    return report;
}

console.log('✅ Enhanced Diversity Factors Module loaded successfully');
