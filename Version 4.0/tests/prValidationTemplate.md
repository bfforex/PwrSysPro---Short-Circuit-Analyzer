# PR Validation Template (Mandatory)

> Every PR must copy this template into `Version 4.0/tests/pr-validation/PR-XX-validation.md`, fill all fields, and ensure every item below is PASS before approval.

## 1) Reference Test Cases

- [ ] TC01 — IEEE 141 Simple Radial (expected 20.1 kA ±5%) | Actual: ______
- [ ] TC02 — NEC Table 9 Voltage Drop (expected 1.47% ±10%) | Actual: ______
- [ ] TC03 — IEEE 1584 Arc Flash (expected 8.5 cal/cm² ±20%, PPE Cat 2) | Actual: ______
- [ ] TC04 — IEEE 141 Motor Contribution (expected 1.34 kA ±10%, FLC 240A ±5%) | Actual: ______
- [ ] TC05 — Asymmetrical Fault (expected MF 1.152 ±2%, asym 23.04 kA ±3%) | Actual: ______
- [ ] TC06 — Sequence Fault Types (expected L-L 17.4kA ±5%, ratio 0.866 ±2%) | Actual: ______

## 2) Golden Snapshot Comparison

- [ ] Zero mismatches above 0.1% tolerance (`GoldenSnapshot.compare(..., 0.001)`)
- Golden snapshot file used: ______
- Mismatch count (must be 0): ______

## 3) CalculationState Integrity

- [ ] `CalculationState.store()` and `CalculationState.get()` return matching values
- [ ] `CalculationState.has('shortCircuit') === true` after storing
- [ ] Hash verification checked (`CalculationState.getHash()` / `CalculationState.verify()`)

## 4) Module Dependency Check

- [ ] `checkModuleDependencies()` executed
- [ ] `result.success === true`
- [ ] `result.missing.length === 0`

## 5) UI Smoke Tests

- [ ] Add bus
- [ ] Add component
- [ ] Run calculations
- [ ] Results populate in UI
- [ ] Export report
- [ ] Save project
- [ ] Reload project
- [ ] Theme toggle (dark)
- [ ] Theme toggle (light)

## 6) window.* Global API Continuity

- [ ] `calculateShortCircuit` available
- [ ] `calculateVoltageDrop` available
- [ ] `calculateLoadFlow` available
- [ ] `calculateAllBuses` available
- [ ] `addComponent` available
- [ ] `editComponent` available
- [ ] `deleteComponent` available
- [ ] `exportEnhancedSystemReport` available

## 7) Agent Sign-off

- [ ] I confirm no legacy feature was removed
- [ ] I confirm no calculation path was silently changed without validation evidence
- [ ] I confirm this PR is safe to merge under zero-regression policy

## 8) Final Approval Requirement

- [ ] All sections above are complete and PASS
- [ ] Validation evidence is attached in this PR
- [ ] Reviewer verified checklist before approval
