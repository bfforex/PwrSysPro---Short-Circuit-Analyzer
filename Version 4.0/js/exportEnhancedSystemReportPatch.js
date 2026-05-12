/**
 * Enhanced System Report — Non-Redundant / Corrected VD Basis Patch v1.0
 * Created: 2026-05-11
 *
 * Load AFTER exportEnhancedSystemReport.js.
 * This patch post-processes the enhanced system report so voltage-drop language
 * follows the corrected basis:
 * - Conductor VD = compliance basis
 * - Transformer regulation/loading = separate equipment effect
 * - System voltage profile = complete voltage outcome
 */
(function installEnhancedSystemReportNonRedundantPatch(global) {
    'use strict';

    if (global.__enhancedSystemReportNonRedundantPatchInstalled) {
        console.log('Enhanced System Report non-redundant patch already installed.');
        return;
    }
    global.__enhancedSystemReportNonRedundantPatchInstalled = true;

    function safeNum(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function vdBreakdown(bus) {
        const vd = bus?.results?.voltageDrop || {};
        const components = Array.isArray(vd.components) ? vd.components : [];
        const basisVoltage = safeNum(vd?.conductorVoltageDrop?.basisVoltage, safeNum(vd?.tapAdjustment?.tapAdjustedNominal, safeNum(vd?.nominalLoadVoltage, safeNum(bus?.voltage, 0))));
        const conductorComponents = vd?.conductorVoltageDrop?.components || components.filter(c => String(c.type || '').toLowerCase() !== 'transformer');
        const transformerComponents = vd?.transformerRegulation?.transformers || components.filter(c => String(c.type || '').toLowerCase() === 'transformer');
        let conductorDropVolts = safeNum(vd?.conductorVoltageDrop?.totalDropVolts, NaN);
        if (!Number.isFinite(conductorDropVolts)) {
            conductorDropVolts = conductorComponents.reduce((sum, c) => {
                const componentVoltage = safeNum(c.voltageLevel || c.nominalVoltage, basisVoltage);
                const drop = safeNum(c.dropVolts, 0);
                return sum + ((componentVoltage > 0 && basisVoltage > 0) ? drop * (basisVoltage / componentVoltage) : drop);
            }, 0);
        }
        const conductorDropPercent = safeNum(vd?.conductorVoltageDrop?.totalDropPercent, basisVoltage > 0 ? conductorDropVolts / basisVoltage * 100 : 0);
        const transformerDropVolts = safeNum(vd?.transformerRegulation?.totalDropVolts, transformerComponents.reduce((sum, c) => sum + safeNum(c.dropVolts, 0), 0));
        const transformerDropPercent = safeNum(vd?.transformerRegulation?.totalDropPercent, transformerComponents.reduce((sum, c) => sum + safeNum(c.dropPercent, 0), 0));
        const systemDropVolts = safeNum(vd?.systemVoltageProfile?.totalDropVolts, safeNum(vd?.totalDropVolts, safeNum(vd?.cumulativeDropVolts, 0)));
        const systemDropPercent = safeNum(vd?.systemVoltageProfile?.totalDropPercent, safeNum(vd?.totalDropPercent, safeNum(vd?.cumulativeDropPercent, 0)));
        const voltageAtLoad = safeNum(vd?.systemVoltageProfile?.voltageAtLoad, safeNum(vd?.loadVoltage, safeNum(bus?.voltage, 0) - systemDropVolts));
        return { conductorDropVolts, conductorDropPercent, transformerDropVolts, transformerDropPercent, systemDropVolts, systemDropPercent, voltageAtLoad };
    }

    function getRows(buses) {
        return (Array.isArray(buses) ? buses : []).filter(b => b?.results?.voltageDrop).map(bus => ({ bus, name: bus.name || bus.tag || bus.id, voltage: safeNum(bus.voltage, 0), breakdown: vdBreakdown(bus) }));
    }

    function line(char = '=', count = 100) {
        return char.repeat(count) + '\n';
    }

    function buildCorrectedVDComplianceSection(buses) {
        const rows = getRows(buses);
        if (rows.length === 0) return '';
        const worstConductor = rows.reduce((m, r) => !m || r.breakdown.conductorDropPercent > m.breakdown.conductorDropPercent ? r : m, null);
        const worstTransformer = rows.reduce((m, r) => !m || r.breakdown.transformerDropPercent > m.breakdown.transformerDropPercent ? r : m, null);
        const worstSystem = rows.reduce((m, r) => !m || r.breakdown.systemDropPercent > m.breakdown.systemDropPercent ? r : m, null);
        const lowestVoltage = rows.reduce((m, r) => !m || r.breakdown.voltageAtLoad < m.breakdown.voltageAtLoad ? r : m, null);
        const conductorViolations = rows.filter(r => r.breakdown.conductorDropPercent > 5);
        let report = '';
        report += line('=');
        report += 'VOLTAGE DROP COMPLIANCE ANALYSIS - CORRECTED REPORTING BASIS\n';
        report += line('=');
        report += 'REPORTING BASIS:\n';
        report += line('-');
        report += 'Conductor Voltage Drop:\n';
        report += '  Used for NEC/PEC/IEEE voltage-drop guidance and conductor compliance checks.\n\n';
        report += 'Transformer Regulation / Loading:\n';
        report += '  Shown separately as equipment voltage-regulation/loading effect.\n';
        report += '  Excluded from conductor voltage-drop compliance.\n\n';
        report += 'System Voltage Profile:\n';
        report += '  Complete voltage result including conductor VD and transformer regulation.\n';
        report += '  Used to review actual voltage available at each load bus.\n\n';
        report += 'SYSTEM RESULTS:\n';
        report += line('-');
        report += `Worst Conductor VD: ${worstConductor.breakdown.conductorDropPercent.toFixed(3)}% at ${worstConductor.name}\n`;
        report += `Worst Transformer Regulation: ${worstTransformer.breakdown.transformerDropPercent.toFixed(3)}% at ${worstTransformer.name}\n`;
        report += `Worst System Voltage Profile: ${worstSystem.breakdown.systemDropPercent.toFixed(3)}% at ${worstSystem.name}\n`;
        report += `Lowest Voltage at Load: ${worstVoltageFormat(lowestVoltage)} at ${lowestVoltage.name}\n\n`;
        report += 'COMPLIANCE INTERPRETATION:\n';
        report += line('-');
        if (conductorViolations.length === 0) {
            report += '✅ CONDUCTOR VD COMPLIANCE: COMPLIANT\n';
            report += 'No bus exceeds the conductor voltage-drop review threshold.\n';
            report += 'Voltage-profile review items, if any, are primarily related to transformer regulation/loading and actual load-bus voltage.\n';
        } else {
            report += `⚠️ CONDUCTOR VD REVIEW REQUIRED: ${conductorViolations.length} bus(es) exceed conductor voltage-drop threshold.\n`;
            conductorViolations.slice(0, 10).forEach(r => {
                report += `  - ${r.name}: ${r.breakdown.conductorDropPercent.toFixed(3)}% conductor VD\n`;
            });
        }
        report += '\nTOP SYSTEM VOLTAGE PROFILE REVIEW ITEMS:\n';
        report += line('-');
        rows.slice().sort((a, b) => b.breakdown.systemDropPercent - a.breakdown.systemDropPercent).slice(0, 10).forEach(r => {
            report += `${r.name.padEnd(24)} Conductor: ${r.breakdown.conductorDropPercent.toFixed(3).padStart(7)}%  Transformer: ${r.breakdown.transformerDropPercent.toFixed(3).padStart(7)}%  Profile: ${r.breakdown.systemDropPercent.toFixed(3).padStart(7)}%  Vload: ${r.breakdown.voltageAtLoad.toFixed(2)} V\n`;
        });
        report += '\n';
        return report;
    }

    function worstVoltageFormat(row) {
        return row ? `${row.breakdown.voltageAtLoad.toFixed(2)} V` : 'N/A';
    }

    function buildCorrectedVDSystemSummary(buses) {
        const rows = getRows(buses);
        if (rows.length === 0) return '';
        const avgConductor = rows.reduce((s, r) => s + r.breakdown.conductorDropPercent, 0) / rows.length;
        const avgTransformer = rows.reduce((s, r) => s + r.breakdown.transformerDropPercent, 0) / rows.length;
        const avgSystem = rows.reduce((s, r) => s + r.breakdown.systemDropPercent, 0) / rows.length;
        let report = '';
        report += line('=');
        report += 'VOLTAGE DROP ANALYSIS - SYSTEM SUMMARY\n';
        report += line('=');
        report += 'METHODOLOGY UPDATE:\n';
        report += line('-');
        report += '• Conductor VD is used for compliance checking.\n';
        report += '• Transformer regulation/loading is shown separately.\n';
        report += '• System voltage profile shows the complete actual voltage outcome.\n\n';
        report += 'AVERAGE SYSTEM VALUES:\n';
        report += line('-');
        report += `Average Conductor VD: ${avgConductor.toFixed(3)}%\n`;
        report += `Average Transformer Regulation: ${avgTransformer.toFixed(3)}%\n`;
        report += `Average System Voltage Profile: ${avgSystem.toFixed(3)}%\n\n`;
        report += 'BUS VOLTAGE PROFILE SUMMARY:\n';
        report += line('-');
        report += 'Bus'.padEnd(24) + 'Voltage'.padEnd(12) + 'Cond VD'.padEnd(12) + 'Xfmr Reg'.padEnd(12) + 'Profile'.padEnd(12) + 'Vload\n';
        report += line('-');
        rows.forEach(r => {
            report += String(r.name).substring(0, 23).padEnd(24);
            report += String(`${r.voltage.toFixed(0)} V`).padEnd(12);
            report += String(`${r.breakdown.conductorDropPercent.toFixed(3)}%`).padEnd(12);
            report += String(`${r.breakdown.transformerDropPercent.toFixed(3)}%`).padEnd(12);
            report += String(`${r.breakdown.systemDropPercent.toFixed(3)}%`).padEnd(12);
            report += `${r.breakdown.voltageAtLoad.toFixed(2)} V\n`;
        });
        report += '\n';
        return report;
    }

    function buildCorrectedBusSummaryTable(buses) {
        let report = '';
        report += line('=');
        report += 'SUMMARY OF ALL BUSES\n';
        report += line('=');
        report += 'Bus Name'.padEnd(22) + 'Voltage'.padEnd(10) + 'Fault(kA)'.padEnd(11) + 'X/R'.padEnd(8) + 'CondVD'.padEnd(10) + 'XfmrReg'.padEnd(10) + 'Profile'.padEnd(10) + 'Vload'.padEnd(12) + 'Status\n';
        report += '-'.repeat(120) + '\n';
        (Array.isArray(buses) ? buses : []).forEach(bus => {
            const sc = bus.results?.shortCircuit || {};
            const fc = sc.faultCurrents || {};
            const imp = sc.impedance || {};
            const b = vdBreakdown(bus);
            const status = b.conductorDropPercent <= 5 ? 'VD OK' : 'VD REVIEW';
            report += String(bus.name || bus.tag || bus.id).substring(0, 21).padEnd(22);
            report += String(`${safeNum(bus.voltage, 0).toFixed(0)} V`).padEnd(10);
            report += String(safeNum(fc.threePhaseSym, safeNum(sc.faultCurrentKA, 0)).toFixed(2)).padEnd(11);
            report += String(safeNum(imp.xrRatio, safeNum(sc.xrRatio, 0)).toFixed(2)).padEnd(8);
            report += String(`${b.conductorDropPercent.toFixed(3)}%`).padEnd(10);
            report += String(`${b.transformerDropPercent.toFixed(3)}%`).padEnd(10);
            report += String(`${b.systemDropPercent.toFixed(3)}%`).padEnd(10);
            report += String(`${b.voltageAtLoad.toFixed(2)} V`).padEnd(12);
            report += `${status}\n`;
        });
        report += '\nCOLUMN DEFINITIONS:\n';
        report += line('-');
        report += 'CondVD: Conductor voltage drop only; compliance basis.\n';
        report += 'XfmrReg: Transformer regulation/loading; excluded from conductor compliance.\n';
        report += 'Profile: Complete system voltage profile including conductor VD and transformer regulation.\n';
        report += 'Vload: Actual voltage available at the bus/load.\n\n';
        return report;
    }

    function replaceSection(report, startTitle, nextTitle, replacement) {
        const start = report.indexOf(startTitle);
        if (start < 0) return report;
        const next = report.indexOf(nextTitle, start + startTitle.length);
        if (next < 0) return report.slice(0, start) + replacement;
        return report.slice(0, start) + replacement + report.slice(next);
    }

    function postProcessReport(report, buses) {
        let out = String(report || '');
        out = replaceSection(out, 'VOLTAGE DROP COMPLIANCE ANALYSIS', 'VOLTAGE DROP ANALYSIS - SYSTEM SUMMARY', buildCorrectedVDComplianceSection(buses));
        out = replaceSection(out, 'VOLTAGE DROP ANALYSIS - SYSTEM SUMMARY', 'SHORT CIRCUIT ANALYSIS - SYSTEM SUMMARY', buildCorrectedVDSystemSummary(buses));
        out = replaceSection(out, 'SUMMARY OF ALL BUSES', 'CABLE TAG DIRECTORY', buildCorrectedBusSummaryTable(buses));
        out = out.replace(/Critical Voltage Drop Violation/g, 'Voltage Profile Review');
        out = out.replace(/Voltage drop exceeds recomended maximum \(5%\)/g, 'System voltage profile exceeds 5% review threshold; conductor VD is reported separately');
        out = out.replace(/IMMEDIATE: Resize conductors or install voltage regulation equipment\. System may not operate properly\./g, 'Review transformer regulation/tap settings and verify actual load-bus voltage. Upsize conductors only where conductor VD exceeds limits.');
        out = out.replace(/Voltage Drop Limits: IEEE 141 recommended \(2\.5% feeder, 5% branch, 7% combined max\)/g, 'Voltage Drop Basis: conductor VD is checked separately from transformer regulation; system voltage profile is reported for actual load-bus voltage.');
        return out;
    }

    const originalGenerate = global.generateEnhancedSystemReport;
    if (typeof originalGenerate === 'function') {
        const patchedGenerate = function patchedGenerateEnhancedSystemReport(buses, options = {}) {
            const report = originalGenerate.call(this, buses, options);
            return report ? postProcessReport(report, buses) : report;
        };
        global.generateEnhancedSystemReport = patchedGenerate;
        try { generateEnhancedSystemReport = patchedGenerate; } catch (_) {}
    }

    const originalExport = global.exportEnhancedSystemReport;
    if (typeof originalExport === 'function') {
        global.exportEnhancedSystemReport = function patchedExportEnhancedSystemReport() {
            console.log('📊 Generating enhanced system report with corrected voltage-drop basis...');
            const scenarioId = (typeof global.currentScenarioId !== 'undefined') ? global.currentScenarioId : 'base';
            const mode = (typeof global.currentMode !== 'undefined') ? global.currentMode : 'design';
            const report = global.generateEnhancedSystemReport(global.buses, { scenarioId, mode });
            if (!report) return;
            const projectName = document.getElementById('projectName')?.value || 'Untitled';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${projectName.replace(/\s+/g, '_')}_EnhancedSystemReport_NonRedundant_${scenarioId}_${mode}_${timestamp}.txt`;
            if (typeof global.downloadTextFile === 'function') {
                global.downloadTextFile(report, fileName);
            } else {
                const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
            return report;
        };
        try { exportEnhancedSystemReport = global.exportEnhancedSystemReport; } catch (_) {}
    }

    console.log('✅ Enhanced System Report Non-Redundant / Corrected VD Basis Patch v1.0 loaded');
})(typeof window !== 'undefined' ? window : globalThis);
