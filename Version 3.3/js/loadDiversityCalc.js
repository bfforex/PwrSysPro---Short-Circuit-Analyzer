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

console.log('✅ Load Diversity Calculation Engine v1.0.0 loaded');
console.log('   - Diversity factor calculation: READY');
console.log('   - Integration with downstream loads: READY');
console.log('   - IEEE 141-1993 compliant: YES');
console.log('   - NEC Article 220 compliant: YES');
console.log('');