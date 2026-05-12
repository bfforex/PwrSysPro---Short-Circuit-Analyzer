/**
 * Protection Device Ratings and Selection Module
 * Recommends appropriate protection devices based on short circuit calculations
 * 
 * @author bfforex
 * @date 2025-11-02 14:08:04 UTC
 * @version 1.0.0
 * 
 * Standards Compliance:
 * - IEEE 141-1993 (Red Book) - Section 5.5: Protection Device Selection
 * - IEEE 242-2001 (Buff Book) - Protection and Coordination
 * - NEC Article 110.9 - Interrupting Rating
 * - NEC Article 110.10 - Circuit Impedance and Short-Circuit Ratings
 * - NEC Article 110.24 - Available Fault Current
 * - NEC Article 230.95 - Ground-Fault Protection
 * - ANSI C37.010 - AC High-Voltage Circuit Breakers
 * - IEC 60947 - Low-voltage switchgear and controlgear
 */

console.log('🔧 Loading Protection Device Ratings Module v1.0.0...');

// ════════════════════════════════════════════════════════════════════════════════
// STANDARD BREAKER RATINGS DATABASE
// Per ANSI/IEEE/IEC Standards
// ════════════════════════════════════════════════════════════════════════════════

const STANDARD_BREAKER_RATINGS = {
    // Low Voltage (≤600V) - ANSI/UL Standards
    lowVoltage: {
        ratings_kA: [10, 14, 18, 22, 25, 30, 35, 42, 50, 65, 85, 100, 125, 150, 200],
        frames_A: [100, 125, 150, 175, 200, 225, 250, 400, 600, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000],
        types: ['MCCB', 'ICCB', 'LVPCB'],
        voltages: [240, 277, 480, 600]
    },
    
    // Medium Voltage (>600V to 15kV) - ANSI C37 Standards
    mediumVoltage: {
        ratings_kA: [25, 31.5, 40, 50, 63, 80, 100, 125],
        voltages: [2400, 4160, 4800, 7200, 13200, 13800, 14400],
        types: ['VCB', 'SF6', 'Vacuum']
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// MANUFACTURER DATABASE
// Major manufacturers with typical product lines and cost ranges
// ════════════════════════════════════════════════════════════════════════════════

const MANUFACTURER_DATA = {
    // ABB - Swiss/Swedish multinational
    ABB: {
        name: 'ABB',
        country: 'Switzerland/Sweden',
        lowVoltage: {
            series: [
                {
                    name: 'Tmax XT',
                    type: 'MCCB',
                    ratings_kA: [25, 36, 50, 65, 85, 100, 150],
                    frames_A: [160, 250, 320, 400, 630, 800, 1000, 1250, 1600],
                    voltage: 690,
                    costTier: 'premium',
                    features: ['Electronic trip', 'Communication ready', 'High breaking capacity']
                },
                {
                    name: 'Emax 2',
                    type: 'LVPCB',
                    ratings_kA: [42, 50, 65, 85, 100, 120, 150],
                    frames_A: [800, 1000, 1600, 2000, 3200, 4000, 6300],
                    voltage: 690,
                    costTier: 'premium',
                    features: ['Air circuit breaker', 'Ekip electronic trip units', 'Drawout/Fixed']
                }
            ]
        },
        mediumVoltage: {
            series: [
                {
                    name: 'VD4',
                    type: 'VCB',
                    ratings_kA: [25, 31.5, 40, 50, 63],
                    voltages: [4160, 7200, 13200, 13800],
                    costTier: 'premium',
                    features: ['Vacuum circuit breaker', 'Long life', 'Low maintenance']
                }
            ]
        }
    },
    
    // Schneider Electric - French multinational
    SchneiderElectric: {
        name: 'Schneider Electric',
        country: 'France',
        lowVoltage: {
            series: [
                {
                    name: 'ComPacT NSX',
                    type: 'MCCB',
                    ratings_kA: [25, 36, 50, 70, 85, 100, 150],
                    frames_A: [100, 160, 250, 400, 630],
                    voltage: 690,
                    costTier: 'mid-range',
                    features: ['Micrologic trip units', 'Modular', 'IoT ready']
                },
                {
                    name: 'Masterpact MTZ',
                    type: 'LVPCB',
                    ratings_kA: [42, 65, 85, 100, 130, 150],
                    frames_A: [800, 1000, 1600, 2000, 2500, 3200, 4000, 5000, 6300],
                    voltage: 690,
                    costTier: 'mid-range',
                    features: ['Air circuit breaker', 'Micrologic X', 'EcoStruxure ready']
                }
            ]
        },
        mediumVoltage: {
            series: [
                {
                    name: 'SM6',
                    type: 'SF6',
                    ratings_kA: [20, 25, 31.5],
                    voltages: [7200, 13200, 13800],
                    costTier: 'mid-range',
                    features: ['SF6 gas insulated', 'Compact', 'Modular']
                }
            ]
        }
    },
    
    // Eaton - American/Irish multinational
    Eaton: {
        name: 'Eaton',
        country: 'USA/Ireland',
        lowVoltage: {
            series: [
                {
                    name: 'Series G',
                    type: 'MCCB',
                    ratings_kA: [18, 25, 35, 42, 50, 65, 100, 150, 200],
                    frames_A: [125, 250, 400, 600, 800, 1200, 1600, 2000],
                    voltage: 600,
                    costTier: 'budget',
                    features: ['Thermal-magnetic', 'Electronic', 'UL listed']
                },
                {
                    name: 'Magnum DS',
                    type: 'LVPCB',
                    ratings_kA: [65, 85, 100, 150, 200],
                    frames_A: [800, 1600, 2000, 3000, 4000, 5000, 6000],
                    voltage: 635,
                    costTier: 'budget',
                    features: ['Digitrip RMS', 'Low profile', 'High efficiency']
                }
            ]
        },
        mediumVoltage: {
            series: [
                {
                    name: 'VCP-W',
                    type: 'VCB',
                    ratings_kA: [25, 31.5, 40, 50, 63],
                    voltages: [4160, 7200, 13200, 13800],
                    costTier: 'mid-range',
                    features: ['Vacuum interrupter', 'Metal-clad', 'Type tested']
                }
            ]
        }
    },
    
    // Siemens - German multinational
    Siemens: {
        name: 'Siemens',
        country: 'Germany',
        lowVoltage: {
            series: [
                {
                    name: '3VA Molded Case',
                    type: 'MCCB',
                    ratings_kA: [25, 36, 50, 70, 100, 130],
                    frames_A: [160, 250, 400, 630, 800, 1000, 1600],
                    voltage: 690,
                    costTier: 'premium',
                    features: ['ETU electronic', 'Communication capable', 'High performance']
                },
                {
                    name: '3WL Air Circuit Breaker',
                    type: 'LVPCB',
                    ratings_kA: [50, 65, 85, 100, 120, 150],
                    frames_A: [800, 1000, 1600, 2000, 3200, 4000, 6300],
                    voltage: 690,
                    costTier: 'premium',
                    features: ['ETU electronic trip', 'Energy meters', 'SENTRON']
                }
            ]
        },
        mediumVoltage: {
            series: [
                {
                    name: '3AH Vacuum',
                    type: 'VCB',
                    ratings_kA: [25, 31.5, 40, 50],
                    voltages: [4160, 7200, 13200, 13800],
                    costTier: 'premium',
                    features: ['Vacuum technology', 'Long life contacts', 'Type tested']
                }
            ]
        }
    },
    
    // LS Electric (formerly LG Industrial Systems) - South Korean
    LSElectric: {
        name: 'LS Electric Co.',
        country: 'South Korea',
        lowVoltage: {
            series: [
                {
                    name: 'Susol MCCB',
                    type: 'MCCB',
                    ratings_kA: [25, 35, 50, 65, 85, 100],
                    frames_A: [100, 125, 160, 250, 400, 630, 800, 1000, 1600],
                    voltage: 690,
                    costTier: 'budget',
                    features: ['Economic', 'Reliable', 'IEC certified']
                },
                {
                    name: 'AMAX ACB',
                    type: 'LVPCB',
                    ratings_kA: [42, 50, 65, 85, 100],
                    frames_A: [800, 1000, 1600, 2000, 3200, 4000, 6300],
                    voltage: 690,
                    costTier: 'budget',
                    features: ['Air circuit breaker', 'Digital trip', 'Cost effective']
                }
            ]
        },
        mediumVoltage: {
            series: [
                {
                    name: 'GNV Vacuum',
                    type: 'VCB',
                    ratings_kA: [25, 31.5, 40, 50],
                    voltages: [4160, 7200, 13200, 13800],
                    costTier: 'budget',
                    features: ['Vacuum circuit breaker', 'Economical', 'Korean engineering']
                }
            ]
        }
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// FUSE RATINGS DATABASE
// Per NEC Article 240 and UL Standards
// ════════════════════════════════════════════════════════════════════════════════

const STANDARD_FUSE_RATINGS = {
    classes: {
        'Class J': {
            interrupting_kA: 200,
            voltage: 600,
            currentRange_A: [0.5, 600],
            features: ['Current limiting', 'Fast acting', 'UL listed'],
            applications: ['Motor circuits', 'Feeder protection']
        },
        'Class L': {
            interrupting_kA: 200,
            voltage: 600,
            currentRange_A: [601, 6000],
            features: ['Current limiting', 'Time delay', 'Bolt-on'],
            applications: ['Large feeders', 'Service entrance']
        },
        'Class RK1': {
            interrupting_kA: 200,
            voltage: 600,
            currentRange_A: [0.5, 600],
            features: ['Current limiting', 'Dual element', 'Time delay'],
            applications: ['Motor circuits', 'Transformer protection']
        },
        'Class RK5': {
            interrupting_kA: 200,
            voltage: 600,
            currentRange_A: [0.5, 600],
            features: ['Standard', 'Time delay', 'Economic'],
            applications: ['General purpose', 'Lighting circuits']
        },
        'Class T': {
            interrupting_kA: 200,
            voltage: 600,
            currentRange_A: [0.5, 1200],
            features: ['Very fast', 'Current limiting', 'Compact'],
            applications: ['Semiconductor protection', 'Motor control']
        }
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// RELAY SETTINGS DATABASE
// Per IEEE C37.2 Device Functions
// ════════════════════════════════════════════════════════════════════════════════

const RELAY_FUNCTIONS = {
    '50': {
        name: 'Instantaneous Overcurrent',
        purpose: 'Fast fault clearing',
        settingGuideline: '1.25 to 1.5× maximum fault current',
        coordination: 'Set above downstream device maximum clearing'
    },
    '51': {
        name: 'Time Overcurrent',
        purpose: 'Overload and backup protection',
        settingGuideline: '1.05 to 1.25× maximum load current',
        coordination: 'Coordinate time-current curves with adjacent devices'
    },
    '50G': {
        name: 'Instantaneous Ground Fault',
        purpose: 'Fast ground fault clearing',
        settingGuideline: '1.1 to 1.3× maximum ground fault',
        coordination: 'Per NEC 230.95 for services'
    },
    '51G': {
        name: 'Time Ground Fault',
        purpose: 'Ground fault backup',
        settingGuideline: '0.1 to 0.5× phase pickup',
        coordination: 'Sensitive ground fault detection'
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// COST TIER DEFINITIONS
// Relative pricing for budget planning (not absolute prices)
// ════════════════════════════════════════════════════════════════════════════════

const COST_TIERS = {
    budget: {
        name: 'Budget-Friendly',
        multiplier: 1.0,
        description: 'Cost-effective solutions for standard applications',
        leadTime: '4-6 weeks',
        warranty: 'Standard (1-2 years)'
    },
    'mid-range': {
        name: 'Mid-Range',
        multiplier: 1.3,
        description: 'Balanced performance and cost',
        leadTime: '6-8 weeks',
        warranty: 'Extended (2-3 years)'
    },
    premium: {
        name: 'Premium',
        multiplier: 1.6,
        description: 'High-end features and performance',
        leadTime: '8-12 weeks',
        warranty: 'Premium (3-5 years)'
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: GENERATE PROTECTION DEVICE REQUIREMENTS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate comprehensive protection device requirements and recommendations
 *
 * Selects appropriate circuit breakers, fuses, and relay settings based on
 * calculated fault currents, bus voltage, and preferred cost tier.
 * Recommendations comply with NEC Article 110.9 (interrupting rating) and
 * ANSI C37 circuit breaker standards.
 *
 * STANDARDS:
 * - NEC 2017 Article 110.9 - Equipment interrupting ratings
 * - NEC 2017 Article 110.10 - Circuit impedance and short-circuit ratings
 * - NEC 2017 Article 110.24 - Available fault current marking
 * - ANSI/IEEE C37.010 - Application guide for AC high-voltage circuit breakers
 * - IEC 60947-2 - Low-voltage switchgear: circuit breakers
 *
 * DEVICE SELECTION CRITERIA:
 * - Interrupting rating: Must exceed asymmetrical fault current (kA rms)
 * - Frame rating: At least 125% of maximum load current (NEC 430.52)
 * - Bus bracing: Must withstand asymmetrical peak current (kA peak)
 *
 * ASYMMETRICAL MULTIPLYING FACTOR (ANSI C37.010):
 *   At X/R ≤ 4:  K_MF ≈ 1.0  (no correction needed for standard breakers)
 *   At X/R > 4:  K_MF from ANSI C37.010 Table 1; applied to I_sym
 *
 * @param {Object} scResults                         - Short-circuit results from calculateShortCircuit()
 * @param {string|null} [preferredManufacturer=null] - Preferred OEM; null = all manufacturers
 * @param {string} [costPreference='mid-range']      - Cost tier: 'budget' | 'mid-range' | 'premium'
 * @returns {string} Formatted protection device requirements report (plain text)
 *
 * @reference NEC 2017 Articles 110.9, 110.10, 110.24
 * @reference ANSI C37.010 "Application Guide for AC High-Voltage Circuit Breakers"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function generateProtectionSelectionRecommendations(scResults, preferredManufacturer = null, costPreference = 'mid-range') {
    // Extract key values
    const targetBus = scResults.path[scResults.path.length - 1]?.bus;
    const voltage = targetBus?.voltage || 480;
    const threePhaseSym = scResults.faultCurrents.threePhaseSym;
    const threePhaseAsym = scResults.faultCurrents.threePhaseAsym;
    const lineToGround = scResults.faultCurrents.lineToGround;
    const xrRatio = scResults.xrRatio;
    
    // Determine voltage class
    const voltageClass = voltage <= 600 ? 'lowVoltage' : 'mediumVoltage';
    
    let steps = '';
    
    // ══════════════════════════════════════════════════════════════════════════════
    // HEADER SECTION
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '\n' + '═'.repeat(80) + '\n';
    steps += 'PROTECTION DEVICE REQUIREMENTS & RECOMMENDATIONS\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📋 CALCULATED FAULT CURRENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Target Bus:              ${targetBus?.name || 'Unknown'}\n`;
    steps += `System Voltage:          ${voltage}V\n`;
    steps += `Symmetrical Fault:       ${threePhaseSym.toFixed(3)} kA\n`;
    steps += `Asymmetrical Peak:       ${threePhaseAsym.toFixed(3)} kA\n`;
    steps += `Line-to-Ground Fault:    ${lineToGround.toFixed(3)} kA\n`;
    steps += `X/R Ratio:               ${xrRatio.toFixed(2)}\n`;
    
    if (scResults.motorContribution && scResults.motorContribution.motorCount > 0) {
        steps += `Motor Contribution:      ${scResults.motorContribution.totalSymmetricalContribution.toFixed(3)} kA (${scResults.motorContribution.motorCount} motors)\n`;
        steps += `   ℹ️  Motor contribution included in ratings below\n`;
    }
    steps += '\n';
    
    // ══════════════════════════════════════════════════════════════════════════════
    // CIRCUIT BREAKER RECOMMENDATIONS
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateBreakerRecommendations(voltage, threePhaseSym, threePhaseAsym, voltageClass, preferredManufacturer, costPreference);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // FUSE RECOMMENDATIONS
    // ══════════════════════════════════════════════════════════════════════════════
    
    if (voltageClass === 'lowVoltage') {
        steps += generateFuseRecommendations(voltage, threePhaseSym);
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // RELAY SETTINGS
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateRelaySettings(threePhaseSym, lineToGround);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // EQUIPMENT WITHSTAND
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateWithstandRequirements(threePhaseAsym, threePhaseSym);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // COST COMPARISON
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateCostComparison(voltage, threePhaseSym, voltageClass);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STANDARDS COMPLIANCE CHECKLIST
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateComplianceChecklist(voltage, threePhaseSym);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // IMPORTANT NOTES
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += generateImportantNotes();
    
    return steps;
}

/**
 * Generate circuit breaker recommendations with manufacturer options
 */
function generateBreakerRecommendations(voltage, faultCurrent, asymCurrent, voltageClass, preferredMfr, costPref) {
    let steps = '';
    
    steps += `🔧 CIRCUIT BREAKER RECOMMENDATIONS (Per ANSI C37.010 & IEEE 141)\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    // Calculate required rating with safety margin
    const minRating = Math.ceil(faultCurrent * 1.25); // 25% safety margin per NEC 110.9
    const standardRatings = STANDARD_BREAKER_RATINGS[voltageClass].ratings_kA;
    const recommendedRating = standardRatings.find(r => r >= minRating) || standardRatings[standardRatings.length - 1];
    const safetyMargin = ((recommendedRating - faultCurrent) / faultCurrent * 100).toFixed(1);
    
    steps += `📊 MINIMUM REQUIREMENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Calculated Fault:        ${faultCurrent.toFixed(3)} kA (symmetrical)\n`;
    steps += `Minimum Rating Required: ${minRating} kA (125% of fault per NEC 110.9)\n`;
    steps += `Recommended Standard:    ${recommendedRating} kA @ ${voltage}V\n`;
    steps += `Safety Margin:           ${safetyMargin}% ${parseFloat(safetyMargin) >= 25 ? '✅ Good' : '⚠️  Marginal'}\n`;
    steps += `Momentary Rating:        ${(recommendedRating * 2.6).toFixed(1)} kA peak (2.6× for ${voltage}V)\n\n`;
    
    // Manufacturer recommendations
    steps += `🏭 MANUFACTURER RECOMMENDATIONS\n`;
    steps += '─'.repeat(80) + '\n\n';
    
    const manufacturers = preferredMfr ? 
        [preferredMfr] : 
        Object.keys(MANUFACTURER_DATA);
    
    manufacturers.forEach(mfr => {
        const mfrData = MANUFACTURER_DATA[mfr];
        if (!mfrData || !mfrData[voltageClass]) return;
        
        const series = mfrData[voltageClass].series;
        
        series.forEach(product => {
            // Find suitable rating
            const suitableRating = product.ratings_kA.find(r => r >= recommendedRating);
            if (!suitableRating) return;
            
            const tier = COST_TIERS[product.costTier];
            const costIndicator = product.costTier === costPref ? '💰 BEST VALUE' : '';
            
            steps += `${mfrData.name} - ${product.name} ${costIndicator}\n`;
            steps += `   Type:                ${product.type}\n`;
            steps += `   Interrupting Rating: ${suitableRating} kA @ ${product.voltage || product.voltages[0] || voltage}V\n`;
            
            // ✅ FIX: Check if frames_A exists (only for low voltage products)
            if (product.frames_A && Array.isArray(product.frames_A) && product.frames_A.length > 0) {
                steps += `   Available Frames:    ${product.frames_A.join('A, ')}A\n`;
            } else if (product.voltages && Array.isArray(product.voltages)) {
                steps += `   Voltage Ratings:     ${product.voltages.join('V, ')}V\n`;
            } else {
                steps += `   Frame/Rating:        Per manufacturer data sheet\n`;
            }
            
            steps += `   Cost Tier:           ${tier.name} (${tier.description})\n`;
            steps += `   Lead Time:           ${tier.leadTime}\n`;
            steps += `   Warranty:            ${tier.warranty}\n`;
            steps += `   Key Features:\n`;
            
            // ✅ FIX: Ensure features is an array before iterating
            if (product.features && Array.isArray(product.features)) {
                product.features.forEach(f => steps += `      • ${f}\n`);
            } else {
                steps += `      • Standard features\n`;
            }
            
            steps += `   Country of Origin:   ${mfrData.country}\n`;
            steps += `   Standards:           ${voltageClass === 'lowVoltage' ? 'UL, IEC 60947' : 'ANSI C37, IEC 62271'}\n\n`;
        });
    });
    
    // Frame size selection guidance
    steps += `📏 FRAME SIZE SELECTION GUIDANCE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Based on ${voltage}V system characteristics:\n\n`;
    
    if (voltageClass === 'lowVoltage') {
        steps += `Recommended Frame Sizes:\n`;
        steps += `   • 800A frame:   For loads 500-640A (consider load + 25% future)\n`;
        steps += `   • 1000A frame:  For loads 640-800A\n`;
        steps += `   • 1200A frame:  For loads 800-960A\n`;
        steps += `   • 1600A frame:  For loads 960-1280A\n\n`;
        steps += `Breaker Type Selection:\n`;
        steps += `   • MCCB (Molded Case):  Up to 1200A, compact, economical\n`;
        steps += `   • ICCB (Insulated Case): 800-2500A, enhanced features\n`;
        steps += `   • LVPCB (Power Breaker): 800-6300A, highest performance\n\n`;
    } else {
        steps += `Recommended Voltage Class:\n`;
        steps += `   • ${voltage}V nominal requires ${Math.ceil(voltage * 1.2)}V class breaker\n`;
        steps += `   • Type: ${voltage > 5000 ? 'Metal-clad switchgear' : 'Metal-enclosed switchgear'}\n`;
        steps += `   • Technology: Vacuum (VCB) or SF6 gas insulated\n\n`;
    }
    
    steps += `⚙️  TRIP UNIT RECOMMENDATIONS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `For ${faultCurrent.toFixed(1)} kA fault current:\n`;
    steps += `   • Electronic trip units recommended for:\n`;
    steps += `      - Precise coordination\n`;
    steps += `      - Communication/monitoring capability\n`;
    steps += `      - Ground fault protection\n`;
    steps += `      - Energy metering\n`;
    steps += `   • Thermal-magnetic acceptable for:\n`;
    steps += `      - Simple applications\n`;
    steps += `      - Budget constraints\n`;
    steps += `      - No monitoring requirements\n\n`;
    
    return steps;
}

/**
 * Generate fuse recommendations
 */
function generateFuseRecommendations(voltage, faultCurrent) {
    let steps = '';
    
    steps += `⚡ FUSE RECOMMENDATIONS (Per NEC Article 240)\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    const minRating = Math.ceil(faultCurrent * 1.33); // 33% margin for fuses
    
    steps += `📊 MINIMUM REQUIREMENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Minimum Interrupting:    ${minRating} kAIC @ ${voltage}V\n`;
    steps += `Voltage Class:           ${voltage <= 600 ? '600' : voltage}V\n\n`;
    
    steps += `🔌 FUSE CLASS SELECTION\n`;
    steps += '─'.repeat(80) + '\n\n';
    
    Object.keys(STANDARD_FUSE_RATINGS.classes).forEach(className => {
        const fuseClass = STANDARD_FUSE_RATINGS.classes[className];
        if (fuseClass.interrupting_kA >= minRating && voltage <= fuseClass.voltage) {
            steps += `${className}:\n`;
            steps += `   Interrupting Capacity: ${fuseClass.interrupting_kA} kAIC\n`;
            steps += `   Voltage Rating:        ${fuseClass.voltage}V\n`;
            steps += `   Current Range:         ${fuseClass.currentRange_A[0]}-${fuseClass.currentRange_A[1]}A\n`;
            steps += `   Features:              ${fuseClass.features.join(', ')}\n`;
            steps += `   Applications:          ${fuseClass.applications.join(', ')}\n`;
            steps += `   Cost:                  ${className.includes('RK1') || className.includes('J') ? 'Mid-range' : className.includes('L') ? 'Higher' : 'Budget'}\n\n`;
        }
    });
    
    steps += `💡 FUSE SELECTION TIPS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Class RK1 or J: Best for motor circuits (time-delay + current limiting)\n`;
    steps += `• Class L: Required for currents above 600A\n`;
    steps += `• Class T: Very fast, use for sensitive electronics\n`;
    steps += `• Current limiting fuses reduce let-through I²t (less damage)\n`;
    steps += `• Consider Class J for best cost/performance balance\n\n`;
    
    return steps;
}

/**
 * Generate relay settings recommendations
 */
function generateRelaySettings(threePhaseCurrent, groundCurrent) {
    let steps = '';
    
    steps += `🛡️  PROTECTIVE RELAY SETTINGS (Per IEEE C37.2)\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    Object.keys(RELAY_FUNCTIONS).forEach(deviceNum => {
        const relay = RELAY_FUNCTIONS[deviceNum];
        let pickup = 0;
        
        if (deviceNum === '50') {
            pickup = threePhaseCurrent * 1.5;
        } else if (deviceNum === '50G') {
            pickup = groundCurrent * 1.2;
        }
        
        steps += `Device ${deviceNum} - ${relay.name}:\n`;
        steps += `   Purpose:              ${relay.purpose}\n`;
        steps += `   Setting Guideline:    ${relay.settingGuideline}\n`;
        if (pickup > 0) {
            steps += `   Recommended Pickup:   ${pickup.toFixed(1)} kA\n`;
        }
        steps += `   Coordination:         ${relay.coordination}\n\n`;
    });
    
    steps += `⚙️  RELAY COORDINATION NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Perform detailed coordination study per IEEE 242 (Buff Book)\n`;
    steps += `• Use time-current curve software for verification\n`;
    steps += `• Maintain minimum 0.3s separation between devices\n`;
    steps += `• Consider future expansion in settings\n`;
    steps += `• Document all settings and coordination rationale\n\n`;
    
    return steps;
}

/**
 * Generate equipment withstand requirements
 */
function generateWithstandRequirements(asymCurrent, symCurrent) {
    let steps = '';
    
    steps += `📊 EQUIPMENT WITHSTAND REQUIREMENTS\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    const busBracing = Math.ceil(asymCurrent * 1.25);
    const ItSquared = Math.pow(symCurrent * 1000, 2) * SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME;
    
    steps += `🔩 BUS BRACING & SUPPORT STRUCTURES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Momentary Peak Current:  ${asymCurrent.toFixed(1)} kA\n`;
    steps += `Required Bus Bracing:    ${busBracing} kA peak (125% safety factor)\n`;
    steps += `Recommended Standards:   ${getStandardBusBracing(asymCurrent)}\n`;
    steps += `Mechanical Force:        F = 2.04 × I² × 10⁻⁷ × L/S lbs (per IEEE 605)\n`;
    steps += `   Where: I = peak current (A)\n`;
    steps += `          L = bus length (inches)\n`;
    steps += `          S = spacing between phases (inches)\n\n`;
    
    steps += `🔌 CONDUCTOR SHORT-CIRCUIT WITHSTAND\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Fault Duration:          ${(SHORT_CIRCUIT_CONFIG.CONTACT_PARTING_TIME * 1000).toFixed(0)} ms (breaker opening time)\n`;
    steps += `I²t Value:               ${ItSquared.toExponential(2)} A²·s\n`;
    steps += `Per NEC 110.10:          Verify conductor withstand capability\n`;
    steps += `Per IEEE 242:            I²t = K² × A² (K = material constant, A = area)\n`;
    steps += `   Copper K = 0.0297 for 75°C to 250°C rise\n`;
    steps += `   Aluminum K = 0.0125 for 75°C to 250°C rise\n\n`;
    
    steps += `⚠️  VERIFICATION REQUIRED\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `☐ Bus bar material and cross-section adequate\n`;
    steps += `☐ Support insulator ratings verified\n`;
    steps += `☐ Bolted connections torqued to specification\n`;
    steps += `☐ Phase spacing per NEMA/ANSI standards\n`;
    steps += `☐ Conductor ampacity with fault current consideration\n\n`;
    
    return steps;
}

/**
 * Generate cost comparison across manufacturers
 */
function generateCostComparison(voltage, faultCurrent, voltageClass) {
    let steps = '';
    
    steps += `💰 COST COMPARISON & VALUE ANALYSIS\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📈 RELATIVE COST BREAKDOWN (Indexed to Budget Tier = 1.0)\n`;
    steps += '─'.repeat(80) + '\n\n';
    
    const manufacturers = Object.keys(MANUFACTURER_DATA);
    const costData = [];
    
    manufacturers.forEach(mfr => {
        const mfrData = MANUFACTURER_DATA[mfr];
        if (!mfrData[voltageClass]) return;
        
        mfrData[voltageClass].series.forEach(product => {
            const tier = COST_TIERS[product.costTier];
            costData.push({
                manufacturer: mfrData.name,
                product: product.name,
                costTier: product.costTier,
                multiplier: tier.multiplier,
                leadTime: tier.leadTime,
                warranty: tier.warranty,
                features: product.features.length
            });
        });
    });
    
    // Sort by cost multiplier
    costData.sort((a, b) => a.multiplier - b.multiplier);
    
    costData.forEach((item, index) => {
        const costBar = '█'.repeat(Math.round(item.multiplier * 10));
        steps += `${index + 1}. ${item.manufacturer} ${item.product}\n`;
        steps += `   Cost Index:    ${costBar} ${item.multiplier.toFixed(2)}×\n`;
        steps += `   Cost Tier:     ${COST_TIERS[item.costTier].name}\n`;
        steps += `   Lead Time:     ${item.leadTime}\n`;
        steps += `   Warranty:      ${item.warranty}\n`;
        steps += `   Features:      ${item.features} advanced features\n\n`;
    });
    
    steps += `💡 VALUE RECOMMENDATIONS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Best Budget Choice:      ${costData[0].manufacturer} ${costData[0].product}\n`;
    steps += `   • Lowest initial cost\n`;
    steps += `   • Good for simple applications\n`;
    steps += `   • Standard features adequate\n\n`;
    
    const midRange = costData.find(d => d.costTier === 'mid-range');
    if (midRange) {
        steps += `Best Value Choice:       ${midRange.manufacturer} ${midRange.product}\n`;
        steps += `   • Balanced cost/performance\n`;
        steps += `   • Enhanced features\n`;
        steps += `   • Better support/warranty\n\n`;
    }
    
    const premium = costData.find(d => d.costTier === 'premium');
    if (premium) {
        steps += `Premium Choice:          ${premium.manufacturer} ${premium.product}\n`;
        steps += `   • Maximum features\n`;
        steps += `   • Best monitoring/communication\n`;
        steps += `   • Longest warranty\n`;
        steps += `   • Recommended for critical applications\n\n`;
    }
    
    steps += `📊 TOTAL COST OF OWNERSHIP FACTORS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Consider beyond initial purchase price:\n`;
    steps += `   • Installation labor (premium devices may reduce labor)\n`;
    steps += `   • Maintenance costs (frequency and complexity)\n`;
    steps += `   • Downtime costs (reliability impacts)\n`;
    steps += `   • Energy efficiency (electronic trips can monitor/optimize)\n`;
    steps += `   • Spare parts availability\n`;
    steps += `   • Technical support quality\n`;
    steps += `   • Warranty coverage and response time\n\n`;
    
    return steps;
}

/**
 * Generate standards compliance checklist
 */
function generateComplianceChecklist(voltage, faultCurrent) {
    let steps = '';
    
    steps += `✅ STANDARDS COMPLIANCE CHECKLIST\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📋 NEC (NFPA 70) REQUIREMENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `☐ 110.9:  Interrupting rating ≥ ${(faultCurrent * 1.25).toFixed(1)} kA\n`;
    steps += `☐ 110.10: Equipment withstand rating adequate for fault current\n`;
    steps += `☐ 110.24: Available fault current marking required\n`;
    steps += `           "${faultCurrent.toFixed(3)} kA available @ ${voltage}V"\n`;
    steps += `☐ 230.95: Ground-fault protection required for solidly grounded\n`;
    steps += `           wye services >150V to ground, >1000A rating\n`;
    steps += `☐ 240.4:  Overcurrent protection per conductor ampacity\n`;
    steps += `☐ 240.13: Ground-fault protection of equipment coordination\n\n`;
    
    steps += `📋 IEEE STANDARDS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `☐ IEEE 141 (Red Book): Short-circuit study performed\n`;
    steps += `☐ IEEE 242 (Buff Book): Coordination study completed\n`;
    steps += `☐ IEEE 399 (Brown Book): Power system analysis documented\n`;
    steps += `☐ IEEE 1584: Arc flash hazard analysis (if required)\n\n`;
    
    steps += `📋 ANSI/UL STANDARDS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `☐ ANSI C37.010: Circuit breaker ratings verified\n`;
    steps += `☐ UL 489: Molded case circuit breakers listed\n`;
    steps += `☐ UL 1066: Low voltage AC/DC power circuit breakers\n`;
    steps += `☐ UL 248: Low voltage fuses (if applicable)\n\n`;
    
    steps += `📋 DOCUMENTATION REQUIREMENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `☐ Short-circuit calculation report (this document)\n`;
    steps += `☐ Time-current coordination curves\n`;
    steps += `☐ Single-line diagram with device ratings\n`;
    steps += `☐ Protection device settings record\n`;
    steps += `☐ Equipment nameplate data sheets\n`;
    steps += `☐ Field testing and commissioning reports\n`;
    steps += `☐ As-built drawings and specifications\n\n`;
    
    return steps;
}

/**
 * Generate important notes and disclaimers
 */
function generateImportantNotes() {
    let steps = '';
    
    steps += `⚠️  IMPORTANT NOTES & DISCLAIMERS\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📌 GENERAL NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `1. Device ratings shown are MINIMUM requirements per calculations\n`;
    steps += `2. Final selection must consider:\n`;
    steps += `   • Load current and continuous rating requirements\n`;
    steps += `   • Coordination with upstream and downstream devices\n`;
    steps += `   • Available physical space and mounting arrangements\n`;
    steps += `   • Environmental conditions (temperature, humidity, altitude)\n`;
    steps += `   • Future expansion plans (NEC requires 125% for continuous loads)\n`;
    steps += `   • Budget constraints and total cost of ownership\n`;
    steps += `   • Maintenance capabilities and spare parts availability\n\n`;
    
    steps += `3. Coordination study REQUIRED per IEEE 242:\n`;
    steps += `   • Plot time-current curves for all series protective devices\n`;
    steps += `   • Verify selective coordination (if required by code)\n`;
    steps += `   • Maintain minimum 0.3 second separation\n`;
    steps += `   • Document coordination rationale and settings\n\n`;
    
    steps += `4. Equipment testing and verification:\n`;
    steps += `   • Factory acceptance testing (FAT) recommended for critical equipment\n`;
    steps += `   • Site acceptance testing (SAT) required before energization\n`;
    steps += `   • Protective device settings must be verified by testing\n`;
    steps += `   • Periodic testing per NETA standards recommended\n\n`;
    
    steps += `5. Arc flash hazard analysis:\n`;
    steps += `   • Perform per IEEE 1584 if equipment >240V\n`;
    steps += `   • Label equipment with arc flash boundary and PPE requirements\n`;
    steps += `   • Update study after any system changes\n`;
    steps += `   • Train personnel on arc flash hazards\n\n`;
    
    steps += `📌 MANUFACTURER-SPECIFIC NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Verify availability and lead times before specifying\n`;
    steps += `• Request manufacturer coordination assistance for critical applications\n`;
    steps += `• Confirm ratings with manufacturer data sheets (not catalog ratings)\n`;
    steps += `• Consider standardization on single manufacturer for spare parts\n`;
    steps += `• Verify service and technical support availability in your region\n\n`;
    
    steps += `📌 COST CONSIDERATIONS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Cost indices shown are relative, not absolute prices\n`;
    steps += `• Actual pricing varies by:\n`;
    steps += `   - Project size and volume discounts\n`;
    steps += `   - Regional availability and logistics\n`;
    steps += `   - Currency exchange rates (imported equipment)\n`;
    steps += `   - Market conditions and supply chain\n`;
    steps += `   - Customization and engineering requirements\n`;
    steps += `• Request formal quotes from distributors for budget accuracy\n`;
    steps += `• Consider total cost of ownership, not just purchase price\n\n`;
    
    steps += `📌 LEGAL DISCLAIMER\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `This protection device recommendation is based on calculated fault currents\n`;
    steps += `and standard industry practices. Final equipment selection and settings must\n`;
    steps += `be performed by qualified electrical engineers and verified per applicable\n`;
    steps += `codes and standards. The author and software assume no liability for\n`;
    steps += `equipment selection, installation, or operation. Always consult:\n`;
    steps += `   • Licensed professional electrical engineer\n`;
    steps += `   • Equipment manufacturer technical support\n`;
    steps += `   • Authority having jurisdiction (AHJ)\n`;
    steps += `   • Applicable national and local electrical codes\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF PROTECTION DEVICE REQUIREMENTS\n';
    steps += '═'.repeat(80) + '\n\n';
    
    return steps;
}

/**
 * Get standard bus bracing ratings that meet requirement
 */
function getStandardBusBracing(requiredKA) {
    const ratings = [30, 42, 50, 65, 85, 100, 125, 150, 200];
    const needed = Math.ceil(requiredKA * 1.25);
    const suitable = ratings.filter(r => r >= needed);
    return suitable.length > 0 ? suitable.join(' kA, ') + ' kA' : ratings[ratings.length - 1] + ' kA (custom required)';
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.generateProtectionSelectionRecommendations = generateProtectionSelectionRecommendations;
    window.MANUFACTURER_DATA = MANUFACTURER_DATA;
    window.STANDARD_BREAKER_RATINGS = STANDARD_BREAKER_RATINGS;
    window.STANDARD_FUSE_RATINGS = STANDARD_FUSE_RATINGS;
    window.RELAY_FUNCTIONS = RELAY_FUNCTIONS;
    window.COST_TIERS = COST_TIERS;
}

console.log('✅ Protection Device Ratings Module v1.0.0 loaded');
console.log('   - Manufacturer database: ABB, Schneider, Eaton, Siemens, LS Electric');
console.log('   - Cost tiers: Budget, Mid-range, Premium');
console.log('   - Standards: IEEE 141, IEEE 242, NEC, ANSI C37, IEC');
console.log('   - Comprehensive device selection guidance included');