/**
 * Table of Contents Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Auto-generates TOC with page numbers and hierarchical structure
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const TableOfContentsGenerator = {
    /**
     * Generate table of contents
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     * @param {Array} sections - Array of section objects with {title, level, page}
     */
    generate(pdfGen, sections = []) {
        console.log('📑 Generating table of contents...');
        
        const doc = pdfGen.doc;
        
        pdfGen.newPage('TABLE OF CONTENTS', '');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('TABLE OF CONTENTS', pdfGen.marginLeft, y);
        
        y += 15;
        
        doc.setTextColor(...pdfGen.colors.dark);
        
        // Default sections if none provided
        if (sections.length === 0) {
            sections = this.getDefaultSections();
        }
        
        // Generate TOC entries
        sections.forEach((section, index) => {
            // Check for page break
            if (y > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                pdfGen.newPage('TABLE OF CONTENTS (continued)', '');
                y = pdfGen.currentY + 10;
            }
            
            const indent = (section.level - 1) * 10;
            const fontSize = section.level === 1 ? 11 : 10;
            const fontStyle = section.level === 1 ? 'bold' : 'normal';
            
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            
            // Section number and title
            const sectionText = section.number ? `${section.number}. ${section.title}` : section.title;
            const textWidth = doc.getTextWidth(sectionText);
            
            doc.text(sectionText, pdfGen.marginLeft + indent, y);
            
            // Dot leaders
            const dotsX = pdfGen.marginLeft + indent + textWidth + 3;
            const pageNumX = pdfGen.pageWidth - pdfGen.marginRight - 15;
            
            if (dotsX < pageNumX) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                const dots = '.'.repeat(Math.floor((pageNumX - dotsX) / 1.5));
                doc.text(dots, dotsX, y);
            }
            
            // Page number
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.text(String(section.page || index + 3), pageNumX, y);
            
            y += section.level === 1 ? 8 : 6;
        });
        
        pdfGen.currentY = y;
        
        console.log('✅ Table of contents generated');
    },
    
    /**
     * Get default section structure
     * @returns {Array} Default sections
     */
    getDefaultSections() {
        return [
            { number: '1', title: 'Executive Summary', level: 1, page: 3 },
            { number: '2', title: 'Short Circuit Analysis', level: 1, page: 4 },
            { number: '2.1', title: 'System Overview', level: 2, page: 4 },
            { number: '2.2', title: 'Fault Current Calculations', level: 2, page: 5 },
            { number: '2.3', title: 'Equipment Adequacy Assessment', level: 2, page: 6 },
            { number: '3', title: 'Voltage Drop Analysis', level: 1, page: 7 },
            { number: '3.1', title: 'Feeder Voltage Drop', level: 2, page: 7 },
            { number: '3.2', title: 'Branch Circuit Voltage Drop', level: 2, page: 8 },
            { number: '4', title: 'Arc Flash Analysis', level: 1, page: 9 },
            { number: '4.1', title: 'Arc Flash Hazard Assessment', level: 2, page: 9 },
            { number: '4.2', title: 'PPE Category Determination', level: 2, page: 10 },
            { number: '5', title: 'Protection Coordination', level: 1, page: 11 },
            { number: '6', title: 'Equipment Schedules', level: 1, page: 12 },
            { number: '6.1', title: 'Transformer Schedule', level: 2, page: 12 },
            { number: '6.2', title: 'Switchboard Schedule', level: 2, page: 13 },
            { number: '6.3', title: 'Motor Schedule', level: 2, page: 14 },
            { number: '6.4', title: 'Cable Schedule', level: 2, page: 15 },
            { number: '6.5', title: 'Protection Device Schedule', level: 2, page: 16 },
            { number: 'A', title: 'Appendix A: Assumptions and Limitations', level: 1, page: 17 },
            { number: 'B', title: 'Appendix B: Standards References', level: 1, page: 18 },
            { number: 'C', title: 'Appendix C: Revision History', level: 1, page: 19 },
            { number: 'D', title: 'Appendix D: Professional Engineer Certification', level: 1, page: 20 }
        ];
    },
    
    /**
     * Build sections array from project data
     * @param {Object} projectData - Project data with calculated results
     * @returns {Array} Sections with page numbers
     */
    buildSections(projectData) {
        const sections = [];
        let pageNum = 3; // Start after cover and TOC
        
        // Executive Summary
        sections.push({ number: '1', title: 'Executive Summary', level: 1, page: pageNum++ });
        
        // Short Circuit Analysis
        if (projectData.includeShortCircuit !== false) {
            sections.push({ number: '2', title: 'Short Circuit Analysis', level: 1, page: pageNum });
            sections.push({ number: '2.1', title: 'System Overview', level: 2, page: pageNum++ });
            sections.push({ number: '2.2', title: 'Fault Current Calculations', level: 2, page: pageNum++ });
            sections.push({ number: '2.3', title: 'Equipment Adequacy Assessment', level: 2, page: pageNum++ });
        }
        
        // Voltage Drop Analysis
        if (projectData.includeVoltageDrop !== false) {
            sections.push({ number: '3', title: 'Voltage Drop Analysis', level: 1, page: pageNum });
            sections.push({ number: '3.1', title: 'Feeder Analysis', level: 2, page: pageNum++ });
            sections.push({ number: '3.2', title: 'Branch Circuits', level: 2, page: pageNum++ });
        }
        
        // Arc Flash Analysis
        if (projectData.includeArcFlash !== false) {
            sections.push({ number: '4', title: 'Arc Flash Analysis', level: 1, page: pageNum });
            sections.push({ number: '4.1', title: 'Hazard Assessment', level: 2, page: pageNum++ });
            sections.push({ number: '4.2', title: 'PPE Requirements', level: 2, page: pageNum++ });
        }
        
        // Protection Coordination
        if (projectData.includeProtection !== false) {
            sections.push({ number: '5', title: 'Protection Coordination', level: 1, page: pageNum++ });
        }
        
        // Equipment Schedules
        if (projectData.includeSchedules !== false) {
            sections.push({ number: '6', title: 'Equipment Schedules', level: 1, page: pageNum });
            sections.push({ number: '6.1', title: 'Transformer Schedule', level: 2, page: pageNum++ });
            sections.push({ number: '6.2', title: 'Switchboard Schedule', level: 2, page: pageNum++ });
            sections.push({ number: '6.3', title: 'Motor Schedule', level: 2, page: pageNum++ });
            sections.push({ number: '6.4', title: 'Cable Schedule', level: 2, page: pageNum++ });
            sections.push({ number: '6.5', title: 'Protection Device Schedule', level: 2, page: pageNum++ });
        }
        
        // Appendices
        if (projectData.includeAppendices !== false) {
            sections.push({ number: 'A', title: 'Appendix A: Assumptions and Limitations', level: 1, page: pageNum++ });
            sections.push({ number: 'B', title: 'Appendix B: Standards References', level: 1, page: pageNum++ });
            sections.push({ number: 'C', title: 'Appendix C: Revision History', level: 1, page: pageNum++ });
        }
        
        // PE Certification
        if (projectData.includePECert !== false) {
            sections.push({ number: 'D', title: 'Appendix D: Professional Engineer Certification', level: 1, page: pageNum++ });
        }
        
        return sections;
    }
};

// Export to global scope
window.TableOfContentsGenerator = TableOfContentsGenerator;

console.log('✅ Table of Contents Generator module loaded');
