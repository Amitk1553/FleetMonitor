const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchDevices() {
  const res = await fetch(`${API_BASE}/devices`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function fetchDevice(id) {
  const res = await fetch(`${API_BASE}/devices/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch device');
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function registerDevice(name) {
  const res = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register device');
  }
  return res.json();
}

export async function sendHeartbeat(id, payload = {}) {
  const res = await fetch(`${API_BASE}/devices/${id}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'OK', ...payload }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send heartbeat');
  }
  return res.json();
}

export async function deleteDevice(id) {
  const res = await fetch(`${API_BASE}/devices/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete device');
  }
  return res.json();
}

