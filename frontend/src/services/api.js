import { getDeviceId } from './socket';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  const hostname = window.location.hostname || 'localhost';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return `http://${hostname}:4100/api`;
  }
  return 'https://agenda-mql-backend.onrender.com/api';
};

export const api = {
  async getItems() {
    const res = await fetch(`${getBaseUrl()}/items`);
    if (!res.ok) throw new Error('Error al cargar la agenda');
    return res.json();
  },

  async createItem(itemData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemData, deviceId })
    });
    if (!res.ok) throw new Error('Error al guardar registro');
    return res.json();
  },

  async toggleStatus(id, is_completed) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    return res.json();
  },

  async moveKanban(id, kanban_status) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}/kanban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kanban_status, deviceId })
    });
    if (!res.ok) throw new Error('Error al mover elemento en kanban');
    return res.json();
  },

  async updateItem(id, itemData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemData, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar registro');
    return res.json();
  },

  async deleteItem(id) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}?deviceId=${deviceId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar registro');
    return res.json();
  },

  // --- MÉTODOS DE CLIENTES (RUC & SUNAT) ---
  async getClients() {
    const res = await fetch(`${getBaseUrl()}/clients`);
    if (!res.ok) throw new Error('Error al obtener lista de clientes');
    return res.json();
  },

  async createClient(clientData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...clientData, deviceId })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al registrar cliente');
    }
    return res.json();
  },

  async updateClient(id, clientData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...clientData, deviceId })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al actualizar cliente');
    }
    return res.json();
  },

  async deleteClient(id) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${id}?deviceId=${deviceId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar cliente');
    return res.json();
  },

  async updateClientNotifications(id, data) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${id}/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar notificaciones');
    return res.json();
  },

  // --- MÉTODOS DEL ROBOT SCRAPER ---
  async scanClient(id) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/scraper/check/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    if (!res.ok) throw new Error('Error al ejecutar escáner robot en SUNAT');
    return res.json();
  },

  async scanAllClients() {
    const res = await fetch(`${getBaseUrl()}/scraper/check-all`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error al iniciar escaneo masivo');
    return res.json();
  }
};
