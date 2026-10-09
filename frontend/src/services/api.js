import { getDeviceId, joinUserRoom } from './socket';

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

const getAuthHeaders = () => {
  const token = localStorage.getItem('mql_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // --- GESTIÓN DE SESIÓN Y USUARIO ---
  getToken() {
    return localStorage.getItem('mql_auth_token');
  },

  getUser() {
    try {
      const u = localStorage.getItem('mql_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem('mql_auth_token', token);
    if (user) {
      localStorage.setItem('mql_user', JSON.stringify(user));
      joinUserRoom(user.id);
    }
  },

  logout() {
    localStorage.removeItem('mql_auth_token');
    localStorage.removeItem('mql_user');
  },

  async login(credentials) {
    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Usuario o contraseña incorrectos');
    }
    this.setSession(data.token, data.user);
    return data;
  },

  async register(userData) {
    const res = await fetch(`${getBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Error al crear cuenta');
    }
    this.setSession(data.token, data.user);
    return data;
  },

  async getMe() {
    const res = await fetch(`${getBaseUrl()}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Sesión expirada o no válida');
    const data = await res.json();
    return data.user;
  },

  // --- CRUD AGENDA Y KANBAN ---
  async getItems() {
    const res = await fetch(`${getBaseUrl()}/items`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      this.logout();
      throw new Error('401');
    }
    if (!res.ok) throw new Error('Error al cargar la agenda');
    return res.json();
  },

  async createItem(itemData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...itemData, deviceId })
    });
    if (!res.ok) throw new Error('Error al guardar registro');
    return res.json();
  },

  async toggleStatus(id, is_completed) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_completed, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    return res.json();
  },

  async moveKanban(id, kanban_status) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}/kanban`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ kanban_status, deviceId })
    });
    if (!res.ok) throw new Error('Error al mover elemento en kanban');
    return res.json();
  },

  async updateItem(id, itemData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...itemData, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar registro');
    return res.json();
  },

  async deleteItem(id) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/items/${id}?deviceId=${deviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar registro');
    return res.json();
  },

  // --- CRUD CLIENTES (RUC & SUNAT) ---
  async getClients() {
    const res = await fetch(`${getBaseUrl()}/clients`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      this.logout();
      throw new Error('401');
    }
    if (!res.ok) throw new Error('Error al obtener lista de clientes');
    return res.json();
  },

  async createClient(clientData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar cliente');
    return res.json();
  },

  async updateClientNotifications(id, data) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${id}/notifications`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar notificaciones');
    return res.json();
  },

  // --- SCRAPER ROBOT (SUNAT) ---
  async scanClient(id) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/scraper/check/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deviceId })
    });
    if (!res.ok) throw new Error('Error al ejecutar escáner robot en SUNAT');
    return res.json();
  },

  async scanAllClients() {
    const res = await fetch(`${getBaseUrl()}/scraper/check-all`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al iniciar escaneo masivo');
    return res.json();
  },

  // --- BANDEJA / BUZÓN ELECTRÓNICO SUNAT ---
  async getClientInbox(id) {
    const res = await fetch(`${getBaseUrl()}/clients/${id}/inbox`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al cargar la bandeja de notificaciones');
    return res.json();
  },

  async markInboxRead(clientId, msgId, is_read = true) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${clientId}/inbox/${msgId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_read, deviceId })
    });
    if (!res.ok) throw new Error('Error al actualizar estado del mensaje');
    return res.json();
  },

  async addInboxMessage(clientId, msgData) {
    const deviceId = getDeviceId();
    const res = await fetch(`${getBaseUrl()}/clients/${clientId}/inbox`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...msgData, deviceId })
    });
    if (!res.ok) throw new Error('Error al registrar notificación');
    return res.json();
  }
};
