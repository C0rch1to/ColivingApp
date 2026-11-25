/**
 * Coliving App - Módulo de Control de Medidores y Servicios
 * Seguimiento de Luz y Gas natural según registros de la planilla
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;

  function init() {
    setupEventListeners();
    render();
  }

  function setupEventListeners() {
    const btnNewReading = document.getElementById('btn-new-meter-reading');
    if (btnNewReading) {
      btnNewReading.addEventListener('click', () => openNewReadingModal());
    }

    store.subscribe(() => {
      render();
    });
  }

  function render() {
    const container = document.getElementById('meters-list-container');
    if (!container) return;

    const readings = store.getMeterReadings();

    if (readings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚡</div>
          <h3>Sin lecturas registradas</h3>
          <p>No se encontraron lecturas de medidores para la sucursal activa.</p>
          <button class="btn btn-primary" onclick="Coliving.meters.openNewReadingModal()">+ Nueva Lectura</button>
        </div>
      `;
      return;
    }

    let html = `
      <div class="meters-summary-grid">
        ${renderMeterCard('Medidor Luz General 1', 'kWh', '⚡')}
        ${renderMeterCard('Medidor Luz General 2', 'kWh', '⚡')}
        ${renderMeterCard('Medidor Gas Natural', 'm³', '🔥')}
      </div>

      <div class="table-card mt-4">
        <div class="card-header-flex">
          <h3 class="card-title">Historial de Lecturas Registradas</h3>
          <button class="btn btn-sm btn-primary" onclick="Coliving.meters.openNewReadingModal()">+ Cargar Nueva Lectura</button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio / Medidor</th>
                <th>Sucursal</th>
                <th class="text-right">Lectura Anterior</th>
                <th class="text-right">Lectura Actual</th>
                <th class="text-right">Consumo Registrado</th>
                <th>Notas</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
    `;

    readings.forEach(m => {
      html += `
        <tr>
          <td><strong>${m.date}</strong></td>
          <td><span class="font-bold">${m.meterType}</span></td>
          <td><span class="badge badge-outline">${m.branch === 'centro' ? 'Centro' : 'Boulevares'}</span></td>
          <td class="text-right font-mono">${Number(m.previousReading).toLocaleString('es-AR')} ${m.unit}</td>
          <td class="text-right font-mono font-bold">${Number(m.currentReading).toLocaleString('es-AR')} ${m.unit}</td>
          <td class="text-right font-mono text-primary font-bold">
            ${m.consumption > 0 ? `+${Number(m.consumption).toLocaleString('es-AR')} ${m.unit}` : '0 ' + m.unit}
          </td>
          <td class="text-muted text-sm">${m.notes || '—'}</td>
          <td class="text-right">
            <button class="btn-icon" title="Eliminar registro" onclick="Coliving.meters.confirmDeleteReading('${m.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function renderMeterCard(meterType, unit, icon) {
    const all = store.getMeterReadings();
    const latest = all.find(m => m.meterType.toLowerCase().includes(meterType.toLowerCase()));

    if (!latest) {
      return `
        <div class="kpi-card">
          <div class="kpi-icon">${icon}</div>
          <div class="kpi-info">
            <div class="kpi-label">${meterType}</div>
            <div class="kpi-val text-muted">Sin datos</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="kpi-card">
        <div class="kpi-icon">${icon}</div>
        <div class="kpi-info">
          <div class="kpi-label">${latest.meterType} (${latest.branch === 'centro' ? 'Centro' : 'Boulevares'})</div>
          <div class="kpi-val font-mono">${Number(latest.currentReading).toLocaleString('es-AR')} <span class="text-sm text-muted">${latest.unit}</span></div>
          <div class="text-xs text-muted mt-1">
            Último consumo: <strong class="text-primary">+${Number(latest.consumption).toLocaleString('es-AR')} ${latest.unit}</strong> • ${latest.date}
          </div>
        </div>
      </div>
    `;
  }

  function openNewReadingModal() {
    const activeBranch = store.getActiveBranch() === 'all' ? 'centro' : store.getActiveBranch();
    const today = new Date().toISOString().split('T')[0];

    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Nueva Lectura de Medidor</h2>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>

      <form id="form-meter-reading" onsubmit="Coliving.meters.handleSaveReading(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="mr-branch">Sucursal *</label>
              <select id="mr-branch" class="form-input" required onchange="Coliving.meters.handleBranchOrTypeChange()">
                <option value="centro" ${activeBranch === 'centro' ? 'selected' : ''}>Centro</option>
                <option value="boulevares" ${activeBranch === 'boulevares' ? 'selected' : ''}>Boulevares</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="mr-type">Tipo de Medidor *</label>
              <select id="mr-type" class="form-input" required onchange="Coliving.meters.handleBranchOrTypeChange()">
                <option value="Medidor Luz General 1">Medidor Luz General 1</option>
                <option value="Medidor Luz General 2">Medidor Luz General 2</option>
                <option value="Medidor Gas Natural">Medidor Gas Natural</option>
                <option value="Medidor Agua">Medidor Agua</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="mr-prev">Lectura Anterior</label>
              <input type="number" id="mr-prev" class="form-input font-mono" step="any" placeholder="0" oninput="Coliving.meters.calcDiff()">
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="mr-curr">Lectura Actual *</label>
              <input type="number" id="mr-curr" class="form-input font-mono font-bold" step="any" placeholder="0" required oninput="Coliving.meters.calcDiff()">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Consumo Resultante</label>
              <div id="mr-diff-display" class="font-bold text-lg text-primary p-2 bg-light rounded font-mono">0</div>
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="mr-unit">Unidad</label>
              <select id="mr-unit" class="form-input">
                <option value="kWh" selected>kWh (Electricidad)</option>
                <option value="m³">m³ (Gas Natural / Agua)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mr-date">Fecha de la Toma *</label>
            <input type="date" id="mr-date" class="form-input" value="${today}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="mr-notes">Notas / Observaciones</label>
            <input type="text" id="mr-notes" class="form-input" placeholder="Ej: Lectura tomada a fin de mes para liquidación...">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="Coliving.app.closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar Lectura</button>
        </div>
      </form>
    `;

    Coliving.app.openModal(modalContent);
    handleBranchOrTypeChange();
  }

  function handleBranchOrTypeChange() {
    const branchEl = document.getElementById('mr-branch');
    const typeEl = document.getElementById('mr-type');
    const prevEl = document.getElementById('mr-prev');
    const unitEl = document.getElementById('mr-unit');
    if (!branchEl || !typeEl || !prevEl) return;

    const branch = branchEl.value;
    const type = typeEl.value;

    if (type.includes('Gas') || type.includes('Agua')) {
      if (unitEl) unitEl.value = 'm³';
    } else {
      if (unitEl) unitEl.value = 'kWh';
    }

    // Buscar la última lectura de este medidor para prellenar la lectura anterior
    const all = store.getMeterReadings(branch);
    const last = all.find(m => m.meterType === type);
    if (last) {
      prevEl.value = last.currentReading;
    } else {
      prevEl.value = '';
    }

    calcDiff();
  }

  function calcDiff() {
    const prev = parseFloat(document.getElementById('mr-prev')?.value) || 0;
    const curr = parseFloat(document.getElementById('mr-curr')?.value) || 0;
    const unit = document.getElementById('mr-unit')?.value || 'kWh';
    const diff = Math.max(0, curr - prev);
    const display = document.getElementById('mr-diff-display');
    if (display) {
      display.textContent = `${diff.toLocaleString('es-AR')} ${unit}`;
    }
  }

  function handleSaveReading(e) {
    e.preventDefault();
    const branch = document.getElementById('mr-branch').value;
    const meterType = document.getElementById('mr-type').value;
    const previousReading = document.getElementById('mr-prev').value;
    const currentReading = document.getElementById('mr-curr').value;
    const unit = document.getElementById('mr-unit').value;
    const date = document.getElementById('mr-date').value;
    const notes = document.getElementById('mr-notes').value;

    store.addMeterReading({
      branch,
      meterType,
      previousReading,
      currentReading,
      unit,
      date,
      notes
    });

    Coliving.app.closeModal();
    Coliving.app.showToast('Lectura de medidor registrada.');
  }

  function confirmDeleteReading(id) {
    if (confirm('¿Eliminar esta lectura del historial?')) {
      store.deleteMeterReading(id);
      Coliving.app.showToast('Lectura eliminada.');
    }
  }

  window.Coliving.meters = {
    init,
    render,
    openNewReadingModal,
    handleBranchOrTypeChange,
    calcDiff,
    handleSaveReading,
    confirmDeleteReading
  };
})();
