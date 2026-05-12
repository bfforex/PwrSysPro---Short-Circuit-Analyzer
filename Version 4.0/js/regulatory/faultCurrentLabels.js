/**
 * Fault Current Labels Module
 * PwrSys Pro - Short Circuit Analyzer v3.3
 *
 * Generates fault current labels for equipment marking per:
 * - NEC 110.24 (2023 Edition)
 * - PEC 1.10.9 (2017 Edition)
 *
 * Updated:
 * - Tracks whether labels were actually generated (exported/printed)
 * - Persists label-generated status in localStorage
 * - Refreshes compliance checklist after export/print
 * - Adds reset helper for new/load/clear project workflows
 *
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.1.0
 */

// ═══════════════════════════════════════════════════════════════════════
// LABEL GENERATION STATUS HELPERS
// ═══════════════════════════════════════════════════════════════════════

function markFaultCurrentLabelsGenerated() {
    window.faultCurrentLabelsGenerated = true;
    try {
        localStorage.setItem('faultCurrentLabelsGenerated', 'true');
    } catch (storageError) {
        console.warn('⚠️ Could not persist faultCurrentLabelsGenerated flag:', storageError);
    }

    if (typeof updateComplianceChecklist === 'function') {
        try {
            updateComplianceChecklist();
            console.log('✅ Compliance checklist refreshed after fault current label generation');
        } catch (checklistError) {
            console.warn('⚠️ Could not refresh compliance checklist after label generation:', checklistError);
        }
    }
}

function resetFaultCurrentLabelsGeneratedStatus() {
    window.faultCurrentLabelsGenerated = false;
    try {
        localStorage.removeItem('faultCurrentLabelsGenerated');
    } catch (storageError) {
        console.warn('⚠️ Could not clear faultCurrentLabelsGenerated flag:', storageError);
    }

    if (typeof updateComplianceChecklist === 'function') {
        try {
            updateComplianceChecklist();
            console.log('✅ Compliance checklist refreshed after resetting label generation status');
        } catch (checklistError) {
            console.warn('⚠️ Could not refresh compliance checklist after reset:', checklistError);
        }
    }
}

function areFaultCurrentLabelsGenerated() {
    try {
        return (
            window.faultCurrentLabelsGenerated === true ||
            localStorage.getItem('faultCurrentLabelsGenerated') === 'true'
        );
    } catch (storageError) {
        return window.faultCurrentLabelsGenerated === true;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// SINGLE LABEL GENERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate fault current label for a single bus
 * Per NEC 110.24 / PEC 1.10.9 requirements
 *
 * @param {Object} bus - Bus object with fault current data
 * @param {Object} options - Label generation options
 * @returns {string} HTML for printable label
 */
function generateFaultCurrentLabel(bus, options = {}) {
    if (!bus || !bus.results || !bus.results.shortCircuit) {
        console.warn('⚠️ Bus has no fault current data:', bus?.name);
        return '';
    }

    const sc = bus.results.shortCircuit;
    const faultCurrentKA = sc.faultCurrents?.threePhaseSym || 0;
    const currentDate = new Date().toISOString().split('T')[0];
    const engineer = document.getElementById('engineer')?.value || 'Engineer';
    const projectName = document.getElementById('projectName')?.value || 'Project';

    // Label size options
    const size = options.size || 'large'; // 'small', 'medium', 'large'
    const dimensions = {
        small:  { width: '100mm', height: '50mm',  fontSize: '10px' },
        medium: { width: '150mm', height: '75mm',  fontSize: '12px' },
        large:  { width: '200mm', height: '100mm', fontSize: '14px' }
    };
    const dim = dimensions[size] || dimensions.large;

    let html = '';
    html += `<div style="
        width:${dim.width};
        min-height:${dim.height};
        border:2px solid #000;
        background:#fff59d;
        padding:10px;
        margin:10px;
        box-sizing:border-box;
        display:inline-block;
        vertical-align:top;
        font-family:Arial, sans-serif;
        font-size:${dim.fontSize};
        page-break-inside:avoid;
    ">`;

    html += `<div style="font-size:1.4em; font-weight:bold; text-align:center; margin-bottom:6px;">⚠️</div>`;
    html += `<div style="text-align:center; font-weight:bold; font-size:1.15em; margin-bottom:4px;">CAUTION</div>`;
    html += `<div style="text-align:center; font-weight:bold; font-size:1.1em; margin-bottom:8px;">AVAILABLE FAULT CURRENT</div>`;

    html += `<div style="margin-bottom:6px;"><strong>EQUIPMENT:</strong><br>${bus.name || 'BUS'}</div>`;

    html += `<div style="text-align:center; font-weight:bold; font-size:1.35em; margin:8px 0;">${faultCurrentKA.toFixed(2)} kA</div>`;
    html += `<div style="text-align:center; margin-bottom:8px;">3-Phase Symmetrical</div>`;

    html += `<div style="font-size:0.9em; margin-top:8px;">Calc. Date: ${currentDate}</div>`;
    html += `<div style="font-size:0.9em;">By: ${engineer}</div>`;
    html += `<div style="font-size:0.9em; margin-top:6px;">Per NEC 110.24 / PEC 1.10.9</div>`;

    if (projectName) {
        html += `<div style="font-size:0.85em; margin-top:6px; color:#333;">${projectName}</div>`;
    }

    html += `</div>`;
    return html;
}

// ═══════════════════════════════════════════════════════════════════════
// ALL LABELS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate labels for all buses in the system
 *
 * @param {Array} buses - Array of bus objects
 * @param {Object} options - Label generation options
 * @returns {string} HTML for all labels
 */
function generateAllFaultCurrentLabels(buses, options = {}) {
    if (!buses || !Array.isArray(buses) || buses.length === 0) {
        return `
            <div class="alert alert-warning">
                No buses available for label generation.
            </div>
        `;
    }

    const size = options.size || 'medium';
    let html = '';

    html += `
        <div style="margin-bottom:20px;">
            <h3 style="margin-bottom:8px;">Fault Current Labels - Equipment Marking</h3>
            <p style="margin:0;">Per NEC 110.24 / PEC 1.10.9 - Print on yellow label stock</p>
        </div>
    `;

    let count = 0;
    for (const bus of buses) {
        if (bus && bus.results && bus.results.shortCircuit) {
            html += generateFaultCurrentLabel(bus, { ...options, size });
            count++;
        }
    }

    html += `
        <div style="clear:both; margin-top:20px;"></div>

        <h4>📋 Installation Instructions</h4>
        <ul style="line-height:1.7;">
            <li>Print labels on yellow adhesive label stock or yellow card stock</li>
            <li>Affix label at a visible location on or adjacent to the service equipment</li>
            <li>Label must be durable enough to withstand the environment</li>
            <li>Update label whenever fault current calculations are revised</li>
            <li>Label shall include: fault current value, calculation date, and engineer</li>
        </ul>

        <p style="margin-top:15px;">
            Standards: NEC 110.24 (2023), PEC 1.10.9 (2017), NFPA 70E-2024
        </p>

        <p style="margin-top:15px;">
            ⚠️ Important: These labels are required by code for all service equipment and separately derived systems.
            Failure to provide proper fault current marking may result in permit rejection or code violations.
        </p>

        <p style="margin-top:15px; font-size:0.9em; color:#555;">
            Generated ${count} label(s) — ${new Date().toLocaleString()}
        </p>
    `;

    return html;
}

// ═══════════════════════════════════════════════════════════════════════
// DETAILED LABEL
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate detailed fault current label with additional information
 *
 * @param {Object} bus - Bus object
 * @param {Object} options - Options
 * @returns {string} HTML for detailed label
 */
function generateDetailedFaultLabel(bus, options = {}) {
    if (!bus || !bus.results || !bus.results.shortCircuit) {
        return '';
    }

    const sc = bus.results.shortCircuit;
    const fc = sc.faultCurrents || {};
    const currentDate = new Date().toISOString().split('T')[0];
    const engineer = document.getElementById('engineer')?.value || 'Engineer';
    const arcFlashStatus = bus.results?.arcFlashStatus || '';
    const arcFlashReason = bus.results?.arcFlashReason || '';

    let html = '';
    html += `<div style="border:2px solid #000; padding:20px; margin:20px 0; page-break-inside:avoid;">`;

    // Header
    html += `<h3 style="margin-top:0;">⚠️ AVAILABLE FAULT CURRENT ⚠️</h3>`;
    html += `<div style="margin-bottom:12px;">Equipment Marking - NEC 110.24 / PEC 1.10.9</div>`;

    // Equipment info
    html += `<table style="width:100%; border-collapse:collapse; margin-bottom:12px;">`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Equipment Location:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${bus.name || 'BUS'}</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>System Voltage:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${bus.voltage || 'N/A'} V</td></tr>`;
    html += `</table>`;

    // Fault currents
    html += `<table style="width:100%; border-collapse:collapse; margin-bottom:12px;">`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>3-Phase Symmetrical:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${(fc.threePhaseSym || 0).toFixed(2)} kA</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>3-Phase Asymmetrical:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${(fc.threePhaseAsym || 0).toFixed(2)} kA</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Line-to-Line:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${(fc.lineToLine || 0).toFixed(2)} kA</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Line-to-Ground:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${(fc.lineToGround || 0).toFixed(2)} kA</td></tr>`;
    html += `</table>`;

    // X/R Ratio
    if (sc.xrRatio) {
        html += `<table style="width:100%; border-collapse:collapse; margin-bottom:12px;">`;
        html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>X/R Ratio:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${sc.xrRatio.toFixed(2)}</td></tr>`;
        html += `</table>`;
    }

    // Arc flash note for HV/source handling
    if (arcFlashStatus === 'external-study-required' || arcFlashStatus === 'not-applicable-source') {
        html += `<div style="margin:12px 0; padding:10px; border-left:4px solid #f0ad4e; background:#fff8e1;">`;
        html += `<strong>Arc Flash Status:</strong><br>`;
        html += (arcFlashStatus === 'external-study-required')
            ? `External HV arc-flash study required for this bus/equipment.<br>`
            : `Arc flash not applicable for utility/source bus in this in-app routine.<br>`;

        if (arcFlashReason) {
            html += `${arcFlashReason}`;
        }
        html += `</div>`;
    }

    // Calculation info
    html += `<table style="width:100%; border-collapse:collapse; margin-bottom:12px;">`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Calculation Date:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${currentDate}</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Calculated By:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">${engineer}</td></tr>`;
    html += `<tr><td style="padding:4px 8px; border:1px solid #ccc;"><strong>Standards:</strong></td><td style="padding:4px 8px; border:1px solid #ccc;">NEC 110.24, PEC 1.10.9, IEEE 1584-2018</td></tr>`;
    html += `</table>`;

    // Warning
    html += `<div style="margin-top:12px; font-weight:bold;">⚠️ WARNING: High fault current. Ensure all protective devices are properly rated and coordinated.</div>`;

    html += `</div>`;
    return html;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT LABELS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Export fault current labels as printable document
 *
 * @param {Array} buses - Array of bus objects
 * @param {Object} options - Export options
 */
function exportFaultCurrentLabels(buses, options = {}) {
    if (!buses || !Array.isArray(buses)) {
        buses = window.buses || [];
    }

    if (buses.length === 0) {
        alert('No buses available. Please create and calculate buses first.');
        return;
    }

    const projectName = document.getElementById('projectName')?.value || 'Project';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = projectName.replace(/\s+/g, '_') + '_FaultLabels_' + timestamp + '.html';

    let html = '';
    html += '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Fault Current Labels - ' + projectName + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }';
    html += '@media print { body { padding: 10px; } }';
    html += '</style>';
    html += '</head><body>';

    html += '<h1 style="margin-top:0;">Fault Current Labels - ' + projectName + '</h1>';
    html += generateAllFaultCurrentLabels(buses, options);

    if (options.includeDetailed) {
        html += '<div style="page-break-before: always;"></div>';
        html += '<h2>Detailed Fault Current Labels</h2>';
        for (const bus of buses) {
            if (bus && bus.results && bus.results.shortCircuit) {
                html += generateDetailedFaultLabel(bus, options);
            }
        }
    }

    html += '</body></html>';

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Mark labels as generated for compliance tracking
    markFaultCurrentLabelsGenerated();

    console.log('✅ Fault current labels exported: ' + filename);
}

// ═══════════════════════════════════════════════════════════════════════
// PRINT LABELS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Print fault current labels directly
 *
 * @param {Array} buses - Array of bus objects
 * @param {Object} options - Print options
 */
function printFaultCurrentLabels(buses, options = {}) {
    if (!buses || !Array.isArray(buses)) {
        buses = window.buses || [];
    }

    if (buses.length === 0) {
        alert('No buses available for label printing.');
        return;
    }

    const printWindow = window.open('', '_blank');
    let html = '';
    html += '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Print Fault Current Labels</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }';
    html += '@media print { body { padding: 10px; } }';
    html += '</style>';
    html += '</head><body>';

    html += '<h1 style="margin-top:0;">Print Fault Current Labels</h1>';
    html += generateAllFaultCurrentLabels(buses, options);
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();

    // Mark labels as generated once print dialog is opened/print is requested
    markFaultCurrentLabelsGenerated();

    printWindow.onload = function () {
        printWindow.print();
    };

    console.log('✅ Fault current labels sent to printer');
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════

window.generateFaultCurrentLabel = generateFaultCurrentLabel;
window.generateAllFaultCurrentLabels = generateAllFaultCurrentLabels;
window.generateDetailedFaultLabel = generateDetailedFaultLabel;
window.exportFaultCurrentLabels = exportFaultCurrentLabels;
window.printFaultCurrentLabels = printFaultCurrentLabels;
window.markFaultCurrentLabelsGenerated = markFaultCurrentLabelsGenerated;
window.resetFaultCurrentLabelsGeneratedStatus = resetFaultCurrentLabelsGeneratedStatus;
window.areFaultCurrentLabelsGenerated = areFaultCurrentLabelsGenerated;

console.log('✅ Fault Current Labels module loaded');
console.log(' - Label generation status helpers: ENABLED');
console.log(' - Compliance checklist refresh after export/print: ENABLED');
console.log(' - localStorage persistence: ENABLED');
