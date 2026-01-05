/**
 * Professional Cover Page Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Generates regulatory-grade cover page for building permit submissions
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const CoverPageGenerator = {
    /**
     * Generate professional cover page
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     * @param {Object} options - Cover page options
     */
    generate(pdfGen, options = {}) {
        console.log('📄 Generating cover page...');
        
        const doc = pdfGen.doc;
        const projectData = pdfGen.projectData;
        
        // Get project info and PE certification from Phase 1 modules
        const projectInfo = typeof getProjectInfo === 'function' ? getProjectInfo() : {};
        const peInfo = typeof getPEInformation === 'function' ? getPEInformation() : {};
        
        // Start new page without header/footer for cover
        doc.addPage();
        pdfGen.pageNumber++;
        
        let y = 40;
        
        // Optional company logo placeholder
        if (options.logoDataUrl) {
            try {
                doc.addImage(options.logoDataUrl, 'PNG', 80, 20, 50, 20);
                y = 50;
            } catch (error) {
                console.warn('Logo could not be added:', error);
            }
        }
        
        // Decorative top border
        doc.setDrawColor(...pdfGen.colors.primary);
        doc.setLineWidth(2);
        doc.line(20, y, 190, y);
        
        y += 15;
        
        // Document title - Large and prominent
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('SHORT CIRCUIT AND', 105, y, { align: 'center' });
        
        y += 10;
        doc.text('COORDINATION STUDY', 105, y, { align: 'center' });
        
        y += 15;
        
        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(...pdfGen.colors.dark);
        doc.text('NEC 2023 / PEC 2017 Compliant Analysis', 105, y, { align: 'center' });
        
        y += 25;
        
        // Project Information Box
        doc.setDrawColor(...pdfGen.colors.border);
        doc.setFillColor(248, 249, 250);
        doc.rect(30, y, 150, 55, 'FD');
        
        y += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('PROJECT:', 35, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const projectName = projectInfo.projectName || projectData.projectName || 'Untitled Project';
        doc.text(projectName, 35, y + 6);
        
        y += 15;
        
        // Project address
        if (projectInfo.projectAddress) {
            const addr = projectInfo.projectAddress;
            const addressLines = [
                addr.street,
                [addr.barangay, addr.city].filter(Boolean).join(', '),
                [addr.province, addr.zipCode].filter(Boolean).join(' ')
            ].filter(Boolean);
            
            addressLines.forEach((line, index) => {
                doc.text(line, 35, y + (index * 5));
            });
            y += addressLines.length * 5 + 5;
        } else {
            y += 10;
        }
        
        // Building type and details
        if (projectInfo.buildingType) {
            doc.setFontSize(9);
            doc.setTextColor(...pdfGen.colors.muted);
            doc.text(`Building Type: ${projectInfo.buildingType}`, 35, y);
            y += 5;
        }
        
        y = 130; // Reset to fixed position for consistency
        
        // PREPARED FOR section
        doc.setDrawColor(...pdfGen.colors.border);
        doc.setFillColor(255, 255, 255);
        doc.rect(30, y, 150, 30, 'FD');
        
        y += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...pdfGen.colors.dark);
        doc.text('PREPARED FOR:', 35, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Owner information
        if (projectInfo.owner && projectInfo.owner.name) {
            doc.text(projectInfo.owner.companyName || projectInfo.owner.name, 35, y);
            y += 5;
            if (projectInfo.owner.address) {
                const ownerAddr = doc.splitTextToSize(projectInfo.owner.address, 140);
                ownerAddr.forEach((line, index) => {
                    doc.text(line, 35, y + (index * 4));
                });
                y += ownerAddr.length * 4;
            }
        } else {
            doc.text('[Owner Name]', 35, y);
            y += 5;
            doc.text('[Owner Address]', 35, y);
        }
        
        y = 165; // Reset to fixed position
        
        // PREPARED BY section
        doc.setDrawColor(...pdfGen.colors.primary);
        doc.setFillColor(...pdfGen.colors.primary);
        doc.rect(30, y, 150, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('PREPARED BY:', 35, y + 5);
        
        y += 12;
        
        doc.setDrawColor(...pdfGen.colors.border);
        doc.setFillColor(255, 255, 255);
        doc.rect(30, y, 150, 35, 'FD');
        
        y += 6;
        
        doc.setTextColor(...pdfGen.colors.dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        const engineerName = peInfo.engineerName || projectInfo.engineer?.name || 'Engineer Name';
        doc.text(engineerName, 35, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // PRC License
        if (peInfo.prcLicenseNo) {
            doc.text(`Professional Electrical Engineer`, 35, y);
            y += 4;
            doc.text(`PRC License No.: ${peInfo.prcLicenseNo}`, 35, y);
            y += 4;
            doc.text(`Valid Until: ${peInfo.prcValidityDate || 'N/A'}`, 35, y);
            y += 5;
        }
        
        // PTR
        if (peInfo.ptrNumber) {
            doc.text(`PTR No.: ${peInfo.ptrNumber} | Date: ${peInfo.ptrDate || 'N/A'}`, 35, y);
            y += 4;
            doc.text(`Issued at: ${peInfo.ptrIssuedAt || 'N/A'}`, 35, y);
            y += 5;
        }
        
        // TIN
        if (peInfo.tin) {
            doc.text(`TIN: ${peInfo.tin}`, 35, y);
        }
        
        y = 218; // Fixed position for document control
        
        // Document Control Information
        doc.setDrawColor(...pdfGen.colors.border);
        doc.setFillColor(248, 249, 250);
        doc.rect(30, y, 150, 25, 'FD');
        
        y += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('DOCUMENT CONTROL:', 35, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const docNumber = projectData.docNumber || options.docNumber || 'SCS-2026-XXXX';
        const revision = projectData.docRevision || options.revision || '0';
        const docDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        doc.text(`Document No.: ${docNumber}`, 35, y);
        y += 5;
        doc.text(`Revision: ${revision}`, 35, y);
        y += 5;
        doc.text(`Date: ${docDate}`, 35, y);
        
        // Decorative bottom border
        doc.setDrawColor(...pdfGen.colors.primary);
        doc.setLineWidth(2);
        doc.line(20, 255, 190, 255);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        doc.text('Generated by PwrSys Pro - Short Circuit Analyzer v3.3', 105, 265, { align: 'center' });
        doc.text('Professional Power Systems Analysis Software', 105, 270, { align: 'center' });
        
        console.log('✅ Cover page generated');
    }
};

// Export to global scope
window.CoverPageGenerator = CoverPageGenerator;

console.log('✅ Cover Page Generator module loaded');
