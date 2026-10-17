"use client";

import React, { useState } from "react";
import {
  BusSolvedState,
  FEEDER_TRANSFORMERS,
  IEEE33SolvedFeederState,
} from "@/lib/physics/ieee33bus";
import { FirewallNodeAudit } from "@/lib/security/kirchhoffFirewall";
import {
  ShieldAlert,
  Zap,
  Sun,
  BatteryCharging,
  HeartPulse,
  Cpu,
  Activity,
  Radio,
} from "lucide-react";

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
  const [hoveredBusId, setHoveredBusId] = useState<number | null>(null);

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
    if (bus.busId === 1) return "#22D3EE";
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

  const activeInspectBusId = hoveredBusId ?? selectedBusId;
  const selectedBus = busMap.get(activeInspectBusId) || feederState.buses[17];
  const selectedAudit = auditMap.get(selectedBus.busId);

  return (
    <div className="gv-glass-card rounded-2xl p-4 lg:p-5 relative overflow-hidden">
      {/* Top Ambient Accent Line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 opacity-80" />

      {/* Header & Overlay Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shadow-glow-emerald">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm md:text-base font-bold tracking-tight text-white">
                IEEE 33-Bus Radial Distribution Digital Twin
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                12.66 kV AC DistFlow Solver
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover or click any bus node (1–33) to inspect live Locational Marginal Emissions (LME), phasor voltage, and FIPS 204 ML-DSA-65 state.
            </p>
          </div>
        </div>

        {/* Sleek Segmented Lens Switcher */}
        <div className="flex items-center gap-1 bg-[#040914]/90 p-1 rounded-xl border border-slate-800/90 text-xs">
          <button
            onClick={() => setOverlayMode("LME_CARBON")}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
              overlayMode === "LME_CARBON"
                ? "bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 text-emerald-200 border border-emerald-400/50 shadow-glow-emerald"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            LME Carbon Lens
          </button>
          <button
            onClick={() => setOverlayMode("VOLTAGE_PU")}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
              overlayMode === "VOLTAGE_PU"
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Phasor Voltage (p.u.)
          </button>
          <button
            onClick={() => setOverlayMode("FIREWALL_SECURITY")}
            className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all ${
              overlayMode === "FIREWALL_SECURITY"
                ? "bg-rose-500/25 text-rose-200 border border-rose-400/50 shadow-glow-rose"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Kirchhoff Firewall
          </button>
        </div>
      </div>

      {/* Interactive SCADA Vector Canvas */}
      <div className="relative w-full overflow-x-auto rounded-2xl bg-[#030711] border border-cyan-500/20 p-3 shadow-inner">
        {/* Top-Right Floating HUD Telemetry Pill */}
        <div className="hidden md:flex items-center gap-3 absolute top-5 right-5 z-10 px-3 py-1.5 rounded-full bg-[#061022]/90 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            {feederState.convergenceIterations} AC Sweeps
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-300">
            I²R Loss: <strong>{feederState.totalActiveLineLossKW} kW</strong> ({feederState.lineLossPct}%)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-300">
            V_min: <strong>{feederState.minVoltagePU.toFixed(3)} p.u.</strong>
          </span>
        </div>

        <svg
          viewBox="0 0 1000 500"
          className="w-full h-auto min-w-[740px] select-none"
        >
          <defs>
            <pattern id="scadaGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="#0B162C"
                strokeWidth="0.9"
              />
              <circle cx="36" cy="36" r="0.8" fill="#1E3A5F" opacity="0.5" />
            </pattern>
            <radialGradient id="canvasVignette" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#07142B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#02050B" stopOpacity="0.85" />
            </radialGradient>
            <filter id="glowEmerald" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRose" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="1000" height="500" fill="url(#scadaGrid)" />
          <rect width="1000" height="500" fill="url(#canvasVignette)" />

          {/* Architectural Sector Zones */}
          <rect
            x="105"
            y="36"
            width="255"
            height="72"
            rx="12"
            fill="rgba(6, 182, 212, 0.03)"
            stroke="rgba(6, 182, 212, 0.16)"
            strokeDasharray="4 4"
          />
          <text x="118" y="54" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" fontWeight="700" opacity="0.85">
            SECTOR A · NORTH CAMPUS &amp; EV V2G HUB (BUSES 19–22)
          </text>

          <rect
            x="160"
            y="122"
            width="235"
            height="68"
            rx="12"
            fill="rgba(245, 158, 11, 0.03)"
            stroke="rgba(245, 158, 11, 0.16)"
            strokeDasharray="4 4"
          />
          <text x="172" y="139" fill="#FBBF24" fontSize="9.5" fontFamily="monospace" fontWeight="700" opacity="0.85">
            SECTOR B · CBAM INDUSTRIAL LATERAL (BUSES 23–25)
          </text>

          <rect
            x="295"
            y="356"
            width="455"
            height="108"
            rx="12"
            fill="rgba(56, 189, 248, 0.035)"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeDasharray="4 4"
          />
          <text x="310" y="452" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" fontWeight="700" opacity="0.85">
            SECTOR C · HOSPITAL COOLING REFUGE &amp; HARBOR BESS LATERAL (BUSES 26–33)
          </text>

          <text x="480" y="218" fill="#6EE7B7" fontSize="10" fontFamily="monospace" fontWeight="700" opacity="0.8">
            PRIMARY 12.66 kV RADIAL FEEDER TRUNK (BUSES 1–18)
          </text>

          {/* 32 Radial Feeder Branches with Live Animated Electron Packets */}
          {feederState.branches.map((br) => {
            const u = busMap.get(br.fromBus);
            const v = busMap.get(br.toBus);
            if (!u || !v) return null;
            const strokeColor = getBranchStroke(br.loadingPct, br.toBus);
            const strokeW = Math.min(4.5, Math.max(2.0, br.apparentFlowKVA / 620));
            const isFast = br.loadingPct >= 50;

            return (
              <g key={`branch-${br.branchId}`}>
                {/* Base Conductor Glow */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeW + 2.5}
                  strokeOpacity={0.14}
                  strokeLinecap="round"
                />
                {/* Core Conductor Line */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeOpacity={0.5}
                  strokeLinecap="round"
                />
                {/* Animated Electron Stream */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke="#F8FAFC"
                  strokeWidth={Math.max(1.5, strokeW * 0.65)}
                  strokeOpacity={0.85}
                  strokeDasharray="4 10"
                  strokeLinecap="round"
                  className={isFast ? "animate-electron-fast" : "animate-electron-flow"}
                />
              </g>
            );
          })}

          {/* 33 Bus Nodes */}
          {feederState.buses.map((bus) => {
            const isSelected = bus.busId === selectedBusId;
            const isHovered = bus.busId === hoveredBusId;
            const audit = auditMap.get(bus.busId);
            const isQuarantined = audit?.status === "QUARANTINED_FDIA";
            const hasTrafo = trafoBusSet.has(bus.busId);
            const nodeColor = getBusColor(bus);
            const radius = bus.busId === 1 ? 14.5 : hasTrafo ? 11.5 : 9.2;

            return (
              <g
                key={`bus-${bus.busId}`}
                onClick={() => onSelectBus(bus.busId)}
                onMouseEnter={() => setHoveredBusId(bus.busId)}
                onMouseLeave={() => setHoveredBusId(null)}
                className="cursor-pointer"
              >
                {/* Ambient Node Aura */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r={radius + 6}
                  fill={nodeColor}
                  fillOpacity={isSelected || isHovered ? 0.25 : 0.08}
                />

                {/* Vulnerable Cooling Refuge Protective Aura */}
                {bus.isVulnerableProtected && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 9.5}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                    className="animate-radar-pulse"
                  />
                )}

                {/* FDIA Quarantine Danger Ring */}
                {isQuarantined && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 12}
                    fill="rgba(244, 63, 94, 0.28)"
                    stroke="#F43F5E"
                    strokeWidth="2.5"
                    filter="url(#glowRose)"
                    className="animate-radar-pulse"
                  />
                )}

                {/* Selected / Hovered Bus Highlight Ring */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={bus.x}
                    cy={bus.y}
                    r={radius + 6.5}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    filter="url(#glowEmerald)"
                  />
                )}

                {/* IEEE C57.91 Monitored Transformer Frame */}
                {hasTrafo && (
                  <rect
                    x={bus.x - radius - 2.5}
                    y={bus.y - radius - 2.5}
                    width={(radius + 2.5) * 2}
                    height={(radius + 2.5) * 2}
                    rx="5"
                    fill="#071124"
                    stroke="#F59E0B"
                    strokeWidth="1.8"
                  />
                )}

                {/* Main Bus Node Circle */}
                <circle
                  cx={bus.x}
                  cy={bus.y}
                  r={radius}
                  fill="#071226"
                  stroke={nodeColor}
                  strokeWidth={isSelected || isHovered ? "3.4" : "2.4"}
                />

                {/* Bus Number */}
                <text
                  x={bus.x}
                  y={bus.y + 3.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={bus.busId === 1 ? "10.5" : "9.2"}
                  fontFamily="monospace"
                  fontWeight="800"
                >
                  {bus.busId}
                </text>

                {/* Nodal Telemetry Sub-Label */}
                <text
                  x={bus.x}
                  y={bus.y + radius + 13}
                  textAnchor="middle"
                  fill={isQuarantined ? "#FDA4AF" : isSelected ? "#6EE7B7" : "#94A3B8"}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight={isSelected ? "700" : "500"}
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
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-amber-400 bg-slate-900 inline-block" />
              <span>IEEE C57.91 Transformer (Buses 1, 6, 14, 18, 25, 30)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-dashed border-sky-400 inline-block" />
              <span>Thermal-Equity Refuge (Buses 7, 14, 29)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>High LME Carbon Node (+8.5% to +14.2%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>FDIA Quarantined Node</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">
            ● Live Electron Speed ∝ Branch MVA Loading
          </span>
        </div>
      </div>

      {/* Selected / Hovered Bus Live Inspector Ribbon */}
      <div className="mt-3.5 rounded-xl bg-[#050C1A]/95 border border-cyan-500/25 p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-extrabold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              BUS #{selectedBus.busId}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {selectedBus.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 truncate">
            <span className="text-cyan-300 font-mono">{selectedBus.role}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Nodal Phasor Voltage
          </div>
          <div className="text-sm font-mono font-bold text-white mt-0.5">
            {selectedBus.voltagePU.toFixed(4)} p.u.{" "}
            <span className="text-[11px] font-normal text-slate-400">
              (∠{selectedBus.voltageAngleDeg.toFixed(1)}°)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" /> DER Active Injection
          </div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
            {selectedBus.solarActualKW} kW PV{" "}
            <span className="text-cyan-300">+{selectedBus.bessDispatchKW} kW V2G</span>
          </div>
        </div>

        <div className="bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <BatteryCharging className="w-3 h-3 text-emerald-400" /> Locational LME
          </div>
          <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
            {selectedBus.locationalMarginalEmissionsGPerKWh} g/kWh{" "}
            <span className="text-[11px] text-emerald-400">
              (+{selectedBus.lmePremiumPct}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800/90">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            {selectedAudit?.status === "QUARANTINED_FDIA" ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : selectedBus.isVulnerableProtected ? (
              <HeartPulse className="w-3 h-3 text-sky-400" />
            ) : (
              <Cpu className="w-3 h-3 text-emerald-400" />
            )}
            Kirchhoff &amp; Equity Gate
          </div>
          <div
            className={`text-xs font-mono font-bold mt-0.5 ${
              selectedAudit?.status === "QUARANTINED_FDIA"
                ? "text-rose-400"
                : selectedBus.isVulnerableProtected
                ? "text-sky-300"
                : "text-emerald-400"
            }`}
          >
            {selectedAudit?.status === "QUARANTINED_FDIA"
              ? `FDIA QUARANTINED (r=${selectedAudit.activePowerResidualKW}kW)`
              : selectedBus.isVulnerableProtected
              ? "REFUGE PROTECTED (0kW Cut)"
              : `CLEAN (r=${selectedAudit?.activePowerResidualKW ?? 0.12}kW)`}
          </div>
        </div>
      </div>
    </div>
  );
}
