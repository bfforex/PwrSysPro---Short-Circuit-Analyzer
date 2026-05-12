(function initMathUtils(global) {
    'use strict';

    function temperatureCorrection(r75, temp, material = 'copper') {
        const alpha = TEMP_COEFFICIENT[material];
        return r75 * (1 + alpha * (temp - 75));
    }

    function calculateParallelImpedance(z1, z2) {
        const R_sum = z1.r + z2.r;
        const X_sum = z1.x + z2.x;
        const R_prod = z1.r * z2.r - z1.x * z2.x;
        const X_prod = z1.r * z2.x + z1.x * z2.r;
        const denominator = R_sum * R_sum + X_sum * X_sum;

        if (denominator === 0) {
            return { r: 0, x: 0 };
        }

        const R_parallel = (R_prod * R_sum + X_prod * X_sum) / denominator;
        const X_parallel = (X_prod * R_sum - R_prod * X_sum) / denominator;

        return { r: R_parallel, x: X_parallel };
    }

    function calculateComponentVoltageDrop(component, current, voltage, resistance, reactance, powerFactor) {
        const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
        const dropVolts = Math.sqrt(3) * current * (resistance * powerFactor + reactance * sinPhi);
        const dropPercent = (dropVolts / voltage) * 100;

        let severity = 'OK';
        if (dropPercent > 7) {
            severity = 'CRITICAL';
        } else if (dropPercent > 5) {
            severity = 'HIGH';
        } else if (dropPercent > 3) {
            severity = 'MEDIUM';
        }

        return {
            dropVolts: dropVolts,
            dropPercent: dropPercent,
            severity: severity,
            current: current,
            powerFactor: powerFactor
        };
    }

    function referCurrentAcrossTransformer(current, fromVoltage, toVoltage) {
        const turnsRatio = fromVoltage / toVoltage;
        return current / turnsRatio;
    }

    function calculateTransformerCurrent(kva, voltage, loadingFactor = 0.8) {
        return (kva * 1000 * loadingFactor) / (Math.sqrt(3) * voltage);
    }

    function calculateMotorCurrent(hp, voltage, efficiency = 0.9, powerFactor = 0.85, phases = 3) {
        const phaseFactor = (phases === 1) ? 1 : Math.sqrt(3);
        return (hp * 746) / (voltage * phaseFactor * efficiency * powerFactor);
    }

    global.temperatureCorrection = temperatureCorrection;
    global.calculateParallelImpedance = calculateParallelImpedance;
    global.calculateComponentVoltageDrop = calculateComponentVoltageDrop;
    global.referCurrentAcrossTransformer = referCurrentAcrossTransformer;
    global.calculateTransformerCurrent = calculateTransformerCurrent;
    global.calculateMotorCurrent = calculateMotorCurrent;

    console.log('✅ mathUtils loaded');
})(window);