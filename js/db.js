/* ============================================================
   ARM Seguimiento Médico — Capa de datos
   Mock data para desarrollo + calls reales a Supabase
   ============================================================ */

// ── MOCK DATA ────────────────────────────────────────────────

export const MOCK_PATIENTS = [
  {
    id: 'p1',
    nombre: 'María González',
    rut: '12.345.678-9',
    edad: 62,
    sexo: 'F',
    ciudad: 'Las Cabras',
    email: 'maria.gonzalez@email.com',
    telefono: '+56 9 1234 5678',
    diagnostico_principal: 'Hipertensión Arterial',
    patologias: ['Hipertensión Arterial', 'Hipotiroidismo'],
    alergias: ['Ibuprofeno'],
    plan_nombre: 'Monitoreo de presión · 7 días',
    plan_tipo: 'presion',
    plan_inicio: '2026-07-25',
    plan_fin: '2026-08-01',
    plan_dias_total: 7,
    plan_dia_actual: 4,
    estado: 'por_revisar',
    ultima_lectura: '2026-07-31T08:14:00',
    adherencia: 87.5,
    avatar_bg: '#8b5cf6',
    avatar: 'MG',
    medicamentos: [
      { nombre: 'Losartán 50 mg', horarios: ['08:00', '20:00'], frecuencia: 'Cada 12 horas' },
      { nombre: 'Eutirox 50 mcg', horarios: ['07:00'], frecuencia: 'Una vez al día en ayunas' },
    ],
    diagnosticos: ['Hipertensión Arterial esencial (I10)', 'Hipotiroidismo primario (E03.9)'],
    antecedentes_medicos: 'DM2 en seguimiento. Dislipidemia controlada.',
    antecedentes_quirurgicos: 'Colecistectomía laparoscópica (2018).',
    habitos: 'No fumadora. Sedentaria. Dieta sin restricción de sal.',
    factores_riesgo: ['Obesidad grado I', 'Sedentarismo', 'Antecedentes familiares HTA'],
    peso_kg: 76.4,
    talla_cm: 158,
    contacto_emergencia: 'Pedro González (hijo) — +56 9 8765 4321',
    medico_id: 'm1',
    activo: true,
    consentimiento_informado: true,
    fecha_consentimiento: '2026-07-25T09:10:00',
    registros: [
      { fecha: '2026-07-31T08:14:00', presion_s: 133, presion_d: 82, pulso: 70, observaciones: '', cumplimiento_pct: 100 },
      { fecha: '2026-07-30T21:08:00', presion_s: 138, presion_d: 86, pulso: 72, observaciones: 'Sintió leve mareo', cumplimiento_pct: 100 },
      { fecha: '2026-07-30T08:20:00', presion_s: 130, presion_d: 80, pulso: 68, observaciones: '', cumplimiento_pct: 100 },
      { fecha: '2026-07-29T21:00:00', presion_s: 142, presion_d: 90, pulso: 74, observaciones: 'Sin dormir bien', cumplimiento_pct: 50 },
      { fecha: '2026-07-29T08:10:00', presion_s: 128, presion_d: 78, pulso: 66, observaciones: '', cumplimiento_pct: 100 },
      { fecha: '2026-07-28T21:05:00', presion_s: 136, presion_d: 84, pulso: 71, observaciones: '', cumplimiento_pct: 100 },
      { fecha: '2026-07-28T08:30:00', presion_s: 135, presion_d: 83, pulso: 70, observaciones: '', cumplimiento_pct: 100 },
      { fecha: '2026-07-27T21:00:00', presion_s: 140, presion_d: 88, pulso: 76, observaciones: 'Estrés laboral', cumplimiento_pct: 0 },
    ],
    actividad_reciente: [
      { tipo: 'presion', icono: 'activity', color: 'brand', titulo: 'Presión arterial registrada', desc: '133/82 mmHg · Pulso 70 lpm', tiempo: 'Hoy, 08:14 · Aportado por el paciente' },
      { tipo: 'sintomas', icono: 'check-circle', color: 'ok', titulo: 'Sin síntomas informados', desc: 'Paciente refiere sentirse bien.', tiempo: 'Ayer, 21:08 · Aportado por el paciente' },
      { tipo: 'examen', icono: 'file-text', color: 'neutral', titulo: 'Examen incorporado', desc: 'Perfil bioquímico · Pendiente de validación', tiempo: '29 jul, 17:32' },
    ],
    examenes: [
      { id: 'e1', nombre: 'Perfil Bioquímico', tipo: 'Laboratorio', fecha: '2026-07-29', estado: 'pendiente' },
      { id: 'e2', nombre: 'ECG de reposo', tipo: 'Cardiología', fecha: '2026-07-15', estado: 'revisado' },
    ],
    proxima_cita: '2026-08-01',
    prox_accion_titulo: 'Revisar evolución',
    prox_accion_desc: 'El paciente completó más de la mitad de su plan de seguimiento.',
    evoluciones: [
      {
        id: 'ev1',
        medico_nombre: 'Dr. Diego Canqui',
        fecha_evolucion: '2026-07-29T17:40:00',
        subjetivo: 'Paciente refiere leve mareo ocasional al levantarse. Sin cefalea ni dolor torácico.',
        objetivo: 'PA 138/86 mmHg, pulso 72 lpm. Buen estado general, sin signos de focalidad neurológica.',
        evaluacion: 'Hipertensión arterial parcialmente controlada. Hipotiroidismo estable.',
        plan: 'Mantener Losartán 50 mg c/12h. Reforzar toma de PA en reposo. Control en 7 días.',
      },
    ],
  },
  {
    id: 'p2',
    nombre: 'Carlos Rojas',
    rut: '8.765.432-1',
    edad: 55,
    sexo: 'M',
    ciudad: 'Pichidegua',
    email: 'carlos.rojas@email.com',
    telefono: '+56 9 2345 6789',
    diagnostico_principal: 'Diabetes Mellitus Tipo 2',
    patologias: ['Diabetes Mellitus Tipo 2', 'Dislipidemia'],
    alergias: ['Penicilina'],
    plan_nombre: 'Glicemia y síntomas · 14 días',
    plan_tipo: 'glicemia',
    plan_inicio: '2026-07-18',
    plan_fin: '2026-08-01',
    plan_dias_total: 14,
    plan_dia_actual: 13,
    estado: 'al_dia',
    ultima_lectura: '2026-07-31T07:45:00',
    adherencia: 95,
    avatar_bg: '#3b82f6',
    avatar: 'CR',
    medicamentos: [
      { nombre: 'Metformina 850 mg', horarios: ['08:00', '20:00'], frecuencia: 'Con las comidas' },
      { nombre: 'Atorvastatina 20 mg', horarios: ['22:00'], frecuencia: 'Una vez al día, en la noche' },
    ],
    diagnosticos: ['Diabetes Mellitus Tipo 2 (E11)', 'Dislipidemia mixta (E78.4)'],
    antecedentes_medicos: 'HTA leve sin tratamiento. Sobrepeso IMC 27.',
    antecedentes_quirurgicos: 'Ninguno relevante.',
    habitos: 'Exfumador (dejó hace 5 años). Alcohol ocasional. Trabaja en campo.',
    factores_riesgo: ['Sobrepeso', 'Antecedentes familiares DM2'],
    peso_kg: 82.1,
    talla_cm: 173,
    contacto_emergencia: 'Ana Rojas (esposa) — +56 9 3456 7890',
    medico_id: 'm1',
    activo: true,
    consentimiento_informado: true,
    fecha_consentimiento: '2026-07-18T10:05:00',
    registros: [
      { fecha: '2026-07-31T07:45:00', glicemia: 142, glicemia_tipo: 'ayunas', observaciones: '' },
      { fecha: '2026-07-30T07:30:00', glicemia: 138, glicemia_tipo: 'ayunas', observaciones: '' },
      { fecha: '2026-07-29T07:50:00', glicemia: 155, glicemia_tipo: 'ayunas', observaciones: 'No tomó metformina la noche anterior' },
    ],
    actividad_reciente: [
      { tipo: 'glicemia', icono: 'droplet', color: 'ok', titulo: 'Glicemia en ayunas registrada', desc: '142 mg/dL · Dentro de rango', tiempo: 'Hoy, 07:45' },
      { tipo: 'medicamento', icono: 'check-circle', color: 'ok', titulo: 'Medicamentos confirmados', desc: 'Metformina AM + PM · Atorvastatina PM', tiempo: 'Ayer, 22:05' },
    ],
    examenes: [
      { id: 'e3', nombre: 'HbA1c', tipo: 'Laboratorio', fecha: '2026-07-10', estado: 'validado' },
    ],
    proxima_cita: '2026-08-05',
    prox_accion_titulo: 'Control final del plan',
    prox_accion_desc: 'Paciente casi al término del plan. Evaluar continuación.',
  },
  {
    id: 'p3',
    nombre: 'Ana Silva',
    rut: '15.678.901-2',
    edad: 70,
    sexo: 'F',
    ciudad: 'Las Cabras',
    email: 'ana.silva@email.com',
    telefono: '+56 9 3456 7891',
    diagnostico_principal: 'EPOC moderado',
    patologias: ['EPOC', 'Insuficiencia Cardíaca leve'],
    alergias: ['AAS (Aspirina)', 'Sulfonamidas'],
    plan_nombre: 'Síntomas y saturación · 7 días',
    plan_tipo: 'saturacion',
    plan_inicio: '2026-07-26',
    plan_fin: '2026-08-02',
    plan_dias_total: 7,
    plan_dia_actual: 5,
    estado: 'atencion',
    ultima_lectura: '2026-07-30T15:20:00',
    adherencia: 58,
    avatar_bg: '#ef4444',
    avatar: 'AS',
    medicamentos: [
      { nombre: 'Salbutamol inhalador', horarios: ['08:00', '14:00', '20:00'], frecuencia: 'Cada 8 horas' },
      { nombre: 'Furosemida 40 mg', horarios: ['08:00'], frecuencia: 'Una vez al día en ayunas' },
    ],
    diagnosticos: ['EPOC moderado (J44.1)', 'Insuficiencia cardíaca leve (I50.9)'],
    antecedentes_medicos: 'Tabaquismo > 30 años (ex). HTA controlada.',
    antecedentes_quirurgicos: 'Ninguno.',
    habitos: 'Exfumadora (45 paq/año). Sedentaria total. Vive sola.',
    factores_riesgo: ['Tabaquismo histórico', 'Edad avanzada', 'Vivir sola'],
    peso_kg: 58.2,
    talla_cm: 155,
    contacto_emergencia: 'Rosa Silva (hija) — +56 9 4567 8901',
    medico_id: 'm2',
    activo: true,
    consentimiento_informado: false,
    fecha_consentimiento: null,
    registros: [
      { fecha: '2026-07-30T15:20:00', saturacion: 89, frecuencia_cardiaca: 95, observaciones: 'Disnea al caminar' },
      { fecha: '2026-07-29T10:00:00', saturacion: 91, frecuencia_cardiaca: 88, observaciones: 'Tos con expectoración' },
    ],
    actividad_reciente: [
      { tipo: 'alerta', icono: 'alert-triangle', color: 'warn', titulo: 'Saturación bajo umbral', desc: 'SatO₂ 89% — umbral mínimo 92%', tiempo: 'Ayer, 15:20' },
      { tipo: 'sintomas', icono: 'wind', color: 'warn', titulo: 'Disnea reportada', desc: 'Dificultad al caminar más de 50 metros.', tiempo: 'Ayer, 15:22' },
    ],
    examenes: [
      { id: 'e4', nombre: 'Espirometría', tipo: 'Neumología', fecha: '2026-07-01', estado: 'validado' },
    ],
    proxima_cita: '2026-08-02',
    prox_accion_titulo: 'Revisión urgente',
    prox_accion_desc: 'Saturación bajo límite. Contactar paciente hoy.',
  },
  {
    id: 'p4',
    nombre: 'José Morales',
    rut: '10.987.654-3',
    edad: 48,
    sexo: 'M',
    ciudad: 'Peumo',
    email: 'jose.morales@email.com',
    telefono: '+56 9 5678 9012',
    diagnostico_principal: 'Post-infarto AM (1 mes)',
    patologias: ['Post-IAM anterior', 'HTA', 'Dislipidemia'],
    alergias: [],
    plan_nombre: 'Adherencia y síntomas · 10 días',
    plan_tipo: 'multi',
    plan_inicio: '2026-07-22',
    plan_fin: '2026-08-01',
    plan_dias_total: 10,
    plan_dia_actual: 9,
    estado: 'al_dia',
    ultima_lectura: '2026-07-31T06:58:00',
    adherencia: 92,
    avatar_bg: '#10b981',
    avatar: 'JM',
    medicamentos: [
      { nombre: 'AAS 100 mg', horarios: ['08:00'], frecuencia: 'Una vez al día' },
      { nombre: 'Clopidogrel 75 mg', horarios: ['08:00'], frecuencia: 'Una vez al día' },
      { nombre: 'Atorvastatina 40 mg', horarios: ['22:00'], frecuencia: 'Una vez al día nocturna' },
      { nombre: 'Bisoprolol 5 mg', horarios: ['08:00'], frecuencia: 'Una vez al día' },
    ],
    diagnosticos: ['IAM anterior con supradesnivel ST (I21.0)', 'HTA esencial (I10)', 'Dislipidemia (E78.5)'],
    antecedentes_medicos: 'Tabaquismo activo (dejó tras IAM). Sedentario.',
    antecedentes_quirurgicos: 'Angioplastia coronaria con stent (30/06/2026).',
    habitos: 'Exfumador (2 semanas). Dieta baja en grasas iniciada.',
    factores_riesgo: ['Tabaquismo', 'HTA', 'Dislipidemia', 'Sedentarismo', 'Estrés laboral'],
    peso_kg: 88.5,
    talla_cm: 176,
    contacto_emergencia: 'Carmen Morales (esposa) — +56 9 6789 0123',
    medico_id: 'm2',
    activo: true,
    consentimiento_informado: true,
    fecha_consentimiento: '2026-07-22T11:30:00',
    registros: [
      { fecha: '2026-07-31T06:58:00', presion_s: 118, presion_d: 74, pulso: 62, frecuencia_cardiaca: 62, peso_kg: 87.6, cumplimiento_pct: 100, observaciones: '' },
      { fecha: '2026-07-30T07:10:00', presion_s: 122, presion_d: 76, pulso: 64, frecuencia_cardiaca: 64, peso_kg: 87.9, cumplimiento_pct: 100, observaciones: '' },
      { fecha: '2026-07-29T07:05:00', presion_s: 120, presion_d: 75, pulso: 63, frecuencia_cardiaca: 63, peso_kg: 88.0, cumplimiento_pct: 75, observaciones: '' },
    ],
    actividad_reciente: [
      { tipo: 'presion', icono: 'activity', color: 'ok', titulo: 'Signos vitales registrados', desc: 'PA 118/74 · FC 62 lpm — Excelente control', tiempo: 'Hoy, 06:58' },
      { tipo: 'medicamento', icono: 'check-circle', color: 'ok', titulo: 'Todos los medicamentos confirmados', desc: 'AAS, Clopidogrel, Bisoprolol AM · Atorvastatina PM', tiempo: 'Ayer, 22:00' },
    ],
    examenes: [
      { id: 'e5', nombre: 'ECG post-angioplastia', tipo: 'Cardiología', fecha: '2026-07-05', estado: 'validado' },
      { id: 'e6', nombre: 'Ecocardiograma', tipo: 'Cardiología', fecha: '2026-07-18', estado: 'validado' },
    ],
    proxima_cita: '2026-08-08',
    prox_accion_titulo: 'Completar plan',
    prox_accion_desc: 'Último día del plan mañana. Preparar resumen de evolución.',
  }
];

export const MOCK_ALERTAS = [
  {
    id: 'a1',
    paciente_id: 'p3',
    paciente_nombre: 'Ana Silva',
    tipo: 'saturacion_baja',
    severidad: 'critica',
    titulo: 'Saturación de oxígeno bajo umbral',
    descripcion: 'Registró SatO₂ 89% · Umbral mínimo configurado: 92%',
    valor: '89%',
    umbral: '≥ 92%',
    leida: false,
    resuelta: false,
    fecha: '2026-07-30T15:20:00',
  },
  {
    id: 'a2',
    paciente_id: 'p1',
    paciente_nombre: 'María González',
    tipo: 'presion_alta',
    severidad: 'alta',
    titulo: 'Presión arterial elevada',
    descripcion: 'Registró 142/90 mmHg · Valor sobre umbral máximo',
    valor: '142/90 mmHg',
    umbral: '≤ 140/90 mmHg',
    leida: false,
    resuelta: false,
    fecha: '2026-07-29T21:00:00',
  },
];

export const MOCK_NOTIFICACIONES = [
  {
    id: 'n1',
    usuario_role: 'medico',
    tipo: 'alerta',
    titulo: 'Saturación de oxígeno bajo umbral',
    mensaje: 'Ana Silva registró SatO₂ 89% — requiere revisión.',
    leida: false,
    created_at: '2026-07-30T15:21:00',
  },
  {
    id: 'n2',
    usuario_role: 'medico',
    tipo: 'registro',
    titulo: 'Nuevo registro de paciente',
    mensaje: 'Carlos Rojas ingresó su glicemia en ayunas de hoy.',
    leida: false,
    created_at: '2026-07-31T07:45:00',
  },
  {
    id: 'n3',
    usuario_role: 'medico',
    tipo: 'sistema',
    titulo: 'Examen pendiente de validación',
    mensaje: 'Perfil bioquímico de María González está pendiente de revisión.',
    leida: true,
    created_at: '2026-07-29T17:35:00',
  },
  {
    id: 'n4',
    usuario_role: 'paciente',
    paciente_id: 'p1',
    tipo: 'evolucion',
    titulo: 'Tu médico registró una evolución',
    mensaje: 'Dr. Diego Canqui actualizó tu evolución clínica.',
    leida: false,
    created_at: '2026-07-29T17:40:00',
  },
  {
    id: 'n5',
    usuario_role: 'paciente',
    paciente_id: 'p1',
    tipo: 'recordatorio',
    titulo: 'Recuerda registrar tu presión',
    mensaje: 'Aún no registras tu control de la tarde.',
    leida: false,
    created_at: '2026-07-31T09:00:00',
  },
];

export const MOCK_MEDICO = {
  nombre: 'Dr. Diego Canqui',
  especialidad: 'Médico General',
  email: 'doctor@arm.cl',
  avatar_bg: '#0d9488',
  avatar: 'DC',
};

export const MOCK_MEDICOS = [
  { id: 'm1', nombre: 'Dr. Diego Canqui', especialidad: 'Médico General', email: 'doctor@arm.cl', numero_registro: '124578', activo: true, avatar_bg: '#0d9488', avatar: 'DC' },
  { id: 'm2', nombre: 'Dra. Fernanda Ibáñez', especialidad: 'Cardióloga', email: 'fibanez@arm.cl', numero_registro: '987654', activo: true, avatar_bg: '#3b82f6', avatar: 'FI' },
];

export const MOCK_CONFIG_ALERTAS = {
  presion_sistolica_max: 140,
  presion_sistolica_min: 90,
  presion_diastolica_max: 90,
  presion_diastolica_min: 60,
  frecuencia_cardiaca_max: 100,
  frecuencia_cardiaca_min: 50,
  glicemia_ayunas_max: 126,
  glicemia_postprandial_max: 200,
  glicemia_min: 70,
  saturacion_min: 92,
  temperatura_max: 38.0,
  dias_inactividad_alerta: 2,
};

export const MOCK_STATS = {
  pacientes_activos: 4,
  registros_por_revisar: 7,
  requiere_atencion: 1,
  adherencia_promedio: 86,
  nuevos_semana: 2,
  ingresados_hoy: 3,
};

export const MOCK_AUDITORIA = [
  {
    id: 1,
    usuario_nombre: 'Dr. Diego Canqui',
    usuario_role: 'medico',
    tabla: 'evoluciones',
    operacion: 'INSERT',
    registro_id: 'ev1',
    datos_nuevos: { paciente: 'María González', evaluacion: 'Hipertensión arterial parcialmente controlada.' },
    created_at: '2026-07-29T17:40:00',
  },
  {
    id: 2,
    usuario_nombre: 'María González',
    usuario_role: 'paciente',
    tabla: 'registros_clinicos',
    operacion: 'INSERT',
    registro_id: 'reg_p1_08_14',
    datos_nuevos: { presion: '133/82 mmHg', pulso: 70 },
    created_at: '2026-07-31T08:14:00',
  },
];

// ── HELPERS DE BASE DE DATOS ─────────────────────────────────

// Modo demo: activo si DEMO_MODE=true en config.js, o si Supabase no está configurado
const IS_DEMO = (typeof DEMO_MODE !== 'undefined' && DEMO_MODE)
             || !SUPABASE_URL
             || SUPABASE_URL === 'YOUR_SUPABASE_URL';

export async function getPatients() {
  if (IS_DEMO) return MOCK_PATIENTS;
  const { data, error } = await supabaseClient
    .from('pacientes')
    .select('*, profiles(nombre_completo, email, telefono)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPatientById(id) {
  if (IS_DEMO) return MOCK_PATIENTS.find(p => p.id === id);
  const { data, error } = await supabaseClient
    .from('pacientes')
    .select('*, profiles(nombre_completo, email, telefono), fichas_clinicas(*), planes_seguimiento(*), registros_clinicos(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getStats() {
  if (IS_DEMO) return MOCK_STATS;
  // TODO: implementar con Supabase
}

export async function getAlertas() {
  if (IS_DEMO) return MOCK_ALERTAS;
  const { data, error } = await supabaseClient
    .from('alertas')
    .select('*, pacientes(profiles(nombre_completo))')
    .eq('resuelta', false)
    .order('fecha_alerta', { ascending: false });
  if (error) throw error;
  return data;
}

export async function marcarAlertaLeida(id) {
  if (IS_DEMO) return;
  await supabaseClient.from('alertas').update({ leida: true }).eq('id', id);
}

export async function getEvoluciones(patientId) {
  if (IS_DEMO) return MOCK_PATIENTS.find(p => p.id === patientId)?.evoluciones || [];
  const { data, error } = await supabaseClient
    .from('evoluciones')
    .select('*, medicos(profiles(nombre_completo))')
    .eq('paciente_id', patientId)
    .order('fecha_evolucion', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMyNotificaciones(currentUser) {
  if (!currentUser) return [];
  if (IS_DEMO) {
    if (currentUser.role === 'paciente') {
      const pid = currentUser.paciente_id || currentUser.id;
      return MOCK_NOTIFICACIONES.filter(n => n.usuario_role === 'paciente' && n.paciente_id === pid);
    }
    return MOCK_NOTIFICACIONES.filter(n => n.usuario_role === currentUser.role);
  }
  const { data, error } = await supabaseClient
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function marcarNotificacionLeida(id) {
  if (IS_DEMO) {
    const n = MOCK_NOTIFICACIONES.find(x => x.id === id);
    if (n) n.leida = true;
    return;
  }
  await supabaseClient.from('notificaciones').update({ leida: true }).eq('id', id);
}

/**
 * Registra una entrada de auditoría (quién, cuándo, qué tabla/operación/registro).
 * usuario: { nombre, role }
 */
export async function logAudit(usuario, tabla, operacion, registroId, datosNuevos, datosAnteriores = null) {
  if (IS_DEMO) {
    MOCK_AUDITORIA.unshift({
      id: MOCK_AUDITORIA.length + 1,
      usuario_nombre: usuario?.nombre || 'Desconocido',
      usuario_role: usuario?.role || '—',
      tabla, operacion, registro_id: registroId,
      datos_nuevos: datosNuevos || null,
      datos_anteriores: datosAnteriores,
      created_at: new Date().toISOString(),
    });
    return;
  }
  await supabaseClient.from('auditoria').insert({
    usuario_id: usuario?.id,
    tabla, operacion,
    registro_id: registroId,
    datos_nuevos: datosNuevos || null,
    datos_anteriores: datosAnteriores,
  });
}

export async function getAuditoria() {
  if (IS_DEMO) return MOCK_AUDITORIA;
  const { data, error } = await supabaseClient
    .from('auditoria')
    .select('*, profiles(nombre_completo)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

// ── ADMINISTRACIÓN (rol admin) ───────────────────────────────

export async function getMedicos() {
  if (IS_DEMO) return MOCK_MEDICOS;
  const { data, error } = await supabaseClient
    .from('medicos')
    .select('*, profiles(nombre_completo, email, activo)');
  if (error) throw error;
  return data;
}

export async function crearMedico(datos) {
  const nuevo = {
    id: 'm_' + Date.now(),
    nombre: datos.nombre,
    especialidad: datos.especialidad || 'Médico General',
    email: datos.email,
    numero_registro: datos.numero_registro || '',
    activo: true,
    avatar_bg: '#0d9488',
    avatar: (datos.nombre || 'NN').split(' ').filter(w => /[A-ZÁÉÍÓÚÑ]/i.test(w[0])).slice(0, 2).map(w => w[0].toUpperCase()).join(''),
  };
  if (IS_DEMO) {
    MOCK_MEDICOS.unshift(nuevo);
    return nuevo;
  }
  // En producción esto requiere invitar al usuario vía Supabase Auth Admin API (server-side)
  throw new Error('La creación de médicos en modo producción requiere flujo de invitación en el backend.');
}

export async function toggleMedicoActivo(id) {
  if (IS_DEMO) {
    const m = MOCK_MEDICOS.find(x => x.id === id);
    if (m) m.activo = !m.activo;
    return m;
  }
  await supabaseClient.from('profiles').update({ activo: true }).eq('id', id);
}

export async function togglePacienteActivo(id) {
  if (IS_DEMO) {
    const p = MOCK_PATIENTS.find(x => x.id === id);
    if (p) p.activo = !p.activo;
    return p;
  }
  await supabaseClient.from('pacientes').update({ activo: true }).eq('id', id);
}

export async function getConfigAlertas() {
  if (IS_DEMO) return MOCK_CONFIG_ALERTAS;
  const { data, error } = await supabaseClient.from('config_alertas').select('*').is('paciente_id', null).maybeSingle();
  if (error) throw error;
  return data || MOCK_CONFIG_ALERTAS;
}

export async function updateConfigAlertas(datos) {
  if (IS_DEMO) {
    Object.assign(MOCK_CONFIG_ALERTAS, datos);
    return MOCK_CONFIG_ALERTAS;
  }
  const { error } = await supabaseClient.from('config_alertas').upsert(datos);
  if (error) throw error;
}

export async function createEvolucion(patientId, evolucion) {
  if (IS_DEMO) return evolucion;
  const { data, error } = await supabaseClient
    .from('evoluciones')
    .insert({
      paciente_id: patientId,
      medico_id: (await supabaseClient.auth.getSession()).data.session.user.id,
      subjetivo: evolucion.subjetivo,
      objetivo: evolucion.objetivo,
      evaluacion: evolucion.evaluacion,
      plan: evolucion.plan,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  if (IS_DEMO) {
    const stored = localStorage.getItem('arm_demo_user');
    return stored ? JSON.parse(stored) : null;
  }
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) return null;
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();
  return profile;
}

export async function logout() {
  if (IS_DEMO) {
    localStorage.removeItem('arm_demo_user');
    window.location.href = 'index.html';
    return;
  }
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}
