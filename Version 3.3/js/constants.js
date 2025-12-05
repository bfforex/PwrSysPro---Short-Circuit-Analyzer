/**
 * Application Constants for PwrSys Pro
 * 
 * @author Engr. B. P. Faraon
 * @version 1.0
 * @date 2025-12-05
 * 
 * STANDARDS COMPLIANCE:
 * - NEC 2017 Chapter 9, Table 9 - Cable impedance values
 * - IEEE 141-1993 - Temperature coefficients
 * - PEC 2017 - Philippine Electrical Code
 */

// Application Constants
const SQRT3 = Math.sqrt(3);
const VERSION = '1.0';
const AUTHOR = 'Engr. B. P. Faraon';

/**
 * Cable Impedance Data
 * 
 * SOURCE: NEC 2017 Chapter 9, Table 9
 *         "Alternating-Current Resistance and Reactance for 600-Volt Cables"
 * 
 * NOTES:
 * - Values are in Ohms per foot (Ω/ft)
 * - Based on three single conductors in PVC conduit
 * - AC resistance at 75°C conductor temperature (includes skin effect at 60 Hz)
 * - Reactance (X) at 0 feet spacing
 * - Power factor not applicable (X values are effective reactance)
 * 
 * VERIFICATION STATUS:
 * - Values sourced from NEC 2017 Chapter 9, Table 9
 * - Resistance values include AC effects (skin effect, proximity effect)
 * - Suitable for voltage drop and short-circuit calculations
 * 
 * USAGE:
 * - Voltage drop calculations per IEEE 141-1993 Chapter 4
 * - Short-circuit impedance calculations per IEEE 141-1993 Chapter 5
 * - Conductor sizing per NEC Article 310.15
 * 
 * @type {Object}
 * @property {Object} [size] - Wire size (AWG or kcmil)
 * @property {Object} [size].copper - Copper conductor impedance
 * @property {Number} [size].copper.r - AC resistance (Ω/ft)
 * @property {Number} [size].copper.x - Reactance (Ω/ft)
 * @property {Object} [size].aluminum - Aluminum conductor impedance
 * @property {Number} [size].aluminum.r - AC resistance (Ω/ft)
 * @property {Number} [size].aluminum.x - Reactance (Ω/ft)
 */
const CABLE_IMPEDANCE_DATA = {
    '14': { copper: { r: 0.00310, x: 0.000058 }, aluminum: { r: 0.00508, x: 0.000061 } },
    '12': { copper: { r: 0.00195, x: 0.000054 }, aluminum: { r: 0.00319, x: 0.000057 } },
    '10': { copper: { r: 0.00123, x: 0.000050 }, aluminum: { r: 0.00201, x: 0.000053 } },
    '8': { copper: { r: 0.000764, x: 0.000052 }, aluminum: { r: 0.00126, x: 0.000055 } },
    '6': { copper: { r: 0.000491, x: 0.000051 }, aluminum: { r: 0.000808, x: 0.000054 } },
    '4': { copper: { r: 0.000308, x: 0.000048 }, aluminum: { r: 0.000508, x: 0.000051 } },
    '2': { copper: { r: 0.000194, x: 0.000046 }, aluminum: { r: 0.000319, x: 0.000049 } },
    '1': { copper: { r: 0.000154, x: 0.000045 }, aluminum: { r: 0.000253, x: 0.000048 } },
    '1/0': { copper: { r: 0.000122, x: 0.000044 }, aluminum: { r: 0.000201, x: 0.000047 } },
    '2/0': { copper: { r: 0.0000967, x: 0.000042 }, aluminum: { r: 0.000159, x: 0.000045 } },
    '3/0': { copper: { r: 0.0000766, x: 0.000041 }, aluminum: { r: 0.000126, x: 0.000044 } },
    '4/0': { copper: { r: 0.0000608, x: 0.000040 }, aluminum: { r: 0.0000999, x: 0.000043 } },
    '250': { copper: { r: 0.0000515, x: 0.000039 }, aluminum: { r: 0.0000847, x: 0.000042 } },
    '300': { copper: { r: 0.0000429, x: 0.000038 }, aluminum: { r: 0.0000707, x: 0.000041 } },
    '350': { copper: { r: 0.0000367, x: 0.000037 }, aluminum: { r: 0.0000605, x: 0.000040 } },
    '400': { copper: { r: 0.0000321, x: 0.000037 }, aluminum: { r: 0.0000529, x: 0.000040 } },
    '500': { copper: { r: 0.0000258, x: 0.000036 }, aluminum: { r: 0.0000424, x: 0.000039 } },
    '600': { copper: { r: 0.0000214, x: 0.000035 }, aluminum: { r: 0.0000353, x: 0.000038 } },
    '750': { copper: { r: 0.0000171, x: 0.000034 }, aluminum: { r: 0.0000282, x: 0.000037 } },
    '1000': { copper: { r: 0.0000129, x: 0.000033 }, aluminum: { r: 0.0000212, x: 0.000036 } }
};

/**
 * Temperature Coefficient for Conductor Resistance
 * 
 * SOURCE: IEEE 141-1993, NEC Chapter 9 Notes
 * 
 * FORMULA:
 * R_T2 = R_T1 × [1 + α × (T2 - T1)]
 * 
 * Where:
 *   R_T2 = Resistance at temperature T2
 *   R_T1 = Resistance at temperature T1
 *   α = Temperature coefficient (per °C)
 *   T2 - T1 = Temperature difference
 * 
 * STANDARD VALUES:
 * - Copper: 0.00393 per °C (at 20°C reference)
 * - Aluminum: 0.00403 per °C (at 20°C reference)
 * 
 * TYPICAL TEMPERATURE RATINGS:
 * - 60°C: Type TW, UF
 * - 75°C: Type THW, THWN, XHHW (most common)
 * - 90°C: Type THHN, XHHW-2, RHW-2
 * 
 * STANDARDS:
 * - NEC Article 310.15 - Conductor temperature ratings
 * - IEEE 141-1993 - Temperature correction methods
 * 
 * @type {Object}
 * @property {Number} copper - Temperature coefficient for copper (per °C)
 * @property {Number} aluminum - Temperature coefficient for aluminum (per °C)
 */
const TEMP_COEFFICIENT = {
    copper: 0.00393,   // Per °C at 20°C reference (NEC Chapter 9)
    aluminum: 0.00403  // Per °C at 20°C reference (NEC Chapter 9)
};