import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [password, setPassword] = useState('');
  const wsRef = useRef(null);

  const load = async () => {
    const res = await axios.get('/api/devices');
    setDevices(res.data);
  };

  const add = async () => {
    if (!ip) return;
    await axios.post('/api/devices', {
      ip,
      name: name || ip,
      port: port ? Number(port) : undefined,
      password: password || undefined,
    });
    setName('');
    setIp('');
    setPort('');
    setPassword('');
    load();
  };

  useEffect(() => {
    load();
    const ws = new WebSocket(`ws://${window.location.host}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setDevices((prev) => prev.map(d => d.id === msg.id ? { ...d, online: msg.online } : d));
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl mb-4">ESP32 Controller</h1>
      <div className="space-x-2 mb-4 flex flex-wrap items-center">
        <button onClick={load} className="bg-blue-600 px-2 py-1 rounded">Scan</button>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="text-black px-1" />
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="IP" className="text-black px-1" />
        <input value={port} onChange={e => setPort(e.target.value)} placeholder="Porta" className="text-black px-1 w-16" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="text-black px-1" />
        <button onClick={add} className="bg-green-600 px-2 py-1 rounded">Add</button>
      </div>
      <ul className="space-y-2">
        {devices.map(d => (
          <li key={d.id} className="flex justify-between border-b border-gray-700 pb-1">
            <span>{d.name} ({d.ip}) - {d.online ? 'Online' : 'Offline'}</span>
            <Link to={`/device/${d.id}`} className="bg-blue-700 px-2 py-1 rounded">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
