/**
 * Safe Formatting Utilities
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" errors
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 * 
 * Issue 1: CRITICAL - Export Report Error Fix
 * This module provides safe wrappers for numeric formatting to handle
 * undefined, null, or invalid values gracefully.
 */

/**
 * Safely format numeric value with decimal places
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" errors
 * 
 * @param {*} value - Value to format (can be undefined, null, or any type)
 * @param {Number} decimals - Number of decimal places (default: 2)
 * @param {String} fallback - Fallback string for invalid values (default: 'N/A')
 * @returns {String} Formatted number string or fallback
 */
function safeToFixed(value, decimals = 2, fallback = 'N/A') {
    if (value === undefined || value === null || isNaN(Number(value))) {
        console.warn(`[Export Warning] Invalid value: ${value}, using fallback: ${fallback}`);
        return fallback;
    }
    return Number(value).toFixed(decimals);
}

/**
 * Safely convert to number with fallback
 * 
 * @param {*} value - Value to convert to number
 * @param {Number} fallback - Fallback number for invalid values (default: 0)
 * @returns {Number} Converted number or fallback
 */
function safeNumber(value, fallback = 0) {
    if (value === undefined || value === null || isNaN(Number(value))) {
        return fallback;
    }
    return Number(value);
}

/**
 * Safely format percentage value
 * 
 * @param {*} value - Value to format as percentage
 * @param {Number} decimals - Number of decimal places (default: 1)
 * @param {String} fallback - Fallback string for invalid values (default: 'N/A')
 * @returns {String} Formatted percentage string or fallback
 */
function safeToPercent(value, decimals = 1, fallback = 'N/A') {
    if (value === undefined || value === null || isNaN(Number(value))) {
        console.warn(`[Export Warning] Invalid percentage value: ${value}, using fallback: ${fallback}`);
        return fallback;
    }
    return Number(value).toFixed(decimals) + '%';
}

/**
 * Safely format a string value, trimming and providing fallback
 * 
 * @param {*} value - Value to format as string
 * @param {String} fallback - Fallback string for invalid values (default: 'N/A')
 * @returns {String} Trimmed string or fallback
 */
function safeString(value, fallback = 'N/A') {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    return String(value).trim();
}

/**
 * Safely access nested object property
 * 
 * @param {Object} obj - Object to access
 * @param {String} path - Dot-separated path (e.g., 'results.voltageDrop.cumulativeDropPercent')
 * @param {*} fallback - Fallback value if path doesn't exist
 * @returns {*} Value at path or fallback
 */
function safeGet(obj, path, fallback = undefined) {
    if (!obj || typeof path !== 'string' || path.length === 0) {
        return fallback;
    }
    
    // Security: Prevent prototype pollution by blocking dangerous property names
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const keys = path.split('.');
    
    for (const key of keys) {
        // Security check: Block prototype pollution attempts
        if (dangerousKeys.includes(key.toLowerCase())) {
            console.warn(`[Security] Blocked access to dangerous property: ${key}`);
            return fallback;
        }
    }
    
    let current = obj;
    
    for (const key of keys) {
        if (current === undefined || current === null || typeof current !== 'object') {
            return fallback;
        }
        // Use hasOwnProperty check to prevent prototype chain access
        if (!Object.prototype.hasOwnProperty.call(current, key)) {
            return fallback;
        }
        current = current[key];
    }
    
    return current !== undefined ? current : fallback;
}

/**
 * Safely format a numeric value for display in reports
 * Combines safeToFixed with optional units
 * 
 * @param {*} value - Value to format
 * @param {Number} decimals - Number of decimal places
 * @param {String} unit - Unit suffix (e.g., 'A', 'V', 'kVA')
 * @param {String} fallback - Fallback string
 * @returns {String} Formatted value with unit or fallback
 */
function safeFormatWithUnit(value, decimals = 2, unit = '', fallback = 'N/A') {
    if (value === undefined || value === null || isNaN(Number(value))) {
        console.warn(`[Export Warning] Invalid value for unit formatting: ${value}, using fallback: ${fallback}`);
        return fallback;
    }
    const formatted = Number(value).toFixed(decimals);
    return unit ? `${formatted} ${unit}` : formatted;
}

// Export functions to global scope
if (typeof window !== 'undefined') {
    window.safeToFixed = safeToFixed;
    window.safeNumber = safeNumber;
    window.safeToPercent = safeToPercent;
    window.safeString = safeString;
    window.safeGet = safeGet;
    window.safeFormatWithUnit = safeFormatWithUnit;
}

console.log('✅ Safe Formatting Utilities loaded');
console.log('   - safeToFixed: Prevents toFixed() errors on undefined/null');
console.log('   - safeNumber: Safe numeric conversion with fallback');
console.log('   - safeToPercent: Safe percentage formatting');
console.log('   - safeString: Safe string formatting');
console.log('   - safeGet: Safe nested object property access');
console.log('   - safeFormatWithUnit: Safe value + unit formatting');
