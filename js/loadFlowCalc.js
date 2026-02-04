/**
 * Load Flow Calculation Module
 * Dedicated calculations for power flow analysis
 * 
 * @author bfforex
 * @date 2025-10-28 00:49:48 UTC
 * @version 1.0.0
 */

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
    
    logger.info('\n' + '═'.repeat(80));
    logger.info('LOAD FLOW ANALYSIS');
    logger.info('═'.repeat(80));
    logger.info(`Bus: ${bus.name} (${bus.voltage}V)`);
    logger.info('═'.repeat(80) + '\n');
    
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
            powerFactor: parseFloat(document.getElementById('powerFactor').value) || 0.85
        },
        pathTrace: [],
        calculationSteps: '',
        calculationDate: getCalculationTimestamp()
    };
    
    let steps = 'LOAD FLOW CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${loadData.calculationDate}\n`;
    steps += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    steps += `Bus: ${bus.name} (${bus.voltage}V)\n`;
    steps += `Power Factor: ${loadData.summary.powerFactor}\n\n`;
    
    // Recursive load calculation with detailed tracking
    const visited = new Set();
    
    function traverseDownstream(currentBusId, depth = 0) {
        if (visited.has(currentBusId)) return 0;
        visited.add(currentBusId);
        
        const indent = '  '.repeat(depth);
        let branchLoad = 0;
        
        const currentBus = buses.find(b => b.id === currentBusId);
        if (!currentBus) return 0;
        
        steps += `${indent}📍 ${currentBus.name} (${currentBus.voltage}V)\n`;
        loadData.pathTrace.push({
            depth: depth,
            bus: currentBus.name,
            voltage: currentBus.voltage,
            loads: []
        });
        
        // Direct bus load
        if (currentBus.loadCurrent && currentBus.loadCurrent > 0) {
            branchLoad += currentBus.loadCurrent;
            loadData.breakdown.directLoads.push({
                bus: currentBus.name,
                current: currentBus.loadCurrent,
                powerKVA: (currentBus.loadCurrent * currentBus.voltage * Math.sqrt(3)) / 1000
            });
            steps += `${indent}  ├─ Direct Load: ${currentBus.loadCurrent.toFixed(2)} A\n`;
        }
        
        // Find downstream components
        const downstreamComponents = components.filter(c => c.fromBus === currentBusId);
        
        downstreamComponents.forEach((comp, index) => {
            const isLast = index === downstreamComponents.length - 1;
            const connector = isLast ? '└─' : '├─';
            
            const toBus = buses.find(b => b.id === comp.toBus);
            if (!toBus) return;
            
            steps += `${indent}  ${connector} ${comp.type.toUpperCase()}: ${comp.name || comp.fromBusName + '→' + comp.toBusName}\n`;
            
            switch(comp.type) {
                case 'motor':
                    const motorCurrent = calculateMotorCurrent(comp.hp, toBus.voltage);
                    branchLoad += motorCurrent;
                    
                    loadData.breakdown.motors.push({
                        name: `${comp.hp} HP ${comp.motorType}`,
                        location: toBus.name,
                        hp: comp.hp,
                        voltage: toBus.voltage,
                        current: motorCurrent,
                        powerKVA: (motorCurrent * toBus.voltage * Math.sqrt(3)) / 1000,
                        powerKW: (motorCurrent * toBus.voltage * Math.sqrt(3) * loadData.summary.powerFactor) / 1000
                    });
                    
                    steps += `${indent}    │  HP: ${comp.hp}, Type: ${comp.motorType}\n`;
                    steps += `${indent}    │  Current: ${motorCurrent.toFixed(2)} A\n`;
                    steps += `${indent}    └─ Power: ${(motorCurrent * toBus.voltage * Math.sqrt(3) / 1000).toFixed(2)} kVA\n`;
                    break;
                    
                case 'transformer':
                    const xfmrDownstream = traverseDownstream(comp.toBus, depth + 2);
                    
                    if (xfmrDownstream > 0) {
                        // Refer secondary current to primary
                        const turnsRatio = comp.primary / comp.secondary;
                        const primaryCurrent = xfmrDownstream / turnsRatio;
                        branchLoad += primaryCurrent;
                        
                        loadData.breakdown.transformers.push({
                            name: `${comp.rating} kVA Transformer`,
                            location: `${currentBus.name} → ${toBus.name}`,
                            rating: comp.rating,
                            primaryVoltage: comp.primary,
                            secondaryVoltage: comp.secondary,
                            secondaryCurrent: xfmrDownstream,
                            primaryCurrent: primaryCurrent,
                            loading: (xfmrDownstream * comp.secondary * Math.sqrt(3) / (comp.rating * 1000)) * 100,
                            powerKVA: (primaryCurrent * comp.primary * Math.sqrt(3)) / 1000
                        });
                        
                        steps += `${indent}    │  Rating: ${comp.rating} kVA\n`;
                        steps += `${indent}    │  Secondary Load: ${xfmrDownstream.toFixed(2)} A @ ${comp.secondary}V\n`;
                        steps += `${indent}    │  Primary Current: ${primaryCurrent.toFixed(2)} A @ ${comp.primary}V\n`;
                        steps += `${indent}    │  Loading: ${(xfmrDownstream * comp.secondary * Math.sqrt(3) / (comp.rating * 1000) * 100).toFixed(1)}%\n`;
                        steps += `${indent}    └─ Turns Ratio: ${turnsRatio.toFixed(4)}\n`;
                    } else {
                        // Use 80% of rating as default
                        const xfmrCurrent = calculateTransformerCurrent(comp.rating, comp.primary, 0.8);
                        branchLoad += xfmrCurrent;
                        
                        loadData.breakdown.transformers.push({
                            name: `${comp.rating} kVA Transformer`,
                            location: `${currentBus.name} → ${toBus.name}`,
                            rating: comp.rating,
                            primaryVoltage: comp.primary,
                            secondaryVoltage: comp.secondary,
                            primaryCurrent: xfmrCurrent,
                            loading: 80,
                            powerKVA: (xfmrCurrent * comp.primary * Math.sqrt(3)) / 1000
                        });
                        
                        steps += `${indent}    │  No downstream load detected\n`;
                        steps += `${indent}    │  Using 80% of rating\n`;
                        steps += `${indent}    └─ Current: ${xfmrCurrent.toFixed(2)} A\n`;
                    }
                    break;
                    
                case 'cable':
                    if (comp.loadCurrent && comp.loadCurrent > 0) {
                        branchLoad += comp.loadCurrent;
                        
                        loadData.breakdown.cables.push({
                            name: `${comp.size} ${comp.material.toUpperCase()} - ${comp.length}ft`,
                            location: `${currentBus.name} → ${toBus.name}`,
                            size: comp.size,
                            material: comp.material,
                            length: comp.length,
                            parallel: comp.parallel || 1,
                            current: comp.loadCurrent,
                            powerKVA: (comp.loadCurrent * currentBus.voltage * Math.sqrt(3)) / 1000
                        });
                        
                        steps += `${indent}    │  Specified Load: ${comp.loadCurrent.toFixed(2)} A\n`;
                        steps += `${indent}    └─ ${comp.size} ${comp.material} ${comp.parallel > 1 ? `(${comp.parallel}×)` : ''}\n`;
                    } else {
                        const cableDownstream = traverseDownstream(comp.toBus, depth + 2);
                        branchLoad += cableDownstream;
                        
                        if (cableDownstream > 0) {
                            loadData.breakdown.cables.push({
                                name: `${comp.size} ${comp.material.toUpperCase()} - ${comp.length}ft`,
                                location: `${currentBus.name} → ${toBus.name}`,
                                size: comp.size,
                                material: comp.material,
                                length: comp.length,
                                parallel: comp.parallel || 1,
                                current: cableDownstream,
                                powerKVA: (cableDownstream * currentBus.voltage * Math.sqrt(3)) / 1000
                            });
                        }
                    }
                    break;
                    
                case 'generator':
                    loadData.breakdown.generators.push({
                        name: `${comp.rating} kVA Generator`,
                        location: toBus.name,
                        rating: comp.rating,
                        voltage: comp.voltage,
                        type: 'Source (not a load)'
                    });
                    
                    steps += `${indent}    └─ ${comp.rating} kVA Generator (Source)\n`;
                    break;
            }
        });
        
        if (branchLoad > 0) {
            steps += `${indent}  └─ Subtotal: ${branchLoad.toFixed(2)} A\n\n`;
        }
        
        return branchLoad;
    }
    
    // Execute traversal
    loadData.totalLoad = traverseDownstream(busId);
    
    // Calculate summary
    loadData.summary.totalCurrent = loadData.totalLoad;
    loadData.summary.totalPowerKVA = (loadData.totalLoad * bus.voltage * Math.sqrt(3)) / 1000;
    loadData.summary.totalPowerKW = loadData.summary.totalPowerKVA * loadData.summary.powerFactor;
    
    // ═══════════════════════════════════════════════════════════
    // ✅ FIXED: Correct transformer percentage display
    // Modified: 2025-10-28 11:00:04 UTC by bfforex
    // Issue: Showing 5248.6% because of incorrect percentage calc
    // ═══════════════════════════════════════════════════════════
    
    steps += '═'.repeat(80) + '\n';
    steps += 'LOAD FLOW SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Total Load Current: ${loadData.summary.totalCurrent.toFixed(2)} A\n`;
    steps += `Total Apparent Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA\n`;
    steps += `Total Active Power: ${loadData.summary.totalPowerKW.toFixed(2)} kW\n`;
    steps += `Power Factor: ${loadData.summary.powerFactor}\n\n`;
    
    steps += 'BREAKDOWN BY TYPE:\n';
    steps += '-'.repeat(80) + '\n';
    
    const motorTotal = loadData.breakdown.motors.reduce((sum, m) => sum + m.current, 0);
    
    // ✅ FIXED: Only count PRIMARY current for transformers
    // Don't multiply - the current is already reflected to primary side
    const xfmrTotal = loadData.breakdown.transformers.reduce((sum, t) => {
        return sum + (t.primaryCurrent || 0);
    }, 0);
    
    const cableTotal = loadData.breakdown.cables.reduce((sum, c) => sum + c.current, 0);
    const directTotal = loadData.breakdown.directLoads.reduce((sum, d) => sum + d.current, 0);
    
    // ✅ FIXED: Calculate percentage based on total load at THIS voltage level
    // For transformers, they reflect load from another voltage level
    const totalAtThisLevel = motorTotal + directTotal + cableTotal;
    
    steps += `Motors: ${motorTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (motorTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Transformers: ${xfmrTotal.toFixed(2)} A (reflected from downstream)\n`;
    steps += `Cables: ${cableTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (cableTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Direct Loads: ${directTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (directTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Generators: ${loadData.breakdown.generators.length} (Sources)\n\n`;
    
    loadData.calculationSteps = steps;
    
    logger.info('Load Flow Analysis Complete');
    logger.info(`   Total Load: ${loadData.summary.totalCurrent.toFixed(2)} A`);
    logger.info(`   Total Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA`);
    logger.debug('');
    
    return loadData;
}

// Export functions
window.calculateLoadFlow = calculateLoadFlow;

logger.info('Load Flow Calculation module loaded');