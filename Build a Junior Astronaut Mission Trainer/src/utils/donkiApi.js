// Live NASA DONKI integration (NASA Open APIs / api.nasa.gov)
// Docs: https://api.nasa.gov/ — DONKI endpoints (FLR, CME, SEP)
//
// Get a FREE key instantly at https://api.nasa.gov/ (higher rate limits than
// the shared DEMO_KEY). Set it via a `.env` file in the project root:
//   VITE_NASA_API_KEY=your_key_here
// If no key is set we fall back to DEMO_KEY, and if the network/API is
// unavailable we gracefully fall back to the curated REAL_DONKI_EVENTS so the
// game always works (important for classroom / offline Chromebook use).

const API_KEY = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";
const BASE = "https://api.nasa.gov/DONKI";

export const DONKI_API_KEY_SOURCE = import.meta.env.VITE_NASA_API_KEY
  ? "personal"
  : "demo";

function flareClassToHazard(classType) {
  if (!classType || typeof classType !== "string") return "Low";
  const letter = classType[0].toUpperCase();
  if (letter === "X") return "Critical";
  if (letter === "M") return "Moderate";
  return "Low";
}

// Rough CME plasma velocity (km/s) from DONKI CME analysis; null if unknown.
function extractSpeed(cmeAnalyses = []) {
  for (const a of cmeAnalyses) {
    const v = a?.measuredSpeed ?? a?.speed;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return null;
}

/**
 * Fetch real solar flares + CMEs from the last `days` days and map them into
 * the same shape as the curated REAL_DONKI_EVENTS used by the game.
 * Returns [] (or throws) if the API is unreachable — callers should catch.
 */
export async function fetchRecentDonkiEvents(days = 7) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10); // DONKI expects yyyy-MM-dd
  const qs = `startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=${API_KEY}`;

  const [flrRes, cmeRes] = await Promise.all([
    fetch(`${BASE}/FLR?${qs}`),
    fetch(`${BASE}/CME?${qs}`),
  ]);
  if (!flrRes.ok)
    throw new Error(`DONKI FLR request failed (${flrRes.status})`);
  const flares = await flrRes.json();
  const cmes = cmeRes.ok ? await cmeRes.json() : [];

  return flares.slice(0, 12).map((f) => {
    const matchedCme = cmes.find((c) =>
      c?.linkedFlares?.some((lf) => lf.flrID === f.flrID),
    );
    const speed =
      extractSpeed(matchedCme?.cmeAnalyses) || extractSpeed(f?.cmeAnalyses);
    const hazard = flareClassToHazard(f.classType);
    return {
      id: f.flrID,
      catalogId: f.flrID,
      type: "Solar Flare",
      classType: `${f.classType} ${hazard === "Critical" ? "Extreme" : hazard === "Moderate" ? "Moderate" : "Minor"}`,
      sourceLocation: f.sourceLocation || "Unknown Active Region",
      cmeSpeedKms: speed,
      kpIndex: null,
      warningLeadTimeSec:
        hazard === "Critical" ? 45 : hazard === "Moderate" ? 65 : 90,
      live: true,
      beginTime: f.beginTime,
      peakTime: f.peakTime,
      description:
        `Real DONKI record: an ${f.classType}-class solar flare erupted from ${f.sourceLocation || "the Sun"}` +
        (f.instruments?.length
          ? `, observed by ${f.instruments.map((i) => i.displayName).join(", ")}.`
          : ".") +
        (speed
          ? ` A CME traveling at ~${speed} km/s was associated with this event.`
          : ""),
      hazardLevel: hazard,
      recommendedAction:
        hazard === "Critical"
          ? "Order immediate lockdown into the subterranean regolith bunker and cut non-essential science power."
          : hazard === "Moderate"
            ? "Abort rover EVAs, recall astronauts to the airlock, and run ECLSS radiation scrubbers."
            : "Monitor battery levels and schedule solar panel angle alignment.",
    };
  });
}
