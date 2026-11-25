/**
 * Coliving App - Módulo de Stock Simplificado
 * Planilla de 3 columnas: Elemento | Centro | Boulevares
 * Guardado de borradores en curso, guardado histórico con fecha, descarga (PDF, JPG, DOCX) y copiar texto.
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;
  let activeEditingSavedId = null; // Si se está editando un stock histórico específico

  function init() {
    render();
    store.subscribe(() => {
      // Si el usuario está escribiendo activamente en un campo de texto de la tabla, no reconstruir el DOM
      if (document.activeElement && document.activeElement.classList.contains('stock-compact-input')) {
        return;
      }
      render();
    });
  }

  function render() {
    const container = document.getElementById('stock-view-container');
    if (!container) return;

    const draft = store.getStockDraft();
    const savedList = store.getSavedStocks();

    let html = `
      <!-- Cabecera de Stock -->
      <div class="stock-top-controls">
        <div class="stock-actions-bar">
          ${draft.isOpen ? `
            <span class="badge badge-warning flex-align-gap">${Coliving.icons.docx} Planilla en curso desplegada</span>
          ` : `
            <button class="btn btn-primary btn-lg" onclick="Coliving.stock.handleOpenNewDraft()">
              + Crear Nuevo Stock
            </button>
          `}
          <button class="btn btn-secondary flex-align-gap" onclick="Coliving.stock.scrollToSavedStocks()">
            ${Coliving.icons.folder} Consultar Stocks Anteriores (${savedList.length})
          </button>
        </div>
      </div>
    `;

    // Si la planilla está abierta (o a medio completar), se muestra la planilla
    if (draft.isOpen) {
      html += renderPlanilla(draft);
    }

    // Sección dinámica de stocks anteriores guardados
    html += renderSavedStocksSection(savedList);

    container.innerHTML = html;
  }

  function renderPlanilla(draft) {
    const isEditingHistoric = Boolean(activeEditingSavedId);

    let rowsHtml = '';
    draft.items.forEach((item, index) => {
      rowsHtml += `
        <tr>
          <td class="col-element">
            <span class="font-bold text-main">${escapeHtml(item.name)}</span>
          </td>
          <td class="col-branch col-centro">
            <input type="text"
                   class="stock-compact-input"
                   placeholder="Centro"
                   value="${escapeHtml(item.centro || '')}"
                   oninput="Coliving.stock.handleItemInputChange(${index}, 'centro', this.value)">
          </td>
          <td class="col-branch col-boulevares">
            <input type="text"
                   class="stock-compact-input"
                   placeholder="Boulevares"
                   value="${escapeHtml(item.boulevares || '')}"
                   oninput="Coliving.stock.handleItemInputChange(${index}, 'boulevares', this.value)">
          </td>
        </tr>
      `;
    });

    return `
      <div class="planilla-wrapper mt-3">
        <div class="planilla-header-card">
          <div class="planilla-title-box">
            <h3 class="planilla-title flex-align-gap">
              ${isEditingHistoric ? `${Coliving.icons.edit} Editando Stock Histórico` : `${Coliving.icons.clipboard} Planilla de Control de Stock`}
            </h3>
            <span class="text-xs text-muted">Centro siempre a la izquierda • Los cambios se guardan automáticamente</span>
          </div>
          <div class="planilla-header-actions">
            <button class="btn btn-outline" onclick="Coliving.stock.handleAddNewRow()">
              + Agregar Elemento
            </button>
            <button class="btn btn-primary" onclick="Coliving.stock.handleSaveStock()">
              ${Coliving.icons.save} Guardar Stock
            </button>
            <button class="btn btn-outline-danger" onclick="Coliving.stock.handleClosePlanilla()">
              ${Coliving.icons.close} Cerrar
            </button>
          </div>
        </div>

        <div class="table-responsive planilla-table-container">
          <table class="data-table simple-stock-table">
            <thead>
              <tr>
                <th class="th-element">Elemento</th>
                <th class="th-centro text-center">Centro</th>
                <th class="th-boulevares text-center">Boulevares</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="planilla-footer-bar">
          <button class="btn btn-sm btn-outline" onclick="Coliving.stock.handleAddNewRow()">+ Agregar otro elemento</button>
          <div class="btn-group-actions">
            <button class="btn btn-secondary" onclick="Coliving.stock.handleClosePlanilla()">Cerrar Planilla</button>
            <button class="btn btn-primary" onclick="Coliving.stock.handleSaveStock()">${Coliving.icons.save} Guardar Stock</button>
          </div>
        </div>
      </div>
    `;
  }

  function formatOnlyDate(dateStr) {
    if (!dateStr) return '';
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

  function renderSavedStocksSection(savedList) {
    let listHtml = '';

    if (savedList.length === 0) {
      listHtml = `
        <div class="empty-state mt-2">
          <p class="text-muted">No hay stocks guardados previamente.</p>
        </div>
      `;
    } else {
      listHtml = '<div class="saved-stocks-grid mt-3">';
      savedList.forEach(stock => {
        const displayDate = formatOnlyDate(stock.date);
        // La card entera es un botón que abre la vista detallada
        listHtml += `
          <div class="saved-stock-card clickable-card" onclick="Coliving.stock.viewSavedStockModal('${stock.id}')" title="Clic para ver detalle y opciones de descarga">
            <div class="saved-stock-header">
              <div class="saved-stock-date font-bold flex-align-gap">${Coliving.icons.calendar} ${displayDate}</div>
              <span class="saved-stock-badge">${stock.items.length} elementos</span>
            </div>
            ${stock.title ? `<div class="saved-stock-title text-sm mt-1">${escapeHtml(stock.title)}</div>` : ''}
            <div class="saved-stock-hint text-xs text-muted mt-2">Clic para abrir y exportar</div>
          </div>
        `;
      });
      listHtml += '</div>';
    }

    return `
      <section id="section-saved-stocks" class="saved-stocks-section mt-5">
        <div class="section-header">
          <h3 class="section-title flex-align-gap">${Coliving.icons.folder} Stocks Anteriores Guardados</h3>
          <span class="text-xs text-muted">Historial identificado por fecha • Toca cualquier tarjeta para consultar</span>
        </div>
        ${listHtml}
      </section>
    `;
  }

  // --- Handlers de Planilla (Sin perder foco de inputs) ---
  function handleOpenNewDraft() {
    activeEditingSavedId = null;
    store.openStockDraft();
  }

  function handleItemInputChange(index, branch, value) {
    const draft = store.getStockDraft();
    if (draft.items[index]) {
      draft.items[index][branch] = value;
      // Guardado silencioso en localStorage: NUNCA reconstruye el DOM ni quita el foco
      store.saveDraftSilently(draft.items, draft.date);
    }
  }

  function handleAddNewRow() {
    const name = prompt('Nombre del nuevo elemento:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();

    const draft = store.getStockDraft();
    draft.items.push({
      name: trimmed,
      centro: '',
      boulevares: ''
    });

    // Guardar también en el catálogo permanente para todas las futuras planillas
    store.addCatalogItem(trimmed);
    store.updateStockDraft(draft.items, draft.date);
    Coliving.app.showToast(`"${trimmed}" agregado a la planilla actual y futuras.`);
  }

  function handleSaveStock() {
    const draft = store.getStockDraft();
    const titlePrompt = prompt('Nombre o título para este control de stock (opcional):', `Control ${draft.date}`);
    if (titlePrompt === null) return; // cancelado

    if (activeEditingSavedId) {
      store.updateSavedStock(activeEditingSavedId, draft.items, titlePrompt || `Control ${draft.date}`);
      activeEditingSavedId = null;
      store.closeStockDraft();
      Coliving.app.showToast('Stock histórico actualizado correctamente.');
    } else {
      store.saveCurrentStockDraft(titlePrompt);
      Coliving.app.showToast('Stock guardado con éxito.');
    }
  }

  function handleClosePlanilla() {
    if (confirm('¿Deseas cerrar la planilla? Los datos ingresados permanecerán guardados como borrador.')) {
      activeEditingSavedId = null;
      store.closeStockDraft();
    }
  }

  function scrollToSavedStocks() {
    const el = document.getElementById('section-saved-stocks');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // --- Modal de Ver Stock Guardado con todas las opciones de descarga ---
  function viewSavedStockModal(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    const displayDate = formatOnlyDate(stock.date);

    let rowsHtml = '';
    stock.items.forEach(item => {
      rowsHtml += `
        <tr>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td class="text-center bg-centro-subtle">${escapeHtml(item.centro || '—')}</td>
          <td class="text-center bg-boulevares-subtle">${escapeHtml(item.boulevares || '—')}</td>
        </tr>
      `;
    });

    const modalContent = `
      <div class="modal-header">
        <div>
          <span class="badge badge-secondary flex-align-gap">${Coliving.icons.calendar} ${displayDate}</span>
          <h2 class="modal-title mt-1">${escapeHtml(stock.title || 'Control de Stock')}</h2>
        </div>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>

      <div class="modal-body" id="modal-stock-printable">
        <div class="table-responsive">
          <table class="data-table simple-stock-table">
            <thead>
              <tr>
                <th>Elemento</th>
                <th class="text-center th-centro">Centro</th>
                <th class="text-center th-boulevares">Boulevares</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <div class="modal-footer-left">
          <button class="btn btn-outline" onclick="Coliving.stock.copyStockAsText('${stock.id}')" title="Copiar como texto sin signos">
            ${Coliving.icons.clipboard} Copiar Texto
          </button>
          <button class="btn btn-outline" onclick="Coliving.stock.downloadStockAsPDF('${stock.id}')">
            ${Coliving.icons.pdf} Descargar PDF
          </button>
          <button class="btn btn-outline" onclick="Coliving.stock.downloadStockAsJPG('${stock.id}')">
            ${Coliving.icons.image} Descargar JPG
          </button>
          <button class="btn btn-outline" onclick="Coliving.stock.downloadStockAsDOCX('${stock.id}')">
            ${Coliving.icons.docx} Descargar DOCX
          </button>
        </div>

        <div class="modal-footer-right">
          <button class="btn btn-outline-danger" onclick="Coliving.stock.deleteSavedStockConfirm('${stock.id}')" title="Eliminar este registro">
            ${Coliving.icons.trash} Eliminar
          </button>
          <button class="btn btn-primary" onclick="Coliving.app.closeModal(); Coliving.stock.editSavedStock('${stock.id}')">
            ${Coliving.icons.edit} Editar
          </button>
          <button class="btn btn-secondary" onclick="Coliving.app.closeModal()">Cerrar</button>
        </div>
      </div>
    `;

    Coliving.app.openModal(modalContent);
  }

  function editSavedStock(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    activeEditingSavedId = stock.id;
    store.loadSavedStockIntoDraft(stock.id);
    Coliving.app.showToast(`Cargado para editar: ${stock.date}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- 1. Copiar como texto al portapapeles (SOLO letras y números, sin signos) ---
  function cleanAlphaNumericOnly(text) {
    if (!text) return '';
    // Mantiene letras (incluyendo acentos del español áéíóúÁÉÍÓÚñÑ), números y espacios simples
    return String(text)
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function copyStockAsText(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    const lines = stock.items.map(item => {
      const el = cleanAlphaNumericOnly(item.name);
      const c = cleanAlphaNumericOnly(item.centro || '0');
      const b = cleanAlphaNumericOnly(item.boulevares || '0');
      return `${el} Centro ${c} Boulevares ${b}`;
    }).filter(line => line.length > 0).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lines).then(() => {
        Coliving.app.showToast('Texto copiado (solo letras y números sin signos).');
      }).catch(() => {
        fallbackCopyText(lines);
      });
    } else {
      fallbackCopyText(lines);
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      Coliving.app.showToast('Texto copiado al portapapeles.');
    } catch (e) {
      prompt('Copia el texto manualmente:', text);
    }
    document.body.removeChild(textarea);
  }

  // --- 2. Descargar como JPG (Generación en Canvas) ---
  function downloadStockAsJPG(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    const displayDate = formatOnlyDate(stock.date);
    const dpr = 2; // Alta resolución
    const width = 800;
    const rowHeight = 32;
    const headerHeight = 120;
    const height = headerHeight + (stock.items.length * rowHeight) + 40;

    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Título
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('COLIVING — CONTROL DE STOCK', 30, 42);

    // Subtítulo con fecha (solo día, mes y año)
    ctx.fillStyle = '#52525b';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`Fecha: ${displayDate}   •   ${stock.title || ''}`, 30, 68);

    // Encabezados de columnas
    const colY = 90;
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(30, colY, 740, 32);

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('ELEMENTO', 45, colY + 21);

    ctx.fillStyle = '#15803d';
    ctx.fillText('CENTRO', 450, colY + 21);

    ctx.fillStyle = '#c2410c';
    ctx.fillText('BOULEVARES', 610, colY + 21);

    // Filas
    let y = colY + 32;
    stock.items.forEach((item, index) => {
      // Línea de fondo alternada
      if (index % 2 === 1) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(30, y, 740, rowHeight);
      }

      // Línea divisoria
      ctx.strokeStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.moveTo(30, y + rowHeight);
      ctx.lineTo(770, y + rowHeight);
      ctx.stroke();

      // Texto
      ctx.fillStyle = '#18181b';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(item.name.substring(0, 48), 45, y + 21);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(item.centro || '—', 450, y + 21);

      ctx.fillStyle = '#ea580c';
      ctx.fillText(item.boulevares || '—', 610, y + 21);

      y += rowHeight;
    });

    // Descargar imagen
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeDate = (stock.date || 'stock').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = url;
      a.download = `stock-${safeDate}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Coliving.app.showToast('Imagen JPG descargada.');
    }, 'image/jpeg', 0.95);
  }

  // --- 3. Descargar como DOCX (Formato compatible Word) ---
  function downloadStockAsDOCX(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    const displayDate = formatOnlyDate(stock.date);

    let rowsHtml = '';
    stock.items.forEach((item, i) => {
      const bg = i % 2 === 1 ? 'background-color: #fcfcfc;' : '';
      rowsHtml += `
        <tr style="${bg}">
          <td style="border: 1px solid #d4d4d8; padding: 6px 10px;">${escapeHtml(item.name)}</td>
          <td style="border: 1px solid #d4d4d8; padding: 6px 10px; text-align: center; color: #15803d; font-weight: bold;">${escapeHtml(item.centro || '—')}</td>
          <td style="border: 1px solid #d4d4d8; padding: 6px 10px; text-align: center; color: #c2410c; font-weight: bold;">${escapeHtml(item.boulevares || '—')}</td>
        </tr>
      `;
    });

    const docxContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Control de Stock - Coliving</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #18181b; }
          h2 { color: #09090b; margin-bottom: 4px; }
          p { margin-top: 0; color: #52525b; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; text-align: left; }
        </style>
      </head>
      <body>
        <h2>COLIVING — CONTROL DE STOCK</h2>
        <p><strong>Fecha:</strong> ${displayDate} | <strong>Título:</strong> ${escapeHtml(stock.title || 'Control')}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Elemento</th>
              <th style="width: 25%; text-align: center; color: #15803d;">Centro</th>
              <th style="width: 25%; text-align: center; color: #c2410c;">Boulevares</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + docxContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = displayDate.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `stock-${safeDate}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Coliving.app.showToast('Documento DOCX descargado.');
  }

  // --- 4. Descargar / Imprimir como PDF ---
  function downloadStockAsPDF(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    const displayDate = formatOnlyDate(stock.date);

    let rowsHtml = '';
    stock.items.forEach((item, idx) => {
      const bg = idx % 2 === 1 ? 'style="background: #fafafa;"' : '';
      rowsHtml += `
        <tr ${bg}>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e4e4e7;"><strong>${escapeHtml(item.name)}</strong></td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold; color: #15803d;">${escapeHtml(item.centro || '—')}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold; color: #ea580c;">${escapeHtml(item.boulevares || '—')}</td>
        </tr>
      `;
    });

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Control de Stock - ${displayDate}</title>
        <style>
          @page { size: A4 portrait; margin: 1.5cm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #09090b; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
          .header p { margin: 4px 0 0; font-size: 13px; color: #52525b; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f4f4f5; padding: 8px 10px; border-bottom: 2px solid #000; text-align: left; }
          .th-c { text-align: center; color: #15803d; }
          .th-b { text-align: center; color: #c2410c; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COLIVING — CONTROL DE STOCK</h1>
          <p>Fecha: ${displayDate}   •   ${escapeHtml(stock.title || '')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Elemento</th>
              <th class="th-c" style="width: 25%;">Centro</th>
              <th class="th-b" style="width: 25%;">Boulevares</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  function deleteSavedStockConfirm(stockId) {
    const stock = store.getSavedStockById(stockId);
    if (!stock) return;

    if (confirm(`¿Eliminar el registro de stock con fecha ${stock.date}?`)) {
      store.deleteSavedStock(stockId);
      Coliving.app.closeModal();
      Coliving.app.showToast('Registro eliminado.');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.Coliving.stock = {
    init,
    render,
    handleOpenNewDraft,
    handleItemInputChange,
    handleAddNewRow,
    handleSaveStock,
    handleClosePlanilla,
    scrollToSavedStocks,
    viewSavedStockModal,
    editSavedStock,
    copyStockAsText,
    downloadStockAsJPG,
    downloadStockAsDOCX,
    downloadStockAsPDF,
    deleteSavedStockConfirm
  };
})();
