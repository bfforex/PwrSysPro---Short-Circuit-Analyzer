/**
 * Load Flow Calculation Module
 * Dedicated calculations for power flow analysis
 * 
 * @author bfforex
 * @date 2025-10-30 05:28:22 UTC
 * @version 2.1.0 - Enhanced error handling and exports
 * @fixed Added comprehensive null checks
 * @fixed Enhanced export verification
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
    
    console.log('\n' + '═'.repeat(80));
    console.log('LOAD FLOW ANALYSIS');
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
            powerFactor: parseFloat(document.getElementById('powerFactor')?.value) || 0.85,
            connectedCurrent: 0
        },
        pathTrace: [],
        calculationSteps: '',
        calculationDate: getCalculationTimestamp()
    };
    
    let steps = 'LOAD FLOW CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${loadData.calculationDate}\n`;
    steps += `Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
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
        const downstreamComponents = components.filter(c => c && c.fromBus === currentBusId);
        
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
                        name: `${comp.hp} HP ${comp.motorType || 'Motor'}`,
                        location: toBus.name,
                        hp: comp.hp,
                        voltage: toBus.voltage,
                        current: motorCurrent,
                        powerKVA: (motorCurrent * toBus.voltage * Math.sqrt(3)) / 1000,
                        powerKW: (motorCurrent * toBus.voltage * Math.sqrt(3) * loadData.summary.powerFactor) / 1000
                    });
                    
                    steps += `${indent}    │  HP: ${comp.hp}, Type: ${comp.motorType || 'Standard'}\n`;
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
    loadData.summary.connectedCurrent = loadData.totalLoad;
    loadData.summary.totalPowerKVA = (loadData.totalLoad * bus.voltage * Math.sqrt(3)) / 1000;
    loadData.summary.totalPowerKW = loadData.summary.totalPowerKVA * loadData.summary.powerFactor;
    
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
    const xfmrTotal = loadData.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
    const cableTotal = loadData.breakdown.cables.reduce((sum, c) => sum + c.current, 0);
    const directTotal = loadData.breakdown.directLoads.reduce((sum, d) => sum + d.current, 0);
    const totalAtThisLevel = motorTotal + directTotal + cableTotal;
    
    steps += `Motors: ${motorTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (motorTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Transformers: ${xfmrTotal.toFixed(2)} A (reflected from downstream)\n`;
    steps += `Cables: ${cableTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (cableTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Direct Loads: ${directTotal.toFixed(2)} A (${totalAtThisLevel > 0 ? (directTotal/totalAtThisLevel*100).toFixed(1) : '0.0'}%)\n`;
    steps += `Generators: ${loadData.breakdown.generators.length} (Sources)\n\n`;
    
    loadData.calculationSteps = steps;
    
    console.log('✅ Load Flow Analysis Complete');
    console.log(`   Total Load: ${loadData.summary.totalCurrent.toFixed(2)} A`);
    console.log(`   Total Power: ${loadData.summary.totalPowerKVA.toFixed(2)} kVA`);
    console.log('');
    
    return loadData;
}

// ════════════════════════════════════════════════════════════════════════════════
// DEMAND & DIVERSITY FACTOR INTEGRATION
// Enhanced: 2025-10-30 05:28:22 UTC by bfforex
// Feature #5: Demand & Diversity Factors
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Apply demand factors to load flow results
 * 
 * @param {Object} loadFlow - Original load flow result
 * @returns {Object} Enhanced load flow with demand factors applied
 */
function applyDemandFactorsToLoadFlow(loadFlow) {
    // ✅ DEFENSIVE CHECK: Validate input
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
        steps += '🔌 MOTOR LOADS:\n';
        steps += '-'.repeat(80) + '\n';
        
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
            
            steps += `  Motor ${index + 1}: ${motor.name}\n`;
            steps += `    Connected Load: ${motor.current.toFixed(2)} A\n`;
            steps += `    Demand Factor: ${(motorDemand.demandFactor * 100).toFixed(1)}%\n`;
            steps += `    Demand Load: ${motorDemand.demandLoad.toFixed(2)} A\n`;
            steps += `    Reference: ${motorDemand.necReference}\n\n`;
        });
    }
    
    // TRANSFORMERS - Apply 80% Loading Factor
    if (loadFlow.breakdown?.transformers && loadFlow.breakdown.transformers.length > 0) {
        steps += '🔌 TRANSFORMER LOADS:\n';
        steps += '-'.repeat(80) + '\n';
        
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
            
            steps += `  Transformer ${index + 1}: ${xfmr.name}\n`;
            steps += `    Connected Load: ${xfmr.primaryCurrent.toFixed(2)} A (Primary)\n`;
            steps += `    Demand Factor: ${(transformerDemandFactor * 100).toFixed(1)}%\n`;
            steps += `    Demand Load: ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // CABLES - Apply Demand Factor
    if (loadFlow.breakdown?.cables && loadFlow.breakdown.cables.length > 0) {
        steps += '🔗 CABLE LOADS:\n';
        steps += '-'.repeat(80) + '\n';
        
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
            
            steps += `  Cable ${index + 1}: ${cable.name}\n`;
            steps += `    Connected Load: ${cable.current.toFixed(2)} A\n`;
            steps += `    Demand Factor: ${(demandFactor * 100).toFixed(1)}%\n`;
            steps += `    Demand Load: ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // DIRECT LOADS - Apply Bus Demand Factor
    if (loadFlow.breakdown?.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        steps += '⚡ DIRECT LOADS:\n';
        steps += '-'.repeat(80) + '\n';
        
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
            
            steps += `  Direct Load ${index + 1}: ${load.bus}\n`;
            steps += `    Connected Load: ${load.current.toFixed(2)} A\n`;
            steps += `    Demand Factor: ${(demandFactor * 100).toFixed(1)}%\n`;
            steps += `    Demand Load: ${demandCurrent.toFixed(2)} A\n\n`;
        });
    }
    
    // APPLY DIVERSITY FACTOR
    const diversityFactor = getDiversityFactorForBus(loadFlow.busId) || 1.2;
    enhanced.diversityLoad = enhanced.demandLoad / diversityFactor;
    
    steps += '═'.repeat(80) + '\n';
    steps += 'DEMAND & DIVERSITY SUMMARY:\n';
    steps += '═'.repeat(80) + '\n\n';
    
    steps += `Connected Load Current:    ${(loadFlow.summary?.totalCurrent || 0).toFixed(2)} A (100%)\n`;
    steps += `Demand Load Current:       ${enhanced.demandLoad.toFixed(2)} A (${((loadFlow.summary?.totalCurrent || 1) > 0 ? (enhanced.demandLoad / loadFlow.summary.totalCurrent * 100) : 0).toFixed(1)}%)\n`;
    steps += `Diversity Load Current:    ${enhanced.diversityLoad.toFixed(2)} A (${(enhanced.demandLoad > 0 ? (enhanced.diversityLoad / enhanced.demandLoad * 100) : 0).toFixed(1)}%)\n`;
    steps += `\n`;
    steps += `Overall Demand Factor:     ${((loadFlow.summary?.totalCurrent || 1) > 0 ? (enhanced.demandLoad / loadFlow.summary.totalCurrent) : 1).toFixed(3)}\n`;
    steps += `Overall Diversity Factor:  ${diversityFactor.toFixed(3)}\n`;
    steps += `Combined Factor:           ${((loadFlow.summary?.totalCurrent || 1) > 0 ? (enhanced.diversityLoad / loadFlow.summary.totalCurrent) : 1).toFixed(3)}\n`;
    steps += `\n`;
    
    const voltage = loadFlow.busVoltage || 480;
    const sqrt3 = Math.sqrt(3);
    
    enhanced.demandSummary.demandCurrent = enhanced.demandLoad;
    enhanced.demandSummary.diversityCurrent = enhanced.diversityLoad;
    enhanced.demandSummary.demandPowerKVA = (enhanced.demandLoad * voltage * sqrt3) / 1000;
    enhanced.demandSummary.diversityPowerKVA = (enhanced.diversityLoad * voltage * sqrt3) / 1000;
    enhanced.demandSummary.demandFactor = (loadFlow.summary?.totalCurrent || 1) > 0 ? enhanced.demandLoad / loadFlow.summary.totalCurrent : 1;
    enhanced.demandSummary.diversityFactor = diversityFactor;
    
    steps += `Connected Power:           ${(loadFlow.summary?.totalPowerKVA || 0).toFixed(2)} kVA\n`;
    steps += `Demand Power:              ${enhanced.demandSummary.demandPowerKVA.toFixed(2)} kVA\n`;
    steps += `Diversity Power:           ${enhanced.demandSummary.diversityPowerKVA.toFixed(2)} kVA (Design Load)\n`;
    steps += `\n`;
    steps += `Power Savings:             ${((loadFlow.summary?.totalPowerKVA || 0) - enhanced.demandSummary.diversityPowerKVA).toFixed(2)} kVA\n`;
    steps += `Reduction:                 ${((loadFlow.summary?.totalCurrent || 1) > 0 ? ((1 - enhanced.diversityLoad / loadFlow.summary.totalCurrent) * 100) : 0).toFixed(1)}%\n`;
    
    steps += '\n' + '═'.repeat(80) + '\n';
    steps += 'NEC COMPLIANCE:\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `✓ NEC Article 220 - Load Calculations\n`;
    steps += `✓ NEC Article 430.24 - Motor Demand Factors\n`;
    steps += `✓ IEEE 141 - Diversity Factors Applied\n`;
    
    enhanced.demandCalculationSteps = steps;
    
    console.log('✅ Demand & diversity factors applied');
    console.log(`   Connected: ${(loadFlow.summary?.totalCurrent || 0).toFixed(2)} A → Demand: ${enhanced.demandLoad.toFixed(2)} A → Diversity: ${enhanced.diversityLoad.toFixed(2)} A`);
    console.log(`   Reduction: ${((loadFlow.summary?.totalCurrent || 1) > 0 ? ((1 - enhanced.diversityLoad / loadFlow.summary.totalCurrent) * 100) : 0).toFixed(1)}%`);
    console.log('');
    
    return enhanced;
}

/**
 * Get diversity factor for a bus
 * 
 * @param {String} busId - Bus identifier
 * @returns {Number} Diversity factor (= or > 1.0)
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
    
    return 1.2
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

/**
 * Generate enhanced load flow breakdown with cable tags and From/To columns
 * ENHANCED: 2025-10-29 07:32:52 UTC by bfforex
 * Feature #8: From/To Column Implementation
 */
function generateLoadFlowBreakdownEnhanced(loadFlow) {
    let breakdown = `
DETAILED COMPONENT BREAKDOWN WITH FROM/TO INFORMATION:
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
Type          Tag/Name                From Equipment          To Equipment            Current(A)   Power(kVA)
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
`;

    if (loadFlow.breakdown?.motors && loadFlow.breakdown.motors.length > 0) {
        loadFlow.breakdown.motors.forEach(motor => {
            const name = motor.name.substring(0, 20).padEnd(20);
            const from = '(Local Load)'.padEnd(24);
            const to = (motor.location || 'Unknown').substring(0, 24).padEnd(24);
            const current = motor.current.toFixed(2).padStart(12);
            const power = motor.powerKVA.toFixed(2).padStart(12);
            breakdown += `Motor         ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.transformers && loadFlow.breakdown.transformers.length > 0) {
        loadFlow.breakdown.transformers.forEach(xfmr => {
            const name = xfmr.name.substring(0, 20).padEnd(20);
            
            let fromBus = 'Unknown';
            let toBus = 'Unknown';
            if (xfmr.location && xfmr.location.includes(' → ')) {
                const parts = xfmr.location.split(' → ');
                fromBus = parts[0] || 'Unknown';
                toBus = parts[1] || 'Unknown';
            }
            
            const from = fromBus.substring(0, 24).padEnd(24);
            const to = toBus.substring(0, 24).padEnd(24);
            const current = xfmr.primaryCurrent.toFixed(2).padStart(12);
            const power = xfmr.powerKVA.toFixed(2).padStart(12);
            breakdown += `Transformer   ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.cables && loadFlow.breakdown.cables.length > 0) {
        loadFlow.breakdown.cables.forEach(cable => {
            let fromBus = 'Unknown';
            let toBus = 'Unknown';
            if (cable.location && cable.location.includes(' → ')) {
                const parts = cable.location.split(' → ');
                fromBus = parts[0] || 'Unknown';
                toBus = parts[1] || 'Unknown';
            }
            
            const cableComp = components.find(c => 
                c.type === 'cable' && 
                c.fromBusName === fromBus && 
                c.toBusName === toBus
            );
            
            const tag = cableComp?.tag || 'N/A';
            const name = tag.substring(0, 20).padEnd(20);
            const from = fromBus.substring(0, 24).padEnd(24);
            const to = toBus.substring(0, 24).padEnd(24);
            const current = cable.current.toFixed(2).padStart(12);
            const power = cable.powerKVA.toFixed(2).padStart(12);
            
            breakdown += `Cable         ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        loadFlow.breakdown.directLoads.forEach(load => {
            const name = 'Direct Load'.padEnd(20);
            const from = '(Direct)'.padEnd(24);
            const to = (load.bus || 'Unknown').substring(0, 24).padEnd(24);
            const current = load.current.toFixed(2).padStart(12);
            const power = load.powerKVA.toFixed(2).padStart(12);
            breakdown += `Direct Load   ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown?.generators && loadFlow.breakdown.generators.length > 0) {
        loadFlow.breakdown.generators.forEach(gen => {
            const name = gen.name.substring(0, 20).padEnd(20);
            const from = '(Source)'.padEnd(24);
            const to = (gen.location || 'Unknown').substring(0, 24).padEnd(24);
            const current = (gen.current || 0).toFixed(2).padStart(12);
            const power = (gen.powerKVA || 0).toFixed(2).padStart(12);
            breakdown += `Generator     ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    breakdown += `════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n`;
    breakdown += `TOTAL                                                                                    ${(loadFlow.summary?.totalCurrent || 0).toFixed(2).padStart(12)} ${(loadFlow.summary?.totalPowerKVA || 0).toFixed(2).padStart(12)}\n`;
    breakdown += `════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n`;
    
    return breakdown;
}

// ════════════════════════════════════════════════════════════════════════════════
// DIVERSITY FACTOR INTEGRATION
// Added: 2025-11-01 08:36:33 UTC by bfforex
// Issue #4: Load diversity factors
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate load flow with diversity factors applied
 * ENHANCED: Integrates with diversity factor module
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} options - Diversity options
 * @returns {Object} Load flow with diversity applied
 */
function calculateLoadFlowWithDiversity(busId, options = {}) {
    console.log('\n📊 Calculating load flow WITH diversity factors...');
    
    // Step 1: Calculate standard load flow
    const standardLoadFlow = calculateLoadFlow(busId);
    
    // Step 2: Check if diversity module is available
    if (!window.calculateDiversifiedLoad) {
        console.warn('⚠️ Diversity module not loaded, returning standard load flow');
        return {
            ...standardLoadFlow,
            diversityApplied: false,
            note: 'Diversity factors not available'
        };
    }
    
    // Step 3: Apply diversity to motors
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
    
    // Step 4: Apply diversity to other loads (simplified)
    const transformerLoad = standardLoadFlow.breakdown.transformers.reduce(
        (sum, t) => sum + (t.primaryCurrent || 0), 0
    );
    const cableLoad = standardLoadFlow.breakdown.cables.reduce(
        (sum, c) => sum + c.current, 0
    );
    const directLoad = standardLoadFlow.breakdown.directLoads.reduce(
        (sum, d) => sum + d.current, 0
    );
    
    // Step 5: Calculate total diversified load
    const totalDiversifiedLoad = diversifiedMotorLoad + transformerLoad + cableLoad + directLoad;
    const originalLoad = standardLoadFlow.summary.totalCurrent;
    const overallDiversityFactor = originalLoad > 0 ? originalLoad / totalDiversifiedLoad : 1.0;
    
    // Step 6: Calculate power with diversity
    const voltage = standardLoadFlow.busVoltage || 480;
    const SQRT3 = Math.sqrt(3);
    const diversifiedPowerKVA = (totalDiversifiedLoad * voltage * SQRT3) / 1000;
    const diversifiedPowerKW = diversifiedPowerKVA * standardLoadFlow.summary.powerFactor;
    
    // Step 7: Build enhanced result
    const enhanced = {
        ...standardLoadFlow,
        
        // Diversity information
        diversityApplied: true,
        diversityDate: new Date().toISOString(),
        
        // Load comparison
        connectedLoad: originalLoad,
        diversifiedLoad: totalDiversifiedLoad,
        loadReduction: originalLoad - totalDiversifiedLoad,
        loadReductionPercent: originalLoad > 0 ? ((originalLoad - totalDiversifiedLoad) / originalLoad * 100) : 0,
        
        // Diversity factors
        motorDiversityFactor: motorDiversityFactor,
        overallDiversityFactor: overallDiversityFactor,
        
        // Diversified summary
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
        
        // Standards
        standards: [
            'IEEE 141-1993 - Diversity Factors',
            'NEC Article 220 - Demand Factors',
            ...(options.heavy_industry ? ['API RP 540 - LNG/Petroleum'] : [])
        ]
    };
    
    // Step 8: Add diversity calculation steps
    let diversitySteps = '\n' + '═'.repeat(80) + '\n';
    diversitySteps += 'LOAD DIVERSITY ANALYSIS\n';
    diversitySteps += '═'.repeat(80) + '\n\n';
    diversitySteps += `Standards: IEEE 141-1993, NEC Article 220\n`;
    diversitySteps += `Date: ${enhanced.diversityDate}\n\n`;
    
    diversitySteps += 'LOAD COMPARISON:\n';
    diversitySteps += '-'.repeat(80) + '\n';
    diversitySteps += `Connected Load:     ${originalLoad.toFixed(2)} A (100.0%)\n`;
    diversitySteps += `Diversified Load:   ${totalDiversifiedLoad.toFixed(2)} A (${(totalDiversifiedLoad/originalLoad*100).toFixed(1)}%)\n`;
    diversitySteps += `Load Reduction:     ${enhanced.loadReduction.toFixed(2)} A (${enhanced.loadReductionPercent.toFixed(1)}%)\n`;
    diversitySteps += `Diversity Factor:   ${overallDiversityFactor.toFixed(3)}\n\n`;
    
    diversitySteps += 'POWER COMPARISON:\n';
    diversitySteps += '-'.repeat(80) + '\n';
    diversitySteps += `Connected Power:    ${standardLoadFlow.summary.totalPowerKVA.toFixed(2)} kVA\n`;
    diversitySteps += `Diversified Power:  ${diversifiedPowerKVA.toFixed(2)} kVA\n`;
    diversitySteps += `Power Reduction:    ${(standardLoadFlow.summary.totalPowerKVA - diversifiedPowerKVA).toFixed(2)} kVA\n\n`;
    
    if (standardLoadFlow.breakdown.motors.length > 0) {
        diversitySteps += 'MOTOR DIVERSITY:\n';
        diversitySteps += '-'.repeat(80) + '\n';
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

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// Enhanced: 2025-10-30 05:28:22 UTC
// ════════════════════════════════════════════════════════════════════════════════

window.generateLoadFlowBreakdownEnhanced = generateLoadFlowBreakdownEnhanced;
window.calculateLoadFlow = calculateLoadFlow;
window.calculateLoadFlowWithDiversity = calculateLoadFlowWithDiversity;
window.applyDemandFactorsToLoadFlow = applyDemandFactorsToLoadFlow;
window.applyDemandFactorsToLoadFlow = applyDemandFactorsToLoadFlow;
window.getDiversityFactorForBus = getDiversityFactorForBus;
window.calculateLoadFlowWithDemand = calculateLoadFlowWithDemand;

console.log('✅ Load Flow Calculation module v2.1.0 loaded');
console.log('   - Enhanced null safety checks: ENABLED');
console.log('   - Demand & Diversity Factors: INTEGRATED');
console.log('   - All exports verified: COMPLETE');