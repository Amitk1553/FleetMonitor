'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RegisterDevice from '../../components/RegisterDevice';
import { fetchDevices, deleteDevice } from '../../lib/api';

const POLL_INTERVAL = 5000;

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return new Date(isoString).toLocaleTimeString();
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | ONLINE | OFFLINE
  const [deletingId, setDeletingId] = useState(null);

  const loadDevices = useCallback(async () => {
    try {
      const data = await fetchDevices();
      setDevices(data);
      setError('');
    } catch {
      setError('Failed to load devices. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadDevices]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this device?')) {
      setDeletingId(id);
      try {
        await deleteDevice(id);
        loadDevices();
      } catch (err) {
        alert(err.message || 'Failed to delete device');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filtered = filter === 'ALL'
    ? devices
    : devices.filter((d) => d.status === filter);

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d) => d.status === 'OFFLINE').length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">
            All registered devices — click a device to view details and send heartbeats
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowRegister(true)}
          id="add-device-btn"
        >
          + Register Device
        </button>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'ALL', label: `All (${devices.length})` },
          { key: 'ONLINE', label: `Online (${onlineCount})` },
          { key: 'OFFLINE', label: `Offline (${offlineCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`btn btn--sm ${filter === key ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter(key)}
            id={`filter-${key.toLowerCase()}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Device List */}
      {loading ? (
        <div className="device-list">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📡</div>
          <div className="empty-state__text">
            {filter === 'ALL' ? 'No devices registered' : `No ${filter.toLowerCase()} devices`}
          </div>
          <div className="empty-state__subtext">
            {filter === 'ALL'
              ? 'Register a device or run the simulator to get started'
              : 'Change the filter to see other devices'}
          </div>
        </div>
      ) : (
        <div className="device-list">
          {filtered.map((device) => (
            <Link
              key={device.id}
              href={`/devices/${device.id}`}
              className="device-table-row"
              id={`device-row-${device.id}`}
            >
              <div
                className={`device-card__indicator device-card__indicator--${device.status.toLowerCase()}`}
              />
              <div>
                <div className="device-table-row__name">{device.name}</div>
              </div>
              <div className="device-table-row__hb">
                ♥ {formatRelativeTime(device.last_heartbeat)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`status-badge status-badge--${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
                <button
                  onClick={(e) => handleDelete(e, device.id)}
                  disabled={deletingId === device.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-red)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                  }}
                  className="btn--ghost"
                >
                  {deletingId === device.id ? '...' : 'Delete'}
                </button>
                <span className="device-table-row__arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showRegister && (
        <RegisterDevice
          onRegistered={loadDevices}
          onClose={() => setShowRegister(false)}
        />
      )}
    </>
  );
}
