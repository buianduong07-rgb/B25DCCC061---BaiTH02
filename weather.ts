import type { City } from "./cities";

export type Unit = "C" | "F";
export type Theme = "clear" | "cloudy" | "fog" | "rain" | "storm" | "snow";

export interface WeatherData {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function fetchWeather(city: City, signal: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "Asia/Ho_Chi_Minh",
    forecast_days: "7",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Máy chủ trả về lỗi ${res.status}`);
  return (await res.json()) as WeatherData;
}

export interface CodeInfo {
  label: string;
  icon: string;
  theme: Theme;
}

// Bảng mã WMO của Open-Meteo
export function describeCode(code: number): CodeInfo {
  if (code === 0) return { label: "Trời quang", icon: "☀️", theme: "clear" };
  if (code === 1) return { label: "Ít mây", icon: "🌤️", theme: "clear" };
  if (code === 2) return { label: "Có mây rải rác", icon: "⛅", theme: "cloudy" };
  if (code === 3) return { label: "Nhiều mây", icon: "☁️", theme: "cloudy" };
  if (code === 45 || code === 48) return { label: "Sương mù", icon: "🌫️", theme: "fog" };
  if (code >= 51 && code <= 57) return { label: "Mưa phùn", icon: "🌦️", theme: "rain" };
  if (code >= 61 && code <= 65) return { label: "Mưa", icon: "🌧️", theme: "rain" };
  if (code === 66 || code === 67) return { label: "Mưa lạnh", icon: "🌧️", theme: "rain" };
  if (code >= 71 && code <= 77) return { label: "Tuyết", icon: "❄️", theme: "snow" };
  if (code >= 80 && code <= 82) return { label: "Mưa rào", icon: "🌦️", theme: "rain" };
  if (code === 85 || code === 86) return { label: "Mưa tuyết", icon: "❄️", theme: "snow" };
  if (code >= 95) return { label: "Dông", icon: "⛈️", theme: "storm" };
  return { label: "Không xác định", icon: "❔", theme: "cloudy" };
}

export function convertTemp(celsius: number, unit: Unit): number {
  return Math.round(unit === "C" ? celsius : (celsius * 9) / 5 + 32);
}

const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// Tự tách chuỗi "YYYY-MM-DD" để tránh lệch múi giờ khi dùng new Date(string)
export function formatDay(iso: string): { weekday: string; date: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return { weekday, date: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}` };
}

// "2026-10-15T14:00" -> "14:00, 15/10/2026"
export function formatUpdateTime(iso: string): string {
  const [date, time] = iso.split("T");
  const [y, m, d] = date.split("-");
  return `${time}, ${d}/${m}/${y}`;
}

// Bỏ dấu tiếng Việt để tìm kiếm
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}
