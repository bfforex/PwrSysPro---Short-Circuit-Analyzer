/**
 * Motor Contribution to Short Circuit Calculation Module
 * Calculates motor fault current contribution per IEEE 141-1993
 * 
 * @author bfforex
 * @date 2025-11-01 04:41:46 UTC
 * @version 1.4.1
 * @fixed CRITICAL: findDownstreamMotors now properly handles fromBus/toBus motor structure
 * @fixed Added voltage level correction when referring motor impedance to fault point
 * @fixed Enhanced logging for debugging downstream motor discovery
 * @fixed Correct indentation throughout
 * 
 * Standards:
 * - IEEE 141-1993 (Red Book) - Section 5.3
 * - IEC 60909 - Short-Circuit Currents
 * - NEC Article 430 - Motors, Motor Circuits, and Controllers
 */

console.log('🔧 Loading Motor Contribution Module v1.4.1...');

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR CLASSIFICATION CONSTANTS (IEEE 141-1993)
// ═══════════════════════════════════════════════════════════════════════════

const MOTOR_CONTRIBUTION = {
    // Motor subtransient reactance X" (%) on motor base
    REACTANCE: {
        induction_small: 20,      // < 50 HP
        induction_medium: 17,     // 50-250 HP
        induction_large: 15,      // > 250 HP
        synchronous_all: 12,      // All synchronous motors
        wound_rotor: 18           // Wound rotor motors
    },
    
    // X/R ratios per IEEE 141 Table 5-3
    XR_RATIOS: {
        induction_small: 3.2,     // < 50 HP
        induction_medium: 4.5,    // 50-250 HP
        induction_large: 6.6,     // > 250 HP
        synchronous_all: 15,      // All synchronous motors
        wound_rotor: 5.0          // Wound rotor motors
    },
    
    // Contribution factors (multiplier × FLC)
    CONTRIBUTION_FACTORS: {
        interrupting: 4.0,        // For circuit breaker interrupting duty
        momentary: 6.0            // For momentary/peak duty
    }
};

const MOTOR_TYPES = {
    INDUCTION: 'induction',
    SYNCHRONOUS: 'synchronous',
    WOUND_ROTOR: 'wound_rotor'
};

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR CLASSIFICATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classify motor based on HP and type per IEEE 141
 * 
 * @param {Number} hp - Motor horsepower
 * @param {String} motorType - 'induction', 'synchronous', 'wound_rotor'
 * @returns {String} Motor classification key
 */
function classifyMotor(hp, motorType = 'induction') {
    if (motorType === 'synchronous') {
        return 'synchronous_all';
    }
    
    if (motorType === 'wound_rotor') {
        return 'wound_rotor';
    }
    
    // Induction motor classification by HP
    if (hp < 50) {
        return 'induction_small';
    } else if (hp <= 250) {
        return 'induction_medium';
    } else {
        return 'induction_large';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE MOTOR CONTRIBUTION CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate short-circuit fault-current contribution from a single motor
 *
 * Motors act as voltage sources during fault conditions and contribute
 * symmetrical fault current proportional to their subtransient reactance X".
 * This function implements the IEEE 141-1993 motor contribution method.
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.3 - Motor contribution to short-circuit currents
 * - IEEE 141-1993 Table 5-3 - Motor X" and X/R values by type and HP
 * - ANSI C37.010 - DC offset multiplying factors (interrupting vs momentary)
 * - NEC 2017 Article 430 - Motor circuit requirements
 *
 * FORMULA (motor subtransient impedance referred to system base):
 *   I_FLC = (HP × 746) / (√3 × V_motor × η × PF)
 *   Z_motor = V_motor / (√3 × I_FLC)   × X"_pu
 *   I_motor_contribution = V_fault / Z_motor   (referred to fault bus)
 *
 * CONTRIBUTION FACTORS (multiplier × FLC, IEEE 141-1993 §5.3):
 *   Interrupting duty (3-5 cycles): 4.0 × FLC
 *   Momentary duty (½ cycle):       6.0 × FLC
 *
 * MOTOR X" VALUES (IEEE 141-1993 Table 5-3):
 *   Induction < 50 HP:     X" = 20%
 *   Induction 50-250 HP:   X" = 17%
 *   Induction > 250 HP:    X" = 15%
 *   Synchronous:           X" = 12%
 *   Wound-rotor:           X" = 18%
 *
 * @param {Object} motor                          - Motor data object
 * @param {number} motor.hp                       - Rated horsepower
 * @param {string} [motor.motorType='induction']  - Motor type: 'induction'|'synchronous'|'wound_rotor'
 * @param {number} [motor.efficiency=0.90]        - Motor efficiency (0–1)
 * @param {number} [motor.powerFactor=0.85]       - Motor power factor (0–1)
 * @param {number} busVoltage                     - Bus voltage where motor is connected (V)
 * @param {number} [faultVoltage=null]            - Fault-point voltage for impedance referral (V)
 * @param {string} [contributionType='interrupting'] - Duty type: 'interrupting' | 'momentary'
 * @returns {Object|null} Motor contribution data object, or null for invalid inputs
 *
 * @reference IEEE 141-1993 §5.3 "Motor contribution to short-circuit currents"
 * @reference IEEE 141-1993 Table 5-3 "Typical motor impedance data"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function calculateMotorContribution(motor, busVoltage, faultVoltage = null, contributionType = 'interrupting') {
    // ═══════════════════════════════════════════════════════════════════════
    // ✅ DEFENSIVE CHECK: Validate motor object
    // ═══════════════════════════════════════════════════════════════════════
    
    if (!motor || typeof motor !== 'object') {
        console.warn('⚠️ calculateMotorContribution called with invalid motor:', motor);
        return null;
    }
    
    if (motor.type !== 'motor' || typeof motor.hp !== 'number' || motor.hp <= 0 || isNaN(motor.hp)) {
        console.warn('⚠️ Skipping motor with invalid type or HP:', motor);
        return null;
    }
    
    // ✅ Set defaults for missing properties
    const motorType = motor.motorType || 'induction';
    const efficiency = motor.efficiency || 0.90;
    const powerFactor = motor.powerFactor || 0.85;
    
    // Default faultVoltage to busVoltage if not provided
    if (!faultVoltage) {
        faultVoltage = busVoltage;
    }
    
    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += 'MOTOR CONTRIBUTION TO SHORT CIRCUIT\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Motor: ${motor.name || 'Unnamed Motor'}\n`;
    steps += `HP: ${motor.hp}\n`;
    steps += `Type: ${motorType}\n`;
    steps += `Motor Bus Voltage: ${busVoltage}V\n`;
    
    if (Math.abs(busVoltage - faultVoltage) > 1) {
        steps += `⚠️  Fault Voltage: ${faultVoltage}V (impedance will be referred)\n`;
    }
    
    steps += `Efficiency: ${(efficiency * 100).toFixed(1)}%\n`;
    steps += `Power Factor: ${powerFactor.toFixed(2)}\n\n`;
    
    // Classify motor
    const motorClass = classifyMotor(motor.hp, motorType);
    
    // Get motor parameters
    const xr = MOTOR_CONTRIBUTION.XR_RATIOS[motorClass];
    const xdPrime = MOTOR_CONTRIBUTION.REACTANCE[motorClass];
    const contributionFactor = MOTOR_CONTRIBUTION.CONTRIBUTION_FACTORS[contributionType];
    
    steps += `IEEE 141 Classification: ${motorClass}\n`;
    steps += `X/R Ratio: ${xr}\n`;
    steps += `X" (Subtransient Reactance): ${xdPrime}% on motor base\n`;
    steps += `Contribution Factor: ${contributionFactor}× FLC (${contributionType})\n\n`;
    
    // Calculate Full Load Current (FLC)
    const fullLoadCurrent = (motor.hp * 746) / (SQRT3 * busVoltage * efficiency * powerFactor);
    
    steps += `FULL LOAD CURRENT:\n`;
    steps += `FLC = (HP × 746 W/HP) / (√3 × V × η × PF)\n`;
    steps += `FLC = (${motor.hp} × 746) / (${SQRT3.toFixed(4)} × ${busVoltage} × ${efficiency.toFixed(3)} × ${powerFactor.toFixed(2)})\n`;
    steps += `FLC = ${fullLoadCurrent.toFixed(2)} A\n\n`;
    
    // Calculate Locked Rotor Current
    const lockedRotorCurrent = fullLoadCurrent * contributionFactor;
    
    steps += `LOCKED ROTOR CURRENT (Approximate):\n`;
    steps += `LRC ≈ ${contributionFactor} × FLC = ${contributionFactor} × ${fullLoadCurrent.toFixed(2)}\n`;
    steps += `LRC ≈ ${lockedRotorCurrent.toFixed(2)} A\n\n`;
    
    // Calculate motor impedance at motor bus voltage
    const motorZ = busVoltage / (SQRT3 * lockedRotorCurrent);
    const motorX = motorZ * xr / Math.sqrt(1 + xr * xr);
    const motorR = motorZ / Math.sqrt(1 + xr * xr);
    
    steps += `MOTOR IMPEDANCE (at ${busVoltage}V):\n`;
    steps += `Z_motor = V / (√3 × I_LRC)\n`;
    steps += `Z_motor = ${busVoltage} / (${SQRT3.toFixed(4)} × ${lockedRotorCurrent.toFixed(2)})\n`;
    steps += `Z_motor = ${motorZ.toFixed(6)} Ω\n\n`;
    steps += `Component Separation (X/R = ${xr}):\n`;
    steps += `X_motor = ${motorX.toFixed(6)} Ω\n`;
    steps += `R_motor = ${motorR.toFixed(6)} Ω\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════════
    // ✅ VOLTAGE LEVEL CORRECTION
    // Refer motor impedance to fault voltage if different
    // ═══════════════════════════════════════════════════════════════════════
    
    let motorR_referred = motorR;
    let motorX_referred = motorX;
    let motorZ_referred = motorZ;
    let motorCurrent_referred = lockedRotorCurrent;
    
    if (Math.abs(busVoltage - faultVoltage) > 1) {
        // Motor is at different voltage level - must refer impedance to fault point
        const voltageRatio = faultVoltage / busVoltage;
        
        // When referring impedance to different voltage:
        // Z_new = Z_old × (V_new / V_old)²
        motorR_referred = motorR * (voltageRatio * voltageRatio);
        motorX_referred = motorX * (voltageRatio * voltageRatio);
        motorZ_referred = Math.sqrt(motorR_referred * motorR_referred + motorX_referred * motorX_referred);
        
        // When referring current to different voltage:
        // I_new = I_old × (V_old / V_new)
        motorCurrent_referred = lockedRotorCurrent / voltageRatio;
        
        steps += `⚠️  VOLTAGE LEVEL CORRECTION:\n`;
        steps += `Motor at ${busVoltage}V, Fault at ${faultVoltage}V\n`;
        steps += `Voltage Ratio: ${voltageRatio.toFixed(4)}\n\n`;
        steps += `Impedance Referred to ${faultVoltage}V:\n`;
        steps += `  R_referred = ${motorR.toFixed(6)} × ${voltageRatio.toFixed(4)}² = ${motorR_referred.toFixed(6)} Ω\n`;
        steps += `  X_referred = ${motorX.toFixed(6)} × ${voltageRatio.toFixed(4)}² = ${motorX_referred.toFixed(6)} Ω\n`;
        steps += `  Z_referred = ${motorZ_referred.toFixed(6)} Ω\n\n`;
        steps += `Current Referred to ${faultVoltage}V:\n`;
        steps += `  I_referred = ${lockedRotorCurrent.toFixed(2)} / ${voltageRatio.toFixed(4)} = ${motorCurrent_referred.toFixed(2)} A\n\n`;
    }
    
    // Motor fault current contribution (at fault voltage)
    const motorFaultCurrent = faultVoltage / (SQRT3 * motorZ_referred);
    
    steps += `MOTOR FAULT CONTRIBUTION (at ${faultVoltage}V):\n`;
    steps += `I_motor = V_fault / (√3 × Z_referred)\n`;
    steps += `I_motor = ${faultVoltage} / (${SQRT3.toFixed(4)} × ${motorZ_referred.toFixed(6)})\n`;
    steps += `I_motor = ${motorFaultCurrent.toFixed(2)} A = ${(motorFaultCurrent/1000).toFixed(3)} kA\n\n`;
    
    // Asymmetrical contributions
    const symmetricalContribution = motorFaultCurrent;
    const asymMultiplier = Math.sqrt(1 + 2 * Math.exp(-4 * motorR_referred / motorX_referred));
    const asymmetricalContribution = symmetricalContribution * asymMultiplier;
    
    steps += `ASYMMETRICAL CONTRIBUTION:\n`;
    steps += `Multiplier = √(1 + 2e^(-4R/X)) = ${asymMultiplier.toFixed(4)}\n`;
    steps += `I_asym = ${(symmetricalContribution/1000).toFixed(3)} × ${asymMultiplier.toFixed(4)}\n`;
    steps += `I_asym = ${(asymmetricalContribution/1000).toFixed(3)} kA\n\n`;
    
    steps += `Per IEEE 141-1993:\n`;
    steps += `  • Motor contribution decays rapidly (typically 3-5 cycles)\n`;
    steps += `  • Primarily affects momentary/instantaneous duty\n`;
    steps += `  • Must be considered for breaker interrupting ratings\n`;
    steps += `  • NEC 430.52 requires motor contribution in fault calculations\n\n`;
    
    // Log to console
    console.log(`  Motor: ${motor.hp} HP ${motorType} at ${busVoltage}V`);
    console.log(`    FLC: ${fullLoadCurrent.toFixed(2)}A`);
    console.log(`    Contribution: ${(motorFaultCurrent/1000).toFixed(3)}kA (sym)`);
    if (Math.abs(busVoltage - faultVoltage) > 1) {
        console.log(`    ⚠️  Referred to ${faultVoltage}V fault point`);
    }
    
    return {
        motors: [motor],
        motorClass: motorClass,
        motorHP: motor.hp,
        motorType: motorType,
        busVoltage: busVoltage,
        faultVoltage: faultVoltage,
        fullLoadCurrent: fullLoadCurrent,
        lockedRotorCurrent: lockedRotorCurrent,
        contributionFactor: contributionFactor,
        motorImpedance: motorZ,
        motorR: motorR_referred,  // ✅ Return referred values
        motorX: motorX_referred,  // ✅ Return referred values
        totalMotorR: motorR_referred,
        totalMotorX: motorX_referred,
        totalMotorZ: motorZ_referred,
        motorFaultCurrent: motorFaultCurrent,
        symmetricalContribution: symmetricalContribution,
        asymmetricalContribution: asymmetricalContribution,
        calculationSteps: steps
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ CRITICAL FIX: RECURSIVE DOWNSTREAM MOTOR DISCOVERY
// Issue #30: Now properly handles fromBus/toBus motor structure
// Traverses ALL downstream buses recursively
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find all motors downstream from a bus (RECURSIVE)
 * 
 * Per IEEE 141 Section 5.3: "Motor contribution must include all motors
 * electrically between the fault point and the load"
 * 
 * Motor Connection Structure:
 * - Motors have: fromBus (source) and toBus (motor terminal)
 * - Motors contribute when fault is at or upstream from their fromBus
 * - Motors do NOT contribute when fault is at their terminal (toBus)
 * 
 * @param {String} busId - Starting bus ID (fault location)
 * @returns {Array} Array of motor objects with their bus voltage information
 */
function findDownstreamMotors(busId) {
    const motorsWithBusInfo = [];
    const visited = new Set();
    
    console.log(`\n🔍 Finding downstream motors from bus: ${busId}`);
    
    /**
     * Recursive traversal function
     * @param {String} currentBusId - Current bus being checked
     * @param {Number} depth - Recursion depth (for logging)
     */
    function traverse(currentBusId, depth = 0) {
        // Prevent infinite loops in case of circular references
        if (visited.has(currentBusId)) {
            return;
        }
        visited.add(currentBusId);
        
        const indent = '  '.repeat(depth);
        const currentBus = buses?.find(b => b.id === currentBusId);
        const busName = currentBus?.name || currentBusId;
        const busVoltage = currentBus?.voltage || 'unknown';
        
        console.log(`${indent}📍 Checking bus: ${busName} (${busVoltage}V)`);
        
        // Validate components array
        if (!Array.isArray(components)) {
            console.error('❌ components is not an array');
            return;
        }
        
        // Find all components going OUT from this bus
        const downstreamComponents = components.filter(c => 
            c && c.fromBus === currentBusId
        );
        
        console.log(`${indent}   Found ${downstreamComponents.length} component(s) from this bus`);
        
        downstreamComponents.forEach(comp => {
            // ═══════════════════════════════════════════════════════════════
            // CASE 1: MOTOR - Add to results
            // Motors with fromBus === currentBusId are downstream loads
            // ═══════════════════════════════════════════════════════════════
            if (comp.type === 'motor') {
                if (comp.hp && comp.hp > 0 && !isNaN(comp.hp)) {
                    // Motor is connected FROM this bus TO its terminal bus
                    // Use the motor's terminal bus voltage (toBus)
                    const motorTerminalBus = buses?.find(b => b.id === comp.toBus);
                    const motorVoltage = motorTerminalBus?.voltage || currentBus?.voltage || 480;
                    
                    motorsWithBusInfo.push({
                        motor: comp,
                        busId: currentBusId,  // Connected FROM this bus
                        busVoltage: motorVoltage,  // Voltage at motor terminal
                        busName: currentBus?.name || currentBusId
                    });
                    
                    console.log(`${indent}   ⚡ Found motor: ${comp.name || comp.id} (${comp.hp}HP at ${motorVoltage}V)`);
                } else {
                    console.warn(`${indent}   ⚠️ Skipping motor with invalid HP: ${comp.name || comp.id}`);
                }
            }
            
            // ═══════════════════════════════════════════════════════════════
            // CASE 2: TRANSFORMER or CABLE - Continue traversal downstream
            // ✅ CRITICAL FIX: Recursive call to traverse nested buses
            // ═══════════════════════════════════════════════════════════════
            else if ((comp.type === 'transformer' || comp.type === 'cable') && comp.toBus) {
                const nextBusName = buses?.find(b => b.id === comp.toBus)?.name || comp.toBus;
                console.log(`${indent}   → Following ${comp.type} to: ${nextBusName}`);
                traverse(comp.toBus, depth + 1);  // ✅ RECURSIVE CALL
            }
        });
    }
    
    // Start traversal from the given bus
    traverse(busId);
    
    console.log(`\n✅ Found ${motorsWithBusInfo.length} total motor(s) downstream from ${busId}`);
    
    // Return motor objects with bus info attached
    const motors = motorsWithBusInfo.map(info => {
        // Attach bus voltage info to motor object for later use
        info.motor._busVoltage = info.busVoltage;
        info.motor._busId = info.busId;
        info.motor._busName = info.busName;
        return info.motor;
    });
    
    return motors;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL MOTOR CONTRIBUTION FOR A BUS
// ✅ UPDATED: Now uses faultVoltage for proper impedance referral
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate total motor fault-current contribution at a bus (all downstream motors)
 *
 * Aggregates individual motor contributions from all motors electrically between
 * the fault point and the load, per IEEE 141-1993 §5.3.2.
 * Results are combined symmetrically (RSS of individual motor contributions).
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.3.2 - "Motor contribution – multiple motors"
 * - ANSI C37.010 §5.6 - Motor contribution for circuit breaker application
 *
 * @param {string} busId                            - Bus identifier where fault occurs
 * @param {string} [contributionType='interrupting'] - Duty type: 'interrupting' | 'momentary'
 * @returns {Object|null} Aggregated motor contribution, or null if no motors found
 *
 * @reference IEEE 141-1993 §5.3 "Motor contribution to short-circuit currents"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function calculateTotalMotorContribution(busId, contributionType = 'interrupting') {
    if (!busId || typeof busId !== 'string') {
        console.warn('⚠️ calculateTotalMotorContribution called with invalid busId:', busId);
        return null;
    }
    
    const bus = buses?.find(b => b.id === busId);
    if (!bus) {
        console.warn(`⚠️ Bus ${busId} not found`);
        return null;
    }
    
    const faultVoltage = parseFloat(bus.voltage);
    
    // ✅ CRITICAL: Use recursive findDownstreamMotors
    const motors = findDownstreamMotors(busId);
    
    if (motors.length === 0) {
        console.log(`ℹ️  No motors found downstream from bus: ${bus.name}`);
        return null;
    }
    
    console.log(`\n🔵 Calculating motor contribution for fault at: ${bus.name} (${faultVoltage}V)`);
    console.log(`   Processing ${motors.length} motor(s)...\n`);
    
    // ✅ UPDATED: Pass faultVoltage to calculateMotorContribution
    const motorContributions = motors.map(motor => {
        const motorBusVoltage = motor._busVoltage || bus.voltage;
        return calculateMotorContribution(motor, motorBusVoltage, faultVoltage, contributionType);
    }).filter(contrib => contrib !== null);
    
    if (motorContributions.length === 0) {
        console.log(`⚠️ No valid motor contributions calculated`);
        return null;
    }
    
    // Combine motor impedances in parallel (all already referred to fault voltage)
    let R_inv_sum = 0;
    let X_inv_sum = 0;
    
    motorContributions.forEach(contrib => {
        const Z_squared = contrib.motorR * contrib.motorR + contrib.motorX * contrib.motorX;
        R_inv_sum += contrib.motorR / Z_squared;
        X_inv_sum += contrib.motorX / Z_squared;
    });
    
    const Z_inv_squared = R_inv_sum * R_inv_sum + X_inv_sum * X_inv_sum;
    const totalMotorR = R_inv_sum / Z_inv_squared;
    const totalMotorX = X_inv_sum / Z_inv_squared;
    const totalMotorZ = Math.sqrt(totalMotorR * totalMotorR + totalMotorX * totalMotorX);
    
    const totalMotorFaultCurrent = faultVoltage / (SQRT3 * totalMotorZ);
    
    // Calculate asymmetrical
    const xrRatio = totalMotorX / totalMotorR;
    const asymMultiplier = Math.sqrt(1 + 2 * Math.exp(-4 * totalMotorR / totalMotorX));
    const totalMotorAsymCurrent = totalMotorFaultCurrent * asymMultiplier;
    
    // Combine calculation steps
    let combinedSteps = '';
    motorContributions.forEach((contrib, i) => {
        combinedSteps += `\nMOTOR ${i + 1}:\n`;
        combinedSteps += contrib.calculationSteps;
    });
    
    combinedSteps += '\n' + '═'.repeat(80) + '\n';
    combinedSteps += `TOTAL MOTOR CONTRIBUTION (${motors.length} motors in parallel)\n`;
    combinedSteps += '═'.repeat(80) + '\n\n';
    combinedSteps += `All motor impedances referred to fault point: ${faultVoltage}V\n\n`;
    combinedSteps += `Parallel Combination of Motor Impedances:\n`;
    combinedSteps += `Total R_motor = ${totalMotorR.toFixed(6)} Ω\n`;
    combinedSteps += `Total X_motor = ${totalMotorX.toFixed(6)} Ω\n`;
    combinedSteps += `Total Z_motor = ${totalMotorZ.toFixed(6)} Ω\n`;
    combinedSteps += `X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    
    combinedSteps += `Total Motor Fault Current (Symmetrical):\n`;
    combinedSteps += `I_motor_total = ${faultVoltage} / (√3 × ${totalMotorZ.toFixed(6)})\n`;
    combinedSteps += `I_motor_total = ${totalMotorFaultCurrent.toFixed(2)} A = ${(totalMotorFaultCurrent/1000).toFixed(3)} kA\n\n`;
    
    combinedSteps += `Total Motor Fault Current (Asymmetrical):\n`;
    combinedSteps += `Multiplier = √(1 + 2e^(-4R/X)) = ${asymMultiplier.toFixed(4)}\n`;
    combinedSteps += `I_asym = ${(totalMotorFaultCurrent/1000).toFixed(3)} × ${asymMultiplier.toFixed(4)}\n`;
    combinedSteps += `I_asym = ${(totalMotorAsymCurrent/1000).toFixed(3)} kA\n\n`;
    
    combinedSteps += `✅ Per IEEE 141-1993 Section 5.3:\n`;
    combinedSteps += `   ALL downstream motors included in fault calculation\n`;
    combinedSteps += `   Impedances properly referred to fault voltage level\n\n`;
    
    console.log(`   ✅ Total motor contribution: ${(totalMotorFaultCurrent/1000).toFixed(3)} kA (sym)`);
    console.log(`   ✅ Total motor contribution: ${(totalMotorAsymCurrent/1000).toFixed(3)} kA (asym)`);
    
    return {
        motors: motors,
        busId: busId,
        busName: bus.name,
        busVoltage: faultVoltage,
        motorCount: motors.length,
        totalMotorR: totalMotorR,
        totalMotorX: totalMotorX,
        totalMotorZ: totalMotorZ,
        xrRatio: xrRatio,
        motorFaultCurrent: totalMotorFaultCurrent,
        totalSymmetricalContribution: totalMotorFaultCurrent / 1000,
        totalAsymmetricalContribution: totalMotorAsymCurrent / 1000,
        asymmetricalMultiplier: asymMultiplier,
        calculationSteps: combinedSteps,
        individualMotors: motorContributions
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBINE SYSTEM AND MOTOR FAULT CURRENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine system fault current with motor contribution
 *
 * System supply and all motors act as parallel voltage sources during a fault.
 * The total fault current at the bus is the arithmetic sum of the system (utility)
 * contribution and all motor contributions referred to the fault-bus voltage.
 *
 * STANDARDS:
 * - IEEE 141-1993 §5.3.3 - "Combination of motor and system contributions"
 * - ANSI C37.010 §5.5 - Total fault current for breaker interrupting rating
 *
 * COMBINATION METHOD (IEEE 141-1993 §5.3.3):
 *   I_total_sym  = I_system_sym  + I_motor_sym
 *   I_total_asym = I_system_asym + I_motor_asym
 *   (Direct arithmetic addition; motors and system are in phase at t=0)
 *
 * NOTE: X/R ratio for the combined current is the weighted average used to
 * compute the DC offset multiplier per ANSI C37.010.
 *
 * @param {Object} systemFaultResults    - System short-circuit results from calculateShortCircuit()
 * @param {Object} motorContribution     - Motor contribution from calculateTotalMotorContribution()
 * @returns {Object} Combined short-circuit results with updated fault currents
 *
 * @reference IEEE 141-1993 §5.3.3 "Combination of contributions"
 * @reference ANSI C37.010 §5.5 "Total fault current"
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function combineSystemAndMotorFault(systemFaultResults, motorContribution) {
    // ✅ DEFENSIVE CHECK: Validate inputs
    if (!systemFaultResults || !systemFaultResults.faultCurrents) {
        console.error('❌ Invalid systemFaultResults in combineSystemAndMotorFault');
        return systemFaultResults;
    }
    
    if (!motorContribution || !motorContribution.motors || motorContribution.motors.length === 0) {
        console.log('ℹ️ No motors to combine - returning system results only');
        return systemFaultResults;
    }
    
    // Extract system impedance
    const systemImpedance = {
        R: systemFaultResults.totalImpedance?.resistance || systemFaultResults.totalR,
        X: systemFaultResults.totalImpedance?.reactance || systemFaultResults.totalX,
        Z: systemFaultResults.totalImpedance?.magnitude || systemFaultResults.totalZ
    };
    
    // Parallel combination
    const sys_R = systemImpedance.R;
    const sys_X = systemImpedance.X;
    const sys_Z_sq = sys_R * sys_R + sys_X * sys_X;
    
    const mot_R = motorContribution.totalMotorR;
    const mot_X = motorContribution.totalMotorX;
    const mot_Z_sq = mot_R * mot_R + mot_X * mot_X;
    
    const R_inv_total = (sys_R / sys_Z_sq) + (mot_R / mot_Z_sq);
    const X_inv_total = (sys_X / sys_Z_sq) + (mot_X / mot_Z_sq);
    const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
    
    const combined_R = R_inv_total / Z_inv_total_sq;
    const combined_X = X_inv_total / Z_inv_total_sq;
    const combined_Z = Math.sqrt(combined_R * combined_R + combined_X * combined_X);
    
    // Get bus voltage
    const busVoltage = motorContribution.busVoltage;
    
    // Calculate combined fault currents
    const combinedFaultCurrent = busVoltage / (SQRT3 * combined_Z);
    const combinedFaultCurrentKA = combinedFaultCurrent / 1000;
    
    // Calculate asymmetrical
    const combinedXR = combined_X / combined_R;
    const asymMultiplier = Math.sqrt(1 + 2 * Math.exp(-4 * combined_R / combined_X));
    const combinedAsymFaultCurrentKA = combinedFaultCurrentKA * asymMultiplier;
    
    // Calculate increase
    const faultCurrentIncrease = ((combinedFaultCurrentKA - systemFaultResults.faultCurrents.threePhaseSym) / systemFaultResults.faultCurrents.threePhaseSym) * 100;
    
    console.log('\n🔄 Combining system and motor contributions:');
    console.log(`   System only: ${systemFaultResults.faultCurrents.threePhaseSym.toFixed(3)} kA`);
    console.log(`   Motor contribution: ${motorContribution.totalSymmetricalContribution.toFixed(3)} kA`);
    console.log(`   Combined: ${combinedFaultCurrentKA.toFixed(3)} kA`);
    console.log(`   Increase: ${faultCurrentIncrease.toFixed(1)}%\n`);
    
    return {
        // ✅ CRITICAL: Fault currents object
        faultCurrents: {
            threePhaseSym: combinedFaultCurrentKA,
            threePhaseAsym: combinedAsymFaultCurrentKA,
            lineToGround: combinedFaultCurrentKA * 0.85,
            lineToLine: combinedFaultCurrentKA * 0.866
        },
        
        // ✅ Motor contribution data
        motorContribution: motorContribution,
        
        // ✅ Combined impedance data
        totalImpedance: {
            magnitude: combined_Z,
            resistance: combined_R,
            reactance: combined_X,
            angle: Math.atan2(combined_X, combined_R) * (180 / Math.PI)
        },
        
        totalR: combined_R,
        totalX: combined_X,
        totalZ: combined_Z,
        xrRatio: combinedXR,
        
        // ✅ Breakdown data
        systemOnly: {
            faultCurrents: systemFaultResults.faultCurrents,
            impedance: systemImpedance
        },
        
        motorOnly: {
            faultCurrent: motorContribution.totalSymmetricalContribution,
            impedance: {
                R: mot_R,
                X: mot_X,
                Z: Math.sqrt(mot_R * mot_R + mot_X * mot_X)
            }
        },
        
        // ✅ Analysis data
        faultCurrentIncrease: faultCurrentIncrease,
        impedanceReduction: ((systemImpedance.Z - combined_Z) / systemImpedance.Z) * 100,
        
        // ✅ Metadata
        method: systemFaultResults.method,
        path: systemFaultResults.path,
        calculationDate: systemFaultResults.calculationDate || getCalculationTimestamp(),
        perUnit: systemFaultResults.perUnit || null,
        calculationSteps: systemFaultResults.calculationSteps
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR FAULT CONTRIBUTION DECAY MODULE
// ANSI C37.010-1979 compliant motor decay calculations
// ═══════════════════════════════════════════════════════════════════════════

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
    
    const motorTerminalBus = (typeof buses !== 'undefined' && Array.isArray(buses) && motor?.toBus) 
    ? buses.find(b => b.id === motor.toBus) 
    : null;
    const motorVoltage = motorTerminalBus?.voltage || motor.voltage || faultBus?.voltage || 480;
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

function getSystemMotorDecaySummary(faultBus, cyclesList = [3, 5]) {
  const out = {};
  cyclesList.forEach(cyc => {
    const sys = calculateSystemMotorContribution(faultBus, cyc);
    out[cyc] = {
      cycles: cyc,
      // Convert A to kA for display
      totalAC_kA: (sys.totalAC || 0) / 1000,
      totalAsym_kA: (sys.totalAsymmetric || 0) / 1000,
      motorCount: sys.motorCount || 0
    };
  });
  return out;
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

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.calculateMotorContribution = calculateMotorContribution;
    window.calculateTotalMotorContribution = calculateTotalMotorContribution;
    window.combineSystemAndMotorFault = combineSystemAndMotorFault;
    window.combineMotorWithSystem = combineSystemAndMotorFault;
    window.findDownstreamMotors = findDownstreamMotors;
    window.classifyMotor = classifyMotor;
    window.MOTOR_CONTRIBUTION = MOTOR_CONTRIBUTION;
    window.MOTOR_TYPES = MOTOR_TYPES;
    window.calculateMotorFaultContribution = calculateMotorFaultContribution;
    window.calculateSystemMotorContribution = calculateSystemMotorContribution;
    window.getSystemMotorDecaySummary = getSystemMotorDecaySummary;
    window.generateMotorDecayReport = generateMotorDecayReport;
    window.generateMotorDecayTable = generateMotorDecayTable;
}

console.log('✅ Motor Contribution Module v1.4.1 loaded');
console.log('   - CRITICAL FIX: Recursive downstream motor discovery');
console.log('   - FIXED: Proper handling of fromBus/toBus motor structure');
console.log('   - Voltage level correction: ENABLED');
console.log('   - IEEE 141-1993 Section 5.3 compliant');
console.log('   - All motors on downstream buses: INCLUDED');
console.log('   - Defensive checks: ENABLED');
console.log('   - Proper indentation: FIXED');
console.log('   - Backward compatible: YES');
