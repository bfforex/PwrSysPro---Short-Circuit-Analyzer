(function initPathUtils(global) {
    'use strict';

    function generateBusId() {
        return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function generateComponentId() {
        return Date.now();
    }

    function traceBusPath(busId) {
        const path = [];
        let currentBusId = busId;
        const visited = new Set();

        while (currentBusId) {
            if (visited.has(currentBusId)) {
                throw new Error('Circular reference detected in bus hierarchy');
            }
            visited.add(currentBusId);

            const currentBus = buses.find(b => b.id === currentBusId);
            if (!currentBus) return null;

            const feedingComponent = components.find(c => {
                if (!c) return false;

                const to = c.toBus ?? c.toBusId;
                if (to !== currentBusId) return false;

                if (c.type === 'bus-tie') {
                    const state = c.currentState || c.normalState || 'open';
                    return state !== 'open';
                }

                return true;
            });

            path.unshift({ bus: currentBus, component: feedingComponent || null });

            if (currentBus.type === 'source') {
                return path;
            }

            if (feedingComponent) {
                currentBusId = feedingComponent.fromBus ?? feedingComponent.fromBusId;
            } else {
                return null;
            }
        }

        return null;
    }

    function getLoadCurrent(bus, component = null, defaultCurrent = 100) {
        console.log(`\n🔍 Load Current for: ${bus?.name || 'Unknown'}`);

        if (component && component.loadCurrent && component.loadCurrent > 0) {
            console.log(`  ✅ Using component load: ${component.loadCurrent}A (manual)`);
            return parseFloat(component.loadCurrent);
        }

        if (bus && bus.loadCurrent && bus.loadCurrent > 0) {
            console.log(`  ✅ Using bus load: ${bus.loadCurrent}A`);
            return parseFloat(bus.loadCurrent);
        }

        if (bus && bus.load && bus.load.power && bus.voltage) {
            const power = parseFloat(bus.load.power);
            const powerFactor = parseFloat(bus.load.powerFactor) || 0.85;
            const voltage = parseFloat(bus.voltage) / 1000;
            const calculated = (power / (Math.sqrt(3) * voltage * powerFactor)) * 1000;
            console.log(`  ✅ Calculated from power: ${calculated.toFixed(2)}A`);
            return calculated;
        }

        if (typeof calculateDownstreamLoad === 'function') {
            const downstreamLoad = calculateDownstreamLoad(bus.id);
            if (downstreamLoad > 0) {
                console.log(`  ✅ Load flow analysis: ${downstreamLoad.toFixed(2)}A (calculated)`);
                return downstreamLoad;
            }
        }

        console.log(`  ⚠️ Using default: ${defaultCurrent}A`);
        return defaultCurrent;
    }

    global.generateBusId = generateBusId;
    global.generateComponentId = generateComponentId;
    global.traceBusPath = traceBusPath;
    global.getLoadCurrent = getLoadCurrent;

    console.log('✅ pathUtils loaded');

    // Utility compatibility check (absorbed from utils.js stub)
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

    const missingUtils = requiredUtils.filter(function(name) {
        return typeof global[name] === 'undefined';
    });

    if (missingUtils.length > 0) {
        console.warn('⚠️ Some utility functions are missing:', missingUtils);
    } else {
        console.log('✅ All utility functions available');
    }
})(window);