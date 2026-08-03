/* ============================================================
   ARM Seguimiento Médico — Vista: Gestión de usuarios (Administrador)
   Médicos y pacientes: activar/desactivar, crear médicos
   ============================================================ */
import { getMedicos, toggleMedicoActivo, togglePacienteActivo, logAudit } from '../db.js';
import { isValidEmail, wireLiveValidation } from '../validators.js';

export async function renderAdminUsuarios(container) {
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  const { MOCK_PATIENTS } = window._db;
  const medicos = await getMedicos();

  container.innerHTML = getUsuariosHTML(medicos, MOCK_PATIENTS);

  window._toggleMedico = async (id) => {
    await toggleMedicoActivo(id);
    const m = medicos.find(x => x.id === id);
    logAudit(window._db.currentUser, 'profiles', 'UPDATE', id, { medico: m?.nombre, activo: m?.activo });
    window.app?.showToast(`${m?.nombre} ${m?.activo ? 'activado' : 'desactivado'}`, 'ok');
    renderAdminUsuarios(container);
  };

  window._togglePaciente = async (id) => {
    await togglePacienteActivo(id);
    const p = MOCK_PATIENTS.find(x => x.id === id);
    logAudit(window._db.currentUser, 'pacientes', 'UPDATE', id, { paciente: p?.nombre, activo: p?.activo });
    window.app?.showToast(`${p?.nombre} ${p?.activo ? 'activado' : 'desactivado'}`, 'ok');
    renderAdminUsuarios(container);
  };

  window._showNuevoMedicoModal = () => {
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:460px">
        <div class="modal-header">
          <h2 class="modal-title">Nuevo médico</h2>
          <button class="modal-close" onclick="document.getElementById('modal-overlay').remove()">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="input-group" style="margin-bottom:var(--s-3)">
            <label class="input-label" for="nm-nombre">Nombre completo <span style="color:var(--alert)">*</span></label>
            <input class="input" id="nm-nombre" placeholder="Dr(a). Nombre Apellido">
          </div>
          <div class="input-group" style="margin-bottom:var(--s-3)">
            <label class="input-label" for="nm-email">Correo electrónico <span style="color:var(--alert)">*</span></label>
            <input class="input" type="email" id="nm-email" placeholder="medico@arm.cl">
          </div>
          <div class="input-group" style="margin-bottom:var(--s-3)">
            <label class="input-label" for="nm-especialidad">Especialidad</label>
            <input class="input" id="nm-especialidad" placeholder="Médico General">
          </div>
          <div class="input-group">
            <label class="input-label" for="nm-registro">N.º de registro</label>
            <input class="input" id="nm-registro" placeholder="123456" inputmode="numeric" pattern="[0-9]*" oninput="this.value=this.value.replace(/\\D/g,'')">
          </div>
          <div id="nm-error" style="color:var(--alert);font-size:var(--f-xs);margin-top:var(--s-2)"></div>
          <div style="background:var(--brand-bg);border:1px solid var(--brand-light);border-radius:var(--r-sm);padding:var(--s-3);font-size:var(--f-xs);color:var(--brand-hover);margin-top:var(--s-3)">
            <strong>ℹ️ Nota:</strong> En producción, esto envía una invitación por correo mediante Supabase Auth. En modo demo se agrega directamente a la lista.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="window._guardarNuevoMedico()">Crear médico</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    wireLiveValidation('nm-email', isValidEmail, 'Correo electrónico inválido');
  };

  window._guardarNuevoMedico = async () => {
    const nombre = document.getElementById('nm-nombre')?.value.trim();
    const email = document.getElementById('nm-email')?.value.trim();
    const especialidad = document.getElementById('nm-especialidad')?.value.trim();
    const numero_registro = document.getElementById('nm-registro')?.value.trim();
    const errEl = document.getElementById('nm-error');

    if (!nombre) { errEl.textContent = 'El nombre es obligatorio'; return; }
    if (!isValidEmail(email)) { errEl.textContent = 'Ingresa un correo electrónico válido'; return; }

    const { crearMedico } = await import('../db.js');
    const nuevo = await crearMedico({ nombre, email, especialidad, numero_registro });
    logAudit(window._db.currentUser, 'profiles', 'INSERT', nuevo.id, { medico: nombre, email });

    document.getElementById('modal-overlay')?.remove();
    window.app?.showToast(`Médico ${nombre} creado`, 'ok');
    renderAdminUsuarios(container);
  };
}

function getUsuariosHTML(medicos, pacientes) {
  return `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">PANEL DE ADMINISTRACIÓN</div>
      <h1 class="view-header-title">Gestión de usuarios</h1>
      <p class="view-header-sub">Médicos y pacientes registrados en la plataforma.</p>
    </div>
    <div class="view-header-actions">
      <button class="btn btn-primary" onclick="window._showNuevoMedicoModal()">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo médico
      </button>
    </div>
  </div>

  <div class="page-content">
    <div class="section-header"><div class="section-title">Médicos</div></div>
    <div class="card" style="overflow:hidden;margin-bottom:var(--s-5)">
      ${medicos.map(m => `
        <div class="activity-item" style="align-items:center">
          <div class="activity-icon brand">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div class="activity-body">
            <strong>${m.nombre}${!m.activo ? ' <span class="badge badge-neutral">Inactivo</span>' : ''}</strong>
            <p>${m.especialidad} · ${m.email}</p>
          </div>
          <button class="btn ${m.activo ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="window._toggleMedico('${m.id}')">
            ${m.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      `).join('')}
    </div>

    <div class="section-header"><div class="section-title">Pacientes</div></div>
    <div class="card" style="overflow:hidden">
      ${pacientes.map(p => `
        <div class="activity-item" style="align-items:center">
          <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
          <div class="activity-body">
            <strong>${p.nombre}${p.activo === false ? ' <span class="badge badge-neutral">Inactivo</span>' : ''}</strong>
            <p>${p.rut} · ${p.diagnostico_principal}</p>
          </div>
          <button class="btn ${p.activo !== false ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="window._togglePaciente('${p.id}')">
            ${p.activo !== false ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      `).join('')}
    </div>
  </div>
  `;
}
