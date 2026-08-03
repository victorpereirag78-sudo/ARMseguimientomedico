/* ============================================================
   ARM Seguimiento Médico — Vista: Configuración de umbrales de alerta
   (tabla config_alertas — Administrador)
   ============================================================ */
import { getConfigAlertas, updateConfigAlertas, logAudit } from '../db.js';

export async function renderAdminConfigAlertas(container) {
  container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  const cfg = await getConfigAlertas();
  container.innerHTML = getConfigHTML(cfg);

  window._guardarConfigAlertas = async () => {
    const campos = [
      'presion_sistolica_max', 'presion_sistolica_min', 'presion_diastolica_max', 'presion_diastolica_min',
      'frecuencia_cardiaca_max', 'frecuencia_cardiaca_min', 'glicemia_ayunas_max', 'glicemia_postprandial_max',
      'glicemia_min', 'saturacion_min', 'temperatura_max', 'dias_inactividad_alerta',
    ];
    const nuevos = {};
    for (const c of campos) {
      const val = parseFloat(document.getElementById(`ca-${c}`)?.value);
      if (!Number.isNaN(val)) nuevos[c] = val;
    }
    await updateConfigAlertas(nuevos);
    logAudit(window._db.currentUser, 'config_alertas', 'UPDATE', 'global', nuevos);
    window.app?.showToast('Umbrales de alerta actualizados', 'ok');
  };
}

function getConfigHTML(cfg) {
  const field = (id, label, unit, val) => `
    <div class="input-group">
      <label class="input-label" for="ca-${id}">${label}</label>
      <div style="position:relative">
        <input class="input" type="number" step="0.1" id="ca-${id}" value="${val}">
        <span style="position:absolute;right:var(--s-3);top:50%;transform:translateY(-50%);font-size:var(--f-xs);color:var(--tx-3)">${unit}</span>
      </div>
    </div>`;

  return `
  <div class="view-header">
    <div class="view-header-left">
      <div class="view-header-meta">PANEL DE ADMINISTRACIÓN</div>
      <h1 class="view-header-title">Umbrales de alerta</h1>
      <p class="view-header-sub">Valores por defecto usados para generar alertas clínicas automáticas en toda la plataforma.</p>
    </div>
    <div class="view-header-actions">
      <button class="btn btn-primary" onclick="window._guardarConfigAlertas()">Guardar cambios</button>
    </div>
  </div>

  <div class="page-content">
    <div class="ficha-section">
      <div class="ficha-section-title">Presión arterial (mmHg)</div>
      <div class="form-grid-2">
        ${field('presion_sistolica_max', 'Sistólica máxima', 'mmHg', cfg.presion_sistolica_max)}
        ${field('presion_sistolica_min', 'Sistólica mínima', 'mmHg', cfg.presion_sistolica_min)}
        ${field('presion_diastolica_max', 'Diastólica máxima', 'mmHg', cfg.presion_diastolica_max)}
        ${field('presion_diastolica_min', 'Diastólica mínima', 'mmHg', cfg.presion_diastolica_min)}
      </div>
    </div>

    <div class="ficha-section">
      <div class="ficha-section-title">Frecuencia cardíaca (lpm)</div>
      <div class="form-grid-2">
        ${field('frecuencia_cardiaca_max', 'Máxima', 'lpm', cfg.frecuencia_cardiaca_max)}
        ${field('frecuencia_cardiaca_min', 'Mínima', 'lpm', cfg.frecuencia_cardiaca_min)}
      </div>
    </div>

    <div class="ficha-section">
      <div class="ficha-section-title">Glicemia (mg/dL)</div>
      <div class="form-grid-2">
        ${field('glicemia_ayunas_max', 'En ayunas — máxima', 'mg/dL', cfg.glicemia_ayunas_max)}
        ${field('glicemia_postprandial_max', 'Postprandial — máxima', 'mg/dL', cfg.glicemia_postprandial_max)}
        ${field('glicemia_min', 'Mínima (hipoglicemia)', 'mg/dL', cfg.glicemia_min)}
      </div>
    </div>

    <div class="ficha-section">
      <div class="ficha-section-title">Otros parámetros</div>
      <div class="form-grid-2">
        ${field('saturacion_min', 'Saturación O₂ mínima', '%', cfg.saturacion_min)}
        ${field('temperatura_max', 'Temperatura máxima', '°C', cfg.temperatura_max)}
        ${field('dias_inactividad_alerta', 'Días sin registro para alertar', 'días', cfg.dias_inactividad_alerta)}
      </div>
    </div>
  </div>
  `;
}
