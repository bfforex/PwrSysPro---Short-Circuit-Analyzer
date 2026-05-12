/**
 * All-Bus SCC Button Injector v2
 * Added: 2026-05-08 by M365 Copilot
 *
 * Fixes case where buttons only appear after manually running injectAllBusSccButtons()
 * in Console. This version retries until displayCalculationResults and #resultsContainer
 * exist, then injects automatically after each result-card render.
 *
 * Load order recommendation:
 * - after exportAllBusShortCircuitReport.js
 * - preferably last among calculation/report scripts
 */
(function installAllBusSccButtonInjectorV2(global) {
 'use strict';

 const MAX_INSTALL_ATTEMPTS = 60;
 const RETRY_DELAY_MS = 250;
 let installAttempts = 0;

 function getButtonHtml() {
  return `
   <div class="all-bus-scc-actions" style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
    <button type="button" class="btn btn-secondary" data-action="all-bus-scc-steps">📚 All-Bus SCC Steps Report</button>
    <button type="button" class="btn btn-secondary" data-action="export-all-bus-scc-steps">📄 Export All-Bus SCC Steps</button>
   </div>
  `;
 }

 function injectButtons() {
  const container = document.getElementById('resultsContainer');
  if (!container) return false;
  if (container.querySelector('[data-action="all-bus-scc-steps"]')) return true;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = getButtonHtml().trim();
  const buttons = wrapper.firstElementChild;
  if (!buttons) return false;

  const selectedBusShortCircuitStepsButton = container.querySelector('[data-action="view-steps"][data-calc="shortcircuit"]');
  if (selectedBusShortCircuitStepsButton) {
   const parent = selectedBusShortCircuitStepsButton.parentElement;
   if (parent) parent.insertAdjacentElement('afterend', buttons);
   else selectedBusShortCircuitStepsButton.insertAdjacentElement('afterend', buttons);
   return true;
  }

  const shortCircuitPanel = container.querySelector('#shortcircuit-content, [id*="shortcircuit"], [data-calc-type="shortcircuit"]');
  if (shortCircuitPanel) {
   shortCircuitPanel.appendChild(buttons);
   return true;
  }

  container.appendChild(buttons);
  return true;
 }

 function scheduleInjection() {
  const runInject = () => injectButtons();
  if (typeof requestAnimationFrame === 'function') {
   requestAnimationFrame(runInject);
   requestAnimationFrame(() => requestAnimationFrame(runInject));
  } else {
   setTimeout(runInject, 0);
   setTimeout(runInject, 100);
  }
 }

 function installDisplayCalculationResultsWrapper() {
  const original = global.displayCalculationResults;
  if (typeof original !== 'function') {
   installAttempts += 1;
   if (installAttempts <= MAX_INSTALL_ATTEMPTS) {
    setTimeout(installDisplayCalculationResultsWrapper, RETRY_DELAY_MS);
   } else {
    console.warn('⚠️ All-Bus SCC Button Injector: displayCalculationResults not found after retry window. Buttons can still be injected manually using injectAllBusSccButtons().');
   }
   return;
  }

  if (original.__allBusSccButtonInjectorWrappedV2) {
   scheduleInjection();
   return;
  }

  const wrapped = function wrappedDisplayCalculationResults(...args) {
   const result = original.apply(this, args);
   scheduleInjection();
   return result;
  };
  wrapped.__allBusSccButtonInjectorWrappedV2 = true;
  global.displayCalculationResults = wrapped;
  console.log('✅ All-Bus SCC Button Injector v2 wrapped displayCalculationResults');
  scheduleInjection();
 }

 function installActionHandler() {
  if (document.__allBusSccButtonInjectorV2ActionHandler) return;
  document.addEventListener('click', event => {
   const button = event.target?.closest?.('[data-action]');
   if (!button) return;

   const action = button.getAttribute('data-action');
   if (action === 'all-bus-scc-steps') {
    event.preventDefault();
    if (typeof global.showAllBusShortCircuitReport === 'function') {
     global.showAllBusShortCircuitReport();
    } else {
     alert('All-Bus SCC report function is not loaded. Check exportAllBusShortCircuitReport.js script order.');
    }
   }

   if (action === 'export-all-bus-scc-steps') {
    event.preventDefault();
    if (typeof global.exportAllBusShortCircuitStepsReport === 'function') {
     global.exportAllBusShortCircuitStepsReport();
    } else {
     alert('All-Bus SCC export function is not loaded. Check exportAllBusShortCircuitReport.js script order.');
    }
   }
  });
  document.__allBusSccButtonInjectorV2ActionHandler = true;
 }

 function observeResultsContainer() {
  if (document.__allBusSccButtonInjectorV2Observer) return;
  const observer = new MutationObserver(() => injectButtons());
  observer.observe(document.body, { childList: true, subtree: true });
  document.__allBusSccButtonInjectorV2Observer = observer;
 }

 global.injectAllBusSccButtons = injectButtons;

 installActionHandler();
 installDisplayCalculationResultsWrapper();
 if (typeof MutationObserver !== 'undefined') observeResultsContainer();

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleInjection);
 } else {
  scheduleInjection();
 }

 console.log('✅ All-Bus SCC Button Injector v2 loaded');
 console.log(' - retries until displayCalculationResults is available');
 console.log(' - injectAllBusSccButtons(): READY');
})(typeof window !== 'undefined' ? window : globalThis);
