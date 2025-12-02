# Version 3.3 Testing Documentation

## Test Cases for AG&P Industrial Yard

### Overview
This document describes the testing approach and verification results for Version 3.3
of PwrSysPro Short Circuit Analyzer, specifically targeting the AG&P Industrial Yard test case.

### Test Data Location
- **Project JSON**: `tests/AG&P Industrial Yard/AG_P_Industrial_Yard_2025-11-28.json`
- **Generated Reports**: `tests/AG&P Industrial Yard/*.txt`

---

## Test Case 1: Transformer Loading Consistency (XFMR6 / LCA1-4)

### Purpose
Verify that transformer loading calculations are consistent across:
- Load-flow module
- Voltage-drop module
- Demand/diversity calculations
- Per-bus reports

### Test Setup
- **Bus**: LCA1-4 (440V)
- **Transformer**: XFMR6 (1000 kVA, 13200V/440V)
- **Downstream Buses**: SH1-A16, SH1-B16, SH1-C16, SH1-D16

### Expected Values
| Parameter | Value | Source |
|-----------|-------|--------|
| Connected Load at LCA1-4 | 1734.12 A | Sum of SH1-A16 (413A) + SH1-B16 (423.97A) + SH1-C16 (443.65A) + SH1-D16 (453.5A) |
| Transformer FLC | 1312.16 A | (1000 kVA × 1000) / (√3 × 440V) |
| Loading Percentage | 132.2% | 1734.12A / 1312.16A × 100% |

### Verification Points
1. [ ] Load-flow report shows total current = 1734.12 A for LCA1-4
2. [ ] Voltage-drop report shows transformer secondary current = 1734.12 A
3. [ ] Transformer loading = 132.2% (exceeds 100% = OVERLOADED)
4. [ ] Per-bus report should show "❌ OVERLOADED TRANSFORMER IDENTIFIED"
5. [ ] System-Wide MD report shows LCA1-4 connected load = 1734.12 A (reflected to secondary)

### Fix Applied
- Updated `recommendationRules.js` TF-000 and TF-001B rules for improved transformer detection
- Updated `exportReport.js` to detect transformer overload as defense-in-depth

---

## Test Case 2: Voltage Drop Design vs Operating

### Purpose
Verify that voltage drop compliance uses Design VD (FLC-based), not Operating VD.

### Test Setup
- Any bus with load-flow and voltage-drop calculations

### Verification Points
1. [ ] VD report clearly labels "Design Voltage Drop (FLC – Sizing Basis)"
2. [ ] Operating VD (with demand/diversity) is labeled as "ESTIMATED OPERATING VOLTAGE DROP"
3. [ ] Compliance check is based on Design VD only
4. [ ] NEC 210.19, 215.2, and IEEE 141 references are included

### Standards Applied
- NEC 210.19(A) - Branch circuit voltage drop (informational note)
- NEC 215.2(A)(1) - Feeder voltage drop (informational note)
- IEEE 141-1993 Section 3.4 - Voltage regulation calculations

---

## Test Case 3: Short-Circuit & Arc-Flash Harmonization

### Purpose
Verify consistency of short-circuit and arc-flash values across reports.

### Verification Points
1. [ ] Short-circuit values in `_Short_Circuit_Calc.txt` match per-bus reports
2. [ ] Arc-flash incident energy values are consistent
3. [ ] PPE category recommendations match calculated incident energy
4. [ ] Arc-flash boundary calculations are consistent

---

## Test Case 4: System-Wide Maximum Demand

### Purpose
Verify that system-wide MD calculations are consistent with substation-level data.

### Verification Points
1. [ ] Level 1 substation MDs match bus-level load-flow/demand results
2. [ ] System-level connected currents at 13.2 kV match sum of reflected substation values
3. [ ] System diversity factor applied correctly per IEEE 141-1993

---

## Running Tests

### Manual Testing Steps

1. **Open the Application**
   ```
   Open Version 3.3/index.html in a web browser
   ```

2. **Load Test Data**
   - Click "Load Project"
   - Select `tests/AG&P Industrial Yard/AG_P_Industrial_Yard_2025-11-28.json`

3. **Run Calculations**
   - Navigate to LCA1-4 bus
   - Click "Calculate All" or calculate individual buses

4. **Generate Reports**
   - Export Load-flow report
   - Export Voltage-drop report
   - Export Per-bus report for LCA1-4
   - Export System-wide MD report

5. **Verify Results**
   - Compare generated reports against expected values in this document
   - Check browser console for any JS errors

### Automated Test (Future)
Consider adding automated tests using a JavaScript testing framework (e.g., Jest)
to verify calculation functions independently.

---

## Known Issues & Limitations

### Issue: Test Report Files May Be Stale
The text report files in `tests/AG&P Industrial Yard/` directory may have been generated
from older versions of the code. The JSON data file contains the authoritative test data.

### Limitation: Browser-Based Testing
Version 3.3 is a client-side web application, so testing requires running in a browser.
Consider implementing a headless browser test suite for CI/CD integration.

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-02 | 3.3.1 | Fixed transformer overload detection in recommendation rules |
| 2025-12-02 | 3.3.1 | Updated per-bus report to show transformer overload status |
| 2025-12-02 | 3.3.1 | Enhanced VD report with explicit Design VD compliance labeling |

---

## References

- IEEE 141-1993 "Red Book" - Recommended Practice for Electric Power Distribution
- IEEE C57.12.00 - Standard for Liquid-Immersed Distribution, Power, and Regulating Transformers
- IEEE C57.91 - Guide for Loading Mineral-Oil-Immersed Transformers
- IEEE 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations
- NFPA 70E-2021 - Standard for Electrical Safety in the Workplace
- NEC 2023 - National Electrical Code
