/**
 * Coliving App - Módulo de Trabajos Pendientes
 * Lista todos los trabajos pendientes ingresados en cada habitación.
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;

  function init() {
    render();
    store.subscribe(() => {
      render();
    });
  }

  function render() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    const roomsWithTasks = store.getPendingTasksRooms();
    const countEl = document.getElementById('count-pending-tasks');
    if (countEl) countEl.textContent = roomsWithTasks.length;

    if (roomsWithTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${Coliving.icons.sparkle}</div>
          <h3>No hay trabajos pendientes</h3>
          <p>Todas las habitaciones están al día sin tareas de mantenimiento registradas.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="tasks-grid">';

    roomsWithTasks.forEach(room => {
      const isCentro = room.branch === 'centro';
      const branchClass = isCentro ? 'task-card-centro' : 'task-card-boulevares';
      const branchLabel = isCentro ? 'Centro' : 'Boulevares';

      html += `
        <div class="task-card ${branchClass}">
          <div class="task-header">
            <div class="task-room-badge">
              <span class="task-room-num">Hab ${room.number}</span>
              <span class="task-branch-pill">${branchLabel}</span>
            </div>
            ${room.occupants ? `<span class="task-occupant text-muted">Habita: ${room.occupants.split(/[,/;\n]+/)[0]}</span>` : '<span class="task-occupant text-muted">Desocupada</span>'}
          </div>

          <div class="task-body">
            <div class="task-description">${escapeHtml(room.pendingTasks)}</div>
            ${room.observations ? `<div class="task-obs-meta"><small>Obs: ${escapeHtml(room.observations)}</small></div>` : ''}
          </div>

          <div class="task-footer">
            <button class="btn btn-sm btn-outline" onclick="Coliving.rooms.openRoomModal('${room.id}')">
              ${Coliving.icons.edit} Ver Habitación
            </button>
            <button class="btn btn-sm btn-primary" onclick="Coliving.tasks.handleCompleteTask('${room.id}')">
              ${Coliving.icons.check} Marcar Listo
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function handleCompleteTask(roomId) {
    const room = store.getRoomById(roomId);
    if (!room) return;

    if (confirm(`¿Marcar como completado el trabajo de la Habitación ${room.number}?`)) {
      store.completePendingTask(roomId);
      Coliving.app.showToast(`Trabajo de Habitación ${room.number} completado.`);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  window.Coliving.tasks = {
    init,
    render,
    handleCompleteTask
  };
})();
