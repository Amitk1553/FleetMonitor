const Device = require('../models/Device');

// POST /devices — Register a new device
exports.registerDevice = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Device name is required' });
    }

    const trimmedName = name.trim();

    // Check if the name is purely numeric
    if (!isNaN(trimmedName)) {
      return res.status(400).json({ error: 'Device name cannot be purely numeric' });
    }

    // Check for duplicate name (case-insensitive)
    const existingDevice = await Device.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    
    if (existingDevice) {
      return res.status(400).json({ error: 'A device with this name already exists' });
    }

    const device = await Device.create({ name: trimmedName });
    res.status(201).json(device.toAPIResponse());
  } catch (err) {
    next(err);
  }
};

// GET /devices — List all registered devices
exports.listDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices.map((d) => d.toAPIResponse()));
  } catch (err) {
    next(err);
  }
};

// GET /devices/:id — Get a single device's details
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device.toAPIResponse());
  } catch (err) {
    next(err);
  }
};

// POST /devices/:id/heartbeat — Receive a device heartbeat
exports.receiveHeartbeat = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const { status, cpu_usage, signal_strength } = req.body;

    // Always use server timestamp for ONLINE/OFFLINE calculation
    device.lastHeartbeat = new Date();
    if (status) device.reportedStatus = status;
    if (cpu_usage !== undefined) device.cpuUsage = cpu_usage;
    if (signal_strength !== undefined) device.signalStrength = signal_strength;

    await device.save();
    res.json({ message: 'Heartbeat received', device: device.toAPIResponse() });
  } catch (err) {
    next(err);
  }
};

// DELETE /devices/:id — Delete a device
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    next(err);
  }
};
