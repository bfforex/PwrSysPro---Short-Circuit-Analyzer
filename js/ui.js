// UI Module - Handles user interface updates and interactions

/**
 * Toggle theme (dark/light mode)
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

/**
 * Switch between tabs
 */
function switchTab(event, tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (event) event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

/**
 * Display bus calculation results
 * Modified: 2025-10-27 15:05:16 UTC by bfforex
 * Enhanced: Complete recommendations integration with error handling
 */
function displayBusResults(bus, result, timestamp, recommendations = null) {
    const container = document.getElementById('resultsContainer');
    
    // If recommendations not passed, try to generate them
    if (!recommendations && typeof recommendationEngine !== 'undefined') {
        try {
            recommendations = recommendationEngine.analyzeBus(bus);
            console.log(`✅ Generated ${recommendations.length} recommendations for ${bus.name}`);
        } catch (error) {
            console.error('❌ Error generating recommendations:', error);
            recommendations = [];
        }
    } else if (!recommendations) {
        console.warn('⚠️ Recommendation engine not available');
        recommendations = [];
    }
    
    // Generate fault current severity badge
    const getFaultSeverity = (current) => {
        if (current > 65) return '<span class="badge badge-danger">Very High</span>';
        if (current > 40) return '<span class="badge badge-warning">High</span>';
        if (current > 20) return '<span class="badge badge-info">Moderate</span>';
        return '<span class="badge badge-success">Normal</span>';
    };

    // Generate voltage drop severity badge
    const getVDSeverity = (drop) => {
        if (drop > 7) return '<span class="badge badge-danger">Critical</span>';
        if (drop > 5) return '<span class="badge badge-warning">High</span>';
        if (drop > 3) return '<span class="badge badge-info">Moderate</span>';
        return '<span class="badge badge-success">Good</span>';
    };

    let html = `
        <div class="results-section">
            <div class="results-header">
                <h2>📊 Fault Current Analysis Results</h2>
                <div class="results-meta">
                    <span><strong>Bus:</strong> ${bus.name}</span>
                    <span><strong>Voltage:</strong> ${bus.voltage} V</span>
                    <span><strong>Method:</strong> ${result.method}</span>
                    <span><strong>Calculated:</strong> ${timestamp}</span>
                </div>
            </div>

            <!-- Fault Current Results -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${result.faultCurrentKA.toFixed(3)} kA</div>
                    <div class="stat-label">Symmetrical Fault Current</div>
                    ${getFaultSeverity(result.faultCurrentKA)}
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.asymFaultCurrentKA.toFixed(3)} kA</div>
                    <div class="stat-label">Asymmetrical (Peak) Current</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.xrRatio.toFixed(2)}</div>
                    <div class="stat-label">X/R Ratio</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.totalZ.toFixed(6)} Ω</div>
                    <div class="stat-label">Total Impedance</div>
                </div>
            </div>

            <!-- Voltage Drop Results -->
            ${result.voltageDrop ? `
                <div class="voltage-drop-section">
                    <h3>💧 Voltage Drop Analysis</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.cumulativeDropPercent.toFixed(3)}%</div>
                            <div class="stat-label">Total Voltage Drop</div>
                            ${getVDSeverity(result.voltageDrop.cumulativeDropPercent)}
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.cumulativeDropVolts.toFixed(2)} V</div>
                            <div class="stat-label">Voltage Drop (Volts)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.maxDropPercent.toFixed(3)}%</div>
                            <div class="stat-label">Max Single Component</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.components.length}</div>
                            <div class="stat-label">Components Analyzed</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Recommendations Section -->
            <div class="recommendations-section">
                <div class="recommendations-section-header">
                    <h3>💡 Recommendations for This Bus</h3>
                    ${recommendations.length > 0 ? 
                        `<span class="rec-count">${recommendations.length} recommendation${recommendations.length !== 1 ? 's' : ''} found</span>` :
                        `<span class="rec-count-ok">✅ All Clear</span>`
                    }
                </div>
                
                <!-- Recommendations Container -->
                <div id="busRecommendationsContainer">
                    ${recommendations.length === 0 ? `
                        <div class="alert alert-success">
                            <strong>✅ Excellent!</strong>
                            <p>No issues detected. This bus meets all IEEE standards and design criteria.</p>
                        </div>
                    ` : `
                        <div id="busRecommendations">
                            <!-- Recommendations will be rendered here -->
                            <div class="alert alert-info">Loading recommendations...</div>
                        </div>
                    `}
                </div>
            </div>

            <!-- Export Buttons -->
            <div class="button-group">
                <button class="btn btn-info" onclick="exportBusReport('${bus.id}')">
                    📄 Export Full Report
                </button>
                <button class="btn btn-secondary" onclick="viewCalculationSteps('${bus.id}')">
                    🔍 View Calculations
                </button>
                ${recommendations.length > 0 ? `
                    <button class="btn btn-warning" onclick="exportBusRecommendations('${bus.id}')">
                        📋 Export Recommendations
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Render recommendations if available
    if (recommendations.length > 0) {
        console.log('🔄 Rendering recommendations...');
        setTimeout(() => {
            try {
                if (typeof recUI !== 'undefined' && typeof recUI.displayBusRecommendations === 'function') {
                    recUI.displayBusRecommendations(bus.id, 'busRecommendations');
                    console.log('✅ Recommendations rendered successfully');
                } else {
                    throw new Error('recUI not available or displayBusRecommendations not a function');
                }
            } catch (error) {
                console.error('❌ Error rendering recommendations:', error);
                const recContainer = document.getElementById('busRecommendations');
                if (recContainer) {
                    recContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>⚠️ Error displaying recommendations</strong>
                            <p>Recommendation UI module not loaded. Check console for details.</p>
                            <p><small>${error.message}</small></p>
                        </div>
                    `;
                }
            }
        }, 100);
    }

    // Show detailed calculation steps
    if (result.steps) {
        const calcSteps = document.getElementById('calculationSteps');
        if (calcSteps) {
            calcSteps.innerHTML = `<pre class="calculation-steps">${result.steps}</pre>`;
        }
    }
}


/**
 * Display system-wide recommendations
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function displaySystemRecommendations(systemReport) {
    const container = document.getElementById('recommendationsTabContent');
    if (!container) {
        console.error('❌ Recommendations tab content not found');
        return;
    }
    
    if (typeof recUI !== 'undefined' && typeof recUI.displaySystemRecommendations === 'function') {
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
}

/**
 * View detailed calculation steps for a bus
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function viewCalculationSteps(busId) {
    const bus = buses.find(b => b.id === busId);
    if (bus && bus.results) {
        switchTab(null, 'calculations');
    }
}

/**
 * Export recommendations for a specific bus
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function exportBusRecommendations(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    
    const recommendations = recommendationEngine.filterByBus(busId);
    if (recommendations.length === 0) {
        alert('No recommendations to export for this bus.');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Bus_${bus.name.replace(/\s+/g, '_')}_Recommendations_${timestamp}.txt`;
    
    let content = `
${'='.repeat(100)}
BUS RECOMMENDATIONS REPORT
${'='.repeat(100)}

Project: ${document.getElementById('projectName').value || 'Untitled'}
Bus: ${bus.name}
Voltage: ${bus.voltage} V
Generated: ${new Date().toLocaleString()}

SUMMARY
${'-'.repeat(100)}
Total Recommendations: ${recommendations.length}
Critical: ${recommendations.filter(r => r.severity === 'CRITICAL').length}
High: ${recommendations.filter(r => r.severity === 'HIGH').length}
Medium: ${recommendations.filter(r => r.severity === 'MEDIUM').length}

DETAILED RECOMMENDATIONS
${'-'.repeat(100)}

${recommendations.map((rec, i) => `
${i + 1}. [${rec.severity}] ${rec.name}
   Category: ${rec.category}
   Priority: ${rec.priority}
   
   Finding:
   ${rec.recommendation}
   
   Required Action:
   ${rec.action}
   
   Impact:
   ${rec.impact}
   
   Cost: ${rec.cost}
   Effort: ${rec.effort}
   Standard: ${rec.standard}
   
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
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Add recommendations tab to the UI
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function addRecommendationsTab() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;
    
    // Check if tab already exists
    if (document.getElementById('recommendationsTabButton')) {
        const btn = document.getElementById('recommendationsTabButton');
        btn.style.display = 'block';
        return;
    }
    
    // Add tab button
    const tabButton = document.createElement('button');
    tabButton.id = 'recommendationsTabButton';
    tabButton.className = 'tab';
    tabButton.textContent = '💡 Recommendations';
    tabButton.onclick = (e) => switchTab(e, 'recommendations');
    tabsContainer.appendChild(tabButton);
    
    // Add tab content container if not exists
    const contentArea = document.querySelector('.content-area');
    if (!document.getElementById('recommendationsTab')) {
        const tabContent = document.createElement('div');
        tabContent.id = 'recommendationsTab';
        tabContent.className = 'tab-content';
        tabContent.innerHTML = '<div id="recommendationsTabContent"></div>';
        contentArea.appendChild(tabContent);
    }
}

/**
 * Run system analytics manually
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function runSystemAnalytics() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculated buses found. Please run calculations first.');
        return;
    }
    
    if (typeof recommendationEngine === 'undefined') {
        alert('Recommendation engine not loaded. Please refresh the page.');
        return;
    }
    
    const systemReport = recommendationEngine.analyzeSystem(calculatedBuses);
    displaySystemRecommendations(systemReport);
    addRecommendationsTab();
    switchTab(null, 'recommendations');
    
    console.log('📊 System Analytics Complete:', systemReport);
}

/**
 * Prompt user to select a bus for export
 * Added: 2025-10-27 15:05:16 UTC by bfforex
 */
function promptBusExport() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculated buses available. Please run calculations first.');
        return;
    }
    
    // Create modal for bus selection
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Select Bus to Export</h2>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <p>Select a bus to export its detailed report:</p>
                <div class="bus-selection-list">
                    ${calculatedBuses.map(bus => `
                        <div class="bus-selection-item" onclick="exportBusReport('${bus.id}'); this.closest('.modal').remove();">
                            <span class="bus-icon">${getBusIcon(bus.type)}</span>
                            <span class="bus-name">${bus.name}</span>
                            <span class="bus-voltage">${bus.voltage}V</span>
                            <span class="bus-fault">${bus.results.faultCurrents.threePhaseSym.toFixed(2)} kA</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Export functions to global scope
window.viewCalculationSteps = viewCalculationSteps;
window.exportBusRecommendations = exportBusRecommendations;
window.runSystemAnalytics = runSystemAnalytics;
window.promptBusExport = promptBusExport;

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Close modal when clicking outside
 */
function initModalClickOutside() {
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
}