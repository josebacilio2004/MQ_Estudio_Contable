import { io } from 'socket.io-client';

// Detección automática del host: si se accede desde celular (ej. 192.168.1.21),
// el socket apunta a la misma IP en el puerto 4100 sin desconfigurarse.
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:4100`;
};

// Generador o recuperador de identificador de dispositivo único
export const getDeviceId = () => {
  let id = localStorage.getItem('mql_device_id');
  if (!id) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const prefix = isMobile ? 'phone' : 'pc';
    id = `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('mql_device_id', id);
  }
  return id;
};

export const socket = io(getBackendUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});
