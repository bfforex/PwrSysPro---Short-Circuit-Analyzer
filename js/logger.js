/**
 * Logging Framework for PwrSys Pro
 * Centralized logging with levels, filtering, and production optimization
 * 
 * @author Copilot
 * @date 2026-02-04
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // Log Levels
    const LogLevel = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    };

    // Log Level Names
    const LogLevelNames = {
        0: 'DEBUG',
        1: 'INFO',
        2: 'WARN',
        3: 'ERROR'
    };

    // Log Level Colors (for console styling)
    const LogLevelColors = {
        0: '#6c757d', // DEBUG - gray
        1: '#0d6efd', // INFO - blue
        2: '#ffc107', // WARN - yellow
        3: '#dc3545'  // ERROR - red
    };

    // Log Level Emojis
    const LogLevelEmojis = {
        0: '🔍', // DEBUG
        1: 'ℹ️',  // INFO
        2: '⚠️',  // WARN
        3: '❌'  // ERROR
    };

    /**
     * Logger Class
     */
    class Logger {
        constructor() {
            // Default to INFO level in production, DEBUG in development
            this.currentLevel = this.isProduction() ? LogLevel.INFO : LogLevel.DEBUG;
            
            // Check if logging is enabled via localStorage
            const savedLevel = localStorage.getItem('logLevel');
            if (savedLevel !== null) {
                this.currentLevel = parseInt(savedLevel, 10);
            }

            // Enable/disable logging
            this.enabled = localStorage.getItem('loggingEnabled') !== 'false';
            
            // Module filtering (optional)
            this.moduleFilters = this.loadModuleFilters();
        }

        /**
         * Check if running in production
         */
        isProduction() {
            // Check common production indicators
            return window.location.protocol === 'https:' || 
                   window.location.hostname !== 'localhost' && 
                   window.location.hostname !== '127.0.0.1';
        }

        /**
         * Load module filters from localStorage
         */
        loadModuleFilters() {
            const filters = localStorage.getItem('logModuleFilters');
            if (filters) {
                try {
                    return JSON.parse(filters);
                } catch (e) {
                    return {};
                }
            }
            return {};
        }

        /**
         * Save module filters to localStorage
         */
        saveModuleFilters() {
            localStorage.setItem('logModuleFilters', JSON.stringify(this.moduleFilters));
        }

        /**
         * Check if a module should log
         */
        shouldLog(level, module) {
            if (!this.enabled) return false;
            if (level < this.currentLevel) return false;
            
            // Check module filters
            if (module && this.moduleFilters[module] === false) {
                return false;
            }
            
            return true;
        }

        /**
         * Format log message with timestamp and level
         */
        formatMessage(level, module, message) {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const levelName = LogLevelNames[level];
            const emoji = LogLevelEmojis[level];
            
            if (module) {
                return `[${timestamp}] ${emoji} ${levelName} [${module}] ${message}`;
            }
            return `[${timestamp}] ${emoji} ${levelName} ${message}`;
        }

        /**
         * Get console method for level
         */
        getConsoleMethod(level) {
            switch (level) {
                case LogLevel.DEBUG:
                    return console.log;
                case LogLevel.INFO:
                    return console.info;
                case LogLevel.WARN:
                    return console.warn;
                case LogLevel.ERROR:
                    return console.error;
                default:
                    return console.log;
            }
        }

        /**
         * Core logging method
         */
        log(level, module, message, ...args) {
            if (!this.shouldLog(level, module)) return;

            const consoleMethod = this.getConsoleMethod(level);
            const formattedMessage = this.formatMessage(level, module, message);
            
            // Log with styling in supported browsers
            if (args.length > 0) {
                consoleMethod(formattedMessage, ...args);
            } else {
                consoleMethod(formattedMessage);
            }
        }

        /**
         * DEBUG level logging
         */
        debug(message, ...args) {
            this.log(LogLevel.DEBUG, null, message, ...args);
        }

        /**
         * INFO level logging
         */
        info(message, ...args) {
            this.log(LogLevel.INFO, null, message, ...args);
        }

        /**
         * WARN level logging
         */
        warn(message, ...args) {
            this.log(LogLevel.WARN, null, message, ...args);
        }

        /**
         * ERROR level logging
         */
        error(message, ...args) {
            this.log(LogLevel.ERROR, null, message, ...args);
        }

        /**
         * Module-specific logging methods
         */
        module(moduleName) {
            return {
                debug: (message, ...args) => this.log(LogLevel.DEBUG, moduleName, message, ...args),
                info: (message, ...args) => this.log(LogLevel.INFO, moduleName, message, ...args),
                warn: (message, ...args) => this.log(LogLevel.WARN, moduleName, message, ...args),
                error: (message, ...args) => this.log(LogLevel.ERROR, moduleName, message, ...args)
            };
        }

        /**
         * Set log level
         */
        setLevel(level) {
            if (typeof level === 'string') {
                level = LogLevel[level.toUpperCase()];
            }
            if (level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
                this.currentLevel = level;
                localStorage.setItem('logLevel', level.toString());
            }
        }

        /**
         * Get current log level
         */
        getLevel() {
            return this.currentLevel;
        }

        /**
         * Get log level name
         */
        getLevelName() {
            return LogLevelNames[this.currentLevel] || 'NONE';
        }

        /**
         * Enable/disable logging
         */
        setEnabled(enabled) {
            this.enabled = enabled;
            localStorage.setItem('loggingEnabled', enabled.toString());
        }

        /**
         * Check if logging is enabled
         */
        isEnabled() {
            return this.enabled;
        }

        /**
         * Enable module logging
         */
        enableModule(moduleName) {
            this.moduleFilters[moduleName] = true;
            this.saveModuleFilters();
        }

        /**
         * Disable module logging
         */
        disableModule(moduleName) {
            this.moduleFilters[moduleName] = false;
            this.saveModuleFilters();
        }

        /**
         * Clear all module filters
         */
        clearModuleFilters() {
            this.moduleFilters = {};
            this.saveModuleFilters();
        }

        /**
         * Reset logger to defaults
         */
        reset() {
            this.currentLevel = this.isProduction() ? LogLevel.INFO : LogLevel.DEBUG;
            this.enabled = true;
            this.moduleFilters = {};
            localStorage.removeItem('logLevel');
            localStorage.removeItem('loggingEnabled');
            localStorage.removeItem('logModuleFilters');
        }
    }

    // Create global logger instance
    const logger = new Logger();

    // Export to window
    window.Logger = Logger;
    window.LogLevel = LogLevel;
    window.logger = logger;

    // Convenience: make log methods available globally for easy migration
    window.log = {
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        module: logger.module.bind(logger)
    };

    // Log initialization
    logger.info(`Logger initialized (Level: ${logger.getLevelName()}, Enabled: ${logger.isEnabled()})`);

})(window);
