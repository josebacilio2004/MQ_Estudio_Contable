import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import AgendaList from './components/AgendaList';
import KanbanBoard from './components/KanbanBoard';
import LinksDirectory from './components/LinksDirectory';
import ClientsView from './components/ClientsView';
import SidebarMenu from './components/SidebarMenu';
import AgendaModal from './components/AgendaModal';
import ClientModal from './components/ClientModal';
import DeviceShareModal from './components/DeviceShareModal';
import LoginView from './components/LoginView';
import { api } from './services/api';
import { socket, getDeviceId, joinUserRoom } from './services/socket';
import { offlineSync } from './services/offlineSync';
import { triggerHaptic, requestNotificationPermission, checkUpcomingEvents } from './utils/haptics';
import { Loader2, WifiOff, Layers, Tag } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(api.getUser());
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectedCount, setConnectedCount] = useState(1);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);

  // Soporte Offline y Notificaciones
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  // Vistas y Menú
  const [currentView, setCurrentView] = useState('agenda'); // 'agenda' | 'kanban' | 'clients' | 'links'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtros, Espacios y Búsqueda de Agenda
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSpace, setSelectedSpace] = useState('ALL'); // 'ALL' | categoría específica
  const [searchQuery, setSearchQuery] = useState('');

  // Modales de Agenda
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Modales de Clientes
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Modal Compartir Dispositivos
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const myDeviceId = getDeviceId();

  // 1. Cargar datos iniciales del usuario
  useEffect(() => {
    if (currentUser?.id) {
      joinUserRoom(currentUser.id);
      loadAllData();
      requestNotificationPermission();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Soporte Offline: Suscripción a eventos de conexión y cola
  useEffect(() => {
    const unsubscribe = offlineSync.subscribe(({ isOnline: online, pendingCount }) => {
      setIsOnline(online);
      setOfflinePendingCount(pendingCount);
      if (online && pendingCount > 0) {
        offlineSync.syncPendingQueue(api).then(() => loadAllData());
      }
    });
    return unsubscribe;
  }, []);

  // Notificaciones Web Push: Chequeo automático de eventos próximos cada 45 segundos
  useEffect(() => {
    if (currentUser && items.length > 0) {
      checkUpcomingEvents(items);
      const interval = setInterval(() => {
        checkUpcomingEvents(items);
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [currentUser, items]);

  const loadAllData = async () => {
    if (!api.getToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [agendaData, clientsData] = await Promise.all([
        api.getItems(),
        api.getClients()
      ]);
      setItems(agendaData);
      setClients(clientsData);
    } catch (err) {
      if (err.message === '401') {
        handleLogout();
      } else {
        console.error('Error al cargar datos:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de Autenticación
  const handleAuthSuccess = async ({ isRegister, credentials, userData }) => {
    let result;
    if (isRegister) {
      result = await api.register(userData);
    } else {
      result = await api.login(credentials);
    }
    setCurrentUser(result.user);
    joinUserRoom(result.user.id);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setItems([]);
    setClients([]);
  };

  // 2. Configurar eventos de WebSocket en Tiempo Real
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (currentUser?.id) {
        joinUserRoom(currentUser.id);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onClientsCount(count) {
      setConnectedCount(count);
    }

    // Eventos de Agenda
    function onItemCreated(payload) {
      const newItem = payload.item;
      setItems((prev) => {
        if (prev.some((item) => item.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
      if (payload.originDeviceId !== myDeviceId) {
        triggerRemoteHighlight(newItem.id);
      }
    }

    function onItemUpdated(payload) {
      const updated = payload.item;
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      if (payload.originDeviceId !== myDeviceId) {
        triggerRemoteHighlight(updated.id);
      }
    }

    function onItemDeleted(payload) {
      setItems((prev) => prev.filter((item) => item.id !== payload.id));
    }

    // Eventos de Clientes en Tiempo Real
    function onClientCreated(payload) {
      const newClient = payload.client;
      setClients((prev) => {
        if (prev.some((c) => c.id === newClient.id)) return prev;
        return [newClient, ...prev];
      });
    }

    function onClientUpdated(payload) {
      const updated = payload.client;
      setClients((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    }

    function onClientDeleted(payload) {
      setClients((prev) => prev.filter((c) => c.id !== payload.id));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('clients:count', onClientsCount);
    socket.on('item:created', onItemCreated);
    socket.on('item:updated', onItemUpdated);
    socket.on('item:deleted', onItemDeleted);
    socket.on('client:created', onClientCreated);
    socket.on('client:updated', onClientUpdated);
    socket.on('client:deleted', onClientDeleted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('clients:count', onClientsCount);
      socket.off('item:created', onItemCreated);
      socket.off('item:updated', onItemUpdated);
      socket.off('item:deleted', onItemDeleted);
      socket.off('client:created', onClientCreated);
      socket.off('client:updated', onClientUpdated);
      socket.off('client:deleted', onClientDeleted);
    };
  }, [myDeviceId, currentUser]);

  const triggerRemoteHighlight = (id) => {
    setRecentlyUpdatedId(id);
    setTimeout(() => {
      setRecentlyUpdatedId(null);
    }, 2000);
  };

  // --- ACCIONES DE AGENDA ---
  const handleToggleStatus = async (id, newCompletedState) => {
    const newKanbanStatus = newCompletedState ? 'done' : 'todo';
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_completed: newCompletedState, kanban_status: newKanbanStatus } : item
      )
    );

    try {
      socket.emit('item:toggle_status', {
        id,
        is_completed: newCompletedState,
        deviceId: myDeviceId,
        userId: currentUser?.id
      });
      await api.toggleStatus(id, newCompletedState);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !newCompletedState, kanban_status: !newCompletedState ? 'done' : 'todo' } : item
        )
      );
    }
  };

  const handleMoveKanban = async (id, newColumnId) => {
    const isDone = newColumnId === 'done';
    const previousItem = items.find((i) => i.id === id);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, kanban_status: newColumnId, is_completed: isDone }
          : item
      )
    );

    try {
      socket.emit('item:move_kanban', {
        id,
        kanban_status: newColumnId,
        deviceId: myDeviceId,
        userId: currentUser?.id
      });
      await api.moveKanban(id, newColumnId);
    } catch (err) {
      console.error('Error al mover en Kanban:', err);
      if (previousItem) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? previousItem : item))
        );
      }
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, formData);
      } else {
        await api.createItem(formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error al guardar registro:', err);
      alert('Error al guardar el registro en la agenda');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
      await api.deleteItem(id);
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se pudo eliminar el registro');
    }
  };

  // --- ACCIONES DE CLIENTES ---
  const handleSaveClient = async (formData) => {
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, formData);
      } else {
        await api.createClient(formData);
      }
      setIsClientModalOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      alert(err.message || 'Error al guardar el cliente.');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente? Se borrarán sus accesos y datos.')) return;
    try {
      await api.deleteClient(id);
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      alert('No se pudo eliminar el cliente.');
    }
  };

  const handleClearNotification = async (id) => {
    try {
      await api.updateClientNotifications(id, {
        notificaciones_pendientes: 0,
        origen_notificacion: null,
        detalle_notificacion: null
      });
    } catch (err) {
      console.error('Error al resolver notificación:', err);
    }
  };

  // Si no hay usuario autenticado, renderizar la pantalla de Login / Registro
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleAuthSuccess} />;
  }

  // Métricas calculadas para el menú
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.is_completed || i.kanban_status === 'done').length;
  const pendingItems = totalItems - completedItems;
  const linkItemsCount = items.filter((i) => !!i.external_url).length;
  const totalClientsCount = clients.length;
  const clientAlertsCount = clients.filter((c) => (c.notificaciones_pendientes || 0) > 0).length;

  // Lista dinámica de Espacios / Categorías
  const availableSpaces = Array.from(new Set([
    'General',
    'SUNAT / Tributario',
    'Reuniones Clientes',
    'Trading / Finanzas',
    'Desarrollo / TI',
    'Auditoría',
    ...items.map((i) => i.category).filter(Boolean)
  ]));

  // Filtrado de elementos para vista de lista de agenda y kanban
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'pending' && (item.is_completed || item.kanban_status === 'done')) return false;
    if (activeFilter === 'completed' && !(item.is_completed || item.kanban_status === 'done')) return false;
    if (selectedSpace !== 'ALL' && item.category !== selectedSpace) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchUrl = item.external_url?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchUrl || matchCat;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-slate-700 selection:text-white">
      {/* Banner de Modo Offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Modo Offline: Sin conexión a internet. Los cambios se guardarán localmente ({offlinePendingCount} pendientes de sincronizar).</span>
          </div>
          <span className="text-[10px] bg-amber-700 px-2 py-0.5 rounded-full">Local</span>
        </div>
      )}

      {/* Menú Lateral y Barra de Navegación Móvil */}
      <SidebarMenu
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        connectedCount={connectedCount}
        itemsCount={{
          total: totalItems,
          pending: pendingItems,
          completed: completedItems,
          links: linkItemsCount
        }}
        clientsCount={{
          total: totalClientsCount,
          alerts: clientAlertsCount
        }}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Contenedor Principal (con offset para sidebar en desktop y padding inferior para móvil) */}
      <div className={`flex-1 flex flex-col min-w-0 md:pl-72 ${!isOnline ? 'pt-8' : ''}`}>
        {/* Cabecera */}
        <Header
          isConnected={isConnected}
          connectedCount={connectedCount}
          user={currentUser}
          onLogout={handleLogout}
          onOpenCreateModal={() => {
            if (currentView === 'clients') {
              setEditingClient(null);
              setIsClientModalOpen(true);
            } else {
              setEditingItem(null);
              setIsModalOpen(true);
            }
          }}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Contenido Principal */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-8">
          {/* Selector de Espacios / Proyectos para vistas de Agenda y Kanban */}
          {(currentView === 'agenda' || currentView === 'kanban') && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedSpace('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-sm ${
                  selectedSpace === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todos los Espacios</span>
              </button>
              {availableSpaces.map((space) => (
                <button
                  key={space}
                  onClick={() => setSelectedSpace(space)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedSpace === space
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Tag className="w-3 h-3 text-blue-400" />
                  <span>{space}</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              <p className="text-xs text-slate-400 font-medium">Sincronizando información...</p>
            </div>
          ) : (
            <>
              {/* Vista 1: Agenda Tradicional */}
              {currentView === 'agenda' && (
                <>
                  <StatsBar
                    items={items}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />

                  <AgendaList
                    items={filteredItems}
                    recentlyUpdatedId={recentlyUpdatedId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteItem}
                    onOpenCreateModal={() => {
                      setEditingItem(null);
                      setIsModalOpen(true);
                    }}
                  />
                </>
              )}

              {/* Vista 2: Kanban */}
              {currentView === 'kanban' && (
                <KanbanBoard
                  items={filteredItems}
                  recentlyUpdatedId={recentlyUpdatedId}
                  onMoveKanban={handleMoveKanban}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteItem}
                  onOpenCreateModal={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                />
              )}

              {/* Vista 3: Gestión de Clientes RUC */}
              {currentView === 'clients' && (
                <ClientsView
                  clients={clients}
                  onOpenCreateClient={() => {
                    setEditingClient(null);
                    setIsClientModalOpen(true);
                  }}
                  onEditClient={(client) => {
                    setEditingClient(client);
                    setIsClientModalOpen(true);
                  }}
                  onDeleteClient={handleDeleteClient}
                  onClearNotification={handleClearNotification}
                />
              )}

              {/* Vista 4: Directorio de Enlaces */}
              {currentView === 'links' && (
                <LinksDirectory
                  items={items}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-3.5 px-6 text-center text-xs text-slate-500 hidden md:block">
          M|Q Estudio Contable • Gestión Tributaria, Clientes RUC y Sincronización Multi-dispositivo en Tiempo Real
        </footer>
      </div>

      {/* Modales de Agenda */}
      <AgendaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Modales de Clientes */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      {/* Modal Conectar Celular */}
      <DeviceShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
