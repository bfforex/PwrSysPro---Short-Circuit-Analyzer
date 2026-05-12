/**
 * Enhanced Project Information Module
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Extended project information schema for building permit submissions
 * Includes owner, utility, and permit tracking information
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

// Enhanced Project Information State
const projectInfoState = {
    // Basic Project Info
    projectName: '',
    projectNumber: '',
    projectDate: new Date().toISOString().split('T')[0],
    
    // Project Identification
    projectAddress: {
        street: '',
        barangay: '',
        city: '',
        province: '',
        zipCode: '',
        country: 'Philippines'
    },
    buildingType: '',           // e.g., 'Commercial', 'Industrial', 'Residential', 'Institutional'
    floorArea: '',              // in square meters
    numberOfFloors: '',
    occupancyClass: '',         // Per National Building Code
    
    // Owner/Applicant Information
    owner: {
        name: '',
        companyName: '',
        address: '',
        contactNumber: '',
        email: '',
        tinNumber: ''
    },
    
    // Utility Information
    utility: {
        provider: '',           // e.g., 'MERALCO', 'Provincial Electric Cooperative'
        serviceVoltage: '',     // e.g., '13.2 kV', '230/400V'
        contractDemand: '',     // in kVA
        accountNumber: '',
        meterNumber: '',
        serviceType: ''         // e.g., 'Primary Metered', 'Secondary Metered'
    },
    
    // Permit Information
    permits: {
        buildingPermitNo: '',
        buildingPermitDate: '',
        electricalPermitNo: '',
        electricalPermitDate: '',
        mechanicalPermitNo: '',
        fireCodePermitNo: '',
        issuingOffice: ''       // Office of the Building Official
    },
    
    // Professional Information (Engineer of Record)
    engineer: {
        name: '',
        prcLicenseNo: '',
        ptrNumber: '',
        tin: '',
        address: '',
        contactNumber: '',
        email: ''
    },
    
    // Contractor Information
    contractor: {
        name: '',
        pcabLicenseNo: '',      // Philippine Contractors Accreditation Board
        address: '',
        contactNumber: '',
        email: ''
    },
    
    // Design Parameters
    designParameters: {
        ambientTemperature: 30,  // °C
        altitude: 0,             // meters above sea level
        seismicZone: '',
        windSpeed: '',           // m/s
        floodLevel: ''           // meters
    }
};

/**
 * Initialize project information module
 */
function initProjectInfo() {
    console.log('🔧 Initializing Enhanced Project Info module...');
    
    // Load from localStorage if available
    loadProjectInfo();
    
    // Sync with existing project fields
    syncWithExistingFields();
    
    console.log('✅ Enhanced Project Info module initialized');
}

/**
 * Sync with existing project name and engineer fields in the UI
 */
function syncWithExistingFields() {
    const projectNameField = document.getElementById('projectName');
    const engineerField = document.getElementById('engineer');
    const projectNumberField = document.getElementById('projectNumber');
    
    if (projectNameField && projectNameField.value) {
        projectInfoState.projectName = projectNameField.value;
    }
    
    if (engineerField && engineerField.value) {
        projectInfoState.engineer.name = engineerField.value;
    }
    
    if (projectNumberField && projectNumberField.value) {
        projectInfoState.projectNumber = projectNumberField.value;
    }
    
    // Set up listeners for changes
    if (projectNameField) {
        projectNameField.addEventListener('input', (e) => {
            projectInfoState.projectName = e.target.value;
            saveProjectInfo();
        });
    }
    
    if (engineerField) {
        engineerField.addEventListener('input', (e) => {
            projectInfoState.engineer.name = e.target.value;
            saveProjectInfo();
        });
    }
}

/**
 * Get complete project information
 * @returns {Object} Project information
 */
function getProjectInfo() {
    return JSON.parse(JSON.stringify(projectInfoState));
}

/**
 * Update project information
 * @param {Object} updates - Fields to update (can be nested)
 */
function updateProjectInfo(updates) {
    // Deep merge updates into state
    deepMerge(projectInfoState, updates);
    saveProjectInfo();
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 */
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}

/**
 * Save project information to localStorage
 */
function saveProjectInfo() {
    try {
        localStorage.setItem('enhancedProjectInfo', JSON.stringify(projectInfoState));
        console.log('✅ Project information saved');
    } catch (error) {
        console.error('❌ Error saving project information:', error);
    }
}

/**
 * Load project information from localStorage
 */
function loadProjectInfo() {
    try {
        const saved = localStorage.getItem('enhancedProjectInfo');
        if (saved) {
            const loaded = JSON.parse(saved);
            deepMerge(projectInfoState, loaded);
            console.log('✅ Project information loaded');
        }
    } catch (error) {
        console.error('❌ Error loading project information:', error);
    }
}

/**
 * Validate project information completeness for permit submission
 * @returns {Object} Validation result
 */
function validateProjectInfoForPermit() {
    const required = {
        basic: ['projectName', 'buildingType'],
        address: ['projectAddress.street', 'projectAddress.city'],
        owner: ['owner.name', 'owner.contactNumber'],
        utility: ['utility.provider', 'utility.serviceVoltage'],
        engineer: ['engineer.name', 'engineer.prcLicenseNo'],
        permits: ['permits.issuingOffice']
    };
    
    const missing = [];
    
    for (const category in required) {
        for (const field of required[category]) {
            const value = getNestedValue(projectInfoState, field);
            if (!value) {
                missing.push(field.replace(/\./g, ' > '));
            }
        }
    }
    
    const totalRequired = Object.values(required).flat().length;
    const completeness = ((totalRequired - missing.length) / totalRequired * 100).toFixed(0);
    
    return {
        isValid: missing.length === 0,
        missing: missing,
        completeness: completeness,
        status: completeness >= 80 ? 'Ready for Submission' : 
                completeness >= 50 ? 'Needs Attention' : 'Incomplete'
    };
}

/**
 * Get nested object value by path
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

/**
 * Generate project information cover page
 * @returns {string} HTML for cover page
 */
function generateProjectCoverPage() {
    const info = getProjectInfo();
    const validation = validateProjectInfoForPermit();
    
    let html = '';
    
    html += '<div class="project-cover-page" style="page-break-after: always; padding: 40px; background: #fff;">';
    
    // Header
    html += '<div style="text-align: center; border-bottom: 4px solid #667eea; padding-bottom: 30px; margin-bottom: 40px;">';
    html += '<h1 style="margin: 0 0 10px 0; font-size: 28px; color: #1a1a1a;">SHORT CIRCUIT ANALYSIS</h1>';
    html += '<h1 style="margin: 0 0 20px 0; font-size: 28px; color: #1a1a1a;">AND POWER SYSTEM STUDY</h1>';
    html += '<div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px;">';
    html += '<h2 style="margin: 0; font-size: 24px; color: #667eea;">' + (info.projectName || '[PROJECT NAME]') + '</h2>';
    html += '</div>';
    html += '<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Document prepared for Building Permit / Electrical Installation Permit submission</p>';
    html += '</div>';
    
    // Project Details
    html += '<div style="margin: 30px 0;">';
    html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Project Information</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 8px 0; width: 180px; font-weight: bold;">Project Number:</td><td>' + (info.projectNumber || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Building Type:</td><td>' + (info.buildingType || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Floor Area:</td><td>' + (info.floorArea ? info.floorArea + ' sq.m.' : 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Number of Floors:</td><td>' + (info.numberOfFloors || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Document Date:</td><td>' + (info.projectDate || 'N/A') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Location
    html += '<div style="margin: 30px 0;">';
    html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Project Location</h3>';
    html += '<p style="margin: 5px 0; line-height: 1.8;">';
    if (info.projectAddress.street) html += info.projectAddress.street + '<br>';
    if (info.projectAddress.barangay) html += 'Barangay ' + info.projectAddress.barangay + '<br>';
    if (info.projectAddress.city) html += info.projectAddress.city;
    if (info.projectAddress.province) html += ', ' + info.projectAddress.province;
    if (info.projectAddress.zipCode) html += ' ' + info.projectAddress.zipCode + '<br>';
    html += info.projectAddress.country || 'Philippines';
    html += '</p>';
    html += '</div>';
    
    // Owner Information
    html += '<div style="margin: 30px 0;">';
    html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Owner / Applicant</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 8px 0; width: 180px; font-weight: bold;">Name:</td><td>' + (info.owner.name || 'N/A') + '</td></tr>';
    if (info.owner.companyName) {
        html += '<tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>' + info.owner.companyName + '</td></tr>';
    }
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Contact:</td><td>' + (info.owner.contactNumber || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>' + (info.owner.email || 'N/A') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Utility Information
    html += '<div style="margin: 30px 0;">';
    html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Utility Service</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 8px 0; width: 180px; font-weight: bold;">Provider:</td><td>' + (info.utility.provider || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Service Voltage:</td><td>' + (info.utility.serviceVoltage || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Contract Demand:</td><td>' + (info.utility.contractDemand ? info.utility.contractDemand + ' kVA' : 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Service Type:</td><td>' + (info.utility.serviceType || 'N/A') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Permit Information
    if (info.permits.buildingPermitNo || info.permits.electricalPermitNo) {
        html += '<div style="margin: 30px 0;">';
        html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Permit Information</h3>';
        html += '<table style="width: 100%; border-collapse: collapse;">';
        if (info.permits.buildingPermitNo) {
            html += '<tr><td style="padding: 8px 0; width: 180px; font-weight: bold;">Building Permit No.:</td><td>' + info.permits.buildingPermitNo + '</td></tr>';
        }
        if (info.permits.electricalPermitNo) {
            html += '<tr><td style="padding: 8px 0; font-weight: bold;">Electrical Permit No.:</td><td>' + info.permits.electricalPermitNo + '</td></tr>';
        }
        html += '<tr><td style="padding: 8px 0; font-weight: bold;">Issuing Office:</td><td>' + (info.permits.issuingOffice || 'Office of the Building Official') + '</td></tr>';
        html += '</table>';
        html += '</div>';
    }
    
    // Engineer of Record
    html += '<div style="margin: 30px 0;">';
    html += '<h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">Engineer of Record</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 8px 0; width: 180px; font-weight: bold;">Name:</td><td>' + (info.engineer.name || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">PRC License No.:</td><td>' + (info.engineer.prcLicenseNo || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Contact:</td><td>' + (info.engineer.contactNumber || 'N/A') + '</td></tr>';
    html += '<tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>' + (info.engineer.email || 'N/A') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    
    // Compliance Statement
    html += '<div style="margin: 40px 0; padding: 20px; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">';
    html += '<h4 style="margin: 0 0 10px 0; color: #333;">Codes and Standards</h4>';
    html += '<p style="margin: 5px 0; font-size: 14px; line-height: 1.6;">This document has been prepared in accordance with:</p>';
    html += '<ul style="margin: 10px 0; padding-left: 25px; font-size: 14px; line-height: 1.8;">';
    html += '<li>Philippine Electrical Code (PEC) 2017 Edition</li>';
    html += '<li>National Electrical Code (NEC) NFPA 70 - 2023 Edition</li>';
    html += '<li>IEEE Standard 141-1993 (Red Book)</li>';
    html += '<li>IEEE Standard 1584-2018 (Arc Flash Calculations)</li>';
    html += '<li>National Building Code of the Philippines (PD 1096)</li>';
    html += '</ul>';
    html += '</div>';
    
    // Completeness indicator
    if (validation.completeness < 100) {
        html += '<div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">';
        html += '<p style="margin: 0; font-size: 13px;"><strong>⚠️ Note:</strong> Project information is ' + validation.completeness + '% complete. ';
        html += 'Complete all required fields for permit submission.</p>';
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}

/**
 * Open project information modal for editing
 */
function openProjectInfoModal() {
    alert('Project Information Editor\n\nThis feature allows you to edit all project details.\nImplement a comprehensive modal UI for full editing capabilities.');
    // TODO: Implement comprehensive modal UI
}

/**
 * Export project information summary
 */
function exportProjectInfoSummary() {
    const projectName = projectInfoState.projectName || 'Project';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = projectName.replace(/\s+/g, '_') + '_ProjectInfo_' + timestamp + '.html';
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Project Information - ' + projectName + '</title>';
    html += '<style>body { font-family: Arial, sans-serif; max-width: 210mm; margin: 20mm auto; } @media print { body { margin: 0; } }</style>';
    html += '</head><body>';
    html += generateProjectCoverPage();
    html += '</body></html>';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Project information exported: ' + filename);
}

// Export functions to global scope
window.initProjectInfo = initProjectInfo;
window.getProjectInfo = getProjectInfo;
window.updateProjectInfo = updateProjectInfo;
window.validateProjectInfoForPermit = validateProjectInfoForPermit;
window.generateProjectCoverPage = generateProjectCoverPage;
window.openProjectInfoModal = openProjectInfoModal;
window.exportProjectInfoSummary = exportProjectInfoSummary;

console.log('✅ Enhanced Project Info module loaded');
