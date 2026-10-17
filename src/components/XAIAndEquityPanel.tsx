"use client";

import React from "react";
import { VPPOptimizationResult } from "@/lib/optimizer/vppOptimizer";
import {
  BrainCircuit,
  HeartPulse,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface XAIAndEquityPanelProps {
  vppResult: VPPOptimizationResult;
  equityGateEnabled: boolean;
  onToggleEquityGate: (enabled: boolean) => void;
  onSelectBus: (busId: number) => void;
}

export function XAIAndEquityPanel({
  vppResult,
  equityGateEnabled,
  onToggleEquityGate,
  onSelectBus,
}: XAIAndEquityPanelProps) {
  const { xaiAttributions, equityAudit, metricsComparison } = vppResult;

  const totalProtectedCitizens = equityAudit.reduce(
    (s, e) => s + e.protectedCitizensCount,
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Responsible AI Thermal-Equity Safety Gate Card */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-grid-border">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-sky-400" />
              Responsible AI Thermal-Equity Safety Gate (Human-in-the-Loop DSO Guardrail)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prevents automated VPP demand-response algorithms from throttling cooling on medical clinics, dialysis centers, and heat shelters during extreme heatwaves (Θ_A ≥ 31°C).
            </p>
          </div>

          <button
            onClick={() => onToggleEquityGate(!equityGateEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
              equityGateEnabled
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
            }`}
          >
            {equityGateEnabled ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                THERMAL-EQUITY GATE: LOCKED ({totalProtectedCitizens} CITIZENS SAFE)
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                THERMAL-EQUITY GATE: OVERRIDDEN (CLINICS EXPOSED)
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {equityAudit.map((entry) => (
            <div
              key={entry.busId}
              onClick={() => onSelectBus(entry.busId)}
              className="bg-slate-950/90 border border-sky-500/30 rounded-lg p-3 cursor-pointer hover:border-sky-400/60 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{entry.facilityName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    entry.gridvaneCurtailmentKW === 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {entry.gridvaneCurtailmentKW === 0 ? "100% COOLING LOCKED" : "EXPOSED"}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Naive Carbon VPP Cut</div>
                  <div className="text-rose-400 font-bold">
                    -{entry.naiveVPPCurtailmentKW} kW HVAC ❌
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">GridVane Equity Cut</div>
                  <div className="text-emerald-400 font-bold">
                    {entry.gridvaneCurtailmentKW} kW Cut ✅
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Protected Population: <strong className="text-sky-300">{entry.protectedCitizensCount}</strong></span>
                <span className="font-mono text-[10px] text-emerald-300">
                  Rerouted to Buses {entry.reroutedToCommercialBuses.join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explainable AI (XAI) Shapley Attribution & EV Battery Thermal Passport Table */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              Explainable AI (XAI) Shapley Feature Attribution &amp; EV Li-Ion Thermal Passport
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Decomposes every kW of BESS / EV V2G dispatch into 5 auditable physical drivers while constraining Li-ion SEI Arrhenius degradation (${metricsComparison.gridvane.totalEVDegradationCostUSDPerHr}/hr fleet wear).
            </p>
          </div>

          {/* Shapley Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> LME Carbon
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Trafo Θ_H Relief
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Voltage |V_i|
            </span>
            <span className="flex items-center gap-1 text-sky-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" /> Equity Reroute
            </span>
            <span className="flex items-center gap-1 text-violet-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" /> EV SoH Cap
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {xaiAttributions.slice(0, 8).map((item) => {
            const s = item.shapleyContributionsPct;
            return (
              <div
                key={item.busId}
                onClick={() => onSelectBus(item.busId)}
                className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-lg p-3 cursor-pointer transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">{item.busName}</span>
                    <div className="text-[10px] font-mono text-slate-400">
                      BESS: {item.bessCapacityKWh} kWh · LME: {item.lmeGPerKWh} gCO2/kWh · Avoided: +{item.avoidedEmissionsKgPerHr} kgCO2/h
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-400">
                      +{item.dispatchedPowerKW} kW
                    </div>
                    <div className="text-[10px] text-cyan-300 flex items-center justify-end gap-1">
                      <BatteryCharging className="w-3 h-3" />
                      Pack: {item.evPackTempC}°C ({item.evCrate}C)
                    </div>
                  </div>
                </div>

                {/* Stacked Shapley Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                  <div
                    style={{ width: `${s.lmeCarbonDisplacement}%` }}
                    className="bg-emerald-500 h-full"
                    title={`LME Carbon Displacement: ${s.lmeCarbonDisplacement}%`}
                  />
                  <div
                    style={{ width: `${s.transformerThermalRelief}%` }}
                    className="bg-amber-500 h-full"
                    title={`Transformer Thermal Relief: ${s.transformerThermalRelief}%`}
                  />
                  <div
                    style={{ width: `${s.feederVoltageSupport}%` }}
                    className="bg-cyan-500 h-full"
                    title={`Feeder Voltage Support: ${s.feederVoltageSupport}%`}
                  />
                  <div
                    style={{ width: `${s.thermalEquityRerouting}%` }}
                    className="bg-sky-500 h-full"
                    title={`Thermal-Equity Rerouting: ${s.thermalEquityRerouting}%`}
                  />
                  <div
                    style={{ width: `${s.evBatterySoHConstraint}%` }}
                    className="bg-violet-500 h-full"
                    title={`EV Battery SoH Constraint: ${s.evBatterySoHConstraint}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>LME:{s.lmeCarbonDisplacement}%</span>
                  <span>Trafo:{s.transformerThermalRelief}%</span>
                  <span>Volt:{s.feederVoltageSupport}%</span>
                  <span>Equity:{s.thermalEquityRerouting}%</span>
                  <span>EV-SoH:{s.evBatterySoHConstraint}%</span>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-900/70 px-2.5 py-1.5 rounded border border-slate-800/80 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item.humanReadableRationale}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
