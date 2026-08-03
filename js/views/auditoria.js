/* ============================================================
   ARM Seguimiento Médico — Vista: Auditoría (solo Administrador)
   Trazabilidad de accesos y modificaciones (Ley 20.584)
   ============================================================ */
import { getAuditoria } from '../db.js';

const OPERACION_LABEL = {
  INSERT: ['badge-ok', 'Creación'],
  UPDATE: ['badge-warn', 'Modificación'],
  DELETE: ['badge-alert', 'Eliminación'],
  SELECT: ['badge-neutral', 'Consulta'],
};

const TABLA_LABEL = {
  pacientes: 'Ficha de paciente',
  fichas_clinicas: 'Ficha clínica',
  registros_clinicos: 'Registro clínico',
  evoluciones: 'Evolución médica (SOAP)',
  alertas: 'Alerta clínica',
  notificaciones: 'Notificación',
  examenes: 'Examen',
  profiles: 'Usuario / perfil',
  config_alertas: 'Umbrales de alerta',
};

export async function renderAuditoria(container) {
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  const registros = await getAuditoria();
  container.innerHTML = getAuditoriaHTML(registros);
}

function getAuditoriaHTML(registros) {
  return `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">CUMPLIMIENTO · LEY 20.584</div>
      <h1 class="view-header-title">Auditoría de cambios</h1>
      <p class="view-header-sub">Registro de quién, cuándo y qué se modificó en la información clínica de los pacientes.</p>
    </div>
  </div>

  <div class="page-content">
    ${registros.length === 0 ? `
      <div class="empty-state" style="padding:5rem 0">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3>Sin actividad registrada</h3>
        <p>Aún no hay eventos de auditoría.</p>
      </div>
    ` : `
      <div class="card" style="overflow:hidden">
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:var(--f-sm)">
          <thead>
            <tr style="border-bottom:1px solid var(--bd-light)">
              <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Fecha y hora</th>
              <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Usuario</th>
              <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Tabla</th>
              <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Operación</th>
              <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Detalle</th>
            </tr>
          </thead>
          <tbody>
            ${registros.map((r, i) => {
              const [badgeClass, opLabel] = OPERACION_LABEL[r.operacion] || ['badge-neutral', r.operacion];
              const tablaLabel = TABLA_LABEL[r.tabla] || r.tabla;
              const detalle = _resumenDatos(r.datos_nuevos);
              return `
              <tr style="border-bottom:1px solid var(--bd-light);${i % 2 === 0 ? '' : 'background:var(--bg-hover)'}">
                <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2);white-space:nowrap">
                  ${new Date(r.created_at).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style="padding:var(--s-3) var(--s-4)">
                  <div style="font-weight:var(--fw-sb)">${r.usuario_nombre || '—'}</div>
                  <div style="font-size:var(--f-xs);color:var(--tx-3)">${r.usuario_role || ''}</div>
                </td>
                <td style="padding:var(--s-3) var(--s-4)">${tablaLabel}</td>
                <td style="padding:var(--s-3) var(--s-4)"><span class="badge ${badgeClass}">${opLabel}</span></td>
                <td style="padding:var(--s-3) var(--s-4);color:var(--tx-3);font-size:var(--f-xs)">${detalle}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `}
  </div>
  `;
}

function _resumenDatos(datos) {
  if (!datos) return '—';
  return Object.entries(datos).map(([k, v]) => `${k}: ${v}`).join(' · ');
}
