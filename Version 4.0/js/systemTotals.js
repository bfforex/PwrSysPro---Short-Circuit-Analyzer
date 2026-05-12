/**
 * System Totals Module
 * Centralized functions for calculating system-level totals from entry buses
 *
 * @author bfforex
 * @date 2025-12-03
 * @version 3.3.0
 *
 * Purpose:
 * - Generic identification of system entry/source buses (no hardcoded names)
 * - Authoritative system totals from entry buses (not per-bus summation)
 * - Reusable across all reports and analytics
 *
 * Key Design Principles:
 * - System connected load = sum of ENTRY BUS currents only
 * - Entry buses are source buses without parent buses
 * - No hardcoded bus names (e.g., "EHV1") - fully generic
 */
console.log('🔧 Loading System Totals Module v3.3.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM ENTRY BUS IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all system entry buses (source buses without parents, with optional topology checks).
 *
 * Entry bus definition (enhanced):
 *  - bus.type === 'source'
 *  - bus.parentBus is not set
 *  - AND (optional topology check):
 *      - no component feeds this bus (no c.toBus === bus.id)
 *      - OR only bus-ties feed it and ALL such bus-ties are OPEN
 *
 * @param {Array} buses - Array of all buses
 * @param {Array} components - (optional) Array of components for topology validation
 * @returns {Array} Array of entry bus objects
 */
function getSystemEntryBuses(buses, components = []) {
  if (!buses || !Array.isArray(buses)) {
    console.warn('⚠️ getSystemEntryBuses: Invalid buses array');
    return [];
  }

  const entryBuses = buses.filter(b => {
    if (b.type !== 'source') return false;
    if (b.parentBus) return false;

    // If components not supplied, fall back to the original rule.
    if (!Array.isArray(components) || components.length === 0) {
      return true;
    }

    // Find any components that feed this bus.
    const feeders = components.filter(c => c && c.toBus === b.id);

    // No feeders = true entry
    if (feeders.length === 0) return true;

    // If only bus-ties feed it and they are OPEN, treat as entry
    const allFeedingTiesOpen = feeders.every(c => {
      if (c.type !== 'bus-tie') return false;
      const state = c.currentState ?? c.normalState ?? 'open';
      return state === 'open';
    });

    return allFeedingTiesOpen;
  });

  console.log(
    `📍 Found ${entryBuses.length} system entry buses:`,
    entryBuses.map(b => b.name).join(', ')
  );

  return entryBuses;
}

/**
 * Get the primary system entry bus (highest voltage source).
 *
 * @param {Array} buses - Array of all buses
 * @param {Array} components - (optional) Array of components for topology validation
 * @returns {Object|null} Primary entry bus or null if none found
 */
function getPrimarySystemEntryBus(buses, components = []) {
  const entryBuses = getSystemEntryBuses(buses, components);

  if (!entryBuses.length) {
    console.warn('⚠️ No system entry buses found');
    return null;
  }

  const primaryBus = entryBuses.reduce((max, b) => {
    const vB = Number(b.voltage || 0);
    const vMax = Number(max?.voltage || 0);
    return (max == null || vB > vMax) ? b : max;
  }, null);

  console.log(`📍 Primary entry bus: ${primaryBus.name} @ ${primaryBus.voltage}V`);
  return primaryBus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM TOTALS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get authoritative system totals from entry buses only.
 * Returns connected, demand, and diversity totals (A + kVA).
 *
 * @param {Array} buses - Array of all buses
 * @param {Array} components - (optional) Array of components for topology validation
 * @returns {Object} System totals object
 */
function getSystemEntryTotals(buses, components = []) {
  const entryBuses = getSystemEntryBuses(buses, components);

  if (!entryBuses.length) {
    console.warn('⚠️ No entry buses found, returning zero totals');
    return {
      totalConnectedA: 0,
      totalConnectedKVA: 0,
      totalDemandA: 0,
      totalDemandKVA: 0,
      totalDiversityA: 0,
      totalDiversityKVA: 0,
      entryBuses: [],
      busDetails: []
    };
  }

  let totalConnectedA = 0;
  let totalConnectedKVA = 0;
  let totalDemandA = 0;
  let totalDemandKVA = 0;
  let totalDiversityA = 0;
  let totalDiversityKVA = 0;

  const busDetails = [];

  entryBuses.forEach(bus => {
    const lf = bus.results?.loadFlow || {};
    const summary = lf.summary || {};
    const demandSummary = lf.demandSummary || {};
    const demandApplied = !!lf.demandFactorsApplied;

    // Connected (100% FLC)
    const connectedA = summary.connectedCurrent ?? summary.totalCurrent ?? 0;

    // Demand/Diversity (use demandSummary only when factors applied)
    const demandA = demandApplied
      ? (demandSummary.demandCurrent ?? connectedA)
      : connectedA;

    const diversityA = demandApplied
      ? (demandSummary.diversityCurrent ?? demandA)
      : demandA;

    const v = Number(bus.voltage || 0);
    const kVA = amps => (Number(amps || 0) * v * Math.sqrt(3)) / 1000;

    const connectedKVA = kVA(connectedA);
    const demandKVA = kVA(demandA);
    const diversityKVA = kVA(diversityA);

    totalConnectedA += connectedA;
    totalConnectedKVA += connectedKVA;

    totalDemandA += demandA;
    totalDemandKVA += demandKVA;

    totalDiversityA += diversityA;
    totalDiversityKVA += diversityKVA;

    busDetails.push({
      busId: bus.id,
      busName: bus.name,
      voltage: bus.voltage,
      currents: {
        connectedA,
        demandA,
        diversityA
      },
      kVA: {
        connectedKVA,
        demandKVA,
        diversityKVA
      }
    });

    console.log(
      ` 📊 ${bus.name}: Conn ${connectedA.toFixed(2)} A (${connectedKVA.toFixed(2)} kVA) | ` +
      `Dem ${demandA.toFixed(2)} A | Div ${diversityA.toFixed(2)} A`
    );
  });

  console.log(
    `✅ System Entry Totals: Conn ${totalConnectedA.toFixed(2)} A (${totalConnectedKVA.toFixed(2)} kVA) | ` +
    `Dem ${totalDemandA.toFixed(2)} A | Div ${totalDiversityA.toFixed(2)} A`
  );

  return {
    totalConnectedA,
    totalConnectedKVA,
    totalDemandA,
    totalDemandKVA,
    totalDiversityA,
    totalDiversityKVA,
    entryBuses,
    busDetails
  };
}

/**
 * Compute system-wide load aggregates (diagnostic).
 * NOTE: This sums across ALL buses that have loadFlow results.
 * It may double-count downstream load by design and is primarily for debugging.
 *
 * @param {Array} buses - Array of all buses
 * @returns {Object} Aggregated load statistics
 */
function computeSystemLoadAggregates(buses) {
  let totalConnected = 0;
  let totalDemand = 0;
  let totalDiversity = 0;
  let busesWithDemandData = 0;

  buses.forEach(bus => {
    if (!bus.results?.loadFlow) return;

    const lf = bus.results.loadFlow;
    const summary = lf.summary || {};
    const demandSummary = lf.demandSummary || {};

    const connected = summary.connectedCurrent ?? summary.totalCurrent ?? 0;

    let demand = connected;
    let diversity = connected;

    if (lf.demandFactorsApplied) {
      demand = demandSummary.demandCurrent ?? connected;
      diversity = demandSummary.diversityCurrent ?? demand;
      busesWithDemandData++;
    } else {
      // Informational default diversity if no demand data
      let df = 1.0;
      if (bus.type === 'source') df = 1.0;
      else if (bus.type === 'distribution') df = 1.2;
      else if (bus.type === 'branch') df = 1.3;
      diversity = connected / df;
    }

    totalConnected += connected;
    totalDemand += demand;
    totalDiversity += diversity;
  });

  console.log(`📊 System Load Aggregates:`);
  console.log(` Connected: ${totalConnected.toFixed(2)} A (sum of all buses)`);
  console.log(` Demand: ${totalDemand.toFixed(2)} A`);
  console.log(` Diversity: ${totalDiversity.toFixed(2)} A`);
  console.log(` Buses with demand data: ${busesWithDemandData}`);

  return {
    totalConnected,
    totalDemand,
    totalDiversity,
    busesWithDemandData
  };
}

/**
 * Recommended aggregator: compute system aggregates from ENTRY buses only.
 * This avoids double-counting and aligns with the entry-bus “source of truth” design.
 *
 * @param {Array} buses - Array of all buses
 * @param {Array} components - (optional) Array of components for topology validation
 * @returns {Object} Aggregated totals (A)
 */
function computeSystemLoadAggregatesFromEntries(buses, components = []) {
  const totals = getSystemEntryTotals(buses, components);

  const busesWithDemandData = totals.busDetails.filter(d => {
    const c = d.currents?.connectedA ?? 0;
    const dem = d.currents?.demandA ?? c;
    const div = d.currents?.diversityA ?? dem;
    return (dem !== c) || (div !== dem);
  }).length;

  return {
    totalConnected: totals.totalConnectedA,
    totalDemand: totals.totalDemandA,
    totalDiversity: totals.totalDiversityA,
    busesWithDemandData
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.getSystemEntryBuses = getSystemEntryBuses;
  window.getPrimarySystemEntryBus = getPrimarySystemEntryBus;
  window.getSystemEntryTotals = getSystemEntryTotals;
  window.computeSystemLoadAggregates = computeSystemLoadAggregates;
  window.computeSystemLoadAggregatesFromEntries = computeSystemLoadAggregatesFromEntries;
}

console.log('✅ System Totals Module v3.3.0 loaded');
console.log(' - Entry Bus Identification: READY');
console.log(' - System Totals Calculation: READY');
console.log(' - Load Aggregation: READY');