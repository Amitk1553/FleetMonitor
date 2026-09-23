'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deleteDevice } from '../lib/api';

export default function DeviceCard({ device, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOnline = device.status === 'ONLINE';
  const statusClass = isOnline ? 'online' : 'offline';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this device?')) {
      setIsDeleting(true);
      try {
        await deleteDevice(device.id);
        if (onDeleted) onDeleted();
      } catch (err) {
        alert(err.message || 'Failed to delete device');
        setIsDeleting(false);
      }
    }
  };

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
      </div>

      <div className="device-card__meta" style={{ gap: '16px' }}>
        <div className="device-card__heartbeat">
          <span className="device-card__heartbeat-icon">♥</span>
          {formatTime(device.last_heartbeat)}
        </div>
        <span className={`status-badge status-badge--${statusClass}`}>
          {device.status}
        </span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
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
          {isDeleting ? '...' : 'Delete'}
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem', transition: 'transform 150ms ease' }}>→</span>
      </div>
    </Link>
  );
}

