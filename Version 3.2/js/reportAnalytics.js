/**
 * Report Analytics Module - Aligned with calculations.js
 * Handles metrics aggregation, statistical analysis, and voltage drop analysis
 * for the Short Circuit Analyzer
 * 
 * @author bfforex
 * @date 2025-10-27 03:23:27 UTC
 * @version 2.0 - Aligned with integrated voltage drop calculations
 * 
 * IMPORTANT: This module now prioritizes voltage drop data from calculations.js
 * and falls back to independent calculation only when needed.
 */

class ReportAnalytics {
    constructor() {
        this.buses = [];
        this.metrics = {};
        this.statistics = {};
        this.extremeValues = {};
        this.voltageDropData = {};
        this.calculationSource = 'unknown'; // Track data source for debugging
    }

    /**
     * Initialize analytics with bus data
     * @param {Array} busArray - Array of bus objects with calculation results
     */
    initialize(busArray) {
        if (!busArray || busArray.length === 0) {
            console.warn('⚠️  ReportAnalytics: No bus data provided for initialization');
            return;
        }
        
        this.buses = busArray;
        
        console.log(`📊 ReportAnalytics: Initializing with ${busArray.length} buses`);
        
        // Check if buses have calculation data
        const busesWithCalcs = busArray.filter(b => b.results);
        console.log(`   ✓ ${busesWithCalcs.length} buses have calculation results`);
        
        // Check if buses have voltage drop data from calculations
        const busesWithVD = busArray.filter(b => b.results && b.results.voltageDrop);
        console.log(`   ✓ ${busesWithVD.length} buses have integrated voltage drop data`);
        
        this.aggregateMetrics();
        this.calculateStatistics();
        this.identifyExtremes();
        this.processVoltageDrop();
        this.rankBuses();
        
        console.log(`   ✓ Analytics initialization complete`);
    }

    /**
     * Aggregate all metrics from buses
     * Compatible with existing short circuit calculation results
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
            const busId = bus.id;
            const busName = bus.name || bus.id;
            
            // Aggregate fault currents (existing short circuit data)
            // ✅ Bug #2 FIX: Also check nested shortCircuit.faultCurrents structure
            const faultCurrents = bus.results?.faultCurrents || bus.results?.shortCircuit?.faultCurrents;
            if (faultCurrents) {
                this.metrics.faultCurrents.threePhaseSym.push({
                    busId: busId,
                    busName: busName,
                    value: faultCurrents.threePhaseSym || 0
                });
                this.metrics.faultCurrents.threePhaseAsym.push({
                    busId: busId,
                    busName: busName,
                    value: faultCurrents.threePhaseAsym || 0
                });
                this.metrics.faultCurrents.lineToGround.push({
                    busId: busId,
                    busName: busName,
                    value: faultCurrents.lineToGround || 0
                });
                this.metrics.faultCurrents.lineToLine.push({
                    busId: busId,
                    busName: busName,
                    value: faultCurrents.lineToLine || 0
                });
            }

            // Aggregate impedances (existing short circuit data)
            if (bus.results && bus.results.totalImpedance) {
                const Z = bus.results.totalImpedance;
                this.metrics.impedances.magnitude.push({
                    busId: busId,
                    busName: busName,
                    value: Z.magnitude || 0
                });
                this.metrics.impedances.angle.push({
                    busId: busId,
                    busName: busName,
                    value: Z.angle || 0
                });
                this.metrics.impedances.resistance.push({
                    busId: busId,
                    busName: busName,
                    value: Z.resistance || 0
                });
                this.metrics.impedances.reactance.push({
                    busId: busId,
                    busName: busName,
                    value: Z.reactance || 0
                });
            }

            // Aggregate X/R Ratios (existing short circuit data)
            if (bus.results && bus.results.xrRatio !== undefined) {
                this.metrics.xrRatios.push({
                    busId: busId,
                    busName: busName,
                    value: bus.results.xrRatio || 0
                });
            }

            // Aggregate voltages
            if (bus.voltage) {
                this.metrics.voltages.push({
                    busId: busId,
                    busName: busName,
                    value: parseFloat(bus.voltage) || 0
                });
            }

            // Bus metadata
            this.metrics.busNames.push(busName);
            this.metrics.busTypes.push(bus.type || 'unknown');
        });
    }

    /**
     * Process voltage drop data - prioritizes calculation data over independent calculation
     * This is the KEY method that aligns with calculations.js
     */
    processVoltageDrop() {
        this.voltageDropData = {
            perBus: [],
            pathAnalysis: [],
            source: 'unknown'
        };

        let busesWithIntegratedVD = 0;
        let busesWithCalculatedVD = 0;

        this.buses.forEach((bus, index) => {
            let voltageDropInfo = null;
            
            // PRIORITY 1: Use voltage drop data from calculations.js if available
            if (bus.results && bus.results.voltageDrop) {
                voltageDropInfo = this._extractCalculatedVoltageDrop(bus, index);
                busesWithIntegratedVD++;
                this.calculationSource = 'integrated';
            } 
            // PRIORITY 2: Calculate independently if no calculation data exists
            else {
                voltageDropInfo = this._calculateBusVoltageDrop(bus, index);
                busesWithCalculatedVD++;
                if (this.calculationSource !== 'integrated') {
                    this.calculationSource = 'independent';
                }
            }
            
            this.voltageDropData.perBus.push(voltageDropInfo);

            // Add to metrics for statistical analysis
            if (voltageDropInfo.dropPercent !== null && voltageDropInfo.dropPercent !== undefined) {
                this.metrics.voltageDrops.push({
                    busId: bus.id,
                    busName: bus.name || bus.id,
                    value: voltageDropInfo.dropPercent
                });
            }
        });

        console.log(`   📊 Voltage Drop Data Source:`);
        console.log(`      • Integrated (from calculations): ${busesWithIntegratedVD} buses`);
        console.log(`      • Independently calculated: ${busesWithCalculatedVD} buses`);
        
        this.voltageDropData.source = this.calculationSource;

        // Calculate path voltage drops (cumulative along system paths)
        this._calculatePathVoltageDrops();
    }

    /**
     * Extract voltage drop data from calculations.js results
     * FIXED: 2025-11-02 07:57:16 UTC by bfforex
     * @private
     */
    _extractCalculatedVoltageDrop(bus, index) {
        const vdCalc = bus.results.voltageDrop;
    
        // ✅ FIX: Check multiple possible property names
        let dropPercent = 0;
        let dropVolts = 0;
       
        if (vdCalc.cumulativeDropPercent !== undefined) {
            dropPercent = vdCalc.cumulativeDropPercent;
            dropVolts = vdCalc.cumulativeDropVolts || (dropPercent * bus.voltage / 100);
        } else if (vdCalc.totalDropPercent !== undefined) {
            dropPercent = vdCalc.totalDropPercent;
            dropVolts = vdCalc.totalDropVolts || (dropPercent * bus.voltage / 100);
        } else if (vdCalc.dropPercent !== undefined) {
            dropPercent = vdCalc.dropPercent;
            dropVolts = vdCalc.voltageDrop || (dropPercent * bus.voltage / 100);
        }         

        const result = {
            busId: bus.id,
            busName: bus.name || bus.id,
            busIndex: index,
            nominalVoltage: parseFloat(bus.voltage) || 0,
            loadCurrent: 0,
            impedance: {
                R: bus.results.totalImpedance?.resistance || 0,
                X: bus.results.totalImpedance?.reactance || 0,
                Z: bus.results.totalImpedance?.magnitude || 0
            },
            voltageDrop: {
                voltage: dropVolts,
                percent: dropPercent
            },
            dropPercent: dropPercent,  // ✅ NOW CORRECT
            severity: this._determineSeverity(dropPercent),
            components: [],
            source: 'integrated-calculation'
        };

        // Extract component-level voltage drops
        if (vdCalc.components && Array.isArray(vdCalc.components)) {
            result.components = vdCalc.components.map(comp => ({
                type: comp.type || 'unknown',
                name: comp.name || 'N/A',
                step: comp.step || 0,
                voltageDrop: comp.dropVolts || 0,
                dropPercent: comp.dropPercent || 0,
                severity: comp.severity || 'OK',
                current: comp.current || 0
            }));
            
            // Get load current from first component if available
            if (result.components.length > 0 && result.components[0].current) {
                result.loadCurrent = result.components[0].current;
            }
        }

        // Override severity if critical components detected
        if (vdCalc.criticalComponents && vdCalc.criticalComponents.length > 0) {
            result.severity = 'CRITICAL';
        }

        return result;
    }

    /**
     * Calculate voltage drop for a single bus (fallback method)
     * Used only when calculation data is not available
     * @private
     */
    _calculateBusVoltageDrop(bus, index) {
        const result = {
            busId: bus.id,
            busName: bus.name || bus.id,
            busIndex: index,
            nominalVoltage: parseFloat(bus.voltage) || 0,
            loadCurrent: 0,
            impedance: { R: 0, X: 0, Z: 0 },
            voltageDrop: { voltage: 0, percent: 0 },
            dropPercent: 0,
            severity: 'N/A',
            components: [],
            source: 'independent-calculation'
        };

        // Get load current from bus
        if (bus.loadCurrent) {
            result.loadCurrent = parseFloat(bus.loadCurrent);
        } else if (bus.load && bus.load.power && bus.voltage) {
            // Calculate load current from power: I = P / (√3 * V * PF)
            const power = parseFloat(bus.load.power) || 0;
            const powerFactor = parseFloat(bus.load.powerFactor) || 0.85;
            const voltage = parseFloat(bus.voltage) / 1000; // Convert to kV
            result.loadCurrent = (power / (Math.sqrt(3) * voltage * powerFactor)) * 1000;
        } else if (bus.results && bus.results.faultCurrents && bus.results.faultCurrents.threePhaseSym) {
            // Use 40% of fault current as conservative estimate
            result.loadCurrent = bus.results.faultCurrents.threePhaseSym * 1000 * 0.40;
        }

        // Get impedance from results
        if (bus.results && bus.results.totalImpedance) {
            const Z = bus.results.totalImpedance;
            result.impedance.R = Z.resistance || 0;
            result.impedance.X = Z.reactance || 0;
            result.impedance.Z = Z.magnitude || 0;
        }

        // Calculate voltage drop: ΔV = √3 × I × (R×cosφ + X×sinφ)
        if (result.loadCurrent > 0 && result.impedance.Z > 0) {
            const powerFactor = 0.85; // Default power factor
            const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
            
            // Voltage drop in volts
            const dropVolts = Math.sqrt(3) * result.loadCurrent * 
                (result.impedance.R * powerFactor + result.impedance.X * sinPhi);
            
            // Voltage drop percentage
            const dropPercent = (dropVolts / result.nominalVoltage) * 100;

            result.voltageDrop.voltage = dropVolts;
            result.voltageDrop.percent = dropPercent;
            result.dropPercent = dropPercent;

            // Determine severity based on IEEE 141 standards
            result.severity = this._determineSeverity(dropPercent);
        }

        return result;
    }

    /**
     * Determine voltage drop severity based on IEEE 141 standards
     * @private
     */
    _determineSeverity(dropPercent) {
        if (dropPercent > 7) {
            return 'CRITICAL';
        } else if (dropPercent > 5) {
            return 'HIGH';
        } else if (dropPercent > 3) {
            return 'MEDIUM';
        } else if (dropPercent > 0) {
            return 'OK';
        } else {
            return 'N/A';
        }
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
                const busDropVolts = item.voltageDrop.voltageDrop?.voltage || 0;
                const busDropPercent = item.voltageDrop.voltageDrop?.percent || item.voltageDrop.dropPercent || 0;
                
                cumulativeDrop += busDropVolts;
                cumulativeDropPercent += busDropPercent;

                pathData.buses.push({
                    busName: item.bus.name || item.bus.id,
                    busIndex: item.index,
                    dropAtBus: busDropPercent,
                    cumulativeDrop: cumulativeDropPercent
                });
            });

            pathData.totalDrop = cumulativeDrop;
            pathData.totalDropPercent = cumulativeDropPercent;

            // Determine path severity
            pathData.severity = this._determineSeverity(cumulativeDropPercent);

            this.voltageDropData.pathAnalysis.push(pathData);
        });
    }

    /**
     * Calculate statistical measures for all metrics
     * Compatible with existing short circuit metrics
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
     * Get equipment count summary
     * NEW METHOD - Issue #6
     */
    getEquipmentSummary() {
        const transformers = components.filter(c => c.type === 'transformer');
        const cables = components.filter(c => c.type === 'cable');
        const motors = components.filter(c => c.type === 'motor');
        const generators = components.filter(c => c.type === 'generator');

        return {
            transformers: {
                count: transformers.length,
                totalCapacity: transformers.reduce((sum, t) => sum + (parseFloat(t.rating) || 0), 0),
                details: transformers.map(t => ({
                    tag: t.tag || t.name,
                    rating: t.rating,
                    primaryVoltage: t.primaryVoltage,
                    secondaryVoltage: t.secondaryVoltage,
                    impedance: t.impedance,
                    tapSetting: t.tapSetting
                }))
            },
            cables: {
                count: cables.length,
                totalLength: cables.reduce((sum, c) => sum + (parseFloat(c.length) || 0), 0),
                byVoltage: this._groupCablesByVoltage(cables),
                details: cables.map(c => ({
                    tag: c.tag,
                    size: c.size,
                    material: c.material,
                    length: c.length,
                    parallel: c.parallel
                }))
            },
            motors: {
                count: motors.length,
                totalHP: motors.reduce((sum, m) => sum + (parseFloat(m.hp) || 0), 0),
                totalFLC: motors.reduce((sum, m) => sum + (parseFloat(m.fullLoadCurrent) || 0), 0),
                details: motors.map(m => ({
                    tag: m.tag || m.name,
                    hp: m.hp,
                    voltage: m.voltage,
                    fullLoadCurrent: m.fullLoadCurrent,
                    motorType: m.motorType
                }))
            },
            generators: {
                count: generators.length,
                details: generators
            }
        };
    }

    /**
     * Group cables by voltage level
     * @private
     */
    _groupCablesByVoltage(cables) {
        const groups = {};
        
        cables.forEach(cable => {
            const fromBus = this.buses.find(b => b.id === cable.fromBus);
            const voltage = fromBus?.voltage || 'Unknown';
            
            if (!groups[voltage]) {
                groups[voltage] = {
                    count: 0,
                    totalLength: 0,
                    cables: []
                };
            }
            
            groups[voltage].count++;
            groups[voltage].totalLength += parseFloat(cable.length) || 0;
            groups[voltage].cables.push(cable);
        });
        
        return groups;
    }

    /**
     * Calculate critical paths in the system
     * NEW METHOD - Issue #6
     */
    getCriticalPaths(topN = 5) {
        const paths = [];
        
        this.buses.forEach(bus => {
            if (!bus.pathComponents || bus.pathComponents.length <= 2) {
                return; // Skip buses with no significant path
            }
            
            let pathLength = 0;
            let pathImpedance = 0;
            let pathVoltageDrop = 0;
            let cableCount = 0;
            let transformerCount = 0;
            
            bus.pathComponents.forEach(segment => {
                if (segment.component?.type === 'cable') {
                    pathLength += parseFloat(segment.component.length) || 0;
                    cableCount++;
                } else if (segment.component?.type === 'transformer') {
                    transformerCount++;
                }
            });
            
            if (bus.results?.totalImpedance) {
                pathImpedance = bus.results.totalImpedance.magnitude || 0;
            }
            
            if (bus.results?.voltageDrop) {
                pathVoltageDrop = bus.results.voltageDrop.cumulativeDropPercent || 0;
            }
            
            const faultCurrent = bus.results?.faultCurrents?.threePhaseSym || 0;
            const voltageLevel = bus.voltage;
            
            // Calculate criticality score (higher = more critical)
            const criticalityScore = 
                (pathVoltageDrop > 5 ? 100 : 0) +  // High voltage drop
                (pathVoltageDrop * 10) +             // General VD contribution
                (pathLength / 100) +                 // Long path
                (transformerCount * 20) +            // Transformers add complexity
                (faultCurrent < 10 ? 50 : 0);        // Weak source

            paths.push({
                busName: bus.name,
                busId: bus.id,
                pathLength: pathLength,
                pathDepth: bus.pathComponents.length,
                cableCount: cableCount,
                transformerCount: transformerCount,
                impedance: pathImpedance,
                voltageDrop: pathVoltageDrop,
                faultCurrent: faultCurrent,
                voltageLevel: voltageLevel,
                criticalityScore: criticalityScore,
                pathComponents: bus.pathComponents,
                status: this._determinePathStatus(pathVoltageDrop, faultCurrent)
            });
        });
        
        // Sort by criticality score (descending)
        paths.sort((a, b) => b.criticalityScore - a.criticalityScore);
        
        return paths.slice(0, topN);
    }

    /**
     * Determine path status based on metrics
     * @private
     */
    _determinePathStatus(voltageDrop, faultCurrent) {
        if (voltageDrop > 7 || faultCurrent > 100) {
            return 'CRITICAL';
        } else if (voltageDrop > 5 || faultCurrent > 65) {
            return 'HIGH';
        } else if (voltageDrop > 3 || faultCurrent > 42) {
            return 'MEDIUM';
        } else {
            return 'OK';
        }
    }

    /**
     * Calculate system efficiency metrics
     * NEW METHOD - Issue #6
     */
    getEfficiencyMetrics() {
        const powerFactor = parseFloat(document.getElementById('powerFactor')?.value || 0.85);
        
        // Calculate total system power
        let totalKVA = 0;
        let totalCurrent = 0;
        let avgVoltage = 0;
        
        this.buses.forEach(bus => {
            if (bus.results?.loadFlow?.summary) {
                const current = bus.results.loadFlow.summary.totalCurrent || 0;
                const voltage = bus.voltage;
                totalCurrent += current;
                avgVoltage += voltage;
                totalKVA += (current * voltage * Math.sqrt(3)) / 1000;
            }
        });
        
        avgVoltage = this.buses.length > 0 ? avgVoltage / this.buses.length : 480;
        const totalKW = totalKVA * powerFactor;
        
        // Calculate losses
        const losses = this._calculateSystemLosses(totalCurrent);
        
        // Calculate efficiency
        const totalInput = totalKW + losses.totalLosses;
        const efficiency = totalInput > 0 ? (totalKW / totalInput) * 100 : 0;
        
        return {
            powerFactor: powerFactor,
            totalKVA: totalKVA,
            totalKW: totalKW,
            totalCurrent: totalCurrent,
            avgVoltage: avgVoltage,
            losses: losses,
            efficiency: efficiency,
            annualEnergyCost: this._calculateAnnualEnergyCost(totalKW, losses.totalLosses)
        };
    }

    /**
     * Calculate system losses (cables + transformers)
     * @private
     */
    _calculateSystemLosses(totalCurrent) {
        let cableLosses_MV = 0;
        let cableLosses_LV = 0;
        let transformerNoLoadLosses = 0;
        let transformerLoadLosses = 0;
        
        // Cable losses
        const cables = components.filter(c => c.type === 'cable');
        cables.forEach(cable => {
            const fromBus = this.buses.find(b => b.id === cable.fromBus);
            const toBus = this.buses.find(b => b.id === cable.toBus);
            
            if (toBus?.results?.loadFlow?.summary) {
                const current = toBus.results.loadFlow.summary.totalCurrent || 0;
                const length = parseFloat(cable.length) || 0;
                const parallel = cable.parallel || 1;
                
                // Simplified resistance calculation
                const size = parseInt(cable.size) || 250;
                let resistance = 0.1;
                
                if (size <= 4) resistance = 0.4;
                else if (size <= 2) resistance = 0.3;
                else if (size <= 1) resistance = 0.25;
                else if (size <= 250) resistance = 0.1;
                else if (size <= 500) resistance = 0.05;
                else resistance = 0.03;
                
                const R = (resistance * length / 1000) / parallel;
                const loss = 3 * Math.pow(current, 2) * R / 1000;
                
                if (fromBus && fromBus.voltage >= 1000) {
                    cableLosses_MV += loss;
                } else {
                    cableLosses_LV += loss;
                }
            }
        });
        
        // Transformer losses
        const transformers = components.filter(c => c.type === 'transformer');
        transformers.forEach(xfmr => {
            const rating = parseFloat(xfmr.rating) || 1000;
            transformerNoLoadLosses += rating * 0.003;
            
            const toBus = this.buses.find(b => b.id === xfmr.toBus);
            if (toBus?.results?.loadFlow?.summary) {
                const current = toBus.results.loadFlow.summary.totalCurrent || 0;
                const voltage = toBus.voltage;
                const loadKVA = (current * voltage * Math.sqrt(3)) / 1000;
                const loading = loadKVA / rating;
                
                transformerLoadLosses += rating * 0.015 * Math.pow(loading, 2);
            }
        });
        
        return {
            cableLosses_MV: cableLosses_MV,
            cableLosses_LV: cableLosses_LV,
            totalCableLosses: cableLosses_MV + cableLosses_LV,
            transformerNoLoadLosses: transformerNoLoadLosses,
            transformerLoadLosses: transformerLoadLosses,
            totalTransformerLosses: transformerNoLoadLosses + transformerLoadLosses,
            totalLosses: cableLosses_MV + cableLosses_LV + transformerNoLoadLosses + transformerLoadLosses
        };
    }

    /**
     * Calculate annual energy cost
     * @private
     */
    _calculateAnnualEnergyCost(totalKW, lossesKW) {
        const hoursPerYear = 8760;
        const loadFactor = 0.7; // Typical industrial load factor
        const energyRate = 0.12; // $/kWh
        
        const annualEnergyConsumption = totalKW * hoursPerYear * loadFactor;
        const annualEnergyLoss = lossesKW * hoursPerYear * loadFactor;
        
        return {
            annualEnergyConsumption: annualEnergyConsumption,
            annualEnergyCost: annualEnergyConsumption * energyRate,
            annualEnergyLoss: annualEnergyLoss,
            annualLossCost: annualEnergyLoss * energyRate
        };
    }

    /**
     * Get system health summary
     * NEW METHOD - Issue #6
     */
    getSystemHealthSummary() {
        const vdCompliant = this.buses.filter(b => 
            b.results?.voltageDrop?.cumulativeDropPercent <= 7
        ).length;
        
        const avgVoltageDrop = this.statistics.voltageDrops?.mean || 0;
        const maxVoltageDrop = this.extremeValues?.highestVoltageDrop?.value || 0;
        const maxFaultCurrent = this.extremeValues?.highestFaultCurrent?.value || 0;
        const maxXR = this.extremeValues?.highestXRRatio?.value || 0;
        
        let healthScore = 100;
        let issues = [];
        
        // Voltage drop assessment
        if (maxVoltageDrop > 7) {
            healthScore -= 30;
            issues.push('CRITICAL: Voltage drop exceeds IEEE 141 limit');
        } else if (maxVoltageDrop > 5) {
            healthScore -= 15;
            issues.push('HIGH: Voltage drop approaching limits');
        } else if (maxVoltageDrop > 3) {
            healthScore -= 5;
            issues.push('MEDIUM: Voltage drop within acceptable range');
        }
        
        // Fault current assessment
        if (maxFaultCurrent > 100) {
            healthScore -= 20;
            issues.push('CRITICAL: Extremely high fault current');
        } else if (maxFaultCurrent > 65) {
            healthScore -= 10;
            issues.push('HIGH: High fault current requires verification');
        }
        
        // X/R ratio assessment
        if (maxXR > 20) {
            healthScore -= 20;
            issues.push('CRITICAL: X/R ratio requires DC-rated breakers');
        } else if (maxXR > 17) {
            healthScore -= 10;
            issues.push('HIGH: X/R ratio approaching limits');
        }
        
        // Compliance assessment
        if (vdCompliant < this.buses.length) {
            healthScore -= 15;
            issues.push(`${this.buses.length - vdCompliant} buses non-compliant with IEEE 141`);
        }
        
        let healthStatus = 'EXCELLENT';
        if (healthScore < 50) healthStatus = 'CRITICAL';
        else if (healthScore < 70) healthStatus = 'POOR';
        else if (healthScore < 85) healthStatus = 'FAIR';
        else if (healthScore < 95) healthStatus = 'GOOD';
        
        return {
            healthScore: Math.max(0, healthScore),
            healthStatus: healthStatus,
            issues: issues,
            metrics: {
                avgVoltageDrop: avgVoltageDrop,
                maxVoltageDrop: maxVoltageDrop,
                maxFaultCurrent: maxFaultCurrent,
                maxXR: maxXR,
                complianceRate: (vdCompliant / this.buses.length) * 100
            }
        };
    }

// End of new methods - add before the closing brace of the ReportAnalytics class

    /**
     * Identify extreme values across all metrics
     * Includes both short circuit and voltage drop extremes
     */
    identifyExtremes() {
        this.extremeValues = {
            // Short circuit extremes (existing)
            highestFaultCurrent: this._findExtreme(this.metrics.faultCurrents.threePhaseSym, 'max'),
            lowestFaultCurrent: this._findExtreme(this.metrics.faultCurrents.threePhaseSym, 'min'),
            highestImpedance: this._findExtreme(this.metrics.impedances.magnitude, 'max'),
            lowestImpedance: this._findExtreme(this.metrics.impedances.magnitude, 'min'),
            highestXRRatio: this._findExtreme(this.metrics.xrRatios, 'max'),
            lowestXRRatio: this._findExtreme(this.metrics.xrRatios, 'min'),
            highestVoltage: this._findExtreme(this.metrics.voltages, 'max'),
            lowestVoltage: this._findExtreme(this.metrics.voltages, 'min'),
            // Voltage drop extremes (new)
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
     * Rank buses based on various metrics
     * Compatible with existing short circuit rankings
     */
    rankBuses() {
        this.rankings = {
            byFaultCurrent: this._rankByMetric(this.metrics.faultCurrents.threePhaseSym, 'desc'),
            byImpedance: this._rankByMetric(this.metrics.impedances.magnitude, 'asc'),
            byXRRatio: this._rankByMetric(this.metrics.xrRatios, 'desc'),
            byVoltageDrop: this._rankByMetric(this.metrics.voltageDrops, 'desc')
        };

        // Add rankings to each bus (preserves existing bus objects)
        this.buses.forEach((bus, index) => {
            if (!bus.rankings) {
                bus.rankings = {};
            }
            bus.rankings.faultCurrent = this._getBusRank(bus.id, this.rankings.byFaultCurrent);
            bus.rankings.impedance = this._getBusRank(bus.id, this.rankings.byImpedance);
            bus.rankings.xrRatio = this._getBusRank(bus.id, this.rankings.byXRRatio);
            bus.rankings.voltageDrop = this._getBusRank(bus.id, this.rankings.byVoltageDrop);
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
     * Compatible with existing short circuit trends
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

            // Impedance trend (existing)
            if (bus.results.totalImpedance) {
                cumulativeImpedance += bus.results.totalImpedance.magnitude;
                trends.impedance.push({
                    position: index,
                    busName: bus.name || bus.id,
                    value: cumulativeImpedance
                });
            }

            // Fault current trend (existing)
            if (bus.results.faultCurrents) {
                trends.faultCurrent.push({
                    position: index,
                    busName: bus.name || bus.id,
                    value: bus.results.faultCurrents.threePhaseSym
                });
            }

            // Voltage drop trend (new - aligned with calculations)
            const vDropData = this.voltageDropData.perBus.find(vd => vd.busId === busId);
            if (vDropData && vDropData.dropPercent !== null) {
                cumulativeVoltageDrop += vDropData.dropPercent;
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
     * Includes both short circuit and voltage drop data
     */
    getSummary() {
        return {
            totalBuses: this.buses.length,
            metrics: this.metrics,
            statistics: this.statistics,
            extremeValues: this.extremeValues,
            rankings: this.rankings,
            voltageDropData: this.voltageDropData,
            dataSource: {
                voltageDropSource: this.calculationSource,
                hasIntegratedData: this.calculationSource === 'integrated'
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get voltage drop report
     * Aligned with calculations.js voltage drop data
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
            ),
            dataSource: this.calculationSource,
            complianceSummary: this._generateComplianceSummary()
        };
    }

    /**
     * Generate IEEE 141 compliance summary
     * FIXED: 2025-11-02 07:57:16 UTC by bfforex
     * @private
     */
    _generateComplianceSummary() {
        const summary = {
            totalBuses: this.voltageDropData.perBus.length,
            compliant: 0,
            warnings: 0,
            violations: 0,
            maxDrop: 0,
            overallStatus: 'COMPLIANT'
        };

        this.voltageDropData.perBus.forEach(vd => {
            if (vd.dropPercent > summary.maxDrop) {
                summary.maxDrop = vd.dropPercent;
            }

            if (vd.severity === 'OK') {
                summary.compliant++;
            } else if (vd.severity === 'MEDIUM') {
                summary.warnings++;
            } else if (vd.severity === 'HIGH' || vd.severity === 'CRITICAL') {
                summary.violations++;
            }
        });

        // ✅ FIX: Proper status determination
        const compliancePercent = (summary.compliant / summary.totalBuses) * 100;
        
        if (summary.violations > 0) {
            summary.overallStatus = 'NON-COMPLIANT';
        } else if (compliancePercent === 100) {
            summary.overallStatus = 'FULLY COMPLIANT';
        } else if (compliancePercent >= 90) {
            summary.overallStatus = 'MOSTLY COMPLIANT';  // ✅ 14/15 = 93.3% = MOSTLY
        } else if (compliancePercent >= 70) {
            summary.overallStatus = 'REVIEW REQUIRED';
        } else {
            summary.overallStatus = 'NON-COMPLIANT';
        }

        return summary;
    }

    /**
     * Export data for external use
     * @param {String} format - 'json' or 'csv'
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
                   'Voltage (kV)', 'Voltage Drop (%)', 'VD Severity', 'Data Source']);
        
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
                vDrop?.severity || 'N/A',
                vDrop?.source || 'N/A'
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportAnalytics;
}

// Console helper for verification
console.log('✅ ReportAnalytics v2.0 loaded - Aligned with calculations.js voltage drop integration');