(function initFormatUtils(global) {
    'use strict';

    function getCalculationTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
    }

    function safeToFixed(value, decimals = 2, fallback = 'N/A') {
        if (value === undefined || value === null || isNaN(Number(value))) {
            if (typeof console !== 'undefined' && console.debug) {
                console.debug(`[safeToFixed] Invalid value: ${value}, using fallback: ${fallback}`);
            }
            return fallback;
        }
        return Number(value).toFixed(decimals);
    }

    function getSafeNumberFormatter() {
        if (typeof global.safeToFixed === 'function') {
            return global.safeToFixed;
        }
        return function fallbackSafeToFixed(value, decimals = 2, fallback = 'N/A') {
            if (value === undefined || value === null || isNaN(Number(value))) return fallback;
            return Number(value).toFixed(decimals);
        };
    }

    function sanitizeExportName(value, fallback = 'Project') {
        const cleanName = String(value || '').replace(/[^a-z0-9\-_]+/gi, '_');
        return cleanName || fallback;
    }

    function getExportFileTimestamp(dateValue = new Date()) {
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return new Date().toISOString().replace(/[:.]/g, '-');
        }
        return date.toISOString().replace(/[:.]/g, '-');
    }

    function downloadFileContent(content, fileName, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    global.getCalculationTimestamp = getCalculationTimestamp;
    global.safeToFixed = safeToFixed;
    global.getSafeNumberFormatter = getSafeNumberFormatter;
    global.sanitizeExportName = sanitizeExportName;
    global.getExportFileTimestamp = getExportFileTimestamp;
    global.downloadFileContent = downloadFileContent;

    console.log('✅ formatUtils loaded');
})(window);
