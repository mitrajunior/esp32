import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function App() {
  const [devices, setDevices] = useState([]);
  const [manualIp, setManualIp] = useState('');

  const fetchDevices = async () => {
    try {
      const res = await axios.get('/api/devices');
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const addDevice = async () => {
    if (!manualIp) return;
    await axios.post('/api/add-device', { ip: manualIp });
    setManualIp('');
    fetchDevices();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl mb-4">IoT Controller</h1>
      <button onClick={fetchDevices} className="bg-blue-500 p-2 rounded mr-2">Forçar Scan da Rede</button>
      <input value={manualIp} onChange={e => setManualIp(e.target.value)} placeholder="Adicionar IP" className="text-black mr-2 p-1" />
      <button onClick={addDevice} className="bg-green-700 p-2 rounded">Adicionar</button>
      <ul className="mt-4">
        {devices.map(d => (
          <li key={d.ip} className="border-b border-gray-700 py-2 flex justify-between">
            <span>{d.name} ({d.ip}) - {d.online ? 'Online' : 'Offline'}</span>
            <Link to={`/device/${d.ip}`} className="bg-blue-700 p-1 rounded">Abrir Controlo</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
