const Device = require('../models/Device');
const { HEARTBEAT_TIMEOUT_MS } = require('../utils/constants');

// GET /summary — Fleet summary
exports.getFleetSummary = async (req, res, next) => {
  try {
    const devices = await Device.find();
    const now = Date.now();

    let online = 0;
    let offline = 0;

    devices.forEach((device) => {
      if (
        device.lastHeartbeat &&
        now - new Date(device.lastHeartbeat).getTime() <= HEARTBEAT_TIMEOUT_MS
      ) {
        online++;
      } else {
        offline++;
      }
    });

    res.json({
      total: devices.length,
      online,
      offline,
    });
  } catch (err) {
    next(err);
  }
};
