const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const WebSocket = require('ws');
const EsphomeApi = require('esphome-native-api');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'dist')));

const HTTP_PORT = process.env.HTTP_PORT || 8080;
const devicesFile = path.join(__dirname, 'devices.json');
let devices = new Map();

function loadDevices() {
  if (fs.existsSync(devicesFile)) {
    const arr = JSON.parse(fs.readFileSync(devicesFile));
    devices = new Map(arr.map(d => [d.id, d]));
  }
}

function saveDevices() {
  fs.writeFileSync(devicesFile, JSON.stringify(Array.from(devices.values()), null, 2));
}

loadDevices();
function scanMdns() {
  return new Promise(resolve => {
    const found = [];
    exec("avahi-browse -rt _esphomelib._tcp", (err, stdout) => {
      if (!err) {
        stdout.split("\n").forEach(line => {
          const m = line.match(/=;[^;]*;[^;]*;[^;]*;([^;]*);([^;]*);(\d+)/);
          if (m) found.push({ name: m[1], ip: m[2], port: Number(m[3]) });
        });
      }
      resolve(found);
    });
  });
}


async function checkOnline(ip, port, password) {
  if (port == 6053) {
    const client = new EsphomeApi.APIClient(ip, port, password);
    try {
      await client.connect();
      await client.disconnect();
      return true;
    } catch (e) {
      return false;
    }
  }
  return axios
    .get(`http://${ip}:${port}`, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
}

app.get('/api/devices', (req, res) => {
  res.json(Array.from(devices.values()));
});

app.post('/api/devices', (req, res) => {
  const { name, ip, port = 80, password } = req.body;
  const id = Date.now().toString();
  const device = { id, name, ip, port, password, online: true };
  devices.set(id, device);
  saveDevices();
  res.json(device);
});

app.put('/api/devices/:id', (req, res) => {
  const device = devices.get(req.params.id);
  if (!device) return res.sendStatus(404);
  Object.assign(device, req.body);
  saveDevices();
  res.json(device);
});

app.delete('/api/devices/:id', (req, res) => {
  if (devices.delete(req.params.id)) saveDevices();
  res.json({ success: true });
});

app.post('/api/devices/:id/command', async (req, res) => {
  const device = devices.get(req.params.id);
  if (!device) return res.sendStatus(404);
  const { command } = req.body;
  try {
    if (device.port == 6053) {
      const client = new EsphomeApi.APIClient(device.ip, device.port, device.password);
      await client.connect();
      await client.executeServiceCall(command);
      await client.disconnect();
    } else {
      await axios.post(`http://${device.ip}:${device.port}/${command}`);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/scan', async (req, res) => {
  const result = await scanMdns();
  res.json(result);
});

app.get('/api/devices/:id/status', async (req, res) => {
  const device = devices.get(req.params.id);
  if (!device) return res.sendStatus(404);
  const online = await checkOnline(device.ip, device.port, device.password);
  device.online = online;
  res.json({ online });
});



const server = app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${HTTP_PORT}`);
});

const wss = new WebSocket.Server({ server });

setInterval(async () => {
  for (const device of devices.values()) {
    const prev = device.online;
    device.online = await checkOnline(device.ip, device.port, device.password);
    if (prev !== device.online) {
      wss.clients.forEach(ws => {
        ws.send(JSON.stringify({ id: device.id, online: device.online }));
      });
    }
  }
}, 5000);
