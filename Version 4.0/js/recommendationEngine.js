/**
 * Recommendation Engine - Core Logic
 * Evaluates rules and generates actionable recommendations
 * 
 * @author bfforex
 * @date 2025-10-27
 * @version 1.0.0
 */

class RecommendationEngine {
    constructor() {
        this.rules = RecommendationRules;
        this.standards = typeof IndustryStandards !== 'undefined' ? IndustryStandards : {};
        this.recommendations = [];
        
        console.log('🔍 Recommendation Engine initializing...');
        console.log('   - Rules loaded:', Object.keys(this.rules).length, 'categories');
        console.log('   - Standards available:', Object.keys(this.standards).length > 0);
    }

    /**
     * Analyze single bus and generate recommendations
     * @param {Object} bus - Bus object with calculation results
     * @returns {Array} Array of recommendations
     */
    analyzeBus(bus) {
        if (!bus.results) {
            console.warn(`⚠️ Bus ${bus.name} has no calculation results`);
            return [];
        }

        // ═══════════════════════════════════════════════════════════
        // ✅ NEW: Validate voltage drop calculation
        // Added: 2025-10-28 11:00:04 UTC by bfforex
        // Purpose: Detect if source impedance was incorrectly included
        // ═══════════════════════════════════════════════════════════
        if (bus.results.voltageDrop && bus.results.voltageDrop.components.length > 0) {
            const firstComp = bus.results.voltageDrop.components[0];
            
            // Check for source impedance in voltage drop
            if (firstComp.type === 'source' && firstComp.dropPercent > 5) {
                console.warn(`⚠️  Bus ${bus.name}: Source impedance detected in VD calc`);
                console.warn(`   First component: ${firstComp.name} = ${firstComp.dropPercent.toFixed(2)}%`);
                console.warn(`   This violates IEEE 141-1993 Section 3.2.1`);
                console.warn(`   Voltage drop should start from first distribution component`);
                console.warn(`   System may show false non-compliance!`);
            }
            
            // Check for unrealistic total voltage drop
            if (bus.results.voltageDrop.cumulativeDropPercent > 10) {
                console.warn(`⚠️  Bus ${bus.name}: Unrealistic voltage drop detected`);
                console.warn(`   Total VD: ${bus.results.voltageDrop.cumulativeDropPercent.toFixed(2)}%`);
                console.warn(`   This may indicate source impedance inclusion error`);
            }
        }
        // ═══════════════════════════════════════════════════════════

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
                    console.error(`❌ Error evaluating rule ${rule.id}:`, error);
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
        return SEVERITY_WEIGHTS[severity] || 5;
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
try {
    const recommendationEngine = new RecommendationEngine();
    console.log('✅ Recommendation Engine initialized successfully');
    console.log('   - Instance created:', recommendationEngine);
    
    // Verify analyzeBus method exists
    if (typeof recommendationEngine.analyzeBus !== 'function') {
        throw new Error('analyzeBus method not found');
    }
    
    // Make available globally
    window.recommendationEngine = recommendationEngine;
    
} catch (error) {
    console.error('❌ Failed to initialize Recommendation Engine:', error);
}