# Calculation Formulas Documentation
## Complete Formula Reference for PwrSys Pro Version 3.3

**Document Version:** 1.0.0  
**Date:** 2025-12-05  
**Author:** Engr. B. P. Faraon

---

## Table of Contents

1. [Short-Circuit Calculations](#short-circuit-calculations)
2. [Load Flow & Demand Calculations](#load-flow--demand-calculations)
3. [Voltage Drop Calculations](#voltage-drop-calculations)
4. [Arc Flash Calculations](#arc-flash-calculations)
5. [Motor Contribution Calculations](#motor-contribution-calculations)
6. [Protection Device Sizing](#protection-device-sizing)

---

## Short-Circuit Calculations

### 1. Three-Phase Symmetrical Fault Current

**Standard:** IEEE 141-1993, IEC 60909

**Formula:**
```
I_sc(3φ sym) = V_L-L / (√3 × Z_total)

Where:
  I_sc = Three-phase symmetrical fault current (A)
  V_L-L = Line-to-line voltage (V)
  Z_total = Total impedance to fault point (Ω)
  √3 = 1.732
```

**Implementation:**
```javascript
/**
 * Calculate three-phase symmetrical fault current
 * 
 * @param {Number} voltage - System voltage (V)
 * @param {Number} totalImpedance - Total impedance (Ω)
 * @returns {Number} Fault current (kA)
 */
function calculateThreePhaseFault(voltage, totalImpedance) {
  const SQRT3 = Math.sqrt(3);
  const faultCurrentAmperes = voltage / (SQRT3 * totalImpedance);
  const faultCurrentKA = faultCurrentAmperes / 1000;
  return faultCurrentKA;
}
```

**Example:**
```
Given: V = 480V, Z_total = 0.015Ω
I_sc = 480 / (1.732 × 0.015)
     = 480 / 0.02598
     = 18,475 A
     = 18.475 kA
```

### 2. Three-Phase Asymmetrical Fault Current

**Standard:** IEEE 141-1993, IEEE C37.010

**Formula:**
```
I_sc(3φ asym) = I_sc(3φ sym) × K_multiplier

Where:
  K_multiplier = 1 + e^(-4π / (X/R))
  
  For typical values:
    X/R = 3:   K = 1.10
    X/R = 6:   K = 1.17
    X/R = 10:  K = 1.25
    X/R = 15:  K = 1.32
    X/R = 20:  K = 1.38
```

**Implementation:**
```javascript
/**
 * Calculate asymmetrical fault current multiplier
 * 
 * @param {Number} xrRatio - X/R ratio of the system
 * @returns {Number} Asymmetrical multiplier
 */
function calculateAsymmetricalMultiplier(xrRatio) {
  // IEEE C37.010 formula
  const kmultiplier = 1 + Math.exp(-4 * Math.PI / xrRatio);
  return kmultiplier;
}

/**
 * Calculate asymmetrical fault current
 */
function calculateAsymmetricalFault(symmetricalFault, xrRatio) {
  const multiplier = calculateAsymmetricalMultiplier(xrRatio);
  return symmetricalFault * multiplier;
}
```

**Example:**
```
Given: I_sym = 18.475 kA, X/R = 10
K = 1 + e^(-4π/10) = 1 + e^(-1.257) = 1 + 0.284 = 1.284
I_asym = 18.475 × 1.284 = 23.722 kA
```

### 3. Line-to-Line Fault Current

**Standard:** IEEE 141-1993

**Formula:**
```
I_L-L = I_3φ × 0.866

Where:
  I_L-L = Line-to-line fault current
  I_3φ = Three-phase fault current
  0.866 = √3/2
```

**Implementation:**
```javascript
const faultLL = faultThreePhase * 0.866;
```

### 4. Line-to-Ground Fault Current

**Standard:** IEEE 141-1993, depends on system grounding

**Formula:**
```
I_L-G = 3 × V_L-N / (Z1 + Z2 + Z0)

For solidly grounded systems (approximation):
I_L-G ≈ I_3φ × 0.85 to 1.0

Where:
  Z1 = Positive sequence impedance
  Z2 = Negative sequence impedance
  Z0 = Zero sequence impedance
  V_L-N = Line-to-neutral voltage
```

**Implementation:**
```javascript
// Simplified for solidly grounded systems
const faultLG = faultThreePhase * 0.85;
```

### 5. Total System Impedance

**Standard:** IEEE 141-1993

**Formula:**
```
Z_total = √(R_total² + X_total²)

Where:
  R_total = Sum of all resistances in path
  X_total = Sum of all reactances in path
```

**Per-Unit Method:**
```
Z_pu = Z_actual × S_base / (V_base²)

Where:
  Z_pu = Per-unit impedance
  Z_actual = Actual impedance (Ω)
  S_base = Base power (VA)
  V_base = Base voltage (V)
```

---

## Load Flow & Demand Calculations

### 1. NEC 430.24 Motor Demand Factor

**Standard:** NEC 2017 Article 430.24, PEC 2017 Part 2-4-30.24

**Formula:**
```
I_demand = (I_largest × 1.25) + (Σ I_others × K_d)

Where:
  I_demand = Demand current for feeder sizing
  I_largest = Full-load current of largest motor
  Σ I_others = Sum of full-load currents of all other motors
  K_d = Demand factor based on number of motors:
    2 motors:  K_d = 1.00 (100%)
    3 motors:  K_d = 0.91 (91%)
    4 motors:  K_d = 0.88 (88%)
    5 motors:  K_d = 0.86 (86%)
    6+ motors: K_d = 0.84 (84%)
```

**Implementation:**
```javascript
/**
 * Calculate motor demand per NEC 430.24
 * 
 * STANDARDS:
 * - NEC 2017 Article 430.24 - Several Motors or Combination Load
 * - PEC 2017 Part 2-4-30.24
 * 
 * @param {Array} motors - Array of motor objects with FLC values
 * @returns {Object} Demand calculation results
 */
function calculateNEC430_24Demand(motors) {
  // Sort motors by FLC descending
  motors.sort((a, b) => b.flc - a.flc);
  
  const largestMotor = motors[0].flc;
  const otherMotors = motors.slice(1).reduce((sum, m) => sum + m.flc, 0);
  
  // Determine demand factor
  let kd;
  const count = motors.length;
  if (count <= 2) kd = 1.00;
  else if (count === 3) kd = 0.91;
  else if (count === 4) kd = 0.88;
  else if (count === 5) kd = 0.86;
  else kd = 0.84;
  
  // Calculate demand current
  const demandCurrent = (largestMotor * 1.25) + (otherMotors * kd);
  
  return {
    demandCurrent,
    demandFactor: kd,
    largestMotor,
    largestContribution: largestMotor * 1.25,
    othersContribution: otherMotors * kd
  };
}
```

**Example:**
```
Given: 3 motors with FLC = 100A, 80A, 60A

Step 1: Identify largest motor
  Largest = 100A

Step 2: Determine demand factor
  3 motors → K_d = 0.91

Step 3: Calculate demand current
  I_demand = (100A × 1.25) + (80A + 60A) × 0.91
           = 125A + 140A × 0.91
           = 125A + 127.4A
           = 252.4A
```

### 2. IEEE 141 Diversity Factor

**Standard:** IEEE 141-1993 Table 3-5

**Formula:**
```
I_diversified = I_connected / DF

Where:
  I_diversified = Diversified load current
  I_connected = Connected load current (100% FLC)
  DF = Diversity factor (≥ 1.0)
```

**Diversity Factor Values:**
```
Motor Count:    DF:
1 motor         1.00
2 motors        1.05
3 motors        1.10
4 motors        1.15
5 motors        1.18
10 motors       1.25
15 motors       1.30
20+ motors      1.35
```

**Implementation:**
```javascript
/**
 * Calculate diversified load per IEEE 141-1993 Table 3-5
 * 
 * @param {Number} connectedLoad - Total connected load (A)
 * @param {Number} motorCount - Number of motors
 * @returns {Object} Diversified load calculation
 */
function calculateIEEE141Diversity(connectedLoad, motorCount) {
  let diversityFactor;
  
  if (motorCount <= 1) diversityFactor = 1.00;
  else if (motorCount === 2) diversityFactor = 1.05;
  else if (motorCount === 3) diversityFactor = 1.10;
  else if (motorCount <= 5) diversityFactor = 1.18;
  else if (motorCount <= 10) diversityFactor = 1.25;
  else if (motorCount <= 15) diversityFactor = 1.30;
  else diversityFactor = 1.35;
  
  const diversifiedLoad = connectedLoad / diversityFactor;
  const simultaneityFactor = 1 / diversityFactor;
  
  return {
    connectedLoad,
    diversifiedLoad,
    diversityFactor,
    simultaneityFactor,
    reduction: connectedLoad - diversifiedLoad
  };
}
```

**Example:**
```
Given: 5 motors, Connected Load = 240A

Step 1: Determine diversity factor
  5 motors → DF = 1.18

Step 2: Calculate diversified load
  I_diversified = 240A / 1.18
                = 203.4A
  
  Reduction = 240A - 203.4A = 36.6A (15.3% reduction)
```

### 3. Combined NEC & IEEE Calculation

**Three-Tier Load Calculation:**

```
Tier 1: Connected Load (100% FLC)
  I_connected = Σ(All motor FLC)

Tier 2: Demand Load (NEC 430.24)
  I_demand = (Largest × 1.25) + (Others × K_d)

Tier 3: Diversity Load (IEEE 141)
  I_diversity = I_connected / DF
```

**Implementation:**
```javascript
/**
 * Calculate three-tier load analysis
 * 
 * STANDARDS:
 * - NEC 2017 Article 430.24 - Demand factors
 * - IEEE 141-1993 Table 3-5 - Diversity factors
 * 
 * @param {Array} motors - Array of motor objects
 * @returns {Object} Three-tier load analysis
 */
function calculateThreeTierLoad(motors) {
  // Tier 1: Connected Load
  const connectedLoad = motors.reduce((sum, m) => sum + m.flc, 0);
  
  // Tier 2: Demand Load (NEC 430.24)
  const demandResult = calculateNEC430_24Demand(motors);
  
  // Tier 3: Diversity Load (IEEE 141)
  const diversityResult = calculateIEEE141Diversity(connectedLoad, motors.length);
  
  return {
    connectedLoad,
    demandLoad: demandResult.demandCurrent,
    diversityLoad: diversityResult.diversifiedLoad,
    demandFactor: demandResult.demandFactor,
    diversityFactor: diversityResult.diversityFactor,
    totalReduction: connectedLoad - diversityResult.diversifiedLoad,
    percentReduction: ((connectedLoad - diversityResult.diversifiedLoad) / connectedLoad * 100)
  };
}
```

---

## Voltage Drop Calculations

### 1. Three-Phase Voltage Drop

**Standard:** IEEE 141-1993 Chapter 4, Section 4.2

**Formula:**
```
VD% = (√3 × I × L × (R × cosθ + X × sinθ)) / (V × 10)

Where:
  VD% = Voltage drop percentage
  I = Load current (amperes)
  L = One-way cable length (feet)
  R = Resistance (ohms per 1000 feet)
  X = Reactance (ohms per 1000 feet)
  V = System voltage (volts)
  cosθ = Power factor
  sinθ = √(1 - cosθ²)
  √3 = 1.732
```

**Implementation:**
```javascript
/**
 * Calculate three-phase voltage drop per IEEE 141-1993
 * 
 * @param {Object} params - Calculation parameters
 * @returns {Number} Voltage drop percentage
 */
function calculateThreePhaseVoltageDrop(params) {
  const { current, length, resistance, reactance, voltage, powerFactor } = params;
  
  const SQRT3 = Math.sqrt(3);
  const cosTheta = powerFactor;
  const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
  
  // IEEE 141 formula
  const vdPercent = (SQRT3 * current * length * 
                    (resistance * cosTheta + reactance * sinTheta)) / 
                    (voltage * 10);
  
  return vdPercent;
}
```

**Example:**
```
Given:
  I = 100A
  L = 500 feet
  R = 0.0001 Ω/ft (copper 4/0 AWG)
  X = 0.00004 Ω/ft
  V = 480V
  PF = 0.85

cosθ = 0.85
sinθ = √(1 - 0.85²) = √(1 - 0.7225) = √0.2775 = 0.527

VD% = (1.732 × 100 × 500 × (0.0001 × 0.85 + 0.00004 × 0.527)) / (480 × 10)
    = (86,600 × (0.000085 + 0.0000211)) / 4800
    = (86,600 × 0.0001061) / 4800
    = 9.188 / 4800
    = 1.91%
```

### 2. Single-Phase Voltage Drop

**Formula:**
```
VD% = (2 × I × L × (R × cosθ + X × sinθ)) / (V × 10)
```

**Implementation:**
```javascript
function calculateSinglePhaseVoltageDrop(params) {
  const { current, length, resistance, reactance, voltage, powerFactor } = params;
  
  const cosTheta = powerFactor;
  const sinTheta = Math.sqrt(1 - powerFactor * powerFactor);
  
  // Single-phase uses factor of 2 instead of √3
  const vdPercent = (2 * current * length * 
                    (resistance * cosTheta + reactance * sinTheta)) / 
                    (voltage * 10);
  
  return vdPercent;
}
```

### 3. Parallel Cable Voltage Drop

**Formula:**
```
R_parallel = R_single / N
X_parallel = X_single / N

Where:
  N = Number of parallel cables
```

**Implementation:**
```javascript
function adjustForParallelCables(resistance, reactance, numParallel) {
  return {
    resistance: resistance / numParallel,
    reactance: reactance / numParallel
  };
}
```

---

## Arc Flash Calculations

### 1. Lee Method (Low Voltage < 1000V)

**Standard:** IEEE 1584-2018

**Formula:**
```
E = 5271 × D_a^(-1.9593) × t_a × (0.0016 × I_bf² - 0.0076 × I_bf + 0.8938)

Where:
  E = Incident energy (cal/cm²)
  D_a = Working distance (inches)
  t_a = Arc duration (seconds)
  I_bf = Bolted fault current (kA)
```

**Implementation:**
```javascript
/**
 * Calculate arc flash incident energy using Lee Method
 * 
 * STANDARD: IEEE 1584-2018 for systems < 1000V
 * 
 * @param {Number} workingDistance - Distance in mm
 * @param {Number} arcDuration - Time in seconds
 * @param {Number} faultCurrent - Fault current in kA
 * @returns {Number} Incident energy in cal/cm²
 */
function calculateLeeMethod(workingDistance, arcDuration, faultCurrent) {
  // Convert mm to inches
  const distanceInches = workingDistance / 25.4;
  
  // Lee Method formula
  const incidentEnergy = 5271 * 
                        Math.pow(distanceInches, -1.9593) * 
                        arcDuration * 
                        (0.0016 * Math.pow(faultCurrent, 2) - 
                         0.0076 * faultCurrent + 
                         0.8938);
  
  return incidentEnergy;
}
```

**Example:**
```
Given:
  D_a = 18 inches (457mm)
  t_a = 0.2 seconds
  I_bf = 20 kA

E = 5271 × 18^(-1.9593) × 0.2 × (0.0016 × 20² - 0.0076 × 20 + 0.8938)
  = 5271 × 0.003425 × 0.2 × (0.64 - 0.152 + 0.8938)
  = 5271 × 0.003425 × 0.2 × 1.3818
  = 5.00 cal/cm²
```

### 2. Arc Flash Boundary

**Formula:**
```
AFB = √(4.184 × E × A / E_b)

Where:
  AFB = Arc flash boundary (inches)
  E = Incident energy at working distance (cal/cm²)
  A = Area factor (depends on equipment)
  E_b = Threshold energy (1.2 cal/cm² for 2nd degree burn)
```

**Implementation:**
```javascript
/**
 * Calculate arc flash boundary
 * 
 * @param {Number} incidentEnergy - Incident energy at working distance (cal/cm²)
 * @returns {Number} Arc flash boundary in mm
 */
function calculateArcFlashBoundary(incidentEnergy) {
  const THRESHOLD_ENERGY = 1.2; // cal/cm² for second-degree burn
  
  // Calculate boundary in inches
  const boundaryInches = Math.sqrt((4.184 * incidentEnergy) / THRESHOLD_ENERGY);
  
  // Convert to mm
  const boundaryMM = boundaryInches * 25.4;
  
  return boundaryMM;
}
```

### 3. PPE Category Determination

**Standard:** NFPA 70E-2021 Table 130.7(C)(15)

**Formula:**
```
if (E < 1.2) PPE_Category = 0;
else if (E <= 4) PPE_Category = 1;
else if (E <= 8) PPE_Category = 2;
else if (E <= 25) PPE_Category = 3;
else if (E <= 40) PPE_Category = 4;
else PPE_Category = 4+ (special);
```

**Implementation:**
```javascript
/**
 * Determine PPE category per NFPA 70E-2021
 * 
 * @param {Number} incidentEnergy - Incident energy (cal/cm²)
 * @returns {Object} PPE category and requirements
 */
function determinePPECategory(incidentEnergy) {
  let category, arcRating, description;
  
  if (incidentEnergy < 1.2) {
    category = 0;
    arcRating = 'N/A';
    description = 'Standard work clothing';
  } else if (incidentEnergy <= 4) {
    category = 1;
    arcRating = '4 cal/cm²';
    description = 'Arc-rated shirt and pants';
  } else if (incidentEnergy <= 8) {
    category = 2;
    arcRating = '8 cal/cm²';
    description = 'Arc-rated clothing with face shield';
  } else if (incidentEnergy <= 25) {
    category = 3;
    arcRating = '25 cal/cm²';
    description = 'Arc-rated clothing, jacket, face shield';
  } else if (incidentEnergy <= 40) {
    category = 4;
    arcRating = '40 cal/cm²';
    description = 'Full arc flash suit system';
  } else {
    category = '4+';
    arcRating = `${Math.ceil(incidentEnergy)} cal/cm²`;
    description = 'Special protective equipment required';
  }
  
  return { category, arcRating, description, incidentEnergy };
}
```

---

## Motor Contribution Calculations

### 1. Motor Fault Contribution

**Standard:** IEEE 141-1993 Section 5.3

**Formula:**
```
I_motor = K_factor × I_FLC

Where:
  I_motor = Motor contribution to fault
  K_factor = Contribution factor
    Interrupting duty: K = 4.0
    Momentary duty: K = 6.0
  I_FLC = Motor full-load current
```

**Implementation:**
```javascript
/**
 * Calculate motor contribution per IEEE 141-1993
 * 
 * @param {Number} motorFLC - Motor full-load current (A)
 * @param {String} dutyType - 'interrupting' or 'momentary'
 * @returns {Number} Motor contribution (kA)
 */
function calculateMotorFaultContribution(motorFLC, dutyType = 'interrupting') {
  const K_FACTORS = {
    interrupting: 4.0,
    momentary: 6.0
  };
  
  const kFactor = K_FACTORS[dutyType] || 4.0;
  const contributionA = motorFLC * kFactor;
  const contributionKA = contributionA / 1000;
  
  return contributionKA;
}
```

### 2. Motor Impedance

**Standard:** IEEE 141-1993 Table 5-3

**Formula:**
```
Z_motor = (X" / 100) × (V² / S_motor)

Where:
  X" = Subtransient reactance (%)
    Induction < 50 HP: X" = 20%
    Induction 50-250 HP: X" = 17%
    Induction > 250 HP: X" = 15%
  V = Motor voltage (V)
  S_motor = Motor kVA rating
```

---

## Protection Device Sizing

### 1. Breaker Sizing for Motors

**Standard:** NEC 430.52

**Formula:**
```
I_breaker = I_FLC × Multiplier

Where:
  Multiplier depends on breaker type:
    Inverse time breaker: 250%
    Instantaneous trip: 800%
    Time-delay fuse: 175%
```

### 2. Cable Ampacity Selection

**Standard:** NEC 310.15

**Formula:**
```
I_required = I_load / (AF × CF)

Where:
  I_required = Required conductor ampacity
  I_load = Load current
  AF = Adjustment factor (multiple conductors)
  CF = Correction factor (temperature)
```

---

## Summary of Key Constants

```javascript
const CONSTANTS = {
  SQRT3: 1.732,
  
  NEC_MOTOR_DEMAND: {
    2: 1.00,
    3: 0.91,
    4: 0.88,
    5: 0.86,
    6: 0.84
  },
  
  IEEE_DIVERSITY: {
    1: 1.00,
    2: 1.05,
    3: 1.10,
    5: 1.18,
    10: 1.25,
    15: 1.30,
    20: 1.35
  },
  
  MOTOR_CONTRIBUTION: {
    interrupting: 4.0,
    momentary: 6.0
  },
  
  VOLTAGE_DROP_LIMITS: {
    feeder_recommended: 2.5,
    feeder_max: 3.0,
    branch_recommended: 3.0,
    branch_max: 5.0,
    combined_max: 7.0,
    motor_starting_max: 15.0
  },
  
  ARC_FLASH: {
    threshold_burn: 1.2,  // cal/cm²
    working_distance_lv: 457,  // mm (18 inches)
    working_distance_mv: 914   // mm (36 inches)
  }
};
```

---

## References

1. IEEE Std 141-1993, IEEE Red Book
2. IEEE Std 1584-2018, Arc Flash Calculations
3. IEEE C37.010-2016, DC Component Capability
4. NFPA 70-2017, National Electrical Code
5. NFPA 70E-2021, Electrical Safety
6. IEC 60909, Short-Circuit Currents

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-12-05  
**Maintained By:** Engr. B. P. Faraon
