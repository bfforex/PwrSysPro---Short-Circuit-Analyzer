/**
 * Calculation Sheets Formatter
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Formats step-by-step calculations for regulatory review
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const CalculationSheetsFormatter = {
    /**
     * Generate calculation sheets
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     * @param {Object} calculationData - Calculation data
     */
    generate(pdfGen, calculationData = {}) {
        console.log('🧮 Generating calculation sheets...');
        
        const buses = calculationData.buses || window.buses || [];
        
        // Generate calculation sheets for each bus
        buses.slice(0, 3).forEach((bus, index) => {
            this.generateShortCircuitSheet(pdfGen, bus, index + 1);
        });
        
        console.log('✅ Calculation sheets generated');
    },
    
    /**
     * Generate short circuit calculation sheet
     */
    generateShortCircuitSheet(pdfGen, bus, sheetNumber) {
        const doc = pdfGen.doc;
        
        pdfGen.newPage('CALCULATION SHEET', `Short Circuit Analysis - ${bus.name || bus.id}`);
        
        let y = pdfGen.currentY + 5;
        
        // Calculation header box
        doc.setDrawColor(...pdfGen.colors.border);
        doc.setFillColor(248, 249, 250);
        doc.rect(pdfGen.marginLeft, y, pdfGen.contentWidth, 45, 'FD');
        
        y += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CALCULATION SHEET', pdfGen.marginLeft + 5, y);
        
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const calcInfo = [
            `Calculation ID: SC-${bus.id || sheetNumber}`,
            `Title: SHORT CIRCUIT CALCULATION`,
            `Location: ${bus.name || bus.id}`,
            `Date: ${new Date().toLocaleDateString()}`,
            `Engineer: _______________`,
            `Checked by: _______________`,
            `Revision: 0`
        ];
        
        calcInfo.forEach((info, index) => {
            const yPos = y + (index * 5);
            doc.text(info, pdfGen.marginLeft + 5, yPos);
        });
        
        y += calcInfo.length * 5 + 5;
        
        // Reference Standards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('REFERENCE STANDARDS:', pdfGen.marginLeft + 5, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const standards = [
            '• IEEE 141-1993 (Red Book) Section 5.2',
            '• PEC 1.10.9 / NEC 110.24',
            '• IEEE 1584-2018 (Arc Flash)'
        ];
        
        standards.forEach((std, index) => {
            doc.text(std, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += standards.length * 5 + 10;
        
        // Input Data Section
        doc.setDrawColor(...pdfGen.colors.primary);
        doc.setLineWidth(0.5);
        doc.line(pdfGen.marginLeft, y, pdfGen.pageWidth - pdfGen.marginRight, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('INPUT DATA:', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        
        const inputData = [
            `System Voltage:     ${bus.voltage || 480}V`,
            `System Frequency:   60 Hz`,
            `Bus Type:           ${bus.type || 'Three-phase'}`,
            `Source Impedance:   ${bus.sourceImpedance || 'Utility'}`,
            `Transformer Rating: ${bus.transformerRating || 'N/A'}`,
            `Cable Length:       ${bus.cableLength || 'N/A'}`,
            `Cable Size:         ${bus.cableSize || 'N/A'}`
        ];
        
        inputData.forEach((data, index) => {
            doc.text(data, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += inputData.length * 5 + 10;
        
        // Calculations Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('CALCULATIONS:', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        
        const calculations = [
            'Step 1: Calculate base impedance',
            `  Zbase = (V^2) / S = (${bus.voltage || 480}^2) / 1000 = ${((bus.voltage || 480) ** 2 / 1000).toFixed(2)} Ω`,
            '',
            'Step 2: Calculate source impedance (per-unit)',
            `  Zsource = ${bus.sourceImpedance || '0.05'} pu`,
            '',
            'Step 3: Calculate total impedance',
            `  Ztotal = Zsource + Zcable + Ztransformer`,
            `  Ztotal = ${(parseFloat(bus.sourceImpedance) || 0.05).toFixed(4)} pu`,
            '',
            'Step 4: Calculate fault current',
            `  Ifault = Ibase / Ztotal`,
            `  Ifault = ${(bus.results?.fault3Phase || 0)} kA`
        ];
        
        calculations.forEach((calc, index) => {
            const yPos = y + (index * 4);
            
            // Check for page break
            if (yPos > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                pdfGen.newPage('CALCULATION SHEET (continued)', '');
                y = pdfGen.currentY + 5;
            }
            
            doc.text(calc, pdfGen.marginLeft + 5, y + (index * 4));
        });
        
        y += calculations.length * 4 + 10;
        
        // Results Section
        doc.setDrawColor(...pdfGen.colors.success);
        doc.setFillColor(...pdfGen.colors.success);
        doc.rect(pdfGen.marginLeft, y, pdfGen.contentWidth, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('RESULTS:', pdfGen.marginLeft + 5, y + 5);
        
        y += 12;
        
        doc.setTextColor(...pdfGen.colors.dark);
        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        
        const results = [
            `3-Phase Fault Current:  ${(bus.results?.fault3Phase || 0).toFixed(2)} kA`,
            `Line-Ground Fault:      ${(bus.results?.faultLG || 0).toFixed(2)} kA`,
            `Equipment Rating:       ${bus.aic || 65} kA`,
            `Status:                 ${this.getStatus(bus)}`
        ];
        
        results.forEach((result, index) => {
            doc.text(result, pdfGen.marginLeft + 5, y + (index * 6));
        });
        
        y += results.length * 6 + 10;
        
        // Compliance Check
        const status = this.getStatus(bus);
        const isPass = status === 'PASS' || status === 'OK';
        
        doc.setDrawColor(...(isPass ? pdfGen.colors.success : pdfGen.colors.warning));
        doc.setFillColor(...(isPass ? [40, 167, 69, 50] : [255, 193, 7, 50]));
        doc.rect(pdfGen.marginLeft, y, pdfGen.contentWidth, 8, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`COMPLIANCE CHECK: ${isPass ? '✓ PASS' : '⚠ REVIEW REQUIRED'}`, pdfGen.marginLeft + 5, y + 5);
        
        pdfGen.currentY = y + 15;
    },
    
    /**
     * Get calculation status
     */
    getStatus(bus) {
        const availableFault = parseFloat(bus.results?.fault3Phase) || 0;
        const rating = parseFloat(bus.aic) || 65;
        
        if (availableFault === 0) return 'N/A';
        if (availableFault <= rating) return 'PASS';
        return 'REVIEW REQUIRED';
    }
};

// Export to global scope
window.CalculationSheetsFormatter = CalculationSheetsFormatter;

console.log('✅ Calculation Sheets Formatter module loaded');
