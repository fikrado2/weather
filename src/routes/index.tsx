import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import fikradoLogo from "@/assets/fikrado.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fikrado Weather — Live Local Forecast" },
      { name: "description", content: "See real-time weather at your location with a modern 3D interface. Powered by Fikrado Security." },
      { property: "og:title", content: "Fikrado Weather" },
      { property: "og:description", content: "Real-time weather at your location." },
    ],
  }),
  component: Index,
});

type WeatherData = {
  temperature: number;
  apparent: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: number;
  city: string;
  country: string;
  daily: { date: string; max: number; min: number; code: number }[];
};

const codeInfo = (code: number, isDay = 1): { label: string; icon: string; grad: string } => {
  if (code === 0) return isDay
    ? { label: "Clear Sky", icon: "☀️", grad: "from-amber-400 via-orange-500 to-pink-500" }
    : { label: "Clear Night", icon: "🌙", grad: "from-indigo-500 via-purple-600 to-slate-800" };
  if ([1, 2].includes(code)) return { label: "Partly Cloudy", icon: "⛅", grad: "from-sky-400 via-blue-500 to-indigo-600" };
  if (code === 3) return { label: "Overcast", icon: "☁️", grad: "from-slate-400 via-slate-500 to-slate-700" };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: "🌫️", grad: "from-slate-300 via-slate-500 to-slate-700" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: "🌦️", grad: "from-cyan-400 via-blue-500 to-indigo-600" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rainy", icon: "🌧️", grad: "from-blue-500 via-indigo-600 to-purple-700" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snowy", icon: "❄️", grad: "from-cyan-200 via-sky-400 to-blue-600" };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: "⛈️", grad: "from-yellow-400 via-purple-600 to-slate-900" };
  return { label: "Unknown", icon: "🌡️", grad: "from-slate-500 to-slate-800" };
};

function Index() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`,
          );
          const w = await wRes.json();
          const gRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`,
          );
          const g = await gRes.json().catch(() => ({}));
          const place = g?.results?.[0] ?? {};
          setData({
            temperature: w.current.temperature_2m,
            apparent: w.current.apparent_temperature,
            humidity: w.current.relative_humidity_2m,
            wind: w.current.wind_speed_10m,
            code: w.current.weather_code,
            isDay: w.current.is_day,
            city: place.name ?? "Your Location",
            country: place.country ?? "",
            daily: w.daily.time.map((t: string, i: number) => ({
              date: t,
              max: w.daily.temperature_2m_max[i],
              min: w.daily.temperature_2m_min[i],
              code: w.daily.weather_code[i],
            })),
          });
        } catch {
          setError("Failed to load weather data.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied. Please enable it and refresh.");
        setLoading(false);
      },
    );
  }, []);

  const info = data ? codeInfo(data.code, data.isDay) : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* animated orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
          FIKRADO WEATHER
        </h1>
        <span className="text-xs text-white/50 uppercase tracking-widest">Live · Geo</span>
      </header>

      <main className="relative z-10 flex-1 px-4 sm:px-8 pb-8 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          {loading && (
            <div className="text-center py-32">
              <div className="inline-block h-16 w-16 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
              <p className="mt-6 text-white/70">Detecting your location…</p>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-md text-center rounded-3xl bg-red-500/10 border border-red-500/30 backdrop-blur p-8">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {data && info && (
            <div className="space-y-6">
              {/* Hero card */}
              <div
                className={`relative rounded-[2.5rem] bg-gradient-to-br ${info.grad} p-8 sm:p-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden`}
                style={{ transform: "perspective(1200px) rotateX(2deg)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-white/80 text-sm uppercase tracking-widest">
                      {data.city}{data.country && ` · ${data.country}`}
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-7xl sm:text-9xl font-black leading-none drop-shadow-2xl">
                        {Math.round(data.temperature)}°
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-semibold">{info.label}</p>
                    <p className="text-white/80 text-sm">Feels like {Math.round(data.apparent)}°C</p>
                  </div>
                  <div
                    className="text-[9rem] sm:text-[12rem] leading-none drop-shadow-2xl select-none"
                    style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))", transform: "translateZ(50px)" }}
                  >
                    {info.icon}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Humidity", value: `${data.humidity}%`, icon: "💧", grad: "from-cyan-400 to-blue-600" },
                  { label: "Wind", value: `${Math.round(data.wind)} km/h`, icon: "🌬️", grad: "from-teal-400 to-emerald-600" },
                  { label: "Feels Like", value: `${Math.round(data.apparent)}°`, icon: "🌡️", grad: "from-rose-400 to-red-600" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 hover:scale-105 transition-transform shadow-xl"
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-2xl shadow-lg mb-3`}>
                      {s.icon}
                    </div>
                    <p className="text-white/60 text-xs uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Forecast */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
                <h2 className="text-sm uppercase tracking-widest text-white/60 mb-4">5-Day Forecast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {data.daily.map((d) => {
                    const di = codeInfo(d.code, 1);
                    return (
                      <div key={d.date} className="text-center rounded-xl bg-black/40 border border-white/5 p-4 hover:border-amber-400/40 transition">
                        <p className="text-xs text-white/60 uppercase">
                          {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                        </p>
                        <div className="text-4xl my-2">{di.icon}</div>
                        <p className="text-sm font-semibold">{Math.round(d.max)}° <span className="text-white/50">{Math.round(d.min)}°</span></p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur px-6 py-5">
        <div className="flex items-center justify-center gap-3">
          <img src={fikradoLogo.url} alt="Fikrado Security" className="h-10 w-10 rounded-md object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase tracking-widest">Powered by</p>
            <p className="text-sm font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Fikrado Security
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
