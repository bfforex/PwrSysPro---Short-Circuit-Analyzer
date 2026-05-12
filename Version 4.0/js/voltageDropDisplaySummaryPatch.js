/**
 * Voltage Drop Display Summary Patch
 *
 * Load after:
 * - calculationDisplay.js
 *
 * Purpose:
 * - Fixes voltage-drop UI display basis.
 * - Prevents final 240 V / 440 V load voltage from being compared against 13.2 kV source voltage.
 * - Prevents final 240 V load voltage from being compared against upstream 451 V tap-adjusted transformer bus.
 * - Uses final load bus nominal voltage for system voltage profile.
 *
 * Expected result for MDP1 based on current calculation text:
 * - Conductor VD should follow results.conductorVoltageDrop, e.g. about 0.496%.
 * - System profile should be based on 240 V final load level, not 13.2 kV or 451 V.
 */

(function installVoltageDropDisplaySummaryPatch(global) {
    'use strict';

    if (global.__voltageDropDisplaySummaryPatchInstalled) return;
    global.__voltageDropDisplaySummaryPatchInstalled = true;

    function vdNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function getFinalNominalLoadVoltage(results) {
        return vdNumber(
            results?.nominalLoadVoltage,
            vdNumber(
                results?.nominalVoltage,
                vdNumber(
                    results?.busVoltage,
                    vdNumber(
                        results?.targetBusVoltage,
                        vdNumber(
                            results?.systemVoltageProfile?.basisVoltage,
                            0
                        )
                    )
                )
            )
        );
    }

    function getTapAdjustedVoltage(results) {
        return vdNumber(
            results?.tapAdjustedNominal,
            vdNumber(
                results?.tapAdjustment?.tapAdjustedNominal,
                0
            )
        );
    }

    function getConductorComponents(results, components) {
        if (Array.isArray(results?.conductorVoltageDrop?.components)) {
            return results.conductorVoltageDrop.components;
        }

        return components.filter(function (component) {
            return String(component.type || '').toLowerCase() !== 'transformer';
        });
    }

    function getTransformerComponents(results, components) {
        if (Array.isArray(results?.transformerRegulation?.transformers)) {
            return results.transformerRegulation.transformers;
        }

        return components.filter(function (component) {
            return String(component.type || '').toLowerCase() === 'transformer';
        });
    }

    function getConductorDropVolts(results, conductorComponents) {
        const direct = vdNumber(
            results?.conductorVoltageDrop?.totalDropVolts,
            NaN
        );

        if (Number.isFinite(direct)) {
            return direct;
        }

        return conductorComponents.reduce(function (sum, component) {
            return sum + vdNumber(component.dropVolts, 0);
        }, 0);
    }

    function getConductorDropPercent(results, conductorDropVolts, basisVoltage) {
        const direct = vdNumber(
            results?.conductorVoltageDrop?.totalDropPercent,
            NaN
        );

        if (Number.isFinite(direct)) {
            return direct;
        }

        return basisVoltage > 0
            ? conductorDropVolts / basisVoltage * 100
            : 0;
    }

    function getTransformerDropVolts(results, transformerComponents) {
        return vdNumber(
            results?.transformerRegulation?.totalDropVolts,
            transformerComponents.reduce(function (sum, component) {
                return sum + vdNumber(component.dropVolts, 0);
            }, 0)
        );
    }

    function getTransformerDropPercent(results, transformerComponents) {
        return vdNumber(
            results?.transformerRegulation?.totalDropPercent,
            transformerComponents.reduce(function (sum, component) {
                return sum + vdNumber(component.dropPercent, 0);
            }, 0)
        );
    }

    function getHighestTransformerLoading(results, transformerComponents) {
        return vdNumber(
            results?.transformerRegulation?.highestLoading,
            transformerComponents.reduce(function (max, component) {
                return Math.max(max, vdNumber(component.loading, 0));
            }, 0)
        );
    }

    function fixedGetVoltageDropDisplayBreakdown(results) {
        const components = Array.isArray(results?.components)
            ? results.components
            : [];

        const nominalLoadVoltage = getFinalNominalLoadVoltage(results);
        const tapAdjustedNominal = getTapAdjustedVoltage(results);

        const conductorBasisVoltage = vdNumber(
            results?.conductorVoltageDrop?.basisVoltage,
            tapAdjustedNominal > 0 ? tapAdjustedNominal : nominalLoadVoltage
        );

        const conductorComponents = getConductorComponents(results, components);
        const transformerComponents = getTransformerComponents(results, components);

        const conductorDropVolts = getConductorDropVolts(
            results,
            conductorComponents
        );

        const conductorDropPercent = getConductorDropPercent(
            results,
            conductorDropVolts,
            conductorBasisVoltage
        );

        const transformerDropVolts = getTransformerDropVolts(
            results,
            transformerComponents
        );

        const transformerDropPercent = getTransformerDropPercent(
            results,
            transformerComponents
        );

        const highestTransformerLoading = getHighestTransformerLoading(
            results,
            transformerComponents
        );

        const voltageAtLoad = vdNumber(
            results?.actualVoltageAtLoad,
            vdNumber(
                results?.loadVoltage,
                vdNumber(
                    results?.systemVoltageProfile?.voltageAtLoad,
                    nominalLoadVoltage - conductorDropVolts
                )
            )
        );

        /**
         * Correct basis:
         * For MDP1, final load bus is 240 V.
         * Therefore system profile deviation should be:
         *
         *      240 V - 233.48 V = 6.52 V
         *
         * not:
         *
         *      451 V - 233.48 V = 217.52 V
         *
         * and not:
         *
         *      13200 V - 233.48 V
         */
        const profileBasisVoltage = nominalLoadVoltage > 0
            ? nominalLoadVoltage
            : conductorBasisVoltage;

        const systemDropVolts = profileBasisVoltage > 0
            ? profileBasisVoltage - voltageAtLoad
            : 0;

        const systemDropPercent = profileBasisVoltage > 0
            ? systemDropVolts / profileBasisVoltage * 100
            : 0;

        return {
            basisVoltage: conductorBasisVoltage,
            nominalLoadVoltage: nominalLoadVoltage,
            tapAdjustedNominal: tapAdjustedNominal,
            profileBasisVoltage: profileBasisVoltage,
            components: components,
            conductorComponents: conductorComponents,
            transformerComponents: transformerComponents,
            conductorDropVolts: conductorDropVolts,
            conductorDropPercent: conductorDropPercent,
            transformerDropVolts: transformerDropVolts,
            transformerDropPercent: transformerDropPercent,
            highestTransformerLoading: highestTransformerLoading,
            systemDropVolts: systemDropVolts,
            systemDropPercent: systemDropPercent,
            voltageAtLoad: voltageAtLoad
        };
    }

    function fixedGenerateVoltageAnalysisSection(sourceVoltage, breakdown) {
        const profileBasisVoltage = vdNumber(
            breakdown.profileBasisVoltage,
            vdNumber(sourceVoltage, 0)
        );

        if (!profileBasisVoltage || profileBasisVoltage === 0) {
            return '';
        }

        const loadPercent = profileBasisVoltage > 0
            ? breakdown.voltageAtLoad / profileBasisVoltage * 100
            : 0;

        return `
            <div class="result-section voltage-profile-section">
                <h5>⚡ System Voltage Profile</h5>

                <div class="voltage-profile-grid">
                    <div class="profile-item">
                        <strong>Nominal Load Voltage:</strong><br>
                        <span class="voltage-value">${profileBasisVoltage.toFixed(2)} V</span><br>
                        <small>(100.00%)</small>
                    </div>

                    <div class="profile-item">
                        <strong>Voltage at Load:</strong><br>
                        <span class="voltage-value ${loadPercent < 95 ? 'warning' : 'success'}">${breakdown.voltageAtLoad.toFixed(2)} V</span><br>
                        <small>(${loadPercent.toFixed(2)}%)</small>
                    </div>

                    <div class="profile-item">
                        <strong>System Profile Deviation:</strong><br>
                        <span class="voltage-value">${breakdown.systemDropVolts.toFixed(2)} V</span><br>
                        <small>(${breakdown.systemDropPercent.toFixed(3)}%) at final bus voltage level</small>
                    </div>
                </div>
            </div>
        `;
    }

    function installPatch() {
        let patched = false;

        try {
            global.getVoltageDropDisplayBreakdown = fixedGetVoltageDropDisplayBreakdown;
            getVoltageDropDisplayBreakdown = fixedGetVoltageDropDisplayBreakdown;
            patched = true;
        } catch (_) {
            global.getVoltageDropDisplayBreakdown = fixedGetVoltageDropDisplayBreakdown;
        }

        try {
            global.generateVoltageAnalysisSection = fixedGenerateVoltageAnalysisSection;
            generateVoltageAnalysisSection = fixedGenerateVoltageAnalysisSection;
            patched = true;
        } catch (_) {
            global.generateVoltageAnalysisSection = fixedGenerateVoltageAnalysisSection;
        }

        return patched;
    }

    function startPatch() {
        installPatch();

        /**
         * Retry shortly because calculationDisplay.js may still be loading,
         * depending on script order or browser cache.
         */
        let attempts = 0;
        const timer = setInterval(function () {
            installPatch();
            attempts += 1;

            if (attempts >= 20) {
                clearInterval(timer);
            }
        }, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startPatch);
    } else {
        startPatch();
    }

    console.log('✅ Voltage Drop Display Summary Patch loaded');
})(typeof window !== 'undefined' ? window : globalThis);