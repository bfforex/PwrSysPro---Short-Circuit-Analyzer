/**
 * Export Report Module - Enhanced with Recommendations
 * Modified: 2025-10-27 13:07:42 UTC by bfforex
 * Added: Comprehensive recommendation export functionality
 * 
 * @author bfforex
 * @date 2025-10-27 13:07:42 UTC
 */

/**
 * Export detailed bus report with recommendations
 * Enhanced: Now includes recommendations section
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
    const recommendations = recommendationEngine.filterByBus(busId);
    
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
    report += `Type: ${bus.type}\n\n`;
    
    // Fault Current Results
    report += `FAULT CURRENT RESULTS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Symmetrical Fault Current: ${bus.results.faultCurrents.threePhaseSym.toFixed(3)} kA (${(bus.results.faultCurrents.threePhaseSym * 1000).toFixed(2)} A)\n`;
    report += `Asymmetrical (Peak) Current: ${bus.results.faultCurrents.threePhaseAsym.toFixed(3)} kA (${(bus.results.faultCurrents.threePhaseAsym * 1000).toFixed(2)} A)\n`;
    report += `Line-to-Ground Fault: ${bus.results.faultCurrents.lineToGround.toFixed(3)} kA\n`;
    report += `Line-to-Line Fault: ${bus.results.faultCurrents.lineToLine.toFixed(3)} kA\n`;
    report += `X/R Ratio: ${bus.results.xrRatio.toFixed(3)}\n`;
    report += `Total Impedance: ${bus.results.totalImpedance.magnitude.toFixed(6)} Ω\n\n`;
    
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
    
    // Path from Source
    report += `PATH FROM SOURCE:\n`;
    report += `${'-'.repeat(100)}\n`;
    if (bus.pathComponents && bus.pathComponents.length > 0) {
        bus.pathComponents.forEach((segment, index) => {
            const compInfo = segment.component ? 
                `${segment.component.type.toUpperCase()}` : 'SOURCE';
            report += `${index + 1}. ${segment.bus.name} (${segment.bus.voltage}V) - ${compInfo}\n`;
        });
    }
    report += `\n`;
    
    // Voltage Drop Analysis
    if (bus.results.voltageDrop) {
        report += `VOLTAGE DROP ANALYSIS:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Total Voltage Drop: ${bus.results.voltageDrop.cumulativeDropPercent.toFixed(3)}% (${bus.results.voltageDrop.cumulativeDropVolts.toFixed(3)} V)\n`;
        report += `Maximum Single Component Drop: ${bus.results.voltageDrop.maxDropPercent.toFixed(3)}%\n`;
        report += `IEEE 141 Compliance: ${bus.results.voltageDrop.cumulativeDropPercent <= 7 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}\n`;
        report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n\n`;
        
        if (bus.results.voltageDrop.components.length > 0) {
            report += `COMPONENT BREAKDOWN:\n`;
            report += `${'-'.repeat(100)}\n`;
            report += `Step  Type          Name                    Current(A)  Drop(V)   Drop(%)   Status\n`;
            report += `${'-'.repeat(100)}\n`;
            bus.results.voltageDrop.components.forEach(comp => {
                const nameStr = (comp.name || 'N/A').substring(0, 20).padEnd(20);
                const typeStr = comp.type.padEnd(12);
                report += `${comp.step.toString().padEnd(5)} ${typeStr}  ${nameStr}  ${comp.current.toFixed(1).padStart(9)}  ${comp.dropVolts.toFixed(3).padStart(8)}  ${comp.dropPercent.toFixed(3).padStart(8)}  ${comp.severity}\n`;
            });
            report += `\n`;
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // 🔥 NEW: RECOMMENDATIONS SECTION
    // ═══════════════════════════════════════════════════════════
    
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
            
            // Add context information
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
    
    // ═══════════════════════════════════════════════════════════
    
    // Detailed Calculations (if available)
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
 * Export all buses summary with system recommendations
 * Enhanced: Now includes comprehensive system analysis
 */
function exportAllBusesSummary() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculation results available. Please run calculations first.');
        return;
    }

    const projectName = document.getElementById('projectName').value || 'Untitled';
    const calculationTimestamp = getCalculationTimestamp();
    
    // Generate system-wide recommendations
    const systemReport = recommendationEngine.analyzeSystem(calculatedBuses);
    
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
    report += `Analysis Method: ${document.querySelector('input[name="method"]:checked').value}\n`;
    report += `Temperature: ${document.getElementById('temperature').value || '75'}°C\n`;
    report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n\n`;
    
    // Bus-by-Bus Summary
    report += `SUMMARY OF ALL BUSES:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Bus Name                          Voltage(V)   Fault(kA)   X/R Ratio   VDrop(%)   Status\n`;
    report += `${'-'.repeat(100)}\n`;
    
    calculatedBuses.forEach(bus => {
        const nameStr = bus.name.padEnd(32);
        const voltageStr = bus.voltage.toString().padStart(10);
        const faultStr = bus.results.faultCurrents.threePhaseSym.toFixed(2).padStart(10);
        const xrStr = bus.results.xrRatio.toFixed(2).padStart(10);
        const vdStr = bus.results.voltageDrop ? 
            bus.results.voltageDrop.cumulativeDropPercent.toFixed(2).padStart(9) : 
            'N/A'.padStart(9);
        
        // Determine status
        let status = '✓ OK';
        const busRecs = recommendationEngine.filterByBus(bus.id);
        if (busRecs.some(r => r.severity === 'CRITICAL')) status = '⚠ CRITICAL';
        else if (busRecs.some(r => r.severity === 'HIGH')) status = '⚠ HIGH';
        else if (busRecs.some(r => r.severity === 'MEDIUM')) status = '⚠ MEDIUM';
        
        report += `${nameStr} ${voltageStr}   ${faultStr}   ${xrStr}   ${vdStr}   ${status}\n`;
    });
    report += `\n`;
    
    // ═══════════════════════════════════════════════════════════
    // 🔥 NEW: SYSTEM-WIDE RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════
    
    report += `\n${'='.repeat(100)}\n`;
    report += `SYSTEM-WIDE RECOMMENDATIONS\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `ANALYSIS SUMMARY:\n`;
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
    report += `RECOMMENDATIONS BY CATEGORY:\n`;
    report += `${'-'.repeat(100)}\n`;
    for (const category in systemReport.byCategory) {
        report += `${category}: ${systemReport.byCategory[category]}\n`;
    }
    report += `\n`;
    
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
        const busRecs = recommendationEngine.filterByBus(bus.id);
        
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
    
    // ═══════════════════════════════════════════════════════════
    
    // IEEE Compliance Summary
    report += `\n${'='.repeat(100)}\n`;
    report += `IEEE STANDARDS COMPLIANCE SUMMARY\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    const nonCompliantBuses = calculatedBuses.filter(bus => {
        const busRecs = recommendationEngine.filterByBus(bus.id);
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
 * NEW FUNCTION: Added 2025-10-27 13:07:42 UTC by bfforex
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
    
    // Group by priority
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
    
    // Download report
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_ActionPlan_${fileTimestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export recommendations to CSV format
 * NEW FUNCTION: Added 2025-10-27 13:07:42 UTC by bfforex
 */
function exportRecommendationsCSV() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculation results available.');
        return;
    }
    
    const systemReport = recommendationEngine.analyzeSystem(calculatedBuses);
    const allRecs = [];
    for (const busId in systemReport.byBus) {
        allRecs.push(...systemReport.byBus[busId]);
    }
    
    if (allRecs.length === 0) {
        alert('No recommendations to export.');
        return;
    }
    
    // CSV Header
    let csv = 'ID,Bus Name,Voltage(V),Severity,Priority,Category,Name,Recommendation,Action,Impact,Cost,Effort,Standard\n';
    
    // CSV Data
    allRecs.forEach(rec => {
        const row = [
            rec.id,
            `"${rec.busName}"`,
            rec.busVoltage,
            rec.severity,
            rec.priority,
            `"${rec.category}"`,
            `"${rec.name}"`,
            `"${rec.recommendation.replace(/"/g, '""')}"`,
            `"${rec.action.replace(/"/g, '""')}"`,
            `"${rec.impact.replace(/"/g, '""')}"`,
            rec.cost,
            `"${rec.effort}"`,
            `"${rec.standard}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    // Download CSV
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_Recommendations_${timestamp}.csv`;
    downloadTextFile(csv, fileName, 'text/csv');
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

// Export new functions to global scope
window.exportActionPlan = exportActionPlan;
window.exportRecommendationsCSV = exportRecommendationsCSV;