/* ============================================================
   ARM Seguimiento Médico — Vista: Reportes
   ============================================================ */
export function renderReportes(container) {
  container.innerHTML = `
  <div class="view-header">
    <div class="view-header-left">
      <h1 class="view-header-title">Reportes</h1>
      <p class="view-header-sub">Genera y exporta reportes clínicos en PDF.</p>
    </div>
    <div class="view-header-actions">
      <button class="btn btn-primary">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar PDF
      </button>
    </div>
  </div>

  <div class="page-content">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--s-4)">
      ${[
        { titulo: 'Reporte de adherencia', desc: 'Resumen de cumplimiento de registros de todos los pacientes activos.', icono: 'pie-chart', color: 'brand' },
        { titulo: 'Evolución de presión arterial', desc: 'Gráficos y tabla de evolución PA por paciente.', icono: 'activity', color: 'ok' },
        { titulo: 'Control glicémico', desc: 'Seguimiento de glicemia en pacientes DM2.', icono: 'droplet', color: 'warn' },
        { titulo: 'Alertas del período', desc: 'Listado de todas las alertas generadas en el período seleccionado.', icono: 'alert-triangle', color: 'alert' },
      ].map(r => `
        <div class="card card-pad" style="cursor:pointer;transition:box-shadow var(--t);hover:box-shadow:var(--sh-lg)">
          <div class="stat-card-icon ${r.color}" style="margin-bottom:var(--s-3)">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style="font-size:var(--f-base);font-weight:var(--fw-sb);margin-bottom:var(--s-2)">${r.titulo}</div>
          <div style="font-size:var(--f-sm);color:var(--tx-3);margin-bottom:var(--s-4)">${r.desc}</div>
          <button class="btn btn-secondary btn-sm">Generar</button>
        </div>
      `).join('')}
    </div>

    <div style="margin-top:var(--s-8)">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <h3>Reportes en desarrollo</h3>
        <p>Módulo de reportes y exportación PDF disponible próximamente.</p>
      </div>
    </div>
  </div>
  `;
}
