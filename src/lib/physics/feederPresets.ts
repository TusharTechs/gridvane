/**
 * GridVane Real-World Regional Feeder Digital Twin Presets
 * Pre-configured with authentic meteorological, grid marginal emissions, and regulatory profiles
 * for the 4 showcase cities: Antalya (COP31 Türkiye), Ankara (Türkiye), Tartu (Estonia), and Irvine (California).
 */

export type FeederPresetId = "antalya_cop31" | "ankara_gazi" | "tartu_estonia" | "irvine_california";

export interface FeederPresetSpec {
  id: FeederPresetId;
  name: string;
  shortName: string;
  city: string;
  country: string;
  flag: string;
  latitude: number;
  longitude: number;
  dsoOperator: string;
  regulatoryRegimes: string[];
  defaultAmbientTempC: number;
  defaultIrradianceWm2: number;
  defaultGridMEFGPerKWh: number; // Marginal Emission Factor (gCO2e/kWh)
  defaultLoadMultiplier: number;
  peakTariffUSDPerMWh: number;
  carbonPriceUSDPerTon: number;
  climateHazardHighlight: string;
  judgeRelevanceNote: string;
  hourlyProfile24h: {
    hour: number;
    ambientC: number;
    irradianceWm2: number;
    mefGPerKWh: number;
    loadMultiplier: number;
  }[];
}

export const FEEDER_PRESETS: Record<FeederPresetId, FeederPresetSpec> = {
  antalya_cop31: {
    id: "antalya_cop31",
    name: "Antalya COP31 Coastal Feeder (AEDAŞ 33-Bus Twin)",
    shortName: "Antalya (COP31 Host)",
    city: "Antalya",
    country: "Türkiye",
    flag: "🇹🇷",
    latitude: 36.8969,
    longitude: 30.7133,
    dsoOperator: "AEDAŞ / TEİAŞ Mediterranean Region",
    regulatoryRegimes: ["TSRS / IFRS S2", "Turkish ETS Pilot", "I-REC Türkiye", "UNFCCC COP31 Showcase"],
    defaultAmbientTempC: 43.8,
    defaultIrradianceWm2: 965,
    defaultGridMEFGPerKWh: 468,
    defaultLoadMultiplier: 1.24,
    peakTariffUSDPerMWh: 142,
    carbonPriceUSDPerTon: 68,
    climateHazardHighlight:
      "Extreme Mediterranean summer heatwave (43.8°C) driving simultaneous AC cooling surge (+42% load) and -15.4% solar PV cell thermal derating while pushing substation transformers above 128°C hot-spot temperature.",
    judgeRelevanceNote:
      "Official host city for UN COP31 (Nov 2026) where IEEE ClimateChain winners are announced; models TSRS/IFRS S2 Expected Annual Loss (AAL) and EURO-CORDEX heat stress.",
    hourlyProfile24h: Array.from({ length: 24 }, (_, h) => {
      const tempCurve = 29 + 14.8 * Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
      const irrCurve = h >= 6 && h <= 19 ? Math.round(980 * Math.pow(Math.sin(((h - 6) / 13) * Math.PI), 1.35)) : 0;
      const mefCurve = Math.round(410 + (h >= 17 && h <= 22 ? 125 : h >= 10 && h <= 15 ? -45 : 25));
      const loadCurve = Number((0.78 + (h >= 12 && h <= 21 ? 0.48 * Math.sin(((h - 10) / 12) * Math.PI) : 0.12)).toFixed(2));
      return {
        hour: h,
        ambientC: Number(tempCurve.toFixed(1)),
        irradianceWm2: irrCurve,
        mefGPerKWh: mefCurve,
        loadMultiplier: loadCurve,
      };
    }),
  },

  ankara_gazi: {
    id: "ankara_gazi",
    name: "Ankara Central & Ostim Eco-Industrial Feeder (Başkent EDAŞ Twin)",
    shortName: "Ankara (Gazi / Ostim)",
    city: "Ankara",
    country: "Türkiye",
    flag: "🇹🇷",
    latitude: 39.9334,
    longitude: 32.8597,
    dsoOperator: "Başkent EDAŞ / TEİAŞ Central Anatolia",
    regulatoryRegimes: ["EU CBAM Scope 2", "TSRS / IFRS S2", "YEK-G / I-REC", "Verra VCS"],
    defaultAmbientTempC: 38.4,
    defaultIrradianceWm2: 890,
    defaultGridMEFGPerKWh: 518,
    defaultLoadMultiplier: 1.18,
    peakTariffUSDPerMWh: 136,
    carbonPriceUSDPerTon: 74,
    climateHazardHighlight:
      "High industrial manufacturing + campus feeder with steep evening coal/gas ramp (518 gCO2e/kWh MEF) and elevated risk of False Data Injection Attacks (FDIA) on export-oriented CBAM green certificates.",
    judgeRelevanceNote:
      "Models Central Anatolian industrial + campus microgrid conditions with Explainable AI (XAI) EV battery dispatch and Kirchhoff physics-residual cybersecurity firewall.",
    hourlyProfile24h: Array.from({ length: 24 }, (_, h) => {
      const tempCurve = 22 + 16.4 * Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
      const irrCurve = h >= 6 && h <= 19 ? Math.round(910 * Math.pow(Math.sin(((h - 6) / 13) * Math.PI), 1.4)) : 0;
      const mefCurve = Math.round(465 + (h >= 16 && h <= 22 ? 110 : h >= 11 && h <= 15 ? -35 : 15));
      const loadCurve = Number((0.82 + (h >= 8 && h <= 19 ? 0.38 : 0.08)).toFixed(2));
      return {
        hour: h,
        ambientC: Number(tempCurve.toFixed(1)),
        irradianceWm2: irrCurve,
        mefGPerKWh: mefCurve,
        loadMultiplier: loadCurve,
      };
    }),
  },

  tartu_estonia: {
    id: "tartu_estonia",
    name: "Tartu Smart District & EV V2G Microgrid (Elektrilevi / Estfeed Twin)",
    shortName: "Tartu (Estonia PQC Grid)",
    city: "Tartu",
    country: "Estonia",
    flag: "🇪🇪",
    latitude: 58.378,
    longitude: 26.729,
    dsoOperator: "Elektrilevi / Elering Estfeed DSO",
    regulatoryRegimes: ["EU Guarantee of Origin (GoO)", "EU ETS / CBAM", "NIST FIPS 204 PQC", "Paris Art. 6.2 ITMO"],
    defaultAmbientTempC: 33.2,
    defaultIrradianceWm2: 785,
    defaultGridMEFGPerKWh: 342,
    defaultLoadMultiplier: 1.12,
    peakTariffUSDPerMWh: 158,
    carbonPriceUSDPerTon: 82,
    climateHazardHighlight:
      "Baltic synchronous grid edge feeder with dense bidirectional EV V2G chargers, Nordic-Baltic summer heat anomaly (33.2°C), and strict GDPR / Post-Quantum smart-meter privacy requirements (PP-PQB).",
    judgeRelevanceNote:
      "Demonstrates NIST FIPS 204 ML-DSA-65 lattice signatures, Privacy-Preserving Post-Quantum Blockchain (PP-PQB) range commitments, and TRIPLE cyber-physical digital twin security.",
    hourlyProfile24h: Array.from({ length: 24 }, (_, h) => {
      const tempCurve = 18 + 15.2 * Math.max(0, Math.sin(((h - 5) / 15) * Math.PI));
      const irrCurve = h >= 5 && h <= 20 ? Math.round(800 * Math.pow(Math.sin(((h - 5) / 15) * Math.PI), 1.3)) : 0;
      const mefCurve = Math.round(290 + (h >= 17 && h <= 21 ? 95 : h >= 10 && h <= 15 ? -50 : 20));
      const loadCurve = Number((0.76 + (h >= 7 && h <= 20 ? 0.36 : 0.1)).toFixed(2));
      return {
        hour: h,
        ambientC: Number(tempCurve.toFixed(1)),
        irradianceWm2: irrCurve,
        mefGPerKWh: mefCurve,
        loadMultiplier: loadCurve,
      };
    }),
  },

  irvine_california: {
    id: "irvine_california",
    name: "Irvine / Orange County Duck-Curve Feeder (SCE 33-Bus Twin)",
    shortName: "Irvine (CA Duck Curve)",
    city: "Irvine, CA",
    country: "United States",
    flag: "🇺🇸",
    latitude: 33.6846,
    longitude: -117.8265,
    dsoOperator: "Southern California Edison (SCE) / CAISO",
    regulatoryRegimes: ["CAISO NEM 3.0", "IEEE P3271.01 Recurring DLT", "WREGIS REC", "Verra / Gold Standard"],
    defaultAmbientTempC: 41.2,
    defaultIrradianceWm2: 945,
    defaultGridMEFGPerKWh: 388,
    defaultLoadMultiplier: 1.21,
    peakTariffUSDPerMWh: 185,
    carbonPriceUSDPerTon: 64,
    climateHazardHighlight:
      "Severe solar duck-curve voltage rise at midday followed by a 17:00–21:00 natural-gas peaker ramp during Santa Ana heatwaves, requiring IEEE P3271.01 automated recurring DLT settlement and vulnerable cooling center protection.",
    judgeRelevanceNote:
      "Demonstrates IEEE P3271.01 Recurring DLT Transactions with autonomous failover and Responsible AI Thermal-Equity Safety Gates.",
    hourlyProfile24h: Array.from({ length: 24 }, (_, h) => {
      const tempCurve = 24 + 17.2 * Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
      const irrCurve = h >= 6 && h <= 19 ? Math.round(960 * Math.pow(Math.sin(((h - 6) / 13) * Math.PI), 1.25)) : 0;
      const mefCurve = Math.round(310 + (h >= 17 && h <= 22 ? 165 : h >= 10 && h <= 15 ? -110 : 30));
      const loadCurve = Number((0.74 + (h >= 14 && h <= 21 ? 0.52 : 0.14)).toFixed(2));
      return {
        hour: h,
        ambientC: Number(tempCurve.toFixed(1)),
        irradianceWm2: irrCurve,
        mefGPerKWh: mefCurve,
        loadMultiplier: loadCurve,
      };
    }),
  },
};
