/* ============================================================
   ARM Seguimiento Médico — Vista: Dashboard del Administrador
   Métricas generales del sistema
   ============================================================ */
import { getMedicos, getConsentimientoVigente } from '../db.js';

export async function renderAdminDashboard(container) {
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  const { MOCK_PATIENTS, MOCK_ALERTAS, MOCK_MEDICOS } = window._db;
  const medicos = await getMedicos();

  const totalPacientes = MOCK_PATIENTS.length;
  const pacientesActivos = MOCK_PATIENTS.filter(p => p.activo !== false).length;
  const medicosActivos = medicos.filter(m => m.activo).length;
  const alertasSinResolver = MOCK_ALERTAS.filter(a => !a.resuelta);
  const porSeveridad = { critica: 0, alta: 0, media: 0, baja: 0 };
  alertasSinResolver.forEach(a => { porSeveridad[a.severidad] = (porSeveridad[a.severidad] || 0) + 1; });
  const adherenciaProm = totalPacientes ? Math.round(MOCK_PATIENTS.reduce((acc, p) => acc + (p.adherencia || 0), 0) / totalPacientes) : 0;
  const totalRegistros = MOCK_PATIENTS.reduce((acc, p) => acc + (p.registros?.length || 0), 0);
  const consentimientosPendientes = MOCK_PATIENTS.filter(p => !getConsentimientoVigente(p)).length;

  container.innerHTML = `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">PANEL DE ADMINISTRACIÓN</div>
      <h1 class="view-header-title">Métricas del sistema</h1>
      <p class="view-header-sub">Resumen general de la plataforma ARM Seguimiento Médico.</p>
    </div>
  </div>

  <div class="page-content">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-icon brand">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-card-value">${totalPacientes}</div>
        <div class="stat-card-label">Pacientes totales</div>
        <div class="stat-card-meta">${pacientesActivos} activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon ok">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <div class="stat-card-value">${medicosActivos}</div>
        <div class="stat-card-label">Médicos activos</div>
        <div class="stat-card-meta">${medicos.length} registrados</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon alert">
          <svg viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="stat-card-value">${alertasSinResolver.length}</div>
        <div class="stat-card-label">Alertas sin resolver</div>
        <div class="stat-card-meta warn">${porSeveridad.critica} críticas · ${porSeveridad.alta} altas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon ok">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-card-value">${adherenciaProm}%</div>
        <div class="stat-card-label">Adherencia promedio</div>
        <div class="stat-card-meta">Todos los pacientes</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--s-4);margin-top:var(--s-4)">
      <div class="card card-pad">
        <div class="section-title" style="margin-bottom:var(--s-3)">Alertas por severidad</div>
        ${['critica', 'alta', 'media', 'baja'].map(sev => {
          const labels = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
          const colors = { critica: 'var(--alert)', alta: '#f59e0b', media: '#3b82f6', baja: 'var(--tx-3)' };
          const count = porSeveridad[sev] || 0;
          const pct = alertasSinResolver.length ? Math.round((count / alertasSinResolver.length) * 100) : 0;
          return `
          <div style="margin-bottom:var(--s-3)">
            <div style="display:flex;justify-content:space-between;font-size:var(--f-xs);color:var(--tx-2);margin-bottom:4px">
              <span>${labels[sev]}</span><span>${count}</span>
            </div>
            <div class="progress" style="height:7px"><div class="progress-fill" style="width:${pct}%;background:${colors[sev]}"></div></div>
          </div>`;
        }).join('')}
      </div>

      <div class="card card-pad">
        <div class="section-title" style="margin-bottom:var(--s-3)">Cumplimiento legal</div>
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:var(--s-3)">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="${consentimientosPendientes ? 'var(--alert)' : 'var(--ok)'}" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style="font-size:var(--f-sm)">${consentimientosPendientes} consentimiento${consentimientosPendientes !== 1 ? 's' : ''} pendiente${consentimientosPendientes !== 1 ? 's' : ''}</span>
        </div>
        <div style="font-size:var(--f-xs);color:var(--tx-3)">${totalRegistros} registros clínicos totales en el sistema.</div>
      </div>
    </div>
  </div>
  `;
}
