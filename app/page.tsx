"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  TrendSnapshot,
  TrendKeyword,
  GoogleDailyTrend,
  GoogleRealtimeTrend,
  YoutubeTrend
} from "@/lib/trends";

const GEO_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "BR", label: "Brazil" },
  { code: "JP", label: "Japan" },
  { code: "ZA", label: "South Africa" }
];

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TrendSnapshot }
  | { status: "error"; message: string };

export default function TrendsDashboard() {
  const [geo, setGeo] = useState("US");
  const [limit, setLimit] = useState(15);
  const [state, setState] = useState<FetchState>({ status: "idle" });

  const loadTrends = useCallback(
    async (params?: { geo?: string; limit?: number }) => {
      const targetGeo = params?.geo ?? geo;
      const targetLimit = params?.limit ?? limit;
      setState({ status: "loading" });

      try {
        const res = await fetch(
          `/api/trends?geo=${encodeURIComponent(targetGeo)}&limit=${targetLimit}`,
          {
            cache: "no-store"
          }
        );

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const payload: TrendSnapshot = await res.json();
        setState({ status: "success", data: payload });
      } catch (error) {
        console.error(error);
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to load trend data."
        });
      }
    },
    [geo, limit]
  );

  useEffect(() => {
    loadTrends();
  }, [geo, limit, loadTrends]);

  const lastUpdated = useMemo(() => {
    if (state.status !== "success") return null;
    return new Date(state.data.generatedAt).toLocaleString();
  }, [state]);

  const keywords = state.status === "success" ? state.data.keywords : [];

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>Viral Pulse Agent</h1>
          <p>
            Real-time trending keywords synthesized from Google and YouTube. All
            signals are aggregated automatically for maximum impact.
          </p>
        </div>
        <div className="controls">
          <label className="control">
            <span>Region</span>
            <select value={geo} onChange={(event) => setGeo(event.target.value)}>
              {GEO_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="control">
            <span>Keyword Depth: {limit}</span>
            <input
              type="range"
              min={5}
              max={30}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            />
          </label>
          <button
            className="refresh"
            onClick={() => loadTrends({ geo, limit })}
            disabled={state.status === "loading"}
          >
            {state.status === "loading" ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <section className="keywords">
        <div className="section-heading">
          <h2>Unified Keyword Radar</h2>
          {lastUpdated ? <small>Last updated: {lastUpdated}</small> : null}
        </div>
        {renderKeywords(state.status, keywords)}
      </section>

      <section className="streams">
        <TrendStream
          title="Google Daily Movers"
          subtitle="Top daily breakout searches"
          status={state.status}
          data={state.status === "success" ? state.data.googleDaily : []}
          renderItem={(item) => (
            <article key={item.keyword} className="card">
              <header>
                <h3>{item.keyword}</h3>
                {item.trafficLabel ? (
                  <span className="muted">{item.trafficLabel}</span>
                ) : null}
              </header>
              {item.snippet ? <p>{item.snippet}</p> : null}
              {item.articleUrl ? (
                <a href={item.articleUrl} target="_blank" rel="noreferrer">
                  View coverage →
                </a>
              ) : null}
            </article>
          )}
          emptyLabel="No Google daily trends available."
        />

        <TrendStream
          title="Google Realtime Surge"
          subtitle="Live crawling stories and entities"
          status={state.status}
          data={state.status === "success" ? state.data.googleRealtime : []}
          renderItem={(item) => (
            <article key={`${item.keyword}-${item.articleUrl ?? item.headline}`} className="card">
              <header>
                <h3>{item.keyword}</h3>
                {item.source ? <span className="muted">{item.source}</span> : null}
              </header>
              {item.headline ? <p>{item.headline}</p> : null}
              {item.articleUrl ? (
                <a href={item.articleUrl} target="_blank" rel="noreferrer">
                  Read source →
                </a>
              ) : null}
            </article>
          )}
          emptyLabel="No Google realtime signals detected."
        />

        <TrendStream
          title="YouTube Heat Index"
          subtitle="Trending videos and creators"
          status={state.status}
          data={state.status === "success" ? state.data.youtube : []}
          renderItem={(item) => (
            <article key={item.videoUrl} className="card youtube-card">
              <header>
                <h3>{item.keyword}</h3>
                {item.viewsLabel ? (
                  <span className="muted">{item.viewsLabel}</span>
                ) : null}
              </header>
              {item.channel ? <p>Channel · {item.channel}</p> : null}
              <a href={item.videoUrl} target="_blank" rel="noreferrer">
                Watch on YouTube →
              </a>
            </article>
          )}
          emptyLabel="YouTube trending feed is temporarily unavailable."
        />
      </section>

      <style jsx>{`
        .shell {
          width: min(1200px, 100%);
          padding: 3rem clamp(1rem, 4vw, 3rem);
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        h1 {
          font-size: clamp(2.5rem, 3vw, 3rem);
          margin-bottom: 0.75rem;
        }

        h2 {
          margin: 0;
          font-size: clamp(1.5rem, 2vw, 2rem);
        }

        h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 1.5rem;
          background: rgba(16, 21, 40, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: clamp(1.5rem, 3vw, 2.5rem);
          border-radius: 1.25rem;
          box-shadow: 0 25px 60px rgba(8, 11, 18, 0.45);
        }

        .header p {
          margin: 0;
          max-width: 36ch;
          color: rgba(224, 230, 242, 0.85);
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: rgba(224, 230, 242, 0.75);
        }

        select,
        input[type="range"] {
          background: rgba(12, 15, 28, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f4f6f8;
          border-radius: 0.8rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.95rem;
          min-width: 14ch;
        }

        input[type="range"] {
          padding: 0;
        }

        .refresh {
          background: linear-gradient(135deg, #4f37ff, #7b5bff);
          border: none;
          border-radius: 999px;
          padding: 0.65rem 1.5rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .refresh:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .refresh:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(79, 55, 255, 0.35);
        }

        .keywords {
          background: rgba(16, 21, 40, 0.78);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: clamp(1.5rem, 3vw, 2.5rem);
          box-shadow: inset 0 0 0 1px rgba(146, 161, 255, 0.08);
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .keyword-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .keyword-chip {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1rem;
          border-radius: 1rem;
          background: rgba(52, 64, 117, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: transform 0.2s ease, border 0.2s ease;
        }

        .keyword-chip:hover {
          transform: translateY(-2px);
          border-color: rgba(123, 91, 255, 0.6);
        }

        .keyword-chip h3 {
          font-size: 1rem;
        }

        .keyword-chip small {
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          color: rgba(200, 210, 240, 0.7);
        }

        .streams {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stream {
          background: rgba(16, 21, 40, 0.72);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: clamp(1.25rem, 3vw, 2rem);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 360px;
        }

        .stream header {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .stream header p {
          margin: 0;
          color: rgba(198, 206, 232, 0.7);
          font-size: 0.9rem;
        }

        .card {
          background: rgba(11, 13, 24, 0.9);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .card header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
        }

        .card p {
          margin: 0;
          color: rgba(214, 220, 242, 0.75);
        }

        .card a {
          align-self: flex-start;
          font-weight: 600;
          color: #8b9dff;
        }

        .muted {
          color: rgba(180, 193, 230, 0.6);
          font-size: 0.85rem;
        }

        .empty-state {
          color: rgba(180, 193, 230, 0.6);
          margin-top: auto;
        }

        @media (max-width: 720px) {
          .controls {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function renderKeywords(status: FetchState["status"], keywords: TrendKeyword[]) {
  if (status === "loading" || status === "idle") {
    return <p className="muted">Aggregating live signals…</p>;
  }
  if (status === "error") {
    return (
      <div className="muted">
        Something went wrong. Please retry in a few seconds.
      </div>
    );
  }
  if (!keywords.length) {
    return <div className="muted">No trending keywords detected.</div>;
  }

  return (
    <div className="keyword-grid">
      {keywords.map((keyword) => (
        <div key={keyword.keyword} className="keyword-chip">
          <small>{keyword.source.replace("-", " ")}</small>
          <h3>{keyword.keyword}</h3>
          {keyword.details ? (
            <p className="muted">{keyword.details}</p>
          ) : null}
          {keyword.url ? (
            <a href={keyword.url} target="_blank" rel="noreferrer">
              Explore →
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type TrendStreamProps<T> = {
  title: string;
  subtitle: string;
  status: FetchState["status"];
  data: T[];
  renderItem: (item: T) => JSX.Element;
  emptyLabel: string;
};

function TrendStream<T>({
  title,
  subtitle,
  status,
  data,
  renderItem,
  emptyLabel
}: TrendStreamProps<T>) {
  return (
    <div className="stream">
      <header>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      {status === "loading" || status === "idle" ? (
        <p className="muted">Collecting feed…</p>
      ) : null}
      {status === "error" ? (
        <p className="muted">Source temporarily unavailable.</p>
      ) : null}
      {status === "success" && data.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : null}
      {status === "success" && data.length > 0 ? data.map(renderItem) : null}
    </div>
  );
}
