/**
 * Recommendation Engine - Core Logic
 * Evaluates rules and generates actionable recommendations
 * 
 * @author bfforex
 * @date 2025-10-27
 */

class RecommendationEngine {
    constructor() {
        this.rules = RecommendationRules;
        this.standards = IndustryStandards;  // From thresholds.js
        this.recommendations = [];
    }

    /**
     * Analyze single bus and generate recommendations
     * @param {Object} bus - Bus object with calculation results
     * @returns {Array} Array of recommendations
     */
    analyzeBus(bus) {
        if (!bus.results) {
            console.warn(`Bus ${bus.name} has no calculation results`);
            return [];
        }

        const busRecommendations = [];

        // Evaluate all rule categories
        for (const category in this.rules) {
            const categoryRules = this.rules[category];
            
            categoryRules.forEach(rule => {
                try {
                    if (rule.condition(bus, this.standards)) {
                        busRecommendations.push({
                            ...rule,
                            busId: bus.id,
                            busName: bus.name,
                            busVoltage: bus.voltage,
                            category: this._getCategoryName(category),
                            timestamp: new Date().toISOString(),
                            context: this._getContext(bus, rule)
                        });
                    }
                } catch (error) {
                    console.error(`Error evaluating rule ${rule.id}:`, error);
                }
            });
        }

        // Sort by priority and severity
        busRecommendations.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return this._getSeverityWeight(a.severity) - this._getSeverityWeight(b.severity);
        });

        return busRecommendations;
    }

    /**
     * Analyze all buses in system
     * @param {Array} buses - Array of bus objects
     * @returns {Object} Comprehensive recommendations report
     */
    analyzeSystem(buses) {
        this.recommendations = [];
        const systemReport = {
            totalBuses: buses.length,
            analyzedBuses: 0,
            totalRecommendations: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            byCategory: {},
            byBus: {},
            priorityActions: [],
            timestamp: new Date().toISOString()
        };

        buses.forEach(bus => {
            if (bus.results) {
                const busRecs = this.analyzeBus(bus);
                this.recommendations.push(...busRecs);
                
                systemReport.analyzedBuses++;
                systemReport.totalRecommendations += busRecs.length;
                systemReport.byBus[bus.id] = busRecs;

                // Count by severity
                busRecs.forEach(rec => {
                    systemReport[rec.severity.toLowerCase()]++;
                    
                    // Count by category
                    if (!systemReport.byCategory[rec.category]) {
                        systemReport.byCategory[rec.category] = 0;
                    }
                    systemReport.byCategory[rec.category]++;
                });
            }
        });

        // Get priority actions (top 10 most critical)
        systemReport.priorityActions = this.recommendations
            .filter(r => r.severity === 'CRITICAL' || r.priority === 1)
            .slice(0, 10);

        return systemReport;
    }

    /**
     * Get context-specific information for recommendation
     * @private
     */
    _getContext(bus, rule) {
        const context = {
            voltageLevel: this._getVoltageLevel(bus.voltage),
            busType: bus.type,
            faultCurrent: bus.results?.faultCurrents?.threePhaseSym,
            impedance: bus.results?.totalImpedance?.magnitude,
            xrRatio: bus.results?.xrRatio
        };

        // Add voltage drop context if available
        if (bus.results?.voltageDrop) {
            context.voltageDrop = bus.results.voltageDrop.cumulativeDropPercent;
            context.criticalComponents = bus.results.voltageDrop.criticalComponents?.length || 0;
        }

        // Add path component summary
        if (bus.pathComponents) {
            context.pathLength = bus.pathComponents.length;
            context.hasTransformer = bus.pathComponents.some(pc => pc.component?.type === 'transformer');
            context.hasCable = bus.pathComponents.some(pc => pc.component?.type === 'cable');
            context.hasMotor = bus.pathComponents.some(pc => pc.component?.type === 'motor');
            context.hasGenerator = bus.pathComponents.some(pc => pc.component?.type === 'generator');
        }

        return context;
    }

    /**
     * Get voltage level category
     * @private
     */
    _getVoltageLevel(voltage) {
        if (voltage < 1000) return 'LOW_VOLTAGE';
        if (voltage < 35000) return 'MEDIUM_VOLTAGE';
        return 'HIGH_VOLTAGE';
    }

    /**
     * Get category display name
     * @private
     */
    _getCategoryName(category) {
        const names = {
            highFaultCurrent: 'High Fault Current',
            xrRatio: 'X/R Ratio',
            lowImpedance: 'Low Impedance',
            voltageDrop: 'Voltage Drop',
            transformer: 'Transformer',
            protection: 'Protection Coordination',
            cable: 'Cable'
        };
        return names[category] || category;
    }

    /**
     * Get severity numeric weight for sorting
     * @private
     */
    _getSeverityWeight(severity) {
        const weights = {
            'CRITICAL': 1,
            'HIGH': 2,
            'MEDIUM': 3,
            'LOW': 4
        };
        return weights[severity] || 5;
    }

    /**
     * Filter recommendations by severity
     */
    filterBySeverity(severity) {
        return this.recommendations.filter(r => r.severity === severity);
    }

    /**
     * Filter recommendations by category
     */
    filterByCategory(category) {
        return this.recommendations.filter(r => r.category === category);
    }

    /**
     * Filter recommendations by bus
     */
    filterByBus(busId) {
        return this.recommendations.filter(r => r.busId === busId);
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        return {
            total: this.recommendations.length,
            critical: this.filterBySeverity('CRITICAL').length,
            high: this.filterBySeverity('HIGH').length,
            medium: this.filterBySeverity('MEDIUM').length,
            low: this.filterBySeverity('LOW').length
        };
    }
}

// Create global instance
const recommendationEngine = new RecommendationEngine();