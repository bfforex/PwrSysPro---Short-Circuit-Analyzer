const path = require('path');
const { test, expect } = require('@playwright/test');

const appFilePath = path.resolve(__dirname, '../../index.html');
const appUrl = `file://${appFilePath}`;

// Shared helper so each test loads a clean app instance from the local static file.
async function openApp(page) {
  await page.goto(appUrl, { waitUntil: 'load' });
}

test('app loads — all required globals present', async ({ page }) => {
  const consoleErrors = [];

  // Capture runtime console errors so startup regressions are visible in CI.
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore resource fetch failures from remote CDN assets when running via file:// in CI.
      if (text.includes('Failed to load resource')) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  await openApp(page);

  // Core global APIs should become available within startup timeout.
  await page.waitForFunction(() => typeof window.calculateShortCircuit === 'function', { timeout: 15000 });
  await page.waitForFunction(() => typeof window.calculateVoltageDrop === 'function', { timeout: 15000 });
  await page.waitForFunction(() => typeof window.addComponent === 'function', { timeout: 15000 });

  expect(consoleErrors).toEqual([]);
});

test('module dependency check — checkModuleDependencies() passes', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => window.checkModuleDependencies());

  expect(result.success).toBe(true);
  expect(Array.isArray(result.missing)).toBe(true);
  expect(result.missing.length).toBe(0);
});

test('global API continuity — all window.* exports present', async ({ page }) => {
  await openApp(page);

  const apiState = await page.evaluate(() => ({
    calculateShortCircuit: typeof window.calculateShortCircuit,
    calculateVoltageDrop: typeof window.calculateVoltageDrop,
    calculateLoadFlow: typeof window.calculateLoadFlow,
    calculateAllBuses: typeof window.calculateAllBuses,
    addComponent: typeof window.addComponent,
    editComponent: typeof window.editComponent,
    deleteComponent: typeof window.deleteComponent,
    exportEnhancedSystemReport: typeof window.exportEnhancedSystemReport,
    saveProject: typeof window.saveProject,
    loadProject: typeof window.loadProject,
    busesIsArray: Array.isArray(window.buses),
    componentsIsArray: Array.isArray(window.components)
  }));

  expect(apiState.calculateShortCircuit).toBe('function');
  expect(apiState.calculateVoltageDrop).toBe('function');
  expect(apiState.calculateLoadFlow).toBe('function');
  expect(apiState.calculateAllBuses).toBe('function');
  expect(apiState.addComponent).toBe('function');
  expect(apiState.editComponent).toBe('function');
  expect(apiState.deleteComponent).toBe('function');
  expect(apiState.exportEnhancedSystemReport).toBe('function');
  expect(apiState.saveProject).toBe('function');
  expect(apiState.loadProject).toBe('function');
  expect(apiState.busesIsArray).toBe(true);
  expect(apiState.componentsIsArray).toBe(true);
});

test('CalculationState module — store and retrieve integrity', async ({ page }) => {
  await openApp(page);

  const payload = await page.evaluate(() => {
    window.CalculationState.store('shortCircuit', { test: 123, value: 456 }, 'TEST-BUS-001');
    return {
      retrieved: window.CalculationState.get('shortCircuit'),
      hasValue: window.CalculationState.has('shortCircuit')
    };
  });

  expect(payload.retrieved).toEqual({ test: 123, value: 456 });
  expect(payload.hasValue).toBe(true);
});

test('localStorage save and reload — project round-trip', async ({ page }) => {
  await openApp(page);

  const restored = await page.evaluate(async () => {
    window.confirm = () => true;

    window.buses = [{ id: 'RT-001', name: 'Test', type: 'source', voltage: 480 }];

    if (typeof window.autoSaveToLocalStorage === 'function') {
      window.autoSaveToLocalStorage();
    } else if (typeof window.autoSave === 'function') {
      window.autoSave();
    } else if (typeof window.scheduleAutoSave === 'function') {
      window.scheduleAutoSave();
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    window.buses = [];
    const loaded = typeof window.loadAutoSavedProject === 'function' ? window.loadAutoSavedProject() : false;

    return {
      loaded,
      firstBusId: Array.isArray(window.buses) && window.buses[0] ? window.buses[0].id : null
    };
  });

  expect(restored.loaded).toBe(true);
  expect(restored.firstBusId).toBe('RT-001');
});

test('theme toggle — dark mode applies without errors', async ({ page }) => {
  await openApp(page);

  const themes = await page.evaluate(() => {
    window.toggleTheme();
    const darkTheme = document.documentElement.getAttribute('data-theme');
    window.toggleTheme();
    const lightTheme = document.documentElement.getAttribute('data-theme');
    return { darkTheme, lightTheme };
  });

  expect(themes.darkTheme).toBe('dark');
  expect(themes.lightTheme).toBe('light');
});

test('tab switching — switchTab resolves as global and activates tab content', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    // switchTab must be a global function (inline HTML handlers rely on it)
    if (typeof window.switchTab !== 'function') return { error: 'switchTab not a function' };

    window.switchTab(null, 'results');
    const resultsActive = document.getElementById('resultsTab')?.classList.contains('active');

    window.switchTab(null, 'buses');
    const busesActive = document.getElementById('busesTab')?.classList.contains('active');

    return { resultsActive, busesActive };
  });

  expect(result.error).toBeUndefined();
  expect(result.resultsActive).toBe(true);
  expect(result.busesActive).toBe(true);
});

test('golden snapshot — GoldenSnapshot module available and compare returns structure', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    if (typeof window.GoldenSnapshot !== 'object' || window.GoldenSnapshot === null) {
      return { error: 'GoldenSnapshot not available' };
    }
    if (typeof window.GoldenSnapshot.compare !== 'function') {
      return { error: 'GoldenSnapshot.compare not a function' };
    }
    // Compare against an empty snapshot — should return the standard result shape
    const outcome = window.GoldenSnapshot.compare({ buses: [] });
    return {
      hasPassed: typeof outcome.passed === 'boolean',
      hasFailed: typeof outcome.failed === 'number',
      hasMismatches: Array.isArray(outcome.mismatches)
    };
  });

  expect(result.error).toBeUndefined();
  expect(result.hasPassed).toBe(true);
  expect(result.hasFailed).toBe(true);
  expect(result.hasMismatches).toBe(true);
});

test.skip('TC01 reference — 3-phase fault current sanity check', async () => {
  // Placeholder only: requires stable test-data loading API to seed full network model.
  // TODO: Enable once standard test project loading API is finalized. Expected range: 19.1–21.1 kA.
});
