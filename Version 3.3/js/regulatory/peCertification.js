/**
 * Professional Engineer (PE) Certification Module
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Handles PE certification blocks for regulatory submissions to:
 * - Office of the Building Official (OBO)
 * - Philippine Electrical Code (PEC) 2017 Edition
 * - National Electrical Code (NEC) 2023
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

// PE Certification State
const peCertificationState = {
    engineerName: '',
    prcLicenseNo: '',
    prcValidityDate: '',
    ptrNumber: '',
    ptrDate: '',
    ptrIssuedAt: '',
    tin: '',
    signatureDataUrl: null,  // Base64 image data
    sealDataUrl: null,       // Base64 image data
    certificationDate: new Date().toISOString().split('T')[0]
};

/**
 * Initialize PE Certification module
 */
function initPECertification() {
    console.log('🔧 Initializing PE Certification module...');
    
    // Load saved PE information from localStorage
    loadPEInformation();
    
    console.log('✅ PE Certification module initialized');
}

/**
 * Get PE certification information
 * @returns {Object} PE certification data
 */
function getPEInformation() {
    return { ...peCertificationState };
}

/**
 * Update PE certification information
 * @param {Object} updates - Fields to update
 */
function updatePEInformation(updates) {
    Object.assign(peCertificationState, updates);
    savePEInformation();
}

/**
 * Save PE information to localStorage
 */
function savePEInformation() {
    try {
        localStorage.setItem('peCertification', JSON.stringify(peCertificationState));
        console.log('✅ PE Certification information saved');
    } catch (error) {
        console.error('❌ Error saving PE Certification:', error);
    }
}

/**
 * Load PE information from localStorage
 */
function loadPEInformation() {
    try {
        const saved = localStorage.getItem('peCertification');
        if (saved) {
            Object.assign(peCertificationState, JSON.parse(saved));
            console.log('✅ PE Certification information loaded');
        }
    } catch (error) {
        console.error('❌ Error loading PE Certification:', error);
    }
}

/**
 * Validate PE certification completeness
 * @returns {Object} Validation result with missing fields
 */
function validatePECertification() {
    const required = [
        { field: 'engineerName', label: 'Engineer Name' },
        { field: 'prcLicenseNo', label: 'PRC License Number' },
        { field: 'prcValidityDate', label: 'PRC Validity Date' },
        { field: 'ptrNumber', label: 'PTR Number' },
        { field: 'ptrDate', label: 'PTR Date' },
        { field: 'tin', label: 'TIN' }
    ];
    
    const missing = required.filter(req => !peCertificationState[req.field]);
    
    return {
        isValid: missing.length === 0,
        missing: missing.map(m => m.label),
        completeness: ((required.length - missing.length) / required.length * 100).toFixed(0)
    };
}

/**
 * Generate PE certification block HTML
 * Per Philippine Electrical Code and Building Code requirements
 * @param {Object} options - Rendering options
 * @returns {string} HTML for PE certification block
 */
function generatePECertificationBlock(options = {}) {
    const pe = getPEInformation();
    const projectName = document.getElementById('projectName')?.value || 'Project Name';
    const currentDate = options.date || pe.certificationDate;
    
    let html = '';
    
    html += '<div class="pe-certification-block" style="page-break-inside: avoid; border: 2px solid #333; padding: 30px; margin: 30px 0; background: #fff;">';
    
    // Header
    html += '<div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 25px;">';
    html += '<h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px;">PROFESSIONAL ENGINEER CERTIFICATION</h2>';
    html += '<p style="margin: 0; color: #555; font-size: 14px;">Republic Act No. 184 - Philippine Electrical Engineering Law</p>';
    html += '</div>';
    
    // Project Information
    html += '<div style="margin-bottom: 25px; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea;">';
    html += '<p style="margin: 5px 0; font-size: 14px;"><strong>Project:</strong> ' + (projectName || '[Project Name]') + '</p>';
    html += '<p style="margin: 5px 0; font-size: 14px;"><strong>Document:</strong> Short Circuit Analysis and Power System Study</p>';
    html += '<p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ' + currentDate + '</p>';
    html += '</div>';
    
    // Certification Statement
    html += '<div style="margin: 25px 0; line-height: 1.8; font-size: 14px; text-align: justify;">';
    html += '<p style="margin-bottom: 15px;">I hereby certify that:</p>';
    html += '<ol style="padding-left: 25px; margin: 15px 0;">';
    html += '<li style="margin-bottom: 10px;">This Short Circuit Analysis and Power System Study has been prepared under my direct supervision and in accordance with the applicable provisions of:</li>';
    html += '<ul style="list-style-type: disc; padding-left: 25px; margin: 10px 0;">';
    html += '<li>Philippine Electrical Code (PEC) 2017 Edition</li>';
    html += '<li>National Electrical Code (NEC) NFPA 70 - 2023 Edition</li>';
    html += '<li>IEEE Standard 141-1993 (Red Book) - Electric Power Distribution for Industrial Plants</li>';
    html += '<li>IEEE Standard 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations</li>';
    html += '<li>National Building Code of the Philippines (PD 1096)</li>';
    html += '</ul>';
    html += '<li style="margin-bottom: 10px;">All calculations, analyses, and recommendations contained herein are based on sound engineering principles and current industry standards.</li>';
    html += '<li style="margin-bottom: 10px;">The electrical system design complies with the minimum safety requirements for electrical installations as specified in the applicable codes and standards.</li>';
    html += '<li style="margin-bottom: 10px;">This document is prepared exclusively for building permit / electrical installation permit submission and subsequent regulatory compliance.</li>';
    html += '</ol>';
    html += '</div>';
    
    // Engineer Information
    html += '<div style="margin: 30px 0; padding: 20px; background: #f0f4ff; border: 1px solid #667eea;">';
    html += '<h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">PREPARED BY:</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 8px 0; width: 200px;"><strong>Name:</strong></td><td>' + (pe.engineerName || '[Engineer Name]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>PRC License No.:</strong></td><td>' + (pe.prcLicenseNo || '[PRC License Number]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>PRC Validity:</strong></td><td>' + (pe.prcValidityDate || '[Validity Date]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>PTR No.:</strong></td><td>' + (pe.ptrNumber || '[PTR Number]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>PTR Date:</strong></td><td>' + (pe.ptrDate || '[PTR Date]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>PTR Issued At:</strong></td><td>' + (pe.ptrIssuedAt || '[PTR Location]') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0;"><strong>TIN:</strong></td><td>' + (pe.tin || '[TIN]') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Signature and Seal Section
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">';
    
    // Signature
    html += '<div style="text-align: center;">';
    if (pe.signatureDataUrl) {
        html += '<img src="' + pe.signatureDataUrl + '" alt="Signature" style="max-width: 200px; height: auto; border-bottom: 2px solid #333;">';
    } else {
        html += '<div style="height: 80px; border-bottom: 2px solid #333; margin-bottom: 10px;"></div>';
    }
    html += '<p style="margin: 10px 0 5px 0; font-weight: bold;">' + (pe.engineerName || 'ENGINEER NAME') + '</p>';
    html += '<p style="margin: 0; font-size: 12px;">Licensed Electrical Engineer</p>';
    html += '<p style="margin: 0; font-size: 12px;">PRC License No. ' + (pe.prcLicenseNo || '[License No.]') + '</p>';
    html += '</div>';
    
    // PE Seal
    html += '<div style="text-align: center;">';
    if (pe.sealDataUrl) {
        html += '<img src="' + pe.sealDataUrl + '" alt="PE Seal" style="max-width: 150px; height: auto;">';
    } else {
        html += '<div style="width: 150px; height: 150px; border: 3px solid #333; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 12px; text-align: center; color: #999;">PROFESSIONAL<br>SEAL<br>PLACEHOLDER</div>';
    }
    html += '<p style="margin: 10px 0 0 0; font-size: 12px;">Professional Engineer Seal</p>';
    html += '</div>';
    
    html += '</div>';
    
    // Footer Note
    html += '<div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; font-size: 12px; line-height: 1.6;">';
    html += '<strong>⚠️ Important Notice:</strong> This certification is valid only for the specific project and scope identified above. ';
    html += 'Any modifications to the electrical system design require re-evaluation and re-certification by a licensed professional engineer.';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Generate affidavit of undertaking
 * Required for some building permit applications
 * @returns {string} HTML for affidavit
 */
function generateAffidavitOfUndertaking() {
    const pe = getPEInformation();
    const projectName = document.getElementById('projectName')?.value || '[Project Name]';
    
    let html = '';
    
    html += '<div class="affidavit-undertaking" style="page-break-before: always; padding: 40px; background: #fff;">';
    
    html += '<div style="text-align: center; margin-bottom: 30px;">';
    html += '<h2 style="margin: 0 0 10px 0; font-size: 22px;">AFFIDAVIT OF UNDERTAKING</h2>';
    html += '<p style="margin: 0; font-size: 14px; color: #666;">(Republic of the Philippines)</p>';
    html += '</div>';
    
    html += '<div style="line-height: 2; font-size: 14px; text-align: justify; margin: 30px 0;">';
    html += '<p style="margin-bottom: 20px;">I, <strong>' + (pe.engineerName || '[ENGINEER NAME]') + '</strong>, ';
    html += 'Filipino, of legal age, Licensed Electrical Engineer with PRC License No. <strong>' + (pe.prcLicenseNo || '[LICENSE NO.]') + '</strong>, ';
    html += 'after having been duly sworn in accordance with law, do hereby depose and state:</p>';
    
    html += '<ol style="padding-left: 30px;">';
    html += '<li style="margin-bottom: 15px;">That I am the Professional Electrical Engineer who prepared the electrical plans, specifications, and calculations for the project titled <strong>"' + projectName + '"</strong>;</li>';
    html += '<li style="margin-bottom: 15px;">That I have personally checked and verified all electrical calculations including but not limited to: short circuit analysis, load flow analysis, voltage drop calculations, and arc flash hazard assessment;</li>';
    html += '<li style="margin-bottom: 15px;">That all calculations and designs conform to the Philippine Electrical Code (PEC) 2017 Edition, National Electrical Code (NEC) 2023, and all applicable IEEE standards;</li>';
    html += '<li style="margin-bottom: 15px;">That I am aware of the technical requirements and assume full responsibility for the accuracy and adequacy of the electrical system design;</li>';
    html += '<li style="margin-bottom: 15px;">That I shall supervise the installation and testing of the electrical system to ensure compliance with approved plans and specifications;</li>';
    html += '<li style="margin-bottom: 15px;">That I undertake to coordinate with the Office of the Building Official and other concerned agencies for inspections and compliance verification.</li>';
    html += '</ol>';
    
    html += '<p style="margin: 30px 0 20px 0;">IN WITNESS WHEREOF, I have hereunto set my hand this _____ day of _____________, 20_____ at _________________, Philippines.</p>';
    html += '</div>';
    
    html += '<div style="margin: 50px 0 30px 150px;">';
    html += '<div style="width: 300px; border-bottom: 2px solid #000; padding-top: 80px; margin-bottom: 5px;"></div>';
    html += '<p style="margin: 5px 0; text-align: center; font-weight: bold;">' + (pe.engineerName || '[ENGINEER NAME]') + '</p>';
    html += '<p style="margin: 0; text-align: center; font-size: 12px;">Affiant / Licensed Electrical Engineer</p>';
    html += '<p style="margin: 0; text-align: center; font-size: 12px;">PRC License No. ' + (pe.prcLicenseNo || '[LICENSE NO.]') + '</p>';
    html += '<p style="margin: 0; text-align: center; font-size: 12px;">PTR No. ' + (pe.ptrNumber || '[PTR NO.]') + ' / ' + (pe.ptrDate || '[DATE]') + ' / ' + (pe.ptrIssuedAt || '[LOCATION]') + '</p>';
    html += '<p style="margin: 0; text-align: center; font-size: 12px;">TIN: ' + (pe.tin || '[TIN]') + '</p>';
    html += '</div>';
    
    html += '<div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #000;">';
    html += '<p style="font-size: 14px; margin-bottom: 20px;"><strong>SUBSCRIBED AND SWORN</strong> to before me this _____ day of _____________, 20_____ at _________________, Philippines, affiant exhibiting to me his/her Community Tax Certificate (CTC) / Identification Card.</p>';
    html += '<div style="margin-left: 150px; margin-top: 50px;">';
    html += '<div style="width: 300px; border-bottom: 2px solid #000; padding-top: 80px; margin-bottom: 5px;"></div>';
    html += '<p style="margin: 5px 0; text-align: center; font-weight: bold;">[NOTARY PUBLIC NAME]</p>';
    html += '<p style="margin: 0; text-align: center; font-size: 12px;">Notary Public</p>';
    html += '<p style="margin: 15px 0 0 0; text-align: left; font-size: 12px;">Doc. No. _______</p>';
    html += '<p style="margin: 0; text-align: left; font-size: 12px;">Page No. _______</p>';
    html += '<p style="margin: 0; text-align: left; font-size: 12px;">Book No. _______</p>';
    html += '<p style="margin: 0; text-align: left; font-size: 12px;">Series of 20___</p>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Export PE certification as standalone document
 */
function exportPECertification() {
    const validation = validatePECertification();
    
    if (!validation.isValid) {
        alert('PE Certification is incomplete. Missing: ' + validation.missing.join(', '));
        return;
    }
    
    const projectName = document.getElementById('projectName')?.value || 'Project';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = projectName.replace(/\s+/g, '_') + '_PE_Certification_' + timestamp + '.html';
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>PE Certification - ' + projectName + '</title>';
    html += '<style>body { font-family: Arial, sans-serif; max-width: 210mm; margin: 20mm auto; } @media print { body { margin: 0; } }</style>';
    html += '</head><body>';
    html += generatePECertificationBlock();
    html += generateAffidavitOfUndertaking();
    html += '</body></html>';
    
    // Create and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ PE Certification exported: ' + filename);
}

// Export functions to global scope
window.initPECertification = initPECertification;
window.getPEInformation = getPEInformation;
window.updatePEInformation = updatePEInformation;
window.validatePECertification = validatePECertification;
window.generatePECertificationBlock = generatePECertificationBlock;
window.generateAffidavitOfUndertaking = generateAffidavitOfUndertaking;
window.exportPECertification = exportPECertification;

console.log('✅ PE Certification module loaded');
