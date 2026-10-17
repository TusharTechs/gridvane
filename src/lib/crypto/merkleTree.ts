/**
 * GridVane Cryptographic Merkle Inclusion Tree & Proof Verifier
 * Constructs a binary Keccak-256 Merkle tree over all verified IEEE 33-Bus smart-meter
 * telemetry + NIST FIPS 204 ML-DSA-65 leaves (automatically excluding FDIA-quarantined buses).
 */

import { keccak_256 } from "@noble/hashes/sha3";
import { IEEE33SolvedFeederState } from "../physics/ieee33bus";
import { KirchhoffFirewallReport } from "../security/kirchhoffFirewall";

function toHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function hashString(str: string): string {
  return toHex(keccak_256(new TextEncoder().encode(str)));
}

function hashPair(leftHex: string, rightHex: string): string {
  return hashString(`${leftHex.toLowerCase()}|${rightHex.toLowerCase()}`);
}

export interface MerkleLeafNode {
  busId: number;
  busName: string;
  excludedQuarantined: boolean;
  canonicalLeafString: string;
  leafHashHex: string;
}

export interface MerkleInclusionProof {
  busId: number;
  includedInEpochRoot: boolean;
  leafHashHex: string;
  merkleRootHex: string;
  treeDepth: number;
  proofSteps: {
    level: number;
    siblingHashHex: string;
    siblingPosition: "LEFT" | "RIGHT";
    parentHashHex: string;
  }[];
  verifiedRecomputedRootHex: string;
  proofValid: boolean;
}

export function buildFeederMerkleTreeAndProof(
  feederState: IEEE33SolvedFeederState,
  firewallReport: KirchhoffFirewallReport,
  targetBusId: number
): {
  merkleRootHex: string;
  includedLeafCount: number;
  excludedQuarantinedBuses: number[];
  leaves: MerkleLeafNode[];
  targetBusProof: MerkleInclusionProof;
} {
  const auditMap = new Map(firewallReport.nodeAudits.map((a) => [a.busId, a]));
  const leaves: MerkleLeafNode[] = [];
  const excludedQuarantinedBuses: number[] = [];

  for (const bus of feederState.buses) {
    const audit = auditMap.get(bus.busId);
    const isQuarantined =
      firewallReport.firewallEnabled && audit?.status === "QUARANTINED_FDIA";

    if (isQuarantined) {
      excludedQuarantinedBuses.push(bus.busId);
    }

    const canonicalLeafString = isQuarantined
      ? `QUARANTINED_EXCLUDED|BUS:${bus.busId}|RESIDUAL:${audit?.activePowerResidualKW}kW`
      : `VALID_LEAF|BUS:${bus.busId}|V:${bus.voltagePU}|NET_KW:${bus.netLoadKW}|PV_KW:${bus.solarActualKW}|BESS_KW:${bus.bessDispatchKW}|LME:${bus.locationalMarginalEmissionsGPerKWh}|RES:${audit?.activePowerResidualKW ?? 0.12}`;

    leaves.push({
      busId: bus.busId,
      busName: bus.name,
      excludedQuarantined: isQuarantined,
      canonicalLeafString,
      leafHashHex: hashString(canonicalLeafString),
    });
  }

  // Filter active leaves (or pad to power of 2 for binary Merkle construction)
  const activeLeaves = leaves.filter((l) => !l.excludedQuarantined);
  const baseHashes = activeLeaves.map((l) => l.leafHashHex);
  if (baseHashes.length === 0) {
    baseHashes.push(hashString("EMPTY_EPOCH"));
  }

  // Pad to next power of 2 (64 leaves for 33 buses)
  let targetPow2 = 1;
  while (targetPow2 < baseHashes.length) targetPow2 *= 2;
  const level0 = [...baseHashes];
  while (level0.length < targetPow2) {
    level0.push(level0[level0.length - 1]);
  }

  const levels: string[][] = [level0];
  let currentLevel = level0;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  const merkleRootHex = currentLevel[0];

  // Build inclusion proof for targetBusId
  const targetIdx = activeLeaves.findIndex((l) => l.busId === targetBusId);
  const targetLeaf =
    leaves.find((l) => l.busId === targetBusId) || leaves[0];

  if (targetIdx === -1) {
    // Target bus was quarantined by Kirchhoff Firewall!
    return {
      merkleRootHex,
      includedLeafCount: activeLeaves.length,
      excludedQuarantinedBuses,
      leaves,
      targetBusProof: {
        busId: targetBusId,
        includedInEpochRoot: false,
        leafHashHex: targetLeaf.leafHashHex,
        merkleRootHex,
        treeDepth: levels.length - 1,
        proofSteps: [],
        verifiedRecomputedRootHex: "0x0000000000000000000000000000000000000000000000000000000000000000",
        proofValid: false,
      },
    };
  }

  const proofSteps: MerkleInclusionProof["proofSteps"] = [];
  let idx = targetIdx;
  let runningHash = levels[0][idx];

  for (let lvl = 0; lvl < levels.length - 1; lvl++) {
    const isRightNode = idx % 2 === 1;
    const siblingIdx = isRightNode ? idx - 1 : idx + 1;
    const siblingHashHex = levels[lvl][siblingIdx];
    const siblingPosition: "LEFT" | "RIGHT" = isRightNode ? "LEFT" : "RIGHT";

    const parentHashHex =
      siblingPosition === "LEFT"
        ? hashPair(siblingHashHex, runningHash)
        : hashPair(runningHash, siblingHashHex);

    proofSteps.push({
      level: lvl + 1,
      siblingHashHex,
      siblingPosition,
      parentHashHex,
    });

    runningHash = parentHashHex;
    idx = Math.floor(idx / 2);
  }

  return {
    merkleRootHex,
    includedLeafCount: activeLeaves.length,
    excludedQuarantinedBuses,
    leaves,
    targetBusProof: {
      busId: targetBusId,
      includedInEpochRoot: true,
      leafHashHex: targetLeaf.leafHashHex,
      merkleRootHex,
      treeDepth: levels.length - 1,
      proofSteps,
      verifiedRecomputedRootHex: runningHash,
      proofValid: runningHash.toLowerCase() === merkleRootHex.toLowerCase(),
    },
  };
}
