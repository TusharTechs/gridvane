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
  const height = 165;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 26;
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

  const currentSlot = hourlySeries[activeHour] || hourlySeries[14];

  return (
    <div className="bg-grid-panel border border-grid-border rounded-xl p-3.5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 transition ${
              isPlaying
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause 24h Replay
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play 24h Heatwave Cycle
              </>
            )}
          </button>

          <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Diurnal Hour:{" "}
              <strong className="text-white">
                {String(activeHour).padStart(2, "0")}:00
              </strong>{" "}
              ({currentSlot.ambientC}°C · {currentSlot.irradianceWm2} W/m²)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" /> Baseline (
              {chartMetric === "HOTSPOT_C"
                ? `${currentSlot.baseHotSpotC}°C`
                : `${currentSlot.baseEmissionsKg}kg`}
              )
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Naive VPP (
              {chartMetric === "HOTSPOT_C"
                ? `${currentSlot.naiveHotSpotC}°C`
                : `${currentSlot.naiveEmissionsKg}kg`}
              )
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-3 h-1 bg-emerald-400 inline-block" /> GridVane (
              {chartMetric === "HOTSPOT_C"
                ? `${currentSlot.gvHotSpotC}°C`
                : `${currentSlot.gvEmissionsKg}kg`}
              )
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setChartMetric("HOTSPOT_C")}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                chartMetric === "HOTSPOT_C"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame className="w-3 h-3" /> 24h Trafo Θ_H
            </button>
            <button
              onClick={() => setChartMetric("EMISSIONS_KG")}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                chartMetric === "EMISSIONS_KG"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3 h-3" /> 24h Net CO2e
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG 24-Hour Diurnal Curve */}
      <div className="bg-[#050912] border border-slate-800/80 rounded-lg p-1.5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[680px]">
          {/* Reference 110°C IEEE Std C57.91 Rated Hot-Spot Limit Line */}
          {chartMetric === "HOTSPOT_C" && (
            <g>
              <line
                x1={padLeft}
                y1={yOf(110)}
                x2={width - padRight}
                y2={yOf(110)}
                stroke="#F43F5E"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={width - padRight - 4}
                y={yOf(110) - 4}
                textAnchor="end"
                fill="#FDA4AF"
                fontSize="9"
                fontFamily="monospace"
              >
                IEEE Std C57.91 Rated Limit (110°C · F_AA = 1.0x)
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
                  stroke="#111C30"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {chartMetric === "HOTSPOT_C" ? `${Math.round(val)}°C` : `${Math.round(val)}kg`}
                </text>
              </g>
            );
          })}

          {/* Baseline, Naive VPP, and GridVane Curves */}
          <path d={basePath} fill="none" stroke="#F43F5E" strokeWidth="2" strokeOpacity="0.85" />
          <path
            d={naivePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
          <path d={gvPath} fill="none" stroke="#10B981" strokeWidth="2.8" />

          {/* Active Hour Vertical Cursor & Interactive Click Columns */}
          <line
            x1={xOf(activeHour)}
            y1={padTop}
            x2={xOf(activeHour)}
            y2={height - padBottom}
            stroke="#38BDF8"
            strokeWidth="1.5"
          />

          {hourlySeries.map((d) => {
            const cx = xOf(d.hour);
            const gvY = yOf(
              chartMetric === "HOTSPOT_C" ? d.gvHotSpotC : d.gvEmissionsKg
            );
            return (
              <g
                key={d.hour}
                onClick={() => onSelectHour(d.hour)}
                className="cursor-pointer"
              >
                <rect
                  x={cx - plotW / 48}
                  y={padTop}
                  width={plotW / 24}
                  height={plotH}
                  fill="transparent"
                />
                <circle
                  cx={cx}
                  cy={gvY}
                  r={d.hour === activeHour ? 4.5 : 2.2}
                  fill={d.hour === activeHour ? "#38BDF8" : "#10B981"}
                />
                {d.hour % 2 === 0 && (
                  <text
                    x={cx}
                    y={height - 8}
                    textAnchor="middle"
                    fill={d.hour === activeHour ? "#38BDF8" : "#64748B"}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={d.hour === activeHour ? "700" : "400"}
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
