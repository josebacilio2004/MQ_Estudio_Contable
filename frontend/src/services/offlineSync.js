// Sistema de soporte Offline y cola de sincronización
// MQ Estudio Contable - Agenda MQL

const QUEUE_STORAGE_KEY = 'mql_offline_mutation_queue';

class OfflineSyncManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStateChange(true));
      window.addEventListener('offline', () => this.handleOnlineStateChange(false));
    }
  }

  handleOnlineStateChange(online) {
    this.isOnline = online;
    this.notifyListeners();

    if (online) {
      console.log('📡 [OfflineSync] Conexión recuperada. Procesando cola de cambios pendientes...');
      this.syncPendingQueue();
    } else {
      console.warn('📴 [OfflineSync] Conexión perdida. Activando modo local offline.');
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({ isOnline: this.isOnline, pendingCount: this.getQueue().length });
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const queue = this.getQueue();
    this.listeners.forEach((cb) => {
      try {
        cb({ isOnline: this.isOnline, pendingCount: queue.length });
      } catch (e) {
        console.error(e);
      }
    });
  }

  getQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error('Error guardando cola offline:', e);
    }
  }

  enqueue(action) {
    const queue = this.getQueue();
    queue.push({
      ...action,
      queuedAt: Date.now()
    });
    this.saveQueue(queue);
    console.log(`📦 [OfflineSync] Acción encolada (${action.type}). Pendientes: ${queue.length}`);
  }

  async syncPendingQueue(apiInstance) {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const remaining = [];

    for (const item of queue) {
      try {
        // Enviar según el tipo de acción
        if (apiInstance) {
          switch (item.type) {
            case 'CREATE_ITEM':
              await apiInstance.createItem(item.payload);
              break;
            case 'UPDATE_ITEM':
              await apiInstance.updateItem(item.id, item.payload);
              break;
            case 'TOGGLE_STATUS':
              await apiInstance.toggleStatus(item.id, item.payload.is_completed);
              break;
            case 'MOVE_KANBAN':
              await apiInstance.moveKanban(item.id, item.payload.kanban_status);
              break;
            case 'DELETE_ITEM':
              await apiInstance.deleteItem(item.id);
              break;
            default:
              console.warn('Acción desconocida en cola:', item.type);
          }
        }
      } catch (err) {
        console.error(`Error procesando acción ${item.type}:`, err);
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);

    if (remaining.length === 0) {
      console.log('✅ [OfflineSync] Todos los cambios sincronizados con la base de datos.');
    }
  }
}

export const offlineSync = new OfflineSyncManager();
