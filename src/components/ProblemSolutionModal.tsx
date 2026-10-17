"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Flame,
  HeartPulse,
  ShieldAlert,
  Cpu,
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface ProblemSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlide?: number;
}

export function ProblemSolutionModal({
  isOpen,
  onClose,
  initialSlide = 0,
}: ProblemSolutionModalProps) {
  const [slide, setSlide] = useState<number>(initialSlide);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSlide(initialSlide);
  }, [initialSlide, isOpen]);

  if (!mounted || !isOpen) return null;

  const slides = [
    {
      id: "slide-0-crisis-heatwave",
      badge: "REAL-WORLD CRISIS #1 · THE CLIMATE-GRID PARADOX",
      title: "Extreme 43.8°C Heatwaves Crush Solar Output While Burning Out Grid Transformers",
      subtitle:
        "During peak summer heatwaves in Antalya (UN COP31 Host City) and across global distribution networks, two physical failure modes collide simultaneously:",
      image: "/demo-assets/scene1-heatwave.jpg",
      metrics: [
        {
          label: "PV Cell Temperature (NOCT)",
          value: "75.0°C (-18.4% Output)",
          desc: "Silicon solar panels lose -0.42%/°C above 25°C STC right when city air-conditioning surges +42%.",
          color: "amber",
        },
        {
          label: "Transformer Winding Hot-Spot (Θ_H)",
          value: "134.3°C (10.8x Aging)",
          desc: "Per IEEE Std C57.91-2011, cellulose insulation depolymerization doubles every 6°C above 110°C.",
          color: "rose",
        },
        {
          label: "Overhead Line Sag (IEEE Std 738)",
          value: "Wildfire & Outage Risk",
          desc: "Static line ratings ignore convective wind cooling and thermal conductor sag across dry hills.",
          color: "cyan",
        },
      ],
    },
    {
      id: "slide-1-crisis-human-equity",
      badge: "REAL-WORLD CRISIS #2 · LIFE-CRITICAL COOLING EQUITY",
      title: "Conventional VPP Algorithms Blindly Throttle Cooling on Vulnerable Clinics & Seniors",
      subtitle:
        "When distribution transformers overheat, legacy utility demand-response & carbon-only VPPs shed load indiscriminately across the feeder—cutting HVAC power to hospitals and senior cooling centers:",
      image: "/demo-assets/scene2-clinic.jpg",
      metrics: [
        {
          label: "Naive VPP Clinic Curtailment",
          value: "180 Hours / Month Cut",
          desc: "Blind carbon-only optimization curtails 290+ kW of life-critical medical & senior cooling during heatwaves.",
          color: "rose",
        },
        {
          label: "Vulnerable Population at Risk",
          value: "1,270 Citizens on Feeder",
          desc: "Elderly patients, neonatal clinics, and municipal heat shelters on Buses 7, 14, and 29 face lethal indoor heat.",
          color: "amber",
        },
        {
          label: "GridVane Thermal-Equity Gate",
          value: "0.0 kW Curtailed (100% Safe)",
          desc: "Hard-coded Responsible AI safety constraint locks 0 kW curtailment on medical & cooling refuge buses.",
          color: "emerald",
        },
      ],
    },
    {
      id: "slide-2-crisis-oracle-quantum",
      badge: "REAL-WORLD CRISIS #3 · GREENWASHING, QUANTUM FORGERY & DOUBLE-COUNTING",
      title: "Smart-Meter Spoofing (FDIA), Quantum Key Exposure & Cross-Registry Double-Counting",
      subtitle:
        "Existing blockchain energy and carbon dMRV platforms treat smart meters as infallible JSON APIs and treat every kWh on a feeder as equal—creating three fatal vulnerabilities:",
      image: "/demo-assets/scene3-security.jpg",
      metrics: [
        {
          label: "False Data Injection (FDIA)",
          value: "+85 kW Fake Solar Spoof",
          desc: "Compromised smart meters inject fake export readings that violate Kirchhoff's AC power balance.",
          color: "rose",
        },
        {
          label: "Quantum Key Forgery Risk",
          value: "ECDSA Broken Over 20-Yr Life",
          desc: "Smart grid meters operate for 15–20 years; classical ECDSA signatures are vulnerable to quantum forgery.",
          color: "amber",
        },
        {
          label: "Cross-Registry Double Counting",
          value: "VCM vs. I-REC vs. EU CBAM",
          desc: "Without atomic cross-silo locking, the same clean MWh is claimed across voluntary and compliance silos.",
          color: "cyan",
        },
      ],
    },
    {
      id: "slide-3-gridvane-solution",
      badge: "THE GRIDVANE BREAKTHROUGH · 7 CYBER-PHYSICAL & CRYPTOGRAPHIC PILLARS",
      title: "How GridVane Solves the Climate-Grid Paradox End-to-End",
      subtitle:
        "GridVane is the first platform to couple real-time AC distribution physics, transformer thermodynamics, post-quantum lattice cryptography, and atomic multi-registry DLT settlement:",
      image: "/gridvane-logo.jpg",
      metrics: [
        {
          label: "1. Coupled AC Physics & LME Carbon",
          value: "+44.8% More Avoided CO₂e",
          desc: "Solves 33-bus AC DistFlow + Locational Marginal Emissions (LME) + IEEE C57.91 (-96% aging) + IEEE 738 DLR.",
          color: "emerald",
        },
        {
          label: "2. Kirchhoff Firewall + FIPS 204 PQC",
          value: "ML-DSA-65 + Merkle Proofs",
          desc: "Catches 99.4% of FDIA smart-meter spoofs via AC power residuals and signs telemetries with 3,309B lattice signatures.",
          color: "cyan",
        },
        {
          label: "3. P3271.01 + Triple-Silo Solidity EVM",
          value: "solc 0.8.28 Verified (5,359B)",
          desc: "5-Agent Pareto Consensus + Explainable AI Shapley + Atomic lock across VCM, I-REC, and EU CBAM / TSRS.",
          color: "amber",
        },
      ],
    },
  ];

  const current = slides[slide] || slides[0];

  return createPortal(
    <div
      id="story-modal-backdrop"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-xl flex min-h-full items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        id="story-modal-card"
        className="relative max-w-6xl w-full rounded-3xl gv-glass-card p-6 lg:p-8 shadow-2xl border-2 border-[#00629B]/50 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              id={`story-step-btn-${idx}`}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === slide
                  ? "bg-gradient-to-r from-[#00629B] to-[#059669]"
                  : idx < slide
                  ? "bg-emerald-500/50"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/35 flex items-center gap-1.5">
              {slide < 3 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {current.badge}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Chapter {slide + 1} of {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="story-prev-btn"
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              disabled={slide === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 text-xs font-mono font-bold disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              id="story-next-btn"
              onClick={() => {
                if (slide < slides.length - 1) {
                  setSlide(slide + 1);
                } else {
                  onClose();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/45 text-xs font-mono font-bold flex items-center gap-1"
            >
              {slide < slides.length - 1 ? (
                <>
                  Next Chapter <ChevronRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Launch Live Cockpit <PlayCircle className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <button
              id="story-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 7 Columns: High-Res Visual Evidence Artwork */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#00629B]/40 shadow-2xl bg-[#040814] aspect-video flex items-center justify-center">
              <img
                src={current.image}
                alt={current.title}
                className={`w-full h-full ${
                  slide === 3 ? "object-contain p-6 bg-[#040814]" : "object-cover"
                }`}
              />
              <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 flex items-center justify-between text-[11px] font-mono text-slate-200">
                <span>IEEE ClimateChain Global Hackathon 2026 · Visual Evidence</span>
                <span className="text-emerald-400 font-bold">UN COP31 Antalya Twin</span>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Narrative & Quantitative Evidence Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {current.subtitle}
              </p>
            </div>

            <div className="space-y-3">
              {current.metrics.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {m.label}
                    </span>
                    <span
                      className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                        m.color === "rose"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/35"
                          : m.color === "amber"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/35"
                          : m.color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/35"
                      }`}
                    >
                      {m.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
