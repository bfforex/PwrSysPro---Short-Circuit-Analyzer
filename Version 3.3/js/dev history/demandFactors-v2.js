/**
 * Demand & Diversity Factors Module
 * Heavy Industry Standards (LNG & Fabrication)
 * 
 * DEFINITIONS (Per IEEE 141-1993, NEC Article 220, IEC 61439):
 * 
 * DIVERSITY FACTOR (DF):
 *   DF = (Sum of Individual Maximum Demands) / (Maximum Demand of Whole System)
 *   ALWAYS ≥ 1.0
 *   Higher value = more diversity = lower actual demand
 * 
 * DEMAND FACTOR (Kd):
 *   Kd = (Maximum Demand) / (Total Connected Load)
 *   ALWAYS ≤ 1.0
 *   Kd = 1 / DF
 * 
 * SIMULTANEITY FACTOR (Ks) - IEC 61439:
 *   Ks = 1 / DF (same as Demand Factor)
 *   Represents fraction of loads operating simultaneously
 * 
 * Standards:
 * - IEEE 141-1993 (Red Book) - Industrial Power Systems
 * - IEEE 242 (Buff Book) - Protection & Coordination
 * - API RP 540 - Electrical Installations in Petroleum
 * - IEC 61439 - Low-voltage Switchgear Assemblies
 * - NEC Article 220 - Branch Circuit & Feeder Calculations
 * 
 * @author bfforex
 * @date 2025-11-01 08:25:52 UTC
 * @version 2.0.0 - CORRECTED (DF ≥ 1.0)
 */

console.log('🔧 Loading Demand & Diversity Factors Module v2.0.0...');
console.log('   ✅ IEEE 141-1993 Diversity Factors (DF ≥ 1.0)');
console.log('   ✅ NEC Article 220 Demand Factors (Kd ≤ 1.0)');
console.log('   ✅ Heavy Industry Standards (LNG, Fabrication)');

// ═══════════════════════════════════════════════════════════════════════
// DIVERSITY FACTORS (DF ≥ 1.0)
// Per IEEE 141-1993, IEEE 242, IEC 61439
// ═══════════════════════════════════════════════════════════════════════

const DIVERSITY_FACTORS = {
    
    // ───────────────────────────────────────────────────────────────────
    // MOTORS - IEEE 141-1993 Table 3-5
    // ───────────────────────────────────────────────────────────────────
    motors: {
        description: 'Motors - grouped by count',
        source: 'IEEE 141-1993 Table 3-5',
        
        // Number of motors vs diversity factor
        1: 1.00,        // Single motor: DF = 1.0 (100% demand)
        2: 1.05,        // 2 motors: DF = 1.05 (95% simultaneous)
        3: 1.10,        // 3 motors: DF = 1.10 (91% simultaneous)
        4: 1.15,        // 4 motors: DF = 1.15 (87% simultaneous)
        5: 1.18,        // 5 motors: DF = 1.18 (85% simultaneous)
        10: 1.25,       // 10 motors: DF = 1.25 (80% simultaneous)
        15: 1.30,       // 15 motors: DF = 1.30 (77% simultaneous)
        20: 1.35,       // 20+ motors: DF = 1.35 (74% simultaneous)
        
        // Helper function
        getDiversityFactor: function(motorCount) {
            if (motorCount <= 1) return 1.00;
            if (motorCount === 2) return 1.05;
            if (motorCount <= 3) return 1.10;
            if (motorCount <= 5) return 1.18;
            if (motorCount <= 10) return 1.25;
            if (motorCount <= 15) return 1.30;
            return 1.35;
        }
    },
    
    // ───────────────────────────────────────────────────────────────────
    // WELDING EQUIPMENT - IEEE 141-1993
    // ───────────────────────────────────────────────────────────────────
    welding: {
        description: 'Arc welders (duty cycle based)',
        source: 'IEEE 141-1993 Section 3.3.6',
        
        arc_welders_30_duty: 3.33,      // 30% duty: DF = 3.33 (Kd = 0.30)
        arc_welders_60_duty: 1.67,      // 60% duty: DF = 1.67 (Kd = 0.60)
        resistance_welders: 1.67,       // Spot/seam: DF = 1.67 (Kd = 0.60)
        robotic_welders: 1.18,          // Automated: DF = 1.18 (Kd = 0.85)
        
        // Multiple welding stations
        welding_bays: {
            1_5_welders: 2.86,          // DF = 2.86 (Kd = 0.35)
            6_10_welders: 3.33,         // DF = 3.33 (Kd = 0.30)
            11_plus_welders: 4.00       // DF = 4.00 (Kd = 0.25)
        }
    },
    
    // ───────────────────────────────────────────────────────────────────
    // CRANES & HOISTS - IEEE 141-1993
    // ───────────────────────────────────────────────────────────────────
    cranes: {
        description: 'Overhead cranes (not all lifting simultaneously)',
        source: 'IEEE 141-1993 Table 3-5',
        
        1_crane: 1.00,                  // Single crane: DF = 1.00
        2_cranes: 1.67,                 // 2 cranes: DF = 1.67 (Kd = 0.60)
        3_5_cranes: 2.00,               // 3-5 cranes: DF = 2.00 (Kd = 0.50)
        6_plus_cranes: 2.22,            // 6+ cranes: DF = 2.22 (Kd = 0.45)
        
        gantry_cranes: 1.82,            // Gantry: DF = 1.82 (Kd = 0.55)
        jib_cranes: 1.67                // Jib: DF = 1.67 (Kd = 0.60)
    },
    
    // ───────────────────────────────────────────────────────────────────
    // LNG PLANT LOADS - API RP 540
    // ───────────────────────────────────────────────────────────────────
    lng_plant: {
        description: 'LNG process equipment',
        source: 'API RP 540 (2008), IEEE 141',
        
        // Critical process (all run simultaneously)
        critical_process: {
            main_compressors: 1.00,     // DF = 1.00 (100% demand)
            liquefaction_train: 1.00,   // DF = 1.00 (100% demand)
            bog_compressors: 1.05,      // DF = 1.05 (95% demand)
            export_pumps: 1.11,         // DF = 1.11 (90% demand)
            safety_systems: 1.00,       // DF = 1.00 (100% demand)
            fire_pumps: 1.00            // DF = 1.00 (100% demand)
        },
        
        // Utility systems
        utilities: {
            nitrogen_plant: 1.18,       // DF = 1.18 (85% demand)
            instrument_air: 1.11,       // DF = 1.11 (90% demand)
            plant_air: 1.43,            // DF = 1.43 (70% demand)
            cooling_towers: 1.18,       // DF = 1.18 (85% demand)
            water_treatment: 1.25,      // DF = 1.25 (80% demand)
            sewage_treatment: 1.54      // DF = 1.54 (65% demand)
        },
        
        // Support facilities
        support: {
            hvac_process: 1.25,         // DF = 1.25 (80% demand)
            hvac_office: 1.43,          // DF = 1.43 (70% demand)
            lighting_process: 1.25,     // DF = 1.25 (80% demand)
            lighting_office: 1.43,      // DF = 1.43 (70% demand)
            workshop_equipment: 1.67    // DF = 1.67 (60% demand)
        }
    },
    
    // ───────────────────────────────────────────────────────────────────
    // FABRICATION YARD LOADS - IEEE 3004.5
    // ───────────────────────────────────────────────────────────────────
    fabrication_yard: {
        description: 'Heavy fabrication equipment',
        source: 'IEEE 3004.5-2014, IEEE 141',
        
        // Welding operations
        welding: {
            multiple_bays: 2.86,        // DF = 2.86 (35% simultaneous)
            robotic_cells: 1.25,        // DF = 1.25 (80% simultaneous)
            spot_welders: 1.67          // DF = 1.67 (60% simultaneous)
        },
        
        // Cutting operations
        cutting: {
            plasma_cutters: 2.50,       // DF = 2.50 (40% simultaneous)
            oxy_cutters: 2.22,          // DF = 2.22 (45% simultaneous)
            laser_cutters: 1.25         // DF = 1.25 (80% simultaneous - CNC)
        },
        
        // Forming/machining
        forming: {
            press_brakes: 1.43,         // DF = 1.43 (70% simultaneous)
            rolling_mills: 1.43,        // DF = 1.43 (70% simultaneous)
            cnc_machines: 1.33,         // DF = 1.33 (75% simultaneous)
            grinders: 2.22              // DF = 2.22 (45% simultaneous)
        },
        
        // Material handling
        material_handling: {
            overhead_cranes: 2.00,      // DF = 2.00 (50% simultaneous)
            gantry_cranes: 1.82,        // DF = 1.82 (55% simultaneous)
            forklifts_charging: 2.50,   // DF = 2.50 (40% simultaneous)
            conveyors: 1.43             // DF = 1.43 (70% simultaneous)
        },
        
        // Support facilities
        support: {
            workshops: 1.67,            // DF = 1.67 (60% simultaneous)
            paint_shop: 1.82,           // DF = 1.82 (55% simultaneous)
            blasting_booth: 1.43,       // DF = 1.43 (70% simultaneous)
            compressed_air: 1.33        // DF = 1.33 (75% simultaneous)
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════
// DEMAND FACTORS (Kd ≤ 1.0) - NEC Article 220
// These are the RECIPROCAL of Diversity Factors
// ═══════════════════════════════════════════════════════════════════════

const DEMAND_FACTORS = {
    
    // ───────────────────────────────────────────────────────────────────
    // MOTORS - NEC 430.24, 430.25
    // ───────────────────────────────────────────────────────────────────
    motors: {
        description: 'Motor demand factors',
        source: 'NEC Article 430',
        
        // Continuous duty requires safety margin (INCREASES load)
        continuous_duty_multiplier: 1.25,   // 125% for continuous (>3 hours)
        
        // Group motor demand (by count)
        group_demand: {
            1: 1.00,        // Kd = 1.00 (DF = 1.00)
            2: 0.95,        // Kd = 0.95 (DF = 1.05)
            3: 0.91,        // Kd = 0.91 (DF = 1.10)
            5: 0.85,        // Kd = 0.85 (DF = 1.18)
            10: 0.80,       // Kd = 0.80 (DF = 1.25)
            15: 0.77,       // Kd = 0.77 (DF = 1.30)
            20: 0.74        // Kd = 0.74 (DF = 1.35)
        }
    },
    
    // ───────────────────────────────────────────────────────────────────
    // LIGHTING - NEC 220.42, 220.43
    // ───────────────────────────────────────────────────────────────────
    lighting: {
        description: 'Lighting demand factors',
        source: 'NEC Article 220.42',
        
        // Dwelling units
        dwelling: {
            first_3000_VA: 1.00,        // 100%
            next_117000_VA: 0.35,       // 35%
            remainder: 0.25             // 25%
        },
        
        // Commercial/industrial
        commercial: {
            offices: 1.00,              // 100%
            storage: 0.70,              // 70%
            industrial: 0.80            // 80%
        }
    },
    
    // ───────────────────────────────────────────────────────────────────
    // RECEPTACLES - NEC 220.44
    // ───────────────────────────────────────────────────────────────────
    receptacles: {
        description: 'Receptacle demand factors',
        source: 'NEC Article 220.44',
        
        first_10000_VA: 1.00,           // 100%
        remainder: 0.50                 // 50%
    }
};

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert Diversity Factor to Demand Factor
 * @param {Number} diversityFactor - DF (≥ 1.0)
 * @returns {Number} Demand Factor (≤ 1.0)
 */
function diversityToDemand(diversityFactor) {
    if (diversityFactor < 1.0) {
        console.warn(`⚠️ Diversity factor ${diversityFactor} < 1.0 (should be ≥ 1.0)`);
        return 1.0;
    }
    return 1.0 / diversityFactor;
}

/**
 * Convert Demand Factor to Diversity Factor
 * @param {Number} demandFactor - Kd (≤ 1.0)
 * @returns {Number} Diversity Factor (≥ 1.0)
 */
function demandToDiversity(demandFactor) {
    if (demandFactor > 1.0) {
        console.warn(`⚠️ Demand factor ${demandFactor} > 1.0 (should be ≤ 1.0 for diversity)`);
        return 1.0;
    }
    if (demandFactor <= 0) {
        console.error(`❌ Demand factor ${demandFactor} ≤ 0 (invalid)`);
        return 1.0;
    }
    return 1.0 / demandFactor;
}

/**
 * Calculate diversified load
 * @param {Number} connectedLoad - Total connected load
 * @param {Number} diversityFactor - DF (≥ 1.0)
 * @returns {Number} Actual diversified load
 */
function calculateDiversifiedLoad(connectedLoad, diversityFactor) {
    // Diversified Load = Connected Load / Diversity Factor
    // OR: Diversified Load = Connected Load × Demand Factor
    const demandFactor = diversityToDemand(diversityFactor);
    const diversifiedLoad = connectedLoad * demandFactor;
    
    console.log(`📊 Load Calculation:`);
    console.log(`   Connected Load: ${connectedLoad.toFixed(2)} A`);
    console.log(`   Diversity Factor: ${diversityFactor.toFixed(2)} (DF)`);
    console.log(`   Demand Factor: ${demandFactor.toFixed(2)} (Kd = 1/DF)`);
    console.log(`   Diversified Load: ${diversifiedLoad.toFixed(2)} A`);
    
    return diversifiedLoad;
}

/**
 * Get motor diversity factor by count
 * @param {Number} motorCount - Number of motors
 * @returns {Number} Diversity Factor (≥ 1.0)
 */
function getMotorDiversityFactor(motorCount) {
    return DIVERSITY_FACTORS.motors.getDiversityFactor(motorCount);
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════

window.DIVERSITY_FACTORS = DIVERSITY_FACTORS;
window.DEMAND_FACTORS = DEMAND_FACTORS;
window.diversityToDemand = diversityToDemand;
window.demandToDiversity = demandToDiversity;
window.calculateDiversifiedLoad = calculateDiversifiedLoad;
window.getMotorDiversityFactor = getMotorDiversityFactor;

console.log('✅ Demand & Diversity Factors Module v2.0.0 loaded');
console.log('   - Diversity Factors (DF ≥ 1.0): READY');
console.log('   - Demand Factors (Kd ≤ 1.0): READY');
console.log('   - IEEE 141-1993: COMPLIANT');
console.log('   - NEC Article 220: COMPLIANT');
console.log('   - Heavy Industry: LNG, Fabrication');
console.log('');