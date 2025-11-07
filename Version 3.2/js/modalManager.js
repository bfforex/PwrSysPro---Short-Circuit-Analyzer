/**
 * Modal Manager Module
 * Centralized modal management with WCAG 2.1 Level AA compliance
 * Fixed: store and remove focus-trap handler reference (prevent leaked listeners)
 *
 * Author: bfforex (updated 2025-10-31 by assistant)
 */

(function () {
  'use strict';

  function openModal(modalId, callback = null) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal ${modalId} not found`);
      return;
    }

    // Store currently focused element to return focus later
    modal.dataset.previousFocus = document.activeElement?.id || '';

    // Show modal
    modal.style.display = 'block';
    modal.removeAttribute('aria-hidden');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    // Disable background scroll
    document.body.style.overflow = 'hidden';

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Focus first element after a brief delay
      setTimeout(() => {
        try { firstFocusable.focus(); } catch (e) { /* ignore */ }
      }, 100);

      // Setup focus trap (store reference on the modal element for cleanup)
      const trapFocus = function (e) {
        if (e.key === 'Tab') {
          if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstFocusable) {
              lastFocusable.focus();
              e.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastFocusable) {
              firstFocusable.focus();
              e.preventDefault();
            }
          }
        }

        // Close on Escape
        if (e.key === 'Escape') {
          closeModal(modalId);
        }
      };

      // Attach and save the function reference (do NOT use dataset string for handler)
      modal._trapFocusHandler = trapFocus;
      modal.addEventListener('keydown', trapFocus);
    }

    // Execute callback if provided
    if (callback && typeof callback === 'function') {
      try { callback(); } catch (e) { console.warn('Modal open callback error:', e); }
    }

    console.log(`✅ Modal opened: ${modalId} (accessible)`);
  }

  function closeModal(modalId, callback = null) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal ${modalId} not found`);
      return;
    }

    // Hide modal
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');

    // Re-enable background scroll
    document.body.style.overflow = '';

    // Return focus to previously focused element
    const previousFocusId = modal.dataset.previousFocus;
    if (previousFocusId) {
      const previousElement = document.getElementById(previousFocusId);
      if (previousElement) {
        setTimeout(() => {
          try { previousElement.focus(); } catch (e) { /* ignore */ }
        }, 100);
      }
    }

    // Clean up focus trap handler (if attached)
    try {
      if (modal._trapFocusHandler && typeof modal._trapFocusHandler === 'function') {
        modal.removeEventListener('keydown', modal._trapFocusHandler);
        delete modal._trapFocusHandler;
      }
    } catch (e) {
      console.warn('Error removing modal trap focus handler:', e);
    }

    // Remove stored dataset keys
    delete modal.dataset.previousFocus;
    delete modal.dataset.trapFocusHandler;

    // Execute callback if provided
    if (callback && typeof callback === 'function') {
      try { callback(); } catch (e) { console.warn('Modal close callback error:', e); }
    }

    console.log(`✅ Modal closed: ${modalId}`);
  }

  function initializeModals() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // Set initial aria-hidden
      if (modal.style.display !== 'block') {
        modal.setAttribute('aria-hidden', 'true');
      }

      // Click outside to close (delegated on the modal element)
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });

      // Find and setup close buttons (supports data-close-modal and close-modal class)
      const closeButtons = modal.querySelectorAll('[data-close-modal], .close-modal, .modal-cancel');
      closeButtons.forEach(button => {
        button.addEventListener('click', function () {
          closeModal(modal.id);
        });
      });
    });

    console.log(`✅ Initialized ${modals.length} modals with accessibility features`);
  }

  function showModalLoading(modalId, message = 'Loading...') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'modal-loading-overlay';
    loadingOverlay.setAttribute('role', 'alert');
    loadingOverlay.setAttribute('aria-live', 'polite');
    loadingOverlay.innerHTML = `
      <div class="modal-loading-spinner"></div>
      <div class="modal-loading-text">${message}</div>
    `;

    modal.appendChild(loadingOverlay);
  }

  function hideModalLoading(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const loadingOverlay = modal.querySelector('.modal-loading-overlay');
    if (loadingOverlay) loadingOverlay.remove();
  }

  function showModalError(modalId, message) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'modal-error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.textContent = message;

    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
      modalBody.insertBefore(errorDiv, modalBody.firstChild);
      setTimeout(() => { errorDiv.remove(); }, 5000);
    }
  }

  function clearModalErrors(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const errors = modal.querySelectorAll('.modal-error-message');
    errors.forEach(e => e.remove());
  }

  document.addEventListener('DOMContentLoaded', function () {
    initializeModals();
  });

  // Export functions
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.initializeModals = initializeModals;
  window.showModalLoading = showModalLoading;
  window.hideModalLoading = hideModalLoading;
  window.showModalError = showModalError;
  window.clearModalErrors = clearModalErrors;

  console.log('✅ Modal Manager loaded (focus-trap cleanup enabled)');
})();