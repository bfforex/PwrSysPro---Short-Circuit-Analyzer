/**
 * Revision History Manager
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Document version tracking and revision history
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const RevisionHistoryManager = {
    /**
     * Revision history data
     */
    revisions: [
        {
            revision: '0',
            date: new Date().toISOString().split('T')[0],
            description: 'Initial issue for review',
            preparedBy: 'Engineer',
            checkedBy: '',
            approvedBy: ''
        }
    ],
    
    /**
     * Generate revision history page
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     */
    generate(pdfGen) {
        console.log('📝 Generating revision history...');
        
        const doc = pdfGen.doc;
        
        pdfGen.newPage('REVISION HISTORY', 'Document Control');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('REVISION HISTORY', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Table headers
        const headers = ['Rev', 'Date', 'Description', 'Prepared By', 'Checked By', 'Approved By'];
        
        // Table rows
        const rows = this.revisions.map(rev => [
            rev.revision,
            rev.date,
            rev.description,
            rev.preparedBy,
            rev.checkedBy,
            rev.approvedBy
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 9,
            cellPadding: 3
        });
        
        y = pdfGen.currentY + 10;
        
        // Notes
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Document Control Notes:', pdfGen.marginLeft, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '• Revision 0 indicates initial issue for review',
            '• Numeric revisions (1, 2, 3...) indicate major revisions',
            '• Letter revisions (A, B, C...) indicate minor revisions',
            '• All revisions require appropriate review and approval before distribution'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 5));
        });
        
        pdfGen.currentY = y + notes.length * 5 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
        
        console.log('✅ Revision history generated');
    },
    
    /**
     * Add new revision
     * @param {Object} revision - Revision data
     */
    addRevision(revision) {
        this.revisions.push({
            revision: revision.revision || String(this.revisions.length),
            date: revision.date || new Date().toISOString().split('T')[0],
            description: revision.description || '',
            preparedBy: revision.preparedBy || '',
            checkedBy: revision.checkedBy || '',
            approvedBy: revision.approvedBy || ''
        });
        
        this.save();
    },
    
    /**
     * Load revisions from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('revisionHistory');
            if (saved) {
                this.revisions = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading revision history:', error);
        }
    },
    
    /**
     * Save revisions to localStorage
     */
    save() {
        try {
            localStorage.setItem('revisionHistory', JSON.stringify(this.revisions));
        } catch (error) {
            console.error('Error saving revision history:', error);
        }
    },
    
    /**
     * Show revision history dialog (placeholder for UI integration)
     */
    showDialog() {
        alert('Revision History Manager\n\nThis feature allows you to track document revisions.\nFull UI dialog will be implemented in future updates.');
    }
};

// Load revisions on initialization
RevisionHistoryManager.load();

// Export to global scope
window.RevisionHistoryManager = RevisionHistoryManager;

console.log('✅ Revision History Manager module loaded');
