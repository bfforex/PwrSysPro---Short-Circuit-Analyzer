/**
 * Arc Flash Report Export Module
 * Export arc flash analysis results to text format
 * 
 * @author bfforex
 * @date 2025-11-02 16:50:12 UTC
 * @version 1.0.0
 */

console.log('📄 Loading Arc Flash Report Export Module...');

/**
 * Export arc flash report for a bus
 * 
 * @param {String} busId - Bus identifier
 */
function exportArcFlashReport(busId) {
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found');
            return;
        }
        
        const arcFlashResult = bus.results?.arcFlash || window.arcFlashResults?.[busId];
        
        if (!arcFlashResult) {
            alert('No arc flash data available. Please calculate arc flash first.');
            return;
        }
        
        console.log('📄 Generating arc flash report...');
        
        // Generate report content
        let report = '';
        
        // Header
        report += '═'.repeat(80) + '\n';
        report += 'ARC FLASH HAZARD ANALYSIS REPORT\n';
        report += '═'.repeat(80) + '\n\n';
        
        // Project info
        const projectName = document.getElementById('projectName')?.value || 'Untitled Project';
        const engineer = document.getElementById('engineer')?.value || 'Unknown';
        
        report += `Project:             ${projectName}\n`;
        report += `Engineer:            ${engineer}\n`;
        report += `Date:                ${arcFlashResult.calculationDate}\n`;
        report += `Bus:                 ${arcFlashResult.busTag || arcFlashResult.busName}\n`;
        report += `Voltage:             ${arcFlashResult.voltage} V\n\n`;
        
        // Standards
        report += '═'.repeat(80) + '\n';
        report += 'CALCULATION STANDARDS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Calculation Method:  ${arcFlashResult.calculationMethod}\n`;
        report += `Safety Standard:     ${arcFlashResult.standard}\n`;
        report += `Compliance:          NEC Article 110.16\n\n`;
        
        // System parameters
        report += '═'.repeat(80) + '\n';
        report += 'SYSTEM PARAMETERS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Bolted Fault Current:    ${(arcFlashResult.boltedFaultCurrent / 1000).toFixed(3)} kA\n`;
        report += `Arcing Fault Current:    ${arcFlashResult.arcingCurrentKA.toFixed(3)} kA\n`;
        report += `Equipment Type:          ${arcFlashResult.equipmentType}\n`;
        report += `Working Distance:        ${arcFlashResult.workingDistance} inches\n`;
        report += `Electrode Gap:           ${arcFlashResult.electrodeGap} mm\n`;
        report += `Clearing Time:           ${arcFlashResult.clearingTimeCycles.toFixed(1)} cycles (${arcFlashResult.clearingTimeSec.toFixed(3)} sec)\n\n`;
        
        // Results
        report += '═'.repeat(80) + '\n';
        report += 'HAZARD ANALYSIS RESULTS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Incident Energy:         ${arcFlashResult.incidentEnergy.toFixed(2)} cal/cm²\n`;
        report += `Arc Flash Boundary:      ${(arcFlashResult.arcFlashBoundary / 12).toFixed(2)} feet (${arcFlashResult.arcFlashBoundary.toFixed(2)} inches)\n`;
        report += `Hazard Level:            ${arcFlashResult.hazardLevel}\n`;
        report += `PPE Category:            ${arcFlashResult.ppeCategory}\n`;
        report += `Minimum Arc Rating:      ${arcFlashResult.ppeRequirements.cal} cal/cm²\n\n`;
        
        // PPE Requirements
        report += '═'.repeat(80) + '\n';
        report += `PPE REQUIREMENTS - CATEGORY ${arcFlashResult.ppeCategory}\n`;
        report += '═'.repeat(80) + '\n\n';
        report += `Required Clothing:       ${arcFlashResult.ppeRequirements.clothing}\n`;
        report += `Arc Rating Required:     ${arcFlashResult.ppeRequirements.cal} cal/cm² minimum\n\n`;
        
        report += 'PERSONAL PROTECTIVE EQUIPMENT:\n';
        report += '-'.repeat(80) + '\n\n';
        
        report += 'HEAD PROTECTION:\n';
        if (arcFlashResult.ppeCategory >= 2) {
            report += '  • Arc-rated face shield with wrap-around protection\n';
            report += '  • Arc-rated balaclava (sock hood)\n';
            report += '  • Hard hat (Class E)\n\n';
        } else if (arcFlashResult.ppeCategory === 1) {
            report += '  • Arc-rated face shield or arc flash suit hood\n';
            report += '  • Hard hat (Class E)\n\n';
        } else {
            report += '  • Safety glasses or face shield\n';
            report += '  • Hard hat (Class E)\n\n';
        }
        
        report += 'BODY PROTECTION:\n';
        if (arcFlashResult.ppeCategory >= 3) {
            report += '  • Arc flash suit jacket and pants\n';
            report += '  • Multi-layer system for Cat 4\n';
            report += `  • Arc-rated minimum: ${arcFlashResult.ppeRequirements.cal} cal/cm²\n\n`;
        } else if (arcFlashResult.ppeCategory >= 1) {
            report += '  • Arc-rated long-sleeve shirt and pants\n';
            report += `  • Arc-rated minimum: ${arcFlashResult.ppeRequirements.cal} cal/cm²\n\n`;
        } else {
            report += '  • Non-melting clothing (cotton, wool, FR treated)\n';
            report += '  • No synthetic materials\n\n';
        }
        
        report += 'HAND PROTECTION:\n';
        if (arcFlashResult.ppeCategory >= 2) {
            report += '  • Heavy-duty leather gloves over rubber insulating gloves\n';
            report += `  • Arc-rated ${arcFlashResult.ppeRequirements.cal} cal/cm² minimum\n\n`;
        } else {
            report += '  • Leather work gloves or arc-rated gloves\n\n';
        }
        
        report += 'FOOT PROTECTION:\n';
        report += '  • Leather work boots (no synthetic materials)\n';
        report += '  • Steel toe (ASTM F2413)\n\n';
        
        if (arcFlashResult.ppeCategory >= 3) {
            report += 'ADDITIONAL REQUIREMENTS:\n';
            report += '  • Arc flash suit hood with integrated face shield\n';
            report += '  • Arc-rated hearing protection\n';
            report += '  • FR underwear recommended\n';
            report += '  • Second person for observation (NFPA 70E requirement)\n';
            report += '  • Consider remote operation if available\n\n';
        }
        
        // Warning label
        report += '═'.repeat(80) + '\n';
        report += 'EQUIPMENT WARNING LABEL (NEC 110.16)\n';
        report += '═'.repeat(80) + '\n\n';
        report += '┌─────────────────────────────────────────────────────────────────────┐\n';
        report += '│                        ⚠️ DANGER                                     │\n';
        report += '│              ARC FLASH AND SHOCK HAZARD                             │\n';
        report += '│                                                                     │\n';
        report += `│  Equipment:           ${(arcFlashResult.busTag || arcFlashResult.busName).padEnd(44)} │\n`;
        report += `│  Voltage:             ${arcFlashResult.voltage.toString().padEnd(44)} V │\n`;
        report += `│  Incident Energy:     ${arcFlashResult.incidentEnergy.toFixed(2).padEnd(44)} cal/cm² │\n`;
        report += `│  Arc Flash Boundary:  ${(arcFlashResult.arcFlashBoundary / 12).toFixed(1).padEnd(44)} feet │\n`;
        report += `│  Working Distance:    ${arcFlashResult.workingDistance.toString().padEnd(44)} inches │\n`;
        report += `│  PPE Category:        ${arcFlashResult.ppeCategory.toString().padEnd(44)} │\n`;
        report += `│  Arc Rating Required: ${arcFlashResult.ppeRequirements.cal.toString().padEnd(44)} cal/cm² │\n`;
        report += '│                                                                     │\n';
        report += '│  Appropriate PPE SHALL be worn when working on or near             │\n';
        report += '│  this equipment. See NFPA 70E for work practices.                  │\n';
        report += '│                                                                     │\n';
        report += `│  Last Calculated:     ${arcFlashResult.calculationDate.padEnd(44)} │\n`;
        report += '└─────────────────────────────────────────────────────────────────────┘\n\n';
        
        // Safety notes
        report += '═'.repeat(80) + '\n';
        report += 'IMPORTANT SAFETY NOTES\n';
        report += '═'.repeat(80) + '\n\n';
        report += '1. This analysis assumes equipment is de-energized and properly locked\n';
        report += '   out before any work is performed.\n\n';
        report += '2. If energized work is required, a detailed Energized Electrical Work\n';
        report += '   Permit (EEWP) must be completed per NFPA 70E Article 130.2.\n\n';
        report += '3. Arc flash boundaries must be barricaded and marked.\n\n';
        report += '4. All personnel within the arc flash boundary must wear appropriate\n';
        report += `   PPE with arc rating ≥ ${arcFlashResult.ppeRequirements.cal} cal/cm².\n\n`;
        report += '5. This calculation is valid only for the system configuration and\n';
        report += '   protective device settings at the time of analysis.\n\n';
        report += '6. Re-analysis required if:\n';
        report += '   • System configuration changes\n';
        report += '   • Protective device settings change\n';
        report += '   • Available fault current changes\n';
        report += '   • Maximum of every 5 years (NFPA 70E recommendation)\n\n';
        
        // Detailed calculations
        if (arcFlashResult.calculationSteps) {
            report += '═'.repeat(80) + '\n';
            report += 'DETAILED CALCULATION STEPS\n';
            report += '═'.repeat(80) + '\n\n';
            report += arcFlashResult.calculationSteps;
        }
        
        // Footer
        report += '\n' + '═'.repeat(80) + '\n';
        report += 'END OF ARC FLASH ANALYSIS REPORT\n';
        report += '═'.repeat(80) + '\n';
        
        // Create blob and download
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ArcFlash_${arcFlashResult.busName}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Arc flash report exported successfully');
        alert('✅ Arc flash report exported successfully!');
        
    } catch (error) {
        console.error('❌ Error exporting arc flash report:', error);
        alert('Error exporting report: ' + error.message);
    }
}

/**
 * Generate arc flash label for equipment
 * 
 * @param {String} busId - Bus identifier
 */
function generateArcFlashLabel(busId) {
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found');
            return;
        }
        
        const arcFlashResult = bus.results?.arcFlash || window.arcFlashResults?.[busId];
        
        if (!arcFlashResult) {
            alert('No arc flash data available. Please calculate arc flash first.');
            return;
        }
        
        console.log('🏷️ Generating arc flash label...');
        
        // Generate label content
        let label = '';
        
        label += '═'.repeat(72) + '\n';
        label += '                        ⚠️ DANGER\n';
        label += '              ARC FLASH AND SHOCK HAZARD\n';
        label += '═'.repeat(72) + '\n\n';
        
        label += `Equipment:           ${arcFlashResult.busTag || arcFlashResult.busName}\n`;
        label += `Voltage:             ${arcFlashResult.voltage} V\n`;
        label += `Incident Energy:     ${arcFlashResult.incidentEnergy.toFixed(2)} cal/cm²\n`;
        label += `Arc Flash Boundary:  ${(arcFlashResult.arcFlashBoundary / 12).toFixed(1)} feet\n`;
        label += `Working Distance:    ${arcFlashResult.workingDistance} inches\n`;
        label += `PPE Category:        ${arcFlashResult.ppeCategory}\n`;
        label += `Arc Rating Required: ${arcFlashResult.ppeRequirements.cal} cal/cm²\n\n`;
        
        label += 'Appropriate PPE SHALL be worn when working on or near this\n';
        label += 'equipment. See NFPA 70E for proper work practices.\n\n';
        
        label += `Last Calculated:     ${arcFlashResult.calculationDate}\n\n`;
        
        label += '═'.repeat(72) + '\n';
        
        // Create blob and download
        const blob = new Blob([label], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ArcFlashLabel_${arcFlashResult.busName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Arc flash label generated successfully');
        alert('✅ Arc flash label generated successfully!');
        
    } catch (error) {
        console.error('❌ Error generating arc flash label:', error);
        alert('Error generating label: ' + error.message);
    }
}

// Export functions
window.exportArcFlashReport = exportArcFlashReport;
window.generateArcFlashLabel = generateArcFlashLabel;

console.log('✅ Arc Flash Report Export Module loaded');
console.log('   - exportArcFlashReport: Available');
console.log('   - generateArcFlashLabel: Available');