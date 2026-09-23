'use client';

import DeviceCard from './DeviceCard';

export default function DeviceList({ devices, loading, onDeleted }) {
  if (loading) {
    return (
      <div className="device-list">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton skeleton--card" />
        ))}
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📡</div>
        <div className="empty-state__text">No devices registered</div>
        <div className="empty-state__subtext">
          Register a device or run the simulator to get started
        </div>
      </div>
    );
  }

  return (
    <div className="device-list">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onDeleted={onDeleted} />
      ))}
    </div>
  );
}

