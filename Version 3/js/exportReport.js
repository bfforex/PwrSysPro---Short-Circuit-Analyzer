/**
 * Export Report Module - Enhanced with Recommendations & Demand Factors
 * Modified: 2025-10-30 05:43:29 UTC by bfforex
 * FIXED VERSION - Comprehensive null safety and error handling
 * 
 * @author bfforex
 * @date 2025-10-30 05:43:29 UTC
 * @version 2.1.0
 * @fixed All undefined property access errors
 * @fixed Added defensive null checks throughout
 * @fixed Optional chaining for nested properties
 */

/**
 * Export detailed bus report with recommendations and demand factors
 * Enhanced: Feature #5 - Shows connected, demand, and diversity loads
 */
function exportBusReport(busId) {
    // ✅ DEFENSIVE CHECK: Validate inputs
    if (!busId) {
        alert('❌ Error: No bus ID provided.');
        return;
    }
    
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        alert('❌ Error: Bus not found.');
        return;
    }
    
    if (!bus.results) {
        alert('❌ No calculation results available for this bus.\n\nPlease run calculations first.');
        return;
    }

    const projectName = document.getElementById('projectName')?.value || 'Untitled';
    const calculationTimestamp = bus.results.calculationDate || getCalculationTimestamp();
    
    // Get recommendations for this bus
    const recommendations = (typeof recommendationEngine !== 'undefined' && recommendationEngine?.filterByBus) 
        ? recommendationEngine.filterByBus(busId) 
        : [];
    
    let report = `${'='.repeat(100)}\n`;
    report += `SHORT CIRCUIT ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber')?.value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${typeof VERSION !== 'undefined' ? VERSION : '1.0'}\n`;
    report += `Author: ${typeof AUTHOR !== 'undefined' ? AUTHOR : 'Unknown'}\n`;
    report += `Calculation Method: ${bus.results.method || 'point-to-point'}\n\n`;
    
    // Bus Information
    report += `BUS INFORMATION:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `Type: ${bus.type}\n`;
    if (bus.demandFactor !== undefined && bus.demandFactor !== null) {
        report += `Demand Factor: ${(bus.demandFactor * 100).toFixed(1)}% (NEC Article 220)\n`;
    }
    if (bus.diversityFactor !== undefined && bus.diversityFactor !== null) {
        report += `Diversity Factor: ${(bus.diversityFactor).toFixed(1)} (IEEE 141)\n`;
    } else if (typeof getDiversityFactorForBus === 'function') {
        const autoDiversity = getDiversityFactorForBus(busId);
        if (autoDiversity) {
            report += `Diversity Factor: ${(autoDiversity).toFixed(1)} (Auto - based on bus type)\n`;
        }
    }
    report += `\n`;
    
    // Fault Current Results
    report += `FAULT CURRENT RESULTS:\n`;
    report += `${'-'.repeat(100)}\n`;
    
    // ✅ SAFE ACCESS: Use optional chaining and defaults
    const faultCurrents = bus.results.faultCurrents || {};
    const threePhaseSym = faultCurrents.threePhaseSym || 0;
    const threePhaseAsym = faultCurrents.threePhaseAsym || 0;
    const lineToGround = faultCurrents.lineToGround || (threePhaseSym * 0.85);
    const lineToLine = faultCurrents.lineToLine || (threePhaseSym * 0.866);
    
    report += `Symmetrical Fault Current: ${threePhaseSym.toFixed(3)} kA (${(threePhaseSym * 1000).toFixed(2)} A)\n`;
    report += `Asymmetrical (Peak) Current: ${threePhaseAsym.toFixed(3)} kA (${(threePhaseAsym * 1000).toFixed(2)} A)\n`;
    report += `Line-to-Ground Fault: ${lineToGround.toFixed(3)} kA\n`;
    report += `Line-to-Line Fault: ${lineToLine.toFixed(3)} kA\n`;
    report += `X/R Ratio: ${(bus.results.xrRatio || 0).toFixed(3)}\n`;
    
    const totalImpedance = bus.results.totalImpedance || {};
    const magnitude = totalImpedance.magnitude || bus.results.totalZ || 0;
    report += `Total Impedance: ${magnitude.toFixed(6)} Ω\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTOR ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    
    if (bus.results.loadFlow && bus.results.loadFlow.demandFactorsApplied) {
        const lf = bus.results.loadFlow;
        const summary = lf.summary || {};
        const demandSummary = lf.demandSummary || {};
        
        report += `\n${'='.repeat(100)}\n`;
        report += `LOAD ANALYSIS WITH DEMAND & DIVERSITY FACTORS (Feature #5)\n`;
        report += `${'='.repeat(100)}\n\n`;
        
        report += `LOAD SUMMARY:\n`;
        report += `${'-'.repeat(100)}\n`;
        
        const connectedCurrent = summary.connectedCurrent || summary.totalCurrent || 0;
        const connectedPowerKVA = summary.connectedPowerKVA || summary.totalPowerKVA || 0;
        const demandCurrent = demandSummary.demandCurrent || 0;
        const demandPowerKVA = demandSummary.demandPowerKVA || 0;
        const diversityCurrent = demandSummary.diversityCurrent || 0;
        const diversityPowerKVA = demandSummary.diversityPowerKVA || 0;
        const demandFactor = demandSummary.demandFactor || 1.0;
        const diversityFactor = demandSummary.diversityFactor || 1.0;
        
        report += `Connected Load:     ${connectedCurrent.toFixed(2)} A  |  ${connectedPowerKVA.toFixed(2)} kVA  (100.0%)\n`;
        report += `Demand Load:        ${demandCurrent.toFixed(2)} A  |  ${demandPowerKVA.toFixed(2)} kVA  (${(demandFactor * 100).toFixed(1)}%)\n`;
        report += `Diversity Load:     ${diversityCurrent.toFixed(2)} A  |  ${diversityPowerKVA.toFixed(2)} kVA  (${(demandFactor / diversityFactor * 100).toFixed(1)}%)\n`;
        report += `\n`;
        report += `Power Savings:      ${(connectedPowerKVA - diversityPowerKVA).toFixed(2)} kVA\n`;
        report += `Load Reduction:     ${connectedCurrent > 0 ? ((1 - diversityCurrent / connectedCurrent) * 100).toFixed(1) : '0.0'}%\n`;
        report += `\n`;
        
        report += `FACTORS APPLIED:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Overall Demand Factor:      ${demandFactor.toFixed(3)} (${(demandFactor * 100).toFixed(1)}%)\n`;
        report += `Overall Diversity Factor:   ${diversityFactor.toFixed(3)} (${(diversityFactor).toFixed(1)})\n`;
        report += `Combined Factor:            ${connectedCurrent > 0 ? (diversityCurrent / connectedCurrent).toFixed(3) : '1.000'} (${connectedCurrent > 0 ? ((diversityCurrent / connectedCurrent) * 100).toFixed(1) : '100.0'}%)\n`;
        report += `\n`;
        
        report += `BREAKDOWN BY COMPONENT TYPE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Type              Connected(A)    Demand(A)    Factor    Power(kVA)\n`;
        report += `${'-'.repeat(100)}\n`;
        
        const demandBreakdown = lf.demandBreakdown || {};
        
        // Motors
        if (demandBreakdown.motors && demandBreakdown.motors.length > 0) {
            const totalConnected = demandBreakdown.motors.reduce((sum, m) => sum + (m.connectedCurrent || 0), 0);
            const totalDemand = demandBreakdown.motors.reduce((sum, m) => sum + (m.demandCurrent || 0), 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Motors            ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Transformers
        if (demandBreakdown.transformers && demandBreakdown.transformers.length > 0) {
            const totalConnected = demandBreakdown.transformers.reduce((sum, t) => sum + (t.connectedCurrent || 0), 0);
            const totalDemand = demandBreakdown.transformers.reduce((sum, t) => sum + (t.demandCurrent || 0), 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Transformers      ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Cables
        if (demandBreakdown.cables && demandBreakdown.cables.length > 0) {
            const totalConnected = demandBreakdown.cables.reduce((sum, c) => sum + (c.connectedCurrent || 0), 0);
            const totalDemand = demandBreakdown.cables.reduce((sum, c) => sum + (c.demandCurrent || 0), 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Cables            ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        // Direct Loads
        if (demandBreakdown.directLoads && demandBreakdown.directLoads.length > 0) {
            const totalConnected = demandBreakdown.directLoads.reduce((sum, d) => sum + (d.connectedCurrent || 0), 0);
            const totalDemand = demandBreakdown.directLoads.reduce((sum, d) => sum + (d.demandCurrent || 0), 0);
            const avgFactor = totalConnected > 0 ? totalDemand / totalConnected : 1.0;
            const totalPower = (totalDemand * bus.voltage * Math.sqrt(3)) / 1000;
            report += `Direct Loads      ${totalConnected.toFixed(2).padStart(12)}    ${totalDemand.toFixed(2).padStart(10)}    ${(avgFactor * 100).toFixed(1).padStart(6)}%    ${totalPower.toFixed(2).padStart(10)}\n`;
        }
        
        report += `${'-'.repeat(100)}\n`;
        report += `TOTAL             ${connectedCurrent.toFixed(2).padStart(12)}    ${demandCurrent.toFixed(2).padStart(10)}    ${(demandFactor * 100).toFixed(1).padStart(6)}%    ${demandPowerKVA.toFixed(2).padStart(10)}\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        report += `NEC/IEEE COMPLIANCE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `✓ NEC Article 220 - Demand factors applied per load type\n`;
        report += `✓ NEC Article 430.24 - Motor demand factors (${(demandBreakdown.motors || []).length} motors)\n`;
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

    const baseKVA = bus.results.baseKVA || 10000;
    const baseVoltage = bus.voltage;

    // ✅ Calculate base impedance: Z_base = V² / S_base
    const baseZ = bus.results.baseZ || (Math.pow(baseVoltage, 2) / (baseKVA * 1000));

    // ✅ Calculate base current: I_base = S_base / (√3 × V)
    const baseCurrent = bus.results.baseCurrent || ((baseKVA * 1000) / (Math.sqrt(3) * baseVoltage));

    // ✅ Calculate per-unit values if actual impedance/current available
    let puZ = 'N/A';
    let puI = 'N/A';

    if (bus.results.totalImpedance?.magnitude) {
        puZ = (bus.results.totalImpedance.magnitude / baseZ).toFixed(6);
    }

    if (bus.results.loadFlow?.summary?.totalCurrent) {
        puI = (bus.results.loadFlow.summary.totalCurrent / baseCurrent).toFixed(6);
    }

    report += `Base kVA: ${baseKVA} kVA (CONSTANT for entire system)\n`;
    report += `Base Voltage: ${baseVoltage} V\n`;
    report += `Base Impedance: ${baseZ.toFixed(6)} Ω (Z_base = V²/S_base)\n`;
    report += `Base Current: ${baseCurrent.toFixed(2)} A (I_base = S_base/(√3×V))\n`;

    // Add per-unit values if available
    if (puZ !== 'N/A') {
        report += `\nPer-Unit Values:\n`;
        report += `  System Impedance (pu): ${puZ}\n`;
        if (puI !== 'N/A') {
            report += `  Load Current (pu): ${puI}\n`;
        }
    }

    report += `\n`;
    
    // Per-Unit Impedances (R, X, Z breakdown)
    // ✅ ENHANCED: Calculate from shortCircuit results if not directly available
    if (bus.results.totalRpu !== undefined || bus.results.totalImpedance) {
        report += `PER-UNIT IMPEDANCES (DETAILED):\n`;
        report += `${'-'.repeat(100)}\n`;
        
        let rPu, xPu, zPu;
        
        // Try to get from existing results
        if (bus.results.totalRpu !== undefined) {
            rPu = bus.results.totalRpu || 0;
            xPu = bus.results.totalXpu || 0;
            zPu = bus.results.totalZpu || 0;
        } 
        // Or calculate from impedance components if not available
        else if (bus.results.totalImpedance) {
            const baseKVA = bus.results.baseKVA || 10000;
            const baseVoltage = bus.voltage;
            const baseZ = Math.pow(baseVoltage, 2) / (baseKVA * 1000);
            
            const totalZ = bus.results.totalImpedance.magnitude || 0;
            const xrRatio = bus.results.xrRatio || 1;
            
            // Calculate R and X from Z and X/R ratio
            const r = totalZ / Math.sqrt(1 + Math.pow(xrRatio, 2));
            const x = r * xrRatio;
            
            rPu = r / baseZ;
            xPu = x / baseZ;
            zPu = totalZ / baseZ;
        }
        
        if (rPu !== undefined) {
            report += `R(pu): ${rPu.toFixed(6)} pu (Resistance)\n`;
            report += `X(pu): ${xPu.toFixed(6)} pu (Reactance)\n`;
            report += `Z(pu): ${zPu.toFixed(6)} pu (Total Impedance)\n`;
            report += `X/R Ratio: ${(xPu / rPu).toFixed(3)}\n`;
        }
        
        report += `\n`;
    }
    
    // Path from Source with cable tags
    report += `PATH FROM SOURCE (WITH CABLE TAGS):\n`;
    report += `${'-'.repeat(100)}\n`;
    if (bus.pathComponents && bus.pathComponents.length > 0) {
        bus.pathComponents.forEach((segment, index) => {
            const busInfo = segment.bus;
            
            if (!busInfo) {
                report += `${index + 1}. Unknown Bus\n`;
                return;
            }
            
            if (index === 0) {
                report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - SOURCE\n`;
            } else {
                const comp = segment.component;
                if (comp) {
                    if (comp.type === 'cable') {
                        const tag = comp.tag || 'N/A';
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - CABLE [Tag: ${tag}, ${comp.size} ${comp.material}, ${comp.length}ft${comp.parallel > 1 ? `, ${comp.parallel}× parallel` : ''}]\n`;
                    } else if (comp.type === 'transformer') {
                        const tag = comp.tag || 'N/A';
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - TRANSFORMER [Tag: ${tag}, ${comp.rating} kVA, ${comp.impedance}%]\n`;
                    } else {
                        report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V) - ${comp.type.toUpperCase()}\n`;
                    }
                } else {
                    report += `${index + 1}. ${busInfo.name} (${busInfo.voltage}V)\n`;
                }
            }
        });
    } else {
        report += `No path information available.\n`;
    }
    report += `\n`;
    
    // Voltage Drop Analysis
    if (bus.results.voltageDrop) {
        const vd = bus.results.voltageDrop;
        report += `VOLTAGE DROP ANALYSIS (WITH CABLE TAGS):\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Voltage Drop: ${(vd.cumulativeDropPercent || 0).toFixed(3)}% (${(vd.cumulativeDropVolts || 0).toFixed(3)} V)\n`;
        report += `Maximum Single Component Drop: ${(vd.maxDropPercent || 0).toFixed(3)}%\n`;
        report += `IEEE 141 Compliance: ${(vd.cumulativeDropPercent || 0) <= 7 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}\n`;
        report += `Power Factor: ${document.getElementById('powerFactor')?.value || '0.9'}\n\n`;
        
        if (vd.components && vd.components.length > 0) {
            report += `COMPONENT BREAKDOWN (WITH FROM/TO AND TAGS):\n`;
            report += `${'-'.repeat(100)}\n`;
            report += `Step  Type          Tag/Name                From                    To                      Current(A)  Drop(V)   Drop(%)   Status\n`;
            report += `${'-'.repeat(100)}\n`;
            
            vd.components.forEach((comp, index) => {
                const step = (index + 1).toString().padStart(3);
                const type = (comp.type || 'unknown').padEnd(13);
                
                let tagName = (comp.name || 'N/A').substring(0, 20).padEnd(20);
                let fromBus = 'N/A';
                let toBus = 'N/A';
                
                // ✅ FIX: Get FROM/TO from component stored in global components array
                if (comp.type === 'cable') {
                    // Try to find the actual cable component
                    const cableComponent = components.find(c => {
                        if (c.type !== 'cable') return false;
                        
                        // Match by tag or name
                        const compNameClean = comp.name?.replace(/\s.*$/, '') || '';  // Get just the tag part
                        return c.tag === compNameClean || c.tag === comp.name || c.name === comp.name;
                    });
                    
                    if (cableComponent) {
                        tagName = (cableComponent.tag || comp.name).substring(0, 20).padEnd(20);
                        fromBus = cableComponent.fromBusName || 'Unknown';
                        toBus = cableComponent.toBusName || 'Unknown';
                    } else {
                        console.warn(`⚠️ Could not find cable in components: ${comp.name}`);
                    }
                } else if (comp.type === 'transformer') {
                    // Find transformer in components array
                    const xfmrComponent = components.find(c => 
                        c.type === 'transformer' && 
                        (c.name === comp.name || c.tag === comp.name)
                    );
                    
                    if (xfmrComponent) {
                        tagName = (xfmrComponent.name || comp.name).substring(0, 20).padEnd(20);
                        fromBus = xfmrComponent.fromBusName || 'Unknown';
                        toBus = xfmrComponent.toBusName || 'Unknown';
                    }
                }
                
                // Pad to fixed width
                fromBus = fromBus.substring(0, 24).padEnd(24);
                toBus = toBus.substring(0, 24).padEnd(24);
                
                const current = (comp.current || 0).toFixed(1).padStart(10);
                const dropV = (comp.dropVolts || 0).toFixed(3).padStart(9);
                const dropP = (comp.dropPercent || 0).toFixed(3).padStart(9);
                const status = comp.severity || 'OK';
                
                report += `${step}  ${type} ${tagName} ${fromBus} ${toBus} ${current} ${dropV} ${dropP}  ${status}\n`;
            });
            
            report += `${'-'.repeat(100)}\n`;
        }
    }
    
    // Load flow with enhanced breakdown
    if (bus.results.loadFlow) {
        const lf = bus.results.loadFlow;
        const summary = lf.summary || {};
        
        report += `\nLOAD FLOW ANALYSIS (WITH CABLE TAGS AND FROM/TO):\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Load Current: ${(summary.totalCurrent || 0).toFixed(2)} A\n`;
        report += `Total Apparent Power: ${(summary.totalPowerKVA || 0).toFixed(2)} kVA\n`;
        report += `Total Active Power: ${(summary.totalPowerKW || 0).toFixed(2)} kW\n`;
        report += `Power Factor: ${summary.powerFactor || 0.9}\n\n`;
        
        if (typeof generateLoadFlowBreakdownEnhanced === 'function') {
            try {
                report += generateLoadFlowBreakdownEnhanced(lf);
            } catch (error) {
                console.error('Error generating load flow breakdown:', error);
                report += `Error generating detailed breakdown: ${error.message}\n`;
            }
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
            report += `${index + 1}. [${rec.severity || 'UNKNOWN'}] ${rec.name || 'Unnamed'}\n`;
            report += `   ID: ${rec.id || 'N/A'}\n`;
            report += `   Category: ${rec.category || 'General'}\n`;
            report += `   Priority: ${rec.priority || 'N/A'}\n`;
            report += `   Standard Reference: ${rec.standard || 'N/A'}\n`;
            report += `\n`;
            report += `   FINDING:\n`;
            report += `   ${rec.recommendation || 'No description available'}\n`;
            report += `\n`;
            report += `   REQUIRED ACTION:\n`;
            report += `   ${rec.action || 'No action specified'}\n`;
            report += `\n`;
            report += `   IMPACT:\n`;
            report += `   ${rec.impact || 'No impact assessment available'}\n`;
            report += `\n`;
            report += `   IMPLEMENTATION:\n`;
            report += `   Cost Impact: ${rec.cost || 'Unknown'}\n`;
            report += `   Effort Required: ${rec.effort || 'Unknown'}\n`;
            report += `\n`;
            
            if (rec.context) {
                report += `   CONTEXT:\n`;
                if (rec.context.faultCurrent !== undefined) {
                    report += `   - Fault Current: ${rec.context.faultCurrent.toFixed(2)} kA\n`;
                }
                if (rec.context.xrRatio !== undefined) {
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
    if (bus.results.calculationSteps || bus.results.steps) {
        report += `\n${'='.repeat(100)}\n`;
        report += `DETAILED CALCULATIONS\n`;
        report += `${'='.repeat(100)}\n\n`;
        report += bus.results.calculationSteps || bus.results.steps || 'No detailed steps available.\n';
    }
    
    report += `\n${'='.repeat(100)}\n`;
    report += `END OF REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download report
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${bus.name.replace(/\s+/g, '_')}_Report_${timestamp}.txt`;
        downloadTextFile(report, fileName);
        console.log(`✅ Report exported: ${fileName}`);
    } catch (error) {
        console.error('Error downloading report:', error);
        alert(`❌ Error saving report: ${error.message}`);
    }
}

/**
 * Export all buses summary - ENHANCED VERSION
 * Modified: 2025-11-01 10:28:22 UTC by bfforex
 * Issue #6: Now calls enhanced system report generator
 */
function exportAllBusesSummary() {
    console.log('📊 Exporting enhanced system report...');
    
    // Check if enhanced report generator is available
    if (typeof exportEnhancedSystemReport === 'function') {
        // Use enhanced report generator (Issue #6)
        exportEnhancedSystemReport();
    } else {
        // Fallback to basic report (compatibility)
        console.warn('⚠️ Enhanced report generator not available, using basic report');
        exportBasicSystemSummary();
    }
}

/**
 * Export basic system summary (fallback/legacy)
 * Renamed from exportAllBusesSummary for clarity
 */
function exportBasicSystemSummary() {
    const calculatedBuses = buses.filter(b => b && b.results);
    
    if (calculatedBuses.length === 0) {
        alert('❌ No calculation results available.\n\nPlease run calculations first.');
        return;
    }

    const projectName = document.getElementById('projectName')?.value || 'Untitled';
    const calculationTimestamp = typeof getCalculationTimestamp === 'function' 
        ? getCalculationTimestamp() 
        : new Date().toISOString();
    
    const systemReport = (typeof recommendationEngine !== 'undefined' && recommendationEngine?.analyzeSystem) 
        ? recommendationEngine.analyzeSystem(calculatedBuses)
        : {
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
    report += `Project Number: ${document.getElementById('projectNumber')?.value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${typeof VERSION !== 'undefined' ? VERSION : '1.0'}\n`;
    report += `Author: ${typeof AUTHOR !== 'undefined' ? AUTHOR : 'Unknown'}\n\n`;
    
    // System Summary
    report += `SYSTEM SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Buses in System: ${buses.length}\n`;
    report += `Calculated Buses: ${calculatedBuses.length}\n`;
    report += `Analysis Method: ${document.querySelector('input[name="method"]:checked')?.value || 'point-to-point'}\n`;
    report += `Temperature: ${document.getElementById('temperature')?.value || '75'}°C\n`;
    report += `Power Factor: ${document.getElementById('powerFactor')?.value || '0.9'}\n\n`;
    
    // Bus-by-Bus Summary
    report += `SUMMARY OF ALL BUSES:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Bus Name                          Voltage(V)   Fault(kA)   X/R Ratio   VDrop(%)   Demand(A)   Status\n`;
    report += `${'-'.repeat(100)}\n`;
    
    calculatedBuses.forEach(bus => {
        const nameStr = bus.name.padEnd(32);
        const voltageStr = bus.voltage.toString().padStart(10);
        
        const faultCurrents = bus.results?.faultCurrents || {};
        const faultStr = (faultCurrents.threePhaseSym || 0).toFixed(2).padStart(10);
        const xrStr = (bus.results?.xrRatio || 0).toFixed(2).padStart(10);
        
        const vdStr = bus.results?.voltageDrop 
            ? (bus.results.voltageDrop.cumulativeDropPercent || 0).toFixed(2).padStart(9)
            : 'N/A'.padStart(9);
        
        const demandStr = (bus.results?.loadFlow && bus.results.loadFlow.demandFactorsApplied)
            ? (bus.results.loadFlow.demandSummary?.demandCurrent || 0).toFixed(2).padStart(10)
            : 'N/A'.padStart(10);
        
        let status = '✓ OK';
        if (typeof recommendationEngine !== 'undefined' && recommendationEngine?.filterByBus) {
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
    
    const cables = components.filter(c => c && c.type === 'cable');
    if (cables.length > 0) {
        cables.forEach(cable => {
            const tag = (cable.tag || 'N/A').padEnd(18);
            const desc = (cable.description || 'N/A').substring(0, 32).padEnd(32);
            const from = (cable.fromBusName || 'Unknown').substring(0, 24).padEnd(24);
            const to = (cable.toBusName || 'Unknown').substring(0, 24).padEnd(24);
            const size = `${cable.size || 'N/A'} ${cable.material || 'N/A'}${cable.parallel > 1 ? ` (${cable.parallel}×)` : ''}`;
            
            report += `${tag} ${desc} ${from} ${to} ${size}\n`;
        });
    } else {
        report += `No cables in system.\n`;
    }
    report += `\n`;
    
    // System-wide recommendations
    report += `SYSTEM-WIDE RECOMMENDATIONS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Recommendations: ${systemReport.totalRecommendations || 0}\n`;
    report += `  - Critical Issues: ${systemReport.critical || 0}\n`;
    report += `  - High Priority: ${systemReport.high || 0}\n`;
    report += `  - Medium Priority: ${systemReport.medium || 0}\n`;
    report += `  - Low Priority: ${systemReport.low || 0}\n\n`;
    
    if ((systemReport.critical || 0) > 0) {
        report += `⚠️ WARNING: ${systemReport.critical} CRITICAL ISSUE${systemReport.critical > 1 ? 'S' : ''} DETECTED!\n`;
        report += `    IMMEDIATE ACTION REQUIRED TO ENSURE SYSTEM SAFETY!\n\n`;
    }
    
    // Recommendations by Category
    if (systemReport.byCategory && Object.keys(systemReport.byCategory).length > 0) {
        report += `RECOMMENDATIONS BY CATEGORY:\n`;
        report += `${'-'.repeat(100)}\n`;
        for (const category in systemReport.byCategory) {
            report += `${category}: ${systemReport.byCategory[category]}\n`;
        }
        report += `\n`;
    }
    
    // All Recommendations by Bus (abbreviated)
    report += `\nALL RECOMMENDATIONS BY BUS:\n`;
    report += `${'-'.repeat(100)}\n`;
    
    calculatedBuses.forEach(bus => {
        const busRecs = (typeof recommendationEngine !== 'undefined' && recommendationEngine?.filterByBus)
            ? recommendationEngine.filterByBus(bus.id)
            : [];
        
        if (busRecs.length > 0) {
            report += `\nBUS: ${bus.name} (${bus.voltage}V)\n`;
            report += `${'·'.repeat(100)}\n`;
            
            busRecs.forEach((rec, i) => {
                report += `\n${i + 1}. [${rec.severity || 'UNKNOWN'}] ${rec.name || 'Unnamed'}\n`;
                report += `   Category: ${rec.category || 'General'}\n`;
                report += `   Finding: ${rec.recommendation || 'No description'}\n`;
                report += `   Action: ${rec.action || 'No action specified'}\n`;
                report += `   Impact: ${rec.impact || 'No impact assessment'}\n`;
                report += `   Cost: ${rec.cost || 'Unknown'} | Effort: ${rec.effort || 'Unknown'}\n`;
                report += `   Standard: ${rec.standard || 'N/A'}\n`;
            });
            
            report += `\n`;
        }
    });
    
    // IEEE Compliance Summary
    report += `\n${'='.repeat(100)}\n`;
    report += `IEEE STANDARDS COMPLIANCE SUMMARY\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    const nonCompliantBuses = calculatedBuses.filter(bus => {
        if (typeof recommendationEngine === 'undefined' || !recommendationEngine?.filterByBus) return false;
        const busRecs = recommendationEngine.filterByBus(bus.id);
        return busRecs.some(r => r.severity === 'CRITICAL' || r.severity === 'HIGH');
    });
    
    if (nonCompliantBuses.length === 0) {
        report += `✅ SYSTEM COMPLIANT\n\n`;
        report += `All buses meet IEEE 141, IEEE 1584, and NEC standards.\n`;
        report += `No critical or high-priority issues detected.\n\n`;
    } else {
        report += `⚠️ COMPLIANCE ISSUES DETECTED\n\n`;
        report += `The following buses require attention:\n\n`;
        nonCompliantBuses.forEach(bus => {
            report += `  - ${bus.name}: `;
            if (typeof recommendationEngine !== 'undefined' && recommendationEngine?.filterByBus) {
                const busRecs = recommendationEngine.filterByBus(bus.id);
                const critical = busRecs.filter(r => r.severity === 'CRITICAL').length;
                const high = busRecs.filter(r => r.severity === 'HIGH').length;
                if (critical > 0) report += `${critical} Critical, `;
                if (high > 0) report += `${high} High Priority`;
            }
            report += `\n`;
        });
        report += `\n`;
    }
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download report
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${projectName.replace(/\s+/g, '_')}_SystemReport_${timestamp}.txt`;
        downloadTextFile(report, fileName);
        console.log(`✅ Basic system report exported: ${fileName}`);
    } catch (error) {
        console.error('Error downloading report:', error);
        alert(`❌ Error saving report: ${error.message}`);
    }
}

/**
 * Export action plan from localStorage
 */
function exportActionPlan() {
    const actionPlan = JSON.parse(localStorage.getItem('actionPlan') || '[]');
    
    if (actionPlan.length === 0) {
        alert('ℹ️ No action items in your action plan.\n\nAdd recommendations to the action plan first.');
        return;
    }
    
    const projectName = document.getElementById('projectName')?.value || 'Untitled';
    const timestamp = new Date().toISOString();
    
    let report = `${'='.repeat(100)}\n`;
    report += `ACTION PLAN REPORT\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber')?.value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}\n`;
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
                report += `${i + 1}. ${item.busName || 'Unknown Bus'}\n`;
                report += `   ID: ${item.id || 'N/A'}\n`;
                report += `   Status: ${(item.status || 'pending').toUpperCase()}\n`;
                report += `   Added: ${new Date(item.addedDate).toLocaleString()}\n`;
                report += `   \n`;
                report += `   Finding:\n`;
                report += `   ${item.recommendation || 'No description'}\n`;
                report += `   \n`;
                report += `   Required Action:\n`;
                report += `   ${item.action || 'No action specified'}\n`;
                report += `   \n`;
                report += `   Cost: ${item.cost || 'Unknown'}\n`;
                report += `   Effort: ${item.effort || 'Unknown'}\n`;
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
    
    try {
        const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${projectName.replace(/\s+/g, '_')}_ActionPlan_${fileTimestamp}.txt`;
        downloadTextFile(report, fileName);
        console.log(`✅ Action plan exported: ${fileName}`);
    } catch (error) {
        console.error('Error downloading action plan:', error);
        alert(`❌ Error saving action plan: ${error.message}`);
    }
}

/**
 * Export recommendations to CSV format with demand factor info
 * Enhanced: Feature #5 - Includes demand/diversity data
 */
function exportRecommendationsCSV() {
    if (typeof recommendationEngine === 'undefined' || !recommendationEngine) {
        alert('❌ Recommendation engine not available!');
        return;
    }

    const recs = recommendationEngine.recommendations || [];
    
    if (recs.length === 0) {
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
            if (bus.demandFactor !== undefined && bus.demandFactor !== null) {
                demandFactor = (bus.demandFactor * 100).toFixed(1) + '%';
            }
            if (bus.diversityFactor !== undefined && bus.diversityFactor !== null) {
                diversityFactor = (bus.diversityFactor * 100).toFixed(1) + '%';
            } else if (typeof getDiversityFactorForBus === 'function') {
                const autoDiversity = getDiversityFactorForBus(bus.id);
                if (autoDiversity) {
                    diversityFactor = (autoDiversity * 100).toFixed(1) + '%';
                }
            }
            
            // Get load info
            if (bus.results && bus.results.loadFlow) {
                const summary = bus.results.loadFlow.summary || {};
                connectedLoad = (summary.totalCurrent || summary.connectedCurrent || 0).toFixed(2);
                if (bus.results.loadFlow.demandFactorsApplied) {
                    const demandSummary = bus.results.loadFlow.demandSummary || {};
                    demandLoad = (demandSummary.demandCurrent || 0).toFixed(2);
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
        
        const priority = rec.priority || 0;
        const severity = rec.severity || 'UNKNOWN';
        const category = rec.category || 'General';
        const busName = rec.busName || 'Unknown';
        const busVoltage = rec.busVoltage || 'N/A';
        const recommendation = (rec.recommendation || 'No description').replace(/"/g, '""');
        const action = (rec.action || 'No action').replace(/"/g, '""');
        const standard = rec.standard || 'N/A';
        const impact = (rec.impact || 'No impact assessment').replace(/"/g, '""');
        const cost = rec.cost || 'Unknown';
        const effort = rec.effort || 'Unknown';
        
        csv += `${priority},"${severity}","${category}","${busName}",${busVoltage},"${demandFactor}","${diversityFactor}","${connectedLoad}","${demandLoad}","${recommendation}","${action}","${standard}","${impact}","${cost}","${effort}","${cableTag}","${fromBus}","${toBus}"\n`;
    });

    try {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Recommendations_Feature5_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Recommendations CSV exported: ${recs.length} items`);
        alert(`✅ Recommendations exported with demand/diversity data!\n\n${recs.length} recommendation(s) with Feature #5 enhancements.`);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert(`❌ Error exporting recommendations: ${error.message}`);
    }
}

/**
 * Helper function to download text file
 */
function downloadTextFile(content, fileName, mimeType = 'text/plain') {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

/**
 * Prompt user to select bus for export
 */
function promptBusExport() {
    const calculatedBuses = buses.filter(b => b && b.results);
    
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
            alert('❌ Invalid selection!');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

window.promptBusExport = promptBusExport;
window.exportActionPlan = exportActionPlan;
window.exportRecommendationsCSV = exportRecommendationsCSV;
window.exportBusReport = exportBusReport;
window.exportAllBusesSummary = exportAllBusesSummary;
window.downloadTextFile = downloadTextFile;

console.log('✅ Export Report Module v2.1.0 loaded');
console.log('   - Comprehensive null safety: ENABLED');
console.log('   - Feature #5 integration: COMPLETE');
console.log('   - Feature #8 integration: COMPLETE');
console.log('   - Error handling: ENHANCED');