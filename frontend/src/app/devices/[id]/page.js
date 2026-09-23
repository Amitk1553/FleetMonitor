'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { fetchDevice, sendHeartbeat } from '../../../lib/api';

const POLL_INTERVAL = 5000;

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString();
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export default function DeviceDetailPage({ params }) {
  const { id } = use(params); // Next.js 15/16: params is a Promise

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Heartbeat form state
  const [hbStatus, setHbStatus] = useState('OK');
  const [hbCpu, setHbCpu] = useState('');
  const [hbSignal, setHbSignal] = useState('');
  const [hbLoading, setHbLoading] = useState(false);
  const [hbResult, setHbResult] = useState(null); // { type: 'success'|'error', msg }

  const loadDevice = useCallback(async () => {
    try {
      const data = await fetchDevice(id);
      setDevice(data);
      setError('');
    } catch {
      setError('Device not found or backend is unreachable.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDevice();
    const interval = setInterval(loadDevice, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadDevice]);

  const handleSendHeartbeat = async (e) => {
    e.preventDefault();
    setHbLoading(true);
    setHbResult(null);
    try {
      const payload = { status: hbStatus };
      if (hbCpu !== '') payload.cpu_usage = Number(hbCpu);
      if (hbSignal !== '') payload.signal_strength = Number(hbSignal);

      await sendHeartbeat(id, payload);
      setHbResult({ type: 'success', msg: 'Heartbeat sent successfully! Device is now ONLINE.' });
      loadDevice(); // refresh immediately
    } catch (err) {
      setHbResult({ type: 'error', msg: err.message });
    } finally {
      setHbLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Link href="/devices" className="back-btn">← Back to Devices</Link>
        <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 140, marginBottom: 32 }} />
        <div className="skeleton skeleton--summary" style={{ marginBottom: 16 }} />
        <div className="skeleton skeleton--summary" />
      </>
    );
  }

  if (error || !device) {
    return (
      <>
        <Link href="/devices" className="back-btn">← Back to Devices</Link>
        <div className="alert alert--error">{error || 'Device not found.'}</div>
      </>
    );
  }

  const isOnline = device.status === 'ONLINE';

  return (
    <>
      <Link href="/devices" className="back-btn">← Back to Devices</Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">{device.name}</h1>
        </div>
        <span className={`status-badge status-badge--${device.status.toLowerCase()}`}
          style={{ fontSize: '0.9rem', padding: '8px 20px' }}>
          <span className={`device-card__indicator device-card__indicator--${device.status.toLowerCase()}`}
            style={{ width: 9, height: 9 }} />
          {device.status}
        </span>
      </div>

      {/* Device Info Card — GET /devices/:id */}
      <div className="detail-card">
        <div className="detail-card__header">
          <div className="detail-card__title">Device Information</div>
        </div>
        <div className="metric-grid">
          <div className="metric-item">
            <div className="metric-item__label">Device Name</div>
            <div className="metric-item__value" style={{ fontSize: '1rem' }}>{device.name}</div>
          </div>
          <div className="metric-item">
            <div className="metric-item__label">Status</div>
            <div className={`metric-item__value metric-item__value--${device.status.toLowerCase()}`}>
              {device.status}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-item__label">Last Heartbeat</div>
            <div className="metric-item__value" style={{ fontSize: '0.85rem' }}>
              {formatRelativeTime(device.last_heartbeat)}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-item__label">Heartbeat Time</div>
            <div className="metric-item__value metric-item__value--mono">
              {device.last_heartbeat ? formatTime(device.last_heartbeat) : '—'}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-item__label">CPU Usage</div>
            <div className="metric-item__value">
              {device.cpu_usage != null ? `${device.cpu_usage}%` : '—'}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-item__label">Signal Strength</div>
            <div className="metric-item__value">
              {device.signal_strength != null ? `${device.signal_strength} dBm` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Send Heartbeat Card — POST /devices/:id/heartbeat */}
      <div className="detail-card">
        <div className="detail-card__header">
          <div>
            <div className="detail-card__title">Send Heartbeat</div>
          </div>
          <div className="live-indicator">
            <div className="live-indicator__dot" />
            <span>Auto-polls every 5s</span>
          </div>
        </div>

        <form className="heartbeat-form" onSubmit={handleSendHeartbeat} id="heartbeat-form">
          <div>
            <label className="input-label" htmlFor="hb-status">Status</label>
            <select
              id="hb-status"
              className="input"
              value={hbStatus}
              onChange={(e) => setHbStatus(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="OK">OK</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div className="heartbeat-form__row">
            <div>
              <label className="input-label" htmlFor="hb-cpu">CPU Usage (%) — optional</label>
              <input
                id="hb-cpu"
                className="input"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 42"
                value={hbCpu}
                onChange={(e) => setHbCpu(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="hb-signal">Signal Strength (dBm) — optional</label>
              <input
                id="hb-signal"
                className="input"
                type="number"
                min="-120"
                max="0"
                placeholder="e.g. -71"
                value={hbSignal}
                onChange={(e) => setHbSignal(e.target.value)}
              />
            </div>
          </div>

          {hbResult && (
            <div className={`alert alert--${hbResult.type === 'success' ? 'success' : 'error'}`}>
              {hbResult.msg}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={hbLoading}
              id="send-heartbeat-btn"
            >
              {hbLoading ? 'Sending...' : '♥ Send Heartbeat'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
