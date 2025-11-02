# Contributing to PwrSys Pro - Short Circuit Analyzer

First off, thank you for considering contributing to PwrSys Pro! It's people like you that make this tool better for the electrical engineering community.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Code Contributions](#code-contributions)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## 🤝 How Can I Contribute?

There are many ways to contribute to PwrSys Pro:

### 1. 🐛 Report Bugs
Found a bug? Let us know! See [Reporting Bugs](#reporting-bugs).

### 2. 💡 Suggest Features
Have an idea? We'd love to hear it! See [Suggesting Features](#suggesting-features).

### 3. 💻 Write Code
Want to contribute code? See [Code Contributions](#code-contributions).

### 4. 📖 Improve Documentation
Help make our docs better! See [Documentation](#documentation).

### 5. 🧪 Test New Features
Try out beta features and provide feedback.

### 6. 🌍 Translate
Help translate the application (future feature).

### 7. ⭐ Spread the Word
Star the repo, share with colleagues, write blog posts!

---

## 🐛 Reporting Bugs

### Before Submitting a Bug Report

1. **Check the documentation** - Maybe it's not a bug but expected behavior
2. **Search existing issues** - Someone might have already reported it
3. **Try latest version** - Bug might already be fixed
4. **Reproduce the bug** - Make sure it's consistent

### How to Submit a Good Bug Report

Use the bug report template and include:

#### Required Information
- **Title:** Clear, descriptive title
- **Description:** What happened vs what you expected
- **Steps to Reproduce:**
  1. Go to '...'
  2. Click on '....'
  3. Scroll down to '....'
  4. See error

#### System Information
- **Browser:** Chrome 120.0.6099.109
- **OS:** Windows 11 / macOS 14 / Ubuntu 22.04
- **Version:** PwrSys Pro v3.0.0
- **Screen Resolution:** 1920x1080

#### Additional Context
- **Console Errors:** Copy any error messages from browser console (F12)
- **Screenshots:** If applicable
- **Project File:** Attach .json project file if possible (remove sensitive data)
- **Expected Behavior:** What should have happened
- **Actual Behavior:** What actually happened

### Bug Report Template

```markdown
**Bug Title:** [Clear, descriptive title]

**Description:**
A clear and concise description of what the bug is.

**To Reproduce:**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior:**
A clear and concise description of what you expected to happen.

**Screenshots:**
If applicable, add screenshots to help explain your problem.

**System Information:**
 - Browser: [e.g. Chrome 120]
 - OS: [e.g. Windows 11]
 - Version: [e.g. v3.0.0]

**Console Errors:**
```
Paste any console errors here
```

**Additional context:**
Add any other context about the problem here.
```

---

## 💡 Suggesting Features

### Before Suggesting a Feature

1. **Check the roadmap** - Feature might already be planned
2. **Search existing requests** - Similar feature might be requested
3. **Consider the scope** - Does it fit the project's goals?

### How to Suggest a Feature

Use the feature request template:

```markdown
**Feature Title:** [Clear, descriptive title]

**Problem Statement:**
What problem does this feature solve?

**Proposed Solution:**
Describe your proposed solution.

**Use Case:**
Describe a real-world scenario where this would be useful.

**Benefits:**
- Who benefits from this feature?
- What value does it add?
- How does it improve the user experience?

**Alternatives Considered:**
Have you considered any alternative solutions?

**Implementation Ideas (Optional):**
If you have technical ideas about implementation.

**Priority (Your Opinion):**
- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low

**Willingness to Contribute:**
- [ ] I can help implement this
- [ ] I can help test this
- [ ] I can help document this
- [ ] I just want to suggest it
```

---

## 💻 Code Contributions

### Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PwrSysPro---Short-Circuit-Analyzer.git
   cd PwrSysPro---Short-Circuit-Analyzer
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add comments where needed
   - Update documentation

5. **Test your changes**
   - Test manually in multiple browsers
   - Verify no existing features broke
   - Test edge cases

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add detailed description of changes"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request**
   - Go to original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

---

## 🔄 Development Workflow

### Branch Naming Convention

```
feature/feature-name     # New features
fix/bug-description      # Bug fixes
docs/documentation-type  # Documentation updates
refactor/component-name  # Code refactoring
test/test-description    # Adding tests
chore/task-description   # Maintenance tasks
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat(calculations): Add motor contribution to fault current

Implements IEEE 141-1993 Section 5.3 motor contribution
calculation. Motors contribute approximately 6x their FLC
to fault currents with exponential decay.

Closes #123
```

```
fix(voltage-drop): Correct cumulative voltage drop calculation

Fixed issue where voltage drops were not accumulating correctly
through transformer boundaries. Now properly reflects impedance
to secondary voltage level.

Fixes #456
```

---

## 📏 Coding Standards

### JavaScript Style Guide

#### General Rules

```javascript
// ✅ DO: Use const for values that don't change
const PI = 3.14159;
const buses = getAllBuses();

// ✅ DO: Use let for values that change
let faultCurrent = 0;
for (let i = 0; i < buses.length; i++) {
    faultCurrent += buses[i].load;
}

// ❌ DON'T: Use var
var oldStyle = "Don't use this";

// ✅ DO: Use meaningful variable names
const totalFaultCurrent = calculateFaultCurrent(bus);
const voltageDropPercent = calculateVoltageDrop(cable);

// ❌ DON'T: Use single letter or unclear names (except loop counters)
const x = calculate(y);
const temp = doSomething(data);

// ✅ DO: Use camelCase for variables and functions
const motorFullLoadCurrent = 100;
function calculateShortCircuit() { }

// ✅ DO: Use PascalCase for classes
class ReportAnalytics { }
class BusManager { }

// ✅ DO: Use UPPER_CASE for constants
const MAX_VOLTAGE_DROP = 7.0;
const IEEE_141_LIMIT = 0.07;
```

#### Function Documentation

```javascript
/**
 * Calculate three-phase fault current at a bus
 * 
 * Implements IEEE 141-1993 Section 5.2 point-to-point method
 * for calculating symmetrical RMS fault current.
 * 
 * @param {Object} bus - Bus object containing voltage and impedance
 * @param {number} bus.voltage - Bus voltage in volts
 * @param {number} bus.impedance - Total impedance to bus in ohms
 * @param {string} [method='point-to-point'] - Calculation method
 * @returns {number} Fault current in kA
 * @throws {Error} If bus voltage is zero or negative
 * 
 * @example
 * const bus = { voltage: 480, impedance: 0.01 };
 * const iFault = calculateFaultCurrent(bus);
 * console.log(iFault); // 27.71 kA
 */
function calculateFaultCurrent(bus, method = 'point-to-point') {
    if (!bus || bus.voltage <= 0) {
        throw new Error('Invalid bus voltage');
    }
    
    // I = V / (√3 × Z)
    const current = bus.voltage / (Math.sqrt(3) * bus.impedance);
    return current / 1000; // Convert to kA
}
```

#### Error Handling

```javascript
// ✅ DO: Handle errors gracefully
try {
    const result = calculateFaultCurrent(bus);
    displayResult(result);
} catch (error) {
    console.error('Calculation error:', error);
    showUserMessage('Unable to calculate fault current. Please check input data.');
}

// ✅ DO: Validate input data
function calculateVoltageDrop(cable, current) {
    if (!cable) {
        throw new Error('Cable object is required');
    }
    if (current < 0) {
        throw new Error('Current cannot be negative');
    }
    if (cable.length <= 0) {
        throw new Error('Cable length must be positive');
    }
    
    // Proceed with calculation
}

// ✅ DO: Provide helpful error messages
if (buses.length === 0) {
    throw new Error('No buses found. Please add at least one source bus.');
}
```

#### Code Organization

```javascript
// ✅ DO: Group related functionality
class ShortCircuitCalculator {
    constructor() {
        this.method = 'point-to-point';
    }
    
    // Public methods
    calculate(bus) { }
    
    // Private methods (prefix with _)
    _calculateImpedance() { }
    _validateInputs() { }
}

// ✅ DO: Use early returns
function calculateFaultCurrent(bus) {
    if (!bus) return 0;
    if (!bus.voltage) return 0;
    if (!bus.impedance) return 0;
    
    // Main calculation logic
    return result;
}

// ✅ DO: Keep functions small and focused
// Each function should do ONE thing well
function getSourceBus() {
    return buses.find(b => b.type === 'source');
}

function calculateSourceImpedance(bus) {
    return bus.voltage / (Math.sqrt(3) * bus.faultCurrent);
}
```

### HTML/CSS Standards

```html
<!-- ✅ DO: Use semantic HTML -->
<section class="calculation-results">
    <header>
        <h2>Calculation Results</h2>
    </header>
    <article>
        <table class="results-table">
            <!-- content -->
        </table>
    </article>
</section>

<!-- ✅ DO: Use accessible forms -->
<label for="busVoltage">Bus Voltage (V):</label>
<input type="number" id="busVoltage" name="busVoltage" 
       min="0" step="1" required 
       aria-describedby="voltageHelp">
<small id="voltageHelp">Enter voltage in volts (e.g., 480, 13200)</small>
```

```css
/* ✅ DO: Use consistent naming */
.calculation-results { }
.calculation-results__header { }
.calculation-results__table { }
.calculation-results__row--highlighted { }

/* ✅ DO: Group related styles */
/* Colors */
:root {
    --color-primary: #007bff;
    --color-danger: #dc3545;
    --color-success: #28a745;
}

/* Layout */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
```

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting a pull request, test:

#### Core Functionality
- [ ] Add source bus with fault current
- [ ] Add distribution buses
- [ ] Add cables between buses
- [ ] Add transformers
- [ ] Add motors/loads
- [ ] Run calculations (point-to-point)
- [ ] Run calculations (per-unit)
- [ ] View results table
- [ ] View detailed calculations
- [ ] Export reports

#### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if available)

#### Edge Cases
- [ ] Empty system (no buses)
- [ ] Single bus system
- [ ] Very large system (50+ buses)
- [ ] Zero length cable
- [ ] Very high fault current
- [ ] Very low fault current

#### Error Handling
- [ ] Invalid input values
- [ ] Missing required fields
- [ ] Disconnected components
- [ ] Circular references

### Test Documentation

Document your tests:

```javascript
/**
 * Test: Motor FLC Calculation
 * 
 * Given: 250 HP motor at 440V, η=0.90, PF=0.85
 * Expected: I_FLC = 319.9 A
 * 
 * Formula: I = (HP × 746) / (√3 × V × η × PF)
 * Calculation: (250 × 746) / (√3 × 440 × 0.90 × 0.85)
 *            = 186,500 / 582.78
 *            = 319.9 A
 */
```

---

## 📖 Documentation

### Types of Documentation

1. **Code Comments** - Explain complex logic
2. **JSDoc Comments** - Document functions/classes
3. **README** - User-facing documentation
4. **CHANGELOG** - Version history
5. **Wiki** - Detailed guides (future)

### Documentation Standards

```javascript
// ✅ DO: Document WHY, not WHAT
// Calculate motor contribution using 6x FLC per IEEE 141
const motorContribution = motorFLC * 6;

// ❌ DON'T: State the obvious
// Multiply motorFLC by 6
const motorContribution = motorFLC * 6;

// ✅ DO: Explain complex algorithms
/**
 * Voltage drop calculation using component-by-component method
 * 
 * This implements IEEE 141-1993 Section 3.4 methodology:
 * 1. Calculate impedance of each component
 * 2. Reflect impedances to common voltage base
 * 3. Sum impedances along path
 * 4. Calculate voltage drop: VD = √3 × I × Z
 * 5. Track cumulative drop from source
 */
```

### Updating Documentation

When you change code, update:
- [ ] Function JSDoc comments
- [ ] README (if user-facing change)
- [ ] CHANGELOG (add entry)
- [ ] Code comments (if logic changed)

---

## 🏗️ Pull Request Process

### Before Submitting

1. ✅ Code follows style guidelines
2. ✅ All tests pass
3. ✅ Documentation updated
4. ✅ CHANGELOG updated
5. ✅ No console errors
6. ✅ Tested in multiple browsers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Fixes #123
Relates to #456

## How Has This Been Tested?
- [ ] Manual testing in Chrome
- [ ] Manual testing in Firefox
- [ ] Tested with sample project
- [ ] Verified no breaking changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested this in multiple browsers

## Additional Notes
Any additional information
```

### Review Process

1. **Automated Checks** (future)
   - Code style check
   - Basic validation

2. **Manual Review**
   - Code quality
   - Logic correctness
   - Documentation
   - Test coverage

3. **Feedback**
   - Address reviewer comments
   - Make requested changes
   - Re-test

4. **Approval & Merge**
   - Approved by maintainer
   - Merged to main branch
   - Included in next release

---

## 🌍 Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions (future)
- **Email** - bfforex@github.com

### Getting Help

1. **Check Documentation** - README, code comments
2. **Search Issues** - Someone might have asked before
3. **Ask a Question** - Create a GitHub issue with "Question" label

### Recognition

Contributors will be:
- Listed in CHANGELOG
- Mentioned in release notes
- Added to contributors list

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## ❓ Questions?

If you have questions about contributing, please:
1. Check this document thoroughly
2. Search existing issues
3. Create a new issue with "Question" label

---

**Thank you for contributing to PwrSys Pro!** 🎉

Your contributions help make electrical power system analysis more accessible and accurate for engineers worldwide.

---

**Maintained by:** bfforex  
**Last Updated:** 2025-11-02 10:44:11 UTC  
**Version:** 3.0.0