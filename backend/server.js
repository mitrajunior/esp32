const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const ping = require('ping');

const app = express();
app.use(cors());
app.use(express.json());

let devices = [];

async function checkDevice(ip) {
  try {
    const resPing = await ping.promise.probe(ip, { timeout: 1 });
    if (!resPing.alive) return null;
    const res = await fetch(`http://${ip}/info`, { timeout: 1000 });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.name && Array.isArray(data.functions)) {
      return { ip, name: data.name, functions: data.functions };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function scanNetwork() {
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `192.168.1.${i}`;
    promises.push(checkDevice(ip));
  }
  const results = await Promise.all(promises);
  devices = results.filter(Boolean);
  return devices;
}

app.get('/devices', async (req, res) => {
  const list = await scanNetwork();
  res.json(list);
});

app.post('/device/:ip/:action', async (req, res) => {
  const { ip, action } = req.params;
  try {
    const resp = await fetch(`http://${ip}/${action}`, { method: 'POST', timeout: 1000 });
    const text = await resp.text();
    res.send(text);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach device' });
  }
});

app.post('/add-device', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  const device = await checkDevice(ip);
  if (device) {
    if (!devices.find(d => d.ip === ip)) {
      devices.push(device);
    }
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
