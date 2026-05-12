/**
 * Voltage Drop Formula Details Patch - Non-invasive
 *
 * Load after:
 * - manufacturerCableData.js
 * - voltageDropCalc.js
 *
 * Purpose:
 * - Adds voltageDropFormulaDetails to calculateVoltageDrop() result.
 * - Does NOT overwrite conductor totals, transformer totals, system profile totals, or tap values.
 * - Provides values for:
 *      VD = √3 × I × (R cosθ + X sinθ)
 *
 * Notes:
 * - Cable/conductor rows include I, R, X, cosθ, sinθ, calculated VD, used VD, and impedance source.
 * - Transformer rows are added as notes only.
 * - Breakers, fuses, and non-cable devices are skipped unless already represented in result components.
 */

(function installVoltageDropFormulaDetailsPatch(global) {
    'use strict';

    if (global.__voltageDropFormulaDetailsPatchInstalled) return;
    global.__voltageDropFormulaDetailsPatchInstalled = true;

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

    function getComponentType(component) {
        return String(component?.type || '').toLowerCase();
    }

    function isCable(component) {
        return getComponentType(component) === 'cable';
    }

    function isTransformer(component) {
        return getComponentType(component) === 'transformer';
    }

    function getComponentLabel(component) {
        return component?.tag ||
            component?.name ||
            component?.id ||
            'Component';
    }

    function getManufacturerImpedance(component) {
        if (!isCable(component)) return null;
        if (typeof global.calculateManufacturerCableImpedance !== 'function') return null;

        try {
            return global.calculateManufacturerCableImpedance(component, {
                temperatureC: getTemperature()
            });
        } catch (error) {
            console.warn('[VD Formula Patch] Manufacturer cable impedance failed:', error);
            return null;
        }
    }

    function getResistance(component, resultComponent) {
        const direct = num(
            resultComponent?.rOhms ??
            resultComponent?.resistanceOhms ??
            resultComponent?.resistance ??
            component?.rOhms ??
            component?.resistanceOhms ??
            component?.resistance,
            NaN
        );

        if (Number.isFinite(direct)) {
            return {
                value: direct,
                source: resultComponent?.impedanceSource ||
                    component?.impedanceSource ||
                    'component/result'
            };
        }

        const manufacturer = getManufacturerImpedance(component);

        if (manufacturer && Number.isFinite(Number(manufacturer.rOhms))) {
            return {
                value: Number(manufacturer.rOhms),
                source: 'manufacturerCableData.js'
            };
        }

        return {
            value: 0,
            source: 'not available'
        };
    }

    function getReactance(component, resultComponent) {
        const direct = num(
            resultComponent?.xOhms ??
            resultComponent?.reactanceOhms ??
            resultComponent?.reactance ??
            component?.xOhms ??
            component?.reactanceOhms ??
            component?.reactance,
            NaN
        );

        if (Number.isFinite(direct)) {
            return {
                value: direct,
                source: resultComponent?.impedanceSource ||
                    component?.impedanceSource ||
                    'component/result'
            };
        }

        const manufacturer = getManufacturerImpedance(component);

        if (manufacturer && Number.isFinite(Number(manufacturer.xOhms))) {
            return {
                value: Number(manufacturer.xOhms),
                source: 'manufacturerCableData.js'
            };
        }

        return {
            value: 0,
            source: 'not available'
        };
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

    function getPowerFactorForComponent(component, resultComponent) {
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

    function getVoltageLevel(component, segment, resultComponent, result) {
        return num(
            resultComponent?.voltageLevel ??
            resultComponent?.nominalVoltage ??
            component?.voltage ??
            segment?.bus?.voltage ??
            result?.busVoltage ??
            result?.loadVoltage,
            0
        );
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

    function buildTransformerDetail(component, resultComponent, index) {
        const tapPercent = num(
            component?.tapPercent ??
            component?.tapSettingPercent ??
            component?.tapSetting ??
            component?.tap ??
            resultComponent?.tapPercent,
            0
        );

        return {
            step: index,
            type: 'transformer',
            component: getComponentLabel(component),
            tapPercent: tapPercent,
            dropVolts: num(resultComponent?.dropVolts, 0),
            dropPercent: num(resultComponent?.dropPercent, 0),
            note: 'Transformer regulation/tap shown separately; conductor voltage-drop compliance excludes transformer internal regulation.'
        };
    }

    function buildCableFormulaDetail(component, segment, resultComponent, result, index) {
        const currentA = getCurrent(component, resultComponent, result);
        const powerFactor = getPowerFactorForComponent(component, resultComponent);
        const sinTheta = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
        const resistance = getResistance(component, resultComponent);
        const reactance = getReactance(component, resultComponent);

        const calculatedDropVolts =
            SQRT3 *
            currentA *
            ((resistance.value * powerFactor) + (reactance.value * sinTheta));

        const usedDropVolts = num(
            resultComponent?.dropVolts ??
            resultComponent?.voltageDropVolts,
            calculatedDropVolts
        );

        const voltageLevel = getVoltageLevel(
            component,
            segment,
            resultComponent,
            result
        );

        return {
            step: index,
            type: 'cable',
            component: getComponentLabel(component),
            currentA: currentA,
            rOhms: resistance.value,
            xOhms: reactance.value,
            powerFactor: powerFactor,
            sinTheta: sinTheta,
            calculatedDropVolts: calculatedDropVolts,
            usedDropVolts: usedDropVolts,
            voltageLevel: voltageLevel,
            dropPercent: voltageLevel > 0 ? usedDropVolts / voltageLevel * 100 : 0,
            impedanceSource: resistance.source === reactance.source
                ? resistance.source
                : resistance.source + ' / ' + reactance.source,
            formula: 'VD = √3 × I × (R cosθ + X sinθ)'
        };
    }

    function addFormulaDetails(result, path) {
        if (!result || !Array.isArray(path)) return result;

        const resultComponents = Array.isArray(result.components)
            ? result.components
            : [];

        const details = [];

        path.forEach(function (segment, index) {
            const component = segment?.component;

            if (!component) return;

            const resultComponent = findMatchingResultComponent(
                component,
                resultComponents,
                index
            );

            if (isTransformer(component)) {
                details.push(
                    buildTransformerDetail(component, resultComponent, index)
                );
                return;
            }

            if (!isCable(component)) {
                return;
            }

            details.push(
                buildCableFormulaDetail(
                    component,
                    segment,
                    resultComponent,
                    result,
                    index
                )
            );
        });

        result.voltageDropFormulaDetails = details;

        return result;
    }

    function installPatch() {
        if (typeof global.calculateVoltageDrop !== 'function') return false;
        if (global.calculateVoltageDrop.__formulaDetailsPatchApplied) return true;

        const originalCalculateVoltageDrop = global.calculateVoltageDrop;

        const patchedCalculateVoltageDrop = function patchedCalculateVoltageDrop(busId, path, loadFlowData) {
            const result = originalCalculateVoltageDrop.apply(this, arguments);
            return addFormulaDetails(result, path);
        };

        patchedCalculateVoltageDrop.__formulaDetailsPatchApplied = true;

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

    global.addVoltageDropFormulaDetails = addFormulaDetails;

    console.log('✅ Voltage Drop Formula Details Patch loaded');
})(typeof window !== 'undefined' ? window : globalThis);