/**
 * Regulatory Compliance Module - Main Orchestrator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Manages all regulatory compliance features for building permit submissions
 * Orchestrates PE Certification, PEC References, Project Info, and Labels
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

// Regulatory Compliance State
const regulatoryState = {
    initialized: false,
    modulesLoaded: {
        peCertification: false,
        pecReferences: false,
        projectInfo: false,
        faultCurrentLabels: false
    },
    complianceChecklist: [],
    lastUpdated: null
};

/**
 * Initialize all regulatory compliance modules
 */
function initRegulatoryCompliance() {
    console.log('🔧 Initializing Regulatory Compliance System...');
    
    try {
        // Initialize PE Certification module
        if (typeof initPECertification === 'function') {
            initPECertification();
            regulatoryState.modulesLoaded.peCertification = true;
        }
        
        // Initialize Project Info module
        if (typeof initProjectInfo === 'function') {
            initProjectInfo();
            regulatoryState.modulesLoaded.projectInfo = true;
        }
        
        // PEC References and Fault Labels are passive modules (no init required)
        regulatoryState.modulesLoaded.pecReferences = true;
        regulatoryState.modulesLoaded.faultCurrentLabels = true;
        
        regulatoryState.initialized = true;
        regulatoryState.lastUpdated = new Date().toISOString();
        
        console.log('✅ Regulatory Compliance System initialized successfully');
        console.log('📊 Module Status:', regulatoryState.modulesLoaded);
        
        // Update compliance checklist
        updateComplianceChecklist();
        
    } catch (error) {
        console.error('❌ Error initializing Regulatory Compliance:', error);
        regulatoryState.initialized = false;
    }
}

/**
 * Get regulatory compliance status
 * @returns {Object} Status of all regulatory modules
 */
function getRegulatoryStatus() {
    return {
        initialized: regulatoryState.initialized,
        modules: { ...regulatoryState.modulesLoaded },
        lastUpdated: regulatoryState.lastUpdated,
        checklist: [...regulatoryState.complianceChecklist]
    };
}

/**
 * Update compliance checklist
 * Evaluates completeness of all regulatory requirements
 */
function updateComplianceChecklist() {
    const checklist = [];
    
    // 1. PE Certification
    if (typeof validatePECertification === 'function') {
        const peValidation = validatePECertification();
        checklist.push({
            category: 'PE Certification',
            item: 'Professional Engineer Information',
            status: peValidation.isValid ? 'complete' : 'incomplete',
            completeness: peValidation.completeness,
            missing: peValidation.missing,
            priority: 'high'
        });
    }
    
    // 2. Project Information
    if (typeof validateProjectInfoForPermit === 'function') {
        const projectValidation = validateProjectInfoForPermit();
        checklist.push({
            category: 'Project Information',
            item: 'Complete Project Details for Permit',
            status: projectValidation.isValid ? 'complete' : 'incomplete',
            completeness: projectValidation.completeness,
            missing: projectValidation.missing,
            priority: 'high'
        });
    }
    
    // 3. Calculations Performed
    const buses = window.buses || [];
    const calculatedBuses = buses.filter(b => b.results && b.results.shortCircuit);
    checklist.push({
        category: 'Calculations',
        item: 'Short Circuit Analysis Completed',
        status: calculatedBuses.length > 0 ? 'complete' : 'incomplete',
        completeness: buses.length > 0 ? (calculatedBuses.length / buses.length * 100).toFixed(0) : 0,
        details: calculatedBuses.length + ' of ' + buses.length + ' buses calculated',
        priority: 'high'
    });
    
    // 4. Fault Current Labels
    checklist.push({
        category: 'Documentation',
        item: 'Fault Current Labels (NEC 110.24/PEC 1.10.9)',
        status: calculatedBuses.length > 0 ? 'ready' : 'pending',
        completeness: calculatedBuses.length > 0 ? 100 : 0,
        details: 'Ready to generate for ' + calculatedBuses.length + ' buses',
        priority: 'medium'
    });
    
    // 5. PEC Compliance References
    checklist.push({
        category: 'Standards',
        item: 'PEC 2017 and NEC 2023 References',
        status: 'complete',
        completeness: 100,
        details: 'Reference database loaded',
        priority: 'low'
    });
    
    // 6. Voltage Drop Compliance
    const vdCompliant = calculatedBuses.filter(b => {
        const vd = b.results?.loadFlow?.voltageDrop?.designPercent;
        return vd !== undefined && vd <= 5.0; // PEC 2.15.2(A) limit
    });
    if (calculatedBuses.length > 0) {
        checklist.push({
            category: 'Compliance',
            item: 'Voltage Drop within PEC Limits',
            status: vdCompliant.length === calculatedBuses.length ? 'complete' : 'review',
            completeness: (vdCompliant.length / calculatedBuses.length * 100).toFixed(0),
            details: vdCompliant.length + ' of ' + calculatedBuses.length + ' buses compliant',
            priority: 'high'
        });
    }
    
    regulatoryState.complianceChecklist = checklist;
    return checklist;
}

/**
 * Generate compliance checklist document
 * @returns {string} HTML for compliance checklist
 */
function generateComplianceChecklist() {
    const checklist = updateComplianceChecklist();
    const projectName = document.getElementById('projectName')?.value || 'Project';
    
    let html = '';
    
    html += '<div class="compliance-checklist" style="padding: 30px; background: #fff; max-width: 800px; margin: 20px auto;">';
    
    // Header
    html += '<div style="text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 30px;">';
    html += '<h2 style="margin: 0 0 10px 0; color: #333;">Regulatory Compliance Checklist</h2>';
    html += '<h3 style="margin: 0; color: #667eea;">' + projectName + '</h3>';
    html += '<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Building Permit / Electrical Permit Submission</p>';
    html += '</div>';
    
    // Overall Status
    const completeItems = checklist.filter(item => item.status === 'complete').length;
    const totalItems = checklist.length;
    const overallCompleteness = (completeItems / totalItems * 100).toFixed(0);
    
    html += '<div style="margin-bottom: 30px; padding: 20px; background: ';
    html += overallCompleteness >= 80 ? '#d4edda' : overallCompleteness >= 50 ? '#fff3cd' : '#f8d7da';
    html += '; border-left: 4px solid ';
    html += overallCompleteness >= 80 ? '#28a745' : overallCompleteness >= 50 ? '#ffc107' : '#dc3545';
    html += '; border-radius: 4px;">';
    html += '<h3 style="margin: 0 0 10px 0; color: #333;">Overall Status: ' + overallCompleteness + '% Complete</h3>';
    html += '<div style="background: #fff; height: 30px; border-radius: 15px; overflow: hidden; position: relative;">';
    html += '<div style="background: ';
    html += overallCompleteness >= 80 ? '#28a745' : overallCompleteness >= 50 ? '#ffc107' : '#dc3545';
    html += '; width: ' + overallCompleteness + '%; height: 100%; transition: width 0.3s;"></div>';
    html += '</div>';
    html += '<p style="margin: 10px 0 0 0; font-size: 14px;">' + completeItems + ' of ' + totalItems + ' requirements complete</p>';
    html += '</div>';
    
    // Checklist Items by Category
    const categories = [...new Set(checklist.map(item => item.category))];
    
    for (const category of categories) {
        const items = checklist.filter(item => item.category === category);
        
        html += '<div style="margin-bottom: 25px;">';
        html += '<h3 style="margin: 0 0 15px 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px;">';
        html += category;
        html += '</h3>';
        
        for (const item of items) {
            let statusColor, statusIcon, statusText;
            
            switch (item.status) {
                case 'complete':
                    statusColor = '#28a745';
                    statusIcon = '✅';
                    statusText = 'COMPLETE';
                    break;
                case 'ready':
                    statusColor = '#17a2b8';
                    statusIcon = '✓';
                    statusText = 'READY';
                    break;
                case 'review':
                    statusColor = '#ffc107';
                    statusIcon = '⚠️';
                    statusText = 'NEEDS REVIEW';
                    break;
                case 'incomplete':
                    statusColor = '#dc3545';
                    statusIcon = '❌';
                    statusText = 'INCOMPLETE';
                    break;
                case 'pending':
                    statusColor = '#6c757d';
                    statusIcon = '⏳';
                    statusText = 'PENDING';
                    break;
                default:
                    statusColor = '#999';
                    statusIcon = '◯';
                    statusText = 'UNKNOWN';
            }
            
            html += '<div style="padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-left: 4px solid ' + statusColor + '; border-radius: 4px;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
            html += '<div style="font-weight: bold; font-size: 15px;">' + statusIcon + ' ' + item.item + '</div>';
            html += '<div style="padding: 4px 12px; background: ' + statusColor + '; color: white; border-radius: 12px; font-size: 12px; font-weight: bold;">';
            html += statusText;
            html += '</div>';
            html += '</div>';
            
            // Progress bar
            html += '<div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">';
            html += '<div style="background: ' + statusColor + '; width: ' + item.completeness + '%; height: 100%;"></div>';
            html += '</div>';
            
            // Details
            if (item.details) {
                html += '<p style="margin: 5px 0; font-size: 13px; color: #666;">' + item.details + '</p>';
            }
            
            // Missing items
            if (item.missing && item.missing.length > 0) {
                html += '<p style="margin: 5px 0 0 0; font-size: 12px; color: #dc3545;"><strong>Missing:</strong> ' + item.missing.join(', ') + '</p>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
    }
    
    // Standards Reference
    html += '<div style="margin-top: 30px; padding: 20px; background: #f0f4ff; border-left: 4px solid #667eea; border-radius: 4px;">';
    html += '<h4 style="margin: 0 0 10px 0; color: #333;">📋 Applicable Standards</h4>';
    html += '<ul style="margin: 5px 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">';
    html += '<li>Philippine Electrical Code (PEC) 2017 Edition</li>';
    html += '<li>National Electrical Code (NEC) NFPA 70 - 2023 Edition</li>';
    html += '<li>IEEE 141-1993 (Red Book) - Power Distribution</li>';
    html += '<li>IEEE 1584-2018 - Arc Flash Hazard Calculations</li>';
    html += '<li>National Building Code of the Philippines (PD 1096)</li>';
    html += '<li>NFPA 70E-2024 - Electrical Safety in the Workplace</li>';
    html += '</ul>';
    html += '</div>';
    
    // Footer
    html += '<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">';
    html += 'Generated: ' + new Date().toLocaleString();
    html += '<br>PwrSys Pro v3.3 - Regulatory Compliance Module';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Export compliance checklist as document
 */
function exportComplianceChecklist() {
    const projectName = document.getElementById('projectName')?.value || 'Project';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = projectName.replace(/\s+/g, '_') + '_ComplianceChecklist_' + timestamp + '.html';
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Compliance Checklist - ' + projectName + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }';
    html += '@media print { body { background: white; } }';
    html += '</style>';
    html += '</head><body>';
    html += generateComplianceChecklist();
    html += '</body></html>';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Compliance checklist exported: ' + filename);
}

/**
 * Generate complete permit submission package
 * Combines all regulatory documents into one package
 */
function exportPermitSubmissionPackage() {
    const projectName = document.getElementById('projectName')?.value || 'Project';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = projectName.replace(/\s+/g, '_') + '_PermitPackage_' + timestamp + '.html';
    
    const buses = window.buses || [];
    
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
    html += '<title>Permit Submission Package - ' + projectName + '</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; }';
    html += '@media print { ';
    html += '  .page-break { page-break-before: always; }';
    html += '  body { margin: 0; }';
    html += '}';
    html += '</style>';
    html += '</head><body>';
    
    // 1. Cover Page (Project Information)
    if (typeof generateProjectCoverPage === 'function') {
        html += generateProjectCoverPage();
    }
    
    // 2. Compliance Checklist
    html += '<div class="page-break"></div>';
    html += generateComplianceChecklist();
    
    // 3. PE Certification
    html += '<div class="page-break"></div>';
    if (typeof generatePECertificationBlock === 'function') {
        html += generatePECertificationBlock();
    }
    
    // 4. Affidavit of Undertaking
    if (typeof generateAffidavitOfUndertaking === 'function') {
        html += generateAffidavitOfUndertaking();
    }
    
    // 5. Fault Current Labels
    html += '<div class="page-break"></div>';
    if (typeof generateAllFaultCurrentLabels === 'function') {
        html += generateAllFaultCurrentLabels(buses, { size: 'medium' });
    }
    
    // 6. Note about main reports
    html += '<div class="page-break"></div>';
    html += '<div style="padding: 40px; text-align: center;">';
    html += '<h2 style="color: #667eea;">Additional Documents</h2>';
    html += '<p style="margin: 20px 0; font-size: 16px; line-height: 1.8;">This permit submission package should be accompanied by:</p>';
    html += '<ul style="display: inline-block; text-align: left; font-size: 15px; line-height: 2;">';
    html += '<li>Complete Short Circuit Analysis Reports (All Buses)</li>';
    html += '<li>Load Flow Analysis Reports</li>';
    html += '<li>Voltage Drop Calculations</li>';
    html += '<li>Arc Flash Hazard Analysis</li>';
    html += '<li>Single Line Diagrams</li>';
    html += '<li>Equipment Schedules</li>';
    html += '</ul>';
    html += '<p style="margin: 30px 0; font-size: 14px; color: #666;">Generate these reports from the Export tab in PwrSys Pro</p>';
    html += '</div>';
    
    html += '</body></html>';
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Permit submission package exported: ' + filename);
}

/**
 * Validate all regulatory data before submission
 * @returns {Object} Comprehensive validation result
 */
function validateRegulatoryData() {
    const validation = {
        isReady: false,
        issues: [],
        warnings: [],
        summary: ''
    };
    
    // Check PE Certification
    if (typeof validatePECertification === 'function') {
        const peCheck = validatePECertification();
        if (!peCheck.isValid) {
            validation.issues.push('PE Certification incomplete: ' + peCheck.missing.join(', '));
        }
    }
    
    // Check Project Information
    if (typeof validateProjectInfoForPermit === 'function') {
        const projectCheck = validateProjectInfoForPermit();
        if (!projectCheck.isValid) {
            validation.issues.push('Project Information incomplete: ' + projectCheck.missing.join(', '));
        }
    }
    
    // Check Calculations
    const buses = window.buses || [];
    const calculatedBuses = buses.filter(b => b.results && b.results.shortCircuit);
    if (calculatedBuses.length === 0) {
        validation.issues.push('No short circuit calculations performed');
    } else if (calculatedBuses.length < buses.length) {
        validation.warnings.push(calculatedBuses.length + ' of ' + buses.length + ' buses calculated');
    }
    
    // Check Voltage Drop Compliance
    const nonCompliantVD = calculatedBuses.filter(b => {
        const vd = b.results?.loadFlow?.voltageDrop?.designPercent;
        return vd !== undefined && vd > 5.0;
    });
    if (nonCompliantVD.length > 0) {
        validation.warnings.push(nonCompliantVD.length + ' buses exceed PEC voltage drop limits');
    }
    
    validation.isReady = validation.issues.length === 0;
    validation.summary = validation.isReady 
        ? 'Ready for permit submission' 
        : validation.issues.length + ' critical issues must be resolved';
    
    return validation;
}

// Export functions to global scope
window.initRegulatoryCompliance = initRegulatoryCompliance;
window.getRegulatoryStatus = getRegulatoryStatus;
window.updateComplianceChecklist = updateComplianceChecklist;
window.generateComplianceChecklist = generateComplianceChecklist;
window.exportComplianceChecklist = exportComplianceChecklist;
window.exportPermitSubmissionPackage = exportPermitSubmissionPackage;
window.validateRegulatoryData = validateRegulatoryData;

console.log('✅ Regulatory Compliance (Main) module loaded');
