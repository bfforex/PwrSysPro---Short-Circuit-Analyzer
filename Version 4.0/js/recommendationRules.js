/**
 * Recommendation Rules Library
 * Based on IEEE 141, IEEE 1584, NEC, and industry best practices
 * 
 * @author bfforex
 * @date 2025-10-27
 * @version 1.1.0
 * @updated 2025-12-01 - Added transformer overload rules (Bug #6 fix)
 */

// Named constants for recommendation rules
const RECOMMENDATION_CONSTANTS = {
    DEFAULT_VOLTAGE: 480,  // Default LV voltage in volts
    OVERLOAD_CRITICAL_THRESHOLD: 100,  // % loading that triggers CRITICAL
    OVERLOAD_HIGH_THRESHOLD: 80,  // % loading that triggers HIGH warning
    HIGH_FAULT_CURRENT_THRESHOLD: 40,  // kA threshold for fault concerns
    SECONDARY_FAULT_THRESHOLD: 30,  // kA threshold for secondary fault
    LOW_IMPEDANCE_THRESHOLD: 4  // % impedance considered low
};

// Numeric weights for severity levels used by engine sorting and UI sorting
const SEVERITY_WEIGHTS = {
    'CRITICAL': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
};

const RecommendationRules = {
    /**
     * CATEGORY A: HIGH FAULT CURRENT RULES
     * Evaluate when fault currents approach or exceed equipment ratings
     */
    highFaultCurrent: [
        {
            id: 'HFC-001',
            name: 'Critical Fault Current Utilization',
            condition: (bus, standards) => {
                return bus.results?.faultCurrents?.threePhaseSym > 
                       (bus.ratedCapacity || 65) * 0.95;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'Circuit breaker operating near or exceeding interrupting capacity',
            action: 'IMMEDIATE: Verify breaker AIC rating. Replace with higher rated breaker or install current-limiting equipment.',
            standard: 'NEC 110.9',
            impact: 'Safety hazard - equipment may fail during fault',
            cost: 'HIGH',
            effort: 'Medium (1-2 weeks)'
        },
        {
            id: 'HFC-002',
            name: 'High Fault Current Warning',
            condition: (bus, standards) => {
                return bus.results?.faultCurrents?.threePhaseSym > 
                       (bus.ratedCapacity || 65) * 0.80;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Fault current exceeds 80% of typical breaker capacity',
            action: 'Review protective device ratings. Consider upgrading to higher AIC rating.',
            standard: 'IEEE 141-1993 Section 7',
            impact: 'Limited safety margin',
            cost: 'MEDIUM',
            effort: 'Low (1-3 days)'
        },
        {
            id: 'HFC-003',
            name: 'Asymmetrical Current Concern',
            condition: (bus, standards) => {
                const asymRatio = bus.results?.faultCurrents?.threePhaseAsym / 
                                 bus.results?.faultCurrents?.threePhaseSym;
                return asymRatio > 1.5;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'High asymmetrical multiplier detected (>1.5)',
            action: 'Verify breaker can handle asymmetrical current. Check X/R ratio compatibility.',
            standard: 'IEEE C37.06',
            impact: 'Breaker may not interrupt properly',
            cost: 'LOW',
            effort: 'Low (verification only)'
        }
    ],

    /**
     * CATEGORY B: X/R RATIO RULES
     * Evaluate X/R ratios for circuit breaker compatibility
     */
    xrRatio: [
        {
            id: 'XR-001',
            name: 'Critical X/R Ratio',
            condition: (bus, standards) => {
                return bus.results?.xrRatio > 20;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'X/R ratio exceeds 20 - requires special DC-rated circuit breaker',
            action: 'IMMEDIATE: Verify breaker DC component capability. May require breaker upgrade or current-limiting reactor.',
            standard: 'IEEE C37.010',
            impact: 'Breaker may fail to interrupt fault',
            cost: 'HIGH',
            effort: 'Medium (equipment replacement)'
        },
        {
            id: 'XR-002',
            name: 'High X/R Ratio Warning',
            condition: (bus, standards) => {
                return bus.results?.xrRatio > 17 && bus.results?.xrRatio <= 20;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'X/R ratio exceeds 17 - approaching standard breaker limits',
            action: 'Check circuit breaker specifications for DC component capability. Consider current-limiting measures.',
            standard: 'IEEE C37.010',
            impact: 'Limited interrupting capability',
            cost: 'MEDIUM',
            effort: 'Low (verification and documentation)'
        },
        {
            id: 'XR-003',
            name: 'Moderate X/R Ratio',
            condition: (bus, standards) => {
                return bus.results?.xrRatio > 15 && bus.results?.xrRatio <= 17;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'X/R ratio elevated - monitor for future system changes',
            action: 'Document X/R ratio. Review when adding new sources or transformers.',
            standard: 'IEEE C37.010',
            impact: 'May limit future expansion',
            cost: 'NONE',
            effort: 'Low (documentation only)'
        }
    ],

    /**
     * CATEGORY C: LOW IMPEDANCE RULES
     * Identify weak points or extremely stiff sources
     */
    lowImpedance: [
        {
            id: 'LI-001',
            name: 'Extremely Low System Impedance',
            condition: (bus, standards) => {
                const zPu = bus.results?.totalImpedance?.magnitude;
                return zPu && zPu < 0.001;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'System impedance unusually low - verify calculation accuracy',
            action: 'Review: 1) Source impedance values, 2) Cable data, 3) Transformer impedances. Consider current-limiting reactors if accurate.',
            standard: 'IEEE 141-1993',
            impact: 'Potential calculation error or extremely stiff source',
            cost: 'VARIABLE',
            effort: 'Low (verification) to High (if reactors needed)'
        },
        {
            id: 'LI-002',
            name: 'Very Stiff Source',
            condition: (bus, standards) => {
                return bus.type === 'source' && 
                       bus.results?.faultCurrents?.threePhaseSym > 100;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Very high available fault current (>100 kA)',
            action: 'Consider current-limiting reactors, or higher impedance transformer connection (delta-wye vs wye-wye).',
            standard: 'IEEE 141-1993 Section 7.4',
            impact: 'High mechanical forces, expensive protective equipment required',
            cost: 'HIGH',
            effort: 'High (system redesign)'
        },
        {
            id: 'LI-003',
            name: 'Low Cable Impedance Path',
            condition: (bus, standards) => {
                const hasBigCables = bus.pathComponents?.some(pc => 
                    pc.component?.type === 'cable' && 
                    parseInt(pc.component?.size) > 750 &&
                    pc.component?.length < 100
                );
                return hasBigCables && bus.results?.faultCurrents?.threePhaseSym > 50;
            },
            severity: 'MEDIUM',
            priority: 4,
            recommendation: 'Large conductors with short runs contributing to high fault current',
            action: 'Review: Is oversized cable necessary? Consider smaller conductors if voltage drop permits.',
            standard: 'IEEE 141-1993',
            impact: 'Higher fault current than necessary',
            cost: 'LOW',
            effort: 'Medium (cable resizing during maintenance)'
        }
    ],

    /**
     * CATEGORY D: VOLTAGE DROP RULES
     * Evaluate voltage drop compliance with IEEE 141 and NEC
     */
    voltageDrop: [
        {
            id: 'VD-001',
            name: 'Critical Voltage Drop Violation',
            condition: (bus, standards) => {
                return bus.results?.voltageDrop?.cumulativeDropPercent > 5;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'Voltage drop exceeds recomended maximum (5%)',
            action: 'IMMEDIATE: Resize conductors or install voltage regulation equipment. System may not operate properly.',
            standard: 'IEEE 141-1993 Red Book, NEC 215.2',
            impact: 'Equipment may malfunction, motors may overheat, lights may be dim',
            cost: 'HIGH',
            effort: 'High (conductor replacement or voltage regulator)'
        },
        {
            id: 'VD-002',
            name: 'High Voltage Drop Warning',
            condition: (bus, standards) => {
                return bus.results?.voltageDrop?.cumulativeDropPercent > 5 &&
                       bus.results?.voltageDrop?.cumulativeDropPercent <= 5;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Voltage drop exceeds recommended branch circuit limit (5%)',
            action: 'Review cable sizing. Consider: 1) Larger conductors, 2) Parallel cables, 3) Higher voltage level.',
            standard: 'IEEE 141-1993 Red Book',
            impact: 'Reduced efficiency, potential equipment performance issues',
            cost: 'MEDIUM',
            effort: 'Medium (cable upsizing)'
        },
        {
            id: 'VD-003',
            name: 'Feeder Voltage Drop Warning',
            condition: (bus, standards) => {
                return bus.results?.voltageDrop?.cumulativeDropPercent > 3 &&
                       bus.results?.voltageDrop?.cumulativeDropPercent <= 5 &&
                       bus.type !== 'branch';
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Feeder voltage drop exceeds recommended limit (3%)',
            action: 'Consider upsizing feeder conductors or reducing load.',
            standard: 'IEEE 141-1993 Red Book',
            impact: 'Reduced voltage regulation margin',
            cost: 'MEDIUM',
            effort: 'Medium (cable replacement)'
        },
        {
            id: 'VD-004',
            name: 'Single Component High Drop',
            condition: (bus, standards) => {
                return bus.results?.voltageDrop?.maxDropPercent > 3;
            },
            severity: 'MEDIUM',
            priority: 4,
            recommendation: 'Single component contributing >3% voltage drop',
            action: 'Identify and review specific component causing high drop. May need resizing.',
            standard: 'IEEE 141-1993',
            impact: 'Inefficient system design',
            cost: 'LOW to MEDIUM',
            effort: 'Variable (depends on component)'
        },
        {
            id: 'VD-005',
            name: 'Source Impedance in Voltage Drop Calculation',
            condition: (bus, standards) => {
                // Check if source impedance was incorrectly included in VD calculation
                if (!bus.results || !bus.results.voltageDrop) return false;
                
                const components = bus.results.voltageDrop.components || [];
                if (components.length === 0) return false;
                
                // Check if first component is a source with high voltage drop
                const firstComp = components[0];
                const hasSourceInVD = firstComp.type === 'source' && firstComp.dropPercent > 5;
                
                return hasSourceInVD;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Source impedance appears to be included in voltage drop calculation',
            action: 'Per IEEE 141-1993 Section 3.2.1, voltage drop should be calculated from the first distribution point, NOT including utility source impedance. Recalculate voltage drop excluding source impedance.',
            standard: 'IEEE 141-1993 Section 3.2.1',
            impact: 'Incorrectly calculated voltage drop showing false non-compliance. System may actually be compliant.',
            cost: 'NONE',
            effort: 'Low (calculation correction only - no equipment changes needed)'
        }
    ],

    /**
     * CATEGORY E: TRANSFORMER RULES
     * Evaluate transformer loading and fault withstand
     */
    transformer: [
        /**
         * TF-000: TRANSFORMER OVERLOAD CRITICAL
         * Added: 2025-12-01 - Bug #6 Fix
         * Updated: 2025-12-02 - Fixed transformer detection logic
         * Flags transformers loaded >100% as CRITICAL (Priority 1)
         * Per IEEE C57.12.00 and NEC 450.3
         */
        {
            id: 'TF-000',
            name: 'Transformer Overload Critical',
            condition: (bus, standards) => {
                // Method 1: Check voltage drop results for transformer loading
                if (bus.results?.voltageDrop?.components) {
                    const xfmrComp = bus.results.voltageDrop.components.find(c => c.type === 'transformer');
                    if (xfmrComp && xfmrComp.loading > RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD) {
                        return true;
                    }
                }
                
                // Method 2: Look for feeding transformer in global components array
                if (typeof components !== 'undefined' && Array.isArray(components)) {
                    const feedingTransformer = components.find(c => 
                        c.type === 'transformer' && c.toBus === bus.id
                    );
                    
                    if (feedingTransformer) {
                        const rating = parseFloat(feedingTransformer.rating) || 0;
                        if (rating > 0) {
                            // Get load current from bus
                            let loadCurrent = 0;
                            if (bus.results?.loadFlow?.summary?.totalCurrent) {
                                loadCurrent = bus.results.loadFlow.summary.totalCurrent;
                            } else if (bus.loadCurrent) {
                                loadCurrent = parseFloat(bus.loadCurrent);
                            }
                            
                            // Calculate loading
                            const voltage = bus.voltage || RECOMMENDATION_CONSTANTS.DEFAULT_VOLTAGE;
                            const loadKVA = (loadCurrent * voltage * Math.sqrt(3)) / 1000;
                            const loadingPercent = (loadKVA / rating) * 100;
                            
                            if (loadingPercent > RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD) {
                                return true;
                            }
                        }
                    }
                }
                
                // Method 3: Check pathComponents (original method with fallback)
                if (bus.pathComponents && Array.isArray(bus.pathComponents)) {
                    // Look for transformer in path - check component.type regardless of toBus
                    const xfmrPath = bus.pathComponents.find(pc => pc.component?.type === 'transformer');
                    if (xfmrPath && xfmrPath.component) {
                        // Try to find matching transformer in global components to get rating
                        const comp = xfmrPath.component;
                        let rating = parseFloat(comp.rating) || 0;
                        
                        // If rating not in pathComponent, look up in global components
                        if (rating === 0 && typeof components !== 'undefined') {
                            const globalComp = components.find(c => 
                                c.type === 'transformer' && 
                                (c.tag === comp.tag || c.toBus === bus.id)
                            );
                            if (globalComp) {
                                rating = parseFloat(globalComp.rating) || 0;
                            }
                        }
                        
                        if (rating > 0) {
                            let loadCurrent = 0;
                            if (bus.results?.loadFlow?.summary?.totalCurrent) {
                                loadCurrent = bus.results.loadFlow.summary.totalCurrent;
                            } else if (bus.loadCurrent) {
                                loadCurrent = parseFloat(bus.loadCurrent);
                            }
                            
                            const voltage = bus.voltage || RECOMMENDATION_CONSTANTS.DEFAULT_VOLTAGE;
                            const loadKVA = (loadCurrent * voltage * Math.sqrt(3)) / 1000;
                            const loadingPercent = (loadKVA / rating) * 100;
                            
                            return loadingPercent > RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD;
                        }
                    }
                }
                
                return false;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'Transformer OVERLOADED - Loading exceeds 100% of nameplate rating',
            action: 'IMMEDIATE: 1) Reduce load on secondary bus, 2) Transfer loads to other feeders, 3) Install larger transformer, 4) Add parallel transformer. Continued overload will cause thermal damage and reduced transformer life.',
            standard: 'IEEE C57.12.00, NEC 450.3',
            impact: 'Transformer thermal damage, accelerated insulation aging, potential failure',
            cost: 'VERY HIGH',
            effort: 'High (load transfer or transformer replacement required)'
        },
        {
            id: 'TF-001',
            name: 'Transformer Mechanical Withstand Critical',
            condition: (bus, standards) => {
                const hasTransformer = bus.pathComponents?.some(pc => 
                    pc.component?.type === 'transformer'
                );
                return hasTransformer && 
                       bus.results?.faultCurrents?.threePhaseSym > 40;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'Very high fault current through transformer - verify mechanical withstand',
            action: 'IMMEDIATE: Review transformer nameplate for through-fault withstand rating (I²t). May need replacement or current-limiting protection.',
            standard: 'IEEE C57.12.00',
            impact: 'Transformer mechanical failure risk',
            cost: 'VERY HIGH',
            effort: 'High (transformer replacement if inadequate)'
        },
        /**
         * TF-001B: TRANSFORMER HIGH LOADING WARNING
         * Added: 2025-12-01 - Bug #6 Fix enhancement
         * Updated: 2025-12-02 - Fixed transformer detection logic
         * Warns when transformer is at 80-100% loading
         */
        {
            id: 'TF-001B',
            name: 'Transformer High Loading Warning',
            condition: (bus, standards) => {
                // Helper function to calculate loading percentage
                const calculateLoading = (rating, loadCurrent, voltage) => {
                    if (rating <= 0 || loadCurrent <= 0) return 0;
                    const loadKVA = (loadCurrent * voltage * Math.sqrt(3)) / 1000;
                    return (loadKVA / rating) * 100;
                };
                
                // Get load current from bus
                const getLoadCurrent = (bus) => {
                    if (bus.results?.loadFlow?.summary?.totalCurrent) {
                        return bus.results.loadFlow.summary.totalCurrent;
                    }
                    return parseFloat(bus.loadCurrent) || 0;
                };
                
                const voltage = bus.voltage || RECOMMENDATION_CONSTANTS.DEFAULT_VOLTAGE;
                const loadCurrent = getLoadCurrent(bus);
                
                // Method 1: Check voltage drop results for transformer loading
                if (bus.results?.voltageDrop?.components) {
                    const xfmrComp = bus.results.voltageDrop.components.find(c => c.type === 'transformer');
                    if (xfmrComp && xfmrComp.loading > RECOMMENDATION_CONSTANTS.OVERLOAD_HIGH_THRESHOLD &&
                        xfmrComp.loading <= RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD) {
                        return true;
                    }
                }
                
                // Method 2: Look for feeding transformer in global components array
                if (typeof components !== 'undefined' && Array.isArray(components)) {
                    const feedingTransformer = components.find(c => 
                        c.type === 'transformer' && c.toBus === bus.id
                    );
                    
                    if (feedingTransformer) {
                        const rating = parseFloat(feedingTransformer.rating) || 0;
                        const loadingPercent = calculateLoading(rating, loadCurrent, voltage);
                        
                        if (loadingPercent > RECOMMENDATION_CONSTANTS.OVERLOAD_HIGH_THRESHOLD &&
                            loadingPercent <= RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD) {
                            return true;
                        }
                    }
                }
                
                // Method 3: Check pathComponents
                if (bus.pathComponents && Array.isArray(bus.pathComponents)) {
                    const xfmrPath = bus.pathComponents.find(pc => pc.component?.type === 'transformer');
                    if (xfmrPath && xfmrPath.component) {
                        let rating = parseFloat(xfmrPath.component.rating) || 0;
                        
                        if (rating === 0 && typeof components !== 'undefined') {
                            const globalComp = components.find(c => 
                                c.type === 'transformer' && 
                                (c.tag === xfmrPath.component.tag || c.toBus === bus.id)
                            );
                            if (globalComp) {
                                rating = parseFloat(globalComp.rating) || 0;
                            }
                        }
                        
                        const loadingPercent = calculateLoading(rating, loadCurrent, voltage);
                        return loadingPercent > RECOMMENDATION_CONSTANTS.OVERLOAD_HIGH_THRESHOLD &&
                               loadingPercent <= RECOMMENDATION_CONSTANTS.OVERLOAD_CRITICAL_THRESHOLD;
                    }
                }
                
                return false;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Transformer approaching full load capacity (>80%)',
            action: 'Monitor load growth. Plan for capacity upgrade. Consider load balancing or future transformer replacement.',
            standard: 'IEEE C57.12.00',
            impact: 'Limited capacity margin, risk of overload during peak demand',
            cost: 'MEDIUM',
            effort: 'Low (monitoring) to High (if upgrade needed)'
        },
        {
            id: 'TF-002',
            name: 'Transformer Secondary Fault High',
            condition: (bus, standards) => {
                const isSecondary = bus.voltage < 1000;
                const hasTransformer = bus.pathComponents?.some(pc => 
                    pc.component?.type === 'transformer'
                );
                return isSecondary && hasTransformer &&
                       bus.results?.faultCurrents?.threePhaseSym > 30;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'High secondary fault current - verify transformer thermal capability',
            action: 'Check transformer: 1) Thermal withstand time, 2) Primary protection settings, 3) Secondary protection coordination.',
            standard: 'IEEE C57.12.00, IEEE 242',
            impact: 'Potential transformer thermal damage',
            cost: 'MEDIUM',
            effort: 'Low (verification and protection adjustment)'
        },
        {
            id: 'TF-003',
            name: 'Low Transformer Impedance',
            condition: (bus, standards) => {
                const transformer = bus.pathComponents?.find(pc => 
                    pc.component?.type === 'transformer'
                )?.component;
                return transformer && transformer.impedance < 4;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Transformer impedance below typical range (<4%)',
            action: 'Low impedance transformer increases fault current. Consider: 1) Higher impedance unit during replacement, 2) Current-limiting reactor.',
            standard: 'IEEE C57.12.00',
            impact: 'Higher fault currents downstream',
            cost: 'NONE (future consideration)',
            effort: 'None (for future replacement)'
        },
        {
            id: 'TF-004',
            name: 'Parallel Transformers Unbalanced',
            condition: (bus, standards) => {
                const transformers = bus.pathComponents?.filter(pc => 
                    pc.component?.type === 'transformer'
                );
                if (!transformers || transformers.length < 2) return false;
                
                const ratings = transformers.map(t => t.component?.rating);
                const maxRating = Math.max(...ratings);
                const minRating = Math.min(...ratings);
                return (maxRating / minRating) > 1.2;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Parallel transformers have significantly different ratings',
            action: 'Review load sharing. Unequal transformers may not share load proportionally.',
            standard: 'IEEE 141-1993 Section 4',
            impact: 'Uneven loading, potential overload of smaller unit',
            cost: 'NONE',
            effort: 'Low (monitoring and load balancing)'
        }
    ],

    /**
     * CATEGORY F: PROTECTION COORDINATION RULES
     */
    protection: [
        {
            id: 'PR-001',
            name: 'Motor Contribution Significant',
            condition: (bus, standards) => {
                const hasMotor = bus.pathComponents?.some(pc => 
                    pc.component?.type === 'motor'
                );
                return hasMotor;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Motor contribution to fault current detected',
            action: 'Ensure protective device coordination accounts for motor contribution. Review time-current curves.',
            standard: 'IEEE 242-2001 Buff Book',
            impact: 'Protection may not coordinate properly',
            cost: 'LOW',
            effort: 'Low (protection study update)'
        },
        {
            id: 'PR-002',
            name: 'Generator Fault Contribution',
            condition: (bus, standards) => {
                const hasGenerator = bus.pathComponents?.some(pc => 
                    pc.component?.type === 'generator'
                );
                return hasGenerator;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Generator contribution to fault current detected',
            action: 'Review: 1) Generator protection settings, 2) Anti-islanding protection, 3) Fault current decay characteristics.',
            standard: 'IEEE 242-2001, IEEE 1547',
            impact: 'Bidirectional fault current, protection complexity',
            cost: 'MEDIUM',
            effort: 'Medium (protection study and settings)'
        }
    ],

    /**
     * CATEGORY G: CABLE RULES
     */
    cable: [
        {
            id: 'CB-001',
            name: 'Long Cable Run High Drop',
            condition: (bus, standards) => {
                const longCable = bus.pathComponents?.find(pc => 
                    pc.component?.type === 'cable' && 
                    pc.component?.length > 500
                );
                return longCable && bus.results?.voltageDrop?.maxDropPercent > 2;
            },
            severity: 'MEDIUM',
            priority: 3,
            recommendation: 'Long cable run (>500 ft) with voltage drop >2%',
            action: 'Consider: 1) Larger conductor size, 2) Parallel cables, 3) Intermediate voltage boost.',
            standard: 'IEEE 141-1993',
            impact: 'Poor voltage regulation',
            cost: 'MEDIUM',
            effort: 'High (cable replacement)'
        },
        {
            id: 'CB-002',
            name: 'Small Conductor High Fault Current',
            condition: (bus, standards) => {
                const smallCable = bus.pathComponents?.find(pc => 
                    pc.component?.type === 'cable' && 
                    parseInt(pc.component?.size) < 4
                );
                return smallCable && bus.results?.faultCurrents?.threePhaseSym > 10;
            },
            severity: 'HIGH',
            priority: 2,
            recommendation: 'Small conductor (<4 AWG) with high fault current (>10 kA)',
            action: 'Verify: 1) Cable short-circuit withstand (I²t), 2) Overcurrent protection response time, 3) Cable insulation rating.',
            standard: 'IEEE 242-2001, NEC 110.10',
            impact: 'Potential cable damage during fault',
            cost: 'LOW',
            effort: 'Low (verification) to High (if replacement needed)'
        }
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationRules;
}

console.log('✅ RecommendationRules loaded successfully');