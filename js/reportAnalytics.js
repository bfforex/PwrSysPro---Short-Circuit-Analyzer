/**
 * Report Analytics Module
 * Handles metrics aggregation, statistical analysis, and voltage drop calculations
 * for the Short Circuit Analyzer
 * 
 * @author bfforex
 * @date 2025-10-27
 */

class ReportAnalytics {
    constructor() {
        this.buses = [];
        this.metrics = {};
        this.statistics = {};
        this.extremeValues = {};
        this.voltageDropData = {};
    }

    /**
     * Initialize analytics with bus data
     * @param {Array} busArray - Array of bus objects with calculation results
     */
    initialize(busArray) {
        this.buses = busArray;
        this.aggregateMetrics();
        this.calculateStatistics();
        this.identifyExtremes();
        this.calculateVoltageDrops();
        this.rankBuses();
    }

    /**
     * Aggregate all metrics from buses
     */
    aggregateMetrics() {
        this.metrics = {
            faultCurrents: {
                threePhaseSym: [],
                threePhaseAsym: [],
                lineToGround: [],
                lineToLine: []
            },
            impedances: {
                magnitude: [],
                angle: [],
                resistance: [],
                reactance: []
            },
            xrRatios: [],
            voltages: [],
            voltageDrops: [],
            busNames: [],
            busTypes: []
        };

        this.buses.forEach(bus => {
            // Fault currents
            if (bus.results && bus.results.faultCurrents) {
                this.metrics.faultCurrents.threePhaseSym.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: bus.results.faultCurrents.threePhaseSym || 0
                });
                this.metrics.faultCurrents.threePhaseAsym.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: bus.results.faultCurrents.threePhaseAsym || 0
                });
                this.metrics.faultCurrents.lineToGround.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: bus.results.faultCurrents.lineToGround || 0
                });
                this.metrics.faultCurrents.lineToLine.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: bus.results.faultCurrents.lineToLine || 0
                });
            }

            // Impedances
            if (bus.results && bus.results.totalImpedance) {
                const Z = bus.results.totalImpedance;
                this.metrics.impedances.magnitude.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: Z.magnitude || 0
                });
                this.metrics.impedances.angle.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: Z.angle || 0
                });
                this.metrics.impedances.resistance.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: Z.resistance || 0
                });
                this.metrics.impedances.reactance.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: Z.reactance || 0
                });
            }

            // X/R Ratios
            if (bus.results && bus.results.xrRatio !== undefined) {
                this.metrics.xrRatios.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: bus.results.xrRatio || 0
                });
            }

            // Voltages
            if (bus.voltage) {
                this.metrics.voltages.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: parseFloat(bus.voltage) || 0
                });
            }

            // Bus metadata
            this.metrics.busNames.push(bus.name || bus.id);
            this.metrics.busTypes.push(bus.type || 'unknown');
        });
    }

    /**
     * Calculate statistical measures for all metrics
     */
    calculateStatistics() {
        this.statistics = {
            faultCurrents: {
                threePhaseSym: this._calculateStats(this.metrics.faultCurrents.threePhaseSym),
                threePhaseAsym: this._calculateStats(this.metrics.faultCurrents.threePhaseAsym),
                lineToGround: this._calculateStats(this.metrics.faultCurrents.lineToGround),
                lineToLine: this._calculateStats(this.metrics.faultCurrents.lineToLine)
            },
            impedances: {
                magnitude: this._calculateStats(this.metrics.impedances.magnitude),
                resistance: this._calculateStats(this.metrics.impedances.resistance),
                reactance: this._calculateStats(this.metrics.impedances.reactance)
            },
            xrRatios: this._calculateStats(this.metrics.xrRatios),
            voltages: this._calculateStats(this.metrics.voltages),
            voltageDrops: this._calculateStats(this.metrics.voltageDrops)
        };
    }

    /**
     * Helper function to calculate statistics
     * @private
     */
    _calculateStats(dataArray) {
        if (!dataArray || dataArray.length === 0) {
            return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, count: 0 };
        }

        const values = dataArray.map(item => item.value);
        const sorted = [...values].sort((a, b) => a - b);
        const count = values.length;
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / count;

        // Calculate standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);

        // Calculate median
        const median = count % 2 === 0
            ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
            : sorted[Math.floor(count / 2)];

        return {
            min: sorted[0],
            max: sorted[count - 1],
            mean: mean,
            median: median,
            stdDev: stdDev,
            count: count
        };
    }

    /**
     * Identify extreme values across all metrics
     */
    identifyExtremes() {
        this.extremeValues = {
            highestFaultCurrent: this._findExtreme(this.metrics.faultCurrents.threePhaseSym, 'max'),
            lowestFaultCurrent: this._findExtreme(this.metrics.faultCurrents.threePhaseSym, 'min'),
            highestImpedance: this._findExtreme(this.metrics.impedances.magnitude, 'max'),
            lowestImpedance: this._findExtreme(this.metrics.impedances.magnitude, 'min'),
            highestXRRatio: this._findExtreme(this.metrics.xrRatios, 'max'),
            lowestXRRatio: this._findExtreme(this.metrics.xrRatios, 'min'),
            highestVoltage: this._findExtreme(this.metrics.voltages, 'max'),
            lowestVoltage: this._findExtreme(this.metrics.voltages, 'min'),
            highestVoltageDrop: this._findExtreme(this.metrics.voltageDrops, 'max'),
            lowestVoltageDrop: this._findExtreme(this.metrics.voltageDrops, 'min')
        };
    }

    /**
     * Find extreme value (min or max) in dataset
     * @private
     */
    _findExtreme(dataArray, type = 'max') {
        if (!dataArray || dataArray.length === 0) {
            return { busId: 'N/A', busName: 'N/A', value: 0 };
        }

        return dataArray.reduce((extreme, current) => {
            if (type === 'max') {
                return current.value > extreme.value ? current : extreme;
            } else {
                return current.value < extreme.value ? current : extreme;
            }
        }, dataArray[0]);
    }

    /**
     * Calculate voltage drops for all buses based on load current and impedance
     */
    calculateVoltageDrops() {
        this.voltageDropData = {
            perBus: [],
            pathAnalysis: []
        };

        this.buses.forEach((bus, index) => {
            const voltageDropInfo = this._calculateBusVoltageDrop(bus, index);
            this.voltageDropData.perBus.push(voltageDropInfo);

            // Add to metrics for statistical analysis
            if (voltageDropInfo.dropPercent !== null) {
                this.metrics.voltageDrops.push({
                    busId: bus.id,
                    busName: bus.name,
                    value: voltageDropInfo.dropPercent
                });
            }
        });

        // Calculate path voltage drops (cumulative along system paths)
        this._calculatePathVoltageDrops();
    }

    /**
     * Calculate voltage drop for a single bus
     * @private
     */
    _calculateBusVoltageDrop(bus, index) {
        const result = {
            busId: bus.id,
            busName: bus.name,
            busIndex: index,
            nominalVoltage: parseFloat(bus.voltage) || 0,
            loadCurrent: 0,
            impedance: { R: 0, X: 0, Z: 0 },
            voltageDrop: { voltage: 0, percent: 0 },
            dropPercent: null,
            severity: 'OK',
            components: []
        };

        // Get load current from bus or connected components
        if (bus.loadCurrent) {
            result.loadCurrent = parseFloat(bus.loadCurrent);
        } else if (bus.load) {
            // Calculate load current from power: I = P / (√3 * V * PF)
            const power = parseFloat(bus.load.power) || 0;
            const powerFactor = parseFloat(bus.load.powerFactor) || 0.85;
            const voltage = parseFloat(bus.voltage) || 1;
            result.loadCurrent = power / (Math.sqrt(3) * voltage * powerFactor);
        }

        // Get impedance from results
        if (bus.results && bus.results.totalImpedance) {
            const Z = bus.results.totalImpedance;
            result.impedance.R = Z.resistance || 0;
            result.impedance.X = Z.reactance || 0;
            result.impedance.Z = Z.magnitude || 0;
        }

        // Calculate voltage drop: ΔV = I × (R×cosφ + X×sinφ) for single phase
        // For three-phase: ΔV = √3 × I × (R×cosφ + X×sinφ)
        if (result.loadCurrent > 0 && result.impedance.Z > 0) {
            const powerFactor = 0.85; // Default power factor
            const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
            
            // Voltage drop in volts
            const dropVolts = Math.sqrt(3) * result.loadCurrent * 
                (result.impedance.R * powerFactor + result.impedance.X * sinPhi);
            
            // Voltage drop percentage
            const dropPercent = (dropVolts / (result.nominalVoltage * 1000)) * 100;

            result.voltageDrop.voltage = dropVolts;
            result.voltageDrop.percent = dropPercent;
            result.dropPercent = dropPercent;

            // Determine severity based on IEEE standards
            if (dropPercent > 5) {
                result.severity = 'CRITICAL';
            } else if (dropPercent > 3) {
                result.severity = 'HIGH';
            } else if (dropPercent > 2) {
                result.severity = 'MEDIUM';
            } else {
                result.severity = 'OK';
            }
        }

        // Analyze components contributing to voltage drop
        if (bus.components && bus.components.length > 0) {
            bus.components.forEach(comp => {
                if (comp.type === 'cable' || comp.type === 'line') {
                    const compDrop = this._calculateComponentVoltageDrop(comp, result.loadCurrent);
                    result.components.push(compDrop);
                }
            });
        }

        return result;
    }

    /**
     * Calculate voltage drop for a specific component (cable/line)
     * @private
     */
    _calculateComponentVoltageDrop(component, current) {
        const compDrop = {
            type: component.type,
            name: component.name || component.id,
            resistance: parseFloat(component.resistance) || 0,
            reactance: parseFloat(component.reactance) || 0,
            length: parseFloat(component.length) || 0,
            voltageDrop: 0,
            contribution: 0
        };

        if (current > 0) {
            const powerFactor = 0.85;
            const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
            
            compDrop.voltageDrop = Math.sqrt(3) * current * 
                (compDrop.resistance * powerFactor + compDrop.reactance * sinPhi);
        }

        return compDrop;
    }

    /**
     * Calculate cumulative voltage drops along system paths
     * @private
     */
    _calculatePathVoltageDrops() {
        // Group buses by voltage level to identify paths
        const pathsByVoltage = {};
        
        this.buses.forEach((bus, index) => {
            const voltage = parseFloat(bus.voltage) || 0;
            if (!pathsByVoltage[voltage]) {
                pathsByVoltage[voltage] = [];
            }
            pathsByVoltage[voltage].push({
                bus: bus,
                index: index,
                voltageDrop: this.voltageDropData.perBus[index]
            });
        });

        // Calculate cumulative drops for each voltage level
        Object.keys(pathsByVoltage).forEach(voltageLevel => {
            const path = pathsByVoltage[voltageLevel];
            let cumulativeDrop = 0;
            let cumulativeDropPercent = 0;

            const pathData = {
                voltageLevel: parseFloat(voltageLevel),
                buses: [],
                totalDrop: 0,
                totalDropPercent: 0,
                severity: 'OK'
            };

            path.forEach((item, idx) => {
                cumulativeDrop += item.voltageDrop.voltageDrop.voltage;
                cumulativeDropPercent += item.voltageDrop.voltageDrop.percent;

                pathData.buses.push({
                    busName: item.bus.name || item.bus.id,
                    busIndex: item.index,
                    dropAtBus: item.voltageDrop.voltageDrop.percent,
                    cumulativeDrop: cumulativeDropPercent
                });
            });

            pathData.totalDrop = cumulativeDrop;
            pathData.totalDropPercent = cumulativeDropPercent;

            // Determine path severity
            if (cumulativeDropPercent > 5) {
                pathData.severity = 'CRITICAL';
            } else if (cumulativeDropPercent > 3) {
                pathData.severity = 'HIGH';
            } else if (cumulativeDropPercent > 2) {
                pathData.severity = 'MEDIUM';
            }

            this.voltageDropData.pathAnalysis.push(pathData);
        });
    }

    /**
     * Rank buses based on various metrics
     */
    rankBuses() {
        this.rankings = {
            byFaultCurrent: this._rankByMetric(this.metrics.faultCurrents.threePhaseSym, 'desc'),
            byImpedance: this._rankByMetric(this.metrics.impedances.magnitude, 'asc'),
            byXRRatio: this._rankByMetric(this.metrics.xrRatios, 'desc'),
            byVoltageDrop: this._rankByMetric(this.metrics.voltageDrops, 'desc')
        };

        // Add rankings to each bus
        this.buses.forEach((bus, index) => {
            bus.rankings = {
                faultCurrent: this._getBusRank(bus.id, this.rankings.byFaultCurrent),
                impedance: this._getBusRank(bus.id, this.rankings.byImpedance),
                xrRatio: this._getBusRank(bus.id, this.rankings.byXRRatio),
                voltageDrop: this._getBusRank(bus.id, this.rankings.byVoltageDrop)
            };
        });
    }

    /**
     * Rank data by metric value
     * @private
     */
    _rankByMetric(dataArray, order = 'desc') {
        if (!dataArray || dataArray.length === 0) return [];

        const sorted = [...dataArray].sort((a, b) => {
            return order === 'desc' ? b.value - a.value : a.value - b.value;
        });

        return sorted.map((item, index) => ({
            rank: index + 1,
            busId: item.busId,
            busName: item.busName,
            value: item.value
        }));
    }

    /**
     * Get rank for a specific bus
     * @private
     */
    _getBusRank(busId, rankingArray) {
        const item = rankingArray.find(r => r.busId === busId);
        return item ? item.rank : null;
    }

    /**
     * Calculate trend along a path of buses
     */
    calculateTrends(busPath) {
        const trends = {
            impedance: [],
            faultCurrent: [],
            voltageDrop: []
        };

        let cumulativeImpedance = 0;
        let cumulativeVoltageDrop = 0;

        busPath.forEach((busId, index) => {
            const bus = this.buses.find(b => b.id === busId);
            if (!bus || !bus.results) return;

            // Impedance trend
            if (bus.results.totalImpedance) {
                cumulativeImpedance += bus.results.totalImpedance.magnitude;
                trends.impedance.push({
                    position: index,
                    busName: bus.name || bus.id,
                    value: cumulativeImpedance
                });
            }

            // Fault current trend
            if (bus.results.faultCurrents) {
                trends.faultCurrent.push({
                    position: index,
                    busName: bus.name || bus.id,
                    value: bus.results.faultCurrents.threePhaseSym
                });
            }

            // Voltage drop trend
            const vDropData = this.voltageDropData.perBus.find(vd => vd.busId === busId);
            if (vDropData) {
                cumulativeVoltageDrop += vDropData.voltageDrop.percent;
                trends.voltageDrop.push({
                    position: index,
                    busName: bus.name || bus.id,
                    value: cumulativeVoltageDrop
                });
            }
        });

        return trends;
    }

    /**
     * Get complete analytics summary
     */
    getSummary() {
        return {
            totalBuses: this.buses.length,
            metrics: this.metrics,
            statistics: this.statistics,
            extremeValues: this.extremeValues,
            rankings: this.rankings,
            voltageDropData: this.voltageDropData,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get voltage drop report
     */
    getVoltageDropReport() {
        return {
            perBusAnalysis: this.voltageDropData.perBus,
            pathAnalysis: this.voltageDropData.pathAnalysis,
            statistics: this.statistics.voltageDrops,
            extremes: {
                highest: this.extremeValues.highestVoltageDrop,
                lowest: this.extremeValues.lowestVoltageDrop
            },
            criticalBuses: this.voltageDropData.perBus.filter(vd => 
                vd.severity === 'CRITICAL' || vd.severity === 'HIGH'
            )
        };
    }

    /**
     * Export data for external use
     */
    exportData(format = 'json') {
        const data = this.getSummary();
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this._convertToCSV(data);
        }
        
        return data;
    }

    /**
     * Convert data to CSV format
     * @private
     */
    _convertToCSV(data) {
        const rows = [];
        
        // Header
        rows.push(['Bus Name', 'Fault Current (kA)', 'Impedance (Ω)', 'X/R Ratio', 
                   'Voltage (kV)', 'Voltage Drop (%)', 'Severity']);
        
        // Data rows
        this.buses.forEach((bus, index) => {
            const vDrop = this.voltageDropData.perBus[index];
            rows.push([
                bus.name || bus.id,
                bus.results?.faultCurrents?.threePhaseSym?.toFixed(3) || 'N/A',
                bus.results?.totalImpedance?.magnitude?.toFixed(4) || 'N/A',
                bus.results?.xrRatio?.toFixed(2) || 'N/A',
                bus.voltage || 'N/A',
                vDrop?.dropPercent?.toFixed(2) || 'N/A',
                vDrop?.severity || 'N/A'
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportAnalytics;
}