'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSummary, fetchDevices } from '../../lib/api';

const POLL_INTERVAL = 5000;

export default function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [summaryData, devicesData] = await Promise.all([
        fetchSummary(),
        fetchDevices(),
      ]);
      setSummary(summaryData);
      setDevices(devicesData);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Failed to load summary. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  const onlinePct = summary?.total
    ? Math.round((summary.online / summary.total) * 100)
    : 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Fleet Summary</h1>
          <p className="page-subtitle">GET /summary — Live fleet health overview</p>
        </div>
        <div className="live-indicator">
          <div className="live-indicator__dot" />
          <span>Live {lastUpdated && `· ${lastUpdated.toLocaleTimeString()}`}</span>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 24 }}>{error}</div>}


      {/* Summary Metrics */}
      {!loading && summary && (
        <div className="detail-card">
          <div className="detail-card__header">
            <div className="detail-card__title">Fleet Health</div>
          </div>
          <div className="metric-grid">
            <div className="metric-item">
              <div className="metric-item__label">Total Devices</div>
              <div className="metric-item__value">{summary.total}</div>
            </div>
            <div className="metric-item">
              <div className="metric-item__label">Online</div>
              <div className="metric-item__value metric-item__value--online">{summary.online}</div>
            </div>
            <div className="metric-item">
              <div className="metric-item__label">Offline</div>
              <div className="metric-item__value metric-item__value--offline">{summary.offline}</div>
            </div>
            <div className="metric-item">
              <div className="metric-item__label">Availability</div>
              <div
                className="metric-item__value"
                style={{ color: onlinePct >= 80 ? 'var(--accent-green)' : onlinePct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}
              >
                {onlinePct}%
              </div>
            </div>
          </div>

          {/* Visual health bar */}
          {summary.total > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fleet availability</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {summary.online} / {summary.total} online
                </span>
              </div>
              <div style={{
                height: 8, borderRadius: 100, background: 'var(--accent-red-bg)',
                border: '1px solid var(--accent-red-glow)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${onlinePct}%`,
                  background: 'var(--accent-green)',
                  borderRadius: 100,
                  boxShadow: 'var(--shadow-glow-green)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}

          {/* Per-device status breakdown */}
          {devices.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Device breakdown
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {devices.map((d) => (
                  <span
                    key={d.id}
                    className={`status-badge status-badge--${d.status.toLowerCase()}`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
