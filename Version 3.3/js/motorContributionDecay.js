/**
 * Motor Fault Contribution Decay Module
 * ANSI C37.010-1979 compliant motor decay calculations
 * 
 * @author bfforex
 * @date 2025-12-05
 * @version 3.4.0
 * 
 * Features:
 * - Calculate motor fault contribution at multiple time points
 * - ANSI C37.010 algorithm: I(t) = I"×e^(-t/T") + I'×e^(-t/T') + Iss
 * - DC decay component with X/R ratio
 * - Time points: 0.5, 1.5, 3, 5, 8, 30 cycles
 * - Breaker sizing guidance (use 3-5 cycle value)
 * 
 * Standards Compliance:
 * - ANSI C37.010-1979 - Application Guide for AC High-Voltage Circuit Breakers
 * - IEEE 141-1993 Section 5.3 - Motor Contribution to Short Circuit
 */

console.log('🔧 Loading Motor Contribution Decay Module v3.4.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MOTOR_DECAY_CONFIG = {
    // System frequency
    FREQUENCY: 60,  // Hz
    
    // Time points for decay calculation (in cycles)
    TIME_POINTS: [0.5, 1.5, 3, 5, 8, 30],
    
    // Default motor parameters (per ANSI C37.010)
    DEFAULT_MOTOR_PARAMS: {
        Xd_double_prime: 0.17,  // Subtransient reactance (pu)
        Xd_prime: 0.30,         // Transient reactance (pu)
        Xd: 1.20,               // Synchronous reactance (pu)
        Td_double_prime: 0.03,  // Subtransient time constant (seconds)
        Td_prime: 0.15,         // Transient time constant (seconds)
        X_R_ratio: 10,          // X/R ratio for DC component
        locked_rotor_multiplier: 6.0  // Locked rotor current / FLC
    },
    
    // Motor type specific parameters
    MOTOR_TYPE_PARAMS: {
        'induction': {
            Xd_double_prime: 0.17,
            Xd_prime: 0.30,
            Xd: 1.20,
            Td_double_prime: 0.03,
            Td_prime: 0.15,
            X_R_ratio: 10,
            locked_rotor_multiplier: 6.0
        },
        'synchronous': {
            Xd_double_prime: 0.20,
            Xd_prime: 0.35,
            Xd: 1.50,
            Td_double_prime: 0.04,
            Td_prime: 0.20,
            X_R_ratio: 15,
            locked_rotor_multiplier: 8.0
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR FAULT CONTRIBUTION DECAY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate motor fault contribution at specific time
 * Uses ANSI C37.010 algorithm with DC component
 * 
 * @param {Object} motor - Motor component object
 * @param {Object} faultBus - Bus where fault occurs
 * @param {Number} time_cycles - Time in cycles (60Hz)
 * @returns {Object} Fault contribution at specified time
 */
function calculateMotorFaultContribution(motor, faultBus, time_cycles) {
    const freq = MOTOR_DECAY_CONFIG.FREQUENCY;
    const time_seconds = time_cycles / freq;
    
    // Get motor parameters
    const params = getMotorParameters(motor);
    
    // Calculate motor FLC
    const motorVoltage = motor.voltage || faultBus?.voltage || 480;
    const motorHP = motor.hp || motor.power || 100;
    const motorKW = motorHP * 0.746; // Convert HP to kW
    const motorFLC = (motorKW * 1000) / (Math.sqrt(3) * motorVoltage * 0.85); // Assume 0.85 PF
    
    // Initial subtransient current (locked rotor current)
    const I_double_prime = motorFLC * params.locked_rotor_multiplier;
    
    // Calculate current components per ANSI C37.010
    // I(t) = I"×e^(-t/T") + I'×e^(-t/T') + Iss
    
    // Subtransient component
    const I_subtransient = I_double_prime * Math.exp(-time_seconds / params.Td_double_prime);
    
    // Transient component (difference between transient and subtransient)
    const I_transient_diff = I_double_prime * (params.Xd_double_prime / params.Xd_prime - 1);
    const I_transient = I_transient_diff * Math.exp(-time_seconds / params.Td_prime);
    
    // Steady-state component (typically zero for induction motors, small for synchronous)
    const I_steady_state = motor.type === 'synchronous' ? motorFLC * 0.2 : 0;
    
    // AC component (sum of all components)
    const I_ac = I_subtransient + I_transient + I_steady_state;
    
    // DC component decay
    const tau_dc = (params.X_R_ratio) / (2 * Math.PI * freq); // DC time constant
    const dc_component = I_double_prime * Math.exp(-time_seconds / tau_dc);
    
    // Multiplying factor for DC component (per ANSI C37.010)
    const Mf = Math.sqrt(1 + 2 * Math.pow(dc_component / I_ac, 2));
    
    // Total asymmetric current
    const I_asymmetric = I_ac * Mf;
    
    // Calculate percentage of initial contribution
    const percent_of_initial = (I_ac / I_double_prime) * 100;
    
    return {
        time_cycles,
        time_seconds,
        motorFLC,
        I_initial: I_double_prime,
        I_ac,
        I_dc: dc_component,
        I_asymmetric,
        multiplying_factor: Mf,
        percent_of_initial,
        components: {
            subtransient: I_subtransient,
            transient: I_transient,
            steady_state: I_steady_state
        },
        parameters: params
    };
}

/**
 * Get motor parameters based on motor type or use defaults
 * 
 * @param {Object} motor - Motor component object
 * @returns {Object} Motor parameters
 */
function getMotorParameters(motor) {
    const motorType = motor.motorType || motor.type || 'induction';
    
    // Use motor-specific parameters if provided
    if (motor.parameters) {
        return {
            ...MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS,
            ...motor.parameters
        };
    }
    
    // Use type-specific parameters
    if (MOTOR_DECAY_CONFIG.MOTOR_TYPE_PARAMS[motorType]) {
        return MOTOR_DECAY_CONFIG.MOTOR_TYPE_PARAMS[motorType];
    }
    
    // Fall back to defaults
    return MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS;
}

/**
 * Calculate motor decay curve at all standard time points
 * 
 * @param {Object} motor - Motor component object
 * @param {Object} faultBus - Bus where fault occurs
 * @returns {Array} Array of decay points
 */
function calculateMotorDecayCurve(motor, faultBus) {
    const timePoints = MOTOR_DECAY_CONFIG.TIME_POINTS;
    
    return timePoints.map(cycles => 
        calculateMotorFaultContribution(motor, faultBus, cycles)
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM-WIDE MOTOR CONTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate total motor contribution to fault from all motors
 * 
 * @param {Object} faultBus - Bus where fault occurs
 * @param {Number} time_cycles - Time in cycles
 * @returns {Object} Total motor contribution
 */
function calculateSystemMotorContribution(faultBus, time_cycles) {
    const motors = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.type === 'motor') 
        : [];

    if (motors.length === 0) {
        return {
            time_cycles,
            motorCount: 0,
            totalContribution: 0,
            motors: []
        };
    }

    const motorContributions = motors.map(motor => {
        const contribution = calculateMotorFaultContribution(motor, faultBus, time_cycles);
        return {
            motor,
            contribution
        };
    });

    const totalAC = motorContributions.reduce((sum, mc) => sum + mc.contribution.I_ac, 0);
    const totalAsymmetric = motorContributions.reduce((sum, mc) => sum + mc.contribution.I_asymmetric, 0);

    return {
        time_cycles,
        motorCount: motors.length,
        totalAC,
        totalAsymmetric,
        motors: motorContributions
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate motor decay table for report
 * 
 * @param {Object} faultBus - Bus where fault occurs
 * @returns {String} Motor decay report section
 */
function generateMotorDecayReport(faultBus) {
    let report = `${'='.repeat(100)}
MOTOR FAULT CONTRIBUTION DECAY ANALYSIS (ANSI C37.010)
${'='.repeat(100)}

`;

    const motors = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.type === 'motor') 
        : [];

    if (motors.length === 0) {
        report += 'No motors found in system.\n\n';
        return report;
    }

    report += `Fault Location: ${faultBus.name}\n`;
    report += `Total Motors Contributing: ${motors.length}\n`;
    report += `Analysis per ANSI C37.010-1979 Standard\n\n`;

    // Time point analysis
    const timePoints = MOTOR_DECAY_CONFIG.TIME_POINTS;
    
    report += `SYSTEM MOTOR CONTRIBUTION BY TIME:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `${'Time'.padEnd(15)}${'AC Current'.padEnd(18)}${'Asymmetric'.padEnd(18)}${'% of Initial'.padEnd(18)}${'Application'.padEnd(31)}\n`;
    report += `${'-'.repeat(100)}\n`;

    timePoints.forEach(cycles => {
        const systemContrib = calculateSystemMotorContribution(faultBus, cycles);
        const initialContrib = calculateSystemMotorContribution(faultBus, 0.5);
        const percentOfInitial = (systemContrib.totalAC / initialContrib.totalAC) * 100;
        
        let application = '';
        if (cycles <= 1) {
            application = 'Peak asymmetric';
        } else if (cycles <= 5) {
            application = 'Breaker interrupting duty';
        } else if (cycles <= 10) {
            application = 'Recloser duty';
        } else {
            application = 'Relay coordination';
        }

        report += `${(cycles + ' cycles').padEnd(15)}${systemContrib.totalAC.toFixed(2).padEnd(18)}${systemContrib.totalAsymmetric.toFixed(2).padEnd(18)}${percentOfInitial.toFixed(1).padEnd(18)}${application.padEnd(31)}\n`;
    });

    report += `\n`;

    // Breaker sizing guidance
    report += `BREAKER SIZING GUIDANCE:\n`;
    report += `${'-'.repeat(100)}\n`;
    
    const breaker3cycle = calculateSystemMotorContribution(faultBus, 3);
    const breaker5cycle = calculateSystemMotorContribution(faultBus, 5);
    
    report += `Recommended Interrupting Current (3-5 cycles):\n`;
    report += `  3-cycle: ${breaker3cycle.totalAsymmetric.toFixed(2)} A asymmetric\n`;
    report += `  5-cycle: ${breaker5cycle.totalAsymmetric.toFixed(2)} A asymmetric\n`;
    report += `\n`;
    report += `Breaker Rating Requirement:\n`;
    report += `  Minimum: ${(breaker3cycle.totalAsymmetric * 1.1).toFixed(2)} A (3-cycle × 110% safety factor)\n`;
    report += `  Recommended: ${(breaker3cycle.totalAsymmetric * 1.25).toFixed(2)} A (3-cycle × 125% safety factor)\n`;
    report += `\n`;

    // Individual motor contributions (if less than 10 motors, show all)
    if (motors.length <= 10) {
        report += `INDIVIDUAL MOTOR CONTRIBUTIONS (at 3 cycles):\n`;
        report += `${'-'.repeat(100)}\n`;
        report += `${'Motor'.padEnd(25)}${'HP/kW'.padEnd(15)}${'FLC (A)'.padEnd(15)}${'3-cycle (A)'.padEnd(18)}${'% Decay'.padEnd(15)}\n`;
        report += `${'-'.repeat(100)}\n`;

        motors.forEach(motor => {
            const contrib3cycle = calculateMotorFaultContribution(motor, faultBus, 3);
            const decay = 100 - contrib3cycle.percent_of_initial;
            const motorHP = motor.hp || motor.power || 0;
            const motorTag = motor.tag || motor.name || motor.id;

            report += `${motorTag.padEnd(25)}${motorHP.toFixed(1).padEnd(15)}${contrib3cycle.motorFLC.toFixed(2).padEnd(15)}${contrib3cycle.I_ac.toFixed(2).padEnd(18)}${decay.toFixed(1).padEnd(15)}\n`;
        });

        report += `\n`;
    }

    // Validation notes
    report += `VALIDATION NOTES:\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `Expected Decay Ranges (ANSI C37.010 typical values):\n`;
    report += `  • t = 0.5 cycles: 100% (initial subtransient current)\n`;
    report += `  • t = 3 cycles: 50-70% (subtransient decay)\n`;
    report += `  • t = 30 cycles: 20-30% (approaching steady state)\n`;
    report += `\n`;
    report += `Motor Parameters Used:\n`;
    report += `  • X"d = ${MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS.Xd_double_prime} pu (subtransient reactance)\n`;
    report += `  • X'd = ${MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS.Xd_prime} pu (transient reactance)\n`;
    report += `  • T"d = ${MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS.Td_double_prime} s (subtransient time constant)\n`;
    report += `  • T'd = ${MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS.Td_prime} s (transient time constant)\n`;
    report += `  • X/R = ${MOTOR_DECAY_CONFIG.DEFAULT_MOTOR_PARAMS.X_R_ratio} (for DC component)\n`;
    report += `\n`;

    return report;
}

/**
 * Generate detailed motor decay table for specific motor
 * 
 * @param {Object} motor - Motor component
 * @param {Object} faultBus - Bus where fault occurs
 * @returns {String} Detailed motor decay table
 */
function generateMotorDecayTable(motor, faultBus) {
    let report = `MOTOR DECAY TABLE: ${motor.tag || motor.name || motor.id}\n`;
    report += `${'-'.repeat(100)}\n`;
    report += `${'Time'.padEnd(12)}${'I_ac (A)'.padEnd(15)}${'I_dc (A)'.padEnd(15)}${'I_asym (A)'.padEnd(15)}${'Mf'.padEnd(12)}${'% Initial'.padEnd(15)}\n`;
    report += `${'-'.repeat(100)}\n`;

    const decayCurve = calculateMotorDecayCurve(motor, faultBus);

    decayCurve.forEach(point => {
        report += `${(point.time_cycles + ' cyc').padEnd(12)}`;
        report += `${point.I_ac.toFixed(2).padEnd(15)}`;
        report += `${point.I_dc.toFixed(2).padEnd(15)}`;
        report += `${point.I_asymmetric.toFixed(2).padEnd(15)}`;
        report += `${point.multiplying_factor.toFixed(3).padEnd(12)}`;
        report += `${point.percent_of_initial.toFixed(1).padEnd(15)}\n`;
    });

    report += `\n`;

    return report;
}

console.log('✅ Motor Contribution Decay Module loaded successfully');
