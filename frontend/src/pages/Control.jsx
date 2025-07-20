import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Control() {
  const { ip } = useParams();
  const [state, setState] = useState(null);

  const sendAction = async action => {
    try {
      await axios.post(`/api/device/${ip}/${action}`);
      setState(action);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl mb-4">Dispositivo {ip}</h1>
      <div className="space-x-2">
        <button onClick={() => sendAction('on')} className="bg-green-600 p-2 rounded">ON</button>
        <button onClick={() => sendAction('off')} className="bg-red-600 p-2 rounded">OFF</button>
      </div>
      {state && <p className="mt-2">Estado: {state}</p>}
      <Link to="/" className="block mt-4 underline">Voltar</Link>
    </div>
  );
}

export default Control;
