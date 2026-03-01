export interface MonographTest {
    test: string;
    specification: string;
    category: 'Physical' | 'Chemical' | 'Microbiological' | 'Descriptive';
}

export interface Monograph {
    id: string; // Product Code or ID
    name: string;
    standard: 'BP' | 'USP' | 'In-House' | 'EP';
    type: 'Finished Product' | 'Raw Material' | 'Utility';
    description: string;
    tests: MonographTest[];
    strength?: string;
    dosageForm?: string;
}

// Comprehensive International Pharmacopeia Microbiology Standard (Sterility & Bioburden)
const standardMicrobiologyTests: MonographTest[] = [
    { test: "Total Aerobic Microbial Count (TAMC)", specification: "NMT 10³ CFU/g", category: "Microbiological" },
    { test: "Total Combined Yeasts and Molds Count (TYMC)", specification: "NMT 10² CFU/g", category: "Microbiological" },
    { test: "Escherichia coli", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Salmonella species", specification: "Absent in 10 g", category: "Microbiological" },
    { test: "Staphylococcus aureus", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Pseudomonas aeruginosa", specification: "Absent in 1 g", category: "Microbiological" },
    { test: "Shigella species", specification: "Absent in 10 g", category: "Microbiological" },
    { test: "Clostridium species", specification: "Absent in 1 g", category: "Microbiological" }
];

// Standard Tablet/Capsule Physical IPQC Parameter Set
const standardTabletPhysicalTests: MonographTest[] = [
    { test: "Average Weight", specification: "House Std ± 5%", category: "Physical" },
    { test: "Weight Variation", specification: "Complies (BP/USP)", category: "Physical" },
    { test: "Hardness", specification: "NLT 5.0 kp", category: "Physical" },
    { test: "Friability", specification: "NMT 1.0% w/w", category: "Physical" },
    { test: "Thickness", specification: "House Std ± 5%", category: "Physical" },
    { test: "Disintegration Time", specification: "NMT 15 minutes", category: "Physical" }
];

export const g1Monographs: Record<string, Monograph> = {
    // ==================== RAW MATERIALS ====================
    "as_raw": {
        id: "as_raw",
        name: "Aspirin Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Acetylsalicylic Acid BP API",
        tests: [
            { test: "Characters", specification: "White crystalline powder", category: "Descriptive" },
            { test: "Identification (IR)", specification: "Conforms to reference", category: "Chemical" },
            { test: "Assay", specification: "99.5% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "paracet_raw": {
        id: "paracet_raw",
        name: "Paracetamol Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Paracetamol BP API",
        tests: [
            { test: "Assay", specification: "99.0% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "pot_citrate_raw": {
        id: "pot_citrate_raw",
        name: "Potassium Citrate Raw Material",
        standard: "BP",
        type: "Raw Material",
        description: "Potassium Citrate BP API",
        tests: [
            { test: "Identification (Potassium - Flame)", specification: "Violet color in flame", category: "Chemical" },
            { test: "Identification (Citrates)", specification: "Complies with BP test", category: "Chemical" },
            { test: "Tartrate Test", specification: "No crystalline precipitate", category: "Chemical" },
            { test: "Assay (Potassium Content)", specification: "99.0% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "sodium_bicarb_raw": {
        id: "sodium_bicarb_raw",
        name: "Sodium Bicarbonate",
        standard: "BP",
        type: "Raw Material",
        description: "Sodium Bicarbonate BP API",
        tests: [
            { test: "Assay", specification: "99.0% to 101.0%", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    // ==================== FINISHED PRODUCTS (Tablets & Capsules) ====================
    "as_100_fp": {
        id: "as_100_fp",
        name: "Aspirin Tablets",
        strength: "100mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Aspirin 100mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, round tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Aspirin", specification: "95.0% to 105.0% (95-105mg)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "paracet_500_fp": {
        id: "paracet_500_fp",
        name: "Paracetamol Tablets",
        strength: "500mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Paracetamol 500mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, capsule shaped tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Paracetamol", specification: "475mg to 525mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "metro_500_fp": {
        id: "metro_500_fp",
        name: "Metronidazole Tablets",
        strength: "500mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Metronidazole 500mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White to cream tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Metronidazole", specification: "475mg to 525mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "diclo_sod_50_fp": {
        id: "diclo_sod_50_fp",
        name: "Diclofenac Sodium EC Tablets",
        strength: "50mg",
        dosageForm: "Enteric Coated Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Diclofenac Sodium 50mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "Yellow, round biconvex tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Acid Resistance Test", specification: "No break in 2 hours", category: "Physical" },
            { test: "Assay of Diclofenac", specification: "47.5mg to 52.5mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "pot_citrate_16_fp": {
        id: "pot_citrate_16_fp",
        name: "Potassium Citrate Effervescent Granules 16%",
        strength: "16% w/w",
        dosageForm: "Effervescent Granules",
        standard: "BP",
        type: "Finished Product",
        description: "Potassium Citrate Effervescent BP Granules",
        tests: [
            { test: "Appearance", specification: "White dry granules", category: "Descriptive" },
            { test: "Loss on Drying", specification: "NMT 2.0%", category: "Physical" },
            { test: "Effervescence Time", specification: "NMT 5 minutes", category: "Physical" },
            { test: "pH (of 5% solution)", specification: "5.5 to 7.0", category: "Physical" },
            { test: "Identification (Potassium - Flame)", specification: "Violet color in flame", category: "Chemical" },
            { test: "Identification (Citrates)", specification: "Complies with BP test", category: "Chemical" },
            { test: "Assay of Potassium Citrate", specification: "15.2% to 16.8% (95-105%)", category: "Chemical" },
            { test: "K Content by Flame Photometry", specification: "", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "povidone_iodine_sol": {
        id: "povidone_iodine_sol",
        name: "Povidone Iodine Topical Solution",
        strength: "10% w/v",
        dosageForm: "Solution",
        standard: "BP",
        type: "Finished Product",
        description: "Povidone Iodine 10% Solution BP",
        tests: [
            { test: "Appearance", specification: "Dark brown liquid", category: "Descriptive" },
            { test: "pH", specification: "3.5 to 6.5", category: "Physical" },
            { test: "Identification of Iodine", specification: "Complies", category: "Chemical" },
            { test: "Assay of Available Iodine", specification: "0.85% to 1.20% w/v", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    // ==================== UTILITIES ====================
    "pure_water": {
        id: "pure_water",
        name: "Purified Water",
        standard: "BP",
        type: "Utility",
        description: "Purified Water BP Control Monitoring",
        tests: [
            { test: "Appearance", specification: "Clear colorless liquid", category: "Descriptive" },
            { test: "Conductivity", specification: "NMT 1.3 µS/cm", category: "Physical" },
            { test: "pH", specification: "5.0 to 7.0", category: "Physical" },
            { test: "TAMC", specification: "NMT 100 CFU/mL", category: "Microbiological" }
        ]
    },
    "ibuprofen_400_fp": {
        id: "ibuprofen_400_fp",
        name: "Ibuprofen Tablets",
        strength: "400mg",
        dosageForm: "Tablet",
        standard: "BP",
        type: "Finished Product",
        description: "Ibuprofen 400mg Tablets BP",
        tests: [
            { test: "Appearance", specification: "White, circular film-coated tablets", category: "Descriptive" },
            ...standardTabletPhysicalTests,
            { test: "Assay of Ibuprofen", specification: "380mg to 420mg (95-105%)", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    },
    "mag_sulph_eff_fp": {
        id: "mag_sulph_eff_fp",
        name: "Magnesium Sulphate Effervescent Powder",
        strength: "5g",
        dosageForm: "Powder",
        standard: "BP",
        type: "Finished Product",
        description: "Magnesium Sulphate Effervescent Powder BP",
        tests: [
            { test: "Appearance", specification: "White, granular powder", category: "Descriptive" },
            { test: "Effervescence", specification: "Vigorous evolution of CO2", category: "Physical" },
            { test: "pH (aqueous)", specification: "5.5 to 7.0", category: "Physical" },
            { test: "Assay (Magnesium)", specification: "90% to 110% of stated amount", category: "Chemical" },
            ...standardMicrobiologyTests
        ]
    }
};
