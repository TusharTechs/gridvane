"use client";

import React, { useMemo, useState } from "react";
import { FeederPresetSpec } from "@/lib/physics/feederPresets";
import { CMIP6ScenarioId } from "@/lib/physics/transformerThermal";
import { runThermoCarbonVPPOptimizer } from "@/lib/optimizer/vppOptimizer";
import { Play, Pause, Clock, Flame, Zap } from "lucide-react";

interface Diurnal24hChartProps {
  preset: FeederPresetSpec;
  scenarioId: CMIP6ScenarioId;
  activeHour: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectHour: (hour: number) => void;
}

export function Diurnal24hChart({
  preset,
  scenarioId,
  activeHour,
  isPlaying,
  onTogglePlay,
  onSelectHour,
}: Diurnal24hChartProps) {
  const [chartMetric, setChartMetric] = useState<"HOTSPOT_C" | "EMISSIONS_KG">("HOTSPOT_C");

  // Compute 24-hour diurnal curves for Baseline, Naive VPP, and GridVane
  const hourlySeries = useMemo(() => {
    return preset.hourlyProfile24h.map((slot) => {
      const res = runThermoCarbonVPPOptimizer({
        ambientTempC: slot.ambientC,
        irradianceWm2: slot.irradianceWm2,
        gridMarginalEmissionsGPerKWh: slot.mefGPerKWh,
        loadMultiplier: slot.loadMultiplier,
        scenarioId,
      });

      return {
        hour: slot.hour,
        ambientC: slot.ambientC,
        irradianceWm2: slot.irradianceWm2,
        baseHotSpotC: res.metricsComparison.baseline.maxTransformerHotSpotC,
        naiveHotSpotC: res.metricsComparison.naiveCarbon.maxTransformerHotSpotC,
        gvHotSpotC: res.metricsComparison.gridvane.maxTransformerHotSpotC,
        baseEmissionsKg: res.metricsComparison.baseline.hourlyEmissionsKgCO2e,
        naiveEmissionsKg: res.metricsComparison.naiveCarbon.hourlyEmissionsKgCO2e,
        gvEmissionsKg: Math.max(0, res.metricsComparison.gridvane.hourlyEmissionsKgCO2e),
      };
    });
  }, [preset, scenarioId]);

  const width = 920;
  const height = 178;
  const padLeft = 48;
  const padRight = 22;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minVal = chartMetric === "HOTSPOT_C" ? 55 : 0;
  const maxVal =
    chartMetric === "HOTSPOT_C"
      ? 145
      : Math.max(...hourlySeries.map((d) => d.baseEmissionsKg), 1800) * 1.08;

  function xOf(h: number): number {
    return padLeft + (h / 23) * plotW;
  }

  function yOf(val: number): number {
    const clamped = Math.min(maxVal, Math.max(minVal, val));
    return padTop + plotH - ((clamped - minVal) / (maxVal - minVal)) * plotH;
  }

  const basePath = hourlySeries
    .map((d, idx) => {
      const val = chartMetric === "HOTSPOT_C" ? d.baseHotSpotC : d.baseEmissionsKg;
      return `${idx === 0 ? "M" : "L"} ${xOf(d.hour).toFixed(1)} ${yOf(val).toFixed(1)}`;
    })
    .join(" ");

  const baseAreaPath = `${basePath} L ${xOf(23).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${xOf(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const naivePath = hourlySeries
    .map((d, idx) => {
      const val = chartMetric === "HOTSPOT_C" ? d.naiveHotSpotC : d.naiveEmissionsKg;
      return `${idx === 0 ? "M" : "L"} ${xOf(d.hour).toFixed(1)} ${yOf(val).toFixed(1)}`;
    })
    .join(" ");

  const gvPath = hourlySeries
    .map((d, idx) => {
      const val = chartMetric === "HOTSPOT_C" ? d.gvHotSpotC : d.gvEmissionsKg;
      return `${idx === 0 ? "M" : "L"} ${xOf(d.hour).toFixed(1)} ${yOf(val).toFixed(1)}`;
    })
    .join(" ");

  const gvAreaPath = `${gvPath} L ${xOf(23).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${xOf(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const currentSlot = hourlySeries[activeHour] || hourlySeries[14];

  return (
    <div className="gv-glass-card rounded-2xl p-4 lg:p-5 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 transition-all shadow-md ${
              isPlaying
                ? "bg-amber-500/25 text-amber-200 border-amber-400/60 shadow-glow-amber"
                : "bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 hover:from-emerald-500/35 hover:to-cyan-500/30 text-emerald-200 border-emerald-400/50 shadow-glow-emerald"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause 24h Telemetry
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play 24h Diurnal Cycle
              </>
            )}
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-[#040915]/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Epoch Hour:{" "}
              <strong className="text-white">
                {String(activeHour).padStart(2, "0")}:00
              </strong>{" "}
              <span className="text-amber-300">{currentSlot.ambientC}°C</span> ·{" "}
              <span className="text-cyan-300">{currentSlot.irradianceWm2} W/m²</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-3.5 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block rounded" /> Baseline:{" "}
              <strong>
                {chartMetric === "HOTSPOT_C"
                  ? `${currentSlot.baseHotSpotC}°C`
                  : `${currentSlot.baseEmissionsKg}kg`}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Naive VPP:{" "}
              <strong>
                {chartMetric === "HOTSPOT_C"
                  ? `${currentSlot.naiveHotSpotC}°C`
                  : `${currentSlot.naiveEmissionsKg}kg`}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <span className="w-3 h-1 bg-emerald-400 inline-block rounded" /> GridVane:{" "}
              <strong>
                {chartMetric === "HOTSPOT_C"
                  ? `${currentSlot.gvHotSpotC}°C`
                  : `${currentSlot.gvEmissionsKg}kg`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#040915] p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setChartMetric("HOTSPOT_C")}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition ${
                chartMetric === "HOTSPOT_C"
                  ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" /> 24h Trafo Θ_H
            </button>
            <button
              onClick={() => setChartMetric("EMISSIONS_KG")}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition ${
                chartMetric === "EMISSIONS_KG"
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" /> 24h Net CO₂e
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG 24-Hour Diurnal Curve */}
      <div className="bg-[#030711] border border-cyan-500/15 rounded-xl p-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[660px]">
          <defs>
            <linearGradient id="gvAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="baseAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference 110°C IEEE Std C57.91 Rated Hot-Spot Limit Line */}
          {chartMetric === "HOTSPOT_C" && (
            <g>
              <line
                x1={padLeft}
                y1={yOf(110)}
                x2={width - padRight}
                y2={yOf(110)}
                stroke="#F43F5E"
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
              <text
                x={width - padRight - 6}
                y={yOf(110) - 5}
                textAnchor="end"
                fill="#FDA4AF"
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="700"
              >
                IEEE Std C57.91 Insulation Limit (110°C · F_AA = 1.0x)
              </text>
            </g>
          )}

          {/* Y-axis ticks */}
          {[0, 0.5, 1].map((frac) => {
            const val = minVal + frac * (maxVal - minVal);
            const y = yOf(val);
            return (
              <g key={frac}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#0F1D36"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {chartMetric === "HOTSPOT_C" ? `${Math.round(val)}°C` : `${Math.round(val)}kg`}
                </text>
              </g>
            );
          })}

          {/* Area Fills & Curves */}
          <path d={baseAreaPath} fill="url(#baseAreaGrad)" />
          <path d={gvAreaPath} fill="url(#gvAreaGrad)" />

          <path d={basePath} fill="none" stroke="#F43F5E" strokeWidth="2.2" strokeOpacity="0.9" />
          <path
            d={naivePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <path d={gvPath} fill="none" stroke="#10B981" strokeWidth="3.2" />

          {/* Active Hour Vertical Scrubber & Interactive Click Columns */}
          {hourlySeries.map((d) => {
            const x = xOf(d.hour);
            const isCurr = d.hour === activeHour;
            const gvVal = chartMetric === "HOTSPOT_C" ? d.gvHotSpotC : d.gvEmissionsKg;
            const baseVal = chartMetric === "HOTSPOT_C" ? d.baseHotSpotC : d.baseEmissionsKg;

            return (
              <g
                key={d.hour}
                onClick={() => onSelectHour(d.hour)}
                className="cursor-pointer"
              >
                <rect
                  x={x - plotW / 48}
                  y={padTop}
                  width={plotW / 24}
                  height={plotH}
                  fill="transparent"
                />
                {isCurr && (
                  <>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotH}
                      stroke="#22D3EE"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx={x}
                      cy={yOf(baseVal)}
                      r="4.5"
                      fill="#F43F5E"
                      stroke="#FFFFFF"
                      strokeWidth="1.4"
                    />
                    <circle
                      cx={x}
                      cy={yOf(gvVal)}
                      r="5.5"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                    />
                  </>
                )}
                {d.hour % 3 === 0 && (
                  <text
                    x={x}
                    y={height - 7}
                    textAnchor="middle"
                    fill={isCurr ? "#22D3EE" : "#64748B"}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight={isCurr ? "800" : "500"}
                  >
                    {String(d.hour).padStart(2, "0")}:00
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
