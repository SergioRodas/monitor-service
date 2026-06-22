import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStatus } from './api';
import type { CheckResult, MonitorStatus, StatusResponse } from './types';
import Sparkline from './components/Sparkline';

const REFRESH_MS = 15_000;

const STATUS_COLOR: Record<CheckResult, string> = {
  UP: 'var(--ok)',
  DOWN: 'var(--down)',
  UNKNOWN: 'var(--text-faint)',
};

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function MonitorRow({ m }: { m: MonitorStatus }) {
  const color = STATUS_COLOR[m.status];
  return (
    <div className="row">
      <span className="row__led" style={{ background: color, boxShadow: `0 0 8px -1px ${color}` }} />
      <div className="row__id">
        <span className="row__name">{m.name}</span>
        <a className="row__url" href={m.url} target="_blank" rel="noopener">
          {m.url.replace(/^https?:\/\//, '')}
        </a>
      </div>
      <Sparkline history={m.history} color={color} />
      <span className="row__uptime">
        {m.uptime24h != null ? `${m.uptime24h}%` : '—'}
        <small>24h</small>
      </span>
      <span className="row__latency">
        {m.lastLatencyMs != null ? `${m.lastLatencyMs}ms` : '—'}
        <small>latency</small>
      </span>
      <span className="row__state" style={{ color }}>
        {m.status.toLowerCase()}
        <small>{relativeTime(m.lastCheckedAt)}</small>
      </span>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchStatus();
      setData(res);
      setError(null);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reach the API');
    }
  }, []);

  useEffect(() => {
    void load();
    timer.current = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [load]);

  const summary = data?.summary;
  const allOk = summary?.allOperational ?? false;
  const headline = !summary
    ? 'connecting…'
    : allOk
      ? 'All systems operational'
      : `${summary.down} of ${summary.total} down`;

  return (
    <main className="page">
      <div className="container">
        <header className="topbar">
          <span className="brand">
            <span className="brand__dots" aria-hidden="true">
              <i /> <i /> <i />
            </span>
            monitor-service
          </span>
          <span className="live">
            <span
              className="live__dot"
              style={{ background: allOk ? 'var(--ok)' : 'var(--down)' }}
            />
            {updatedAt ? `updated ${relativeTime(updatedAt.toISOString())}` : '…'}
          </span>
        </header>

        <section
          className="banner"
          style={{ borderColor: allOk ? 'var(--ok-dim)' : 'var(--down-dim)' }}
        >
          <span
            className="banner__dot"
            style={{ background: allOk ? 'var(--ok)' : 'var(--down)' }}
          />
          <h1 className="banner__text">{headline}</h1>
          {summary && (
            <span className="banner__meta">
              {summary.up}/{summary.total} up · auto-refresh {REFRESH_MS / 1000}s
            </span>
          )}
        </section>

        {error && (
          <div className="error">
            ⚠ {error} — is the API running at the configured URL?
          </div>
        )}

        <section className="board">
          <div className="board__head">
            <span>service</span>
            <span className="board__head-r">latency · status</span>
          </div>
          {data?.monitors.map((m) => <MonitorRow key={m.id} m={m} />)}
          {!data && !error && <div className="board__loading">loading monitors…</div>}
        </section>

        <footer className="foot">
          monitor-service · NestJS + Prisma · feeds{' '}
          <a href="https://sergiorodas.vercel.app" target="_blank" rel="noopener">
            sergiorodas.vercel.app
          </a>
        </footer>
      </div>
    </main>
  );
}
