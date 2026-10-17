"use client";

import React, { useMemo, useState } from "react";
import {
  ADVERSARIAL_ATTACK_SCENARIOS,
  AdversarialAttackType,
  KirchhoffFirewallReport,
} from "@/lib/security/kirchhoffFirewall";
import { IEEE33SolvedFeederState } from "@/lib/physics/ieee33bus";
import { signAndVerifySmartMeterTelemetry } from "@/lib/crypto/pqcEngine";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Cpu,
  AlertOctagon,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface KirchhoffAndPQCPanelProps {
  feederId: string;
  feederState: IEEE33SolvedFeederState;
  firewallReport: KirchhoffFirewallReport;
  selectedBusId: number;
  onSelectBus: (busId: number) => void;
  attackType: AdversarialAttackType;
  onChangeAttackType: (type: AdversarialAttackType) => void;
  spoofKW: number;
  onChangeSpoofKW: (kw: number) => void;
  firewallEnabled: boolean;
  onToggleFirewall: (enabled: boolean) => void;
}

export function KirchhoffAndPQCPanel({
  feederId,
  feederState,
  firewallReport,
  selectedBusId,
  onSelectBus,
  attackType,
  onChangeAttackType,
  spoofKW,
  onChangeSpoofKW,
  firewallEnabled,
  onToggleFirewall,
}: KirchhoffAndPQCPanelProps) {
  const [tamperSignatureTest, setTamperSignatureTest] = useState(false);

  const selectedBus =
    feederState.buses.find((b) => b.busId === selectedBusId) || feederState.buses[17];
  const selectedAudit =
    firewallReport.nodeAudits.find((a) => a.busId === selectedBus.busId) ||
    firewallReport.nodeAudits[17];

  const activeScenario = ADVERSARIAL_ATTACK_SCENARIOS[attackType];

  // Execute real NIST FIPS 204 ML-DSA-65 signing & verification in the browser for the selected bus
  const pqcBundle = useMemo(() => {
    const trafoHotSpot = feederState.transformers[0]?.hotSpotTempC ?? 102.4;
    return signAndVerifySmartMeterTelemetry(
      {
        feederId,
        busId: selectedBus.busId,
        epochNumber: 14820,
        timestampIso: "2026-10-17T14:00:00Z",
        netEnergyKWh: Number((selectedBus.netLoadKW * 0.25).toFixed(2)),
        solarGeneratedKWh: Number((selectedBus.solarActualKW * 0.25).toFixed(2)),
        bessDispatchedKWh: Number((selectedBus.bessDispatchKW * 0.25).toFixed(2)),
        locationalMarginalEmissionsGPerKWh: selectedBus.locationalMarginalEmissionsGPerKWh,
        avoidedEmissionsKgCO2e: Number(
          (
            ((selectedBus.solarActualKW + Math.max(0, selectedBus.bessDispatchKW)) *
              0.25 *
              selectedBus.locationalMarginalEmissionsGPerKWh) /
            1000
          ).toFixed(3)
        ),
        voltagePU: selectedBus.voltagePU,
        transformerHotSpotC: trafoHotSpot,
        kirchhoffResidualKW: selectedAudit.activePowerResidualKW,
      },
      selectedBus.grossLoadKW,
      tamperSignatureTest
    );
  }, [
    feederId,
    selectedBus,
    selectedAudit.activePowerResidualKW,
    feederState.transformers,
    tamperSignatureTest,
  ]);

  return (
    <div className="space-y-4">
      {/* Top Red-Team Control Bar */}
      <div className="bg-grid-panel border border-grid-border rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-grid-border">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Adversarial Red-Team Smart-Meter Spoofing (FDIA) & Kirchhoff Residual Firewall
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Even if an attacker clamps a physical CT sensor or compromises a meter key, fake solar kWh violates Kirchhoff&apos;s AC branch power &amp; voltage-drop equations (r_ij = |P_i - P_j - I_ij² R_ij|).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFirewall(!firewallEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                firewallEnabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              {firewallEnabled ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  KIRCHHOFF FIREWALL: ARMED
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5" />
                  KIRCHHOFF FIREWALL: BYPASSED (UNSAFE)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Attack Selector & Spoof Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[11px] font-mono uppercase text-slate-400 block">
              Select Red-Team Adversarial Attack Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ADVERSARIAL_ATTACK_SCENARIOS) as AdversarialAttackType[]).map(
                (key) => {
                  const sc = ADVERSARIAL_ATTACK_SCENARIOS[key];
                  const active = attackType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onChangeAttackType(key);
                        onSelectBus(sc.targetBusId);
                        onChangeSpoofKW(sc.defaultSpoofKW);
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition ${
                        active
                          ? key === "NONE"
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200"
                            : "bg-rose-500/15 border-rose-500/50 text-rose-200"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold truncate">{sc.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Target: Bus #{sc.targetBusId} · Spoof: +{sc.defaultSpoofKW} kW
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono">Injected Phantom Power</span>
                <span className="font-mono font-bold text-rose-400">+{spoofKW} kW</span>
              </div>
              <input
                type="range"
                min={0}
                max={160}
                step={5}
                value={spoofKW}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeSpoofKW(val);
                  if (val > 0 && attackType === "NONE") {
                    onChangeAttackType("SOLAR_EXPORT_INFLATION");
                  }
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                <span>0 kW (Authentic)</span>
                <span>2.5 kW (3σ Gate)</span>
                <span>160 kW (Severe FDIA)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
              <div className="text-slate-400">
                <strong className="text-slate-200">Threat Vector:</strong>{" "}
                {activeScenario.description}
              </div>
              <div className="text-emerald-300 font-mono text-[10px]">
                Defense: {activeScenario.defenseMechanism}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split View: Left = Kirchhoff Nodal Residual Audit | Right = Live NIST FIPS 204 ML-DSA-65 + PP-PQB Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Kirchhoff Residual Audit */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Kirchhoff DistFlow Residual Audit (33 Buses)
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                firewallReport.merkleStateRootStatus === "ANCHORED_CLEAN"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : firewallReport.merkleStateRootStatus === "QUARANTINE_ISOLATED_SAFE"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              {firewallReport.merkleStateRootStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Max Residual r_ij</div>
              <div
                className={`text-sm font-bold ${
                  firewallReport.maxResidualKW > 2.5 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {firewallReport.maxResidualKW} kW (Bus {firewallReport.maxResidualBusId})
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Quarantined Meters</div>
              <div className="text-sm font-bold text-amber-300">
                {firewallReport.quarantinedCount} / {firewallReport.totalBusesAudited} Nodes
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded p-2">
              <div className="text-[10px] text-slate-400">Blocked Greenwash</div>
              <div className="text-sm font-bold text-emerald-400">
                {firewallReport.preventedFraudulentCO2Kg} kgCO2e
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[300px] border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-2 px-2.5">Bus</th>
                  <th className="py-2 px-2">Reported P</th>
                  <th className="py-2 px-2">DistFlow P</th>
                  <th className="py-2 px-2">Residual r_i</th>
                  <th className="py-2 px-2">Z-Score</th>
                  <th className="py-2 px-2">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {firewallReport.nodeAudits
                  .slice()
                  .sort((a, b) => b.activePowerResidualKW - a.activePowerResidualKW)
                  .slice(0, 12)
                  .map((audit) => (
                    <tr
                      key={audit.busId}
                      onClick={() => onSelectBus(audit.busId)}
                      className={`cursor-pointer transition ${
                        audit.busId === selectedBusId
                          ? "bg-slate-800/80"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <td className="py-2 px-2.5 font-bold text-slate-200">
                        Bus #{audit.busId}
                      </td>
                      <td className="py-2 px-2 text-slate-300">
                        {audit.reportedNetLoadKW} kW
                      </td>
                      <td className="py-2 px-2 text-slate-400">
                        {audit.physicsExpectedNetLoadKW} kW
                      </td>
                      <td
                        className={`py-2 px-2 font-bold ${
                          audit.activePowerResidualKW > 2.5
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {audit.activePowerResidualKW} kW
                      </td>
                      <td className="py-2 px-2 text-slate-300">{audit.zScoreSigma}σ</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            audit.status === "QUARANTINED_FDIA"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {audit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real-Time NIST FIPS 204 ML-DSA-65 + PP-PQB Cryptographic Verifier */}
        <div className="bg-grid-panel border border-grid-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold uppercase text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                NIST FIPS 204 ML-DSA-65 &amp; PP-PQB Verifier (Bus #{selectedBus.busId})
              </h4>
              <p className="text-[11px] text-slate-400">
                Live browser execution via <code className="text-cyan-300">@noble/post-quantum</code> · {pqcBundle.securityLevel}
              </p>
            </div>

            <button
              onClick={() => setTamperSignatureTest(!tamperSignatureTest)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold border transition ${
                tamperSignatureTest
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
              }`}
            >
              {tamperSignatureTest ? "Restore Valid Signature" : "Test Bit-Flip Tamper"}
            </button>
          </div>

          {/* Cryptographic Verification Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              pqcBundle.tamperCheckPassed
                ? "bg-emerald-950/30 border-emerald-500/40"
                : "bg-rose-950/30 border-rose-500/40"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {pqcBundle.tamperCheckPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-white">
                  {pqcBundle.tamperCheckPassed
                    ? "HYBRID PQC + KIRCHHOFF GATE: ATTESTATION VALID"
                    : !pqcBundle.signatureVerified
                    ? "ML-DSA-65 LATTICE SIGNATURE REJECTED (PAYLOAD TAMPERED)"
                    : "BLOCKED BY KIRCHHOFF PHYSICS RESIDUAL (> 2.5 kW)"}
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  Device: {pqcBundle.meterDeviceId} · Verify Latency: {pqcBundle.metrics.verifyTimeMs} ms
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
              FIPS 204
            </span>
          </div>

          {/* Lattice Key & Signature Details */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">ML-DSA-65 Public Key Size</span>
              <span className="text-emerald-300 font-bold">
                {pqcBundle.mlDsa65PublicKeyBytes} bytes (Hash: {pqcBundle.mlDsa65PublicKeyHashHex.slice(0, 18)}...)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ML-DSA-65 Lattice Signature</span>
              <span className="text-cyan-300 font-bold">
                {pqcBundle.mlDsa65SignatureBytes} bytes ({pqcBundle.mlDsa65SignaturePreviewHex.slice(0, 22)}...)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">EIP-712 Keccak-256 Digest</span>
              <span className="text-slate-200">
                {pqcBundle.eip712PayloadDigestHex.slice(0, 26)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PQC Execution Timings</span>
              <span className="text-amber-300">
                KeyGen: {pqcBundle.metrics.keygenTimeMs}ms · Sign: {pqcBundle.metrics.signTimeMs}ms · Verify: {pqcBundle.metrics.verifyTimeMs}ms
              </span>
            </div>
          </div>

          {/* PP-PQB Privacy-Preserving Post-Quantum Commitment Card */}
          <div className="bg-slate-950/90 border border-violet-500/30 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                PP-PQB Privacy-Preserving Range Commitment
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-200">
                Household Load Blinded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Blinds raw household occupancy curve (P_load) with a 256-bit SHA3 lattice salt while proving net injection lies within physical inverter bounds [{pqcBundle.ppPqbProof.rangeBoundsKW[0]}, +{pqcBundle.ppPqbProof.rangeBoundsKW[1]}] kW.
            </p>
            <div className="text-[11px] font-mono text-slate-300 pt-1 flex flex-wrap justify-between gap-2">
              <span>
                Commitment: <code className="text-violet-300">{pqcBundle.ppPqbProof.blindedLoadCommitmentHex.slice(0, 24)}...</code>
              </span>
              <span className="text-emerald-400 font-bold">
                ZK Range Proof: {pqcBundle.ppPqbProof.zeroKnowledgeRangeValid ? "VALID ✅" : "INVALID"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
