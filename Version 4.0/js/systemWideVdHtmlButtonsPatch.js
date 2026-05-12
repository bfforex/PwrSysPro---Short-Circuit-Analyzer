/**
 * System-Wide VD HTML Buttons Patch
 *
 * Load after:
 * - calculationDisplay.js
 * - exportAllBusVoltageDropReportHTML.js
 *
 * Purpose:
 * - Replaces showSystemVoltageDropSteps() with a version where
 *   Open A4 HTML and Download A4 HTML buttons are wired reliably.
 */

(function installSystemWideVdHtmlButtonsPatch(global) {
    'use strict';

    if (global.__systemWideVdHtmlButtonsPatchInstalled) return;
    global.__systemWideVdHtmlButtonsPatchInstalled = true;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function openA4HtmlReport() {
        if (typeof global.showAllBusVoltageDropReportHTML === 'function') {
            global.showAllBusVoltageDropReportHTML();
            return;
        }

        alert('Voltage Drop A4 HTML report function is not loaded.');
    }

    function downloadA4HtmlReport() {
        if (typeof global.exportAllBusVoltageDropReportHTML === 'function') {
            global.exportAllBusVoltageDropReportHTML();
            return;
        }

        alert('Voltage Drop A4 HTML export function is not loaded.');
    }

    function getSystemVoltageDropText() {
        if (typeof global.generateSystemVoltageDropCalculationText === 'function') {
            return global.generateSystemVoltageDropCalculationText();
        }

        if (typeof generateSystemVoltageDropCalculationText === 'function') {
            return generateSystemVoltageDropCalculationText();
        }

        return 'System-wide voltage drop calculation text function is not available.';
    }

    function exportSystemVoltageDropText() {
        if (typeof global.exportSystemVoltageDropCalculation === 'function') {
            global.exportSystemVoltageDropCalculation();
            return;
        }

        if (typeof exportSystemVoltageDropCalculation === 'function') {
            exportSystemVoltageDropCalculation();
            return;
        }

        const text = getSystemVoltageDropText();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = 'System_Voltage_Drop_Calculation.txt';

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    }

    function patchedShowSystemVoltageDropSteps() {
        const steps = getSystemVoltageDropText();

        document.getElementById('calcStepsOverlay')?.remove();

        const overlay = document.createElement('div');

        overlay.id = 'calcStepsOverlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.55)';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';

        overlay.innerHTML = `
            <div style="background:#fff;color:#111;width:min(1000px,95vw);max-height:90vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #ddd;">
                    <h3 style="margin:0;">System-Wide Voltage Drop Calculation</h3>
                    <button id="calcStepsClose" class="btn btn-secondary">Close</button>
                </div>

                <pre style="margin:0;padding:18px;overflow:auto;white-space:pre-wrap;font-family:Consolas,'Courier New',monospace;font-size:13px;line-height:1.45;flex:1;">${escapeHtml(steps)}</pre>

                <div style="display:flex;justify-content:flex-end;align-items:center;gap:14px;padding:14px 18px;border-top:1px solid #ddd;background:#f6f7f9;">
                    <button id="systemVdA4HtmlOpen" style="padding:14px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6610f2,#7b2ff7);color:#ffffff;font-size:16px;font-weight:600;cursor:pointer;">
                        🌐 Open A4 HTML
                    </button>

                    <button id="systemVdA4HtmlDownload" style="padding:14px 28px;border:none;border-radius:10px;background:#495057;color:#ffffff;font-size:16px;font-weight:600;cursor:pointer;">
                        📄 Download A4 HTML
                    </button>

                    <button id="systemVdExport" class="btn btn-success">
                        Export TXT
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#calcStepsClose')?.addEventListener('click', function () {
            overlay.remove();
        });

        overlay.querySelector('#systemVdA4HtmlOpen')?.addEventListener('click', function () {
            openA4HtmlReport();
        });

        overlay.querySelector('#systemVdA4HtmlDownload')?.addEventListener('click', function () {
            downloadA4HtmlReport();
        });

        overlay.querySelector('#systemVdExport')?.addEventListener('click', function () {
            exportSystemVoltageDropText();
        });

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                overlay.remove();
            }
        });
    }

    global.showSystemVoltageDropSteps = patchedShowSystemVoltageDropSteps;

    try {
        showSystemVoltageDropSteps = patchedShowSystemVoltageDropSteps;
    } catch (_) {}

    console.log('✅ System-Wide VD HTML Buttons Patch loaded');
})(typeof window !== 'undefined' ? window : globalThis);