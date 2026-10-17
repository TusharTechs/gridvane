"use client";

import React, { useState, useEffect } from "react";
import {
  FeederPresetSpec,
} from "@/lib/physics/feederPresets";
import { VPPOptimizationResult } from "@/lib/optimizer/vppOptimizer";
import { KirchhoffFirewallReport } from "@/lib/security/kirchhoffFirewall";
import {
  buildSiloStatus,
  generateIEEEP3271ChannelState,
  generateInitialTripleSiloBatches,
  RegulatorySiloTarget,
  TripleSiloCertificateBatch,
} from "@/lib/blockchain/settlementRegistry";
import {
  Link2,
  Lock,
  Download,
  RefreshCw,
  CheckCircle2,
  FileCheck2,
  Shield,
} from "lucide-react";

interface SettlementAndSiloPanelProps {
  preset: FeederPresetSpec;
  vppResult: VPPOptimizationResult;
  firewallReport: KirchhoffFirewallReport;
}

export function SettlementAndSiloPanel({
  preset,
  vppResult,
  firewallReport,
}: SettlementAndSiloPanelProps) {
  const [simulateFailover, setSimulateFailover] = useState(false);
  const [batches, setBatches] = useState<TripleSiloCertificateBatch[]>(() =>
    generateInitialTripleSiloBatches(preset, vppResult)
  );

  useEffect(() => {
    setBatches(generateInitialTripleSiloBatches(preset, vppResult));
  }, [preset, vppResult]);

  const channelState = generateIEEEP3271ChannelState(
    preset,
    vppResult,
    firewallReport,
    simulateFailover
  );

  function handleClaimSilo(batchId: string, targetRegime: RegulatorySiloTarget) {
    const prefix =
      preset.country === "Türkiye" ? "TR" : preset.country === "Estonia" ? "EE" : "US";

    setBatches((prev) =>
      prev.map((b) => {
        if (b.batchId !== batchId) return b;
        const suffix = b.batchId.split("-").slice(-2).join("-");
        const entityMap: Record<RegulatorySiloTarget, string> = {
          UNCLAIMED_AVAILABLE: "Available in Pool (Unclaimed)",
          SILO_1_VCM_RETIRED: "Retired in Voluntary Carbon Market (Verra VCS Registry)",
          SILO_2_IREC_REDEEMED: "Redeemed as Scope 2 I-REC / EU Guarantee of Origin",
          SILO_3_CBAM_TSRS_ITMO_LOCKED:
            "Locked for EU CBAM & Paris Art. 6.2 ITMO (Corresponding Adjustment Applied)",
        };
        return {
          ...b,
          activeClaimRegime: targetRegime,
          claimedByEntity: entityMap[targetRegime],
          claimTimestampIso:
            targetRegime === "UNCLAIMED_AVAILABLE" ? null : new Date().toISOString(),
          siloStatus: buildSiloStatus(prefix, suffix, targetRegime),
        };
      })
    );
  }

  function downloadJSON(filename: string, payload: unknown) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportTSRSReport() {
    const report = {
      documentStandard: "TSRS 2 / IFRS S2 Climate-Related Disclosures & IEEE Std C57.91-2011",
      generatedAt: new Date().toISOString(),
      cop31ShowcaseCity: preset.city,
      country: preset.country,
      dsoOperator: preset.dsoOperator,
      cmip6Scenario: vppResult.activeState.scenarioId,
      meteorologicalInputs: {
        ambientTemperatureC: vppResult.activeState.ambientTempC,
        solarIrradianceWm2: vppResult.activeState.irradianceWm2,
      },
      physicalClimateRiskMetrics: {
        baselinePeakTransformerHotSpotC:
          vppResult.metricsComparison.baseline.maxTransformerHotSpotC,
        gridvanePeakTransformerHotSpotC:
          vppResult.metricsComparison.gridvane.maxTransformerHotSpotC,
        arrheniusAgingReductionPct:
          vppResult.metricsComparison.gridvane.faaReductionPct,
        baselineExpectedAnnualLossUSD:
          vppResult.metricsComparison.baseline.totalExpectedAnnualLossUSD,
        gridvaneExpectedAnnualLossUSD:
          vppResult.metricsComparison.gridvane.totalExpectedAnnualLossUSD,
        netAnnualCapitalSavedUSD:
          vppResult.metricsComparison.gridvane.aalSavingsUSDPerYear,
        transformers: vppResult.activeState.transformers,
      },
      transitionAndEmissionsMetrics: {
        gridMarginalEmissionFactorGPerKWh: vppResult.activeState.gridMarginalEmissionsGPerKWh,
        maxLocationalMarginalEmissionGPerKWh:
          vppResult.activeState.maxLocationalMarginalEmissions,
        hourlyAvoidedEmissionsKgCO2e:
          vppResult.metricsComparison.gridvane.avoidedEmissionsKgCO2e,
        lineLossReductionPct: vppResult.metricsComparison.gridvane.lineLossReductionPct,
      },
      cryptographicAttestation: {
        pqcStandard: "NIST FIPS 204 ML-DSA-65 + PP-PQB Range Commitments",
        recurringSettlementStandard: channelState.standardVersion,
        channelId: channelState.channelId,
      },
    };
    downloadJSON(`GridVane_TSRS_IFRS_S2_Disclosure_${preset.id}.json`, report);
  }

  function handleExportCBAMPacket() {
    const packet = {
      documentStandard:
        "EU CBAM Implementing Regulation (EU) 2023/1773 & Paris Agreement Article 6.2 ITMO Pack",
      generatedAt: new Date().toISOString(),
      feederTwin: preset.name,
      ieeeP3271Channel: channelState.channelId,
      kirchhoffFirewallStatus: firewallReport.merkleStateRootStatus,
      tripleSiloBatches: batches,
    };
    downloadJSON(`GridVane_EU_CBAM_Art62_Evidence_${preset.id}.json`, packet);
  }

  return (
    <div className="space-y-4">
      {/* Top Action & Export Strip */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            IEEE P3271.01 Recurring DLT Settlement &amp; Triple-Silo Anti-Double-Counting Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous 15-minute autonomous state-channel settlement with atomic cross-registry locking across Verra/GS (VCM), I-REC/YEK-G, and EU CBAM / Turkish TSRS / Paris Art. 6.2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportTSRSReport}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export TSRS / IFRS S2 Report (JSON)
          </button>
          <button
            onClick={handleExportCBAMPacket}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Export EU CBAM &amp; Art. 6.2 Pack
          </button>
        </div>
      </div>

      {/* IEEE P3271.01 Recurring DLT Channel Card */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-grid-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                {channelState.standardVersion}
              </span>
              <span className="text-xs font-mono font-bold text-white">
                Channel: {channelState.channelId}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              DSO Counterparty: <strong className="text-slate-200">{channelState.dsoCounterparty}</strong> · Cadence: 900s (15-min epochs) · Backup Validator: {channelState.failoverBackupOracle}
            </div>
          </div>

          <button
            onClick={() => setSimulateFailover(!simulateFailover)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 transition ${
              simulateFailover
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {simulateFailover
              ? "P3271.01 Failover Oracle Active (Restore Primary)"
              : "Simulate Primary Oracle Timeout (Test P3271.01 Failover)"}
          </button>
        </div>

        {/* Channel Cumulative Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">30-Day Clean Energy Settled</div>
            <div className="text-base font-bold text-emerald-400">
              {channelState.cumulativeMWhSettled} MWh
            </div>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">30-Day LME Carbon Avoided</div>
            <div className="text-base font-bold text-cyan-300">
              {channelState.cumulativeAvoidedTCO2e} tCO2e
            </div>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">Prosumer Recurring Payouts</div>
            <div className="text-base font-bold text-amber-300">
              ${channelState.cumulativeProsumerPayoutUSD.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400">Channel State &amp; Heartbeat</div>
            <div className="text-xs font-bold text-emerald-300 mt-0.5">
              {channelState.status} ({channelState.lastHeartbeatMs}ms)
            </div>
          </div>
        </div>

        {/* Recent 15-Min Epochs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <th className="py-2 pr-2">Epoch #</th>
                <th className="py-2 px-2">Timestamp (UTC)</th>
                <th className="py-2 px-2">Settled Energy</th>
                <th className="py-2 px-2">LME Avoided CO2</th>
                <th className="py-2 px-2">Prosumer Payout</th>
                <th className="py-2 px-2">ML-DSA-65 Meters</th>
                <th className="py-2 pl-2">Arbitrum Sepolia Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {channelState.recentEpochs.map((ep) => (
                <tr key={ep.epochNumber} className="hover:bg-slate-900/50">
                  <td className="py-2 pr-2 font-bold text-cyan-300">#{ep.epochNumber}</td>
                  <td className="py-2 px-2 text-slate-400">{ep.timestamp}</td>
                  <td className="py-2 px-2 text-slate-200">{ep.settledKWh} kWh</td>
                  <td className="py-2 px-2 text-emerald-400">+{ep.avoidedKgCO2e} kgCO2e</td>
                  <td className="py-2 px-2 text-amber-300">${ep.payoutUSD}</td>
                  <td className="py-2 px-2 text-slate-300">{ep.mlDsa65VerifiedMeters}/33 Verified</td>
                  <td className="py-2 pl-2 text-slate-400">
                    <code>{ep.txHashHex.slice(0, 18)}...</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triple-Silo Anti-Double-Counting Interactive Registry */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
        <div>
          <h4 className="text-sm font-bold uppercase text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            Triple-Silo Anti-Double-Counting Cross-Registry State Machine
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Test our atomic cross-silo encumbrance: claiming a batch in <strong>any one regime</strong> automatically locks the corresponding MWh and tCO2e in the other two silos, preventing double-claiming between VCM, I-REC, and EU CBAM / Paris Art. 6.2.
          </p>
        </div>

        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {batch.batchId}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {batch.verifiedCleanEnergyMWh} MWh · {batch.verifiedAvoidedCO2eKg} kgCO2e (LME: {batch.locationalMarginalEmissionsGPerKWh} g/kWh)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Origin Buses: [{batch.originBuses.join(", ")}] · Window: {batch.epochWindow} · Status:{" "}
                    <strong className="text-cyan-300">{batch.claimedByEntity}</strong>
                  </div>
                </div>

                {/* Interactive Silo Claim Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <button
                    onClick={() => handleClaimSilo(batch.batchId, "SILO_1_VCM_RETIRED")}
                    className={`px-2.5 py-1 rounded border transition ${
                      batch.activeClaimRegime === "SILO_1_VCM_RETIRED"
                        ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/50 font-bold"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-500/40"
                    }`}
                  >
                    Lock Silo 1 (VCM)
                  </button>
                  <button
                    onClick={() => handleClaimSilo(batch.batchId, "SILO_2_IREC_REDEEMED")}
                    className={`px-2.5 py-1 rounded border transition ${
                      batch.activeClaimRegime === "SILO_2_IREC_REDEEMED"
                        ? "bg-cyan-500/25 text-cyan-200 border-cyan-500/50 font-bold"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/40"
                    }`}
                  >
                    Lock Silo 2 (I-REC)
                  </button>
                  <button
                    onClick={() =>
                      handleClaimSilo(batch.batchId, "SILO_3_CBAM_TSRS_ITMO_LOCKED")
                    }
                    className={`px-2.5 py-1 rounded border transition ${
                      batch.activeClaimRegime === "SILO_3_CBAM_TSRS_ITMO_LOCKED"
                        ? "bg-amber-500/25 text-amber-200 border-amber-500/50 font-bold"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/40"
                    }`}
                  >
                    Lock Silo 3 (CBAM/ITMO)
                  </button>
                  {batch.activeClaimRegime !== "UNCLAIMED_AVAILABLE" && (
                    <button
                      onClick={() => handleClaimSilo(batch.batchId, "UNCLAIMED_AVAILABLE")}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* 3-Silo Visual Status Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
                {/* Silo 1 */}
                <div
                  className={`p-2.5 rounded border ${
                    batch.siloStatus.silo1_VCM_VerraGoldStandard.status === "RETIRED_PRIMARY"
                      ? "bg-emerald-950/30 border-emerald-500/50"
                      : batch.siloStatus.silo1_VCM_VerraGoldStandard.status ===
                        "CROSS_SILO_ENCUMBERED"
                      ? "bg-rose-950/20 border-rose-500/30 opacity-80"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="text-[10px] uppercase text-slate-400">
                    Silo 1: Voluntary Carbon (Verra / GS)
                  </div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {batch.siloStatus.silo1_VCM_VerraGoldStandard.serialId}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    {batch.siloStatus.silo1_VCM_VerraGoldStandard.status ===
                    "RETIRED_PRIMARY" ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RETIRED PRIMARY CLAIM
                      </span>
                    ) : batch.siloStatus.silo1_VCM_VerraGoldStandard.status ===
                      "CROSS_SILO_ENCUMBERED" ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> ENCUMBERED (BLOCKED)
                      </span>
                    ) : (
                      <span className="text-slate-400">AVAILABLE UNCLAIMED</span>
                    )}
                  </div>
                </div>

                {/* Silo 2 */}
                <div
                  className={`p-2.5 rounded border ${
                    batch.siloStatus.silo2_IREC_GuaranteeOfOrigin.status === "REDEEMED_PRIMARY"
                      ? "bg-cyan-950/30 border-cyan-500/50"
                      : batch.siloStatus.silo2_IREC_GuaranteeOfOrigin.status ===
                        "CROSS_SILO_ENCUMBERED"
                      ? "bg-rose-950/20 border-rose-500/30 opacity-80"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="text-[10px] uppercase text-slate-400">
                    Silo 2: Renewable EAC (I-REC / YEK-G / GoO)
                  </div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {batch.siloStatus.silo2_IREC_GuaranteeOfOrigin.certificateId}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    {batch.siloStatus.silo2_IREC_GuaranteeOfOrigin.status ===
                    "REDEEMED_PRIMARY" ? (
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> REDEEMED PRIMARY CLAIM
                      </span>
                    ) : batch.siloStatus.silo2_IREC_GuaranteeOfOrigin.status ===
                      "CROSS_SILO_ENCUMBERED" ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> ENCUMBERED (BLOCKED)
                      </span>
                    ) : (
                      <span className="text-slate-400">AVAILABLE UNCLAIMED</span>
                    )}
                  </div>
                </div>

                {/* Silo 3 */}
                <div
                  className={`p-2.5 rounded border ${
                    batch.siloStatus.silo3_CBAM_TSRS_Art62ITMO.status === "CLAIMED_PRIMARY"
                      ? "bg-amber-950/30 border-amber-500/50"
                      : batch.siloStatus.silo3_CBAM_TSRS_Art62ITMO.status ===
                        "CROSS_SILO_ENCUMBERED"
                      ? "bg-rose-950/20 border-rose-500/30 opacity-80"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="text-[10px] uppercase text-slate-400">
                    Silo 3: EU CBAM / TSRS / Art. 6.2 ITMO
                  </div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {batch.siloStatus.silo3_CBAM_TSRS_Art62ITMO.declarationId}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    {batch.siloStatus.silo3_CBAM_TSRS_Art62ITMO.status ===
                    "CLAIMED_PRIMARY" ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> CLAIMED + ART. 6.2 CA LOCKED
                      </span>
                    ) : batch.siloStatus.silo3_CBAM_TSRS_Art62ITMO.status ===
                      "CROSS_SILO_ENCUMBERED" ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> ENCUMBERED (BLOCKED)
                      </span>
                    ) : (
                      <span className="text-slate-400">AVAILABLE UNCLAIMED</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
