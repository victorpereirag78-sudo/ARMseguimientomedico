/* ============================================================
   ARM Seguimiento Médico — Vista: Alertas
   ============================================================ */
import { MOCK_ALERTAS } from '../db.js';

export function renderAlertas(container) {
  container.innerHTML = getAlertasHTML();
}

function getAlertasHTML() {
  const alertas = MOCK_ALERTAS;
  const sinResolver = alertas.filter(a => !a.resuelta);
  const sevMap = { critica: 'sev-critica', alta: 'sev-alta', media: 'sev-media' };
  const sevLabel = { critica: 'Crítica', alta: 'Alta', media: 'Media' };
  const sevBadge = { critica: 'badge-alert', alta: 'badge-warn', media: 'badge-info' };

  return `
  <div class="view-header">
    <div class="view-header-left">
      <h1 class="view-header-title">Alertas</h1>
      <p class="view-header-sub">${sinResolver.length} alerta${sinResolver.length !== 1 ? 's' : ''} sin resolver</p>
    </div>
    <div class="view-header-actions">
      <button class="btn btn-secondary btn-sm">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        Marcar todas como leídas
      </button>
    </div>
  </div>

  <div class="page-content">
    ${sinResolver.length === 0 ? `
      <div class="empty-state" style="padding: 5rem 0">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <h3>Sin alertas pendientes</h3>
        <p>Todos sus pacientes están en control. Buen trabajo.</p>
      </div>
    ` : `
      <div class="card" style="overflow:hidden">
        ${alertas.map(a => `
          <div class="alert-item ${sevMap[a.severidad] || ''}">
            <div class="alert-item-icon">
              <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="alert-item-body">
              <strong>${a.titulo}</strong>
              <p>${a.descripcion}</p>
              <p style="color:var(--tx-3);font-size:var(--f-xs);margin-top:2px">
                Paciente: <b>${a.paciente_nombre}</b> · Valor: ${a.valor} · Umbral: ${a.umbral}
              </p>
              <div class="alert-item-meta">
                <span class="badge ${sevBadge[a.severidad]}">${sevLabel[a.severidad]}</span>
                <span class="alert-item-time">
                  ${new Date(a.fecha).toLocaleDateString('es-CL', {day:'numeric',month:'short'})} a las
                  ${new Date(a.fecha).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}
                </span>
                ${a.leida ? '' : '<span class="badge badge-neutral">No leída</span>'}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--s-2);flex-shrink:0">
              <button class="btn btn-primary btn-sm" onclick="selectPatient('${a.paciente_id}');app.navigate('pacientes')">
                Ver paciente
              </button>
              <button class="btn btn-ghost btn-sm">Resolver</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  </div>
  `;
}
