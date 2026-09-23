'use client';

import { useState, useEffect, useCallback } from 'react';
import FleetSummary from '../components/FleetSummary';
import DeviceList from '../components/DeviceList';
import RegisterDevice from '../components/RegisterDevice';
import { fetchDevices, fetchSummary } from '../lib/api';

const POLL_INTERVAL = 5000;

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [devicesData, summaryData] = await Promise.all([
        fetchDevices(),
        fetchSummary(),
      ]);
      setDevices(devicesData);
      setSummary(summaryData);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError('Unable to connect to the API server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Real-time overview of your device fleet
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="live-indicator">
              <div className="live-indicator__dot" />
              <span>Live {lastUpdated && `· ${lastUpdated.toLocaleTimeString()}`}</span>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => setShowRegister(true)}
              id="register-device-btn"
            >
              + Add Device
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert--error" style={{ marginBottom: 24 }}>
          {error}
        </div>
      )}

      <FleetSummary summary={summary} loading={loading} />

      <div className="section-header">
        <h2 className="section-header__title">
          Registered Devices
          {devices.length > 0 && (
            <span className="section-header__count">
              {devices.length} device{devices.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <button className="btn btn--ghost btn--sm" onClick={loadData} id="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      <DeviceList devices={devices} loading={loading} onDeleted={loadData} />

      {showRegister && (
        <RegisterDevice
          onRegistered={loadData}
          onClose={() => setShowRegister(false)}
        />
      )}
    </>
  );
}
