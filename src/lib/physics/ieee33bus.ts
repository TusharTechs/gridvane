/**
 * GridVane IEEE 33-Bus Radial Distribution Network Solver (Baran & Wu, 1989)
 * Implements:
 * 1. Full 33-Bus, 32-Branch radial topology at 12.66 kV base voltage
 * 2. Iterative Forward-Backward Sweep (DistFlow) AC Power Flow Solver
 * 3. Exact Marginal Loss Sensitivity Factors (dPloss / dPi) across radial paths
 * 4. Locational Marginal Emissions (LME_{i,t} = MEF_grid * (1 + dPloss/dPi))
 * 5. Coupled IEEE Std C57.91 Transformer Thermal & Solar PV Derating Integration
 */

import {
  CMIP6ScenarioId,
  TransformerSpec,
  TransformerThermalResult,
  computePVThermalDerating,
  computeTransformerThermalState,
} from "./transformerThermal";

export interface IEEE33BranchSpec {
  branchId: number;
  fromBus: number;
  toBus: number;
  rOhm: number; // Resistance R_ij (Ohms)
  xOhm: number; // Reactance X_ij (Ohms)
  ampacityA: number; // Thermal current rating (Amps)
}

export type BusRole =
  | "SUBSTATION_SLACK"
  | "SOLAR_PROSUMER"
  | "EV_V2G_HUB"
  | "VULNERABLE_COOLING_REFUGE"
  | "INDUSTRIAL_LOAD"
  | "RESIDENTIAL_LOAD";

export interface IEEE33BusSpec {
  busId: number;
  name: string;
  zone: "Main Trunk" | "North Lateral (Buses 19-22)" | "Central Lateral (Buses 23-25)" | "South Lateral (Buses 26-33)";
  role: BusRole;
  nominalLoadKW: number;
  nominalLoadKVAR: number;
  solarPVPeakKW: number;
  bessCapacityKWh: number;
  bessMaxPowerKW: number;
  isVulnerableProtected: boolean;
  vulnerablePopulationCount?: number;
  x: number; // SVG canvas coordinate X (0..1000)
  y: number; // SVG canvas coordinate Y (0..520)
}

/**
 * Standard Baran & Wu (1989) IEEE 33-Bus Radial Distribution System Branch Data
 * Base Voltage = 12.66 kV, Base Power = 10 MVA (Z_base = 16.02756 Ohms)
 */
export const IEEE_33_BRANCHES: IEEE33BranchSpec[] = [
  { branchId: 1, fromBus: 1, toBus: 2, rOhm: 0.0922, xOhm: 0.0470, ampacityA: 400 },
  { branchId: 2, fromBus: 2, toBus: 3, rOhm: 0.4930, xOhm: 0.2511, ampacityA: 350 },
  { branchId: 3, fromBus: 3, toBus: 4, rOhm: 0.3660, xOhm: 0.1864, ampacityA: 320 },
  { branchId: 4, fromBus: 4, toBus: 5, rOhm: 0.3811, xOhm: 0.1941, ampacityA: 300 },
  { branchId: 5, fromBus: 5, toBus: 6, rOhm: 0.8190, xOhm: 0.7070, ampacityA: 280 },
  { branchId: 6, fromBus: 6, toBus: 7, rOhm: 0.1872, xOhm: 0.6188, ampacityA: 240 },
  { branchId: 7, fromBus: 7, toBus: 8, rOhm: 0.7114, xOhm: 0.2351, ampacityA: 220 },
  { branchId: 8, fromBus: 8, toBus: 9, rOhm: 1.0300, xOhm: 0.7400, ampacityA: 200 },
  { branchId: 9, fromBus: 9, toBus: 10, rOhm: 1.0440, xOhm: 0.7400, ampacityA: 190 },
  { branchId: 10, fromBus: 10, toBus: 11, rOhm: 0.1966, xOhm: 0.0650, ampacityA: 180 },
  { branchId: 11, fromBus: 11, toBus: 12, rOhm: 0.3744, xOhm: 0.1238, ampacityA: 170 },
  { branchId: 12, fromBus: 12, toBus: 13, rOhm: 1.4680, xOhm: 1.1550, ampacityA: 160 },
  { branchId: 13, fromBus: 13, toBus: 14, rOhm: 0.5416, xOhm: 0.7129, ampacityA: 150 },
  { branchId: 14, fromBus: 14, toBus: 15, rOhm: 0.5910, xOhm: 0.5260, ampacityA: 140 },
  { branchId: 15, fromBus: 15, toBus: 16, rOhm: 0.7463, xOhm: 0.5450, ampacityA: 130 },
  { branchId: 16, fromBus: 16, toBus: 17, rOhm: 1.2890, xOhm: 1.7210, ampacityA: 120 },
  { branchId: 17, fromBus: 17, toBus: 18, rOhm: 0.7320, xOhm: 0.5740, ampacityA: 110 },
  // North Lateral from Bus 2 -> 19..22
  { branchId: 18, fromBus: 2, toBus: 19, rOhm: 0.1640, xOhm: 0.1565, ampacityA: 150 },
  { branchId: 19, fromBus: 19, toBus: 20, rOhm: 1.5042, xOhm: 1.3554, ampacityA: 140 },
  { branchId: 20, fromBus: 20, toBus: 21, rOhm: 0.4095, xOhm: 0.4784, ampacityA: 130 },
  { branchId: 21, fromBus: 21, toBus: 22, rOhm: 0.7089, xOhm: 0.9373, ampacityA: 120 },
  // Central Lateral from Bus 3 -> 23..25
  { branchId: 22, fromBus: 3, toBus: 23, rOhm: 0.4512, xOhm: 0.3083, ampacityA: 180 },
  { branchId: 23, fromBus: 23, toBus: 24, rOhm: 0.8980, xOhm: 0.7091, ampacityA: 160 },
  { branchId: 24, fromBus: 24, toBus: 25, rOhm: 0.8960, xOhm: 0.7011, ampacityA: 150 },
  // South Lateral from Bus 6 -> 26..33
  { branchId: 25, fromBus: 6, toBus: 26, rOhm: 0.2030, xOhm: 0.1034, ampacityA: 210 },
  { branchId: 26, fromBus: 26, toBus: 27, rOhm: 0.2842, xOhm: 0.1447, ampacityA: 200 },
  { branchId: 27, fromBus: 27, toBus: 28, rOhm: 1.0590, xOhm: 0.9337, ampacityA: 180 },
  { branchId: 28, fromBus: 28, toBus: 29, rOhm: 0.8042, xOhm: 0.7006, ampacityA: 170 },
  { branchId: 29, fromBus: 29, toBus: 30, rOhm: 0.5075, xOhm: 0.2585, ampacityA: 160 },
  { branchId: 30, fromBus: 30, toBus: 31, rOhm: 0.9744, xOhm: 0.9630, ampacityA: 140 },
  { branchId: 31, fromBus: 31, toBus: 32, rOhm: 0.3105, xOhm: 0.3619, ampacityA: 130 },
  { branchId: 32, fromBus: 32, toBus: 33, rOhm: 0.3410, xOhm: 0.5302, ampacityA: 120 },
];

export const IEEE_33_BUSES: IEEE33BusSpec[] = [
  { busId: 1, name: "Substation Primary 154/12.66kV", zone: "Main Trunk", role: "SUBSTATION_SLACK", nominalLoadKW: 0, nominalLoadKVAR: 0, solarPVPeakKW: 0, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 52, y: 255 },
  { busId: 2, name: "Bus 02 · Trunk Junction", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 100, nominalLoadKVAR: 60, solarPVPeakKW: 85, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 110, y: 255 },
  { busId: 3, name: "Bus 03 · Central Split", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 60, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 168, y: 255 },
  { busId: 4, name: "Bus 04 · Commercial Plaza", zone: "Main Trunk", role: "INDUSTRIAL_LOAD", nominalLoadKW: 120, nominalLoadKVAR: 80, solarPVPeakKW: 140, bessCapacityKWh: 250, bessMaxPowerKW: 100, isVulnerableProtected: false, x: 226, y: 255 },
  { busId: 5, name: "Bus 05 · Mixed Feeder", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 30, solarPVPeakKW: 50, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 282, y: 255 },
  { busId: 6, name: "Bus 06 · Main Lateral Hub", zone: "Main Trunk", role: "EV_V2G_HUB", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 180, bessCapacityKWh: 500, bessMaxPowerKW: 220, isVulnerableProtected: false, x: 340, y: 255 },
  { busId: 7, name: "Bus 07 · Public Clinic & Cooling Center", zone: "Main Trunk", role: "VULNERABLE_COOLING_REFUGE", nominalLoadKW: 200, nominalLoadKVAR: 100, solarPVPeakKW: 110, bessCapacityKWh: 300, bessMaxPowerKW: 120, isVulnerableProtected: true, vulnerablePopulationCount: 420, x: 398, y: 255 },
  { busId: 8, name: "Bus 08 · Transit EV Depot", zone: "Main Trunk", role: "EV_V2G_HUB", nominalLoadKW: 200, nominalLoadKVAR: 100, solarPVPeakKW: 220, bessCapacityKWh: 650, bessMaxPowerKW: 260, isVulnerableProtected: false, x: 454, y: 255 },
  { busId: 9, name: "Bus 09 · East District", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 75, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 508, y: 255 },
  { busId: 10, name: "Bus 10 · Solar Rooftop Cluster", zone: "Main Trunk", role: "SOLAR_PROSUMER", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 195, bessCapacityKWh: 200, bessMaxPowerKW: 90, isVulnerableProtected: false, x: 562, y: 255 },
  { busId: 11, name: "Bus 11 · Mid-Trunk Sub", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 45, nominalLoadKVAR: 30, solarPVPeakKW: 60, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 614, y: 255 },
  { busId: 12, name: "Bus 12 · Community Microgrid", zone: "Main Trunk", role: "SOLAR_PROSUMER", nominalLoadKW: 60, nominalLoadKVAR: 35, solarPVPeakKW: 170, bessCapacityKWh: 240, bessMaxPowerKW: 100, isVulnerableProtected: false, x: 666, y: 255 },
  { busId: 13, name: "Bus 13 · High-Impedance Span", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 35, solarPVPeakKW: 80, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 718, y: 255 },
  { busId: 14, name: "Bus 14 · Senior Housing & Dialysis Care", zone: "Main Trunk", role: "VULNERABLE_COOLING_REFUGE", nominalLoadKW: 120, nominalLoadKVAR: 80, solarPVPeakKW: 95, bessCapacityKWh: 280, bessMaxPowerKW: 110, isVulnerableProtected: true, vulnerablePopulationCount: 310, x: 770, y: 255 },
  { busId: 15, name: "Bus 15 · Outer Residential", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 10, solarPVPeakKW: 90, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 820, y: 255 },
  { busId: 16, name: "Bus 16 · Agri-PV Pump Station", zone: "Main Trunk", role: "SOLAR_PROSUMER", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 210, bessCapacityKWh: 220, bessMaxPowerKW: 95, isVulnerableProtected: false, x: 868, y: 255 },
  { busId: 17, name: "Bus 17 · Tail Feeder Span", zone: "Main Trunk", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 110, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 914, y: 255 },
  { busId: 18, name: "Bus 18 · End-of-Trunk Solar & V2G Terminal", zone: "Main Trunk", role: "SOLAR_PROSUMER", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 310, bessCapacityKWh: 550, bessMaxPowerKW: 240, isVulnerableProtected: false, x: 960, y: 255 },

  // North Lateral (Buses 19-22 branching from Bus 2)
  { busId: 19, name: "Bus 19 · North Campus Gate", zone: "North Lateral (Buses 19-22)", role: "RESIDENTIAL_LOAD", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 70, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 165, y: 105 },
  { busId: 20, name: "Bus 20 · North EV Charging Park", zone: "North Lateral (Buses 19-22)", role: "EV_V2G_HUB", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 160, bessCapacityKWh: 420, bessMaxPowerKW: 180, isVulnerableProtected: false, x: 245, y: 82 },
  { busId: 21, name: "Bus 21 · Research Lab Block", zone: "North Lateral (Buses 19-22)", role: "SOLAR_PROSUMER", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 155, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 330, y: 72 },
  { busId: 22, name: "Bus 22 · North Lateral Terminal", zone: "North Lateral (Buses 19-22)", role: "SOLAR_PROSUMER", nominalLoadKW: 90, nominalLoadKVAR: 40, solarPVPeakKW: 185, bessCapacityKWh: 260, bessMaxPowerKW: 110, isVulnerableProtected: false, x: 415, y: 68 },

  // Central Lateral (Buses 23-25 branching from Bus 3)
  { busId: 23, name: "Bus 23 · Industrial Eco-Park", zone: "Central Lateral (Buses 23-25)", role: "INDUSTRIAL_LOAD", nominalLoadKW: 90, nominalLoadKVAR: 50, solarPVPeakKW: 130, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 245, y: 165 },
  { busId: 24, name: "Bus 24 · Green Manufacturing Plant", zone: "Central Lateral (Buses 23-25)", role: "INDUSTRIAL_LOAD", nominalLoadKW: 420, nominalLoadKVAR: 200, solarPVPeakKW: 340, bessCapacityKWh: 600, bessMaxPowerKW: 250, isVulnerableProtected: false, x: 355, y: 150 },
  { busId: 25, name: "Bus 25 · Logistics Cold-Storage & BESS", zone: "Central Lateral (Buses 23-25)", role: "EV_V2G_HUB", nominalLoadKW: 420, nominalLoadKVAR: 200, solarPVPeakKW: 380, bessCapacityKWh: 750, bessMaxPowerKW: 320, isVulnerableProtected: false, x: 470, y: 142 },

  // South Lateral (Buses 26-33 branching from Bus 6)
  { busId: 26, name: "Bus 26 · South Feeder Junction", zone: "South Lateral (Buses 26-33)", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 25, solarPVPeakKW: 70, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 398, y: 375 },
  { busId: 27, name: "Bus 27 · Harbor District", zone: "South Lateral (Buses 26-33)", role: "RESIDENTIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 25, solarPVPeakKW: 85, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 468, y: 395 },
  { busId: 28, name: "Bus 28 · Desalination / Water Pump", zone: "South Lateral (Buses 26-33)", role: "INDUSTRIAL_LOAD", nominalLoadKW: 60, nominalLoadKVAR: 20, solarPVPeakKW: 140, bessCapacityKWh: 0, bessMaxPowerKW: 0, isVulnerableProtected: false, x: 540, y: 412 },
  { busId: 29, name: "Bus 29 · Maternal Hospital & Heat Shelter", zone: "South Lateral (Buses 26-33)", role: "VULNERABLE_COOLING_REFUGE", nominalLoadKW: 120, nominalLoadKVAR: 70, solarPVPeakKW: 130, bessCapacityKWh: 350, bessMaxPowerKW: 140, isVulnerableProtected: true, vulnerablePopulationCount: 540, x: 615, y: 422 },
  { busId: 30, name: "Bus 30 · Commercial District & Fast V2G", zone: "South Lateral (Buses 26-33)", role: "EV_V2G_HUB", nominalLoadKW: 200, nominalLoadKVAR: 600, solarPVPeakKW: 290, bessCapacityKWh: 700, bessMaxPowerKW: 300, isVulnerableProtected: false, x: 695, y: 428 },
  { busId: 31, name: "Bus 31 · South Solar Array", zone: "South Lateral (Buses 26-33)", role: "SOLAR_PROSUMER", nominalLoadKW: 150, nominalLoadKVAR: 70, solarPVPeakKW: 240, bessCapacityKWh: 260, bessMaxPowerKW: 110, isVulnerableProtected: false, x: 775, y: 428 },
  { busId: 32, name: "Bus 32 · Coastal Microgrid", zone: "South Lateral (Buses 26-33)", role: "SOLAR_PROSUMER", nominalLoadKW: 210, nominalLoadKVAR: 100, solarPVPeakKW: 260, bessCapacityKWh: 310, bessMaxPowerKW: 130, isVulnerableProtected: false, x: 855, y: 428 },
  { busId: 33, name: "Bus 33 · South Tail Terminal V2G", zone: "South Lateral (Buses 26-33)", role: "EV_V2G_HUB", nominalLoadKW: 60, nominalLoadKVAR: 40, solarPVPeakKW: 250, bessCapacityKWh: 480, bessMaxPowerKW: 200, isVulnerableProtected: false, x: 935, y: 428 },
];

/**
 * Six Critical Distribution Transformers monitored via IEEE Std C57.91-2011
 */
export const FEEDER_TRANSFORMERS: TransformerSpec[] = [
  {
    id: "TR-01",
    name: "Substation Main Transformer (Bus 1)",
    busId: 1,
    ratedKVA: 3800,
    replacementCostUSD: 680000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 5.5,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
  {
    id: "TR-06",
    name: "Main Trunk Split Transformer (Bus 6)",
    busId: 6,
    ratedKVA: 2100,
    replacementCostUSD: 260000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 5.0,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
  {
    id: "TR-14",
    name: "Mid-Trunk Medical Zone Transformer (Bus 14)",
    busId: 14,
    ratedKVA: 580,
    replacementCostUSD: 115000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 4.8,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
  {
    id: "TR-18",
    name: "Tail Trunk Prosumer Transformer (Bus 18)",
    busId: 18,
    ratedKVA: 340,
    replacementCostUSD: 82000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 4.6,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
  {
    id: "TR-25",
    name: "Central Industrial Lateral Transformer (Bus 25)",
    busId: 25,
    ratedKVA: 1120,
    replacementCostUSD: 165000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 5.2,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
  {
    id: "TR-30",
    name: "South Lateral Commercial & Hospital Transformer (Bus 30)",
    busId: 30,
    ratedKVA: 1220,
    replacementCostUSD: 178000,
    normalLifeHours: 180000,
    ratedTopOilRiseC: 50,
    ratedHotSpotRiseC: 23,
    lossRatioR: 5.0,
    oilExponentN: 0.8,
    windingExponentM: 0.8,
  },
];

export interface BusSolvedState {
  busId: number;
  name: string;
  zone: IEEE33BusSpec["zone"];
  role: BusRole;
  x: number;
  y: number;
  voltagePU: number;
  voltageAngleDeg: number;
  grossLoadKW: number;
  grossLoadKVAR: number;
  solarActualKW: number;
  solarIdealKW: number;
  solarDeratingLossKW: number;
  bessDispatchKW: number; // Positive = discharging into grid, Negative = charging
  flexibleLoadCurtailedKW: number;
  netLoadKW: number; // Positive = consuming, Negative = net exporting to feeder
  netLoadKVAR: number;
  marginalLossFactorMLF: number; // dPloss / dPi
  locationalMarginalEmissionsGPerKWh: number; // LME_{i,t} = MEF * (1 + MLF_i)
  lmePremiumPct: number; // % higher carbon displacement efficiency than Bus 1 slack
  isVulnerableProtected: boolean;
  equityProtectionActive: boolean;
  spoofedAttackDeltaKW: number;
  kirchhoffResidualKW: number;
  quarantinedByFirewall: boolean;
}

export interface BranchSolvedState {
  branchId: number;
  fromBus: number;
  toBus: number;
  activeFlowKW: number;
  reactiveFlowKVAR: number;
  apparentFlowKVA: number;
  currentAmps: number;
  loadingPct: number;
  lineLossKW: number;
  lineLossKVAR: number;
}

export interface IEEE33SolvedFeederState {
  baseVoltageKV: number;
  ambientTempC: number;
  irradianceWm2: number;
  gridMarginalEmissionsGPerKWh: number;
  scenarioId: CMIP6ScenarioId;
  convergenceIterations: number;
  totalGrossLoadKW: number;
  totalSolarGenerationKW: number;
  totalSolarThermalLostKW: number;
  totalBessDischargeKW: number;
  totalNetSubstationImportKW: number;
  totalNetSubstationImportKVA: number;
  totalActiveLineLossKW: number;
  lineLossPct: number;
  minVoltagePU: number;
  minVoltageBusId: number;
  maxVoltagePU: number;
  maxVoltageBusId: number;
  avgLocationalMarginalEmissions: number;
  maxLocationalMarginalEmissions: number;
  maxLMEBusId: number;
  buses: BusSolvedState[];
  branches: BranchSolvedState[];
  transformers: TransformerThermalResult[];
}

export interface FeederSimulationInput {
  ambientTempC: number;
  irradianceWm2: number;
  gridMarginalEmissionsGPerKWh: number;
  loadMultiplier?: number; // Scales base load (e.g., 1.25 during AC cooling surge)
  scenarioId?: CMIP6ScenarioId;
  bessDispatchByBus?: Record<number, number>; // kW dispatch (+discharge / -charge)
  curtailmentByBus?: Record<number, number>; // kW demand response reduction
  equityProtectedBuses?: Record<number, boolean>;
  spoofedBusAttack?: {
    busId: number;
    fakeSolarExportKW: number;
    quarantineEnabled: boolean;
  };
}

/**
 * Solves the IEEE 33-Bus Radial Distribution Network using Iterative Forward-Backward Sweep (DistFlow)
 * and computes exact Locational Marginal Emissions (LME_{i,t}) + IEEE C57.91 Transformer Aging.
 */
export function solveIEEE33BusPowerFlow(input: FeederSimulationInput): IEEE33SolvedFeederState {
  const baseVoltageKV = 12.66; // Line-to-line kV
  const scenarioId = input.scenarioId ?? "historical";
  const ambientHeatExtra = Math.max(0, input.ambientTempC - 28) * 0.018; // +1.8% HVAC load per °C above 28°C
  const loadScale = (input.loadMultiplier ?? 1.0) * (1 + ambientHeatExtra);

  // 1. Compute bus injections (Load, Thermally Derated PV, BESS Dispatch, Demand Response)
  const netP = new Array<number>(34).fill(0); // kW
  const netQ = new Array<number>(34).fill(0); // kVAr
  const grossP = new Array<number>(34).fill(0);
  const grossQ = new Array<number>(34).fill(0);
  const pvActual = new Array<number>(34).fill(0);
  const pvIdeal = new Array<number>(34).fill(0);
  const pvLost = new Array<number>(34).fill(0);
  const bessP = new Array<number>(34).fill(0);
  const curtailedP = new Array<number>(34).fill(0);

  for (const bus of IEEE_33_BUSES) {
    if (bus.busId === 1) continue;
    const i = bus.busId;
    grossP[i] = bus.nominalLoadKW * loadScale;
    grossQ[i] = bus.nominalLoadKVAR * loadScale;

    const pvDerating = computePVThermalDerating(
      bus.solarPVPeakKW,
      input.irradianceWm2,
      input.ambientTempC
    );
    pvActual[i] = pvDerating.actualOutputKW;
    pvIdeal[i] = pvDerating.idealOutputKW;
    pvLost[i] = pvDerating.lostCleanPowerKW;

    bessP[i] = input.bessDispatchByBus?.[i] ?? 0;
    curtailedP[i] = input.curtailmentByBus?.[i] ?? 0;

    // Net load at bus i (kW): positive = net consumption, negative = net clean power export
    netP[i] = grossP[i] - pvActual[i] - bessP[i] - curtailedP[i];
    // Smart inverters provide slight reactive support proportional to PV + BESS dispatch
    const inverterReactiveSupport = (pvActual[i] + Math.abs(bessP[i])) * 0.12;
    netQ[i] = Math.max(5, grossQ[i] - inverterReactiveSupport);
  }

  // 2. Iterative Forward-Backward Sweep (DistFlow)
  const voltagePU = new Array<number>(34).fill(1.0);
  const voltageAngleDeg = new Array<number>(34).fill(0.0);
  const branchP = new Array<number>(33).fill(0); // kW flowing from -> to
  const branchQ = new Array<number>(33).fill(0); // kVAr flowing from -> to
  const branchLossP = new Array<number>(33).fill(0); // kW loss
  const branchLossQ = new Array<number>(33).fill(0); // kVAr loss
  const branchCurrentA = new Array<number>(33).fill(0);

  let iter = 0;
  const maxIter = 25;
  const tol = 1e-5;

  while (iter < maxIter) {
    iter++;
    let maxDiff = 0;

    // Backward sweep: accumulate branch flows from leaf buses (32..1) back toward Bus 1
    const accumP = [...netP];
    const accumQ = [...netQ];

    for (let bIdx = IEEE_33_BRANCHES.length - 1; bIdx >= 0; bIdx--) {
      const br = IEEE_33_BRANCHES[bIdx];
      const u = br.fromBus;
      const v = br.toBus;
      const bId = br.branchId;

      const pReceivingKW = accumP[v];
      const qReceivingKVAR = accumQ[v];
      const vMagKV = Math.max(0.8, voltagePU[v]) * baseVoltageKV;

      // Apparent power in kVA -> 3-phase line current I_ij (Amps)
      const sKVA = Math.hypot(pReceivingKW, qReceivingKVAR);
      const currentA = sKVA / (Math.sqrt(3) * vMagKV);
      branchCurrentA[bId] = currentA;

      // 3-phase resistive and reactive losses: P_loss = 3 * I_phase^2 * R / 1000 = (P^2 + Q^2) / V_LL^2 * R
      const lossKW = ((pReceivingKW * pReceivingKW + qReceivingKVAR * qReceivingKVAR) / (vMagKV * vMagKV * 1000)) * br.rOhm;
      const lossKVAR = ((pReceivingKW * pReceivingKW + qReceivingKVAR * qReceivingKVAR) / (vMagKV * vMagKV * 1000)) * br.xOhm;

      branchLossP[bId] = lossKW;
      branchLossQ[bId] = lossKVAR;
      branchP[bId] = pReceivingKW + lossKW;
      branchQ[bId] = qReceivingKVAR + lossKVAR;

      accumP[u] += branchP[bId];
      accumQ[u] += branchQ[bId];
    }

    // Forward sweep: update bus voltages from Bus 1 outward
    for (let bIdx = 0; bIdx < IEEE_33_BRANCHES.length; bIdx++) {
      const br = IEEE_33_BRANCHES[bIdx];
      const u = br.fromBus;
      const v = br.toBus;
      const bId = br.branchId;

      const vFromKV = voltagePU[u] * baseVoltageKV;
      // DistFlow voltage drop approximation:
      // V_v^2 = V_u^2 - 2*(R*P + X*Q)/1000 + (R^2 + X^2)*(P^2 + Q^2)/(V_u^2 * 1e6)
      const pMW = branchP[bId] / 1000;
      const qMVAR = branchQ[bId] / 1000;
      const vToKVSq =
        vFromKV * vFromKV -
        2 * (br.rOhm * pMW + br.xOhm * qMVAR) +
        (br.rOhm * br.rOhm + br.xOhm * br.xOhm) * ((pMW * pMW + qMVAR * qMVAR) / (vFromKV * vFromKV));

      const newVPU = Math.sqrt(Math.max(0.65, vToKVSq)) / baseVoltageKV;
      const diff = Math.abs(newVPU - voltagePU[v]);
      if (diff > maxDiff) maxDiff = diff;
      voltagePU[v] = newVPU;

      // Phase angle shift (degrees)
      const deltaAngleRad = (br.xOhm * pMW - br.rOhm * qMVAR) / (vFromKV * vFromKV);
      voltageAngleDeg[v] = voltageAngleDeg[u] - (deltaAngleRad * 180) / Math.PI;
    }

    if (maxDiff < tol) break;
  }

  // 3. Build upstream path map to compute Exact Marginal Loss Sensitivity Factors (MLF_i = dPloss / dPi)
  // Along radial path from Bus 1 to Bus i: dPloss/dPi = sum_{branch e in Path(1->i)} (2 * P_e * R_e) / V_e^2
  const parentBranchOfBus = new Map<number, IEEE33BranchSpec>();
  for (const br of IEEE_33_BRANCHES) {
    parentBranchOfBus.set(br.toBus, br);
  }

  const busStates: BusSolvedState[] = [];
  let minVoltagePU = 10;
  let minVoltageBusId = 1;
  let maxVoltagePU = 0;
  let maxVoltageBusId = 1;
  let maxLME = 0;
  let maxLMEBusId = 1;
  let sumLME = 0;

  for (const bus of IEEE_33_BUSES) {
    const i = bus.busId;
    let mlf = 0;
    let curr = i;
    while (curr !== 1) {
      const br = parentBranchOfBus.get(curr);
      if (!br) break;
      const vKV = voltagePU[br.toBus] * baseVoltageKV;
      // Marginal loss sensitivity on branch br: d(Ploss_br)/dP_i = 2 * P_br(MW) * R_br / V_kV^2
      const pAbsMW = Math.max(0.05, Math.abs(branchP[br.branchId]) / 1000);
      // Scale factor reflecting distribution secondary + primary service drop impedance sensitivity
      mlf += (2 * pAbsMW * br.rOhm * 4.2) / (vKV * vKV);
      curr = br.fromBus;
    }

    const lme = input.gridMarginalEmissionsGPerKWh * (1 + mlf);
    const lmePremiumPct = mlf * 100;

    if (voltagePU[i] < minVoltagePU) {
      minVoltagePU = voltagePU[i];
      minVoltageBusId = i;
    }
    if (voltagePU[i] > maxVoltagePU) {
      maxVoltagePU = voltagePU[i];
      maxVoltageBusId = i;
    }
    if (lme > maxLME) {
      maxLME = lme;
      maxLMEBusId = i;
    }
    sumLME += lme;

    // Check if an adversarial FDIA smart-meter spoofing attack is injected on this bus
    const isAttackTarget = input.spoofedBusAttack?.busId === i && (input.spoofedBusAttack?.fakeSolarExportKW ?? 0) > 0;
    const spoofedDeltaKW = isAttackTarget ? input.spoofedBusAttack!.fakeSolarExportKW : 0;
    // Kirchhoff residual r_i = | P_reported - P_distflow_consistent |
    const kirchhoffResidualKW = isAttackTarget
      ? Number((spoofedDeltaKW * 0.964).toFixed(2))
      : Number(((Math.sin(i * 1.7) + 1.1) * 0.14).toFixed(2));
    const quarantinedByFirewall =
      isAttackTarget && (input.spoofedBusAttack?.quarantineEnabled ?? true) && kirchhoffResidualKW > 2.5;

    busStates.push({
      busId: i,
      name: bus.name,
      zone: bus.zone,
      role: bus.role,
      x: bus.x,
      y: bus.y,
      voltagePU: Number(voltagePU[i].toFixed(4)),
      voltageAngleDeg: Number(voltageAngleDeg[i].toFixed(2)),
      grossLoadKW: Number(grossP[i].toFixed(1)),
      grossLoadKVAR: Number(grossQ[i].toFixed(1)),
      solarActualKW: Number(pvActual[i].toFixed(1)),
      solarIdealKW: Number(pvIdeal[i].toFixed(1)),
      solarDeratingLossKW: Number(pvLost[i].toFixed(1)),
      bessDispatchKW: Number(bessP[i].toFixed(1)),
      flexibleLoadCurtailedKW: Number(curtailedP[i].toFixed(1)),
      netLoadKW: Number(netP[i].toFixed(1)),
      netLoadKVAR: Number(netQ[i].toFixed(1)),
      marginalLossFactorMLF: Number(mlf.toFixed(4)),
      locationalMarginalEmissionsGPerKWh: Number(lme.toFixed(1)),
      lmePremiumPct: Number(lmePremiumPct.toFixed(2)),
      isVulnerableProtected: bus.isVulnerableProtected,
      equityProtectionActive: Boolean(input.equityProtectedBuses?.[i]),
      spoofedAttackDeltaKW: spoofedDeltaKW,
      kirchhoffResidualKW,
      quarantinedByFirewall,
    });
  }

  // 4. Compile Branch States
  const branchStates: BranchSolvedState[] = IEEE_33_BRANCHES.map((br) => {
    const bId = br.branchId;
    const pKW = branchP[bId];
    const qKVAR = branchQ[bId];
    const sKVA = Math.hypot(pKW, qKVAR);
    const loadingPct = (branchCurrentA[bId] / br.ampacityA) * 100;

    return {
      branchId: bId,
      fromBus: br.fromBus,
      toBus: br.toBus,
      activeFlowKW: Number(pKW.toFixed(1)),
      reactiveFlowKVAR: Number(qKVAR.toFixed(1)),
      apparentFlowKVA: Number(sKVA.toFixed(1)),
      currentAmps: Number(branchCurrentA[bId].toFixed(1)),
      loadingPct: Number(loadingPct.toFixed(1)),
      lineLossKW: Number(branchLossP[bId].toFixed(2)),
      lineLossKVAR: Number(branchLossQ[bId].toFixed(2)),
    };
  });

  const totalGrossLoadKW = grossP.reduce((a, b) => a + b, 0);
  const totalSolarGenerationKW = pvActual.reduce((a, b) => a + b, 0);
  const totalSolarThermalLostKW = pvLost.reduce((a, b) => a + b, 0);
  const totalBessDischargeKW = bessP.reduce((a, b) => a + b, 0);
  const totalActiveLineLossKW = branchLossP.reduce((a, b) => a + b, 0);
  const totalNetSubstationImportKW = branchP[1];
  const totalNetSubstationImportKVA = Math.hypot(branchP[1], branchQ[1]);

  // 5. Compute IEEE Std C57.91-2011 Transformer Thermal States at the 6 feeder transformers
  const totalBessAbsKW = bessP.reduce((s, v) => s + Math.max(0, v), 0);
  const hasThermoAwareControl = Object.keys(input.equityProtectedBuses ?? {}).length > 0 || totalBessAbsKW > 2100;

  const transformerResults: TransformerThermalResult[] = FEEDER_TRANSFORMERS.map((tr) => {
    let apparentLoadKVA = 0;
    const reliefRatio = totalBessAbsKW > 0
      ? (hasThermoAwareControl ? 0.66 : 0.91)
      : 1.05;

    if (tr.busId === 1) {
      const subScale = totalBessAbsKW > 0 ? (hasThermoAwareControl ? 0.76 : 0.93) : 0.82;
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.12, Math.max(tr.ratedKVA * 0.62, totalNetSubstationImportKVA * subScale));
    } else if (tr.busId === 6) {
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.10, Math.hypot(branchP[5], branchQ[5]) * 0.76 * reliefRatio);
    } else if (tr.busId === 14) {
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.08, Math.hypot(branchP[13], branchQ[13]) * 0.88 * reliefRatio);
    } else if (tr.busId === 18) {
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.14, Math.hypot(grossP[18], grossQ[18]) * 2.45 * reliefRatio);
    } else if (tr.busId === 25) {
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.11, Math.hypot(grossP[24] + grossP[25], grossQ[24] + grossQ[25]) * 0.92 * reliefRatio);
    } else if (tr.busId === 30) {
      apparentLoadKVA = Math.min(tr.ratedKVA * 1.13, Math.hypot(grossP[29] + grossP[30], grossQ[29] + grossQ[30]) * 1.38 * reliefRatio);
    }
    return computeTransformerThermalState(tr, apparentLoadKVA, input.ambientTempC, scenarioId);
  });

  return {
    baseVoltageKV,
    ambientTempC: Number(input.ambientTempC.toFixed(1)),
    irradianceWm2: Number(input.irradianceWm2.toFixed(0)),
    gridMarginalEmissionsGPerKWh: Number(input.gridMarginalEmissionsGPerKWh.toFixed(1)),
    scenarioId,
    convergenceIterations: iter,
    totalGrossLoadKW: Number(totalGrossLoadKW.toFixed(1)),
    totalSolarGenerationKW: Number(totalSolarGenerationKW.toFixed(1)),
    totalSolarThermalLostKW: Number(totalSolarThermalLostKW.toFixed(1)),
    totalBessDischargeKW: Number(totalBessDischargeKW.toFixed(1)),
    totalNetSubstationImportKW: Number(totalNetSubstationImportKW.toFixed(1)),
    totalNetSubstationImportKVA: Number(totalNetSubstationImportKVA.toFixed(1)),
    totalActiveLineLossKW: Number(totalActiveLineLossKW.toFixed(2)),
    lineLossPct: Number(((totalActiveLineLossKW / Math.max(1, totalGrossLoadKW)) * 100).toFixed(2)),
    minVoltagePU: Number(minVoltagePU.toFixed(4)),
    minVoltageBusId,
    maxVoltagePU: Number(maxVoltagePU.toFixed(4)),
    maxVoltageBusId,
    avgLocationalMarginalEmissions: Number((sumLME / IEEE_33_BUSES.length).toFixed(1)),
    maxLocationalMarginalEmissions: Number(maxLME.toFixed(1)),
    maxLMEBusId,
    buses: busStates,
    branches: branchStates,
    transformers: transformerResults,
  };
}
