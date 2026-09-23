'use client';

import { useState } from 'react';
import { registerDevice } from '../lib/api';

export default function RegisterDevice({ onRegistered, onClose }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Device name is required');
      return;
    }

    setLoading(true);
    try {
      const device = await registerDevice(name.trim());
      setSuccess(true);
      setName('');
      if (onRegistered) onRegistered(device);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">Register New Device</div>
        <div className="modal__subtitle">
          Add a new device to the fleet for monitoring
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div>
            <label className="input-label" htmlFor="device-name">
              Device Name
            </label>
            <input
              id="device-name"
              className="input"
              type="text"
              placeholder="e.g. Lab Device 01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          {success && (
            <div className="alert alert--success">
              Device registered successfully!
            </div>
          )}

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : '+ Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
