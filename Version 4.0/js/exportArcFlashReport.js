/**
 * Arc Flash Report Export Module
 * Export arc flash analysis results to text format
 * 
 * @author bfforex
 * @date 2025-11-02 16:50:12 UTC
 * @version 1.1.0
 * @modified 2025-12-01 - Issue #1 CRITICAL: Added safe formatting to prevent toFixed() errors
 */

console.log('📄 Loading Arc Flash Report Export Module v1.1.0...');

/**
 * Export arc flash report for a bus
 * ✅ Issue #1 FIX: Added safe formatting to prevent toFixed() errors
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
        
        // ✅ Issue #1 FIX: Use safeToFixed for safe numeric formatting
        const safeFormat = typeof getSafeNumberFormatter === 'function'
            ? getSafeNumberFormatter()
            : ((v, d = 2, f = 'N/A') => (v === undefined || v === null || isNaN(Number(v)) ? f : Number(v).toFixed(d)));
        
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
        report += `Date:                ${arcFlashResult.calculationDate || 'N/A'}\n`;
        report += `Bus:                 ${arcFlashResult.busTag || arcFlashResult.busName || 'N/A'}\n`;
        report += `Voltage:             ${safeFormat(arcFlashResult.voltage, 0, 'N/A')} V\n\n`;
        
        // Standards
        report += '═'.repeat(80) + '\n';
        report += 'CALCULATION STANDARDS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Calculation Method:  ${arcFlashResult.calculationMethod || 'N/A'}\n`;
        report += `Safety Standard:     ${arcFlashResult.standard || 'N/A'}\n`;
        report += `Compliance:          NEC Article 110.16\n\n`;
        
        // System parameters - ✅ Issue #1 FIX: Safe formatting
        report += '═'.repeat(80) + '\n';
        report += 'SYSTEM PARAMETERS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Bolted Fault Current:    ${safeFormat((arcFlashResult.boltedFaultCurrent || 0) / 1000, 3, 'N/A')} kA\n`;
        report += `Arcing Fault Current:    ${safeFormat(arcFlashResult.arcingCurrentKA, 3, 'N/A')} kA\n`;
        report += `Equipment Type:          ${arcFlashResult.equipmentType || 'N/A'}\n`;
        report += `Working Distance:        ${safeFormat(arcFlashResult.workingDistance, 0, 'N/A')} inches\n`;
        report += `Electrode Gap:           ${safeFormat(arcFlashResult.electrodeGap, 0, 'N/A')} mm\n`;
        report += `Clearing Time:           ${safeFormat(arcFlashResult.clearingTimeCycles, 1, 'N/A')} cycles (${safeFormat(arcFlashResult.clearingTimeSec, 3, 'N/A')} sec)\n\n`;
        
        // Results - ✅ Issue #1 FIX: Safe formatting
        report += '═'.repeat(80) + '\n';
        report += 'HAZARD ANALYSIS RESULTS\n';
        report += '═'.repeat(80) + '\n\n';
        report += `Incident Energy:         ${safeFormat(arcFlashResult.incidentEnergy, 2, 'N/A')} cal/cm²\n`;
        report += `Arc Flash Boundary:      ${safeFormat((arcFlashResult.arcFlashBoundary || 0) / 12, 2, 'N/A')} feet (${safeFormat(arcFlashResult.arcFlashBoundary, 2, 'N/A')} inches)\n`;
        report += `Hazard Level:            ${arcFlashResult.hazardLevel || 'N/A'}\n`;
        report += `PPE Category:            ${arcFlashResult.ppeCategory ?? 'N/A'}\n`;
        report += `Minimum Arc Rating:      ${arcFlashResult.ppeRequirements?.cal ?? 'N/A'} cal/cm²\n\n`;
        
        // PPE Requirements - ✅ Issue #1 FIX: Safe access
        report += '═'.repeat(80) + '\n';
        report += `PPE REQUIREMENTS - CATEGORY ${arcFlashResult.ppeCategory ?? 'N/A'}\n`;
        report += '═'.repeat(80) + '\n\n';
        report += `Required Clothing:       ${arcFlashResult.ppeRequirements?.clothing ?? 'N/A'}\n`;
        report += `Arc Rating Required:     ${arcFlashResult.ppeRequirements?.cal ?? 'N/A'} cal/cm² minimum\n\n`;
        
        report += 'PERSONAL PROTECTIVE EQUIPMENT:\n';
        report += '-'.repeat(80) + '\n\n';
        
        const ppeCategory = arcFlashResult.ppeCategory ?? 0;
        const ppeCal = arcFlashResult.ppeRequirements?.cal ?? 0;
        
        report += 'HEAD PROTECTION:\n';
        if (ppeCategory >= 2) {
            report += '  • Arc-rated face shield with wrap-around protection\n';
            report += '  • Arc-rated balaclava (sock hood)\n';
            report += '  • Hard hat (Class E)\n\n';
        } else if (ppeCategory === 1) {
            report += '  • Arc-rated face shield or arc flash suit hood\n';
            report += '  • Hard hat (Class E)\n\n';
        } else {
            report += '  • Safety glasses or face shield\n';
            report += '  • Hard hat (Class E)\n\n';
        }
        
        report += 'BODY PROTECTION:\n';
        if (ppeCategory >= 3) {
            report += '  • Arc flash suit jacket and pants\n';
            report += '  • Multi-layer system for Cat 4\n';
            report += `  • Arc-rated minimum: ${ppeCal} cal/cm²\n\n`;
        } else if (ppeCategory >= 1) {
            report += '  • Arc-rated long-sleeve shirt and pants\n';
            report += `  • Arc-rated minimum: ${ppeCal} cal/cm²\n\n`;
        } else {
            report += '  • Non-melting clothing (cotton, wool, FR treated)\n';
            report += '  • No synthetic materials\n\n';
        }
        
        report += 'HAND PROTECTION:\n';
        if (ppeCategory >= 2) {
            report += '  • Heavy-duty leather gloves over rubber insulating gloves\n';
            report += `  • Arc-rated ${ppeCal} cal/cm² minimum\n\n`;
        } else {
            report += '  • Leather work gloves or arc-rated gloves\n\n';
        }
        
        report += 'FOOT PROTECTION:\n';
        report += '  • Leather work boots (no synthetic materials)\n';
        report += '  • Steel toe (ASTM F2413)\n\n';
        
        if (ppeCategory >= 3) {
            report += 'ADDITIONAL REQUIREMENTS:\n';
            report += '  • Arc flash suit hood with integrated face shield\n';
            report += '  • Arc-rated hearing protection\n';
            report += '  • FR underwear recommended\n';
            report += '  • Second person for observation (NFPA 70E requirement)\n';
            report += '  • Consider remote operation if available\n\n';
        }
        
        // Warning label - ✅ Issue #1 FIX: Safe formatting and access
        const busNameLabel = (arcFlashResult.busTag || arcFlashResult.busName || 'N/A').substring(0, 44).padEnd(44);
        const voltageLabel = String(arcFlashResult.voltage ?? 'N/A').padEnd(44);
        const ieLabel = safeFormat(arcFlashResult.incidentEnergy, 2, 'N/A').padEnd(44);
        const boundaryLabel = safeFormat((arcFlashResult.arcFlashBoundary || 0) / 12, 1, 'N/A').padEnd(44);
        const distanceLabel = String(arcFlashResult.workingDistance ?? 'N/A').padEnd(44);
        const ppeCatLabel = String(arcFlashResult.ppeCategory ?? 'N/A').padEnd(44);
        const arcRatingLabel = String(arcFlashResult.ppeRequirements?.cal ?? 'N/A').padEnd(44);
        const dateLabel = (arcFlashResult.calculationDate || 'N/A').padEnd(44);
        
        report += '═'.repeat(80) + '\n';
        report += 'EQUIPMENT WARNING LABEL (NEC 110.16)\n';
        report += '═'.repeat(80) + '\n\n';
        report += '┌─────────────────────────────────────────────────────────────────────┐\n';
        report += '│                        ⚠️ DANGER                                     │\n';
        report += '│              ARC FLASH AND SHOCK HAZARD                             │\n';
        report += '│                                                                     │\n';
        report += `│  Equipment:           ${busNameLabel} │\n`;
        report += `│  Voltage:             ${voltageLabel} V │\n`;
        report += `│  Incident Energy:     ${ieLabel} cal/cm² │\n`;
        report += `│  Arc Flash Boundary:  ${boundaryLabel} feet │\n`;
        report += `│  Working Distance:    ${distanceLabel} inches │\n`;
        report += `│  PPE Category:        ${ppeCatLabel} │\n`;
        report += `│  Arc Rating Required: ${arcRatingLabel} cal/cm² │\n`;
        report += '│                                                                     │\n';
        report += '│  Appropriate PPE SHALL be worn when working on or near             │\n';
        report += '│  this equipment. See NFPA 70E for work practices.                  │\n';
        report += '│                                                                     │\n';
        report += `│  Last Calculated:     ${dateLabel} │\n`;
        report += '└─────────────────────────────────────────────────────────────────────┘\n\n';
        
        // Safety notes - ✅ Issue #1 FIX: Safe formatting
        report += '═'.repeat(80) + '\n';
        report += 'IMPORTANT SAFETY NOTES\n';
        report += '═'.repeat(80) + '\n\n';
        report += '1. This analysis assumes equipment is de-energized and properly locked\n';
        report += '   out before any work is performed.\n\n';
        report += '2. If energized work is required, a detailed Energized Electrical Work\n';
        report += '   Permit (EEWP) must be completed per NFPA 70E Article 130.2.\n\n';
        report += '3. Arc flash boundaries must be barricaded and marked.\n\n';
        report += `4. All personnel within the arc flash boundary must wear appropriate\n`;
        report += `   PPE with arc rating ≥ ${ppeCal} cal/cm².\n\n`;
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
        
        // ✅ STANDARDS COMPLIANCE: Add comprehensive standards references
        report += '\n' + '═'.repeat(80) + '\n';
        report += 'STANDARDS COMPLIANCE CERTIFICATION\n';
        report += '═'.repeat(80) + '\n\n';
        
        report += 'ARC FLASH ANALYSIS STANDARDS:\n';
        report += '-'.repeat(80) + '\n';
        report += '✓ IEEE 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations (Latest)\n';
        report += '✓ IEEE 1584-2002 - Guide for Performing Arc-Flash Hazard Calculations (Previous)\n';
        report += '  • Lee Method for low voltage systems (< 1000V)\n';
        report += '  • IEEE 1584 Model for medium/high voltage systems\n';
        report += '  • Arc flash boundary calculations\n';
        report += '  • Working distance standards (18" for LV, 36" for MV)\n\n';
        
        report += '✓ NFPA 70E-2021 - Standard for Electrical Safety in the Workplace\n';
        report += '  • Table 130.7(C)(15) - PPE Category Selection\n';
        report += '  • Arc-rated clothing and equipment requirements\n';
        report += '  • Safe work practices and procedures\n\n';
        
        report += '✓ NEC 2017 Article 110.16 - Flash Protection\n';
        report += '  • Arc flash warning label requirements\n';
        report += '  • Equipment labeling standards\n\n';
        
        report += '✓ IEEE 141-1993 Chapter 5 - Short-Circuit Calculations\n';
        report += '  • Fault current determination for arc flash analysis\n';
        report += '  • Motor contribution to fault levels\n\n';
        
        report += '✓ PEC 2017 - Philippine Electrical Code\n';
        report += '  • Based on NEC 2017 with regional adaptations\n';
        report += '-'.repeat(80) + '\n\n';
        
        report += 'CALCULATION METHODOLOGY:\n';
        report += '-'.repeat(80) + '\n';
        report += 'Incident Energy:     IEEE 1584-2018/2002 equations\n';
        report += 'Working Distance:    Per IEEE 1584 recommendations\n';
        report += 'PPE Categories:      NFPA 70E-2021 Table 130.7(C)(15)\n';
        report += 'Arc Flash Boundary:  Based on 1.2 cal/cm² threshold\n';
        report += 'Fault Current:       IEEE 141-1993 methods\n';
        report += '-'.repeat(80) + '\n';
        
        // Footer
        report += '\n' + '═'.repeat(80) + '\n';
        report += 'END OF ARC FLASH ANALYSIS REPORT\n';
        report += '═'.repeat(80) + '\n';
        
        // Create blob and download
        const fileName = `ArcFlash_${arcFlashResult.busName}_${new Date().toISOString().split('T')[0]}.txt`;
        if (typeof downloadFileContent === 'function') {
            downloadFileContent(report, fileName, 'text/plain');
        } else {
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        console.log('✅ Arc flash report exported successfully');
        alert('✅ Arc flash report exported successfully!');
        
    } catch (error) {
        console.error('❌ Error exporting arc flash report:', error);
        alert('Error exporting report: ' + error.message);
    }
}

/**
 * Generate arc flash label for equipment
 * ✅ Issue #1 FIX: Added safe formatting to prevent toFixed() errors
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
        
        // ✅ Issue #1 FIX: Use safeToFixed for safe numeric formatting
        const safeFormat = typeof getSafeNumberFormatter === 'function'
            ? getSafeNumberFormatter()
            : ((v, d = 2, f = 'N/A') => (v === undefined || v === null || isNaN(Number(v)) ? f : Number(v).toFixed(d)));
        
        // Generate label content
        let label = '';
        
        label += '═'.repeat(72) + '\n';
        label += '                        ⚠️ DANGER\n';
        label += '              ARC FLASH AND SHOCK HAZARD\n';
        label += '═'.repeat(72) + '\n\n';
        
        label += `Equipment:           ${arcFlashResult.busTag || arcFlashResult.busName || 'N/A'}\n`;
        label += `Voltage:             ${safeFormat(arcFlashResult.voltage, 0, 'N/A')} V\n`;
        label += `Incident Energy:     ${safeFormat(arcFlashResult.incidentEnergy, 2, 'N/A')} cal/cm²\n`;
        label += `Arc Flash Boundary:  ${safeFormat((arcFlashResult.arcFlashBoundary || 0) / 12, 1, 'N/A')} feet\n`;
        label += `Working Distance:    ${safeFormat(arcFlashResult.workingDistance, 0, 'N/A')} inches\n`;
        label += `PPE Category:        ${arcFlashResult.ppeCategory ?? 'N/A'}\n`;
        label += `Arc Rating Required: ${arcFlashResult.ppeRequirements?.cal ?? 'N/A'} cal/cm²\n\n`;
        
        label += 'Appropriate PPE SHALL be worn when working on or near this\n';
        label += 'equipment. See NFPA 70E for proper work practices.\n\n';
        
        label += `Last Calculated:     ${arcFlashResult.calculationDate || 'N/A'}\n\n`;
        
        label += '═'.repeat(72) + '\n';
        
        // Create blob and download
        const fileName = `ArcFlashLabel_${arcFlashResult.busName}.txt`;
        if (typeof downloadFileContent === 'function') {
            downloadFileContent(label, fileName, 'text/plain');
        } else {
            const blob = new Blob([label], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
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

console.log('✅ Arc Flash Report Export Module v1.1.0 loaded');
console.log('   - exportArcFlashReport: Available (Issue #1 FIX: Safe formatting)');
console.log('   - generateArcFlashLabel: Available (Issue #1 FIX: Safe formatting)');
