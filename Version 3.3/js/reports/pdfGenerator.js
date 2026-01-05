/**
 * Professional PDF Generator Core
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Comprehensive PDF generation engine for regulatory-grade reports
 * Supports NEC/PEC compliant documentation
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

class ProfessionalPDFGenerator {
    constructor(projectData = {}) {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf || window;
        this.doc = new jsPDF('p', 'mm', 'a4');
        
        this.projectData = projectData;
        this.pageNumber = 0;
        this.tocEntries = [];
        this.currentY = 0;
        
        // Page dimensions (A4)
        this.pageWidth = 210;
        this.pageHeight = 297;
        this.marginLeft = 20;
        this.marginRight = 20;
        this.marginTop = 25;
        this.marginBottom = 25;
        this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
        this.contentHeight = this.pageHeight - this.marginTop - this.marginBottom;
        
        // Professional color scheme
        this.colors = {
            primary: [102, 126, 234],
            secondary: [118, 75, 162],
            success: [40, 167, 69],
            warning: [255, 193, 7],
            danger: [220, 53, 69],
            dark: [51, 51, 51],
            muted: [108, 117, 125],
            lightGray: [248, 249, 250],
            border: [224, 224, 224]
        };
        
        // Default font settings
        this.defaultFont = 'helvetica';
        this.defaultFontSize = 10;
        
        console.log('✅ ProfessionalPDFGenerator initialized');
    }
    
    /**
     * Add professional header to page
     * @param {string} title - Document title
     * @param {string} subtitle - Document subtitle
     */
    addHeader(title = '', subtitle = '') {
        const headerHeight = 20;
        
        // Header background
        this.doc.setFillColor(...this.colors.primary);
        this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
        
        // Header text
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont(this.defaultFont, 'bold');
        this.doc.setFontSize(12);
        this.doc.text(title || 'SHORT CIRCUIT ANALYSIS REPORT', this.marginLeft, 10);
        
        if (subtitle) {
            this.doc.setFont(this.defaultFont, 'normal');
            this.doc.setFontSize(9);
            this.doc.text(subtitle, this.marginLeft, 15);
        }
        
        // Project info in header (right side)
        if (this.projectData.projectName) {
            this.doc.setFontSize(8);
            const projectText = this.projectData.projectName.substring(0, 40);
            this.doc.text(projectText, this.pageWidth - this.marginRight, 10, { align: 'right' });
        }
        
        // Reset text color
        this.doc.setTextColor(...this.colors.dark);
        
        // Set current Y position below header
        this.currentY = headerHeight + 5;
    }
    
    /**
     * Add professional footer to page
     * @param {string} docNumber - Document control number
     * @param {string} revision - Document revision
     */
    addFooter(docNumber = '', revision = '0') {
        const footerY = this.pageHeight - 15;
        
        // Footer line
        this.doc.setDrawColor(...this.colors.border);
        this.doc.line(this.marginLeft, footerY - 5, this.pageWidth - this.marginRight, footerY - 5);
        
        // Footer text
        this.doc.setFont(this.defaultFont, 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.colors.muted);
        
        // Left: Document control
        const docInfo = docNumber ? `Doc. No: ${docNumber} | Rev: ${revision}` : 'PwrSys Pro - Short Circuit Analyzer';
        this.doc.text(docInfo, this.marginLeft, footerY);
        
        // Center: Date
        const dateStr = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        this.doc.text(dateStr, this.pageWidth / 2, footerY, { align: 'center' });
        
        // Right: Page number
        const totalPages = this.doc.internal.getNumberOfPages();
        const pageText = `Page ${this.pageNumber} of ${totalPages}`;
        this.doc.text(pageText, this.pageWidth - this.marginRight, footerY, { align: 'right' });
        
        // Reset text color
        this.doc.setTextColor(...this.colors.dark);
    }
    
    /**
     * Add new page with header and footer
     * @param {string} title - Page title
     * @param {string} subtitle - Page subtitle
     */
    newPage(title = '', subtitle = '') {
        if (this.pageNumber > 0) {
            this.doc.addPage();
        }
        this.pageNumber++;
        
        this.addHeader(title, subtitle);
        this.addFooter(
            this.projectData.docNumber || '',
            this.projectData.docRevision || '0'
        );
        
        this.currentY = this.marginTop;
    }
    
    /**
     * Add text with automatic line wrapping
     * @param {string} text - Text to add
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Text options (fontSize, fontStyle, maxWidth, align)
     * @returns {number} Final Y position after text
     */
    addText(text, x = null, y = null, options = {}) {
        const {
            fontSize = this.defaultFontSize,
            fontStyle = 'normal',
            maxWidth = this.contentWidth,
            align = 'left',
            color = this.colors.dark
        } = options;
        
        x = x !== null ? x : this.marginLeft;
        y = y !== null ? y : this.currentY;
        
        this.doc.setFont(this.defaultFont, fontStyle);
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...color);
        
        const lines = this.doc.splitTextToSize(text, maxWidth);
        const lineHeight = fontSize * 0.4;
        
        lines.forEach((line, index) => {
            const lineY = y + (index * lineHeight);
            
            // Check if we need a new page
            if (lineY > this.pageHeight - this.marginBottom - 10) {
                this.newPage();
                y = this.currentY;
            }
            
            this.doc.text(line, x, lineY, { align });
        });
        
        this.currentY = y + (lines.length * lineHeight);
        this.doc.setTextColor(...this.colors.dark);
        
        return this.currentY;
    }
    
    /**
     * Add formatted table
     * @param {Array} headers - Table headers
     * @param {Array} rows - Table data rows
     * @param {Object} options - Table options
     */
    addTable(headers, rows, options = {}) {
        const {
            startY = this.currentY,
            headerColor = this.colors.primary,
            alternateRows = true,
            fontSize = 9,
            cellPadding = 3
        } = options;
        
        let y = startY;
        const colWidth = this.contentWidth / headers.length;
        const rowHeight = 7;
        
        // Check if table fits on current page
        const tableHeight = (rows.length + 1) * rowHeight;
        if (y + tableHeight > this.pageHeight - this.marginBottom) {
            this.newPage();
            y = this.currentY;
        }
        
        // Draw header
        this.doc.setFillColor(...headerColor);
        this.doc.rect(this.marginLeft, y, this.contentWidth, rowHeight, 'F');
        
        this.doc.setFont(this.defaultFont, 'bold');
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(255, 255, 255);
        
        headers.forEach((header, i) => {
            const x = this.marginLeft + (i * colWidth) + cellPadding;
            this.doc.text(String(header), x, y + 5);
        });
        
        y += rowHeight;
        
        // Draw rows
        this.doc.setFont(this.defaultFont, 'normal');
        this.doc.setTextColor(...this.colors.dark);
        
        rows.forEach((row, rowIndex) => {
            // Alternate row colors
            if (alternateRows && rowIndex % 2 === 0) {
                this.doc.setFillColor(...this.colors.lightGray);
                this.doc.rect(this.marginLeft, y, this.contentWidth, rowHeight, 'F');
            }
            
            // Check for page break
            if (y + rowHeight > this.pageHeight - this.marginBottom) {
                this.newPage();
                y = this.currentY;
            }
            
            // Draw cells
            headers.forEach((header, i) => {
                const x = this.marginLeft + (i * colWidth) + cellPadding;
                const cellText = String(row[i] || '');
                const truncated = cellText.length > 20 ? cellText.substring(0, 17) + '...' : cellText;
                this.doc.text(truncated, x, y + 5);
            });
            
            // Draw border
            this.doc.setDrawColor(...this.colors.border);
            this.doc.rect(this.marginLeft, y, this.contentWidth, rowHeight);
            
            y += rowHeight;
        });
        
        this.currentY = y + 5;
    }
    
    /**
     * Add calculation block with monospace formatting
     * @param {string} title - Calculation title
     * @param {Array} steps - Calculation steps
     */
    addCalculationBlock(title, steps = []) {
        // Title
        this.doc.setFont(this.defaultFont, 'bold');
        this.doc.setFontSize(11);
        this.addText(title, this.marginLeft, this.currentY);
        this.currentY += 5;
        
        // Border box
        const boxY = this.currentY;
        const boxHeight = steps.length * 5 + 10;
        
        this.doc.setDrawColor(...this.colors.border);
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.marginLeft, boxY, this.contentWidth, boxHeight, 'FD');
        
        // Steps
        this.doc.setFont('courier', 'normal');
        this.doc.setFontSize(9);
        
        steps.forEach((step, index) => {
            const stepY = boxY + 5 + (index * 5);
            this.doc.text(String(step), this.marginLeft + 5, stepY);
        });
        
        this.currentY = boxY + boxHeight + 5;
        this.doc.setFont(this.defaultFont, 'normal');
    }
    
    /**
     * Add horizontal separator line
     * @param {string} style - Line style ('solid', 'dashed', 'thick')
     */
    addSeparator(style = 'solid') {
        const y = this.currentY + 3;
        
        this.doc.setDrawColor(...this.colors.border);
        
        if (style === 'thick') {
            this.doc.setLineWidth(0.5);
        } else if (style === 'dashed') {
            this.doc.setLineDash([2, 2]);
        }
        
        this.doc.line(this.marginLeft, y, this.pageWidth - this.marginRight, y);
        
        // Reset
        this.doc.setLineWidth(0.1);
        this.doc.setLineDash([]);
        
        this.currentY = y + 3;
    }
    
    /**
     * Add image to PDF
     * @param {string} imgData - Base64 image data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    addImage(imgData, x, y, width, height) {
        try {
            if (imgData) {
                this.doc.addImage(imgData, 'PNG', x, y, width, height);
                this.currentY = y + height + 5;
            }
        } catch (error) {
            console.error('Error adding image:', error);
        }
    }
    
    /**
     * Add section title
     * @param {string} title - Section title
     * @param {number} level - Heading level (1-3)
     */
    addSectionTitle(title, level = 1) {
        const fontSizes = { 1: 14, 2: 12, 3: 11 };
        const spacing = { 1: 8, 2: 6, 3: 5 };
        
        this.currentY += spacing[level];
        
        this.doc.setFont(this.defaultFont, 'bold');
        this.doc.setFontSize(fontSizes[level]);
        
        if (level === 1) {
            this.doc.setTextColor(...this.colors.primary);
        }
        
        this.doc.text(title, this.marginLeft, this.currentY);
        
        this.doc.setTextColor(...this.colors.dark);
        this.doc.setFont(this.defaultFont, 'normal');
        
        this.currentY += spacing[level];
    }
    
    /**
     * Generate and return the PDF
     * @returns {Object} jsPDF document object
     */
    generate() {
        // Update page numbers on all pages
        const totalPages = this.doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);
            this.addFooter(
                this.projectData.docNumber || '',
                this.projectData.docRevision || '0'
            );
        }
        
        console.log(`✅ PDF generated with ${totalPages} pages`);
        return this.doc;
    }
    
    /**
     * Save PDF to file
     * @param {string} filename - Output filename
     */
    save(filename = 'report.pdf') {
        this.generate();
        this.doc.save(filename);
        console.log(`✅ PDF saved as: ${filename}`);
    }
    
    /**
     * Get PDF as blob for preview
     * @returns {Blob} PDF blob
     */
    getBlob() {
        this.generate();
        return this.doc.output('blob');
    }
    
    /**
     * Get PDF as data URL for preview
     * @returns {string} PDF data URL
     */
    getDataUrl() {
        this.generate();
        return this.doc.output('dataurlstring');
    }
}

// Export to global scope
window.ProfessionalPDFGenerator = ProfessionalPDFGenerator;

console.log('✅ Professional PDF Generator module loaded');
