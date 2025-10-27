// Application Constants
const SQRT3 = Math.sqrt(3);
const VERSION = '1.0';
const AUTHOR = 'Engr. B. P. Faraon';

// Cable impedance data (Ω/ft)
const CABLE_IMPEDANCE_DATA = {
    '14': { copper: { r: 0.00310, x: 0.000058 }, aluminum: { r: 0.00508, x: 0.000061 } },
    '12': { copper: { r: 0.00195, x: 0.000054 }, aluminum: { r: 0.00319, x: 0.000057 } },
    '10': { copper: { r: 0.00123, x: 0.000050 }, aluminum: { r: 0.00201, x: 0.000053 } },
    '8': { copper: { r: 0.000764, x: 0.000052 }, aluminum: { r: 0.00126, x: 0.000055 } },
    '6': { copper: { r: 0.000491, x: 0.000051 }, aluminum: { r: 0.000808, x: 0.000054 } },
    '4': { copper: { r: 0.000308, x: 0.000048 }, aluminum: { r: 0.000508, x: 0.000051 } },
    '2': { copper: { r: 0.000194, x: 0.000046 }, aluminum: { r: 0.00319, x: 0.000049 } },
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

// Temperature coefficient
const TEMP_COEFFICIENT = {
    copper: 0.00393,
    aluminum: 0.00403
};