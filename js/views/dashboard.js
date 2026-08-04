/* ============================================================
   ARM Seguimiento Médico — Vista: Dashboard
   ============================================================ */
import { MOCK_STATS, MOCK_PATIENTS, logAudit, getConsentimientoVigente } from '../db.js';
import { renderEvolucionSection, initEvolucionCharts } from '../charts.js';

/** Enfermería puede ver y registrar vitales, pero no diagnósticos/tratamientos/evoluciones */
function _isEnfermeria() {
  return window._db.currentUser?.role === 'enfermeria';
}

/** Bloque de estado del consentimiento informado vigente (versionado) */
function _renderConsentimientoBloque(p) {
  const vigente = getConsentimientoVigente(p);
  if (vigente) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:var(--s-2);color:var(--ok)">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style="font-size:var(--f-sm)">Consentimiento v${vigente.version_documento} otorgado el ${new Date(vigente.fecha_aceptacion).toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</span>
        </div>
        ${_isEnfermeria() ? '' : `<button class="btn btn-secondary btn-sm" onclick="app.revocarConsentimiento('${p.id}')">Revocar</button>`}
      </div>`;
  }
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--s-3)">
      <div style="display:flex;align-items:center;gap:var(--s-2);color:var(--alert)">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style="font-size:var(--f-sm)">Consentimiento informado pendiente${(p.consentimientos || []).some(c => c.revocado) ? ' (revocado previamente)' : ''}</span>
      </div>
      ${_isEnfermeria() ? '' : `<button class="btn btn-primary btn-sm" onclick="app.registrarConsentimiento('${p.id}')">Registrar consentimiento</button>`}
    </div>`;
}

/** Registra en auditoría que un médico/admin accedió (consultó) la ficha de un paciente */
export function logPatientAccess(id, nombre) {
  const cu = window._db.currentUser;
  if (!cu || cu.role === 'paciente') return;
  const last = window._lastAuditedAccess;
  const now = Date.now();
  if (last && last.id === id && now - last.ts < 2000) return; // evita duplicados por refrescos internos
  window._lastAuditedAccess = { id, ts: now };
  logAudit(cu, 'pacientes', 'SELECT', id, { paciente: nombre, accion: 'Ficha consultada' });
}

let _rangoState = { range: 'mes', desde: null, hasta: null };

export function renderDashboard(container) {
  container.innerHTML = getDashboardHTML();
  initDashboardEvents();
}

function getDashboardHTML() {
  const stats = MOCK_STATS;
  const patients = MOCK_PATIENTS;

  const today = new Date();
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dateStr = `${dias[today.getDay()]}, ${today.getDate()} de ${meses[today.getMonth()]}`;

  return `
  <!-- View Header -->
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">${dateStr.toUpperCase()}</div>
      <h1 class="view-header-title">Seguimiento de pacientes</h1>
      <p class="view-header-sub">Revise la evolución y priorice los registros que requieren atención.</p>
    </div>
    <div class="view-header-actions">
      <div class="view-toggle">
        <button class="view-toggle-btn active" onclick="app.navigate('pacientes')">Vista médica</button>
        <button class="view-toggle-btn" onclick="app.navigate('paciente-view')">Vista paciente</button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="app.navigate('reportes')" title="Generar reporte">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Generar reporte
      </button>
      ${_isEnfermeria() ? '' : `
      <button class="btn btn-primary" onclick="app.showNewPatientModal()">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva ficha clínica
      </button>`}
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-card-icon brand">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="stat-card-value">${stats.pacientes_activos}</div>
      <div class="stat-card-label">Pacientes activos</div>
      <div class="stat-card-meta up">+${stats.nuevos_semana} esta semana</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon warn">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      </div>
      <div class="stat-card-value">${stats.registros_por_revisar}</div>
      <div class="stat-card-label">Registros por revisar</div>
      <div class="stat-card-meta">${stats.ingresados_hoy} ingresados hoy</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon alert">
        <svg viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="stat-card-value">${stats.requiere_atencion}</div>
      <div class="stat-card-label">Requiere atención</div>
      <div class="stat-card-meta warn" onclick="app.navigate('alertas')">Revisar seguimiento</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon ok">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="stat-card-value">${stats.adherencia_promedio}%</div>
      <div class="stat-card-label">Adherencia promedio</div>
      <div class="stat-card-meta up">+4% últimos 7 días</div>
    </div>
  </div>

  <!-- Two panel: lista + detalle -->
  <div class="two-panel" style="--panel-offset: 230px">
    <!-- Panel izquierdo: Lista de pacientes -->
    <div class="panel-left">
      <div class="panel-left-header">
        <div class="panel-left-header-top">
          <h3>Pacientes</h3>
          <span>${patients.length} seguimientos activos</span>
        </div>
        <div class="input-icon-wrap">
          <span class="input-icon">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="text" class="input" id="search-patients" placeholder="Buscar por nombre o diagnóstico" oninput="filterPatients(this.value)">
        </div>
      </div>
      <div class="panel-patient-list" id="patient-list">
        ${patients.map((p, i) => renderPatientCard(p, i === 0)).join('')}
        <div style="padding: var(--s-4); text-align: center;">
          <a href="#" class="section-link" onclick="app.navigate('pacientes'); return false;">Ver todos los pacientes →</a>
        </div>
      </div>
    </div>

    <!-- Panel derecho: Detalle del paciente -->
    <div class="panel-right" id="patient-detail">
      ${renderPatientDetail(patients[0])}
    </div>
  </div>
  `;
}

export function renderPatientCard(p, isActive = false) {
  const badgeMap = {
    'por_revisar': ['badge-warn', 'Por revisar'],
    'al_dia':      ['badge-ok',   'Al día'],
    'atencion':    ['badge-alert','Atención'],
    'inactivo':    ['badge-neutral','Sin datos'],
  };
  const [badgeClass, badgeLabel] = badgeMap[p.estado] || ['badge-neutral', p.estado];
  const progPct = Math.round((p.plan_dia_actual / p.plan_dias_total) * 100);
  const progClass = p.adherencia < 60 ? 'alert' : p.adherencia < 80 ? 'warn' : '';

  return `
  <div class="patient-card ${isActive ? 'active' : ''}" onclick="selectPatient('${p.id}')" data-patient-id="${p.id}" data-search="${p.nombre.toLowerCase()} ${p.diagnostico_principal.toLowerCase()}">
    <div class="patient-card-top">
      <div class="avatar avatar-md" style="background:${p.avatar_bg}">${p.avatar}</div>
      <div class="patient-card-name">
        <strong>${p.nombre}</strong>
        <span>${p.edad} años · ${p.ciudad}</span>
      </div>
      <span class="badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="patient-card-plan">${p.plan_nombre}</div>
    <div class="patient-card-progress">
      <div class="progress"><div class="progress-fill ${progClass}" style="width:${progPct}%"></div></div>
      <span>${progPct}%</span>
    </div>
  </div>
  `;
}

export function renderPatientDetail(p) {
  if (!p) return `<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><h3>Selecciona un paciente</h3><p>Haz clic en un paciente de la lista para ver su detalle.</p></div>`;

  const badgeMap = {
    'por_revisar': ['badge-warn', 'Por revisar'],
    'al_dia':      ['badge-ok',   'Al día'],
    'atencion':    ['badge-alert','Atención'],
  };
  const [badgeClass, badgeLabel] = badgeMap[p.estado] || ['badge-neutral', p.estado];

  const ultimaLectura = new Date(p.ultima_lectura);
  const horaFmt = ultimaLectura.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const diaFmt = ultimaLectura.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) === new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) ? `Hoy, ${horaFmt}` : `${ultimaLectura.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}, ${horaFmt}`;

  const planInicio = new Date(p.plan_inicio).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const planControl = new Date(p.proxima_cita).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  // Último registro para vitals
  const lastReg = p.registros?.[0] || {};

  return `
  <!-- Header del detalle -->
  <div class="patient-detail-header">
    <div class="patient-detail-header-left">
      <div class="avatar avatar-lg" style="background:${p.avatar_bg}">${p.avatar}</div>
      <div class="patient-detail-name-group">
        <div class="patient-detail-name">
          ${p.nombre}
          <span class="badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="patient-detail-meta">${p.edad} años · ${p.ciudad} · Último registro: ${diaFmt}</div>
      </div>
    </div>
    <div style="display:flex; gap: var(--s-2);">
      <button class="btn btn-secondary btn-sm" onclick="app.exportFichaPDF('${p.id}')" title="Exportar ficha clínica en PDF">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
        Exportar PDF
      </button>
      <button class="btn btn-secondary btn-sm" onclick="app.showPatientFull('${p.id}')">
        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Ver completo
      </button>
      <button class="btn btn-ghost btn-sm" title="Más opciones">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="patient-detail-tabs">
    <div class="tabs" id="detail-tabs">
      <button class="tab-btn active" onclick="switchDetailTab('resumen', this)">Resumen</button>
      <button class="tab-btn" onclick="switchDetailTab('ficha', this)">Ficha clínica</button>
      <button class="tab-btn" onclick="switchDetailTab('seguimiento', this)">Seguimiento</button>
      <button class="tab-btn" onclick="switchDetailTab('evoluciones', this)">Evoluciones <span class="tab-count">${p.evoluciones?.length || 0}</span></button>
      <button class="tab-btn" onclick="switchDetailTab('examenes', this)">Exámenes <span class="tab-count">${p.examenes?.length || 0}</span></button>
    </div>
  </div>

  <!-- Tab content -->
  <div id="detail-tab-content" class="patient-detail-content">
    ${renderTabResumen(p, lastReg, planInicio, planControl)}
  </div>
  `;
}

function renderTabResumen(p, lastReg, planInicio, planControl) {
  // Vitals según tipo de plan
  const vitalCards = buildVitalCards(p, lastReg);

  return `
  <!-- Plan Activo -->
  <div class="plan-card">
    <div class="plan-card-icon">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
    </div>
    <div>
      <div class="plan-card-label">Plan activo</div>
      <div class="plan-card-name">${p.plan_nombre}</div>
      <div class="plan-card-sub">Día ${p.plan_dia_actual} de ${p.plan_dias_total} · Inicio: ${planInicio} · Control: ${planControl}</div>
    </div>
    <div class="plan-card-action">
      <button class="btn btn-secondary btn-sm">Editar plan</button>
    </div>
  </div>

  <!-- Vitals -->
  <div class="vitals-grid">
    ${vitalCards}
  </div>

  <!-- Grid 2: Actividad reciente + Próxima acción -->
  <div style="display:grid; grid-template-columns: 1fr 200px; gap: var(--s-4);">
    <!-- Actividad reciente -->
    <div>
      <div class="section-header">
        <div>
          <div class="section-title">Actividad reciente</div>
          <div class="section-sub">Registros enviados por el paciente</div>
        </div>
        <a href="#" class="section-link">Ver historial</a>
      </div>
      <div class="card">
        ${(p.actividad_reciente || []).map(a => `
          <div class="activity-item">
            <div class="activity-icon ${a.color}">
              ${getActivityIcon(a.icono)}
            </div>
            <div class="activity-body">
              <strong>${a.titulo}</strong>
              <p>${a.desc}</p>
              <time>${a.tiempo}</time>
            </div>
          </div>
        `).join('')}
        ${!p.actividad_reciente?.length ? '<div class="empty-state" style="padding: 2rem"><p>Sin actividad reciente.</p></div>' : ''}
      </div>
    </div>

    <!-- Próxima acción -->
    <div class="next-action-box">
      <div class="next-action-label">Próxima acción</div>
      <div class="next-action-title">${p.prox_accion_titulo}</div>
      <div class="next-action-desc">${p.prox_accion_desc}</div>
      <div class="next-action-btns">
        ${_isEnfermeria() ? `
        <button class="btn btn-primary btn-sm btn-full" onclick="app.showNewRegistroModal('${p.id}')">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar vitales
        </button>
        ` : `
        <button class="btn btn-primary btn-sm btn-full" onclick="app.showNuevaEvolucionModal('${p.id}')">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Registrar evolución
        </button>
        <button class="btn btn-secondary btn-sm btn-full">Ajustar seguimiento</button>`}
      </div>
    </div>
  </div>
  `;
}

export function buildVitalCards(p, lastReg) {
  const cards = [];

  if (p.plan_tipo === 'presion' || p.plan_tipo === 'multi') {
    const presion = lastReg.presion_s ? `${lastReg.presion_s}/${lastReg.presion_d}` : '—';
    const diffS = lastReg.presion_s ? lastReg.presion_s - (p.registros?.[1]?.presion_s || lastReg.presion_s) : 0;
    const diffStr = diffS !== 0 ? `${diffS > 0 ? '↑' : '↓'} ${Math.abs(diffS)} mmHg` : 'Sin variación';
    const promS = p.registros?.length ? Math.round(p.registros.reduce((a,r) => a + (r.presion_s||0), 0) / p.registros.filter(r => r.presion_s).length) : '—';
    const promD = p.registros?.length ? Math.round(p.registros.reduce((a,r) => a + (r.presion_d||0), 0) / p.registros.filter(r => r.presion_d).length) : '—';
    const adh = p.adherencia;

    cards.push(`
      <div class="vital-card">
        <div class="vital-card-label">Última presión</div>
        <div class="vital-card-value">${presion}<span class="vital-card-unit">mmHg</span></div>
        <div class="vital-card-sub">${lastReg.presion_s ? `Hoy, ${new Date(lastReg.fecha || p.ultima_lectura).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}` : ''}</div>
        <div class="vital-card-sub ${Math.abs(diffS) > 5 ? 'warn' : 'ok'}">${diffStr}</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Promedio válido</div>
        <div class="vital-card-value">${promS}/${promD}<span class="vital-card-unit">mmHg</span></div>
        <div class="vital-card-sub">Días 2–${p.plan_dia_actual}</div>
        <div class="vital-card-sub ok">Dentro del plan</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Adherencia</div>
        <div class="vital-card-value">${Math.round((p.registros?.length || 0)/(p.plan_dia_actual * 2)*100*10)/10 || adh}%</div>
        <div class="vital-card-sub">${p.registros?.length || 0}/${p.plan_dia_actual * 2} registros</div>
        <div class="vital-card-sub ${adh >= 80 ? 'ok' : adh >= 60 ? 'warn' : 'alert'}">${adh >= 80 ? 'Buen cumplimiento' : adh >= 60 ? 'Cumplimiento regular' : 'Bajo cumplimiento'}</div>
      </div>
    `);
  } else if (p.plan_tipo === 'glicemia') {
    const glicemia = lastReg.glicemia || '—';
    const adh = p.adherencia;
    cards.push(`
      <div class="vital-card">
        <div class="vital-card-label">Última glicemia</div>
        <div class="vital-card-value">${glicemia}<span class="vital-card-unit">mg/dL</span></div>
        <div class="vital-card-sub">${lastReg.glicemia_tipo || ''}</div>
        <div class="vital-card-sub ${glicemia !== '—' && glicemia < 180 ? 'ok' : 'warn'}">${glicemia !== '—' ? (glicemia < 180 ? 'Dentro de rango' : 'Elevada') : ''}</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Promedio últimos 3</div>
        <div class="vital-card-value">${p.registros?.length ? Math.round(p.registros.slice(0,3).reduce((a,r)=>a+(r.glicemia||0),0)/Math.min(3,p.registros.length)) : '—'}<span class="vital-card-unit">mg/dL</span></div>
        <div class="vital-card-sub">Tendencia ${glicemia !== '—' && glicemia < 155 ? 'estable' : 'alta'}</div>
        <div class="vital-card-sub ok">Control progresivo</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Adherencia</div>
        <div class="vital-card-value">${adh}%</div>
        <div class="vital-card-sub">${Math.round(adh * p.plan_dia_actual / 100)} / ${p.plan_dia_actual} registros</div>
        <div class="vital-card-sub ${adh >= 90 ? 'ok' : 'warn'}">${adh >= 90 ? 'Excelente' : 'Bueno'}</div>
      </div>
    `);
  } else if (p.plan_tipo === 'saturacion') {
    const sat = lastReg.saturacion || '—';
    const fc  = lastReg.frecuencia_cardiaca || lastReg.pulso || '—';
    cards.push(`
      <div class="vital-card">
        <div class="vital-card-label">Saturación O₂</div>
        <div class="vital-card-value">${sat}<span class="vital-card-unit">%</span></div>
        <div class="vital-card-sub ok">${lastReg.observaciones || 'Último registro'}</div>
        <div class="vital-card-sub ${sat !== '—' && sat < 92 ? 'alert' : 'ok'}">${sat !== '—' ? (sat < 92 ? '⚠ Bajo umbral (92%)' : 'Normal') : ''}</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Frecuencia cardíaca</div>
        <div class="vital-card-value">${fc}<span class="vital-card-unit">lpm</span></div>
        <div class="vital-card-sub">${fc !== '—' && fc > 90 ? 'Elevada' : 'Normal'}</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Adherencia</div>
        <div class="vital-card-value">${p.adherencia}%</div>
        <div class="vital-card-sub">${p.registros?.length || 0} / ${p.plan_dia_actual} registros</div>
        <div class="vital-card-sub ${p.adherencia >= 80 ? 'ok' : 'alert'}">${p.adherencia >= 80 ? 'Bueno' : 'Bajo cumplimiento'}</div>
      </div>
    `);
  } else {
    // Multi
    const lastPA = lastReg.presion_s ? `${lastReg.presion_s}/${lastReg.presion_d} mmHg` : '—';
    const lastFC = lastReg.frecuencia_cardiaca || lastReg.pulso || '—';
    cards.push(`
      <div class="vital-card">
        <div class="vital-card-label">Última PA</div>
        <div class="vital-card-value" style="font-size: var(--f-xl)">${lastPA}</div>
        <div class="vital-card-sub ok">Control excelente</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Frecuencia cardíaca</div>
        <div class="vital-card-value">${lastFC}<span class="vital-card-unit">lpm</span></div>
        <div class="vital-card-sub ok">Normal</div>
      </div>
      <div class="vital-card">
        <div class="vital-card-label">Adherencia</div>
        <div class="vital-card-value">${p.adherencia}%</div>
        <div class="vital-card-sub ok">Excelente</div>
      </div>
    `);
  }
  return cards.join('');
}

function getActivityIcon(name) {
  const icons = {
    'activity': '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    'check-circle': '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    'file-text': '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    'droplet': '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    'alert-triangle': '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'wind': '<svg viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
  };
  return icons[name] || icons['activity'];
}

// ── Tabs del detalle ─────────────────────────────────────────

export function switchDetailTab(tab, btnEl) {
  // Update active tab button
  document.querySelectorAll('#detail-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const content = document.getElementById('detail-tab-content');
  const patientId = document.querySelector('.patient-card.active')?.dataset.patientId;
  if (!patientId) return;

  const { MOCK_PATIENTS } = window._db;
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId);
  const lastReg = p?.registros?.[0] || {};

  if (tab === 'resumen') {
    content.innerHTML = renderTabResumen(p, lastReg, '25 de julio de 2026', '1 de agosto de 2026');
  } else if (tab === 'ficha') {
    content.innerHTML = renderTabFicha(p);
  } else if (tab === 'seguimiento') {
    content.innerHTML = renderTabSeguimiento(p);
    initCharts(p);
  } else if (tab === 'evoluciones') {
    content.innerHTML = renderTabEvoluciones(p, _isEnfermeria());
  } else if (tab === 'examenes') {
    content.innerHTML = renderTabExamenes(p);
  }
}

function renderTabFicha(p) {
  const imc = p.peso_kg && p.talla_cm ? (p.peso_kg / Math.pow(p.talla_cm / 100, 2)).toFixed(1) : '—';
  return `
  <div class="ficha-section">
    <div class="ficha-section-title">Datos personales</div>
    <div class="ficha-grid">
      <div><div class="ficha-field-label">Nombre completo</div><div class="ficha-field-value">${p.nombre}</div></div>
      <div><div class="ficha-field-label">RUT</div><div class="ficha-field-value">${p.rut}</div></div>
      <div><div class="ficha-field-label">Edad / Sexo</div><div class="ficha-field-value">${p.edad} años · ${p.sexo === 'F' ? 'Femenino' : 'Masculino'}</div></div>
      <div><div class="ficha-field-label">Ciudad</div><div class="ficha-field-value">${p.ciudad}</div></div>
      <div><div class="ficha-field-label">Teléfono</div><div class="ficha-field-value">${p.telefono}</div></div>
      <div><div class="ficha-field-label">Correo</div><div class="ficha-field-value">${p.email}</div></div>
      <div style="grid-column: span 2"><div class="ficha-field-label">Contacto de emergencia</div><div class="ficha-field-value">${p.contacto_emergencia}</div></div>
    </div>
  </div>

  <div class="ficha-section">
    <div class="ficha-section-title">Cumplimiento legal · Ley 20.584</div>
    ${_renderConsentimientoBloque(p)}
    ${(p.consentimientos || []).length ? `
      <details style="margin-top:var(--s-3)">
        <summary style="cursor:pointer;font-size:var(--f-xs);color:var(--tx-3)">Ver historial de consentimientos (${p.consentimientos.length})</summary>
        <div class="tag-list" style="margin-top:var(--s-2)">
          ${[...p.consentimientos].sort((a,b) => new Date(b.fecha_aceptacion) - new Date(a.fecha_aceptacion)).map(c => `
            <div style="font-size:var(--f-xs);color:var(--tx-3);padding:var(--s-2) 0;border-bottom:1px solid var(--bd-light);width:100%">
              v${c.version_documento} · ${new Date(c.fecha_aceptacion).toLocaleString('es-CL',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
              ${c.revocado ? ` · <span style="color:var(--alert)">Revocado el ${new Date(c.fecha_revocacion).toLocaleDateString('es-CL')}${c.motivo_revocacion ? ` — ${c.motivo_revocacion}` : ''}</span>` : ' · <span style="color:var(--ok)">Vigente</span>'}
              ${c.registrado_por_nombre ? ` · Registrado por: ${c.registrado_por_nombre}` : ''}
            </div>
          `).join('')}
        </div>
      </details>
    ` : ''}
  </div>

  <div class="ficha-section">
    <div class="ficha-section-title">Medidas antropométricas</div>
    <div class="ficha-grid">
      <div><div class="ficha-field-label">Peso</div><div class="ficha-field-value">${p.peso_kg} kg</div></div>
      <div><div class="ficha-field-label">Talla</div><div class="ficha-field-value">${p.talla_cm} cm</div></div>
      <div><div class="ficha-field-label">IMC</div><div class="ficha-field-value">${imc} kg/m²</div></div>
      <div><div class="ficha-field-label">Clasificación IMC</div><div class="ficha-field-value">${parseFloat(imc) >= 30 ? 'Obesidad grado I' : parseFloat(imc) >= 25 ? 'Sobrepeso' : 'Normal'}</div></div>
    </div>
  </div>

  <div class="ficha-section">
    <div class="ficha-section-title">Información clínica</div>
    <div>
      <div class="ficha-field-label">Diagnósticos</div>
      <div class="tag-list">${(p.diagnosticos||[]).map(d => `<span class="tag">${d}</span>`).join('')}</div>
    </div>
    <br>
    <div>
      <div class="ficha-field-label">Alergias</div>
      <div class="tag-list">${(p.alergias||[]).length ? p.alergias.map(a => `<span class="tag" style="background:var(--alert-bg);color:var(--alert-text);border-color:transparent">${a}</span>`).join('') : '<span style="font-size:var(--f-sm);color:var(--tx-3)">Sin alergias registradas</span>'}</div>
    </div>
    <br>
    <div>
      <div class="ficha-field-label">Factores de riesgo</div>
      <div class="tag-list">${(p.factores_riesgo||[]).map(f => `<span class="tag">${f}</span>`).join('')}</div>
    </div>
    <br>
    <div class="ficha-grid">
      <div style="grid-column:span 2"><div class="ficha-field-label">Antecedentes médicos</div><div class="ficha-field-value">${p.antecedentes_medicos || '—'}</div></div>
      <div style="grid-column:span 2"><div class="ficha-field-label">Antecedentes quirúrgicos</div><div class="ficha-field-value">${p.antecedentes_quirurgicos || '—'}</div></div>
      <div style="grid-column:span 2"><div class="ficha-field-label">Hábitos</div><div class="ficha-field-value">${p.habitos || '—'}</div></div>
    </div>
  </div>

  <div class="ficha-section">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div class="ficha-section-title">Medicamentos actuales</div>
      ${_isEnfermeria() ? '' : `<button class="btn btn-secondary btn-sm" onclick="app.showNuevoMedicamentoModal('${p.id}')">+ Nuevo medicamento</button>`}
    </div>
    ${(p.medicamentos || []).filter(m => m.activo !== false).map(m => `
      <div class="card card-pad-sm" style="margin-bottom: var(--s-2); display:flex; align-items:center; gap:var(--s-4)">
        <div style="width:36px;height:36px;background:var(--brand-bg);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--brand)" fill="none" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
        <div style="flex:1">
          <div style="font-size:var(--f-sm);font-weight:var(--fw-sb);color:var(--tx-1)">${m.nombre}</div>
          <div style="font-size:var(--f-xs);color:var(--tx-3)">${m.frecuencia} · Horario: ${(m.horarios || []).join(', ')}${m.fecha_inicio ? ` · Desde ${new Date(m.fecha_inicio).toLocaleDateString('es-CL', {day:'2-digit',month:'short',year:'numeric'})}` : ''}</div>
        </div>
        ${_isEnfermeria() ? '' : `<button class="btn btn-ghost btn-sm" onclick="window._discontinuarMedicamento('${p.id}','${m.id}')" title="Discontinuar">Discontinuar</button>`}
      </div>
    `).join('')}
    ${!(p.medicamentos || []).some(m => m.activo !== false) ? '<p style="font-size:var(--f-sm);color:var(--tx-3)">Sin medicamentos activos.</p>' : ''}
    ${(p.medicamentos || []).some(m => m.activo === false) ? `
      <details style="margin-top:var(--s-3)">
        <summary style="cursor:pointer;font-size:var(--f-xs);color:var(--tx-3)">Ver medicamentos discontinuados (${p.medicamentos.filter(m => m.activo === false).length})</summary>
        ${p.medicamentos.filter(m => m.activo === false).map(m => `
          <div style="font-size:var(--f-xs);color:var(--tx-3);padding:var(--s-2) 0;border-bottom:1px solid var(--bd-light)">
            <strong style="color:var(--tx-2)">${m.nombre}</strong> — ${m.frecuencia}<br>
            Desde ${new Date(m.fecha_inicio).toLocaleDateString('es-CL')} hasta ${new Date(m.fecha_fin).toLocaleDateString('es-CL')}
            ${m.motivo_termino ? ` · Motivo: ${m.motivo_termino}` : ''}
          </div>
        `).join('')}
      </details>
    ` : ''}
  </div>
  `;
}

function renderTabSeguimiento(p) {
  const registros = p.registros || [];
  return `
  ${renderEvolucionSection(p, _rangoState)}

  <div class="section-header">
    <div class="section-title">Registros recientes</div>
    <button class="btn btn-primary btn-sm" onclick="app.showNewRegistroModal('${p.id}')">
      <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Nuevo registro
    </button>
  </div>

  <div class="card" style="overflow:hidden">
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:var(--f-sm)">
      <thead>
        <tr style="border-bottom:1px solid var(--bd-light)">
          <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb);text-transform:uppercase;letter-spacing:.05em">Fecha y hora</th>
          ${p.plan_tipo === 'glicemia' ? '<th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">Glicemia</th><th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">Tipo</th>' : ''}
          ${p.plan_tipo !== 'glicemia' ? '<th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">Presión</th><th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">Pulso</th>' : ''}
          ${p.plan_tipo === 'saturacion' ? '<th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">SatO₂</th>' : ''}
          <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);font-weight:var(--fw-sb)">Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${registros.slice(0,8).map((r, i) => `
          <tr style="border-bottom:1px solid var(--bd-light);${i % 2 === 0 ? '' : 'background:var(--bg-hover)'}">
            <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2);white-space:nowrap">
              ${new Date(r.fecha).toLocaleDateString('es-CL', {day:'2-digit',month:'short'})}
              ${new Date(r.fecha).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}
            </td>
            ${r.glicemia !== undefined ? `<td style="padding:var(--s-3) var(--s-4);font-weight:var(--fw-sb)">${r.glicemia} mg/dL</td><td style="padding:var(--s-3) var(--s-4);color:var(--tx-3)">${r.glicemia_tipo||'—'}</td>` : ''}
            ${r.presion_s !== undefined ? `<td style="padding:var(--s-3) var(--s-4);font-weight:var(--fw-sb)">${r.presion_s}/${r.presion_d} mmHg</td><td style="padding:var(--s-3) var(--s-4)">${r.pulso||'—'} lpm</td>` : ''}
            ${r.saturacion !== undefined ? `<td style="padding:var(--s-3) var(--s-4);font-weight:var(--fw-sb);color:${r.saturacion < 92 ? 'var(--alert)' : 'inherit'}">${r.saturacion}%</td>` : ''}
            <td style="padding:var(--s-3) var(--s-4);color:var(--tx-3);font-size:var(--f-xs)">${r.observaciones || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
    ${registros.length === 0 ? '<div class="empty-state"><p>Sin registros aún.</p></div>' : ''}
  </div>
  `;
}

function renderTabExamenes(p) {
  const exams = p.examenes || [];
  const estadoMap = { pendiente: ['badge-warn','Pendiente'], revisado: ['badge-info','Revisado'], validado: ['badge-ok','Validado'] };
  return `
  <div class="section-header">
    <div class="section-title">Exámenes adjuntos</div>
    <button class="btn btn-primary btn-sm">
      <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Subir examen
    </button>
  </div>

  ${exams.length === 0 ? `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <h3>Sin exámenes</h3>
      <p>Aún no hay exámenes adjuntos para este paciente.</p>
    </div>
  ` : exams.map(e => {
    const [bClass, bLabel] = estadoMap[e.estado] || ['badge-neutral','—'];
    return `
      <div class="card card-pad" style="margin-bottom:var(--s-3);display:flex;align-items:center;gap:var(--s-4)">
        <div style="width:40px;height:40px;background:var(--neutral-bg);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--neutral)" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div style="flex:1">
          <div style="font-size:var(--f-sm);font-weight:var(--fw-sb)">${e.nombre}</div>
          <div style="font-size:var(--f-xs);color:var(--tx-3)">${e.tipo} · ${new Date(e.fecha).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'})}</div>
        </div>
        <span class="badge ${bClass}">${bLabel}</span>
        <button class="btn btn-ghost btn-sm">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    `;
  }).join('')}
  `;
}

export function renderTabEvoluciones(p, readOnly = false) {
  const evoluciones = [...(p.evoluciones || [])].sort((a, b) => new Date(b.fecha_evolucion) - new Date(a.fecha_evolucion));

  return `
  <div class="section-header">
    <div>
      <div class="section-title">Evoluciones médicas</div>
      <div class="section-sub">Registro clínico en formato SOAP (Subjetivo, Objetivo, Evaluación, Plan)</div>
    </div>
    ${readOnly ? '' : `
    <button class="btn btn-primary btn-sm" onclick="app.showNuevaEvolucionModal('${p.id}')">
      <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Nueva evolución
    </button>`}
  </div>

  ${evoluciones.length === 0 ? `
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
      <h3>Sin evoluciones registradas</h3>
      <p>Registra la primera evolución médica de este paciente.</p>
    </div>
  ` : evoluciones.map(ev => `
    <div class="card card-pad" style="margin-bottom:var(--s-3)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--s-3)">
        <div style="font-size:var(--f-sm);font-weight:var(--fw-sb);color:var(--tx-1)">${ev.medico_nombre || 'Médico tratante'}</div>
        <time style="font-size:var(--f-xs);color:var(--tx-3)">${new Date(ev.fecha_evolucion).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
      </div>
      <div class="ficha-grid">
        <div style="grid-column:span 2"><div class="ficha-field-label">S — Subjetivo</div><div class="ficha-field-value">${ev.subjetivo || '—'}</div></div>
        <div style="grid-column:span 2"><div class="ficha-field-label">O — Objetivo</div><div class="ficha-field-value">${ev.objetivo || '—'}</div></div>
        <div style="grid-column:span 2"><div class="ficha-field-label">A — Evaluación</div><div class="ficha-field-value">${ev.evaluacion || '—'}</div></div>
        <div style="grid-column:span 2"><div class="ficha-field-label">P — Plan</div><div class="ficha-field-value">${ev.plan || '—'}</div></div>
      </div>
    </div>
  `).join('')}
  `;
}

function initCharts(p) {
  initEvolucionCharts(p, _rangoState);
}

// ── Eventos del dashboard ────────────────────────────────────

function initDashboardEvents() {
  // Exponer para uso global
  window.selectPatient = (id) => {
    const { MOCK_PATIENTS } = window._db;
    const p = MOCK_PATIENTS.find(pt => pt.id === id);
    if (!p) return;
    window._lastSelectedPatientId = id;
    document.querySelectorAll('.patient-card').forEach(c => c.classList.toggle('active', c.dataset.patientId === id));
    const detailPanel = document.getElementById('patient-detail');
    if (detailPanel) detailPanel.innerHTML = renderPatientDetail(p);
    window._refreshPacienteView?.(id);
    logPatientAccess(id, p.nombre);
  };

  window.filterPatients = (query) => {
    const q = query.toLowerCase();
    document.querySelectorAll('.patient-card').forEach(card => {
      const searchData = card.dataset.search || '';
      card.style.display = !q || searchData.includes(q) ? '' : 'none';
    });
  };

  window.switchDetailTab = switchDetailTab;

  window._setRangoEvolucion = (range) => {
    _rangoState = { ..._rangoState, range };
    _refreshSeguimientoTab();
  };

  window._aplicarRangoPersonalizado = () => {
    const desde = document.getElementById('rango-desde')?.value;
    const hasta = document.getElementById('rango-hasta')?.value;
    if (!desde || !hasta) return;
    _rangoState = { range: 'personalizado', desde, hasta };
    _refreshSeguimientoTab();
  };
}

function _refreshSeguimientoTab() {
  const { MOCK_PATIENTS } = window._db;
  const patientId = document.querySelector('.patient-card.active')?.dataset.patientId || window._lastSelectedPatientId;
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId);
  const content = document.getElementById('detail-tab-content');
  if (!p || !content) return;
  content.innerHTML = renderTabSeguimiento(p);
  initCharts(p);
}
