const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');

function ensureModule(name) {
  try {
    return require(name);
  } catch (e) {
    try {
      console.log(`Installing missing module ${name}...`);
      execSync(`npm install ${name}`, { stdio: 'inherit', cwd: __dirname });
      return require(name);
    } catch (err) {
      console.error(`Failed to install ${name}:`, err.message);
      return null;
    }
  }
}

const bonjour = ensureModule('bonjour');
const ping = ensureModule('ping');
const axios = ensureModule('axios');
const net = ensureModule('net');
let esphomeApi = ensureModule('@esphome/api');

const app = express();
app.use(cors());
app.use(express.json());

let devices = [];

async function fetchInfo(ip) {
  if (!axios) return null;
  try {
    const res = await axios.get(`http://${ip}/info`, { timeout: 1000 });
    const data = res.data;
    if (data && data.name && Array.isArray(data.functions)) {
      return { ip, name: data.name, functions: data.functions, online: true };
    }
  } catch (e) {
    return null;
  }
  return null;
}

function discoverMdns(timeout = 3000) {
  return new Promise(resolve => {
    if (!bonjour) return resolve([]);
    const found = [];
    const b = bonjour();
    const browser = b.find({ type: 'esphomelib' });
    browser.on('up', service => {
      const ip = service.referer && service.referer.address;
      if (ip) found.push({ ip, name: service.name, functions: [] });
    });
    setTimeout(() => {
      browser.stop();
      b.destroy();
      resolve(found);
    }, timeout);
  });
}

async function scanSubnet() {
  const list = [];
  if (!ping || !net) return list;
  const tasks = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `192.168.1.${i}`;
    tasks.push((async () => {
      const r = await ping.promise.probe(ip, { timeout: 1 });
      if (!r.alive) return;
      await new Promise(res => {
        const sock = new net.Socket();
        let done = false;
        sock.setTimeout(500);
        sock.on('connect', async () => {
          sock.destroy();
          done = true;
          const info = await fetchInfo(ip);
          if (info) list.push(info);
          res();
        });
        const finish = () => { if (!done) { done = true; sock.destroy(); res(); } };
        sock.on('timeout', finish);
        sock.on('error', finish);
        try {
          sock.connect(6053, ip);
        } catch { finish(); }
      });
    })());
  }
  await Promise.all(tasks);
  return list;
}

async function discoverDevices() {
  const discovered = [];
  const mdnsFound = await discoverMdns();
  for (const dev of mdnsFound) {
    const info = await fetchInfo(dev.ip);
    if (info) discovered.push(info);
  }
  if (!discovered.length) {
    const scanned = await scanSubnet();
    discovered.push(...scanned);
  }
  // merge with previous/manual devices
  const manual = devices.filter(d => d.manual);
  for (const dev of manual) {
    if (!discovered.find(d => d.ip === dev.ip)) {
      const info = await fetchInfo(dev.ip);
      if (info) discovered.push(info);
      else discovered.push({ ...dev, online: false });
    }
  }
  devices = discovered.concat(manual.filter(m => !discovered.find(d => d.ip === m.ip)));
  return devices;
}

app.get('/devices', async (req, res) => {
  const list = await discoverDevices();
  res.json(list);
});

app.post('/add-device', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  const info = await fetchInfo(ip);
  if (info) {
    info.manual = true;
    devices = devices.filter(d => d.ip !== ip);
    devices.push(info);
    res.json(info);
  } else {
    devices.push({ ip, name: ip, functions: [], manual: true, online: false });
    res.status(404).json({ error: 'Device not reachable' });
  }
});

app.post('/device/:ip/:action', async (req, res) => {
  const { ip, action } = req.params;
  if (!esphomeApi) esphomeApi = ensureModule('@esphome/api');
  if (esphomeApi) {
    try {
      const client = new esphomeApi.APIClient({ host: ip, port: 6053 });
      await client.connect();
      if (client.executeService) {
        await client.executeService(action);
      }
      await client.disconnect();
      return res.json({ ok: true });
    } catch (e) {
      console.error('API error, falling back to HTTP:', e.message);
    }
  }
  try {
    const r = await axios.post(`http://${ip}/${action}`);
    res.send(r.data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
