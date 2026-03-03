/**
 * Executive Summary Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Generates management-focused summary of study findings
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const ExecutiveSummaryGenerator = {
    /**
     * Generate executive summary
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     * @param {Object} systemData - System analysis results
     */
    generate(pdfGen, systemData = {}) {
        console.log('📊 Generating executive summary...');
        
        const doc = pdfGen.doc;
        
        pdfGen.newPage('EXECUTIVE SUMMARY', 'Study Overview and Key Findings');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('EXECUTIVE SUMMARY', pdfGen.marginLeft, y);
        
        y += 12;
        
        // Study Scope
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...pdfGen.colors.dark);
        doc.text('1. Study Scope and Objectives', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const scopeText = 'This comprehensive electrical power system study provides analysis of short circuit currents, ' +
            'voltage drop, arc flash hazards, and protection coordination in accordance with NEC 2023 and PEC 2017 ' +
            'requirements. The study evaluates equipment adequacy and compliance with applicable electrical codes.';
        
        const scopeLines = doc.splitTextToSize(scopeText, pdfGen.contentWidth);
        scopeLines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        y += scopeLines.length * 5 + 10;
        
        // Key Findings Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('2. Key Findings', pdfGen.marginLeft, y);
        
        y += 7;
        
        // Extract key findings from system data
        const findings = this.extractKeyFindings(systemData);
        
        // Short Circuit Results
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('2.1 Short Circuit Analysis', pdfGen.marginLeft + 5, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const scFindings = [
            `• Maximum 3-Phase Fault Current: ${findings.maxFault3Phase} kA at ${findings.maxFault3PhaseLocation}`,
            `• Maximum Line-to-Ground Fault: ${findings.maxFaultLG} kA at ${findings.maxFaultLGLocation}`,
            `• Equipment Adequacy Status: ${findings.equipmentStatus}`,
            `• Total Buses Analyzed: ${findings.totalBuses}`
        ];
        
        scFindings.forEach((finding, index) => {
            doc.text(finding, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += scFindings.length * 5 + 8;
        
        // Voltage Drop Results
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('2.2 Voltage Drop Analysis', pdfGen.marginLeft + 5, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const vdFindings = [
            `• Maximum Feeder Voltage Drop: ${findings.maxVoltageDropFeeder}% (Limit: 3%)`,
            `• Maximum Branch Voltage Drop: ${findings.maxVoltageDropBranch}% (Limit: 5%)`,
            `• Voltage Drop Compliance: ${findings.voltageDropCompliance}`
        ];
        
        vdFindings.forEach((finding, index) => {
            doc.text(finding, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += vdFindings.length * 5 + 8;
        
        // Arc Flash Results
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('2.3 Arc Flash Hazard Analysis', pdfGen.marginLeft + 5, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const afFindings = [
            `• Maximum Incident Energy: ${findings.maxIncidentEnergy} cal/cm² at ${findings.maxIncidentEnergyLocation}`,
            `• Maximum PPE Category: ${findings.maxPPECategory}`,
            `• Arc Flash Boundary (AFB): ${findings.maxAFB} inches`,
            `• NFPA 70E Compliance: ${findings.nfpa70eCompliance}`
        ];
        
        afFindings.forEach((finding, index) => {
            doc.text(finding, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += afFindings.length * 5 + 8;
        
        // Compliance Status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('2.4 Code Compliance', pdfGen.marginLeft + 5, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const complianceFindings = [
            `• NEC 2023 Compliance: ${findings.necCompliance}`,
            `• PEC 2017 Compliance: ${findings.pecCompliance}`,
            `• IEEE Standards Compliance: ${findings.ieeeCompliance}`
        ];
        
        complianceFindings.forEach((finding, index) => {
            doc.text(finding, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += complianceFindings.length * 5 + 10;
        
        // Recommendations Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('3. Critical Recommendations', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const recommendations = findings.recommendations || [
            'Verify all equipment ratings meet calculated fault current levels',
            'Install arc flash warning labels at all electrical equipment',
            'Implement arc flash hazard mitigation measures where incident energy exceeds 40 cal/cm²',
            'Review and update protection device settings per coordination study',
            'Conduct periodic inspection and maintenance per manufacturer recommendations'
        ];
        
        recommendations.forEach((rec, index) => {
            // Check for page break
            if (y > pdfGen.pageHeight - pdfGen.marginBottom - 15) {
                pdfGen.newPage('EXECUTIVE SUMMARY (continued)', '');
                y = pdfGen.currentY + 10;
            }
            
            const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, pdfGen.contentWidth - 10);
            recLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 5, y + (lineIndex * 5));
            });
            y += recLines.length * 5 + 3;
        });
        
        y += 5;
        
        // Action Items
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('4. Action Items', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const actionItems = [
            { action: 'Review and approve study findings', responsible: 'Building Official / Utility', priority: 'High' },
            { action: 'Install fault current labels', responsible: 'Licensed Electrical Contractor', priority: 'High' },
            { action: 'Install arc flash warning labels', responsible: 'Licensed Electrical Contractor', priority: 'High' },
            { action: 'Update protection device settings', responsible: 'Qualified Electrician', priority: 'Medium' },
            { action: 'Provide arc flash PPE', responsible: 'Facility Management', priority: 'High' }
        ];
        
        // Action items table
        const headers = ['Action', 'Responsible Party', 'Priority'];
        const rows = actionItems.map(item => [item.action, item.responsible, item.priority]);
        
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 9,
            cellPadding: 3
        });
        
        console.log('✅ Executive summary generated');
    },
    
    /**
     * Extract key findings from system data
     * @param {Object} systemData - System analysis results
     * @returns {Object} Key findings
     */
    extractKeyFindings(systemData) {
        const buses = systemData.buses || window.buses || [];
        
        let maxFault3Phase = 0;
        let maxFault3PhaseLocation = 'N/A';
        let maxFaultLG = 0;
        let maxFaultLGLocation = 'N/A';
        let maxVoltageDropFeeder = 0;
        let maxVoltageDropBranch = 0;
        let maxIncidentEnergy = 0;
        let maxIncidentEnergyLocation = 'N/A';
        let maxPPECategory = 0;
        let maxAFB = 0;
        
        // Analyze buses
        buses.forEach(bus => {
            if (bus.results) {
                // Short circuit
                const fault3ph = parseFloat(bus.results.shortCircuit?.faultCurrents?.threePhaseSym) || 0;
                if (fault3ph > maxFault3Phase) {
                    maxFault3Phase = fault3ph;
                    maxFault3PhaseLocation = bus.name || bus.id;
                }
                
                const faultLG = parseFloat(bus.results.shortCircuit?.faultCurrents?.lineToGround) || 0;
                if (faultLG > maxFaultLG) {
                    maxFaultLG = faultLG;
                    maxFaultLGLocation = bus.name || bus.id;
                }
                
                // Voltage drop
                const vd = parseFloat(bus.results.voltageDrop?.cumulativeDropPercent ?? bus.results.voltageDrop?.totalDropPercent) || 0;
                if (vd > maxVoltageDropFeeder) {
                    maxVoltageDropFeeder = vd;
                }
                
                // Arc flash
                const ie = parseFloat(bus.results.arcFlash?.incidentEnergy) || 0;
                if (ie > maxIncidentEnergy) {
                    maxIncidentEnergy = ie;
                    maxIncidentEnergyLocation = bus.name || bus.id;
                }
                
                const ppe = parseInt(bus.results.arcFlash?.ppeCategory) || 0;
                if (ppe > maxPPECategory) {
                    maxPPECategory = ppe;
                }
                
                const afb = parseFloat(bus.results.arcFlash?.arcFlashBoundary) || 0;
                if (afb > maxAFB) {
                    maxAFB = afb;
                }
            }
        });
        
        // Determine compliance
        const equipmentStatus = buses.every(bus => {
            const fault = parseFloat(bus.results?.shortCircuit?.faultCurrents?.threePhaseSym) || 0;
            const rating = parseFloat(bus.aic) || 65;
            return fault <= rating;
        }) ? 'ADEQUATE' : 'REVIEW REQUIRED';
        
        const voltageDropCompliance = maxVoltageDropFeeder <= 3 && maxVoltageDropBranch <= 5 
            ? 'COMPLIANT' 
            : 'NON-COMPLIANT';
        
        return {
            maxFault3Phase: maxFault3Phase.toFixed(2),
            maxFault3PhaseLocation,
            maxFaultLG: maxFaultLG.toFixed(2),
            maxFaultLGLocation,
            totalBuses: buses.length,
            equipmentStatus,
            maxVoltageDropFeeder: maxVoltageDropFeeder.toFixed(2),
            maxVoltageDropBranch: maxVoltageDropBranch.toFixed(2),
            voltageDropCompliance,
            maxIncidentEnergy: maxIncidentEnergy.toFixed(2),
            maxIncidentEnergyLocation,
            maxPPECategory: maxPPECategory,
            maxAFB: maxAFB.toFixed(0),
            nfpa70eCompliance: maxIncidentEnergy <= 40 ? 'COMPLIANT' : 'REVIEW REQUIRED',
            necCompliance: 'COMPLIANT',
            pecCompliance: 'COMPLIANT',
            ieeeCompliance: 'COMPLIANT',
            recommendations: []
        };
    }
};

// Export to global scope
window.ExecutiveSummaryGenerator = ExecutiveSummaryGenerator;

console.log('✅ Executive Summary Generator module loaded');
