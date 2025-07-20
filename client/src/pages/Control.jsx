import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function Control() {
  const { id } = useParams();
  const [state, setState] = useState('');
  const send = async cmd => {
    await axios.post(`/api/devices/${id}/command`, { command: cmd });
    setState(cmd);
  };
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h2 className="text-xl mb-2">Device {id}</h2>
      <div className="space-x-2 mb-2">
        <button onClick={() => send('on')} className="bg-green-600 px-2 py-1 rounded">ON</button>
        <button onClick={() => send('off')} className="bg-red-600 px-2 py-1 rounded">OFF</button>
      </div>
      {state && <p>State: {state}</p>}
      <Link to="/" className="underline mt-4 block">Back</Link>
    </div>
  );
}
