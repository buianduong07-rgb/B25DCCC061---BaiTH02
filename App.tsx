import { useEffect, useMemo, useState } from "react";
import { CITIES, type City } from "./cities";
import {
  convertTemp,
  describeCode,
  fetchWeather,
  formatDay,
  formatUpdateTime,
  normalize,
  type Unit,
  type WeatherData,
} from "./weather";

const FAV_KEY = "weather-favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [unit, setUnit] = useState<Unit>("C");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const selected: City | undefined = CITIES.find((c) => c.id === selectedId);

  
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    fetchWeather(selected, controller.signal)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Lỗi không xác định");
        setLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, retryKey]); 

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      
    }
  }, [favorites]);

  const toggleFavorite = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const visibleCities = useMemo(() => {
    const q = normalize(query);
    const list = CITIES.filter((c) => normalize(c.name).includes(q));
    return [...list].sort(
      (a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))
    );
  }, [query, favorites]);

  const theme = data ? describeCode(data.current.weather_code).theme : "idle";
  const current = data?.current;
  const info = current ? describeCode(current.weather_code) : null;

  return (
    <div className="app" data-theme={theme}>
      <header className="topbar">
        <h1>Thời tiết Việt Nam</h1>
        <div className="unit-toggle" role="group" aria-label="Đơn vị nhiệt độ">
          {(["C", "F"] as Unit[]).map((u) => (
            <button key={u} className={unit === u ? "on" : ""} aria-pressed={unit === u} onClick={() => setUnit(u)}>
              °{u}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <aside className="panel">
          <input
            className="search"
            type="search"
            placeholder="Tìm thành phố (không cần gõ dấu)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm thành phố"
          />
          <ul className="city-list">
            {visibleCities.map((c) => {
              const fav = favorites.includes(c.id);
              return (
                <li key={c.id} className={c.id === selectedId ? "city active" : "city"}>
                  <button
                    className="city-btn"
                    aria-current={c.id === selectedId}
                    onClick={() => setSelectedId(c.id)}
                  >
                    {c.name}
                  </button>
                  <button
                    className={fav ? "star on" : "star"}
                    aria-label={fav ? `Bỏ yêu thích ${c.name}` : `Thêm ${c.name} vào yêu thích`}
                    aria-pressed={fav}
                    onClick={() => toggleFavorite(c.id)}
                  >
                    {fav ? "★" : "☆"}
                  </button>
                </li>
              );
            })}
            {visibleCities.length === 0 && <li className="no-result">Không có thành phố khớp “{query}”.</li>}
          </ul>
        </aside>

        <section className="panel detail" aria-live="polite">
          {!selected && (
            <div className="state">
              <p className="state-title">Chưa chọn thành phố</p>
              <p>Chọn một thành phố ở danh sách để xem thời tiết.</p>
            </div>
          )}

          {selected && loading && (
            <div className="state">
              <div className="spinner" aria-hidden="true" />
              <p>Đang tải thời tiết {selected.name}…</p>
            </div>
          )}

          {selected && error && (
            <div className="state">
              <p className="state-title">Không tải được dữ liệu</p>
              <p>{error}. Kiểm tra kết nối mạng rồi thử lại.</p>
              <button className="retry" onClick={() => setRetryKey((k) => k + 1)}>
                Thử lại
              </button>
            </div>
          )}

          {selected && data && current && info && (
            <>
              <div className="now">
                <div>
                  <h2>{selected.name}</h2>
                  <p className="desc">{info.label}</p>
                  <p className="updated">Cập nhật lúc {formatUpdateTime(current.time)}</p>
                </div>
                <div className="now-main">
                  <span className="icon" role="img" aria-label={info.label}>
                    {info.icon}
                  </span>
                  <span className="temp">{convertTemp(current.temperature_2m, unit)}°{unit}</span>
                </div>
              </div>
              <dl className="stats">
                <div>
                  <dt>Độ ẩm</dt>
                  <dd>{current.relative_humidity_2m}%</dd>
                </div>
                <div>
                  <dt>Tốc độ gió</dt>
                  <dd>{current.wind_speed_10m} km/h</dd>
                </div>
              </dl>

              <h3>Dự báo 7 ngày</h3>
              <ul className="forecast">
                {data.daily.time.map((t, i) => {
                  const day = formatDay(t);
                  const di = describeCode(data.daily.weather_code[i]);
                  return (
                    <li key={t}>
                      <span className="d-name">
                        <strong>{day.weekday}</strong>
                        <small>{day.date}</small>
                      </span>
                      <span className="d-icon" role="img" aria-label={di.label} title={di.label}>
                        {di.icon}
                      </span>
                      <span className="d-temp">
                        <b>{convertTemp(data.daily.temperature_2m_max[i], unit)}°</b>
                        <span>{convertTemp(data.daily.temperature_2m_min[i], unit)}°</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </main>
      
    </div>
  );
}
