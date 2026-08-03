/* ============================================================
   ARM Seguimiento Médico — Vista: Portal del Paciente
   Vista de sólo el propio seguimiento, usada tanto por el login
   de rol "paciente" como por la vista previa del médico.
   ============================================================ */
import { buildVitalCards, renderTabEvoluciones, logPatientAccess } from './dashboard.js';
import { renderEvolucionSection, initEvolucionCharts } from '../charts.js';
import { showNuevoRegistroModal } from '../modals.js';
import { exportPatientPDF } from '../pdf.js';

let _rangoState = { range: 'mes', desde: null, hasta: null };

window._exportMiFichaPDF = (patientId) => {
  const p = (window._db.MOCK_PATIENTS || []).find(pt => pt.id === patientId);
  if (!p) return;
  exportPatientPDF(p);
  window.app?.showToast('Generando PDF…', 'ok');
};

export function renderPacienteView(container, patientId, opts = {}) {
  const { MOCK_PATIENTS, MOCK_ALERTAS } = window._db;
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId) || MOCK_PATIENTS[0];

  if (!p) {
    container.innerHTML = `<div class="empty-state"><h3>Sin datos</h3><p>No se encontró información de paciente asociada a esta cuenta.</p></div>`;
    return;
  }

  container.innerHTML = getPacienteHTML(p, opts, MOCK_ALERTAS);
  initEvolucionCharts(p, _rangoState);
  if (opts.readOnly) logPatientAccess(p.id, p.nombre);

  // Permite refrescar esta vista cuando se guarda un nuevo registro
  window._refreshPacienteView = (id) => {
    if (id !== p.id) return;
    renderPacienteView(container, patientId, opts);
  };

  window._setRangoEvolucion = (range) => {
    _rangoState = { ..._rangoState, range };
    renderPacienteView(container, patientId, opts);
  };

  window._aplicarRangoPersonalizado = () => {
    const desde = document.getElementById('rango-desde')?.value;
    const hasta = document.getElementById('rango-hasta')?.value;
    if (!desde || !hasta) return;
    _rangoState = { range: 'personalizado', desde, hasta };
    renderPacienteView(container, patientId, opts);
  };
}

function getPacienteHTML(p, opts, alertasAll) {
  const lastReg = p.registros?.[0] || {};
  const misAlertas = (alertasAll || []).filter(a => a.paciente_id === p.id && !a.resuelta);
  const pct = p.plan_dias_total ? Math.round((p.plan_dia_actual / p.plan_dias_total) * 100) : 0;

  return `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">MI SEGUIMIENTO</div>
      <h1 class="view-header-title">Hola, ${p.nombre.split(' ')[0]}</h1>
      <p class="view-header-sub">${p.plan_nombre} · Día ${p.plan_dia_actual} de ${p.plan_dias_total}</p>
    </div>
    <div class="view-header-actions">
      <button class="btn btn-secondary" onclick="window._exportMiFichaPDF('${p.id}')" title="Descargar resumen en PDF">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
        Descargar mi resumen
      </button>
      ${opts.readOnly ? '' : `
      <button class="btn btn-primary" onclick="app.showNuevoAutoRegistro('${p.id}')">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Registrar mis datos de hoy
      </button>`}
    </div>
  </div>

  <div class="page-content">
    ${opts.readOnly ? `
      <div class="demo-banner" style="position:static;margin-bottom:var(--s-4)">
        <span class="demo-banner-tag">Vista previa</span>
        Así es como ${p.nombre} ve su portal de seguimiento. Modo solo lectura.
      </div>
    ` : ''}

    ${misAlertas.length ? `
      <div class="card card-pad" style="margin-bottom:var(--s-4);border-color:var(--alert-light,#fecaca);background:var(--alert-bg,#fef2f2)">
        <div style="font-weight:var(--fw-sb);color:var(--alert);margin-bottom:var(--s-2)">⚠ ${misAlertas.length} alerta${misAlertas.length !== 1 ? 's' : ''} de tu equipo médico</div>
        ${misAlertas.map(a => `<div style="font-size:var(--f-sm);color:var(--tx-2);margin-bottom:4px">${a.titulo} — ${a.descripcion}</div>`).join('')}
      </div>
    ` : ''}

    <!-- Plan activo -->
    <div class="plan-card" style="margin-bottom:var(--s-4)">
      <div class="plan-card-icon">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      </div>
      <div style="flex:1">
        <div class="plan-card-label">Plan activo</div>
        <div class="plan-card-name">${p.plan_nombre}</div>
        <div class="plan-card-sub">Adherencia ${p.adherencia}% · ${pct}% del plan completado</div>
        <div class="progress" style="height:7px;margin-top:var(--s-2)">
          <div class="progress-fill ${p.adherencia < 60 ? 'alert' : ''}" style="width:${pct}%"></div>
        </div>
      </div>
    </div>

    <!-- Vitals -->
    <div class="vitals-grid" style="margin-bottom:var(--s-4)">
      ${buildVitalCards(p, lastReg)}
    </div>

    <!-- Medicamentos de hoy -->
    <div class="section-header">
      <div class="section-title">Mis medicamentos</div>
    </div>
    <div class="card" style="margin-bottom:var(--s-4)">
      ${(p.medicamentos || []).map(m => `
        <div class="activity-item">
          <div class="activity-icon brand">
            <svg viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div class="activity-body">
            <strong>${m.nombre}</strong>
            <p>${m.frecuencia} · Horario: ${m.horarios.join(', ')}</p>
          </div>
        </div>
      `).join('')}
      ${!p.medicamentos?.length ? '<div class="empty-state" style="padding:2rem"><p>Sin medicamentos activos registrados.</p></div>' : ''}
    </div>

    <!-- Gráfico de evolución -->
    ${renderEvolucionSection(p, _rangoState)}

    <!-- Registros recientes -->
    <div class="section-header">
      <div class="section-title">Mis registros recientes</div>
    </div>
    <div class="card" style="overflow:hidden;margin-bottom:var(--s-4)">
      ${(p.registros || []).slice(0, 8).map(r => `
        <div class="activity-item">
          <div class="activity-icon ${r.registrado_por === 'medico' ? 'neutral' : 'ok'}">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="activity-body">
            <strong>${_registroResumen(r)}</strong>
            <p>${r.observaciones || 'Sin observaciones'}</p>
            <time>${new Date(r.fecha).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${r.registrado_por === 'medico' ? 'Ingresado por el médico' : 'Ingresado por ti'}</time>
          </div>
        </div>
      `).join('')}
      ${!p.registros?.length ? '<div class="empty-state" style="padding:2rem"><p>Aún no tienes registros. ¡Registra tus datos de hoy!</p></div>' : ''}
    </div>

    <!-- Evoluciones médicas (solo lectura) -->
    ${renderTabEvoluciones(p, true)}
  </div>
  `;
}

function _registroResumen(r) {
  if (r.presion_s !== undefined) return `Presión ${r.presion_s}/${r.presion_d} mmHg${r.pulso ? ` · Pulso ${r.pulso} lpm` : ''}`;
  if (r.glicemia !== undefined) return `Glicemia ${r.glicemia} mg/dL (${r.glicemia_tipo || '—'})`;
  if (r.saturacion !== undefined) return `Saturación ${r.saturacion}%${r.frecuencia_cardiaca ? ` · FC ${r.frecuencia_cardiaca} lpm` : ''}`;
  return 'Registro de seguimiento';
}
