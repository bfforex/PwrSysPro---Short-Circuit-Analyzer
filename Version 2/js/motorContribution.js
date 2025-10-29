/**
 * Motor Contribution to Short Circuit Calculation Module
 * Calculates motor fault current contribution per IEEE 141-1993
 * 
 * @author bfforex
 * @date 2025-10-29 16:36:20 UTC
 * @version 1.3.0
 * @fixed combineSystemAndMotorFault returns complete structure
 * @fixed Added totalSymmetricalContribution and totalAsymmetricalContribution
 * @fixed Return structure includes motors array
 * @fixed Defensive checks for invalid motor HP
 * 
 * Standards:
 * - IEEE 141-1993 (Red Book) - Section 5.3
 * - IEC 60909 - Short-Circuit Currents
 * - NEC Article 430 - Motors, Motor Circuits, and Controllers
 */

console.log('🔧 Loading Motor Contribution Module v1.3.0...');

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
 * @param {Number} busVoltage - Bus voltage in volts
 * @param {String} contributionType - 'interrupting' or 'momentary'
 * @returns {Object|null} Motor contribution data or null if invalid
 */
function calculateMotorContribution(motor, busVoltage, contributionType = 'interrupting') {
    // ═══════════════════════════════════════════════════════════════════════
    // ✅ DEFENSIVE CHECK: Validate motor object
    // ═══════════════════════════════════════════════════════════════════════
    
    if (!motor || typeof motor !== 'object') {
        console.warn('⚠️ Invalid motor object:', motor);
        return null;
    }
    
    // ✅ CRITICAL CHECK: Validate motor has valid HP
    if (!motor.hp || motor.hp <= 0 || isNaN(motor.hp)) {
        console.warn(`⚠️ Skipping motor with invalid HP:`, motor);
        return null;
    }
    
    // ✅ Set defaults for missing properties
    const motorType = motor.motorType || 'induction';
    const efficiency = motor.efficiency || 0.90;
    const powerFactor = motor.powerFactor || 0.85;
    
    let steps = '';
    steps += '═'.repeat(80) + '\n';
    steps += 'MOTOR CONTRIBUTION TO SHORT CIRCUIT\n';
    steps += '═'.repeat(80) + '\n\n';
    steps += `Motor: ${motor.name || 'Unnamed Motor'}\n`;
    steps += `HP: ${motor.hp}\n`;
    steps += `Type: ${motorType}\n`;
    steps += `Bus Voltage: ${busVoltage}V\n`;
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
    
    // Calculate motor impedance
    const motorZ = busVoltage / (SQRT3 * lockedRotorCurrent);
    const motorX = motorZ * xr / Math.sqrt(1 + xr * xr);
    const motorR = motorZ / Math.sqrt(1 + xr * xr);
    
    steps += `MOTOR IMPEDANCE:\n`;
    steps += `Z_motor = V / (√3 × I_LRC)\n`;
    steps += `Z_motor = ${busVoltage} / (${SQRT3.toFixed(4)} × ${lockedRotorCurrent.toFixed(2)})\n`;
    steps += `Z_motor = ${motorZ.toFixed(6)} Ω\n\n`;
    steps += `Component Separation (X/R = ${xr}):\n`;
    steps += `X_motor = ${motorX.toFixed(6)} Ω\n`;
    steps += `R_motor = ${motorR.toFixed(6)} Ω\n\n`;
    
    // Motor fault current contribution
    const motorFaultCurrent = busVoltage / (SQRT3 * motorZ);
    
    steps += `MOTOR FAULT CONTRIBUTION:\n`;
    steps += `I_motor = V / (√3 × Z_motor)\n`;
    steps += `I_motor = ${busVoltage} / (${SQRT3.toFixed(4)} × ${motorZ.toFixed(6)})\n`;
    steps += `I_motor = ${motorFaultCurrent.toFixed(2)} A = ${(motorFaultCurrent/1000).toFixed(3)} kA\n\n`;
    
    // Asymmetrical contributions
    const symmetricalContribution = motorFaultCurrent;
    const asymMultiplier = Math.sqrt(1 + 2 * Math.exp(-4 * motorR / motorX));
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
    console.log(`Motor Contribution: ${motor.hp} HP`);
    console.log(`  Class: ${motorClass}`);
    console.log(`  FLC: ${fullLoadCurrent.toFixed(2)} A`);
    console.log(`  X": ${motorX.toFixed(6)} Ω (${xdPrime}% on motor base)`);
    console.log(`  X/R: ${xr}`);
    console.log(`  Symmetrical Contribution: ${(symmetricalContribution/1000).toFixed(3)} kA`);
    console.log(`  Asymmetrical Contribution: ${(asymmetricalContribution/1000).toFixed(3)} kA`);
    
    return {
        motors: [motor],
        motorClass: motorClass,
        motorHP: motor.hp,
        motorType: motorType,
        busVoltage: busVoltage,
        fullLoadCurrent: fullLoadCurrent,
        lockedRotorCurrent: lockedRotorCurrent,
        contributionFactor: contributionFactor,
        motorImpedance: motorZ,
        motorR: motorR,
        motorX: motorX,
        totalMotorR: motorR,
        totalMotorX: motorX,
        totalMotorZ: motorZ,
        motorFaultCurrent: motorFaultCurrent,
        symmetricalContribution: symmetricalContribution,
        asymmetricalContribution: asymmetricalContribution,
        calculationSteps: steps
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// FIND DOWNSTREAM MOTORS
// ═══════════════════════════════════════════════════════════════════════════

function findDownstreamMotors(busId) {
    const motors = [];
    const visited = new Set();
    
    function traverse(currentBusId) {
        if (visited.has(currentBusId)) return;
        visited.add(currentBusId);
        
        if (!Array.isArray(components)) {
            console.error('❌ components is not an array');
            return;
        }
        
        const downstreamComponents = components.filter(c => 
            c && c.fromBus === currentBusId
        );
        
        downstreamComponents.forEach(comp => {
            if (comp.type === 'motor') {
                if (comp.hp && comp.hp > 0 && !isNaN(comp.hp)) {
                    motors.push(comp);
                } else {
                    console.warn(`⚠️ Skipping motor with invalid HP: ${comp.name || comp.id}`);
                }
            }
            
            if (comp.type === 'transformer' || comp.type === 'cable') {
                if (comp.toBus) {
                    traverse(comp.toBus);
                }
            }
        });
    }
    
    traverse(busId);
    return motors;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL MOTOR CONTRIBUTION FOR A BUS
// ═══════════════════════════════════════════════════════════════════════════

function calculateTotalMotorContribution(busId, contributionType = 'interrupting') {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        console.warn(`⚠️ Bus ${busId} not found`);
        return null;
    }
    
    const motors = findDownstreamMotors(busId);
    
    if (motors.length === 0) {
        console.log(`ℹ️  No motors found at bus: ${bus.name}`);
        return null;
    }
    
    console.log(`\n🔵 Calculating motor contribution for: ${bus.name}`);
    console.log(`   Found ${motors.length} motor(s)`);
    
    const motorContributions = motors.map(motor => {
        return calculateMotorContribution(motor, bus.voltage, contributionType);
    }).filter(contrib => contrib !== null);
    
    if (motorContributions.length === 0) {
        console.log(`⚠️ No valid motor contributions calculated`);
        return null;
    }
    
    // Combine motor impedances in parallel
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
    
    const totalMotorFaultCurrent = bus.voltage / (SQRT3 * totalMotorZ);
    
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
    combinedSteps += `Parallel Combination of Motor Impedances:\n`;
    combinedSteps += `Total R_motor = ${totalMotorR.toFixed(6)} Ω\n`;
    combinedSteps += `Total X_motor = ${totalMotorX.toFixed(6)} Ω\n`;
    combinedSteps += `Total Z_motor = ${totalMotorZ.toFixed(6)} Ω\n`;
    combinedSteps += `X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    
    combinedSteps += `Total Motor Fault Current (Symmetrical):\n`;
    combinedSteps += `I_motor_total = ${bus.voltage} / (√3 × ${totalMotorZ.toFixed(6)})\n`;
    combinedSteps += `I_motor_total = ${totalMotorFaultCurrent.toFixed(2)} A = ${(totalMotorFaultCurrent/1000).toFixed(3)} kA\n\n`;
    
    combinedSteps += `Total Motor Fault Current (Asymmetrical):\n`;
    combinedSteps += `Multiplier = √(1 + 2e^(-4R/X)) = ${asymMultiplier.toFixed(4)}\n`;
    combinedSteps += `I_asym = ${(totalMotorFaultCurrent/1000).toFixed(3)} × ${asymMultiplier.toFixed(4)}\n`;
    combinedSteps += `I_asym = ${(totalMotorAsymCurrent/1000).toFixed(3)} kA\n\n`;
    
    console.log(`   ✅ Total motor contribution: ${(totalMotorFaultCurrent/1000).toFixed(3)} kA (sym)`);
    console.log(`   ✅ Total motor contribution: ${(totalMotorAsymCurrent/1000).toFixed(3)} kA (asym)`);
    
    return {
        motors: motors,
        busId: busId,
        busName: bus.name,
        busVoltage: bus.voltage,
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
        R: systemFaultResults.totalImpedance.resistance || systemFaultResults.totalR,
        X: systemFaultResults.totalImpedance.reactance || systemFaultResults.totalX,
        Z: systemFaultResults.totalImpedance.magnitude || systemFaultResults.totalZ
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
    
    console.log('🔄 Combining system and motor contributions:');
    console.log(`   System only: ${systemFaultResults.faultCurrents.threePhaseSym.toFixed(3)} kA`);
    console.log(`   Motor contribution: ${motorContribution.totalSymmetricalContribution.toFixed(3)} kA`);
    console.log(`   Combined: ${combinedFaultCurrentKA.toFixed(3)} kA`);
    console.log(`   Increase: ${faultCurrentIncrease.toFixed(1)}%`);
    
    // ═══════════════════════════════════════════════════════════════════════
    // ✅ RETURN COMPLETE SHORT CIRCUIT RESULT STRUCTURE
    // Fixed: 2025-10-29 16:36:20 UTC by bfforex
    // ═══════════════════════════════════════════════════════════════════════
    
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

window.calculateMotorContribution = calculateMotorContribution;
window.calculateTotalMotorContribution = calculateTotalMotorContribution;
window.combineSystemAndMotorFault = combineSystemAndMotorFault;
window.combineMotorWithSystem = combineSystemAndMotorFault;
window.findDownstreamMotors = findDownstreamMotors;
window.classifyMotor = classifyMotor;
window.MOTOR_CONTRIBUTION = MOTOR_CONTRIBUTION;
window.MOTOR_TYPES = MOTOR_TYPES;

console.log('✅ Motor Contribution Module v1.3.0 loaded');
console.log('   - Defensive checks: ENABLED');
console.log('   - Return structure: COMPLETE');
console.log('   - combineSystemAndMotorFault: FIXED');
console.log('   - IEEE 141-1993 compliant');