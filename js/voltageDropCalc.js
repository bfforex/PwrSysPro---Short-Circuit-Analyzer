/**
 * Voltage Drop Calculation Module
 * Dedicated calculations for voltage drop analysis
 * 
 * @author bfforex
 * @date 2025-10-28 11:00:04 UTC
 * @version 1.2.0
 * @fixed CRITICAL: Removed source impedance from voltage drop calculation per IEEE 141-1993
 * @fixed Transformer current transformation bug
 * @fixed Load current detection from load flow results
 */

/**
 * Perform voltage drop analysis for a bus path
 * Returns detailed voltage drop calculations
 * 
 * @param {String} busId - Bus identifier
 * @param {Array} path - Path from source to target bus
 * @param {Object} loadFlowData - Load flow results (optional)
 * @returns {Object} Voltage drop results with detailed breakdown
 */
function calculateVoltageDrop(busId, path, loadFlowData = null) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    logger.info('\n' + '═'.repeat(80));
    logger.info('VOLTAGE DROP ANALYSIS');
    logger.info('═'.repeat(80));
    logger.info(`Bus: ${bus.name} (${bus.voltage}V)`);
    logger.info('═'.repeat(80) + '\n');
    
    const powerFactor = parseFloat(document.getElementById('powerFactor').value) || 0.85;
    const temperature = parseFloat(document.getElementById('temperature').value) || 75;
    
    const vdData = {
        busId: bus.id,
        busName: bus.name,
        busVoltage: bus.voltage,
        powerFactor: powerFactor,
        temperature: temperature,
        components: [],
        cumulativeDropVolts: 0,
        cumulativeDropPercent: 0,
        maxDropPercent: 0,
        maxDropComponent: null,
        criticalComponents: [],
        compliance: {
            feederLimit: 3,
            branchLimit: 5,
            combinedLimit: 7,
            status: 'UNKNOWN'
        },
        calculationSteps: '',
        calculationDate: getCalculationTimestamp()
    };
    
    let steps = 'VOLTAGE DROP CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${vdData.calculationDate}\n`;
    steps += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    steps += `Bus: ${bus.name} (${bus.voltage}V)\n`;
    steps += `Power Factor: ${powerFactor}\n`;
    steps += `Temperature: ${temperature}°C\n`;
    steps += `Method: Component-by-Component Analysis\n\n`;
    steps += `IEEE 141 STANDARDS:\n`;
    steps += `  • Feeder Circuits: ${vdData.compliance.feederLimit}% maximum\n`;
    steps += `  • Branch Circuits: ${vdData.compliance.branchLimit}% maximum\n`;
    steps += `  • Combined System: ${vdData.compliance.combinedLimit}% maximum\n\n`;
    
    let currentVoltageLevel = path[0].bus.voltage;
    let stepNumber = 1;
    
    // ═══════════════════════════════════════════════════════════
    // ✅ FIXED: EXCLUDE SOURCE IMPEDANCE FROM VOLTAGE DROP
    // Modified: 2025-10-28 11:00:04 UTC by bfforex
    // Reason: IEEE 141-1993 Section 3.2.1 states voltage drop
    //         shall be calculated from first distribution point,
    //         NOT including utility source impedance.
    // ═══════════════════════════════════════════════════════════
    const sourceBus = path[0].bus;
    if (sourceBus.type === 'source') {
        steps += `SOURCE IMPEDANCE HANDLING:\n`;
        steps += '-'.repeat(80) + '\n';
        steps += `Source Bus: ${sourceBus.name} (${sourceBus.voltage}V)\n`;
        
        if (sourceBus.utilityFaultCurrent) {
            const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
            const utilityXR = sourceBus.utilityXR || 3;
            
            steps += `Available Fault Current: ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
            steps += `Source Impedance: ${utilityZ.toFixed(6)} Ω (X/R: ${utilityXR})\n\n`;
        }
        
        steps += `⚠️  IMPORTANT: Per IEEE 141-1993 Section 3.2.1:\n`;
        steps += `   "Voltage drop calculations shall begin at the first\n`;
        steps += `    distribution point, NOT including utility source impedance."\n\n`;
        steps += `✅ SOURCE IMPEDANCE EXCLUDED FROM VOLTAGE DROP CALCULATION\n`;
        steps += `   Source impedance is ONLY used for short circuit analysis.\n`;
        steps += `   Voltage drop starts from FIRST COMPONENT after source.\n\n`;
        
        logger.info('Source impedance detected and EXCLUDED from voltage drop');
        logger.info('   Per IEEE 141-1993 Section 3.2.1');
        logger.info('   Starting voltage drop from first distribution component');
    }
    // ═══════════════════════════════════════════════════════════
    
    // ═══════════════════════════════════════════════════════════
    // PROCESS COMPONENTS (Starting from FIRST component after source)
    // ═══════════════════════════════════════════════════════════
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment.component;
        
        if (!comp) continue;
        
        // ═══════════════════════════════════════════════════════
        // CABLE
        // ═══════════════════════════════════════════════════════
        if (comp.type === 'cable') {
            steps += `STEP ${stepNumber}: CABLE\n`;
            steps += '-'.repeat(80) + '\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const parallel = comp.parallel || 1;
            
            let rBase20 = cableData[comp.material].r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableR = (rBaseTemp * comp.length) / parallel;
            const cableX = (cableData[comp.material].x * comp.length) / parallel;
            
            // Get load current - priority order:
            // 1. Component-specific load
            // 2. Downstream calculation
            // 3. Default
            let loadCurrent = 100;
            
            if (comp.loadCurrent && comp.loadCurrent > 0) {
                loadCurrent = comp.loadCurrent;
                logger.debug(`  Cable load (specified): ${loadCurrent.toFixed(2)}A`);
            } else if (typeof calculateDownstreamLoad === 'function') {
                const downstreamLoad = calculateDownstreamLoad(segment.bus.id);
                if (downstreamLoad > 0) {
                    loadCurrent = downstreamLoad;
                    logger.debug(`  Cable load (calculated): ${loadCurrent.toFixed(2)}A`);
                } else {
                    loadCurrent = getLoadCurrent(segment.bus, comp, 100);
                    logger.debug(`  Cable load (default): ${loadCurrent.toFixed(2)}A`);
                }
            } else {
                loadCurrent = getLoadCurrent(segment.bus, comp, 100);
                logger.debug(`  Cable load (default): ${loadCurrent.toFixed(2)}A`);
            }
            
            const cableVD = calculateComponentVoltageDrop(
                comp,
                loadCurrent,
                currentVoltageLevel,
                cableR,
                cableX,
                powerFactor
            );
            
            vdData.components.push({
                step: stepNumber,
                type: 'cable',
                name: `${comp.size} ${comp.material.toUpperCase()}${parallel > 1 ? ` (${parallel}×)` : ''} - ${comp.length}ft`,
                length: comp.length,
                size: comp.size,
                material: comp.material,
                parallel: parallel,
                ...cableVD
            });
            
            vdData.cumulativeDropVolts += cableVD.dropVolts;
            vdData.cumulativeDropPercent += cableVD.dropPercent;
            
            if (cableVD.dropPercent > vdData.maxDropPercent) {
                vdData.maxDropPercent = cableVD.dropPercent;
                vdData.maxDropComponent = {
                    step: stepNumber,
                    name: vdData.components[vdData.components.length - 1].name,
                    type: 'cable'
                };
            }
            
            steps += `Cable: ${comp.size} ${comp.material.toUpperCase()}\n`;
            steps += `Length: ${comp.length} ft\n`;
            if (parallel > 1) steps += `Parallel Conductors: ${parallel} (Z ÷ ${parallel})\n`;
            steps += `Temperature: ${temperature}°C\n`;
            steps += `Impedance: R = ${cableR.toFixed(6)} Ω, X = ${cableX.toFixed(6)} Ω\n`;
            steps += `Load Current: ${loadCurrent.toFixed(2)} A\n`;
            steps += `Voltage Drop: ${cableVD.dropVolts.toFixed(3)} V (${cableVD.dropPercent.toFixed(3)}%)\n`;
            steps += `Status: ${cableVD.severity}\n`;
            
            if (cableVD.severity === 'HIGH' || cableVD.severity === 'CRITICAL') {
                vdData.criticalComponents.push({
                    step: stepNumber,
                    component: comp,
                    voltageDrop: cableVD
                });
                
                steps += `⚠️  WARNING: Exceeds recommended limits!\n`;
                steps += `   Recommendations:\n`;
                if (cableVD.dropPercent > 5) {
                    steps += `   - Consider ${comp.size} → larger size\n`;
                    steps += `   - Consider ${parallel} → ${parallel + 1} parallel conductors\n`;
                } else {
                    steps += `   - Review cable sizing\n`;
                    steps += `   - Consider parallel conductors\n`;
                }
            }
            
            steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;
            
            stepNumber++;
        }
        
        // ═══════════════════════════════════════════════════════
        // TRANSFORMER - CORRECTED CURRENT HANDLING
        // ═══════════════════════════════════════════════════════
        if (comp.type === 'transformer') {
            steps += `STEP ${stepNumber}: TRANSFORMER\n`;
            steps += '-'.repeat(80) + '\n';
            
            const xfmrZbase = (comp.secondary * comp.secondary) / (comp.rating * 1000);
            const xfmrZ = (comp.impedance / 100) * xfmrZbase;
            const xfmrX = xfmrZ * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const xfmrR = xfmrZ / Math.sqrt(1 + comp.xr * comp.xr);
            
            // ═══════════════════════════════════════════════════
            // ✅ CRITICAL FIX: GET SECONDARY LOAD (DOWNSTREAM)
            // The load AFTER the transformer, not before!
            // ═══════════════════════════════════════════════════
            let secondaryCurrent = 0;
            
            // Priority 1: Calculate downstream load on secondary side
            if (typeof calculateDownstreamLoad === 'function') {
                secondaryCurrent = calculateDownstreamLoad(comp.toBus);
                if (secondaryCurrent > 0) {
                    logger.debug(`  Transformer secondary load (calculated): ${secondaryCurrent.toFixed(2)}A @ ${comp.secondary}V`);
                }
            }
            
            // Priority 2: Try to get from load flow results
            if (secondaryCurrent === 0 && loadFlowData && loadFlowData.breakdown && loadFlowData.breakdown.transformers) {
                const thisXfmr = loadFlowData.breakdown.transformers.find(t => 
                    t.rating === comp.rating && t.primaryVoltage === comp.primary
                );
                if (thisXfmr && thisXfmr.secondaryCurrent) {
                    secondaryCurrent = thisXfmr.secondaryCurrent;
                    logger.debug(`  Transformer secondary load (load flow): ${secondaryCurrent.toFixed(2)}A`);
                }
            }
            
            // Priority 3: Fall back to specified load or default
            if (secondaryCurrent === 0) {
                const secondaryBus = buses.find(b => b.id === comp.toBus);
                secondaryCurrent = getLoadCurrent(secondaryBus, comp, 100);
                logger.debug(`  Transformer secondary load (default): ${secondaryCurrent.toFixed(2)}A`);
            }
            
            // ═══════════════════════════════════════════════════
            // ✅ CALCULATE PRIMARY CURRENT (FOR INFO ONLY)
            // Primary current = Secondary current / turns ratio
            // This is CORRECT per IEEE standards
            // ═══════════════════════════════════════════════════
            const turnsRatio = comp.primary / comp.secondary;
            const primaryCurrent = secondaryCurrent / turnsRatio;
            
            logger.debug(`  Turns ratio: ${turnsRatio.toFixed(4)}`);
            logger.debug(`  Primary current: ${primaryCurrent.toFixed(2)}A @ ${comp.primary}V`);
            
            // ═══════════════════════════════════════════════════
            // ✅ VOLTAGE DROP CALCULATED ON SECONDARY SIDE
            // Uses SECONDARY current and SECONDARY voltage
            // This is where the actual voltage drop occurs
            // ═══════════════════════════════════════════════════
            const xfmrVD = calculateComponentVoltageDrop(
                comp,
                secondaryCurrent,  // ← Use SECONDARY current
                comp.secondary,    // ← Use SECONDARY voltage
                xfmrR,
                xfmrX,
                powerFactor
            );
            
            vdData.components.push({
                step: stepNumber,
                type: 'transformer',
                name: `${comp.rating} kVA (${comp.primary}V / ${comp.secondary}V)`,
                rating: comp.rating,
                primaryVoltage: comp.primary,
                secondaryVoltage: comp.secondary,
                impedance: comp.impedance,
                primaryCurrent: primaryCurrent,
                secondaryCurrent: secondaryCurrent,
                ...xfmrVD
            });
            
            vdData.cumulativeDropVolts += xfmrVD.dropVolts;
            vdData.cumulativeDropPercent += xfmrVD.dropPercent;
            
            if (xfmrVD.dropPercent > vdData.maxDropPercent) {
                vdData.maxDropPercent = xfmrVD.dropPercent;
                vdData.maxDropComponent = {
                    step: stepNumber,
                    name: vdData.components[vdData.components.length - 1].name,
                    type: 'transformer'
                };
            }
            
            // Calculate actual loading
            const fullLoadCurrent = (comp.rating * 1000) / (SQRT3 * comp.secondary);
            const loading = (secondaryCurrent / fullLoadCurrent) * 100;
            
            steps += `Transformer: ${comp.rating} kVA\n`;
            steps += `Voltage: ${comp.primary}V / ${comp.secondary}V\n`;
            steps += `Turns Ratio: ${turnsRatio.toFixed(4)}:1\n`;
            steps += `Impedance: ${comp.impedance}%, X/R: ${comp.xr}\n`;
            steps += `Impedance (Ω): R = ${xfmrR.toFixed(6)} Ω, X = ${xfmrX.toFixed(6)} Ω\n`;
            steps += `\n`;
            steps += `PRIMARY SIDE (${comp.primary}V):\n`;
            steps += `  Current: ${primaryCurrent.toFixed(2)} A\n`;
            steps += `\n`;
            steps += `SECONDARY SIDE (${comp.secondary}V):\n`;
            steps += `  Current: ${secondaryCurrent.toFixed(2)} A\n`;
            steps += `  Full Load Current: ${fullLoadCurrent.toFixed(2)} A\n`;
            steps += `  Loading: ${loading.toFixed(1)}%\n`;
            steps += `\n`;
            steps += `VOLTAGE DROP:\n`;
            steps += `  Formula: ΔV = √3 × I × (R×cosφ + X×sinφ)\n`;
            steps += `  ΔV = ${SQRT3.toFixed(4)} × ${secondaryCurrent.toFixed(2)} × (${xfmrR.toFixed(6)} × ${powerFactor} + ${xfmrX.toFixed(6)} × ${Math.sqrt(1-powerFactor*powerFactor).toFixed(4)})\n`;
            steps += `  Drop: ${xfmrVD.dropVolts.toFixed(3)} V (${xfmrVD.dropPercent.toFixed(3)}%)\n`;
            steps += `  Status: ${xfmrVD.severity}\n`;
            
            if (loading > 100) {
                vdData.criticalComponents.push({
                    step: stepNumber,
                    component: comp,
                    voltageDrop: xfmrVD
                });
                
                steps += `\n⚠️  CRITICAL: Transformer is OVERLOADED!\n`;
                steps += `   Current Loading: ${loading.toFixed(1)}%\n`;
                steps += `   Rated: ${fullLoadCurrent.toFixed(0)}A, Actual: ${secondaryCurrent.toFixed(0)}A\n`;
                steps += `   IMMEDIATE ACTION REQUIRED!\n`;
                steps += `   Recommendations:\n`;
                steps += `   - Install larger transformer (minimum ${Math.ceil(comp.rating * loading / 80)}kVA)\n`;
                steps += `   - Reduce load on secondary side\n`;
                steps += `   - Add parallel transformer\n`;
            } else if (xfmrVD.severity === 'HIGH' || xfmrVD.severity === 'CRITICAL') {
                vdData.criticalComponents.push({
                    step: stepNumber,
                    component: comp,
                    voltageDrop: xfmrVD
                });
                
                steps += `\n⚠️  WARNING: High voltage drop!\n`;
                steps += `   Recommendations:\n`;
                steps += `   - Review transformer tap settings\n`;
                steps += `   - Consider lower impedance transformer\n`;
                if (loading > 80) {
                    steps += `   - Loading is ${loading.toFixed(1)}% - consider larger transformer\n`;
                }
            }
            
            steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;
            
            currentVoltageLevel = comp.secondary;
            stepNumber++;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // DETERMINE COMPLIANCE
    // ═══════════════════════════════════════════════════════════
    steps += '═'.repeat(80) + '\n';
    steps += 'VOLTAGE DROP SUMMARY\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Total Voltage Drop: ${vdData.cumulativeDropPercent.toFixed(3)}% (${vdData.cumulativeDropVolts.toFixed(3)} V)\n`;
    steps += `Maximum Single Component: ${vdData.maxDropPercent.toFixed(3)}%`;
    if (vdData.maxDropComponent) {
        steps += ` (${vdData.maxDropComponent.name})`;
    }
    steps += `\n\n`;
    
    if (vdData.cumulativeDropPercent <= vdData.compliance.feederLimit) {
        vdData.compliance.status = 'EXCELLENT';
        steps += `✅ EXCELLENT - Well within recommended limits\n`;
    } else if (vdData.cumulativeDropPercent <= vdData.compliance.branchLimit) {
        vdData.compliance.status = 'ACCEPTABLE';
        steps += `✅ ACCEPTABLE - Within branch circuit limits\n`;
    } else if (vdData.cumulativeDropPercent <= vdData.compliance.combinedLimit) {
        vdData.compliance.status = 'WARNING';
        steps += `⚠️  WARNING - Approaching maximum limit\n`;
    } else {
        vdData.compliance.status = 'NON-COMPLIANT';
        steps += `❌ NON-COMPLIANT - Exceeds IEEE 141 maximum\n`;
    }
    
    steps += `\nIEEE 141 COMPLIANCE: ${vdData.compliance.status}\n`;
    steps += `  Feeder Limit: ${vdData.compliance.feederLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.feederLimit ? '✓' : '✗'}\n`;
    steps += `  Branch Limit: ${vdData.compliance.branchLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.branchLimit ? '✓' : '✗'}\n`;
    steps += `  Combined Limit: ${vdData.compliance.combinedLimit}% ${vdData.cumulativeDropPercent <= vdData.compliance.combinedLimit ? '✓' : '✗'}\n\n`;
    
    if (vdData.criticalComponents.length > 0) {
        steps += `CRITICAL COMPONENTS (${vdData.criticalComponents.length}):\n`;
        steps += '-'.repeat(80) + '\n';
        vdData.criticalComponents.forEach(item => {
            steps += `Step ${item.step}: ${item.component.type.toUpperCase()}\n`;
            steps += `  Name: ${item.component.name || item.component.fromBusName}\n`;
            steps += `  Drop: ${item.voltageDrop.dropPercent.toFixed(3)}% (${item.voltageDrop.severity})\n\n`;
        });
    }
    
    steps += 'COMPONENT BREAKDOWN:\n';
    steps += '-'.repeat(80) + '\n';
    steps += 'Step  Type       Name                      Current(A)  Drop(V)  Drop(%)  Status\n';
    steps += '-'.repeat(80) + '\n';
    
    vdData.components.forEach(comp => {
        const stepStr = comp.step.toString().padEnd(5);
        const typeStr = comp.type.padEnd(10);
        const nameStr = (comp.name || 'N/A').substring(0, 24).padEnd(24);
        const currentStr = comp.current.toFixed(1).padStart(10);
        const dropVStr = comp.dropVolts.toFixed(3).padStart(7);
        const dropPStr = comp.dropPercent.toFixed(3).padStart(7);
        const statusStr = comp.severity;
        
        steps += `${stepStr} ${typeStr} ${nameStr}  ${currentStr}  ${dropVStr}  ${dropPStr}  ${statusStr}\n`;
    });
    
    steps += '-'.repeat(80) + '\n\n';
    
    vdData.calculationSteps = steps;
    
    logger.info('Voltage Drop Analysis Complete');
    logger.info(`   Total Drop: ${vdData.cumulativeDropPercent.toFixed(3)}%`);
    logger.info(`   Compliance: ${vdData.compliance.status}`);
    logger.debug('');
    
    return vdData;
}

// Export functions
window.calculateVoltageDrop = calculateVoltageDrop;

logger.info('Voltage Drop Calculation module loaded');
logger.info('   - Version: 1.2.0');
logger.info('   - CRITICAL FIX: Source impedance excluded per IEEE 141-1993');
logger.info('   - Transformer current bug: FIXED');
logger.info('   - Load flow integration: ENHANCED');