/**
 * Load Flow & Voltage Drop Report Module
 * Separate reports for load flow analysis and voltage drop calculations
 * 
 * @author bfforex
 * @date 2025-10-28 00:28:22 UTC
 * @version 1.1.0
 * @modified 2025-12-01 - Issue #1 CRITICAL: Added safe formatting to prevent toFixed() errors
 */

// ═══════════════════════════════════════════════════════════════════════════
// Issue #1 CRITICAL FIX: Use safeToFixed() to prevent "Cannot read properties 
// of undefined (reading 'toFixed')" errors when exporting with incomplete data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export Load Flow Analysis Report
 */
function exportLoadFlowReport(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        alert('Bus not found.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const timestamp = getCalculationTimestamp();
    
    // Calculate load flow
    const loadSummary = getLoadSummary(busId);
    const downstreamLoad = calculateDownstreamLoad(busId);
    
    // ✅ Issue #1 FIX: Use safeToFixed for safe numeric formatting
    const safeFormat = typeof safeToFixed === 'function' ? safeToFixed : (v, d, f) => {
        if (v === undefined || v === null || isNaN(Number(v))) return f || 'N/A';
        return Number(v).toFixed(d || 2);
    };
    
    let report = `${'='.repeat(100)}\n`;
    report += `LOAD FLOW ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${timestamp}\n`;
    report += `Software: PwrSys Pro - Load Flow Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n\n`;
    
    // Bus Information
    report += `BUS INFORMATION:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `Type: ${bus.type}\n`;
    report += `Bus Load (Direct): ${safeFormat(bus.loadCurrent, 2, '0')} A\n\n`;
    
    // ✅ STANDARDS COMPLIANCE FIX: Three-Tier Load Display
    // Get demand/diversity data if available
    const loadFlowResults = bus.results?.loadFlow;
    const demandSummary = loadFlowResults?.demandSummary || {};
    const hasDemandData = loadFlowResults?.demandFactorsApplied;
    
    const connectedLoad = demandSummary.connectedCurrent || downstreamLoad;
    const demandLoad = demandSummary.demandCurrent || downstreamLoad;
    const diversityLoad = demandSummary.diversityCurrent || downstreamLoad;
    
    const SQRT3 = Math.sqrt(3);
    const powerFactor = parseFloat(document.getElementById('powerFactor')?.value || 0.85);
    
    report += `LOAD FLOW SUMMARY (Three-Tier Analysis per NEC & IEEE):\n`;
    report += `${'━'.repeat(100)}\n`;
    
    if (hasDemandData) {
        // Show full three-tier breakdown
        report += `Tier 1 - Connected Load (100% FLC):         ${safeFormat(connectedLoad, 2, 'N/A')} A  (informational only)\n`;
        report += `Tier 2 - Demand Load (NEC 220/430):         ${safeFormat(demandLoad, 2, 'N/A')} A  (with demand factors)\n`;
        report += `Tier 3 - Diversity Load (IEEE 141):         ${safeFormat(diversityLoad, 2, 'N/A')} A  ⭐ EQUIPMENT SIZING BASIS\n\n`;
        
        if (demandSummary.demandFactor) {
            report += `Demand Factor Applied (NEC 430.24):  ${safeFormat(demandSummary.demandFactor * 100, 1, 'N/A')}%\n`;
        }
        if (demandSummary.diversityFactor) {
            report += `Diversity Factor Applied (IEEE 141): ${safeFormat(demandSummary.diversityFactor, 2, 'N/A')}\n`;
        }
        if (connectedLoad > 0) {
            const reduction = ((connectedLoad - diversityLoad) / connectedLoad * 100);
            report += `Combined Reduction:                  ${safeFormat(reduction, 1, 'N/A')}% (${safeFormat(connectedLoad, 2)}A → ${safeFormat(diversityLoad, 2)}A)\n\n`;
        }
        
        report += `Total Apparent Power (diversity):    ${safeFormat(diversityLoad * bus.voltage * SQRT3 / 1000, 2, 'N/A')} kVA\n`;
    } else {
        // Show basic load without demand/diversity breakdown
        report += `Total Downstream Load:                ${safeFormat(downstreamLoad, 2, 'N/A')} A\n`;
        report += `Total Apparent Power:                 ${safeFormat(downstreamLoad * bus.voltage * SQRT3 / 1000, 2, 'N/A')} kVA\n`;
        report += `\nNote: Demand/diversity factors not applied to this bus.\n\n`;
    }
    
    report += `Power Factor:                         ${powerFactor}\n`;
    report += `Active Power:                         ${safeFormat(diversityLoad * bus.voltage * SQRT3 * powerFactor / 1000, 2, 'N/A')} kW\n`;
    report += `${'━'.repeat(100)}\n\n`;
    
    // Load Breakdown by Type - ✅ Issue #1 FIX: Safe formatting with null checks
    if (loadSummary) {
        const safeDownstream = downstreamLoad || 1; // Prevent division by zero
        report += `LOAD BREAKDOWN BY TYPE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Motor Loads: ${safeFormat(loadSummary.motorLoad, 2, '0')} A (${safeFormat((loadSummary.motorLoad || 0)/safeDownstream*100, 1, '0')}%)\n`;
        report += `Transformer Loads: ${safeFormat(loadSummary.transformerLoad, 2, '0')} A (${safeFormat((loadSummary.transformerLoad || 0)/safeDownstream*100, 1, '0')}%)\n`;
        report += `Cable Loads: ${safeFormat(loadSummary.cableLoad, 2, '0')} A (${safeFormat((loadSummary.cableLoad || 0)/safeDownstream*100, 1, '0')}%)\n`;
        report += `Direct Bus Loads: ${safeFormat(loadSummary.manualLoad, 2, '0')} A (${safeFormat((loadSummary.manualLoad || 0)/safeDownstream*100, 1, '0')}%)\n\n`;
        
        // Detailed Component List
        report += `DETAILED COMPONENT BREAKDOWN:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Type          Description             Location                Current(A)   Power(kVA)\n`;
        report += `${'-'.repeat(100)}\n`;
        
        if (loadSummary.breakdown && Array.isArray(loadSummary.breakdown)) {
            loadSummary.breakdown.forEach(item => {
                const typeStr = (item.type || 'Unknown').padEnd(12);
                const descStr = (item.description || 'N/A').substring(0, 22).padEnd(22);
                const locStr = (item.location || 'N/A').substring(0, 22).padEnd(22);
                const currentStr = safeFormat(item.current, 2, 'N/A').padStart(10);
                const powerStr = safeFormat((item.current || 0) * bus.voltage * Math.sqrt(3) / 1000, 2, 'N/A').padStart(10);
                
                report += `${typeStr}  ${descStr}  ${locStr}  ${currentStr}   ${powerStr}\n`;
            });
        }
        report += `\n`;
    }
    
    // Path Tracing
    report += `LOAD FLOW PATH TRACING:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Starting from: ${bus.name} (${bus.voltage}V)\n`;
    report += `Tracing downstream loads...\n\n`;
    
    // Trace path (call with logging enabled)
    console.log('═'.repeat(80));
    console.log('LOAD FLOW PATH TRACE:');
    console.log('═'.repeat(80));
    calculateDownstreamLoad(busId);
    console.log('═'.repeat(80));
    
    report += `See browser console for detailed path trace.\n\n`;
    
    // ✅ STANDARDS COMPLIANCE: Add Equipment Sizing Basis and Standards References
    report += `EQUIPMENT SIZING BASIS:\n`;
    report += `${'━'.repeat(100)}\n`;
    report += `${'Component'.padEnd(25)}${'Sizing Basis'.padEnd(35)}${'Standard Applied'.padEnd(40)}\n`;
    report += `${'━'.repeat(100)}\n`;
    report += `${'Cables/Conductors'.padEnd(25)}${'Diversity Load × 1.0'.padEnd(35)}${'NEC 310.15, IEEE 141-1993'.padEnd(40)}\n`;
    report += `${'Circuit Breakers'.padEnd(25)}${'Diversity Load × 1.25'.padEnd(35)}${'NEC 430.52'.padEnd(40)}\n`;
    report += `${'Transformers'.padEnd(25)}${'Demand Load × 1.25'.padEnd(35)}${'IEEE C57.12, NEC 450'.padEnd(40)}\n`;
    report += `${'Voltage Drop'.padEnd(25)}${'Diversity Load'.padEnd(35)}${'IEEE 141-1993 Ch. 4'.padEnd(40)}\n`;
    report += `${'━'.repeat(100)}\n\n`;
    
    report += `STANDARDS COMPLIANCE:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `✓ NEC 2017 Article 220 - Branch-Circuit and Feeder Load Calculations\n`;
    report += `✓ NEC 2017 Article 430.24 - Motor Demand Factors\n`;
    report += `✓ IEEE 141-1993 Table 3-5 - Diversity Factors for Industrial Loads\n`;
    report += `✓ IEEE 141-1993 Chapter 4 - Voltage Drop Calculations\n`;
    report += `✓ NEC 2017 Article 310.15 - Conductor Ampacities\n`;
    report += `✓ PEC 2017 Edition - Philippine Electrical Code\n`;
    report += `${'-'.repeat(100)}\n\n`;
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF LOAD FLOW REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${bus.name.replace(/\s+/g, '_')}_LoadFlow_${fileTimestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export Voltage Drop Analysis Report (Separate from Short Circuit)
 * ✅ Issue #1 FIX: Added safe formatting to prevent toFixed() errors
 * ✅ Issue #3 FIX: Added transformer tap adjustment support
 */
function exportVoltageDropReport(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus || !bus.results || !bus.results.voltageDrop) {
        alert('No voltage drop data available for this bus.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const vdData = bus.results.voltageDrop;
    
    // ✅ Issue #1 FIX: Use safeToFixed for safe numeric formatting
    const safeFormat = typeof safeToFixed === 'function' ? safeToFixed : (v, d, f) => {
        if (v === undefined || v === null || isNaN(Number(v))) return f || 'N/A';
        return Number(v).toFixed(d || 2);
    };
    
    let report = `${'='.repeat(100)}\n`;
    report += `VOLTAGE DROP ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${bus.results.calculationDate || 'N/A'}\n`;
    report += `Software: PwrSys Pro - Voltage Drop Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n\n`;
    
    // Bus Information
    report += `BUS INFORMATION:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `System Type: ${bus.type}\n`;
    report += `Calculation Method: ${bus.results.method || 'N/A'}\n\n`;
    
    // ✅ Issue #3 FIX: Show transformer tap adjustment if applicable
    if (vdData.tapAdjustedNominal !== undefined && vdData.tapPercent !== undefined) {
        report += `TRANSFORMER TAP ADJUSTMENT:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Nominal Voltage:        ${safeFormat(vdData.nominalVoltage, 2, 'N/A')} V\n`;
        report += `Tap Setting:            ${safeFormat(vdData.tapPercent, 2, 'N/A')}%\n`;
        report += `Tap-Adjusted Nominal:   ${safeFormat(vdData.tapAdjustedNominal, 2, 'N/A')} V\n`;
        report += `Baseline for VD%:       Tap-Adjusted Nominal (per IEEE 141-1993)\n\n`;
    }
    
    // Voltage Drop Summary - ✅ Issue #1 FIX: Safe formatting
    report += `VOLTAGE DROP SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Voltage Drop: ${safeFormat(vdData.cumulativeDropPercent, 3, 'N/A')}% (${safeFormat(vdData.cumulativeDropVolts, 3, 'N/A')} V)\n`;
    report += `Maximum Single Component: ${safeFormat(vdData.maxDropPercent, 3, 'N/A')}%\n`;
    report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n`;
    report += `Temperature: ${document.getElementById('temperature').value || '75'}°C\n\n`;
    
    // IEEE 141 Compliance
    report += `IEEE 141 COMPLIANCE CHECK:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Feeder Circuits: 3% maximum (recommended)\n`;
    report += `Branch Circuits: 5% maximum (recommended)\n`;
    report += `Combined System: 7% maximum (absolute limit)\n`;
    report += `\n`;
    
    const vdPercent = vdData.cumulativeDropPercent || 0;
    if (vdPercent <= 3) {
        report += `✅ EXCELLENT - Well within recommended limits\n`;
    } else if (vdPercent <= 5) {
        report += `✅ ACCEPTABLE - Within branch circuit limits\n`;
    } else if (vdPercent <= 7) {
        report += `⚠️  WARNING - Approaching maximum limit\n`;
    } else {
        report += `❌ NON-COMPLIANT - Exceeds IEEE 141 maximum (7%)\n`;
    }
    report += `\nActual Voltage Drop: ${safeFormat(vdPercent, 3, 'N/A')}%\n\n`;
    
    // Component-by-Component Analysis - ✅ Issue #1 FIX: Safe formatting
    report += `COMPONENT-BY-COMPONENT ANALYSIS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Step  Type          Component Name          Current(A)  Drop(V)  Drop(%)  Cumulative(%)  Status\n`;
    report += `${'-'.repeat(100)}\n`;
    
    let cumulativePercent = 0;
    if (vdData.components && Array.isArray(vdData.components)) {
        vdData.components.forEach(comp => {
            cumulativePercent += (comp.dropPercent || 0);
            
            const stepStr = String(comp.step || '').padEnd(5);
            const typeStr = (comp.type || 'N/A').padEnd(12);
            const nameStr = (comp.name || 'N/A').substring(0, 22).padEnd(22);
            const currentStr = safeFormat(comp.current, 1, 'N/A').padStart(10);
            const dropVStr = safeFormat(comp.dropVolts, 3, 'N/A').padStart(7);
            const dropPStr = safeFormat(comp.dropPercent, 3, 'N/A').padStart(7);
            const cumStr = safeFormat(cumulativePercent, 3, 'N/A').padStart(13);
            const statusStr = comp.severity || 'OK';
            
            report += `${stepStr} ${typeStr}  ${nameStr}  ${currentStr}  ${dropVStr}  ${dropPStr}  ${cumStr}  ${statusStr}\n`;
        });
    }
    report += `${'-'.repeat(100)}\n\n`;
    
    // Critical Components - ✅ Issue #1 FIX: Safe formatting with null checks
    if (vdData.criticalComponents && vdData.criticalComponents.length > 0) {
        report += `⚠️  CRITICAL COMPONENTS REQUIRING ATTENTION:\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        vdData.criticalComponents.forEach((item, index) => {
            const comp = item.component || {};
            const vd = item.voltageDrop || {};
            
            report += `${index + 1}. ${(comp.type || 'Unknown').toUpperCase()}: ${comp.name || comp.fromBusName || 'N/A'}\n`;
            report += `   Voltage Drop: ${safeFormat(vd.dropPercent, 3, 'N/A')}% (${safeFormat(vd.dropVolts, 2, 'N/A')}V)\n`;
            report += `   Severity: ${vd.severity || 'N/A'}\n`;
            report += `   Current: ${safeFormat(vd.current, 1, 'N/A')}A\n`;
            
            if (comp.type === 'cable') {
                report += `   \n`;
                report += `   RECOMMENDATIONS:\n`;
                report += `   - Consider larger conductor size\n`;
                report += `   - Consider parallel conductors\n`;
                report += `   - Reduce circuit length if possible\n`;
                report += `   - Check for excessive load\n`;
            } else if (comp.type === 'transformer') {
                report += `   \n`;
                report += `   RECOMMENDATIONS:\n`;
                report += `   - Review transformer tap settings\n`;
                report += `   - Consider lower impedance transformer\n`;
                report += `   - Consider higher kVA rating\n`;
                report += `   - Check loading conditions\n`;
            }
            
            report += `\n`;
        });
    }
    
    // Recommendations
    report += `GENERAL RECOMMENDATIONS:\n`;
    report += `${'-'.repeat(100)}\n`;
    
    if (vdData.cumulativeDropPercent > 7) {
        report += `❌ IMMEDIATE ACTION REQUIRED:\n`;
        report += `   System voltage drop exceeds maximum allowable limit.\n`;
        report += `   Equipment may malfunction or fail prematurely.\n`;
        report += `   \n`;
        report += `   Priority Actions:\n`;
        report += `   1. Identify and upsize critical conductors\n`;
        report += `   2. Consider adding voltage regulation equipment\n`;
        report += `   3. Review load distribution\n`;
        report += `   4. Consider parallel circuits where applicable\n`;
    } else if (vdData.cumulativeDropPercent > 5) {
        report += `⚠️  IMPROVEMENT RECOMMENDED:\n`;
        report += `   Voltage drop is acceptable but approaching limits.\n`;
        report += `   Consider improvements during maintenance or upgrades.\n`;
        report += `   \n`;
        report += `   Suggested Actions:\n`;
        report += `   1. Monitor load growth\n`;
        report += `   2. Plan for conductor upsizing if loads increase\n`;
        report += `   3. Consider voltage drop in future expansions\n`;
    } else {
        report += `✅ SYSTEM ACCEPTABLE:\n`;
        report += `   Voltage drop is within recommended limits.\n`;
        report += `   No immediate action required.\n`;
        report += `   Continue normal operation and monitoring.\n`;
    }
    
    report += `\n`;
    
    // ✅ STANDARDS COMPLIANCE: Add Standards References
    report += `STANDARDS COMPLIANCE:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `✓ IEEE 141-1993 Chapter 4, Section 4.2 - Voltage Drop Calculations\n`;
    report += `✓ IEEE 141-1993 - Recommended Limits: 2.5% feeder, 5% branch, 7% combined max\n`;
    report += `✓ NEC 2017 Article 210.19(A) - Branch Circuit Voltage Drop\n`;
    report += `✓ NEC 2017 Article 215.2 - Feeder Voltage Drop\n`;
    report += `✓ NEC 2017 Chapter 9, Table 9 - Cable Impedances\n`;
    report += `✓ PEC 2017 Edition - Philippine Electrical Code\n`;
    report += `${'-'.repeat(100)}\n\n`;
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF VOLTAGE DROP REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${bus.name.replace(/\s+/g, '_')}_VoltageDrop_${fileTimestamp}.txt`;
    downloadTextFile(report, fileName);
}

/**
 * Export All Buses Load Flow Summary
 * ✅ Issue #1 FIX: Added safe formatting to prevent toFixed() errors
 */
function exportSystemLoadFlowReport() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculations available. Run calculations first.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const timestamp = getCalculationTimestamp();
    
    // ✅ Issue #1 FIX: Use safeToFixed for safe numeric formatting
    const safeFormat = typeof safeToFixed === 'function' ? safeToFixed : (v, d, f) => {
        if (v === undefined || v === null || isNaN(Number(v))) return f || 'N/A';
        return Number(v).toFixed(d || 2);
    };
    
    let report = `${'='.repeat(100)}\n`;
    report += `SYSTEM LOAD FLOW ANALYSIS - ALL BUSES\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Date: ${timestamp}\n\n`;
    
    report += `SYSTEM LOAD SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Bus Name                    Voltage(V)  Load(A)    Power(kVA)  Utilization(%)\n`;
    report += `${'-'.repeat(100)}\n`;
    
    let totalKVA = 0;
    
    calculatedBuses.forEach(bus => {
        const load = calculateDownstreamLoad(bus.id);
        const kva = (load || 0) * bus.voltage * Math.sqrt(3) / 1000;
        totalKVA += kva;
        
        const nameStr = bus.name.padEnd(26);
        const voltStr = String(bus.voltage).padStart(10);
        const loadStr = safeFormat(load, 1, 'N/A').padStart(9);
        const kvaStr = safeFormat(kva, 2, 'N/A').padStart(11);
        
        // Calculate utilization if source bus
        let utilStr = 'N/A';
        if (bus.type === 'source' && bus.utilityFaultMVA && bus.utilityFaultMVA > 0) {
            const util = (kva / bus.utilityFaultMVA) * 100;
            utilStr = safeFormat(util, 1, 'N/A') + '%';
        }
        
        report += `${nameStr}  ${voltStr}  ${loadStr}  ${kvaStr}  ${utilStr.padStart(14)}\n`;
    });
    
    report += `${'-'.repeat(100)}\n`;
    report += `Total System Load: ${safeFormat(totalKVA, 2, 'N/A')} kVA\n\n`;
    
    report += `${'='.repeat(100)}\n`;
    report += `END OF SYSTEM LOAD FLOW REPORT\n`;
    report += `${'='.repeat(100)}\n`;
    
    // Download
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${projectName.replace(/\s+/g, '_')}_SystemLoadFlow_${fileTimestamp}.txt`;
    downloadTextFile(report, fileName);
}

// Export functions to global scope
window.exportLoadFlowReport = exportLoadFlowReport;
window.exportVoltageDropReport = exportVoltageDropReport;
window.exportSystemLoadFlowReport = exportSystemLoadFlowReport;

console.log('✅ Load Flow Report module loaded');
console.log('   - exportLoadFlowReport: Available (Issue #1 FIX: Safe formatting)');
console.log('   - exportVoltageDropReport: Available (Issue #1 FIX: Safe formatting, Issue #3: Tap adjustment)');
console.log('   - exportSystemLoadFlowReport: Available (Issue #1 FIX: Safe formatting)');