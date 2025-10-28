/**
 * Voltage Drop Calculation Module
 * Dedicated calculations for voltage drop analysis
 * 
 * @author bfforex
 * @date 2025-10-28 00:49:48 UTC
 * @version 1.0.0
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
    
    console.log('\n' + '═'.repeat(80));
    console.log('VOLTAGE DROP ANALYSIS');
    console.log('═'.repeat(80));
    console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
    console.log('═'.repeat(80) + '\n');
    
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
    
    // Source impedance voltage drop
    const sourceBus = path[0].bus;
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityXR = sourceBus.utilityXR || 3;
        const utilityX = utilityZ * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const utilityR = utilityZ / Math.sqrt(1 + utilityXR * utilityXR);
        
        // Get load current for source
        const loadCurrent = getLoadCurrent(sourceBus, null, 100);
        
        const sourceVD = calculateComponentVoltageDrop(
            {type: 'source', name: sourceBus.name},
            loadCurrent,
            sourceBus.voltage,
            utilityR,
            utilityX,
            powerFactor
        );
        
        vdData.components.push({
            step: stepNumber,
            type: 'source',
            name: sourceBus.name,
            ...sourceVD
        });
        
        vdData.cumulativeDropVolts += sourceVD.dropVolts;
        vdData.cumulativeDropPercent += sourceVD.dropPercent;
        
        steps += `STEP ${stepNumber}: SOURCE - ${sourceBus.name}\n`;
        steps += '-'.repeat(80) + '\n';
        steps += `Voltage: ${sourceBus.voltage} V\n`;
        steps += `Source Impedance: R = ${utilityR.toFixed(6)} Ω, X = ${utilityX.toFixed(6)} Ω\n`;
        steps += `Load Current: ${loadCurrent.toFixed(2)} A\n`;
        steps += `Formula: ΔV = √3 × I × (R×cosφ + X×sinφ)\n`;
        steps += `Calculation: ΔV = ${SQRT3.toFixed(4)} × ${loadCurrent.toFixed(2)} × (${utilityR.toFixed(6)} × ${powerFactor} + ${utilityX.toFixed(6)} × ${Math.sqrt(1-powerFactor*powerFactor).toFixed(4)})\n`;
        steps += `Voltage Drop: ${sourceVD.dropVolts.toFixed(3)} V (${sourceVD.dropPercent.toFixed(3)}%)\n`;
        steps += `Status: ${sourceVD.severity}\n`;
        steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;
        
        stepNumber++;
    }
    
    // Process components
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment.component;
        
        if (!comp) continue;
        
        if (comp.type === 'cable') {
            steps += `STEP ${stepNumber}: CABLE\n`;
            steps += '-'.repeat(80) + '\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const parallel = comp.parallel || 1;
            
            let rBase20 = cableData[comp.material].r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableR = (rBaseTemp * comp.length) / parallel;
            const cableX = (cableData[comp.material].x * comp.length) / parallel;
            
            // Get load current from load flow or component
            const loadCurrent = getLoadCurrent(segment.bus, comp, 100);
            
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
        
        if (comp.type === 'transformer') {
            steps += `STEP ${stepNumber}: TRANSFORMER\n`;
            steps += '-'.repeat(80) + '\n';
            
            const xfmrZbase = (comp.secondary * comp.secondary) / (comp.rating * 1000);
            const xfmrZ = (comp.impedance / 100) * xfmrZbase;
            const xfmrX = xfmrZ * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const xfmrR = xfmrZ / Math.sqrt(1 + comp.xr * comp.xr);
            
            // Get load current
            const primaryCurrent = getLoadCurrent(segment.bus, comp, 100);
            const secondaryCurrent = primaryCurrent * (comp.primary / comp.secondary);
            
            const xfmrVD = calculateComponentVoltageDrop(
                comp,
                secondaryCurrent,
                comp.secondary,
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
            
            steps += `Transformer: ${comp.rating} kVA\n`;
            steps += `Voltage: ${comp.primary}V / ${comp.secondary}V\n`;
            steps += `Impedance: ${comp.impedance}%, X/R: ${comp.xr}\n`;
            steps += `Impedance (Ω): R = ${xfmrR.toFixed(6)} Ω, X = ${xfmrX.toFixed(6)} Ω\n`;
            steps += `Primary Current: ${primaryCurrent.toFixed(2)} A\n`;
            steps += `Secondary Current: ${secondaryCurrent.toFixed(2)} A\n`;
            steps += `Voltage Drop: ${xfmrVD.dropVolts.toFixed(3)} V (${xfmrVD.dropPercent.toFixed(3)}%)\n`;
            steps += `Status: ${xfmrVD.severity}\n`;
            
            if (xfmrVD.severity === 'HIGH' || xfmrVD.severity === 'CRITICAL') {
                vdData.criticalComponents.push({
                    step: stepNumber,
                    component: comp,
                    voltageDrop: xfmrVD
                });
                
                steps += `⚠️  WARNING: High voltage drop!\n`;
                steps += `   Recommendations:\n`;
                steps += `   - Review transformer tap settings\n`;
                steps += `   - Consider lower impedance transformer\n`;
                steps += `   - Check loading (${(secondaryCurrent * comp.secondary * Math.sqrt(3) / (comp.rating * 1000) * 100).toFixed(1)}%)\n`;
            }
            
            steps += `Cumulative: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;
            
            currentVoltageLevel = comp.secondary;
            stepNumber++;
        }
    }
    
    // Determine compliance
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
    
    console.log('✅ Voltage Drop Analysis Complete');
    console.log(`   Total Drop: ${vdData.cumulativeDropPercent.toFixed(3)}%`);
    console.log(`   Compliance: ${vdData.compliance.status}`);
    console.log('');
    
    return vdData;
}

// Export functions
window.calculateVoltageDrop = calculateVoltageDrop;

console.log('✅ Voltage Drop Calculation module loaded');