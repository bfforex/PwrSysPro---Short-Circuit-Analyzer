# PwrSys Pro - Short Circuit Analyzer: Version 3.3

## Overview

Version 3.3 introduces significant improvements focused on **harmonized calculations**, **improved coordination between reports**, **clarified design vs operating metrics**, **consistent arc-flash and voltage-drop conventions**, and **better bus-tie scenario handling**.

This version maintains backward compatibility with Version 3.2 while providing a more unified and consistent calculation framework.

## What's New in Version 3.3

### 1. Unified Results Schema (`resultsSchema.js`)

A central module that defines and documents the standard shape of calculation results:

- **Short Circuit Results**: `bus.results.shortCircuit`
  - Fault currents (3-phase sym, 3-phase asym, L-L, L-G)
  - X/R ratio and impedance data
  - Arc flash sub-object with consistent IEEE 1584-2018 parameters

- **Load Flow Results**: `bus.results.loadFlow`
  - Summary (total current, kVA, kW, power factor)
  - **Voltage Drop** with clear separation:
    - `designPercent`: At 100% FLC - for compliance checking
    - `operDemandPercent`: With demand factor applied
    - `operDemandDiversityPercent`: With demand + diversity factors
  - Demand summary with connected/demand/diversity currents

- **Project Results**: `project.results`
  - System-level demand & diversity calculations
  - Calculation metadata with version information

### 2. Voltage Drop Engine (`voltageDropEngine.js`)

A single unified function `computeVoltageDrop(bus, mode)` with three modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `design` | 100% FLC | NEC/IEEE compliance checks |
| `oper_demand` | With demand factor | Estimated operating conditions |
| `oper_demand_df` | With demand + diversity | Realistic operating analysis |

**Key Convention**: Design VD is ALWAYS based on 100% connected load (FLC). Compliance is evaluated against design VD, not operating VD.

### 3. Arc Flash Engine (`arcFlashEngine.js`)

Centralized arc-flash calculations with consistent parameters:

- IEEE 1584-2018 compliant calculations
- NFPA 70E-2021 PPE category determination
- Unified parameters for working distance, electrode configuration
- Results stored in `bus.results.shortCircuit.arcFlash`
- Single authoritative source for all reports

### 4. Scenario Manager (`scenarioManager.js`)

Explicit scenario support for bus-tie analysis:

- Define baseline and comparison scenarios
- Track bus-tie states (open/closed) per scenario
- Maintain separate results for each scenario
- Generate comparison reports

**Example scenarios**:
- `base`: Normal operating configuration (bus ties open)
- `tie_LCA1_4_LCB1_4_closed`: Specific bus tie closed

## Key Improvements

### Voltage Drop Clarity

**Before (v3.2)**: Single voltage drop value, unclear whether design or operating

**After (v3.3)**:
- Design VD clearly labeled for compliance
- Operating VD shown as informational
- Reports explicitly state compliance is based on design VD

### Arc Flash Consistency

**Before (v3.2)**: Different reports might show different values due to inconsistent parameters

**After (v3.3)**:
- All reports read from unified `arcFlash` object
- Consistent working distance, clearing time, electrode configuration
- When fault current unchanged but IE increases, reports explain why

### Report Coordination

All reports now consume the unified schema:
- Enhanced System Report
- Per-bus reports (e.g., LCB1-4)
- Bus Tie Analysis Report
- Demand & Diversity reports

## Breaking Changes from Version 3.2

1. **Results Structure**: Bus results now include `shortCircuit` and `loadFlow` sub-objects
   - Old: `bus.results.faultCurrents`
   - New: `bus.results.shortCircuit.faultCurrents`
   - Backward-compatible aliases maintained

2. **Voltage Drop Properties**: New unified structure
   - Old: `voltageDrop.cumulativeDropPercent`
   - New: `loadFlow.voltageDrop.designPercent`
   - Both accessible for compatibility

3. **Arc Flash Location**: Now nested under shortCircuit
   - Old: `bus.results.arcFlash`
   - New: `bus.results.shortCircuit.arcFlash`
   - Both accessible for compatibility

## Standards Compliance

Version 3.3 maintains compliance with:

- **NEC 2023**
  - Article 210.19(A) - Branch Circuit Conductors (5% VD limit)
  - Article 215.2(A)(1) - Feeder Conductors (3% VD recommended)
  - Article 220 - Load Calculations
  - Article 430 - Motor Load Calculations

- **IEEE 141-1993 (Red Book)**
  - Section 3.4 - Voltage Drop Calculations
  - Table 3-5 - Diversity Factors
  - Combined system limit: 7%

- **IEEE 1584-2018**
  - Arc-Flash Hazard Calculations

- **NFPA 70E-2021**
  - PPE Category Requirements
  - Arc Flash Boundary

## User-Facing Features

### Enhanced System Report

Comprehensive report with:
- Executive Summary
- System Load Analysis (with diversity)
- Equipment Summary
- Critical Path Analysis
- Cost Impact Analysis
- Standards Compliance
- Maintenance Recommendations

### Demand & Diversity Analysis

Features #4 and #5 from Version 3.2, now enhanced:
- Level-1: Individual substation maximum demands
- Level-2: System-wide combined MD with diversity
- Clear reference for each percentage

### Bus Tie Analysis

- Compare baseline vs bus-tie-closed scenarios
- Highlight changes in fault current, VD, and arc flash
- Explain when IE increases without FC change

## Running Version 3.3

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
2. Create or load a project
3. Add buses and components
4. Run calculations
5. Export reports

### Browser Requirements

- Modern JavaScript support (ES6+)
- Local storage for auto-save
- File download capability for reports

## Module Loading Order

```
1. Foundation (constants, state, utils)
2. Utilities (formatters, calculation state)
3. Demand & Diversity Factors
4. Modal Manager
5. Analytics & Standards
6. Recommendation System
7. Bus/Component Managers
8. Calculation Layer
9. Arc Flash Analysis
10. Bus Tie Calculations
10.5. VERSION 3.3 MODULES ← NEW
   - resultsSchema.js
   - voltageDropEngine.js
   - arcFlashEngine.js
   - scenarioManager.js
11. Project Management
12. Application Entry (main.js)
```

## API Reference

### Results Schema

```javascript
// Create new results objects
const shortCircuit = createShortCircuitResults();
const loadFlow = createLoadFlowResults();
const projectResults = createProjectResults();

// Migrate v3.2 data to v3.3 format
migrateToUnifiedSchema(bus);

// Get values using helper functions
const designVD = getDesignVoltageDrop(bus);
const operVD = getOperatingVoltageDrop(bus, 'demand_diversity');
const incidentEnergy = getIncidentEnergy(bus);
const ppeCategory = getPPECategory(bus);
```

### Voltage Drop Engine

```javascript
// Calculate voltage drop with specific mode
const result = computeVoltageDrop(bus, 'design');
const result = computeVoltageDrop(bus, 'oper_demand');
const result = computeVoltageDrop(bus, 'oper_demand_df');

// Calculate all modes at once
const allModes = computeAllVoltageDropModes(bus);

// Quick compliance check
const isCompliant = isVoltageDropCompliant(bus);
```

### Arc Flash Engine

```javascript
// Calculate arc flash for a bus
const arcFlash = calculateArcFlashHazard(bus, options);

// Calculate all buses
const summary = calculateAllBusesArcFlash(buses, options);
```

### Scenario Manager

```javascript
// Create baseline scenario
const baseline = createBaselineScenario(buses, components);

// Create bus-tie closed scenario
const scenario = createBusTieClosedScenario('Tie Closed', ['busTie1']);

// Compare scenarios
const comparison = compareScenarios('base', 'tie_busTie1_closed');

// Generate report
const report = generateBusTieAnalysisReport(comparison, buses);
```

## Support

For issues or questions, please refer to the GitHub repository or contact the development team.

---

**Author**: Engr. B. P. Faraon (bfforex)  
**Version**: 3.3.0  
**Date**: December 2025  
**License**: MIT
