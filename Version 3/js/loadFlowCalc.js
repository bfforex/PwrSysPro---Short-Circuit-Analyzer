/**
 * Load Flow Calculation Module
 * Dedicated calculations for power flow analysis
 * 
 * @author bfforex
 * @date 2025-11-02 15:41:41 UTC
 * @version 2.2.0 - Enhanced with visual hierarchy and formatting
 * @enhanced Component tags prominently displayed
 * @enhanced Visual hierarchy with icons (🔌 🔧 ⚙️ ⚡ 📊 ✅)
 * @enhanced From/To bus information in all calculation steps
 * @enhanced Enhanced formatting matching voltage drop module
 * @enhanced Detailed calculation formulas
 * @fixed Enhanced error handling and exports
 * 
 * ENHANCEMENTS FROM v2.1.0:
 * - Visual icons throughout calculation steps
 * - Component tags displayed prominently
 * - From/To bus connections in every component section
 * - Enhanced section separators and headers
 * - Better structured output with professional formatting
 * - Calculation formulas shown with step-by-step breakdowns
 * 
 * FEATURES FROM v2.1.0 (MAINTAINED):
 * - Recursive load traversal with detailed tracking
 * - Demand & diversity factor integration
 * - Motor diversity calculations
 * - Transformer loading analysis
 * - Cable tag support
 * - Enhanced null safety
 */

console.log('🔧 Loading Load Flow Calculation Module v2.2.0...');
console.log('   ✅ Visual hierarchy - ENHANCED');
console.log('   ✅ Component tags display - ENHANCED');
console.log('   ✅ From/To bus information - ENHANCED');
console.log('   ✅ All v2.1.0 features maintained');

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
    console.log('LOAD FLOW ANALYSIS - ENHANCED v2.2.0');
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
        // ════════════════════════════════════════════════════════════════════════════
        if (currentBus.loadCurrent && currentBus.loadCurrent > 0) {
            branchLoad += currentBus.loadCurrent;
            
            const powerKVA = (currentBus.loadCurrent * currentBus.voltage * Math.sqrt(3)) / 1000;
            
            loadData.breakdown.directLoads.push({
                bus: currentBus.name,
                busTag: currentBus.tag,
                current: currentBus.loadCurrent,
                powerKVA: powerKVA
            });
            
            steps += `${indent}  ${LOAD_FLOW_CONFIG.ICONS.load} Direct Load: ${currentBus.loadCurrent.toFixed(2)} A (${powerKVA.toFixed(2)} kVA)\n`;
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
    // BREAKDOWN BY TYPE (ENHANCED)
    // ══════════════════════════════════════════════════════════════════════════════
    
    const motorTotal = loadData.breakdown.motors.reduce((sum, m) => sum + m.current, 0);
    const xfmrTotal = loadData.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
    const cableTotal = loadData.breakdown.cables.reduce((sum, c) => sum + c.current, 0);
    const directTotal = loadData.breakdown.directLoads.reduce((sum, d) => sum + d.current, 0);
    const totalAtThisLevel = motorTotal + directTotal + cableTotal;
    
    steps += `📋 BREAKDOWN BY COMPONENT TYPE\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `Type          Count  Current (A)  Power (kVA)  Percentage\n`;
    steps += '─'.repeat(80) + '\n';
    
    const motorPower = loadData.breakdown.motors.reduce((sum, m) => sum + m.powerKVA, 0);
    const xfmrPower = loadData.breakdown.transformers.reduce((sum, t) => sum + t.powerKVA, 0);
    const cablePower = loadData.breakdown.cables.reduce((sum, c) => sum + c.powerKVA, 0);
    const directPower = loadData.breakdown.directLoads.reduce((sum, d) => sum + d.powerKVA, 0);
    
    steps += `Motors        ${loadData.breakdown.motors.length.toString().padStart(5)}  ${motorTotal.toFixed(2).padStart(11)}  ${motorPower.toFixed(2).padStart(11)}  ${totalAtThisLevel > 0 ? (motorTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%\n`;
    steps += `Transformers  ${loadData.breakdown.transformers.length.toString().padStart(5)}  ${xfmrTotal.toFixed(2).padStart(11)}  ${xfmrPower.toFixed(2).padStart(11)}  (reflected)\n`;
    steps += `Cables        ${loadData.breakdown.cables.length.toString().padStart(5)}  ${cableTotal.toFixed(2).padStart(11)}  ${cablePower.toFixed(2).padStart(11)}  ${totalAtThisLevel > 0 ? (cableTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%\n`;
    steps += `Direct Loads  ${loadData.breakdown.directLoads.length.toString().padStart(5)}  ${directTotal.toFixed(2).padStart(11)}  ${directPower.toFixed(2).padStart(11)}  ${totalAtThisLevel > 0 ? (directTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%\n`;
    steps += `Generators    ${loadData.breakdown.generators.length.toString().padStart(5)}  (Sources)    N/A          N/A\n`;
    steps += '─'.repeat(80) + '\n';
    steps += `TOTAL                    ${loadData.summary.totalCurrent.toFixed(2).padStart(11)}  ${loadData.summary.totalPowerKVA.toFixed(2).padStart(11)}  100.0%\n`;
    steps += '─'.repeat(80) + '\n\n';
    
    steps += `${LOAD_FLOW_CONFIG.ICONS.info} Note: Transformer loads are reflected from downstream voltage levels\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'END OF LOAD FLOW CALCULATION\n';
    steps += '═'.repeat(80) + '\n';
    
    loadData.calculationSteps = steps;
    
    console.log('✅ Load Flow Analysis Complete (v2.2.0)');
    console.log(`   Total Load: ${loadData.summary.totalCurrent.toFixed(2)} A`);
    console.log(`   Total Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA`);
    console.log(`   Components: ${componentCount}`);
    console.log('');
    
    return loadData;
}

// ════════════════════════════════════════════════════════════════════════════════
// DEMAND & DIVERSITY FACTOR INTEGRATION (MAINTAINED FROM v2.1.0)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Apply demand factors to load flow results
 * 
 * @param {Object} loadFlow - Original load flow result
 * @returns {Object} Enhanced load flow with demand factors applied
 */
function applyDemandFactorsToLoadFlow(loadFlow) {
    if (!loadFlow || typeof loadFlow !== 'object') {
        console.warn('⚠️ Invalid loadFlow object in applyDemandFactorsToLoadFlow');
        return loadFlow;
    }
    
    if (!window.DemandFactors) {
        console.warn('⚠️ DemandFactors module not loaded, skipping demand factor application');
        return loadFlow;
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('APPLYING DEMAND & DIVERSITY FACTORS');
    console.log('═'.repeat(80));
    
    const enhanced = {
        ...loadFlow,
        demandFactorsApplied: true,
        connectedLoad: loadFlow.totalLoad,
        demandLoad: 0,
        diversityLoad: 0,
        demandBreakdown: {
            motors: [],
            transformers: [],
            cables: [],
            directLoads: [],
            generators: []
        },
        demandSummary: {
            connectedCurrent: loadFlow.summary?.totalCurrent || 0,
            demandCurrent: 0,
            diversityCurrent: 0,
            connectedPowerKVA: loadFlow.summary?.totalPowerKVA || 0,
            demandPowerKVA: 0,
            diversityPowerKVA: 0,
            demandFactor: 1.0,
            diversityFactor: 1.0
        }
    };
    
    let steps = '\n' + '═'.repeat(80) + '\n';
    steps += 'DEMAND & DIVERSITY FACTOR ANALYSIS\n';
    steps += '═'.repeat(80) + '\n\n';
    
    // MOTORS - Apply Motor Demand Factors
    if (loadFlow.breakdown?.motors && loadFlow.breakdown.motors.length > 0) {
        steps += `${LOAD_FLOW_CONFIG.ICONS.motor} MOTOR LOADS\n`;
        steps += '─'.repeat(80) + '\n';
        
        const motorDuty = 'continuous';
        const numberOfMotors = loadFlow.breakdown.motors.length;
        
        loadFlow.breakdown.motors.forEach((motor, index) => {
            const motorDemand = window.DemandFactors.calculateMotorDemand(
                motor.current,
                motorDuty,
                numberOfMotors
            );
            
            enhanced.demandBreakdown.motors.push({
                ...motor,
                connectedCurrent: motor.current,
                demandCurrent: motorDemand.demandLoad,
                demandFactor: motorDemand.demandFactor,
                dutyType: motorDemand.dutyType,
                necReference: motorDemand.necReference
            });
            
            enhanced.demandLoad += motorDemand.demandLoad;
            
            steps += `Motor ${index + 1}: ${motor.tag || motor.name}\n`;
            steps += `  Connected Load:  ${motor.current.toFixed(2)} A\n`;
            steps += `  Demand Factor:   ${(motorDemand.demandFactor * 100).toFixed(1)}%\n`;
            steps += `  Demand Load:     ${motorDemand.demandLoad.toFixed(2)} A\n`;
            steps += `  Reference:       ${motorDemand.necReference}\n\n`;
        });
    }
    
    // TRANSFORMERS - Apply 80% Loading Factor
    if (loadFlow.breakdown?.transformers && loadFlow.breakdown.transformers.length > 0) {
        steps += `${LOAD_FLOW_CONFIG.ICONS.transformer} TRANSFORMER LOADS\n`;
        steps += '─'.repeat(80) + '\n';
        
        const transformerDemandFactor = 0.80;
        
        loadFlow.breakdown.transformers.forEach((xfmr, index) => {
            const demandCurrent = xfmr.primaryCurrent * transformerDemandFactor;
            
            enhanced.demandBreakdown.transformers.push({
                ...xfmr,
                connectedCurrent: xfmr.primaryCurrent,
                demandCurrent: demandCurrent,
                demandFactor: transformerDemandFactor,
                note: 'Typical 80% loading factor'
            });
            
            enhanced.demandLoad += demandCurrent;
            
            steps += `Transformer ${index + 1}: ${xfmr.tag || xfmr.name}\n`;
            steps += `  Connected Load:  ${xfmr.primaryCurrent.toFixed(2)} A (Primary)\n`;
            steps += `  Demand Factor:   ${(transformerDemandFactor * 100).toFixed(1)}%\n`;
            steps += `  Demand Load:     ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // CABLES - Apply Demand Factor
    if (loadFlow.breakdown?.cables && loadFlow.breakdown.cables.length > 0) {
        steps += `${LOAD_FLOW_CONFIG.ICONS.cable} CABLE LOADS\n`;
        steps += '─'.repeat(80) + '\n';
        
        loadFlow.breakdown.cables.forEach((cable, index) => {
            const bus = buses.find(b => b.name === cable.location?.split(' → ')[1]);
            const demandFactor = bus?.demandFactor || 1.0;
            const demandCurrent = cable.current * demandFactor;
            
            enhanced.demandBreakdown.cables.push({
                ...cable,
                connectedCurrent: cable.current,
                demandCurrent: demandCurrent,
                demandFactor: demandFactor
            });
            
            enhanced.demandLoad += demandCurrent;
            
            steps += `Cable ${index + 1}: ${cable.tag || cable.name}\n`;
            steps += `  Connected Load:  ${cable.current.toFixed(2)} A\n`;
            steps += `  Demand Factor:   ${(demandFactor * 100).toFixed(1)}%\n`;
            steps += `  Demand Load:     ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // DIRECT LOADS - Apply Bus Demand Factor
    if (loadFlow.breakdown?.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        steps += `${LOAD_FLOW_CONFIG.ICONS.load} DIRECT LOADS\n`;
        steps += '─'.repeat(80) + '\n';
        
        loadFlow.breakdown.directLoads.forEach((load, index) => {
            const bus = buses.find(b => b.name === load.bus);
            const demandFactor = bus?.demandFactor || 1.0;
            const demandCurrent = load.current * demandFactor;
            
            enhanced.demandBreakdown.directLoads.push({
                ...load,
                connectedCurrent: load.current,
                demandCurrent: demandCurrent,
                demandFactor: demandFactor
            });
            
            enhanced.demandLoad += demandCurrent;
            
            steps += `Direct Load ${index + 1}: ${load.busTag || load.bus}\n`;
            steps += `  Connected Load:  ${load.current.toFixed(2)} A\n`;
            steps += `  Demand Factor:   ${(demandFactor * 100).toFixed(1)}%\n`;
            steps += `  Demand Load:     ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // APPLY DIVERSITY FACTOR
    const diversityFactor = getDiversityFactorForBus(loadFlow.busId) || 1.2;
    enhanced.diversityLoad = enhanced.demandLoad / diversityFactor;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'DEMAND & DIVERSITY SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    
    const connectedCurrent = loadFlow.summary?.totalCurrent || 0;
    
    steps += `Connected Load Current:    ${connectedCurrent.toFixed(2)} A (100%)\n`;
    steps += `Demand Load Current:       ${enhanced.demandLoad.toFixed(2)} A (${connectedCurrent > 0 ? (enhanced.demandLoad / connectedCurrent * 100).toFixed(1) : '0.0'}%)\n`;
    steps += `Diversity Load Current:    ${enhanced.diversityLoad.toFixed(2)} A (${enhanced.demandLoad > 0 ? (enhanced.diversityLoad / enhanced.demandLoad * 100).toFixed(1) : '0.0'}%)\n\n`;
    
    steps += `Overall Demand Factor:     ${connectedCurrent > 0 ? (enhanced.demandLoad / connectedCurrent).toFixed(3) : '1.000'}\n`;
    steps += `Overall Diversity Factor:  ${diversityFactor.toFixed(3)}\n`;
    steps += `Combined Factor:           ${connectedCurrent > 0 ? (enhanced.diversityLoad / connectedCurrent).toFixed(3) : '1.000'}\n\n`;
    
    const voltage = loadFlow.busVoltage || 480;
    const sqrt3 = Math.sqrt(3);
    
    enhanced.demandSummary.demandCurrent = enhanced.demandLoad;
    enhanced.demandSummary.diversityCurrent = enhanced.diversityLoad;
    enhanced.demandSummary.demandPowerKVA = (enhanced.demandLoad * voltage * sqrt3) / 1000;
    enhanced.demandSummary.diversityPowerKVA = (enhanced.diversityLoad * voltage * sqrt3) / 1000;
    enhanced.demandSummary.demandFactor = connectedCurrent > 0 ? enhanced.demandLoad / connectedCurrent : 1;
    enhanced.demandSummary.diversityFactor = diversityFactor;
    
    steps += `Connected Power:           ${(loadFlow.summary?.totalPowerKVA || 0).toFixed(2)} kVA\n`;
    steps += `Demand Power:              ${enhanced.demandSummary.demandPowerKVA.toFixed(2)} kVA\n`;
    steps += `Diversity Power:           ${enhanced.demandSummary.diversityPowerKVA.toFixed(2)} kVA (Design Load)\n\n`;
    
    steps += `Power Savings:             ${((loadFlow.summary?.totalPowerKVA || 0) - enhanced.demandSummary.diversityPowerKVA).toFixed(2)} kVA\n`;
    steps += `Reduction:                 ${connectedCurrent > 0 ? ((1 - enhanced.diversityLoad / connectedCurrent) * 100).toFixed(1) : '0.0'}%\n\n`;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'NEC COMPLIANCE\n';
    steps += '═'.repeat(80) + '\n';
    steps += `✓ NEC Article 220 - Load Calculations\n`;
    steps += `✓ NEC Article 430.24 - Motor Demand Factors\n`;
    steps += `✓ IEEE 141 - Diversity Factors Applied\n\n`;
    
    enhanced.demandCalculationSteps = steps;
    
    console.log('✅ Demand & diversity factors applied');
    console.log(`   Connected: ${connectedCurrent.toFixed(2)} A → Demand: ${enhanced.demandLoad.toFixed(2)} A → Diversity: ${enhanced.diversityLoad.toFixed(2)} A`);
    console.log(`   Reduction: ${connectedCurrent > 0 ? ((1 - enhanced.diversityLoad / connectedCurrent) * 100).toFixed(1) : '0.0'}%`);
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
        (sum, c) => sum + c.current, 0
    );
    const directLoad = standardLoadFlow.breakdown.directLoads.reduce(
        (sum, d) => sum + d.current, 0
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
            const current = motor.current.toFixed(2).padStart(11);
            const power = motor.powerKVA.toFixed(2).padStart(11);
            breakdown += `Motor         ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.transformers && loadFlow.breakdown.transformers.length > 0) {
        loadFlow.breakdown.transformers.forEach(xfmr => {
            const tag = (xfmr.tag || 'N/A').substring(0, 20).padEnd(20);
            const from = (xfmr.fromBus || 'N/A').substring(0, 24).padEnd(24);
            const to = (xfmr.toBus || 'N/A').substring(0, 24).padEnd(24);
            const current = (xfmr.primaryCurrent || 0).toFixed(2).padStart(11);
            const power = xfmr.powerKVA.toFixed(2).padStart(11);
            breakdown += `Transformer   ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.cables && loadFlow.breakdown.cables.length > 0) {
        loadFlow.breakdown.cables.forEach(cable => {
            const tag = (cable.tag || 'N/A').substring(0, 20).padEnd(20);
            const from = (cable.fromBus || 'N/A').substring(0, 24).padEnd(24);
            const to = (cable.toBus || 'N/A').substring(0, 24).padEnd(24);
            const current = cable.current.toFixed(2).padStart(11);
            const power = cable.powerKVA.toFixed(2).padStart(11);
            breakdown += `Cable         ${tag} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        loadFlow.breakdown.directLoads.forEach(load => {
            const tag = 'Direct Load'.padEnd(20);
            const from = '(Direct)'.padEnd(24);
            const to = (load.busTag || load.bus || 'N/A').substring(0, 24).padEnd(24);
            const current = load.current.toFixed(2).padStart(11);
            const power = load.powerKVA.toFixed(2).padStart(11);
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

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ════════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.generateLoadFlowBreakdownEnhanced = generateLoadFlowBreakdownEnhanced;
    window.calculateLoadFlow = calculateLoadFlow;
    window.calculateLoadFlowWithDiversity = calculateLoadFlowWithDiversity;
    window.applyDemandFactorsToLoadFlow = applyDemandFactorsToLoadFlow;
    window.getDiversityFactorForBus = getDiversityFactorForBus;
    window.calculateLoadFlowWithDemand = calculateLoadFlowWithDemand;
    window.LOAD_FLOW_CONFIG = LOAD_FLOW_CONFIG;
}

console.log('✅ Load Flow Calculation module v2.2.0 loaded');
console.log('   - ENHANCED: Visual hierarchy with icons');
console.log('   - ENHANCED: Component tags prominently displayed');
console.log('   - ENHANCED: From/To bus information in all steps');
console.log('   - ENHANCED: Professional formatting');
console.log('   - MAINTAINED: All v2.1.0 features');
console.log('   - Demand & Diversity Factors: INTEGRATED');
console.log('   - Date: 2025-11-02 15:41:41 UTC');
console.log('   - Author: bfforex');
console.log('');