'use client';

import Link from 'next/link';

export default function DeviceCard({ device }) {
  const isOnline = device.status === 'ONLINE';
  const statusClass = isOnline ? 'online' : 'offline';

  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <Link href={`/devices/${device.id}`} className="device-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
      <div className={`device-card__indicator device-card__indicator--${statusClass}`} />

      <div className="device-card__info">
        <div className="device-card__name">{device.name}</div>
        <div className="device-card__id">{device.id}</div>
      </div>

      <div className="device-card__meta">
        <div className="device-card__heartbeat">
          <span className="device-card__heartbeat-icon">♥</span>
          {formatTime(device.last_heartbeat)}
        </div>
        <span className={`status-badge status-badge--${statusClass}`}>
          {device.status}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem', transition: 'transform 150ms ease' }}>→</span>
      </div>
    </Link>
  );
}

