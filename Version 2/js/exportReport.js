/**
 * Export Report Module - Enhanced with Recommendations & Demand Factors
 * Modified: 2025-10-29 13:10:12 UTC by bfforex
 * COMPLETE VERSION - Includes all original enhancements + Feature #5
 * 
 * @author bfforex
 * @date 2025-10-29 13:10:12 UTC
 */

/**
 * Export detailed bus report with recommendations and demand factors
 * Enhanced: Feature #5 - Shows connected, demand, and diversity loads
 */
function exportBusReport(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus || !bus.results) {
        alert('No calculation results available for this bus.');
        return;
    }

    const projectName = document.getElementById('projectName').value || 'Untitled';
    const calculationTimestamp = bus.results.calculationDate || getCalculationTimestamp();
    
    // Get recommendations for this bus
    const recommendations = recommendationEngine?.filterByBus(busId) || [];
    
    let report = `${'='.repeat(100)}\n`;
    report += `SHORT CIRCUIT ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n`;
    report += `Calculation Method: ${bus.results.method}\n\n`;
    
    // Bus Information
    report += `BUS INFORMATION:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `Type: ${bus.type}\n`;
    if (bus.demandFactor !== undefined) {
        report += `Demand Factor: ${(bus.demandFactor * 100).toFixed(1)}% (NEC Article 220)\n`;
    }
    if (bus.diversityFactor !== undefined) {
        report += `Diversity Factor: ${(bus.diversityFactor * 100).toFixed(1)}% (IEEE 141)\n`;
    } else {
        const autoDiversity = getDiversityFactorForBus(busId);
        if (autoDiversity) {
            report += `Diversity Factor: ${(autoDiversity * 100).toFixed(1)}% (Auto - based on bus type)\n`;
        }
    }
    report += `\n`;
    
    // Fault Current Results
    report += `FAULT CURRENT RESULTS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Symmetrical Fault Current: ${bus.results.faultCurrents.threePhaseSym.toFixed(3)} kA (${(bus.results.faultCurrents.threePhaseSym * 1000).toFixed(2)} A)\n`;
    report += `Asymmetrical (Peak) Current: ${bus.results.faultCurrents.threePhaseAsym.toFixed(3)} kA (${(bus.results.faultCurrents.threePhaseAsym * 1000).toFixed(2)} A)\n`;
    report += `Line-to-Ground Fault: ${bus.results.faultCurrents.lineToGround.toFixed(3)} kA\n`;
    report += `Line-to-Line Fault: ${bus.results.faultCurrents.lineToLine.toFixed(3)} kA\n`;
    report += `X/R Ratio: ${bus.results.xrRatio.toFixed(3)}\n`;
    report += `Total Impedance: ${bus.results.totalImpedance.magnitude.toFixed(6)} Ω\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTOR ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    
    if (bus.results.loadFlow && bus.results.loadFlow.demandFactorsApplied) {
        const lf = bus.results.loadFlow;
        
        report += `\n${'='.repeat(100)}\n`;
        report += `LOAD ANALYSIS WITH DEMAND & DIVERSITY FACTORS (Feature #5)\n`;
        report += `${'='.repeat(100)}\n\n`;
        
        report += `LOAD SUMMARY:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Connected Load:     ${lf.summary.connectedCurrent.toFixed(2)} A  |  ${lf.summary.connectedPowerKVA.toFixed(2)} kVA  (100.0%)\n`;
        report += `Demand Load:        ${lf.demandSummary.demandCurrent.toFixed(2)} A  |  ${lf.demandSummary.demandPowerKVA.toFixed(2)} kVA  (${(lf.demandSummary.demandFactor * 100).toFixed(1)}%)\n`;
        report += `Diversity Load:     ${lf.demandSummary.diversityCurrent.toFixed(2)} A  |  ${lf.demandSummary.diversityPowerKVA.toFixed(2)} kVA  (${(lf.demandSummary.diversityFactor * lf.demandSummary.demandFactor * 100).toFixed(1)}%)\n`;
        report += `\n`;
        report += `Power Savings:      ${(lf.summary.connectedPowerKVA - lf.demandSummary.diversityPowerKVA).toFixed(2)} kVA\n`;
        report += `Load Reduction:     ${((1 - lf.demandSummary.diversityCurrent / lf.summary.connectedCurrent) * 100).toFixed(1)}%\n`;
        report += `\n`;
        
        report += `FACTORS APPLIED:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Overall Demand Factor:      ${lf.demandSummary.demandFactor.toFixed(3)} (${(lf.demandSummary.demandFactor * 100).toFixed(1)}%)\n`;
        report += `Overall Diversity Factor:   ${lf.demandSummary.diversityFactor.toFixed(3)} (${(lf.demandSummary.diversityFactor * 100).toFixed(1)}%)\n`;
        report += `Combined Factor:            ${(lf.demandSummary.diversityCurrent / lf.summary.connectedCurrent).toFixed(3)} (${((lf.demandSummary.diversityCurrent / lf.summary.connectedCurrent) * 100).toFixed(1)}%)\n`;
        report += `\n`;
        
        report += `BREAKDOWN BY COMPONENT TYPE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Type              Connected(A)    Demand(A)    Factor    Power(kVA)\n`;
        report += `${'-'.repeat(100)}\n`;
        
        // Motors
        if (lf.demandBreakdown.motors.length > 0) {
            const totalConnected = lf.demandBreakdown.motors.reduce((sum, m) => sum + m.connectedCurrent, 0);
            const totalDemand = lf.demandBreakdown.motors.reduce((sum, m) => sum + m.demandCurrent, 0);
            const avgFactor = totalDemand / totalConnected;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Motors            ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Transformers
        if (lf.demandBreakdown.transformers.length > 0) {
            const totalConnected = lf.demandBreakdown.transformers.reduce((sum, t) => sum + t.connectedCurrent, 0);
            const totalDemand = lf.demandBreakdown.transformers.reduce((sum, t) => sum + t.demandCurrent, 0);
            const avgFactor = totalDemand / totalConnected;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Transformers      ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Cables
        if (lf.demandBreakdown.cables.length > 0) {
            const totalConnected = lf.demandBreakdown.cables.reduce((sum, c) => sum + c.connectedCurrent, 0);
            const totalDemand = lf.demandBreakdown.cables.reduce((sum, c) => sum + c.demandCurrent, 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Cables            ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Direct Loads
        if (lf.demandBreakdown.directLoads.length > 0) {
            const totalConnected = lf.demandBreakdown.directLoads.reduce((sum, d) => sum + d.connectedCurrent, 0);
            const totalDemand = lf.demandBreakdown.directLoads.reduce((sum, d) => sum + d.demandCurrent, 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Direct Loads      ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        report += `${'-'.repeat(100)}\n`;
        report += `TOTAL             ${lf.summary.connectedCurrent.toFixed(2).padStart(12)}    ${lf.demandSummary.demandCurrent.toFixed(2).padStart(10)}    ${(lf.demandSummary.demandFactor * 100).toFixed(1).padStart(6)}%    ${lf.demandSummary.demandPowerKVA.toFixed(2).padStart(10)}\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        report += `NEC/IEEE COMPLIANCE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `✓ NEC Article 220 - Demand factors applied per load type\n`;
        report += `✓ NEC Article 430.24 - Motor demand factors (${lf.demandBreakdown.motors.length} motors)\n`;
        report += `✓ IEEE 141-1993 Red Book - Diversity factors for system design\n`;
        report += `✓ Design Load = Connected Load × Demand Factor × Diversity Factor\n`;
        report += `\n`;
        
        // Detailed demand calculation steps if available
        if (lf.demandCalculationSteps) {
            report += `\n${'='.repeat(100)}\n`;
            report += `DETAILED DEMAND & DIVERSITY CALCULATIONS\n`;
            report += `${'='.repeat(100)}\n`;
            report += lf.demandCalculationSteps;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    
    // Per-Unit Base Values
    report += `PER-UNIT BASE VALUES AT TARGET BUS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Base kVA: ${bus.results.baseKVA || 10000} kVA (CONSTANT for entire system)\n`;
    report += `Base Voltage: ${bus.voltage} V\n`;
    report += `Base Impedance: ${bus.results.baseZ?.toFixed(6) || 'N/A'} Ω\n`;
    report += `Base Current: ${bus.results.baseCurrent?.toFixed(2) || 'N/A'} A\n\n`;
    
    // Per-Unit Impedances
    if (bus.results.totalRpu !== undefined) {
        report += `PER-UNIT IMPEDANCES:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `R(pu): ${bus.results.totalRpu.toFixed(6)} pu\n`;
        report += `X(pu): ${bus.results.totalXpu.toFixed(6)} pu\n`;
        report += `Z(pu): ${bus.results.totalZpu.toFixed(6)} pu\n\n`;
    }
    
    // Path from Source with cable tags
    report += `PATH FROM SOURCE (WITH CABLE TAGS):\n`;
    report += `${'-'.repeat(100)}\n`;
    if (bus.pathComponents && bus.pathComponents.length > 0) {
        bus.pathComponents.forEach((segment, index) => {
            const busInfo = segment.bus;
            
            if (index === 0) {
                report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - SOURCE\n`;
            } else {
                const comp = segment.component;
                if (comp) {
                    if (comp.type === 'cable') {
                        const tag = comp.tag || 'N/A';
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - CABLE [Tag: ${tag}, ${comp.size} ${comp.material}, ${comp.length}ft${comp.parallel > 1 ? `, ${comp.parallel}× parallel` : ''}]\n`;
                    } else if (comp.type === 'transformer') {
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - TRANSFORMER [${comp.rating} kVA, ${comp.impedance}%]\n`;
                    } else {
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - ${comp.type.toUpperCase()}\n`;
                    }
                } else {
                    report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V)\n`;
                }
            }
        });
    }
    report += `\n`;
    
    // Voltage Drop Analysis
    if (bus.results.voltageDrop) {
        report += `VOLTAGE DROP ANALYSIS (WITH CABLE TAGS):\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Voltage Drop: ${bus.results.voltageDrop.cumulativeDropPercent.toFixed(3)}% (${bus.results.voltageDrop.cumulativeDropVolts.toFixed(3)} V)\n`;
        report += `Maximum Single Component Drop: ${bus.results.voltageDrop.maxDropPercent.toFixed(3)}%\n`;
        report += `IEEE 141 Compliance: ${bus.results.voltageDrop.cumulativeDropPercent <= 7 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}\n`;
        report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n\n`;
        
        if (bus.results.voltageDrop.components && bus.results.voltageDrop.components.length > 0) {
            report += `COMPONENT BREAKDOWN (WITH FROM/TO AND TAGS):\n`;
            report += `${'-'.repeat(100)}\n`;
            report += `Step  Type          Tag/Name                From                    To                      Current(A)  Drop(V)   Drop(%)   Status\n`;
            report += `${'-'.repeat(100)}\n`;
            
            bus.results.voltageDrop.components.forEach((comp, index) => {
                const step = (index + 1).toString().padStart(3);
                const type = comp.type.padEnd(13);
                
                let tagName = comp.name.substring(0, 20).padEnd(20);
                let fromBus = 'N/A'.padEnd(24);
                let toBus = 'N/A'.padEnd(24);
                
                if (comp.type === 'cable') {
                    const pathComp = bus.pathComponents?.find(pc => 
                        pc.component?.type === 'cable' &&
                        (pc.component.name === comp.name || pc.component.tag === comp.name)
                    );
                    
                    if (pathComp && pathComp.component) {
                        tagName = (pathComp.component.tag || comp.name).substring(0, 20).padEnd(20);
                        fromBus = (pathComp.component.fromBusName || 'Unknown').substring(0, 24).padEnd(24);
                        toBus = (pathComp.component.toBusName || 'Unknown').substring(0, 24).padEnd(24);
                    }
                } else if (comp.type === 'transformer') {
                    tagName = comp.name.substring(0, 20).padEnd(20);
                    if (comp.location) {
                        const parts = comp.location.split(' → ');
                        fromBus = (parts[0] || 'Unknown').substring(0, 24).padEnd(24);
                        toBus = (parts[1] || 'Unknown').substring(0, 24).padEnd(24);
                    }
                }
                
                const current = (comp.current || 0).toFixed(1).padStart(10);
                const dropV = comp.dropVolts.toFixed(3).padStart(9);
                const dropP = comp.dropPercent.toFixed(3).padStart(9);
                const status = comp.severity || 'OK';
                
                report += `${step}  ${type} ${tagName} ${fromBus} ${toBus} ${current} ${dropV} ${dropP}  ${status}\n`;
            });
            
            report += `${'-'.repeat(100)}\n`;
        }
    }
    
    // Load flow with enhanced breakdown
    if (bus.results.loadFlow) {
        report += `\nLOAD FLOW ANALYSIS (WITH CABLE TAGS AND FROM/TO):\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Load Current: ${bus.results.loadFlow.summary.totalCurrent.toFixed(2)} A\n`;
        report += `Total Apparent Power: ${bus.results.loadFlow.summary.totalPowerKVA.toFixed(2)} kVA\n`;
        report += `Total Active Power: ${bus.results.loadFlow.summary.totalPowerKW.toFixed(2)} kW\n`;
        report += `Power Factor: ${bus.results.loadFlow.summary.powerFactor || 0.9}\n\n`;
        
        if (typeof generateLoadFlowBreakdownEnhanced === 'function') {
            report += generateLoadFlowBreakdownEnhanced(bus.results.loadFlow);
        }
    }
    
    // Recommendations
    if (recommendations.length > 0) {
        report += `\n${'='.repeat(100)}\n`;
        report += `ENGINEERING RECOMMENDATIONS\n`;
        report += `${'='.repeat(100)}\n\n`;
        
        const criticalCount = recommendations.filter(r => r.severity === 'CRITICAL').length;
        const highCount = recommendations.filter(r => r.severity === 'HIGH').length;
        const mediumCount = recommendations.filter(r => r.severity === 'MEDIUM').length;
        
        report += `SUMMARY:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Recommendations: ${recommendations.length}\n`;
        report += `  - Critical Issues: ${criticalCount}\n`;
        report += `  - High Priority: ${highCount}\n`;
        report += `  - Medium Priority: ${mediumCount}\n\n`;
        
        if (criticalCount > 0) {
            report += `⚠️  WARNING: ${criticalCount} CRITICAL ISSUE${criticalCount > 1 ? 'S' : ''} REQUIRE${criticalCount === 1 ? 'S' : ''} IMMEDIATE ATTENTION!\n\n`;
        }
        
        report += `DETAILED RECOMMENDATIONS:\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        recommendations.forEach((rec, index) => {
            report += `${index + 1}. [${rec.severity}] ${rec.name}\n`;
            report += `   ID: ${rec.id}\n`;
            report += `   Category: ${rec.category}\n`;
            report += `   Priority: ${rec.priority}\n`;
            report += `   Standard Reference: ${rec.standard}\n`;
            report += `\n`;
            report += `   FINDING:\n`;
            report += `   ${rec.recommendation}\n`;
            report += `\n`;
            report += `   REQUIRED ACTION:\n`;
            report += `   ${rec.action}\n`;
            report += `\n`;
            report += `   IMPACT:\n`;
            report += `   ${rec.impact}\n`;
            report += `\n`;
            report += `   IMPLEMENTATION:\n`;
            report += `   Cost Impact: ${rec.cost}\n`;
            report += `   Effort Required: ${rec.effort}\n`;
            report += `\n`;
            
            if (rec.context) {
                report += `   CONTEXT:\n`;
                if (rec.context.faultCurrent) {
                    report += `   - Fault Current: ${rec.context.faultCurrent.toFixed(2)} kA\n`;
                }
                if (rec.context.xrRatio) {
                    report += `   - X/R Ratio: ${rec.context.xrRatio.toFixed(2)}\n`;
                }
                if (rec.context.voltageDrop !== undefined) {
                    report += `   - Voltage Drop: ${rec.context.voltageDrop.toFixed(3)}%\n`;
                }
                if (rec.context.hasTransformer) {
                    report += `   - Path contains transformer\n`;
                }
                if (rec.context.hasMotor) {
                    report += `   - Motor contribution present\n`;
                }
                if (rec.context.hasGenerator) {
                    report += `   - Generator contribution present\n`;
                }
                report += `\n`;
            }
            
            report += `${'-'.repeat(100)}\n\n`;
        });
    } else {
        report += `\n${'='.repeat(100)}\n`;
        report += `ENGINEERING RECOMMENDATIONS\n`;
        report += `${'='.repeat(100)}\n\n`;
        report += `✅ NO ISSUES DETECTED\n\n`;
        report += `This bus meets all IEEE standards and design criteria.\n`;
        report += `No corrective actions are required at this time.\n\n`;
    }
    
    // Detailed Calculations
    if (bus.results.steps) {
        report += `\n${'='.repeat(100)}\n`;
        report += `DETAILED CALCULATIONS\n`;
        report += `${'='.repeat(100)}\n\n`;
        report += bus.results.steps;
    }
    
    report += `\n${'='.repeat(100)}\n`;
    report += `END OF REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${bus.name.replace(/\s+/g, '_')}_Report_${timestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export all buses summary with system recommendations and demand analysis
 * Enhanced: Feature #5 - Shows demand/diversity for entire system
 */
function exportAllBusesSummary() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculation results available. Please run calculations first.');
        return;
    }

    const projectName = document.getElementById('projectName').value || 'Untitled';
    const calculationTimestamp = getCalculationTimestamp();
    
    const systemReport = recommendationEngine?.analyzeSystem(calculatedBuses) || {
        totalRecommendations: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        byCategory: {},
        priorityActions: [],
        byBus: {}
    };
    
    let report = `${'='.repeat(100)}\n`;
    report += `SHORT CIRCUIT ANALYSIS SUMMARY - ALL BUSES\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n\n`;
    
    // System Summary
    report += `SYSTEM SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Buses in System: ${buses.length}\n`;
    report += `Calculated Buses: ${calculatedBuses.length}\n`;
    report += `Analysis Method: ${document.querySelector('input[name="method"]:checked')?.value || 'per-unit'}\n`;
    report += `Temperature: ${document.getElementById('temperature').value || '75'}°C\n`;
    report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: SYSTEM-WIDE DEMAND & DIVERSITY ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    
    const busesWithDemand = calculatedBuses.filter(b => 
        b.results.loadFlow && b.results.loadFlow.demandFactorsApplied
    );
    
    if (busesWithDemand.length > 0) {
        report += `SYSTEM-WIDE DEMAND & DIVERSITY ANALYSIS (Feature #5):\n`;
        report += `${'-'.repeat(100)}\n`;
        
        let totalConnected = 0;
        let totalDemand = 0;
        let totalDiversity = 0;
        
        busesWithDemand.forEach(bus => {
            const lf = bus.results.loadFlow;
            totalConnected += lf.summary.connectedCurrent;
            totalDemand += lf.demandSummary.demandCurrent;
            totalDiversity += lf.demandSummary.diversityCurrent;
        });
        
        const avgDemandFactor = totalDemand / totalConnected;
        const avgDiversityFactor = totalDiversity / totalDemand;
        const combinedFactor = totalDiversity / totalConnected;
        
        report += `Buses with Demand Analysis: ${busesWithDemand.length}\n`;
        report += `Total Connected Load:       ${totalConnected.toFixed(2)} A (100.0%)\n`;
        report += `Total Demand Load:          ${totalDemand.toFixed(2)} A (${(avgDemandFactor * 100).toFixed(1)}%)\n`;
        report += `Total Diversity Load:       ${totalDiversity.toFixed(2)} A (${(combinedFactor * 100).toFixed(1)}%)\n`;
        report += `\n`;
        report += `Average Demand Factor:      ${avgDemandFactor.toFixed(3)} (${(avgDemandFactor * 100).toFixed(1)}%)\n`;
        report += `Average Diversity Factor:   ${avgDiversityFactor.toFixed(3)} (${(avgDiversityFactor * 100).toFixed(1)}%)\n`;
        report += `Combined Reduction:         ${((1 - combinedFactor) * 100).toFixed(1)}%\n`;
        report += `\n`;
        report += `System Load Savings:        ${(totalConnected - totalDiversity).toFixed(2)} A\n`;
        report += `\n`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    
    // Bus-by-Bus Summary
    report += `SUMMARY OF ALL BUSES:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Bus Name                          Voltage(V)   Fault(kA)   X/R Ratio   VDrop(%)   Demand(A)   Status\n`;
    report += `${'-'.repeat(100)}\n`;
    
    calculatedBuses.forEach(bus => {
        const nameStr = bus.name.padEnd(32);
        const voltageStr = bus.voltage.toString().padStart(10);
        const faultStr = bus.results.faultCurrents.threePhaseSym.toFixed(2).padStart(10);
        const xrStr = bus.results.xrRatio.toFixed(2).padStart(10);
        const vdStr = bus.results.voltageDrop ? 
            bus.results.voltageDrop.cumulativeDropPercent.toFixed(2).padStart(9) : 
            'N/A'.padStart(9);
        
        const demandStr = (bus.results.loadFlow && bus.results.loadFlow.demandFactorsApplied) ?
            bus.results.loadFlow.demandSummary.demandCurrent.toFixed(2).padStart(10) :
            'N/A'.padStart(10);
        
        let status = '✓ OK';
        if (recommendationEngine) {
            const busRecs = recommendationEngine.filterByBus(bus.id);
            if (busRecs.some(r => r.severity === 'CRITICAL')) status = '⚠ CRITICAL';
            else if (busRecs.some(r => r.severity === 'HIGH')) status = '⚠ HIGH';
            else if (busRecs.some(r => r.severity === 'MEDIUM')) status = '⚠ MEDIUM';
        }
        
        report += `${nameStr} ${voltageStr}   ${faultStr}   ${xrStr}   ${vdStr}   ${demandStr}   ${status}\n`;
    });
    report += `\n`;
    
    // Cable Tag Directory
    report += `CABLE TAG DIRECTORY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Tag               Description                     From                    To                      Size/Material\n`;
    report += `${'-'.repeat(100)}\n`;
    
    const cables = components.filter(c => c.type === 'cable');
    if (cables.length > 0) {
        cables.forEach(cable => {
            const tag = (cable.tag || 'N/A').padEnd(18);
            const desc = (cable.description || 'N/A').substring(0, 32).padEnd(32);
            const from = (cable.fromBusName || 'Unknown').substring(0, 24).padEnd(24);
            const to = (cable.toBusName || 'Unknown').substring(0, 24).padEnd(24);
            const size = `${cable.size} ${cable.material}${cable.parallel > 1 ? ` (${cable.parallel}×)` : ''}`;
            
            report += `${tag} ${desc} ${from} ${to} ${size}\n`;
        });
    } else {
        report += `No cables in system.\n`;
    }
    report += `\n`;
    
    // System-wide recommendations
    report += `SYSTEM-WIDE RECOMMENDATIONS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Recommendations: ${systemReport.totalRecommendations}\n`;
    report += `  - Critical Issues: ${systemReport.critical}\n`;
    report += `  - High Priority: ${systemReport.high}\n`;
    report += `  - Medium Priority: ${systemReport.medium}\n`;
    report += `  - Low Priority: ${systemReport.low}\n\n`;
    
    if (systemReport.critical > 0) {
        report += `⚠️  WARNING: ${systemReport.critical} CRITICAL ISSUE${systemReport.critical > 1 ? 'S' : ''} DETECTED!\n`;
        report += `    IMMEDIATE ACTION REQUIRED TO ENSURE SYSTEM SAFETY!\n\n`;
    }
    
    // Recommendations by Category
    if (Object.keys(systemReport.byCategory).length > 0) {
        report += `RECOMMENDATIONS BY CATEGORY:\n`;
        report += `${'-'.repeat(100)}\n`;
        for (const category in systemReport.byCategory) {
            report += `${category}: ${systemReport.byCategory[category]}\n`;
        }
        report += `\n`;
    }
    
    // Priority Actions
    if (systemReport.priorityActions.length > 0) {
        report += `TOP PRIORITY ACTIONS:\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        systemReport.priorityActions.forEach((rec, index) => {
            report += `${index + 1}. [${rec.severity}] ${rec.name}\n`;
            report += `   Bus: ${rec.busName} (${rec.busVoltage}V)\n`;
            report += `   Finding: ${rec.recommendation}\n`;
            report += `   Action: ${rec.action}\n`;
            report += `   Impact: ${rec.impact}\n`;
            report += `   Cost: ${rec.cost} | Effort: ${rec.effort}\n`;
            report += `   Standard: ${rec.standard}\n`;
            report += `\n`;
        });
    }
    
    // All Recommendations by Bus
    report += `\nALL RECOMMENDATIONS BY BUS:\n`;
    report += `${'-'.repeat(100)}\n`;
    
    calculatedBuses.forEach(bus => {
        const busRecs = recommendationEngine?.filterByBus(bus.id) || [];
        
        if (busRecs.length > 0) {
            report += `\nBUS: ${bus.name} (${bus.voltage}V)\n`;
            report += `${'·'.repeat(100)}\n`;
            
            busRecs.forEach((rec, i) => {
                report += `\n${i + 1}. [${rec.severity}] ${rec.name}\n`;
                report += `   Category: ${rec.category}\n`;
                report += `   Finding: ${rec.recommendation}\n`;
                report += `   Action: ${rec.action}\n`;
                report += `   Impact: ${rec.impact}\n`;
                report += `   Cost: ${rec.cost} | Effort: ${rec.effort}\n`;
                report += `   Standard: ${rec.standard}\n`;
            });
            
            report += `\n`;
        }
    });
    
    // IEEE Compliance Summary
    report += `\n${'='.repeat(100)}\n`;
    report += `IEEE STANDARDS COMPLIANCE SUMMARY\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    const nonCompliantBuses = calculatedBuses.filter(bus => {
        const busRecs = recommendationEngine?.filterByBus(bus.id) || [];
        return busRecs.some(r => r.severity === 'CRITICAL' || r.severity === 'HIGH');
    });
    
    if (nonCompliantBuses.length === 0) {
        report += `✅ SYSTEM COMPLIANT\n\n`;
        report += `All buses meet IEEE 141, IEEE 1584, and NEC standards.\n`;
        report += `No critical or high-priority issues detected.\n\n`;
    } else {
        report += `⚠️  COMPLIANCE ISSUES DETECTED\n\n`;
        report += `The following buses require attention:\n\n`;
        nonCompliantBuses.forEach(bus => {
            report += `  - ${bus.name}: `;
            const busRecs = recommendationEngine.filterByBus(bus.id);
            const critical = busRecs.filter(r => r.severity === 'CRITICAL').length;
            const high = busRecs.filter(r => r.severity === 'HIGH').length;
            if (critical > 0) report += `${critical} Critical, `;
            if (high > 0) report += `${high} High Priority`;
            report += `\n`;
        });
        report += `\n`;
    }
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_SystemReport_${timestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export action plan from localStorage
 */
function exportActionPlan() {
    const actionPlan = JSON.parse(localStorage.getItem('actionPlan') || '[]');
    
    if (actionPlan.length === 0) {
        alert('No action items in your action plan. Add recommendations to the action plan first.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const timestamp = new Date().toISOString();
    
    let report = `${'='.repeat(100)}\n`;
    report += `ACTION PLAN REPORT\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Generated: ${new Date(timestamp).toLocaleString()}\n`;
    report += `Total Action Items: ${actionPlan.length}\n\n`;
    
    const critical = actionPlan.filter(a => a.severity === 'CRITICAL');
    const high = actionPlan.filter(a => a.severity === 'HIGH');
    const medium = actionPlan.filter(a => a.severity === 'MEDIUM');
    
    report += `SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Critical Priority: ${critical.length}\n`;
    report += `High Priority: ${high.length}\n`;
    report += `Medium Priority: ${medium.length}\n\n`;
    
    const addSection = (items, title) => {
        if (items.length > 0) {
            report += `${title}:\n`;
            report += `${'-'.repeat(100)}\n\n`;
            
            items.forEach((item, i) => {
                report += `${i + 1}. ${item.busName}\n`;
                report += `   ID: ${item.id}\n`;
                report += `   Status: ${item.status.toUpperCase()}\n`;
                report += `   Added: ${new Date(item.addedDate).toLocaleString()}\n`;
                report += `   \n`;
                report += `   Finding:\n`;
                report += `   ${item.recommendation}\n`;
                report += `   \n`;
                report += `   Required Action:\n`;
                report += `   ${item.action}\n`;
                report += `   \n`;
                report += `   Cost: ${item.cost}\n`;
                report += `   Effort: ${item.effort}\n`;
                report += `   \n`;
                report += `   [ ] Completed: _______________ (Date)\n`;
                report += `   [ ] Verified by: _______________ (Name)\n`;
                report += `   \n`;
                report += `${'-'.repeat(100)}\n\n`;
            });
        }
    };
    
    addSection(critical, 'CRITICAL PRIORITY ITEMS');
    addSection(high, 'HIGH PRIORITY ITEMS');
    addSection(medium, 'MEDIUM PRIORITY ITEMS');
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF ACTION PLAN\n`;
    report += `${'='.repeat(100)}\n`;
    
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_ActionPlan_${fileTimestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export recommendations to CSV format with demand factor info
 * Enhanced: Feature #5 - Includes demand/diversity data
 */
function exportRecommendationsCSV() {
    if (!window.recommendationEngine) {
        alert('❌ Recommendation engine not available!');
        return;
    }

    const recs = recommendationEngine.recommendations;
    
    if (!recs || recs.length === 0) {
        alert('ℹ️ No recommendations to export.\n\nRun calculations first to generate recommendations.');
        return;
    }

    let csv = 'Priority,Severity,Category,Bus,Voltage,Demand Factor,Diversity Factor,Connected Load(A),Demand Load(A),Recommendation,Action,Standard,Impact,Cost,Effort,Cable Tag,From,To\n';
    
    recs.forEach(rec => {
        const bus = buses.find(b => b.id === rec.busId);
        let cableTag = '';
        let fromBus = '';
        let toBus = '';
        let demandFactor = 'N/A';
        let diversityFactor = 'N/A';
        let connectedLoad = 'N/A';
        let demandLoad = 'N/A';
        
        if (bus) {
            // Get demand/diversity info
            if (bus.demandFactor !== undefined) {
                demandFactor = (bus.demandFactor * 100).toFixed(1) + '%';
            }
            if (bus.diversityFactor !== undefined) {
                diversityFactor = (bus.diversityFactor * 100).toFixed(1) + '%';
            } else {
                const autoDiversity = getDiversityFactorForBus(bus.id);
                if (autoDiversity) {
                    diversityFactor = (autoDiversity * 100).toFixed(1) + '%';
                }
            }
            
            // Get load info
            if (bus.results && bus.results.loadFlow) {
                connectedLoad = bus.results.loadFlow.summary.totalCurrent.toFixed(2);
                if (bus.results.loadFlow.demandFactorsApplied) {
                    demandLoad = bus.results.loadFlow.demandSummary.demandCurrent.toFixed(2);
                }
            }
            
            // Get cable info
            if (bus.pathComponents) {
                const cableComp = bus.pathComponents.find(pc => pc.component?.type === 'cable');
                if (cableComp && cableComp.component) {
                    cableTag = cableComp.component.tag || '';
                    fromBus = cableComp.component.fromBusName || '';
                    toBus = cableComp.component.toBusName || '';
                }
            }
        }
        
        csv += `${rec.priority},"${rec.severity}","${rec.category}","${rec.busName}",${rec.busVoltage},"${demandFactor}","${diversityFactor}","${connectedLoad}","${demandLoad}","${rec.recommendation.replace(/"/g, '""')}","${rec.action.replace(/"/g, '""')}","${rec.standard}","${rec.impact.replace(/"/g, '""')}","${rec.cost}","${rec.effort}","${cableTag}","${fromBus}","${toBus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recommendations_Feature5_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Recommendations exported with demand/diversity data!\n\n${recs.length} recommendation(s) with Feature #5 enhancements.`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED LOAD FLOW BREAKDOWN WITH CABLE TAGS
// From original file - Feature #8 implementation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate enhanced load flow breakdown with cable tags and From/To columns
 * ENHANCED: 2025-10-29 07:32:52 UTC by bfforex
 * Feature #8: From/To Column Implementation
 */
function generateLoadFlowBreakdownEnhanced(loadFlow) {
    let breakdown = `
DETAILED COMPONENT BREAKDOWN WITH FROM/TO INFORMATION:
════════════════════════════════════════════════════════════════════════════════════════════════════════
Type          Tag/Name                From Equipment          To Equipment            Current(A)   Power(kVA)
════════════════════════════════════════════════════════════════════════════════════════════════════════
`;

    if (loadFlow.breakdown.motors && loadFlow.breakdown.motors.length > 0) {
        loadFlow.breakdown.motors.forEach(motor => {
            const name = motor.name.substring(0, 20).padEnd(20);
            const from = '(Local Load)'.padEnd(24);
            const to = (motor.location || 'Unknown').substring(0, 24).padEnd(24);
            const current = motor.current.toFixed(2).padStart(12);
            const power = motor.powerKVA.toFixed(2).padStart(12);
            breakdown += `Motor         ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown.transformers && loadFlow.breakdown.transformers.length > 0) {
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

    if (loadFlow.breakdown.cables && loadFlow.breakdown.cables.length > 0) {
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

    if (loadFlow.breakdown.directLoads && loadFlow.breakdown.directLoads.length > 0) {
        loadFlow.breakdown.directLoads.forEach(load => {
            const name = 'Direct Load'.padEnd(20);
            const from = '(Direct)'.padEnd(24);
            const to = (load.bus || 'Unknown').substring(0, 24).padEnd(24);
            const current = load.current.toFixed(2).padStart(12);
            const power = load.powerKVA.toFixed(2).padStart(12);
            breakdown += `Direct Load   ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    if (loadFlow.breakdown.generators && loadFlow.breakdown.generators.length > 0) {
        loadFlow.breakdown.generators.forEach(gen => {
            const name = gen.name.substring(0, 20).padEnd(20);
            const from = '(Source)'.padEnd(24);
            const to = (gen.location || 'Unknown').substring(0, 24).padEnd(24);
            const current = (gen.current || 0).toFixed(2).padStart(12);
            const power = (gen.powerKVA || 0).toFixed(2).padStart(12);
            breakdown += `Generator     ${name} ${from} ${to} ${current} ${power}\n`;
        });
    }

    breakdown += `════════════════════════════════════════════════════════════════════════════════════════════════════════\n`;
    breakdown += `TOTAL                                                                                    ${loadFlow.summary.totalCurrent.toFixed(2).padStart(12)} ${loadFlow.summary.totalPowerKVA.toFixed(2).padStart(12)}\n`;
    breakdown += `════════════════════════════════════════════════════════════════════════════════════════════════════════\n`;
    
    return breakdown;
}

/**
 * Helper function to download text file
 */
function downloadTextFile(content, fileName, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Prompt user to select bus for export
 */
function promptBusExport() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('❌ No calculated buses!\n\nPlease run calculations first.');
        return;
    }
    
    if (calculatedBuses.length === 1) {
        exportBusReport(calculatedBuses[0].id);
        return;
    }
    
    const busOptions = calculatedBuses.map((b, i) => 
        `${i + 1}. ${b.name} (${b.voltage}V)`
    ).join('\n');
    
    const selection = prompt(
        `Select bus to export:\n\n${busOptions}\n\nEnter number (1-${calculatedBuses.length}):`,
        '1'
    );
    
    if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < calculatedBuses.length) {
            exportBusReport(calculatedBuses[index].id);
        } else {
            alert('Invalid selection!');
        }
    }
}

// Export all functions
window.promptBusExport = promptBusExport;
window.exportActionPlan = exportActionPlan;
window.exportRecommendationsCSV = exportRecommendationsCSV;
window.exportBusReport = exportBusReport;
window.exportAllBusesSummary = exportAllBusesSummary;
window.generateLoadFlowBreakdownEnhanced = generateLoadFlowBreakdownEnhanced;

console.log('✅ Export Report Module loaded - COMPLETE with Feature #5 & Feature #8');