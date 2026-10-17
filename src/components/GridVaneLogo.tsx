"use client";

import React, { useState } from "react";
import { X, Sparkles, ShieldCheck, Wind, Flame, Cpu } from "lucide-react";

interface GridVaneLogoProps {
  size?: "sm" | "md" | "lg";
  interactiveModal?: boolean;
  isLightMode?: boolean;
}

export function GridVaneEmblemSVG({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      className={className}
    >
      <defs>
        <radialGradient id="gvCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="28%" stopColor="#6EE7B7" />
          <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#040814" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gvHexOuter" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#00629B" />
        </linearGradient>
        <linearGradient id="gvBladeCyan" x1="50" y1="20" x2="150" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#00629B" />
        </linearGradient>
        <linearGradient id="gvBladeEmerald" x1="30" y1="40" x2="160" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="60%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="gvBladeAmber" x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Post-Quantum Hexagonal Lattice Outer Truss */}
      <polygon
        points="100,8 180,54 180,146 100,192 20,146 20,54"
        fill="#051329"
        stroke="url(#gvHexOuter)"
        strokeWidth="4.5"
      />
      {/* Lattice Truss Corner Bracing */}
      <line x1="100" y1="8" x2="100" y2="26" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.85" />
      <line x1="72" y1="24" x2="100" y2="26" stroke="#22D3EE" strokeWidth="1.4" strokeOpacity="0.55" />
      <line x1="128" y1="24" x2="100" y2="26" stroke="#22D3EE" strokeWidth="1.4" strokeOpacity="0.55" />

      <line x1="180" y1="54" x2="164" y2="63" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.85" />
      <line x1="180" y1="146" x2="164" y2="137" stroke="#10B981" strokeWidth="2" strokeOpacity="0.85" />
      <line x1="100" y1="192" x2="100" y2="174" stroke="#10B981" strokeWidth="2" strokeOpacity="0.85" />
      <line x1="20" y1="146" x2="36" y2="137" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.85" />
      <line x1="20" y1="54" x2="36" y2="63" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.85" />

      {/* Outer Azimuth Containment Ring */}
      <circle cx="100" cy="100" r="74" fill="#040D1F" stroke="url(#gvHexOuter)" strokeWidth="4.5" />
      <circle
        cx="100"
        cy="100"
        r="65"
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        strokeDasharray="6 4"
      />

      {/* Three Spiraling Aerodynamic Vane Blades */}
      <path
        d="M95 25 C136 36 155 78 129 113 C135 84 118 57 91 51 Z"
        fill="url(#gvBladeCyan)"
      />
      <path
        d="M91 51 C118 57 130 84 114 108"
        fill="none"
        stroke="url(#gvBladeAmber)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M166 135 C137 166 91 164 71 125 C94 143 125 139 141 116 Z"
        fill="url(#gvBladeCyan)"
      />
      <path
        d="M141 116 C125 139 94 141 79 114"
        fill="none"
        stroke="url(#gvBladeAmber)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M40 139 C26 100 47 59 88 61 C61 73 51 102 63 129 Z"
        fill="url(#gvBladeCyan)"
      />
      <path
        d="M63 129 C53 102 63 75 92 73"
        fill="none"
        stroke="url(#gvBladeAmber)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Inner Emerald Carbon Vortex Swirls */}
      <path
        d="M100 65 C121 67 133 86 123 106 C119 90 108 79 94 79 Z"
        fill="url(#gvBladeEmerald)"
      />
      <path
        d="M129 119 C116 137 94 139 79 120 C94 127 110 123 117 108 Z"
        fill="url(#gvBladeEmerald)"
      />
      <path
        d="M69 115 C61 96 71 75 94 73 C79 83 75 100 83 113 Z"
        fill="url(#gvBladeEmerald)"
      />

      {/* Central Kirchhoff Phasor Singularity Core & Star Flare */}
      <circle cx="100" cy="100" r="30" fill="url(#gvCoreGlow)" />
      <circle cx="100" cy="100" r="14" fill="#061426" stroke="#34D399" strokeWidth="2.8" />
      <circle cx="100" cy="100" r="6.5" fill="#FFFFFF" />
      <line x1="62" y1="100" x2="138" y2="100" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="62" x2="100" y2="138" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GridVaneLogo({
  size = "md",
  interactiveModal = true,
  isLightMode = true,
}: GridVaneLogoProps) {
  const [showModal, setShowModal] = useState(false);

  const dims =
    size === "sm"
      ? "w-9 h-9"
      : size === "lg"
      ? "w-14 h-14"
      : "w-11 h-11";

  return (
    <>
      <div
        onClick={() => interactiveModal && setShowModal(true)}
        className={`group flex items-center gap-3.5 ${
          interactiveModal ? "cursor-pointer" : ""
        }`}
        title={interactiveModal ? "Click to inspect GridVane Brand Emblem & Architecture" : undefined}
      >
        {/* Dual-Layer Glowing Emblem Container */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00629B]/35 via-emerald-500/35 to-amber-500/25 blur-sm opacity-75 group-hover:opacity-100 transition duration-500" />
          <div className="relative rounded-2xl bg-[#051124] border-2 border-[#00629B]/50 p-1 shadow-md flex items-center justify-center overflow-hidden">
            <GridVaneEmblemSVG className={`${dims} transition-transform duration-500 group-hover:scale-105`} />
          </div>
        </div>

        {/* Brand Typography & Tagline */}
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`font-display text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent ${
                isLightMode
                  ? "bg-gradient-to-r from-[#0A192F] via-[#00629B] to-[#047857]"
                  : "bg-gradient-to-r from-white via-cyan-100 to-emerald-300"
              }`}
            >
              GRIDVANE
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              IEEE 2026
            </span>
          </div>
          <p className="text-[11px] md:text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1.5">
            <span>Quantum-Safe Thermo-Carbon VPP</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono text-[10px] underline decoration-cyan-500/40 underline-offset-2">
              Brand Emblem
            </span>
          </p>
        </div>
      </div>

      {/* Interactive Brand Emblem & Symbolism Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-3xl w-full rounded-3xl gv-glass-card p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* High-Resolution Master Brand Mark */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative rounded-3xl overflow-hidden border-2 border-[#00629B]/50 shadow-xl bg-[#040814]">
                  <img
                    src="/gridvane-logo.jpg"
                    alt="GridVane Official Emblem"
                    className="w-64 h-64 object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official GridVane Master Identity Mark</span>
                </div>
              </div>

              {/* Architectural Symbolism Breakdown */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    IEEE ClimateChain 2026 Brand Identity
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
                    The GridVane Emblem Architecture
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Every geometric element in the GridVane emblem encodes one of the four cyber-physical pillars of our IEEE ClimateChain 2026 architecture:
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        1. Outer Hexagonal Truss — NIST FIPS 204 Lattice Shield
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Represents the Module-Lattice (ML-DSA-65) post-quantum cryptographic perimeter protecting 20-year grid infrastructure against quantum key forgery.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Wind className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        2. Tri-Vane Aerodynamic Rotor — LME Carbon &amp; IEEE 738 DLR
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Three directional turbine vanes steer power flow toward Locational Marginal Emissions (LME_i,t) minima while harvesting convective wind cooling.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        3. Gold Thermodynamic Filaments — IEEE Std C57.91 Protection
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Golden thermal veins trace the Arrhenius insulation boundary (Θ_H ≤ 110°C), shielding transformers during 43.8°C COP31 heatwaves.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        4. Central Phasor Star Core — Kirchhoff AC Residual Gate
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        The luminous crosshair singularity represents exact AC power balance (r_ij ≤ 2.5 kW) and atomic Triple-Silo settlement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
