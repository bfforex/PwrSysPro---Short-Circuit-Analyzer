(function initAppStore(global) {
    'use strict';

    if (global.AppStore) {
        console.warn('⚠️ AppStore already initialized');
        return;
    }

    const _state = {
        buses: [],
        components: [],
        calculationResults: null,
        editingComponentIndex: null,
        editingBusId: null,
        autoSaveTimer: null,
        selectedBusId: null,
        protectionDevices: [],
        protectionZones: [],
        protectionAssociations: [],
        currentScenarioId: 'base',
        currentMode: 'design'
    };

    const _subscribers = new Map();

    function notify(key, value) {
        const listeners = _subscribers.get(key);
        if (!listeners) return;
        listeners.forEach(function(callback) {
            try {
                callback(value, key, getState());
            } catch (error) {
                console.error(`❌ AppStore subscriber error for key "${key}":`, error);
            }
        });
    }

    function get(key) {
        return _state[key];
    }

    function set(key, value) {
        _state[key] = value;
        notify(key, value);
        return value;
    }

    function update(key, updaterFn) {
        if (typeof updaterFn !== 'function') {
            throw new Error(`AppStore.update("${key}") requires a function`);
        }
        const nextValue = updaterFn(_state[key]);
        _state[key] = nextValue;
        notify(key, nextValue);
        return nextValue;
    }

    function getState() {
        return Object.assign({}, _state);
    }

    function subscribe(key, callback) {
        if (typeof callback !== 'function') {
            throw new Error(`AppStore.subscribe("${key}") requires a callback function`);
        }

        if (!_subscribers.has(key)) {
            _subscribers.set(key, new Set());
        }

        const listeners = _subscribers.get(key);
        listeners.add(callback);

        return function unsubscribe() {
            listeners.delete(callback);
            if (listeners.size === 0) {
                _subscribers.delete(key);
            }
        };
    }

    const AppStore = {
        get: get,
        set: set,
        update: update,
        getState: getState,
        subscribe: subscribe
    };

    global.AppStore = AppStore;

    const shimKeys = [
        'buses',
        'components',
        'calculationResults',
        'editingComponentIndex',
        'editingBusId',
        'autoSaveTimer',
        'selectedBusId',
        'protectionDevices',
        'protectionZones',
        'protectionAssociations',
        'currentScenarioId',
        'currentMode'
    ];

    shimKeys.forEach(function(key) {
        const existingDescriptor = Object.getOwnPropertyDescriptor(global, key);

        if (existingDescriptor && existingDescriptor.configurable === false) {
            console.warn(`⚠️ AppStore shim skipped for non-configurable global: ${key}`);
            return;
        }

        Object.defineProperty(global, key, {
            configurable: true,
            enumerable: true,
            get: function() {
                return AppStore.get(key);
            },
            set: function(value) {
                AppStore.set(key, value);
            }
        });
    });

    global.__APP_STORE_DEBUG__ = {
        dump: function() {
            return AppStore.getState();
        }
    };

    console.log('✅ AppStore initialized');
    console.log('   - Controlled state store: Available');
    console.log('   - Backward-compatible window shims: Available');
})();