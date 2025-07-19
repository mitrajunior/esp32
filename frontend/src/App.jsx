import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [manualIp, setManualIp] = useState('');
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const scan = async () => {
    const res = await fetch(`${API}/devices`);
    const data = await res.json();
    setDevices(data);
  };

  useEffect(() => {
    scan();
  }, []);

  const addManual = async () => {
    if (!manualIp) return;
    const res = await fetch(`${API}/add-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: manualIp })
    });
    if (res.ok) {
      const device = await res.json();
      setDevices(prev => [...prev.filter(d => d.ip !== device.ip), device]);
    }
  };

  const sendAction = async (ip, endpoint) => {
    await fetch(`${API}/device/${ip}/${endpoint}`, { method: 'POST' });
  };

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white dark:bg-gray-900 dark:text-white">
      <div className="flex justify-between mb-4">
        <button onClick={toggleTheme} className="px-3 py-1 bg-gray-700 rounded">
          Toggle {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button onClick={scan} className="px-4 py-2 bg-blue-600 rounded">Scan Rede</button>
      </div>
      <div className="flex mb-4 space-x-2">
        <input
          className="flex-1 p-2 rounded text-black"
          placeholder="IP"
          value={manualIp}
          onChange={e => setManualIp(e.target.value)}
        />
        <button onClick={addManual} className="px-4 py-2 bg-green-600 rounded">Adicionar Manualmente</button>
      </div>
      <div className="space-y-4">
        {devices.map(device => (
          <div key={device.ip} className="p-4 bg-gray-800 rounded">
            <h3 className="font-bold flex justify-between">
              <span>{device.name} ({device.ip})</span>
              <span className={device.online ? 'text-green-400' : 'text-red-400'}>
                {device.online ? 'online' : 'offline'}
              </span>
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {device.functions.map(fn => (
                <button
                  key={fn.endpoint}
                  onClick={() => sendAction(device.ip, fn.endpoint)}
                  className="px-3 py-1 bg-blue-500 rounded"
                >
                  {fn.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
