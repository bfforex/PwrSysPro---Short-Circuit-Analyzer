// Utility compatibility shim
(function initUtilsShim(global) {
    'use strict';

    const requiredUtils = [
        'temperatureCorrection',
        'calculateParallelImpedance',
        'calculateComponentVoltageDrop',
        'referCurrentAcrossTransformer',
        'calculateTransformerCurrent',
        'calculateMotorCurrent',
        'getCalculationTimestamp',
        'safeToFixed',
        'getBusIcon',
        'updateSessionTime',
        'generateBusId',
        'generateComponentId',
        'traceBusPath',
        'getLoadCurrent'
    ];

    const missing = requiredUtils.filter(function(name) {
        return typeof global[name] === 'undefined';
    });

    if (missing.length > 0) {
        console.warn('⚠️ utils.js shim loaded but some split utilities are missing:', missing);
    } else {
        console.log('✅ utils.js compatibility shim loaded');
    }
})(window);
