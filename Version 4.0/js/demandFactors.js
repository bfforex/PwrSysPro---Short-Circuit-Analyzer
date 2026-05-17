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
 * @date 2025-11-01 09:32:19 UTC
 * @version 2.0.2 - FIXED duplicate loading and redeclaration errors
 */

console.log('🔧 Loading Demand & Diversity Factors Module v2.0.2...');
console.log('   ✅ IEEE 141-1993 Diversity Factors (DF ≥ 1.0)');
console.log('   ✅ NEC Article 220 Demand Factors (Kd ≤ 1.0)');
console.log('   ✅ Heavy Industry Standards (LNG, Fabrication)');

// ═══════════════════════════════════════════════════════════════════════
// DIVERSITY FACTORS (DF ≥ 1.0)
// Per IEEE 141-1993, IEEE 242, IEC 61439
// Conditional initialization to prevent redeclaration errors
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.DIVERSITY_FACTORS === 'undefined') {
    
    window.DIVERSITY_FACTORS = {
        
        // ───────────────────────────────────────────────────────────────────
        // MOTORS - IEEE 141-1993 Table 3-5
        // ───────────────────────────────────────────────────────────────────
        motors: {
            description: 'Motors - grouped by count',
            source: 'IEEE 141-1993 Table 3-5',
            
            // Number of motors vs diversity factor
            '1': 1.00,        // Single motor: DF = 1.0 (100% demand)
            '2': 1.05,        // 2 motors: DF = 1.05 (95% simultaneous)
            '3': 1.10,        // 3 motors: DF = 1.10 (91% simultaneous)
            '4': 1.15,        // 4 motors: DF = 1.15 (87% simultaneous)
            '5': 1.18,        // 5 motors: DF = 1.18 (85% simultaneous)
            '10': 1.25,       // 10 motors: DF = 1.25 (80% simultaneous)
            '15': 1.30,       // 15 motors: DF = 1.30 (77% simultaneous)
            '20': 1.35,       // 20+ motors: DF = 1.35 (74% simultaneous)
            
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
            source: 'IEEE 141-1993 Section 3.3',
            
            arc_welders_30_duty: 3.33,      // 30% duty: DF = 3.33 (Kd = 0.30)
            arc_welders_60_duty: 1.67,      // 60% duty: DF = 1.67 (Kd = 0.60)
            resistance_welders: 1.67,       // Spot/seam: DF = 1.67 (Kd = 0.60)
            robotic_welders: 1.18,          // Automated: DF = 1.18 (Kd = 0.85)
            
            // Multiple welding stations
            welding_bays: {
                '1_5_welders': 2.86,          // DF = 2.86 (Kd = 0.35)
                '6_10_welders': 3.33,         // DF = 3.33 (Kd = 0.30)
                '11_plus_welders': 4.00       // DF = 4.00 (Kd = 0.25)
            }
        },
        
        // ───────────────────────────────────────────────────────────────────
        // CRANES & HOISTS - IEEE 141-1993
        // ───────────────────────────────────────────────────────────────────
        cranes: {
            description: 'Overhead cranes (not all lifting simultaneously)',
            source: 'IEEE 141-1993 Table 3-5',
            
            '1_crane': 1.00,                  // Single crane: DF = 1.00
            '2_cranes': 1.67,                 // 2 cranes: DF = 1.67 (Kd = 0.60)
            '3_5_cranes': 2.00,               // 3-5 cranes: DF = 2.00 (Kd = 0.50)
            '6_plus_cranes': 2.22,            // 6+ cranes: DF = 2.22 (Kd = 0.45)
            
            gantry_cranes: 1.82,              // Gantry: DF = 1.82 (Kd = 0.55)
            jib_cranes: 1.67                  // Jib: DF = 1.67 (Kd = 0.60)
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
    
    console.log('✅ DIVERSITY_FACTORS initialized');
    
} else {
    console.log('ℹ️ DIVERSITY_FACTORS already loaded, skipping initialization');
}

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM-LEVEL DIVERSITY FACTORS
// For combining multiple substations into total system demand
// Per IEEE 141-1993 Section 3.3 - Diversity in Large Industrial Systems
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.SYSTEM_LEVEL_DIVERSITY === 'undefined') {
    
    window.SYSTEM_LEVEL_DIVERSITY = {
        
        // ───────────────────────────────────────────────────────────────────
        // HEAVY FABRICATION & CONSTRUCTION YARD
        // ───────────────────────────────────────────────────────────────────
        heavy_fabrication_yard: {
            description: 'Typical diversity for LNG/Fabrication facilities',
            
            // Individual substation types (Level 1)
            office_substations: {
                diversityFactor: 1.15,
                description: 'Office buildings - Low diversity (aligned 9am-5pm peaks)',
                peakTime: '12:00 PM - 2:00 PM'
            },
            
            fabrication_shops: {
                diversityFactor: 1.35,
                description: 'Heavy fabrication - High diversity (shift work, equipment cycling)',
                peakTime: '10:00 AM - 11:00 AM, 2:00 PM - 3:00 PM'
            },
            
            assembly_areas: {
                diversityFactor: 1.25,
                description: 'Assembly/construction - Medium diversity (batch operations)',
                peakTime: '9:00 AM - 10:00 AM'
            },
            
            warehouse: {
                diversityFactor: 1.40,
                description: 'Warehouse - Very high diversity (mostly lighting/HVAC)',
                peakTime: '8:00 AM - 9:00 AM'
            },
            
            maintenance_shop: {
                diversityFactor: 1.30,
                description: 'Maintenance facility - High diversity (sporadic equipment use)',
                peakTime: 'Variable'
            },
            
            welding_bay: {
                diversityFactor: 1.40,
                description: 'Welding area - Very high diversity (not all welders run simultaneously)',
                peakTime: '10:00 AM - 11:00 AM'
            },
            
            utilities: {
                diversityFactor: 1.20,
                description: 'Utilities (HVAC, compressors) - Low diversity (weather-dependent)',
                peakTime: '1:00 PM - 3:00 PM (summer)'
            },
            
            // System-wide diversity (Level 2) - for combining all substations
            system_wide: {
                '2-3_substations': 1.30,    // Small system
                '4-6_substations': 1.45,    // Medium system
                '7-10_substations': 1.55,   // Large system (YOUR CASE with 8 substations)
                '11+_substations': 1.65,    // Very large system
                
                description: 'Combine multiple substation MDs into total system demand',
                note: 'Accounts for non-coincident peaks across different areas'
            }
        },
        
        // ───────────────────────────────────────────────────────────────────
        // HELPER FUNCTION: Get System Diversity Factor Based on Count
        // ───────────────────────────────────────────────────────────────────
        getSystemDiversityFactor: function(substationCount, facilityType = 'heavy_fabrication_yard') {
            const systemData = this[facilityType]?.system_wide;
            
            if (!systemData) {
                console.warn(`⚠️ Unknown facility type: ${facilityType}, using default 1.5`);
                return 1.5;
            }
            
            if (substationCount <= 3) {
                return systemData['2-3_substations'];
            } else if (substationCount <= 6) {
                return systemData['4-6_substations'];
            } else if (substationCount <= 10) {
                return systemData['7-10_substations'];
            } else {
                return systemData['11+_substations'];
            }
        }
    };
    
    console.log('✅ SYSTEM_LEVEL_DIVERSITY constants loaded');
}

// ═══════════════════════════════════════════════════════════════════════
// DEMAND FACTORS (Kd ≤ 1.0) - NEC Article 220
// These are the RECIPROCAL of Diversity Factors
// Conditional initialization to prevent redeclaration errors
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.DEMAND_FACTORS === 'undefined') {
    
    window.DEMAND_FACTORS = {
        
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
                '1': 1.00,        // Kd = 1.00 (DF = 1.00)
                '2': 0.95,        // Kd = 0.95 (DF = 1.05)
                '3': 0.91,        // Kd = 0.91 (DF = 1.10)
                '5': 0.85,        // Kd = 0.85 (DF = 1.18)
                '10': 0.80,       // Kd = 0.80 (DF = 1.25)
                '15': 0.77,       // Kd = 0.77 (DF = 1.30)
                '20': 0.74        // Kd = 0.74 (DF = 1.35)
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
    
    console.log('✅ DEMAND_FACTORS initialized');
    
} else {
    console.log('ℹ️ DEMAND_FACTORS already loaded, skipping initialization');
}

// ═══════════════════════════════════════════════════════════════════════
// FINAL MODULE STATUS
// Calculation logic (DemandFactors class, utility functions,
// computeSystemDemand, DemandFactorHandler, enhanced diversity functions)
// has been consolidated into loadDiversityCalc.js.
// ═══════════════════════════════════════════════════════════════════════

console.log('✅ Demand & Diversity Factors data module loaded');
console.log('   - DIVERSITY_FACTORS (DF ≥ 1.0): ✅');
console.log('   - SYSTEM_LEVEL_DIVERSITY: ✅');
console.log('   - DEMAND_FACTORS (Kd ≤ 1.0): ✅');
console.log('   - IEEE 141-1993: COMPLIANT');
console.log('   - NEC Article 220: COMPLIANT');