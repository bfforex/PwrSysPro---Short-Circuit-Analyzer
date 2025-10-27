/**
 * Recommendation Rules Library
 * Based on IEEE 141, IEEE 1584, NEC, and industry best practices
 * 
 * @author bfforex
 * @date 2025-10-27
 * @version 1.0.0
 */

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
                return bus.results?.voltageDrop?.cumulativeDropPercent > 7;
            },
            severity: 'CRITICAL',
            priority: 1,
            recommendation: 'Voltage drop exceeds IEEE 141 maximum limit (7%)',
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
                       bus.results?.voltageDrop?.cumulativeDropPercent <= 7;
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
        }
    ],

    /**
     * CATEGORY E: TRANSFORMER RULES
     * Evaluate transformer loading and fault withstand
     */
    transformer: [
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
