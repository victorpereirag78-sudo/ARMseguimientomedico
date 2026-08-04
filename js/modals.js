/* ============================================================
   ARM Seguimiento Médico — Módulo de Modales
   • showNewFichaModal()           → Nueva ficha clínica (3 pasos)
   • showNuevoRegistroModal(id)    → Nuevo registro vital
   ============================================================ */
import { logAudit } from './db.js';
import { isValidRut, formatRut, isValidTelefono, isValidEmail, wireLiveValidation } from './validators.js';

// ── UTILIDADES COMUNES ───────────────────────────────────────

/** Abre un modal reemplazando el overlay existente */
function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id    = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = html;
  // Click fuera cierra
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  // Focus al primer campo
  requestAnimationFrame(() => {
    const first = overlay.querySelector('input:not([type="hidden"]):not([type="checkbox"]), select, textarea');
    first?.focus();
  });
}

export function closeModal() {
  document.getElementById('modal-overlay')?.remove();
}

// ════════════════════════════════════════════════════════════
//  CERRAR SESIÓN
// ════════════════════════════════════════════════════════════

export function showLogoutConfirmModal() {
  openModal(`
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <h2 class="modal-title">Cerrar sesión</h2>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:var(--f-sm);color:var(--tx-2)">¿Deseas cerrar tu sesión en ARM Seguimiento Médico?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" onclick="window._confirmLogout()">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  `);
}
window.closeModal = closeModal;

/** Registra una entrada de auditoría con el usuario actualmente autenticado */
function auditLog(tabla, operacion, registroId, datosNuevos) {
  logAudit(window._db.currentUser, tabla, operacion, registroId, datosNuevos);
}

/** Agrega una notificación al mock y refresca el badge de la campana si está visible */
function pushNotif(notif) {
  if (!window._db.MOCK_NOTIFICACIONES) window._db.MOCK_NOTIFICACIONES = [];
  window._db.MOCK_NOTIFICACIONES.unshift({
    id: 'n_' + Date.now() + Math.random().toString(36).slice(2, 6),
    leida: false,
    created_at: new Date().toISOString(),
    ...notif,
  });
  window.app?.renderNotifBadge?.();
}

/** Marca un campo como inválido y muestra mensaje */
export function fieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('error');
  let err = el.parentElement.querySelector('.field-error');
  if (!err) { err = document.createElement('span'); err.className = 'field-error'; el.parentElement.appendChild(err); }
  err.textContent = msg;
  el.focus();
  el.addEventListener('input', () => { el.classList.remove('error'); err.remove(); }, { once: true });
}

// ════════════════════════════════════════════════════════════
//  1. NUEVA FICHA CLÍNICA — 3 pasos
// ════════════════════════════════════════════════════════════

let _fichaStep  = 1;
let _fichaData  = {};

export function showNewFichaModal() {
  _fichaStep = 1;
  _fichaData = {};
  _renderFichaModal();
}

function _renderFichaModal() {
  const STEP_LABELS = ['Datos personales', 'Información clínica', 'Plan de seguimiento'];
  const isLast = _fichaStep === 3;

  const stepsHTML = STEP_LABELS.map((label, i) => {
    const n = i + 1;
    const cls = n === _fichaStep ? 'active' : n < _fichaStep ? 'done' : '';
    const num = n < _fichaStep ? '✓' : n;
    const line = i < STEP_LABELS.length - 1 ? '<div class="modal-step-line"></div>' : '';
    return `<div class="modal-step ${cls}"><div class="modal-step-num">${num}</div><span>${label}</span></div>${line}`;
  }).join('');

  const contentMap = { 1: _step1HTML(), 2: _step2HTML(), 3: _step3HTML() };

  openModal(`
    <div class="modal" style="max-width:620px">
      <div class="modal-header">
        <h2 class="modal-title">Nueva ficha clínica</h2>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal-steps">${stepsHTML}</div>

      <div class="modal-body" style="max-height:60vh;overflow-y:auto">
        ${contentMap[_fichaStep]}
      </div>

      <div class="modal-footer">
        ${_fichaStep > 1
          ? '<button class="btn btn-ghost" onclick="window._fichaBack()">← Atrás</button>'
          : '<div></div>'}
        <div style="display:flex;gap:var(--s-2)">
          <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="${isLast ? 'window._fichaGuardar()' : 'window._fichaSiguiente()'}">
            ${isLast
              ? '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar ficha'
              : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  `);

  // Restaurar valores guardados
  Object.keys(_fichaData).forEach(key => {
    const el = document.getElementById(`f-${key}`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!_fichaData[key];
    else el.value = _fichaData[key];
  });

  window._actualizarImcPreview();

  if (_fichaStep === 1) {
    wireLiveValidation('f-rut', isValidRut, 'RUT inválido — revisa el dígito verificador', { formatFn: formatRut });
    wireLiveValidation('f-telefono', isValidTelefono, 'Teléfono inválido — ej: +56 9 1234 5678');
    wireLiveValidation('f-email', isValidEmail, 'Correo electrónico inválido');
  }
}

/** Calcula y muestra el IMC en vivo mientras se ingresan peso/talla */
window._actualizarImcPreview = function() {
  const el = document.getElementById('f-imc-preview');
  if (!el) return;
  const peso = parseFloat(document.getElementById('f-peso')?.value);
  const talla = parseFloat(document.getElementById('f-talla')?.value);
  if (!peso || !talla) { el.textContent = ''; return; }

  const imc = peso / Math.pow(talla / 100, 2);
  const clasificacion = imc < 18.5 ? 'Bajo peso'
    : imc < 25 ? 'Normal'
    : imc < 30 ? 'Sobrepeso'
    : 'Obesidad';

  el.innerHTML = `<strong style="color:var(--tx-1)">IMC: ${imc.toFixed(1)} kg/m²</strong> · ${clasificacion}`;
};

/* ── Contenido de cada paso ────────────────────────────────── */

function _step1HTML() {
  return `
  <div class="form-step-title">Paso 1 de 3 — Datos del paciente</div>
  <div class="form-grid-2">
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-nombre">Nombre completo <span style="color:var(--alert)">*</span></label>
      <input class="input" id="f-nombre" placeholder="Ej: María González Pérez" autocomplete="off">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-rut">RUT</label>
      <input class="input" id="f-rut" placeholder="12.345.678-9">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-fecha_nac">Fecha de nacimiento</label>
      <input class="input" type="date" id="f-fecha_nac" max="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-sexo">Sexo</label>
      <select class="select" id="f-sexo">
        <option value="">— Seleccionar —</option>
        <option value="F">Femenino</option>
        <option value="M">Masculino</option>
        <option value="O">Otro / No especifica</option>
      </select>
    </div>
    <div class="input-group">
      <label class="input-label" for="f-ciudad">Ciudad</label>
      <input class="input" id="f-ciudad" placeholder="Ej: Rancagua">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-telefono">Teléfono</label>
      <input class="input" id="f-telefono" placeholder="+56 9 1234 5678" type="tel">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-email">Correo electrónico</label>
      <input class="input" type="email" id="f-email" placeholder="paciente@correo.cl">
    </div>
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-contacto">Contacto de emergencia</label>
      <input class="input" id="f-contacto" placeholder="Nombre (relación) — Teléfono">
    </div>
  </div>`;
}

function _step2HTML() {
  return `
  <div class="form-step-title">Paso 2 de 3 — Información clínica</div>
  <div class="form-grid-2">
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-diag_principal">Diagnóstico principal <span style="color:var(--alert)">*</span></label>
      <input class="input" id="f-diag_principal" placeholder="Ej: Hipertensión Arterial">
    </div>
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-diagnosticos">
        Todos los diagnósticos
        <span style="color:var(--tx-4);font-weight:var(--fw-r)"> — uno por línea, con código CIE si aplica</span>
      </label>
      <textarea class="textarea" id="f-diagnosticos" rows="3"
        placeholder="Hipertensión Arterial (I10)&#10;Hipotiroidismo primario (E03.9)"></textarea>
    </div>
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-alergias">
        Alergias
        <span style="color:var(--tx-4);font-weight:var(--fw-r)"> — una por línea</span>
      </label>
      <textarea class="textarea" id="f-alergias" rows="2"
        placeholder="Ibuprofeno&#10;Penicilina&#10;Sulfonamidas"></textarea>
    </div>
    <div class="input-group">
      <label class="input-label" for="f-peso">Peso (kg)</label>
      <input class="input" type="number" id="f-peso" placeholder="70.0" step="0.1" min="20" max="300" oninput="window._actualizarImcPreview()">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-talla">Talla (cm)</label>
      <input class="input" type="number" id="f-talla" placeholder="165" min="100" max="230" oninput="window._actualizarImcPreview()">
    </div>
    <div class="input-group" style="grid-column:span 2">
      <div id="f-imc-preview" style="font-size:var(--f-xs);color:var(--tx-3);min-height:1.2em"></div>
    </div>
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-antec_med">Antecedentes médicos</label>
      <textarea class="textarea" id="f-antec_med" rows="2"
        placeholder="Ej: DM2 en seguimiento, Dislipidemia controlada..."></textarea>
    </div>
    <div class="input-group">
      <label class="input-label" for="f-antec_qx">Antecedentes quirúrgicos</label>
      <input class="input" id="f-antec_qx" placeholder="Ej: Colecistectomía 2018 / Ninguno">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-habitos">Hábitos / Factores de riesgo</label>
      <input class="input" id="f-habitos" placeholder="Ej: Exfumador, sedentario, dieta sin sal">
    </div>
  </div>`;
}

function _step3HTML() {
  const hoy = new Date();
  const en7 = new Date(hoy); en7.setDate(hoy.getDate() + 7);
  const fmt = d => d.toISOString().split('T')[0];

  return `
  <div class="form-step-title">Paso 3 de 3 — Plan de seguimiento</div>
  <div class="form-grid-2">
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-plan_tipo">
        Tipo de seguimiento <span style="color:var(--alert)">*</span>
      </label>
      <select class="select" id="f-plan_tipo">
        <option value="">— Seleccionar tipo —</option>
        <option value="presion">🩺 Monitoreo de presión arterial</option>
        <option value="glicemia">🩸 Control glicémico (diabetes)</option>
        <option value="saturacion">💨 Síntomas y saturación (EPOC / IC)</option>
        <option value="multi">📊 Múltiples indicadores (post-quirúrgico / cardiológico)</option>
      </select>
    </div>
    <div class="input-group">
      <label class="input-label" for="f-plan_dias">Duración del plan (días)</label>
      <input class="input" type="number" id="f-plan_dias" value="7" min="1" max="365">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-plan_frecuencia">Frecuencia de registros</label>
      <select class="select" id="f-plan_frecuencia">
        <option value="diaria">Una vez al día</option>
        <option value="2x_dia" selected>Dos veces al día (mañana y noche)</option>
        <option value="semanal">Semanal</option>
      </select>
    </div>
    <div class="input-group">
      <label class="input-label" for="f-inicio">Fecha de inicio</label>
      <input class="input" type="date" id="f-inicio" value="${fmt(hoy)}">
    </div>
    <div class="input-group">
      <label class="input-label" for="f-control">Fecha de control</label>
      <input class="input" type="date" id="f-control" value="${fmt(en7)}">
    </div>
    <div class="input-group" style="grid-column:span 2">
      <label class="input-label" for="f-instrucciones">Instrucciones para el paciente</label>
      <textarea class="textarea" id="f-instrucciones" rows="3"
        placeholder="Ej: Tomar la presión sentado, después de 5 minutos de reposo. Registrar en ayunas por las mañanas y antes de dormir..."></textarea>
    </div>
  </div>
  <div style="background:var(--brand-bg);border:1px solid var(--brand-light);border-radius:var(--r-sm);padding:var(--s-3) var(--s-4);font-size:var(--f-xs);color:var(--brand-hover);margin-bottom:var(--s-3)">
    <strong>ℹ️ Nota:</strong> El paciente recibirá acceso a su panel personal donde podrá ingresar sus registros diariamente.
  </div>
  <label class="sintoma-check" style="align-items:flex-start;padding:var(--s-3) var(--s-4);border:1px solid var(--bd-light);border-radius:var(--r-sm)">
    <input type="checkbox" id="f-consentimiento">
    <span style="font-size:var(--f-xs);color:var(--tx-2)">
      <strong style="color:var(--tx-1)">Consentimiento informado <span style="color:var(--alert)">*</span></strong><br>
      El paciente (o su representante legal) autoriza el registro, almacenamiento y tratamiento de su información clínica en esta plataforma, conforme a la Ley N.º 20.584 sobre derechos y deberes de los pacientes.
    </span>
  </label>`;
}

/* ── Navegación entre pasos ─────────────────────────────────── */

function _collectCurrentStep() {
  const fields = {
    1: ['nombre','rut','fecha_nac','sexo','ciudad','telefono','email','contacto'],
    2: ['diag_principal','diagnosticos','alergias','peso','talla','antec_med','antec_qx','habitos'],
    3: ['plan_tipo','plan_dias','plan_frecuencia','inicio','control','instrucciones','consentimiento'],
  };
  (fields[_fichaStep] || []).forEach(key => {
    const el = document.getElementById(`f-${key}`);
    if (!el) return;
    _fichaData[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
}

window._fichaSiguiente = function() {
  _collectCurrentStep();
  // Validar paso 1
  if (_fichaStep === 1) {
    if (!_fichaData.nombre?.trim()) {
      fieldError('f-nombre', 'El nombre es obligatorio');
      return;
    }
    if (_fichaData.rut?.trim() && !isValidRut(_fichaData.rut)) {
      fieldError('f-rut', 'RUT inválido — revisa el dígito verificador');
      return;
    }
    if (_fichaData.telefono?.trim() && !isValidTelefono(_fichaData.telefono)) {
      fieldError('f-telefono', 'Teléfono inválido — ej: +56 9 1234 5678');
      return;
    }
    if (_fichaData.email?.trim() && !isValidEmail(_fichaData.email)) {
      fieldError('f-email', 'Correo electrónico inválido');
      return;
    }
    if (_fichaData.rut?.trim()) {
      _fichaData.rut = formatRut(_fichaData.rut);
    }
  }
  // Validar paso 2
  if (_fichaStep === 2 && !_fichaData.diag_principal?.trim()) {
    fieldError('f-diag_principal', 'Ingresa al menos el diagnóstico principal');
    return;
  }
  _fichaStep++;
  _renderFichaModal();
};

window._fichaBack = function() {
  _collectCurrentStep();
  _fichaStep--;
  _renderFichaModal();
};

window._fichaGuardar = function() {
  _collectCurrentStep();

  // Validar paso 3
  if (!_fichaData.plan_tipo) {
    fieldError('f-plan_tipo', 'Selecciona el tipo de seguimiento');
    return;
  }
  if (!_fichaData.consentimiento) {
    fieldError('f-consentimiento', 'Se requiere el consentimiento informado del paciente para continuar');
    return;
  }

  // Construir objeto paciente
  const colors = ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ec4899','#ef4444'];
  const initials = (_fichaData.nombre || 'NN')
    .split(' ').filter(w => /[A-ZÁÉÍÓÚÑ]/i.test(w[0])).slice(0,2)
    .map(w => w[0].toUpperCase()).join('');

  const dias  = parseInt(_fichaData.plan_dias) || 7;
  const hoy   = new Date();
  const fin   = _fichaData.control
    ? new Date(_fichaData.control)
    : (() => { const d = new Date(hoy); d.setDate(d.getDate() + dias); return d; })();

  const planNombres = {
    presion:    'Monitoreo de presión arterial',
    glicemia:   'Control glicémico',
    saturacion: 'Síntomas y saturación',
    multi:      'Seguimiento múltiple',
  };

  const edad = _fichaData.fecha_nac
    ? Math.floor((hoy - new Date(_fichaData.fecha_nac)) / (365.25 * 24 * 3600 * 1000))
    : 0;

  const newPatient = {
    id: 'p_' + Date.now(),
    nombre:               (_fichaData.nombre || '').trim(),
    rut:                  _fichaData.rut || '—',
    edad,
    sexo:                 _fichaData.sexo || 'M',
    ciudad:               _fichaData.ciudad || '—',
    email:                _fichaData.email || '',
    telefono:             _fichaData.telefono || '—',
    diagnostico_principal: _fichaData.diag_principal || '—',
    patologias:           (_fichaData.diagnosticos||'').split('\n').map(s=>s.trim()).filter(Boolean),
    alergias:             (_fichaData.alergias||'').split('\n').map(s=>s.trim()).filter(Boolean),
    diagnosticos:         (_fichaData.diagnosticos||'').split('\n').map(s=>s.trim()).filter(Boolean),
    antecedentes_medicos: _fichaData.antec_med || '',
    antecedentes_quirurgicos: _fichaData.antec_qx || '',
    habitos:              _fichaData.habitos || '',
    factores_riesgo:      [],
    peso_kg:              parseFloat(_fichaData.peso) || 0,
    talla_cm:             parseFloat(_fichaData.talla) || 0,
    contacto_emergencia:  _fichaData.contacto || '',
    consentimientos: [{
      id: 'cons_' + Date.now(),
      version_documento: '1.0',
      aceptado: true,
      fecha_aceptacion: hoy.toISOString(),
      registrado_por_nombre: `${window._db.currentUser?.nombre || 'Médico tratante'} (médico)`,
      revocado: false,
    }],
    plan_nombre:          `${planNombres[_fichaData.plan_tipo]} · ${dias} días`,
    plan_tipo:            _fichaData.plan_tipo,
    plan_inicio:          _fichaData.inicio || hoy.toISOString().split('T')[0],
    plan_fin:             fin.toISOString().split('T')[0],
    plan_dias_total:      dias,
    plan_dia_actual:      0,
    plan_instrucciones:   _fichaData.instrucciones || '',
    estado:               'al_dia',
    ultima_lectura:       hoy.toISOString(),
    adherencia:           0,
    avatar_bg:            colors[window._db.MOCK_PATIENTS.length % colors.length],
    avatar:               initials || 'NP',
    medicamentos:         [],
    registros:            [],
    actividad_reciente:   [{
      tipo: 'nuevo', icono: 'file-text', color: 'brand',
      titulo: 'Ficha clínica creada',
      desc: `Diagnóstico: ${_fichaData.diag_principal || '—'}`,
      tiempo: 'Ahora',
    }],
    examenes:             [],
    proxima_cita:         fin.toISOString().split('T')[0],
    prox_accion_titulo:   'Primer registro del paciente',
    prox_accion_desc:     'Aún no hay registros. Invita al paciente a ingresar su primer control.',
  };

  // Agregar al mock data
  window._db.MOCK_PATIENTS.unshift(newPatient);

  auditLog('pacientes', 'INSERT', newPatient.id, {
    paciente: newPatient.nombre,
    diagnostico: newPatient.diagnostico_principal,
  });
  auditLog('consentimientos', 'INSERT', newPatient.consentimientos[0].id, {
    paciente: newPatient.nombre,
    version: newPatient.consentimientos[0].version_documento,
  });

  // Actualizar stats
  window._db.MOCK_STATS = {
    ...window._db.MOCK_STATS,
    pacientes_activos: window._db.MOCK_PATIENTS.length,
    nuevos_semana: (window._db.MOCK_STATS.nuevos_semana || 0) + 1,
  };

  closeModal();
  app.showToast(`Ficha de ${newPatient.nombre} creada`, 'ok');
  app.navigate('pacientes');
};


// ════════════════════════════════════════════════════════════
//  2. NUEVO REGISTRO VITAL
// ════════════════════════════════════════════════════════════

export function showNuevoRegistroModal(patientId, actor = 'medico') {
  const p = (window._db.MOCK_PATIENTS || []).find(pt => pt.id === patientId);
  if (!p) { app.showToast('Paciente no encontrado', 'error'); return; }

  const sintomas = ['Cefalea','Mareo / vértigo','Náuseas','Dolor torácico','Disnea','Palpitaciones',
                    'Visión borrosa','Edema en pies','Fatiga intensa','Fiebre'];

  openModal(`
    <div class="modal">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Nuevo registro vital</h2>
          <div style="font-size:var(--f-xs);color:var(--tx-3);margin-top:2px">
            ${actor === 'paciente' ? 'Ingresado por ti' : actor === 'enfermera' ? 'Ingresado por enfermería' : 'Ingresado por el médico'} — ${new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}
          </div>
        </div>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal-body" style="max-height:70vh;overflow-y:auto">
        <!-- Paciente -->
        <div class="patient-badge">
          <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
          <div>
            <div style="font-weight:var(--fw-sb);font-size:var(--f-sm)">${p.nombre}</div>
            <div style="font-size:var(--f-xs);color:var(--tx-3)">${p.plan_nombre}</div>
          </div>
          <div style="margin-left:auto">
            <span class="badge badge-brand">${p.plan_tipo === 'presion' ? 'Presión' : p.plan_tipo === 'glicemia' ? 'Glicemia' : p.plan_tipo === 'saturacion' ? 'Saturación' : 'Multi'}</span>
          </div>
        </div>

        <!-- Campos según tipo de plan -->
        <div style="margin-bottom:var(--s-5)">
          ${_buildVitalFields(p)}
        </div>

        <!-- Síntomas -->
        <div class="input-group" style="margin-bottom:var(--s-4)">
          <label class="input-label">¿Presenta algún síntoma? <span style="color:var(--tx-4);font-weight:var(--fw-r)">(marcar todos los que aplican)</span></label>
          <div class="sintomas-grid">
            ${sintomas.map(s => `
              <label class="sintoma-check">
                <input type="checkbox" name="sintoma" value="${s}">
                <span>${s}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Confirmación de medicamentos -->
        ${p.medicamentos?.length ? `
          <div class="input-group" style="margin-bottom:var(--s-4)">
            <label class="input-label">Confirmación de medicamentos</label>
            <div class="med-confirm-list">
              ${p.medicamentos.map((m, i) => `
                <label class="med-confirm-item tomado" id="med-item-${i}" onclick="this.classList.toggle('tomado');document.getElementById('med-cb-${i}').checked=!document.getElementById('med-cb-${i}').checked">
                  <input type="checkbox" id="med-cb-${i}" name="med" value="${i}" checked style="display:none">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--ok)" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="med-icon-${i}">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div>
                    <div style="font-size:var(--f-sm);font-weight:var(--fw-m)">${m.nombre}</div>
                    <div style="font-size:var(--f-xs);color:var(--tx-3)">${m.frecuencia} · ${m.horarios.join(', ')}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Observaciones -->
        <div class="input-group">
          <label class="input-label" for="reg-obs">${actor === 'paciente' ? 'Tus observaciones' : 'Observaciones del médico'}</label>
          <textarea class="textarea" id="reg-obs" rows="2"
            placeholder="${actor === 'paciente' ? 'Ej: Me sentí bien hoy. Sin síntomas nuevos...' : 'Ej: Paciente refiere sentirse bien. Sin síntomas nuevos...'}"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window._guardarRegistro('${p.id}', '${actor}')">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          Guardar registro
        </button>
      </div>
    </div>
  `);
}

/** Genera los campos de vitales según el tipo de plan */
function _buildVitalFields(p) {
  if (p.plan_tipo === 'presion' || p.plan_tipo === 'multi') {
    const multiExtra = p.plan_tipo === 'multi' ? `
      <div class="vital-input-group">
        <label class="input-label">Peso <span style="color:var(--tx-4);font-size:var(--f-xs)">(opcional)</span></label>
        <input class="input" type="number" id="reg-peso" placeholder="${p.peso_kg || '70'}" step="0.1" min="20" max="300">
        <div class="input-unit">kg</div>
      </div>
      <div class="vital-input-group">
        <label class="input-label">Temperatura <span style="color:var(--tx-4);font-size:var(--f-xs)">(opcional)</span></label>
        <input class="input" type="number" id="reg-temp" placeholder="36.5" step="0.1" min="34" max="42">
        <div class="input-unit">°C</div>
      </div>
    ` : '';

    return `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s-4)">
        <div class="vital-input-group">
          <label class="input-label">Sistólica <span style="color:var(--alert)">*</span></label>
          <input class="input" type="number" id="reg-ps" placeholder="120" min="60" max="260" autofocus>
          <div class="input-unit">mmHg</div>
        </div>
        <div class="vital-input-group">
          <label class="input-label">Diastólica <span style="color:var(--alert)">*</span></label>
          <input class="input" type="number" id="reg-pd" placeholder="80" min="40" max="160">
          <div class="input-unit">mmHg</div>
        </div>
        <div class="vital-input-group">
          <label class="input-label">Pulso</label>
          <input class="input" type="number" id="reg-pulso" placeholder="70" min="30" max="220">
          <div class="input-unit">lpm</div>
        </div>
        ${multiExtra}
      </div>
    `;
  }

  if (p.plan_tipo === 'glicemia') {
    return `
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--s-4)">
        <div class="vital-input-group">
          <label class="input-label">Glicemia <span style="color:var(--alert)">*</span></label>
          <input class="input" type="number" id="reg-glicemia" placeholder="120" min="20" max="600" autofocus>
          <div class="input-unit">mg/dL</div>
        </div>
        <div class="vital-input-group">
          <label class="input-label">Tipo de medición <span style="color:var(--alert)">*</span></label>
          <select class="select" id="reg-glic-tipo" style="height:54px">
            <option value="ayunas">En ayunas</option>
            <option value="postprandial">Postprandial (2h después)</option>
            <option value="aleatoria">Aleatoria</option>
          </select>
        </div>
      </div>
    `;
  }

  if (p.plan_tipo === 'saturacion') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s-4)">
        <div class="vital-input-group">
          <label class="input-label">Saturación O₂ <span style="color:var(--alert)">*</span></label>
          <input class="input" type="number" id="reg-sat" placeholder="97" min="50" max="100" autofocus>
          <div class="input-unit">%</div>
        </div>
        <div class="vital-input-group">
          <label class="input-label">Frecuencia cardíaca</label>
          <input class="input" type="number" id="reg-fc" placeholder="80" min="30" max="220">
          <div class="input-unit">lpm</div>
        </div>
      </div>
    `;
  }

  return `<p style="color:var(--tx-3);font-size:var(--f-sm)">Tipo de plan no reconocido.</p>`;
}

/** Guarda el registro y actualiza el mock data */
window._guardarRegistro = function(patientId, actor = 'medico') {
  const p = window._db.MOCK_PATIENTS.find(pt => pt.id === patientId);
  if (!p) return;

  const obs     = document.getElementById('reg-obs')?.value.trim() || '';
  const sintomas = [...document.querySelectorAll('input[name="sintoma"]:checked')].map(el => el.value);
  const now     = new Date().toISOString();
  const registro = { fecha: now, observaciones: obs, sintomas, registrado_por: actor };

  // ── Cumplimiento de medicamentos (si el plan tiene medicamentos activos) ──
  if (p.medicamentos?.length) {
    const medEstados = p.medicamentos.map((m, i) => ({
      nombre: m.nombre,
      tomado: document.getElementById(`med-cb-${i}`)?.checked ?? true,
    }));
    registro.medicamentos_tomados = medEstados;
    registro.cumplimiento_pct = Math.round((medEstados.filter(x => x.tomado).length / medEstados.length) * 100);
  }

  // ── Recopilar valores según tipo de plan ──
  if (p.plan_tipo === 'presion' || p.plan_tipo === 'multi') {
    const ps = parseInt(document.getElementById('reg-ps')?.value);
    const pd = parseInt(document.getElementById('reg-pd')?.value);
    if (!ps || !pd) { fieldError('reg-ps', 'La presión sistólica y diastólica son obligatorias'); return; }
    registro.presion_s = ps;
    registro.presion_d = pd;
    const pulso = parseInt(document.getElementById('reg-pulso')?.value);
    if (pulso) registro.pulso = pulso;
    if (p.plan_tipo === 'multi') {
      const peso = parseFloat(document.getElementById('reg-peso')?.value);
      const temp = parseFloat(document.getElementById('reg-temp')?.value);
      if (peso) registro.peso_kg = peso;
      if (temp) registro.temperatura_c = temp;
    }
  } else if (p.plan_tipo === 'glicemia') {
    const g = parseFloat(document.getElementById('reg-glicemia')?.value);
    if (!g) { fieldError('reg-glicemia', 'Ingresa el valor de glicemia'); return; }
    registro.glicemia = g;
    registro.glicemia_tipo = document.getElementById('reg-glic-tipo')?.value || 'ayunas';
  } else if (p.plan_tipo === 'saturacion') {
    const sat = parseFloat(document.getElementById('reg-sat')?.value);
    if (!sat) { fieldError('reg-sat', 'Ingresa la saturación de oxígeno'); return; }
    registro.saturacion = sat;
    const fc = parseInt(document.getElementById('reg-fc')?.value);
    if (fc) registro.frecuencia_cardiaca = fc;
  }

  // ── Actualizar paciente en mock data ──
  p.registros.unshift(registro);
  p.ultima_lectura   = now;
  p.plan_dia_actual  = Math.min((p.plan_dia_actual || 0) + 1, p.plan_dias_total);

  auditLog('registros_clinicos', 'INSERT', `${p.id}_${now}`, {
    paciente: p.nombre,
    resumen: _buildRegistroDesc(registro, p.plan_tipo),
  });

  // Actualizar adherencia aproximada
  const esperados = p.plan_dia_actual * (p.plan_frecuencia === '2x_dia' ? 2 : 1);
  p.adherencia = Math.min(100, Math.round((p.registros.length / Math.max(1, esperados)) * 100));

  // Agregar a actividad reciente
  const desc = _buildRegistroDesc(registro, p.plan_tipo);
  p.actividad_reciente.unshift({
    tipo: p.plan_tipo, icono: 'activity', color: 'brand',
    titulo: 'Registro ingresado', desc, tiempo: 'Ahora',
  });

  if (actor === 'paciente') {
    pushNotif({
      usuario_role: 'medico',
      tipo: 'registro',
      titulo: 'Nuevo registro de paciente',
      mensaje: `${p.nombre} ingresó un nuevo registro: ${desc}`,
    });
  }

  // ── Generar alertas si hay valores críticos ──
  _checkAlertas(p, registro);

  closeModal();
  app.showToast('Registro guardado correctamente', 'ok');

  // Re-renderizar el panel de detalle (vista médica) o el portal del paciente, si están visibles
  if (window.selectPatient) window.selectPatient(patientId);
  window._refreshPacienteView?.(patientId);
};

/** Texto descriptivo del registro para la actividad */
function _buildRegistroDesc(reg, tipo) {
  if (tipo === 'presion' || tipo === 'multi') {
    let txt = `${reg.presion_s}/${reg.presion_d} mmHg`;
    if (reg.pulso) txt += ` · Pulso ${reg.pulso} lpm`;
    return txt;
  }
  if (tipo === 'glicemia') return `${reg.glicemia} mg/dL · ${reg.glicemia_tipo || ''}`;
  if (tipo === 'saturacion') {
    let txt = `SatO₂ ${reg.saturacion}%`;
    if (reg.frecuencia_cardiaca) txt += ` · FC ${reg.frecuencia_cardiaca} lpm`;
    return txt;
  }
  return 'Registro completado';
}

/** Genera alertas automáticas si los valores están fuera de rango */
function _checkAlertas(p, reg) {
  const { MOCK_ALERTAS, MOCK_CONFIG_ALERTAS } = window._db;
  const cfg = MOCK_CONFIG_ALERTAS || {};
  const nuevasAlertas = [];

  const paMax = cfg.presion_sistolica_max ?? 140;
  const paMin = cfg.presion_sistolica_min ?? 90;
  const glicemiaMin = cfg.glicemia_min ?? 70;
  const glicemiaMax = cfg.glicemia_postprandial_max ?? 200;
  const satMin = cfg.saturacion_min ?? 92;

  if (reg.presion_s && reg.presion_s > paMax) {
    nuevasAlertas.push({
      id: 'a_' + Date.now(),
      paciente_id:      p.id,
      paciente_nombre:  p.nombre,
      tipo:             'presion_alta',
      severidad:        reg.presion_s > paMax + 20 ? 'critica' : 'alta',
      titulo:           'Presión arterial elevada',
      descripcion:      `Registró ${reg.presion_s}/${reg.presion_d} mmHg — sobre el umbral máximo`,
      valor:            `${reg.presion_s}/${reg.presion_d} mmHg`,
      umbral:           `≤ ${paMax}/${cfg.presion_diastolica_max ?? 90} mmHg`,
      leida: false, resuelta: false,
      fecha: new Date().toISOString(),
    });
  }

  if (reg.presion_s && reg.presion_s < paMin) {
    nuevasAlertas.push({
      id: 'a_' + Date.now() + 1,
      paciente_id: p.id, paciente_nombre: p.nombre,
      tipo: 'hipotension', severidad: 'alta',
      titulo: 'Hipotensión arterial detectada',
      descripcion: `Registró ${reg.presion_s}/${reg.presion_d} mmHg — bajo el umbral mínimo`,
      valor: `${reg.presion_s}/${reg.presion_d} mmHg`, umbral: `≥ ${paMin}/${cfg.presion_diastolica_min ?? 60} mmHg`,
      leida: false, resuelta: false, fecha: new Date().toISOString(),
    });
  }

  if (reg.glicemia !== undefined && reg.glicemia < glicemiaMin) {
    nuevasAlertas.push({
      id: 'a_' + (Date.now() + 2),
      paciente_id: p.id, paciente_nombre: p.nombre,
      tipo: 'hipoglicemia', severidad: 'critica',
      titulo: 'Hipoglicemia detectada',
      descripcion: `Glicemia de ${reg.glicemia} mg/dL — bajo umbral crítico`,
      valor: `${reg.glicemia} mg/dL`, umbral: `≥ ${glicemiaMin} mg/dL`,
      leida: false, resuelta: false, fecha: new Date().toISOString(),
    });
  }

  if (reg.glicemia !== undefined && reg.glicemia > glicemiaMax) {
    nuevasAlertas.push({
      id: 'a_' + (Date.now() + 3),
      paciente_id: p.id, paciente_nombre: p.nombre,
      tipo: 'hiperglicemia', severidad: 'alta',
      titulo: 'Hiperglicemia severa',
      descripcion: `Glicemia de ${reg.glicemia} mg/dL — sobre umbral de alerta`,
      valor: `${reg.glicemia} mg/dL`, umbral: `≤ ${glicemiaMax} mg/dL`,
      leida: false, resuelta: false, fecha: new Date().toISOString(),
    });
  }

  if (reg.saturacion !== undefined && reg.saturacion < satMin) {
    nuevasAlertas.push({
      id: 'a_' + (Date.now() + 4),
      paciente_id: p.id, paciente_nombre: p.nombre,
      tipo: 'saturacion_baja', severidad: reg.saturacion < satMin - 4 ? 'critica' : 'alta',
      titulo: 'Saturación de oxígeno bajo umbral',
      descripcion: `SatO₂ ${reg.saturacion}% — umbral mínimo ${satMin}%`,
      valor: `${reg.saturacion}%`, umbral: `≥ ${satMin}%`,
      leida: false, resuelta: false, fecha: new Date().toISOString(),
    });
  }

  if (nuevasAlertas.length > 0) {
    window._db.MOCK_ALERTAS.unshift(...nuevasAlertas);

    nuevasAlertas.forEach(a => pushNotif({
      usuario_role: 'medico',
      tipo: 'alerta',
      titulo: a.titulo,
      mensaje: `${a.paciente_nombre} — ${a.descripcion}`,
    }));

    // Actualizar badge del sidebar
    const count = window._db.MOCK_ALERTAS.filter(a => !a.resuelta).length;
    const badge = document.querySelector('.nav-badge');
    if (badge) badge.textContent = count;
    else {
      // Si no existe el badge, buscar el item de alertas y agregarlo
      const alertNav = document.querySelector('.nav-item[data-route="alertas"]');
      if (alertNav && !alertNav.querySelector('.nav-badge')) {
        const b = document.createElement('span');
        b.className = 'nav-badge';
        b.textContent = count;
        alertNav.appendChild(b);
      }
    }

    // Actualizar estado del paciente si hay críticas
    const hayCritica = nuevasAlertas.some(a => a.severidad === 'critica');
    const hayAlta    = nuevasAlertas.some(a => a.severidad === 'alta');
    if (hayCritica || hayAlta) {
      p.estado = 'atencion';
      app.showToast(`⚠️ Alerta generada para ${p.nombre}`, 'warn');
    }
  }
};

// ════════════════════════════════════════════════════════════
//  3. NUEVA EVOLUCIÓN MÉDICA (SOAP)
// ════════════════════════════════════════════════════════════

export function showNuevaEvolucionModal(patientId) {
  const p = (window._db.MOCK_PATIENTS || []).find(pt => pt.id === patientId);
  if (!p) { app.showToast('Paciente no encontrado', 'error'); return; }

  openModal(`
    <div class="modal" style="max-width:620px">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Nueva evolución médica</h2>
          <div style="font-size:var(--f-xs);color:var(--tx-3);margin-top:2px">
            Formato SOAP — ${new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}
          </div>
        </div>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal-body" style="max-height:70vh;overflow-y:auto">
        <div class="patient-badge">
          <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
          <div>
            <div style="font-weight:var(--fw-sb);font-size:var(--f-sm)">${p.nombre}</div>
            <div style="font-size:var(--f-xs);color:var(--tx-3)">${p.diagnostico_principal}</div>
          </div>
        </div>

        <div class="input-group" style="margin-bottom:var(--s-4)">
          <label class="input-label" for="ev-subjetivo">S — Subjetivo <span style="color:var(--alert)">*</span></label>
          <textarea class="textarea" id="ev-subjetivo" rows="2" placeholder="Síntomas referidos por el paciente..."></textarea>
        </div>
        <div class="input-group" style="margin-bottom:var(--s-4)">
          <label class="input-label" for="ev-objetivo">O — Objetivo</label>
          <textarea class="textarea" id="ev-objetivo" rows="2" placeholder="Hallazgos del examen físico, signos vitales..."></textarea>
        </div>
        <div class="input-group" style="margin-bottom:var(--s-4)">
          <label class="input-label" for="ev-evaluacion">A — Evaluación <span style="color:var(--alert)">*</span></label>
          <textarea class="textarea" id="ev-evaluacion" rows="2" placeholder="Diagnóstico o impresión clínica..."></textarea>
        </div>
        <div class="input-group">
          <label class="input-label" for="ev-plan">P — Plan</label>
          <textarea class="textarea" id="ev-plan" rows="2" placeholder="Conducta, ajustes de tratamiento, próximo control..."></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window._guardarEvolucion('${p.id}')">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          Guardar evolución
        </button>
      </div>
    </div>
  `);
}

window._guardarEvolucion = function(patientId) {
  const p = window._db.MOCK_PATIENTS.find(pt => pt.id === patientId);
  if (!p) return;

  const subjetivo  = document.getElementById('ev-subjetivo')?.value.trim() || '';
  const objetivo   = document.getElementById('ev-objetivo')?.value.trim() || '';
  const evaluacion = document.getElementById('ev-evaluacion')?.value.trim() || '';
  const plan       = document.getElementById('ev-plan')?.value.trim() || '';

  if (!subjetivo) { fieldError('ev-subjetivo', 'Registra lo referido por el paciente'); return; }
  if (!evaluacion) { fieldError('ev-evaluacion', 'Registra tu impresión clínica'); return; }

  const nueva = {
    id: 'ev_' + Date.now(),
    medico_nombre: window._db.MOCK_MEDICO?.nombre || 'Médico tratante',
    fecha_evolucion: new Date().toISOString(),
    subjetivo, objetivo, evaluacion, plan,
  };

  if (!p.evoluciones) p.evoluciones = [];
  p.evoluciones.unshift(nueva);

  auditLog('evoluciones', 'INSERT', nueva.id, {
    paciente: p.nombre,
    evaluacion,
  });

  p.actividad_reciente.unshift({
    tipo: 'evolucion', icono: 'file-text', color: 'brand',
    titulo: 'Evolución médica registrada',
    desc: evaluacion,
    tiempo: 'Ahora',
  });

  pushNotif({
    usuario_role: 'paciente',
    paciente_id: p.id,
    tipo: 'evolucion',
    titulo: 'Tu médico registró una evolución',
    mensaje: `${nueva.medico_nombre} actualizó tu evolución clínica.`,
  });

  closeModal();
  app.showToast('Evolución registrada correctamente', 'ok');

  if (window.selectPatient) window.selectPatient(patientId);
  window._refreshPacienteView?.(patientId);
};

// ════════════════════════════════════════════════════════════
//  4. MEDICAMENTOS — historial append-only (nunca se sobrescribe)
// ════════════════════════════════════════════════════════════

export function showNuevoMedicamentoModal(patientId) {
  const p = (window._db.MOCK_PATIENTS || []).find(pt => pt.id === patientId);
  if (!p) { app.showToast('Paciente no encontrado', 'error'); return; }

  openModal(`
    <div class="modal" style="max-width:520px">
      <div class="modal-header">
        <h2 class="modal-title">Nuevo medicamento</h2>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="patient-badge" style="margin-bottom:var(--s-4)">
          <div class="avatar avatar-sm" style="background:${p.avatar_bg}">${p.avatar}</div>
          <div><div style="font-weight:var(--fw-sb);font-size:var(--f-sm)">${p.nombre}</div></div>
        </div>
        <div class="form-grid-2">
          <div class="input-group" style="grid-column:span 2">
            <label class="input-label" for="med-nombre">Medicamento <span style="color:var(--alert)">*</span></label>
            <input class="input" id="med-nombre" placeholder="Ej: Losartán 50 mg">
          </div>
          <div class="input-group">
            <label class="input-label" for="med-frecuencia">Frecuencia <span style="color:var(--alert)">*</span></label>
            <input class="input" id="med-frecuencia" placeholder="Ej: Cada 12 horas">
          </div>
          <div class="input-group">
            <label class="input-label" for="med-horarios">Horarios</label>
            <input class="input" id="med-horarios" placeholder="08:00, 20:00">
          </div>
          <div class="input-group" style="grid-column:span 2">
            <label class="input-label" for="med-indicaciones">Indicaciones</label>
            <textarea class="textarea" id="med-indicaciones" rows="2" placeholder="Ej: Tomar con alimentos"></textarea>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window._guardarNuevoMedicamento('${p.id}')">Guardar</button>
      </div>
    </div>
  `);
}

window._guardarNuevoMedicamento = function(patientId) {
  const p = window._db.MOCK_PATIENTS.find(pt => pt.id === patientId);
  if (!p) return;

  const nombre = document.getElementById('med-nombre')?.value.trim();
  const frecuencia = document.getElementById('med-frecuencia')?.value.trim();
  if (!nombre) { fieldError('med-nombre', 'El nombre del medicamento es obligatorio'); return; }
  if (!frecuencia) { fieldError('med-frecuencia', 'La frecuencia es obligatoria'); return; }

  const horarios = (document.getElementById('med-horarios')?.value || '').split(',').map(h => h.trim()).filter(Boolean);
  const indicaciones = document.getElementById('med-indicaciones')?.value.trim();

  const nuevo = {
    id: 'med_' + Date.now(),
    nombre, frecuencia, horarios, indicaciones,
    fecha_inicio: new Date().toISOString().split('T')[0],
    activo: true,
    prescrito_por_nombre: window._db.currentUser?.nombre || 'Médico tratante',
  };

  if (!p.medicamentos) p.medicamentos = [];
  p.medicamentos.unshift(nuevo);

  auditLog('medicamentos', 'INSERT', nuevo.id, { paciente: p.nombre, medicamento: nombre, frecuencia });

  closeModal();
  app.showToast('Medicamento agregado', 'ok');
  if (window.selectPatient) window.selectPatient(patientId);
};

/** Discontinúa un medicamento (nunca se borra: se marca inactivo con fecha y motivo) */
window._discontinuarMedicamento = function(patientId, medId) {
  const p = window._db.MOCK_PATIENTS.find(pt => pt.id === patientId);
  const med = p?.medicamentos?.find(m => m.id === medId);
  if (!med) return;

  const motivo = prompt(`¿Motivo para discontinuar "${med.nombre}"? (obligatorio)`);
  if (!motivo?.trim()) { app.showToast('Debes indicar un motivo para discontinuar el medicamento', 'warn'); return; }

  med.activo = false;
  med.fecha_fin = new Date().toISOString().split('T')[0];
  med.motivo_termino = motivo.trim();

  auditLog('medicamentos', 'UPDATE', med.id, { paciente: p.nombre, medicamento: med.nombre, motivo_termino: motivo.trim(), accion: 'discontinuado' });

  app.showToast(`${med.nombre} discontinuado`, 'ok');
  if (window.selectPatient) window.selectPatient(patientId);
};
