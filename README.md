# ⚡ PwrSys Pro - Short Circuit Analyzer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer)
[![Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/graphs/commit-activity)

A **professional web-based electrical power system analysis tool** designed for electrical engineers. Performs comprehensive short circuit analysis, load flow calculations, voltage drop analysis, and generates IEEE-compliant recommendations for multi-bus power distribution systems.

**Author:** Engr. B. P. Faraon ([@bfforex](https://github.com/bfforex))  
**Standards Compliance:** IEEE 141-1993, IEC 60909, NEC/PEC  
**Latest Update:** October 28, 2025

---

## 🎯 Key Features

### 🔌 Multi-Bus Power System Modeling
- **Hierarchical Bus Management**: Create complex power distribution networks with parent-child relationships
- **Bus Types**:
  - Source Buses (Utility/Generator connections)
  - Distribution Buses
  - Branch/Panel Buses
- **Visual Bus Tree**: Interactive tree visualization of system hierarchy
- **Dynamic Load Calculation**: Automatic load computation from downstream equipment

### ⚡ Short Circuit Analysis
- **Dual Calculation Methods**:
  - **Point-to-Point Method**: Pure ohmic impedance calculation (no per-unit conversion)
  - **Per-Unit Method**: Standard base value system for multi-voltage analysis (10 MVA base)
- **Fault Current Types**:
  - Three-phase symmetrical fault current
  - Asymmetrical (peak) fault current with X/R multipliers
  - Line-to-ground fault current
  - Line-to-line fault current
- **Motor Contribution**: Automatic motor fault contribution per IEEE 141 standards
- **Detailed Calculation Steps**: Complete step-by-step breakdown of all calculations

### 📊 Load Flow Analysis
- **Comprehensive Load Tracking**:
  - Downstream load aggregation
  - Transformer loading analysis
  - Motor load calculations
  - Cable current distribution
- **Power Flow Breakdown**:
  - Real power (kW) and apparent power (kVA)
  - Power factor tracking
  - Loading percentages for equipment
- **Multi-Level Analysis**: Traverse entire system hierarchy automatically

### 📉 Voltage Drop Analysis
- **IEEE 141 Compliance**:
  - Feeder circuits: 3% maximum
  - Branch circuits: 5% maximum
  - Combined system: 7% maximum
- **Component-by-Component Tracking**:
  - Source impedance voltage drop
  - Transformer voltage drop with loading analysis
  - Cable voltage drop with temperature correction
- **Temperature Correction**: Conductor resistance adjustment (default 75°C)
- **Severity Classification**: Normal, Warning, Critical, Violation status

### 🔧 Component Support

#### Transformers
- Single-phase and three-phase transformers
- Parallel transformer configurations (automatic impedance combination)
- Voltage transformation with turns ratio calculations
- % impedance and X/R ratio specifications
- Loading analysis with recommendations

#### Cables
- **Comprehensive Cable Library**:
  - Sizes: #14 AWG through 1000 kcmil
  - Materials: Copper (Cu) and Aluminum (Al)
  - Standard impedance data per NEC tables
- **Parallel Cable Support**: Automatic impedance division
- **Temperature Correction**: NFPA/NEC standard correction factors

#### Motors
- **Motor Types**: Induction, Synchronous
- **Specifications**: HP rating, voltage, efficiency, power factor
- **Locked Rotor Analysis**: Automatic LRC calculations per NEC 430
- **Contribution Factors**:
  - Induction motors: 4-6× FLC initial contribution
  - Synchronous motors: Higher sustained contribution

#### Generators
- Subtransient reactance (X"d) specifications
- X/R ratio settings
- Voltage and kVA ratings
- Fault contribution calculations

### 💡 Intelligent Recommendation System

#### Rule-Based Analysis Engine
- **50+ Evaluation Rules** across multiple categories:
  - **Short Circuit**: Fault current levels, X/R ratios, equipment ratings
  - **Voltage Drop**: IEEE compliance, voltage regulation, conductor sizing
  - **Load Flow**: Loading factors, power quality, capacity planning
  - **Equipment**: Transformer sizing, cable capacity, motor contributions
  - **System Design**: Coordination, protection, reliability

#### Recommendation Severity Levels
- **CRITICAL**: Immediate safety hazards or code violations
- **HIGH**: Significant operational issues requiring prompt action
- **MEDIUM**: Performance improvements and preventive maintenance
- **LOW**: Optimization opportunities and best practices

#### Comprehensive Recommendations Include
- **Finding**: Detailed description of the issue
- **Required Action**: Specific corrective steps
- **Impact**: Safety, operational, and financial implications
- **Cost Estimate**: Implementation cost category (Low/Medium/High)
- **Effort Level**: Time and resources required
- **Standard Reference**: IEEE, NEC, or IEC citation
- **Context Data**: Relevant technical parameters

### 📥 Export & Reporting

#### Report Types
1. **Single Bus Reports**:
   - Short circuit analysis with all calculation steps
   - Load flow breakdown
   - Voltage drop analysis
   - Bus-specific recommendations
   
2. **System-Wide Reports**:
   - All buses summary with comparative analysis
   - System-wide recommendations
   - Priority action items
   - Compliance status

3. **Specialized Reports**:
   - Load Flow Analysis Report (separate module)
   - Voltage Drop Report (IEEE compliance focus)
   - Recommendations CSV (Excel-compatible)
   - Action Plan with checkboxes

#### Export Formats
- **Plain Text (.txt)**: Detailed technical reports
- **CSV (.csv)**: Data for Excel/spreadsheet analysis
- **JSON (.json)**: Project data backup and transfer
- **Action Plans**: Printable checklists with status tracking

### 🎨 User Interface Features

#### Design & Accessibility
- **Dark/Light Theme Toggle**: User preference with localStorage persistence
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Collapsible Sections**: Optimized workspace management
- **Modal Dialogs**: Accessible ARIA-compliant modals with keyboard navigation
- **Live Clock**: Real-time session timestamp
- **Auto-save Indicator**: Visual feedback for data persistence

#### Tab-Based Navigation
- 🔌 **Buses Tab**: View and manage all system buses
- 🔧 **Components Tab**: List and edit all components
- 📊 **Results Tab**: Calculation results summary
- 📝 **Calculations Tab**: Detailed step-by-step calculations
- 📥 **Export Tab**: Centralized report generation
- 💡 **Recommendations Tab**: System-wide recommendations (auto-generated)

#### Interactive Controls
- **Bus Tree Navigation**: Click to select and analyze buses
- **Quick Actions**: Calculate, edit, delete from bus cards
- **Component Management**: Drag-to-reorder, inline editing
- **Filter & Sort**: Recommendations by severity, category, or bus
- **Search Capability**: Find buses and components quickly

### 💾 Data Management

#### Auto-Save System
- **LocalStorage Integration**: Automatic project saving every 30 seconds
- **Auto-save Indicator**: Visual confirmation of save status
- **Session Recovery**: Restore work after browser close/refresh
- **Action Plan Tracking**: Persistent recommendation follow-up

#### Project Management
- **Save Project**: Export complete project as JSON
- **Load Project**: Import previously saved projects
- **Project Metadata**:
  - Project name and number
  - Engineer name
  - Session date/time
  - Calculation history

### 🔬 Technical Accuracy

#### Standards Compliance
- **IEEE 141-1993**: Industrial and Commercial Power Systems Analysis
- **IEC 60909**: Short-Circuit Currents in Three-Phase A.C. Systems
- **NEC Article 430**: Motors, Motor Circuits, and Controllers
- **NEC Chapter 9**: Tables for conductor properties
- **NFPA 70E**: Electrical Safety in the Workplace (arc flash future enhancement)

#### Calculation Methods
- **Impedance Tracking**: R, X, Z components throughout system
- **Voltage Transformation**: Accurate turns ratio calculations
- **Current Transformation**: Proper referencing across transformers
- **Parallel Impedances**: IEEE-compliant combination methods
- **Temperature Effects**: NEC standard correction factors
- **Power Factor**: Real and reactive power calculations

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge - latest versions)
- No installation or server setup required
- Runs entirely client-side (JavaScript)

### Installation

#### Option 1: Clone Repository
```bash
git clone https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer.git
cd PwrSysPro---Short-Circuit-Analyzer
```

#### Option 2: Download ZIP
1. Click the green "Code" button on GitHub
2. Select "Download ZIP"
3. Extract to your desired location

### Running the Application
1. Navigate to the project folder
2. Open `index.html` in your web browser
3. Start creating your power system!

**No web server required** - the application runs entirely in your browser.

---

## 📖 User Guide

### Quick Start: 5-Minute Example

#### Step 1: Add Source Bus
1. Click **"+ Add Bus"** in the Bus Manager
2. Enter details:
   - Name: "Utility"
   - Voltage: 13800 V
   - Type: Source (Utility/Generator)
   - Fault Current: 25 kA
   - X/R Ratio: 10
3. Click **"Add Bus"**

#### Step 2: Add Transformer
1. In **"Add Component"** section:
   - From: Utility
   - To: (Create new bus "Main Switchboard - 480V")
   - Type: Transformer
   - Rating: 1000 kVA
   - Primary: 13800 V / Secondary: 480 V
   - %Z: 5.75%, X/R: 5
2. Click **"+ Add"**

#### Step 3: Add Cable
1. From: Main Switchboard
2. To: (Create new bus "MCC-1")
3. Type: Cable
4. Size: 500 kcmil, Material: Copper
5. Length: 150 feet

#### Step 4: Add Motor
1. From: MCC-1
2. To: (Create new bus "Motor Load")
3. Type: Motor
4. HP: 100, Voltage: 480 V
5. Motor Type: Induction

#### Step 5: Run Calculations
1. Select calculation method (Point-to-Point or Per-Unit)
2. Click **"🔢 Calculate All"**
3. View results in tabs:
   - **Results**: Summary of all calculations
   - **Calculations**: Detailed steps
   - **Recommendations**: System analysis

#### Step 6: Export Reports
1. Go to **Export tab**
2. Choose report type:
   - Single bus detailed report
   - All buses summary
   - Action plan
3. Download as TXT or CSV

---

## 🏗️ Project Structure

```
PwrSysPro---Short-Circuit-Analyzer/
│
├── index.html                      # Main application HTML
├── README.md                       # This file
│
├── css/
│   └── styles.css                  # Application styles and themes
│
└── js/
    ├── constants.js                # Physical constants and cable data
    ├── state.js                    # Application state management
    ├── utils.js                    # Utility functions
    ├── modalManager.js             # Accessible modal handling
    │
    ├── busManager.js               # Bus CRUD operations
    ├── componentManager.js         # Component CRUD operations
    │
    ├── loadCalculations.js         # Downstream load calculations
    ├── motorContribution.js        # Motor fault contribution
    ├── shortCircuitCalc.js         # Short circuit analysis (v1.2.0)
    ├── loadFlowCalc.js             # Load flow analysis
    ├── voltageDropCalc.js          # Voltage drop analysis
    │
    ├── calculations.js             # Multi-analysis coordinator
    ├── calculationDisplay.js       # Results rendering
    │
    ├── thresholds.js               # Industry standard thresholds
    ├── recommendationRules.js      # 50+ evaluation rules
    ├── recommendationEngine.js     # Analysis engine
    ├── recommendationUI.js         # Recommendations display
    ├── reportAnalytics.js          # System analytics
    │
    ├── exportReport.js             # Report generation
    ├── exportLoadflowReport.js     # Load flow reports
    │
    ├── projectManager.js           # Save/load functionality
    ├── ui.js                       # UI interactions
    └── main.js                     # Application initialization
```

---

## 🔧 Technical Details

### Architecture

#### Modular Design
- **Foundation Layer**: Constants, state, utilities
- **Manager Layer**: Bus and component management
- **Calculation Layer**: Separate modules for each analysis type
- **Display Layer**: Results rendering and UI
- **Export Layer**: Report generation
- **Analytics Layer**: Recommendations and standards compliance

#### Technology Stack
- **Pure JavaScript**: No frameworks or dependencies (except jsPDF)
- **HTML5**: Semantic markup with ARIA labels
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **LocalStorage API**: Client-side data persistence
- **jsPDF Library**: PDF generation capability

#### Key Design Patterns
- **Module Pattern**: Encapsulated functionality
- **Observer Pattern**: State change notifications
- **Strategy Pattern**: Calculation method selection
- **Factory Pattern**: Component creation

### Calculation Engine

#### Short Circuit Module (`shortCircuitCalc.js` v1.2.0)
```javascript
Features:
- Point-to-Point method (pure ohmic)
- Per-Unit method (10 MVA base)
- Motor contribution integration
- Parallel impedance handling
- Asymmetrical fault multipliers
- Detailed step-by-step output
```

#### Load Flow Module (`loadFlowCalc.js`)
```javascript
Features:
- Recursive downstream traversal
- Transformer loading analysis
- Motor current calculations
- Power (kW/kVA) breakdown
- Equipment capacity utilization
```

#### Voltage Drop Module (`voltageDropCalc.js` v1.1.0)
```javascript
Features:
- IEEE 141 compliance checking
- Temperature correction (NEC)
- Transformer voltage drop
- Cable impedance calculation
- Cumulative drop tracking
- Severity classification
```

### Recommendation Engine

#### Rule Structure
```javascript
{
  id: "SC-FAULT-HIGH",
  category: "short_circuit",
  severity: "HIGH",
  priority: 2,
  condition: (bus, standards) => {
    // Evaluation logic
    return bus.results.faultCurrentKA > 65;
  },
  recommendation: "High fault current detected...",
  action: "Install current-limiting reactors...",
  impact: "Reduces equipment stress...",
  standard: "IEEE 141-1993 Section 7.2",
  cost: "Medium",
  effort: "Moderate"
}
```

#### Analysis Workflow
1. **Bus Calculation**: Perform all analyses (SC, LF, VD)
2. **Rule Evaluation**: Check all 50+ rules against results
3. **Prioritization**: Sort by severity and priority
4. **Context Enrichment**: Add technical parameters
5. **Display**: Present in organized UI with filters
6. **Export**: Generate actionable reports

---

## 📊 Example Calculations

### Short Circuit Analysis

#### Point-to-Point Method
```
Source Bus: 13800V, 25 kA available, X/R = 10
  Z_source = 13800 / (√3 × 25000) = 0.3178 Ω
  R = 0.0316 Ω, X = 0.3162 Ω

Transformer: 1000 kVA, 13800V/480V, 5.75% Z, X/R = 5
  Z_base = 480² / (1000×1000) = 0.2304 Ω
  Z_xfmr = 0.0575 × 0.2304 = 0.01325 Ω
  R = 0.00265 Ω, X = 0.01325 Ω

Cable: 500 kcmil Cu, 150 ft
  R = 0.0258 × 150 / 1000 = 0.00387 Ω
  X = 0.044 × 150 / 1000 = 0.0066 Ω

Total: R = 0.00652 Ω, X = 0.01985 Ω, Z = 0.02088 Ω
Fault Current: 480 / (√3 × 0.02088) = 13.28 kA
```

### Load Flow Analysis
```
Motor: 100 HP, 480V, η = 0.9, PF = 0.85
  FLC = (100 × 746) / (√3 × 480 × 0.9 × 0.85) = 117.8 A
  
Transformer Loading:
  Full Load Current = (1000 × 1000) / (√3 × 480) = 1202.9 A
  Loading = (117.8 / 1202.9) × 100 = 9.8%
```

### Voltage Drop Analysis
```
Cable: 500 kcmil Cu, 150 ft, 117.8 A, PF = 0.85
  R = 0.00387 Ω, X = 0.0066 Ω
  ΔV = √3 × I × (R×cosφ + X×sinφ)
  ΔV = 1.732 × 117.8 × (0.00387×0.85 + 0.0066×0.527)
  ΔV = 1.38 V = 0.29% (within IEEE limits)
```

---

## 🌟 Advanced Features

### Parallel Transformer Support
- Automatic detection of parallel transformers
- Combined impedance calculation
- Total capacity tracking
- Individual loading display

### Motor Contribution Integration
```javascript
Per IEEE 141-1993:
- Initial contribution: 4-6× FLC for induction motors
- Decay time constant based on X/R ratio
- Parallel combination with system impedance
- Separate tracking in results
```

### Temperature Correction
```javascript
NEC/NFPA Standard Correction:
R_temp = R_20°C × [1 + α × (T - 20)]
where:
  α_copper = 0.00393/°C
  α_aluminum = 0.00403/°C
```

### System Analytics
- Equipment utilization tracking
- Capacity headroom analysis
- Bottleneck identification
- Reliability assessment
- Protection coordination checks

---

## 🔄 Version History

### v1.2.0 (2025-10-28)
- ✅ Fixed motor contribution placement bug in shortCircuitCalc.js
- ✅ Enhanced load flow integration with voltage drop
- ✅ Improved transformer current transformation logic
- ✅ Added comprehensive module loading diagnostics

### v1.1.0 (2025-10-27)
- ✅ Added intelligent recommendation system (50+ rules)
- ✅ Implemented system-wide analytics
- ✅ Created separate load flow and voltage drop reports
- ✅ Added action plan tracking with CSV export
- ✅ Enhanced export tab with categorized reports

### v1.0.0 (2025-10-25)
- ✅ Initial release
- ✅ Short circuit analysis (Point-to-Point & Per-Unit)
- ✅ Multi-bus system modeling
- ✅ Basic export functionality
- ✅ Dark/light theme support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Add comments for complex logic
- Test calculations against IEEE standards
- Update documentation for new features
- Include example use cases

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Engr. B. P. Faraon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ⚠️ Disclaimer

This tool is provided for **educational and professional analysis purposes**. 

**IMPORTANT:**
- Always verify critical electrical system calculations with **licensed professional engineers**
- Comply with **local electrical codes and standards** in your jurisdiction
- This software does not replace professional engineering judgment
- Use at your own risk - the author assumes no liability for any consequences
- For safety-critical applications, perform independent verification
- Arc flash calculations require separate NFPA 70E compliance tools

---

## 🎓 Learning Resources

### IEEE Standards
- [IEEE 141-1993](https://standards.ieee.org/standard/141-1993.html) - Industrial Power Systems Analysis
- [IEEE 242](https://standards.ieee.org/standard/242-2001.html) - Protection and Coordination
- [IEEE 399](https://standards.ieee.org/standard/399-1997.html) - Industrial Power Systems Analysis (Brown Book)

### NEC References
- Article 110 - Requirements for Electrical Installations
- Article 210/215 - Branch Circuits and Feeders
- Article 430 - Motors, Motor Circuits, and Controllers
- Chapter 9 - Tables (Conductor Properties)

### Online Resources
- [NFPA 70E](https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=70E) - Electrical Safety
- [IEC 60909](https://webstore.iec.ch/publication/3895) - Short-Circuit Calculations

---

## 🌟 Roadmap

### Planned Features
- [ ] **Arc Flash Analysis**: NFPA 70E incident energy calculations
- [ ] **Protection Coordination**: Time-current curve plotting
- [ ] **Harmonic Analysis**: THD and resonance calculations
- [ ] **Equipment Database**: Standardized equipment library
- [ ] **3D Visualization**: Interactive single-line diagrams
- [ ] **Multi-Language Support**: i18n for global users
- [ ] **Cloud Sync**: Optional project cloud storage
- [ ] **PDF Reports**: Native PDF generation with charts
- [ ] **API Integration**: External data import/export
- [ ] **Mobile App**: Native iOS/Android versions

### Future Enhancements
- [ ] Generator sizing wizard
- [ ] Cable sizing optimization
- [ ] Economic analysis (LCC, NPV)
- [ ] Reliability calculations (MTBF, availability)
- [ ] Power quality monitoring
- [ ] Renewable energy integration
- [ ] Battery storage systems
- [ ] Microgrid analysis

---

## 📧 Contact & Support

### Author
**Engr. B. P. Faraon**  
GitHub: [@bfforex](https://github.com/bfforex)

### Repository
[github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer)

### Issues
Report bugs or request features: [GitHub Issues](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/issues)

### Discussions
Ask questions or share ideas: [GitHub Discussions](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/discussions)

---

## 🙏 Acknowledgments

- IEEE Standards Association for comprehensive power system standards
- National Electrical Code (NEC) for conductor and installation standards
- IEC for international short circuit calculation standards
- Open source community for inspiration and best practices
- All contributors and users providing valuable feedback

---

## ⭐ Show Your Support

If you find this project useful, please consider:
- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** to help improve the tool
- 💡 **Suggest features** for future development
- 📢 **Share with colleagues** in the electrical engineering field
- 📝 **Contribute** improvements or documentation

---

<div align="center">

**Made with ⚡ by Electrical Engineers, for Electrical Engineers**

*Empowering safe and efficient electrical system design since 2025*

[🏠 Home](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer) | 
[📖 Wiki](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/wiki) | 
[🐛 Issues](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/issues) | 
[💬 Discussions](https://github.com/bfforex/PwrSysPro---Short-Circuit-Analyzer/discussions)

</div>
