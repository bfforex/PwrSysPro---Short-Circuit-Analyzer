// Export Report Module - Handles report generation and export

/**
 * Export bus fault analysis report
 */
function exportBusReport(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus || bus.faultCurrent === null) {
        alert('No calculation results available for this bus.');
        return;
    }
    
    const method = document.querySelector('input[name="method"]:checked').value;
    const path = traceBusPath(busId);
    const result = calculatePathImpedance(path, method);
    
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const calculationTimestamp = getCalculationTimestamp();
    
    let report = `${'='.repeat(100)}\n`;
    report += `SHORT CIRCUIT ANALYSIS REPORT - BUS: ${bus.name}\n`;
    report += `${'='.repeat(100)}\n\n`;
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n`;
    report += `Calculation Method: ${result.method}\n\n`;
    
    report += `BUS INFORMATION:\n`;
    report += `-`.repeat(100) + '\n';
    report += `Name: ${bus.name}\n`;
    report += `Voltage: ${bus.voltage} V\n`;
    report += `Type: ${bus.type}\n\n`;
    
    report += `FAULT CURRENT RESULTS:\n`;
    report += `-`.repeat(100) + '\n';
    report += `Symmetrical Fault Current: ${result.faultCurrentKA.toFixed(3)} kA (${result.faultCurrent.toFixed(2)} A)\n`;
    report += `Asymmetrical (Peak) Current: ${result.asymFaultCurrentKA.toFixed(3)} kA (${result.asymFaultCurrent.toFixed(2)} A)\n`;
    report += `X/R Ratio: ${result.xrRatio.toFixed(3)}\n`;
    report += `Total Impedance: ${result.totalZ.toFixed(6)} Ω\n\n`;
    
    if (result.method === 'Per-Unit') {
        report += `PER-UNIT BASE VALUES AT TARGET BUS:\n`;
        report += `-`.repeat(100) + '\n';
        report += `Base kVA: ${result.baseKVA} kVA (CONSTANT for entire system)\n`;
        report += `Base Voltage: ${result.baseVoltage} V\n`;
        report += `Base Impedance: ${result.baseZ.toFixed(6)} Ω\n`;
        report += `Base Current: ${result.baseCurrent.toFixed(2)} A\n\n`;
        report += `PER-UNIT IMPEDANCES:\n`;
        report += `-`.repeat(100) + '\n';
        report += `R(pu): ${result.totalRpu.toFixed(6)} pu\n`;
        report += `X(pu): ${result.totalXpu.toFixed(6)} pu\n`;
        report += `Z(pu): ${result.totalZpu.toFixed(6)} pu\n\n`;
    }
    
    report += `PATH FROM SOURCE:\n`;
    report += `-`.repeat(100) + '\n';
    result.path.forEach((p, i) => {
        if (i === 0) {
            report += `${i + 1}. ${p.bus.name} (${p.bus.voltage}V) - SOURCE\n`;
        } else {
            report += `${i + 1}. ${p.component.type.toUpperCase()} → ${p.bus.name} (${p.bus.voltage}V)\n`;
        }
    });
    report += '\n\n';
    
    report += result.steps;
    
    // Create and download file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_${bus.name.replace(/\s+/g, '_')}_FaultAnalysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Export all buses summary report
 */
function exportAllBusesSummary() {
    const projectName = document.getElementById('projectName').value || 'Untitled';
    const calculationTimestamp = getCalculationTimestamp();
    
    let report = `${'='.repeat(100)}\n`;
    report += `SHORT CIRCUIT ANALYSIS SUMMARY - ALL BUSES\n`;
    report += `${'='.repeat(100)}\n\n`;
    report += `Project: ${projectName}\n`;
    report += `Project Number: ${document.getElementById('projectNumber').value || 'N/A'}\n`;
    report += `Engineer: ${document.getElementById('engineer').value || 'Unknown'}\n`;
    report += `Date: ${calculationTimestamp}\n`;
    report += `Software: PwrSys Pro - Short Circuit Analyzer v${VERSION}\n`;
    report += `Author: ${AUTHOR}\n\n`;
    
    report += `SUMMARY OF ALL BUSES:\n`;
    report += `-`.repeat(100) + '\n';
    report += `${'Bus Name'.padEnd(30)} | ${'Voltage'.padEnd(10)} | ${'Type'.padEnd(15)} | ${'Fault kA'.padEnd(12)} | ${'X/R'.padEnd(8)}\n`;
    report += `-`.repeat(100) + '\n';
    
    buses.forEach(bus => {
        const faultStr = bus.faultCurrent !== null ? bus.faultCurrent.toFixed(3) : 'N/A';
        const xrStr = bus.xrRatio !== null ? bus.xrRatio.toFixed(2) : 'N/A';
        report += `${bus.name.padEnd(30)} | ${(bus.voltage + 'V').padEnd(10)} | ${bus.type.padEnd(15)} | ${faultStr.padEnd(12)} | ${xrStr.padEnd(8)}\n`;
    });
    
    report += '\n\n';
    report += `Total Buses: ${buses.length}\n`;
    report += `Total Components: ${components.length}\n`;
    
    // Create and download file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_AllBuses_Summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
}