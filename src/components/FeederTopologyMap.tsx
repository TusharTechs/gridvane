"use client";

import React, { useState } from "react";
import {
  BusSolvedState,
  FEEDER_TRANSFORMERS,
  IEEE33SolvedFeederState,
} from "@/lib/physics/ieee33bus";
import { FirewallNodeAudit } from "@/lib/security/kirchhoffFirewall";
import { ShieldAlert, Zap, Sun, BatteryCharging, HeartPulse, Cpu } from "lucide-react";

interface FeederTopologyMapProps {
  feederState: IEEE33SolvedFeederState;
  selectedBusId: number;
  onSelectBus: (busId: number) => void;
  nodeAudits: FirewallNodeAudit[];
}

type ColorOverlayMode = "LME_CARBON" | "VOLTAGE_PU" | "FIREWALL_SECURITY";

export function FeederTopologyMap({
  feederState,
  selectedBusId,
  onSelectBus,
  nodeAudits,
}: FeederTopologyMapProps) {
  const [overlayMode, setOverlayMode] = useState<ColorOverlayMode>("LME_CARBON");

  const busMap = new Map<number, BusSolvedState>();
  for (const b of feederState.buses) {
    busMap.set(b.busId, b);
  }

  const auditMap = new Map<number, FirewallNodeAudit>();
  for (const a of nodeAudits) {
    auditMap.set(a.busId, a);
  }

  const trafoBusSet = new Set<number>(FEEDER_TRANSFORMERS.map((t) => t.busId));

  function getBusColor(bus: BusSolvedState): string {
    const audit = auditMap.get(bus.busId);
    if (audit?.status === "QUARANTINED_FDIA") {
      return "#F43F5E"; // Rose alert for FDIA spoofed node
    }

    if (overlayMode === "FIREWALL_SECURITY") {
      if (bus.isVulnerableProtected) return "#38BDF8";
      return "#10B981";
    }

    if (overlayMode === "VOLTAGE_PU") {
      if (bus.voltagePU < 0.945) return "#F43F5E";
      if (bus.voltagePU < 0.965) return "#F59E0B";
      if (bus.voltagePU > 1.03) return "#8B5CF6";
      return "#10B981";
    }

    // Default: LME_CARBON (Locational Marginal Emissions premium)
    if (bus.busId === 1) return "#06B6D4";
    if (bus.lmePremiumPct >= 8.5) return "#F59E0B"; // High LME carbon value node
    if (bus.lmePremiumPct >= 4.5) return "#10B981";
    return "#38BDF8";
  }

  function getBranchStroke(loadingPct: number, toBusId: number): string {
    const audit = auditMap.get(toBusId);
    if (audit?.status === "QUARANTINED_FDIA") return "#F43F5E";
    if (loadingPct >= 80) return "#F43F5E";
    if (loadingPct >= 55) return "#F59E0B";
    return "#10B981";
  }

  const selectedBus = busMap.get(selectedBusId) || feederState.buses[17];
  const selectedAudit = auditMap.get(selectedBus.busId);

  return (
    <div className="bg-grid-panel border border-grid-border rounded-xl p-4 shadow-xl">
      {/* Header & Overlay Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-grid-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100">
              IEEE 33-Bus Radial Distribution Digital Twin (12.66 kV DistFlow AC Solver)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any bus node (1–33) to inspect real-time Locational Marginal Emissions (LME), nodal phasor voltage, and NIST FIPS 204 ML-DSA-65 signature.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setOverlayMode("LME_CARBON")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              overlayMode === "LME_CARBON"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            LME Carbon Intensity
          </button>
          <button
            onClick={() => setOverlayMode("VOLTAGE_PU")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              overlayMode === "VOLTAGE_PU"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Voltage Profile (p.u.)
          </button>
          <button
            onClick={() => setOverlayMode("FIREWALL_SECURITY")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              overlayMode === "FIREWALL_SECURITY"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Kirchhoff Firewall
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full overflow-x-auto bg-[#050912] border border-slate-800/80 rounded-lg p-2">
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-auto min-w-[760px] select-none"
        >
          <defs>
            <pattern id="scadaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#111C30"
                strokeWidth="0.8"
              />
            </pattern>
            <filter id="glowEmerald" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="1000" height="500" fill="url(#scadaGrid)" />

          {/* Zone Labels */}
          <text x="22" y="28" fill="#64748B" fontSize="11" fontFamily="monospace" fontWeight="600">
            ZONE A: NORTH LATERAL (BUSES 19–22 · CAMPUS & EV HUB)
          </text>
          <text x="235" y="128" fill="#64748B" fontSize="11" fontFamily="monospace" fontWeight="600">
            ZONE B: CENTRAL LATERAL (BUSES 23–25 · GREEN MANUFACTURING & CBAM)
          </text>
          <text x="515" y="225" fill="#64748B" fontSize="11" fontFamily="monospace" fontWeight="600">
            MAIN RADIAL TRUNK (BUSES 1–18 · 12.66 kV PRIMARY FEEDER)
          </text>
          <text x="410" y="472" fill="#64748B" fontSize="11" fontFamily="monospace" fontWeight="600">
            ZONE C: SOUTH LATERAL (BUSES 26–33 · HOSPITAL COOLING REFUGE & HARBOR V2G)
          </text>

          {/* 32 Radial Branches */}
          {feederState.branches.map((br) => {
            const u = busMap.get(br.fromBus);
            const v = busMap.get(br.toBus);
            if (!u || !v) return null;
            const strokeColor = getBranchStroke(br.loadingPct, br.toBus);
            const strokeW = Math.min(4.2, Math.max(1.8, br.apparentFlowKVA / 650));

            return (
              <g key={`branch-${br.branchId}`}>
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeOpacity={0.65}
                />
                {/* Animated flow dashed overlay */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeW * 0.7}
                  strokeDasharray="5 7"
                />
              </g>
            );
          })}

          {/* 33 Bus Nodes */}
          {feederState.buses.map((bus) => {
            const isSelected = bus.busId === selectedBusId;
            const audit = auditMap.get(bus.busId);
            const isQuarantined = audit?.status === "QUARANTINED_FDIA";
            const hasTrafo = trafoBusSet.has(bus.busId);
            const nodeColor = getBusColor(bus);
            const radius = bus.busId === 1 ? 14 : hasTrafo ? 11.5 : 9;

            return (
              <g
                key={`bus-${bus.busId}`}
                onClick={() => onSelectBus(bus.busId)}
                className="cursor-pointer transition-transform"
              >
                {/* Vulnerable Cooling Refuge Protective Aura */}
                {bus.isVulnerableProtected && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 9}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.6"
                    strokeDasharray="3 3"
                  />
                )}

                {/* FDIA Quarantine Danger Ring */}
                {isQuarantined && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 11}
                    fill="rgba(244, 63, 94, 0.22)"
                    stroke="#F43F5E"
                    strokeWidth="2.4"
                  />
                )}

                {/* Selected Bus Highlight Ring */}
                {isSelected && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 6}
                    fill="none"
                    stroke="#F8FAFC"
                    strokeWidth="2.2"
                    filter="url(#glowEmerald)"
                  />
                )}

                {/* Transformer Square Badge */}
                {hasTrafo && (
                  <rect
                    x={bus.x - radius - 2}
                    y={bus.y - radius - 2}
                    width={(radius + 2) * 2}
                    height={(radius + 2) * 2}
                    rx="4"
                    fill="#091326"
                    stroke="#F59E0B"
                    strokeWidth="1.4"
                  />
                )}

                {/* Main Bus Circle */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r={radius}
                  fill="#0B1528"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? "3.2" : "2.2"}
                />

                {/* Bus Number */}
                <text
                  x={bus.x}
                  y={bus.y + 3.5}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize={bus.busId === 1 ? "10" : "9"}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {bus.busId}
                </text>

                {/* Nodal telemetry sub-label */}
                <text
                  x={bus.x}
                  y={bus.y + radius + 13}
                  textAnchor="middle"
                  fill={isQuarantined ? "#FDA4AF" : "#94A3B8"}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {overlayMode === "VOLTAGE_PU"
                    ? `${bus.voltagePU.toFixed(3)}pu`
                    : overlayMode === "FIREWALL_SECURITY"
                    ? `r=${(audit?.activePowerResidualKW ?? 0).toFixed(1)}kW`
                    : `${Math.round(bus.locationalMarginalEmissionsGPerKWh)}g`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Bar inside Map */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-amber-400 bg-slate-900 inline-block" />
              IEEE C57.91 Monitored Transformer (Buses 1, 6, 14, 18, 25, 30)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-dashed border-sky-400 inline-block" />
              Thermal-Equity Protected Refuge (Buses 7, 14, 29)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              High LME Carbon Premium (+8.5% to +14.2% Line-Loss Multiplier)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Kirchhoff FDIA Quarantined Node
            </span>
          </div>
          <div className="font-mono text-slate-300">
            DistFlow Converged in {feederState.convergenceIterations} iterations · Loss:{" "}
            <span className="text-emerald-400 font-semibold">
              {feederState.totalActiveLineLossKW} kW ({feederState.lineLossPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Selected Bus Quick Telemetry Strip */}
      <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              BUS #{selectedBus.busId}
            </span>
            <span className="text-xs font-semibold text-white truncate">
              {selectedBus.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>{selectedBus.zone}</span>
            <span>•</span>
            <span className="text-cyan-300 font-mono">{selectedBus.role}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800/80">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Phasor Voltage
          </div>
          <div className="text-sm font-mono font-bold text-slate-100">
            {selectedBus.voltagePU.toFixed(4)} p.u.{" "}
            <span className="text-[11px] font-normal text-slate-400">
              ({selectedBus.voltageAngleDeg.toFixed(1)}°)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800/80">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" /> PV / BESS Dispatch
          </div>
          <div className="text-sm font-mono font-bold text-emerald-400">
            {selectedBus.solarActualKW} kW PV{" "}
            <span className="text-cyan-300">+{selectedBus.bessDispatchKW} kW V2G</span>
          </div>
        </div>

        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800/80">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            <BatteryCharging className="w-3 h-3 text-emerald-400" /> Nodal LME Intensity
          </div>
          <div className="text-sm font-mono font-bold text-amber-300">
            {selectedBus.locationalMarginalEmissionsGPerKWh} g/kWh{" "}
            <span className="text-[11px] text-emerald-400">
              (+{selectedBus.lmePremiumPct}% LME)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800/80">
          <div className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
            {selectedAudit?.status === "QUARANTINED_FDIA" ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : selectedBus.isVulnerableProtected ? (
              <HeartPulse className="w-3 h-3 text-sky-400" />
            ) : (
              <Cpu className="w-3 h-3 text-emerald-400" />
            )}
            Kirchhoff / Equity Status
          </div>
          <div
            className={`text-xs font-mono font-bold ${
              selectedAudit?.status === "QUARANTINED_FDIA"
                ? "text-rose-400"
                : selectedBus.isVulnerableProtected
                ? "text-sky-300"
                : "text-emerald-400"
            }`}
          >
            {selectedAudit?.status === "QUARANTINED_FDIA"
              ? `QUARANTINED (r=${selectedAudit.activePowerResidualKW}kW)`
              : selectedBus.isVulnerableProtected
              ? "COOLING PROTECTED (0kW Cut)"
              : `VERIFIED (r=${selectedAudit?.activePowerResidualKW ?? 0.12}kW)`}
          </div>
        </div>
      </div>
    </div>
  );
}
