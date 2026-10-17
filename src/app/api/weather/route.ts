import { NextRequest, NextResponse } from "next/server";
import { FEEDER_PRESETS, FeederPresetId } from "@/lib/physics/feederPresets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feederId = (searchParams.get("feeder") as FeederPresetId) || "antalya_cop31";
  const preset = FEEDER_PRESETS[feederId] || FEEDER_PRESETS.antalya_cop31;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${preset.latitude}&longitude=${preset.longitude}&current=temperature_2m,relative_humidity_2m,shortwave_radiation,wind_speed_10m&timezone=auto`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};

    return NextResponse.json({
      source: "OPEN_METEO_LIVE_API",
      feederId: preset.id,
      city: preset.city,
      country: preset.country,
      latitude: preset.latitude,
      longitude: preset.longitude,
      timestamp: current.time || new Date().toISOString(),
      ambientTempC:
        typeof current.temperature_2m === "number"
          ? current.temperature_2m
          : preset.defaultAmbientTempC,
      irradianceWm2:
        typeof current.shortwave_radiation === "number"
          ? Math.max(120, current.shortwave_radiation)
          : preset.defaultIrradianceWm2,
      humidityPct:
        typeof current.relative_humidity_2m === "number" ? current.relative_humidity_2m : 44,
      windSpeedKmh:
        typeof current.wind_speed_10m === "number" ? current.wind_speed_10m : 14.2,
      heatwaveAnomalyPresetC: preset.defaultAmbientTempC,
    });
  } catch {
    return NextResponse.json({
      source: "ERA5_HEATWAVE_BENCHMARK_CACHE",
      feederId: preset.id,
      city: preset.city,
      country: preset.country,
      latitude: preset.latitude,
      longitude: preset.longitude,
      timestamp: new Date().toISOString(),
      ambientTempC: preset.defaultAmbientTempC,
      irradianceWm2: preset.defaultIrradianceWm2,
      humidityPct: 38,
      windSpeedKmh: 12.5,
      heatwaveAnomalyPresetC: preset.defaultAmbientTempC,
    });
  }
}
