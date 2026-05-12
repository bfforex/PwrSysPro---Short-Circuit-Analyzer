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

    global.getCalculationTimestamp = getCalculationTimestamp;
    global.safeToFixed = safeToFixed;

    console.log('✅ formatUtils loaded');
})(window);