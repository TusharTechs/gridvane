"use client";

import React, { useMemo, useState } from "react";
import { IEEE33SolvedFeederState } from "@/lib/physics/ieee33bus";
import { VPPOptimizationResult } from "@/lib/optimizer/vppOptimizer";
import { KirchhoffFirewallReport } from "@/lib/security/kirchhoffFirewall";
import { evaluateDLRAndSkyVision } from "@/lib/physics/dlrAndSkyVision";
import { runMultiAgentNegotiation } from "@/lib/agents/multiAgentNegotiator";
import { buildFeederMerkleTreeAndProof } from "@/lib/crypto/merkleTree";
import { COMPILED_GRIDVANE_CONTRACT } from "@/lib/blockchain/compiledContractArtifact";
import {
  Wind,
  CloudRainWind,
  Bot,
  GitMerge,
  Flame,
  CheckCircle2,
  ShieldAlert,
  Code,
  Sparkles,
} from "lucide-react";

interface DLRAndMultiAgentPanelProps {
  feederState: IEEE33SolvedFeederState;
  vppResult: VPPOptimizationResult;
  firewallReport: KirchhoffFirewallReport;
  selectedBusId: number;
  onSelectBus: (busId: number) => void;
}

export function DLRAndMultiAgentPanel({
  feederState,
  vppResult,
  firewallReport,
  selectedBusId,
  onSelectBus,
}: DLRAndMultiAgentPanelProps) {
  const [windSpeedMs, setWindSpeedMs] = useState<number>(4.2);
  const [cloudFrontActive, setCloudFrontActive] = useState<boolean>(true);

  const dlrReport = useMemo(
    () => evaluateDLRAndSkyVision(feederState, windSpeedMs, cloudFrontActive),
    [feederState, windSpeedMs, cloudFrontActive]
  );

  const agentReport = useMemo(
    () => runMultiAgentNegotiation(vppResult, firewallReport, dlrReport),
    [vppResult, firewallReport, dlrReport]
  );

  const merkleData = useMemo(
    () => buildFeederMerkleTreeAndProof(feederState, firewallReport, selectedBusId),
    [feederState, firewallReport, selectedBusId]
  );

  return (
    <div className="space-y-4">
      {/* Section 1: IEEE Std 738 Dynamic Line Rating (DLR) & SkyVision Cloud-Vector Nowcaster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: IEEE Std 738-2012 Overhead Conductor Sag & Dynamic Line Rating */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-grid-border">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                IEEE Std 738-2012 Dynamic Line Rating (DLR) &amp; Wildfire Sag Physics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Solves convective wind cooling vs. solar &amp; Joule heating (q_c + q_r = q_s + I²R(T_c)) across all 32 overhead ACSR branches.
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                dlrReport.avgDlrCapacityBonusPct >= 0
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              {dlrReport.avgDlrCapacityBonusPct >= 0 ? "+" : ""}
              {dlrReport.avgDlrCapacityBonusPct}% Dynamic Line Ampacity
            </span>
          </div>

          {/* Wind Speed Slider */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-mono">
                Cross-Conductor Wind Velocity (v_wind)
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {windSpeedMs.toFixed(1)} m/s ({(windSpeedMs * 3.6).toFixed(1)} km/h)
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={10.0}
              step={0.3}
              value={windSpeedMs}
              onChange={(e) => setWindSpeedMs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
              <span>0.3 m/s (Stagnant Wildfire Risk)</span>
              <span>4.2 m/s (Sea Breeze)</span>
              <span>10.0 m/s (High DLR Headroom)</span>
            </div>
          </div>

          {/* DLR Summary Metrics */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Unlocked Clean Capacity</div>
              <div className="text-sm font-bold text-emerald-400">
                +{dlrReport.unlockedCleanTransferMW} MW Free
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Max Conductor Temp T_c</div>
              <div
                className={`text-sm font-bold ${
                  dlrReport.maxConductorTempC >= 75 ? "text-rose-400" : "text-amber-300"
                }`}
              >
                {dlrReport.maxConductorTempC}°C (Br #{dlrReport.maxConductorBranchId})
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Max Mid-Span Sag</div>
              <div
                className={`text-sm font-bold ${
                  dlrReport.maxSagMeters >= 2.5 ? "text-rose-400" : "text-cyan-300"
                }`}
              >
                {dlrReport.maxSagMeters}m{" "}
                {dlrReport.wildfireRiskBranchesCount > 0
                  ? `(${dlrReport.wildfireRiskBranchesCount} Alert)`
                  : "(Safe)"}
              </div>
            </div>
          </div>

          {/* Top Branches DLR Table */}
          <div className="overflow-y-auto max-h-[210px] border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-1.5 px-2">Branch</th>
                  <th className="py-1.5 px-2">Static vs DLR</th>
                  <th className="py-1.5 px-2">Temp T_c</th>
                  <th className="py-1.5 px-2">Sag (m)</th>
                  <th className="py-1.5 px-2">IEEE 738 Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dlrReport.branchDLR.slice(0, 8).map((br) => (
                  <tr
                    key={br.branchId}
                    onClick={() => onSelectBus(br.toBus)}
                    className="hover:bg-slate-900/60 cursor-pointer"
                  >
                    <td className="py-1.5 px-2 font-bold text-slate-200">
                      #{br.branchId} ({br.fromBus}→{br.toBus})
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="text-slate-400">{br.staticAmpacityA}A</span> →{" "}
                      <span
                        className={
                          br.dlrCapacityDeltaPct >= 0
                            ? "text-emerald-400 font-bold"
                            : "text-rose-400 font-bold"
                        }
                      >
                        {br.dynamicAmpacityA}A ({br.dlrCapacityDeltaPct >= 0 ? "+" : ""}
                        {br.dlrCapacityDeltaPct}%)
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-amber-300">{br.conductorTempC}°C</td>
                    <td className="py-1.5 px-2 text-slate-300">{br.conductorSagMeters}m</td>
                    <td className="py-1.5 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          br.clearanceSafetyStatus === "WILDFIRE_IGNITION_RISK"
                            ? "bg-rose-500/20 text-rose-300"
                            : br.clearanceSafetyStatus === "SAG_WARNING"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {br.clearanceSafetyStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: SkyVision Spatial Cloud-Vector Computer-Vision Nowcaster */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-grid-border">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <CloudRainWind className="w-4 h-4 text-amber-400" />
                SkyVision Spatial Cloud-Shadow Vector Nowcaster (5-Min Lookahead)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks optical cloud/dust advection vectors across the 33-bus coordinate plane to pre-ramp BESS inverters before solar drops hit.
              </p>
            </div>
            <button
              onClick={() => setCloudFrontActive(!cloudFrontActive)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition ${
                cloudFrontActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 text-slate-400 border-slate-700"
              }`}
            >
              {cloudFrontActive ? "Cloud Front: ACTIVE" : "Clear Sky Mode"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Cloud Motion Vector</div>
              <div className="text-xs font-bold text-cyan-300">
                {dlrReport.cloudVelocityVector.speedKmh} km/h ({dlrReport.cloudVelocityVector.heading})
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">5-Min Predicted PV Drop</div>
              <div className="text-sm font-bold text-rose-400">
                -{dlrReport.totalPredictedSolarDropKW} kW
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Pre-Ramped BESS Buffer</div>
              <div className="text-sm font-bold text-emerald-400">
                +{dlrReport.totalPreRampedBessKW} kW Ready
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[265px] border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-1.5 px-2">Solar Bus</th>
                  <th className="py-1.5 px-2">Arrival ETA</th>
                  <th className="py-1.5 px-2">Optical τ</th>
                  <th className="py-1.5 px-2">PV Now → +5m</th>
                  <th className="py-1.5 px-2">BESS Pre-Ramp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dlrReport.skyVisionForecasts.slice(0, 10).map((f) => (
                  <tr
                    key={f.busId}
                    onClick={() => onSelectBus(f.busId)}
                    className="hover:bg-slate-900/60 cursor-pointer"
                  >
                    <td className="py-1.5 px-2 font-bold text-slate-200">
                      Bus #{f.busId}
                    </td>
                    <td className="py-1.5 px-2 text-cyan-300">
                      T-{f.timeToCloudArrivalSec}s
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">{f.cloudOpticalDepth}</td>
                    <td className="py-1.5 px-2">
                      <span className="text-emerald-400">{f.currentPVKW}kW</span> →{" "}
                      <span className="text-amber-300">{f.forecastPV5MinKW}kW</span>
                    </td>
                    <td className="py-1.5 px-2 text-emerald-400 font-bold">
                      +{f.prePositionedBessBufferKW} kW
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: 5-Agent Autonomous Cyber-Physical Negotiation Consensus & Merkle / Bytecode Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: 5-Agent Negotiation Arena */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-grid-border">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                5-Agent Autonomous Cyber-Physical Pareto Negotiation
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic multi-agent consensus for IEEE P3271.01 Epoch #{agentReport.epochNumber} ({agentReport.totalNegotiationLatencyMs}ms total latency).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              Pareto Score: {agentReport.paretoEfficiencyScorePct}%
            </span>
          </div>

          <div className="space-y-2.5">
            {agentReport.steps.map((step) => (
              <div
                key={step.round}
                className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 font-bold">
                      R{step.round} · {step.agentId}
                    </span>
                    <span className="text-xs font-bold text-white">{step.agentName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      step.actionType === "CONSTITUTIONAL_VETO"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : step.actionType === "PARETO_CONSENSUS"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {step.actionType} ({step.latencyMs}ms)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{step.summary}</p>
                <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                  Constraint: {step.quantitativeConstraint}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Keccak-256 Merkle Inclusion Proof Tree + Compiled solc 0.8.28 Bytecode Inspector */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-grid-border">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-violet-400" />
                  Keccak-256 Merkle Inclusion Proof (Bus #{selectedBusId})
                </h3>
                <p className="text-xs text-slate-400">
                  Verifies leaf inclusion in the on-chain epoch root ({merkleData.includedLeafCount}/33 clean leaves included).
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  merkleData.targetBusProof.proofValid
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {merkleData.targetBusProof.proofValid
                  ? "MERKLE PROOF VALID ✅"
                  : "EXCLUDED (FDIA QUARANTINED) 🛡️"}
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Epoch Merkle Root</span>
                <span className="text-emerald-400 font-bold">
                  {merkleData.merkleRootHex.slice(0, 24)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bus #{selectedBusId} Leaf Hash</span>
                <span className="text-cyan-300">
                  {merkleData.targetBusProof.leafHashHex.slice(0, 24)}...
                </span>
              </div>
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">
                  Binary Merkle Sibling Path (Depth = {merkleData.targetBusProof.treeDepth})
                </div>
                {merkleData.targetBusProof.proofSteps.length > 0 ? (
                  merkleData.targetBusProof.proofSteps.slice(0, 4).map((st) => (
                    <div
                      key={st.level}
                      className="flex items-center justify-between text-[11px] bg-slate-900/70 px-2 py-1 rounded"
                    >
                      <span className="text-slate-400">
                        L{st.level} ({st.siblingPosition} Sibling)
                      </span>
                      <span className="text-violet-300">
                        {st.siblingHashHex.slice(0, 18)}... → {st.parentHashHex.slice(0, 14)}...
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-rose-400 text-[11px] py-1">
                    Bus #{selectedBusId} was quarantined by the Kirchhoff Firewall and excluded from the Merkle tree so the on-chain state root remains uncorrupted.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compiled EVM Bytecode & Method Selector Verification Card */}
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Compiled EVM Artifact ({COMPILED_GRIDVANE_CONTRACT.contractName}.sol)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                solc {COMPILED_GRIDVANE_CONTRACT.compilerVersion.split("+")[0]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Runtime Bytecode:</span>{" "}
                <strong className="text-white">
                  {COMPILED_GRIDVANE_CONTRACT.deployedBytecodeBytes} bytes
                </strong>
              </div>
              <div>
                <span className="text-slate-400">settleRecurringEpoch:</span>{" "}
                <strong className="text-emerald-400">
                  {COMPILED_GRIDVANE_CONTRACT.sampleSettleCalldataSelector}
                </strong>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Bytecode Keccak256: <code className="text-slate-300">{COMPILED_GRIDVANE_CONTRACT.bytecodeKeccak256}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
