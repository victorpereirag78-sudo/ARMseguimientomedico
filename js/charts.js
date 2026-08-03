/* ============================================================
   ARM Seguimiento Médico — Gráficos de evolución
   Presión arterial · Glicemia · Peso · Frecuencia cardíaca ·
   Cumplimiento de medicamentos — con filtros de rango de fechas
   ============================================================ */

const RANGE_DAYS = { semana: 7, mes: 30, '3meses': 90 };

export function filterByRange(registros, state) {
  const { range = 'mes', desde, hasta } = state || {};
  if (range === 'personalizado' && desde && hasta) {
    // Parsear como fecha local (no UTC) para que coincida con el resto de la app
    const [dy, dm, dd] = desde.split('-').map(Number);
    const [hy, hm, hd] = hasta.split('-').map(Number);
    const from = new Date(dy, dm - 1, dd, 0, 0, 0, 0);
    const to = new Date(hy, hm - 1, hd, 23, 59, 59, 999);
    return registros.filter(r => { const d = new Date(r.fecha); return d >= from && d <= to; });
  }
  const days = RANGE_DAYS[range] || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return registros.filter(r => new Date(r.fecha) >= cutoff);
}

/** HTML de los filtros + grilla de tarjetas de gráficos (solo las que tengan datos en el rango) */
export function renderEvolucionSection(p, state) {
  const state_ = state || { range: 'mes' };
  const registros = filterByRange(p.registros || [], state_);

  const hasPresion = registros.some(r => r.presion_s !== undefined);
  const hasGlicemia = registros.some(r => r.glicemia !== undefined);
  const hasPeso = registros.some(r => r.peso_kg !== undefined);
  const hasFC = registros.some(r => r.frecuencia_cardiaca !== undefined || r.pulso !== undefined);
  const hasCump = registros.some(r => r.cumplimiento_pct !== undefined);
  const hasAny = hasPresion || hasGlicemia || hasPeso || hasFC || hasCump;

  return `
  <div class="section-header">
    <div class="section-title">Evolución clínica</div>
    <div style="display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap">
      ${_filterBtn('semana', 'Semana', state_.range)}
      ${_filterBtn('mes', 'Mes', state_.range)}
      ${_filterBtn('3meses', '3 meses', state_.range)}
      ${_filterBtn('personalizado', 'Personalizado', state_.range)}
    </div>
  </div>
  ${state_.range === 'personalizado' ? `
    <div class="card card-pad" style="margin-bottom:var(--s-3);display:flex;align-items:flex-end;gap:var(--s-3);flex-wrap:wrap">
      <div class="input-group" style="margin:0">
        <label class="input-label" for="rango-desde">Desde</label>
        <input class="input" type="date" id="rango-desde" value="${state_.desde || ''}">
      </div>
      <div class="input-group" style="margin:0">
        <label class="input-label" for="rango-hasta">Hasta</label>
        <input class="input" type="date" id="rango-hasta" value="${state_.hasta || ''}">
      </div>
      <button class="btn btn-primary btn-sm" onclick="window._aplicarRangoPersonalizado()">Aplicar</button>
    </div>
  ` : ''}
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--s-4);margin-bottom:var(--s-4)">
    ${hasPresion ? _chartCard('chart-pa', 'Presión arterial') : ''}
    ${hasGlicemia ? _chartCard('chart-glicemia', 'Glicemia') : ''}
    ${hasPeso ? _chartCard('chart-peso', 'Peso') : ''}
    ${hasFC ? _chartCard('chart-fc', 'Frecuencia cardíaca') : ''}
    ${hasCump ? _chartCard('chart-cumplimiento', 'Cumplimiento de medicamentos') : ''}
  </div>
  ${!hasAny ? `<div class="empty-state" style="padding:2rem"><p>Sin registros en el rango seleccionado.</p></div>` : ''}
  `;
}

function _filterBtn(value, label, active) {
  return `<button class="btn ${active === value ? 'btn-secondary' : 'btn-ghost'} btn-sm" onclick="window._setRangoEvolucion('${value}')">${label}</button>`;
}

function _chartCard(canvasId, title) {
  return `
  <div class="card card-pad">
    <div style="font-size:var(--f-sm);font-weight:var(--fw-sb);color:var(--tx-1);margin-bottom:var(--s-2)">${title}</div>
    <div class="chart-container" style="height:220px"><canvas id="${canvasId}"></canvas></div>
  </div>`;
}

if (!window._chartInstances) window._chartInstances = {};

function _renderOrDestroy(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === 'undefined') return;
  window._chartInstances[canvasId]?.destroy();
  window._chartInstances[canvasId] = new Chart(ctx, config);
}

const _baseOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
  scales: {
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
  },
};

/** Construye (o destruye si no hay canvas) todos los gráficos disponibles para el rango dado */
export function initEvolucionCharts(p, state) {
  setTimeout(() => {
    const registros = [...filterByRange(p.registros || [], state || { range: 'mes' })]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (!registros.length) return;

    const labels = registros.map(r => {
      const d = new Date(r.fecha);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    if (registros.some(r => r.presion_s !== undefined)) {
      _renderOrDestroy('chart-pa', {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Sistólica', data: registros.map(r => r.presion_s ?? null), borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,.08)', tension: .3, fill: true, spanGaps: true, pointRadius: 3 },
            { label: 'Diastólica', data: registros.map(r => r.presion_d ?? null), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.06)', tension: .3, fill: false, spanGaps: true, pointRadius: 3 },
          ],
        },
        options: _baseOpts,
      });
    }

    if (registros.some(r => r.glicemia !== undefined)) {
      _renderOrDestroy('chart-glicemia', {
        type: 'line',
        data: { labels, datasets: [{ label: 'Glicemia (mg/dL)', data: registros.map(r => r.glicemia ?? null), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.08)', tension: .3, fill: true, spanGaps: true, pointRadius: 4 }] },
        options: _baseOpts,
      });
    }

    if (registros.some(r => r.peso_kg !== undefined)) {
      _renderOrDestroy('chart-peso', {
        type: 'line',
        data: { labels, datasets: [{ label: 'Peso (kg)', data: registros.map(r => r.peso_kg ?? null), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.08)', tension: .3, fill: true, spanGaps: true, pointRadius: 4 }] },
        options: _baseOpts,
      });
    }

    if (registros.some(r => r.frecuencia_cardiaca !== undefined || r.pulso !== undefined)) {
      _renderOrDestroy('chart-fc', {
        type: 'line',
        data: { labels, datasets: [{ label: 'Frecuencia cardíaca (lpm)', data: registros.map(r => (r.frecuencia_cardiaca ?? r.pulso) ?? null), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', tension: .3, fill: true, spanGaps: true, pointRadius: 4 }] },
        options: _baseOpts,
      });
    }

    if (registros.some(r => r.cumplimiento_pct !== undefined)) {
      _renderOrDestroy('chart-cumplimiento', {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Cumplimiento de medicamentos (%)',
            data: registros.map(r => r.cumplimiento_pct ?? null),
            backgroundColor: registros.map(r => (r.cumplimiento_pct ?? 100) >= 80 ? '#0d9488' : (r.cumplimiento_pct ?? 100) >= 50 ? '#f59e0b' : '#ef4444'),
          }],
        },
        options: { ..._baseOpts, scales: { ..._baseOpts.scales, y: { ..._baseOpts.scales.y, min: 0, max: 100 } } },
      });
    }
  }, 80);
}
