/* ============================================================
   ARM Seguimiento Médico — Vista: Pacientes (Administrador)
   Listado global de pacientes de todos los médicos
   ============================================================ */
import { getMedicos } from '../db.js';

export async function renderAdminPacientes(container) {
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  const { MOCK_PATIENTS } = window._db;
  const medicos = await getMedicos();
  const medicoMap = Object.fromEntries(medicos.map(m => [m.id, m.nombre]));

  const badgeMap = {
    por_revisar: ['badge-warn', 'Por revisar'],
    al_dia: ['badge-ok', 'Al día'],
    atencion: ['badge-alert', 'Atención'],
  };

  container.innerHTML = `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">PANEL DE ADMINISTRACIÓN</div>
      <h1 class="view-header-title">Pacientes del sistema</h1>
      <p class="view-header-sub">${MOCK_PATIENTS.length} pacientes registrados, de todos los médicos.</p>
    </div>
  </div>

  <div class="page-content">
    <div class="card" style="overflow:hidden">
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:var(--f-sm)">
        <thead>
          <tr style="border-bottom:1px solid var(--bd-light)">
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Paciente</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">RUT</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Médico tratante</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Diagnóstico</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Estado</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Adherencia</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:right;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_PATIENTS.map((p, i) => {
            const [bClass, bLabel] = badgeMap[p.estado] || ['badge-neutral', p.estado];
            return `
            <tr style="border-bottom:1px solid var(--bd-light);${i % 2 === 0 ? '' : 'background:var(--bg-hover)'}">
              <td style="padding:var(--s-3) var(--s-4)">
                <div style="display:flex;align-items:center;gap:var(--s-2)">
                  <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
                  <div>
                    <div style="font-weight:var(--fw-sb)">${p.nombre}${p.activo === false ? ' <span class="badge badge-neutral" style="margin-left:4px">Inactivo</span>' : ''}</div>
                    <div style="font-size:var(--f-xs);color:var(--tx-3)">${p.edad} años · ${p.ciudad}</div>
                  </div>
                </div>
              </td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.rut}</td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${medicoMap[p.medico_id] || '—'}</td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.diagnostico_principal}</td>
              <td style="padding:var(--s-3) var(--s-4)"><span class="badge ${bClass}">${bLabel}</span></td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.adherencia}%</td>
              <td style="padding:var(--s-3) var(--s-4);text-align:right">
                <button class="btn btn-secondary btn-sm" onclick="window._verPacienteAdmin('${p.id}')">Ver ficha</button>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
      </div>
    </div>
  </div>
  `;

  window._verPacienteAdmin = (id) => {
    window._lastSelectedPatientId = id;
    window.app.navigate('paciente-view');
  };
}
