/**
 * GridVane Thermal Physics Engine
 * Implements:
 * 1. IEEE Std C57.91-2011: Guide for Loading Mineral-Oil-Immersed Transformers
 * 2. Solar PV Cell Temperature & Thermal Derating Physics (IEC 61215 / NOCT Model)
 * 3. EV / BESS Lithium-Ion SEI Layer Arrhenius Thermal Degradation Model
 * 4. CMIP6 / CORDEX Physical Climate Risk Expected Annual Loss (AAL) for TSRS / IFRS S2
 */

export type CMIP6ScenarioId = "historical" | "ssp2_45" | "ssp5_85";

export interface CMIP6ScenarioSpec {
  id: CMIP6ScenarioId;
  name: string;
  label: string;
  horizon: string;
  ambientDeltaC: number;
  heatwaveDaysPerYear: number;
  irradianceVolatilityFactor: number;
  description: string;
}

export const CMIP6_SCENARIOS: Record<CMIP6ScenarioId, CMIP6ScenarioSpec> = {
  historical: {
    id: "historical",
    name: "ERA5 Baseline (1991–2020)",
    label: "ERA5 Baseline",
    horizon: "Current Baseline",
    ambientDeltaC: 0,
    heatwaveDaysPerYear: 14,
    irradianceVolatilityFactor: 1.0,
    description: "ECMWF ERA5 historical reanalysis baseline for regional distribution transformer sizing.",
  },
  ssp2_45: {
    id: "ssp2_45",
    name: "CMIP6 SSP2-4.5 (2035 Intermediate)",
    label: "SSP2-4.5 (2035)",
    horizon: "2035 Mid-Term",
    ambientDeltaC: 2.4,
    heatwaveDaysPerYear: 38,
    irradianceVolatilityFactor: 1.08,
    description: "EURO-CORDEX / CMIP6 intermediate pathway (+2.4°C peak summer anomaly, 38 extreme heat days/yr).",
  },
  ssp5_85: {
    id: "ssp5_85",
    name: "CMIP6 SSP5-8.5 (2050 Extreme Heat)",
    label: "SSP5-8.5 (2050)",
    horizon: "2050 High-Emission",
    ambientDeltaC: 4.8,
    heatwaveDaysPerYear: 74,
    irradianceVolatilityFactor: 1.16,
    description: "High-emissions extreme thermal stress pathway (+4.8°C summer anomaly, 74 extreme heat days/yr).",
  },
};

export interface TransformerSpec {
  id: string;
  name: string;
  busId: number;
  ratedKVA: number;
  replacementCostUSD: number;
  normalLifeHours: number; // IEEE Std C57.91-2011 Table 3: 180,000 hrs (20.55 yrs) for thermally upgraded paper
  ratedTopOilRiseC: number; // Default 55°C
  ratedHotSpotRiseC: number; // Default 25°C (80°C total rise above 30°C ambient = 110°C rated hot-spot)
  lossRatioR: number; // Ratio of load loss at rated load to no-load loss (typical distribution = 5.0)
  oilExponentN: number; // ONAN cooling = 0.8
  windingExponentM: number; // ONAN cooling = 0.8
}

export interface TransformerThermalResult {
  transformerId: string;
  name: string;
  busId: number;
  ratedKVA: number;
  apparentLoadKVA: number;
  loadRatioK: number; // K = S / S_rated
  ambientTempC: number; // Theta_A
  topOilRiseC: number; // Delta Theta_TO
  hotSpotRiseC: number; // Delta Theta_H
  hotSpotTempC: number; // Theta_H = Theta_A + Delta Theta_TO + Delta Theta_H
  agingAccelerationFactorFAA: number; // F_AA = exp(15000/383 - 15000/(Theta_H + 273))
  lossOfLifePctPerHour: number; // (F_AA * 1 hr / 180,000) * 100
  hourlyAcceleratedDepreciationUSD: number;
  expectedAnnualLossUSD: number; // AAL under active CMIP6 scenario
  thermalStatus: "NOMINAL" | "ELEVATED" | "CRITICAL_AGING" | "EMERGENCY_OVERLOAD";
}

/**
 * Solves IEEE Std C57.91-2011 Clause 7 thermal equations for mineral-oil-immersed transformers.
 * Reference hot-spot temperature for thermally upgraded insulation paper = 110°C (383 K).
 */
export function computeTransformerThermalState(
  spec: TransformerSpec,
  apparentLoadKVA: number,
  ambientTempC: number,
  scenarioId: CMIP6ScenarioId = "historical"
): TransformerThermalResult {
  const scenario = CMIP6_SCENARIOS[scenarioId];
  const loadRatioK = Math.max(0.05, apparentLoadKVA / spec.ratedKVA);

  // Ultimate top-oil rise above ambient (IEEE C57.91 Eq. 5)
  const topOilRiseC =
    spec.ratedTopOilRiseC *
    Math.pow((loadRatioK * loadRatioK * spec.lossRatioR + 1) / (spec.lossRatioR + 1), spec.oilExponentN);

  // Winding hottest-spot rise over top-oil temperature (IEEE C57.91 Eq. 9)
  const hotSpotRiseC = spec.ratedHotSpotRiseC * Math.pow(loadRatioK, 2 * spec.windingExponentM);

  // Total winding hottest-spot temperature Theta_H (°C)
  // Include solar enclosure radiative heating effect on pad/pole transformers during daytime heatwaves
  const radiativeEnclosureAddC = ambientTempC > 35 ? (ambientTempC - 35) * 0.35 : 0;
  const hotSpotTempC = ambientTempC + radiativeEnclosureAddC + topOilRiseC + hotSpotRiseC;

  // IEEE Std C57.91-2011 Eq. 2: Arrhenius Aging Acceleration Factor (F_AA)
  // F_AA = exp( 15000 / 383 - 15000 / (Theta_H + 273) )
  // Reference: 110°C + 273 = 383 K -> F_AA = 1.0 at Theta_H = 110°C
  const rawFAA = Math.exp(15000 / 383 - 15000 / (hotSpotTempC + 273));
  // Clamp solely to prevent numerical overflow at extreme unphysical states
  const agingAccelerationFactorFAA = Math.min(250, Math.max(0.001, rawFAA));

  // Normal insulation life = 180,000 hours (IEEE C57.91-2011)
  const lossOfLifePctPerHour = (agingAccelerationFactorFAA / spec.normalLifeHours) * 100;

  // Hourly economic depreciation cost (USD/hr)
  const baseHourlyCost = spec.replacementCostUSD / spec.normalLifeHours;
  const hourlyAcceleratedDepreciationUSD = baseHourlyCost * agingAccelerationFactorFAA;

  // Expected Annual Loss (AAL) in USD for TSRS / IFRS S2 Physical Risk Disclosure:
  // Combines peak heatwave hours/yr (6 peak hours/day * scenario heatwaveDaysPerYear) + non-heatwave baseline
  const peakHeatwaveHoursPerYear = scenario.heatwaveDaysPerYear * 6;
  const nonPeakHoursPerYear = 8760 - peakHeatwaveHoursPerYear;
  const expectedAnnualLossUSD =
    hourlyAcceleratedDepreciationUSD * peakHeatwaveHoursPerYear +
    baseHourlyCost * 0.45 * nonPeakHoursPerYear;

  let thermalStatus: TransformerThermalResult["thermalStatus"] = "NOMINAL";
  if (hotSpotTempC >= 130 || agingAccelerationFactorFAA >= 8.0) {
    thermalStatus = "EMERGENCY_OVERLOAD";
  } else if (hotSpotTempC >= 110 || agingAccelerationFactorFAA >= 1.0) {
    thermalStatus = "CRITICAL_AGING";
  } else if (hotSpotTempC >= 95 || agingAccelerationFactorFAA >= 0.25) {
    thermalStatus = "ELEVATED";
  }

  return {
    transformerId: spec.id,
    name: spec.name,
    busId: spec.busId,
    ratedKVA: spec.ratedKVA,
    apparentLoadKVA: Number(apparentLoadKVA.toFixed(2)),
    loadRatioK: Number(loadRatioK.toFixed(3)),
    ambientTempC: Number(ambientTempC.toFixed(1)),
    topOilRiseC: Number(topOilRiseC.toFixed(2)),
    hotSpotRiseC: Number(hotSpotRiseC.toFixed(2)),
    hotSpotTempC: Number(hotSpotTempC.toFixed(2)),
    agingAccelerationFactorFAA: Number(agingAccelerationFactorFAA.toFixed(4)),
    lossOfLifePctPerHour: Number(lossOfLifePctPerHour.toFixed(6)),
    hourlyAcceleratedDepreciationUSD: Number(hourlyAcceleratedDepreciationUSD.toFixed(2)),
    expectedAnnualLossUSD: Number(expectedAnnualLossUSD.toFixed(2)),
    thermalStatus,
  };
}

export interface PVThermalDeratingResult {
  ambientTempC: number;
  irradianceWm2: number;
  cellTempC: number;
  thermalEfficiencyMultiplier: number; // e.g., 0.838 means -16.2% thermal loss
  deratingPct: number; // e.g., 16.2% loss relative to 25°C STC
  idealOutputKW: number;
  actualOutputKW: number;
  lostCleanPowerKW: number;
}

/**
 * Computes Solar PV cell temperature and thermal power derating using the Ross / IEC 61215 NOCT model:
 * T_cell = T_ambient + ((NOCT - 20) / 800) * G
 * P_actual = P_STC * (G / 1000) * [1 + gamma * (T_cell - 25)]
 * where NOCT = 45°C, gamma = -0.0042 / °C (-0.42%/°C for crystalline silicon)
 */
export function computePVThermalDerating(
  ratedPeakKW: number,
  irradianceWm2: number,
  ambientTempC: number,
  noctC: number = 45,
  gammaPerC: number = -0.0042
): PVThermalDeratingResult {
  if (irradianceWm2 <= 0 || ratedPeakKW <= 0) {
    return {
      ambientTempC,
      irradianceWm2: 0,
      cellTempC: ambientTempC,
      thermalEfficiencyMultiplier: 1,
      deratingPct: 0,
      idealOutputKW: 0,
      actualOutputKW: 0,
      lostCleanPowerKW: 0,
    };
  }

  const cellTempC = ambientTempC + ((noctC - 20) / 800) * irradianceWm2;
  const deltaSTC = Math.max(0, cellTempC - 25);
  const thermalEfficiencyMultiplier = Math.max(0.55, 1 + gammaPerC * deltaSTC);
  const idealOutputKW = ratedPeakKW * (irradianceWm2 / 1000);
  const actualOutputKW = idealOutputKW * thermalEfficiencyMultiplier;
  const lostCleanPowerKW = Math.max(0, idealOutputKW - actualOutputKW);
  const deratingPct = (1 - thermalEfficiencyMultiplier) * 100;

  return {
    ambientTempC: Number(ambientTempC.toFixed(1)),
    irradianceWm2: Number(irradianceWm2.toFixed(0)),
    cellTempC: Number(cellTempC.toFixed(1)),
    thermalEfficiencyMultiplier: Number(thermalEfficiencyMultiplier.toFixed(4)),
    deratingPct: Number(deratingPct.toFixed(2)),
    idealOutputKW: Number(idealOutputKW.toFixed(2)),
    actualOutputKW: Number(actualOutputKW.toFixed(2)),
    lostCleanPowerKW: Number(lostCleanPowerKW.toFixed(2)),
  };
}

/**
 * Computes EV / BESS Lithium-Ion Battery Thermal Stress & Cycle Degradation Cost
 * Based on Arrhenius SEI film growth at elevated battery pack temperatures + C-rate stress
 * (Directly aligned with Assoc. Prof. Dr. Saadin Oyucu's EV Li-ion Battery Management research)
 */
export function computeEVBatteryThermalDegradation(
  capacityKWh: number,
  dispatchPowerKW: number,
  ambientTempC: number,
  packReplacementCostPerKWh: number = 135
): {
  packTempC: number;
  cRate: number;
  arrheniusStressMultiplier: number;
  degradationCostUSDPerHour: number;
  sohImpactPpm: number;
} {
  const cRate = capacityKWh > 0 ? Math.abs(dispatchPowerKW) / capacityKWh : 0;
  // Internal Joule heating + ambient coupling
  const packTempC = Math.min(58, Math.max(20, ambientTempC * 0.78 + 7 + cRate * 8.5));
  // Reference optimal temperature = 25°C (298.15 K)
  const arrheniusStressMultiplier = Math.exp(2800 * (1 / 298.15 - 1 / (packTempC + 273.15)));
  // Baseline cycle life = 3500 full equivalent cycles
  const equivalentCyclePerHour = Math.abs(dispatchPowerKW) / (2 * Math.max(1, capacityKWh));
  const sohLossFraction = (equivalentCyclePerHour / 3500) * arrheniusStressMultiplier;
  const degradationCostUSDPerHour = sohLossFraction * capacityKWh * packReplacementCostPerKWh;

  return {
    packTempC: Number(packTempC.toFixed(1)),
    cRate: Number(cRate.toFixed(2)),
    arrheniusStressMultiplier: Number(arrheniusStressMultiplier.toFixed(3)),
    degradationCostUSDPerHour: Number(degradationCostUSDPerHour.toFixed(3)),
    sohImpactPpm: Number((sohLossFraction * 1_000_000).toFixed(2)),
  };
}
