/* ============================================================
   ARM Seguimiento Médico — Vista: Pacientes (Secretaría)
   Solo datos de contacto/agenda — SIN información clínica
   (diagnósticos, medicamentos, registros, evoluciones).
   ============================================================ */

export function renderSecretariaPacientes(container) {
  const { MOCK_PATIENTS, currentUser } = window._db;
  const medicoId = currentUser?.medico_id;
  const pacientes = MOCK_PATIENTS.filter(p => !medicoId || p.medico_id === medicoId);

  container.innerHTML = `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">AGENDA Y CONTACTO</div>
      <h1 class="view-header-title">Pacientes</h1>
      <p class="view-header-sub">Datos de contacto y próximos controles. No incluye información clínica.</p>
    </div>
  </div>

  <div class="page-content">
    <div class="card" style="overflow:hidden">
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:var(--f-sm)">
        <thead>
          <tr style="border-bottom:1px solid var(--bd-light)">
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Paciente</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Teléfono</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Correo</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Ciudad</th>
            <th style="padding:var(--s-3) var(--s-4);text-align:left;font-size:var(--f-xs);color:var(--tx-3);text-transform:uppercase;letter-spacing:.05em">Próximo control</th>
          </tr>
        </thead>
        <tbody>
          ${pacientes.map((p, i) => `
            <tr style="border-bottom:1px solid var(--bd-light);${i % 2 === 0 ? '' : 'background:var(--bg-hover)'}">
              <td style="padding:var(--s-3) var(--s-4)">
                <div style="display:flex;align-items:center;gap:var(--s-2)">
                  <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
                  <strong>${p.nombre}</strong>
                </div>
              </td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.telefono || '—'}</td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.email || '—'}</td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.ciudad || '—'}</td>
              <td style="padding:var(--s-3) var(--s-4);color:var(--tx-2)">${p.proxima_cita ? new Date(p.proxima_cita).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
      ${pacientes.length === 0 ? '<div class="empty-state"><p>Sin pacientes asignados.</p></div>' : ''}
    </div>
  </div>
  `;
}
