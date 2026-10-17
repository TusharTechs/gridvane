"use client";

import React from "react";
import { VPPOptimizationResult } from "@/lib/optimizer/vppOptimizer";
import { CMIP6_SCENARIOS, computePVThermalDerating } from "@/lib/physics/transformerThermal";
import { Flame, ShieldCheck, AlertTriangle, TrendingDown, Sun } from "lucide-react";

interface TransformerThermalPanelProps {
  vppResult: VPPOptimizationResult;
  onSelectBus?: (busId: number) => void;
}

export function TransformerThermalPanel({
  vppResult,
  onSelectBus,
}: TransformerThermalPanelProps) {
  const { activeState, baselineState, gridvaneState, metricsComparison } = vppResult;
  const scenario = CMIP6_SCENARIOS[activeState.scenarioId];

  // Aggregate PV derating stats across the feeder
  const pvDeratingSample = computePVThermalDerating(
    1000,
    activeState.irradianceWm2,
    activeState.ambientTempC
  );

  return (
    <div className="space-y-4">
      {/* Top 3-Way Ablation Banner for IEEE C57.91 Thermal & TSRS/IFRS S2 AAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Uncontrolled Baseline */}
        <div className="bg-slate-950/90 border border-rose-500/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
              1. Uncontrolled Baseline
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-rose-400">
              {metricsComparison.baseline.maxTransformerHotSpotC}°C
            </span>
            <span className="text-xs font-mono text-slate-400">
              Peak Hot-Spot (Θ_H)
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Arrhenius Aging (F_AA)</div>
              <div className="font-mono font-bold text-rose-300">
                {metricsComparison.baseline.maxTransformerFAA}x Normal
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">TSRS Expected Annual Loss</div>
              <div className="font-mono font-bold text-slate-200">
                ${metricsComparison.baseline.totalExpectedAnnualLossUSD.toLocaleString()}/yr
              </div>
            </div>
          </div>
        </div>

        {/* Naive Carbon-Only VPP */}
        <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              2. Naive Carbon-Only VPP
            </span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-300">
              {metricsComparison.naiveCarbon.maxTransformerHotSpotC}°C
            </span>
            <span className="text-xs font-mono text-slate-400">
              Ignores Transformer Limits
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Arrhenius Aging (F_AA)</div>
              <div className="font-mono font-bold text-amber-300">
                {metricsComparison.naiveCarbon.maxTransformerFAA}x Normal
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Clinic Cooling Cut</div>
              <div className="font-mono font-bold text-rose-400">
                {metricsComparison.naiveCarbon.vulnerableCoolingCurtailedKW} kW Curtailed ❌
              </div>
            </div>
          </div>
        </div>

        {/* GridVane Thermo-Carbon VPP */}
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              3. GridVane Thermo-Carbon VPP
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {metricsComparison.gridvane.maxTransformerHotSpotC}°C
            </span>
            <span className="text-xs font-mono text-emerald-300">
              (-{metricsComparison.gridvane.faaReductionPct}% Aging F_AA)
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Arrhenius Aging (F_AA)</div>
              <div className="font-mono font-bold text-emerald-300">
                {metricsComparison.gridvane.maxTransformerFAA}x (Safe &lt;110°C)
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">TSRS AAL Risk Saved</div>
              <div className="font-mono font-bold text-emerald-300">
                +${metricsComparison.gridvane.aalSavingsUSDPerYear.toLocaleString()}/yr Saved
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transformer Table & Solar Thermal Derating Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 6 Transformers Table */}
        <div className="lg:col-span-2 bg-grid-panel border border-grid-border rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                IEEE Std C57.91-2011 Distribution Transformer Insulation Aging Ledger
              </h4>
              <p className="text-xs text-slate-400">
                Hottest-Spot Winding Temperature Θ_H = Θ_A + ΔΘ_TO + ΔΘ_H · Reference 110°C (F_AA = 1.0× across 180,000h life)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-300">
              {scenario.name}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2 pr-2">Transformer</th>
                  <th className="py-2 px-2">Load (K=S/S_R)</th>
                  <th className="py-2 px-2">Top-Oil ΔΘ_TO</th>
                  <th className="py-2 px-2">Hot-Spot Θ_H</th>
                  <th className="py-2 px-2">Arrhenius F_AA</th>
                  <th className="py-2 px-2">TSRS AAL ($/yr)</th>
                  <th className="py-2 pl-2">IEEE Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeState.transformers.map((tr, idx) => {
                  const baseTr = baselineState.transformers[idx];
                  const gvTr = gridvaneState.transformers[idx];
                  const savedC = Number((baseTr.hotSpotTempC - gvTr.hotSpotTempC).toFixed(1));

                  return (
                    <tr
                      key={tr.transformerId}
                      onClick={() => onSelectBus?.(tr.busId)}
                      className="hover:bg-slate-900/70 cursor-pointer transition"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-bold text-slate-100">{tr.transformerId} (Bus {tr.busId})</div>
                        <div className="text-[10px] font-sans text-slate-400 truncate max-w-[180px]">
                          {tr.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-slate-200 font-semibold">
                          {(tr.loadRatioK * 100).toFixed(1)}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {tr.apparentLoadKVA.toFixed(0)}/{tr.ratedKVA} kVA
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-slate-300">+{tr.topOilRiseC}°C</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`font-bold ${
                            tr.hotSpotTempC >= 120
                              ? "text-rose-400"
                              : tr.hotSpotTempC >= 108
                              ? "text-amber-300"
                              : "text-emerald-400"
                          }`}
                        >
                          {tr.hotSpotTempC}°C
                        </span>
                        {savedC > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            -{savedC}°C via VPP
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`font-bold ${
                            tr.agingAccelerationFactorFAA >= 2.0
                              ? "text-rose-400"
                              : tr.agingAccelerationFactorFAA >= 1.0
                              ? "text-amber-300"
                              : "text-emerald-400"
                          }`}
                        >
                          {tr.agingAccelerationFactorFAA}x
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-200">
                        ${tr.expectedAnnualLossUSD.toLocaleString()}
                      </td>
                      <td className="py-2.5 pl-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tr.thermalStatus === "EMERGENCY_OVERLOAD"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : tr.thermalStatus === "CRITICAL_AGING"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : tr.thermalStatus === "ELEVATED"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {tr.thermalStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solar PV Cell Thermal Derating & Arrhenius Equation Explainer */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Solar PV Cell Thermal Derating
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Crystalline silicon PV loses <span className="text-amber-300 font-mono">-0.42%/°C</span> above 25°C STC cell temperature (T_cell = Θ_A + (NOCT - 20)/800 × G).
            </p>

            <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Ambient Temperature (Θ_A)</span>
                <span className="font-mono font-bold text-amber-300">
                  {activeState.ambientTempC}°C
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Solar Silicon Cell Temp (T_cell)</span>
                <span className="font-mono font-bold text-rose-400">
                  {pvDeratingSample.cellTempC}°C
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Thermal Efficiency Penalty</span>
                <span className="font-mono font-bold text-rose-400">
                  -{pvDeratingSample.deratingPct}% Derated
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Feeder PV Thermal Power Lost</span>
                <span className="font-mono font-bold text-amber-400">
                  -{activeState.totalSolarThermalLostKW} kW Lost to Heat
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Actual Clean PV Delivered</span>
                <span className="font-mono font-bold text-emerald-400">
                  {activeState.totalSolarGenerationKW} kW (vs {Number((activeState.totalSolarGenerationKW + activeState.totalSolarThermalLostKW).toFixed(1))} kW STC)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Why Thermo-Carbon Co-Optimization Wins
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every 6°C increase in transformer winding temperature Θ_H above 110°C <strong>doubles</strong> cellulose paper depolymerization (F_AA). By dispatching BESS/V2G at high-impedance tail buses (Buses 14, 18, 25, 30), GridVane simultaneously maximizes <strong>Locational Marginal Emissions (LME)</strong> carbon displacement and cools Θ_H from <span className="text-rose-400 font-mono">{metricsComparison.baseline.maxTransformerHotSpotC}°C</span> to <span className="text-emerald-400 font-mono">{metricsComparison.gridvane.maxTransformerHotSpotC}°C</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
