const readline = require('readline');
const http = require('http');

// ─── Configuration ──────────────────────────────────────────────────────
const API_BASE = process.env.API_URL || 'http://localhost:5000';
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const DEVICE_NAMES = [
  'Lab Device 01',
  'Lab Device 02',
  'Lab Device 03',
  'Lab Device 04',
  'Lab Device 05',
];

// ─── State ──────────────────────────────────────────────────────────────
const registeredDevices = []; // { id, name }
const heartbeatIntervals = new Map(); // id -> intervalId

// ─── HTTP Helper ────────────────────────────────────────────────────────
function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Core Functions ─────────────────────────────────────────────────────
async function registerDevice(name) {
  const res = await apiRequest('POST', '/devices', { name });
  if (res.status === 201) {
    return res.body;
  }
  throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.body)}`);
}

async function sendHeartbeat(deviceId, deviceName) {
  const cpuUsage = Math.floor(Math.random() * 100);
  const signalStrength = -Math.floor(Math.random() * 50 + 30);

  try {
    await apiRequest('POST', `/devices/${deviceId}/heartbeat`, {
      status: 'OK',
      cpu_usage: cpuUsage,
      signal_strength: signalStrength,
    });
    const time = new Date().toLocaleTimeString();
    console.log(
      `  [${time}] \u2764  ${deviceName} -> heartbeat (CPU: ${cpuUsage}%, Signal: ${signalStrength}dBm)`
    );
  } catch (err) {
    console.error(`  [ERR] ${deviceName} -> heartbeat failed: ${err.message}`);
  }
}

function startDevice(index) {
  const device = registeredDevices[index];
  if (!device) {
    console.log(`  Invalid device index: ${index + 1}`);
    return;
  }
  if (heartbeatIntervals.has(device.id)) {
    console.log(`  Device ${index + 1} (${device.name}) is already running`);
    return;
  }

  // Immediate first heartbeat, then periodic
  sendHeartbeat(device.id, device.name);
  const interval = setInterval(
    () => sendHeartbeat(device.id, device.name),
    HEARTBEAT_INTERVAL
  );
  heartbeatIntervals.set(device.id, interval);
  console.log(`  >> Started device ${index + 1}: ${device.name}`);
}

function stopDevice(index) {
  const device = registeredDevices[index];
  if (!device) {
    console.log(`  Invalid device index: ${index + 1}`);
    return;
  }
  const interval = heartbeatIntervals.get(device.id);
  if (interval) {
    clearInterval(interval);
    heartbeatIntervals.delete(device.id);
    console.log(
      `  >> Stopped device ${index + 1}: ${device.name} (will go OFFLINE in ~30s)`
    );
  } else {
    console.log(`  Device ${index + 1} (${device.name}) is not running`);
  }
}

function listDevices() {
  console.log('\n  --- Simulated Devices ---');
  registeredDevices.forEach((device, i) => {
    const running = heartbeatIntervals.has(device.id);
    const icon = running ? '\u{1F7E2}' : '\u{1F534}';
    const label = running ? 'RUNNING' : 'STOPPED';
    console.log(`  ${i + 1}. ${icon} ${device.name} (${device.id}) - ${label}`);
  });
  console.log('');
}

function showHelp() {
  console.log('\n  --- Commands ---');
  console.log('  stop <n>    Stop device number n (e.g. stop 3)');
  console.log('  start <n>   Restart a stopped device');
  console.log('  list        Show all devices and their state');
  console.log('  help        Show this help message');
  console.log('  exit        Shut down all devices and exit\n');
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('  ============================================');
  console.log('   Fleet Monitor - Device Simulator');
  console.log('  ============================================');
  console.log(`  API Target : ${API_BASE}`);
  console.log(`  Devices    : ${DEVICE_NAMES.length}`);
  console.log(`  Interval   : ${HEARTBEAT_INTERVAL / 1000}s`);
  console.log('  ============================================\n');

  // Register all devices
  console.log('  Registering devices...\n');
  for (const name of DEVICE_NAMES) {
    try {
      const device = await registerDevice(name);
      registeredDevices.push({ id: device.id, name: device.name });
      console.log(`  \u2705 Registered: ${device.name} (ID: ${device.id})`);
    } catch (err) {
      console.error(`  \u274C Failed to register "${name}": ${err.message}`);
    }
  }

  if (registeredDevices.length === 0) {
    console.error('\n  No devices registered. Is the API server running?');
    console.error(`  Tried: ${API_BASE}`);
    process.exit(1);
  }

  // Start all heartbeats
  console.log(`\n  Starting heartbeats...\n`);
  registeredDevices.forEach((_, i) => startDevice(i));

  showHelp();

  // Interactive CLI
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '  simulator> ',
  });

  rl.prompt();

  rl.on('line', (line) => {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const arg = parseInt(parts[1]);

    switch (cmd) {
      case 'stop':
        if (isNaN(arg) || arg < 1 || arg > registeredDevices.length) {
          console.log(`  Usage: stop <1-${registeredDevices.length}>`);
        } else {
          stopDevice(arg - 1);
        }
        break;

      case 'start':
        if (isNaN(arg) || arg < 1 || arg > registeredDevices.length) {
          console.log(`  Usage: start <1-${registeredDevices.length}>`);
        } else {
          startDevice(arg - 1);
        }
        break;

      case 'list':
        listDevices();
        break;

      case 'help':
        showHelp();
        break;

      case 'exit':
      case 'quit':
        console.log('\n  Shutting down all devices...');
        for (const [, interval] of heartbeatIntervals) {
          clearInterval(interval);
        }
        console.log('  Goodbye!\n');
        process.exit(0);
        break;

      case '':
        break;

      default:
        console.log(`  Unknown command: "${cmd}". Type "help" for commands.`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n  Shutting down...');
    for (const [, interval] of heartbeatIntervals) {
      clearInterval(interval);
    }
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`\n  Fatal error: ${err.message}`);
  process.exit(1);
});
