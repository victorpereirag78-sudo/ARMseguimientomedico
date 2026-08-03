/* ============================================================
   ARM Seguimiento Médico — Vista: Mi perfil (paciente)
   Datos de contacto editables + estado de consentimiento informado
   ============================================================ */
import { logAudit } from '../db.js';
import { isValidTelefono, isValidEmail, wireLiveValidation } from '../validators.js';
import { fieldError } from '../modals.js';

export function renderPerfilView(container, patientId) {
  const { MOCK_PATIENTS } = window._db;
  const p = MOCK_PATIENTS.find(pt => pt.id === patientId);

  if (!p) {
    container.innerHTML = `<div class="empty-state"><h3>Sin datos</h3><p>No se encontró información de paciente asociada a esta cuenta.</p></div>`;
    return;
  }

  container.innerHTML = getPerfilHTML(p);

  wireLiveValidation('pf-telefono', isValidTelefono, 'Teléfono inválido — ej: +56 9 1234 5678');
  wireLiveValidation('pf-email', isValidEmail, 'Correo electrónico inválido');

  window._guardarPerfil = () => {
    const telefono = document.getElementById('pf-telefono')?.value.trim() || '';
    const email    = document.getElementById('pf-email')?.value.trim() || '';

    if (telefono && !isValidTelefono(telefono)) {
      fieldError('pf-telefono', 'Teléfono inválido — ej: +56 9 1234 5678');
      return;
    }
    if (email && !isValidEmail(email)) {
      fieldError('pf-email', 'Correo electrónico inválido');
      return;
    }

    p.telefono               = telefono || p.telefono;
    p.email                  = email || p.email;
    p.ciudad                = document.getElementById('pf-ciudad')?.value.trim() || p.ciudad;
    p.direccion              = document.getElementById('pf-direccion')?.value.trim() || '';
    p.contacto_emergencia    = document.getElementById('pf-contacto')?.value.trim() || p.contacto_emergencia;

    logAudit(window._db.currentUser, 'pacientes', 'UPDATE', p.id, {
      paciente: p.nombre,
      campos: 'telefono, email, ciudad, direccion, contacto_emergencia',
    });

    window.app?.showToast('Perfil actualizado correctamente', 'ok');
    renderPerfilView(container, patientId);
  };

  window._otorgarMiConsentimiento = () => {
    if (!confirm('¿Confirmas que otorgas tu consentimiento informado para el tratamiento de tu información clínica conforme a la Ley N.º 20.584?')) return;
    p.consentimiento_informado = true;
    p.fecha_consentimiento = new Date().toISOString();

    logAudit(window._db.currentUser, 'pacientes', 'UPDATE', p.id, {
      paciente: p.nombre,
      consentimiento_informado: true,
    });

    window.app?.showToast('Consentimiento informado registrado', 'ok');
    renderPerfilView(container, patientId);
  };
}

function getPerfilHTML(p) {
  return `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">MI CUENTA</div>
      <h1 class="view-header-title">Mi perfil</h1>
      <p class="view-header-sub">Revisa y actualiza tus datos de contacto.</p>
    </div>
  </div>

  <div class="page-content">
    <!-- Consentimiento informado -->
    <div class="ficha-section" style="margin-bottom:var(--s-4)">
      <div class="ficha-section-title">Consentimiento informado · Ley 20.584</div>
      ${p.consentimiento_informado ? `
        <div style="display:flex;align-items:center;gap:var(--s-2);color:var(--ok)">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style="font-size:var(--f-sm)">Otorgaste tu consentimiento el ${new Date(p.fecha_consentimiento).toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</span>
        </div>
      ` : `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:var(--s-2);color:var(--alert)">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style="font-size:var(--f-sm)">Aún no has otorgado tu consentimiento informado</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window._otorgarMiConsentimiento()">Otorgar consentimiento</button>
        </div>
      `}
    </div>

    <!-- Datos personales (solo lectura) -->
    <div class="ficha-section" style="margin-bottom:var(--s-4)">
      <div class="ficha-section-title">Datos personales</div>
      <div class="ficha-grid">
        <div><div class="ficha-field-label">Nombre completo</div><div class="ficha-field-value">${p.nombre}</div></div>
        <div><div class="ficha-field-label">RUT</div><div class="ficha-field-value">${p.rut}</div></div>
        <div><div class="ficha-field-label">Edad / Sexo</div><div class="ficha-field-value">${p.edad} años · ${p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}</div></div>
      </div>
      <p style="font-size:var(--f-xs);color:var(--tx-3);margin-top:var(--s-2)">Estos datos solo pueden ser modificados por tu médico tratante.</p>
    </div>

    <!-- Datos de contacto (editables) -->
    <div class="ficha-section">
      <div class="ficha-section-title">Datos de contacto</div>
      <div class="form-grid-2">
        <div class="input-group">
          <label class="input-label" for="pf-telefono">Teléfono</label>
          <input class="input" id="pf-telefono" type="tel" value="${p.telefono || ''}">
        </div>
        <div class="input-group">
          <label class="input-label" for="pf-email">Correo electrónico</label>
          <input class="input" id="pf-email" type="email" value="${p.email || ''}">
        </div>
        <div class="input-group">
          <label class="input-label" for="pf-ciudad">Ciudad</label>
          <input class="input" id="pf-ciudad" value="${p.ciudad || ''}">
        </div>
        <div class="input-group">
          <label class="input-label" for="pf-direccion">Dirección</label>
          <input class="input" id="pf-direccion" value="${p.direccion || ''}" placeholder="Calle, número, comuna">
        </div>
        <div class="input-group" style="grid-column:span 2">
          <label class="input-label" for="pf-contacto">Contacto de emergencia</label>
          <input class="input" id="pf-contacto" value="${p.contacto_emergencia || ''}" placeholder="Nombre (relación) — Teléfono">
        </div>
      </div>
      <div style="margin-top:var(--s-4)">
        <button class="btn btn-primary" onclick="window._guardarPerfil()">Guardar cambios</button>
      </div>
    </div>
  </div>
  `;
}
