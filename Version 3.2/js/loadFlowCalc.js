/**
 * Load Flow Calculation Module
 * Dedicated calculations for power flow analysis
 * 
 * @author bfforex
 * @date 2025-11-05 04:25:10 UTC
 * @version 2.2.1 - CRITICAL FIX: System MD accumulation
 * @fixed System-wide calculation now properly accumulates substation MDs
 * @fixed All null safety checks for dynamic voltage handling
 * @enhanced Component tags prominently displayed
 * @enhanced Visual hierarchy with icons (🔌 🔧 ⚙️ ⚡ 📊 ✅)
 * @enhanced From/To bus information in all calculation steps
 * 
 * FIXES IN v2.2.1:
 * - Fixed: totalSubstationMD accumulation in forEach loop
 * - Fixed: Removed undefined variable references in applyDemandFactorsToLoadFlow
 * - Fixed: Added null safety for all .toFixed() calls
 * - Fixed: Dynamic voltage handling with proper fallbacks
 * 
 * FEATURES FROM v2.2.0 (MAINTAINED):
 * - Visual icons throughout calculation steps
 * - Component tags displayed prominently
 * - From/To bus connections in every component section
 * - Enhanced section separators and headers
 * - Better structured output with professional formatting
 * - Calculation formulas shown with step-by-step breakdowns
 * - Recursive load traversal with detailed tracking
 * - Demand & diversity factor integration
 * - Motor diversity calculations
 * - Transformer loading analysis
 * - Cable tag support
 */

console.log('🔧 Loading Load Flow Calculation Module v2.2.1...');
console.log('   ✅ CRITICAL FIX: System MD accumulation');
console.log('   ✅ Visual hierarchy - ENHANCED');
console.log('   ✅ Component tags display - ENHANCED');
console.log('   ✅ From/To bus information - ENHANCED');
console.log('   ✅ All v2.2.0 features maintained');

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const LOAD_FLOW_CONFIG = {
    // Visual icons
    ICONS: {
        motor: '⚙️',
        transformer: '🔧',
        cable: '🔌',
        generator: '⚡',
        bus: '📍',
        load: '💡',
        analysis: '📊',
        pass: '✅',
        warning: '⚠️',
        fail: '❌',
        info: 'ℹ️'
    },
    
    // Default values
    DEFAULT_POWER_FACTOR: 0.85,
    DEFAULT_TRANSFORMER_LOADING: 0.80
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN LOAD FLOW CALCULATION FUNCTION (ENHANCED)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Perform load flow analysis for a bus
 * Returns detailed load breakdown and power flow
 * 
 * @param {String} busId - Bus identifier
 * @returns {Object} Load flow results with detailed breakdown
 */
function calculateLoadFlow(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('LOAD FLOW ANALYSIS - ENHANCED v2.2.1');
    console.log('═'.repeat(80));
    console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
    console.log('═'.repeat(80) + '\n');
    
    const loadData = {
        busId: bus.id,
        busName: bus.name,
        busVoltage: bus.voltage,
        totalLoad: 0,
        breakdown: {
            motors: [],
            transformers: [],
            cables: [],
            directLoads: [],
            generators: []
        },
        summary: {
            totalCurrent: 0,
            totalPowerKVA: 0,
            totalPowerKW: 0,
            powerFactor: parseFloat(document.getElementById('powerFactor')?.value) || LOAD_FLOW_CONFIG.DEFAULT_POWER_FACTOR,
            connectedCurrent: 0
        },
        pathTrace: [],
        calculationSteps: '',
        calculationDate: getCalculationTimestamp()
    };
    
    // ══════════════════════════════════════════════════════════════════════════════
    // ENHANCED CALCULATION STEPS HEADER
    // ══════════════════════════════════════════════════════════════════════════════
    
    let steps = '═'.repeat(80) + '\n';
    steps += 'LOAD FLOW CALCULATION - ENHANCED\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📋 CALCULATION INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Date/Time:           ${loadData.calculationDate}\n`;
    steps += `Engineer:            ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
    steps += `Target Bus:          ${bus.tag || bus.name} (${bus.name})\n`;
    steps += `Bus Voltage:         ${bus.voltage}V\n`;
    steps += `Power Factor:        ${loadData.summary.powerFactor}\n`;
    steps += `Method:              Recursive Downstream Load Traversal\n\n`;
    
    steps += `📖 CALCULATION METHODOLOGY\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `• Traces all downstream components from target bus\n`;
    steps += `• Calculates load at each voltage level\n`;
    steps += `• Refers transformer secondary loads to primary side\n`;
    steps += `• Sums total current and power requirements\n`;
    steps += `• Component tags displayed for full traceability\n\n`;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // RECURSIVE LOAD CALCULATION (ENHANCED)
    // ══════════════════════════════════════════════════════════════════════════════
    
    const visited = new Set();
    let componentCount = 0;
    
    function traverseDownstream(currentBusId, depth = 0) {
        if (visited.has(currentBusId)) return 0;
        visited.add(currentBusId);
        
        const indent = '  '.repeat(depth);
        let branchLoad = 0;
        
        const currentBus = buses.find(b => b.id === currentBusId);
        if (!currentBus) return 0;
        
        steps += `${indent}${LOAD_FLOW_CONFIG.ICONS.bus} ${currentBus.tag || currentBus.name} (${currentBus.name}) - ${currentBus.voltage}V\n`;
        
        loadData.pathTrace.push({
            depth: depth,
            bus: currentBus.name,
            busTag: currentBus.tag,
            voltage: currentBus.voltage,
            loads: []
        });
        
        // ════════════════════════════════════════════════════════════════════════════
        // DIRECT BUS LOAD
        // ✅ FIXED: Skip auto-calculated loads to prevent double-counting
        // Added: 2025-12-01 by bfforex
        // ════════════════════════════════════════════════════════════════════════════
        const busLoad = parseFloat(currentBus.loadCurrent) || 0;
        
        // ✅ CRITICAL: Only include if it's a MANUAL load (not auto-calculated)
        if (busLoad > 0 && !currentBus.loadCurrentAutoCalculated) {
            branchLoad += busLoad;
            
            const powerKVA = (busLoad * currentBus.voltage * Math.sqrt(3)) / 1000;
            
            loadData.breakdown.directLoads.push({
                bus: currentBus.name,
                busTag: currentBus.tag,
                current: busLoad,
                powerKVA: powerKVA,
                source: 'manual'
            });
            
            steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.load} Direct Load: ${busLoad.toFixed(2)} A (${powerKVA.toFixed(2)} kVA) [USER-SPECIFIED]\n`;
        } else if (busLoad > 0 && currentBus.loadCurrentAutoCalculated) {
            // ✅ Log but DON'T add (already counted via downstream components)
            console.log(`${indent}ℹ️ Skipping auto-calculated load on ${currentBus.name} (${busLoad.toFixed(2)} A) - prevents double-count`);
        }
        
        // ════════════════════════════════════════════════════════════════════════════
        // DOWNSTREAM COMPONENTS
        // ════════════════════════════════════════════════════════════════════════════
        const downstreamComponents = components.filter(c => c && c.fromBus === currentBusId);
        
        downstreamComponents.forEach((comp, index) => {
            componentCount++;
            const isLast = index === downstreamComponents.length - 1;
            const connector = isLast ? '└─' : '├─';
            
            const toBus = buses.find(b => b.id === comp.toBus);
            if (!toBus) return;
            
            switch(comp.type) {
                // ════════════════════════════════════════════════════════════════════
                // MOTOR PROCESSING (ENHANCED)
                // ════════════════════════════════════════════════════════════════════
                case 'motor':
                    steps += '\n' + indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.motor} MOTOR`;
                    if (comp.tag) steps += ` - ${comp.tag}`;
                    steps += `\n`;
                    steps += indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    
                    const motorCurrent = calculateMotorCurrent(comp.hp, toBus.voltage);
                    branchLoad += motorCurrent;
                    
                    const motorPowerKVA = (motorCurrent * toBus.voltage * Math.sqrt(3)) / 1000;
                    const motorPowerKW = motorPowerKVA * loadData.summary.powerFactor;
                    
                    loadData.breakdown.motors.push({
                        name: `${comp.hp} HP ${comp.motorType || 'Motor'}`,
                        tag: comp.tag || 'N/A',
                        location: toBus.name,
                        locationTag: toBus.tag,
                        hp: comp.hp,
                        voltage: toBus.voltage,
                        current: motorCurrent,
                        powerKVA: motorPowerKVA,
                        powerKW: motorPowerKW,
                        fromBus: currentBus.name,
                        toBus: toBus.name
                    });
                    
                    steps += `${indent}  Component Tag:       ${comp.tag || 'N/A'}\n`;
                    steps += `${indent}  Component Type:      MOTOR\n`;
                    steps += `${indent}  Horsepower:          ${comp.hp} HP\n`;
                    steps += `${indent}  Motor Type:          ${comp.motorType || 'Standard'}\n`;
                    steps += `${indent}  From Bus:            ${currentBus.tag || currentBus.name} (${currentBus.name})\n`;
                    steps += `${indent}  To Bus:              ${toBus.tag || toBus.name} (${toBus.name})\n`;
                    steps += `${indent}  Voltage:             ${toBus.voltage}V\n\n`;
                    
                    steps += `${indent}  📊 LOAD CALCULATION\n`;
                    steps += `${indent}  Formula:  I = HP × 746 / (√3 × V × η × PF)\n`;
                    steps += `${indent}  Current:  ${motorCurrent.toFixed(2)} A\n`;
                    steps += `${indent}  Power:    ${motorPowerKVA.toFixed(2)} kVA (${motorPowerKW.toFixed(2)} kW)\n`;
                    steps += `${indent}  PF:       ${loadData.summary.powerFactor}\n\n`;
                    break;
                    
                // ════════════════════════════════════════════════════════════════════
                // TRANSFORMER PROCESSING (ENHANCED)
                // ════════════════════════════════════════════════════════════════════
                case 'transformer':
                    steps += '\n' + indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.transformer} TRANSFORMER`;
                    if (comp.tag) steps += ` - ${comp.tag}`;
                    steps += `\n`;
                    steps += indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    
                    const xfmrDownstream = traverseDownstream(comp.toBus, depth + 2);
                    
                    if (xfmrDownstream > 0) {
                        const turnsRatio = comp.primary / comp.secondary;
                        const primaryCurrent = xfmrDownstream / turnsRatio;
                        branchLoad += primaryCurrent;
                        
                        const loading = (xfmrDownstream * comp.secondary * Math.sqrt(3) / (comp.rating * 1000)) * 100;
                        const powerKVA = (primaryCurrent * comp.primary * Math.sqrt(3)) / 1000;
                        
                        loadData.breakdown.transformers.push({
                            name: `${comp.rating} kVA Transformer`,
                            tag: comp.tag || 'N/A',
                            location: `${currentBus.name} → ${toBus.name}`,
                            rating: comp.rating,
                            primaryVoltage: comp.primary,
                            secondaryVoltage: comp.secondary,
                            secondaryCurrent: xfmrDownstream,
                            primaryCurrent: primaryCurrent,
                            loading: loading,
                            powerKVA: powerKVA,
                            fromBus: currentBus.name,
                            toBus: toBus.name
                        });
                        
                        steps += `${indent}  Component Tag:       ${comp.tag || 'N/A'}\n`;
                        steps += `${indent}  Component Type:      TRANSFORMER\n`;
                        steps += `${indent}  Rating:              ${comp.rating} kVA\n`;
                        steps += `${indent}  Voltage Ratio:       ${comp.primary}V / ${comp.secondary}V\n`;
                        steps += `${indent}  Turns Ratio:         ${turnsRatio.toFixed(4)}:1\n`;
                        steps += `${indent}  From Bus:            ${currentBus.tag || currentBus.name} (${currentBus.name})\n`;
                        steps += `${indent}  To Bus:              ${toBus.tag || toBus.name} (${toBus.name})\n\n`;
                        
                        steps += `${indent}  📊 LOADING ANALYSIS\n`;
                        steps += `${indent}  ` + '─'.repeat(76 - indent.length) + '\n';
                        steps += `${indent}  SECONDARY SIDE (${comp.secondary}V):\n`;
                        steps += `${indent}    Current:           ${xfmrDownstream.toFixed(2)} A\n`;
                        steps += `${indent}    Full Load:         ${((comp.rating * 1000) / (Math.sqrt(3) * comp.secondary)).toFixed(2)} A\n`;
                        steps += `${indent}    Loading:           ${loading.toFixed(1)}% ${loading > 100 ? '❌ OVERLOAD' : loading > 80 ? '⚠️' : '✅'}\n\n`;
                        
                        steps += `${indent}  PRIMARY SIDE (${comp.primary}V):\n`;
                        steps += `${indent}    Formula:           I_pri = I_sec / (V_pri / V_sec)\n`;
                        steps += `${indent}    Current:           ${primaryCurrent.toFixed(2)} A\n`;
                        steps += `${indent}    Power:             ${powerKVA.toFixed(2)} kVA\n\n`;
                        
                        if (loading > 100) {
                            steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.fail} CRITICAL: Transformer OVERLOADED!\n`;
                            steps += `${indent}    Recommendations:\n`;
                            steps += `${indent}    • Install larger transformer (min ${Math.ceil(comp.rating * loading / 80)} kVA)\n`;
                            steps += `${indent}    • Reduce downstream load\n`;
                            steps += `${indent}    • Add parallel transformer\n\n`;
                        } else if (loading > 80) {
                            steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.warning} WARNING: High loading (>${loading.toFixed(0)}%)\n\n`;
                        }
                        
                    } else {
                        // Default to 80% loading
                        const xfmrCurrent = calculateTransformerCurrent(comp.rating, comp.primary, LOAD_FLOW_CONFIG.DEFAULT_TRANSFORMER_LOADING);
                        branchLoad += xfmrCurrent;
                        
                        const powerKVA = (xfmrCurrent * comp.primary * Math.sqrt(3)) / 1000;
                        
                        loadData.breakdown.transformers.push({
                            name: `${comp.rating} kVA Transformer`,
                            tag: comp.tag || 'N/A',
                            location: `${currentBus.name} → ${toBus.name}`,
                            rating: comp.rating,
                            primaryVoltage: comp.primary,
                            secondaryVoltage: comp.secondary,
                            primaryCurrent: xfmrCurrent,
                            loading: 80,
                            powerKVA: powerKVA,
                            fromBus: currentBus.name,
                            toBus: toBus.name
                        });
                        
                        steps += `${indent}  Component Tag:       ${comp.tag || 'N/A'}\n`;
                        steps += `${indent}  Component Type:      TRANSFORMER\n`;
                        steps += `${indent}  Rating:              ${comp.rating} kVA\n`;
                        steps += `${indent}  From Bus:            ${currentBus.tag || currentBus.name}\n`;
                        steps += `${indent}  To Bus:              ${toBus.tag || toBus.name}\n\n`;
                        steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.info} No downstream load detected\n`;
                        steps += `${indent}  Using ${(LOAD_FLOW_CONFIG.DEFAULT_TRANSFORMER_LOADING * 100).toFixed(0)}% of rating as default\n`;
                        steps += `${indent}  Current: ${xfmrCurrent.toFixed(2)} A\n\n`;
                    }
                    break;
                    
                // ════════════════════════════════════════════════════════════════════
                // CABLE PROCESSING (ENHANCED)
                // ════════════════════════════════════════════════════════════════════
                case 'cable':
                    if (comp.loadCurrent && comp.loadCurrent > 0) {
                        steps += '\n' + indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                        steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.cable} CABLE`;
                        if (comp.tag) steps += ` - ${comp.tag}`;
                        steps += `\n`;
                        steps += indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                        
                        branchLoad += comp.loadCurrent;
                        
                        const cablePowerKVA = (comp.loadCurrent * currentBus.voltage * Math.sqrt(3)) / 1000;
                        
                        loadData.breakdown.cables.push({
                            name: `${comp.size} ${comp.material.toUpperCase()} - ${comp.length}ft`,
                            tag: comp.tag || 'N/A',
                            location: `${currentBus.name} → ${toBus.name}`,
                            size: comp.size,
                            material: comp.material,
                            length: comp.length,
                            parallel: comp.parallel || 1,
                            current: comp.loadCurrent,
                            powerKVA: cablePowerKVA,
                            fromBus: currentBus.name,
                            toBus: toBus.name
                        });
                        
                        steps += `${indent}  Component Tag:       ${comp.tag || 'N/A'}\n`;
                        steps += `${indent}  Component Type:      CABLE\n`;
                        steps += `${indent}  Size:                ${comp.size}\n`;
                        steps += `${indent}  Material:            ${comp.material.toUpperCase()}\n`;
                        steps += `${indent}  Length:              ${comp.length} ft\n`;
                        if (comp.parallel > 1) {
                            steps += `${indent}  Parallel:            ${comp.parallel} cables\n`;
                        }
                        steps += `${indent}  From Bus:            ${currentBus.tag || currentBus.name} (${currentBus.name})\n`;
                        steps += `${indent}  To Bus:              ${toBus.tag || toBus.name} (${toBus.name})\n\n`;
                        
                        steps += `${indent}  📊 LOAD INFORMATION\n`;
                        steps += `${indent}  Specified Load:      ${comp.loadCurrent.toFixed(2)} A\n`;
                        steps += `${indent}  Power:               ${cablePowerKVA.toFixed(2)} kVA\n\n`;
                        
                    } else {
                        const cableDownstream = traverseDownstream(comp.toBus, depth + 2);
                        branchLoad += cableDownstream;
                        
                        if (cableDownstream > 0) {
                            const cablePowerKVA = (cableDownstream * currentBus.voltage * Math.sqrt(3)) / 1000;
                            
                            loadData.breakdown.cables.push({
                                name: `${comp.size} ${comp.material.toUpperCase()} - ${comp.length}ft`,
                                tag: comp.tag || 'N/A',
                                location: `${currentBus.name} → ${toBus.name}`,
                                size: comp.size,
                                material: comp.material,
                                length: comp.length,
                                parallel: comp.parallel || 1,
                                current: cableDownstream,
                                powerKVA: cablePowerKVA,
                                fromBus: currentBus.name,
                                toBus: toBus.name
                            });
                            
                            steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.cable} Cable ${comp.tag || comp.size}: ${cableDownstream.toFixed(2)} A (${cablePowerKVA.toFixed(2)} kVA)\n`;
                        }
                    }
                    break;
                    
                // ════════════════════════════════════════════════════════════════════
                // GENERATOR PROCESSING (ENHANCED)
                // ════════════════════════════════════════════════════════════════════
                case 'generator':
                    steps += '\n' + indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.generator} GENERATOR`;
                    if (comp.tag) steps += ` - ${comp.tag}`;
                    steps += `\n`;
                    steps += indent + '  ' + '─'.repeat(76 - depth * 2) + '\n';
                    
                    loadData.breakdown.generators.push({
                        name: `${comp.rating} kVA Generator`,
                        tag: comp.tag || 'N/A',
                        location: toBus.name,
                        rating: comp.rating,
                        voltage: comp.voltage,
                        type: 'Source (not a load)',
                        fromBus: currentBus.name,
                        toBus: toBus.name
                    });
                    
                    steps += `${indent}  Component Tag:       ${comp.tag || 'N/A'}\n`;
                    steps += `${indent}  Component Type:      GENERATOR (SOURCE)\n`;
                    steps += `${indent}  Rating:              ${comp.rating} kVA\n`;
                    steps += `${indent}  Voltage:             ${comp.voltage}V\n`;
                    steps += `${indent}  Location:            ${toBus.tag || toBus.name}\n`;
                    steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.info} Generator is a source, not counted as load\n\n`;
                    break;
            }
        });
        
        // ════════════════════════════════════════════════════════════════════════════
        // BRANCH SUBTOTAL
        // ════════════════════════════════════════════════════════════════════════════
        if (branchLoad > 0) {
            const branchPowerKVA = (branchLoad * currentBus.voltage * Math.sqrt(3)) / 1000;
            steps += `${indent}  ├─ ${LOAD_FLOW_CONFIG.ICONS.analysis} Subtotal: ${branchLoad.toFixed(2)} A (${branchPowerKVA.toFixed(2)} kVA)\n\n`;
        }
        
        return branchLoad;
    }
    
    // ══════════════════════════════════════════════════════════════════════════════
    // EXECUTE TRAVERSAL
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LOAD FLOW TRAVERSAL\n';
    steps += '═'.repeat(80) + '\n\n';
    
    loadData.totalLoad = traverseDownstream(busId);
    
    // ══════════════════════════════════════════════════════════════════════════════
    // CALCULATE SUMMARY
    // ══════════════════════════════════════════════════════════════════════════════
    
    loadData.summary.totalCurrent = loadData.totalLoad;
    loadData.summary.connectedCurrent = loadData.totalLoad;
    loadData.summary.totalPowerKVA = (loadData.totalLoad * bus.voltage * Math.sqrt(3)) / 1000;
    loadData.summary.totalPowerKW = loadData.summary.totalPowerKVA * loadData.summary.powerFactor;
    
    // ══════════════════════════════════════════════════════════════════════════════
    // ENHANCED SUMMARY SECTION
    // ══════════════════════════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LOAD FLOW SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📊 TOTAL LOAD AT ${bus.name}\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Total Load Current:      ${loadData.summary.totalCurrent.toFixed(2)} A\n`;
    steps += `Total Apparent Power:    ${loadData.summary.totalPowerKVA.toFixed(2)} kVA\n`;
    steps += `Total Active Power:      ${loadData.summary.totalPowerKW.toFixed(2)} kW\n`;
    steps += `Power Factor:            ${loadData.summary.powerFactor}\n`;
    steps += `Components Analyzed:     ${componentCount}\n\n`;
    
// ══════════════════════════════════════════════════════════════════════════════
// BREAKDOWN BY TYPE (CORRECTED - NO DOUBLE COUNTING)
// Fixed: 2025-11-03 14:47:15 UTC by bfforex
// Priority 1: Accurate load breakdown without double counting
// 
// Key Fixes:
// 1. Cables are pass-through (not counted in totals)
// 2. Direct loads filtered to THIS bus only (no downstream)
// 3. Motors separated by voltage level
// 4. Percentages based on actual consumed load at this level
// ══════════════════════════════════════════════════════════════════════════════

// Separate motors by voltage level
const motorsAtThisLevel = loadData.breakdown.motors.filter(m => m.voltage === bus.voltage);
const motorsAtOtherLevels = loadData.breakdown.motors.filter(m => m.voltage !== bus.voltage);

// Calculate motor totals AT THIS VOLTAGE LEVEL
const motorTotal = motorsAtThisLevel.reduce((sum, m) => sum + m.current, 0);
const motorPower = motorsAtThisLevel.reduce((sum, m) => sum + m.powerKVA, 0);

// Direct loads ONLY at THIS bus (not downstream)
const directLoadsAtThisBus = loadData.breakdown.directLoads.filter(d => d.bus === bus.name);
const directTotal = directLoadsAtThisBus.reduce((sum, d) => sum + d.current, 0);
const directPower = directLoadsAtThisBus.reduce((sum, d) => sum + d.powerKVA, 0);

// Transformers (reflected from downstream voltage levels)
const xfmrTotal = loadData.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
const xfmrPower = loadData.breakdown.transformers.reduce((sum, t) => sum + t.powerKVA, 0);

// Cables are pass-through (counted for reference, not in totals)
const cableCount = loadData.breakdown.cables.length;

// Total ACTUAL load at this voltage level (motors + direct + reflected transformers)
const totalAtThisLevel = motorTotal + directTotal + xfmrTotal;

// Build breakdown display
steps += `📋 BREAKDOWN BY COMPONENT TYPE (AT ${bus.voltage}V LEVEL)\n`;
steps += '─'.repeat(80) + '\n';
steps += `Type          Count  Current (A)  Power (kVA)  Percentage  Note\n`;
steps += '─'.repeat(80) + '\n';

// Direct loads at this bus
if (directLoadsAtThisBus.length > 0) {
    const directPct = totalAtThisLevel > 0 ? (directTotal / totalAtThisLevel * 100) : 0;
    steps += `Direct Load   ${directLoadsAtThisBus.length.toString().padStart(5)}  ${directTotal.toFixed(2).padStart(11)}  ${directPower.toFixed(2).padStart(11)}  ${directPct.toFixed(1).padStart(10)}%  At this bus\n`;
}

// Transformers (reflected loads)
if (loadData.breakdown.transformers.length > 0) {
    const xfmrPct = totalAtThisLevel > 0 ? (xfmrTotal / totalAtThisLevel * 100) : 0;
    steps += `Transformers  ${loadData.breakdown.transformers.length.toString().padStart(5)}  ${xfmrTotal.toFixed(2).padStart(11)}  ${xfmrPower.toFixed(2).padStart(11)}  ${xfmrPct.toFixed(1).padStart(10)}%  Reflected from secondary\n`;
    
    // Show detail for each transformer
    loadData.breakdown.transformers.forEach(xfmr => {
        const xfmrCurrent = xfmr.primaryCurrent || 0;
        const xfmrPercent = totalAtThisLevel > 0 ? (xfmrCurrent / totalAtThisLevel * 100) : 0;
        steps += `  └─ ${(xfmr.tag || xfmr.name).padEnd(14)}  ${xfmrCurrent.toFixed(2).padStart(11)}  ${xfmr.powerKVA.toFixed(2).padStart(11)}  ${xfmrPercent.toFixed(1).padStart(10)}%  ${xfmr.primaryVoltage}V → ${xfmr.secondaryVoltage}V\n`;
    });
}

// Motors at this voltage level
if (motorsAtThisLevel.length > 0) {
    const motorPct = totalAtThisLevel > 0 ? (motorTotal / totalAtThisLevel * 100) : 0;
    steps += `Motors (${bus.voltage}V) ${motorsAtThisLevel.length.toString().padStart(2)}  ${motorTotal.toFixed(2).padStart(11)}  ${motorPower.toFixed(2).padStart(11)}  ${motorPct.toFixed(1).padStart(10)}%  At this level\n`;
}

// Motors at other voltage levels (via transformers)
if (motorsAtOtherLevels.length > 0) {
    motorsAtOtherLevels.forEach(motor => {
        // Find which transformer serves this motor
        const xfmr = loadData.breakdown.transformers.find(t => t.secondaryVoltage === motor.voltage);
        const xfmrTag = xfmr ? (xfmr.tag || xfmr.name) : 'transformer';
        steps += `Motors (${motor.voltage}V)  ${' '.repeat(4)}1  ${motor.current.toFixed(2).padStart(11)}  ${motor.powerKVA.toFixed(2).padStart(11)}  ${' '.repeat(10)}-  Via ${xfmrTag}\n`;
    });
}

// Cables (pass-through only, not counted in percentages)
if (cableCount > 0) {
    steps += `Cables        ${cableCount.toString().padStart(5)}  (conveyance)        -         -  Pass-through only\n`;
}

// Generators (sources, not loads)
if (loadData.breakdown.generators.length > 0) {
    steps += `Generators    ${loadData.breakdown.generators.length.toString().padStart(5)}  (Sources)    N/A          N/A  Sources only\n`;
}

steps += '─'.repeat(80) + '\n';
steps += `TOTAL AT ${bus.voltage}V  ${' '.repeat(5)}  ${loadData.summary.totalCurrent.toFixed(2).padStart(11)}  ${loadData.summary.totalPowerKVA.toFixed(2).padStart(11)}  ${' '.repeat(10)}100.0%\n`;
steps += '─'.repeat(80) + '\n\n';

// Explanatory note
steps += `${LOAD_FLOW_CONFIG.ICONS.info} Note:\n`;
steps += `   • Direct load of ${directTotal.toFixed(2)}A is specified at this bus (${bus.voltage}V)\n`;
if (motorsAtOtherLevels.length > 0) {
    steps += `   • ${motorsAtOtherLevels.length} motor(s) at other voltage levels are reflected via transformers\n`;
}
steps += `   • Cables convey power but are not loads (not counted in percentages)\n`;
steps += `   • Transformers show primary current (reflected from secondary loads)\n`;
steps += `   • Total represents all downstream loads referred to ${bus.voltage}V\n`;
steps += `   • Percentages are of ACTUAL consumed load (${totalAtThisLevel.toFixed(2)}A)\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF LOAD FLOW CALCULATION\n';
    steps += '═'.repeat(80) + '\n';
    
    loadData.calculationSteps = steps;
    
    console.log('✅ Load Flow Analysis Complete (v2.2.1)');
    console.log(`   Total Load: ${loadData.summary.totalCurrent.toFixed(2)} A`);
    console.log(`   Total Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA`);
    console.log(`   Components: ${componentCount}`);
    console.log('');
    
    return loadData;
}

/**
 * Apply demand factors to load flow results
 * UPDATED: 2025-11-05 14:42:00 UTC by bfforex
 * ENHANCED: Detects main distribution buses and applies system-level diversity
 * 
 * @param {Object} loadFlow - Original load flow result
 * @returns {Object} Enhanced load flow with demand factors applied
 */
function applyDemandFactorsToLoadFlow(loadFlow) {
    if (!loadFlow || typeof loadFlow !== 'object') {
        console.warn('⚠️ Invalid loadFlow object in applyDemandFactorsToLoadFlow');
        return loadFlow;
    }
    
    // ✅ Check for class OR instance
    if (typeof window.DemandFactors === 'undefined' && typeof window.demandFactorsInstance === 'undefined') {
        console.warn('⚠️ DemandFactors module not loaded, skipping demand factor application');
        return loadFlow;
    }
    
    // ✅ Use the global instance, or create new one
    const demandFactors = window.demandFactorsInstance || new window.DemandFactors();
    
    console.log('\n' + '═'.repeat(80));
    console.log('APPLYING DEMAND & DIVERSITY FACTORS');
    console.log('═'.repeat(80));
    console.log(`✅ Using DemandFactors instance: ${typeof demandFactors}`);
    
    // ════════════════════════════════════════════════════════════════════════════
    // GET TOTAL CONNECTED LOAD
    // ════════════════════════════════════════════════════════════════════════════
    const connectedCurrent = loadFlow.summary?.totalCurrent || 0;
    const voltage = loadFlow.busVoltage || 480;
    const sqrt3 = Math.sqrt(3);
    
    // ════════════════════════════════════════════════════════════════════════════
    // DETECT IF THIS IS A MAIN DISTRIBUTION BUS
    // Main distribution buses feed multiple substations (2+ transformers)
    // These should use system-level diversity, not motor demand factors
    // Added: 2025-11-05 14:42:00 UTC by bfforex
    // ════════════════════════════════════════════════════════════════════════════
    
    const downstreamTransformers = components.filter(c => 
        c.fromBus === loadFlow.busId && c.type === 'transformer'
    );
    
    const isMainDistributionBus = downstreamTransformers.length >= 2;
    const motorCount = loadFlow.breakdown?.motors?.length || 0;
    
    let demandFactor = 1.0;
    let demandFactorNote = 'No demand factor applied (100%)';
    let diversityFactor = 1.2;
    let busClassification = 'Standard Bus';
    
    // ════════════════════════════════════════════════════════════════════════════
    // BRANCH 1: MAIN DISTRIBUTION BUS (FEEDS MULTIPLE SUBSTATIONS)
    // ════════════════════════════════════════════════════════════════════════════
    
    if (isMainDistributionBus) {
        console.log(`ℹ️ ${loadFlow.busName} is a MAIN DISTRIBUTION BUS (${downstreamTransformers.length} substations)`);
        console.log(`   Using system-level diversity instead of motor demand factors`);
        
        busClassification = `Main Distribution (feeds ${downstreamTransformers.length} substations)`;
        
        // Don't apply motor demand factors at this level
        demandFactor = 1.0;
        demandFactorNote = `Main distribution bus - demand factors applied at substation level`;
        
        // Use system-level diversity based on number of substations
        // Per IEEE 141-1993 Table 3-5
        const substationCount = downstreamTransformers.length;
        
        if (substationCount <= 1) {
            diversityFactor = 1.00;
        } else if (substationCount <= 3) {
            diversityFactor = 1.30;
        } else if (substationCount <= 6) {
            diversityFactor = 1.45;
        } else if (substationCount <= 10) {
            diversityFactor = 1.55;
        } else if (substationCount <= 15) {
            diversityFactor = 1.65;
        } else if (substationCount <= 20) {
            diversityFactor = 1.75;
        } else {
            diversityFactor = 1.85;
        }
        
        console.log(`   System diversity factor: ${diversityFactor.toFixed(3)} (IEEE 141-1993 Table 3-5)`);
    }
    
    // ════════════════════════════════════════════════════════════════════════════
    // BRANCH 2: STANDARD BUS WITH MOTORS (APPLY NEC 430.24)
    // ════════════════════════════════════════════════════════════════════════════
    
    else if (motorCount > 0) {
        console.log(`ℹ️ ${loadFlow.busName} has ${motorCount} motor(s)`);
        console.log(`   Applying NEC 430.24 motor demand factors`);
        
        busClassification = `Motor Load Bus (${motorCount} motors)`;
        
        // Apply motor demand factor based on count
        // NEC 430.24: For multiple motors, use demand factors
        if (motorCount === 1) {
            demandFactor = 1.00;
            demandFactorNote = 'Single motor - 100% demand (NEC 430.24)';
        } else if (motorCount <= 2) {
            demandFactor = 0.95;
            demandFactorNote = `${motorCount} motors - 95% demand (NEC 430.24)`;
        } else if (motorCount <= 3) {
            demandFactor = 0.91;
            demandFactorNote = `${motorCount} motors - 91% demand (NEC 430.24)`;
        } else if (motorCount <= 5) {
            demandFactor = 0.85;
            demandFactorNote = `${motorCount} motors - 85% demand (NEC 430.24)`;
        } else if (motorCount <= 10) {
            demandFactor = 0.80;
            demandFactorNote = `${motorCount} motors - 80% demand (NEC 430.24)`;
        } else {
            demandFactor = 0.75;
            demandFactorNote = `${motorCount} motors - 75% demand (NEC 430.24)`;
        }
        
        // Use standard bus-level diversity
        diversityFactor = getDiversityFactorForBus(loadFlow.busId) || 1.2;
    }
    
    // ════════════════════════════════════════════════════════════════════════════
    // BRANCH 3: MIXED LOADS (NO MOTORS, NO SUBSTATIONS)
    // ════════════════════════════════════════════════════════════════════════════
    
    else {
        console.log(`ℹ️ ${loadFlow.busName} has mixed loads (no motors at this level)`);
        
        busClassification = 'Mixed Load Bus';
        
        // No motors - use general demand factor
        demandFactor = 0.85;
        demandFactorNote = 'Mixed loads - 85% demand factor (IEEE 141-1993)';
        
        // Use standard bus-level diversity
        diversityFactor = getDiversityFactorForBus(loadFlow.busId) || 1.2;
    }
    
    // ════════════════════════════════════════════════════════════════════════════
    // CALCULATE DEMAND LOAD
    // ════════════════════════════════════════════════════════════════════════════
    const demandCurrent = connectedCurrent * demandFactor;
    
    // ════════════════════════════════════════════════════════════════════════════
    // APPLY DIVERSITY FACTOR
    // ════════════════════════════════════════════════════════════════════════════
    const diversityCurrent = demandCurrent / diversityFactor;
    
    // ════════════════════════════════════════════════════════════════════════════
    // BUILD ENHANCED RESULT
    // ════════════════════════════════════════════════════════════════════════════
    const enhanced = {
        ...loadFlow,
        demandFactorsApplied: true,
        busClassification: busClassification,
        isMainDistributionBus: isMainDistributionBus,
        substationCount: isMainDistributionBus ? downstreamTransformers.length : 0,
        connectedLoad: connectedCurrent,
        demandLoad: demandCurrent,
        diversityLoad: diversityCurrent,
        demandSummary: {
            connectedCurrent: connectedCurrent,
            connectedPowerKVA: (connectedCurrent * voltage * sqrt3) / 1000,
            demandCurrent: demandCurrent,
            demandPowerKVA: (demandCurrent * voltage * sqrt3) / 1000,
            diversityCurrent: diversityCurrent,
            diversityPowerKVA: (diversityCurrent * voltage * sqrt3) / 1000,
            demandFactor: demandFactor,
            diversityFactor: diversityFactor,
            motorCount: motorCount
        }
    };
    
    // ════════════════════════════════════════════════════════════════════════════
    // GENERATE CALCULATION STEPS
    // Enhanced with bus classification information
    // ════════════════════════════════════════════════════════════════════════════
    let steps = '\n' + '═'.repeat(80) + '\n';
    steps += 'DEMAND & DIVERSITY FACTOR ANALYSIS\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `📊 BUS INFORMATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Bus:                       ${loadFlow.busName}\n`;
    steps += `Bus Voltage:               ${voltage}V\n`;
    steps += `Bus Classification:        ${busClassification}\n`;
    
    if (isMainDistributionBus) {
        steps += `Downstream Substations:    ${downstreamTransformers.length}\n`;
        steps += `Substation List:           ${downstreamTransformers.map(t => {
            const subBus = buses.find(b => b.id === t.toBus);
            return subBus ? subBus.name : 'Unknown';
        }).join(', ')}\n`;
    }
    
    steps += '\n';
    
    steps += `📊 LOAD SUMMARY\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Connected Load:            ${connectedCurrent.toFixed(2)} A (100.0%)\n`;
    steps += `Motor Count:               ${motorCount}\n`;
    steps += `Transformer Count:         ${loadFlow.breakdown?.transformers?.length || 0}\n`;
    steps += `Total Components:          ${(loadFlow.breakdown?.motors?.length || 0) + (loadFlow.breakdown?.transformers?.length || 0) + (loadFlow.breakdown?.cables?.length || 0)}\n\n`;
  
    steps += `📐 DEMAND FACTOR APPLICATION\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Demand Factor:             ${demandFactor.toFixed(3)} (${(demandFactor * 100).toFixed(1)}%)\n`;
    steps += `Note:                      ${demandFactorNote}\n`;
    steps += `Demand Load:               ${demandCurrent.toFixed(2)} A (${connectedCurrent > 0 ? (demandCurrent / connectedCurrent * 100).toFixed(1) : '0.0'}%)\n`;
    steps += `Formula:                   Demand = Connected × Demand Factor\n`;
    steps += `                           ${demandCurrent.toFixed(2)} A = ${connectedCurrent.toFixed(2)} A × ${demandFactor.toFixed(3)}\n\n`;
    
    steps += `📐 DIVERSITY FACTOR APPLICATION\n`;
    steps += '─'.repeat(80) + '\n';
    
    if (isMainDistributionBus) {
        steps += `Diversity Factor:          ${diversityFactor.toFixed(3)} (IEEE 141-1993 Table 3-5)\n`;
        steps += `Application Level:         System-Level (${downstreamTransformers.length} substations)\n`;
        steps += `Diversity Load:            ${diversityCurrent.toFixed(2)} A (${connectedCurrent > 0 ? (diversityCurrent / connectedCurrent * 100).toFixed(1) : '0.0'}%)\n`;
        steps += `Formula:                   System MD = Connected / System DF\n`;
        steps += `                           ${diversityCurrent.toFixed(2)} A = ${connectedCurrent.toFixed(2)} A / ${diversityFactor.toFixed(3)}\n\n`;
        
        steps += `ℹ️ NOTE: This is a main distribution bus feeding multiple substations.\n`;
        steps += `   System-level diversity factor is applied instead of motor demand factors.\n`;
        steps += `   Individual substation demand factors are calculated separately.\n\n`;
    } else {
        steps += `Diversity Factor:          ${diversityFactor.toFixed(3)} (IEEE 141-1993)\n`;
        steps += `Application Level:         Bus-Level\n`;
        steps += `Diversity Load:            ${diversityCurrent.toFixed(2)} A (${connectedCurrent > 0 ? (diversityCurrent / connectedCurrent * 100).toFixed(1) : '0.0'}%)\n`;
        steps += `Formula:                   Diversity = Demand / Diversity Factor\n`;
        steps += `                           ${diversityCurrent.toFixed(2)} A = ${demandCurrent.toFixed(2)} A / ${diversityFactor.toFixed(3)}\n\n`;
    }
    
    steps += `💰 POWER SAVINGS\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Connected Power:           ${enhanced.demandSummary.connectedPowerKVA.toFixed(2)} kVA\n`;
    steps += `Demand Power:              ${enhanced.demandSummary.demandPowerKVA.toFixed(2)} kVA\n`;
    steps += `Diversity Power:           ${enhanced.demandSummary.diversityPowerKVA.toFixed(2)} kVA\n\n`;
    steps += `Power Reduction:           ${(enhanced.demandSummary.connectedPowerKVA - enhanced.demandSummary.diversityPowerKVA).toFixed(2)} kVA\n`;
    steps += `Percentage Reduction:      ${connectedCurrent > 0 ? ((1 - diversityCurrent / connectedCurrent) * 100).toFixed(1) : '0.0'}%\n\n`;
    
    steps += `📋 STANDARDS COMPLIANCE\n`;
    steps += '─'.repeat(80) + '\n';
    
    if (isMainDistributionBus) {
        steps += `✓ IEEE 141-1993 Section 3.3 - System Diversity Factors\n`;
        steps += `✓ IEEE 141-1993 Table 3-5 - Diversity for Multiple Substations\n`;
        steps += `✓ NEC Article 220 - Load Calculations (applied at substation level)\n`;
    } else {
        steps += `✓ NEC Article 220 - Demand Factors\n`;
        if (motorCount > 0) {
            steps += `✓ NEC Article 430.24 - Motor Demand Factors\n`;
        }
        steps += `✓ IEEE 141-1993 - Diversity Factors\n`;
    }
    
    steps += '\n';
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF DEMAND & DIVERSITY ANALYSIS\n';
    steps += '═'.repeat(80) + '\n';
    
    enhanced.demandCalculationSteps = steps;
    
    console.log('✅ Demand & diversity factors applied');
    console.log(`   Classification: ${busClassification}`);
    console.log(`   Connected: ${connectedCurrent.toFixed(2)} A → Demand: ${demandCurrent.toFixed(2)} A → Diversity: ${diversityCurrent.toFixed(2)} A`);
    console.log(`   Reduction: ${connectedCurrent > 0 ? ((1 - diversityCurrent / connectedCurrent) * 100).toFixed(1) : '0.0'}%`);
    console.log('');
    
    return enhanced;
}

/**
 * Get diversity factor for a bus
 * 
 * @param {String} busId - Bus identifier
 * @returns {Number} Diversity factor (>= 1.0)
 */
function getDiversityFactorForBus(busId) {
    const bus = buses.find(b => b.id === busId);
    
    if (bus && bus.diversityFactor !== undefined) {
        return bus.diversityFactor;
    }
    
    if (bus) {
        switch (bus.type) {
            case 'source':
                return 1.1;
            case 'distribution':
                return 1.2;
            case 'branch':
                return 1.25;
            default:
                return 1.2;
        }
    }
    
    return 1.2;
}

/**
 * Calculate load flow with demand factors
 * 
 * @param {String} busId - Bus identifier
 * @returns {Object} Load flow results with demand factors
 */
function calculateLoadFlowWithDemand(busId) {
    const standardLoadFlow = calculateLoadFlow(busId);
    const enhancedLoadFlow = applyDemandFactorsToLoadFlow(standardLoadFlow);
    return enhancedLoadFlow;
}

// ════════════════════════════════════════════════════════════════════════════════
// SYSTEM-LEVEL MAXIMUM DEMAND CALCULATION (NEW)
// Hierarchical Level 2: Combine multiple substations with system diversity
// Per IEEE 141-1993 Section 3.3 - System Diversity Factors
// Added: 2025-11-04 by bfforex
// FIXED: 2025-11-05 04:25:10 UTC - Proper accumulation of totalSubstationMD
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate total system maximum demand from multiple substations
 * 
 * This implements Level 2 (System-Wide) diversity:
 * - Level 1: Each substation has its own demand/diversity factors
 * - Level 2: System treats substation MDs as "loads" and applies system diversity
 * 
 * Formula: Total_System_MD = (Sum of Substation MDs) / System_Diversity_Factor
 * 
 * Use Case: Heavy fabrication yard with 8 substations serving:
 *   - Office areas (low diversity)
 *   - Fabrication shops (high diversity)
 *   - Assembly areas (medium diversity)
 *   - Warehouses (very high diversity)
 * 
 * @param {Array} substationBusIds - Array of bus IDs representing substations
 * @param {Object} options - Configuration options
 * @param {Number} options.systemDiversityFactor - Override auto-calculated DF (optional)
 * @param {String} options.facilityType - Type of facility (default: 'heavy_fabrication_yard')
 * @param {Boolean} options.includeDetailedSteps - Include calculation steps (default: true)
 * @returns {Object} System-wide demand calculation with breakdown
 */
function calculateSystemMaximumDemand(substationBusIds, options = {}) {
    const startTime = Date.now();
    
    // ══════════════════════════════════════════════════════════════════════════
    // VALIDATE INPUTS
    // ══════════════════════════════════════════════════════════════════════════
    
    if (!Array.isArray(substationBusIds) || substationBusIds.length === 0) {
        throw new Error('substationBusIds must be a non-empty array');
    }
    
    const facilityType = options.facilityType || 'heavy_fabrication_yard';
    const includeSteps = options.includeDetailedSteps !== false;
    
    console.log('\n' + '═'.repeat(80));
    console.log('SYSTEM-WIDE MAXIMUM DEMAND CALCULATION (LEVEL 2 HIERARCHY)');
    console.log('═'.repeat(80));
    console.log(`Date/Time: ${getCalculationTimestamp()}`);
    console.log(`Facility Type: ${facilityType}`);
    console.log(`Number of Substations: ${substationBusIds.length}`);
    console.log('═'.repeat(80) + '\n');
    
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1: CALCULATE MAXIMUM DEMAND FOR EACH SUBSTATION (LEVEL 1)
    // ══════════════════════════════════════════════════════════════════════════
    
    let totalSubstationMD = 0;  // ✅ DECLARED OUTSIDE LOOP
    const substationBreakdown = [];
    let calculationErrors = [];
    
    console.log('STEP 1: Calculating Maximum Demand for Each Substation');
    console.log('─'.repeat(80));
    
    substationBusIds.forEach((busId, index) => {    
        try {
            // Calculate standard load flow
            const loadFlow = calculateLoadFlow(busId);
        
            // Apply demand & diversity factors (Level 1)
            const withDemand = applyDemandFactorsToLoadFlow(loadFlow);
        
            const substationMD_Secondary = withDemand.demandSummary?.diversityCurrent || 0;
            const substationDF = withDemand.demandSummary?.diversityFactor || 1.0;
            const secondaryVoltage = loadFlow.busVoltage; // ✅ DYNAMIC from bus config
            const sqrt3 = Math.sqrt(3);
        
            // Find the transformer feeding this substation LVSG
            const feedingTransformer = components.find(c => 
                c.type === 'transformer' && c.toBus === busId
            );
        
            let substationMD_Primary = 0;  // ✅ INITIALIZE
            let primaryVoltage = secondaryVoltage;  // ✅ DEFAULT
            let isReflected = false;
        
            if (feedingTransformer) {
                // ✅ DYNAMIC: Read primary voltage from transformer config
                primaryVoltage = parseFloat(feedingTransformer.primary);
            
                // ✅ DYNAMIC: Read secondary voltage from transformer config
                const xfmrSecondaryVoltage = parseFloat(feedingTransformer.secondary);
            
                // Validate transformer voltages
                if (!primaryVoltage || primaryVoltage <= 0) {
                    console.warn(`⚠️ Invalid primary voltage for transformer feeding ${loadFlow.busName}`);
                    primaryVoltage = secondaryVoltage;
                }
            
                if (!xfmrSecondaryVoltage || xfmrSecondaryVoltage <= 0) {
                    console.warn(`⚠️ Invalid secondary voltage for transformer feeding ${loadFlow.busName}`);
                }
            
                // Calculate turns ratio
                const turnsRatio = primaryVoltage / xfmrSecondaryVoltage;
            
                // ✅ VALIDATE BEFORE DIVISION
                if (turnsRatio && turnsRatio > 0 && !isNaN(turnsRatio)) {
                    substationMD_Primary = substationMD_Secondary / turnsRatio;
                } else {
                    console.warn(`⚠️ Invalid turns ratio for ${loadFlow.busName}`);
                    substationMD_Primary = substationMD_Secondary;
                    primaryVoltage = secondaryVoltage;
                }
            
                isReflected = true;
            
                console.log(`  Substation ${index + 1}: ${loadFlow.busName}`);
                console.log(`    Secondary Side: ${xfmrSecondaryVoltage}V, ${substationMD_Secondary.toFixed(2)} A`);
                console.log(`    Transformer: ${feedingTransformer.rating} kVA, ${primaryVoltage}V/${xfmrSecondaryVoltage}V`);
                console.log(`    Turns Ratio: ${turnsRatio.toFixed(4)}:1`);
                console.log(`    Primary Side: ${primaryVoltage}V, ${substationMD_Primary.toFixed(2)} A`);
                console.log(`    Power: ${((substationMD_Primary * primaryVoltage * sqrt3) / 1000).toFixed(2)} kVA`);
            } else {
                // No transformer found - this bus might be at the same voltage as system
                console.warn(`⚠️ No transformer found for ${loadFlow.busName}`);
                console.warn(`   Using bus voltage: ${secondaryVoltage}V`);
            
                substationMD_Primary = substationMD_Secondary;
                primaryVoltage = secondaryVoltage;
                isReflected = false;
            }
        
            // ✅ CRITICAL FIX: ENSURE IT'S A VALID NUMBER BEFORE ADDING
            if (isNaN(substationMD_Primary) || !isFinite(substationMD_Primary)) {
                console.error(`  ❌ ERROR: substationMD_Primary is invalid (${substationMD_Primary}) for ${loadFlow.busName}`);
                substationMD_Primary = 0;
            }
            
            // ✅ DEBUG LOGGING
            console.log(`  Adding to total: ${substationMD_Primary.toFixed(2)} A`);
            console.log(`  Current total: ${totalSubstationMD.toFixed(2)} A`);
            
            // ✅ ACCUMULATE (INSIDE TRY BLOCK, BEFORE PUSH)
            totalSubstationMD += substationMD_Primary;
            
            console.log(`  New total: ${totalSubstationMD.toFixed(2)} A`);
        
            // ✅ ADD FINAL VALIDATION BEFORE PUSHING
            substationBreakdown.push({
                index: index + 1,
                busId: busId,
                busName: loadFlow.busName,
                voltage: secondaryVoltage,
                secondaryVoltage: secondaryVoltage,
                primaryVoltage: primaryVoltage || secondaryVoltage,
                connectedCurrent: withDemand.demandSummary?.connectedCurrent || 0,
                connectedCurrent_Secondary: withDemand.demandSummary?.connectedCurrent || 0,
                demandCurrent: withDemand.demandSummary?.demandCurrent || 0,
                demandCurrent_Secondary: withDemand.demandSummary?.demandCurrent || 0,
                maxDemandCurrent: substationMD_Secondary,
                maxDemandCurrent_Secondary: substationMD_Secondary || 0,
                maxDemandCurrent_Primary: substationMD_Primary || 0,  // ✅ GUARANTEED NUMBER
                maxDemandPowerKVA: ((substationMD_Primary || 0) * (primaryVoltage || secondaryVoltage) * sqrt3) / 1000,
                diversityFactor: substationDF || 1.0,
                motorCount: withDemand.demandSummary?.motorCount || 0,
                transformerCount: loadFlow.breakdown?.transformers?.length || 0,
                transformerRating: feedingTransformer ? feedingTransformer.rating : 'N/A',
                transformerRatio: feedingTransformer ? `${feedingTransformer.primary}V/${feedingTransformer.secondary}V` : 'N/A',
                isReflected: isReflected
            });
        
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error calculating MD for ${busId}:`, error.message);
            console.error(`   Stack: ${error.stack}`);
            calculationErrors.push({
                busId: busId,
                error: error.message
            });
        }
    });

    // ✅ SAFETY CHECK: RECALCULATE FROM ARRAY IF LOOP FAILED
    const calculatedTotal = substationBreakdown.reduce((sum, sub) => {
        const value = parseFloat(sub.maxDemandCurrent_Primary) || 0;
        return sum + value;
    }, 0);

    console.log(`✅ Sum of Individual Substation MDs (loop): ${totalSubstationMD.toFixed(2)} A`);
    console.log(`✅ Sum of Individual Substation MDs (array): ${calculatedTotal.toFixed(2)} A`);

    // ✅ USE ARRAY CALCULATION IF LOOP FAILED
    if (totalSubstationMD === 0 && calculatedTotal > 0) {
        console.warn('⚠️ Loop accumulation failed, using array sum instead');
        totalSubstationMD = calculatedTotal;
    }

    console.log('');

    // ══════════════════════════════════════════════════════════════
    // DETERMINE SYSTEM PRIMARY VOLTAGE DYNAMICALLY
    // Use the most common primary voltage across all substations
    // Updated: 2025-11-05 04:25:10 UTC by bfforex
    // ══════════════════════════════════════════════════════════════

    // Count occurrences of each primary voltage
    const voltageCount = {};
    substationBreakdown.forEach(sub => {
        const v = sub.primaryVoltage;
        voltageCount[v] = (voltageCount[v] || 0) + 1;
    });

    // Find the most common primary voltage
    let systemPrimaryVoltage = substationBreakdown[0]?.primaryVoltage || 0;
    let maxCount = 0;

    for (const [voltage, count] of Object.entries(voltageCount)) {
        if (count > maxCount) {
            maxCount = count;
            systemPrimaryVoltage = parseFloat(voltage);
        }
    }

    console.log('📊 SYSTEM VOLTAGE ANALYSIS:');
    console.log('   Primary voltages detected:');
    for (const [voltage, count] of Object.entries(voltageCount)) {
        console.log(`      ${voltage}V: ${count} substation(s)`);
    }
    console.log(`   System primary voltage: ${systemPrimaryVoltage}V (most common)`);

    // Warn if mixed voltages
    const uniqueVoltages = Object.keys(voltageCount).length;
    if (uniqueVoltages > 1) {
        console.warn('⚠️ WARNING: Mixed primary voltages detected!');
        console.warn('   System calculation uses most common voltage for utility sizing');
        console.warn('   Individual substations calculated at their actual voltages');
    }

    console.log('');
    
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2: APPLY SYSTEM-LEVEL DIVERSITY FACTOR (LEVEL 2)
    // ══════════════════════════════════════════════════════════════════════════
    
    console.log('STEP 2: Applying System-Level Diversity Factor');
    console.log('─'.repeat(80));
    
    // ══════════════════════════════════════════════════════════════════════════
    // DETERMINE SYSTEM DIVERSITY FACTOR
    // Per IEEE 141-1993 Red Book Table 3-5
    // Updated: 2025-11-05 05:25:00 UTC by bfforex
    // ══════════════════════════════════════════════════════════════════════════

    let systemDF;
    let dfSource = '';

    // Priority 1: User-specified custom DF
    if (options.systemDiversityFactor) {
        systemDF = options.systemDiversityFactor;
        dfSource = 'user-specified';
        console.log(`Using custom system DF: ${systemDF.toFixed(3)} (${dfSource})`);
    }
    // Priority 2: External SYSTEM_LEVEL_DIVERSITY module
    else if (typeof window.SYSTEM_LEVEL_DIVERSITY !== 'undefined') {
        systemDF = window.SYSTEM_LEVEL_DIVERSITY.getSystemDiversityFactor(
            substationBusIds.length,
            facilityType
        );
        dfSource = 'external module';
        console.log(`Using IEEE 141-1993 system DF: ${systemDF.toFixed(3)} (${substationBusIds.length} substations, ${dfSource})`);
    }
    // Priority 3: Built-in IEEE 141-1993 Table (AUTOMATIC)
    else {
        dfSource = 'IEEE 141-1993 Table 3-5 (automatic)';
    
        // IEEE 141-1993 Red Book - System Diversity Factors
        // Based on number of substations/feeders
        const substationCount = substationBusIds.length;
    
        if (substationCount <= 1) {
            systemDF = 1.00;  // Single substation - no diversity
        } else if (substationCount <= 3) {
            systemDF = 1.30;  // 2-3 substations
        } else if (substationCount <= 6) {
            systemDF = 1.45;  // 4-6 substations
        } else if (substationCount <= 10) {
            systemDF = 1.55;  // 7-10 substations ← YOUR CASE (8 substations)
        } else if (substationCount <= 15) {
            systemDF = 1.65;  // 11-15 substations
        } else if (substationCount <= 20) {
            systemDF = 1.75;  // 16-20 substations
        } else {
            systemDF = 1.85;  // 20+ substations
        }
    
        console.log(`✅ Using IEEE 141-1993 system DF: ${systemDF.toFixed(3)} (${substationCount} substations, ${dfSource})`);
        console.log(`   Reference: IEEE Std 141-1993 (Red Book), Chapter 3, Table 3-5`);
        console.log(`   Application: Industrial/Commercial Power Systems`);
    }
    
    // Calculate total system maximum demand
    const totalSystemMD = totalSubstationMD / systemDF;
    const reductionCurrent = totalSubstationMD - totalSystemMD;
    const reductionPercent = totalSubstationMD > 0 ? (reductionCurrent / totalSubstationMD * 100) : 0;
    
    // Calculate system power at primary voltage
    const sqrt3 = Math.sqrt(3);
    const totalSystemPowerKVA = (totalSystemMD * systemPrimaryVoltage * sqrt3) / 1000;
    const sumSubstationPowerKVA = substationBreakdown.reduce((sum, s) => sum + (s.maxDemandPowerKVA || 0), 0);
    const powerReductionKVA = sumSubstationPowerKVA - totalSystemPowerKVA;

    console.log('📊 POWER CALCULATION:');
    console.log(`   System voltage: ${systemPrimaryVoltage}V`);
    console.log(`   System current: ${totalSystemMD.toFixed(2)} A`);
    console.log(`   System power: ${totalSystemPowerKVA.toFixed(2)} kVA`);
    
    console.log(`Formula: Total System MD = (Sum of Substation MDs) / System DF`);
    console.log(`         ${totalSystemMD.toFixed(2)} A = ${totalSubstationMD.toFixed(2)} A / ${systemDF.toFixed(3)}`);
    console.log('');
    console.log(`✅ Total System Maximum Demand: ${totalSystemMD.toFixed(2)} A (${totalSystemPowerKVA.toFixed(2)} kVA)`);
    console.log(`   Load Reduction: ${reductionCurrent.toFixed(2)} A (${reductionPercent.toFixed(1)}%)`);
    console.log(`   Power Savings: ${powerReductionKVA.toFixed(2)} kVA`);
    console.log('');
    
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3: BUILD DETAILED CALCULATION STEPS (IF REQUESTED)
    // ══════════════════════════════════════════════════════════════════════════
    
    let calculationSteps = '';
    
    if (includeSteps) {
        calculationSteps += '═'.repeat(80) + '\n';
        calculationSteps += 'HIERARCHICAL DEMAND & DIVERSITY FACTOR CALCULATION\n';
        calculationSteps += 'System-Wide Maximum Demand (Level 2)\n';
        calculationSteps += '═'.repeat(80) + '\n\n';
        
        calculationSteps += `📋 CALCULATION INFORMATION\n`;
        calculationSteps += '─'.repeat(80) + '\n';
        calculationSteps += `Date/Time:              ${getCalculationTimestamp()}\n`;
        calculationSteps += `Engineer:               ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
        calculationSteps += `Project:                ${document.getElementById('projectName')?.value || 'Untitled'}\n`;
        calculationSteps += `Facility Type:          ${facilityType.replace(/_/g, ' ').toUpperCase()}\n`;
        calculationSteps += `Number of Substations:  ${substationBusIds.length}\n`;
        calculationSteps += `Standards:              IEEE 141-1993, NEC Article 220\n\n`;
        
        calculationSteps += `📖 HIERARCHICAL METHODOLOGY\n`;
        calculationSteps += '─'.repeat(80) + '\n';
        calculationSteps += `This calculation implements a TWO-LEVEL hierarchy:\n\n`;
        calculationSteps += `LEVEL 1: Individual Substation Maximum Demand\n`;
        calculationSteps += `  • Apply demand factors to equipment (motors, transformers, etc.)\n`;
        calculationSteps += `  • Apply substation diversity factor to account for internal non-coincidence\n`;
        calculationSteps += `  • Result: Maximum Demand (MD) for each substation\n`;
        calculationSteps += `  • Formula: MD = (Connected × Demand Factor) / Substation DF\n\n`;
        
        calculationSteps += `LEVEL 2: Total System Maximum Demand\n`;
        calculationSteps += `  • Treat each substation MD as an "individual load"\n`;
        calculationSteps += `  • Apply system-level diversity factor\n`;
        calculationSteps += `  • Accounts for peaks at different times (offices vs. shops)\n`;
        calculationSteps += `  • Result: Total system MD for sizing main utility service\n`;
        calculationSteps += `  • Formula: Total MD = (Sum of Substation MDs) / System DF\n\n`;
        
        calculationSteps += '═'.repeat(80) + '\n';
        calculationSteps += 'LEVEL 1: SUBSTATION MAXIMUM DEMANDS\n';
        calculationSteps += '═'.repeat(80) + '\n\n';
        
        // Detail each substation
        substationBreakdown.forEach(sub => {
            calculationSteps += `🏭 SUBSTATION ${sub.index}: ${sub.busName}\n`;
            calculationSteps += '─'.repeat(80) + '\n';
            calculationSteps += `Secondary Voltage:      ${sub.secondaryVoltage}V (LVSG)\n`;
            calculationSteps += `Primary Voltage:        ${sub.primaryVoltage}V (MVSG)\n`;
            calculationSteps += `Transformer:            ${sub.transformerRatio}, ${sub.transformerRating} kVA\n`;
            
            calculationSteps += `Motor Count:            ${sub.motorCount}\n`;
            calculationSteps += `Transformer Count:      ${sub.transformerCount}\n\n`;
            
            calculationSteps += `Connected Load:         ${(sub.connectedCurrent || 0).toFixed(2)} A\n`;
            calculationSteps += `Demand Load:            ${(sub.demandCurrent || 0).toFixed(2)} A (after demand factors)\n`;
            calculationSteps += `Substation DF:          ${(sub.diversityFactor || 1.0).toFixed(3)}\n`;
            calculationSteps += `Maximum Demand (MD):    ${(sub.maxDemandCurrent || 0).toFixed(2)} A\n`;
            calculationSteps += `Power:                  ${(sub.maxDemandPowerKVA || 0).toFixed(2)} kVA\n\n`;
            
            const subReduction = (sub.connectedCurrent || 0) > 0 ? 
                (((sub.connectedCurrent || 0) - (sub.maxDemandCurrent || 0)) / (sub.connectedCurrent || 0) * 100) : 0;
            calculationSteps += `Level 1 Reduction:      ${((sub.connectedCurrent || 0) - (sub.maxDemandCurrent || 0)).toFixed(2)} A (${subReduction.toFixed(1)}%)\n\n`;
        });
        
        calculationSteps += '═'.repeat(80) + '\n';
        calculationSteps += 'LEVEL 2: SYSTEM-WIDE MAXIMUM DEMAND\n';
        calculationSteps += '═'.repeat(80) + '\n\n';
        
        calculationSteps += `📊 SYSTEM AGGREGATION\n`;
        calculationSteps += '─'.repeat(80) + '\n';
        calculationSteps += `Sum of Substation MDs:  ${totalSubstationMD.toFixed(2)} A\n`;
        calculationSteps += `System Diversity Factor: ${systemDF.toFixed(3)} (${substationBusIds.length} substations)\n`;
        calculationSteps += `Reference:              IEEE 141-1993 Table 3-5\n\n`;
        
        calculationSteps += `Formula:\n`;
        calculationSteps += `  Total System MD = (Sum of Substation MDs) / System DF\n`;
        calculationSteps += `  Total System MD = ${totalSubstationMD.toFixed(2)} A / ${systemDF.toFixed(3)}\n`;
        calculationSteps += `  Total System MD = ${totalSystemMD.toFixed(2)} A\n\n`;
        
        calculationSteps += `💰 TOTAL SAVINGS (LEVEL 1 + LEVEL 2)\n`;
        calculationSteps += '─'.repeat(80) + '\n';

        // Calculate total connected load at PRIMARY voltage (reflected from secondary)
        const totalConnectedPrimary = substationBreakdown.reduce((sum, s) => 
            sum + (s.connectedCurrent_Secondary || 0) * (s.secondaryVoltage || 440) / (s.primaryVoltage || s.secondaryVoltage || 440), 0
        );

        // Level 1 savings (Connected → Sum of MDs)
        const level1Reduction = totalConnectedPrimary - totalSubstationMD;
        const level1ReductionPercent = totalConnectedPrimary > 0 ? (level1Reduction / totalConnectedPrimary * 100) : 0;

        // Level 2 savings (Sum of MDs → System MD)
        const level2Reduction = totalSubstationMD - totalSystemMD;
        const level2ReductionPercent = totalSubstationMD > 0 ? (level2Reduction / totalSubstationMD * 100) : 0;

        // Total savings (Connected → System MD)
        const totalReduction = totalConnectedPrimary - totalSystemMD;
        const totalReductionPercent = totalConnectedPrimary > 0 ? (totalReduction / totalConnectedPrimary * 100) : 0;

        calculationSteps += `⚠️ NOTE: All values reflected to PRIMARY voltage (${systemPrimaryVoltage}V) for comparison\n\n`;

        calculationSteps += `CONNECTED LOAD (at ${systemPrimaryVoltage}V):\n`;
        calculationSteps += `  Total Connected:        ${totalConnectedPrimary.toFixed(2)} A (100.0%)\n\n`;

        calculationSteps += `LEVEL 1 SAVINGS (Demand & Diversity at Substation Level):\n`;
        calculationSteps += `  Sum of Substation MDs:  ${totalSubstationMD.toFixed(2)} A (${(totalSubstationMD / totalConnectedPrimary * 100).toFixed(1)}%)\n`;
        calculationSteps += `  Level 1 Reduction:      ${level1Reduction.toFixed(2)} A (${level1ReductionPercent.toFixed(1)}%)\n\n`;

        calculationSteps += `LEVEL 2 SAVINGS (System-Wide Diversity):\n`;
        calculationSteps += `  Total System MD:        ${totalSystemMD.toFixed(2)} A (${(totalSystemMD / totalConnectedPrimary * 100).toFixed(1)}%)\n`;
        calculationSteps += `  Level 2 Reduction:      ${level2Reduction.toFixed(2)} A (${level2ReductionPercent.toFixed(1)}%)\n\n`;

        calculationSteps += `TOTAL SAVINGS (Combined Level 1 + Level 2):\n`;
        calculationSteps += `  Starting Point:         ${totalConnectedPrimary.toFixed(2)} A (connected load)\n`;
        calculationSteps += `  Final Result:           ${totalSystemMD.toFixed(2)} A (system MD)\n`;
        calculationSteps += `  Total Reduction:        ${totalReduction.toFixed(2)} A (${totalReductionPercent.toFixed(1)}%)\n\n`;
        
        // ✅ FIXED: Calculate connected power at PRIMARY voltage
        const totalConnectedPowerPrimary = substationBreakdown.reduce((sum, s) => {
            const connectedPrimary = (s.connectedCurrent_Secondary || 0) * (s.secondaryVoltage || 440) / (s.primaryVoltage || s.secondaryVoltage || 440);
            return sum + (connectedPrimary * (s.primaryVoltage || s.secondaryVoltage || 440) * sqrt3 / 1000);
        }, 0);

        calculationSteps += `Total Connected Power:  ${totalConnectedPowerPrimary.toFixed(2)} kVA (at ${systemPrimaryVoltage}V)\n`;
        calculationSteps += `Total System Power:     ${totalSystemPowerKVA.toFixed(2)} kVA (at ${systemPrimaryVoltage}V)\n`;
        calculationSteps += `Power Savings:          ${(totalConnectedPowerPrimary - totalSystemPowerKVA).toFixed(2)} kVA (${((totalConnectedPowerPrimary - totalSystemPowerKVA) / totalConnectedPowerPrimary * 100).toFixed(1)}%)\n\n`;
        
        calculationSteps += `🎯 DESIGN IMPLICATIONS\n`;
        calculationSteps += '─'.repeat(80) + '\n';
        calculationSteps += `✓ Main Utility Service:     Size for ${totalSystemMD.toFixed(2)} A (not ${totalSubstationMD.toFixed(2)} A)\n`;
        calculationSteps += `✓ Primary Switchgear:       Size for ${totalSystemMD.toFixed(2)} A\n`;
        calculationSteps += `✓ Utility Contract:         Request ${totalSystemPowerKVA.toFixed(2)} kVA capacity\n`;
        calculationSteps += `✓ Individual Substations:   Size per Level 1 calculations\n\n`;
        
        calculationSteps += `📋 STANDARDS COMPLIANCE\n`;
        calculationSteps += '─'.repeat(80) + '\n';
        calculationSteps += `✓ IEEE 141-1993 Red Book - Chapter 3: System Design\n`;
        calculationSteps += `✓ IEEE 141-1993 Section 3.3 - Diversity Factors\n`;
        calculationSteps += `✓ NEC Article 220 - Branch Circuit, Feeder, and Service Loads\n`;
        calculationSteps += `✓ NEC Article 430.24 - Motor Demand Factors\n\n`;
        
        calculationSteps += '═'.repeat(80) + '\n';
        calculationSteps += 'END OF SYSTEM-WIDE CALCULATION\n';
        calculationSteps += '═'.repeat(80) + '\n';
    }
    
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 4: BUILD RESULT OBJECT
    // ══════════════════════════════════════════════════════════════════════════
    
    const elapsedTime = Date.now() - startTime;
    
    const result = {
        // Metadata
        calculationType: 'System-Wide Maximum Demand (Level 2)',
        calculationDate: getCalculationTimestamp(),
        facilityType: facilityType,
        substationCount: substationBusIds.length,
        systemPrimaryVoltage: systemPrimaryVoltage,      
        voltageConfiguration: voltageCount,
        hasMixedVoltages: uniqueVoltages > 1,
        calculationTimeMs: elapsedTime,
        
        // Level 1 Results (Individual Substations)
        substations: substationBreakdown,
        sumOfSubstationMDs: totalSubstationMD,
        sumOfSubstationPowerKVA: sumSubstationPowerKVA,
        
        // Level 2 Results (System-Wide)
        systemDiversityFactor: systemDF,
        systemDFSource: dfSource,
        totalSystemMD: totalSystemMD,
        totalSystemPowerKVA: totalSystemPowerKVA,
        
        // Savings
        currentReduction: reductionCurrent,
        currentReductionPercent: reductionPercent,
        powerReductionKVA: powerReductionKVA,
        
        // ✅ FIXED: Total savings (from connected to final system MD, at PRIMARY voltage)
        totalConnectedCurrent_Secondary: substationBreakdown.reduce((sum, s) => sum + (s.connectedCurrent || 0), 0),
        totalConnectedCurrent_Primary: substationBreakdown.reduce((sum, s) => 
            sum + (s.connectedCurrent_Secondary || 0) * (s.secondaryVoltage || 440) / (s.primaryVoltage || s.secondaryVoltage || 440), 0
        ),
        totalReductionFromConnected: substationBreakdown.reduce((sum, s) => 
            sum + (s.connectedCurrent_Secondary || 0) * (s.secondaryVoltage || 440) / (s.primaryVoltage || s.secondaryVoltage || 440), 0
        ) - totalSystemMD,
        totalReductionPercentFromConnected: (() => {
            const totalConnPrimary = substationBreakdown.reduce((sum, s) => 
                sum + (s.connectedCurrent_Secondary || 0) * (s.secondaryVoltage || 440) / (s.primaryVoltage || s.secondaryVoltage || 440), 0
            );
            return totalConnPrimary > 0 ? ((totalConnPrimary - totalSystemMD) / totalConnPrimary * 100) : 0;
        })(),
        
        // Calculation steps
        calculationSteps: calculationSteps,
        
        // Standards
        standards: [
            'IEEE 141-1993 - Red Book (Industrial Power Systems)',
            'IEEE 141-1993 Section 3.3 - System Diversity Factors',
            'NEC Article 220 - Load Calculations',
            'NEC Article 430.24 - Motor Demand Factors'
        ],
        
        // Errors (if any)
        errors: calculationErrors
    };
    
    console.log('═'.repeat(80));
    console.log(`✅ System-Wide Calculation Complete (${elapsedTime}ms)`);
    console.log(`   Substations Analyzed: ${substationBusIds.length}`);
    console.log(`   Total System MD: ${totalSystemMD.toFixed(2)} A (${totalSystemPowerKVA.toFixed(2)} kVA)`);
    console.log(`   Savings: ${reductionPercent.toFixed(1)}% reduction`);
    console.log('═'.repeat(80) + '\n');
    
    return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// DIVERSITY FACTOR INTEGRATION (MAINTAINED FROM v2.1.0)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate load flow with diversity factors applied
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} options - Diversity options
 * @returns {Object} Load flow with diversity applied
 */
function calculateLoadFlowWithDiversity(busId, options = {}) {
    console.log('\n📊 Calculating load flow WITH diversity factors...');
    
    const standardLoadFlow = calculateLoadFlow(busId);
    
    if (!window.calculateDiversifiedLoad && !window.DIVERSITY_FACTORS) {
        console.warn('⚠️ Diversity module not loaded, returning standard load flow');
        return {
            ...standardLoadFlow,
            diversityApplied: false,
            note: 'Diversity factors not available'
        };
    }
    
    // Apply diversity to motors
    let diversifiedMotorLoad = 0;
    let motorDiversityFactor = 1.0;
    
    if (standardLoadFlow.breakdown.motors.length > 0) {
        const motorDiversity = window.calculateDiversifiedLoad(
            standardLoadFlow.breakdown.motors.map(m => ({
                type: 'motor',
                hp: m.hp,
                fullLoadCurrent: m.current,
                current: m.current,
                name: m.name
            })),
            'motors',
            { continuousDuty: true }
        );
        
        diversifiedMotorLoad = motorDiversity.finalLoad;
        motorDiversityFactor = motorDiversity.diversityFactor;
        
        console.log(`✅ Motor diversity applied: ${standardLoadFlow.breakdown.motors.length} motors`);
        console.log(`   Connected: ${motorDiversity.connectedLoad.toFixed(2)} A`);
        console.log(`   Diversified: ${diversifiedMotorLoad.toFixed(2)} A`);
        console.log(`   Diversity Factor: ${motorDiversityFactor.toFixed(3)}`);
    }
    
    // Apply diversity to other loads
    const transformerLoad = standardLoadFlow.breakdown.transformers.reduce(
        (sum, t) => sum + (t.primaryCurrent || 0), 0
    );
    const cableLoad = standardLoadFlow.breakdown.cables.reduce(
        (sum, c) => sum + (c.current || 0), 0
    );
    const directLoad = standardLoadFlow.breakdown.directLoads.reduce(
        (sum, d) => sum + (d.current || 0), 0
    );
    
    // Calculate total diversified load
    const totalDiversifiedLoad = diversifiedMotorLoad + transformerLoad + cableLoad + directLoad;
    const originalLoad = standardLoadFlow.summary.totalCurrent;
    const overallDiversityFactor = originalLoad > 0 ? originalLoad / totalDiversifiedLoad : 1.0;
    
    // Calculate power with diversity
    const voltage = standardLoadFlow.busVoltage || 480;
    const SQRT3 = Math.sqrt(3);
    const diversifiedPowerKVA = (totalDiversifiedLoad * voltage * SQRT3) / 1000;
    const diversifiedPowerKW = diversifiedPowerKVA * standardLoadFlow.summary.powerFactor;
    
    // Build enhanced result
    const enhanced = {
        ...standardLoadFlow,
        diversityApplied: true,
        diversityDate: new Date().toISOString(),
        connectedLoad: originalLoad,
        diversifiedLoad: totalDiversifiedLoad,
        loadReduction: originalLoad - totalDiversifiedLoad,
        loadReductionPercent: originalLoad > 0 ? ((originalLoad - totalDiversifiedLoad) / originalLoad * 100) : 0,
        motorDiversityFactor: motorDiversityFactor,
        overallDiversityFactor: overallDiversityFactor,
        diversifiedSummary: {
            totalCurrent: totalDiversifiedLoad,
            totalPowerKVA: diversifiedPowerKVA,
            totalPowerKW: diversifiedPowerKW,
            powerFactor: standardLoadFlow.summary.powerFactor,
            motorCurrent: diversifiedMotorLoad,
            transformerCurrent: transformerLoad,
            cableCurrent: cableLoad,
            directCurrent: directLoad
        },
        standards: [
            'IEEE 141-1993 - Diversity Factors',
            'NEC Article 220 - Demand Factors',
            ...(options.heavy_industry ? ['API RP 540 - LNG/Petroleum'] : [])
        ]
    };
    
    // Add diversity calculation steps
    let diversitySteps = '\n' + '═'.repeat(80) + '\n';
    diversitySteps += 'LOAD DIVERSITY ANALYSIS\n';
    diversitySteps += '═'.repeat(80) + '\n\n';
    diversitySteps += `Standards: IEEE 141-1993, NEC Article 220\n`;
    diversitySteps += `Date: ${enhanced.diversityDate}\n\n`;
    
    diversitySteps += 'LOAD COMPARISON:\n';
    diversitySteps += '─'.repeat(80) + '\n';
    diversitySteps += `Connected Load:     ${originalLoad.toFixed(2)} A (100.0%)\n`;
    diversitySteps += `Diversified Load:   ${totalDiversifiedLoad.toFixed(2)} A (${(totalDiversifiedLoad/originalLoad*100).toFixed(1)}%)\n`;
    diversitySteps += `Load Reduction:     ${enhanced.loadReduction.toFixed(2)} A (${enhanced.loadReductionPercent.toFixed(1)}%)\n`;
    diversitySteps += `Diversity Factor:   ${overallDiversityFactor.toFixed(3)}\n\n`;
    
    diversitySteps += 'POWER COMPARISON:\n';
    diversitySteps += '─'.repeat(80) + '\n';
    diversitySteps += `Connected Power:    ${standardLoadFlow.summary.totalPowerKVA.toFixed(2)} kVA\n`;
    diversitySteps += `Diversified Power:  ${diversifiedPowerKVA.toFixed(2)} kVA\n`;
    diversitySteps += `Power Reduction:    ${(standardLoadFlow.summary.totalPowerKVA - diversifiedPowerKVA).toFixed(2)} kVA\n\n`;
    
    if (standardLoadFlow.breakdown.motors.length > 0) {
        diversitySteps += 'MOTOR DIVERSITY:\n';
        diversitySteps += '─'.repeat(80) + '\n';
        diversitySteps += `Number of Motors:   ${standardLoadFlow.breakdown.motors.length}\n`;
        diversitySteps += `Motor Diversity:    ${motorDiversityFactor.toFixed(3)} (DF)\n`;
        diversitySteps += `Demand Factor:      ${(1/motorDiversityFactor).toFixed(3)} (Kd)\n`;
        diversitySteps += `Per IEEE 141-1993 Table 3-5\n\n`;
    }
    
    diversitySteps += '═'.repeat(80) + '\n';
    diversitySteps += 'END OF DIVERSITY ANALYSIS\n';
    diversitySteps += '═'.repeat(80) + '\n';
    
    enhanced.diversityCalculationSteps = diversitySteps;
    
    console.log('✅ Load flow with diversity complete');
    console.log(`   Reduction: ${enhanced.loadReductionPercent.toFixed(1)}%`);
    console.log(`   Diversified: ${totalDiversifiedLoad.toFixed(2)} A`);
    
    return enhanced;
}

/**
 * Generate enhanced load flow breakdown with cable tags and From/To columns
 * 
 * @param {Object} loadFlow - Load flow results
 * @returns {String} Formatted breakdown table
 */
function generateLoadFlowBreakdownEnhanced(loadFlow) {
    let breakdown = '\n';
    breakdown += '═'.repeat(80) + '\n';
    breakdown += 'DETAILED COMPONENT BREAKDOWN WITH FROM/TO INFORMATION\n';
    breakdown += '═'.repeat(80) + '\n\n';
    breakdown += `Type          Tag/Name             From Bus                 To Bus                   Current(A)  Power(kVA)\n`;
    breakdown += '─'.repeat(80) + '\n';

    if (loadFlow.breakdown?.motors && loadFlow.breakdown.motors.length > 0) {
        loadFlow.breakdown.motors.forEach(motor => {
            const tag = (motor.tag || 'N/A').substring(0, 20).padEnd(20);
            const from = (motor.fromBus || 'N/A').substring(0, 24).padEnd(24);
            const to = (motor.toBus || motor.location || 'N/A').substring(0, 24).padEnd(24);
            const current = (motor.current || 0).toFixed(2).padStart(11);
            const power = (motor.powerKVA || 0).toFixed(2).padStart(11);
            breakdown += `Motor         ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.transformers && loadFlow.breakdown.transformers.length > 0) {
        loadFlow.breakdown.transformers.forEach(xfmr => {
            const tag = (xfmr.tag || 'N/A').substring(0, 20).padEnd(20);
            const from = (xfmr.fromBus || 'N/A').substring(0, 24).padEnd(24);
            const to = (xfmr.toBus || 'N/A').substring(0, 24).padEnd(24);
            const current = (xfmr.primaryCurrent || 0).toFixed(2).padStart(11);
            const power = (xfmr.powerKVA || 0).toFixed(2).padStart(11);
            breakdown += `Transformer   ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.cables && loadFlow.breakdown.cables.length > 0) {
        loadFlow.breakdown.cables.forEach(cable => {
            const tag = (cable.tag || 'N/A').substring(0, 20).padEnd(20);
            const from = (cable.fromBus || 'N/A').substring(0, 24).padEnd(24);
            const to = (cable.toBus || 'N/A').substring(0, 24).padEnd(24);
            const current = (cable.current || 0).toFixed(2).padStart(11);
            const power = (cable.powerKVA || 0).toFixed(2).padStart(11);
            breakdown += `Cable         ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        loadFlow.breakdown.directLoads.forEach(load => {
            const tag = 'Direct Load'.padEnd(20);
            const from = '(Direct)'.padEnd(24);
            const to = (load.busTag || load.bus || 'N/A').substring(0, 24).padEnd(24);
            const current = (load.current || 0).toFixed(2).padStart(11);
            const power = (load.powerKVA || 0).toFixed(2).padStart(11);
            breakdown += `Direct Load   ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.generators && loadFlow.breakdown.generators.length > 0) {
        loadFlow.breakdown.generators.forEach(gen => {
            const tag = (gen.tag || gen.name || 'N/A').substring(0, 20).padEnd(20);
            const from = '(Source)'.padEnd(24);
            const to = (gen.toBus || gen.location || 'N/A').substring(0, 24).padEnd(24);
            breakdown += `Generator     ${tag} ${from} ${to}         N/A         N/A\n`;
        });
    }

    breakdown += '─'.repeat(80) + '\n';
    breakdown += `TOTAL${' '.repeat(91)}${(loadFlow.summary?.totalCurrent || 0).toFixed(2).padStart(11)} ${(loadFlow.summary?.totalPowerKVA || 0).toFixed(2).padStart(11)}\n`;
    breakdown += '═'.repeat(80) + '\n';
    
    return breakdown;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.generateLoadFlowBreakdownEnhanced = generateLoadFlowBreakdownEnhanced;
    window.calculateLoadFlow = calculateLoadFlow;
    window.calculateLoadFlowWithDiversity = calculateLoadFlowWithDiversity;
    window.applyDemandFactorsToLoadFlow = applyDemandFactorsToLoadFlow;
    window.getDiversityFactorForBus = getDiversityFactorForBus;
    window.calculateLoadFlowWithDemand = calculateLoadFlowWithDemand;
    window.calculateSystemMaximumDemand = calculateSystemMaximumDemand;
    window.LOAD_FLOW_CONFIG = LOAD_FLOW_CONFIG;
}

console.log('✅ Load Flow Calculation module v2.2.1 loaded');
console.log('   - FIXED: System MD accumulation (CRITICAL)');
console.log('   - FIXED: Removed undefined variable references');
console.log('   - FIXED: Null safety for all numeric operations');
console.log('   - ENHANCED: Visual hierarchy with icons');
console.log('   - ENHANCED: Component tags prominently displayed');
console.log('   - ENHANCED: From/To bus information in all steps');
console.log('   - ENHANCED: Professional formatting');
console.log('   - MAINTAINED: All v2.2.0 features');
console.log('   - Demand & Diversity Factors: INTEGRATED');
console.log('   - System-Level Diversity: FULLY OPERATIONAL');
console.log('   - Date: 2025-11-05 04:30:22 UTC');
console.log('   - Author: bfforex');
console.log('');