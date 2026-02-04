# Logger Framework Usage Guide

## Overview
The logging framework (`js/logger.js`) provides centralized, configurable logging to replace raw console statements throughout the application.

## Basic Usage

### Simple Logging
```javascript
// Info level (default for important status messages)
logger.info('Application initialized');

// Debug level (detailed/verbose messages)
logger.debug('Processing step 1 of 5');

// Warning level
logger.warn('Configuration value missing, using default');

// Error level
logger.error('Failed to load data:', error);
```

### Module-Specific Logging
```javascript
// Create a module-specific logger
const moduleLogger = logger.module('MyModule');

moduleLogger.info('Module initialized');
moduleLogger.debug('Processing data...');
moduleLogger.warn('Potential issue detected');
moduleLogger.error('Critical error occurred');
```

## Configuration

### Log Levels
The framework supports five log levels:
- **DEBUG** (0): Verbose debugging information
- **INFO** (1): General informational messages
- **WARN** (2): Warning messages
- **ERROR** (3): Error messages
- **NONE** (4): Disable all logging

### Runtime Configuration

#### Change Log Level
```javascript
// Via console (developer tools)
logger.setLevel('DEBUG');  // Enable all logs
logger.setLevel('INFO');   // Default level
logger.setLevel('WARN');   // Only warnings and errors
logger.setLevel('ERROR');  // Only errors
logger.setLevel('NONE');   // Disable all logging

// Or by level number
logger.setLevel(0);  // DEBUG
logger.setLevel(1);  // INFO
```

#### Check Current Level
```javascript
logger.getLevel();       // Returns: 0, 1, 2, 3, or 4
logger.getLevelName();   // Returns: 'DEBUG', 'INFO', 'WARN', 'ERROR', or 'NONE'
```

#### Enable/Disable Logging
```javascript
logger.setEnabled(true);   // Enable logging
logger.setEnabled(false);  // Disable all logging
logger.isEnabled();        // Check if logging is enabled
```

### Module Filtering

#### Enable/Disable Specific Modules
```javascript
// Disable logging for specific module
logger.disableModule('MyModule');

// Re-enable logging for specific module
logger.enableModule('MyModule');

// Clear all module filters
logger.clearModuleFilters();
```

### Reset to Defaults
```javascript
// Reset all configuration to defaults
logger.reset();
```

## Production vs Development

The logger automatically detects the environment:
- **Development** (localhost): Defaults to DEBUG level
- **Production** (https/remote): Defaults to INFO level

You can override this via localStorage or runtime configuration.

## Persistent Settings

All configuration is automatically saved to localStorage:
- `logLevel`: Current log level
- `loggingEnabled`: Whether logging is enabled
- `logModuleFilters`: Module-specific filters

Settings persist across page reloads.

## Output Format

All log messages are formatted with:
- Timestamp (HH:MM:SS format)
- Emoji indicator (🔍 DEBUG, ℹ️ INFO, ⚠️ WARN, ❌ ERROR)
- Log level name
- Optional module name
- Message

Example:
```
[07:33:45] ℹ️ INFO [MyModule] Application initialized
[07:33:46] 🔍 DEBUG Processing data batch 1
[07:33:47] ⚠️ WARN Configuration missing, using defaults
```

## Migration from console.log

Replace console statements as follows:
```javascript
// Old
console.log('Message');
console.info('Info message');
console.warn('Warning');
console.error('Error:', error);

// New
logger.info('Message');
logger.info('Info message');
logger.warn('Warning');
logger.error('Error:', error);
```

For verbose/debug messages:
```javascript
// Old
console.log('Detailed step-by-step info');

// New
logger.debug('Detailed step-by-step info');
```

## Best Practices

1. **Use appropriate log levels:**
   - `debug()`: Detailed diagnostic information
   - `info()`: Important application events
   - `warn()`: Potentially harmful situations
   - `error()`: Error events

2. **Module-specific loggers for large modules:**
   ```javascript
   const log = logger.module('MyLargeModule');
   log.info('Starting process');
   ```

3. **Remove emoji prefixes** - the logger adds them automatically:
   ```javascript
   // Don't do this
   logger.info('✅ Success');
   
   // Do this
   logger.info('Success');
   ```

4. **In production, set level to INFO or WARN** to reduce console noise:
   ```javascript
   // For production deployment
   logger.setLevel('INFO');
   ```

## Troubleshooting

### No logs appearing
```javascript
// Check if logging is enabled
logger.isEnabled();  // Should return true

// Check current level
logger.getLevelName();  // Make sure it's not 'NONE'

// Reset to defaults
logger.reset();
```

### Too many logs
```javascript
// Increase log level to reduce output
logger.setLevel('WARN');  // Only warnings and errors
```

### Module-specific issues
```javascript
// Check module filters
logger.clearModuleFilters();  // Clear all filters
```

## Examples

### Complete Example
```javascript
// Initialize module logger
const log = logger.module('DataProcessor');

function processData(data) {
    log.debug('Starting data processing');
    
    if (!data) {
        log.warn('No data provided, using empty dataset');
        data = [];
    }
    
    try {
        log.info(`Processing ${data.length} items`);
        // ... processing logic
        log.info('Data processing complete');
    } catch (error) {
        log.error('Failed to process data:', error);
        throw error;
    }
}
```

## Performance Considerations

- The logger checks the log level before formatting messages
- Disabled modules are filtered out early
- In production (INFO level), DEBUG messages have minimal overhead
- Can be completely disabled with `logger.setLevel('NONE')` for maximum performance
