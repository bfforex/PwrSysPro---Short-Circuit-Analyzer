/**
 * Fault Current Labels Module
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Generates fault current labels for equipment marking per:
 * - NEC 110.24 (2023 Edition)
 * - PEC 1.10.9 (2017 Edition)
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

/**
 * Generate fault current label for a single bus
 * Per NEC 110.24 / PEC 1.10.9 requirements
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
    const faultCurrentKA = (sc.faultCurrents?.symmetrical3Phase || 0) / 1000;
    const currentDate = new Date().toISOString().split('T')[0];
    const engineer = document.getElementById('engineer')?.value || 'Engineer';
    const projectName = document.getElementById('projectName')?.value || 'Project';
    
    // Label size options (in mm for standard label stock)
    const size = options.size || 'large'; // 'small', 'medium', 'large'
    const dimensions = {
        small: { width: '100mm', height: '50mm', fontSize: '10px' },
        medium: { width: '150mm', height: '75mm', fontSize: '12px' },
        large: { width: '200mm', height: '100mm', fontSize: '14px' }
    };
    
    const dim = dimensions[size];
    
    let html = '';
    
    html += '<div class="fault-label" style="';
    html += 'width: ' + dim.width + '; ';
    html += 'height: ' + dim.height + '; ';
    html += 'border: 3px solid #000; ';
    html += 'padding: 8px; ';
    html += 'margin: 10px; ';
    html += 'background: #ffeb3b; ';
    html += 'color: #000; ';
    html += 'font-family: Arial, sans-serif; ';
    html += 'font-size: ' + dim.fontSize + '; ';
    html += 'font-weight: bold; ';
    html += 'display: inline-block; ';
    html += 'page-break-inside: avoid; ';
    html += 'box-sizing: border-box;';
    html += '">';
    
    // Warning symbol
    html += '<div style="text-align: center; margin-bottom: 5px;">';
    html += '<span style="font-size: 24px; color: #000;">⚠️</span>';
    html += '</div>';
    
    // Title
    html += '<div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 5px;">';
    html += '<div style="font-size: ' + (size === 'large' ? '16px' : '14px') + '; font-weight: bold;">CAUTION</div>';
    html += '<div style="font-size: ' + (size === 'large' ? '14px' : '12px') + ';">AVAILABLE FAULT CURRENT</div>';
    html += '</div>';
    
    // Equipment location
    html += '<div style="margin: 5px 0; text-align: center;">';
    html += '<div style="font-size: ' + (size === 'large' ? '12px' : '10px') + '; font-weight: normal;">EQUIPMENT:</div>';
    html += '<div style="font-size: ' + (size === 'large' ? '14px' : '12px') + '; margin-top: 2px;">' + (bus.name || 'BUS') + '</div>';
    html += '</div>';
    
    // Fault current value (most prominent)
    html += '<div style="margin: 8px 0; text-align: center; background: #fff; border: 2px solid #000; padding: 5px; border-radius: 4px;">';
    html += '<div style="font-size: ' + (size === 'large' ? '24px' : '18px') + '; color: #d32f2f;">';
    html += faultCurrentKA.toFixed(2) + ' kA';
    html += '</div>';
    html += '<div style="font-size: ' + (size === 'large' ? '10px' : '8px') + '; font-weight: normal; margin-top: 2px;">3-Phase Symmetrical</div>';
    html += '</div>';
    
    // Date and engineer
    html += '<div style="margin: 5px 0; font-size: ' + (size === 'large' ? '10px' : '8px') + '; font-weight: normal; text-align: center;">';
    html += '<div>Calc. Date: ' + currentDate + '</div>';
    html += '<div>By: ' + engineer + '</div>';
    html += '</div>';
    
    // Regulatory reference
    html += '<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; font-size: ' + (size === 'large' ? '9px' : '7px') + '; font-weight: normal; text-align: center;">';
    html += 'Per NEC 110.24 / PEC 1.10.9';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Generate labels for all buses in the system
 * @param {Array} buses - Array of bus objects
 * @param {Object} options - Label generation options
 * @returns {string} HTML for all labels
 */
function generateAllFaultCurrentLabels(buses, options = {}) {
    if (!buses || !Array.isArray(buses) || buses.length === 0) {
        return '<p style="color: #999; padding: 20px; text-align: center;">No buses available for label generation.</p>';
    }
    
    const labelsPerRow = options.labelsPerRow || 3;
    const size = options.size || 'medium';
    
    let html = '';
    
    html += '<div class="fault-labels-container" style="padding: 20px;">';
    html += '<h2 style="margin: 0 0 20px 0; text-align: center;">Fault Current Labels - Equipment Marking</h2>';
    html += '<p style="margin: 0 0 30px 0; text-align: center; font-size: 14px; color: #666;">Per NEC 110.24 / PEC 1.10.9 - Print on yellow label stock</p>';
    
    html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start;">';
    
    let count = 0;
    for (const bus of buses) {
        if (bus.results && bus.results.shortCircuit) {
            html += generateFaultCurrentLabel(bus, options);
            count++;
        }
    }
    
    html += '</div>';
    
    html += '<div style="margin-top: 30px; padding: 15px; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">';
    html += '<h4 style="margin: 0 0 10px 0;">📋 Installation Instructions</h4>';
    html += '<ol style="margin: 5px 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">';
    html += '<li>Print labels on yellow adhesive label stock or yellow card stock</li>';
    html += '<li>Affix label at a visible location on or adjacent to the service equipment</li>';
    html += '<li>Label must be durable enough to withstand the environment</li>';
    html += '<li>Update label whenever fault current calculations are revised</li>';
    html += '<li>Label shall include: fault current value, calculation date, and engineer</li>';
    html += '</ol>';
    html += '<p style="margin: 10px 0 0 0; font-size: 12px; color: #666;"><strong>Standards:</strong> NEC 110.24 (2023), PEC 1.10.9 (2017), NFPA 70E-2024</p>';
    html += '</div>';
    
    html += '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">';
    html += '<p style="margin: 0; font-size: 13px;"><strong>⚠️ Important:</strong> These labels are required by code for all service equipment and separately derived systems. ';
    html += 'Failure to provide proper fault current marking may result in permit rejection or code violations.</p>';
    html += '</div>';
    
    html += '<div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">';
    html += 'Generated ' + count + ' label(s) | ' + new Date().toLocaleString();
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Generate detailed fault current label with additional information
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
    
    let html = '';
    
    html += '<div class="fault-label-detailed" style="';
    html += 'width: 250mm; ';
    html += 'border: 3px solid #000; ';
    html += 'padding: 15px; ';
    html += 'margin: 10px; ';
    html += 'background: #ffeb3b; ';
    html += 'color: #000; ';
    html += 'font-family: Arial, sans-serif; ';
    html += 'page-break-inside: avoid;';
    html += '">';
    
    // Header
    html += '<div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px;">';
    html += '<div style="font-size: 20px; font-weight: bold;">⚠️ AVAILABLE FAULT CURRENT ⚠️</div>';
    html += '<div style="font-size: 14px; margin-top: 5px;">Equipment Marking - NEC 110.24 / PEC 1.10.9</div>';
    html += '</div>';
    
    // Equipment info
    html += '<div style="margin-bottom: 15px;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 5px; font-weight: bold; width: 150px;">Equipment Location:</td><td style="padding: 5px; font-size: 16px;"><strong>' + (bus.name || 'BUS') + '</strong></td></tr>';
    html += '<tr><td style="padding: 5px; font-weight: bold;">System Voltage:</td><td style="padding: 5px;">' + (bus.voltage || 'N/A') + ' V</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Fault currents
    html += '<div style="background: #fff; border: 2px solid #000; padding: 10px; margin-bottom: 15px; border-radius: 4px;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="border-bottom: 1px solid #ccc;"><td style="padding: 5px; font-weight: bold;">3-Phase Symmetrical:</td><td style="padding: 5px; text-align: right; font-size: 18px; color: #d32f2f;"><strong>' + ((fc.symmetrical3Phase || 0) / 1000).toFixed(2) + ' kA</strong></td></tr>';
    html += '<tr style="border-bottom: 1px solid #ccc;"><td style="padding: 5px;">3-Phase Asymmetrical:</td><td style="padding: 5px; text-align: right;">' + ((fc.asymmetrical3Phase || 0) / 1000).toFixed(2) + ' kA</td></tr>';
    html += '<tr style="border-bottom: 1px solid #ccc;"><td style="padding: 5px;">Line-to-Line:</td><td style="padding: 5px; text-align: right;">' + ((fc.lineToLine || 0) / 1000).toFixed(2) + ' kA</td></tr>';
    html += '<tr><td style="padding: 5px;">Line-to-Ground:</td><td style="padding: 5px; text-align: right;">' + ((fc.lineToGround || 0) / 1000).toFixed(2) + ' kA</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // X/R Ratio
    if (sc.xrRatio) {
        html += '<div style="margin-bottom: 15px;">';
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tr><td style="padding: 5px; font-weight: bold; width: 150px;">X/R Ratio:</td><td style="padding: 5px;">' + sc.xrRatio.toFixed(2) + '</td></tr>';
        html += '</table>';
        html += '</div>';
    }
    
    // Calculation info
    html += '<div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; font-size: 12px;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 3px; width: 150px;">Calculation Date:</td><td style="padding: 3px;">' + currentDate + '</td></tr>';
    html += '<tr><td style="padding: 3px;">Calculated By:</td><td style="padding: 3px;">' + engineer + '</td></tr>';
    html += '<tr><td style="padding: 3px;">Standards:</td><td style="padding: 3px;">NEC 110.24, PEC 1.10.9, IEEE 1584-2018</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Warning
    html += '<div style="margin-top: 15px; padding: 10px; background: #fff; border: 2px solid #d32f2f; border-radius: 4px; font-size: 11px; text-align: center; font-weight: bold;">';
    html += '⚠️ WARNING: High fault current. Ensure all protective devices are properly rated and coordinated.';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Export fault current labels as printable document
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
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Fault Current Labels - ' + projectName + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';
    html += '@media print {';
    html += '  body { margin: 0; padding: 10mm; }';
    html += '  .fault-label, .fault-label-detailed { page-break-inside: avoid; }';
    html += '  @page { size: letter; margin: 10mm; }';
    html += '}';
    html += '</style>';
    html += '</head><body>';
    
    // Generate labels
    html += generateAllFaultCurrentLabels(buses, options);
    
    // If detailed option is selected, add detailed labels on separate pages
    if (options.includeDetailed) {
        html += '<div style="page-break-before: always;"></div>';
        html += '<h2 style="text-align: center; margin-bottom: 30px;">Detailed Fault Current Labels</h2>';
        for (const bus of buses) {
            if (bus.results && bus.results.shortCircuit) {
                html += generateDetailedFaultLabel(bus, options);
            }
        }
    }
    
    html += '</body></html>';
    
    // Create and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Fault current labels exported: ' + filename);
}

/**
 * Print fault current labels directly
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
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Print Fault Current Labels</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }';
    html += '.fault-label { page-break-inside: avoid; }';
    html += '@page { size: letter; margin: 10mm; }';
    html += '@media print { body { padding: 0; } }';
    html += '</style>';
    html += '</head><body>';
    html += generateAllFaultCurrentLabels(buses, options);
    html += '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = function() {
        printWindow.print();
    };
    
    console.log('✅ Fault current labels sent to printer');
}

// Export functions to global scope
window.generateFaultCurrentLabel = generateFaultCurrentLabel;
window.generateAllFaultCurrentLabels = generateAllFaultCurrentLabels;
window.generateDetailedFaultLabel = generateDetailedFaultLabel;
window.exportFaultCurrentLabels = exportFaultCurrentLabels;
window.printFaultCurrentLabels = printFaultCurrentLabels;

console.log('✅ Fault Current Labels module loaded');
