/* ============================================================
   ARM Seguimiento Médico — App Entry Point
   Router + Sidebar + Inicialización
   ============================================================ */
import { MOCK_PATIENTS, MOCK_MEDICO, MOCK_MEDICOS, MOCK_ALERTAS, MOCK_STATS, MOCK_NOTIFICACIONES, MOCK_CONFIG_ALERTAS, getCurrentUser, getMyNotificaciones, marcarNotificacionLeida, logAudit, logout } from './db.js';
import { renderDashboard, renderPatientCard, renderPatientDetail } from './views/dashboard.js';
import { renderAlertas } from './views/alertas.js';
import { renderReportes } from './views/reportes.js';
import { renderPacienteView } from './views/paciente.js';
import { renderPerfilView } from './views/perfil.js';
import { renderAuditoria } from './views/auditoria.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';
import { renderAdminPacientes } from './views/admin-pacientes.js';
import { renderAdminUsuarios } from './views/admin-usuarios.js';
import { renderAdminConfigAlertas } from './views/admin-config-alertas.js';
import { showNewFichaModal, showNuevoRegistroModal, showNuevaEvolucionModal, showLogoutConfirmModal, closeModal } from './modals.js';
import { exportPatientPDF } from './pdf.js';

// ── Exponemos db al window para acceso en event handlers ─────
window._db = { MOCK_PATIENTS, MOCK_MEDICO, MOCK_MEDICOS, MOCK_ALERTAS, MOCK_STATS, MOCK_NOTIFICACIONES, MOCK_CONFIG_ALERTAS };

// ── Estado global ─────────────────────────────────────────────
let currentUser = null;
let currentRoute = 'pacientes';

// ── Configuración de rutas (médico/admin) ─────────────────────
const medicoRoutes = {
  'pacientes':    (c) => renderDashboard(c),
  'alertas':      (c) => renderAlertas(c),
  'reportes':     (c) => renderReportes(c),
  'seguimientos': (c) => renderSeguimientosStub(c),
  'paciente-view':(c) => renderPacienteView(c, window._lastSelectedPatientId || MOCK_PATIENTS[0]?.id, { readOnly: true }),
};

// ── Configuración de rutas (paciente) ─────────────────────────
const pacienteRoutes = {
  'portal': (c) => renderPacienteView(c, currentUser.paciente_id || currentUser.id),
  'perfil': (c) => renderPerfilView(c, currentUser.paciente_id || currentUser.id),
};

// ── Configuración de rutas (admin) ────────────────────────────
const adminRoutes = {
  'admin-dashboard': (c) => renderAdminDashboard(c),
  'admin-pacientes': (c) => renderAdminPacientes(c),
  'admin-usuarios':  (c) => renderAdminUsuarios(c),
  'admin-alertas':   (c) => renderAdminConfigAlertas(c),
  'auditoria':       (c) => renderAuditoria(c),
  'paciente-view':   (c) => renderPacienteView(c, window._lastSelectedPatientId || MOCK_PATIENTS[0]?.id, { readOnly: true }),
};

function activeRoutes() {
  if (currentUser?.role === 'paciente') return pacienteRoutes;
  if (currentUser?.role === 'admin') return adminRoutes;
  return medicoRoutes;
}

function defaultRoute() {
  if (currentUser?.role === 'paciente') return 'portal';
  if (currentUser?.role === 'admin') return 'admin-dashboard';
  return 'pacientes';
}

// ── Inicialización ────────────────────────────────────────────
async function init() {
  // Verificar sesión
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  window._db.currentUser = currentUser;

  // Renderizar sidebar
  renderSidebar();

  // Ruta inicial
  const initialRoute = location.hash.slice(1) || defaultRoute();
  navigate(initialRoute);

  // Escuchar cambios de hash
  window.addEventListener('hashchange', () => {
    const route = location.hash.slice(1) || defaultRoute();
    navigate(route, false);
  });
}

// ── Router ────────────────────────────────────────────────────
function navigate(route, updateHash = true) {
  currentRoute = route;
  if (updateHash) location.hash = route;

  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

  const renderFn = activeRoutes()[route];
  if (renderFn) {
    setTimeout(() => renderFn(container), 80); // mini delay para animación
  } else {
    container.innerHTML = `<div class="empty-state"><h3>Vista no encontrada</h3></div>`;
  }

  updateActiveNav(route);
  closeSidebarOnMobile();
}

// ── Menú mobile ──────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-backdrop')?.classList.toggle('open');
}

function closeSidebarOnMobile() {
  if (window.innerWidth > 768) return;
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-backdrop')?.classList.remove('open');
}

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const isPaciente = currentUser?.role === 'paciente';
  const isAdmin   = currentUser?.role === 'admin';
  const alertCount = MOCK_ALERTAS.filter(a => !a.resuelta).length;
  const userName  = currentUser?.nombre || MOCK_MEDICO.nombre;
  const userRole  = isPaciente ? 'Paciente' : isAdmin ? 'Administrador' : (currentUser?.especialidad || MOCK_MEDICO.especialidad);
  const userAv    = userName.split(' ').filter(w => /^[A-ZÁÉÍÓÚÑ]/i.test(w[0])).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const navItems = isPaciente ? [
    { id: 'portal', label: 'Mi seguimiento', icon: iconHome, badge: null },
    { id: 'perfil', label: 'Mi perfil',      icon: iconUser, badge: null },
  ] : isAdmin ? [
    { id: 'admin-dashboard', label: 'Dashboard',        icon: iconHome,     badge: null },
    { id: 'admin-pacientes', label: 'Pacientes',        icon: iconUser,     badge: null },
    { id: 'admin-usuarios',  label: 'Usuarios',         icon: iconGrid,     badge: null },
    { id: 'admin-alertas',   label: 'Umbrales de alerta', icon: iconSettings, badge: null },
    { id: 'auditoria',       label: 'Auditoría',        icon: iconReport,   badge: null },
  ] : [
    { id: 'pacientes',    label: 'Pacientes',    icon: iconUser,     badge: null },
    { id: 'seguimientos', label: 'Seguimientos', icon: iconGrid,     badge: null },
    { id: 'alertas',      label: 'Alertas',      icon: iconFlag,     badge: alertCount || null },
    { id: 'reportes',     label: 'Reportes',     icon: iconReport,   badge: null },
  ];

  sidebar.innerHTML = `
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">
        <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3 6 12H2"/></svg>
      </div>
      <div class="sidebar-logo-text">
        <strong>ARM Seguimiento</strong>
        <span>Médico Integral</span>
      </div>
    </div>

    <!-- Navegación -->
    <nav class="sidebar-nav">
      <div class="nav-section-label">${isPaciente ? 'Mi salud' : isAdmin ? 'Cumplimiento' : 'Gestión Clínica'}</div>
      ${isPaciente || isAdmin ? '' : `
      <div class="nav-item" data-route="pacientes" onclick="app.navigate('pacientes')">
        ${iconHome} Inicio
      </div>`}
      ${navItems.map(item => `
        <div class="nav-item" data-route="${item.id}" onclick="app.navigate('${item.id}')">
          ${item.icon} ${item.label}
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </div>
      `).join('')}
    </nav>

    <!-- Info demo -->
    <div class="sidebar-promo">
      <div class="sidebar-promo-header">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        Prototipo protegido
      </div>
      <p>Todos los nombres y antecedentes visibles son ficticios.</p>
    </div>

    <!-- Usuario -->
    <div class="sidebar-user" style="position:relative">
      <div class="user-avatar" style="background:${MOCK_MEDICO.avatar_bg}">${userAv}</div>
      <div class="user-info">
        <strong>${userName}</strong>
        <span>${userRole}</span>
      </div>
      <button class="user-menu-btn" id="notif-bell-btn" onclick="app.toggleNotifPanel(event)" title="Notificaciones" style="position:relative">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span id="notif-badge" class="nav-badge" style="position:absolute;top:-2px;right:-2px;display:none"></span>
      </button>
      <button class="user-menu-btn" onclick="app.showUserMenu()" title="Opciones">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
    </div>
  `;

  renderNotifBadge();
}

function updateActiveNav(route) {
  document.querySelectorAll('.nav-item[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

// ── Stub para seguimientos ────────────────────────────────────
function renderSeguimientosStub(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-left">
        <h1 class="view-header-title">Seguimientos</h1>
        <p class="view-header-sub">Planes de seguimiento activos por paciente.</p>
      </div>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--s-4)">
        ${MOCK_PATIENTS.map(p => {
          const statusColors = { al_dia: 'ok', por_revisar: 'warn', atencion: 'alert' };
          const color = statusColors[p.estado] || 'neutral';
          const pct = Math.round((p.plan_dia_actual / p.plan_dias_total) * 100);
          return `
            <div class="card card-pad" style="cursor:pointer" onclick="app.navigate('pacientes');selectPatient('${p.id}')">
              <div style="display:flex;align-items:center;gap:var(--s-3);margin-bottom:var(--s-4)">
                <div class="avatar avatar-md" style="background:${p.avatar_bg}">${p.avatar}</div>
                <div>
                  <div style="font-weight:var(--fw-sb);font-size:var(--f-base)">${p.nombre}</div>
                  <div style="font-size:var(--f-xs);color:var(--tx-3)">${p.diagnostico_principal}</div>
                </div>
              </div>
              <div style="font-size:var(--f-sm);color:var(--tx-2);margin-bottom:var(--s-3)">${p.plan_nombre}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:var(--f-xs);color:var(--tx-3);margin-bottom:var(--s-2)">
                <span>Día ${p.plan_dia_actual} de ${p.plan_dias_total}</span>
                <span>${pct}%</span>
              </div>
              <div class="progress" style="height:7px">
                <div class="progress-fill ${p.adherencia < 60 ? 'alert' : ''}" style="width:${pct}%"></div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--s-3)">
                <span style="font-size:var(--f-xs);color:var(--tx-3)">Adherencia: <b>${p.adherencia}%</b></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── Funciones globales ────────────────────────────────────────
function showUserMenu() {
  showLogoutConfirmModal();
}

window._confirmLogout = () => {
  closeModal();
  logout();
};

function showNewPatientModal() { showNewFichaModal(); }

function showNewRegistroModal(patientId) {
  // Si no viene patientId, usar el paciente activo en el panel
  const id = patientId || document.querySelector('.patient-card.active')?.dataset.patientId;
  if (!id) { showToast('Selecciona un paciente primero', 'warn'); return; }
  showNuevoRegistroModal(id);
}

function showEvolucionModal(patientId) {
  const id = patientId || document.querySelector('.patient-card.active')?.dataset.patientId;
  if (!id) { showToast('Selecciona un paciente primero', 'warn'); return; }
  showNuevaEvolucionModal(id);
}

function showNuevoAutoRegistro(patientId) {
  showNuevoRegistroModal(patientId, 'paciente');
}

function registrarConsentimiento(patientId) {
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId);
  if (!p) return;
  if (!confirm(`¿Confirmas que ${p.nombre} (o su representante legal) otorgó su consentimiento informado para el tratamiento de su información clínica?`)) return;

  p.consentimiento_informado = true;
  p.fecha_consentimiento = new Date().toISOString();

  logAudit(currentUser, 'pacientes', 'UPDATE', p.id, { consentimiento_informado: true });

  showToast('Consentimiento informado registrado', 'ok');
  if (window.selectPatient) window.selectPatient(patientId);
  setTimeout(() => window.switchDetailTab?.('ficha'), 0);
}

function exportFichaPDF(patientId) {
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId);
  if (!p) { showToast('Paciente no encontrado', 'error'); return; }
  exportPatientPDF(p);
  showToast('Generando PDF…', 'ok');
}

// ── Notificaciones ───────────────────────────────────────────

async function renderNotifBadge() {
  if (!currentUser) return;
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const notifs = await getMyNotificaciones(currentUser);
  const unread = notifs.filter(n => !n.leida).length;
  badge.style.display = unread ? '' : 'none';
  badge.textContent = unread;
}

async function toggleNotifPanel(e) {
  e?.stopPropagation();
  const existing = document.getElementById('notif-panel');
  if (existing) { existing.remove(); return; }

  const notifs = (await getMyNotificaciones(currentUser)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.className = 'card';
  panel.style.cssText = 'position:fixed;bottom:80px;left:16px;width:320px;max-height:420px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg,0 10px 30px rgba(0,0,0,.15));';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--bd-light)">
      <strong style="font-size:var(--f-sm)">Notificaciones</strong>
      <button class="section-link" style="background:none;border:none;cursor:pointer;font-size:var(--f-xs)" onclick="app.marcarTodasNotifLeidas()">Marcar todas leídas</button>
    </div>
    ${notifs.length === 0 ? `
      <div class="empty-state" style="padding:2rem"><p>Sin notificaciones.</p></div>
    ` : notifs.map(n => `
      <div class="activity-item" style="cursor:pointer;${n.leida ? '' : 'background:var(--brand-bg)'}" onclick="app.marcarNotifLeida('${n.id}')">
        <div class="activity-icon ${n.leida ? 'neutral' : 'brand'}">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div class="activity-body">
          <strong>${n.titulo}</strong>
          <p>${n.mensaje}</p>
          <time>${new Date(n.created_at).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
        </div>
      </div>
    `).join('')}
  `;
  document.body.appendChild(panel);

  // Cerrar al hacer click fuera
  setTimeout(() => {
    document.addEventListener('click', function closePanel(ev) {
      if (!panel.contains(ev.target)) { panel.remove(); document.removeEventListener('click', closePanel); }
    });
  }, 0);
}

async function marcarNotifLeida(id) {
  await marcarNotificacionLeida(id);
  document.getElementById('notif-panel')?.remove();
  renderNotifBadge();
  toggleNotifPanel();
}

async function marcarTodasNotifLeidas() {
  const notifs = await getMyNotificaciones(currentUser);
  await Promise.all(notifs.filter(n => !n.leida).map(n => marcarNotificacionLeida(n.id)));
  document.getElementById('notif-panel')?.remove();
  renderNotifBadge();
}

function showPatientFull(id) {
  navigate('pacientes');
  setTimeout(() => { if (window.selectPatient) window.selectPatient(id); }, 200);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const icons = {
    ok: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || ''} ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── SVG Icons ─────────────────────────────────────────────────
const iconHome = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const iconUser = `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const iconGrid = `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;
const iconFlag = `<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
const iconReport = `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
const iconSettings = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// ── Exponer API pública ───────────────────────────────────────
window.app = { navigate, showUserMenu, showNewPatientModal, showPatientFull, showNewRegistroModal, showNuevaEvolucionModal: showEvolucionModal, showNuevoAutoRegistro, exportFichaPDF, registrarConsentimiento, toggleNotifPanel, marcarNotifLeida, marcarTodasNotifLeidas, renderNotifBadge, toggleSidebar, showToast, closeModal };

// ── Arrancar ──────────────────────────────────────────────────
init();
