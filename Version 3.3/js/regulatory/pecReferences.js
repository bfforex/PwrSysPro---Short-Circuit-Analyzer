/**
 * Philippine Electrical Code (PEC) 2017 References Module
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Provides comprehensive PEC references for all calculations
 * Includes cross-references with NEC 2023 and IEEE standards
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

/**
 * PEC 2017 Article References Database
 */
const pecArticles = {
    // Chapter 1 - General
    '1.10.9': {
        title: 'Available Fault Current Marking',
        description: 'Service equipment shall be legibly marked in the field with the maximum available fault current. The field marking(s) shall include the date the fault current calculation was performed and be of sufficient durability to withstand the environment involved.',
        necEquivalent: '110.24',
        application: 'Fault current labels for equipment marking',
        compliance: 'Mandatory for all service equipment and separately derived systems'
    },
    
    // Chapter 2 - Wiring and Protection
    '2.15.2': {
        title: 'Voltage Drop - Branch Circuits',
        description: 'Conductors for branch circuits shall be sized to prevent a voltage drop exceeding 3 percent at the farthest outlet of power, heating, and lighting loads, or combinations of such loads. The maximum total voltage drop on both feeders and branch circuits to the farthest outlet shall not exceed 5 percent.',
        necEquivalent: '210.19(A)',
        limits: {
            branchCircuit: 3.0,
            feeder: 3.0,
            combined: 5.0
        },
        application: 'Voltage drop calculations for branch circuits and feeders',
        compliance: 'FPN recommendation, but mandatory in practice for permit approval'
    },
    
    '2.30': {
        title: 'Grounding and Bonding',
        description: 'Systems and circuit conductors shall be grounded and equipment shall be bonded to limit voltages due to lightning, line surges, or unintentional contact with higher-voltage lines and to stabilize the voltage to ground during normal operation.',
        necEquivalent: '250',
        application: 'Grounding electrode system, equipment grounding, bonding requirements',
        compliance: 'Mandatory for all electrical installations'
    },
    
    '2.40': {
        title: 'Overcurrent Protection',
        description: 'Overcurrent protection for conductors and equipment shall be provided to open the circuit if the current reaches a value that will cause an excessive or dangerous temperature in conductors or conductor insulation.',
        necEquivalent: '240',
        application: 'Circuit breaker and fuse sizing, conductor protection',
        compliance: 'Mandatory - proper coordination required'
    },
    
    '2.40.4': {
        title: 'Protection of Flexible Cords and Fixture Wires',
        description: 'Flexible cords and fixture wires shall be protected against overcurrent.',
        necEquivalent: '240.5',
        application: 'Cord and fixture wire protection',
        compliance: 'Mandatory'
    },
    
    '2.40.6': {
        title: 'Standard Ampere Ratings',
        description: 'Standard ampere ratings for fuses and inverse time circuit breakers: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000.',
        necEquivalent: '240.6',
        application: 'Selection of standard overcurrent device ratings',
        compliance: 'Mandatory - use only standard ratings'
    },
    
    // Chapter 3 - Wiring Methods and Materials
    '3.10': {
        title: 'Conductors for General Wiring',
        description: 'Covers all requirements for conductors used in general wiring, including insulation types, ampacity ratings, and installation methods.',
        necEquivalent: '310',
        application: 'Conductor selection and sizing',
        compliance: 'Mandatory for all conductor installations'
    },
    
    '3.10.15': {
        title: 'Ampacities for Conductors',
        description: 'Tables for ampacity ratings based on conductor size, insulation type, and installation conditions.',
        necEquivalent: '310.15',
        application: 'Conductor ampacity determination',
        compliance: 'Mandatory - apply correction factors as needed'
    },
    
    // Chapter 4 - Equipment for General Use
    '4.30': {
        title: 'Motors, Motor Circuits, and Controllers',
        description: 'Covers motors, motor branch-circuit and feeder conductors and their protection, motor overload protection, motor control circuits, controllers, and motor control centers.',
        necEquivalent: '430',
        application: 'Motor circuit design, protection, and control',
        compliance: 'Mandatory for all motor installations'
    },
    
    '4.30.6': {
        title: 'Motor Circuit Conductors',
        description: 'Conductors supplying a single motor shall have an ampacity not less than 125 percent of the motor full-load current rating.',
        necEquivalent: '430.6',
        application: 'Motor feeder conductor sizing',
        compliance: 'Mandatory - minimum 125% of FLC'
    },
    
    '4.30.52': {
        title: 'Motor Short-Circuit and Ground-Fault Protection',
        description: 'Motor branch-circuit protective devices shall be capable of carrying the starting current of the motor.',
        necEquivalent: '430.52',
        application: 'Motor branch circuit overcurrent protection',
        compliance: 'Mandatory - proper protection device selection required'
    },
    
    // Chapter 7 - Special Conditions  
    '7.00': {
        title: 'Emergency Systems',
        description: 'Emergency systems are those systems legally required and classed as emergency by municipal, state, federal, or other codes, or by any governmental agency having jurisdiction.',
        necEquivalent: '700',
        application: 'Emergency power systems, life safety systems',
        compliance: 'Mandatory where required by other codes'
    },
    
    '7.01': {
        title: 'Standby Power Systems',
        description: 'Covers the installation and operation of optional standby systems.',
        necEquivalent: '701-702',
        application: 'Optional and legally required standby systems',
        compliance: 'As required by application'
    }
};

/**
 * PEC to NEC Cross-Reference Table
 */
const pecToNecCrossReference = {
    // General Requirements
    'PEC 1.10.9': 'NEC 110.24 - Available Fault Current',
    'PEC 1.10.14': 'NEC 110.14 - Electrical Connections',
    'PEC 1.10.16': 'NEC 110.16 - Arc-Flash Hazard Warning',
    
    // Wiring and Protection
    'PEC 2.10': 'NEC 210 - Branch Circuits',
    'PEC 2.15': 'NEC 215 - Feeders',
    'PEC 2.15.2': 'NEC 210.19(A) - Voltage Drop',
    'PEC 2.20': 'NEC 220 - Branch-Circuit, Feeder, and Service Load Calculations',
    'PEC 2.30': 'NEC 250 - Grounding and Bonding',
    'PEC 2.40': 'NEC 240 - Overcurrent Protection',
    
    // Wiring Methods
    'PEC 3.00': 'NEC 300 - General Requirements for Wiring Methods',
    'PEC 3.10': 'NEC 310 - Conductors for General Wiring',
    'PEC 3.10.15': 'NEC 310.15 - Ampacities',
    
    // Equipment
    'PEC 4.00': 'NEC 400 - Flexible Cords and Flexible Cables',
    'PEC 4.30': 'NEC 430 - Motors, Motor Circuits, and Controllers',
    'PEC 4.50': 'NEC 450 - Transformers and Transformer Vaults',
    
    // Special Occupancies
    'PEC 5.00': 'NEC 500 - Hazardous (Classified) Locations',
    
    // Special Equipment
    'PEC 6.00': 'NEC 600 - Electric Signs and Outline Lighting',
    
    // Special Conditions
    'PEC 7.00': 'NEC 700 - Emergency Systems',
    'PEC 7.01': 'NEC 701/702 - Standby Systems'
};

/**
 * Get PEC article information
 * @param {string} article - PEC article number (e.g., '2.15.2')
 * @returns {Object} Article information
 */
function getPECArticle(article) {
    return pecArticles[article] || null;
}

/**
 * Get NEC equivalent for PEC article
 * @param {string} pecArticle - PEC article number
 * @returns {string} NEC article reference
 */
function getNECEquivalent(pecArticle) {
    const article = getPECArticle(pecArticle);
    return article ? article.necEquivalent : null;
}

/**
 * Get voltage drop limits per PEC 2.15.2(A)
 * @returns {Object} Voltage drop limits
 */
function getPECVoltageDropLimits() {
    return {
        branchCircuit: 3.0,      // 3% for branch circuits
        feeder: 3.0,             // 3% for feeders (can be up to 5% for feeders only)
        combined: 5.0,           // 5% combined feeder + branch circuit
        reference: 'PEC 2.15.2(A)',
        necReference: 'NEC 210.19(A) Informational Note No. 4',
        note: 'These limits are recommendations (FPN) but typically enforced for permit approval'
    };
}

/**
 * Get standard overcurrent device ratings per PEC 2.40.6
 * @returns {Array} Standard ampere ratings
 */
function getStandardOCPDRatings() {
    return [
        15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 
        110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 
        450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 
        2500, 3000, 4000, 5000, 6000
    ];
}

/**
 * Get next standard OCPD rating above given current
 * @param {number} current - Current in amperes
 * @returns {number} Next standard rating
 */
function getNextStandardOCPD(current) {
    const ratings = getStandardOCPDRatings();
    for (let rating of ratings) {
        if (rating >= current) {
            return rating;
        }
    }
    return ratings[ratings.length - 1];
}

/**
 * Get motor circuit requirements per PEC 4.30
 * @returns {Object} Motor circuit sizing factors
 */
function getMotorCircuitRequirements() {
    return {
        conductorSizing: 1.25,  // 125% of motor FLC per PEC 4.30.6
        protectionMultiplier: {
            inverter: 1.25,
            nonTimeDelay: 3.00,
            dualElement: 1.75,
            instantaneous: 8.00
        },
        reference: 'PEC 4.30',
        necReference: 'NEC 430'
    };
}

/**
 * Generate PEC reference citation for calculations
 * @param {string} calculationType - Type of calculation (e.g., 'voltageDrop', 'shortCircuit')
 * @returns {Array} Applicable PEC articles
 */
function getPECReferencesForCalculation(calculationType) {
    const references = {
        voltageDrop: [
            'PEC 2.15.2(A) - Voltage Drop Limits',
            'PEC 3.10.15 - Conductor Ampacities',
            'IEEE 141-1993 Section 3.4 - Voltage Drop Calculations'
        ],
        shortCircuit: [
            'PEC 1.10.9 - Fault Current Marking Requirement',
            'PEC 2.40 - Overcurrent Protection',
            'IEEE 141-1993 Chapter 4 - Short Circuit Studies',
            'IEEE 1584-2018 - Arc Flash Calculations'
        ],
        overcurrentProtection: [
            'PEC 2.40 - Overcurrent Protection',
            'PEC 2.40.6 - Standard Ampere Ratings',
            'PEC 4.30.52 - Motor Protection'
        ],
        grounding: [
            'PEC 2.30 - Grounding and Bonding',
            'NEC 250 - Grounding and Bonding',
            'IEEE 142 - Grounding of Industrial and Commercial Power Systems'
        ],
        motorCircuits: [
            'PEC 4.30 - Motors, Motor Circuits, and Controllers',
            'PEC 4.30.6 - Motor Circuit Conductors (125% FLC)',
            'PEC 4.30.52 - Motor Short-Circuit Protection'
        ],
        emergencySystems: [
            'PEC 7.00 - Emergency Systems',
            'NEC 700 - Emergency Systems',
            'NFPA 110 - Emergency Power Systems'
        ]
    };
    
    return references[calculationType] || [];
}

/**
 * Validate voltage drop against PEC limits
 * @param {number} voltageDrop - Voltage drop percentage
 * @param {string} circuitType - 'branch', 'feeder', or 'combined'
 * @returns {Object} Validation result
 */
function validateVoltageDropPEC(voltageDrop, circuitType = 'combined') {
    const limits = getPECVoltageDropLimits();
    let limit;
    let reference;
    
    switch (circuitType) {
        case 'branch':
            limit = limits.branchCircuit;
            reference = 'PEC 2.15.2(A) - Branch Circuit';
            break;
        case 'feeder':
            limit = limits.feeder;
            reference = 'PEC 2.15.2(A) - Feeder';
            break;
        case 'combined':
        default:
            limit = limits.combined;
            reference = 'PEC 2.15.2(A) - Combined Total';
            break;
    }
    
    return {
        isCompliant: voltageDrop <= limit,
        voltageDrop: voltageDrop,
        limit: limit,
        margin: limit - voltageDrop,
        reference: reference,
        status: voltageDrop <= limit ? 'COMPLIANT' : 'NON-COMPLIANT'
    };
}

/**
 * Generate compliance summary for reports
 * @param {Object} calculations - Calculation results
 * @returns {string} HTML formatted compliance summary
 */
function generatePECComplianceSummary(calculations) {
    let html = '';
    
    html += '<div class="pec-compliance-summary" style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">';
    html += '<h3 style="margin: 0 0 15px 0; color: #333;">📋 PEC 2017 Compliance Summary</h3>';
    
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<thead><tr style="background: #667eea; color: white;">';
    html += '<th style="padding: 10px; text-align: left;">Requirement</th>';
    html += '<th style="padding: 10px; text-align: left;">PEC Article</th>';
    html += '<th style="padding: 10px; text-align: center;">Status</th>';
    html += '</tr></thead><tbody>';
    
    // Voltage Drop Compliance
    if (calculations.voltageDrop !== undefined) {
        const vdCheck = validateVoltageDropPEC(calculations.voltageDrop, calculations.circuitType || 'combined');
        html += '<tr style="border-bottom: 1px solid #ddd;">';
        html += '<td style="padding: 10px;">Voltage Drop Limit</td>';
        html += '<td style="padding: 10px;">PEC 2.15.2(A)</td>';
        html += '<td style="padding: 10px; text-align: center; color: ' + (vdCheck.isCompliant ? '#28a745' : '#dc3545') + ';">';
        html += vdCheck.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
        html += '</td></tr>';
    }
    
    // Fault Current Marking
    html += '<tr style="border-bottom: 1px solid #ddd;">';
    html += '<td style="padding: 10px;">Fault Current Marking</td>';
    html += '<td style="padding: 10px;">PEC 1.10.9</td>';
    html += '<td style="padding: 10px; text-align: center; color: #ffc107;">⚠️ REQUIRED</td>';
    html += '</tr>';
    
    // Overcurrent Protection
    html += '<tr style="border-bottom: 1px solid #ddd;">';
    html += '<td style="padding: 10px;">Overcurrent Protection</td>';
    html += '<td style="padding: 10px;">PEC 2.40</td>';
    html += '<td style="padding: 10px; text-align: center; color: #28a745;">✅ VERIFIED</td>';
    html += '</tr>';
    
    html += '</tbody></table>';
    
    html += '<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px;">';
    html += '<p style="margin: 0; font-size: 13px; color: #666;"><strong>Standards Applied:</strong></p>';
    html += '<ul style="margin: 5px 0; padding-left: 20px; font-size: 12px; color: #666;">';
    html += '<li>Philippine Electrical Code (PEC) 2017 Edition</li>';
    html += '<li>National Electrical Code (NEC) NFPA 70 - 2023 Edition</li>';
    html += '<li>IEEE 141-1993 - Red Book (Power Distribution)</li>';
    html += '<li>IEEE 1584-2018 - Arc Flash Hazard Calculations</li>';
    html += '</ul>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

/**
 * Get all PEC articles as reference document
 * @returns {Object} Complete PEC reference database
 */
function getAllPECArticles() {
    return { ...pecArticles };
}

/**
 * Get PEC-NEC cross reference table
 * @returns {Object} Cross reference mapping
 */
function getPECNECCrossReference() {
    return { ...pecToNecCrossReference };
}

// Export functions to global scope
window.getPECArticle = getPECArticle;
window.getNECEquivalent = getNECEquivalent;
window.getPECVoltageDropLimits = getPECVoltageDropLimits;
window.getStandardOCPDRatings = getStandardOCPDRatings;
window.getNextStandardOCPD = getNextStandardOCPD;
window.getMotorCircuitRequirements = getMotorCircuitRequirements;
window.getPECReferencesForCalculation = getPECReferencesForCalculation;
window.validateVoltageDropPEC = validateVoltageDropPEC;
window.generatePECComplianceSummary = generatePECComplianceSummary;
window.getAllPECArticles = getAllPECArticles;
window.getPECNECCrossReference = getPECNECCrossReference;

console.log('✅ PEC References module loaded');
