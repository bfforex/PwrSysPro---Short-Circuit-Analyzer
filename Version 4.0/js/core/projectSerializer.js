(function initProjectSerializer(global) {
    'use strict';

    if (global.ProjectSerializer) {
        console.warn('⚠️ ProjectSerializer already initialized');
        return;
    }

    const SERIALIZER_SCHEMA_VERSION = '4.1';

    function safeClone(value) {
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(value);
            } catch (error) {
                console.warn('⚠️ structuredClone failed in ProjectSerializer, falling back to JSON clone');
            }
        }

        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(value, function (_key, val) {
            if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return undefined;
                seen.add(val);
            }
            return val;
        }));
    }

    function cleanPathArray(pathArray) {
        if (!Array.isArray(pathArray)) return [];

        return pathArray
            .filter(function (segment) {
                return segment && segment.bus;
            })
            .map(function (segment) {
                const cleanBus = {
                    id: segment.bus.id,
                    name: segment.bus.name || 'Unknown',
                    voltage: segment.bus.voltage || 0,
                    type: segment.bus.type || 'unknown',
                    tag: segment.bus.tag || ''
                };

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

    function cleanResultObject(resultObj) {
        if (!resultObj || typeof resultObj !== 'object') return null;

        const cleaned = safeClone(resultObj);

        if (cleaned.path) {
            cleaned.path = cleanPathArray(cleaned.path);
        }

        if (cleaned.pathTrace) {
            cleaned.pathTrace = cleanPathArray(cleaned.pathTrace);
        }

        if (cleaned.criticalComponents && Array.isArray(cleaned.criticalComponents)) {
            cleaned.criticalComponents = cleaned.criticalComponents.map(function (item) {
                return {
                    step: item.step,
                    componentId: item.component?.id || item.componentId || null,
                    componentType: item.component?.type || item.componentType || null,
                    componentName: item.component?.name || item.componentName || null,
                    voltageDrop: item.voltageDrop
                };
            });
        }

        if (cleaned.motorContribution && cleaned.motorContribution.motors) {
            cleaned.motorContribution = {
                ...cleaned.motorContribution,
                motors: Array.isArray(cleaned.motorContribution.motors)
                    ? cleaned.motorContribution.motors.map(function (m) {
                        return {
                            id: m.id,
                            name: m.name,
                            hp: m.hp,
                            motorType: m.motorType
                        };
                    })
                    : []
            };
        }

        return cleaned;
    }

    function cleanResultsObject(results) {
        if (!results || typeof results !== 'object') return null;

        const cleaned = {};

        if (results.shortCircuit) {
            cleaned.shortCircuit = cleanResultObject(results.shortCircuit);
        }

        if (results.loadFlow) {
            cleaned.loadFlow = cleanResultObject(results.loadFlow);
        }

        if (results.voltageDrop) {
            cleaned.voltageDrop = cleanResultObject(results.voltageDrop);
        }

        if (results.arcFlash) {
            cleaned.arcFlash = cleanResultObject(results.arcFlash);
        }

        if (results.path) {
            cleaned.path = cleanPathArray(results.path);
        }

        Object.keys(results).forEach(function (key) {
            if (!cleaned[key] && typeof results[key] !== 'object') {
                cleaned[key] = results[key];
            }
        });

        return cleaned;
    }

    function serializeBus(bus, options) {
        if (!bus || typeof bus !== 'object') return null;

        const includeResults = !!options?.includeResults;

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
            loadCurrentAutoCalculated: bus.loadCurrentAutoCalculated || false
        };

        if (includeResults && bus.results) {
            busClone.results = cleanResultsObject(bus.results);
        }

        if (includeResults) {
            if (bus.faultCurrent !== undefined) busClone.faultCurrent = bus.faultCurrent;
            if (bus.asymFaultCurrent !== undefined) busClone.asymFaultCurrent = bus.asymFaultCurrent;
            if (bus.totalZ !== undefined) busClone.totalZ = bus.totalZ;
        }

        return busClone;
    }

    function serializeComponent(component) {
        if (!component || typeof component !== 'object') return null;

        const clone = safeClone(component);

        delete clone._uiState;
        delete clone._transient;
        delete clone._selected;
        delete clone._highlighted;
        delete clone.systemFault;
        delete clone.pathComponents;

        return clone;
    }

    function buildProjectData(options) {
        const includeResults = !!options?.includeResults;
        const autoSave = !!options?.autoSave;

        const projectName = document.getElementById('projectName')?.value || 'Untitled Project';
        const engineer = document.getElementById('engineer')?.value || 'Unknown';
        const projectNumber = document.getElementById('projectNumber')?.value || '';

        return {
            schema: SERIALIZER_SCHEMA_VERSION,
            projectInfo: {
                name: projectName,
                engineer: engineer,
                projectNumber: projectNumber,
                savedDate: new Date().toISOString(),
                version: global.PROJECT_MANAGER_VERSION || '1.3.2',
                autoSave: autoSave
            },
            buses: Array.isArray(global.buses)
                ? global.buses.map(function (bus) {
                    return serializeBus(bus, { includeResults: includeResults });
                }).filter(Boolean)
                : [],
            components: Array.isArray(global.components)
                ? global.components.map(serializeComponent).filter(Boolean)
                : [],
            protectionDevices: Array.isArray(global.protectionDevices) ? safeClone(global.protectionDevices) : [],
            protectionZones: Array.isArray(global.protectionZones) ? safeClone(global.protectionZones) : [],
            protectionAssociations: Array.isArray(global.protectionAssociations) ? safeClone(global.protectionAssociations) : [],
            settings: {
                loadCurrent: parseFloat(document.getElementById('loadCurrent')?.value) || 100,
                powerFactor: parseFloat(document.getElementById('powerFactor')?.value) || 0.9,
                voltageDropLimit: parseFloat(document.getElementById('voltageDropLimit')?.value) || 3,
                temperature: parseFloat(document.getElementById('temperature')?.value) || 75,
                method: document.querySelector('input[name="method"]:checked')?.value || 'point-to-point'
            }
        };
    }

    function serialize(options) {
        return JSON.stringify(buildProjectData(options), null, options?.pretty === false ? 0 : 2);
    }

    function migrate(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid project data for migration');
        }

        const migrated = safeClone(data);

        if (!migrated.schema) {
            migrated.schema = '4.0';
        }

        if (migrated.schema === '4.0') {
            migrated.schema = SERIALIZER_SCHEMA_VERSION;
        }

        if (!migrated.projectInfo) {
            migrated.projectInfo = {
                name: 'Untitled Project',
                engineer: 'Unknown',
                projectNumber: '',
                savedDate: new Date().toISOString(),
                version: global.PROJECT_MANAGER_VERSION || '1.3.2'
            };
        }

        if (!Array.isArray(migrated.buses)) migrated.buses = [];
        if (!Array.isArray(migrated.components)) migrated.components = [];
        if (!Array.isArray(migrated.protectionDevices)) migrated.protectionDevices = [];
        if (!Array.isArray(migrated.protectionZones)) migrated.protectionZones = [];
        if (!Array.isArray(migrated.protectionAssociations)) migrated.protectionAssociations = [];

        if (!migrated.settings || typeof migrated.settings !== 'object') {
            migrated.settings = {};
        }

        return migrated;
    }

    function deserialize(json) {
        const parsed = typeof json === 'string' ? JSON.parse(json) : safeClone(json);
        return migrate(parsed);
    }

    global.ProjectSerializer = {
        schemaVersion: SERIALIZER_SCHEMA_VERSION,
        safeClone: safeClone,
        cleanPathArray: cleanPathArray,
        cleanResultObject: cleanResultObject,
        cleanResultsObject: cleanResultsObject,
        serializeBus: serializeBus,
        serializeComponent: serializeComponent,
        buildProjectData: buildProjectData,
        serialize: serialize,
        deserialize: deserialize,
        migrate: migrate
    };

    console.log('✅ ProjectSerializer initialized');
    console.log('   - Schema version:', SERIALIZER_SCHEMA_VERSION);
    console.log('   - Safe serialization: Available');
    console.log('   - Migration support: Available');
})(window);
