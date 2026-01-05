/**
 * Standards Reference Page Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Comprehensive listing of applicable standards and codes
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const StandardsReferenceGenerator = {
    /**
     * Generate standards reference page
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     */
    generate(pdfGen) {
        console.log('📚 Generating standards reference page...');
        
        const doc = pdfGen.doc;
        
        pdfGen.newPage('APPENDIX B: STANDARDS REFERENCES', 'Applicable Codes and Standards');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('APPENDIX B', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFontSize(12);
        doc.text('STANDARDS REFERENCES', pdfGen.marginLeft, y);
        
        y += 12;
        
        // Philippine Standards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...pdfGen.colors.dark);
        doc.text('1. Philippine Standards and Regulations', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const phStandards = [
            {
                code: 'PEC 2017',
                title: 'Philippine Electrical Code, 2017 Edition',
                description: 'Primary electrical code for Philippines, based on NEC 2017'
            },
            {
                code: 'NBCP 2015',
                title: 'National Building Code of the Philippines',
                description: 'Building construction and safety requirements'
            },
            {
                code: 'Fire Code',
                title: 'Fire Code of the Philippines (RA 9514)',
                description: 'Fire safety and prevention requirements'
            },
            {
                code: 'ERC Resolution',
                title: 'Energy Regulatory Commission Guidelines',
                description: 'Utility interconnection and metering requirements'
            }
        ];
        
        phStandards.forEach((std, index) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${std.code}:`, pdfGen.marginLeft + 5, y);
            
            doc.setFont('helvetica', 'normal');
            const titleLines = doc.splitTextToSize(`${std.title}`, pdfGen.contentWidth - 15);
            titleLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (lineIndex * 4));
            });
            
            doc.setFontSize(9);
            doc.setTextColor(...pdfGen.colors.muted);
            const descLines = doc.splitTextToSize(`(${std.description})`, pdfGen.contentWidth - 15);
            descLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (titleLines.length * 4) + (lineIndex * 4));
            });
            
            doc.setFontSize(10);
            doc.setTextColor(...pdfGen.colors.dark);
            
            y += 5 + (titleLines.length * 4) + (descLines.length * 4) + 5;
        });
        
        y += 5;
        
        // IEEE Standards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2. IEEE Standards', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const ieeeStandards = [
            {
                code: 'IEEE 141-1993',
                title: 'Red Book - Electric Power Distribution for Industrial Plants',
                description: 'Short circuit calculations and protection coordination'
            },
            {
                code: 'IEEE 242-2001',
                title: 'Buff Book - Protection and Coordination of Industrial and Commercial Power Systems',
                description: 'Protective device coordination'
            },
            {
                code: 'IEEE 1584-2018',
                title: 'Guide for Performing Arc Flash Hazard Calculations',
                description: 'Arc flash incident energy and boundary calculations'
            },
            {
                code: 'IEEE 142-2007',
                title: 'Green Book - Grounding of Industrial and Commercial Power Systems',
                description: 'Grounding system design and analysis'
            },
            {
                code: 'IEEE 399-1997',
                title: 'Brown Book - Power Systems Analysis',
                description: 'Load flow and short circuit analysis methods'
            }
        ];
        
        ieeeStandards.forEach((std, index) => {
            // Check for page break
            if (y > pdfGen.pageHeight - pdfGen.marginBottom - 30) {
                pdfGen.newPage('APPENDIX B (continued)', '');
                y = pdfGen.currentY + 5;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${std.code}:`, pdfGen.marginLeft + 5, y);
            
            doc.setFont('helvetica', 'normal');
            const titleLines = doc.splitTextToSize(`${std.title}`, pdfGen.contentWidth - 15);
            titleLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (lineIndex * 4));
            });
            
            doc.setFontSize(9);
            doc.setTextColor(...pdfGen.colors.muted);
            const descLines = doc.splitTextToSize(`(${std.description})`, pdfGen.contentWidth - 15);
            descLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (titleLines.length * 4) + (lineIndex * 4));
            });
            
            doc.setFontSize(10);
            doc.setTextColor(...pdfGen.colors.dark);
            
            y += 5 + (titleLines.length * 4) + (descLines.length * 4) + 5;
        });
        
        y += 5;
        
        // NEC Standards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('3. National Electrical Code (NEC) 2023', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const necArticles = [
            'Article 110 - Requirements for Electrical Installations',
            'Article 110.9 - Interrupting Rating',
            'Article 110.10 - Circuit Impedance and Short-Circuit Ratings',
            'Article 110.24 - Available Fault Current',
            'Article 210 - Branch Circuits',
            'Article 215 - Feeders',
            'Article 240 - Overcurrent Protection',
            'Article 250 - Grounding and Bonding',
            'Article 310 - Conductors for General Wiring',
            'Article 408 - Switchboards and Panelboards',
            'Article 430 - Motors and Motor Controllers',
            'Article 450 - Transformers'
        ];
        
        necArticles.forEach((article, index) => {
            if (y > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                pdfGen.newPage('APPENDIX B (continued)', '');
                y = pdfGen.currentY + 5;
            }
            doc.text(`• ${article}`, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        y += necArticles.length * 5 + 10;
        
        // Safety Standards
        if (y > pdfGen.pageHeight - pdfGen.marginBottom - 40) {
            pdfGen.newPage('APPENDIX B (continued)', '');
            y = pdfGen.currentY + 5;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('4. Safety Standards', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const safetyStandards = [
            {
                code: 'NFPA 70E-2021',
                title: 'Standard for Electrical Safety in the Workplace',
                description: 'Arc flash PPE requirements and electrical safety practices'
            },
            {
                code: 'OSHA 1910',
                title: 'Occupational Safety and Health Standards',
                description: 'Workplace electrical safety requirements'
            }
        ];
        
        safetyStandards.forEach((std, index) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${std.code}:`, pdfGen.marginLeft + 5, y);
            
            doc.setFont('helvetica', 'normal');
            const titleLines = doc.splitTextToSize(`${std.title}`, pdfGen.contentWidth - 15);
            titleLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (lineIndex * 4));
            });
            
            doc.setFontSize(9);
            doc.setTextColor(...pdfGen.colors.muted);
            const descLines = doc.splitTextToSize(`(${std.description})`, pdfGen.contentWidth - 15);
            descLines.forEach((line, lineIndex) => {
                doc.text(line, pdfGen.marginLeft + 10, y + 5 + (titleLines.length * 4) + (lineIndex * 4));
            });
            
            doc.setFontSize(10);
            doc.setTextColor(...pdfGen.colors.dark);
            
            y += 5 + (titleLines.length * 4) + (descLines.length * 4) + 5;
        });
        
        y += 5;
        
        // Equipment Standards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('5. Equipment Standards', pdfGen.marginLeft, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const equipmentStandards = [
            'UL 489 - Molded-Case Circuit Breakers',
            'UL 1066 - Low-Voltage AC and DC Power Circuit Breakers',
            'UL 508 - Industrial Control Equipment',
            'IEC 60947 - Low-Voltage Switchgear and Controlgear',
            'IEC 60076 - Power Transformers',
            'IEC 60364 - Electrical Installations of Buildings'
        ];
        
        equipmentStandards.forEach((std, index) => {
            if (y + 5 > pdfGen.pageHeight - pdfGen.marginBottom - 10) {
                pdfGen.newPage('APPENDIX B (continued)', '');
                y = pdfGen.currentY + 5;
            }
            doc.text(`• ${std}`, pdfGen.marginLeft + 5, y + (index * 5));
        });
        
        pdfGen.currentY = y + equipmentStandards.length * 5 + 5;
        
        console.log('✅ Standards reference page generated');
    }
};

// Export to global scope
window.StandardsReferenceGenerator = StandardsReferenceGenerator;

console.log('✅ Standards Reference Generator module loaded');
