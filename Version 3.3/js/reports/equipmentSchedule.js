/**
 * Equipment Schedule Generator
 * PwrSys Pro - Short Circuit Analyzer v3.3
 * 
 * Generates professional equipment schedules for regulatory submissions
 * 
 * @author Engr. B. P. Faraon
 * @date 2026-01-05
 * @version 1.0.0
 */

const EquipmentScheduleGenerator = {
    /**
     * Generate all equipment schedules
     * @param {ProfessionalPDFGenerator} pdfGen - PDF generator instance
     * @param {Object} systemData - System equipment data
     */
    generateAll(pdfGen, systemData = {}) {
        console.log('📋 Generating equipment schedules...');
        
        this.generateTransformerSchedule(pdfGen, systemData);
        this.generateSwitchboardSchedule(pdfGen, systemData);
        this.generateMotorSchedule(pdfGen, systemData);
        this.generateCableSchedule(pdfGen, systemData);
        this.generateProtectionDeviceSchedule(pdfGen, systemData);
        
        console.log('✅ All equipment schedules generated');
    },
    
    /**
     * Generate transformer schedule
     */
    generateTransformerSchedule(pdfGen, systemData = {}) {
        const doc = pdfGen.doc;
        const buses = systemData.buses || window.buses || [];
        
        pdfGen.newPage('TRANSFORMER SCHEDULE', 'Equipment Schedules');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('TRANSFORMER SCHEDULE', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Extract transformer data
        const transformers = [];
        buses.forEach(bus => {
            if (bus.components) {
                bus.components.forEach(comp => {
                    if (comp.type === 'Transformer') {
                        transformers.push({
                            tag: comp.name || comp.id,
                            rating: comp.rating || 'N/A',
                            primary: comp.primaryVoltage || 'N/A',
                            secondary: comp.secondaryVoltage || bus.voltage || 'N/A',
                            impedance: comp.impedance || 'N/A',
                            xr: comp.xrRatio || 'N/A',
                            vector: comp.vectorGroup || 'Dyn11',
                            manufacturer: comp.manufacturer || 'TBD'
                        });
                    }
                });
            }
        });
        
        // Add default entries if no transformers found
        if (transformers.length === 0) {
            transformers.push({
                tag: 'T-001',
                rating: '1000 kVA',
                primary: '13.2 kV',
                secondary: '480V',
                impedance: '5.75%',
                xr: '6.0',
                vector: 'Dyn11',
                manufacturer: 'TBD'
            });
        }
        
        // Table headers
        const headers = ['Tag', 'Rating (kVA)', 'Primary (V)', 'Secondary (V)', 'Z%', 'X/R', 'Vector', 'Manufacturer'];
        
        // Table rows
        const rows = transformers.map(t => [
            t.tag,
            t.rating,
            t.primary,
            t.secondary,
            t.impedance,
            t.xr,
            t.vector,
            t.manufacturer
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 8,
            cellPadding: 2
        });
        
        // Notes section
        y = pdfGen.currentY + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Notes:', pdfGen.marginLeft, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '1. Transformer impedances are at rated kVA and rated voltage.',
            '2. Vector group notation per IEC 60076.',
            '3. All transformers to comply with NEC Article 450 and PEC Section 4.50.',
            '4. Temperature rise: 65°C or 80°C per nameplate.'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 4));
        });
        
        pdfGen.currentY = y + notes.length * 4 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
    },
    
    /**
     * Generate switchboard/panel schedule
     */
    generateSwitchboardSchedule(pdfGen, systemData = {}) {
        const doc = pdfGen.doc;
        const buses = systemData.buses || window.buses || [];
        
        pdfGen.newPage('SWITCHBOARD / PANEL SCHEDULE', 'Equipment Schedules');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('SWITCHBOARD / PANEL SCHEDULE', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Extract switchboard data from buses
        const switchboards = buses.map(bus => ({
            tag: bus.name || bus.id,
            description: bus.description || 'Main Distribution Panel',
            voltage: bus.voltage ? `${bus.voltage}V` : 'N/A',
            mainRating: bus.mainBreakerRating ? `${bus.mainBreakerRating}A` : 'N/A',
            aic: bus.aic ? `${bus.aic} kA` : 'N/A',
            availableFault: bus.results?.fault3Phase ? `${parseFloat(bus.results.fault3Phase).toFixed(2)} kA` : 'N/A',
            status: this.getEquipmentStatus(bus)
        }));
        
        // Table headers
        const headers = ['Tag', 'Description', 'Voltage', 'Main Rating', 'AIC (kA)', 'Available Fault', 'Status'];
        
        // Table rows
        const rows = switchboards.map(sb => [
            sb.tag,
            sb.description,
            sb.voltage,
            sb.mainRating,
            sb.aic,
            sb.availableFault,
            sb.status
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 8,
            cellPadding: 2
        });
        
        // Notes
        y = pdfGen.currentY + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Notes:', pdfGen.marginLeft, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '1. All panels and switchboards to comply with NEC Article 408 and PEC Section 4.08.',
            '2. AIC ratings must equal or exceed available fault current per NEC 110.9.',
            '3. Equipment to be suitable for application and properly rated.'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 4));
        });
        
        pdfGen.currentY = y + notes.length * 4 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
    },
    
    /**
     * Generate motor schedule
     */
    generateMotorSchedule(pdfGen, systemData = {}) {
        const doc = pdfGen.doc;
        const buses = systemData.buses || window.buses || [];
        
        pdfGen.newPage('MOTOR SCHEDULE', 'Equipment Schedules');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('MOTOR SCHEDULE', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Extract motor data
        const motors = [];
        buses.forEach(bus => {
            if (bus.components) {
                bus.components.forEach(comp => {
                    if (comp.type === 'Motor') {
                        motors.push({
                            tag: comp.name || comp.id,
                            description: comp.description || 'Motor Load',
                            hp: comp.hp || comp.rating || 'N/A',
                            voltage: comp.voltage || bus.voltage || 'N/A',
                            flc: comp.flc || 'N/A',
                            type: comp.motorType || 'Induction',
                            starter: comp.starterType || 'DOL',
                            protection: comp.protection || 'Thermal OL'
                        });
                    }
                });
            }
        });
        
        // Add sample motor if none found
        if (motors.length === 0) {
            motors.push({
                tag: 'M-001',
                description: 'Sample Motor',
                hp: '50 HP',
                voltage: '460V',
                flc: '65A',
                type: 'Induction',
                starter: 'DOL',
                protection: 'Thermal OL'
            });
        }
        
        // Table headers
        const headers = ['Tag', 'Description', 'HP', 'Voltage', 'FLC (A)', 'Type', 'Starter', 'Protection'];
        
        // Table rows
        const rows = motors.map(m => [
            m.tag,
            m.description,
            m.hp,
            m.voltage,
            m.flc,
            m.type,
            m.starter,
            m.protection
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 8,
            cellPadding: 2
        });
        
        // Notes
        y = pdfGen.currentY + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Notes:', pdfGen.marginLeft, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '1. Motor installations to comply with NEC Article 430 and PEC Section 4.30.',
            '2. FLC values from NEC Tables 430.247-430.250.',
            '3. Overload protection sized per NEC 430.32.',
            '4. Short circuit protection per NEC 430.52.'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 4));
        });
        
        pdfGen.currentY = y + notes.length * 4 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
    },
    
    /**
     * Generate cable schedule
     */
    generateCableSchedule(pdfGen, systemData = {}) {
        const doc = pdfGen.doc;
        const buses = systemData.buses || window.buses || [];
        
        pdfGen.newPage('CABLE SCHEDULE', 'Equipment Schedules');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('CABLE SCHEDULE', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Extract cable data
        const cables = [];
        buses.forEach(bus => {
            if (bus.components) {
                bus.components.forEach(comp => {
                    if (comp.type === 'Cable' || comp.type === 'Feeder') {
                        const vd = bus.results?.voltageDrop || 0;
                        cables.push({
                            tag: comp.name || comp.id,
                            from: comp.from || 'Source',
                            to: bus.name || bus.id,
                            size: comp.size || 'N/A',
                            type: comp.cableType || 'THHN/THWN',
                            length: comp.length || 'N/A',
                            ampacity: comp.ampacity || 'N/A',
                            load: comp.load || 'N/A',
                            vd: `${parseFloat(vd).toFixed(2)}%`,
                            conduit: comp.conduit || 'PVC'
                        });
                    }
                });
            }
        });
        
        // Add sample cable if none found
        if (cables.length === 0) {
            cables.push({
                tag: 'C-001',
                from: 'Main Panel',
                to: 'Sub Panel',
                size: '4/0 AWG',
                type: 'THHN/THWN',
                length: '100 ft',
                ampacity: '230A',
                load: '200A',
                vd: '2.1%',
                conduit: 'EMT'
            });
        }
        
        // Table headers (split into two rows due to space)
        const headers = ['Tag', 'From', 'To', 'Size', 'Type', 'Length', 'Ampacity', 'Load', 'VD%'];
        
        // Table rows
        const rows = cables.map(c => [
            c.tag,
            c.from,
            c.to,
            c.size,
            c.type,
            c.length,
            c.ampacity,
            c.load,
            c.vd
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 7,
            cellPadding: 2
        });
        
        // Notes
        y = pdfGen.currentY + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Notes:', pdfGen.marginLeft, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '1. Conductor sizing per NEC Article 310 and PEC Section 3.10.',
            '2. Voltage drop limited to 3% for feeders, 5% total per NEC 210.19(A).',
            '3. Ampacity based on 75°C terminations unless otherwise noted.',
            '4. Conduit sizing per NEC Chapter 9, Tables 1, 4, and 5.'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 4));
        });
        
        pdfGen.currentY = y + notes.length * 4 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
    },
    
    /**
     * Generate protection device schedule
     */
    generateProtectionDeviceSchedule(pdfGen, systemData = {}) {
        const doc = pdfGen.doc;
        const buses = systemData.buses || window.buses || [];
        
        pdfGen.newPage('PROTECTION DEVICE SCHEDULE', 'Equipment Schedules');
        
        let y = pdfGen.currentY + 10;
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...pdfGen.colors.primary);
        doc.text('PROTECTION DEVICE SCHEDULE', pdfGen.marginLeft, y);
        
        y += 10;
        
        // Extract protection device data
        const devices = buses.map(bus => ({
            tag: bus.name || bus.id,
            location: bus.description || 'Distribution Panel',
            type: bus.protectionType || 'MCCB',
            frame: bus.mainBreakerRating ? `${bus.mainBreakerRating}AF` : 'N/A',
            trip: bus.mainBreakerRating ? `${bus.mainBreakerRating}AT` : 'N/A',
            aic: bus.aic ? `${bus.aic} kA` : 'N/A',
            settings: bus.protectionSettings || 'Fixed',
            manufacturer: bus.manufacturer || 'TBD'
        }));
        
        // Table headers
        const headers = ['Tag', 'Location', 'Type', 'Frame (AF)', 'Trip (AT)', 'AIC (kA)', 'Settings', 'Manufacturer'];
        
        // Table rows
        const rows = devices.map(d => [
            d.tag,
            d.location,
            d.type,
            d.frame,
            d.trip,
            d.aic,
            d.settings,
            d.manufacturer
        ]);
        
        // Add table
        pdfGen.addTable(headers, rows, {
            startY: y,
            fontSize: 8,
            cellPadding: 2
        });
        
        // Notes
        y = pdfGen.currentY + 5;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Notes:', pdfGen.marginLeft, y);
        
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...pdfGen.colors.muted);
        
        const notes = [
            '1. All overcurrent protective devices to comply with NEC Article 240 and PEC Section 2.40.',
            '2. AIC rating must equal or exceed available fault current per NEC 110.9.',
            '3. Circuit breakers to be tested and calibrated per manufacturer specifications.',
            '4. Protection coordination analysis provided in separate section.'
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, pdfGen.marginLeft, y + (index * 4));
        });
        
        pdfGen.currentY = y + notes.length * 4 + 5;
        doc.setTextColor(...pdfGen.colors.dark);
    },
    
    /**
     * Get equipment adequacy status
     */
    getEquipmentStatus(bus) {
        const availableFault = parseFloat(bus.results?.fault3Phase) || 0;
        const rating = parseFloat(bus.aic) || 65;
        
        if (availableFault === 0) return 'N/A';
        if (availableFault <= rating * 0.8) return 'OK';
        if (availableFault <= rating) return 'MARGINAL';
        return 'INADEQUATE';
    }
};

// Export to global scope
window.EquipmentScheduleGenerator = EquipmentScheduleGenerator;

console.log('✅ Equipment Schedule Generator module loaded');
