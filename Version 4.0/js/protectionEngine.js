/**
 * Protection Engine Module
 * PwrSys Pro - Protection Device Adequacy & Clearing Device Engine (Phase 2.1 Foundation)
 *
 * Purpose:
 * - Evaluates breaker / fuse adequacy against calculated fault duties
 * - Identifies primary clearing device for a faulted bus based on path topology
 * - Stores structured results under bus.results.protection
 * - Generates a text summary suitable for appending to short-circuit steps via
 *   generateProtectionDeviceRequirements(...)
 * - Adds Phase 2.1 groundwork for relay / CT / VT / zone / association lookup
 *
 * Design notes:
 * - Series protection devices (breakers/fuses) are expected to live in the
 *   existing global components collection using fromBus/toBus topology.
 * - Relays / CTs / VTs / zones / associations are linked metadata assets stored
 *   in protectionDevices / protectionZones / protectionAssociations.
 * - This module remains conservative: where an exact rating is absent, the
 *   result is flagged NOT-APPLICABLE / UNKNOWN rather than guessed.
 * - Devices upstream across a transformer are not directly evaluated using the
 *   downstream bus fault current. They are listed as reference devices and
 *   marked NOT-APPLICABLE for direct interrupting adequacy at the evaluated bus.
 *
 * Recommended load order:
 * protectionSchema.js -> protectionEngine.js -> shortCircuitCalc.js (or before
 * any module that may call generateProtectionDeviceRequirements)
 *
 * @author M365 Copilot for Engr. B. P. Faraon
 * @date 2026-05-04
 * @version 1.1.1
 */
console.log('🔧 Loading Protection Engine Module v1.1.1...');

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function _num(value, fallback = 0) {
 const n = Number(value);
 return Number.isFinite(n) ? n : fallback;
}

function _clone(value) {
 return JSON.parse(JSON.stringify(value));
}

function _nowIso() {
 return new Date().toISOString();
}

function _getBusesArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.buses)) return window.buses;
 if (typeof buses !== 'undefined' && Array.isArray(buses)) return buses;
 return [];
}

function _getComponentsArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.components)) return window.components;
 if (typeof components !== 'undefined' && Array.isArray(components)) return components;
 return [];
}

function _getProtectionDevicesArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.protectionDevices)) return window.protectionDevices;
 if (typeof protectionDevices !== 'undefined' && Array.isArray(protectionDevices)) return protectionDevices;
 return [];
}

function _getProtectionZonesArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.protectionZones)) return window.protectionZones;
 if (typeof protectionZones !== 'undefined' && Array.isArray(protectionZones)) return protectionZones;
 return [];
}

function _getProtectionAssociationsArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.protectionAssociations)) return window.protectionAssociations;
 if (typeof protectionAssociations !== 'undefined' && Array.isArray(protectionAssociations)) return protectionAssociations;
 return [];
}

function _getBusById(busId) {
 return _getBusesArray().find(b => b && String(b.id) === String(busId)) || null;
}

function _getProtectionDeviceById(deviceId) {
 return _getProtectionDevicesArray().find(d => d && String(d.id) === String(deviceId)) || null;
}

function _getProtectionZoneById(zoneId) {
 return _getProtectionZonesArray().find(z => z && String(z.id) === String(zoneId)) || null;
}

function _getBusDisplayName(busRef) {
 const bus = _getBusById(busRef);
 if (bus) {
  if (bus.tag && bus.name && String(bus.tag) !== String(bus.name)) {
   return `${bus.tag} (${bus.name})`;
  }
  return bus.tag || bus.name || String(busRef || 'N/A');
 }
 return String(busRef || 'N/A');
}

function _getDeviceDisplayLabel(device) {
 if (!device) return 'N/A';
 return device.tag || device.name || device.id || 'N/A';
}

function _getAssociationsForDevice(deviceId) {
 return _getProtectionAssociationsArray().filter(association => {
  if (!association) return false;
  if (String(association.primaryDeviceId || '') === String(deviceId || '')) return true;
  if (Array.isArray(association.backupDeviceIds) && association.backupDeviceIds.some(id => String(id) === String(deviceId || ''))) return true;
  return false;
 });
}

function _getAssociationsForBus(busId) {
 return _getProtectionAssociationsArray().filter(association => association && String(association.busId || '') === String(busId || ''));
}

function _getAssociationsForComponent(componentId) {
 return _getProtectionAssociationsArray().filter(association => association && String(association.componentId || '') === String(componentId || ''));
}

function _getZonesForBus(busId) {
 return _getProtectionZonesArray().filter(zone => zone && Array.isArray(zone.protectedBusIds) && zone.protectedBusIds.some(id => String(id) === String(busId || '')));
}

function _getZonesForComponent(componentId) {
 return _getProtectionZonesArray().filter(zone => zone && Array.isArray(zone.protectedComponentIds) && zone.protectedComponentIds.some(id => String(id) === String(componentId || '')));
}

function _getLinkedRelayForBreaker(breakerId) {
 return _getProtectionDevicesArray().find(device =>
  device &&
  String(device.type || '').toLowerCase() === 'relay' &&
  String(device.controlledBreakerId || '') === String(breakerId || '')
 ) || null;
}

function _getAssociatedCTsForRelay(relayId) {
 return _getProtectionDevicesArray().filter(device => {
  if (!device || String(device.type || '').toLowerCase() !== 'ct') return false;
  if (Array.isArray(device.associatedRelayIds) && device.associatedRelayIds.some(id => String(id) === String(relayId || ''))) return true;
  return false;
 });
}

function _getAssociatedVTsForRelay(relayId) {
 return _getProtectionDevicesArray().filter(device => {
  if (!device || String(device.type || '').toLowerCase() !== 'vt') return false;
  if (Array.isArray(device.associatedRelayIds) && device.associatedRelayIds.some(id => String(id) === String(relayId || ''))) return true;
return false;
 });
}

function _isSeriesProtectionDevice(component) {
 return isSeriesProtectionDevice(component);
}

function _getProtectionResultsContainer(bus) {
 if (!bus || typeof bus !== 'object') return null;
 return ensureBusProtectionResults(bus);
}

function _createAdequacyResult(overrides = {}) {
 return createProtectionDeviceAdequacyResult(overrides);
}

function _createProtectionResults(overrides = {}) {
 return createProtectionResults(overrides);
}

function _statusWeight(status) {
 switch (String(status || '').toUpperCase()) {
 case 'FAIL': return 4;
 case 'MARGINAL': return 3;
 case 'UNKNOWN': return 2;
 case 'NOT-APPLICABLE': return 1;
 case 'PASS': return 0;
 default: return 1;
 }
}

function _combineWorstStatus(items) {
 if (!Array.isArray(items) || items.length === 0) return 'UNKNOWN';
 let statuses = items.map(i => String(i?.status || 'UNKNOWN').toUpperCase());
 const actionableStatuses = statuses.filter(status => status !== 'NOT-APPLICABLE');
 if (actionableStatuses.length > 0) {
  statuses = actionableStatuses;
 }
 const ranked = statuses.sort((a, b) => _statusWeight(b) - _statusWeight(a));
 return ranked[0] || 'UNKNOWN';
}

function _getShortCircuitLikeResults(busId, shortCircuitResults = null) {
 if (shortCircuitResults && shortCircuitResults.faultCurrents) return shortCircuitResults;
 const bus = _getBusById(busId);
 const sc = bus?.results?.shortCircuit || bus?.results || null;
 if (sc && sc.faultCurrents) return sc;
 return null;
}

function _extractFaultDuties(scResults) {
 const fc = scResults?.faultCurrents || {};
 return {
  threePhaseSymKA: _num(fc.threePhaseSym, _num(scResults?.faultCurrentKA, 0)),
  threePhaseAsymKA: _num(fc.threePhaseAsym, _num(scResults?.asymFaultCurrentKA, 0)),
  peakKA: _num(scResults?.peakCurrentKA, _num(scResults?.peakFaultCurrentKA, 0)),
  lineToGroundKA: _num(fc.lineToGround, _num(scResults?.lineToGroundKA, 0)),
  lineToLineKA: _num(fc.lineToLine, _num(scResults?.lineToLineKA, 0)),
  doubleLineToGroundKA: _num(fc.doubleLineToGround, _num(scResults?.doubleLineToGroundKA, 0))
 };
}

function _extractLoadCurrent(busId) {
 const bus = _getBusById(busId);
 if (!bus) return 0;
 const lf = bus.results?.loadFlow || {};
 const ds = lf.demandSummary || {};
 const sum = lf.summary || {};
 return _num(
  ds.diversityCurrent,
  _num(ds.demandCurrent,
   _num(sum.totalCurrent,
    _num(bus.loadCurrentCalculated,
     _num(bus.loadCurrent, 0)
    )
   )
  )
 );
}

function _normalizePath(pathOrBusPathComponents) {
 if (!Array.isArray(pathOrBusPathComponents)) return [];
 if (pathOrBusPathComponents.some(seg => seg && ('bus' in seg || 'component' in seg))) {
  return pathOrBusPathComponents.map((seg, idx) => ({
   index: idx,
   busId: seg?.bus?.id || null,
   busName: seg?.bus?.name || null,
   busVoltage: _num(seg?.bus?.voltage, 0),
   component: seg?.component || null,
   componentId: seg?.component?.id || null,
   componentType: String(seg?.component?.type || '').toLowerCase(),
   componentTag: seg?.component?.tag || seg?.component?.name || null
  }));
 }
 return pathOrBusPathComponents.map((seg, idx) => ({
  index: _num(seg?.sequence, idx),
  busId: seg?.bus?.id || null,
  busName: seg?.bus?.name || null,
  busVoltage: _num(seg?.bus?.voltage, 0),
  component: seg?.component || null,
  componentId: seg?.component?.id || null,
  componentType: String(seg?.component?.type || '').toLowerCase(),
  componentTag: seg?.component?.tag || seg?.component?.name || null
 }));
}

function _traceBusPathSafe(busId) {
 try {
  if (typeof traceBusPath === 'function') {
   const raw = traceBusPath(busId);
   if (Array.isArray(raw) && raw.length > 0) return _normalizePath(raw);
}
 } catch (_) {}
 const bus = _getBusById(busId);
 if (Array.isArray(bus?.pathComponents) && bus.pathComponents.length > 0) {
  return _normalizePath(bus.pathComponents);
 }
 return [];
}

function _findProtectionDevicesForPath(pathSegments) {
 return pathSegments
  .filter(seg => _isSeriesProtectionDevice(seg.component))
  .map(seg => seg.component);
}

function _hasTransformerBetweenDeviceAndTarget(device, pathSegments) {
 if (!device || !Array.isArray(pathSegments) || pathSegments.length === 0) return false;
 const deviceIndex = pathSegments.findIndex(seg =>
  seg &&
  seg.component &&
  String(seg.component.id) === String(device.id)
 );
 if (deviceIndex < 0) return false;
 return pathSegments.slice(deviceIndex + 1).some(seg =>
  seg &&
  seg.component &&
  String(seg.component.type || '').toLowerCase() === 'transformer'
 );
}

function _dedupeDevices(devices) {
 const seen = new Set();
 const list = Array.isArray(devices) ? devices : [];
 return list.filter(d => {
  const key = d?.id || `${d?.type}:${d?.fromBus}->${d?.toBus}:${d?.tag || d?.name || ''}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
 });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADEQUACY EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════
function evaluateProtectionDevice(device, scResults, context = {}) {
 const duties = _extractFaultDuties(scResults || {});
 const bus = context.bus || null;
 const busId = context.busId || bus?.id || '';
 const voltage = _num(context.voltage, _num(bus?.voltage, _num(device?.voltage, 0)));
 const loadCurrentA = _num(context.loadCurrentA, _extractLoadCurrent(busId));
 const result = _createAdequacyResult({
  deviceId: device?.id || '',
  deviceType: String(device?.type || '').toLowerCase(),
  deviceLabel: device?.tag || device?.name || device?.id || '',
  deviceTag: device?.tag || '',
  deviceName: device?.name || '',
  fromBusName: device?.fromBusName || _getBusDisplayName(device?.fromBus),
  toBusName: device?.toBusName || _getBusDisplayName(device?.toBus),
  evaluatedAtBusId: busId,
  voltage,
  duties
 });

 const t = String(device?.type || '').toLowerCase();
 if (t !== 'breaker' && t !== 'fuse') {
  result.status = 'NOT-APPLICABLE';
  result.notes = 'Device is not a breaker or fuse; adequacy not evaluated in MVP engine.';
  return result;
 }

 if (context.skipDirectInterruptingAdequacy === true) {
  if (t === 'breaker') {
   const interruptingSymKA = _num(device?.interruptingRatingSymKA, 0);
   const interruptingAsymKA = _num(device?.interruptingRatingAsymKA, 0);
   const momentaryKA = _num(device?.momentaryRatingKA, 0);
   const closeLatchKA = _num(device?.closeLatchRatingKA, 0);
   const continuousA = _num(device?.continuousAmpRating, _num(device?.sensorRatingA, 0));
   result.ratings = {
    interruptingSymKA: interruptingSymKA || null,
    interruptingAsymKA: interruptingAsymKA || null,
    momentaryKA: momentaryKA || null,
    closeLatchKA: closeLatchKA || null,
    continuousA: continuousA || null
   };
  } else if (t === 'fuse') {
   const interruptingRatingKA = _num(device?.interruptingRatingKA, 0);
   const ampereRating = _num(device?.ampereRating, 0);
   result.ratings = {
    interruptingSymKA: interruptingRatingKA || null,
    interruptingAsymKA: null,
    momentaryKA: null,
    closeLatchKA: null,
    continuousA: ampereRating || null
   };
  }
  result.status = 'NOT-APPLICABLE';
  result.limitingCriterion = 'cross-transformer-reference';
  result.notes = 'Device is upstream of a transformer relative to the evaluated bus; direct interrupting adequacy shall be evaluated at the device installation side or by referred through-fault current.';
  return result;
 }

 if (t === 'breaker') {
  const interruptingSymKA = _num(device?.interruptingRatingSymKA, 0);
  const interruptingAsymKA = _num(device?.interruptingRatingAsymKA, 0);
  const momentaryKA = _num(device?.momentaryRatingKA, 0);
  const closeLatchKA = _num(device?.closeLatchRatingKA, 0);
  const continuousA = _num(device?.continuousAmpRating, _num(device?.sensorRatingA, 0));

  result.ratings = {
   interruptingSymKA: interruptingSymKA || null,
   interruptingAsymKA: interruptingAsymKA || null,
   momentaryKA: momentaryKA || null,
   closeLatchKA: closeLatchKA || null,
   continuousA: continuousA || null
  };

  if (interruptingSymKA > 0) {
   result.utilizationPercent.interrupting = (duties.threePhaseSymKA / interruptingSymKA) * 100;
  }

  const asymBasis = interruptingAsymKA > 0 ? interruptingAsymKA : interruptingSymKA;
  const momentaryBasis = momentaryKA > 0 ? momentaryKA : (closeLatchKA > 0 ? closeLatchKA : 0);

  if (momentaryBasis > 0) {
   const appliedMomentary = duties.peakKA > 0 ? duties.peakKA : duties.threePhaseAsymKA;
   result.utilizationPercent.momentary = (appliedMomentary / momentaryBasis) * 100;
  }

  if (continuousA > 0 && loadCurrentA > 0) {
   result.utilizationPercent.continuous = (loadCurrentA / continuousA) * 100;
  }

  const failures = [];
  const marginals = [];

  if (interruptingSymKA <= 0) {
   marginals.push('Interrupting symmetrical rating missing');
  } else if (duties.threePhaseSymKA > interruptingSymKA) {
   failures.push('3φ symmetrical duty exceeds breaker interrupting symmetrical rating');
   result.limitingCriterion = 'interruptingSymKA';
  } else if ((duties.threePhaseSymKA / interruptingSymKA) > 0.95) {
   marginals.push('3φ symmetrical duty exceeds 95% of breaker interrupting symmetrical rating');
   if (!result.limitingCriterion) result.limitingCriterion = 'interruptingSymKA';
  }

  if (asymBasis > 0) {
   if (duties.threePhaseAsymKA > asymBasis) {
    failures.push('Asymmetrical RMS duty exceeds breaker asymmetrical / interrupting basis');
    if (!result.limitingCriterion) result.limitingCriterion = 'interruptingAsymKA';
   } else if ((duties.threePhaseAsymKA / asymBasis) > 0.95) {
    marginals.push('Asymmetrical RMS duty exceeds 95% of breaker asymmetrical / interrupting basis');
    if (!result.limitingCriterion) result.limitingCriterion = 'interruptingAsymKA';
   }
  }

  if (momentaryBasis > 0) {
   const appliedMomentary = duties.peakKA > 0 ? duties.peakKA : duties.threePhaseAsymKA;
   if (appliedMomentary > momentaryBasis) {
    failures.push('Momentary / peak duty exceeds breaker momentary or close-latch basis');
    if (!result.limitingCriterion) result.limitingCriterion = 'momentaryKA';
   } else if ((appliedMomentary / momentaryBasis) > 0.95) {
    marginals.push('Momentary / peak duty exceeds 95% of breaker momentary or close-latch basis');
    if (!result.limitingCriterion) result.limitingCriterion = 'momentaryKA';
   }
  }

  if (continuousA > 0 && loadCurrentA > continuousA) {
   failures.push('Load current exceeds breaker continuous rating');
   if (!result.limitingCriterion) result.limitingCriterion = 'continuousA';
  } else if (continuousA > 0 && loadCurrentA > 0.95 * continuousA) {
   marginals.push('Load current exceeds 95% of breaker continuous rating');
   if (!result.limitingCriterion) result.limitingCriterion = 'continuousA';
  }

  if (failures.length > 0) {
   result.status = 'FAIL';
   result.notes = failures.concat(marginals).join('; ');
  } else if (marginals.length > 0) {
   result.status = 'MARGINAL';
   result.notes = marginals.join('; ');
  } else if (interruptingSymKA > 0 || momentaryBasis > 0 || continuousA > 0) {
   result.status = 'PASS';
   result.notes = 'Breaker ratings are adequate for evaluated duties.';
  } else {
   result.status = 'UNKNOWN';
   result.notes = 'Insufficient breaker rating data for adequacy evaluation.';
  }

  return result;
 }

 const interruptingRatingKA = _num(device?.interruptingRatingKA, 0);
 const ampereRating = _num(device?.ampereRating, 0);
 result.ratings = {
  interruptingSymKA: interruptingRatingKA || null,
  interruptingAsymKA: null,
  momentaryKA: null,
  closeLatchKA: null,
  continuousA: ampereRating || null
 };

 if (interruptingRatingKA > 0) {
  result.utilizationPercent.interrupting = (duties.threePhaseSymKA / interruptingRatingKA) * 100;
 }

 if (ampereRating > 0 && loadCurrentA > 0) {
  result.utilizationPercent.continuous = (loadCurrentA / ampereRating) * 100;
 }

 const failures = [];
 const marginals = [];

 if (interruptingRatingKA <= 0) {
  marginals.push('Fuse interrupting rating missing');
 } else if (duties.threePhaseSymKA > interruptingRatingKA) {
  failures.push('3φ symmetrical duty exceeds fuse interrupting rating');
  result.limitingCriterion = 'interruptingRatingKA';
 } else if ((duties.threePhaseSymKA / interruptingRatingKA) > 0.95) {
  marginals.push('3φ symmetrical duty exceeds 95% of fuse interrupting rating');
  if (!result.limitingCriterion) result.limitingCriterion = 'interruptingRatingKA';
 }

 if (ampereRating > 0 && loadCurrentA > ampereRating) {
  failures.push('Load current exceeds fuse ampere rating');
  if (!result.limitingCriterion) result.limitingCriterion = 'ampereRating';
 } else if (ampereRating > 0 && loadCurrentA > 0.95 * ampereRating) {
  marginals.push('Load current exceeds 95% of fuse ampere rating');
  if (!result.limitingCriterion) result.limitingCriterion = 'ampereRating';
 }

 if (failures.length > 0) {
  result.status = 'FAIL';
  result.notes = failures.concat(marginals).join('; ');
 } else if (marginals.length > 0) {
  result.status = 'MARGINAL';
  result.notes = marginals.join('; ');
 } else if (interruptingRatingKA > 0 || ampereRating > 0) {
  result.status = 'PASS';
  result.notes = 'Fuse rating is adequate for evaluated duties.';
 } else {
  result.status = 'UNKNOWN';
  result.notes = 'Insufficient fuse rating data for adequacy evaluation.';
 }

 return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEARING DEVICE IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
function determinePrimaryClearingDevice(busId, pathSegments = null) {
 const path = Array.isArray(pathSegments) && pathSegments.length > 0
  ? _normalizePath(pathSegments)
  : _traceBusPathSafe(busId);

 if (!Array.isArray(path) || path.length === 0) {
  return {
   device: null,
   path: [],
   reason: 'No valid path available for clearing-device determination.'
  };
 }

 const protectiveDevices = _findProtectionDevicesForPath(path);
 if (protectiveDevices.length === 0) {
  return {
   device: null,
   path,
   reason: 'No breaker or fuse found in path to faulted bus.'
  };
 }

 const lastProtectionSeg = [...path].reverse().find(seg => _isSeriesProtectionDevice(seg.component));
 return {
  device: lastProtectionSeg?.component || null,
  path,
  reason: lastProtectionSeg?.component
   ? 'Nearest upstream breaker/fuse in traced path selected as primary clearing device.'
   : 'No breaker or fuse found in path to faulted bus.'
 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUS-LEVEL PROTECTION EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════
function calculateProtectionForBus(busId, shortCircuitResults = null, options = {}) {
 const bus = _getBusById(busId);
 if (!bus) {
  throw new Error(`Protection analysis: bus ${busId} not found`);
 }

 const scResults = _getShortCircuitLikeResults(busId, shortCircuitResults);
 if (!scResults || !scResults.faultCurrents) {
  throw new Error(`Protection analysis: short-circuit results missing for bus ${busId}`);
 }

 const path = _traceBusPathSafe(busId);
 const seriesProtectionDevices = _dedupeDevices(_findProtectionDevicesForPath(path));
 const loadCurrentA = _extractLoadCurrent(busId);
 const results = _createProtectionResults({
calculationDate: _nowIso(),
  calculationMethod: 'MVP adequacy',
  calculationSteps: ''
 });

 const duties = _extractFaultDuties(scResults);
 const adequacyResults = seriesProtectionDevices.map(device =>
  evaluateProtectionDevice(device, scResults, {
   bus,
   busId,
   voltage: bus.voltage,
   loadCurrentA,
   skipDirectInterruptingAdequacy: _hasTransformerBetweenDeviceAndTarget(device, path)
  })
 );

 const clearingPick = determinePrimaryClearingDevice(busId, path);
 const primaryClearingDevice = clearingPick.device;
 const primaryRelay = primaryClearingDevice ? _getLinkedRelayForBreaker(primaryClearingDevice.id) : null;
 const primaryRelayCTs = primaryRelay ? _getAssociatedCTsForRelay(primaryRelay.id) : [];
 const primaryRelayVTs = primaryRelay ? _getAssociatedVTsForRelay(primaryRelay.id) : [];
 const busZones = _getZonesForBus(busId);

 results.adequacy.evaluated = true;
 results.adequacy.devices = adequacyResults;
 results.adequacy.primaryDeviceId = primaryClearingDevice?.id || null;
 results.adequacy.primaryDeviceLabel = primaryClearingDevice?.tag || primaryClearingDevice?.name || primaryClearingDevice?.id || null;

 results.duties = duties;
 results.loadCurrentA = loadCurrentA;
 results.overallStatus = _combineWorstStatus(adequacyResults.length > 0 ? adequacyResults : [{ status: 'UNKNOWN' }]);

 results.clearing.clearingDeviceId = primaryClearingDevice?.id || null;
 results.clearing.clearingDeviceType = primaryClearingDevice?.type || null;
 results.clearing.clearingDeviceLabel = primaryClearingDevice?.tag || primaryClearingDevice?.name || primaryClearingDevice?.id || null;
 results.clearing.clearingDeviceTag = primaryClearingDevice?.tag || null;
 results.clearing.clearingDeviceName = primaryClearingDevice?.name || null;
 results.clearing.reason = clearingPick.reason || '';
 results.clearing.basis = 'primary-series-protection-device';
 results.clearing.clearingTimeSec = null;
 results.clearing.clearingTimeCycles = null;

 results.linkedAssets = {
  primaryRelayId: primaryRelay?.id || null,
  primaryRelayLabel: primaryRelay ? _getDeviceDisplayLabel(primaryRelay) : null,
  ctIds: primaryRelayCTs.map(device => device.id),
  vtIds: primaryRelayVTs.map(device => device.id),
  zoneIds: busZones.map(zone => zone.id)
 };

 const recs = [];
 adequacyResults.forEach(r => {
  if (r.status === 'FAIL') {
   recs.push({
    severity: 'HIGH',
    deviceId: r.deviceId,
    message: `${r.deviceType} ${r.deviceLabel || r.deviceId} fails adequacy at bus ${bus.name}: ${r.notes}`
   });
  } else if (r.status === 'MARGINAL') {
   recs.push({
    severity: 'MEDIUM',
    deviceId: r.deviceId,
    message: `${r.deviceType} ${r.deviceLabel || r.deviceId} is marginal at bus ${bus.name}: ${r.notes}`
   });
  }
 });

 if (!primaryClearingDevice) {
  recs.push({
   severity: 'HIGH',
   deviceId: null,
   message: `No breaker or fuse found in the path to bus ${bus.name}; clearing device could not be identified.`
  });
 }

 results.recommendations = recs;

 let steps = '';
 steps += '═'.repeat(80) + '\n';
 steps += 'PROTECTION ADEQUACY ANALYSIS (MVP)\n';
 steps += '═'.repeat(80) + '\n\n';
 steps += `Bus: ${bus.name} (${bus.voltage}V)\n`;
 steps += `Calculated: ${results.calculationDate}\n`;
 steps += `Method: ${results.calculationMethod}\n\n`;

 steps += 'FAULT DUTIES USED\n';
 steps += '─'.repeat(80) + '\n';
 steps += `3φ Symmetrical: ${duties.threePhaseSymKA.toFixed(3)} kA\n`;
 steps += `3φ Asymmetrical RMS: ${duties.threePhaseAsymKA.toFixed(3)} kA\n`;
 steps += `Peak / Momentary: ${duties.peakKA.toFixed(3)} kA\n`;
 steps += `L-G: ${duties.lineToGroundKA.toFixed(3)} kA\n`;
 steps += `L-L: ${duties.lineToLineKA.toFixed(3)} kA\n`;
 if (duties.doubleLineToGroundKA > 0) {
  steps += `L-L-G: ${duties.doubleLineToGroundKA.toFixed(3)} kA\n`;
 }
 steps += `Load Current Basis: ${loadCurrentA.toFixed(2)} A\n\n`;

 steps += 'SERIES PROTECTION DEVICES FOUND IN PATH\n';
 steps += '─'.repeat(80) + '\n';
 if (seriesProtectionDevices.length === 0) {
  steps += 'No breaker or fuse found in path.\n\n';
 } else {
  seriesProtectionDevices.forEach((d, idx) => {
   const deviceLabel = _getDeviceDisplayLabel(d);
   const fromBusLabel = d.fromBusName || _getBusDisplayName(d.fromBus);
   const toBusLabel = d.toBusName || _getBusDisplayName(d.toBus);
   const crossTransformer = _hasTransformerBetweenDeviceAndTarget(d, path);
   steps += `${idx + 1}. ${String(d.type).toUpperCase()} - ${deviceLabel}${crossTransformer ? ' (upstream of transformer - reference)' : ''}\n`;
   steps += ` From Bus: ${fromBusLabel}\n`;
   steps += ` To Bus: ${toBusLabel}\n`;
  });
  steps += '\n';
 }

 steps += 'ADEQUACY RESULTS\n';
 steps += '─'.repeat(80) + '\n';
 if (adequacyResults.length === 0) {
  steps += 'No breaker/fuse adequacy results available.\n';
 } else {
  adequacyResults.forEach((r, idx) => {
   steps += `${idx + 1}. ${r.deviceType.toUpperCase()} ${r.deviceLabel || r.deviceId || 'N/A'} -> ${r.status}\n`;
   if (r.ratings.interruptingSymKA !== null) {
    steps += ` Interrupting Rating: ${Number(r.ratings.interruptingSymKA).toFixed(3)} kA\n`;
   }
   if (r.ratings.momentaryKA !== null) {
    steps += ` Momentary / Close-Latch Basis: ${Number(r.ratings.momentaryKA).toFixed(3)} kA\n`;
   }
   if (r.ratings.continuousA !== null) {
    steps += ` Continuous / Ampere Rating: ${Number(r.ratings.continuousA).toFixed(2)} A\n`;
   }
   if (r.utilizationPercent.interrupting !== null) {
    steps += ` Interrupting Utilization: ${Number(r.utilizationPercent.interrupting).toFixed(1)}%\n`;
   }
   if (r.utilizationPercent.momentary !== null) {
    steps += ` Momentary Utilization: ${Number(r.utilizationPercent.momentary).toFixed(1)}%\n`;
   }
   if (r.utilizationPercent.continuous !== null) {
    steps += ` Continuous Utilization: ${Number(r.utilizationPercent.continuous).toFixed(1)}%\n`;
   }
   if (r.notes) {
    steps += ` Notes: ${r.notes}\n`;
   }
  });
 }
 steps += '\n';

 steps += 'PRIMARY CLEARING DEVICE\n';
 steps += '─'.repeat(80) + '\n';
 if (primaryClearingDevice) {
  steps += `Device: ${_getDeviceDisplayLabel(primaryClearingDevice)}\n`;
  steps += `Type: ${String(primaryClearingDevice.type || '').toUpperCase()}\n`;
  steps += `Reason: ${clearingPick.reason}\n`;
  if (primaryRelay) {
   steps += `Associated Relay: ${_getDeviceDisplayLabel(primaryRelay)}\n`;
   if (primaryRelayCTs.length > 0) {
    steps += `Associated CTs: ${primaryRelayCTs.map(device => _getDeviceDisplayLabel(device)).join(', ')}\n`;
   }
   if (primaryRelayVTs.length > 0) {
    steps += `Associated VTs: ${primaryRelayVTs.map(device => _getDeviceDisplayLabel(device)).join(', ')}\n`;
   }
  }
 } else {
  steps += `None identified. ${clearingPick.reason}\n`;
 }
 steps += '\n';

 if (busZones.length > 0) {
  steps += 'PROTECTION ZONES\n';
  steps += '─'.repeat(80) + '\n';
  busZones.forEach((zone, idx) => {
   steps += `${idx + 1}. ${zone.tag || zone.name || zone.id}\n`;
  });
  steps += '\n';
 }

 if (recs.length > 0) {
  steps += 'RECOMMENDATIONS\n';
  steps += '─'.repeat(80) + '\n';
  recs.forEach((rec, idx) => {
   steps += `${idx + 1}. [${rec.severity}] ${rec.message}\n`;
  });
  steps += '\n';
 }

 steps += '═'.repeat(80) + '\n';
 steps += 'END OF PROTECTION ADEQUACY ANALYSIS\n';
 steps += '═'.repeat(80) + '\n';

 results.calculationSteps = steps;

 const bucket = _getProtectionResultsContainer(bus);
 if (bucket) {
  bus.results.protection = results;
 }
 return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP-TEXT GENERATOR FOR SHORT-CIRCUIT MODULE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generate a short-circuit-step text summary of protection device requirements.
 *
 * This function intentionally accepts the existing short-circuit result object
 * shape used by shortCircuitCalc.js, because that file already checks for and
 * calls generateProtectionDeviceRequirements(...).
 *
 * @param {Object} systemFaultResults - short-circuit result object
 * @param {Array|null} specificDevices - optional explicit device list
 * @param {string} preference - reserved for future manufacturer / cost logic
 * @returns {string} Text block suitable for appending to calculation steps
 */
function generateProtectionDeviceRequirements(systemFaultResults, specificDevices = null, preference = 'mid-range') {
 const duties = _extractFaultDuties(systemFaultResults || {});
 let busId = null;
 const path = systemFaultResults?.path;
 if (Array.isArray(path) && path.length > 0) {
  const last = path[path.length - 1];
  busId = last?.bus?.id || last?.busId || null;
 }

 const pathSegments = busId ? _traceBusPathSafe(busId) : _normalizePath(path || []);
 const devices = _dedupeDevices(
  Array.isArray(specificDevices) && specificDevices.length > 0
   ? specificDevices
   : _findProtectionDevicesForPath(pathSegments)
 );

 let text = '';
 text += '\n';
 text += '═'.repeat(80) + '\n';
 text += 'PROTECTION DEVICE REQUIREMENTS (MVP)\n';
 text += '═'.repeat(80) + '\n\n';
 text += `Basis 3φ Symmetrical: ${duties.threePhaseSymKA.toFixed(3)} kA\n`;
 text += `Basis 3φ Asymmetrical RMS: ${duties.threePhaseAsymKA.toFixed(3)} kA\n`;
 text += `Basis Peak / Momentary: ${duties.peakKA.toFixed(3)} kA\n`;
 text += `Preference: ${preference}\n\n`;

 if (!devices || devices.length === 0) {
  text += 'No breaker or fuse found in the fault path.\n';
  text += 'Recommendations:\n';
  text += ' - Add a properly rated upstream protective device (breaker or fuse).\n';
  text += ' - Ensure the protective device interrupting and momentary ratings exceed calculated duties.\n\n';
  text += '═'.repeat(80) + '\n';
  return text;
 }

 devices.forEach((device, idx) => {
  const skipDirectInterruptingAdequacy = _hasTransformerBetweenDeviceAndTarget(device, pathSegments);
  const evalResult = evaluateProtectionDevice(device, systemFaultResults, {
   busId,
   bus: busId ? _getBusById(busId) : null,
   skipDirectInterruptingAdequacy
  });

  const deviceLabel = _getDeviceDisplayLabel(device);
  const fromBusLabel = device.fromBusName || _getBusDisplayName(device.fromBus);
  const toBusLabel = device.toBusName || _getBusDisplayName(device.toBus);

  text += `${idx + 1}. ${String(device.type || '').toUpperCase()} ${deviceLabel}${skipDirectInterruptingAdequacy ? ' (upstream of transformer - reference)' : ''}\n`;
  text += ` From Bus: ${fromBusLabel}\n`;
  text += ` To Bus: ${toBusLabel}\n`;

  if (skipDirectInterruptingAdequacy) {
   text += ' Direct interrupting check at target bus: NOT APPLIED across transformer\n';
   text += ' Evaluate this device at its installation side or by referred through-fault current.\n';
   if (String(device.type || '').toLowerCase() === 'breaker') {
    if (_num(device.continuousAmpRating, 0) > 0) {
     text += ` Existing continuous rating: ${_num(device.continuousAmpRating, 0).toFixed(2)} A\n`;
    }
    if (_num(device.interruptingRatingSymKA, 0) > 0) {
     text += ` Existing interrupting rating: ${_num(device.interruptingRatingSymKA, 0).toFixed(3)} kA\n`;
    }
    if (_num(device.momentaryRatingKA, 0) > 0 || _num(device.closeLatchRatingKA, 0) > 0) {
     const mb = _num(device.momentaryRatingKA, _num(device.closeLatchRatingKA, 0));
     text += ` Existing momentary / close-latch basis: ${mb.toFixed(3)} kA\n`;
    }
   } else {
    if (_num(device.ampereRating, 0) > 0) {
     text += ` Existing ampere rating: ${_num(device.ampereRating, 0).toFixed(2)} A\n`;
    }
    if (_num(device.interruptingRatingKA, 0) > 0) {
     text += ` Existing interrupting rating: ${_num(device.interruptingRatingKA, 0).toFixed(3)} kA\n`;
    }
   }
  } else if (String(device.type || '').toLowerCase() === 'breaker') {
   text += ` Required interrupting basis ≥ ${duties.threePhaseSymKA.toFixed(3)} kA symmetrical\n`;
   if (duties.peakKA > 0) {
    text += ` Required momentary / close-latch basis ≥ ${duties.peakKA.toFixed(3)} kA peak\n`;
   } else if (duties.threePhaseAsymKA > 0) {
    text += ` Required asymmetrical / momentary basis ≥ ${duties.threePhaseAsymKA.toFixed(3)} kA\n`;
   }
   if (_num(device.continuousAmpRating, 0) > 0) {
    text += ` Existing continuous rating: ${_num(device.continuousAmpRating, 0).toFixed(2)} A\n`;
   }
   if (_num(device.interruptingRatingSymKA, 0) > 0) {
    text += ` Existing interrupting rating: ${_num(device.interruptingRatingSymKA, 0).toFixed(3)} kA\n`;
   }
   if (_num(device.momentaryRatingKA, 0) > 0 || _num(device.closeLatchRatingKA, 0) > 0) {
    const mb = _num(device.momentaryRatingKA, _num(device.closeLatchRatingKA, 0));
    text += ` Existing momentary / close-latch basis: ${mb.toFixed(3)} kA\n`;
   }
  } else {
   text += ` Required fuse interrupting rating ≥ ${duties.threePhaseSymKA.toFixed(3)} kA\n`;
   if (_num(device.ampereRating, 0) > 0) {
    text += ` Existing ampere rating: ${_num(device.ampereRating, 0).toFixed(2)} A\n`;
   }
   if (_num(device.interruptingRatingKA, 0) > 0) {
    text += ` Existing interrupting rating: ${_num(device.interruptingRatingKA, 0).toFixed(3)} kA\n`;
   }
  }

  text += ` Adequacy result: ${evalResult.status}\n`;
  if (evalResult.notes) text += ` Notes: ${evalResult.notes}\n`;
  text += '\n';
 });

 const worst = _combineWorstStatus(devices.map(d => evaluateProtectionDevice(d, systemFaultResults, {
  busId,
  bus: busId ? _getBusById(busId) : null,
  skipDirectInterruptingAdequacy: _hasTransformerBetweenDeviceAndTarget(d, pathSegments)
 })));
 text += `Overall protection adequacy status: ${worst}\n`;
 text += '═'.repeat(80) + '\n';
 return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
 window.evaluateProtectionDevice = evaluateProtectionDevice;
 window.determinePrimaryClearingDevice = determinePrimaryClearingDevice;
 window.calculateProtectionForBus = calculateProtectionForBus;
 window.generateProtectionDeviceRequirements = generateProtectionDeviceRequirements;
}

if (typeof module !== 'undefined' && module.exports) {
 module.exports = {
  evaluateProtectionDevice,
  determinePrimaryClearingDevice,
  calculateProtectionForBus,
  generateProtectionDeviceRequirements
 };
}

console.log('✅ Protection Engine Module v1.1.1 loaded');
console.log(' - Breaker / fuse adequacy: READY');
console.log(' - Cross-transformer direct adequacy guard: READY');
console.log(' - Primary clearing device identification: READY');
console.log(' - bus.results.protection storage: READY');
console.log(' - Short-circuit step hook (generateProtectionDeviceRequirements): READY');
console.log(' - Phase 2.1 relay / CT / VT / zone lookup groundwork: READY');