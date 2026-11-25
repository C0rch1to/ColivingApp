/**
 * Coliving App - Módulo de Documentos y Actas Oficiales
 * Generador de Actas de Entrega de Vajilla y Planillas Imprimibles
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;

  function init() {
    setupEventListeners();
  }

  function setupEventListeners() {
    // Si hay un contenedor de documentos interactivos
  }

  function openActaPrintView(roomId) {
    const room = store.getRoomById(roomId);
    if (!room) return;

    const t = room.tenant || {
      name: '_______________________',
      dni: '______________',
      vajillaFechaEntrega: new Date().toLocaleDateString('es-AR')
    };

    const branchLabel = room.branch === 'centro' ? 'Centro' : 'Boulevares';
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    const printContent = `
      <div class="print-acta-container" id="printable-acta">
        <div class="acta-header">
          <img src="Logo bicicleta.jpg" alt="Logo Coliving" class="acta-logo">
          <div class="acta-brand-text">Boulevares • Centro<br><small>COLIVING</small></div>
          <h1 class="acta-title">ACTA DE ENTREGA Y ACEPTACIÓN DE VAJILLA DE USO PERSONAL</h1>
        </div>

        <p class="acta-paragraph">
          En la ciudad de <strong>Concepción del Uruguay</strong>, en el mes de <strong>${currentMonth}</strong> de <strong>${currentYear}</strong>, quien firma al pie, en carácter de inquilino/a de <strong>Boulevares Centro Coliving (Sucursal ${branchLabel})</strong>, deja constancia de que recibe en este acto, en perfecto estado de uso y conservación, la siguiente vajilla de uso personal, que será utilizada durante la vigencia del contrato de locación y deberá ser devuelta al finalizar el mismo en iguales condiciones, salvo el desgaste normal por uso adecuado.
        </p>

        <div class="acta-items-box">
          <h3 class="acta-subtitle">Vajilla entregada:</h3>
          <ol class="acta-list">
            <li>Plato playo — 1 (una) unidad</li>
            <li>Plato hondo — 1 (una) unidad</li>
            <li>Plato de postre — 1 (una) unidad</li>
            <li>Taza con plato — 1 (una) unidad</li>
            <li>Vaso de vidrio — 1 (una) unidad</li>
            <li>Cuchillo — 1 (una) unidad</li>
            <li>Tenedor — 1 (una) unidad</li>
            <li>Cuchara sopera — 1 (una) unidad</li>
            <li>Cuchara de postre — 1 (una) unidad</li>
            <li>Bandeja — 1 (una) unidad</li>
          </ol>
        </div>

        <div class="acta-commitments">
          <h3 class="acta-subtitle">El/la inquilino/a se compromete a:</h3>
          <ul>
            <li>Utilizar la vajilla de forma adecuada y responsable.</li>
            <li>No cederla ni intercambiarla con otros residentes.</li>
            <li>Reponer o abonar el valor de reposición en caso de pérdida, rotura o daño imputable a un uso indebido.</li>
            <li>Devolver la totalidad de los elementos al momento de la finalización del contrato de locación.</li>
          </ul>
        </div>

        <div class="acta-signatures">
          <div class="acta-sig-line">
            <div class="sig-space"></div>
            <strong>Firma del/de la Inquilino/a</strong>
          </div>
          <div class="acta-fields">
            <div class="acta-field-row"><strong>Aclaración:</strong> ${t.name}</div>
            <div class="acta-field-row"><strong>DNI:</strong> ${t.dni}</div>
            <div class="acta-field-row"><strong>Habitación:</strong> Hab ${room.number} (${branchLabel})</div>
            <div class="acta-field-row"><strong>Fecha:</strong> ${t.vajillaFechaEntrega || now.toLocaleDateString('es-AR')}</div>
          </div>
        </div>
      </div>
    `;

    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Vista de Impresión — Acta de Vajilla</h2>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>
      <div class="modal-body print-preview-modal-body">
        <div class="print-actions-bar">
          <button class="btn btn-primary" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
          </button>
          <span class="text-sm text-muted">Optimizado para hoja A4 en formato vertical.</span>
        </div>
        ${printContent}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Coliving.app.closeModal()">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="window.print()">🖨️ Imprimir Acta</button>
      </div>
    `;

    Coliving.app.openModal(modalContent);
  }

  function openStockSheetPrintView() {
    const stock = store.getStock();
    const branch = store.getActiveBranch();
    const branchLabel = branch === 'all' ? 'Ambas Sucursales' : branch === 'centro' ? 'Sucursal Centro' : 'Sucursal Boulevares';
    const now = new Date();

    let rowsHtml = '';
    stock.forEach((item, index) => {
      rowsHtml += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.branch === 'centro' ? 'Centro' : 'Boulevares'}</td>
          <td class="text-center font-mono">${item.stockInicio} ${item.unit}</td>
          <td class="text-center font-mono">${item.agregado || 0}</td>
          <td class="text-center font-mono">${item.consumo || 0}</td>
          <td class="text-center font-mono font-bold">${item.stockActual}</td>
          <td class="sheet-blank-col"></td>
        </tr>
      `;
    });

    const printContent = `
      <div class="print-acta-container" id="printable-stock">
        <div class="acta-header">
          <img src="Logo bicicleta.jpg" alt="Logo Coliving" class="acta-logo">
          <div class="acta-brand-text">Boulevares • Centro<br><small>COLIVING</small></div>
          <h1 class="acta-title">PLANILLA MENSUAL DE CONTROL DE STOCK E INVENTARIO</h1>
          <div class="text-sm text-muted">${branchLabel} — Fecha: ${now.toLocaleDateString('es-AR')}</div>
        </div>

        <table class="data-table print-table mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Descripción del Artículo</th>
              <th>Sucursal</th>
              <th class="text-center">Stock Inicio</th>
              <th class="text-center">Agregado</th>
              <th class="text-center">Consumo</th>
              <th class="text-center">Total Sistema</th>
              <th class="text-center">Recuento Físico / Firma</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="acta-signatures mt-4">
          <div class="acta-sig-line">
            <div class="sig-space"></div>
            <strong>Firma Responsable de Control</strong>
          </div>
          <div class="acta-fields">
            <div class="acta-field-row"><strong>Fecha de Cierre:</strong> ____ / ____ / ________</div>
            <div class="acta-field-row"><strong>Sucursal auditada:</strong> ${branchLabel}</div>
            <div class="acta-field-row"><strong>Observaciones:</strong> ___________________________________</div>
          </div>
        </div>
      </div>
    `;

    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title">Planilla Imprimible de Stock</h2>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>
      <div class="modal-body print-preview-modal-body">
        <div class="print-actions-bar">
          <button class="btn btn-primary" onclick="window.print()">
            🖨️ Imprimir Planilla para Auditoría
          </button>
          <button class="btn btn-outline" onclick="Coliving.store.exportStockCSV()">
            📥 Descargar CSV / Excel
          </button>
        </div>
        ${printContent}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Coliving.app.closeModal()">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
      </div>
    `;

    Coliving.app.openModal(modalContent);
  }

  window.Coliving.documents = {
    init,
    openActaPrintView,
    openStockSheetPrintView
  };
})();
