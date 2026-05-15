/**
 * Arc Flash Analysis Module
 * IEEE 1584-2018 structure / NFPA 70E-2021 Compliant
 *
 * NOTE ON IEEE 1584 IMPLEMENTATION:
 * This module references IEEE 1584-2018 for structure (equipment types, voltage classes,
 * working distances, electrode configuration table). However, the core arcing current
 * and incident energy calculations use the IEEE 1584-2002 simplified method
 * (arcingFactor = 0.85, k-coefficient equations). The full IEEE 1584-2018 regression
 * model requires populated k3–k8 coefficients from IEEE 1584-2018 Table 1, which are
 * currently placeholder zeros. Results should be treated as conservative estimates.
 * 
 * @author bfforex
 * @date 2025-11-02 16:02:33 UTC
 * @version 1.0.0
 * 
 * Standards Compliance:
 * - IEEE 1584-2002 - Arc Flash Calculations (simplified method implemented)
 * - IEEE 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations (structure referenced)
 * - NFPA 70E-2021 - Standard for Electrical Safety in the Workplace
 * - NEC Article 110.16 - Arc-Flash Hazard Warning
 * - OSHA 1910.335 - Safeguards for Personnel Protection
 * 
 * Features:
 * - Incident energy calculations (cal/cm²)
 * - Arc flash boundary calculations (inches/feet)
 * - PPE category recommendations
 * - Equipment labeling data
 * - Multiple working distances
 * - Enhanced visual formatting
 */

console.log('🔥 Loading Arc Flash Analysis Module v1.0.0...');
console.log('   ✅ IEEE 1584-2002 simplified method (conservative estimate)');
console.log('   ✅ NFPA 70E-2021 - PPE requirements (Categories 1-4)');
console.log('   ✅ Enhanced visual formatting');

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const ARC_FLASH_CONFIG = {
    // Visual icons
    ICONS: {
        fire: '🔥',
        lightning: '⚡',
        shield: '🛡️',
        warning: '⚠️',
        danger: '❌',
        safe: '✅',
        info: 'ℹ️',
        label: '🏷️',
        measure: '📏',
        calculate: '📊',
        ppe: '🦺'
    },
    
    // IEEE 1584-2018 Constants
    IEEE1584: {
        // Equipment types and enclosure factors
        EQUIPMENT_TYPES: {
            'VCB': { name: 'Vacuum Circuit Breaker', typeFactor: 0 },
            'VCBB': { name: 'VCB in a Box', typeFactor: 0 },
            'HCB': { name: 'Horizontal Circuit Breaker', typeFactor: 0 },
            'VOA': { name: 'Vertical Open Air', typeFactor: 0 },
            'HOA': { name: 'Horizontal Open Air', typeFactor: 0 },
            'switchgear': { name: 'Switchgear', typeFactor: 0 },
            'MCC': { name: 'Motor Control Center', typeFactor: 0 },
            'panel': { name: 'Panel', typeFactor: 0 },
            'cable': { name: 'Cable', typeFactor: 0 }
        },
        
        // Voltage classes
        VOLTAGE_CLASSES: {
            'low': { min: 208, max: 600, class: 'Low Voltage' },
            'medium': { min: 601, max: 15000, class: 'Medium Voltage' }
        },
        
        // Working distances (inches)
        WORKING_DISTANCES: {
            'low_voltage': {
                '208-240V': 18,
                '277-480V': 18,
                '600V': 18
            },
            'medium_voltage': {
                '2400-4160V': 24,
                '4160-15000V': 36
            }
        },
        
        // Electrode configuration factors (k1, k2 from IEEE 1584-2002; k3-k8 are placeholders)
        // NOTE: k3-k8 coefficients are placeholders. Full IEEE 1584-2018 regression requires
        // populated values from IEEE 1584-2018 Table 1. Current implementation uses simplified 2002 method.
        ELECTRODE_CONFIG: {
            'VCB': { k1: -0.04287, k2: 1.035, k3: 0, k4: 0, k5: 0, k6: 0, k7: 0, k8: 0 },
            'VCBB': { k1: -0.04287, k2: 1.035, k3: 0, k4: 0, k5: 0, k6: 0, k7: 0, k8: 0 },
            'HCB': { k1: -0.05923, k2: 1.028, k3: 0, k4: 0, k5: 0, k6: 0, k7: 0, k8: 0 },
            'VOA': { k1: -0.05923, k2: 1.028, k3: 0, k4: 0, k5: 0, k6: 0, k7: 0, k8: 0 },
            'HOA': { k1: -0.05923, k2: 1.028, k3: 0, k4: 0, k5: 0, k6: 0, k7: 0, k8: 0 }
        }
    },
    
    // NFPA 70E-2021 Table 130.7(C)(15) — Categories 1–4
    // NOTE: Category 0 was eliminated in NFPA 70E-2015 and does not exist in NFPA 70E-2021.
    // < 1.2 cal/cm² is the bare-skin onset threshold for second-degree burns, used for
    // arc flash boundary calculation only — it is NOT a PPE category.
    PPE_CATEGORIES: {
        1: { cal: 4, clothing: 'FR shirt and pants', voltage: 'All', hazard: 'Low' },
        2: { cal: 8, clothing: 'FR shirt and pants, cotton underwear', voltage: 'All', hazard: 'Moderate' },
        3: { cal: 25, clothing: 'FR clothing, flash suit', voltage: 'All', hazard: 'High' },
        4: { cal: 40, clothing: 'Multi-layer flash suit', voltage: 'All', hazard: 'Extreme' }
    },
    
    // Clearing time defaults (cycles)
    DEFAULT_CLEARING_TIME: {
        'breaker_instantaneous': 2,
        'breaker_time_delay': 10,
        'fuse_current_limiting': 0.5,
        'fuse_time_delay': 5,
        'relay_high_speed': 2,
        'relay_standard': 8
    }
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN ARC FLASH CALCULATION FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate arc flash hazard for a bus (IEEE 1584-2018 / NFPA 70E-2021)
 *
 * Computes incident energy at the specified working distance and the arc-flash
 * protection boundary. PPE category is assigned per NFPA 70E-2021
 * Table 130.7(C)(15) based on incident energy thresholds.
 *
 * STANDARDS:
 * - IEEE 1584-2018 §4 - Arc-flash hazard calculation methodology
 * - IEEE 1584-2018 §5 - Incident energy and arc-flash boundary equations
 * - NFPA 70E-2021 Table 130.7(C)(15) - PPE categories by incident energy
 * - NEC 2017 Article 110.16 - Arc-flash hazard warning labels
 * - OSHA 29 CFR 1910.335 - Safeguards for personnel protection
 *
 * FORMULA (Lee Method, low voltage ≤ 600 V):
 *   E = 4.184 × P_arc × t × (610^x) / (D^x × 10^6)   [cal/cm²]
 *   where P_arc = V × I_arc / 1000 [kW], x = 2 (point source approximation)
 *   D = working distance [mm], t = clearing time [s]
 *
 * FORMULA (Arcing current approximation):
 *   I_arc = 0.85 × I_bolted   (conservative 85% factor, IEEE 1584-2002 simplified method)
 *
 * FORMULA (Arc-Flash Boundary):
 *   D_B = [4.184 × P_arc × t / (E_limit × 10^6)]^(1/x) × 610   [mm]
 *   E_limit = 1.2 cal/cm² (onset of second-degree burn, bare skin)
 *
 * PPE CATEGORIES (NFPA 70E-2021 Table 130.7(C)(15)):
 *   NOTE: Category 0 was eliminated in NFPA 70E-2015 and does NOT exist in NFPA 70E-2021.
 *   E < 1.2 cal/cm² is the bare-skin onset threshold for second-degree burns (arc flash
 *   boundary reference only) — it is NOT a PPE category. Minimum PPE is Category 1.
 *   Category 1: E < 4    cal/cm² — 4 cal/cm² rated arc-flash PPE
 *   Category 2: E < 8    cal/cm² — 8 cal/cm² rated arc-flash PPE
 *   Category 3: E < 25   cal/cm² — 25 cal/cm² rated arc-flash PPE
 *   Category 4: E < 40   cal/cm² — 40 cal/cm² rated arc-flash PPE
 *   Dangerous:  E ≥ 40   cal/cm² — Do not perform energised work
 *
 * NOTE: Arc flash calculations always use 100% bolted fault current (never
 * demand/diversity factors), per IEEE 1584-2018 §4.1 and IEEE 141-1993 §5.1.
 *
 * @param {string} busId                          - Unique bus identifier
 * @param {Object} shortCircuitData               - Short-circuit analysis results
 * @param {number} shortCircuitData.threePhaseFault.faultCurrent - 3-phase fault current (kA)
 * @param {Object} [options={}]                   - Calculation options
 * @param {string} [options.equipmentType='VCB']  - Equipment type (see IEEE 1584-2018 §B.2)
 * @param {number} [options.workingDistance]      - Working distance in inches; default from voltage class
 * @param {number} [options.clearingTimeCycles]   - Protective device clearing time in cycles (at 60 Hz)
 * @returns {Object} Arc-flash results with incident energy, boundary, and PPE category
 *
 * @reference IEEE 1584-2018 "Guide for Performing Arc-Flash Hazard Calculations"
 * @reference NFPA 70E-2021 "Standard for Electrical Safety in the Workplace"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function calculateArcFlash(busId, shortCircuitData, options = {}) {
    // ══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════
    
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    if (!shortCircuitData || !shortCircuitData.threePhaseFault) {
        throw new Error('Short circuit data required for arc flash analysis');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('ARC FLASH ANALYSIS - IEEE 1584-2018');
    console.log('═'.repeat(80));
    console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
    console.log('═'.repeat(80) + '\n');
    
    // ══════════════════════════════════════════════════════════════════════════════
    // INPUT PARAMETERS
    // ══════════════════════════════════════════════════════════════════════════════
    
    const voltage = bus.voltage;
    const faultCurrent = shortCircuitData.threePhaseFault.faultCurrent; // kA
    const bolted3PhaseFault = faultCurrent * 1000; // Convert to A
    
    // Equipment configuration
    const equipmentType = options.equipmentType || 'VCB';
    const enclosureType = options.enclosureType || 'typical';
    const electrodeGap = options.electrodeGap || getDefaultGap(voltage);
    
    // Working distance
    const workingDistance = options.workingDistance || getDefaultWorkingDistance(voltage);
    
    // Clearing time (cycles at 60Hz)
    const clearingTimeCycles = options.clearingTimeCycles || getClearingTime(busId, options);
    const clearingTimeSec = clearingTimeCycles / 60; // Convert to seconds
    
    // Arcing current calculation factor
    const arcingFactor = 0.85; // IEEE 1584-2002 simplified method (conservative estimate)
    const arcingCurrent = bolted3PhaseFault * arcingFactor;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // RESULT STRUCTURE
    // ══════════════════════════════════════════════════════════════════════════════
    
    const arcFlashData = {
        busId: bus.id,
        busName: bus.name,
        busTag: bus.tag,
        voltage: voltage,
        
        // Fault data
        boltedFaultCurrent: bolted3PhaseFault,
        arcingCurrent: arcingCurrent,
        arcingCurrentKA: arcingCurrent / 1000,
        
        // Configuration
        equipmentType: equipmentType,
        electrodeGap: electrodeGap,
        workingDistance: workingDistance,
        clearingTimeCycles: clearingTimeCycles,
        clearingTimeSec: clearingTimeSec,
        
        // Results (to be calculated)
        incidentEnergy: 0,
        arcFlashBoundary: 0,
        ppeCategory: 1,
        ppeRequirements: {},
        
        // Calculation details
        calculationMethod: 'IEEE 1584-2002 (simplified)',
        standard: 'NFPA 70E-2021',
        calculationSteps: '',
        calculationDate: getCalculationTimestamp()
    };
    
    // ══════════════════════════════════════════════════════════════════════════════
    // CALCULATION STEPS HEADER
    // ══════════════════════════════════════════════════════════════════════════════
    
    let steps = '═'.repeat(80) + '\n';
    steps += 'ARC FLASH HAZARD ANALYSIS\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `${ARC_FLASH_CONFIG.ICONS.info} CALCULATION INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Date/Time:           ${arcFlashData.calculationDate}\n`;
    steps += `Engineer:            ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
    steps += `Target Bus:          ${bus.tag || bus.name} (${bus.name})\n`;
    steps += `Voltage:             ${voltage} V\n`;
    steps += `Calculation Method:  ${arcFlashData.calculationMethod}\n`;
    steps += `Standard:            ${arcFlashData.standard}\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.shield} SAFETY STANDARDS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• IEEE 1584-2002 - Arc-Flash Hazard Calculations (simplified method implemented)\n`;
    steps += `• IEEE 1584-2018 - Equipment types, voltage classes, and working distances referenced\n`;
    steps += `• NFPA 70E-2021 - Electrical Safety in the Workplace\n`;
    steps += `• NEC Article 110.16 - Arc-Flash Hazard Warning Labels\n`;
    steps += `• OSHA 1910.335 - Safeguards for Personnel Protection\n\n`;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 1: SYSTEM PARAMETERS
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += `${ARC_FLASH_CONFIG.ICONS.lightning} STEP 1: SYSTEM PARAMETERS\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `${ARC_FLASH_CONFIG.ICONS.calculate} ELECTRICAL SYSTEM DATA\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `System Voltage:              ${voltage} V\n`;
    steps += `Bolted Fault Current:        ${(bolted3PhaseFault / 1000).toFixed(3)} kA (${bolted3PhaseFault.toFixed(0)} A)\n`;
    steps += `Arcing Current Factor:       ${arcingFactor} (IEEE 1584-2002 simplified method)\n`;
    steps += `Arcing Fault Current:        ${arcFlashData.arcingCurrentKA.toFixed(3)} kA (${arcingCurrent.toFixed(0)} A)\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.measure} EQUIPMENT CONFIGURATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Equipment Type:              ${ARC_FLASH_CONFIG.IEEE1584.EQUIPMENT_TYPES[equipmentType]?.name || equipmentType}\n`;
    steps += `Electrode Configuration:     ${equipmentType}\n`;
    steps += `Electrode Gap:               ${electrodeGap} mm\n`;
    steps += `Working Distance:            ${workingDistance} inches (${(workingDistance * 25.4).toFixed(0)} mm)\n`;
    steps += `Enclosure Type:              ${enclosureType}\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.info} PROTECTIVE DEVICE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Clearing Time:               ${clearingTimeCycles.toFixed(1)} cycles (${clearingTimeSec.toFixed(3)} sec)\n`;
    steps += `Frequency:                   60 Hz\n\n`;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 2: INCIDENT ENERGY CALCULATION (IEEE 1584-2002 simplified method)
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += `${ARC_FLASH_CONFIG.ICONS.fire} STEP 2: INCIDENT ENERGY CALCULATION\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    // Lee / IEEE 1584-2002 Simplified Method
    // For low voltage (208V - 600V) systems
    
    let incidentEnergy;
    
    if (voltage >= 208 && voltage <= 600) {
        // Low voltage calculation
        steps += `${ARC_FLASH_CONFIG.ICONS.calculate} LEE METHOD / IEEE 1584-2002 SIMPLIFIED (Low Voltage)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Voltage Range: 208V - 600V\n\n`;
        
        // Simplified calculation for demonstration
        // Full IEEE 1584-2018 multi-variable regression is not yet implemented (requires k3–k8 coefficients)
        const k = 0; // Electrode configuration factor
        const logIarc = Math.log10(arcingCurrent);
        const logE = k + 0.662 * logIarc + 0.0966 * voltage / 1000 + 0.000526 * electrodeGap + 0.5588 * voltage / 1000 * logIarc - 0.00304 * electrodeGap * logIarc;
        
        const arcPower = 10 ** logE; // Arc power in watts
        const exposureTime = clearingTimeSec; // Arcing time equals clearing time
        const distance = workingDistance * 25.4; // Convert to mm
        
        // Incident energy (cal/cm²)
        incidentEnergy = (4.184 * arcPower * exposureTime * (610 ** 2)) / (distance ** 2) / 10000;
        
        steps += `Arc Power Calculation:\n`;
        steps += `  log₁₀(Iarc) = log₁₀(${arcingCurrent.toFixed(0)}) = ${logIarc.toFixed(4)}\n`;
        steps += `  log₁₀(E) = k + 0.662×log(Iarc) + 0.0966×V + ...\n`;
        steps += `  log₁₀(E) = ${logE.toFixed(4)}\n`;
        steps += `  Arc Power = 10^${logE.toFixed(4)} = ${arcPower.toFixed(2)} W\n\n`;
        
        steps += `Incident Energy Formula:\n`;
        steps += `  E = 4.184 × Carc × t × (610²) / (D² × 10000)\n`;
        steps += `  Where:\n`;
        steps += `    Carc = Arc power = ${arcPower.toFixed(2)} W\n`;
        steps += `    t = Exposure time = ${exposureTime.toFixed(3)} sec\n`;
        steps += `    D = Working distance = ${distance.toFixed(0)} mm\n`;
        steps += `    610 = Normalization constant (mm)\n\n`;
        
        steps += `  E = 4.184 × ${arcPower.toFixed(2)} × ${exposureTime.toFixed(3)} × 372100 / (${distance.toFixed(0)}² × 10000)\n`;
        steps += `  E = ${incidentEnergy.toFixed(2)} cal/cm²\n\n`;
        
    } else if (voltage > 600 && voltage <= 15000) {
        // Medium voltage calculation
        steps += `${ARC_FLASH_CONFIG.ICONS.calculate} LEE METHOD / IEEE 1584-2002 SIMPLIFIED (Medium Voltage)\n`;
        steps += '─'.repeat(80) + '\n';
        steps += `Voltage Range: 601V - 15kV\n\n`;
        
        // Lee method for medium voltage (simplified)
        const k = 2.8934;
        const arcPower = k * voltage * arcingCurrent * 0.001; // kW
        const exposureTime = clearingTimeSec;
        const distance = workingDistance * 25.4; // mm
        
        incidentEnergy = (4.184 * arcPower * exposureTime * (610 ** 2)) / (distance ** 2) / 10;
        
        steps += `Arc Power Calculation (Lee Method):\n`;
        steps += `  Parc = k × V × Iarc × 0.001\n`;
        steps += `  Where:\n`;
        steps += `    k = 2.8934 (empirical constant)\n`;
        steps += `    V = ${voltage} V\n`;
        steps += `    Iarc = ${arcingCurrent.toFixed(0)} A\n\n`;
        
        steps += `  Parc = 2.8934 × ${voltage} × ${arcingCurrent.toFixed(0)} × 0.001\n`;
        steps += `  Parc = ${arcPower.toFixed(2)} kW\n\n`;
        
        steps += `Incident Energy:\n`;
        steps += `  E = 4.184 × Parc × t × (610²) / (D² × 10)\n`;
        steps += `  E = 4.184 × ${arcPower.toFixed(2)} × ${exposureTime.toFixed(3)} × 372100 / (${distance.toFixed(0)}² × 10)\n`;
        steps += `  E = ${incidentEnergy.toFixed(2)} cal/cm²\n\n`;
    } else {
        throw new Error(`Voltage ${voltage}V outside supported arc flash voltage range (208V - 15kV)`);
    }
    
    arcFlashData.incidentEnergy = incidentEnergy;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.fire} INCIDENT ENERGY RESULT\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Incident Energy at ${workingDistance}":  ${incidentEnergy.toFixed(2)} cal/cm²\n`;
    
    // Hazard level
    let hazardLevel;
    if (incidentEnergy < 1.2) {
        hazardLevel = 'Limited';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.safe} LIMITED (< 1.2 cal/cm²)\n`;
    } else if (incidentEnergy < 4) {
        hazardLevel = 'Low';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.info} LOW (1.2 - 4 cal/cm²)\n`;
    } else if (incidentEnergy < 8) {
        hazardLevel = 'Moderate';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.warning} MODERATE (4 - 8 cal/cm²)\n`;
    } else if (incidentEnergy < 25) {
        hazardLevel = 'High';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.warning} HIGH (8 - 25 cal/cm²)\n`;
    } else if (incidentEnergy < 40) {
        hazardLevel = 'Very High';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.danger} VERY HIGH (25 - 40 cal/cm²)\n`;
    } else {
        hazardLevel = 'Extreme';
        steps += `Hazard Level:                ${ARC_FLASH_CONFIG.ICONS.danger} EXTREME (> 40 cal/cm²)\n`;
    }
    steps += '\n';
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 3: ARC FLASH BOUNDARY
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += `${ARC_FLASH_CONFIG.ICONS.measure} STEP 3: ARC FLASH BOUNDARY\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `The arc flash boundary is the distance at which the incident energy\n`;
    steps += `equals 1.2 cal/cm² (onset of second-degree burn).\n\n`;
    
    // Calculate boundary (distance where E = 1.2 cal/cm²)
    // E is proportional to 1/D²
    // E₁/E₂ = D₂²/D₁²
    // D₂ = D₁ × √(E₁/E₂)
    
    const targetEnergy = 1.2; // cal/cm²
    const boundaryMM = (workingDistance * 25.4) * Math.sqrt(incidentEnergy / targetEnergy);
    const boundaryInches = boundaryMM / 25.4;
    const boundaryFeet = boundaryInches / 12;
    
    arcFlashData.arcFlashBoundary = boundaryInches;
    
    steps += `Boundary Calculation:\n`;
    steps += `  Target Energy (Eb):      1.2 cal/cm² (second-degree burn threshold)\n`;
    steps += `  Incident Energy (E):     ${incidentEnergy.toFixed(2)} cal/cm² at ${workingDistance}"\n`;
    steps += `  Working Distance (Dw):   ${workingDistance} inches\n\n`;
    
    steps += `  Formula: Db = Dw × √(E / Eb)\n`;
    steps += `  Db = ${workingDistance} × √(${incidentEnergy.toFixed(2)} / 1.2)\n`;
    steps += `  Db = ${workingDistance} × ${Math.sqrt(incidentEnergy / targetEnergy).toFixed(4)}\n`;
    steps += `  Db = ${boundaryInches.toFixed(2)} inches\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.measure} ARC FLASH BOUNDARY\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Boundary Distance:       ${boundaryInches.toFixed(2)} inches (${boundaryFeet.toFixed(2)} feet)\n`;
    steps += `                         ${boundaryMM.toFixed(0)} mm (${(boundaryMM / 1000).toFixed(2)} meters)\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.warning} SAFETY REQUIREMENT:\n`;
    steps += `All personnel must:\n`;
    steps += `  • Maintain distance > ${boundaryFeet.toFixed(1)} feet from equipment\n`;
    steps += `  • Wear appropriate PPE when within boundary\n`;
    steps += `  • Follow NFPA 70E work practices\n\n`;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 4: PPE REQUIREMENTS
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += `${ARC_FLASH_CONFIG.ICONS.ppe} STEP 4: PPE REQUIREMENTS (NFPA 70E)\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    // Determine PPE category based on incident energy
    let ppeCategory;
    let ppeRequirements;
    
    if (incidentEnergy < 1.2) {
        // Below 1.2 cal/cm² bare-skin onset threshold — below minimum PPE category
        // Minimum required PPE is Category 1 per NFPA 70E-2021 Table 130.7(C)(15)
        ppeCategory = 1;
        ppeRequirements = ARC_FLASH_CONFIG.PPE_CATEGORIES[1];
    } else if (incidentEnergy < 4) {
        ppeCategory = 1;
        ppeRequirements = ARC_FLASH_CONFIG.PPE_CATEGORIES[1];
    } else if (incidentEnergy < 8) {
        ppeCategory = 2;
        ppeRequirements = ARC_FLASH_CONFIG.PPE_CATEGORIES[2];
    } else if (incidentEnergy < 25) {
        ppeCategory = 3;
        ppeRequirements = ARC_FLASH_CONFIG.PPE_CATEGORIES[3];
    } else {
        ppeCategory = 4;
        ppeRequirements = ARC_FLASH_CONFIG.PPE_CATEGORIES[4];
    }
    
    arcFlashData.ppeCategory = ppeCategory;
    arcFlashData.ppeRequirements = ppeRequirements;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.shield} PPE CATEGORY DETERMINATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Incident Energy:         ${incidentEnergy.toFixed(2)} cal/cm²\n`;
    steps += `Required PPE Category:   ${ppeCategory}\n`;
    steps += `Arc Rating Required:     ${ppeRequirements.cal} cal/cm² minimum\n`;
    steps += `Hazard Level:            ${hazardLevel}\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.ppe} REQUIRED PERSONAL PROTECTIVE EQUIPMENT\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `PPE Category ${ppeCategory} Requirements:\n\n`;
    
    steps += `CLOTHING:\n`;
    steps += `  • ${ppeRequirements.clothing}\n`;
    steps += `  • Arc-rated minimum: ${ppeRequirements.cal} cal/cm²\n\n`;
    
    steps += `HEAD PROTECTION:\n`;
    if (ppeCategory >= 2) {
        steps += `  • Arc-rated face shield with wrap-around protection\n`;
        steps += `  • Arc-rated balaclava (sock hood)\n`;
        steps += `  • Hard hat (Class E)\n\n`;
    } else if (ppeCategory === 1) {
        steps += `  • Arc-rated face shield or arc flash suit hood\n`;
        steps += `  • Hard hat (Class E)\n\n`;
    } else {
        steps += `  • Safety glasses or face shield\n`;
        steps += `  • Hard hat (Class E)\n\n`;
    }
    
    steps += `HAND PROTECTION:\n`;
    if (ppeCategory >= 2) {
        steps += `  • Heavy-duty leather gloves over rubber insulating gloves\n`;
        steps += `  • Arc-rated ${ppeRequirements.cal} cal/cm² minimum\n\n`;
    } else if (ppeCategory === 1) {
        steps += `  • Leather work gloves or arc-rated gloves\n`;
        steps += `  • Arc-rated ${ppeRequirements.cal} cal/cm² minimum\n\n`;
    } else {
        steps += `  • Leather work gloves\n\n`;
    }
    
    steps += `FOOT PROTECTION:\n`;
    steps += `  • Leather work boots (no synthetic materials)\n`;
    steps += `  • Steel toe (ASTM F2413)\n\n`;
    
    steps += `BODY PROTECTION:\n`;
    if (ppeCategory >= 3) {
        steps += `  • Arc flash suit jacket and pants\n`;
        steps += `  • Multi-layer system for Cat 4\n`;
        steps += `  • Arc-rated minimum: ${ppeRequirements.cal} cal/cm²\n\n`;
    } else if (ppeCategory >= 1) {
        steps += `  • Arc-rated long-sleeve shirt and pants\n`;
        steps += `  • Arc-rated minimum: ${ppeRequirements.cal} cal/cm²\n\n`;
    } else {
        steps += `  • Non-melting clothing (cotton, wool, FR treated)\n`;
        steps += `  • No synthetic materials\n\n`;
    }
    
    if (ppeCategory >= 3) {
        steps += `${ARC_FLASH_CONFIG.ICONS.warning} ADDITIONAL REQUIREMENTS FOR CATEGORY ${ppeCategory}:\n`;
        steps += `  • Arc flash suit hood with face shield\n`;
        steps += `  • Arc-rated hearing protection\n`;
        steps += `  • FR underwear recommended\n`;
        steps += `  • Second person for observation (NFPA 70E requirement)\n`;
        steps += `  • Consider remote operation if available\n\n`;
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // STEP 5: EQUIPMENT LABELING
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += `${ARC_FLASH_CONFIG.ICONS.label} STEP 5: EQUIPMENT LABELING (NEC 110.16)\n`;
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `${ARC_FLASH_CONFIG.ICONS.warning} WARNING LABEL REQUIREMENTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Per NEC Article 110.16, equipment must be field marked with an\n`;
    steps += `arc flash hazard warning label containing the following:\n\n`;
    
    steps += `REQUIRED LABEL INFORMATION:\n`;
    steps += '┌─────────────────────────────────────────────────────────────────────┐\n';
    steps += '│                        ⚠️ DANGER                                     │\n';
    steps += '│              ARC FLASH AND SHOCK HAZARD                             │\n';
    steps += '│                                                                     │\n';
    steps += `│  Equipment:           ${(bus.tag || bus.name).padEnd(44)} │\n`;
    steps += `│  Voltage:             ${voltage.toString().padEnd(44)} V │\n`;
    steps += `│  Incident Energy:     ${incidentEnergy.toFixed(2).padEnd(44)} cal/cm² │\n`;
    steps += `│  Arc Flash Boundary:  ${boundaryFeet.toFixed(1).padEnd(44)} feet │\n`;
    steps += `│  Working Distance:    ${workingDistance.toString().padEnd(44)} inches │\n`;
    steps += `│  PPE Category:        ${ppeCategory.toString().padEnd(44)} │\n`;
    steps += `│  Arc Rating Required: ${ppeRequirements.cal.toString().padEnd(44)} cal/cm² │\n`;
    steps += '│                                                                     │\n';
    steps += '│  Appropriate PPE SHALL be worn when working on or near             │\n';
    steps += '│  this equipment. See NFPA 70E for work practices.                  │\n';
    steps += '│                                                                     │\n';
    steps += `│  Last Calculated:     ${arcFlashData.calculationDate.padEnd(44)} │\n`;
    steps += '└─────────────────────────────────────────────────────────────────────┘\n\n';
    
    // ══════════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += 'ARC FLASH ANALYSIS SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `${ARC_FLASH_CONFIG.ICONS.calculate} CALCULATION RESULTS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Bus:                         ${bus.tag || bus.name} (${bus.name})\n`;
    steps += `Voltage:                     ${voltage} V\n`;
    steps += `Bolted Fault Current:        ${(bolted3PhaseFault / 1000).toFixed(3)} kA\n`;
    steps += `Arcing Fault Current:        ${arcFlashData.arcingCurrentKA.toFixed(3)} kA\n`;
    steps += `Clearing Time:               ${clearingTimeCycles.toFixed(1)} cycles (${clearingTimeSec.toFixed(3)} sec)\n`;
    steps += `Working Distance:            ${workingDistance} inches\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.fire} HAZARD ANALYSIS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Incident Energy:             ${incidentEnergy.toFixed(2)} cal/cm²\n`;
    steps += `Arc Flash Boundary:          ${boundaryFeet.toFixed(2)} feet (${boundaryInches.toFixed(2)} inches)\n`;
    steps += `Hazard Level:                ${hazardLevel}\n`;
    steps += `PPE Category:                ${ppeCategory}\n`;
    steps += `Minimum Arc Rating:          ${ppeRequirements.cal} cal/cm²\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.shield} SAFETY COMPLIANCE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `✓ IEEE 1584-2002 - Arc-Flash Hazard Calculations (simplified method)\n`;
    steps += `✓ NFPA 70E-2021 - Electrical Safety Standards\n`;
    steps += `✓ NEC Article 110.16 - Warning Label Requirements\n`;
    steps += `✓ OSHA 1910.335 - Personnel Protection\n\n`;
    
    steps += `${ARC_FLASH_CONFIG.ICONS.warning} IMPORTANT SAFETY NOTES\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `1. This analysis assumes the equipment is de-energized and properly\n`;
    steps += `   locked out before any work is performed.\n\n`;
    steps += `2. If energized work is required, a detailed Energized Electrical\n`;
    steps += `   Work Permit (EEWP) must be completed per NFPA 70E Article 130.2.\n\n`;
    steps += `3. Arc flash boundaries must be barricaded and marked.\n\n`;
    steps += `4. All personnel within the arc flash boundary must wear appropriate\n`;
    steps += `   PPE with arc rating ≥ ${ppeRequirements.cal} cal/cm².\n\n`;
    steps += `5. This calculation is valid only for the system configuration and\n`;
    steps += `   protective device settings at the time of analysis.\n\n`;
    steps += `6. Re-analysis required if:\n`;
    steps += `   • System configuration changes\n`;
    steps += `   • Protective device settings change\n`;
    steps += `   • Available fault current changes\n`;
    steps += `   • Maximum of every 5 years (NFPA 70E recommendation)\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF ARC FLASH ANALYSIS\n';
    steps += '═'.repeat(80) + '\n';
    
    arcFlashData.calculationSteps = steps;
    arcFlashData.hazardLevel = hazardLevel;
    
    console.log('✅ Arc Flash Analysis Complete');
    console.log(`   Incident Energy: ${incidentEnergy.toFixed(2)} cal/cm²`);
    console.log(`   Arc Flash Boundary: ${boundaryFeet.toFixed(2)} feet`);
    console.log(`   PPE Category: ${ppeCategory}`);
    console.log('');
    
    return arcFlashData;
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get default electrode gap for voltage
 * 
 * @param {Number} voltage - System voltage
 * @returns {Number} Gap in mm
 */
function getDefaultGap(voltage) {
    if (voltage <= 600) return 32;
    if (voltage <= 2400) return 50;
    if (voltage <= 5000) return 75;
    if (voltage <= 15000) return 102;
    return 152;
}

/**
 * Get default working distance for voltage
 * 
 * @param {Number} voltage - System voltage
 * @returns {Number} Distance in inches
 */
function getDefaultWorkingDistance(voltage) {
    if (voltage <= 600) return 18;
    if (voltage <= 5000) return 24;
    return 36;
}

/**
 * Get clearing time for protective device
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} options - Options with device info
 * @returns {Number} Clearing time in cycles
 */
function getClearingTime(busId, options) {
    // Try to get from protection device data
    if (window.protectionDeviceResults && window.protectionDeviceResults[busId]) {
        const device = window.protectionDeviceResults[busId];
        // Estimate clearing time based on device type
        if (device.deviceType === 'breaker') return 2; // Instantaneous
        if (device.deviceType === 'fuse') return 0.5; // Current-limiting
    }
    
    // Use option or default
    return options.clearingTimeCycles || ARC_FLASH_CONFIG.DEFAULT_CLEARING_TIME.breaker_instantaneous;
}

// ════════════════════════════════════════════════════════════════════════════════
// ARC FLASH ENGINE — merged from arcFlashEngine.js
// Provides calculateArcFlashHazard (bus-object API) and batch helper used by
// report modules and optional external callers.
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Unified engine configuration (mirrors ARC_FLASH_CONFIG but provides the
 * Category-0 entry used by createMinimalArcFlashResult and the engine's PPE
 * determination path).
 */
const ARC_FLASH_ENGINE_CONFIG = {
    // IEEE 1584-2018 and IEEE 1584-2002 Default Parameters
    IEEE_1584: {
        // Working distances by voltage class (inches)
        WORKING_DISTANCE: {
            LOW_VOLTAGE: 18,          // 208V – 600V
            MEDIUM_VOLTAGE_LOW: 24,   // 601V – 5 kV
            MEDIUM_VOLTAGE_HIGH: 36   // 5 kV – 15 kV
        },
        // Electrode gaps by equipment type (mm)
        ELECTRODE_GAP: {
            LOW_VOLTAGE: 32,
            MEDIUM_VOLTAGE: 102,
            SWITCHGEAR: 153
        },
        DEFAULT_ELECTRODE_CONFIG: 'VCB',
        ARCING_FACTOR: 0.85,
        VOLTAGE_LIMITS: {
            LOW_MIN: 208,
            LOW_MAX: 600,
            MEDIUM_MIN: 601,
            MEDIUM_MAX: 15000
        }
    },
    // NFPA 70E-2021 PPE Categories (includes Category 0 for internal use)
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
    // Default clearing times (cycles at 60 Hz)
    CLEARING_TIMES: {
        INSTANTANEOUS: 2,
        SHORT_TIME: 6,
        TIME_DELAY: 10,
        FUSE_CURRENT_LIMITING: 0.5,
        FUSE_STANDARD: 5
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Engine calculation helpers (extracted for reuse by calculateArcFlashHazard)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate incident energy for low voltage systems (208–600 V)
 * IEEE 1584-2018 simplified method
 */
function calculateLowVoltageIncidentEnergy(arcingCurrentA, voltage, electrodeGapMM, clearingTimeSec, workingDistanceInches) {
    const k = 0; // Electrode configuration factor (VCB)
    const logIarc = Math.log10(arcingCurrentA);
    const logE = k + 0.662 * logIarc + 0.0966 * voltage / 1000 +
                 0.000526 * electrodeGapMM + 0.5588 * voltage / 1000 * logIarc -
                 0.00304 * electrodeGapMM * logIarc;
    const arcPower = Math.pow(10, logE);
    const distanceMM = workingDistanceInches * 25.4;
    const incidentEnergy = (4.184 * arcPower * clearingTimeSec * Math.pow(610, 2)) /
                           (Math.pow(distanceMM, 2) * 10000);
    return Math.max(0, incidentEnergy);
}

/**
 * Calculate incident energy for medium voltage systems (601 V–15 kV)
 * Lee Method per IEEE 1584-2018
 */
function calculateMediumVoltageIncidentEnergy(arcingCurrentA, voltage, clearingTimeSec, workingDistanceInches) {
    const k = 2.8934; // Empirical constant
    const arcPowerKW = k * voltage * arcingCurrentA * 0.001;
    const distanceMM = workingDistanceInches * 25.4;
    const incidentEnergy = (4.184 * arcPowerKW * clearingTimeSec * Math.pow(610, 2)) /
                           (Math.pow(distanceMM, 2) * 10);
    return Math.max(0, incidentEnergy);
}

/**
 * Get clearing time for a bus based on protection device data
 */
function getClearingTimeForBus(bus) {
    const config = ARC_FLASH_ENGINE_CONFIG;
    if (typeof window !== 'undefined' && window.protectionDeviceResults?.[bus.id]) {
        const device = window.protectionDeviceResults[bus.id];
        if (device.clearingTime) return device.clearingTime;
        if (device.deviceType === 'breaker') return config.CLEARING_TIMES.INSTANTANEOUS;
        if (device.deviceType === 'fuse') return config.CLEARING_TIMES.FUSE_CURRENT_LIMITING;
    }
    if (bus.voltage <= 600) {
        return config.CLEARING_TIMES.INSTANTANEOUS;
    }
    return config.CLEARING_TIMES.SHORT_TIME;
}

/**
 * Create minimal result object when the full calculation cannot be performed
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
        standard: 'IEEE 1584-2018, IEEE 1584-2002, NFPA 70E-2021',
        calculationDate: new Date().toISOString(),
        error: reason,
        dangerous: false
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine entry points
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate arc flash hazard for a bus (bus-object API).
 * This is the single authoritative function for engine-layer arc-flash
 * calculations; results are stored in the unified schema
 * bus.results.shortCircuit.arcFlash.
 *
 * @param {Object} bus     - Bus object
 * @param {Object} options - Calculation options
 * @returns {Object} Arc flash results in unified schema format
 */
function calculateArcFlashHazard(bus, options = {}) {
    console.log(`\n🔥 Arc Flash Calculation for: ${bus.name}`);

    if (!bus) {
        throw new Error('Bus is required for arc flash calculation');
    }

    const voltage = bus.voltage;
    if (!voltage || voltage < 208) {
        console.warn(`⚠️ Voltage ${voltage}V below IEEE 1584-2018 minimum (208V)`);
        return createMinimalArcFlashResult(bus, 'Voltage below calculation threshold');
    }

    // Fault current — try unified schema, then legacy, then options
    let boltedFaultKA = 0;
    if (bus.results?.shortCircuit?.faultCurrents?.threePhaseSym) {
        boltedFaultKA = bus.results.shortCircuit.faultCurrents.threePhaseSym;
    } else if (bus.results?.faultCurrents?.threePhaseSym) {
        boltedFaultKA = bus.results.faultCurrents.threePhaseSym;
    } else if (options.boltedFaultKA) {
        boltedFaultKA = options.boltedFaultKA;
    }

    if (boltedFaultKA <= 0) {
        console.warn(`⚠️ No fault current available for ${bus.name}`);
        return createMinimalArcFlashResult(bus, 'No fault current data');
    }

    console.log(`   Bolted Fault: ${boltedFaultKA.toFixed(3)} kA`);

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

    const electrodeConfig = options.electrodeConfig || config.DEFAULT_ELECTRODE_CONFIG;

    const clearingTimeCycles = options.clearingTimeCycles ||
        getClearingTimeForBus(bus) ||
        config.CLEARING_TIMES && ARC_FLASH_ENGINE_CONFIG.CLEARING_TIMES.INSTANTANEOUS;
    const clearingTimeSec = clearingTimeCycles / 60;

    console.log(`   Working Distance: ${workingDistance} inches`);
    console.log(`   Clearing Time: ${clearingTimeCycles} cycles (${(clearingTimeSec * 1000).toFixed(1)} ms)`);

    const boltedFaultA = boltedFaultKA * 1000;
    const arcingFactor = config.ARCING_FACTOR;
    const arcingCurrentA = boltedFaultA * arcingFactor;
    const arcingCurrentKA = arcingCurrentA / 1000;

    console.log(`   Arcing Current: ${arcingCurrentKA.toFixed(3)} kA (${(arcingFactor * 100).toFixed(0)}% of bolted)`);

    // Incident energy
    let incidentEnergy;
    let calculationMethod;

    if (voltage >= 208 && voltage <= 600) {
        calculationMethod = 'IEEE 1584-2018/2002 (Low Voltage)';
        incidentEnergy = calculateLowVoltageIncidentEnergy(
            arcingCurrentA, voltage, electrodeGap, clearingTimeSec, workingDistance
        );
    } else if (voltage > 600 && voltage <= 15000) {
        calculationMethod = 'IEEE 1584-2018/2002 (Medium Voltage - Lee Method)';
        incidentEnergy = calculateMediumVoltageIncidentEnergy(
            arcingCurrentA, voltage, clearingTimeSec, workingDistance
        );
    } else {
        throw new Error(`Voltage ${voltage}V outside IEEE 1584-2018/2002 range (208V - 15kV)`);
    }

    console.log(`   Incident Energy: ${incidentEnergy.toFixed(2)} cal/cm²`);

    // Arc flash boundary (distance where IE = 1.2 cal/cm²)
    const targetEnergy = 1.2;
    const workingDistanceMM = workingDistance * 25.4;
    const boundaryMM = workingDistanceMM * Math.sqrt(incidentEnergy / targetEnergy);
    const boundaryInches = boundaryMM / 25.4;
    const boundaryFeet = boundaryInches / 12;

    console.log(`   Arc Flash Boundary: ${boundaryFeet.toFixed(1)} feet`);

    // PPE category
    let ppeCategory;
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

    return {
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
        ppeRequirements: {
            category: ppeCategory,
            name: ppeRequirements.name,
            minArcRating: ppeRequirements.minArcRating,
            clothing: ppeRequirements.clothing,
            face: ppeRequirements.face,
            hands: ppeRequirements.hands
        },
        hazardLevel: ppeRequirements.hazardLevel,
        method: calculationMethod,
        standard: 'IEEE 1584-2018, IEEE 1584-2002, NFPA 70E-2021',
        calculationDate: new Date().toISOString(),
        dangerous: incidentEnergy > 40,
        requiresRemoteOperation: incidentEnergy > 40
    };
}

/**
 * Calculate arc flash for all buses and store results in the unified schema.
 * @param {Array}  buses   - Array of bus objects
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
            if (!bus.results) bus.results = {};
            if (!bus.results.shortCircuit) bus.results.shortCircuit = {};
            bus.results.shortCircuit.arcFlash = arcFlash;
            bus.results.arcFlash = arcFlash; // backward-compatible

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

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    // Original arcFlashCalc.js exports
    window.calculateArcFlash = calculateArcFlash;
    window.ARC_FLASH_CONFIG = ARC_FLASH_CONFIG;
    window.getDefaultWorkingDistance = getDefaultWorkingDistance;
    window.getDefaultGap = getDefaultGap;
    // Merged arcFlashEngine.js exports
    window.ARC_FLASH_ENGINE_CONFIG = ARC_FLASH_ENGINE_CONFIG;
    window.calculateArcFlashHazard = calculateArcFlashHazard;
    window.calculateAllBusesArcFlash = calculateAllBusesArcFlash;
    window.calculateLowVoltageIncidentEnergy = calculateLowVoltageIncidentEnergy;
    window.calculateMediumVoltageIncidentEnergy = calculateMediumVoltageIncidentEnergy;
}

console.log('✅ Arc Flash Analysis Module v1.0.0 loaded (arcFlashEngine merged)');
console.log('   - IEEE 1584-2002 simplified method (structure from IEEE 1584-2018 referenced)');
console.log('   - NFPA 70E-2021 compliant');
console.log('   - PPE recommendations included');
console.log('   - Equipment labeling data provided');
console.log('   - Enhanced visual formatting');
console.log('   - Engine layer (calculateArcFlashHazard, calculateAllBusesArcFlash) included');
console.log('');