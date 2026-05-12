/*
 * Lightweight browser-side assertion runner for engineering reference checks.
 * Keeps all results in-memory and prints a concise summary for PR validation.
 */
window.TestRunner = {
  results: [],
  passed: 0,
  failed: 0,

  assertNumeric(label, actual, expected, toleranceFraction) {
    const safeExpected = Number(expected);
    const safeActual = Number(actual);
    const tolerance = Number(toleranceFraction);

    const denominator = safeExpected === 0 ? 1 : Math.abs(safeExpected);
    const deviationFraction = Math.abs(safeActual - safeExpected) / denominator;
    const pass = Number.isFinite(safeActual) && Number.isFinite(safeExpected) && deviationFraction <= tolerance;

    this.results.push({
      type: 'numeric',
      label,
      expected: safeExpected,
      actual: safeActual,
      tolerance,
      deviationFraction,
      pass
    });

    pass ? this.passed++ : this.failed++;
    return pass;
  },

  assertEqual(label, actual, expected) {
    const pass = actual === expected;

    this.results.push({
      type: 'equality',
      label,
      expected,
      actual,
      pass
    });

    pass ? this.passed++ : this.failed++;
    return pass;
  },

  runCase(testCase, actualResults) {
    if (!testCase || !testCase.expected) {
      throw new Error('Invalid test case payload. Expected shape: { id, expected }');
    }

    Object.entries(testCase.expected).forEach(([metric, expectedConfig]) => {
      const label = `${testCase.id} ${metric}`;
      const actualValue = actualResults ? actualResults[metric] : undefined;

      if (typeof expectedConfig.value === 'number') {
        this.assertNumeric(label, actualValue, expectedConfig.value, expectedConfig.tolerance);
      } else {
        this.assertEqual(label, actualValue, expectedConfig.value);
      }
    });
  },

  summary() {
    console.log(`\n✅ TestRunner Summary: ${this.passed} passed, ${this.failed} failed`);

    const failures = this.results.filter(result => !result.pass);
    if (failures.length > 0) {
      console.log('❌ Failed assertions:');
      failures.forEach((failure) => {
        const deviation = typeof failure.deviationFraction === 'number'
          ? ` (deviation ${(failure.deviationFraction * 100).toFixed(2)}%)`
          : '';
        console.log(` - ${failure.label}: expected=${failure.expected}, actual=${failure.actual}${deviation}`);
      });
    }

    return {
      passed: this.passed,
      failed: this.failed,
      results: this.results
    };
  },

  reset() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }
};
