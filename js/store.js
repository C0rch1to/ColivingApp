/**
 * Coliving App - Store & State Management
 * Datos simplificados: Habitaciones (Centro & Boulevares), Trabajos Pendientes y Planillas de Stock
 */

window.Coliving = window.Coliving || {};

(function() {
  const STORAGE_KEY = 'coliving_app_v2';

  // Ítems precargados de la planilla física original (planilla-stock.jpg)
  const DEFAULT_STOCK_ITEMS = [
    { name: 'Papel Higiénico 300 m x rollo', centro: '30 / 26', boulevares: '' },
    { name: 'Papel de cocina rollo', centro: '58 / 42', boulevares: '' },
    { name: 'Detergente litro', centro: '51 / 41', boulevares: '' },
    { name: 'Champú de manos litro', centro: '51 / 51', boulevares: '' },
    { name: 'Lavandina sobres', centro: '5 / 3', boulevares: '' },
    { name: 'Limpia pisos sobres', centro: '2 / 2', boulevares: '' },
    { name: 'Limpia vidrios litro', centro: '3.5 / 6', boulevares: '' },
    { name: 'Odex litros', centro: '7 / 6', boulevares: '' },
    { name: 'LAVANDINA GEL litros', centro: 'no hay', boulevares: '' },
    { name: 'Cif crema litros', centro: '-', boulevares: '' },
    { name: 'Trapo de piso', centro: '2 / 5', boulevares: '' },
    { name: 'Guantes personal', centro: '1 / 2', boulevares: '' },
    { name: 'Esponjas de acero unidades', centro: '41 / 14', boulevares: '' },
    { name: 'Esponja común unidades', centro: '3 / no hay', boulevares: '' },
    { name: 'Esponja verde Unidades', centro: '4x2 / 5x2', boulevares: '' },
    { name: 'Vallerinas unidades', centro: '9 / 1', boulevares: '' },
    { name: 'Bolsas residuos 45x60', centro: '30 / 120', boulevares: '' },
    { name: 'Bolsas residuos 60x90', centro: '10 / 120', boulevares: '' },
    { name: 'Escobillón con palo', centro: '2 / 3', boulevares: '' },
    { name: 'Escurridor con palo', centro: '2 / 3', boulevares: '' },
    { name: 'Dosificadores', centro: '2', boulevares: '' },
    { name: 'Cortina de baño', centro: '2 / 1', boulevares: '' },
    { name: 'Garrafas', centro: '-', boulevares: '' },
    { name: 'Medidor luz general 1', centro: '9219 / 29895', boulevares: '' },
    { name: 'Medidor luz general 2', centro: '10009', boulevares: '' },
    { name: 'Medidor gas natural', centro: '15703,465', boulevares: '' }
  ];

  // Generar las habitaciones exactas requeridas:
  // Centro: 2, 3, 4, 5, 6, 7, 8, a, b, c
  // Boulevares: 1 al 11 inclusive
  function generateInitialRooms() {
    const centroRooms = ['2', '3', '4', '5', '6', '7', '8', 'a', 'b', 'c'].map(num => ({
      id: `centro-${num}`,
      number: String(num),
      branch: 'centro',
      occupants: num === '2' ? 'Mateo Benítez' : num === '3' ? 'Camila Rossi, Lucía Pérez' : num === '5' ? 'Lucas Gómez' : '',
      observations: num === '2' ? 'Cama individual frente a la ventana' : '',
      pendingTasks: num === '4' ? 'Reparar canilla de baño' : ''
    }));

    const boulevaresRooms = Array.from({ length: 11 }, (_, i) => String(i + 1)).map(num => ({
      id: `boulevares-${num}`,
      number: String(num),
      branch: 'boulevares',
      occupants: num === '1' ? 'Sofía Martínez' : num === '3' ? 'Juan Ignacio Silva' : num === '7' ? 'Valentina Paz' : '',
      observations: num === '1' ? 'Habitación planta baja' : '',
      pendingTasks: num === '2' ? 'Pintar zócalo y revisar cerradura' : ''
    }));

    return [...centroRooms, ...boulevaresRooms];
  }

  function formatOnlyDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('es-AR');
    if (dateStr.includes(' ')) return dateStr.split(' ')[0];
    if (dateStr.includes('T')) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr.split('T')[0];
    }
    if (dateStr.includes('-') && dateStr.length === 10) {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  const INITIAL_DATA = {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    activeBranch: 'all', // 'all' | 'centro' | 'boulevares'
    rooms: generateInitialRooms(),
    stockCatalog: DEFAULT_STOCK_ITEMS.map(i => i.name),
    stockDraft: {
      isOpen: false,
      date: new Date().toLocaleDateString('es-AR'),
      items: JSON.parse(JSON.stringify(DEFAULT_STOCK_ITEMS))
    },
    savedStocks: [
      {
        id: 'stk-inicial',
        date: '20/02/2026',
        title: 'Cierre Mensual Febrero (Planilla Física)',
        items: JSON.parse(JSON.stringify(DEFAULT_STOCK_ITEMS))
      }
    ]
  };

  class Store {
    constructor() {
      this.data = this.load();
      this.listeners = [];
    }

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.version === '2.0' && Array.isArray(parsed.rooms)) {
            // Asegurar catálogo de ítems para futuras planillas
            if (!Array.isArray(parsed.stockCatalog)) {
              parsed.stockCatalog = DEFAULT_STOCK_ITEMS.map(i => i.name);
            }
            // Sanitizar fechas de stocks guardados para que solo tengan día, mes y año
            if (Array.isArray(parsed.savedStocks)) {
              parsed.savedStocks.forEach(s => {
                s.date = formatOnlyDate(s.date);
              });
            }
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error cargando store:', e);
      }
      this.saveToStorage(INITIAL_DATA);
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    saveToStorage(data) {
      data.lastUpdated = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Error guardando en LocalStorage:', e);
      }
    }

    notify() {
      this.saveToStorage(this.data);
      this.listeners.forEach(fn => fn(this.data));
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    getState() {
      return this.data;
    }

    getDefaultStockItems() {
      if (!Array.isArray(this.data.stockCatalog) || this.data.stockCatalog.length === 0) {
        this.data.stockCatalog = DEFAULT_STOCK_ITEMS.map(i => i.name);
      }
      return this.data.stockCatalog.map(name => ({
        name: name,
        centro: '',
        boulevares: ''
      }));
    }

    addCatalogItem(name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!Array.isArray(this.data.stockCatalog)) {
        this.data.stockCatalog = DEFAULT_STOCK_ITEMS.map(i => i.name);
      }
      if (!this.data.stockCatalog.includes(trimmed)) {
        this.data.stockCatalog.push(trimmed);
        this.saveToStorage(this.data);
      }
    }

    // --- Filtro de Sucursal ---
    setActiveBranch(branch) {
      this.data.activeBranch = branch;
      this.notify();
    }

    getActiveBranch() {
      return this.data.activeBranch || 'all';
    }

    // --- Habitaciones ---
    getRooms(branchFilter = null) {
      const branch = branchFilter || this.getActiveBranch();
      if (!branch || branch === 'all') {
        return this.data.rooms;
      }
      return this.data.rooms.filter(r => r.branch === branch);
    }

    getRoomById(id) {
      return this.data.rooms.find(r => r.id === id);
    }

    updateRoom(id, roomData) {
      const idx = this.data.rooms.findIndex(r => r.id === id);
      if (idx !== -1) {
        this.data.rooms[idx] = {
          ...this.data.rooms[idx],
          occupants: roomData.occupants !== undefined ? roomData.occupants.trim() : this.data.rooms[idx].occupants,
          observations: roomData.observations !== undefined ? roomData.observations.trim() : this.data.rooms[idx].observations,
          pendingTasks: roomData.pendingTasks !== undefined ? roomData.pendingTasks.trim() : this.data.rooms[idx].pendingTasks
        };
        this.notify();
        return this.data.rooms[idx];
      }
      return null;
    }

    checkOutRoom(id) {
      const room = this.getRoomById(id);
      if (room) {
        room.occupants = '';
        this.notify();
        return room;
      }
      return null;
    }

    // --- Trabajos Pendientes ---
    getPendingTasksRooms(branchFilter = null) {
      const branch = branchFilter || this.getActiveBranch();
      return this.data.rooms.filter(r => {
        const hasTask = Boolean(r.pendingTasks && r.pendingTasks.trim());
        const matchBranch = !branch || branch === 'all' || r.branch === branch;
        return hasTask && matchBranch;
      });
    }

    completePendingTask(roomId) {
      const room = this.getRoomById(roomId);
      if (room) {
        room.pendingTasks = '';
        this.notify();
        return room;
      }
      return null;
    }

    // --- Control de Stock ---
    getStockDraft() {
      if (!this.data.stockDraft) {
        this.data.stockDraft = {
          isOpen: false,
          date: new Date().toLocaleDateString('es-AR'),
          items: this.getDefaultStockItems()
        };
      }
      return this.data.stockDraft;
    }

    openStockDraft() {
      if (!this.data.stockDraft) {
        this.data.stockDraft = {
          isOpen: true,
          date: new Date().toLocaleDateString('es-AR'),
          items: this.getDefaultStockItems()
        };
      } else {
        this.data.stockDraft.isOpen = true;
        if (!Array.isArray(this.data.stockDraft.items) || this.data.stockDraft.items.length === 0) {
          this.data.stockDraft.items = this.getDefaultStockItems();
        }
      }
      this.notify();
      return this.data.stockDraft;
    }

    closeStockDraft() {
      if (this.data.stockDraft) {
        this.data.stockDraft.isOpen = false;
        this.notify();
      }
    }

    updateStockDraft(items, date) {
      this.data.stockDraft = {
        isOpen: true,
        date: date || this.data.stockDraft.date || new Date().toLocaleDateString('es-AR'),
        items: items
      };
      this.notify();
    }

    saveDraftSilently(items, date) {
      this.data.stockDraft = {
        isOpen: true,
        date: date || (this.data.stockDraft && this.data.stockDraft.date) || new Date().toLocaleDateString('es-AR'),
        items: items
      };
      this.saveToStorage(this.data);
    }

    saveCurrentStockDraft(title = '') {
      const draft = this.getStockDraft();
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR');

      // Asegurar que todos los ítems de esta planilla queden en el catálogo para futuras planillas
      draft.items.forEach(i => {
        if (i.name) this.addCatalogItem(i.name);
      });

      const newRecord = {
        id: 'stk-' + Date.now(),
        date: dateStr,
        title: title.trim() || `Control de Stock - ${dateStr}`,
        items: JSON.parse(JSON.stringify(draft.items))
      };

      if (!Array.isArray(this.data.savedStocks)) {
        this.data.savedStocks = [];
      }

      this.data.savedStocks.unshift(newRecord);

      // Limpiar borrador y cerrarlo con el catálogo actualizado
      this.data.stockDraft = {
        isOpen: false,
        date: dateStr,
        items: this.getDefaultStockItems()
      };

      this.notify();
      return newRecord;
    }

    getSavedStocks() {
      return this.data.savedStocks || [];
    }

    getSavedStockById(id) {
      return (this.data.savedStocks || []).find(s => s.id === id);
    }

    updateSavedStock(id, updatedItems, updatedTitle) {
      const idx = (this.data.savedStocks || []).findIndex(s => s.id === id);
      if (idx !== -1) {
        if (updatedItems) this.data.savedStocks[idx].items = updatedItems;
        if (updatedTitle) this.data.savedStocks[idx].title = updatedTitle;
        this.notify();
        return this.data.savedStocks[idx];
      }
      return null;
    }

    deleteSavedStock(id) {
      this.data.savedStocks = (this.data.savedStocks || []).filter(s => s.id !== id);
      this.notify();
    }

    loadSavedStockIntoDraft(id) {
      const record = this.getSavedStockById(id);
      if (record) {
        this.data.stockDraft = {
          isOpen: true,
          date: record.date,
          items: JSON.parse(JSON.stringify(record.items))
        };
        this.notify();
        return this.data.stockDraft;
      }
      return null;
    }

    // --- Exportar / Importar Respaldo ---
    exportBackupJSON() {
      const jsonStr = JSON.stringify(this.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `coliving-respaldo-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    importBackupJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || !Array.isArray(parsed.rooms)) {
          throw new Error('El archivo no tiene el formato correcto.');
        }
        this.data = parsed;
        this.notify();
        return { success: true };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    resetAll() {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.notify();
    }
  }

  window.Coliving.store = new Store();
})();
