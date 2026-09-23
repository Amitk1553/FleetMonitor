'use client';

export default function FleetSummary({ summary, loading }) {
  if (loading) {
    return (
      <div className="summary-grid">
        <div className="skeleton skeleton--summary" />
        <div className="skeleton skeleton--summary" />
        <div className="skeleton skeleton--summary" />
      </div>
    );
  }

  return (
    <div className="summary-grid">
      <div className="summary-card summary-card--total">
        <div className="summary-card__label">Total Devices</div>
        <div className="summary-card__value">{summary?.total ?? 0}</div>
        <div className="summary-card__icon">📡</div>
      </div>

      <div className="summary-card summary-card--online">
        <div className="summary-card__label">Online</div>
        <div className="summary-card__value">{summary?.online ?? 0}</div>
        <div className="summary-card__icon">✓</div>
      </div>

      <div className="summary-card summary-card--offline">
        <div className="summary-card__label">Offline</div>
        <div className="summary-card__value">{summary?.offline ?? 0}</div>
        <div className="summary-card__icon">✕</div>
      </div>
    </div>
  );
}
