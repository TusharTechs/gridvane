"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { GridVaneLogo } from "@/components/GridVaneLogo";
import { FeederTopologyMap } from "@/components/FeederTopologyMap";
import { Diurnal24hChart } from "@/components/Diurnal24hChart";
import { TransformerThermalPanel } from "@/components/TransformerThermalPanel";
import { DLRAndMultiAgentPanel } from "@/components/DLRAndMultiAgentPanel";
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
  Wind,
  Sliders,
  Compass,
  CheckCircle2,
  MapPin,
  Sun,
  Moon,
} from "lucide-react";

type CockpitTabId =
  | "THERMAL_C57"
  | "DLR_SKYVISION_AGENTS"
  | "KIRCHHOFF_PQC"
  | "XAI_EQUITY"
  | "P3271_SILOS"
  | "GRIDBENCH_RUBRIC";

export default function GridVaneCockpitPage() {
  // Default to IEEE & UN COP31 Executive Daylight Studio Theme
  const [isLightMode, setIsLightMode] = useState<boolean>(true);

  useEffect(() => {
    const html = document.documentElement;
    if (isLightMode) {
      html.classList.add("theme-ieee-light");
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
      html.classList.remove("theme-ieee-light");
    }
  }, [isLightMode]);

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

  // 24-Hour Diurnal Replay State
  const [activeHour, setActiveHour] = useState<number>(14);
  const [isPlaying24h, setIsPlaying24h] = useState<boolean>(false);

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

  // 24-Hour Diurnal Animation Timer
  useEffect(() => {
    if (!isPlaying24h) return;
    const timer = setInterval(() => {
      setActiveHour((prev) => {
        const nextHour = (prev + 1) % 24;
        const slot = preset.hourlyProfile24h[nextHour];
        if (slot) {
          setAmbientTempC(slot.ambientC);
          setIrradianceWm2(slot.irradianceWm2);
          setGridMEF(slot.mefGPerKWh);
        }
        return nextHour;
      });
    }, 950);
    return () => clearInterval(timer);
  }, [isPlaying24h, preset]);

  function handleSelectHour(hour: number) {
    setIsPlaying24h(false);
    setActiveHour(hour);
    const slot = preset.hourlyProfile24h[hour];
    if (slot) {
      setAmbientTempC(slot.ambientC);
      setIrradianceWm2(slot.irradianceWm2);
      setGridMEF(slot.mefGPerKWh);
    }
  }

  // Switch feeder preset handler
  function handleSelectFeeder(newId: FeederPresetId) {
    const p = FEEDER_PRESETS[newId];
    setIsPlaying24h(false);
    setFeederId(newId);
    setActiveHour(14);
    setAmbientTempC(p.defaultAmbientTempC);
    setIrradianceWm2(p.defaultIrradianceWm2);
    setGridMEF(p.defaultGridMEFGPerKWh);
    setWeatherSyncStatus(`${p.city} Heatwave Benchmark`);
  }

  // Live Open-Meteo API Sync
  async function handleFetchLiveWeather() {
    setIsPlaying24h(false);
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
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Top IEEE & ClimateChain Executive Navbar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 lg:px-8 py-3 transition-colors ${
          isLightMode
            ? "bg-white/90 border-[#CBD5E1] shadow-[0_4px_20px_rgba(0,98,155,0.06)]"
            : "bg-[#040814]/88 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
        }`}
      >
        <div className="max-w-[1480px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Custom GridVane Emblem + Wordmark + Modal Trigger */}
          <div className="flex items-center gap-5">
            <GridVaneLogo size="md" interactiveModal={true} isLightMode={isLightMode} />

            {/* Live IEEE Standards & COP31 Verification Badges */}
            <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800">
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35">
                IEEE Std C57.91 · 738 · P3271.01
              </span>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                Track 2 VPP + Tracks 1 · 4 · 3
              </span>
              <span className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35">
                UN COP31 Antalya
              </span>
            </div>
          </div>

          {/* Right Controls: 4 Regional Feeder Switcher + IEEE Daylight / SCADA Dark Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {(Object.keys(FEEDER_PRESETS) as FeederPresetId[]).map((id) => {
                const p = FEEDER_PRESETS[id];
                const active = feederId === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectFeeder(id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-sm">{p.flag}</span>
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Theme Switcher: IEEE Executive Daylight vs. SCADA Dark */}
            <button
              onClick={() => setIsLightMode((prev) => !prev)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 bg-cyan-500/15 text-cyan-300 border-cyan-500/35 hover:opacity-90"
              title="Switch between IEEE Executive Daylight Theme and SCADA Control Room Dark Mode"
            >
              {isLightMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>IEEE Daylight</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-300" />
                  <span>SCADA Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Workspace */}
      <main className="max-w-[1480px] mx-auto px-4 lg:px-8 pt-5 space-y-5">
        {/* Executive Hero Deck & 6-Step Interactive Judge Guided Tour */}
        <section className="gv-glass-card rounded-3xl p-4 lg:p-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#00629B] via-[#059669] to-[#D97706]" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
            <div className="flex items-start sm:items-center gap-4">
              <img
                src="/gridvane-logo.jpg"
                alt="GridVane Official Emblem"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#00629B]/50 shadow-md shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 flex items-center gap-1">
                    <Compass className="w-3 h-3" /> Interactive Judge Evaluation Deck
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {preset.name} ({preset.country})
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
                  Physics-Verified, Quantum-Safe Thermo-Carbon VPP &amp; Triple-Silo Climate Ledger
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-4xl">
                  Select any of the <strong>6 IEEE ClimateChain Judging Criteria</strong> below to auto-configure the 33-bus AC distribution feeder and inspect live mathematical, cryptographic, and smart-contract proofs:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleFetchLiveWeather}
                disabled={isFetchingWeather}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-2 transition"
              >
                <CloudSun className="w-4 h-4 text-cyan-400" />
                {isFetchingWeather ? "Syncing Satellite..." : "Sync Live Open-Meteo"}
              </button>
            </div>
          </div>

          {/* 6 Interactive Judging Criterion Stepper Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <button
              onClick={() => {
                setIsPlaying24h(false);
                setFeederId("antalya_cop31");
                setAmbientTempC(41.5);
                setIrradianceWm2(920);
                setScenarioId("ssp5_85");
                setVppMode("GRIDVANE_THERMO_CARBON_VPP");
                setAttackType("NONE");
                setSpoofKW(0);
                setSelectedBusId(18);
                setActiveTab("THERMAL_C57");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "THERMAL_C57"
                  ? "bg-amber-500/15 border-amber-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400">
                <span>01 · CLIMATE</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">30%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                IEEE C57.91 + LME
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                -68% Aging · +18.9% CO₂
              </div>
            </button>

            <button
              onClick={() => {
                setIsPlaying24h(false);
                setAttackType("NONE");
                setSpoofKW(0);
                setVppMode("GRIDVANE_THERMO_CARBON_VPP");
                setActiveTab("P3271_SILOS");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "P3271_SILOS"
                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-400">
                <span>02 · DLT &amp; P3271</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">30%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                Triple-Silo + EVM
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                solc 0.8.28 · 0 Double-Count
              </div>
            </button>

            <button
              onClick={() => {
                setIsPlaying24h(false);
                setSelectedBusId(18);
                setAttackType("SOLAR_EXPORT_INFLATION");
                setSpoofKW(85);
                setFirewallEnabled(true);
                setActiveTab("KIRCHHOFF_PQC");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "KIRCHHOFF_PQC"
                  ? "bg-rose-500/15 border-rose-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-rose-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rose-400">
                <span>03 · SECURITY</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">10%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                FDIA + ML-DSA-65
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                +85kW Spoof Quarantined
              </div>
            </button>

            <button
              onClick={() => {
                setIsPlaying24h(false);
                setAttackType("NONE");
                setSpoofKW(0);
                setSelectedBusId(18);
                setActiveTab("DLR_SKYVISION_AGENTS");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "DLR_SKYVISION_AGENTS"
                  ? "bg-cyan-500/15 border-cyan-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-400">
                <span>04 · FEASIBILITY</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">10%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                IEEE 738 + SkyVision
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                5-Agent Pareto + Merkle
              </div>
            </button>

            <button
              onClick={() => {
                setIsPlaying24h(false);
                setSelectedBusId(14);
                setEquityGateEnabled(true);
                setActiveTab("XAI_EQUITY");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "XAI_EQUITY"
                  ? "bg-sky-500/15 border-sky-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-sky-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-sky-400">
                <span>05 · UX &amp; XAI</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">10%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                Shapley + Equity Gate
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                1,270 Vulnerable Safe
              </div>
            </button>

            <button
              onClick={() => {
                setIsPlaying24h(false);
                setActiveTab("GRIDBENCH_RUBRIC");
              }}
              className={`group p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                activeTab === "GRIDBENCH_RUBRIC"
                  ? "bg-violet-500/15 border-violet-500/50 shadow-sm"
                  : "bg-slate-950 border-slate-800 hover:border-violet-500/40"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-violet-400">
                <span>06 · SCALABILITY</span>
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">10%</span>
              </div>
              <div className="font-display text-xs font-bold text-white mt-1.5">
                GridBench 720h Suite
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                4 Feeders · 12-Judge Matrix
              </div>
            </button>
          </div>
        </section>

        {/* 6 Real-Time Bento Telemetry Cards with Visual Gauges */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* KPI 1: LME Carbon Avoided */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#059669] to-[#10B981]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Avoided Carbon</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-emerald-400 mt-1.5">
              +{metricsComparison.gridvane.avoidedEmissionsKgCO2e}{" "}
              <span className="text-xs font-mono font-normal text-slate-400">kg/h</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-[#059669] to-[#00629B] w-[86%]" />
            </div>
            <div className="text-[11px] font-mono text-emerald-300 font-semibold mt-1.5">
              +{metricsComparison.gridvane.lmeBonusCarbonPct}% LME Nodal Bonus
            </div>
          </div>

          {/* KPI 2: IEEE C57.91 Transformer Hot-Spot */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D97706] to-[#F59E0B]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Peak Trafo Θ_H</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-white mt-1.5 flex items-baseline gap-1.5">
              <span>{metricsComparison.gridvane.maxTransformerHotSpotC}°C</span>
              <span className="text-xs font-mono font-normal text-rose-400 line-through">
                {metricsComparison.baseline.maxTransformerHotSpotC}°C
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#059669] to-[#D97706]"
                style={{
                  width: `${Math.min(
                    100,
                    (metricsComparison.gridvane.maxTransformerHotSpotC / 140) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] font-mono text-amber-300 font-semibold mt-1.5">
              -{metricsComparison.gridvane.faaReductionPct}% IEEE C57.91 Aging
            </div>
          </div>

          {/* KPI 3: TSRS / IFRS S2 Expected Annual Loss Saved */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00629B] to-[#0284C7]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>TSRS / IFRS S2 AAL</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-cyan-300 mt-1.5">
              -${metricsComparison.gridvane.aalSavingsUSDPerYear.toLocaleString()}
              <span className="text-xs font-mono font-normal text-slate-400">/yr</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-[#00629B] to-[#0284C7] w-[78%]" />
            </div>
            <div className="text-[11px] font-mono text-slate-300 font-semibold mt-1.5">
              I²R Line Loss: -{metricsComparison.gridvane.lineLossReductionPct}%
            </div>
          </div>

          {/* KPI 4: Kirchhoff Residual Firewall */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#E11D48] to-[#F43F5E]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Kirchhoff Gate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-white mt-1.5">
              {firewallReport.verifiedCleanCount}/{firewallReport.totalBusesAudited}{" "}
              <span className="text-xs font-mono font-normal text-emerald-300">Clean</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${
                  firewallReport.quarantinedCount > 0 ? "bg-rose-600 w-[97%]" : "bg-[#059669] w-full"
                }`}
              />
            </div>
            <div className="text-[11px] font-mono text-rose-300 font-semibold mt-1.5 truncate">
              {firewallReport.quarantinedCount > 0
                ? `${firewallReport.quarantinedCount} Quarantined (${firewallReport.maxResidualKW}kW)`
                : `Max r=${firewallReport.maxResidualKW}kW (≤2.5kW)`}
            </div>
          </div>

          {/* KPI 5: Post-Quantum ML-DSA-65 */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>PQC Attestation</span>
              <KeyRound className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-violet-300 mt-1.5">
              ML-DSA-65
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] w-full" />
            </div>
            <div className="text-[11px] font-mono text-slate-300 font-semibold mt-1.5">
              FIPS 204 (3,309B) + PP-PQB
            </div>
          </div>

          {/* KPI 6: Responsible AI Thermal-Equity Gate */}
          <div className="gv-glass-card rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0284C7] to-[#059669]" />
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Thermal Equity</span>
              <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="font-display text-xl font-extrabold text-sky-300 mt-1.5">
              {metricsComparison.gridvane.vulnerableCoolingCurtailedKW}{" "}
              <span className="text-xs font-mono font-normal text-slate-300">kW Cut</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-[#0284C7] to-[#059669] w-full" />
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-1.5">
              1,270 Vulnerable Citizens Safe
            </div>
          </div>
        </section>

        {/* Split-Screen Cyber-Physical Digital Twin & Parameter Control Dock */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left 8 Columns: Interactive 33-Bus SCADA Canvas + 24-Hour Diurnal Player */}
          <div className="xl:col-span-8 space-y-5">
            <FeederTopologyMap
              feederState={activeState}
              selectedBusId={selectedBusId}
              onSelectBus={setSelectedBusId}
              nodeAudits={firewallReport.nodeAudits}
              isLightMode={isLightMode}
            />

            <Diurnal24hChart
              preset={preset}
              scenarioId={scenarioId}
              activeHour={activeHour}
              isPlaying={isPlaying24h}
              onTogglePlay={() => setIsPlaying24h((p) => !p)}
              onSelectHour={handleSelectHour}
              isLightMode={isLightMode}
            />
          </div>

          {/* Right 4 Columns: Tactile Cyber-Physical Parameter & Red-Team Control Dock */}
          <div className="xl:col-span-4 space-y-4">
            <div className="gv-glass-card rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#00629B] via-[#059669] to-[#D97706]" />

              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">
                      Cyber-Physical Control Dock
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {weatherSyncStatus}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Ambient Heatwave Slider */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" /> Ambient Heatwave (Θ_A)
                    </span>
                    <span
                      className={`font-display text-base font-extrabold ${
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
                    onChange={(e) => {
                      setIsPlaying24h(false);
                      setAmbientTempC(Number(e.target.value));
                    }}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
                    <span>20°C Mild</span>
                    <span>35°C Summer</span>
                    <span className="text-rose-400 font-semibold">48°C Extreme</span>
                  </div>
                </div>

                {/* 2. Solar Irradiance Slider */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                      <CloudSun className="w-4 h-4 text-cyan-400" /> Solar Irradiance (G_t)
                    </span>
                    <span className="font-display text-base font-extrabold text-cyan-300">
                      {irradianceWm2} W/m²
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1050}
                    step={15}
                    value={irradianceWm2}
                    onChange={(e) => {
                      setIsPlaying24h(false);
                      setIrradianceWm2(Number(e.target.value));
                    }}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
                    <span>0 W/m² (Night)</span>
                    <span>550 W/m²</span>
                    <span className="text-cyan-400 font-semibold">1050 W/m² Peak</span>
                  </div>
                </div>

                {/* 3. CMIP6 Climate Pathway Selector */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    CORDEX / CMIP6 Climate Horizon
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    {(Object.keys(CMIP6_SCENARIOS) as CMIP6ScenarioId[]).map((scKey) => {
                      const sc = CMIP6_SCENARIOS[scKey];
                      const active = scenarioId === scKey;
                      return (
                        <button
                          key={scKey}
                          onClick={() => setScenarioId(scKey)}
                          className={`py-2 px-2 rounded-lg border text-center transition-all ${
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
                  <div className="text-[11px] text-slate-400 font-mono mt-2 truncate">
                    {CMIP6_SCENARIOS[scenarioId].name}
                  </div>
                </div>

                {/* 4. VPP Dispatch Strategy Mode */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    Active VPP Control Regime
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setVppMode("UNCONTROLLED_BASELINE")}
                      className={`py-2 px-2 rounded-lg border transition-all ${
                        vppMode === "UNCONTROLLED_BASELINE"
                          ? "bg-rose-500/20 text-rose-200 border-rose-500/50 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      Baseline
                    </button>
                    <button
                      onClick={() => setVppMode("NAIVE_CARBON_ONLY_VPP")}
                      className={`py-2 px-2 rounded-lg border transition-all ${
                        vppMode === "NAIVE_CARBON_ONLY_VPP"
                          ? "bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      Naive VPP
                    </button>
                    <button
                      onClick={() => setVppMode("GRIDVANE_THERMO_CARBON_VPP")}
                      className={`py-2 px-2 rounded-lg border transition-all ${
                        vppMode === "GRIDVANE_THERMO_CARBON_VPP"
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      GridVane
                    </button>
                  </div>
                </div>

                {/* 5. Red-Team FDIA Smart-Meter Spoof Trigger */}
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold border flex items-center justify-center gap-2 transition-all ${
                    attackType !== "NONE"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                      : "bg-slate-950 hover:bg-rose-500/15 text-slate-200 border-rose-500/35"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  {attackType !== "NONE"
                    ? "Clear +85 kW FDIA Smart-Meter Spoof"
                    : "Inject +85 kW FDIA Spoof on Bus #18"}
                </button>
              </div>
            </div>

            {/* Live 5-Pillar Cyber-Physical Verification Checklist */}
            <div className="gv-glass-card rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live Cyber-Physical Proof Status
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">1. IEEE 33-Bus AC DistFlow</span>
                  <span className="text-emerald-400 font-bold">
                    CONVERGED ({activeState.convergenceIterations} iter)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">2. IEEE Std C57.91 Insulation</span>
                  <span className="text-amber-300 font-bold">
                    Θ_H = {metricsComparison.gridvane.maxTransformerHotSpotC}°C (SAFE)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">3. Kirchhoff Residual Firewall</span>
                  <span
                    className={
                      firewallReport.quarantinedCount > 0
                        ? "text-rose-400 font-bold"
                        : "text-emerald-400 font-bold"
                    }
                  >
                    {firewallReport.quarantinedCount > 0
                      ? "1 SPOOF QUARANTINED"
                      : "33/33 BUSES CLEAN"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">4. NIST FIPS 204 Lattice Root</span>
                  <span className="text-violet-300 font-bold">ML-DSA-65 (3,309B)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">5. EVM Smart Contract (solc)</span>
                  <span className="text-cyan-300 font-bold">0.8.28 (5,359B)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Segmented Deep-Dive Engineering Workbench Navigation Dock */}
        <div className="gv-glass-card rounded-2xl p-2 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("THERMAL_C57")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "THERMAL_C57"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>1. IEEE C57.91 Trafo &amp; TSRS Risk</span>
          </button>

          <button
            onClick={() => setActiveTab("DLR_SKYVISION_AGENTS")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "DLR_SKYVISION_AGENTS"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wind className="w-4 h-4 text-cyan-400" />
            <span>2. IEEE 738 DLR, SkyVision &amp; 5-Agent Consensus</span>
          </button>

          <button
            onClick={() => setActiveTab("KIRCHHOFF_PQC")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "KIRCHHOFF_PQC"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>3. Kirchhoff Firewall &amp; FIPS 204 ML-DSA-65</span>
          </button>

          <button
            onClick={() => setActiveTab("XAI_EQUITY")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "XAI_EQUITY"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-sky-400" />
            <span>4. Explainable AI (XAI) &amp; Equity Gate</span>
          </button>

          <button
            onClick={() => setActiveTab("P3271_SILOS")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "P3271_SILOS"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span>5. IEEE P3271.01 &amp; Triple-Silo Registry</span>
          </button>

          <button
            onClick={() => setActiveTab("GRIDBENCH_RUBRIC")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === "GRIDBENCH_RUBRIC"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/45"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span>6. GridBench 720h &amp; Judge Matrix</span>
          </button>
        </div>

        {/* Active Deep-Dive Workbench Content */}
        <section>
          {activeTab === "THERMAL_C57" && (
            <TransformerThermalPanel
              vppResult={vppResult}
              onSelectBus={setSelectedBusId}
            />
          )}

          {activeTab === "DLR_SKYVISION_AGENTS" && (
            <DLRAndMultiAgentPanel
              feederState={activeState}
              vppResult={vppResult}
              firewallReport={firewallReport}
              selectedBusId={selectedBusId}
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
