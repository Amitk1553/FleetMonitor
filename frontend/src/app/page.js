'use client';

import { useState, useEffect, useCallback } from 'react';
import FleetSummary from '../components/FleetSummary';
import DeviceList from '../components/DeviceList';
import RegisterDevice from '../components/RegisterDevice';
import { fetchDevices, fetchSummary } from '../lib/api';

const POLL_INTERVAL = 5000; // 5 seconds

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

  // Initial load + polling
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDeviceRegistered = () => {
    loadData();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__icon">📡</div>
          <div>
            <h1 className="app-header__title">Fleet Monitor</h1>
            <p className="app-header__subtitle">
              Real-time device fleet monitoring dashboard
            </p>
          </div>
        </div>

        <div className="app-header__actions">
          <div className="live-indicator">
            <div className="live-indicator__dot" />
            <span>
              Live{' '}
              {lastUpdated &&
                `· ${lastUpdated.toLocaleTimeString()}`}
            </span>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => setShowRegister(true)}
            id="register-device-btn"
          >
            + Add Device
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="alert alert--error" style={{ marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Fleet Summary Cards */}
      <FleetSummary summary={summary} loading={loading} />

      {/* Device List Section */}
      <div className="section-header">
        <h2 className="section-header__title">
          Registered Devices
          {devices.length > 0 && (
            <span className="section-header__count">
              {devices.length} device{devices.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <button
          className="btn btn--ghost btn--sm"
          onClick={loadData}
          id="refresh-btn"
        >
          ↻ Refresh
        </button>
      </div>

      <DeviceList devices={devices} loading={loading} />

      {/* Register Modal */}
      {showRegister && (
        <RegisterDevice
          onRegistered={handleDeviceRegistered}
          onClose={() => setShowRegister(false)}
        />
      )}
    </div>
  );
}
