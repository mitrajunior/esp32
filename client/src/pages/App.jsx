import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [ip, setIp] = useState('');
  const wsRef = useState(null);

  const load = async () => {
    const res = await axios.get('/api/devices');
    setDevices(res.data);
  };

  const add = async () => {
    if (!ip) return;
    await axios.post('/api/devices', { ip, name: ip });
    setIp('');
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
      <div className="space-x-2 mb-4">
        <button onClick={load} className="bg-blue-600 px-2 py-1 rounded">Scan</button>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="IP" className="text-black px-1" />
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
