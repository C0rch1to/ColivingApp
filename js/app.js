/**
 * Coliving App - Coordinador Principal
 * Control de navegación, menú hamburguesa móvil, filtro de sucursal y modales.
 */

window.Coliving = window.Coliving || {};

(function() {
  const store = window.Coliving.store;
  let activeTab = 'rooms'; // 'rooms' | 'tasks' | 'stock'

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initApp();
  });

  // --- Modo Oscuro por Defecto ---
  function initTheme() {
    const current = localStorage.getItem('coliving_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', current);
    updateThemeToggleButtons(current);
  }

  function toggleTheme() {
    const active = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', active);
    localStorage.setItem('coliving_theme', active);
    updateThemeToggleButtons(active);
    showToast(active === 'dark' ? 'Modo Oscuro activado' : 'Modo Claro activado');
  }

  function updateThemeToggleButtons(theme) {
    const isDark = theme === 'dark';
    const icon = isDark ? Coliving.icons.sun : Coliving.icons.moon;
    const label = isDark ? 'Modo Claro' : 'Modo Oscuro';

    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
      el.innerHTML = icon;
    });
    document.querySelectorAll('.theme-toggle-label').forEach(el => {
      el.textContent = label;
    });
  }

  function initApp() {
    setupBranchSelector();
    setupNavigation();
    setupMobileMenu();
    setupModalHandlers();
    setupBackupHandlers();

    // Inicializar módulos
    if (Coliving.rooms) Coliving.rooms.init();
    if (Coliving.tasks) Coliving.tasks.init();
    if (Coliving.stock) Coliving.stock.init();

    switchTab('rooms');
  }

  // --- Navegación ---
  function setupNavigation() {
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-target');
        switchTab(target);
        closeMobileMenu();
      });
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;

    // Actualizar botones de navegación de escritorio y móvil
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      if (btn.getAttribute('data-nav-target') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Actualizar vistas activas
    document.querySelectorAll('.app-view').forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Renderizar submódulo si corresponde
    if (tabId === 'rooms' && Coliving.rooms) Coliving.rooms.render();
    if (tabId === 'tasks' && Coliving.tasks) Coliving.tasks.render();
    if (tabId === 'stock' && Coliving.stock) Coliving.stock.render();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Selector de Sucursal ---
  function setupBranchSelector() {
    document.querySelectorAll('[data-branch-select]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-branch-select]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const branch = e.currentTarget.getAttribute('data-branch-select');
        store.setActiveBranch(branch);

        const label = branch === 'all' ? 'Todas las sucursales' : branch === 'centro' ? 'Sucursal Centro' : 'Sucursal Boulevares';
        showToast(`Filtrando: ${label}`);
      });
    });
  }

  // --- Menú Hamburguesa para Móvil ---
  function setupMobileMenu() {
    const toggleBtn = document.getElementById('btn-hamburger-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.getElementById('mobile-nav-overlay');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.contains('open');
        if (isOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        closeMobileMenu();
      });
    }
  }

  function openMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.getElementById('mobile-nav-overlay');
    const toggleBtn = document.getElementById('btn-hamburger-toggle');

    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (toggleBtn) toggleBtn.classList.add('is-active');
  }

  function closeMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.getElementById('mobile-nav-overlay');
    const toggleBtn = document.getElementById('btn-hamburger-toggle');

    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (toggleBtn) toggleBtn.classList.remove('is-active');
  }

  // --- Modales ---
  function setupModalHandlers() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(htmlContent) {
    const backdrop = document.getElementById('modal-backdrop');
    const container = document.getElementById('modal-content-container');
    if (backdrop && container) {
      container.innerHTML = htmlContent;
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Notificaciones Toast ---
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Respaldos ---
  function setupBackupHandlers() {
    const btnExport = document.getElementById('btn-export-backup');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        store.exportBackupJSON();
        showToast('Copia de seguridad descargada.');
      });
    }

    const fileInput = document.getElementById('input-import-backup');
    const btnImport = document.getElementById('btn-import-backup');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = store.importBackupJSON(event.target.result);
          if (res.success) {
            showToast('Respaldo restaurado con éxito.');
            if (Coliving.rooms) Coliving.rooms.render();
            if (Coliving.tasks) Coliving.tasks.render();
            if (Coliving.stock) Coliving.stock.render();
          } else {
            alert('Error al restaurar: ' + res.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function openBackupModal() {
    const modalContent = `
      <div class="modal-header">
        <h2 class="modal-title flex-align-gap">${Coliving.icons.save} Copia de Seguridad Local</h2>
        <button class="modal-close" onclick="Coliving.app.closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p class="text-secondary text-sm">
          Todos los datos de tus habitaciones, inquilinos, trabajos y stock se guardan en este navegador.
          Puedes descargar una copia de seguridad para resguardar o transferir a otra computadora.
        </p>

        <div class="mt-4 flex-between">
          <div>
            <strong>Descargar Backup (.json)</strong>
            <div class="text-xs text-muted">Guarda una copia completa en tu dispositivo.</div>
          </div>
          <button class="btn btn-primary" onclick="Coliving.store.exportBackupJSON(); Coliving.app.showToast('Descarga iniciada.');">
            ${Coliving.icons.download} Descargar
          </button>
        </div>

        <hr class="mt-3 mb-3" style="border: 0; border-top: 1px solid var(--border);">

        <div class="flex-between">
          <div>
            <strong>Restaurar desde Backup</strong>
            <div class="text-xs text-muted">Carga un archivo previamente descargado.</div>
          </div>
          <input type="file" id="modal-import-backup-file" accept=".json" style="display: none;" onchange="Coliving.app.handleModalImport(event)">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-import-backup-file').click()">
            ${Coliving.icons.upload} Restaurar
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Coliving.app.closeModal()">Cerrar</button>
      </div>
    `;

    openModal(modalContent);
  }

  function handleModalImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = store.importBackupJSON(event.target.result);
      if (res.success) {
        showToast('Respaldo restaurado.');
        closeModal();
      } else {
        alert('Error: ' + res.message);
      }
    };
    reader.readAsText(file);
  }

  window.Coliving.app = {
    switchTab,
    openModal,
    closeModal,
    showToast,
    openBackupModal,
    handleModalImport,
    openMobileMenu,
    closeMobileMenu,
    toggleTheme
  };
})();
