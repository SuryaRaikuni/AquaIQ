import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── District mock data (15 districts, 4 states) ─────────────────────────────
const districts = [
  // Maharashtra
  { name: 'Pune',        state: 'Maharashtra', stressIndex: 0.45, groundwaterLevel: 12.3, rainfallAvg: 722,  dominantSource: 'mixed',       dataQuality: 'real' },
  { name: 'Nashik',      state: 'Maharashtra', stressIndex: 0.61, groundwaterLevel: 18.7, rainfallAvg: 684,  dominantSource: 'groundwater',  dataQuality: 'real' },
  { name: 'Aurangabad',  state: 'Maharashtra', stressIndex: 0.78, groundwaterLevel: 24.1, rainfallAvg: 498,  dominantSource: 'groundwater',  dataQuality: 'interpolated' },
  { name: 'Latur',       state: 'Maharashtra', stressIndex: 0.87, groundwaterLevel: 31.5, rainfallAvg: 421,  dominantSource: 'groundwater',  dataQuality: 'real' },
  // Rajasthan
  { name: 'Jaipur',      state: 'Rajasthan',   stressIndex: 0.82, groundwaterLevel: 38.4, rainfallAvg: 312,  dominantSource: 'groundwater',  dataQuality: 'real' },
  { name: 'Jodhpur',     state: 'Rajasthan',   stressIndex: 0.94, groundwaterLevel: 52.6, rainfallAvg: 198,  dominantSource: 'groundwater',  dataQuality: 'real' },
  { name: 'Bikaner',     state: 'Rajasthan',   stressIndex: 0.97, groundwaterLevel: 61.2, rainfallAvg: 145,  dominantSource: 'groundwater',  dataQuality: 'interpolated' },
  { name: 'Kota',        state: 'Rajasthan',   stressIndex: 0.68, groundwaterLevel: 22.9, rainfallAvg: 527,  dominantSource: 'surface',      dataQuality: 'real' },
  // Tamil Nadu
  { name: 'Chennai',     state: 'Tamil Nadu',  stressIndex: 0.76, groundwaterLevel: 28.3, rainfallAvg: 1400, dominantSource: 'mixed',        dataQuality: 'real' },
  { name: 'Coimbatore',  state: 'Tamil Nadu',  stressIndex: 0.52, groundwaterLevel: 15.1, rainfallAvg: 718,  dominantSource: 'surface',      dataQuality: 'real' },
  { name: 'Madurai',     state: 'Tamil Nadu',  stressIndex: 0.65, groundwaterLevel: 19.8, rainfallAvg: 864,  dominantSource: 'groundwater',  dataQuality: 'interpolated' },
  // Karnataka
  { name: 'Bengaluru',   state: 'Karnataka',   stressIndex: 0.71, groundwaterLevel: 22.4, rainfallAvg: 982,  dominantSource: 'mixed',        dataQuality: 'real' },
  { name: 'Mysuru',      state: 'Karnataka',   stressIndex: 0.38, groundwaterLevel:  9.2, rainfallAvg: 1102, dominantSource: 'surface',      dataQuality: 'real' },
  { name: 'Kalaburagi',  state: 'Karnataka',   stressIndex: 0.80, groundwaterLevel: 27.6, rainfallAvg: 541,  dominantSource: 'groundwater',  dataQuality: 'interpolated' },
  { name: 'Tumkur',      state: 'Karnataka',   stressIndex: 0.57, groundwaterLevel: 16.3, rainfallAvg: 820,  dominantSource: 'mixed',        dataQuality: 'real' },
];

// ─── Food VWC (Virtual Water Content per 100g) ────────────────────────────────
const foodVwc = [
  // Grains
  { foodName: 'Rice',           category: 'grain',     vwcLitersPer100g: 257,  isVegan: true,  isVegetarian: true },
  { foodName: 'Wheat',          category: 'grain',     vwcLitersPer100g: 154,  isVegan: true,  isVegetarian: true },
  { foodName: 'Maize',          category: 'grain',     vwcLitersPer100g: 108,  isVegan: true,  isVegetarian: true },
  { foodName: 'Bajra',          category: 'grain',     vwcLitersPer100g: 135,  isVegan: true,  isVegetarian: true },
  { foodName: 'Jowar',          category: 'grain',     vwcLitersPer100g: 120,  isVegan: true,  isVegetarian: true },
  // Pulses & legumes
  { foodName: 'Lentils (Dal)',   category: 'pulse',     vwcLitersPer100g: 127,  isVegan: true,  isVegetarian: true },
  { foodName: 'Chickpeas',      category: 'pulse',     vwcLitersPer100g: 164,  isVegan: true,  isVegetarian: true },
  { foodName: 'Soybeans',       category: 'pulse',     vwcLitersPer100g: 217,  isVegan: true,  isVegetarian: true },
  // Vegetables
  { foodName: 'Potato',         category: 'vegetable', vwcLitersPer100g: 28,   isVegan: true,  isVegetarian: true },
  { foodName: 'Tomato',         category: 'vegetable', vwcLitersPer100g: 21,   isVegan: true,  isVegetarian: true },
  { foodName: 'Onion',          category: 'vegetable', vwcLitersPer100g: 28,   isVegan: true,  isVegetarian: true },
  { foodName: 'Brinjal',        category: 'vegetable', vwcLitersPer100g: 24,   isVegan: true,  isVegetarian: true },
  { foodName: 'Cabbage',        category: 'vegetable', vwcLitersPer100g: 23,   isVegan: true,  isVegetarian: true },
  { foodName: 'Spinach',        category: 'vegetable', vwcLitersPer100g: 19,   isVegan: true,  isVegetarian: true },
  // Fruits
  { foodName: 'Mango',          category: 'fruit',     vwcLitersPer100g: 128,  isVegan: true,  isVegetarian: true },
  { foodName: 'Banana',         category: 'fruit',     vwcLitersPer100g: 96,   isVegan: true,  isVegetarian: true },
  { foodName: 'Apple',          category: 'fruit',     vwcLitersPer100g: 82,   isVegan: true,  isVegetarian: true },
  { foodName: 'Orange',         category: 'fruit',     vwcLitersPer100g: 80,   isVegan: true,  isVegetarian: true },
  // Dairy
  { foodName: 'Milk',           category: 'dairy',     vwcLitersPer100g: 101,  isVegan: false, isVegetarian: true },
  { foodName: 'Curd / Yogurt',  category: 'dairy',     vwcLitersPer100g: 88,   isVegan: false, isVegetarian: true },
  { foodName: 'Paneer',         category: 'dairy',     vwcLitersPer100g: 352,  isVegan: false, isVegetarian: true },
  { foodName: 'Butter / Ghee',  category: 'dairy',     vwcLitersPer100g: 555,  isVegan: false, isVegetarian: true },
  // Meat & fish
  { foodName: 'Chicken',        category: 'meat',      vwcLitersPer100g: 435,  isVegan: false, isVegetarian: false },
  { foodName: 'Mutton / Goat',  category: 'meat',      vwcLitersPer100g: 742,  isVegan: false, isVegetarian: false },
  { foodName: 'Beef',           category: 'meat',      vwcLitersPer100g: 1551, isVegan: false, isVegetarian: false },
  { foodName: 'Fish',           category: 'meat',      vwcLitersPer100g: 218,  isVegan: false, isVegetarian: false },
  { foodName: 'Eggs',           category: 'meat',      vwcLitersPer100g: 196,  isVegan: false, isVegetarian: false },
  // Beverages
  { foodName: 'Tea',            category: 'beverage',  vwcLitersPer100g: 30,   isVegan: true,  isVegetarian: true },
  { foodName: 'Coffee',         category: 'beverage',  vwcLitersPer100g: 140,  isVegan: true,  isVegetarian: true },
  { foodName: 'Sugar (cane)',   category: 'other',     vwcLitersPer100g: 175,  isVegan: true,  isVegetarian: true },
];

// ─── Crop water requirements ───────────────────────────────────────────────────
const crops = [
  { cropName: 'Rice',           cropType: 'cereal',     season: 'kharif', vwcLitersPerKg: 2497, waterPerAcre: 1209000 },
  { cropName: 'Wheat',          cropType: 'cereal',     season: 'rabi',   vwcLitersPerKg: 1827, waterPerAcre: 712000  },
  { cropName: 'Sugarcane',      cropType: 'cash_crop',  season: 'annual', vwcLitersPerKg: 1782, waterPerAcre: 2430000 },
  { cropName: 'Cotton',         cropType: 'cash_crop',  season: 'kharif', vwcLitersPerKg: 9114, waterPerAcre: 980000  },
  { cropName: 'Maize',          cropType: 'cereal',     season: 'kharif', vwcLitersPerKg: 1222, waterPerAcre: 600000  },
  { cropName: 'Soybean',        cropType: 'cash_crop',  season: 'kharif', vwcLitersPerKg: 2145, waterPerAcre: 520000  },
  { cropName: 'Tomato',         cropType: 'vegetable',  season: 'rabi',   vwcLitersPerKg: 214,  waterPerAcre: 350000  },
  { cropName: 'Potato',         cropType: 'vegetable',  season: 'rabi',   vwcLitersPerKg: 287,  waterPerAcre: 420000  },
  { cropName: 'Onion',          cropType: 'vegetable',  season: 'rabi',   vwcLitersPerKg: 272,  waterPerAcre: 380000  },
  { cropName: 'Banana',         cropType: 'fruit',      season: 'annual', vwcLitersPerKg: 790,  waterPerAcre: 1800000 },
  { cropName: 'Mango',          cropType: 'fruit',      season: 'zaid',   vwcLitersPerKg: 686,  waterPerAcre: 750000  },
  { cropName: 'Groundnut',      cropType: 'cash_crop',  season: 'kharif', vwcLitersPerKg: 2782, waterPerAcre: 560000  },
];

// ─── Legal rules (10 states — representative subset) ─────────────────────────
const legalRules = [
  // Maharashtra
  {
    state: 'Maharashtra', useCase: 'residential', sourceType: 'borewell',
    ruleText: 'Under the Maharashtra Groundwater (Development and Management) Act 2009, new borewells in notified over-exploited zones require prior permission from the district authority. Spacing norms of 500m from existing borewells apply.',
    lawReference: 'Maharashtra Groundwater Act 2009, Section 12',
    rwhMandatory: true, permitRequired: true, cgwaZone: 'over-exploited',
  },
  {
    state: 'Maharashtra', useCase: 'residential', sourceType: 'municipal',
    ruleText: 'Buildings with a plot area >300 sq.m. in Maharashtra must install a Rainwater Harvesting system as per the Maharashtra Regional and Town Planning Act. The Maharashtra Water Resource Regulatory Authority (MWRRA) governs water allocation.',
    lawReference: 'MWRRA Act 2005; BMC RWH Guidelines 2007',
    rwhMandatory: true, permitRequired: false, cgwaZone: null,
  },
  // Rajasthan
  {
    state: 'Rajasthan', useCase: 'agricultural', sourceType: 'borewell',
    ruleText: 'Rajasthan Water (Prevention & Control of Pollution) Act 1974 applies. New borewells for irrigation in dark zone and grey zone areas require District Collector approval. Farmers are encouraged to adopt micro-irrigation under PMKSY.',
    lawReference: 'Rajasthan Groundwater Act 1956 (amended 2010); PMKSY Guidelines',
    rwhMandatory: false, permitRequired: true, cgwaZone: 'critical',
  },
  {
    state: 'Rajasthan', useCase: 'residential', sourceType: 'municipal',
    ruleText: 'All new residential buildings in urban local body areas with a plot area ≥200 sq.m. must provide rainwater harvesting pits or tanks before obtaining occupancy certificate.',
    lawReference: 'Rajasthan RWH Rules 2006; Rajasthan Municipal Act 2009',
    rwhMandatory: true, permitRequired: false, cgwaZone: null,
  },
  // Tamil Nadu
  {
    state: 'Tamil Nadu', useCase: 'residential', sourceType: 'borewell',
    ruleText: 'Tamil Nadu Ground Water (Development & Management) Act 2003 mandates registration of all borewells. New borewells within 1.5 km of existing borewells in notified areas require NOC from Ground Water Authority of Tamil Nadu (GWAB).',
    lawReference: 'TN Groundwater Act 2003, Section 7',
    rwhMandatory: true, permitRequired: true, cgwaZone: 'semi-critical',
  },
  {
    state: 'Tamil Nadu', useCase: 'commercial', sourceType: 'borewell',
    ruleText: 'Commercial establishments drawing >50,000 litres/day from groundwater must obtain a Central Ground Water Authority (CGWA) NOC. Tamil Nadu has made RWH mandatory for all buildings since 2003 — one of the first states to enforce this.',
    lawReference: 'CGWA Notification 2020; TN RWH Act 2003',
    rwhMandatory: true, permitRequired: true, cgwaZone: 'over-exploited',
  },
  // Karnataka
  {
    state: 'Karnataka', useCase: 'residential', sourceType: 'borewell',
    ruleText: 'Karnataka Ground Water (Regulation and Control of Development and Management) Act 2011 governs borewell drilling. Borewells deeper than 60m or in notified zones require CGWA clearance. Bangalore Urban mandates RWH for sites >1200 sq.ft built-up area.',
    lawReference: 'Karnataka Groundwater Act 2011; BBMP RWH Bylaws 2016',
    rwhMandatory: true, permitRequired: true, cgwaZone: 'semi-critical',
  },
  {
    state: 'Karnataka', useCase: 'industrial', sourceType: 'borewell',
    ruleText: 'Industrial units in Karnataka extracting groundwater must obtain NOC from CGWA if located in notified areas. Water audit mandatory for units using >500 KLD. Karnataka State Pollution Control Board may impose conditions on groundwater extraction.',
    lawReference: 'Water (Prevention & Control) Act 1974; CGWA Guidelines 2020',
    rwhMandatory: false, permitRequired: true, cgwaZone: 'over-exploited',
  },
  // Gujarat
  {
    state: 'Gujarat', useCase: 'agricultural', sourceType: 'borewell',
    ruleText: 'Gujarat Water Supply and Sewerage Board and the Irrigation department regulate agricultural water use. Jyotirgram Yojana controls power supply to borewells. Drip irrigation is mandated for certain crops under GGRC subsidy programmes.',
    lawReference: 'Gujarat Water Resources Development Corp Act; GGRC Guidelines',
    rwhMandatory: false, permitRequired: false, cgwaZone: 'safe',
  },
  // Uttar Pradesh
  {
    state: 'Uttar Pradesh', useCase: 'residential', sourceType: 'borewell',
    ruleText: 'UP Water Management and Regulatory Commission Act 2008 applies. Urban areas in 17 cities with declining groundwater are notified under CGWA. Buildings >300 sq.m. in Lucknow Municipal Corporation area must install RWH before getting completion certificate.',
    lawReference: 'UP Water Management Act 2008; LMC Bylaws 2014',
    rwhMandatory: true, permitRequired: true, cgwaZone: 'critical',
  },
  // Andhra Pradesh
  {
    state: 'Andhra Pradesh', useCase: 'agricultural', sourceType: 'borewell',
    ruleText: 'AP Ground Water (Regulation for Drinking Water Purposes) Act 1996 protects drinking water sources. Agricultural borewells must be registered with the District Water Management Agency. AP Micro-Irrigation Project (APMIP) promotes drip/sprinkler adoption.',
    lawReference: 'AP Groundwater Act 1996; APMIP Guidelines',
    rwhMandatory: false, permitRequired: false, cgwaZone: 'semi-critical',
  },
  // West Bengal
  {
    state: 'West Bengal', useCase: 'industrial', sourceType: 'borewell',
    ruleText: 'West Bengal Ground Water Resources (Management, Control and Regulation) Act 2005 requires permit for groundwater extraction exceeding prescribed limits. Industries must submit groundwater utilisation report annually to the WBGWRRA.',
    lawReference: 'WB Groundwater Act 2005, Section 10',
    rwhMandatory: false, permitRequired: true, cgwaZone: 'safe',
  },
  // Kerala
  {
    state: 'Kerala', useCase: 'residential', sourceType: 'borewell',
    ruleText: 'Kerala Ground Water (Control and Regulation) Act 2002 mandates registration of borewells. All borewells must be registered with the Kerala Water Authority. RWH is promoted but not yet universally mandatory — Thrissur and Ernakulam corporations mandate it for large buildings.',
    lawReference: 'Kerala Groundwater Act 2002; KWA Guidelines',
    rwhMandatory: false, permitRequired: true, cgwaZone: 'safe',
  },
  // Haryana
  {
    state: 'Haryana', useCase: 'agricultural', sourceType: 'borewell',
    ruleText: 'Haryana has notified 128 blocks as over-exploited or critical. New irrigation borewells in these blocks are banned without special permission. Haryana Mera Pani Meri Virasat scheme incentivises farmers to shift away from paddy to less water-intensive crops.',
    lawReference: 'Haryana Ground Water (Control & Regulation) Act 1985; CGWA Order 2018',
    rwhMandatory: false, permitRequired: true, cgwaZone: 'over-exploited',
  },
];

async function main() {
  console.log('🌊 Seeding AquaIQ database...');

  // Districts
  console.log('  → Districts...');
  for (const d of districts) {
    await prisma.district.upsert({
      where: { id: `${d.state}-${d.name}`.toLowerCase().replace(/\s+/g, '-') },
      update: d,
      create: { id: `${d.state}-${d.name}`.toLowerCase().replace(/\s+/g, '-'), ...d },
    });
  }

  // Food VWC
  console.log('  → Food VWC table...');
  await prisma.foodVwc.deleteMany();
  await prisma.foodVwc.createMany({ data: foodVwc });

  // Crops
  console.log('  → Crop water requirements...');
  await prisma.cropWaterRequirement.deleteMany();
  await prisma.cropWaterRequirement.createMany({ data: crops });

  // Legal rules
  console.log('  → Legal rules (10 states)...');
  await prisma.legalRule.deleteMany();
  await prisma.legalRule.createMany({ data: legalRules });

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
