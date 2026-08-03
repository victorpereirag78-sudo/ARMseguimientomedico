/* ============================================================
   ARM Seguimiento Médico — Exportación de fichas/resúmenes a PDF
   Requiere jsPDF + jspdf-autotable (cargados vía CDN en app.html)
   ============================================================ */

const BRAND = [13, 148, 136];   // #0d9488
const TX1   = [15, 23, 42];     // #0f172a
const TX3   = [100, 116, 139];  // #64748b

function _slug(str) {
  return (str || 'paciente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
}

function _fmtFecha(d) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function _fmtFechaHora(d) {
  return new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Dibuja el encabezado institucional en la página actual */
function _drawHeader(doc, subtitle) {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARM Seguimiento Médico', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 14, 19);
  doc.setTextColor(...TX3);
  doc.setFontSize(8);
  doc.text(`Generado: ${_fmtFechaHora(new Date())}`, 196, 13, { align: 'right' });
  doc.text('ARM Sistemas · Santiago, Chile', 196, 19, { align: 'right' });
  doc.setTextColor(...TX1);
}

/** Dibuja el pie de página con disclaimers legales (Ley 20.584) */
function _drawFooter(doc, pageNum, pageCount) {
  doc.setFontSize(7);
  doc.setTextColor(...TX3);
  doc.text(
    'Documento de uso clínico confidencial. Prototipo demostrativo — la información de pacientes es ficticia.',
    14, 289
  );
  doc.text(`Página ${pageNum} de ${pageCount}`, 196, 289, { align: 'right' });
}

/** Agrega una nueva página con header y devuelve el nuevo cursor Y */
function _ensureSpace(doc, y, needed, subtitle) {
  if (y + needed > 275) {
    doc.addPage();
    _drawHeader(doc, subtitle);
    return 30;
  }
  return y;
}

function _sectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text(text, 14, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, 196, y + 1.5);
  doc.setTextColor(...TX1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  return y + 7;
}

/**
 * Genera y descarga un PDF con la ficha clínica completa de un paciente:
 * datos personales, antecedentes, medicamentos, plan de seguimiento,
 * últimos registros vitales y evoluciones médicas (SOAP).
 */
export function exportPatientPDF(p) {
  if (typeof window.jspdf === 'undefined') {
    window.app?.showToast('No se pudo cargar el generador de PDF. Verifica tu conexión.', 'error');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const subtitle = `Ficha clínica — ${p.nombre}`;

  _drawHeader(doc, subtitle);
  let y = 30;

  // ── Datos del paciente ──
  y = _sectionTitle(doc, 'Datos del paciente', y);
  doc.autoTable({
    startY: y,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    body: [
      ['Nombre', p.nombre, 'RUT', p.rut || '—'],
      ['Edad / Sexo', `${p.edad} años · ${p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}`, 'Ciudad', p.ciudad || '—'],
      ['Teléfono', p.telefono || '—', 'Correo', p.email || '—'],
      ['Contacto emergencia', { content: p.contacto_emergencia || '—', colSpan: 3 }, '', ''],
    ],
  });
  y = doc.lastAutoTable.finalY + 8;

  // ── Información clínica ──
  y = _ensureSpace(doc, y, 30, subtitle);
  y = _sectionTitle(doc, 'Información clínica', y);
  doc.setFontSize(9.5);
  const wrapWrite = (label, value, yPos) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value || '—', 178);
    doc.text(lines, 14, yPos + 5);
    return yPos + 5 + lines.length * 4.2 + 3;
  };
  y = wrapWrite('Diagnósticos:', (p.diagnosticos || []).join('; '), y);
  y = _ensureSpace(doc, y, 15, subtitle);
  y = wrapWrite('Alergias:', (p.alergias || []).length ? p.alergias.join(', ') : 'Sin alergias registradas', y);
  y = _ensureSpace(doc, y, 15, subtitle);
  y = wrapWrite('Factores de riesgo:', (p.factores_riesgo || []).join(', '), y);
  y = _ensureSpace(doc, y, 15, subtitle);
  y = wrapWrite('Antecedentes médicos:', p.antecedentes_medicos, y);
  y = _ensureSpace(doc, y, 15, subtitle);
  y = wrapWrite('Antecedentes quirúrgicos:', p.antecedentes_quirurgicos, y);
  y = _ensureSpace(doc, y, 15, subtitle);
  y = wrapWrite('Hábitos:', p.habitos, y);

  // ── Medicamentos ──
  y = _ensureSpace(doc, y, 30, subtitle);
  y = _sectionTitle(doc, 'Medicamentos actuales', y);
  if (p.medicamentos?.length) {
    doc.autoTable({
      startY: y,
      head: [['Medicamento', 'Frecuencia', 'Horarios']],
      body: p.medicamentos.map(m => [m.nombre, m.frecuencia, (m.horarios || []).join(', ')]),
      theme: 'striped',
      headStyles: { fillColor: BRAND },
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('Sin medicamentos activos registrados.', 14, y);
    y += 8;
  }

  // ── Plan de seguimiento ──
  y = _ensureSpace(doc, y, 25, subtitle);
  y = _sectionTitle(doc, 'Plan de seguimiento', y);
  doc.autoTable({
    startY: y,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    body: [
      ['Plan', p.plan_nombre || '—', 'Progreso', `Día ${p.plan_dia_actual} de ${p.plan_dias_total}`],
      ['Inicio', p.plan_inicio ? _fmtFecha(p.plan_inicio) : '—', 'Adherencia', `${p.adherencia}%`],
    ],
  });
  y = doc.lastAutoTable.finalY + 8;

  // ── Últimos registros vitales ──
  y = _ensureSpace(doc, y, 30, subtitle);
  y = _sectionTitle(doc, 'Últimos registros vitales', y);
  const registros = (p.registros || []).slice(0, 10);
  if (registros.length) {
    doc.autoTable({
      startY: y,
      head: [['Fecha', 'Valores', 'Observaciones']],
      body: registros.map(r => [_fmtFechaHora(r.fecha), _resumenRegistro(r), r.observaciones || '—']),
      theme: 'striped',
      headStyles: { fillColor: BRAND },
      styles: { fontSize: 8.5 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('Sin registros disponibles.', 14, y);
    y += 8;
  }

  // ── Evoluciones médicas (SOAP) ──
  const evoluciones = [...(p.evoluciones || [])].sort((a, b) => new Date(b.fecha_evolucion) - new Date(a.fecha_evolucion));
  y = _ensureSpace(doc, y, 30, subtitle);
  y = _sectionTitle(doc, 'Evoluciones médicas (SOAP)', y);
  if (evoluciones.length) {
    evoluciones.forEach(ev => {
      y = _ensureSpace(doc, y, 35, subtitle);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${ev.medico_nombre || 'Médico tratante'} — ${_fmtFechaHora(ev.fecha_evolucion)}`, 14, y);
      y += 5;
      const soap = [
        ['S — Subjetivo', ev.subjetivo],
        ['O — Objetivo', ev.objetivo],
        ['A — Evaluación', ev.evaluacion],
        ['P — Plan', ev.plan],
      ];
      soap.forEach(([label, text]) => {
        y = _ensureSpace(doc, y, 12, subtitle);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(label, 14, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text || '—', 178);
        doc.text(lines, 14, y + 4);
        y += 4 + lines.length * 4 + 2;
      });
      y += 3;
    });
  } else {
    doc.text('Sin evoluciones registradas.', 14, y);
    y += 8;
  }

  // ── Footer en todas las páginas ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    _drawFooter(doc, i, pageCount);
  }

  doc.save(`Ficha_${_slug(p.nombre)}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function _resumenRegistro(r) {
  const parts = [];
  if (r.presion_s !== undefined) parts.push(`PA ${r.presion_s}/${r.presion_d} mmHg`);
  if (r.pulso) parts.push(`Pulso ${r.pulso} lpm`);
  if (r.glicemia !== undefined) parts.push(`Glicemia ${r.glicemia} mg/dL (${r.glicemia_tipo || '—'})`);
  if (r.saturacion !== undefined) parts.push(`SatO₂ ${r.saturacion}%`);
  if (r.frecuencia_cardiaca) parts.push(`FC ${r.frecuencia_cardiaca} lpm`);
  if (r.peso_kg) parts.push(`Peso ${r.peso_kg} kg`);
  if (r.temperatura_c) parts.push(`Temp ${r.temperatura_c}°C`);
  return parts.join(' · ') || '—';
}
