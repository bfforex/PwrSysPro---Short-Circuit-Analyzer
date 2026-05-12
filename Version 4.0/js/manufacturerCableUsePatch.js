/**
 * Manufacturer Cable Use Patch
 *
 * Load after:
 * - manufacturerCableData.js
 * - voltageDropCalc.js
 *
 * Purpose:
 * - Automatically assigns Phelps Dodge MXLP-CWS 12/20 kV manufacturer data key
 *   to MV copper cable components when applicable.
 * - Wraps calculateVoltageDrop() and updates result component details where
 *   manufacturer cable impedance can be calculated.
 *
 * Important:
 * - This patch can force result component values and formula details to show
 *   manufacturer R/X where component data is available.
 * - If voltageDropCalc.js internally builds long text before returning results,
 *   the core text generator may still say NEC unless voltageDropCalc.js itself
 *   is patched. For full native integration, patch the cable impedance function
 *   inside voltageDropCalc.js.
 */

(function installManufacturerCableUsePatch(global) {
    'use strict';

    if (global.__manufacturerCableUsePatchInstalled) return;
    global.__manufacturerCableUsePatchInstalled = true;

    const MANUFACTURER_KEY = 'phelps-dodge-mxlp-cws-12-20kv';
    const SQRT3 = Math.sqrt(3);

    function num(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function getPowerFactor() {
        return Math.min(
            1,
            Math.max(
                0,
                num(document.getElementById('powerFactor')?.value, 0.90)
            )
        );
    }

    function getTemperature() {
        return num(document.getElementById('temperature')?.value, 75);
    }

    function normalizeCableSizeKey(size) {
        if (size === null || size === undefined) return '';

        return String(size)
            .replace(/mm²|mm2|sq.mm|sqmm|kcmil|awg|AWG|\s/gi, '')
            .replace(/,/g, '');
    }

    function isCable(component) {
        return String(component?.type || '').toLowerCase() === 'cable';
    }

    function isCopper(component) {
        return String(component?.material || component?.conductorMaterial || '')
            .toLowerCase()
            .includes('copper');
    }

    function getVoltageLevel(component, resultComponent, result) {
        return num(
            resultComponent?.voltageLevel ??
            resultComponent?.nominalVoltage ??
            component?.voltage ??
            component?.voltageLevel ??
            result?.busVoltage ??
            result?.loadVoltage,
            0
        );
    }

    function isMediumVoltageCable(component, resultComponent, result) {
        const voltageLevel = getVoltageLevel(component, resultComponent, result);

        return voltageLevel >= 1000 ||
            String(component?.voltageClass || '').includes('12/20') ||
            String(component?.cableType || '').toLowerCase().includes('mxlp');
    }

    function manufacturerSizeExists(component) {
        if (typeof global.getManufacturerCableSizeData !== 'function') return false;

        const sizeKey = normalizeCableSizeKey(component?.size);
        const info = global.getManufacturerCableSizeData(MANUFACTURER_KEY, sizeKey);

        return !!info;
    }

    function ensureManufacturerCableKey(component, resultComponent, result) {
        if (!component || !isCable(component)) return false;

        if (component.manufacturerCableDataKey || component.cableDataKey) {
            return true;
        }

        if (!isCopper(component)) return false;
        if (!isMediumVoltageCable(component, resultComponent, result)) return false;
        if (!manufacturerSizeExists(component)) return false;

        component.manufacturerCableDataKey = MANUFACTURER_KEY;
        component.cableDataKey = MANUFACTURER_KEY;

        return true;
    }

    function getComponentLabel(component) {
        return component?.tag ||
            component?.name ||
            component?.id ||
            'Cable';
    }

    function getCurrent(component, resultComponent, result) {
        return num(
            resultComponent?.current ??
            resultComponent?.currentA ??
            component?.current ??
            component?.loadCurrent ??
            component?.designCurrent ??
            result?.loadCurrent,
            0
        );
    }

    function getComponentPowerFactor(component, resultComponent) {
        return Math.min(
            1,
            Math.max(
                0,
                num(
                    resultComponent?.powerFactor ??
                    component?.powerFactor ??
                    component?.pf,
                    getPowerFactor()
                )
            )
        );
    }

    function calculateDropVolts(currentA, rOhms, xOhms, powerFactor) {
        const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));

        return SQRT3 *
            currentA *
            ((rOhms * powerFactor) + (xOhms * sinTheta));
    }

    function findMatchingResultComponent(component, resultComponents, fallbackIndex) {
        if (!component || !Array.isArray(resultComponents)) return {};

        const label = getComponentLabel(component);

        const matched = resultComponents.find(function (candidate) {
            return candidate === component ||
                candidate?.tag === component.tag ||
                candidate?.name === component.name ||
                candidate?.id === component.id ||
                candidate?.tag === label ||
                candidate?.name === label;
        });

        return matched ||
            resultComponents[fallbackIndex - 1] ||
            resultComponents[fallbackIndex] ||
            {};
    }

    function calculateManufacturerImpedance(component) {
        if (typeof global.calculateManufacturerCableImpedance !== 'function') {
            return null;
        }

        try {
            return global.calculateManufacturerCableImpedance(component, {
                temperatureC: getTemperature()
            });
        } catch (error) {
            console.warn('[Manufacturer Cable Patch] Failed to calculate manufacturer impedance:', error);
            return null;
        }
    }

    function updateCalculationStepsText(result, componentLabel, impedance, dropVolts) {
        if (!result || typeof result.calculationSteps !== 'string') return;

        const note = [
            '',
            'Manufacturer Cable Data Applied',
            '────────────────────────────────────────────────────────────────────────────────',
            'Component: ' + componentLabel,
            'Data Source: Phelps Dodge MXLP-CWS 12/20 kV via manufacturerCableData.js',
            'Rdc20 corrected to selected conductor temperature.',
            'R = ' + impedance.rOhms.toFixed(6) + ' Ω',
            'X = ' + impedance.xOhms.toFixed(6) + ' Ω',
            'Manufacturer-based VD = ' + dropVolts.toFixed(3) + ' V',
            ''
        ].join('\n');

        if (!result.calculationSteps.includes('Manufacturer Cable Data Applied')) {
            result.calculationSteps += '\n' + note;
        }
    }

    function applyManufacturerCableDataToResult(result, path) {
        if (!result || !Array.isArray(path)) return result;

        const resultComponents = Array.isArray(result.components)
            ? result.components
            : [];

        const formulaDetails = Array.isArray(result.voltageDropFormulaDetails)
            ? result.voltageDropFormulaDetails
            : [];

        path.forEach(function (segment, index) {
            const component = segment?.component;

            if (!component || !isCable(component)) return;

            const resultComponent = findMatchingResultComponent(
                component,
                resultComponents,
                index
            );

            const keyReady = ensureManufacturerCableKey(
                component,
                resultComponent,
                result
            );

            if (!keyReady) return;

            const impedance = calculateManufacturerImpedance(component);

            if (!impedance) return;

            const currentA = getCurrent(component, resultComponent, result);
            const powerFactor = getComponentPowerFactor(component, resultComponent);
            const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
            const dropVolts = calculateDropVolts(
                currentA,
                impedance.rOhms,
                impedance.xOhms,
                powerFactor
            );

            const voltageLevel = getVoltageLevel(
                component,
                resultComponent,
                result
            );

            const dropPercent = voltageLevel > 0
                ? dropVolts / voltageLevel * 100
                : 0;

            resultComponent.rOhms = impedance.rOhms;
            resultComponent.xOhms = impedance.xOhms;
            resultComponent.resistanceOhms = impedance.rOhms;
            resultComponent.reactanceOhms = impedance.xOhms;
            resultComponent.dropVolts = dropVolts;
            resultComponent.dropPercent = dropPercent;
            resultComponent.impedanceSource = 'manufacturerCableData.js';
            resultComponent.manufacturerCableDataKey = MANUFACTURER_KEY;

            const label = getComponentLabel(component);

            formulaDetails.push({
                step: index,
                type: 'cable',
                component: label,
                currentA: currentA,
                rOhms: impedance.rOhms,
                xOhms: impedance.xOhms,
                powerFactor: powerFactor,
                sinTheta: sinTheta,
                calculatedDropVolts: dropVolts,
                usedDropVolts: dropVolts,
                voltageLevel: voltageLevel,
                dropPercent: dropPercent,
                impedanceSource: 'manufacturerCableData.js',
                formula: 'VD = √3 × I × (R cosθ + X sinθ)'
            });

            updateCalculationStepsText(
                result,
                label,
                impedance,
                dropVolts
            );
        });

        result.voltageDropFormulaDetails = formulaDetails;

        return result;
    }

    function preTagManufacturerCables(path) {
        if (!Array.isArray(path)) return;

        path.forEach(function (segment) {
            const component = segment?.component;

            if (!component || !isCable(component)) return;

            ensureManufacturerCableKey(component, {}, {});
        });
    }

    function installPatch() {
        if (typeof global.calculateVoltageDrop !== 'function') return false;
        if (global.calculateVoltageDrop.__manufacturerCableUsePatchApplied) return true;

        const originalCalculateVoltageDrop = global.calculateVoltageDrop;

        const patchedCalculateVoltageDrop = function patchedCalculateVoltageDrop(busId, path, loadFlowData) {
            preTagManufacturerCables(path);

            const result = originalCalculateVoltageDrop.apply(this, arguments);

            return applyManufacturerCableDataToResult(result, path);
        };

        patchedCalculateVoltageDrop.__manufacturerCableUsePatchApplied = true;

        global.calculateVoltageDrop = patchedCalculateVoltageDrop;

        try {
            calculateVoltageDrop = patchedCalculateVoltageDrop;
        } catch (_) {}

        return true;
    }

    if (!installPatch()) {
        const timer = setInterval(function () {
            if (installPatch()) {
                clearInterval(timer);
            }
        }, 100);

        setTimeout(function () {
            clearInterval(timer);
        }, 5000);
    }

    global.applyManufacturerCableDataToVoltageDropResult = applyManufacturerCableDataToResult;

    console.log('✅ Manufacturer Cable Use Patch loaded');
})(typeof window !== 'undefined' ? window : globalThis);