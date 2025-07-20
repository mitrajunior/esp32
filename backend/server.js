const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bonjour = require('bonjour')();
const ping = require('ping');
const esphome = require('@esphome/api');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

let devices = [];

async function discoverDevices() {
  devices = [];
  try {
    const browser = bonjour.find({ type: 'esphomelib' }, service => {
      devices.push({ name: service.name, ip: service.referer.address, online: true });
    });
    // wait 3s for discovery
    await new Promise(r => setTimeout(r, 3000));
    browser.stop();
  } catch (e) {
    console.error('Bonjour discovery failed', e);
  }

  // Fallback IP scan 192.168.1.*
  if (devices.length === 0) {
    for (let i = 1; i <= 254; i++) {
      const ip = `192.168.1.${i}`;
      try {
        const res = await ping.promise.probe(ip, { timeout: 1 });
        if (res.alive) {
          // check port 6053
          await axios.get(`http://${ip}:6053`).catch(() => {});
          devices.push({ name: `ESPHome-${ip}`, ip, online: true });
        }
      } catch (err) {}
    }
  }
}

app.get('/api/devices', async (req, res) => {
  await discoverDevices();
  res.json(devices);
});

app.post('/api/add-device', (req, res) => {
  const { ip } = req.body;
  if (ip && !devices.find(d => d.ip === ip)) {
    devices.push({ name: `ESPHome-${ip}`, ip, online: true });
  }
  res.json({ success: true, devices });
});

app.post('/api/device/:ip/:action', async (req, res) => {
  const { ip, action } = req.params;
  try {
    const client = new esphome.APIClient(ip, 6053);
    await client.connect();
    await client.executeServiceCall(action);
    await client.disconnect();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
