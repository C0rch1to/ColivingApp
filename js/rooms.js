/**
 * Coliving App - Módulo de Habitaciones
 * Muestra únicamente: número/letra y nombre de quien la habita (si son varios, solo el primero).
 * Colores: Verde para Centro, Naranja para Boulevares.
 * Filtro único: Sucursales. Búsqueda por número/letra o inquilino.
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;
  let currentSearch = '';

  function init() {
    setupEventListeners();
    render();
  }

  function setupEventListeners() {
    const searchInput = document.getElementById('room-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        render();
      });
    }

    store.subscribe(() => {
      render();
    });
  }

  function getFirstOccupant(occupantsStr) {
    if (!occupantsStr || !occupantsStr.trim()) return '';
    // Separar por coma, barra, punto y coma o salto de línea
    const parts = occupantsStr.split(/[,/;\n]+/);
    return parts[0].trim();
  }

  function getFilteredRooms() {
    let rooms = store.getRooms();

    if (currentSearch) {
      rooms = rooms.filter(r => {
        const numMatch = r.number.toLowerCase().includes(currentSearch);
        const occMatch = (r.occupants || '').toLowerCase().includes(currentSearch);
        return numMatch || occMatch;
      });
    }

    return rooms;
  }

  function render() {
    const container = document.getElementById('rooms-list-container');
    if (!container) return;

    const rooms = getFilteredRooms();

    if (rooms.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No se encontraron habitaciones.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="rooms-minimal-grid">';

    rooms.forEach(room => {
      const isCentro = room.branch === 'centro';
      const branchColorClass = isCentro ? 'room-centro' : 'room-boulevares';
      const firstOccupant = getFirstOccupant(room.occupants);

      html += `
        <div class="room-minimal-card ${branchColorClass}" onclick="Coliving.rooms.openRoomModal('${room.id}')">
          <div class="room-id">${room.number}</div>
          <div class="room-occupant-name">
            ${firstOccupant ? `<span class="occupant-text">${firstOccupant}</span>` : `<span class="occupant-empty">—</span>`}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // --- Modal de Habitación ---
  function openRoomModal(roomId) {
    const room = store.getRoomById(roomId);
    if (!room) return;

    const isCentro = room.branch === 'centro';
    const branchLabel = isCentro ? 'Centro' : 'Boulevares';

    const modalContent = `
      <div class="modal-header">
        <div>
          <span class="badge ${isCentro ? 'badge-centro' : 'badge-boulevares'}">Sucursal ${branchLabel}</span>
          <h2 class="modal-title mt-1">Habitación ${room.number}</h2>
        </div>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>

      <form id="form-edit-room" onsubmit="Coliving.rooms.handleSaveRoom(event, '${room.id}')">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="room-occupants">Nombre de la o las personas que la habitan</label>
            <textarea id="room-occupants" class="form-input" rows="2" placeholder="Ej: Juan Pérez, Carlos Gómez">${room.occupants || ''}</textarea>
            <p class="form-help">Si son varias personas, sepáralas con coma. En la tarjeta principal se mostrará la primera.</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="room-observations">Observaciones</label>
            <textarea id="room-observations" class="form-input" rows="3" placeholder="Notas sobre la habitación, llaves, acuerdos...">${room.observations || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="room-pending-tasks">Trabajos pendientes de esta habitación</label>
            <textarea id="room-pending-tasks" class="form-input" rows="3" placeholder="Ej: Arreglar persiana, cambiar foco, pintar zócalo...">${room.pendingTasks || ''}</textarea>
            <p class="form-help">Los trabajos aquí anotados aparecerán automáticamente en la sección de Trabajos Pendientes.</p>
          </div>
        </div>

        <div class="modal-footer modal-footer-room">
          <div class="modal-footer-left">
            <button type="button" class="btn btn-outline-danger btn-room-action btn-room-checkout" onclick="Coliving.rooms.handleCheckOut('${room.id}')" title="Desocupar habitación">
              <span class="btn-checkout-text">Check-out</span><span class="btn-extra-desocupar"> (Desocupar)</span>
            </button>
          </div>
          <div class="modal-footer-right">
            <button type="button" class="btn btn-secondary btn-room-action" onclick="Coliving.app.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-room-action">Guardar</button>
          </div>
        </div>
      </form>
    `;

    Coliving.app.openModal(modalContent);
  }

  function handleSaveRoom(e, roomId) {
    e.preventDefault();
    const occupants = document.getElementById('room-occupants').value;
    const observations = document.getElementById('room-observations').value;
    const pendingTasks = document.getElementById('room-pending-tasks').value;

    store.updateRoom(roomId, {
      occupants,
      observations,
      pendingTasks
    });

    Coliving.app.closeModal();
    Coliving.app.showToast('Habitación guardada.');
  }

  function handleCheckOut(roomId) {
    const room = store.getRoomById(roomId);
    if (!room) return;

    if (confirm(`¿Desocupar la Habitación ${room.number}? Se quitará el nombre de los habitantes actuales.`)) {
      store.checkOutRoom(roomId);
      Coliving.app.closeModal();
      Coliving.app.showToast(`Habitación ${room.number} desocupada.`);
    }
  }

  window.Coliving.rooms = {
    init,
    render,
    openRoomModal,
    handleSaveRoom,
    handleCheckOut
  };
})();
