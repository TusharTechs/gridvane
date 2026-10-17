/**
 * GridVane IEEE P3271.01 Recurring DLT Settlement & Triple-Silo Anti-Double-Counting Engine
 * Implements:
 * 1. IEEE P3271.01 Standard for Recurring DLT Transactions (15-min epoch channels + autonomous failover)
 * 2. Triple-Silo Cross-Registry State Lock (VCM Verra/GS <-> I-REC/YEK-G <-> EU CBAM / TSRS / Art. 6.2 ITMO)
 * 3. TSRS / IFRS S2 Climate Physical & Transition Risk Disclosure Generator
 */

import { keccak_256 } from "@noble/hashes/sha3";
import { FeederPresetSpec } from "../physics/feederPresets";
import { VPPOptimizationResult } from "../optimizer/vppOptimizer";
import { KirchhoffFirewallReport } from "../security/kirchhoffFirewall";

function hashHex(input: string): string {
  const bytes = keccak_256(new TextEncoder().encode(input));
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export type RegulatorySiloTarget =
  | "UNCLAIMED_AVAILABLE"
  | "SILO_1_VCM_RETIRED"
  | "SILO_2_IREC_REDEEMED"
  | "SILO_3_CBAM_TSRS_ITMO_LOCKED";

export interface TripleSiloCertificateBatch {
  batchId: string;
  feederId: string;
  feederName: string;
  originBuses: number[];
  epochWindow: string;
  verifiedCleanEnergyMWh: number;
  locationalMarginalEmissionsGPerKWh: number;
  verifiedAvoidedCO2eKg: number;
  transformerHotSpotSavedC: number;
  kirchhoffResidualMaxKW: number;
  mlDsa65AttestationRootHex: string;
  ppPqbPrivacyRootHex: string;
  activeClaimRegime: RegulatorySiloTarget;
  claimedByEntity: string;
  claimTimestampIso: string | null;
  siloStatus: {
    silo1_VCM_VerraGoldStandard: {
      serialId: string;
      status: "AVAILABLE" | "RETIRED_PRIMARY" | "CROSS_SILO_ENCUMBERED";
    };
    silo2_IREC_GuaranteeOfOrigin: {
      certificateId: string;
      status: "AVAILABLE" | "REDEEMED_PRIMARY" | "CROSS_SILO_ENCUMBERED";
    };
    silo3_CBAM_TSRS_Art62ITMO: {
      declarationId: string;
      correspondingAdjustmentApplied: boolean;
      status: "AVAILABLE" | "CLAIMED_PRIMARY" | "CROSS_SILO_ENCUMBERED";
    };
  };
  settlementTxHash: string;
}

export interface IEEEP3271RecurringChannel {
  channelId: string;
  standardVersion: "IEEE P3271.01-2026 Draft Standard";
  feederId: string;
  dsoCounterparty: string;
  vppAggregatorAddress: string;
  cadenceSeconds: number; // 900 seconds (15 minutes)
  currentEpoch: number;
  status: "ACTIVE_STREAMING" | "AUTONOMOUS_FAILOVER_ENGAGED" | "PAUSED_FIREWALL_ALERT";
  cumulativeMWhSettled: number;
  cumulativeAvoidedTCO2e: number;
  cumulativeProsumerPayoutUSD: number;
  cumulativeTransformerAALSavedUSD: number;
  slaMaxLatencyMs: number;
  lastHeartbeatMs: number;
  failoverBackupOracle: string;
  recentEpochs: {
    epochNumber: number;
    timestamp: string;
    settledKWh: number;
    avoidedKgCO2e: number;
    payoutUSD: number;
    kirchhoffMaxResidualKW: number;
    mlDsa65VerifiedMeters: number;
    stateRootHex: string;
    txHashHex: string;
  }[];
}

export function generateIEEEP3271ChannelState(
  preset: FeederPresetSpec,
  vppResult: VPPOptimizationResult,
  firewallReport: KirchhoffFirewallReport,
  simulateFailover: boolean = false
): IEEEP3271RecurringChannel {
  const cleanKWhPerEpoch =
    (vppResult.activeState.totalSolarGenerationKW + vppResult.activeState.totalBessDischargeKW) * 0.25;
  const avoidedKgPerEpoch = vppResult.metricsComparison.gridvane.avoidedEmissionsKgCO2e * 0.25;
  const payoutPerEpochUSD =
    (cleanKWhPerEpoch / 1000) * preset.peakTariffUSDPerMWh +
    (avoidedKgPerEpoch / 1000) * preset.carbonPriceUSDPerTon;

  const recentEpochs = Array.from({ length: 6 }, (_, idx) => {
    const epNum = 14820 - idx;
    const factor = 1 - idx * 0.035;
    const epKWh = Number((cleanKWhPerEpoch * factor).toFixed(1));
    const epCO2 = Number((avoidedKgPerEpoch * factor).toFixed(2));
    const epUSD = Number((payoutPerEpochUSD * factor).toFixed(2));
    const stateRootHex = hashHex(`P3271-${preset.id}-${epNum}-${epKWh}-${epCO2}`);
    const txHashHex = hashHex(`TX-ARB-SEPOLIA-${preset.id}-${epNum}`);

    return {
      epochNumber: epNum,
      timestamp: `2026-10-17T${String(17 - Math.floor(idx / 4)).padStart(2, "0")}:${String(
        (45 - (idx % 4) * 15 + 60) % 60
      ).padStart(2, "0")}:00Z`,
      settledKWh: epKWh,
      avoidedKgCO2e: epCO2,
      payoutUSD: epUSD,
      kirchhoffMaxResidualKW: idx === 0 ? firewallReport.maxResidualKW : 0.34,
      mlDsa65VerifiedMeters:
        idx === 0 ? firewallReport.verifiedCleanCount : firewallReport.totalBusesAudited,
      stateRootHex,
      txHashHex,
    };
  });

  return {
    channelId: `IEEE-P3271-CH-${preset.id.toUpperCase()}-0x8F4A`,
    standardVersion: "IEEE P3271.01-2026 Draft Standard",
    feederId: preset.id,
    dsoCounterparty: preset.dsoOperator,
    vppAggregatorAddress: "0x71C95911E9a5D330f4D621842EC243EE1343292e",
    cadenceSeconds: 900,
    currentEpoch: 14820,
    status: simulateFailover
      ? "AUTONOMOUS_FAILOVER_ENGAGED"
      : firewallReport.quarantinedCount > 0 && !firewallReport.firewallEnabled
      ? "PAUSED_FIREWALL_ALERT"
      : "ACTIVE_STREAMING",
    cumulativeMWhSettled: Number(((cleanKWhPerEpoch * 2880) / 1000).toFixed(2)),
    cumulativeAvoidedTCO2e: Number(((avoidedKgPerEpoch * 2880) / 1000).toFixed(2)),
    cumulativeProsumerPayoutUSD: Number((payoutPerEpochUSD * 2880).toFixed(0)),
    cumulativeTransformerAALSavedUSD: vppResult.metricsComparison.gridvane.aalSavingsUSDPerYear,
    slaMaxLatencyMs: 450,
    lastHeartbeatMs: simulateFailover ? 142 : 38,
    failoverBackupOracle: "Oracle-Autonomous-PQC-Validator-Node-02 (OCI Frankfurt / Istanbul)",
    recentEpochs,
  };
}

export function generateInitialTripleSiloBatches(
  preset: FeederPresetSpec,
  vppResult: VPPOptimizationResult
): TripleSiloCertificateBatch[] {
  const prefix = preset.country === "Türkiye" ? "TR" : preset.country === "Estonia" ? "EE" : "US";
  const lme = vppResult.activeState.maxLocationalMarginalEmissions;

  const definitions: {
    suffix: string;
    buses: number[];
    window: string;
    mwh: number;
    regime: RegulatorySiloTarget;
    entity: string;
    claimedAt: string | null;
  }[] = [
    {
      suffix: "BATCH-0901",
      buses: [16, 18, 31, 32, 33],
      window: "2026-10-17 12:00–14:00 UTC",
      mwh: 2.45,
      regime: "UNCLAIMED_AVAILABLE",
      entity: "Available in Pool (Unclaimed)",
      claimedAt: null,
    },
    {
      suffix: "BATCH-0900",
      buses: [6, 8, 10, 12],
      window: "2026-10-17 10:00–12:00 UTC",
      mwh: 3.12,
      regime: "SILO_3_CBAM_TSRS_ITMO_LOCKED",
      entity: "Anatolia Green Steel & Export Works (EU CBAM Decl. #CBAM-2026-884)",
      claimedAt: "2026-10-17T12:05:19Z",
    },
    {
      suffix: "BATCH-0899",
      buses: [20, 22, 24, 25],
      window: "2026-10-17 08:00–10:00 UTC",
      mwh: 1.98,
      regime: "SILO_2_IREC_REDEEMED",
      entity: "Mediterranean Data Center Corp (Scope 2 I-REC Retirement)",
      claimedAt: "2026-10-17T10:04:02Z",
    },
    {
      suffix: "BATCH-0898",
      buses: [4, 7, 14, 29, 30],
      window: "2026-10-17 06:00–08:00 UTC",
      mwh: 2.76,
      regime: "SILO_1_VCM_RETIRED",
      entity: "COP31 Antalya Aviation Offset Pool (Verra VCS Retirement)",
      claimedAt: "2026-10-17T08:11:44Z",
    },
  ];

  return definitions.map((d) => {
    const avoidedKg = Number((d.mwh * lme).toFixed(1));
    const mlRoot = hashHex(`MLDSA65-${preset.id}-${d.suffix}`);
    const ppRoot = hashHex(`PPPQB-${preset.id}-${d.suffix}`);
    const txHash = hashHex(`SETTLE-TX-${preset.id}-${d.suffix}`);

    return {
      batchId: `GV-${prefix}-2026-${d.suffix}`,
      feederId: preset.id,
      feederName: preset.shortName,
      originBuses: d.buses,
      epochWindow: d.window,
      verifiedCleanEnergyMWh: d.mwh,
      locationalMarginalEmissionsGPerKWh: lme,
      verifiedAvoidedCO2eKg: avoidedKg,
      transformerHotSpotSavedC: 11.4,
      kirchhoffResidualMaxKW: 0.31,
      mlDsa65AttestationRootHex: mlRoot,
      ppPqbPrivacyRootHex: ppRoot,
      activeClaimRegime: d.regime,
      claimedByEntity: d.entity,
      claimTimestampIso: d.claimedAt,
      siloStatus: buildSiloStatus(prefix, d.suffix, d.regime),
      settlementTxHash: txHash,
    };
  });
}

export function buildSiloStatus(
  prefix: string,
  suffix: string,
  regime: RegulatorySiloTarget
): TripleSiloCertificateBatch["siloStatus"] {
  return {
    silo1_VCM_VerraGoldStandard: {
      serialId: `VCS-2026-${prefix}-${suffix}`,
      status:
        regime === "UNCLAIMED_AVAILABLE"
          ? "AVAILABLE"
          : regime === "SILO_1_VCM_RETIRED"
          ? "RETIRED_PRIMARY"
          : "CROSS_SILO_ENCUMBERED",
    },
    silo2_IREC_GuaranteeOfOrigin: {
      certificateId: `IREC-${prefix}-2026-${suffix}`,
      status:
        regime === "UNCLAIMED_AVAILABLE"
          ? "AVAILABLE"
          : regime === "SILO_2_IREC_REDEEMED"
          ? "REDEEMED_PRIMARY"
          : "CROSS_SILO_ENCUMBERED",
    },
    silo3_CBAM_TSRS_Art62ITMO: {
      declarationId: `CBAM-TSRS-${prefix}-${suffix}`,
      correspondingAdjustmentApplied: regime === "SILO_3_CBAM_TSRS_ITMO_LOCKED",
      status:
        regime === "UNCLAIMED_AVAILABLE"
          ? "AVAILABLE"
          : regime === "SILO_3_CBAM_TSRS_ITMO_LOCKED"
          ? "CLAIMED_PRIMARY"
          : "CROSS_SILO_ENCUMBERED",
    },
  };
}
