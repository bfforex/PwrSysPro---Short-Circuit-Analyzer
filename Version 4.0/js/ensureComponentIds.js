/**
 * Ensures every component in the array has a valid id (string).
 * Uses generateUniqueId('comp') to assign where missing or invalid.
 * Call this before saving/exporting project data!
 */
function ensureComponentIds(components) {
    if (!Array.isArray(components)) return;

    components.forEach((comp, idx) => {
        if (
            !comp.id ||
            typeof comp.id !== 'string' ||
            !comp.id.trim()
        ) {
            // If you have generateUniqueId in scope, use it:
            // comp.id = generateUniqueId('comp');
            // Fallback: use a timestamp and index if unavailable
            if (typeof generateUniqueId === "function") {
                comp.id = generateUniqueId('comp');
            } else {
                comp.id = 'comp-' + Date.now() + '-' + idx;
            }
        }
    });
}