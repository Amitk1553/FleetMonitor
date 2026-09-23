const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { HEARTBEAT_TIMEOUT_MS } = require('../utils/constants');

const deviceSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    lastHeartbeat: {
      type: Date,
      default: null,
    },
    reportedStatus: {
      type: String,
      default: null,
    },
    cpuUsage: {
      type: Number,
      default: null,
    },
    signalStrength: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed virtual: ONLINE if heartbeat within 30s, else OFFLINE
deviceSchema.virtual('status').get(function () {
  if (!this.lastHeartbeat) return 'OFFLINE';
  const elapsed = Date.now() - new Date(this.lastHeartbeat).getTime();
  return elapsed <= HEARTBEAT_TIMEOUT_MS ? 'ONLINE' : 'OFFLINE';
});

// Format device for API responses
deviceSchema.methods.toAPIResponse = function () {
  return {
    id: this._id,
    name: this.name,
    status: this.status,
    reported_status: this.reportedStatus,
    cpu_usage: this.cpuUsage,
    signal_strength: this.signalStrength,
    last_heartbeat: this.lastHeartbeat
      ? this.lastHeartbeat.toISOString()
      : null,
  };
};

module.exports = mongoose.model('Device', deviceSchema);
