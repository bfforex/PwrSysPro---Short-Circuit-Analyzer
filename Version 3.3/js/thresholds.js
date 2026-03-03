/**
 * Industry Standards and Thresholds Configuration
 * Based on IEEE, IEC, and ANSI standards for power system analysis
 * 
 * @author bfforex
 * @date 2025-10-27
 */

const IndustryStandards = {
    /**
     * X/R Ratio Standards (IEEE C37 Series)
     * Determines circuit breaker DC component capability
     */
    xrRatio: {
        categories: {
            low: {
                max: 4,
                description: 'Standard AC circuit breaker',
                breakerType: 'Standard AC rated',
                dcComponent: 'Minimal'
            },
            medium: {
                min: 4,
                max: 17,
                description: 'Standard breaker with DC component consideration',
                breakerType: 'Standard with DC rating',
                dcComponent: 'Moderate'
            },
            high: {
                min: 17,
                max: 30,
                description: 'Requires special DC component rating',
                breakerType: 'Enhanced DC rating required',
                dcComponent: 'Significant'
            },
            veryHigh: {
                min: 30,
                max: Infinity,
                description: 'Critical - Special breaker required',
                breakerType: 'Special high DC rating',
                dcComponent: 'Very High'
            }
        },
        // IEEE/UL voltage-class-specific X/R limits for standard breakers
        standardBreakerXR: {
            lowVoltage: 6.6,       // Per UL 489 / IEEE C37.13 (≤600V)
            mediumVoltage: 15,     // Per IEEE C37.010 (rated ≤500 MVA)
            mediumVoltageHigh: 17  // Per IEEE C37.010 (rated >500 MVA)
        },
        // Warning threshold
        warningThreshold: 15,
        // Critical threshold
        criticalThreshold: 20
    },

    /**
     * Voltage Drop Standards
     * NEC 210.19(A) FPN No. 4, NEC 215.2(A)(1) FPN, and IEEE 141-1993 §3.11
     */
    voltageDrop: {
        feeder: {
            recommended: 3,    // NEC 215.2(A)(1) FPN / IEEE 141-1993 §3.11
            maximum: 3,
            unit: '%',
            description: 'Primary feeder circuits'
        },
        branch: {
            recommended: 3,    // NEC 210.19(A) FPN No. 4
            maximum: 3,
            unit: '%',
            description: 'Branch circuits and final loads'
        },
        combined: {
            recommended: 5,    // NEC 210.19(A) FPN No. 4 / IEEE 141-1993 §3.11
            maximum: 5,        // IEEE 141-1993 recommends 5% combined maximum
            unit: '%',
            description: 'Combined feeder and branch'
        },
        motor: {
            starting: {
                maximum: 15,
                unit: '%',
                description: 'Motor starting voltage dip (IEEE 141-1993 §3.11.2) — this is a voltage dip, not a steady-state voltage drop'
            },
            running: {
                maximum: 5,
                unit: '%',
                description: 'Motor running voltage drop'
            }
        },
        // Voltage levels
        levels: {
            lowVoltage: {
                range: [0, 1],
                maxDrop: 3,
                description: 'Low voltage systems (< 1 kV)'
            },
            mediumVoltage: {
                range: [1, 35],
                maxDrop: 5,
                description: 'Medium voltage systems (1-35 kV)'
            },
            highVoltage: {
                range: [35, 230],
                maxDrop: 7,
                description: 'High voltage systems (35-230 kV)'
            }
        }
    },

    /**
     * Fault Current Capacity Standards
     * Based on equipment ratings and safety margins
     */
    faultCurrent: {
        utilization: {
            normal: {
                max: 0.70,
                description: 'Normal operating range',
                severity: 'OK'
            },
            warning: {
                min: 0.70,
                max: 0.85,
                description: 'Approaching limit - monitor',
                severity: 'MEDIUM'
            },
            high: {
                min: 0.85,
                max: 0.95,
                description: 'High utilization - review required',
                severity: 'HIGH'
            },
            critical: {
                min: 0.95,
                max: 1.0,
                description: 'Critical - immediate action required',
                severity: 'CRITICAL'
            },
            exceeded: {
                min: 1.0,
                max: Infinity,
                description: 'Capacity exceeded - unsafe',
                severity: 'CRITICAL'
            }
        },
        // Typical equipment ratings by voltage level (kA)
        typicalRatings: {
            lowVoltage: {
                '0.4kV': [25, 35, 50, 65],
                '0.69kV': [25, 35, 50]
            },
            mediumVoltage: {
                '11kV': [25, 31.5, 40],
                '22kV': [25, 31.5, 40],
                '33kV': [31.5, 40, 50]
            }
        }
    },

    /**
     * Impedance Standards
     * System impedance guidelines
     */
    impedance: {
        // Minimum impedance considerations
        minimum: {
            lowVoltage: 0.001,  // Ohms
            mediumVoltage: 0.01,
            highVoltage: 0.1,
            description: 'Below these values may indicate calculation errors or extremely stiff sources'
        },
        // Maximum impedance for stability
        maximum: {
            stability: {
                powerFactor: 0.85,
                maxImpedance: 10,  // Per unit on system base
                description: 'Maximum for stable operation'
            }
        }
    },

    /**
     * Transformer Standards (IEEE C57 Series)
     */
    transformer: {
        faultDuration: {
            mechanical: {
                duration: 2,  // seconds
                unit: 's',
                description: 'Mechanical withstand for 2 seconds'
            },
            thermal: {
                duration: 3600,  // seconds (1 hour)
                unit: 's',
                description: 'Thermal withstand capability'
            }
        },
        impedance: {
            typical: {
                '< 1MVA': { min: 4, max: 6, unit: '%' },
                '1-10MVA': { min: 5, max: 7, unit: '%' },
                '> 10MVA': { min: 6, max: 10, unit: '%' }
            }
        }
    },

    /**
     * Cable Standards (IEC 60364, IEEE 141)
     */
    cable: {
        voltageDrop: {
            power: {
                max: 3,
                unit: '%',
                description: 'Power circuits'
            },
            lighting: {
                max: 3,
                unit: '%',
                description: 'Lighting circuits'
            }
        },
        currentCarrying: {
            utilizationFactor: 0.80,  // 80% of rated capacity
            description: 'Recommended continuous current as % of rated'
        },
        shortCircuit: {
            durationStandard: 1,  // second
            formula: 'I²t',
            description: 'Short-circuit withstand based on I²t'
        }
    },

    /**
     * Protection Device Standards (IEEE 242 - Buff Book)
     */
    protection: {
        circuitBreaker: {
            interruptingCapacity: {
                safetyMargin: 1.25,
                description: 'Engineering practice: IC should exceed calculated fault current. Per NEC 110.9, IC must equal or exceed available fault current (no explicit margin required by code). The 1.25 factor is a recommended engineering safety margin, not a code requirement.'
            },
            operatingTime: {
                instantaneous: { max: 0.05, unit: 's' },
                shortTime: { max: 0.5, unit: 's' },
                longTime: { max: 3, unit: 's' }
            }
        },
        fuse: {
            ratingFactor: {
                min: 1.25,
                max: 2.5,
                description: 'Fuse rating relative to load current'
            }
        },
        relay: {
            pickupSetting: {
                min: 1.05,
                max: 1.5,
                description: 'Relay pickup as multiple of load current'
            }
        }
    },

    /**
     * System Health Score Weights
     */
    healthScore: {
        weights: {
            faultCurrentUtilization: 0.30,
            voltageDropSeverity: 0.25,
            xrRatioCompliance: 0.20,
            impedanceBalance: 0.15,
            protectionCoordination: 0.10
        },
        grading: {
            excellent: { min: 90, max: 100, description: 'Excellent system health' },
            good: { min: 75, max: 89, description: 'Good system health' },
            fair: { min: 60, max: 74, description: 'Fair - some improvements needed' },
            poor: { min: 40, max: 59, description: 'Poor - action required' },
            critical: { min: 0, max: 39, description: 'Critical - immediate action required' }
        }
    },

    /**
     * Get X/R ratio category
     */
    getXRCategory(xrRatio) {
        const cats = this.xrRatio.categories;
        if (xrRatio <= cats.low.max) return cats.low;
        if (xrRatio <= cats.medium.max) return cats.medium;
        if (xrRatio <= cats.high.max) return cats.high;
        return cats.veryHigh;
    },

    /**
     * Get voltage drop severity
     */
    getVoltageDropSeverity(dropPercent, circuitType = 'combined') {
        const standards = this.voltageDrop[circuitType];
        if (!standards) return 'UNKNOWN';
        
        if (dropPercent <= standards.recommended) return 'OK';
        if (dropPercent <= standards.maximum) return 'MEDIUM';
        if (dropPercent <= standards.maximum * 1.2) return 'HIGH';
        return 'CRITICAL';
    },

    /**
     * Get fault current utilization severity
     */
    getFaultCurrentSeverity(utilization) {
        const utils = this.faultCurrent.utilization;
        if (utilization <= utils.normal.max) return utils.normal.severity;
        if (utilization <= utils.warning.max) return utils.warning.severity;
        if (utilization <= utils.high.max) return utils.high.severity;
        if (utilization <= utils.critical.max) return utils.critical.severity;
        return utils.exceeded.severity;
    },

    /**
     * Validate system against standards
     */
    validateSystem(metrics) {
        const violations = [];
        const warnings = [];
        const recommendations = [];

        // Check X/R ratios
        if (metrics.xrRatios) {
            metrics.xrRatios.forEach(xr => {
                if (xr.value > this.xrRatio.criticalThreshold) {
                    violations.push({
                        type: 'X/R_RATIO_CRITICAL',
                        busId: xr.busId,
                        busName: xr.busName,
                        value: xr.value,
                        threshold: this.xrRatio.criticalThreshold,
                        severity: 'CRITICAL'
                    });
                } else if (xr.value > this.xrRatio.warningThreshold) {
                    warnings.push({
                        type: 'X/R_RATIO_WARNING',
                        busId: xr.busId,
                        busName: xr.busName,
                        value: xr.value,
                        threshold: this.xrRatio.warningThreshold,
                        severity: 'MEDIUM'
                    });
                }
            });
        }

        // Check voltage drops
        if (metrics.voltageDrops) {
            metrics.voltageDrops.forEach(vd => {
                const severity = this.getVoltageDropSeverity(vd.value);
                if (severity === 'CRITICAL' || severity === 'HIGH') {
                    violations.push({
                        type: 'VOLTAGE_DROP_EXCESSIVE',
                        busId: vd.busId,
                        busName: vd.busName,
                        value: vd.value,
                        threshold: this.voltageDrop.combined.maximum,
                        severity: severity
                    });
                }
            });
        }

        return {
            violations: violations,
            warnings: warnings,
            recommendations: recommendations,
            isCompliant: violations.length === 0,
            overallSeverity: violations.length > 0 ? 'NON_COMPLIANT' : 
                           warnings.length > 0 ? 'WARNING' : 'COMPLIANT'
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndustryStandards;
}