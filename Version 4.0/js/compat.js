/**
 * Compatibility shim - small helpers and safe aliases
 * - Defines missing helpers as safe no-op or small implementations
 * - Does not overwrite existing implementations
 * - Useful to reduce runtime exceptions when scripts load in different orders
 *
 * Load this after ui.js (if ui.js is authoritative) or before main.js;
 * it will only fill gaps and won't replace existing functions.
 *
 * Author: assistant (2025-10-31)
 */
(function () {
  'use strict';

  // getCalculationTimestamp: safe fallback
  if (typeof window.getCalculationTimestamp !== 'function') {
    window.getCalculationTimestamp = function () {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
  }

  // refreshDiagramIfNeeded: safe fallback (no-op if no diagram generator)
  if (typeof window.refreshDiagramIfNeeded !== 'function') {
    window.refreshDiagramIfNeeded = function (force = false) {
      try {
        if (typeof window.generateSystemDiagram === 'function') {
          window.generateSystemDiagram(force);
        } else {
          // no-op if diagram module missing
        }
      } catch (e) {
        console.warn('refreshDiagramIfNeeded error:', e);
      }
    };
  }

  // Ensure theme key normalization: prefer pwrsyspro_theme but tolerate legacy 'theme'
  try {
    if (!localStorage.getItem('pwrsyspro_theme') && localStorage.getItem('theme')) {
      localStorage.setItem('pwrsyspro_theme', localStorage.getItem('theme'));
    }
  } catch (e) {
    // ignore storage errors
  }

  // Minimal detection logging for duplicates of common functions
  ['toggleTheme', 'switchTab', 'initModalClickOutside'].forEach(name => {
    if (typeof window[name] === 'function') {
      console.log(`ℹ️ Compat: detected existing global function "${name}"`);
    }
  });

  console.log('✅ Compatibility shim loaded (js/compat.js)');
})();