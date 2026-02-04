/**
 * Recommendation UI Module
 * Handles display and interaction of recommendations
 * 
 * @author bfforex
 * @date 2025-10-27
 * @version 1.0.0
 */

class RecommendationUI {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'priority';
        this.expandedRecommendations = new Set();
        
        logger.info('Recommendation UI initialized');
    }

    /**
     * Display recommendations for a single bus
     * @param {String} busId - Bus identifier
     * @param {String} containerId - HTML container element ID
     */
    displayBusRecommendations(busId, containerId = 'busRecommendations') {
        const container = document.getElementById(containerId);
        if (!container) {
            logger.error(`Container ${containerId} not found in DOM`);
            return;
        }

        const recommendations = recommendationEngine.filterByBus(busId);
        
        logger.info(`Displaying ${recommendations.length} recommendations for bus ${busId}`);
        
        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <strong>✅ All Clear!</strong>
                    <p>No recommendations for this bus. System appears properly designed within IEEE standards.</p>
                </div>
            `;
            return;
        }

        const html = this._generateRecommendationsHTML(recommendations, 'bus');
        container.innerHTML = html;
        this._attachEventListeners();
    }

    /**
     * Display system-wide recommendations summary
     * @param {Object} systemReport - Report from recommendationEngine.analyzeSystem()
     * @param {String} containerId - HTML container element ID
     */
    displaySystemRecommendations(systemReport, containerId = 'systemRecommendations') {
        const container = document.getElementById(containerId);
        if (!container) {
            logger.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="recommendations-header">
                <h2>🔍 System Analysis & Recommendations</h2>
                <p class="timestamp">Generated: ${new Date(systemReport.timestamp).toLocaleString()}</p>
            </div>

            <!-- Summary Statistics -->
            <div class="recommendation-stats">
                ${this._generateStatsCards(systemReport)}
            </div>

            <!-- Priority Actions -->
            ${systemReport.priorityActions.length > 0 ? this._generatePriorityActions(systemReport.priorityActions) : ''}

            <!-- Filter and Sort Controls -->
            <div class="recommendation-controls">
                ${this._generateFilterControls(systemReport)}
            </div>

            <!-- Recommendations List -->
            <div id="recommendationsList" class="recommendations-list">
                ${this._generateAllRecommendationsHTML(systemReport)}
            </div>
        `;

        container.innerHTML = html;
        this._attachEventListeners();
    }

    /**
     * Generate summary statistics cards
     * @private
     */
    _generateStatsCards(report) {
        return `
            <div class="stats-grid">
                <div class="stat-card stat-total">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${report.totalRecommendations}</div>
                    <div class="stat-label">Total Recommendations</div>
                </div>
                <div class="stat-card stat-critical">
                    <div class="stat-icon">🔴</div>
                    <div class="stat-value">${report.critical}</div>
                    <div class="stat-label">Critical Issues</div>
                </div>
                <div class="stat-card stat-high">
                    <div class="stat-icon">🟠</div>
                    <div class="stat-value">${report.high}</div>
                    <div class="stat-label">High Priority</div>
                </div>
                <div class="stat-card stat-medium">
                    <div class="stat-icon">🟡</div>
                    <div class="stat-value">${report.medium}</div>
                    <div class="stat-label">Medium Priority</div>
                </div>
                <div class="stat-card stat-analyzed">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">${report.analyzedBuses}/${report.totalBuses}</div>
                    <div class="stat-label">Buses Analyzed</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate priority actions section
     * @private
     */
    _generatePriorityActions(actions) {
        return `
            <div class="priority-actions-section">
                <h3>⚠️ Priority Actions Required</h3>
                <div class="priority-actions-list">
                    ${actions.map((rec, index) => `
                        <div class="priority-action-item severity-${rec.severity.toLowerCase()}">
                            <div class="action-number">${index + 1}</div>
                            <div class="action-content">
                                <div class="action-header">
                                    <span class="action-bus">${rec.busName} (${rec.busVoltage}V)</span>
                                    <span class="severity-badge badge-${rec.severity.toLowerCase()}">${rec.severity}</span>
                                </div>
                                <div class="action-title">${rec.name}</div>
                                <div class="action-recommendation">${rec.recommendation}</div>
                                <div class="action-required">
                                    <strong>Action:</strong> ${rec.action}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate filter and sort controls
     * @private
     */
    _generateFilterControls(report) {
        const categories = Object.keys(report.byCategory);
        
        return `
            <div class="filter-controls">
                <div class="filter-group">
                    <label for="severityFilter">Filter by Severity:</label>
                    <select id="severityFilter" class="filter-select" onchange="recUI.applyFilters()">
                        <option value="all">All Severities</option>
                        <option value="CRITICAL">Critical Only (${report.critical})</option>
                        <option value="HIGH">High Only (${report.high})</option>
                        <option value="MEDIUM">Medium Only (${report.medium})</option>
                        <option value="LOW">Low Only (${report.low || 0})</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label for="categoryFilter">Filter by Category:</label>
                    <select id="categoryFilter" class="filter-select" onchange="recUI.applyFilters()">
                        <option value="all">All Categories</option>
                        ${categories.map(cat => `
                            <option value="${cat}">${cat} (${report.byCategory[cat]})</option>
                        `).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label for="sortBy">Sort by:</label>
                    <select id="sortBy" class="filter-select" onchange="recUI.applySort()">
                        <option value="priority">Priority</option>
                        <option value="severity">Severity</option>
                        <option value="busName">Bus Name</option>
                        <option value="category">Category</option>
                    </select>
                </div>

                <button class="btn btn-secondary btn-small" onclick="recUI.exportRecommendations()">
                    📄 Export Report
                </button>
            </div>
        `;
    }

    /**
     * Generate HTML for all recommendations
     * @private
     */
    _generateAllRecommendationsHTML(report) {
        const allRecs = [];
        for (const busId in report.byBus) {
            allRecs.push(...report.byBus[busId]);
        }

        if (allRecs.length === 0) {
            return `
                <div class="alert alert-success">
                    <strong>✅ Excellent!</strong>
                    <p>No recommendations found. Your system meets all IEEE standards and best practices.</p>
                </div>
            `;
        }

        return this._generateRecommendationsHTML(allRecs, 'system');
    }

    /**
     * Generate recommendations HTML list
     * @private
     */
    _generateRecommendationsHTML(recommendations, viewType = 'bus') {
        return `
            <div class="recommendations-container">
                ${recommendations.map((rec, index) => `
                    <div class="recommendation-card severity-${rec.severity.toLowerCase()} ${this.expandedRecommendations.has(rec.id) ? 'expanded' : ''}" 
                         data-rec-id="${rec.id}"
                         data-severity="${rec.severity}"
                         data-category="${rec.category}">
                        
                        <!-- Card Header -->
                        <div class="rec-header" onclick="recUI.toggleRecommendation('${rec.id}')">
                            <div class="rec-header-left">
                                <span class="rec-priority">#${rec.priority}</span>
                                <span class="rec-icon">${this._getSeverityIcon(rec.severity)}</span>
                                <span class="rec-title">${rec.name}</span>
                            </div>
                            <div class="rec-header-right">
                                ${viewType === 'system' ? `<span class="rec-bus-name">${rec.busName}</span>` : ''}
                                <span class="severity-badge badge-${rec.severity.toLowerCase()}">${rec.severity}</span>
                                <span class="rec-expand-icon">${this.expandedRecommendations.has(rec.id) ? '▼' : '▶'}</span>
                            </div>
                        </div>

                        <!-- Card Body (Collapsible) -->
                        <div class="rec-body" style="display: ${this.expandedRecommendations.has(rec.id) ? 'block' : 'none'}">
                            
                            <!-- Category & Standard -->
                            <div class="rec-meta">
                                <span class="rec-category">
                                    <strong>Category:</strong> ${rec.category}
                                </span>
                                <span class="rec-standard">
                                    <strong>Standard:</strong> ${rec.standard}
                                </span>
                            </div>

                            <!-- Recommendation -->
                            <div class="rec-section">
                                <div class="rec-section-title">📋 Finding</div>
                                <div class="rec-section-content">${rec.recommendation}</div>
                            </div>

                            <!-- Action Required -->
                            <div class="rec-section rec-action">
                                <div class="rec-section-title">🔧 Required Action</div>
                                <div class="rec-section-content">${rec.action}</div>
                            </div>

                            <!-- Impact -->
                            <div class="rec-section">
                                <div class="rec-section-title">⚡ Impact</div>
                                <div class="rec-section-content">${rec.impact}</div>
                            </div>

                            <!-- Cost & Effort -->
                            <div class="rec-details-grid">
                                <div class="rec-detail-item">
                                    <strong>💰 Cost Impact:</strong>
                                    <span class="cost-badge cost-${rec.cost.toLowerCase().replace(/ /g, '-')}">${rec.cost}</span>
                                </div>
                                <div class="rec-detail-item">
                                    <strong>⏱️ Implementation:</strong>
                                    <span>${rec.effort}</span>
                                </div>
                            </div>

                            <!-- Context Data -->
                            ${rec.context ? this._generateContextHTML(rec.context) : ''}

                            <!-- Action Buttons -->
                            <div class="rec-actions">
                                <button class="btn btn-primary btn-small" onclick="recUI.markAsReviewed('${rec.id}')">
                                    ✓ Mark as Reviewed
                                </button>
                                <button class="btn btn-secondary btn-small" onclick="recUI.addToActionPlan('${rec.id}')">
                                    📝 Add to Action Plan
                                </button>
                                <button class="btn btn-info btn-small" onclick="recUI.viewBusDetails('${rec.busId}')">
                                    🔍 View Bus Details
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generate context information HTML
     * @private
     */
    _generateContextHTML(context) {
        return `
            <div class="rec-context">
                <div class="rec-section-title">📊 Context Information</div>
                <div class="context-grid">
                    ${context.voltageLevel ? `<div class="context-item"><strong>Voltage Level:</strong> ${context.voltageLevel.replace('_', ' ')}</div>` : ''}
                    ${context.busType ? `<div class="context-item"><strong>Bus Type:</strong> ${context.busType}</div>` : ''}
                    ${context.faultCurrent ? `<div class="context-item"><strong>Fault Current:</strong> ${context.faultCurrent.toFixed(2)} kA</div>` : ''}
                    ${context.xrRatio ? `<div class="context-item"><strong>X/R Ratio:</strong> ${context.xrRatio.toFixed(2)}</div>` : ''}
                    ${context.voltageDrop !== undefined ? `<div class="context-item"><strong>Voltage Drop:</strong> ${context.voltageDrop.toFixed(3)}%</div>` : ''}
                    ${context.hasTransformer ? `<div class="context-item">🔌 Contains Transformer</div>` : ''}
                    ${context.hasCable ? `<div class="context-item">🔗 Contains Cable</div>` : ''}
                    ${context.hasMotor ? `<div class="context-item">⚙️ Motor Contribution</div>` : ''}
                    ${context.hasGenerator ? `<div class="context-item">🔋 Generator Contribution</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get severity icon
     * @private
     */
    _getSeverityIcon(severity) {
        const icons = {
            'CRITICAL': '🔴',
            'HIGH': '🟠',
            'MEDIUM': '🟡',
            'LOW': '🟢'
        };
        return icons[severity] || '⚪';
    }

    /**
     * Toggle recommendation expand/collapse
     */
    toggleRecommendation(recId) {
        if (this.expandedRecommendations.has(recId)) {
            this.expandedRecommendations.delete(recId);
        } else {
            this.expandedRecommendations.add(recId);
        }

        const card = document.querySelector(`[data-rec-id="${recId}"]`);
        if (card) {
            const body = card.querySelector('.rec-body');
            const icon = card.querySelector('.rec-expand-icon');
            
            if (this.expandedRecommendations.has(recId)) {
                body.style.display = 'block';
                icon.textContent = '▼';
                card.classList.add('expanded');
            } else {
                body.style.display = 'none';
                icon.textContent = '▶';
                card.classList.remove('expanded');
            }
        }
    }

    /**
     * Apply filters to recommendations display
     */
    applyFilters() {
        const severityFilter = document.getElementById('severityFilter')?.value || 'all';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';

        const cards = document.querySelectorAll('.recommendation-card');
        cards.forEach(card => {
            const severity = card.dataset.severity;
            const category = card.dataset.category;

            const matchesSeverity = severityFilter === 'all' || severity === severityFilter;
            const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

            if (matchesSeverity && matchesCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Apply sorting to recommendations
     */
    applySort() {
        const sortBy = document.getElementById('sortBy')?.value || 'priority';
        const container = document.querySelector('.recommendations-container');
        if (!container) return;

        const cards = Array.from(container.querySelectorAll('.recommendation-card'));
        
        cards.sort((a, b) => {
            const recA = this._getRecFromCard(a);
            const recB = this._getRecFromCard(b);

            switch (sortBy) {
                case 'priority':
                    return recA.priority - recB.priority;
                case 'severity':
                    return this._getSeverityWeight(recA.severity) - this._getSeverityWeight(recB.severity);
                case 'busName':
                    return recA.busName.localeCompare(recB.busName);
                case 'category':
                    return recA.category.localeCompare(recB.category);
                default:
                    return 0;
            }
        });

        // Re-append in sorted order
        cards.forEach(card => container.appendChild(card));
    }

    /**
     * Get recommendation data from card element
     * @private
     */
    _getRecFromCard(card) {
        const recId = card.dataset.recId;
        return recommendationEngine.recommendations.find(r => r.id === recId) || {};
    }

    /**
     * Get severity weight for sorting
     * @private
     */
    _getSeverityWeight(severity) {
        const weights = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
        return weights[severity] || 5;
    }

    /**
     * Mark recommendation as reviewed
     */
    markAsReviewed(recId) {
        const card = document.querySelector(`[data-rec-id="${recId}"]`);
        if (card) {
            card.classList.add('reviewed');
            const btn = card.querySelector('.rec-actions button');
            if (btn) {
                btn.textContent = '✓ Reviewed';
                btn.disabled = true;
            }
            
            // Store in localStorage
            const reviewed = JSON.parse(localStorage.getItem('reviewedRecommendations') || '[]');
            if (!reviewed.includes(recId)) {
                reviewed.push(recId);
                localStorage.setItem('reviewedRecommendations', JSON.stringify(reviewed));
            }
        }
    }

    /**
     * Add recommendation to action plan
     */
    addToActionPlan(recId) {
        const rec = recommendationEngine.recommendations.find(r => r.id === recId);
        if (!rec) return;

        const actionPlan = JSON.parse(localStorage.getItem('actionPlan') || '[]');
        
        const actionItem = {
            id: recId,
            busName: rec.busName,
            recommendation: rec.recommendation,
            action: rec.action,
            priority: rec.priority,
            severity: rec.severity,
            cost: rec.cost,
            effort: rec.effort,
            addedDate: new Date().toISOString(),
            status: 'pending'
        };

        actionPlan.push(actionItem);
        localStorage.setItem('actionPlan', JSON.stringify(actionPlan));

        alert(`✅ Added to Action Plan:\n\n${rec.name}\n\nView your action plan in the Export tab.`);
    }

    /**
     * View bus details
     */
    viewBusDetails(busId) {
        // Navigate to bus and trigger calculation display
        const bus = buses.find(b => b.id === busId);
        if (bus && bus.results) {
            selectedBusId = busId;
            const result = {
                faultCurrentKA: bus.results.faultCurrents.threePhaseSym,
                asymFaultCurrentKA: bus.results.faultCurrents.threePhaseAsym,
                xrRatio: bus.results.xrRatio,
                totalZ: bus.results.totalImpedance.magnitude,
                totalR: bus.results.totalImpedance.resistance || 0,
                totalX: bus.results.totalImpedance.reactance || 0,
                method: bus.results.method,
                voltageDrop: bus.results.voltageDrop,
                steps: bus.results.steps || 'No detailed steps available'
            };
            
            const timestamp = bus.results.calculationDate || getCalculationTimestamp();
            const recommendations = recommendationEngine.filterByBus(busId);
            
            displayBusResults(bus, result, timestamp, recommendations);
            switchTab(null, 'results');
        }
    }

    /**
     * Export recommendations to file
     */
    exportRecommendations() {
        if (typeof exportRecommendationsCSV === 'function') {
            exportRecommendationsCSV();
        } else {
            alert('Export function not available. Please ensure exportReport.js is loaded.');
        }
    }

    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners() {
        // Event listeners are attached via onclick in HTML
        // This method reserved for future dynamic listeners
    }
}

// Create global instance
try {
    const recUI = new RecommendationUI();
    window.recUI = recUI;
    logger.info('Recommendation UI ready');
} catch (error) {
    logger.error('Failed to initialize Recommendation UI:', error);
}