"use client";

import React, { useState, useMemo } from "react";
import {
  FEEDER_PRESETS,
  FeederPresetId,
} from "@/lib/physics/feederPresets";
import {
  CMIP6_SCENARIOS,
  CMIP6ScenarioId,
} from "@/lib/physics/transformerThermal";
import {
  runThermoCarbonVPPOptimizer,
  VPPDispatchMode,
} from "@/lib/optimizer/vppOptimizer";
import {
  AdversarialAttackType,
  evaluateKirchhoffFirewall,
} from "@/lib/security/kirchhoffFirewall";
import { FeederTopologyMap } from "@/components/FeederTopologyMap";
import { TransformerThermalPanel } from "@/components/TransformerThermalPanel";
import { KirchhoffAndPQCPanel } from "@/components/KirchhoffAndPQCPanel";
import { XAIAndEquityPanel } from "@/components/XAIAndEquityPanel";
import { SettlementAndSiloPanel } from "@/components/SettlementAndSiloPanel";
import { GridBenchAndJudgesPanel } from "@/components/GridBenchAndJudgesPanel";
import {
  Zap,
  Flame,
  ShieldCheck,
  ShieldAlert,
  BrainCircuit,
  Link2,
  BarChart3,
  CloudSun,
  HeartPulse,
  KeyRound,
  Sparkles,
} from "lucide-react";

type CockpitTabId =
  | "THERMAL_C57"
  | "KIRCHHOFF_PQC"
  | "XAI_EQUITY"
  | "P3271_SILOS"
  | "GRIDBENCH_RUBRIC";

export default function GridVaneCockpitPage() {
  // Regional Feeder Twin State
  const [feederId, setFeederId] = useState<FeederPresetId>("antalya_cop31");
  const preset = FEEDER_PRESETS[feederId];

  // Physical Environment & Scenario State
  const [ambientTempC, setAmbientTempC] = useState<number>(preset.defaultAmbientTempC);
  const [irradianceWm2, setIrradianceWm2] = useState<number>(preset.defaultIrradianceWm2);
  const [gridMEF, setGridMEF] = useState<number>(preset.defaultGridMEFGPerKWh);
  const [scenarioId, setScenarioId] = useState<CMIP6ScenarioId>("ssp2_45");
  const [vppMode, setVppMode] = useState<VPPDispatchMode>("GRIDVANE_THERMO_CARBON_VPP");
  const [equityGateEnabled, setEquityGateEnabled] = useState<boolean>(true);

  // Selected Bus & Red-Team Security State
  const [selectedBusId, setSelectedBusId] = useState<number>(18);
  const [attackType, setAttackType] = useState<AdversarialAttackType>("NONE");
  const [spoofKW, setSpoofKW] = useState<number>(0);
  const [firewallEnabled, setFirewallEnabled] = useState<boolean>(true);

  // Active Deep-Dive Tab
  const [activeTab, setActiveTab] = useState<CockpitTabId>("THERMAL_C57");

  // Live Open-Meteo Weather Fetch Status
  const [weatherSyncStatus, setWeatherSyncStatus] = useState<string>("ERA5 Heatwave Preset");
  const [isFetchingWeather, setIsFetchingWeather] = useState<boolean>(false);

  // Switch feeder preset handler
  function handleSelectFeeder(newId: FeederPresetId) {
    const p = FEEDER_PRESETS[newId];
    setFeederId(newId);
    setAmbientTempC(p.defaultAmbientTempC);
    setIrradianceWm2(p.defaultIrradianceWm2);
    setGridMEF(p.defaultGridMEFGPerKWh);
    setWeatherSyncStatus(`${p.city} Heatwave Benchmark`);
  }

  // Live Open-Meteo API Sync
  async function handleFetchLiveWeather() {
    setIsFetchingWeather(true);
    try {
      const res = await fetch(`/api/weather?feeder=${feederId}`);
      const data = await res.json();
      if (typeof data.ambientTempC === "number") {
        setAmbientTempC(Number(data.ambientTempC.toFixed(1)));
      }
      if (typeof data.irradianceWm2 === "number") {
        setIrradianceWm2(Math.round(data.irradianceWm2));
      }
      setWeatherSyncStatus(
        data.source === "OPEN_METEO_LIVE_API"
          ? `Live Open-Meteo (${preset.city})`
          : `ERA5 Cache (${preset.city})`
      );
    } catch {
      setWeatherSyncStatus(`ERA5 Cache (${preset.city})`);
    } finally {
      setIsFetchingWeather(false);
    }
  }

  // Run Coupled IEEE 33-Bus Power Flow + Thermo-Carbon VPP Optimizer
  const vppResult = useMemo(() => {
    const scenarioDelta = CMIP6_SCENARIOS[scenarioId].ambientDeltaC;
    const effectiveAmbient = Number(
      Math.min(50, ambientTempC + (scenarioId === "historical" ? 0 : scenarioDelta * 0.35)).toFixed(1)
    );

    return runThermoCarbonVPPOptimizer({
      ambientTempC: effectiveAmbient,
      irradianceWm2,
      gridMarginalEmissionsGPerKWh: gridMEF,
      loadMultiplier: preset.defaultLoadMultiplier,
      scenarioId,
      activeMode: vppMode,
      equityGateEnabled,
      spoofedBusAttack:
        attackType !== "NONE" && spoofKW > 0
          ? {
              busId: selectedBusId,
              fakeSolarExportKW: spoofKW,
              quarantineEnabled: firewallEnabled,
            }
          : undefined,
    });
  }, [
    ambientTempC,
    irradianceWm2,
    gridMEF,
    preset.defaultLoadMultiplier,
    scenarioId,
    vppMode,
    equityGateEnabled,
    attackType,
    spoofKW,
    selectedBusId,
    firewallEnabled,
  ]);

  // Run Kirchhoff Physics-Residual Firewall Audit
  const firewallReport = useMemo(() => {
    return evaluateKirchhoffFirewall(
      vppResult.activeState,
      attackType,
      selectedBusId,
      spoofKW,
      firewallEnabled
    );
  }, [vppResult.activeState, attackType, selectedBusId, spoofKW, firewallEnabled]);

  const { metricsComparison, activeState } = vppResult;

  return (
    <div className="min-h-screen bg-grid-bg text-slate-100 pb-14">
      {/* Top Mission Control Navigation Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#060B14]/90 border-b border-grid-border px-4 lg:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title & Hackathon Track Badges */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-slate-900 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold tracking-tight text-white">
                  GRIDVANE
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Track 2: Renewable Energy &amp; VPP
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  + Tracks 1 (Carbon LME) · 4 (CORDEX/TSRS) · 3 (EV Circular)
                </span>
                <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  COP31 Antalya Showcase
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Physics-Verified, Quantum-Safe Thermo-Carbon VPP &amp; Triple-Silo Grid Resilience Ledger
              </p>
            </div>
          </div>

          {/* 4 Regional Feeder Digital Twin Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            {(Object.keys(FEEDER_PRESETS) as FeederPresetId[]).map((id) => {
              const p = FEEDER_PRESETS[id];
              const active = feederId === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectFeeder(id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 font-bold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{p.flag}</span>
                  <span>{p.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-4 space-y-4">
        {/* Global Cyber-Physical Control & Scenario Bar */}
        <section className="bg-grid-panel border border-grid-border rounded-xl p-4 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            {/* 1. Ambient Heatwave Slider */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Ambient Temp (Θ_A)
                </span>
                <span
                  className={`font-mono font-bold ${
                    ambientTempC >= 40 ? "text-rose-400" : "text-amber-300"
                  }`}
                >
                  {ambientTempC.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={48}
                step={0.5}
                value={ambientTempC}
                onChange={(e) => setAmbientTempC(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>20°C Mild</span>
                <span>35°C Hot</span>
                <span>48°C Extreme</span>
              </div>
            </div>

            {/* 2. Solar Irradiance Slider */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <CloudSun className="w-3.5 h-3.5 text-cyan-400" /> Irradiance (G_t)
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {irradianceWm2} W/m²
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={1050}
                step={15}
                value={irradianceWm2}
                onChange={(e) => setIrradianceWm2(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>100 (Cloud)</span>
                <span>600</span>
                <span>1050 W/m²</span>
              </div>
            </div>

            {/* 3. CMIP6 Climate Pathway Selector */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                CMIP6 / CORDEX Risk Horizon
              </label>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                {(Object.keys(CMIP6_SCENARIOS) as CMIP6ScenarioId[]).map((scKey) => {
                  const sc = CMIP6_SCENARIOS[scKey];
                  const active = scenarioId === scKey;
                  return (
                    <button
                      key={scKey}
                      onClick={() => setScenarioId(scKey)}
                      className={`py-1 px-1.5 rounded border text-center transition ${
                        active
                          ? "bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {sc.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                {CMIP6_SCENARIOS[scenarioId].name}
              </div>
            </div>

            {/* 4. VPP Dispatch Strategy Mode */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Active Control Regime
              </label>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setVppMode("UNCONTROLLED_BASELINE")}
                  className={`py-1 px-1.5 rounded border transition ${
                    vppMode === "UNCONTROLLED_BASELINE"
                      ? "bg-rose-500/20 text-rose-200 border-rose-500/50 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  Baseline
                </button>
                <button
                  onClick={() => setVppMode("NAIVE_CARBON_ONLY_VPP")}
                  className={`py-1 px-1.5 rounded border transition ${
                    vppMode === "NAIVE_CARBON_ONLY_VPP"
                      ? "bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  Naive VPP
                </button>
                <button
                  onClick={() => setVppMode("GRIDVANE_THERMO_CARBON_VPP")}
                  className={`py-1 px-1.5 rounded border transition ${
                    vppMode === "GRIDVANE_THERMO_CARBON_VPP"
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50 font-bold"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  GridVane
                </button>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1 truncate">
                {vppMode === "GRIDVANE_THERMO_CARBON_VPP"
                  ? "Thermo-Carbon + Equity Active"
                  : vppMode === "NAIVE_CARBON_ONLY_VPP"
                  ? "Ignores Trafo & Equity Limits"
                  : "Uncontrolled Feeder Flow"}
              </div>
            </div>

            {/* 5. Quick Judge Actions (Live Weather + FDIA Demo Trigger) */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleFetchLiveWeather}
                disabled={isFetchingWeather}
                className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <CloudSun className="w-3.5 h-3.5" />
                {isFetchingWeather ? "Syncing Open-Meteo..." : "Sync Live Open-Meteo"}
              </button>
              <button
                onClick={() => {
                  if (attackType === "NONE") {
                    setAttackType("SOLAR_EXPORT_INFLATION");
                    setSelectedBusId(18);
                    setSpoofKW(85);
                    setActiveTab("KIRCHHOFF_PQC");
                  } else {
                    setAttackType("NONE");
                    setSpoofKW(0);
                  }
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold border flex items-center justify-center gap-1.5 transition ${
                  attackType !== "NONE"
                    ? "bg-rose-500/25 text-rose-200 border-rose-500/50"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                {attackType !== "NONE"
                  ? "Clear FDIA Spoof Attack"
                  : "Simulate +85kW FDIA Spoof"}
              </button>
              <div className="text-[10px] font-mono text-slate-500 text-center truncate">
                Source: {weatherSyncStatus}
              </div>
            </div>
          </div>
        </section>

        {/* 6 Real-Time Cyber-Physical KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: LME Carbon Avoided */}
          <div className="bg-grid-panel border border-emerald-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Avoided Emissions</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1">
              +{metricsComparison.gridvane.avoidedEmissionsKgCO2e} kg/h
            </div>
            <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
              +{metricsComparison.gridvane.lmeBonusCarbonPct}% LME Nodal Bonus
            </div>
          </div>

          {/* KPI 2: IEEE C57.91 Transformer Hot-Spot */}
          <div className="bg-grid-panel border border-amber-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Peak Trafo Hot-Spot</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-white mt-1">
              {metricsComparison.gridvane.maxTransformerHotSpotC}°C{" "}
              <span className="text-xs font-normal text-rose-400 line-through">
                {metricsComparison.baseline.maxTransformerHotSpotC}°C
              </span>
            </div>
            <div className="text-[11px] font-mono text-amber-300 mt-0.5">
              -{metricsComparison.gridvane.faaReductionPct}% IEEE C57.91 Aging
            </div>
          </div>

          {/* KPI 3: TSRS / IFRS S2 Expected Annual Loss Saved */}
          <div className="bg-grid-panel border border-cyan-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>TSRS / IFRS S2 AAL</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-cyan-300 mt-1">
              -${metricsComparison.gridvane.aalSavingsUSDPerYear.toLocaleString()}/yr
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Line Loss: -{metricsComparison.gridvane.lineLossReductionPct}% (I²R)
            </div>
          </div>

          {/* KPI 4: Kirchhoff Residual Firewall */}
          <div className="bg-grid-panel border border-rose-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Kirchhoff Firewall</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-white mt-1">
              {firewallReport.verifiedCleanCount}/{firewallReport.totalBusesAudited} Clean
            </div>
            <div className="text-[11px] font-mono text-rose-300 mt-0.5">
              {firewallReport.quarantinedCount > 0
                ? `${firewallReport.quarantinedCount} Quarantined (${firewallReport.maxResidualKW}kW)`
                : `Max r=${firewallReport.maxResidualKW}kW (<2.5kW)`}
            </div>
          </div>

          {/* KPI 5: Post-Quantum ML-DSA-65 */}
          <div className="bg-grid-panel border border-violet-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>PQC Attestation</span>
              <KeyRound className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-violet-300 mt-1">
              ML-DSA-65
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              FIPS 204 (3,309B) + PP-PQB
            </div>
          </div>

          {/* KPI 6: Responsible AI Thermal-Equity Gate */}
          <div className="bg-grid-panel border border-sky-500/30 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Thermal-Equity Gate</span>
              <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-lg font-mono font-extrabold text-sky-300 mt-1">
              {metricsComparison.gridvane.vulnerableCoolingCurtailedKW} kW Cut
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
              1,270 Vulnerable Citizens Safe
            </div>
          </div>
        </section>

        {/* Interactive IEEE 33-Bus Radial Distribution Network Twin */}
        <FeederTopologyMap
          feederState={activeState}
          selectedBusId={selectedBusId}
          onSelectBus={setSelectedBusId}
          nodeAudits={firewallReport.nodeAudits}
        />

        {/* Deep-Dive Cockpit Module Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-grid-border pb-2">
          <button
            onClick={() => setActiveTab("THERMAL_C57")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
              activeTab === "THERMAL_C57"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : "bg-grid-panel text-slate-400 border border-grid-border hover:text-slate-200"
            }`}
          >
            <Flame className="w-4 h-4" />
            1. IEEE C57.91 Transformer Aging &amp; TSRS Risk
          </button>

          <button
            onClick={() => setActiveTab("KIRCHHOFF_PQC")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
              activeTab === "KIRCHHOFF_PQC"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                : "bg-grid-panel text-slate-400 border border-grid-border hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            2. Kirchhoff FDIA Firewall &amp; FIPS 204 ML-DSA-65 Lab
          </button>

          <button
            onClick={() => setActiveTab("XAI_EQUITY")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
              activeTab === "XAI_EQUITY"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/50"
                : "bg-grid-panel text-slate-400 border border-grid-border hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            3. Explainable AI (XAI) &amp; Thermal-Equity Gate
          </button>

          <button
            onClick={() => setActiveTab("P3271_SILOS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
              activeTab === "P3271_SILOS"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                : "bg-grid-panel text-slate-400 border border-grid-border hover:text-slate-200"
            }`}
          >
            <Link2 className="w-4 h-4" />
            4. IEEE P3271.01 Settlement &amp; Triple-Silo Registry
          </button>

          <button
            onClick={() => setActiveTab("GRIDBENCH_RUBRIC")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
              activeTab === "GRIDBENCH_RUBRIC"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                : "bg-grid-panel text-slate-400 border border-grid-border hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            5. GridBench 720h Benchmark &amp; Judge Matrix
          </button>
        </div>

        {/* Active Tab Content */}
        <section>
          {activeTab === "THERMAL_C57" && (
            <TransformerThermalPanel
              vppResult={vppResult}
              onSelectBus={setSelectedBusId}
            />
          )}

          {activeTab === "KIRCHHOFF_PQC" && (
            <KirchhoffAndPQCPanel
              feederId={feederId}
              feederState={activeState}
              firewallReport={firewallReport}
              selectedBusId={selectedBusId}
              onSelectBus={setSelectedBusId}
              attackType={attackType}
              onChangeAttackType={setAttackType}
              spoofKW={spoofKW}
              onChangeSpoofKW={setSpoofKW}
              firewallEnabled={firewallEnabled}
              onToggleFirewall={setFirewallEnabled}
            />
          )}

          {activeTab === "XAI_EQUITY" && (
            <XAIAndEquityPanel
              vppResult={vppResult}
              equityGateEnabled={equityGateEnabled}
              onToggleEquityGate={setEquityGateEnabled}
              onSelectBus={setSelectedBusId}
            />
          )}

          {activeTab === "P3271_SILOS" && (
            <SettlementAndSiloPanel
              preset={preset}
              vppResult={vppResult}
              firewallReport={firewallReport}
            />
          )}

          {activeTab === "GRIDBENCH_RUBRIC" && <GridBenchAndJudgesPanel />}
        </section>
      </main>
    </div>
  );
}
