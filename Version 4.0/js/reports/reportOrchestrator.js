/**
 * Report Orchestrator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Main coordinator that assembles complete professional report
 * Integrates with Phase 1 regulatory modules
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const ReportOrchestrator = {
    /**
     * Generate full professional report
     * @param {Object} options - Report generation options
     */
    async generateFullReport(options = {}) {
        console.log('🚀 Starting full professional report generation...');
        
        try {
            // Get report options from UI
            const reportOptions = this.getReportOptions();
            
            // Gather project data
            const projectData = this.gatherProjectData(options);
            
            // Initialize PDF generator
            const pdfGen = new ProfessionalPDFGenerator(projectData);
            
            // Generate cover page
            CoverPageGenerator.generate(pdfGen, options);
            
            // Generate table of contents
            const sections = TableOfContentsGenerator.buildSections(reportOptions);
            TableOfContentsGenerator.generate(pdfGen, sections);
            
            // Generate executive summary
            ExecutiveSummaryGenerator.generate(pdfGen, projectData);
            
            // Generate short circuit analysis section
            if (reportOptions.includeShortCircuit !== false) {
                this.generateShortCircuitSection(pdfGen, projectData);
            }
            
            // Generate voltage drop analysis section
            if (reportOptions.includeVoltageDrop !== false) {
                this.generateVoltageDropSection(pdfGen, projectData);
            }
            
            // Generate arc flash analysis section
            if (reportOptions.includeArcFlash !== false) {
                this.generateArcFlashSection(pdfGen, projectData);
            }
            
            // Generate protection coordination section
            if (reportOptions.includeProtection !== false) {
                this.generateProtectionSection(pdfGen, projectData);
            }
            
            // Generate equipment schedules
            if (reportOptions.includeSchedules !== false) {
                EquipmentScheduleGenerator.generateAll(pdfGen, projectData);
            }
            
            // Generate calculation sheets (sample)
            CalculationSheetsFormatter.generate(pdfGen, projectData);
            
            // Generate appendices
            if (reportOptions.includeAppendices !== false) {
                AssumptionsPageGenerator.generate(pdfGen);
                StandardsReferenceGenerator.generate(pdfGen);
                RevisionHistoryManager.generate(pdfGen);
            }
            
            // Generate PE certification page (Phase 1 integration)
            if (reportOptions.includePECert !== false && typeof generatePECertificationPage === 'function') {
                this.integratePECertification(pdfGen);
            }
            
            // Generate final PDF
            const filename = this.generateFilename(projectData);
            pdfGen.save(filename);
            
            console.log('✅ Full professional report generated successfully');
            
            // Show success message
            this.showSuccessMessage(filename);
            
        } catch (error) {
            console.error('❌ Error generating report:', error);
            alert('Error generating report: ' + error.message);
        }
    },
    
    /**
     * Generate summary report (abbreviated version)
     */
    async generateSummaryReport() {
        console.log('📋 Generating summary report...');
        
        try {
            const projectData = this.gatherProjectData();
            const pdfGen = new ProfessionalPDFGenerator(projectData);
            
            // Cover page
            CoverPageGenerator.generate(pdfGen);
            
            // Executive summary only
            ExecutiveSummaryGenerator.generate(pdfGen, projectData);
            
            // Key equipment schedules
            EquipmentScheduleGenerator.generateSwitchboardSchedule(pdfGen, projectData);
            
            // Generate PDF
            const filename = this.generateFilename(projectData, '-Summary');
            pdfGen.save(filename);
            
            console.log('✅ Summary report generated');
            this.showSuccessMessage(filename);
            
        } catch (error) {
            console.error('❌ Error generating summary report:', error);
            alert('Error generating summary report: ' + error.message);
        }
    },
    
    /**
     * Generate specific section only
     * @param {string} sectionName - Name of section to generate
     */
    generateSection(sectionName) {
        console.log(`📄 Generating ${sectionName} section...`);
        
        try {
            const projectData = this.gatherProjectData();
            const pdfGen = new ProfessionalPDFGenerator(projectData);
            
            switch (sectionName) {
                case 'equipment':
                    EquipmentScheduleGenerator.generateAll(pdfGen, projectData);
                    break;
                case 'calculations':
                    CalculationSheetsFormatter.generate(pdfGen, projectData);
                    break;
                case 'executive':
                    ExecutiveSummaryGenerator.generate(pdfGen, projectData);
                    break;
                default:
                    throw new Error(`Unknown section: ${sectionName}`);
            }
            
            const filename = this.generateFilename(projectData, `-${sectionName}`);
            pdfGen.save(filename);
            
            console.log(`✅ ${sectionName} section generated`);
            
        } catch (error) {
            console.error(`❌ Error generating ${sectionName}:`, error);
            alert(`Error generating ${sectionName}: ` + error.message);
        }
    },
    
    /**
     * Preview report in browser
     */
    async previewReport() {
        console.log('👁️ Generating report preview...');
        
        try {
            const projectData = this.gatherProjectData();
            const pdfGen = new ProfessionalPDFGenerator(projectData);
            
            // Generate simplified report for preview
            CoverPageGenerator.generate(pdfGen);
            ExecutiveSummaryGenerator.generate(pdfGen, projectData);
            
            // Get PDF as blob
            const blob = pdfGen.getBlob();
            const url = URL.createObjectURL(blob);
            
            // Open in new window
            window.open(url, '_blank');
            
            console.log('✅ Report preview opened');
            
        } catch (error) {
            console.error('❌ Error previewing report:', error);
            alert('Error previewing report: ' + error.message);
        }
    },
    
    /**
     * Download report as file
     * @param {Object} pdf - PDF document
     * @param {string} filename - Output filename
     */
    downloadReport(pdf, filename) {
        pdf.save(filename);
    },
    
    /**
     * Get report options from UI
     * @returns {Object} Report options
     */
    getReportOptions() {
        return {
            includeShortCircuit: document.getElementById('rptShortCircuit')?.checked ?? true,
            includeVoltageDrop: document.getElementById('rptVoltageDrop')?.checked ?? true,
            includeArcFlash: document.getElementById('rptArcFlash')?.checked ?? true,
            includeProtection: document.getElementById('rptProtection')?.checked ?? true,
            includeSchedules: document.getElementById('rptSchedules')?.checked ?? true,
            includeAppendices: document.getElementById('rptAppendices')?.checked ?? true,
            includePECert: document.getElementById('rptPECert')?.checked ?? true
        };
    },
    
    /**
     * Gather all project data for report
     * @param {Object} options - Additional options
     * @returns {Object} Project data
     */
    gatherProjectData(options = {}) {
        // Get project info from Phase 1 module
        const projectInfo = typeof getProjectInfo === 'function' ? getProjectInfo() : {};
        
        // Get PE info from Phase 1 module
        const peInfo = typeof getPEInformation === 'function' ? getPEInformation() : {};
        
        // Get document control info from UI
        const docNumber = document.getElementById('docNumber')?.value || 'SCS-2026-0001';
        const docRevision = document.getElementById('docRevision')?.value || '0';
        
        // Get system data
        const buses = window.buses || [];
        
        return {
            // Project identification
            projectName: projectInfo.projectName || document.getElementById('projectName')?.value || 'Untitled Project',
            projectNumber: projectInfo.projectNumber || document.getElementById('projectNumber')?.value || '',
            
            // Document control
            docNumber,
            docRevision,
            docDate: new Date().toISOString().split('T')[0],
            
            // System data
            buses,
            
            // Additional data
            ...options
        };
    },
    
    /**
     * Generate short circuit analysis section
     */
    generateShortCircuitSection(pdfGen, projectData) {
        pdfGen.newPage('SHORT CIRCUIT ANALYSIS', 'System Fault Current Analysis');
        
        const doc = pdfGen.doc;
        let y = pdfGen.currentY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('2. SHORT CIRCUIT ANALYSIS', pdfGen.marginLeft, y);
        
        y += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        
        const introText = 'Short circuit analysis determines the maximum available fault currents at all points ' +
            'in the electrical system. This analysis is essential for proper equipment selection and ' +
            'protection device coordination per NEC 110.9 and 110.10.';
        
        const lines = doc.splitTextToSize(introText, pdfGen.contentWidth);
        lines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        pdfGen.currentY = y + lines.length * 5 + 10;
    },
    
    /**
     * Generate voltage drop analysis section
     */
    generateVoltageDropSection(pdfGen, projectData) {
        pdfGen.newPage('VOLTAGE DROP ANALYSIS', 'Circuit Voltage Drop Evaluation');
        
        const doc = pdfGen.doc;
        let y = pdfGen.currentY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('3. VOLTAGE DROP ANALYSIS', pdfGen.marginLeft, y);
        
        y += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        
        const introText = 'Voltage drop analysis verifies that voltage levels at all loads remain within ' +
            'acceptable limits per NEC 210.19(A) and 215.2(A). Feeders are limited to 3% voltage drop ' +
            'and total system voltage drop is limited to 5%.';
        
        const lines = doc.splitTextToSize(introText, pdfGen.contentWidth);
        lines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        pdfGen.currentY = y + lines.length * 5 + 10;
    },
    
    /**
     * Generate arc flash analysis section
     */
    generateArcFlashSection(pdfGen, projectData) {
        pdfGen.newPage('ARC FLASH ANALYSIS', 'Arc Flash Hazard Assessment');
        
        const doc = pdfGen.doc;
        let y = pdfGen.currentY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('4. ARC FLASH ANALYSIS', pdfGen.marginLeft, y);
        
        y += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        
        const introText = 'Arc flash analysis determines the incident energy and arc flash boundaries at ' +
            'electrical equipment per IEEE 1584-2018 and NFPA 70E-2021. This analysis identifies ' +
            'appropriate PPE requirements for personnel safety.';
        
        const lines = doc.splitTextToSize(introText, pdfGen.contentWidth);
        lines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        pdfGen.currentY = y + lines.length * 5 + 10;
    },
    
    /**
     * Generate protection coordination section
     */
    generateProtectionSection(pdfGen, projectData) {
        pdfGen.newPage('PROTECTION COORDINATION', 'Protective Device Coordination');
        
        const doc = pdfGen.doc;
        let y = pdfGen.currentY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('5. PROTECTION COORDINATION', pdfGen.marginLeft, y);
        
        y += 12;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        
        const introText = 'Protection coordination ensures that overcurrent protective devices operate in ' +
            'proper sequence to isolate faults with minimum disruption to the electrical system. ' +
            'Coordination follows IEEE 242 (Buff Book) guidelines.';
        
        const lines = doc.splitTextToSize(introText, pdfGen.contentWidth);
        lines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        pdfGen.currentY = y + lines.length * 5 + 10;
    },
    
    /**
     * Integrate PE Certification from Phase 1
     */
    integratePECertification(pdfGen) {
        console.log('🔐 Integrating PE Certification page...');
        
        pdfGen.newPage('PROFESSIONAL ENGINEER CERTIFICATION', 'Appendix D');
        
        const doc = pdfGen.doc;
        let y = pdfGen.currentY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('APPENDIX D', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.text('PROFESSIONAL ENGINEER CERTIFICATION', pdfGen.marginLeft, y);
        
        y += 12;
        
        // Get PE info
        const peInfo = typeof getPEInformation === 'function' ? getPEInformation() : {};
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        
        const certText = 'I hereby certify that this electrical power system study has been prepared under my ' +
            'direct supervision and that the calculations, analyses, and recommendations contained herein ' +
            'are in accordance with accepted electrical engineering practices and applicable codes and standards.';
        
        const lines = doc.splitTextToSize(certText, pdfGen.contentWidth);
        lines.forEach((line, index) => {
            doc.text(line, pdfGen.marginLeft, y + (index * 5));
        });
        
        y += lines.length * 5 + 15;
        
        // Signature block
        doc.setFont('helvetica', 'bold');
        doc.text('Professional Electrical Engineer:', pdfGen.marginLeft, y);
        
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.text('_'.repeat(50), pdfGen.marginLeft, y);
        doc.text(peInfo.engineerName || 'Engineer Name', pdfGen.marginLeft, y + 5);
        doc.text(`PRC License No.: ${peInfo.prcLicenseNo || 'XXXXX'}`, pdfGen.marginLeft, y + 10);
        doc.text(`PTR No.: ${peInfo.ptrNumber || 'XXXXX'} | Date: ${peInfo.ptrDate || 'MM/DD/YYYY'}`, pdfGen.marginLeft, y + 15);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pdfGen.marginLeft, y + 25);
        
        pdfGen.currentY = y + 30;
    },
    
    /**
     * Generate filename for report
     */
    generateFilename(projectData, suffix = '') {
        const projectName = (projectData.projectName || 'Project')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 30);
        
        const date = new Date().toISOString().split('T')[0];
        const docNum = projectData.docNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
        
        return `${docNum}_${projectName}${suffix}_${date}.pdf`;
    },
    
    /**
     * Show success message
     */
    showSuccessMessage(filename) {
        const message = `✅ Report generated successfully!\n\nFilename: ${filename}\n\nThe report has been downloaded to your browser's default download location.`;
        alert(message);
    }
};

// Export to global scope
window.ReportOrchestrator = ReportOrchestrator;

console.log('✅ Report Orchestrator module loaded');
