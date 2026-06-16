/**
 * Protection Manager Module
 * PwrSys Pro - Protection Assets UI Manager
 *
 * Purpose:
 * - Manage relays, CTs, VTs, protection zones, and protection associations
 * - Provide CRUD operations for Phase 2.2 protection metadata assets
 * - Populate protectionDevices / protectionZones / protectionAssociations
 * - Integrate with existing modal-based UI workflow
 *
 * Design notes:
 * - Breakers and fuses remain in the global components collection
 * - Relay / CT / VT / zone / association assets are managed separately
 * - Uses protectionSchema.js factory helpers when available
 *
 * @author M365 Copilot for Engr. B. P. Faraon
 * @date 2026-03-04
 * @version 1.0.0
 */
console.log('🔧 Loading Protection Manager Module v1.0.0...');

let editingProtectionAssetType = null;
let editingProtectionAssetIndex = null;

function ensureProtectionCollections() {
 if (!Array.isArray(protectionDevices)) protectionDevices = [];
 if (!Array.isArray(protectionZones)) protectionZones = [];
 if (!Array.isArray(protectionAssociations)) protectionAssociations = [];
}

function getProtectionAssetType() {
 return document.getElementById('protectionAssetType')?.value || 'relay';
}

function getProtectionCollectionByType(assetType) {
 ensureProtectionCollections();
 if (assetType === 'relay' || assetType === 'ct' || assetType === 'vt') {
  return protectionDevices;
 }
 if (assetType === 'zone') {
  return protectionZones;
 }
 if (assetType === 'association') {
  return protectionAssociations;
 }
 return [];
}

function getProtectionAssetLabel(asset, fallback = 'Unnamed') {
 if (!asset || typeof asset !== 'object') return fallback;
 return asset.tag || asset.name || asset.id || fallback;
}

function escapeProtectionHtml(value) {
 if (value === null || value === undefined) return '';
 return String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
}

function getSelectedValues(selectId) {
 const select = document.getElementById(selectId);
 if (!select) return [];
 return Array.from(select.selectedOptions || []).map(option => option.value).filter(value => value !== '');
}

function getSingleValue(selectId) {
 const el = document.getElementById(selectId);
 return el ? el.value || null : null;
}

function getTextValue(inputId) {
 const el = document.getElementById(inputId);
 return el ? (el.value || '').trim() : '';
}

function getNumberValue(inputId, fallback = 0) {
 const el = document.getElementById(inputId);
 if (!el) return fallback;
 const value = parseFloat(el.value);
 return Number.isFinite(value) ? value : fallback;
}

function buildOptions(items, selectedValue = null, includeBlank = true, blankLabel = 'Select option') {
 let html = includeBlank ? `<option value="">${blankLabel}</option>` : '';
 items.forEach(item => {
  const selected = String(selectedValue || '') === String(item.value || '') ? ' selected' : '';
  html += `<option value="${escapeProtectionHtml(item.value)}"${selected}>${escapeProtectionHtml(item.label)}</option>`;
 });
 return html;
}

function buildMultiOptions(items, selectedValues = []) {
 const selectedSet = new Set((Array.isArray(selectedValues) ? selectedValues : []).map(value => String(value)));
 let html = '';
 items.forEach(item => {
  const selected = selectedSet.has(String(item.value || '')) ? ' selected' : '';
  html += `<option value="${escapeProtectionHtml(item.value)}"${selected}>${escapeProtectionHtml(item.label)}</option>`;
 });
 return html;
}

function getBreakerOptions() {
 return (Array.isArray(components) ? components : [])
  .filter(component => component && String(component.type || '').toLowerCase() === 'breaker')
  .map(component => ({
   value: component.id,
   label: `${getProtectionAssetLabel(component)}${component.fromBusName || component.toBusName ? ' (' + [component.fromBusName || '', component.toBusName || ''].filter(Boolean).join(' → ') + ')' : ''}`
  }));
}

function getRelayOptions() {
 return (Array.isArray(protectionDevices) ? protectionDevices : [])
  .filter(device => device && String(device.type || '').toLowerCase() === 'relay')
  .map(device => ({
   value: device.id,
   label: getProtectionAssetLabel(device)
  }));
}

function getCTOptions() {
 return (Array.isArray(protectionDevices) ? protectionDevices : [])
  .filter(device => device && String(device.type || '').toLowerCase() === 'ct')
  .map(device => ({
   value: device.id,
   label: getProtectionAssetLabel(device)
  }));
}

function getVTOptions() {
 return (Array.isArray(protectionDevices) ? protectionDevices : [])
  .filter(device => device && String(device.type || '').toLowerCase() === 'vt')
  .map(device => ({
   value: device.id,
   label: getProtectionAssetLabel(device)
  }));
}

function getBusOptions() {
 return (Array.isArray(buses) ? buses : []).map(bus => ({
  value: bus.id,
  label: bus.tag && bus.name && String(bus.tag) !== String(bus.name)
   ? `${bus.tag} (${bus.name})`
   : bus.tag || bus.name || String(bus.id)
 }));
}

function getComponentOptions() {
 return (Array.isArray(components) ? components : []).map(component => ({
  value: component.id,
  label: `${String(component.type || '').toUpperCase()} - ${getProtectionAssetLabel(component)}`
 }));
}

function getPrimaryProtectiveDeviceOptions() {
 const componentItems = (Array.isArray(components) ? components : [])
  .filter(component => component && (String(component.type || '').toLowerCase() === 'breaker' || String(component.type || '').toLowerCase() === 'fuse'))
  .map(component => ({
   value: component.id,
   label: `${String(component.type || '').toUpperCase()} - ${getProtectionAssetLabel(component)}`
  }));

 const relayItems = (Array.isArray(protectionDevices) ? protectionDevices : [])
  .filter(device => device && String(device.type || '').toLowerCase() === 'relay')
  .map(device => ({
   value: device.id,
   label: `RELAY - ${getProtectionAssetLabel(device)}`
  }));

 return componentItems.concat(relayItems);
}

function getAssociationTypeOptions() {
 const values = typeof PROTECTION_ASSOCIATION_TYPES !== 'undefined' ? Object.values(PROTECTION_ASSOCIATION_TYPES) : [
  'protects-bus',
  'protects-feeder',
  'protects-transformer',
  'protects-motor',
  'protects-generator',
  'primary-for',
  'backup-for',
  'monitors'
 ];
 return values.map(value => ({ value, label: value }));
}

function getZoneTypeOptions() {
 const values = typeof PROTECTION_ZONE_TYPES !== 'undefined' ? Object.values(PROTECTION_ZONE_TYPES) : [
  'feeder',
  'transformer',
  'bus',
  'motor',
  'generator',
  'incomer',
  'tie',
  'panel',
  'load-center'
 ];
 return values.map(value => ({ value, label: value }));
}

function getRelayFamilyOptions() {
 const values = typeof RELAY_FAMILIES !== 'undefined' ? Object.values(RELAY_FAMILIES) : ['numerical', 'electromechanical', 'solid-state'];
 return values.map(value => ({ value, label: value }));
}

function getProtectionDeviceStatusOptions() {
 const values = typeof PROTECTION_DEVICE_STATUS !== 'undefined' ? Object.values(PROTECTION_DEVICE_STATUS) : ['active', 'spare', 'out-of-service', 'future'];
 return values.map(value => ({ value, label: value }));
}

function getCurrentEditingAsset() {
 const assetType = getProtectionAssetType();
 const collection = getProtectionCollectionByType(assetType);
 if (editingProtectionAssetType !== assetType) return null;
 if (editingProtectionAssetIndex === null || editingProtectionAssetIndex === undefined) return null;
 return collection[editingProtectionAssetIndex] || null;
}

function openProtectionAssetsModal() {
 ensureProtectionCollections();
 const modal = document.getElementById('protectionAssetsModal');
 if (!modal) return;
 editingProtectionAssetType = null;
 editingProtectionAssetIndex = null;
 modal.style.display = 'block';
 updateProtectionAssetForm();
 renderProtectionAssetsList();
}

function closeProtectionAssetsModal() {
 const modal = document.getElementById('protectionAssetsModal');
 if (!modal) return;
 modal.style.display = 'none';
 editingProtectionAssetType = null;
 editingProtectionAssetIndex = null;
}

function updateProtectionAssetForm() {
 ensureProtectionCollections();
 const container = document.getElementById('protectionAssetFormContainer');
 if (!container) return;

 const assetType = getProtectionAssetType();
 const asset = getCurrentEditingAsset();
 let html = '';

 if (assetType === 'relay') {
  html += renderRelayForm(asset);
 } else if (assetType === 'ct') {
  html += renderCTForm(asset);
 } else if (assetType === 'vt') {
  html += renderVTForm(asset);
 } else if (assetType === 'zone') {
  html += renderZoneForm(asset);
 } else if (assetType === 'association') {
  html += renderAssociationForm(asset);
 }

 container.innerHTML = html;
 renderProtectionAssetsList();
}

function renderRelayForm(asset = null) {
 return `
<div class="form-group">
<label for="protRelayTag">Tag:</label>
<input id="protRelayTag" type="text" value="${escapeProtectionHtml(asset?.tag || '')}" placeholder="e.g., RY-E1-MAIN">
</div>
<div class="form-group">
<label for="protRelayName">Name:</label>
<input id="protRelayName" type="text" value="${escapeProtectionHtml(asset?.name || '')}" placeholder="e.g., E1 Main Relay">
</div>
<div class="form-group">
<label for="protRelayStatus">Status:</label>
<select id="protRelayStatus">
${buildOptions(getProtectionDeviceStatusOptions(), asset?.status || 'active', false)}
</select>
</div>
<div class="form-group">
<label for="protRelayFamily">Relay Family:</label>
<select id="protRelayFamily">
${buildOptions(getRelayFamilyOptions(), asset?.relayFamily || 'numerical', false)}
</select>
</div>
<div class="form-group">
<label for="protRelayControlledBreaker">Controlled Breaker:</label>
<select id="protRelayControlledBreaker">
${buildOptions(getBreakerOptions(), asset?.controlledBreakerId || null, true, 'Select breaker')}
</select>
</div>
<div class="form-group">
<label for="protRelayMonitoredBus">Monitored Bus:</label>
<select id="protRelayMonitoredBus">
${buildOptions(getBusOptions(), asset?.monitoredBusId || null, true, 'Select bus')}
</select>
</div>
<div class="form-group">
<label for="protRelayMonitoredComponent">Monitored Component:</label>
<select id="protRelayMonitoredComponent">
${buildOptions(getComponentOptions(), asset?.monitoredComponentId || null, true, 'Select component')}
</select>
</div>
<div class="form-group">
<label for="protRelayProtectedZone">Protected Zone:</label>
<select id="protRelayProtectedZone">
${buildOptions((Array.isArray(protectionZones) ? protectionZones : []).map(zone => ({ value: zone.id, label: getProtectionAssetLabel(zone) })), asset?.protectedZoneId || null, true, 'Select zone')}
</select>
</div>
<div class="form-group">
<label for="protRelayFunctions">Device Functions (comma-separated):</label>
<input id="protRelayFunctions" type="text" value="${escapeProtectionHtml(Array.isArray(asset?.deviceFunctions) ? asset.deviceFunctions.join(', ') : '')}" placeholder="e.g., 50, 51, 50G, 51G">
</div>
<div class="form-group">
<label for="protRelayNotes">Notes:</label>
<textarea id="protRelayNotes" rows="3" placeholder="Optional notes">${escapeProtectionHtml(asset?.notes || '')}</textarea>
</div>`;
}

function renderCTForm(asset = null) {
 return `
<div class="form-group">
<label for="protCTTag">Tag:</label>
<input id="protCTTag" type="text" value="${escapeProtectionHtml(asset?.tag || '')}" placeholder="e.g., CT-E1-MAIN">
</div>
<div class="form-group">
<label for="protCTName">Name:</label>
<input id="protCTName" type="text" value="${escapeProtectionHtml(asset?.name || '')}" placeholder="e.g., E1 Main CT">
</div>
<div class="form-group">
<label for="protCTStatus">Status:</label>
<select id="protCTStatus">
${buildOptions(getProtectionDeviceStatusOptions(), asset?.status || 'active', false)}
</select>
</div>
<div class="form-group">
<label for="protCTRatioPrimary">Ratio Primary (A):</label>
<input id="protCTRatioPrimary" type="number" min="0" step="1" value="${escapeProtectionHtml(asset?.ratioPrimaryA ?? 0)}">
</div>
<div class="form-group">
<label for="protCTRatioSecondary">Ratio Secondary (A):</label>
<input id="protCTRatioSecondary" type="number" min="0" step="1" value="${escapeProtectionHtml(asset?.ratioSecondaryA ?? 5)}">
</div>
<div class="form-group">
<label for="protCTAccuracyClass">Accuracy Class:</label>
<input id="protCTAccuracyClass" type="text" value="${escapeProtectionHtml(asset?.accuracyClass || '')}" placeholder="e.g., 5P20">
</div>
<div class="form-group">
<label for="protCTAssociatedRelays">Associated Relay(s):</label>
<select id="protCTAssociatedRelays" multiple size="4">
${buildMultiOptions(getRelayOptions(), asset?.associatedRelayIds || [])}
</select>
</div>
<div class="form-group">
<label for="protCTAssociatedBreaker">Associated Breaker:</label>
<select id="protCTAssociatedBreaker">
${buildOptions(getBreakerOptions(), asset?.associatedBreakerId || null, true, 'Select breaker')}
</select>
</div>
<div class="form-group">
<label for="protCTMountedBus">Mounted At Bus:</label>
<select id="protCTMountedBus">
${buildOptions(getBusOptions(), asset?.mountedAtBusId || asset?.mountedAtBus || null, true, 'Select bus')}
</select>
</div>
<div class="form-group">
<label for="protCTNotes">Notes:</label>
<textarea id="protCTNotes" rows="3" placeholder="Optional notes">${escapeProtectionHtml(asset?.notes || '')}</textarea>
</div>`;
}

function renderVTForm(asset = null) {
 return `
<div class="form-group">
<label for="protVTTag">Tag:</label>
<input id="protVTTag" type="text" value="${escapeProtectionHtml(asset?.tag || '')}" placeholder="e.g., VT-E1-MAIN">
</div>
<div class="form-group">
<label for="protVTName">Name:</label>
<input id="protVTName" type="text" value="${escapeProtectionHtml(asset?.name || '')}" placeholder="e.g., E1 Main VT">
</div>
<div class="form-group">
<label for="protVTStatus">Status:</label>
<select id="protVTStatus">
${buildOptions(getProtectionDeviceStatusOptions(), asset?.status || 'active', false)}
</select>
</div>
<div class="form-group">
<label for="protVTRatioPrimary">Ratio Primary (V):</label>
<input id="protVTRatioPrimary" type="number" min="0" step="1" value="${escapeProtectionHtml(asset?.ratioPrimaryV ?? 0)}">
</div>
<div class="form-group">
<label for="protVTRatioSecondary">Ratio Secondary (V):</label>
<input id="protVTRatioSecondary" type="number" min="0" step="1" value="${escapeProtectionHtml(asset?.ratioSecondaryV ?? 110)}">
</div>
<div class="form-group">
<label for="protVTAccuracyClass">Accuracy Class:</label>
<input id="protVTAccuracyClass" type="text" value="${escapeProtectionHtml(asset?.accuracyClass || '')}" placeholder="e.g., 0.5">
</div>
<div class="form-group">
<label for="protVTAssociatedRelays">Associated Relay(s):</label>
<select id="protVTAssociatedRelays" multiple size="4">
${buildMultiOptions(getRelayOptions(), asset?.associatedRelayIds || [])}
</select>
</div>
<div class="form-group">
<label for="protVTMountedBus">Mounted At Bus:</label>
<select id="protVTMountedBus">
${buildOptions(getBusOptions(), asset?.mountedAtBusId || asset?.mountedAtBus || null, true, 'Select bus')}
</select>
</div>
<div class="form-group">
<label for="protVTNotes">Notes:</label>
<textarea id="protVTNotes" rows="3" placeholder="Optional notes">${escapeProtectionHtml(asset?.notes || '')}</textarea>
</div>`;
}

function renderZoneForm(asset = null) {
 const availableRelays = getRelayOptions();
 const availableCTs = getCTOptions();
 const availableVTs = getVTOptions();
 return `
<div class="form-group">
<label for="protZoneTag">Tag:</label>
<input id="protZoneTag" type="text" value="${escapeProtectionHtml(asset?.tag || '')}" placeholder="e.g., ZN-E1-FDR">
</div>
<div class="form-group">
<label for="protZoneName">Name:</label>
<input id="protZoneName" type="text" value="${escapeProtectionHtml(asset?.name || '')}" placeholder="e.g., E1 Feeder Zone">
</div>
<div class="form-group">
<label for="protZoneType">Zone Type:</label>
<select id="protZoneType">
${buildOptions(getZoneTypeOptions(), asset?.zoneType || 'feeder', false)}
</select>
</div>
<div class="form-group">
<label for="protZonePrimaryDevice">Primary Device:</label>
<select id="protZonePrimaryDevice">
${buildOptions(getPrimaryProtectiveDeviceOptions(), asset?.primaryDeviceId || null, true, 'Select primary device')}
</select>
</div>
<div class="form-group">
<label for="protZoneProtectedBuses">Protected Bus(es):</label>
<select id="protZoneProtectedBuses" multiple size="5">
${buildMultiOptions(getBusOptions(), asset?.protectedBusIds || [])}
</select>
</div>
<div class="form-group">
<label for="protZoneProtectedComponents">Protected Component(s):</label>
<select id="protZoneProtectedComponents" multiple size="5">
${buildMultiOptions(getComponentOptions(), asset?.protectedComponentIds || [])}
</select>
</div>
<div class="form-group">
<label for="protZoneRelays">Relay(s):</label>
<select id="protZoneRelays" multiple size="4">
${buildMultiOptions(availableRelays, asset?.relayIds || [])}
</select>
</div>
<div class="form-group">
<label for="protZoneCTs">CT Set(s):</label>
<select id="protZoneCTs" multiple size="4">
${buildMultiOptions(availableCTs, asset?.ctSetIds || [])}
</select>
</div>
<div class="form-group">
<label for="protZoneVTs">VT Set(s):</label>
<select id="protZoneVTs" multiple size="4">
${buildMultiOptions(availableVTs, asset?.vtSetIds || [])}
</select>
</div>
<div class="form-group">
<label for="protZoneParentZone">Parent Zone:</label>
<select id="protZoneParentZone">
${buildOptions((Array.isArray(protectionZones) ? protectionZones : []).map(zone => ({ value: zone.id, label: getProtectionAssetLabel(zone) })), asset?.parentZoneId || null, true, 'Select parent zone')}
</select>
</div>
<div class="form-group">
<label for="protZoneDescription">Description:</label>
<textarea id="protZoneDescription" rows="3" placeholder="Optional description">${escapeProtectionHtml(asset?.description || '')}</textarea>
</div>`;
}

function renderAssociationForm(asset = null) {
 return `
<div class="form-group">
<label for="protAssociationPrimaryDevice">Primary Device:</label>
<select id="protAssociationPrimaryDevice">
${buildOptions(getPrimaryProtectiveDeviceOptions(), asset?.primaryDeviceId || null, true, 'Select primary device')}
</select>
</div>
<div class="form-group">
<label for="protAssociationBackupDevices">Backup Device(s):</label>
<select id="protAssociationBackupDevices" multiple size="5">
${buildMultiOptions(getPrimaryProtectiveDeviceOptions(), asset?.backupDeviceIds || [])}
</select>
</div>
<div class="form-group">
<label for="protAssociationBus">Bus:</label>
<select id="protAssociationBus">
${buildOptions(getBusOptions(), asset?.busId || null, true, 'Select bus')}
</select>
</div>
<div class="form-group">
<label for="protAssociationComponent">Component:</label>
<select id="protAssociationComponent">
${buildOptions(getComponentOptions(), asset?.componentId || null, true, 'Select component')}
</select>
</div>
<div class="form-group">
<label for="protAssociationRelay">Relay:</label>
<select id="protAssociationRelay">
${buildOptions(getRelayOptions(), asset?.relayId || null, true, 'Select relay')}
</select>
</div>
<div class="form-group">
<label for="protAssociationType">Association Type:</label>
<select id="protAssociationType">
${buildOptions(getAssociationTypeOptions(), asset?.associationType || 'protects-feeder', false)}
</select>
</div>
<div class="form-group">
<label for="protAssociationNotes">Notes:</label>
<textarea id="protAssociationNotes" rows="3" placeholder="Optional notes">${escapeProtectionHtml(asset?.notes || '')}</textarea>
</div>`;
}

function buildProtectionDeviceBase(type) {
 return createProtectionDevice(type, {});
}

function createProtectionAssetObject(assetType) {
 if (assetType === 'relay') {
  const base = createRelay();
  return {
   ...base,
   tag: getTextValue('protRelayTag'),
   name: getTextValue('protRelayName'),
   status: getSingleValue('protRelayStatus') || 'active',
   relayFamily: getSingleValue('protRelayFamily') || 'numerical',
   controlledBreakerId: getSingleValue('protRelayControlledBreaker'),
   monitoredBusId: getSingleValue('protRelayMonitoredBus'),
   monitoredComponentId: getSingleValue('protRelayMonitoredComponent'),
   protectedZoneId: getSingleValue('protRelayProtectedZone'),
   deviceFunctions: getTextValue('protRelayFunctions').split(',').map(value => value.trim()).filter(value => value),
   notes: getTextValue('protRelayNotes'),
   metadata: {
    ...(base.metadata || {}),
    modifiedDate: new Date().toISOString(),
    source: 'user'
   }
  };
 }

 if (assetType === 'ct') {
  const base = createCT();
  return {
   ...base,
   tag: getTextValue('protCTTag'),
   name: getTextValue('protCTName'),
   status: getSingleValue('protCTStatus') || 'active',
   ratioPrimaryA: getNumberValue('protCTRatioPrimary', 0),
   ratioSecondaryA: getNumberValue('protCTRatioSecondary', 5),
   accuracyClass: getTextValue('protCTAccuracyClass'),
   associatedRelayIds: getSelectedValues('protCTAssociatedRelays'),
   associatedBreakerId: getSingleValue('protCTAssociatedBreaker'),
   mountedAtBusId: getSingleValue('protCTMountedBus'),
   notes: getTextValue('protCTNotes'),
   metadata: {
    ...(base.metadata || {}),
    modifiedDate: new Date().toISOString(),
    source: 'user'
   }
  };
 }

 if (assetType === 'vt') {
  const base = createVT();
  return {
   ...base,
   tag: getTextValue('protVTTag'),
   name: getTextValue('protVTName'),
   status: getSingleValue('protVTStatus') || 'active',
   ratioPrimaryV: getNumberValue('protVTRatioPrimary', 0),
   ratioSecondaryV: getNumberValue('protVTRatioSecondary', 110),
   accuracyClass: getTextValue('protVTAccuracyClass'),
   associatedRelayIds: getSelectedValues('protVTAssociatedRelays'),
   mountedAtBusId: getSingleValue('protVTMountedBus'),
   notes: getTextValue('protVTNotes'),
   metadata: {
    ...(base.metadata || {}),
    modifiedDate: new Date().toISOString(),
    source: 'user'
   }
  };
 }

 if (assetType === 'zone') {
  const base = createProtectionZone();
  return {
   ...base,
   tag: getTextValue('protZoneTag'),
   name: getTextValue('protZoneName'),
   zoneType: getSingleValue('protZoneType') || 'feeder',
   primaryDeviceId: getSingleValue('protZonePrimaryDevice'),
   protectedBusIds: getSelectedValues('protZoneProtectedBuses'),
   protectedComponentIds: getSelectedValues('protZoneProtectedComponents'),
   relayIds: getSelectedValues('protZoneRelays'),
   ctSetIds: getSelectedValues('protZoneCTs'),
   vtSetIds: getSelectedValues('protZoneVTs'),
   parentZoneId: getSingleValue('protZoneParentZone'),
   description: getTextValue('protZoneDescription')
  };
 }

 const base = createProtectionAssociation();
 return {
  ...base,
  primaryDeviceId: getSingleValue('protAssociationPrimaryDevice'),
  backupDeviceIds: getSelectedValues('protAssociationBackupDevices'),
  busId: getSingleValue('protAssociationBus'),
  componentId: getSingleValue('protAssociationComponent'),
  relayId: getSingleValue('protAssociationRelay'),
  associationType: getSingleValue('protAssociationType') || 'protects-feeder',
  notes: getTextValue('protAssociationNotes')
 };
}

function saveProtectionAsset() {
 ensureProtectionCollections();
 const assetType = getProtectionAssetType();
 const collection = getProtectionCollectionByType(assetType);
 const newAsset = createProtectionAssetObject(assetType);

 if (!newAsset.id) {
  newAsset.id = `${assetType}-${Date.now()}`;
 }

 if (editingProtectionAssetType === assetType && editingProtectionAssetIndex !== null && editingProtectionAssetIndex !== undefined) {
  const existing = collection[editingProtectionAssetIndex] || {};
  collection[editingProtectionAssetIndex] = {
   ...existing,
   ...newAsset
  };
 } else {
  collection.push(newAsset);
 }

 editingProtectionAssetType = null;
 editingProtectionAssetIndex = null;
 updateProtectionAssetForm();
 renderProtectionAssetsList();

 if (typeof scheduleAutoSave === 'function') {
  try { scheduleAutoSave(); } catch (_) {}
 }
}

function renderProtectionAssetsList() {
 ensureProtectionCollections();
 const container = document.getElementById('protectionAssetsList');
 if (!container) return;

 const assetType = getProtectionAssetType();
 const collection = getProtectionCollectionByType(assetType);
 if (!Array.isArray(collection) || collection.length === 0) {
  container.innerHTML = `
<div class="alert alert-info">
No ${escapeProtectionHtml(assetType)} assets created yet.
</div>`;
  return;
 }

 let html = '<div class="table-responsive"><table class="results-table">';
 html += '<tr><th>#</th><th>Label</th><th>Type / Info</th><th>Actions</th></tr>';

 collection.forEach((asset, index) => {
  let info = '';
  if (assetType === 'relay') {
   info = `Relay / ${asset.relayFamily || 'n/a'}`;
  } else if (assetType === 'ct') {
   info = `CT / ${asset.ratioPrimaryA || 0}:${asset.ratioSecondaryA || 0}`;
  } else if (assetType === 'vt') {
   info = `VT / ${asset.ratioPrimaryV || 0}:${asset.ratioSecondaryV || 0}`;
  } else if (assetType === 'zone') {
   info = `Zone / ${asset.zoneType || 'n/a'}`;
  } else if (assetType === 'association') {
   info = `Association / ${asset.associationType || 'n/a'}`;
  }

  html += '<tr>';
  html += `<td>${index + 1}</td>`;
  html += `<td>${escapeProtectionHtml(getProtectionAssetLabel(asset))}</td>`;
  html += `<td>${escapeProtectionHtml(info)}</td>`;
  html += `<td>
<button class="btn btn-secondary" style="margin-right: 5px;" onclick="editProtectionAsset('${assetType}', ${index})">Edit</button>
<button class="btn btn-danger" onclick="deleteProtectionAsset('${assetType}', ${index})">Delete</button>
</td>`;
  html += '</tr>';
 });

 html += '</table></div>';
 container.innerHTML = html;
}

function editProtectionAsset(assetType, index) {
 const typeSelect = document.getElementById('protectionAssetType');
 if (typeSelect) {
  typeSelect.value = assetType;
 }
 editingProtectionAssetType = assetType;
 editingProtectionAssetIndex = index;
 updateProtectionAssetForm();
}

function deleteProtectionAsset(assetType, index) {
 const collection = getProtectionCollectionByType(assetType);
 if (!Array.isArray(collection) || !collection[index]) return;
 const label = getProtectionAssetLabel(collection[index]);
 if (!confirm(`Delete ${label}?`)) return;
 collection.splice(index, 1);
 if (editingProtectionAssetType === assetType && editingProtectionAssetIndex === index) {
  editingProtectionAssetType = null;
  editingProtectionAssetIndex = null;
 }
 updateProtectionAssetForm();
 renderProtectionAssetsList();
 if (typeof scheduleAutoSave === 'function') {
  try { scheduleAutoSave(); } catch (_) {}
 }
}

window.openProtectionAssetsModal = openProtectionAssetsModal;
window.closeProtectionAssetsModal = closeProtectionAssetsModal;
window.updateProtectionAssetForm = updateProtectionAssetForm;
window.saveProtectionAsset = saveProtectionAsset;
window.renderProtectionAssetsList = renderProtectionAssetsList;
window.editProtectionAsset = editProtectionAsset;
window.deleteProtectionAsset = deleteProtectionAsset;

console.log('✅ Protection Manager Module v1.0.0 loaded');
console.log(' - Relay / CT / VT management: READY');
console.log(' - Protection zone management: READY');
console.log(' - Protection association management: READY');
