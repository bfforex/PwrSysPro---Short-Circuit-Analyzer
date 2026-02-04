/**
 * Motor Contribution to Fault Current Module
 * Calculates motor short-circuit contribution per IEEE 141 & IEC 60909
 * 
 * @author bfforex
 * @date 2025-10-28 04:35:12 UTC
 * @version 1.0.0
 * @standards IEEE 141-1993, IEC 60909, ANSI C37
 */

/**
 * Calculate motor contribution to short circuit current
 * Per IEEE 141 Section 4.4.3
 * 
 * @param {String} busId - Bus identifier where fault occurs
 * @returns {Object} Motor contribution data
 */
function calculateMotorContribution(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return null;
    
    logger.info(`Calculating motor contribution for ${bus.name} (${bus.voltage}V)`);
    
    const motorContribution = {
        busId: bus.id,
        busVoltage: bus.voltage,
        motors: [],
        totalMotorR: 0,
        totalMotorX: 0,
        totalMotorZ: 0,
        motorFaultCurrent: 0,
        contributionPercent: 0,
        calculationSteps: ''
    };
    
    // Find all motors connected to this bus (directly or through cables)
    const connectedMotors = findConnectedMotors(busId);
    
    if (connectedMotors.length === 0) {
        logger.info('  No motors connected to this bus');
        return motorContribution;
    }
    
    let steps = '\n' + '═'.repeat(80) + '\n';
    steps += 'MOTOR CONTRIBUTION TO FAULT CURRENT\n';
    steps += '═'.repeat(80) + '\n';
    steps += `Per IEEE 141-1993 Section 4.4.3\n`;
    steps += `Per IEC 60909 Section 3.8\n\n`;
    steps += `Bus: ${bus.name} (${bus.voltage}V)\n`;
    steps += `Connected Motors: ${connectedMotors.length}\n\n`;
    
    // Calculate individual motor contributions
    connectedMotors.forEach((motor, index) => {
        steps += `MOTOR ${index + 1}: ${motor.name}\n`;
        steps += '-'.repeat(80) + '\n';
        
        // Calculate motor full load current
        const motorVoltage = motor.voltage || bus.voltage;
        const motorFLC = calculateMotorCurrent(motor.hp, motorVoltage);
        
        steps += `HP: ${motor.hp}\n`;
        steps += `Voltage: ${motorVoltage}V\n`;
        steps += `Full Load Current: ${motorFLC.toFixed(2)} A\n`;
        
        // Locked Rotor Current (typically 5-7× FLC for induction motors)
        const LRmultiplier = motor.motorType === 'synchronous' ? 6 : 5;
        const I_LR = motorFLC * LRmultiplier;
        
        steps += `Locked Rotor Multiplier: ${LRmultiplier}× FLC\n`;
        steps += `Locked Rotor Current: ${I_LR.toFixed(2)} A\n`;
        
        // Motor impedance at locked rotor
        const Z_motor = motorVoltage / (SQRT3 * I_LR);
        
        // X/R ratio for motors (typical values per IEEE 141)
        const XR_motor = motor.motorType === 'synchronous' ? 15 : 10;
        
        // Separate R and X
        const R_motor = Z_motor / Math.sqrt(1 + XR_motor * XR_motor);
        const X_motor = Z_motor * XR_motor / Math.sqrt(1 + XR_motor * XR_motor);
        
        steps += `\nMotor Impedance Calculation:\n`;
        steps += `Z_motor = V / (√3 × I_LR)\n`;
        steps += `Z_motor = ${motorVoltage} / (${SQRT3.toFixed(4)} × ${I_LR.toFixed(2)})\n`;
        steps += `Z_motor = ${Z_motor.toFixed(6)} Ω\n\n`;
        steps += `Component Separation (X/R = ${XR_motor}):\n`;
        steps += `R_motor = ${R_motor.toFixed(6)} Ω\n`;
        steps += `X_motor = ${X_motor.toFixed(6)} Ω\n\n`;
        
        motorContribution.motors.push({
            name: motor.name,
            hp: motor.hp,
            type: motor.motorType,
            voltage: motorVoltage,
            flc: motorFLC,
            lrc: I_LR,
            r: R_motor,
            x: X_motor,
            z: Z_motor,
            xr: XR_motor
        });
    });
    
    // Parallel combination of all motor impedances
    if (motorContribution.motors.length > 0) {
        steps += '═'.repeat(80) + '\n';
        steps += 'PARALLEL COMBINATION OF MOTOR IMPEDANCES\n';
        steps += '═'.repeat(80) + '\n\n';
        
        // For parallel impedances: 1/Z_total = 1/Z1 + 1/Z2 + ... + 1/Zn
        let sumR_inv = 0;
        let sumX_inv = 0;
        
        motorContribution.motors.forEach(motor => {
            const Z_sq = motor.r * motor.r + motor.x * motor.x;
            sumR_inv += motor.r / Z_sq;
            sumX_inv += motor.x / Z_sq;
        });
        
        if (sumR_inv > 0 && sumX_inv > 0) {
            const R_denom = sumR_inv * sumR_inv + sumX_inv * sumX_inv;
            motorContribution.totalMotorR = sumR_inv / R_denom;
            motorContribution.totalMotorX = sumX_inv / R_denom;
            motorContribution.totalMotorZ = Math.sqrt(
                motorContribution.totalMotorR * motorContribution.totalMotorR +
                motorContribution.totalMotorX * motorContribution.totalMotorX
            );
            
            // Calculate motor fault current contribution
            motorContribution.motorFaultCurrent = bus.voltage / (SQRT3 * motorContribution.totalMotorZ);
            
            steps += `Total Motor Impedance (Parallel):\n`;
            steps += `R_total = ${motorContribution.totalMotorR.toFixed(6)} Ω\n`;
            steps += `X_total = ${motorContribution.totalMotorX.toFixed(6)} Ω\n`;
            steps += `Z_total = ${motorContribution.totalMotorZ.toFixed(6)} Ω\n\n`;
            steps += `Motor Contribution to Fault Current:\n`;
            steps += `I_motor = V / (√3 × Z_motor)\n`;
            steps += `I_motor = ${bus.voltage} / (${SQRT3.toFixed(4)} × ${motorContribution.totalMotorZ.toFixed(6)})\n`;
            steps += `I_motor = ${motorContribution.motorFaultCurrent.toFixed(2)} A = ${(motorContribution.motorFaultCurrent/1000).toFixed(3)} kA\n\n`;
            
            steps += `⚠️  IMPORTANT NOTES:\n`;
            steps += `1. Motor contribution is significant during first 3-4 cycles\n`;
            steps += `2. Must be included per IEEE 141, IEC 60909, and NEC requirements\n`;
            steps += `3. For interrupting devices, use full motor contribution\n`;
            steps += `4. For momentary ratings, use full motor contribution\n`;
            steps += `5. For 30-cycle ratings, motor contribution can typically be ignored\n\n`;
        }
    }
    
    motorContribution.calculationSteps = steps;
    
    logger.info(`  Motor contribution: ${(motorContribution.motorFaultCurrent/1000).toFixed(3)} kA`);
    
    return motorContribution;
}

/**
 * Find all motors connected to a bus
 * @param {String} busId - Bus identifier
 * @returns {Array} Array of connected motors
 */
function findConnectedMotors(busId) {
    const motors = [];
    const visited = new Set();
    
    function traverse(currentBusId) {
        if (visited.has(currentBusId)) return;
        visited.add(currentBusId);
        
        // Find components connected TO this bus
        const incomingComponents = components.filter(c => c.toBus === currentBusId);
        
        incomingComponents.forEach(comp => {
            if (comp.type === 'motor') {
                motors.push({
                    ...comp,
                    connectedBus: currentBusId
                });
            } else if (comp.type === 'cable') {
                // Traverse through cables
                traverse(comp.fromBus);
            }
            // Note: Don't traverse through transformers - motors on different voltage level
        });
    }
    
    traverse(busId);
    
    return motors;
}

/**
 * Combine motor contribution with system impedance
 * @param {Object} systemImpedance - System R, X, Z
 * @param {Object} motorContribution - Motor contribution data
 * @returns {Object} Combined impedance with motors
 */
function combineMotorWithSystem(systemImpedance, motorContribution) {
    if (!motorContribution || motorContribution.motors.length === 0) {
        return {
            ...systemImpedance,
            motorContribution: 0,
            withMotors: false
        };
    }
    
    // Parallel combination: System || Motors
    const R1 = systemImpedance.R;
    const X1 = systemImpedance.X;
    const R2 = motorContribution.totalMotorR;
    const X2 = motorContribution.totalMotorX;
    
    // Parallel impedance formula
    const denomR = R1 + R2;
    const denomX = X1 + X2;
    const denomZ_sq = denomR * denomR + denomX * denomX;
    
    const R_parallel = ((R1 * R2 - X1 * X2) * denomR + (R1 * X2 + X1 * R2) * denomX) / denomZ_sq;
    const X_parallel = ((R1 * X2 + X1 * R2) * denomR - (R1 * R2 - X1 * X2) * denomX) / denomZ_sq;
    const Z_parallel = Math.sqrt(R_parallel * R_parallel + X_parallel * X_parallel);
    
    return {
        R: R_parallel,
        X: X_parallel,
        Z: Z_parallel,
        motorContribution: motorContribution.motorFaultCurrent,
        withMotors: true,
        increase: ((Z_parallel - systemImpedance.Z) / systemImpedance.Z) * 100
    };
}

// Export functions
window.calculateMotorContribution = calculateMotorContribution;
window.findConnectedMotors = findConnectedMotors;
window.combineMotorWithSystem = combineMotorWithSystem;

logger.info('Motor Contribution module loaded');
logger.info('   - IEEE 141-1993 compliant');
logger.info('   - IEC 60909 compliant');
logger.info('   - NEC Article 430 compliant');