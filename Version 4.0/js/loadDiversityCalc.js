/**
 * Load Diversity Calculation Engine
 * Applies diversity and demand factors to load groups
 * 
 * Standards:
 * - IEEE 141-1993 (Red Book) - Diversity Factors
 * - NEC Article 220 - Demand Factors
 * - API RP 540 - Petroleum Processing
 * - IEEE 3004.5 - Industrial Power Systems
 * 
 * @author bfforex
 * @date 2025-11-01 08:29:23 UTC
 * @version 1.0.0
 */

console.log('🔧 Loading Load Diversity Calculation Engine v1.0.0...');

/**
 * Calculate diversified load for a group of components
 * 
 * @param {Array} components - Array of components (motors, loads, etc.)
 * @param {String} loadType - Type of load ('motors', 'welders', 'cranes', etc.)
 * @param {Object} options - Optional settings
 * @returns {Object} Diversified load calculation results
 */
function calculateDiversifiedLoad(components, loadType, options = {}) {
    console.log(`\n📊 Calculating diversified load for ${components.length} ${loadType}...`);
    
    // Input validation
    if (!Array.isArray(components) || components.length === 0) {
        console.warn('⚠️ No components provided for diversity calculation');
        return {
            connectedLoad: 0,
            diversifiedLoad: 0,
            diversityFactor: 1.0,
            demandFactor: 1.0,
            components: [],
            loadType: loadType,
            calculationSteps: 'No components to calculate'
        };
    }
    
    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += 'LOAD DIVERSITY CALCULATION\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Load Type: ${loadType}\n`;
    steps += `Number of Components: ${components.length}\n`;
    steps += `Calculation Method: IEEE 141-1993, NEC Article 220\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 1: Calculate total connected load
    // ═══════════════════════════════════════════════════════════════════
    
    let connectedLoad = 0;
    const componentLoads = [];
    
    steps += 'STEP 1: CONNECTED LOAD CALCULATION\n';
    steps += '-'.repeat(80) + '\n';
    
    components.forEach((comp, idx) => {
        let compLoad = 0;
        let compName = comp.name || comp.tag || `Component ${idx + 1}`;
        
        // Determine load based on component type
        if (comp.type === 'motor') {
            // Motor: Use FLC (Full Load Current)
            compLoad = comp.fullLoadCurrent || comp.flc || comp.current || 0;
        } else if (comp.type === 'transformer') {
            // Transformer: Calculate from rating and voltage
            const rating = comp.rating || 0; // kVA
            const voltage = comp.secondary || comp.voltage || 480;
            const SQRT3 = Math.sqrt(3);
            compLoad = (rating * 1000) / (SQRT3 * voltage);
        } else if (comp.type === 'load') {
            // Generic load: Use provided current
            compLoad = comp.current || comp.loadCurrent || 0;
        } else {
            // Other: Try to get current from component
            compLoad = comp.current || comp.loadCurrent || comp.flc || 0;
        }
        
        componentLoads.push({
            component: comp,
            name: compName,
            load: compLoad,
            type: comp.type
        });
        
        connectedLoad += compLoad;
        
        steps += `${idx + 1}. ${compName}: ${compLoad.toFixed(2)} A\n`;
    });
    
    steps += '-'.repeat(80) + '\n';
    steps += `Total Connected Load: ${connectedLoad.toFixed(2)} A\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 2: Determine diversity factor
    // ═══════════════════════════════════════════════════════════════════
    
    steps += 'STEP 2: DIVERSITY FACTOR DETERMINATION\n';
    steps += '-'.repeat(80) + '\n';
    
    let diversityFactor = 1.0;
    let demandFactor = 1.0;
    let source = 'Default (no diversity)';
    
    // Get diversity factor based on load type
    if (typeof window !== 'undefined' && window.DIVERSITY_FACTORS) {
        const DF = window.DIVERSITY_FACTORS;
        
        switch(loadType.toLowerCase()) {
            case 'motors':
            case 'motor':
                diversityFactor = DF.motors.getDiversityFactor(components.length);
                source = 'IEEE 141-1993 Table 3-5';
                break;
                
            case 'welders':
            case 'welding':
            case 'arc_welders':
                diversityFactor = DF.welding.arc_welders_30_duty;
                source = 'IEEE 141-1993 Section 3.3';
                break;
                
            case 'welding_bays':
                if (components.length <= 5) {
                    diversityFactor = DF.welding.welding_bays['1_5_welders'];
                } else if (components.length <= 10) {
                    diversityFactor = DF.welding.welding_bays['6_10_welders'];
                } else {
                    diversityFactor = DF.welding.welding_bays['11_plus_welders'];
                }
                source = 'IEEE 141-1993 (Welding Bays)';
                break;
                
            case 'cranes':
            case 'crane':
                if (components.length === 1) {
                    diversityFactor = DF.cranes['1_crane'];
                } else if (components.length === 2) {
                    diversityFactor = DF.cranes['2_cranes'];
                } else if (components.length <= 5) {
                    diversityFactor = DF.cranes['3_5_cranes'];
                } else {
                    diversityFactor = DF.cranes['6_plus_cranes'];
                }
                source = 'IEEE 141-1993 Table 3-5';
                break;
                
            case 'lng_compressors':
            case 'lng_critical':
                diversityFactor = DF.lng_plant.critical_process.main_compressors;
                source = 'API RP 540 (Critical Process)';
                break;
                
            case 'lng_utilities':
                diversityFactor = DF.lng_plant.utilities.plant_air;
                source = 'API RP 540 (Utilities)';
                break;
                
            case 'fabrication':
                diversityFactor = DF.fabrication_yard.welding.multiple_bays;
                source = 'IEEE 3004.5 (Fabrication)';
                break;
                
            default:
                diversityFactor = 1.0;
                source = 'Default (unknown type, no diversity applied)';
        }
    }
    
    // Check for manual override
    if (options.diversityFactor && options.diversityFactor >= 1.0) {
        diversityFactor = options.diversityFactor;
        source = 'Manual Override';
    }
    
    demandFactor = 1.0 / diversityFactor;
    
    steps += `Load Type: ${loadType}\n`;
    steps += `Number of Components: ${components.length}\n`;
    steps += `Diversity Factor (DF): ${diversityFactor.toFixed(3)} (≥ 1.0)\n`;
    steps += `Demand Factor (Kd): ${demandFactor.toFixed(3)} (= 1/DF)\n`;
    steps += `Source: ${source}\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 3: Calculate diversified load
    // ═══════════════════════════════════════════════════════════════════
    
    steps += 'STEP 3: DIVERSIFIED LOAD CALCULATION\n';
    steps += '-'.repeat(80) + '\n';
    
    const diversifiedLoad = connectedLoad * demandFactor;
    const reductionPercent = ((connectedLoad - diversifiedLoad) / connectedLoad) * 100;
    
    steps += `Formula: Diversified Load = Connected Load × Demand Factor\n`;
    steps += `         Diversified Load = Connected Load / Diversity Factor\n\n`;
    steps += `Calculation:\n`;
    steps += `  Connected Load: ${connectedLoad.toFixed(2)} A\n`;
    steps += `  Demand Factor:  ${demandFactor.toFixed(3)} (Kd)\n`;
    steps += `  Diversified Load: ${connectedLoad.toFixed(2)} × ${demandFactor.toFixed(3)} = ${diversifiedLoad.toFixed(2)} A\n\n`;
    steps += `Load Reduction: ${reductionPercent.toFixed(1)}%\n`;
    steps += `  (Not all equipment operates simultaneously)\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 4: Apply continuous duty multiplier (if applicable)
    // ═══════════════════════════════════════════════════════════════════
    
    let finalLoad = diversifiedLoad;
    let continuousMultiplier = 1.0;
    
    if (loadType.toLowerCase() === 'motors' || loadType.toLowerCase() === 'motor') {
        // Check if motors are continuous duty
        const isContinuous = options.continuousDuty !== false; // Default to true
        
        if (isContinuous) {
            continuousMultiplier = 1.25; // NEC 430.24
            finalLoad = diversifiedLoad * continuousMultiplier;
            
            steps += 'STEP 4: CONTINUOUS DUTY ADJUSTMENT\n';
            steps += '-'.repeat(80) + '\n';
            steps += `Per NEC 430.24: Motors running >3 hours require 125% multiplier\n`;
            steps += `Continuous Multiplier: ${continuousMultiplier.toFixed(2)}\n`;
            steps += `Final Load: ${diversifiedLoad.toFixed(2)} × ${continuousMultiplier.toFixed(2)} = ${finalLoad.toFixed(2)} A\n\n`;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // STEP 5: Summary
    // ═══════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LOAD DIVERSITY SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Connected Load:        ${connectedLoad.toFixed(2)} A (100.0%)\n`;
    steps += `Diversity Factor:      ${diversityFactor.toFixed(3)} (DF)\n`;
    steps += `Demand Factor:         ${demandFactor.toFixed(3)} (Kd = 1/DF)\n`;
    steps += `Diversified Load:      ${diversifiedLoad.toFixed(2)} A (${(demandFactor * 100).toFixed(1)}%)\n`;
    if (continuousMultiplier > 1.0) {
        steps += `Continuous Multiplier: ${continuousMultiplier.toFixed(2)} (NEC 430.24)\n`;
        steps += `Final Design Load:     ${finalLoad.toFixed(2)} A (${((finalLoad / connectedLoad) * 100).toFixed(1)}%)\n`;
    }
    steps += `\nLoad Reduction:        ${(connectedLoad - diversifiedLoad).toFixed(2)} A (${reductionPercent.toFixed(1)}%)\n`;
    steps += `\nStandards Applied:\n`;
    steps += `  ✓ IEEE 141-1993 - Diversity Factors\n`;
    steps += `  ✓ NEC Article 220 - Demand Factors\n`;
    if (loadType.includes('lng')) {
        steps += `  ✓ API RP 540 - LNG Plant Loads\n`;
    }
    if (loadType.includes('fabrication')) {
        steps += `  ✓ IEEE 3004.5 - Fabrication Loads\n`;
    }
    steps += '\n';
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF LOAD DIVERSITY CALCULATION\n';
    steps += '═'.repeat(80) + '\n';
    
    // ═══════════════════════════════════════════════════════════════════
    // Return results
    // ═══════════════════════════════════════════════════════════════════
    
    const results = {
        // Input data
        loadType: loadType,
        componentCount: components.length,
        components: componentLoads,
        
        // Load calculations
        connectedLoad: connectedLoad,
        diversifiedLoad: diversifiedLoad,
        finalLoad: finalLoad,
        
        // Factors
        diversityFactor: diversityFactor,
        demandFactor: demandFactor,
        continuousMultiplier: continuousMultiplier,
        
        // Analysis
        loadReduction: connectedLoad - diversifiedLoad,
        loadReductionPercent: reductionPercent,
        
        // Standards
        source: source,
        standards: [
            'IEEE 141-1993',
            'NEC Article 220'
        ],
        
        // Documentation
        calculationSteps: steps,
        calculationDate: new Date().toISOString()
    };
    
    console.log(`✅ Load diversity calculation complete`);
    console.log(`   Connected: ${connectedLoad.toFixed(2)} A`);
    console.log(`   Diversified: ${diversifiedLoad.toFixed(2)} A (${demandFactor.toFixed(3)} × connected)`);
    console.log(`   Reduction: ${reductionPercent.toFixed(1)}%`);
    
    return results;
}

/**
 * Apply diversity to downstream load calculation
 * Integrates with existing calculateDownstreamLoad function
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} options - Diversity options
 * @returns {Object} Load with diversity applied
 */
function calculateDownstreamLoadWithDiversity(busId, options = {}) {
    // Get base downstream load (existing function)
    let baseLoad = 0;
    if (typeof window !== 'undefined' && typeof window.calculateDownstreamLoad === 'function') {
        baseLoad = window.calculateDownstreamLoad(busId);
    }
    
    // Get all components connected to this bus
    const buses = (typeof window !== 'undefined' && window.buses) ? window.buses : [];
    const bus = buses.find(b => b.id === busId);
    
    if (!bus) {
        return {
            baseLoad: baseLoad,
            diversifiedLoad: baseLoad,
            diversityFactor: 1.0,
            applied: false
        };
    }
    
    // Find connected components
    const connectedComponents = [];
    
    // Check for motors
    if (typeof window !== 'undefined' && window.motors && Array.isArray(window.motors)) {
        const busMotors = window.motors.filter(m => m.bus === busId || m.busId === busId);
        connectedComponents.push(...busMotors);
    }
    
    // If we have components, apply diversity
    if (connectedComponents.length > 1 && options.applyDiversity !== false) {
        const loadType = options.loadType || 'motors';
        const diversityCalc = calculateDiversifiedLoad(connectedComponents, loadType, options);
        
        return {
            baseLoad: baseLoad,
            connectedLoad: diversityCalc.connectedLoad,
            diversifiedLoad: diversityCalc.finalLoad,
            diversityFactor: diversityCalc.diversityFactor,
            demandFactor: diversityCalc.demandFactor,
            loadReduction: diversityCalc.loadReduction,
            loadReductionPercent: diversityCalc.loadReductionPercent,
            applied: true,
            details: diversityCalc
        };
    }
    
    return {
        baseLoad: baseLoad,
        diversifiedLoad: baseLoad,
        diversityFactor: 1.0,
        applied: false,
        reason: 'Single component or diversity disabled'
    };
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════

window.calculateDiversifiedLoad = calculateDiversifiedLoad;
window.calculateDownstreamLoadWithDiversity = calculateDownstreamLoadWithDiversity;

// ═══════════════════════════════════════════════════════════════════════
// DemandFactors CLASS - MOTOR DEMAND CALCULATIONS
// Required by loadFlowCalc.js
// (Consolidated from demandFactors.js)
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.DemandFactors === 'undefined') {

    /**
     * DemandFactors Class
     * Handles motor demand factor calculations per NEC Article 430
     */
    class DemandFactors {
        constructor() {
            console.log('🔧 DemandFactors instance created');
        }

        /**
         * Calculate motor demand per NEC Article 430.24
         *
         * @param {Number} fullLoadCurrent - Motor FLC in amperes
         * @param {String} dutyType - 'continuous' or 'intermittent'
         * @param {Number} motorCount - Number of motors in group
         * @returns {Object} Demand calculation result
         */
        calculateMotorDemand(fullLoadCurrent, dutyType = 'continuous', motorCount = 1) {
            let demandFactor = 1.0;
            let necReference = 'NEC 430.24';
            let multiplier = 1.0;

            if (dutyType === 'continuous') {
                multiplier = 1.25;
                necReference = 'NEC 430.24 (continuous duty)';
            }

            if (motorCount === 1) {
                demandFactor = 1.00;
            } else if (motorCount === 2) {
                demandFactor = 0.95;
            } else if (motorCount <= 3) {
                demandFactor = 0.91;
            } else if (motorCount <= 5) {
                demandFactor = 0.85;
            } else if (motorCount <= 10) {
                demandFactor = 0.80;
            } else if (motorCount <= 15) {
                demandFactor = 0.77;
            } else {
                demandFactor = 0.74;
            }

            const demandLoad = fullLoadCurrent * demandFactor * multiplier;

            return {
                fullLoadCurrent: fullLoadCurrent,
                demandFactor: demandFactor,
                multiplier: multiplier,
                demandLoad: demandLoad,
                dutyType: dutyType,
                motorCount: motorCount,
                necReference: necReference,
                formula: `I_demand = FLC × ${demandFactor.toFixed(3)} × ${multiplier.toFixed(2)} = ${demandLoad.toFixed(2)} A`
            };
        }

        /**
         * Calculate demand for lighting loads per NEC Article 220.42
         *
         * @param {Number} connectedLoad - Connected lighting load in VA
         * @param {String} buildingType - 'dwelling', 'office', 'industrial', 'storage'
         * @returns {Object} Demand calculation result
         */
        calculateLightingDemand(connectedLoad, buildingType = 'industrial') {
            let demandFactor = 1.0;
            let necReference = 'NEC 220.42';

            switch (buildingType.toLowerCase()) {
                case 'dwelling':
                    if (connectedLoad <= 3000) {
                        demandFactor = 1.0;
                    } else if (connectedLoad <= 120000) {
                        const first3000 = 3000;
                        const next = connectedLoad - 3000;
                        demandFactor = (first3000 + next * 0.35) / connectedLoad;
                    } else {
                        const first3000 = 3000;
                        const next117000 = 117000;
                        const remainder = connectedLoad - 120000;
                        demandFactor = (first3000 + next117000 * 0.35 + remainder * 0.25) / connectedLoad;
                    }
                    necReference = 'NEC 220.42 (dwelling)';
                    break;
                case 'office':
                    demandFactor = 1.0;
                    necReference = 'NEC 220.42 (office)';
                    break;
                case 'storage':
                    demandFactor = 0.7;
                    necReference = 'NEC 220.42 (storage)';
                    break;
                case 'industrial':
                default:
                    demandFactor = 0.8;
                    necReference = 'NEC 220.42 (industrial)';
                    break;
            }

            const demandLoad = connectedLoad * demandFactor;

            return {
                connectedLoad: connectedLoad,
                demandFactor: demandFactor,
                demandLoad: demandLoad,
                buildingType: buildingType,
                necReference: necReference,
                formula: `Demand = ${connectedLoad.toFixed(0)} VA × ${demandFactor.toFixed(3)} = ${demandLoad.toFixed(0)} VA`
            };
        }

        /**
         * Calculate receptacle demand per NEC Article 220.44
         *
         * @param {Number} connectedLoad - Connected receptacle load in VA
         * @returns {Object} Demand calculation result
         */
        calculateReceptacleDemand(connectedLoad) {
            let demandLoad = 0;
            const necReference = 'NEC 220.44';

            if (connectedLoad <= 10000) {
                demandLoad = connectedLoad;
            } else {
                const first10kVA = 10000;
                const remainder = connectedLoad - 10000;
                demandLoad = first10kVA + (remainder * 0.5);
            }

            const demandFactor = connectedLoad > 0 ? demandLoad / connectedLoad : 1.0;

            return {
                connectedLoad: connectedLoad,
                demandFactor: demandFactor,
                demandLoad: demandLoad,
                necReference: necReference,
                formula: connectedLoad <= 10000
                    ? `Demand = ${connectedLoad.toFixed(0)} VA (100%)`
                    : `Demand = 10,000 VA + (${(connectedLoad - 10000).toFixed(0)} VA × 50%) = ${demandLoad.toFixed(0)} VA`
            };
        }
    }

    window.DemandFactors = DemandFactors;
    window.demandFactorsInstance = new DemandFactors();

    console.log('✅ DemandFactors class initialized');
    console.log('   - window.DemandFactors: Available');
    console.log('   - window.demandFactorsInstance: Created');

} else {
    console.log('ℹ️ DemandFactors class already loaded');
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// (Consolidated from demandFactors.js)
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.diversityToDemand !== 'function') {
    /**
     * Convert Diversity Factor to Demand Factor
     * @param {Number} diversityFactor - DF (≥ 1.0)
     * @returns {Number} Demand Factor (≤ 1.0)
     */
    window.diversityToDemand = function(diversityFactor) {
        if (diversityFactor < 1.0) {
            console.warn(`⚠️ Diversity factor ${diversityFactor} < 1.0 (should be ≥ 1.0)`);
            return 1.0;
        }
        return 1.0 / diversityFactor;
    };
}

if (typeof window.demandToDiversity !== 'function') {
    /**
     * Convert Demand Factor to Diversity Factor
     * @param {Number} demandFactor - Kd (≤ 1.0)
     * @returns {Number} Diversity Factor (≥ 1.0)
     */
    window.demandToDiversity = function(demandFactor) {
        if (demandFactor > 1.0) {
            console.warn(`⚠️ Demand factor ${demandFactor} > 1.0 (should be ≤ 1.0 for diversity)`);
            return 1.0;
        }
        if (demandFactor <= 0) {
            console.error(`❌ Demand factor ${demandFactor} ≤ 0 (invalid)`);
            return 1.0;
        }
        return 1.0 / demandFactor;
    };
}

if (typeof window.calculateDiversifiedLoadSimple !== 'function') {
    /**
     * Calculate diversified load (simple version)
     * @param {Number} connectedLoad - Total connected load
     * @param {Number} diversityFactor - DF (≥ 1.0)
     * @returns {Number} Actual diversified load
     */
    window.calculateDiversifiedLoadSimple = function(connectedLoad, diversityFactor) {
        const demandFactor = window.diversityToDemand(diversityFactor);
        const diversifiedLoad = connectedLoad * demandFactor;

        console.log(`📊 Load Calculation:`);
        console.log(`   Connected Load: ${connectedLoad.toFixed(2)} A`);
        console.log(`   Diversity Factor: ${diversityFactor.toFixed(2)} (DF)`);
        console.log(`   Demand Factor: ${demandFactor.toFixed(2)} (Kd = 1/DF)`);
        console.log(`   Diversified Load: ${diversifiedLoad.toFixed(2)} A`);

        return diversifiedLoad;
    };
}

if (typeof window.getMotorDiversityFactor !== 'function') {
    /**
     * Get motor diversity factor by count
     * @param {Number} motorCount - Number of motors
     * @returns {Number} Diversity Factor (≥ 1.0)
     */
    window.getMotorDiversityFactor = function(motorCount) {
        return window.DIVERSITY_FACTORS.motors.getDiversityFactor(motorCount);
    };
}

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED SYSTEM DEMAND CALCULATION
// (Consolidated from demandFactors.js v3.3)
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.computeSystemDemand !== 'function') {
    /**
     * Compute system-wide demand with Level-1 and Level-2 diversity
     *
     * @param {Array} buses - Array of bus objects with results
     * @param {Object} options - Calculation options
     * @returns {Object} System demand results
     */
    window.computeSystemDemand = function(buses, options = {}) {
        console.log('\n═══════════════════════════════════════════════════════════════════');
        console.log('UNIFIED SYSTEM DEMAND CALCULATION (v3.3)');
        console.log('═══════════════════════════════════════════════════════════════════\n');

        if (!buses || buses.length === 0) {
            console.warn('⚠️ No buses provided for system demand calculation');
            return null;
        }

        const substationBuses = buses.filter(b =>
            b.type === 'distribution' || b.type === 'substation' ||
            b.name?.toLowerCase().includes('lc') || b.name?.toLowerCase().includes('ss')
        );

        const substations = [];
        let sumOfSubstationMDs = 0;
        let totalConnectedLoad = 0;

        substationBuses.forEach(bus => {
            const loadFlow = bus.results?.loadFlow;
            const summary = loadFlow?.summary || {};
            const demandSummary = loadFlow?.demandSummary || {};

            const connected = demandSummary.connectedCurrent || summary.totalCurrent || 0;

            let substationType = 'fabrication_shops';
            if (bus.name?.toLowerCase().includes('office')) substationType = 'office_substations';
            else if (bus.name?.toLowerCase().includes('warehouse')) substationType = 'warehouse';
            else if (bus.name?.toLowerCase().includes('maint')) substationType = 'maintenance_shop';
            else if (bus.name?.toLowerCase().includes('weld')) substationType = 'welding_bay';

            const substationDF = window.SYSTEM_LEVEL_DIVERSITY?.heavy_fabrication_yard?.[substationType]?.diversityFactor || 1.25;

            const md = connected / substationDF;
            const voltage = bus.voltage || 440;
            const kva = (md * voltage * Math.sqrt(3)) / 1000;

            substations.push({
                busId: bus.id,
                busName: bus.name,
                voltage: voltage,
                connectedCurrent: connected,
                diversityFactor: substationDF,
                md: md,
                kva: kva,
                substationType: substationType
            });

            sumOfSubstationMDs += md;
            totalConnectedLoad += connected;
        });

        const substationCount = substations.length;
        const systemDF = window.SYSTEM_LEVEL_DIVERSITY?.getSystemDiversityFactor?.(substationCount, 'heavy_fabrication_yard') || 1.45;

        const totalSystemMD = sumOfSubstationMDs / systemDF;

        const avgVoltage = substations.length > 0
            ? substations.reduce((sum, s) => sum + s.voltage, 0) / substations.length
            : 440;
        const totalSystemKVA = (totalSystemMD * avgVoltage * Math.sqrt(3)) / 1000;

        const reductionFromSubstationMDs = sumOfSubstationMDs - totalSystemMD;
        const reductionFromConnected = totalConnectedLoad - totalSystemMD;

        const reductionPercentFromMDs = sumOfSubstationMDs > 0
            ? (reductionFromSubstationMDs / sumOfSubstationMDs) * 100
            : 0;
        const reductionPercentFromConnected = totalConnectedLoad > 0
            ? (reductionFromConnected / totalConnectedLoad) * 100
            : 0;

        const result = {
            substations: substations,
            systemLevel: {
                substationCount: substationCount,
                sumOfSubstationMDs: sumOfSubstationMDs,
                systemDiversityFactor: systemDF,
                totalSystemMD: totalSystemMD,
                totalSystemKVA: totalSystemKVA,
                referenceVoltage: avgVoltage,
                connectedLoad: totalConnectedLoad,
                reductionFromSubstationMDs: reductionFromSubstationMDs,
                reductionFromConnected: reductionFromConnected,
                reductionPercentFromMDs: reductionPercentFromMDs,
                reductionPercentFromConnected: reductionPercentFromConnected
            },
            calculationDate: new Date().toISOString(),
            calculationMethod: 'IEEE 141-1993 with System Diversity',
            version: '3.3.0'
        };

        console.log('LEVEL 1 - SUBSTATION MDs:');
        substations.forEach(s => {
            console.log(`  ${s.busName}: ${s.md.toFixed(2)} A (DF=${s.diversityFactor.toFixed(2)})`);
        });

        console.log('\nLEVEL 2 - SYSTEM TOTALS:');
        console.log(`  Sum of Substation MDs: ${sumOfSubstationMDs.toFixed(2)} A`);
        console.log(`  System Diversity Factor: ${systemDF.toFixed(2)}`);
        console.log(`  Total System MD: ${totalSystemMD.toFixed(2)} A (${totalSystemKVA.toFixed(2)} kVA)`);
        console.log(`  Reduction vs Sum of MDs: ${reductionPercentFromMDs.toFixed(1)}% (${reductionFromSubstationMDs.toFixed(2)} A)`);
        console.log(`  Reduction vs Connected: ${reductionPercentFromConnected.toFixed(1)}% (${reductionFromConnected.toFixed(2)} A)`);

        return result;
    };

    console.log('✅ computeSystemDemand function added (v3.3)');
}

// ═══════════════════════════════════════════════════════════════════════
// DEMAND FACTOR HANDLER
// Unified demand factor management per NEC 2023 and IEEE 141-1993
// (Consolidated from demandFactorHandler.js)
// ═══════════════════════════════════════════════════════════════════════

if (typeof window.DemandFactorHandler === 'undefined') {
    /**
     * Demand Factor Handler - Unified demand factor management
     * CRITICAL: Short Circuit and Arc Flash NEVER use demand factors.
     */
    const DemandFactorHandler = {
        config: {
            userDemandFactors: {},
            ieeeDefault: 0.85,
            allowedCalculations: {
                loadFlow: true,
                voltageDropOperating: true,
                voltageDropDesign: false,
                shortCircuit: false,
                arcFlash: false,
                cableSizing: false,
                equipmentRating: false,
                transformerLoading: true
            }
        },

        setUserFactor: function(busId, factor) {
            if (typeof busId !== 'string' || busId.length === 0) {
                console.warn('[DemandFactorHandler] Invalid busId: must be non-empty string');
                return;
            }
            const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
            if (dangerousKeys.includes(busId.toLowerCase())) {
                console.warn(`[DemandFactorHandler] Security: Blocked dangerous busId: ${busId}`);
                return;
            }
            if (typeof factor !== 'number' || factor < 0 || factor > 1) {
                console.warn(`[DemandFactorHandler] Invalid factor ${factor} for bus ${busId}. Must be number 0.0-1.0`);
                return;
            }
            this.config.userDemandFactors[busId] = factor;
            console.log(`[DemandFactorHandler] Set demand factor for bus ${busId}: ${(factor * 100).toFixed(1)}%`);
        },

        getUserFactor: function(busId) {
            return this.config.userDemandFactors[busId] || null;
        },

        clearUserFactor: function(busId) {
            delete this.config.userDemandFactors[busId];
            console.log(`[DemandFactorHandler] Cleared demand factor for bus ${busId}`);
        },

        getFactorFor: function(calculationType, busId) {
            if (!this.config.allowedCalculations[calculationType]) {
                console.log(`[DemandFactorHandler] ${calculationType}: Using 100% FLC (protected calculation)`);
                return 1.0;
            }
            if (busId && this.config.userDemandFactors[busId]) {
                const userFactor = this.config.userDemandFactors[busId];
                console.log(`[DemandFactorHandler] ${calculationType}: Using user-specified ${(userFactor * 100).toFixed(1)}%`);
                return userFactor;
            }
            console.log(`[DemandFactorHandler] ${calculationType}: Using IEEE default ${(this.config.ieeeDefault * 100).toFixed(1)}%`);
            return this.config.ieeeDefault;
        },

        isAllowed: function(calculationType) {
            return this.config.allowedCalculations[calculationType] === true;
        },

        getSourceDescription: function(calculationType, busId) {
            if (!this.isAllowed(calculationType)) {
                return 'Full Load Current (100%) - Per NEC/IEEE Standards';
            }
            if (busId && this.config.userDemandFactors[busId]) {
                const factor = this.config.userDemandFactors[busId];
                return `User Input (${(factor * 100).toFixed(1)}%)`;
            }
            return `IEEE 141-1993 Default (${(this.config.ieeeDefault * 100).toFixed(1)}%)`;
        },

        getExplanation: function(calculationType) {
            const explanations = {
                loadFlow: 'Load flow analysis uses demand factors to represent actual operating conditions.',
                voltageDropOperating: 'Operating voltage drop uses demand factors for realistic operating analysis.',
                voltageDropDesign: 'Design voltage drop uses 100% FLC for conservative cable sizing per NEC.',
                shortCircuit: 'Short circuit analysis NEVER uses demand factors. Per IEEE 141-1993 Section 5.2, fault calculations must use maximum available current for proper protection device coordination.',
                arcFlash: 'Arc flash analysis NEVER uses demand factors. Per IEEE 1584-2018, incident energy calculations must use bolted fault current for accurate hazard assessment.',
                cableSizing: 'Cable sizing uses 100% FLC for conservative design per NEC Article 310.',
                equipmentRating: 'Equipment rating uses 100% FLC for conservative sizing.',
                transformerLoading: 'Transformer loading analysis uses demand factors for actual operating conditions.'
            };
            return explanations[calculationType] || 'No specific guidance available.';
        },

        getRules: function() {
            const rules = {};
            for (const calcType in this.config.allowedCalculations) {
                rules[calcType] = {
                    allowed: this.config.allowedCalculations[calcType],
                    factor: this.getFactorFor(calcType),
                    description: this.getSourceDescription(calcType),
                    explanation: this.getExplanation(calcType)
                };
            }
            return rules;
        }
    };

    window.DemandFactorHandler = DemandFactorHandler;

    console.log('✅ DemandFactorHandler loaded');
    console.log('   - Short Circuit: NEVER uses demand factors (100% FLC)');
    console.log('   - Arc Flash: NEVER uses demand factors (100% FLC)');
    console.log('   - Load Flow: Uses demand factors (configurable)');
    console.log('   - Voltage Drop Design: 100% FLC (conservative)');
    console.log('   - Cable Sizing: 100% FLC per NEC');
    console.log('   - IEEE 141-1993 Default: 85%');
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED DIVERSITY FACTORS
// IEEE 141-1993 Table 3-5 compliant bus-level diversity calculations
// (Consolidated from enhancedDiversityFactors.js)
// ═══════════════════════════════════════════════════════════════════════

// Motor group and load-type diversity configuration (IEEE 141-1993 Table 3-5)
const _ENHANCED_DIVERSITY_CONFIG = {
    MOTOR_DIVERSITY: {
        1:  1.00,
        2:  1.05,
        3:  1.10,
        4:  1.15,
        5:  1.18,
        10: 1.25,
        15: 1.30,
        20: 1.35
    },
    LOAD_TYPE_DIVERSITY: {
        lighting_continuous: 1.00,
        lighting_general:    1.20,
        receptacles:         1.35,
        receptacles_min:     1.30,
        receptacles_max:     1.40,
        hvac:                1.10,
        welding:             1.50,
        other:               1.15
    },
    DEFAULT_DIVERSITY: 1.20
};

/**
 * Calculate motor diversity factor per IEEE 141-1993 Table 3-5.
 * This version includes the 4-motor breakpoint (1.15) as specified in the table.
 *
 * @param {Number} motorCount
 * @returns {Number} Diversity factor
 */
function _getEnhancedMotorDiversityFactor(motorCount) {
    if (motorCount <= 1)  return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[1];
    if (motorCount === 2) return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[2];
    if (motorCount <= 3)  return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[3];
    if (motorCount <= 4)  return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[4];
    if (motorCount <= 5)  return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[5];
    if (motorCount <= 10) return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[10];
    if (motorCount <= 15) return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[15];
    return _ENHANCED_DIVERSITY_CONFIG.MOTOR_DIVERSITY[20];
}

/**
 * Calculate diversity factor for a specific load type.
 *
 * @param {String} loadType
 * @returns {Number} Diversity factor
 */
function getLoadTypeDiversityFactor(loadType) {
    const normalizedType = loadType?.toLowerCase() || 'other';

    if (normalizedType.includes('light')) {
        if (normalizedType.includes('continuous')) {
            return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.lighting_continuous;
        }
        return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.lighting_general;
    } else if (normalizedType.includes('receptacle') || normalizedType.includes('outlet')) {
        return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.receptacles;
    } else if (normalizedType.includes('hvac') || normalizedType.includes('air')) {
        return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.hvac;
    } else if (normalizedType.includes('weld')) {
        return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.welding;
    }

    return _ENHANCED_DIVERSITY_CONFIG.LOAD_TYPE_DIVERSITY.other;
}

/**
 * Calculate composite diversity factor for a bus based on its loads.
 *
 * @param {Object} bus - Bus object
 * @returns {Object} Diversity factor calculation breakdown
 */
function calculateBusDiversityFactor(bus) {
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

    const motors = busComponents.filter(c => c.type === 'motor');
    const otherLoads = busComponents.filter(c => c.type !== 'motor');

    const motorCount = motors.length;
    const motorDF = _getEnhancedMotorDiversityFactor(motorCount);

    const motorKVA = motors.reduce((sum, motor) => {
        const hp = motor.hp || motor.power || 0;
        const kw = hp * 0.746;
        const pf = 0.85;
        const kva = kw / pf;
        return sum + kva;
    }, 0);

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
            loadKVA = load.kw / 0.85;
        } else if (load.current) {
            const voltage = load.voltage || bus.voltage || 480;
            loadKVA = (load.current * voltage * Math.sqrt(3)) / 1000;
        }

        otherKVA += loadKVA;
        otherWeightedDF += loadKVA * loadDF;

        loadBreakdown.push({ type: loadType, kva: loadKVA, diversityFactor: loadDF });
    });

    const otherDF = otherKVA > 0 ? otherWeightedDF / otherKVA : 1.00;
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
 * Apply enhanced diversity factors to all buses.
 * Stores diversity summary in bus.results.loadFlow.diversitySummary.
 *
 * @param {Array} buses - Array of all buses
 */
function applyEnhancedDiversityFactors(buses) {
    buses.forEach(bus => {
        if (!bus.results) bus.results = {};
        if (!bus.results.loadFlow) bus.results.loadFlow = {};

        const diversitySummary = calculateBusDiversityFactor(bus);
        bus.results.loadFlow.diversitySummary = diversitySummary;

        if (bus.results.loadFlow.summary) {
            const connectedCurrent = bus.results.loadFlow.summary.totalCurrent || 0;
            const diversifiedCurrent = connectedCurrent / diversitySummary.diversityFactor;

            bus.results.loadFlow.summary.diversityFactor = diversitySummary.diversityFactor;
            bus.results.loadFlow.summary.diversifiedCurrent = diversifiedCurrent;
        }
    });
}

/**
 * Generate diversity factors table for report (IEEE 141-1993 Table 3-5).
 *
 * @param {Array} buses - Array of all buses
 * @returns {String} Diversity factors report section
 */
function generateDiversityFactorsReport(buses) {
    let report = `${'='.repeat(100)}
DIVERSITY FACTORS ANALYSIS (IEEE 141-1993 Table 3-5)
${'='.repeat(100)}

`;

    const busesWithDiversity = buses.filter(b => b.results?.loadFlow?.diversitySummary);

    if (busesWithDiversity.length === 0) {
        report += 'No diversity factor data available.\n\n';
        return report;
    }

    report += `Buses Analyzed: ${busesWithDiversity.length}\n\n`;

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
        if (motorCount <= 1)       motorGroups['Single Motor (1)'].buses.push(bus);
        else if (motorCount === 2) motorGroups['2 Motors'].buses.push(bus);
        else if (motorCount === 3) motorGroups['3 Motors'].buses.push(bus);
        else if (motorCount === 4) motorGroups['4 Motors'].buses.push(bus);
        else if (motorCount === 5) motorGroups['5 Motors'].buses.push(bus);
        else if (motorCount <= 10) motorGroups['Group (6-10)'].buses.push(bus);
        else if (motorCount <= 15) motorGroups['Group (11-15)'].buses.push(bus);
        else                       motorGroups['Large Group (>15)'].buses.push(bus);
    });

    Object.keys(motorGroups).forEach(groupName => {
        const group = motorGroups[groupName];
        if (group.buses.length > 0) {
            report += `${groupName.padEnd(25)}${group.df.toFixed(2).padEnd(20)}${group.buses.length.toString().padEnd(20)}\n`;
        }
    });

    report += `\n`;

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
 * Generate diversity factor breakdown for a specific bus.
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

// ═══════════════════════════════════════════════════════════════════════
// FINAL MODULE STATUS
// ═══════════════════════════════════════════════════════════════════════

console.log('✅ Load Diversity Calculation Engine loaded');
console.log('   - calculateDiversifiedLoad: READY');
console.log('   - calculateDownstreamLoadWithDiversity: READY');
console.log('   - DemandFactors class: READY');
console.log('   - computeSystemDemand: READY');
console.log('   - DemandFactorHandler: READY');
console.log('   - generateDiversityFactorsReport: READY');
console.log('   - IEEE 141-1993 compliant: YES');
console.log('   - NEC Article 220 compliant: YES');
console.log('');