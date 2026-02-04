/**
 * Load Flow & Voltage Drop Report Module
 * Separate reports for load flow analysis and voltage drop calculations
 * 
 * @author bfforex
 * @date 2025-10-28 00:28:22 UTC
 * @version 1.0.0
 */

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
    report += `Bus Load (Direct): ${bus.loadCurrent || 0} A\n\n`;
    
    // Load Flow Summary
    report += `LOAD FLOW SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Downstream Load: ${downstreamLoad.toFixed(2)} A\n`;
    report += `Total Apparent Power: ${(downstreamLoad * bus.voltage * Math.sqrt(3) / 1000).toFixed(2)} kVA\n`;
    report += `Power Factor: ${document.getElementById('powerFactor').value || '0.85'}\n`;
    report += `Active Power: ${(downstreamLoad * bus.voltage * Math.sqrt(3) * parseFloat(document.getElementById('powerFactor').value || 0.85) / 1000).toFixed(2)} kW\n\n`;
    
    // Load Breakdown by Type
    if (loadSummary) {
        report += `LOAD BREAKDOWN BY TYPE:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Motor Loads: ${loadSummary.motorLoad.toFixed(2)} A (${(loadSummary.motorLoad/downstreamLoad*100).toFixed(1)}%)\n`;
        report += `Transformer Loads: ${loadSummary.transformerLoad.toFixed(2)} A (${(loadSummary.transformerLoad/downstreamLoad*100).toFixed(1)}%)\n`;
        report += `Cable Loads: ${loadSummary.cableLoad.toFixed(2)} A (${(loadSummary.cableLoad/downstreamLoad*100).toFixed(1)}%)\n`;
        report += `Direct Bus Loads: ${loadSummary.manualLoad.toFixed(2)} A (${(loadSummary.manualLoad/downstreamLoad*100).toFixed(1)}%)\n\n`;
        
        // Detailed Component List
        report += `DETAILED COMPONENT BREAKDOWN:\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `Type          Description             Location                Current(A)   Power(kVA)\n`;
        report += `${'-'.repeat(100)}\n`;
        
        loadSummary.breakdown.forEach(item => {
            const typeStr = item.type.padEnd(12);
            const descStr = item.description.substring(0, 22).padEnd(22);
            const locStr = item.location.substring(0, 22).padEnd(22);
            const currentStr = item.current.toFixed(2).padStart(10);
            const powerStr = (item.current * bus.voltage * Math.sqrt(3) / 1000).toFixed(2).padStart(10);
            
            report += `${typeStr}  ${descStr}  ${locStr}  ${currentStr}   ${powerStr}\n`;
        });
        report += `\n`;
    }
    
    // Path Tracing
    report += `LOAD FLOW PATH TRACING:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Starting from: ${bus.name} (${bus.voltage}V)\n`;
    report += `Tracing downstream loads...\n\n`;
    
    // Trace path (call with logging enabled)
    logger.debug('═'.repeat(80));
    logger.debug('LOAD FLOW PATH TRACE:');
    logger.debug('═'.repeat(80));
    calculateDownstreamLoad(busId);
    logger.debug('═'.repeat(80));
    
    report += `See browser console for detailed path trace.\n\n`;
    
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
 */
function exportVoltageDropReport(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus || !bus.results || !bus.results.voltageDrop) {
        alert('No voltage drop data available for this bus.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const vdData = bus.results.voltageDrop;
    
    let report = `${'='.repeat(100)}\n`;
    report += `VOLTAGE DROP ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${bus.results.calculationDate}\n`;
    report += `Software: PwrSys Pro - Voltage Drop Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n\n`;
    
    // Bus Information
    report += `BUS INFORMATION:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `System Type: ${bus.type}\n`;
    report += `Calculation Method: ${bus.results.method}\n\n`;
    
    // Voltage Drop Summary
    report += `VOLTAGE DROP SUMMARY:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Total Voltage Drop: ${vdData.cumulativeDropPercent.toFixed(3)}% (${vdData.cumulativeDropVolts.toFixed(3)} V)\n`;
    report += `Maximum Single Component: ${vdData.maxDropPercent.toFixed(3)}%\n`;
    report += `Power Factor: ${document.getElementById('powerFactor').value || '0.9'}\n`;
    report += `Temperature: ${document.getElementById('temperature').value || '75'}°C\n\n`;
    
    // IEEE 141 Compliance
    report += `IEEE 141 COMPLIANCE CHECK:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Feeder Circuits: 3% maximum (recommended)\n`;
    report += `Branch Circuits: 5% maximum (recommended)\n`;
    report += `Combined System: 7% maximum (absolute limit)\n`;
    report += `\n`;
    
    if (vdData.cumulativeDropPercent <= 3) {
        report += `✅ EXCELLENT - Well within recommended limits\n`;
    } else if (vdData.cumulativeDropPercent <= 5) {
        report += `✅ ACCEPTABLE - Within branch circuit limits\n`;
    } else if (vdData.cumulativeDropPercent <= 7) {
        report += `⚠️  WARNING - Approaching maximum limit\n`;
    } else {
        report += `❌ NON-COMPLIANT - Exceeds IEEE 141 maximum (7%)\n`;
    }
    report += `\nActual Voltage Drop: ${vdData.cumulativeDropPercent.toFixed(3)}%\n\n`;
    
    // Component-by-Component Analysis
    report += `COMPONENT-BY-COMPONENT ANALYSIS:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Step  Type          Component Name          Current(A)  Drop(V)  Drop(%)  Cumulative(%)  Status\n`;
    report += `${'-'.repeat(100)}\n`;
    
    let cumulativePercent = 0;
    vdData.components.forEach(comp => {
        cumulativePercent += comp.dropPercent;
        
        const stepStr = comp.step.toString().padEnd(5);
        const typeStr = comp.type.padEnd(12);
        const nameStr = (comp.name || 'N/A').substring(0, 22).padEnd(22);
        const currentStr = comp.current.toFixed(1).padStart(10);
        const dropVStr = comp.dropVolts.toFixed(3).padStart(7);
        const dropPStr = comp.dropPercent.toFixed(3).padStart(7);
        const cumStr = cumulativePercent.toFixed(3).padStart(13);
        const statusStr = comp.severity;
        
        report += `${stepStr} ${typeStr}  ${nameStr}  ${currentStr}  ${dropVStr}  ${dropPStr}  ${cumStr}  ${statusStr}\n`;
    });
    report += `${'-'.repeat(100)}\n\n`;
    
    // Critical Components
    if (vdData.criticalComponents && vdData.criticalComponents.length > 0) {
        report += `⚠️  CRITICAL COMPONENTS REQUIRING ATTENTION:\n`;
        report += `${'-'.repeat(100)}\n\n`;
        
        vdData.criticalComponents.forEach((item, index) => {
            const comp = item.component;
            const vd = item.voltageDrop;
            
            report += `${index + 1}. ${comp.type.toUpperCase()}: ${comp.name || comp.fromBusName}\n`;
            report += `   Voltage Drop: ${vd.dropPercent.toFixed(3)}% (${vd.dropVolts.toFixed(2)}V)\n`;
            report += `   Severity: ${vd.severity}\n`;
            report += `   Current: ${vd.current.toFixed(1)}A\n`;
            
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
 */
function exportSystemLoadFlowReport() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculations available. Run calculations first.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const timestamp = getCalculationTimestamp();
    
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
        const kva = load * bus.voltage * Math.sqrt(3) / 1000;
        totalKVA += kva;
        
        const nameStr = bus.name.padEnd(26);
        const voltStr = bus.voltage.toString().padStart(10);
        const loadStr = load.toFixed(1).padStart(9);
        const kvaStr = kva.toFixed(2).padStart(11);
        
        // Calculate utilization if source bus
        let utilStr = 'N/A';
        if (bus.type === 'source' && bus.utilityFaultMVA) {
            const util = (kva / bus.utilityFaultMVA) * 100;
            utilStr = util.toFixed(1) + '%';
        }
        
        report += `${nameStr}  ${voltStr}  ${loadStr}  ${kvaStr}  ${utilStr.padStart(14)}\n`;
    });
    
    report += `${'-'.repeat(100)}\n`;
    report += `Total System Load: ${totalKVA.toFixed(2)} kVA\n\n`;
    
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

logger.info('Load Flow Report module loaded');