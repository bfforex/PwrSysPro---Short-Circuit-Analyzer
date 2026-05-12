/**
 * All-Bus Voltage Drop A4 HTML Report - Cable Register Edition
 *
 * Update: From/To columns now resolve internal bus IDs to the user-entered bus names.
 * Voltage drop remains based on load-flow diversified load current.
 */
(function installAllBusVoltageDropReportHTML(global) {
    'use strict';

    const SQRT3 = Math.sqrt(3);

    function n(value, fallback = 0) {
        const x = Number(value);
        return Number.isFinite(x) ? x : fallback;
    }

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function fmt(value, decimals = 3) {
        return Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : '—';
    }

    function inputValue(id, fallback = '') {
        const el = document.getElementById(id);
        return el && el.value !== '' ? el.value : fallback;
    }

    function projectInfo() {
        return {
            projectName: inputValue('projectName', 'Untitled Project'),
            projectNumber: inputValue('projectNumber', 'N/A'),
            engineer: inputValue('engineer', 'N/A'),
            powerFactor: n(inputValue('powerFactor', '0.90'), 0.90),
            temperature: inputValue('temperature', '75'),
            voltageDropLimit: n(inputValue('voltageDropLimit', '3'), 3),
            date: new Date().toISOString().slice(0, 10)
        };
    }

    function allBuses() {
        return Array.isArray(global.buses) ? global.buses : [];
    }

    function allComponents() {
        if (Array.isArray(global.components)) return global.components;
        if (Array.isArray(global.electricalComponents)) return global.electricalComponents;
        return [];
    }

    function busLabel(bus) {
        return bus?.name || bus?.tag || bus?.busName || bus?.label || bus?.id || 'N/A';
    }

    function componentLabel(component) {
        return component?.tag || component?.name || component?.id || 'Component';
    }

    function typeOf(component) {
        return String(component?.type || '').toLowerCase();
    }

    function isCable(component) {
        return typeOf(component) === 'cable';
    }

    function isTransformer(component) {
        return typeOf(component) === 'transformer';
    }

    function rawFromBus(component) {
        return component?.fromBus || component?.from || component?.fromBusId || component?.sourceBus || component?.primaryBus || '';
    }

    function rawToBus(component) {
        return component?.toBus || component?.to || component?.toBusId || component?.loadBus || component?.secondaryBus || '';
    }

    function findBusByRef(ref) {
        if (!ref) return null;
        return allBuses().find(bus =>
            String(bus.id) === String(ref) ||
            String(bus.name) === String(ref) ||
            String(bus.tag) === String(ref) ||
            String(bus.busName) === String(ref) ||
            String(bus.label) === String(ref)
        ) || null;
    }

    function busDisplayName(ref) {
        const bus = findBusByRef(ref);
        return bus ? busLabel(bus) : String(ref || '');
    }

    function displayFromBus(component) {
        return component?.fromBusName || component?.fromName || component?.sourceBusName || component?.primaryBusName || busDisplayName(rawFromBus(component));
    }

    function displayToBus(component) {
        return component?.toBusName || component?.toName || component?.loadBusName || component?.secondaryBusName || busDisplayName(rawToBus(component));
    }

    function voltageLabel(value) {
        const v = n(value, 0);
        if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 2) + ' kV';
        return v.toFixed(0) + ' V';
    }

    function sameBus(a, b) {
        if (!a || !b) return false;
        if (String(a) === String(b)) return true;
        const busA = findBusByRef(a);
        const busB = findBusByRef(b);
        return !!(busA && busB && busA.id === busB.id);
    }

    function buildPathToSource(targetBusId) {
        const path = [];
        const visited = new Set();

        function walk(busId) {
            if (!busId || visited.has(String(busId))) return false;
            visited.add(String(busId));

            const bus = findBusByRef(busId);
            if (!bus) return false;

            path.unshift({ bus, component: null });

            if (String(bus.type || '').toLowerCase() === 'source') return true;

            const upstream = allComponents().find(component =>
                sameBus(rawToBus(component), bus.id) ||
                sameBus(rawToBus(component), bus.name) ||
                sameBus(rawToBus(component), bus.tag)
            );

            if (!upstream) return false;
            path[0].component = upstream;

            const upstreamBus = findBusByRef(rawFromBus(upstream));
            return upstreamBus ? walk(upstreamBus.id) : false;
        }

        return walk(targetBusId) ? path : [];
    }

    function nestedNumber(object, keys, fallback = 0) {
        for (const key of keys) {
            const direct = object?.[key];
            if (direct !== undefined && Number.isFinite(Number(direct))) return Number(direct);

            if (key.includes('.')) {
                let current = object;
                for (const part of key.split('.')) current = current?.[part];
                if (current !== undefined && Number.isFinite(Number(current))) return Number(current);
            }
        }
        return fallback;
    }

    function matchingResultComponent(component, result) {
        const resultComponents = Array.isArray(result?.components) ? result.components : [];
        const formulaDetails = Array.isArray(result?.voltageDropFormulaDetails) ? result.voltageDropFormulaDetails : [];
        const label = componentLabel(component);

        return resultComponents.find(item =>
            item === component ||
            item?.tag === component?.tag ||
            item?.name === component?.name ||
            item?.id === component?.id ||
            item?.tag === label ||
            item?.name === label
        ) || formulaDetails.find(item =>
            item?.component === label ||
            item?.tag === component?.tag ||
            item?.name === component?.name
        ) || {};
    }

    function defaultPF() {
        return Math.min(1, Math.max(0, projectInfo().powerFactor));
    }

    function manufacturerImpedance(component) {
        if (!isCable(component)) return null;
        if (typeof global.calculateManufacturerCableImpedance !== 'function') return null;

        try {
            const hasKey = component.manufacturerCableDataKey || component.cableDataKey;
            const voltage = n(component.voltage || component.voltageLevel, 0);
            if (!hasKey && voltage < 1000) return null;
            return global.calculateManufacturerCableImpedance(component, {
                temperatureC: n(projectInfo().temperature, 75)
            });
        } catch (_) {
            return null;
        }
    }

    function impedanceValues(component, resultComponent) {
        const manufacturer = manufacturerImpedance(component);
        if (manufacturer && Number.isFinite(Number(manufacturer.rOhms)) && Number.isFinite(Number(manufacturer.xOhms))) {
            return {
                r: Number(manufacturer.rOhms),
                x: Number(manufacturer.xOhms),
                source: 'manufacturerCableData.js'
            };
        }

        const r = n(resultComponent?.rOhms ?? resultComponent?.resistanceOhms ?? resultComponent?.resistance ?? component?.rOhms ?? component?.resistanceOhms ?? component?.resistance, NaN);
        const x = n(resultComponent?.xOhms ?? resultComponent?.reactanceOhms ?? resultComponent?.reactance ?? component?.xOhms ?? component?.reactanceOhms ?? component?.reactance, NaN);

        return {
            r: Number.isFinite(r) ? r : 0,
            x: Number.isFinite(x) ? x : 0,
            source: resultComponent?.impedanceSource || component?.impedanceSource || resultComponent?.source || 'component/result'
        };
    }

    function cableVoltage(component, resultComponent, result, segment) {
        return n(
            resultComponent?.voltageLevel ??
            resultComponent?.nominalVoltage ??
            component?.voltage ??
            component?.voltageLevel ??
            segment?.bus?.voltage ??
            result?.busVoltage ??
            result?.loadVoltage,
            0
        );
    }

    function currentA(component, resultComponent, result) {
        return n(
            resultComponent?.current ??
            resultComponent?.currentA ??
            component?.current ??
            component?.loadCurrent ??
            component?.designCurrent ??
            result?.loadCurrent,
            0
        );
    }

    function makeCableRow(component, segment, result, targetBus) {
        const resultComponent = matchingResultComponent(component, result);
        const pf = Math.min(1, Math.max(0, n(resultComponent?.powerFactor ?? component?.powerFactor ?? component?.pf, defaultPF())));
        const sinTheta = Math.sqrt(Math.max(0, 1 - pf * pf));
        const impedance = impedanceValues(component, resultComponent);
        const current = currentA(component, resultComponent, result);
        const calculatedVD = SQRT3 * current * ((impedance.r * pf) + (impedance.x * sinTheta));
        const usedVD = n(resultComponent?.usedDropVolts ?? resultComponent?.dropVolts ?? resultComponent?.voltageDropVolts, calculatedVD);
        const voltageLevel = cableVoltage(component, resultComponent, result, segment);
        const vdPercent = n(resultComponent?.dropPercent ?? resultComponent?.voltageDropPercent, voltageLevel > 0 ? usedVD / voltageLevel * 100 : 0);

        return {
            key: [componentLabel(component), rawFromBus(component), rawToBus(component)].join('|'),
            tag: componentLabel(component),
            from: displayFromBus(component),
            to: displayToBus(component),
            voltageLevel,
            voltageGroup: voltageLabel(voltageLevel),
            size: component?.size ?? resultComponent?.size ?? '',
            material: component?.material ?? component?.conductorMaterial ?? '',
            length: component?.length ?? resultComponent?.length ?? '',
            parallel: component?.parallel ?? component?.runs ?? component?.noOfRuns ?? '',
            current,
            currentBasis: resultComponent?.currentSource || result?.currentBasis || 'load-flow diversified load',
            pf,
            sinTheta,
            r: impedance.r,
            x: impedance.x,
            calculatedVD,
            usedVD,
            vdPercent,
            source: impedance.source,
            usedBy: [busLabel(targetBus)]
        };
    }

    function makeTransformerRow(component, result, targetBus) {
        const resultComponent = matchingResultComponent(component, result);

        return {
            key: [componentLabel(component), rawFromBus(component), rawToBus(component)].join('|'),
            tag: componentLabel(component),
            from: displayFromBus(component),
            to: displayToBus(component),
            primaryVoltage: n(component?.primaryVoltage ?? component?.primaryVoltageV ?? component?.fromVoltage ?? resultComponent?.primaryVoltage, 0),
            secondaryVoltage: n(component?.secondaryVoltage ?? component?.secondaryVoltageV ?? component?.toVoltage ?? resultComponent?.secondaryVoltage, 0),
            tap: n(component?.tapPercent ?? component?.tapSettingPercent ?? component?.tapSetting ?? component?.tap ?? resultComponent?.tapPercent, 0),
            loading: n(resultComponent?.loading ?? component?.loading, 0),
            dropVolts: n(resultComponent?.dropVolts ?? resultComponent?.voltageDropVolts, 0),
            dropPercent: n(resultComponent?.dropPercent ?? resultComponent?.voltageDropPercent, 0),
            usedBy: [busLabel(targetBus)]
        };
    }

    function normalizeBusResult(bus, result) {
        const conductorDropVolts = nestedNumber(result, ['conductorVoltageDrop.totalDropVolts', 'totalDropVolts', 'cumulativeDropVolts', 'voltageDrop', 'dropVolts'], 0);
        const conductorDropPercent = nestedNumber(result, ['conductorVoltageDrop.totalDropPercent', 'totalDropPercent', 'cumulativeDropPercent', 'dropPercent', 'voltageDropPercent'], 0);
        const loadVoltage = nestedNumber(result, ['actualVoltageAtLoad', 'loadVoltage', 'finalVoltage', 'voltageAtLoad'], n(bus?.voltage, 0) - conductorDropVolts);
        const transformerReg = nestedNumber(result, ['transformerRegulation.totalDropPercent'], 0);
        const nominalLoadVoltage = nestedNumber(result, ['nominalLoadVoltage', 'nominalVoltage', 'busVoltage', 'targetBusVoltage'], n(bus?.voltage, 0));
        const systemProfile = nominalLoadVoltage > 0 ? ((nominalLoadVoltage - loadVoltage) / nominalLoadVoltage) * 100 : 0;
        const limit = projectInfo().voltageDropLimit;

        return {
            busName: busLabel(bus),
            voltage: n(bus?.voltage, 0),
            loadVoltage,
            conductorDropVolts,
            conductorDropPercent,
            transformerReg,
            systemProfile,
            result: conductorDropPercent <= limit ? 'PASS' : 'FAIL'
        };
    }

    function addUsedBy(row, bus) {
        const name = busLabel(bus);
        if (!row.usedBy.includes(name)) row.usedBy.push(name);
    }

    function collectReportData() {
        if (typeof global.calculateVoltageDrop !== 'function') {
            throw new Error('calculateVoltageDrop() not found. Load voltageDropCalc.js before exportAllBusVoltageDropReportHTML.js.');
        }

        const busRows = [];
        const cableMap = new Map();
        const transformerMap = new Map();
        const busCablePaths = [];

        allBuses().filter(bus => String(bus.type || '').toLowerCase() !== 'source').forEach(bus => {
            const path = buildPathToSource(bus.id);
            let result;

            try {
                result = global.calculateVoltageDrop(bus.id, path, bus.results?.loadFlow || null);
            } catch (error) {
                busRows.push({
                    busName: busLabel(bus),
                    voltage: n(bus.voltage, 0),
                    loadVoltage: 0,
                    conductorDropVolts: 0,
                    conductorDropPercent: 0,
                    transformerReg: 0,
                    systemProfile: 0,
                    result: 'ERROR',
                    error: error.message || String(error)
                });
                return;
            }

            busRows.push(normalizeBusResult(bus, result));

            const cableTags = [];

            path.forEach(segment => {
                const component = segment.component;
                if (!component) return;

                if (isCable(component)) {
                    const row = makeCableRow(component, segment, result, bus);
                    cableTags.push(row.tag);

                    if (!cableMap.has(row.key)) {
                        cableMap.set(row.key, row);
                    } else {
                        const existing = cableMap.get(row.key);
                        if (row.vdPercent > existing.vdPercent || row.current > existing.current) {
                            row.usedBy = existing.usedBy;
                            cableMap.set(row.key, row);
                        }
                        addUsedBy(cableMap.get(row.key), bus);
                    }
                }

                if (isTransformer(component)) {
                    const row = makeTransformerRow(component, result, bus);

                    if (!transformerMap.has(row.key)) {
                        transformerMap.set(row.key, row);
                    } else {
                        const existing = transformerMap.get(row.key);
                        if (row.dropPercent > existing.dropPercent || row.loading > existing.loading) {
                            row.usedBy = existing.usedBy;
                            transformerMap.set(row.key, row);
                        }
                        addUsedBy(transformerMap.get(row.key), bus);
                    }
                }
            });

            busCablePaths.push({
                bus: busLabel(bus),
                voltage: n(bus.voltage, 0),
                cablePath: cableTags.join(' → ')
            });
        });

        const cableRows = Array.from(cableMap.values());
        const transformerRows = Array.from(transformerMap.values());
        const cableGroups = new Map();

        cableRows.forEach(row => {
            if (!cableGroups.has(row.voltageGroup)) cableGroups.set(row.voltageGroup, []);
            cableGroups.get(row.voltageGroup).push(row);
        });

        const sortedCableGroups = Array.from(cableGroups.entries()).sort((a, b) => n(b[1][0]?.voltageLevel, 0) - n(a[1][0]?.voltageLevel, 0));

        return { busRows, cableRows, sortedCableGroups, transformerRows, busCablePaths };
    }

    function css() {
        return `
@page { size: A4 portrait; margin: 12mm; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; font-size:8pt; color:#111; background:#d0d0d0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { padding:12mm; }
.toolbar { position:fixed; top:12mm; right:12mm; z-index:99999; display:flex; gap:8px; padding:8px 10px; background:#fff; border-radius:8px; box-shadow:0 6px 24px rgba(0,0,0,.22); }
.toolbar button { padding:8px 18px; border:1px solid #111; border-radius:6px; background:#111; color:#fff; font-size:10pt; font-weight:700; cursor:pointer; }
.toolbar button.secondary { background:#fff; color:#111; }
.a4 { width:210mm; min-height:297mm; margin:0 auto 8mm; padding:12mm; background:#fff; box-shadow:0 4px 18px rgba(0,0,0,.25); overflow:hidden; }
.hdr { border-top:3px solid #111; border-bottom:2px solid #111; padding:7pt 0 6pt; margin-bottom:8pt; }
.title { font-size:12pt; font-weight:700; letter-spacing:.2px; }
.meta { display:grid; grid-template-columns:1fr 1fr 1fr; gap:2pt 12pt; font-size:7.5pt; }
.sec { font-size:9pt; font-weight:700; text-transform:uppercase; border-bottom:1.5px solid #111; margin:10pt 0 5pt; padding-bottom:2pt; }
table { width:100%; border-collapse:collapse; font-size:6.9pt; margin-bottom:6pt; table-layout:fixed; }
th { background:#111; color:#fff; padding:3pt 4pt; text-align:left; font-weight:700; }
td { padding:2.4pt 3pt; border-bottom:.5px solid #c8c8c8; vertical-align:top; word-break:break-word; overflow-wrap:anywhere; }
tr:nth-child(even) { background:#f5f5f5; }
.num { text-align:right; white-space:nowrap; }
.pass { color:#0b5a18; font-weight:700; }
.fail, .error { color:#8b0000; font-weight:700; }
.box { border:1px solid #c8c8c8; padding:5pt 6pt; margin:4pt 0 7pt; font-family:"Courier New", monospace; font-size:6.7pt; white-space:pre-wrap; overflow-wrap:anywhere; }
.cable-table { font-size:6.15pt; }
.cable-table th, .cable-table td { padding:2pt 2.2pt; }
.break { break-before:page; page-break-before:always; }
@media screen { .a4:first-of-type { margin-top:22mm; } }
@media print { html, body { background:#fff; padding:0; margin:0; } .toolbar, .no-print { display:none!important; } .a4 { width:auto; min-height:auto; margin:0; padding:0; box-shadow:none; overflow:visible; page-break-after:always; break-after:page; } .a4:last-child { page-break-after:auto; break-after:auto; } tr { page-break-inside:avoid; break-inside:avoid; } thead { display:table-header-group; } }
`;
    }

    function busSummaryTable(rows) {
        let html = '<table><thead><tr><th>Bus</th><th>Voltage</th><th class="num">Load V</th><th class="num">Cond. VD V</th><th class="num">Cond. VD %</th><th class="num">Transformer Reg %</th><th class="num">System Profile %</th><th>Status</th></tr></thead><tbody>';
        rows.forEach(row => {
            html += `<tr><td>${esc(row.busName)}</td><td>${voltageLabel(row.voltage)}</td><td class="num">${fmt(row.loadVoltage, 2)}</td><td class="num">${fmt(row.conductorDropVolts, 3)}</td><td class="num">${fmt(row.conductorDropPercent, 3)}</td><td class="num">${fmt(row.transformerReg, 3)}</td><td class="num">${fmt(row.systemProfile, 3)}</td><td class="${String(row.result).toLowerCase()}">${esc(row.result)}</td></tr>`;
        });
        return html + '</tbody></table>';
    }

    function cableTable(rows) {
        let html = '<table class="cable-table"><thead><tr><th>#</th><th>Cable Tag</th><th>From</th><th>To</th><th>Size</th><th>Len</th><th class="num">I (A)</th><th class="num">R Ω</th><th class="num">X Ω</th><th class="num">PF</th><th class="num">VD V</th><th class="num">VD %</th><th>Source</th><th>Used By</th></tr></thead><tbody>';
        rows.forEach((row, index) => {
            html += `<tr><td>${index + 1}</td><td>${esc(row.tag)}</td><td>${esc(row.from)}</td><td>${esc(row.to)}</td><td>${esc(row.size)}</td><td>${esc(row.length)}</td><td class="num">${fmt(row.current, 2)}</td><td class="num">${fmt(row.r, 6)}</td><td class="num">${fmt(row.x, 6)}</td><td class="num">${fmt(row.pf, 3)}</td><td class="num">${fmt(row.usedVD, 3)}</td><td class="num">${fmt(row.vdPercent, 3)}</td><td>${esc(row.source)}</td><td>${esc(row.usedBy.join(', '))}</td></tr>`;
        });
        return html + '</tbody></table>';
    }

    function transformerTable(rows) {
        if (!rows.length) return '<div class="box">No transformer regulation data available.</div>';
        let html = '<table><thead><tr><th>Transformer</th><th>From</th><th>To</th><th class="num">Primary V</th><th class="num">Secondary V</th><th class="num">Tap %</th><th class="num">Loading %</th><th class="num">VD V</th><th class="num">VD %</th><th>Used By</th></tr></thead><tbody>';
        rows.forEach(row => {
            html += `<tr><td>${esc(row.tag)}</td><td>${esc(row.from)}</td><td>${esc(row.to)}</td><td class="num">${fmt(row.primaryVoltage, 0)}</td><td class="num">${fmt(row.secondaryVoltage, 0)}</td><td class="num">${fmt(row.tap, 2)}</td><td class="num">${fmt(row.loading, 1)}</td><td class="num">${fmt(row.dropVolts, 3)}</td><td class="num">${fmt(row.dropPercent, 3)}</td><td>${esc(row.usedBy.join(', '))}</td></tr>`;
        });
        return html + '</tbody></table>';
    }

    function pathMappingTable(rows) {
        let html = '<table><thead><tr><th>Bus</th><th>Voltage</th><th>Cable Path Used</th></tr></thead><tbody>';
        rows.forEach(row => {
            html += `<tr><td>${esc(row.bus)}</td><td>${voltageLabel(row.voltage)}</td><td>${esc(row.cablePath)}</td></tr>`;
        });
        return html + '</tbody></table>';
    }

    function buildAllBusVoltageDropReportHTML() {
        const project = projectInfo();
        const data = collectReportData();
        const worst = data.busRows.reduce((max, row) => row.conductorDropPercent > max.conductorDropPercent ? row : max, data.busRows[0] || { conductorDropPercent: 0, busName: 'N/A' });

        let html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(project.projectNumber)} Voltage Drop Calculation</title><style>${css()}</style></head><body><div class="toolbar no-print" id="reportToolbar"><button type="button" onclick="window.print()">Print / Save PDF</button><button type="button" class="secondary" onclick="document.getElementById('reportToolbar').style.display='none'">Hide</button></div>`;

        html += `<div class="a4"><div class="hdr"><div class="title">VOLTAGE DROP CALCULATION REPORT</div><div class="meta"><div><b>Project:</b> ${esc(project.projectName)}</div><div><b>Document No.:</b> ${esc(project.projectNumber)}</div><div><b>Date:</b> ${esc(project.date)}</div><div><b>Prepared By:</b> ${esc(project.engineer)}</div><div><b>Temperature:</b> ${esc(project.temperature)} °C</div><div><b>VD Limit:</b> ${esc(project.voltageDropLimit)}%</div><div><b>Buses Analyzed:</b> ${data.busRows.length}</div><div><b>Cables Registered:</b> ${data.cableRows.length}</div><div><b>Worst Conductor VD:</b> ${fmt(worst.conductorDropPercent)}% at ${esc(worst.busName)}</div></div></div>`;
        html += '<div class="sec">Calculation Basis</div><table><tr><th>Item</th><th>Basis</th></tr><tr><td>Load Basis</td><td>Voltage drop remains based on the load-flow diversified load current.</td></tr><tr><td>Cable VD Formula</td><td>VD = √3 × I × (R cosθ + X sinθ). Cable/conductor entries are calculated at their own voltage level.</td></tr><tr><td>Bus Naming</td><td>From and To columns resolve internal bus IDs to user-entered bus names from the bus register.</td></tr><tr><td>Compliance</td><td>Conductor voltage-drop compliance is evaluated using cable/conductor voltage drop only. Transformer regulation and tap adjustment are shown separately.</td></tr></table>';
        html += '<div class="sec">Bus Voltage Drop Summary</div>' + busSummaryTable(data.busRows) + '</div>';

        html += '<div class="a4 break"><div class="sec">Cable Calculation Register</div><div class="box">Each cable appears once. Current shown is the governing load-flow diversified current found while tracing all bus paths. Cable entries are grouped by voltage level and ordered from source side toward downstream loads.</div>';
        data.sortedCableGroups.forEach(([label, rows]) => {
            html += `<div class="sec">${esc(label)} Cable Calculations</div>` + cableTable(rows);
        });
        html += '</div>';

        html += '<div class="a4 break"><div class="sec">Transformer Regulation / Tap Register</div>' + transformerTable(data.transformerRows) + '</div>';
        html += '<div class="a4 break"><div class="sec">Bus-to-Cable Path Mapping Appendix</div>' + pathMappingTable(data.busCablePaths) + '</div>';

        return html + '</body></html>';
    }

    function openVoltageDropA4HTMLReport() {
        try {
            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('Pop-up blocked. Use Download A4 HTML.');
                return null;
            }
            reportWindow.document.open();
            reportWindow.document.write(buildAllBusVoltageDropReportHTML());
            reportWindow.document.close();
            return reportWindow;
        } catch (error) {
            console.error(error);
            alert(error.message || error);
            return null;
        }
    }

    function downloadVoltageDropA4HTMLReport() {
        try {
            const blob = new Blob([buildAllBusVoltageDropReportHTML()], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = (projectInfo().projectName || 'Project').replace(/[^a-z0-9\-_]+/gi, '_') + '_VoltageDrop_Cable_Register_A4.html';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert(error.message || error);
        }
    }

    function addVoltageDropHtmlButtons(container) {
        if (!container || container.querySelector('[data-vd-html-button="1"]')) return;

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.textContent = '🌐 Open A4 HTML';
        openButton.setAttribute('data-vd-html-button', '1');
        openButton.style.cssText = 'padding:14px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6610f2,#7b2ff7);color:#fff;font-size:16px;font-weight:600;cursor:pointer;';
        openButton.onclick = openVoltageDropA4HTMLReport;

        const downloadButton = document.createElement('button');
        downloadButton.type = 'button';
        downloadButton.textContent = '📄 Download A4 HTML';
        downloadButton.setAttribute('data-vd-html-button', '1');
        downloadButton.style.cssText = 'padding:14px 28px;border:none;border-radius:10px;background:#495057;color:#fff;font-size:16px;font-weight:600;cursor:pointer;';
        downloadButton.onclick = downloadVoltageDropA4HTMLReport;

        container.prepend(downloadButton);
        container.prepend(openButton);
    }

    global.buildAllBusVoltageDropReportHTML = buildAllBusVoltageDropReportHTML;
    global.showAllBusVoltageDropReportHTML = openVoltageDropA4HTMLReport;
    global.exportAllBusVoltageDropReportHTML = downloadVoltageDropA4HTMLReport;
    global.exportAllBusVoltageDropStepsReportHTML = downloadVoltageDropA4HTMLReport;
    global.addVoltageDropHtmlButtons = addVoltageDropHtmlButtons;

    console.log('✅ Voltage Drop A4 HTML Cable Register Report loaded - bus names resolved');
})(typeof window !== 'undefined' ? window : globalThis);
