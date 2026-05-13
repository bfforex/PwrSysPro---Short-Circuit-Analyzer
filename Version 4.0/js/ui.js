// UI Module - Handles user interface updates and interactions
// Revised: 2025-10-31 12:09:53 UTC by copilot (defensive hardening, safer modal handling)

/**
 * Display bus calculation results
 * Enhanced: Complete recommendations integration with defensive checks
 */
function displayBusResults(bus, result, timestamp, recommendations = null) {
  try {
    const container = document.getElementById('resultsContainer');
    if (!container) {
      console.warn('displayBusResults: resultsContainer not found');
      return;
    }

    // Defensive bus/results shape handling
    const busName = (bus && (bus.name || bus.id)) || 'Unknown Bus';
    const method = result?.method || 'n/a';
    const ts = timestamp || (typeof window.getCalculationTimestamp === 'function' ? window.getCalculationTimestamp() : new Date().toLocaleString());

    // Try to generate recommendations if engine exists and none passed
    if (!recommendations) {
      if (typeof recommendationEngine !== 'undefined' && recommendationEngine && typeof recommendationEngine.analyzeBus === 'function') {
        try {
          recommendations = recommendationEngine.analyzeBus(bus) || [];
          console.log(`✅ Generated ${recommendations.length} recommendations for ${busName}`);
        } catch (error) {
          console.error('❌ Error generating recommendations:', error);
          recommendations = [];
        }
      } else {
        recommendations = [];
        if (typeof recommendationEngine === 'undefined') {
          console.warn('⚠️ recommendationEngine not available when displayBusResults called');
        }
      }
    }

    const getFaultSeverity = (current) => {
      if (current > 65) return '<span class="badge badge-danger">Very High</span>';
      if (current > 40) return '<span class="badge badge-warning">High</span>';
      if (current > 20) return '<span class="badge badge-info">Moderate</span>';
      return '<span class="badge badge-success">Normal</span>';
    };

    const getVDSeverity = (drop) => {
      if (drop > 7) return '<span class="badge badge-danger">Critical</span>';
      if (drop > 5) return '<span class="badge badge-warning">High</span>';
      if (drop > 3) return '<span class="badge badge-info">Moderate</span>';
      return '<span class="badge badge-success">Good</span>';
    };

    // Normalize result numeric display values with safe defaults
    const faultKA = Number(result?.faultCurrentKA ?? result?.faultCurrents?.threePhaseSym ?? 0);
    const asymKA = Number(result?.asymFaultCurrentKA ?? result?.faultCurrents?.threePhaseAsym ?? 0);
    const xrRatio = Number(result?.xrRatio ?? 0);
    const totalZ = Number(result?.totalZ ?? result?.totalImpedance?.magnitude ?? 0);

    let html = `
      <div class="results-section">
        <div class="results-header">
          <h2>📊 Fault Current Analysis Results</h2>
          <div class="results-meta">
            <span><strong>Bus:</strong> ${busName}</span>
            <span><strong>Voltage:</strong> ${bus?.voltage ?? 'n/a'} V</span>
            <span><strong>Method:</strong> ${method}</span>
            <span><strong>Calculated:</strong> ${ts}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${faultKA.toFixed(3)} kA</div>
            <div class="stat-label">Symmetrical Fault Current</div>
            ${getFaultSeverity(faultKA)}
          </div>
          <div class="stat-card">
            <div class="stat-value">${asymKA.toFixed(3)} kA</div>
            <div class="stat-label">Asymmetrical (Peak) Current</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${xrRatio.toFixed(2)}</div>
            <div class="stat-label">X/R Ratio</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalZ.toFixed(6)} Ω</div>
            <div class="stat-label">Total Impedance</div>
          </div>
        </div>
    `;

    if (result?.voltageDrop) {
      const vd = result.voltageDrop;
      html += `
        <div class="voltage-drop-section">
          <h3>💧 Voltage Drop Analysis</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${Number(vd.cumulativeDropPercent ?? 0).toFixed(3)}%</div>
              <div class="stat-label">Total Voltage Drop</div>
              ${getVDSeverity(Number(vd.cumulativeDropPercent ?? 0))}
            </div>
            <div class="stat-card">
              <div class="stat-value">${Number(vd.cumulativeDropVolts ?? 0).toFixed(2)} V</div>
              <div class="stat-label">Voltage Drop (Volts)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Number(vd.maxDropPercent ?? 0).toFixed(3)}%</div>
              <div class="stat-label">Max Single Component</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Array.isArray(vd.components) ? vd.components.length : 0}</div>
              <div class="stat-label">Components Analyzed</div>
            </div>
          </div>
        </div>
      `;
    }

    // Recommendations section
    html += `
      <div class="recommendations-section">
        <div class="recommendations-section-header">
          <h3>💡 Recommendations for This Bus</h3>
          ${recommendations.length > 0 ? 
            `<span class="rec-count">${recommendations.length} recommendation${recommendations.length !== 1 ? 's' : ''} found</span>` :
            `<span class="rec-count-ok">✅ All Clear</span>`
          }
        </div>

        <div id="busRecommendationsContainer">
          ${recommendations.length === 0 ? `
            <div class="alert alert-success">
              <strong>✅ Excellent!</strong>
              <p>No issues detected. This bus meets all IEEE standards and design criteria (based on current checks).</p>
            </div>
          ` : `
            <div id="busRecommendations">
              <div class="alert alert-info">Loading recommendations...</div>
            </div>
          `}
        </div>
      </div>

      <div class="button-group">
        <button class="btn btn-info" onclick="exportBusReport('${bus?.id ?? ''}')">📄 Export Full Report</button>
        <button class="btn btn-secondary" onclick="viewCalculationSteps('${bus?.id ?? ''}')">🔍 View Calculations</button>
        ${recommendations.length > 0 ? `<button class="btn btn-warning" onclick="exportBusRecommendations('${bus?.id ?? ''}')">📋 Export Recommendations</button>` : ''}
      </div>
    </div>
    `;

    container.innerHTML = html;

    // Render recommendations via recUI if available, otherwise leave the container info
    if (recommendations.length > 0) {
      setTimeout(() => {
        try {
          if (typeof recUI !== 'undefined' && recUI && typeof recUI.displayBusRecommendations === 'function') {
            recUI.displayBusRecommendations(bus?.id ?? '', 'busRecommendations');
            console.log('✅ Recommendations rendered successfully');
          } else {
            console.warn('recUI not available or missing displayBusRecommendations; skipping rich render');
            const recContainer = document.getElementById('busRecommendations');
            if (recContainer) {
              recContainer.innerHTML = '<div class="alert alert-warning">Recommendation UI not loaded; raw recommendations available for export.</div>';
            }
          }
        } catch (error) {
          console.error('❌ Error rendering recommendations:', error);
          const recContainer = document.getElementById('busRecommendations');
          if (recContainer) {
            recContainer.innerHTML = `
              <div class="alert alert-danger">
                <strong>⚠️ Error displaying recommendations</strong>
                <p>Recommendation UI module not loaded. Check console for details.</p>
                <p><small>${String(error?.message ?? error)}</small></p>
              </div>
            `;
          }
        }
      }, 100);
    }

    // Show detailed calculation steps
    if (result?.steps) {
      const calcSteps = document.getElementById('calculationSteps');
      if (calcSteps) {
        calcSteps.innerHTML = `<pre class="calculation-steps">${result.steps}</pre>`;
      }
    }
  } catch (outerErr) {
    console.error('displayBusResults outer error:', outerErr);
  }
}
window.displayBusResults = displayBusResults;

/**
 * Display system-wide recommendations
 */
function displaySystemRecommendations(systemReport) {
  try {
    const container = document.getElementById('recommendationsTabContent');
    if (!container) {
      console.error('❌ Recommendations tab content not found');
      return;
    }

    if (typeof recUI !== 'undefined' && recUI && typeof recUI.displaySystemRecommendations === 'function') {
      recUI.displaySystemRecommendations(systemReport, 'recommendationsTabContent');
    } else {
      console.error('❌ recUI.displaySystemRecommendations not available');
      container.innerHTML = `
        <div class="alert alert-danger">
          <strong>⚠️ Error</strong>
          <p>Recommendation UI not loaded. Please refresh the page.</p>
        </div>
      `;
    }
  } catch (e) {
    console.error('displaySystemRecommendations error:', e);
  }
}
window.displaySystemRecommendations = displaySystemRecommendations;

/**
 * View detailed calculation steps for a bus
 */
function viewCalculationSteps(busId) {
  try {
    if (!Array.isArray(window.buses)) {
      console.warn('viewCalculationSteps: buses array not available');
      switchTab(null, 'calculations');
      return;
    }
    const bus = buses.find(b => b.id === busId);
    if (bus && bus.results) {
      // You may want to show a dedicated calculations tab or modal
      switchTab(null, 'calculations');
      // If there is a dedicated UI for showing calculation steps, call it
      if (typeof window.showCalculationSteps === 'function') {
        try { window.showCalculationSteps(busId); } catch (e) { /* non-fatal */ }
      }
    } else {
      alert('No calculation results available for the selected bus.');
    }
  } catch (e) {
    console.error('viewCalculationSteps error:', e);
  }
}
window.viewCalculationSteps = viewCalculationSteps;

/**
 * Export recommendations for a specific bus
 */
function exportBusRecommendations(busId) {
  try {
    if (typeof recommendationEngine === 'undefined' || !recommendationEngine) {
      alert('Recommendation engine not available. Cannot export recommendations.');
      return;
    }

    // Support either filterByBus or analyzeBus
    let recommendations = [];
    if (typeof recommendationEngine.filterByBus === 'function') {
      recommendations = recommendationEngine.filterByBus(busId) || [];
    } else if (Array.isArray(window.recommendations)) {
      recommendations = (window.recommendations || []).filter(r => r.busId === busId);
    } else {
      try {
        recommendations = recommendationEngine.analyzeBus ? (recommendationEngine.analyzeBus(window.buses?.find(b => b.id === busId)) || []) : [];
      } catch (e) {
        console.warn('exportBusRecommendations fallback analyzeBus failed:', e);
        recommendations = [];
      }
    }

    if (!recommendations || recommendations.length === 0) {
      alert('No recommendations to export for this bus.');
      return;
    }

    const bus = (Array.isArray(window.buses) && window.buses.find(b => b.id === busId)) || { name: busId || 'bus' };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Bus_${String(bus.name).replace(/\s+/g, '_')}_Recommendations_${timestamp}.txt`;

    let content = `
${'='.repeat(100)}
BUS RECOMMENDATIONS REPORT
${'='.repeat(100)}

Project: ${document.getElementById('projectName')?.value || 'Untitled'}
Bus: ${bus.name}
Voltage: ${bus.voltage ?? 'n/a'} V
Generated: ${new Date().toLocaleString()}

SUMMARY
${'-'.repeat(100)}
Total Recommendations: ${recommendations.length}
Critical: ${recommendations.filter(r => (r.severity || '').toUpperCase() === 'CRITICAL').length}
High: ${recommendations.filter(r => (r.severity || '').toUpperCase() === 'HIGH').length}
Medium: ${recommendations.filter(r => (r.severity || '').toUpperCase() === 'MEDIUM').length}

DETAILED RECOMMENDATIONS
${'-'.repeat(100)}

${recommendations.map((rec, i) => `
${i + 1}. [${rec.severity || 'N/A'}] ${rec.name || rec.title || 'Recommendation'}
   Category: ${rec.category || 'N/A'}
   Priority: ${rec.priority || 'N/A'}
   
   Finding:
   ${rec.recommendation || rec.finding || 'N/A'}
   
   Required Action:
   ${rec.action || 'N/A'}
   
   Impact:
   ${rec.impact || 'N/A'}
   
   Cost: ${rec.cost || 'N/A'}
   Effort: ${rec.effort || 'N/A'}
   Standard: ${rec.standard || 'N/A'}
   
${'─'.repeat(100)}
`).join('\n')}

${'='.repeat(100)}
END OF REPORT
${'='.repeat(100)}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('exportBusRecommendations error:', e);
    alert('Failed to export recommendations. See console for details.');
  }
}
window.exportBusRecommendations = exportBusRecommendations;

/**
 * Add recommendations tab to the UI
 */
function addRecommendationsTab() {
  try {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;

    if (document.getElementById('recommendationsTabButton')) {
      const btn = document.getElementById('recommendationsTabButton');
      btn.style.display = 'block';
      return;
    }

    const tabButton = document.createElement('button');
    tabButton.id = 'recommendationsTabButton';
    tabButton.className = 'tab';
    tabButton.textContent = '💡 Recommendations';
    tabButton.onclick = (e) => switchTab(e, 'recommendations');
    tabsContainer.appendChild(tabButton);

    const contentArea = document.querySelector('.content-area') || document.body;
    if (!document.getElementById('recommendationsTab')) {
      const tabContent = document.createElement('div');
      tabContent.id = 'recommendationsTab';
      tabContent.className = 'tab-content';
      tabContent.innerHTML = '<div id="recommendationsTabContent"></div>';
      contentArea.appendChild(tabContent);
    }
  } catch (e) {
    console.error('addRecommendationsTab error:', e);
  }
}
window.addRecommendationsTab = addRecommendationsTab;

/**
 * Run system analytics manually
 */
function runSystemAnalytics() {
  try {
    const calculatedBuses = Array.isArray(window.buses) ? buses.filter(b => b.results) : [];
    if (calculatedBuses.length === 0) {
      alert('No calculated buses found. Please run calculations first.');
      return;
    }

    if (typeof recommendationEngine === 'undefined' || !recommendationEngine) {
      alert('Recommendation engine not loaded. Please refresh the page.');
      return;
    }

    const systemReport = typeof recommendationEngine.analyzeSystem === 'function' ? recommendationEngine.analyzeSystem(calculatedBuses) : null;
    if (systemReport) {
      displaySystemRecommendations(systemReport);
      addRecommendationsTab();
      switchTab(null, 'recommendations');
      console.log('📊 System Analytics Complete:', systemReport);
    } else {
      console.warn('runSystemAnalytics: analyzeSystem did not return a report');
    }
  } catch (e) {
    console.error('runSystemAnalytics error:', e);
    alert('System analytics failed. See console for details.');
  }
}
window.runSystemAnalytics = runSystemAnalytics;

/**
 * Prompt user to select a bus for export
 * Safer modal creation and cleanup; uses element-level handlers not window.onclick overwrite.
 */
function promptBusExport() {
  try {
    const calculatedBuses = Array.isArray(window.buses) ? buses.filter(b => b.results) : [];
    if (calculatedBuses.length === 0) {
      alert('No calculated buses available. Please run calculations first.');
      return;
    }

    // Build modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const innerHTML = `
      <div class="modal-content" role="document">
        <div class="modal-header">
          <h2>Select Bus to Export</h2>
          <button class="close-modal" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Select a bus to export its detailed report:</p>
          <div class="bus-selection-list">
            ${calculatedBuses.map(bus => `
              <div class="bus-selection-item" data-bus-id="${bus.id}" role="button" tabindex="0">
                  <span class="bus-icon">${typeof getBusIcon === 'function' ? getBusIcon(bus.type) : '🔌'}</span>
                  <span class="bus-name">${bus.name}</span>
                  <span class="bus-voltage">${bus.voltage ?? ''}V</span>
                  <span class="bus-fault">${(bus.results?.faultCurrents?.threePhaseSym ?? 0).toFixed(2)} kA</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
        </div>
      </div>
    `;

    modal.innerHTML = innerHTML;
    document.body.appendChild(modal);

    // Focus management
    const firstFocusable = modal.querySelector('button, [tabindex]');
    if (firstFocusable) firstFocusable.focus();

    // Handler to clean up modal
    const cleanup = () => {
      modal.removeEventListener('click', onOutsideClick);
      modal.querySelectorAll('.bus-selection-item').forEach(it => {
        it.removeEventListener('click', onSelect);
        it.removeEventListener('keydown', onKeySelect);
      });
      modal.querySelector('.close-modal')?.removeEventListener('click', onClose);
      modal.querySelector('.modal-cancel')?.removeEventListener('click', onClose);
      modal.remove();
    };

    function onClose(e) { e?.preventDefault(); cleanup(); }

    function onOutsideClick(e) {
      if (e.target === modal) cleanup();
    }

    function onSelect(e) {
      const busId = this.dataset.busId;
      try { exportBusReport(busId); } catch (err) { console.error('exportBusReport failed:', err); }
      cleanup();
    }

    function onKeySelect(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    }

    // Attach handlers
    modal.addEventListener('click', onOutsideClick);
    modal.querySelectorAll('.bus-selection-item').forEach(it => {
      it.addEventListener('click', onSelect);
      it.addEventListener('keydown', onKeySelect);
    });

    modal.querySelector('.close-modal')?.addEventListener('click', onClose);
    modal.querySelector('.modal-cancel')?.addEventListener('click', onClose);
  } catch (e) {
    console.error('promptBusExport error:', e);
    alert('Failed to open export dialog. See console for details.');
  }
}
window.promptBusExport = promptBusExport;

// Ensure exports to global scope (do not overwrite existing desired implementations)
window.displayBusResults = window.displayBusResults || displayBusResults;
window.viewCalculationSteps = window.viewCalculationSteps || viewCalculationSteps;
window.exportBusRecommendations = window.exportBusRecommendations || exportBusRecommendations;
window.runSystemAnalytics = window.runSystemAnalytics || runSystemAnalytics;
window.promptBusExport = window.promptBusExport || promptBusExport;

console.log('✅ ui.js loaded (defensive mode).');