/**
 * Assumptions Page Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Standard assumptions and limitations for electrical studies
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const AssumptionsPageGenerator = {
    /**
     * Generate assumptions and limitations page
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     */
    generate(pdfGen) {
        console.log('📋 Generating assumptions page...');
        
        const doc = pdfGen.doc;
        
        pdfGen.newPage('APPENDIX A: ASSUMPTIONS AND LIMITATIONS', 'Study Basis');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('APPENDIX A', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFontSize(12);
        doc.text('ASSUMPTIONS AND LIMITATIONS', pdfGen.marginLeft, y);
        
        y += 12;
        
        // System Assumptions
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...pdfGen.colors.dark);
        doc.text('1. System Assumptions', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const systemAssumptions = [
            '• System frequency: 60 Hz',
            '• Ambient temperature: 30°C (unless otherwise specified)',
            '• Power factor: 0.9 lagging (typical)',
            '• Voltage tolerance: ±10% of nominal',
            '• Balanced three-phase system',
            '• Steady-state operating conditions'
        ];
        
        systemAssumptions.forEach((assumption, index) => {
            doc.text(assumption, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += systemAssumptions.length * 5 + 10;
        
        // Utility Source Data
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2. Utility Source Data Assumptions', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const utilityAssumptions = [
            '• Utility source data based on utility company information or typical values',
            '• Available fault current at service entrance as specified by utility',
            '• Utility system X/R ratio assumed based on system voltage level',
            '• Maximum and minimum utility contributions considered',
            '• Future system expansion not included unless specifically noted'
        ];
        
        utilityAssumptions.forEach((assumption, index) => {
            const lines = doc.splitTextToSize(assumption, pdfGen.contentWidth - 10);
            lines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 5, y + (index * 10) + (lineIndex * 5));
            });
        });
        
        y += utilityAssumptions.length * 10 + 5;
        
        // Equipment Impedance
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('3. Equipment Impedance Assumptions', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const equipmentAssumptions = [
            '• Transformer impedances based on nameplate data or typical values',
            '• Cable impedances calculated per NEC Chapter 9',
            '• Motor contribution included per IEEE 141-1993 recommendations',
            '• Generator impedances based on manufacturer data when available',
            '• Arc resistance not included in short circuit calculations (conservative)'
        ];
        
        equipmentAssumptions.forEach((assumption, index) => {
            const lines = doc.splitTextToSize(assumption, pdfGen.contentWidth - 10);
            lines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 5, y + (index * 10) + (lineIndex * 5));
            });
        });
        
        y += equipmentAssumptions.length * 10 + 5;
        
        // Calculation Methodology
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('4. Calculation Methodology', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const methodology = [
            '• Short circuit calculations per IEEE 141-1993 (Red Book)',
            '• Voltage drop calculations per NEC 210.19 and 215.2',
            '• Arc flash calculations per IEEE 1584-2018',
            '• Per-unit method used for complex system analysis',
            '• Point-to-point method used for radial system analysis',
            '• All calculations performed at maximum fault conditions unless noted'
        ];
        
        methodology.forEach((item, index) => {
            const lines = doc.splitTextToSize(item, pdfGen.contentWidth - 10);
            lines.forEach((line, lineIndex) => {
                // Check for page break
                if (y + (index * 10) + (lineIndex * 5) > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                    pdfGen.newPage('APPENDIX A (continued)', '');
                    y = pdfGen.currentY + 5;
                }
                doc.text(line, pdfGen.marginLeft + 5, y + (index * 10) + (lineIndex * 5));
            });
        });
        
        y += methodology.length * 10 + 5;
        
        // Study Limitations
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('5. Study Limitations', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const limitations = [
            '• Study based on design documents; field verification required',
            '• Equipment ratings and settings subject to final equipment selection',
            '• Future system modifications may require study update',
            '• Study does not cover transient stability or harmonic analysis',
            '• Lightning protection and surge analysis not included',
            '• Study valid for current system configuration only'
        ];
        
        limitations.forEach((limitation, index) => {
            const lines = doc.splitTextToSize(limitation, pdfGen.contentWidth - 10);
            lines.forEach((line, lineIndex) => {
                if (y + (index * 10) + (lineIndex * 5) > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                    pdfGen.newPage('APPENDIX A (continued)', '');
                    y = pdfGen.currentY + 5;
                }
                doc.text(line, pdfGen.marginLeft + 5, y + (index * 10) + (lineIndex * 5));
            });
        });
        
        y += limitations.length * 10 + 5;
        
        // Field Verification
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('6. Field Verification Requirements', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const verification = [
            '• Verify all equipment nameplate data matches study assumptions',
            '• Confirm cable routing and lengths as installed',
            '• Verify utility service data with actual utility coordination',
            '• Test and calibrate all protection devices',
            '• Update arc flash labels if system modifications occur',
            '• Periodic review recommended every 5 years or upon major modifications'
        ];
        
        verification.forEach((item, index) => {
            const lines = doc.splitTextToSize(item, pdfGen.contentWidth - 10);
            lines.forEach((line, lineIndex) => {
                if (y + (index * 10) + (lineIndex * 5) > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                    pdfGen.newPage('APPENDIX A (continued)', '');
                    y = pdfGen.currentY + 5;
                }
                doc.text(line, pdfGen.marginLeft + 5, y + (index * 10) + (lineIndex * 5));
            });
        });
        
        pdfGen.currentY = y + verification.length * 10 + 5;
        
        console.log('✅ Assumptions page generated');
    }
};

// Export to global scope
window.AssumptionsPageGenerator = AssumptionsPageGenerator;

console.log('✅ Assumptions Page Generator module loaded');
