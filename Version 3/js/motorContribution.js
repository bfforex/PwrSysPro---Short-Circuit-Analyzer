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
 * Calculate short circuit contribution from a single motor
 * Per IEEE 141-1993, IEC 60909, and NEC Article 430
 * 
 * @param {Object} motor - Motor object with hp, motorType, efficiency, powerFactor
 * @param {Number} busVoltage - Bus voltage in volts (where motor is connected)
 * @param {Number} faultVoltage - Fault point voltage (for impedance referral)
 * @param {String} contributionType - 'interrupting' or 'momentary'
 * @returns {Object|null} Motor contribution data or null if invalid
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
 * Per IEEE 141 Section 5.3.2: "Motor contribution must include all motors
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
 * Calculate total motor contribution to fault current at a given bus
 * Includes ALL motors downstream from fault point
 * 
 * @param {String} busId - Bus where fault is occurring
 * @param {String} contributionType - 'interrupting' or 'momentary'
 * @returns {Object|null} Total motor contribution data or null if no motors
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
    
    combinedSteps += `✅ Per IEEE 141-1993 Section 5.3.2:\n`;
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
 * System and motors act as parallel sources
 * 
 * @param {Object} systemFaultResults - Complete short circuit results from calculateShortCircuit
 * @param {Object} motorContribution - Motor contribution data from calculateTotalMotorContribution
 * @returns {Object} Combined short circuit results with motor contribution
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
        calculationSteps: systemFaultResults.calculationSteps + '\n\n' + motorContribution.calculationSteps
    };
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
}

console.log('✅ Motor Contribution Module v1.4.1 loaded');
console.log('   - CRITICAL FIX: Recursive downstream motor discovery');
console.log('   - FIXED: Proper handling of fromBus/toBus motor structure');
console.log('   - Voltage level correction: ENABLED');
console.log('   - IEEE 141-1993 Section 5.3.2 compliant');
console.log('   - All motors on downstream buses: INCLUDED');
console.log('   - Defensive checks: ENABLED');
console.log('   - Proper indentation: FIXED');
console.log('   - Backward compatible: YES');