/** 
 * Project Manager Module 
 * Handles saving and loading of project data 
 * 
 * @author bfforex 
 * @date 2025-12-01 
 * @version 1.3.2 
 * @fixed Circular reference in JSON serialization 
 * @fixed Auto-save circular reference with systemFault 
 * @fixed ISSUE #10: Accept both numeric and string IDs for backward compatibility 
 * @fixed localStorage quota exceeded error when bus count reaches 94+ 
 * @enhancement ISSUE #8: Added comprehensive input validation and sanitization 
 * @enhancement Added validateProjectData() for structure validation 
 * @enhancement Added sanitizeProjectData() for safe data handling 
 * @enhancement Added sanitizeString() and sanitizeNumber() helper functions 
 * @enhancement Auto-save now strips calculation results to reduce size 
 */ 
console.log('🔧 Loading Project Manager v1.3.2...'); 
console.log(' ✅ Input validation enabled (Issue #8)'); 
console.log(' ✅ Data sanitization enabled (Issue #8)'); 
console.log(' ✅ ID type flexibility enabled (Issue #10)'); 
console.log(' ✅ Auto-save optimization enabled (quota fix)'); 
// ✅ CODE REVIEW: Define constants for consistency and maintainability 
const PROJECT_MANAGER_VERSION = '1.3.2'; 
const MAX_STRING_LENGTH = 1000; // Maximum allowed string length for security 
// ✅ CODE REVIEW: ID generation counter for uniqueness 
let idCounter = 0; 
/** 
 * Generate unique ID with prefix 
 * ✅ CODE REVIEW: Counter-based approach ensures uniqueness even with rapid calls 
 * @param {string} prefix - ID prefix (e.g., 'bus', 'comp') 
 * @returns {string} Unique ID 
 */ 
function generateUniqueId(prefix = 'item') { 
 return `${prefix}-${Date.now()}-${++idCounter}`; 
} 
/** 
 * Save project to JSON file 
 */ 
function saveProject() { 
 try { 
 const projectName = document.getElementById('projectName').value || 'Untitled Project'; 
 const engineer = document.getElementById('engineer').value || 'Unknown'; 
 const projectNumber = document.getElementById('projectNumber').value || ''; 
 console.log('💾 Saving project...'); 
 // Clean buses - remove circular references 
 const projectData = ProjectSerializer.buildProjectData({
   includeResults: true,
   autoSave: false
 });
 const busesClean = projectData.buses;
 const json = ProjectSerializer.serialize({
   includeResults: true,
   autoSave: false,
   pretty: true
 });
 // Create blob and download 
 const blob = new Blob([json], { type: 'application/json' }); 
 const url = URL.createObjectURL(blob); 
 const a = document.createElement('a'); 
 a.href = url; 
 a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`; 
 document.body.appendChild(a); 
 a.click(); 
 document.body.removeChild(a); 
 URL.revokeObjectURL(url); 
 console.log('✅ Project saved successfully'); 
 console.log(` File: ${a.download}`); 
 console.log(` Buses: ${busesClean.length}`); 
 console.log(` Components: ${components.length}`); 
 alert(`✅ Project saved successfully!\n\nFile: ${a.download}\nBuses: ${busesClean.length}\nComponents: ${components.length}`); 
 } catch (error) { 
 console.error('❌ Save failed:', error); 
 console.error('Stack trace:', error.stack); 
 alert(`❌ Failed to save project:\n\n${error.message}\n\nCheck browser console for details.`); 
 } 
} 
/** 
 * Clean path array 
 * 
 * @param {Array} pathArray - Array of path segments 
 * @returns {Array} Cleaned path array 
 */ 
function cleanPathArray(pathArray) { 
 if (!Array.isArray(pathArray)) return []; 
 return pathArray 
 .filter(segment => segment && segment.bus) 
 .map(segment => { 
 // Create a clean bus object without results property 
 const cleanBus = { 
 id: segment.bus. id, 
 name: segment. bus.name || 'Unknown', 
 voltage: segment.bus.voltage || 0, 
 type: segment.bus.type || 'unknown', 
 tag: segment.bus.tag || '' 
 }; 
 // ✅ DO NOT include segment.bus.results - this causes circular reference 
 const cleanComponent = segment.component ? { 
 id: segment.component.id, 
 type: segment.component.type || 'unknown', 
 name: segment.component.name || 'Unknown Component', 
 tag: segment.component.tag || '' 
 } : null; 
 return { 
 sequence: segment.sequence || 0, 
 bus: cleanBus, 
 component: cleanComponent 
 }; 
 }); 
} 
/** 
 * Clean result object 
 * 
 * @param {Object} resultObj - Result object 
 * @returns {Object} Cleaned result object 
 */ 
function cleanResultObject(resultObj) { 
 if (!resultObj || typeof resultObj !== 'object') return null; 
 const cleaned = { ...resultObj }; 
 // ✅ CRITICAL: Clean the path to remove circular references 
 if (cleaned.path) { 
 cleaned.path = cleanPathArray(cleaned.path); 
 } 
 // Clean motorContribution if present 
 if (cleaned.motorContribution && cleaned.motorContribution.motors) { 
 cleaned.motorContribution = { 
 ... cleaned.motorContribution, 
 motors: Array.isArray(cleaned.motorContribution.motors) 
 ? cleaned.motorContribution.motors.map(m => ({ 
 id: m.id, 
 name: m.name, 
 hp: m.hp, 
 motorType: m.motorType 
 })) 
 : [] 
 }; 
 } 
 return cleaned; 
} 
/** 
 * Clean results object 
 * 
 * @param {Object} results - Results object 
 * @returns {Object} Cleaned results object 
 */ 
function cleanResultsObject(results) { 
 if (!results || typeof results !== 'object') return null; 
 const cleaned = {}; 
 // Clean shortCircuit results 
 if (results.shortCircuit) { 
 cleaned.shortCircuit = cleanResultObject(results.shortCircuit); 
 } 
 // Clean loadFlow results 
 if (results. loadFlow) { 
 const lfCleaned = { ...results.loadFlow }; 
 // Remove any path arrays from load flow too 
 if (lfCleaned.pathTrace) { 
 lfCleaned.pathTrace = cleanPathArray(lfCleaned.pathTrace); 
 } 
 cleaned.loadFlow = lfCleaned; 
 } 
 // Clean voltageDrop results 
 if (results. voltageDrop) { 
 const vdCleaned = { ...results.voltageDrop }; 
 // Remove any path arrays 
 if (vdCleaned.path) { 
 vdCleaned.path = cleanPathArray(vdCleaned.path); 
 } 
 cleaned.voltageDrop = vdCleaned; 
 } 
 // Clean arcFlash results 
 if (results.arcFlash) { 
 cleaned.arcFlash = { ...results.arcFlash }; 
 } 
 // Clean main path if exists at top level 
 if (results.path) { 
 cleaned.path = cleanPathArray(results.path); 
 } 
 // Copy other properties (scalars only) 
 Object.keys(results).forEach(key => { 
 if (! cleaned[key] && typeof results[key] !== 'object') { 
 cleaned[key] = results[key]; 
 } 
 }); 
 return cleaned; 
} 
/** 
 * Clean buses for serialization 
 * Removes circular references from bus objects 
 * 
 * @param {Array} buses - Array of bus objects 
 * @returns {Array} Cleaned bus array 
 */ 
function cleanBusesForSerialization(buses) { 
 if (!Array. isArray(buses)) return []; 
 return buses.map(bus => { 
 if (! bus || typeof bus !== 'object') return null; 
 const busClone = { 
 id: bus.id, 
 name: bus.name, 
 voltage: bus.voltage, 
 type: bus.type, 
 tag: bus.tag, 
 parent: bus.parent, 
 parentBus: bus.parentBus, 
 availableFaultCurrent: bus.availableFaultCurrent, 
 xrRatio: bus.xrRatio, 
 demandFactor: bus.demandFactor, 
 diversityFactor: bus.diversityFactor, 
 utilityFaultCurrent: bus.utilityFaultCurrent, 
 utilityFaultMVA: bus.utilityFaultMVA, 
 utilityXR: bus.utilityXR, 
 loadCurrent: bus.loadCurrent, 
 // ✅ CRITICAL FIX: Preserve auto-calculated flag to prevent double-counting 
 // Added: 2025-12-01 by bfforex 
 loadCurrentAutoCalculated: bus.loadCurrentAutoCalculated || false, 
 }; 
 // ✅ Clean results to remove circular references 
 if (bus.results) { 
 busClone.results = cleanResultsObject(bus.results); 
 } 
 // ✅ Remove systemFault to prevent circular references 
 // DO NOT include bus.systemFault 
 // ✅ Remove pathComponents to prevent circular references 
 // DO NOT include bus.pathComponents 
 return busClone; 
 }). filter(bus => bus !== null); 
} 
/** 
 * Validate project data structure and types 
 * ✅ ISSUE #8: Comprehensive input validation 
 * ✅ ISSUE #10: Accept both numeric and string IDs 
 * 
 * @param {Object} data - Project data to validate 
 * @returns {Object} Validation result with {valid: boolean, errors: string[], warnings: string[]} 
 */ 
function validateProjectData(data) { 
 const errors = []; 
 const warnings = []; 
 // Check for required top-level structure 
 if (!data || typeof data !== 'object') { 
 errors.push('Project data must be an object'); 
 return { valid: false, errors, warnings }; 
 } 
 // Validate buses array 
 if (!data.buses || ! Array.isArray(data.buses)) { 
 errors.push('Missing or invalid buses array'); 
 } else if (data.buses.length === 0) { 
 warnings.push('Project contains no buses'); 
 } else { 
 // Validate each bus 
 data.buses.forEach((bus, index) => { 
 if (!bus || typeof bus !== 'object') { 
 errors.push(`Bus at index ${index} is not an object`); 
 return; 
 } 
 // ✅ ISSUE #10 FIX: Accept both string and number IDs for backward compatibility 
 if (bus.id === null || bus.id === undefined) { 
 errors.push(`Bus at index ${index} missing valid id`); 
 } else if (typeof bus.id !== 'string' && typeof bus.id !== 'number') { 
 errors.push(`Bus at index ${index} has invalid id type (must be string or number, got ${typeof bus.id})`); 
 } 
 if (! bus.name || typeof bus.name !== 'string') { 
 errors.push(`Bus at index ${index} missing valid name`); 
 } 
 if (typeof bus.voltage !== 'number' || bus.voltage <= 0) { 
 errors.push(`Bus "${bus.name || 'Unknown'}" has invalid voltage`); 
 } 
 if (! bus.type || typeof bus.type !== 'string') { 
 errors.push(`Bus "${bus.name || 'Unknown'}" missing valid type`); 
 } 
 }); 
 } 
 // Validate components array 
 if (!data.components || !Array.isArray(data.components)) { 
 errors.push('Missing or invalid components array'); 
 } else { 
 // Validate each component 
 data.components.forEach((component, index) => { 
 if (!component || typeof component !== 'object') { 
 errors.push(`Component at index ${index} is not an object`); 
 return; 
 } 
 // ✅ ISSUE #10 FIX: Accept both string and number IDs for backward compatibility 
 if (component.id === null || component.id === undefined) { 
 errors.push(`Component at index ${index} missing valid id`); 
 } else if (typeof component.id !== 'string' && typeof component.id !== 'number') { 
 errors.push(`Component at index ${index} has invalid id type (must be string or number, got ${typeof component.id})`); 
 } 
 if (!component.type || typeof component.type !== 'string') { 
 errors.push(`Component at index ${index} missing valid type`); 
 } 
 }); 
 } 
 // Validate project info (optional but should have proper structure if present) 
 if (data.projectInfo && typeof data.projectInfo !== 'object') { 
 errors.push('projectInfo must be an object if present'); 
 } 
 // Validate settings (optional but should have proper structure if present) 
 if (data.settings) { 
 if (typeof data.settings !== 'object') { 
 errors.push('settings must be an object if present'); 
 } else { 
 // Validate numeric settings 
 if (data.settings.loadCurrent !== undefined && (typeof data.settings.loadCurrent !== 'number' || data.settings.loadCurrent < 0)) { 
 warnings.push('Invalid loadCurrent value, will use default'); 
 } 
 if (data.settings.powerFactor !== undefined && (typeof data.settings.powerFactor !== 'number' || data.settings.powerFactor <= 0 || data.settings.powerFactor > 1)) { 
 warnings.push('Invalid powerFactor value, will use default'); 
 } 
 if (data.settings.temperature !== undefined && (typeof data.settings.temperature !== 'number' || data.settings.temperature < -50 || data.settings.temperature > 200)) { 
 warnings.push('Invalid temperature value, will use default'); 
 } 
 } 
 } 
 
 if (data.protectionDevices !== undefined && !Array.isArray(data.protectionDevices)) { 
 errors.push('protectionDevices must be an array if present'); 
 } 
 if (data.protectionZones !== undefined && !Array.isArray(data.protectionZones)) { 
 errors.push('protectionZones must be an array if present'); 
 } 
 if (data.protectionAssociations !== undefined && !Array.isArray(data.protectionAssociations)) { 
 errors.push('protectionAssociations must be an array if present'); 
 } 
 return { 
 valid: errors.length === 0, 
 errors, 
 warnings 
 }; 
} 
/** 
 * Sanitize project data to ensure safe values 
 * ✅ ISSUE #8: Data sanitization for security 
 * ✅ ISSUE #10: Preserve ID types (numeric or string) for backward compatibility 
 * 
 * @param {Object} data - Project data to sanitize 
 * @returns {Object} Sanitized project data 
 */ 
function sanitizeProjectData(data) { 
 const sanitized = { 
 projectInfo: { 
 name: sanitizeString(data.projectInfo?.name, 'Untitled Project'), 
 engineer: sanitizeString(data.projectInfo?.engineer, 'Unknown'), 
 projectNumber: sanitizeString(data.projectInfo?.projectNumber, ''), 
 version: data.projectInfo?.version || PROJECT_MANAGER_VERSION 
 }, 
 buses: [], 
 components: [], 
 protectionDevices: [], 
 protectionZones: [], 
 protectionAssociations: [], 
 settings: { 
 loadCurrent: sanitizeNumber(data.settings?.loadCurrent, 100, 0, 100000), 
 powerFactor: sanitizeNumber(data.settings?.powerFactor, 0.9, 0.1, 1.0), 
 voltageDropLimit: sanitizeNumber(data.settings?.voltageDropLimit, 3, 0, 100), 
 temperature: sanitizeNumber(data.settings?.temperature, 75, -50, 200), 
 method: ['point-to-point', 'per-unit'].includes(data.settings?.method) ? data.settings.method : 'point-to-point' 
 } 
 }; 
 // Sanitize buses 
 if (Array.isArray(data.buses)) { 
 sanitized.buses = data.buses.map(bus => ({ 
 // ✅ ISSUE #10 FIX: Preserve ID as-is (string or number) for backward compatibility 
 id: bus.id !== null && bus.id !== undefined ? bus.id : generateUniqueId('bus'), 
 name: sanitizeString(bus.name, 'Unnamed Bus'), 
 voltage: sanitizeNumber(bus.voltage, 440, 1, 1000000), 
 type: sanitizeString(bus.type, 'load'), 
 parent: bus.parent !== undefined ? bus.parent : null, 
 parentBus: bus.parentBus !== undefined ? bus.parentBus : null, 
 tag: sanitizeString(bus.tag, ''), // ✅ ADD: Preserve bus tag 
 // Preserve other bus properties 
 availableFaultCurrent: sanitizeNumber(bus.availableFaultCurrent, 0, 0, 1000000), 
 xrRatio: sanitizeNumber(bus.xrRatio, 0, 0, 100), 
 demandFactor: sanitizeNumber(bus. demandFactor, 1.0, 0, 10), 
 diversityFactor: sanitizeNumber(bus.diversityFactor, 1.0, 0, 10), 
 // Preserve utility fault data if present 
 utilityFaultCurrent: bus. utilityFaultCurrent || null, 
 utilityFaultMVA: bus.utilityFaultMVA || null, 
 utilityXR: bus.utilityXR || null, 
 // ✅ CRITICAL: Preserve load current 
 loadCurrent: sanitizeNumber(bus.loadCurrent, 0, 0, 100000), 
 // ✅ CRITICAL FIX: Preserve auto-calculated flag to prevent double-counting 
 // Added: 2025-12-01 by bfforex 
 loadCurrentAutoCalculated: bus.loadCurrentAutoCalculated || false, 
 // ✅ CRITICAL: Preserve calculation results if present 
 results: bus.results || null, 
 // ✅ CRITICAL: Preserve fault current results for display 
 faultCurrent: bus.faultCurrent || null, 
 asymFaultCurrent: bus.asymFaultCurrent || null, 
 totalZ: bus.totalZ || null, 
 pathComponents: bus.pathComponents || null 
 })); 
 } 
 // Sanitize components 
 if (Array.isArray(data.components)) { 
 sanitized.components = data.components.map(component => { 
 const base = { 
 id: component.id !== null && component.id !== undefined ? component.id : generateUniqueId('comp'), 
 type: sanitizeString(component.type, 'unknown'), 
 tag: sanitizeString(component.tag, ''), 
 description: sanitizeString(component.description, ''), 
 name: sanitizeString(component.name, ''), 
 tagAutoGenerated: component.tagAutoGenerated === true 
 }; 
 // Add type-specific properties with sanitization 
 if (component.type === 'cable') { 
 return { 
 ...base, 
 // ✅ CRITICAL FIX: Preserve BOTH ID formats for backward compatibility 
 // traceBusPath() uses fromBus/toBus, loadFlow also uses these 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 size: sanitizeString(component.size, ''), 
 length: sanitizeNumber(component.length, 0, 0, 100000), 
 material: sanitizeString(component.material, 'copper'), 
 conduit: sanitizeString(component.conduit, 'PVC'), 
 parallel: sanitizeNumber(component.parallel, 1, 1, 10), 
 // Preserve additional cable properties 
 manufacturer: sanitizeString(component.manufacturer, ''), 
 catalogNumber: sanitizeString(component.catalogNumber, ''), 
 insulation: sanitizeString(component.insulation, ''), 
 voltageRating: sanitizeString(component.voltageRating, ''), 
 installationDate: sanitizeString(component.installationDate, ''), 
 notes: sanitizeString(component.notes, '') 
 }; 
 } else if (component.type === 'transformer') { 
 return { 
 ...base, 
 // ✅ CRITICAL FIX: Preserve BOTH ID formats 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 rating: sanitizeNumber(component.rating, 100, 1, 100000), 
 // Support both property names for voltage 
 primary: sanitizeNumber(component.primary || component.primaryVoltage, 440, 1, 1000000), 
 secondary: sanitizeNumber(component.secondary || component.secondaryVoltage, 440, 1, 1000000), 
 primaryVoltage: sanitizeNumber(component.primaryVoltage || component.primary, 440, 1, 1000000), 
 secondaryVoltage: sanitizeNumber(component.secondaryVoltage || component.secondary, 440, 1, 1000000), 
 impedance: sanitizeNumber(component.impedance, 5, 0.1, 100), 
 xr: sanitizeNumber(component.xr, 5, 0, 100), 
 tapSetting: sanitizeNumber(component.tapSetting, 0, -10, 10) 
 }; 
 } else if (component.type === 'motor') { 
 return { 
 ...base, 
 // ✅ CRITICAL FIX: Motors also need fromBus/toBus preserved! 
 // Motors were created with these properties, we must keep them 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 // Motor-specific properties 
 busId: component.busId, 
 busName: sanitizeString(component.busName, ''), 
 hp: sanitizeNumber(component.hp, 10, 0.1, 100000), 
 voltage: sanitizeNumber(component.voltage, 440, 1, 1000000), 
 efficiency: sanitizeNumber(component.efficiency, 0.9, 0.1, 1.0), 
 powerFactor: sanitizeNumber(component.powerFactor, 0.85, 0.1, 1.0), 
 motorType: sanitizeString(component.motorType, 'induction'), 
 // Preserve additional motor properties 
 location: sanitizeString(component.location, ''), 
 sequenceNumber: component.sequenceNumber, 
 tagAutoGenerated: component.tagAutoGenerated === true 
 }; 
 } else if (component.type === 'generator') { 
 return { 
 ...base, 
 // ✅ CRITICAL FIX: Generators also need fromBus/toBus preserved! 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 // Generator-specific properties 
 busId: component.busId, 
 busName: sanitizeString(component.busName, ''), 
 rating: sanitizeNumber(component.rating, 100, 1, 100000), 
 voltage: sanitizeNumber(component.voltage, 440, 1, 1000000), 
 subtransient: sanitizeNumber(component.subtransient, 20, 0.1, 100) 
 }; 
 } else if (component.type === 'breaker') { 
 return { 
 ...base, 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 voltage: sanitizeNumber(component.voltage, 0, 0, 1000000), 
 breakerClass: sanitizeString(component.breakerClass, 'MCCB'), 
 tripUnitType: sanitizeString(component.tripUnitType, 'electronic'), 
 continuousAmpRating: sanitizeNumber(component.continuousAmpRating, 0, 0, 100000), 
 interruptingRatingSymKA: sanitizeNumber(component.interruptingRatingSymKA, 0, 0, 1000), 
 interruptingRatingAsymKA: sanitizeNumber(component.interruptingRatingAsymKA, 0, 0, 1000), 
 momentaryRatingKA: sanitizeNumber(component.momentaryRatingKA, 0, 0, 1000), 
 closeLatchRatingKA: sanitizeNumber(component.closeLatchRatingKA, 0, 0, 1000) 
 }; 
 } else if (component.type === 'fuse') { 
 return { 
 ...base, 
 fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus, 
 toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus, 
 fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId, 
 toBus: component.toBus !== undefined ? component.toBus : component.toBusId, 
 fromBusName: sanitizeString(component.fromBusName, ''), 
 toBusName: sanitizeString(component.toBusName, ''), 
 voltage: sanitizeNumber(component.voltage, 0, 0, 1000000), 
 fuseClass: sanitizeString(component.fuseClass, 'HRC'), 
 speedClass: sanitizeString(component.speedClass, ''), 
 ampereRating: sanitizeNumber(component.ampereRating, 0, 0, 100000), 
 interruptingRatingKA: sanitizeNumber(component.interruptingRatingKA, 0, 0, 1000) 
 }; 
 } 
 // For other types, preserve all properties with base sanitization 
 return { ...component, ...base }; 
 }); 
 } 
 
 // Sanitize protection devices (relay / CT / VT metadata devices) 
 if (Array.isArray(data.protectionDevices)) { 
 sanitized.protectionDevices = data.protectionDevices.map(device => { 
 const baseDevice = { 
 id: device.id !== null && device.id !== undefined ? device.id : generateUniqueId('prot'), 
 tag: sanitizeString(device.tag, ''), 
 name: sanitizeString(device.name, ''), 
 type: sanitizeString(device.type, ''), 
 status: sanitizeString(device.status, 'active'), 
 voltage: sanitizeNumber(device.voltage, 0, 0, 1000000), 
 frequencyHz: sanitizeNumber(device.frequencyHz, 60, 0, 1000), 
 phases: sanitizeNumber(device.phases, 3, 1, 3), 
 fromBus: device.fromBus !== undefined ? device.fromBus : null, 
 toBus: device.toBus !== undefined ? device.toBus : null, 
 locationBusId: device.locationBusId !== undefined ? device.locationBusId : null, 
 mountedOnComponentId: device.mountedOnComponentId !== undefined ? device.mountedOnComponentId : null, 
 description: sanitizeString(device.description, ''), 
 manufacturer: sanitizeString(device.manufacturer, ''), 
 model: sanitizeString(device.model, ''), 
 standard: sanitizeString(device.standard, ''), 
 notes: sanitizeString(device.notes, ''), 
 metadata: { 
 createdDate: sanitizeString(device.metadata?.createdDate, ''), 
 modifiedDate: sanitizeString(device.metadata?.modifiedDate, ''), 
 source: sanitizeString(device.metadata?.source, '') 
 } 
 }; 
 
 if (baseDevice.type === 'relay') { 
 return { 
 ...baseDevice, 
 relayFamily: sanitizeString(device.relayFamily, 'numerical'), 
 firmwareVersion: sanitizeString(device.firmwareVersion, ''), 
 controlledBreakerId: device.controlledBreakerId !== undefined ? device.controlledBreakerId : null, 
 monitoredBusId: device.monitoredBusId !== undefined ? device.monitoredBusId : null, 
 monitoredComponentId: device.monitoredComponentId !== undefined ? device.monitoredComponentId : null, 
 protectedZoneId: device.protectedZoneId !== undefined ? device.protectedZoneId : null, 
 deviceFunctions: Array.isArray(device.deviceFunctions) ? device.deviceFunctions.map(fn => sanitizeString(fn, '')).filter(fn => fn) : [], 
 ctSetId: device.ctSetId !== undefined ? device.ctSetId : null, 
 vtSetId: device.vtSetId !== undefined ? device.vtSetId : null, 
 settings: device.settings && typeof device.settings === 'object' ? device.settings : {}, 
 logic: device.logic && typeof device.logic === 'object' ? device.logic : {}, 
 coordinationGroup: device.coordinationGroup !== undefined ? device.coordinationGroup : null 
 }; 
 } else if (baseDevice.type === 'ct') { 
 return { 
 ...baseDevice, 
 ratioPrimaryA: sanitizeNumber(device.ratioPrimaryA, 0, 0, 1000000), 
 ratioSecondaryA: sanitizeNumber(device.ratioSecondaryA, 5, 0, 100), 
 accuracyClass: sanitizeString(device.accuracyClass, ''), 
 burdenVA: sanitizeNumber(device.burdenVA, 0, 0, 100000), 
 saturationClass: sanitizeString(device.saturationClass, ''), 
 kneePointVoltage: device.kneePointVoltage !== undefined && device.kneePointVoltage !== null ? sanitizeNumber(device.kneePointVoltage, 0, 0, 1000000) : null, 
 associatedRelayIds: Array.isArray(device.associatedRelayIds) ? device.associatedRelayIds.filter(id => id !== null && id !== undefined) : [], 
 associatedBreakerId: device.associatedBreakerId !== undefined ? device.associatedBreakerId : null, 
 mountedAtBusId: device.mountedAtBusId !== undefined ? device.mountedAtBusId : null 
 }; 
 } else if (baseDevice.type === 'vt') { 
 return { 
 ...baseDevice, 
 ratioPrimaryV: sanitizeNumber(device.ratioPrimaryV, 0, 0, 1000000), 
 ratioSecondaryV: sanitizeNumber(device.ratioSecondaryV, 110, 0, 1000000), 
 accuracyClass: sanitizeString(device.accuracyClass, ''), 
 burdenVA: sanitizeNumber(device.burdenVA, 0, 0, 100000), 
 associatedRelayIds: Array.isArray(device.associatedRelayIds) ? device.associatedRelayIds.filter(id => id !== null && id !== undefined) : [], 
 mountedAtBusId: device.mountedAtBusId !== undefined ? device.mountedAtBusId : null 
 }; 
 } 
 
 return baseDevice; 
 }); 
 } 
 
 // Sanitize protection zones 
 if (Array.isArray(data.protectionZones)) { 
 sanitized.protectionZones = data.protectionZones.map(zone => ({ 
 id: zone.id !== null && zone.id !== undefined ? zone.id : generateUniqueId('pzone'), 
 tag: sanitizeString(zone.tag, ''), 
 name: sanitizeString(zone.name, ''), 
 zoneType: sanitizeString(zone.zoneType, 'feeder'), 
 primaryDeviceId: zone.primaryDeviceId !== undefined ? zone.primaryDeviceId : null, 
 backupDeviceIds: Array.isArray(zone.backupDeviceIds) ? zone.backupDeviceIds.filter(id => id !== null && id !== undefined) : [], 
 protectedBusIds: Array.isArray(zone.protectedBusIds) ? zone.protectedBusIds.filter(id => id !== null && id !== undefined) : [], 
 protectedComponentIds: Array.isArray(zone.protectedComponentIds) ? zone.protectedComponentIds.filter(id => id !== null && id !== undefined) : [], 
 relayIds: Array.isArray(zone.relayIds) ? zone.relayIds.filter(id => id !== null && id !== undefined) : [], 
 ctSetIds: Array.isArray(zone.ctSetIds) ? zone.ctSetIds.filter(id => id !== null && id !== undefined) : [], 
 vtSetIds: Array.isArray(zone.vtSetIds) ? zone.vtSetIds.filter(id => id !== null && id !== undefined) : [], 
 parentZoneId: zone.parentZoneId !== undefined ? zone.parentZoneId : null, 
 description: sanitizeString(zone.description, '') 
 })); 
 } 
 
 // Sanitize protection associations 
 if (Array.isArray(data.protectionAssociations)) { 
 sanitized.protectionAssociations = data.protectionAssociations.map(association => ({ 
 id: association.id !== null && association.id !== undefined ? association.id : generateUniqueId('passoc'), 
 primaryDeviceId: association.primaryDeviceId !== undefined ? association.primaryDeviceId : null, 
 backupDeviceIds: Array.isArray(association.backupDeviceIds) ? association.backupDeviceIds.filter(id => id !== null && id !== undefined) : [], 
 busId: association.busId !== undefined ? association.busId : null, 
 componentId: association.componentId !== undefined ? association.componentId : null, 
 relayId: association.relayId !== undefined ? association.relayId : null, 
 associationType: sanitizeString(association.associationType, 'protects-feeder'), 
 notes: sanitizeString(association.notes, '') 
 })); 
 } 
 
 return sanitized; 
} 
/** 
 * Sanitize a string value 
 * ✅ CODE REVIEW: Enhanced to remove more potentially dangerous characters 
 * @param {*} value - Value to sanitize 
 * @param {string} defaultValue - Default value if invalid 
 * @returns {string} Sanitized string 
 */ 
function sanitizeString(value, defaultValue = '') { 
 if (typeof value !== 'string') return defaultValue; 
 // Remove potentially dangerous characters: 
 // - HTML tags: < > 
 // - Script injection: quotes, semicolons, backslashes 
 // - Control characters 
 return value 
 .replace(/[<>'"`;\\]/g, '') 
 .replace(/[\x00-\x1F\x7F]/g, '') 
 .trim() 
 .substring(0, MAX_STRING_LENGTH); 
} 
/** 
 * Sanitize a numeric value 
 * @param {*} value - Value to sanitize 
 * @param {number} defaultValue - Default value if invalid 
 * @param {number} min - Minimum allowed value 
 * @param {number} max - Maximum allowed value 
 * @returns {number} Sanitized number 
 */ 
function sanitizeNumber(value, defaultValue, min = -Infinity, max = Infinity) { 
 const num = typeof value === 'number' ? value : parseFloat(value); 
 if (isNaN(num) || ! isFinite(num)) return defaultValue; 
 return Math.max(min, Math.min(max, num)); 
} 
/** 
 * Load project from JSON file 
 */ 
function loadProject() { 
 const fileInput = document.getElementById('fileInput'); 
 fileInput.onchange = function(event) { 
 const file = event.target.files[0]; 
 if (! file) return; 
 console.log('📂 Loading project:', file.name); 
 const reader = new FileReader(); 
 reader.onload = function(e) { 
 try { 
 const projectData = ProjectSerializer.deserialize(e.target.result);
 console.log('📦 Project data loaded'); 
 console.log(' Version:', projectData.projectInfo?.version || 'Unknown'); 
 console.log(' Buses:', projectData.buses?.length || 0); 
 console.log(' Components:', projectData.components?.length || 0); 
 // ✅ ISSUE #8: Enhanced input sanitization and validation 
 const validationResult = validateProjectData(projectData); 
 if (!validationResult.valid) { 
 throw new Error(`Invalid project file: ${validationResult.errors.join(', ')}`); 
 } 
 // ✅ ISSUE #10: Log component ID types for debugging 
 console.log('📊 Component ID types:', projectData.components.slice(0, 5).map(c => ({ 
 id: c.id, 
 type: c.type, 
 idType: typeof c.id 
 }))); 
 console.log('📊 Bus ID types:', projectData.buses.slice(0, 5).map(b => ({ 
 id: b.id, 
 name: b.name, 
 idType: typeof b.id 
 }))); 
 // Sanitize data before loading 
 const sanitizedData = sanitizeProjectData(projectData); 
 // Confirm before loading 
 if (buses.length > 0 || components.length > 0) { 
 if (! confirm('This will replace your current project.Continue?')) { 
 fileInput.value = ''; 
 return; 
 } 
 } 
 // Load project info (using sanitized data) 
 if (sanitizedData.projectInfo) { 
 document.getElementById('projectName').value = sanitizedData.projectInfo.name || ''; 
 document.getElementById('engineer').value = sanitizedData.projectInfo.engineer || ''; 
 document.getElementById('projectNumber').value = sanitizedData.projectInfo.projectNumber || ''; 
 } 
 // Load settings (using sanitized data) 
 if (sanitizedData.settings) { 
 document.getElementById('loadCurrent').value = sanitizedData.settings.loadCurrent || 100; 
 document.getElementById('powerFactor').value = sanitizedData.settings.powerFactor || 0.9; 
 document.getElementById('voltageDropLimit').value = sanitizedData.settings.voltageDropLimit || 3; 
 document.getElementById('temperature').value = sanitizedData.settings.temperature || 75; 
 if (sanitizedData.settings.method) { 
 const methodRadio = document.querySelector(`input[name="method"][value="${sanitizedData.settings.method}"]`); 
 if (methodRadio) methodRadio.checked = true; 
 } 
 } 
 // Load buses and components (using sanitized data) 
 buses = sanitizedData.buses; 
 components = sanitizedData.components; 
 protectionDevices = sanitizedData.protectionDevices || []; 
 protectionZones = sanitizedData.protectionZones || []; 
 protectionAssociations = sanitizedData.protectionAssociations || []; 
 console.log('✅ Data assigned to global variables'); 
 console.log(' buses.length:', buses.length); 
 console.log(' components.length:', components.length); 
 console.log(' protectionDevices.length:', protectionDevices.length); 
 console.log(' protectionZones.length:', protectionZones.length); 
 console.log(' protectionAssociations.length:', protectionAssociations.length); 
 // Update UI 
 updateBusTree(); 
 updateBusDropdowns(); 
 if (typeof displayComponents === 'function') displayComponents(); 
 updateBusesContent(); 
 // Reset selected bus 
 selectedBusId = null; 
 console.log('✅ Project loaded successfully'); 
 // Show any warnings from sanitization 
 if (validationResult.warnings && validationResult.warnings.length > 0) { 
 console.warn('⚠️ Project loaded with warnings:'); 
 validationResult.warnings.forEach(w => console.warn(' -', w)); 
 } 
 alert(`✅ Project loaded successfully!\n\nName: ${sanitizedData.projectInfo?.name || 'Untitled'}\nBuses: ${buses.length}\nComponents: ${components.length}`); 
 } catch (error) { 
 console.error('❌ Load failed:', error); 
 console.error('Stack trace:', error.stack); 
 alert(`❌ Failed to load project:\n\n${error.message}\n\nMake sure the file is a valid project file.`); 
 } 
 // Reset file input 
 fileInput.value = ''; 
 }; 
 reader.readAsText(file); 
 }; 
 // Trigger file selection 
 fileInput.click(); 
} 
/** 
 * Auto-save functionality 
 */ 
let autoSaveTimeout = null; 
function scheduleAutoSave() { 
 const autoSaveEnabled = document.getElementById('autoSave')?.checked; 
 if (!autoSaveEnabled) return; 
 // Clear existing timeout 
 if (autoSaveTimeout) { 
 clearTimeout(autoSaveTimeout); 
 } 
 // Show indicator 
 const indicator = document.getElementById('autoSaveIndicator'); 
 if (indicator) { 
 indicator.textContent = '💾 Saving...'; 
 indicator.style.opacity = '1'; 
 } 
 // Schedule auto-save after 2 seconds of inactivity 
 autoSaveTimeout = setTimeout(() => { 
 autoSaveToLocalStorage(); 
 if (indicator) { 
 indicator.textContent = '✓ Auto-saved'; 
 setTimeout(() => { 
 indicator.style.opacity = '0'; 
 }, 2000); 
 } 
 }, 2000); 
} 
/** 
 * Auto-save to localStorage 
 * Fixed: 2025-10-29 16:52:38 UTC by bfforex 
 * Uses cleanBusesForSerialization to prevent circular references 
 */ 
function autoSaveToLocalStorage() { 
 try { 
 const projectName = document.getElementById('projectName').value || 'Untitled Project'; 
 console.log('💾 Auto-saving to localStorage...'); 
 // ═══════════════════════════════════════════════════════════ 
 // 🔥 ENHANCED: Strip calculation results to save space 
 // Auto-save only essential data - results can be recalculated 
 // Added: 2026-02-03 to fix quota exceeded error (Issue: bus count 94+) 
 // ═══════════════════════════════════════════════════════════ 
 const projectData = ProjectSerializer.buildProjectData({
   includeResults: false,
   autoSave: true
 });
 
 const busesClean = projectData.buses;
 const json = JSON.stringify(projectData);
 const sizeKB = (json.length / 1024).toFixed(2); 
 // Check if data size is approaching localStorage limit (typically 5-10MB) 
 // Warn if > 4MB, which should never happen with stripped results 
 if (json.length > 4 * 1024 * 1024) { 
 console.warn(` ⚠️ Auto-save data is large: ${sizeKB} KB`); 
 console.warn(' Consider reducing project complexity or using manual save'); 
 } 
 localStorage.setItem('pwrsyspro_autosave', json); 
 console.log(' ✅ Auto-saved successfully'); 
 console.log(` Buses: ${busesClean.length}`); 
 console.log(` Components: ${components.length}`); 
 console.log(` Size: ${sizeKB} KB`); 
 } catch (error) { 
 // Handle quota exceeded error gracefully 
 if (error.name === 'QuotaExceededError' || error.message.includes('quota')) { 
 console.error(' ⚠️ Auto-save failed: Storage quota exceeded'); 
 console.error(' Tip: Use manual save (💾 Save Project button) to download project file'); 
 // Show user-friendly message 
 const indicator = document.getElementById('autoSaveIndicator'); 
 if (indicator) { 
 indicator.textContent = '⚠️ Auto-save disabled (project too large)'; 
 indicator.style.opacity = '1'; 
 indicator.style.backgroundColor = '#ff9800'; 
 setTimeout(() => { 
 indicator.style.opacity = '0'; 
 }, 5000); 
 } 
 } else { 
 console.error(' ⚠️ Auto-save failed:', error.message); 
 } 
 // Don't throw - auto-save failure shouldn't break the app 
 } 
} 
/** 
 * Load auto-saved project from localStorage 
 */ 
function loadAutoSavedProject() { 
 try { 
 const json = localStorage.getItem('pwrsyspro_autosave'); 
 if (!json) return false; 
 const projectData = ProjectSerializer.deserialize(json);
 if (! projectData.projectInfo?.autoSave) return false; 
 const savedDate = new Date(projectData.projectInfo.savedDate); 
 const now = new Date(); 
 const hoursDiff = (now - savedDate) / (1000 * 60 * 60); 
 // Only restore if saved within last 24 hours 
 if (hoursDiff > 24) { 
 localStorage.removeItem('pwrsyspro_autosave'); 
 return false; 
 } 
 console.log('📂 Auto-saved project found'); 
 console.log(' Saved:', savedDate.toLocaleString()); 
 console.log(' Hours ago:', hoursDiff.toFixed(1)); 
 const restore = confirm(`Auto-saved project found!\n\nProject: ${projectData.projectInfo.name}\nSaved: ${savedDate.toLocaleString()}\n\nRestore this project?`); 
 if (restore) { 
 // Load project info 
 if (projectData.projectInfo) { 
 document.getElementById('projectName').value = projectData.projectInfo.name || ''; 
 document.getElementById('engineer').value = projectData.projectInfo.engineer || ''; 
 document.getElementById('projectNumber').value = projectData.projectInfo.projectNumber || ''; 
 } 
 // Load settings 
 if (projectData.settings) { 
 document.getElementById('loadCurrent').value = projectData.settings.loadCurrent || 100; 
 document.getElementById('powerFactor').value = projectData.settings.powerFactor || 0.9; 
 document.getElementById('voltageDropLimit').value = projectData.settings.voltageDropLimit || 3; 
 document.getElementById('temperature').value = projectData.settings.temperature || 75; 
 if (projectData.settings.method) { 
 const methodRadio = document.querySelector(`input[name="method"][value="${projectData.settings.method}"]`); 
 if (methodRadio) methodRadio.checked = true; 
 } 
 } 
 // Load buses and components 
 buses = projectData.buses; 
 components = projectData.components; 
 protectionDevices = projectData.protectionDevices || []; 
 protectionZones = projectData.protectionZones || []; 
 protectionAssociations = projectData.protectionAssociations || []; 
 // Update UI 
 updateBusTree(); 
 updateBusDropdowns(); 
 if (typeof displayComponents === 'function') displayComponents(); 
 updateBusesContent(); 
 console.log('✅ Auto-saved project restored'); 
 try { 
 // Signal to the app that project restoration completed so other modules (diagnostic, UI) can react. 
 window.dispatchEvent(new Event('project:restored')); 
 } catch (e) { 
 console.warn('Could not dispatch project:restored event', e); 
 } 
 return true; 
 } 
 return false; 
 } catch (error) { 
 console.error('❌ Failed to load auto-saved project:', error); 
 return false; 
 } 
} 
// Export functions 
window.saveProject = saveProject; 
window.loadProject = loadProject; 
window.scheduleAutoSave = scheduleAutoSave; 
window.autoSaveToLocalStorage = autoSaveToLocalStorage; 
window.loadAutoSavedProject = loadAutoSavedProject; 
window.cleanBusesForSerialization = cleanBusesForSerialization; 
console.log('✅ Project Manager v1.3.2 loaded'); 
console.log(' - Circular reference fix: COMPLETE'); 
console.log(' - Auto-save: OPTIMIZED (results stripped to avoid quota errors)'); 
console.log(' - systemFault circular ref: FIXED'); 
console.log(' - ID type flexibility: ENABLED (numeric & string)'); 
console.log(' - Backward compatibility: MAINTAINED');
