-- ============================================================
-- ARM Seguimiento Médico — Row Level Security (RLS)
-- Ejecutar DESPUÉS de schema.sql
--
-- Principios rectores:
--   • El administrador NUNCA puede crear/editar información clínica
--     (fichas_clinicas, evoluciones, medicamentos, planes_seguimiento,
--     registros_clinicos, alertas, exámenes). Solo lectura para auditoría.
--   • Las evoluciones médicas no tienen política de UPDATE ni DELETE:
--     una vez firmadas son inalterables. Las correcciones se registran
--     como una evolución nueva (columna corrige_evolucion_id).
--   • La secretaría no tiene ningún acceso a contenido clínico, solo a
--     datos de agenda/contacto.
--   • La enfermería puede leer el historial clínico de los pacientes de
--     su médico y registrar vitales, pero no puede escribir diagnósticos,
--     tratamientos ni evoluciones.
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_clinico        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentimientos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_clinicas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_seguimiento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_clinicos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evoluciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examenes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_alertas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria            ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- FUNCIONES DE APOYO
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Médico al que apoya el miembro de staff (enfermería/secretaría) actual
CREATE OR REPLACE FUNCTION get_staff_medico_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT medico_id FROM public.staff_clinico WHERE id = auth.uid();
$$;

-- ¿El paciente indicado pertenece al médico que auth.uid() atiende
-- directamente, o al médico al que apoya como staff (enfermería)?
CREATE OR REPLACE FUNCTION is_care_team_for(p_paciente_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pacientes p
    WHERE p.id = p_paciente_id
      AND (p.medico_id = auth.uid() OR p.medico_id = get_staff_medico_id())
  );
$$;

-- ──────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- MÉDICOS
-- ──────────────────────────────────────────────
CREATE POLICY "medicos_select" ON public.medicos FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin' OR get_staff_medico_id() = id);

CREATE POLICY "medicos_update" ON public.medicos FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- STAFF CLÍNICO (enfermería / secretaría)
-- ──────────────────────────────────────────────
CREATE POLICY "staff_select" ON public.staff_clinico FOR SELECT
  USING (id = auth.uid() OR medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "staff_insert" ON public.staff_clinico FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "staff_update" ON public.staff_clinico FOR UPDATE
  USING (get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- PACIENTES
-- ──────────────────────────────────────────────
-- Datos demográficos/de contacto — no son ficha clínica. Visible para el
-- médico tratante, su equipo (enfermería/secretaría), el propio paciente
-- y el administrador (gestión de cuentas).
CREATE POLICY "pacientes_select" ON public.pacientes FOR SELECT
  USING (
    id = auth.uid()
    OR medico_id = auth.uid()
    OR medico_id = get_staff_medico_id()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "pacientes_insert" ON public.pacientes FOR INSERT
  WITH CHECK (get_user_role() IN ('medico', 'admin'));

-- El administrador puede actualizar (activar/desactivar cuenta), pero la
-- ficha clínica propiamente tal vive en otras tablas que el admin no
-- puede escribir (ver más abajo).
CREATE POLICY "pacientes_update" ON public.pacientes FOR UPDATE
  USING (
    id = auth.uid()
    OR medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- ──────────────────────────────────────────────
-- CONSENTIMIENTOS INFORMADOS
-- ──────────────────────────────────────────────
-- Nunca se actualiza ni se borra una fila: para revocar se agrega un
-- registro con revocado=true. El administrador puede LEER (para el
-- módulo de cumplimiento legal) pero nunca crear ni revocar un
-- consentimiento — esa acción es exclusiva del médico o el paciente.
CREATE POLICY "consentimientos_select" ON public.consentimientos FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "consentimientos_insert" ON public.consentimientos FOR INSERT
  WITH CHECK (
    paciente_id = auth.uid()
    OR get_user_role() = 'medico'
  );

-- ──────────────────────────────────────────────
-- FICHAS CLÍNICAS — el administrador solo lee (auditoría)
-- ──────────────────────────────────────────────
CREATE POLICY "fichas_select" ON public.fichas_clinicas FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "fichas_insert" ON public.fichas_clinicas FOR INSERT
  WITH CHECK (medico_id = auth.uid());

CREATE POLICY "fichas_update" ON public.fichas_clinicas FOR UPDATE
  USING (medico_id = auth.uid());

-- ──────────────────────────────────────────────
-- MEDICAMENTOS — el administrador solo lee
-- ──────────────────────────────────────────────
CREATE POLICY "medicamentos_select" ON public.medicamentos FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR prescrito_por = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "medicamentos_insert" ON public.medicamentos FOR INSERT
  WITH CHECK (get_user_role() = 'medico');

-- Solo se permite UPDATE para dar de baja (activo=false) una prescripción
-- propia; el historial se preserva agregando una fila nueva que la
-- reemplaza (columna reemplaza_a), nunca reescribiendo su contenido.
CREATE POLICY "medicamentos_update" ON public.medicamentos FOR UPDATE
  USING (prescrito_por = auth.uid());

-- ──────────────────────────────────────────────
-- PLANES DE SEGUIMIENTO — el administrador solo lee
-- ──────────────────────────────────────────────
CREATE POLICY "planes_select" ON public.planes_seguimiento FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "planes_insert" ON public.planes_seguimiento FOR INSERT
  WITH CHECK (medico_id = auth.uid());

CREATE POLICY "planes_update" ON public.planes_seguimiento FOR UPDATE
  USING (medico_id = auth.uid());

-- ──────────────────────────────────────────────
-- REGISTROS CLÍNICOS
-- ──────────────────────────────────────────────
-- Paciente registra y ve los propios; médico y enfermería (equipo de
-- cuidado) ven y registran los de sus pacientes; el administrador
-- solo lee.
CREATE POLICY "registros_select" ON public.registros_clinicos FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "registros_insert" ON public.registros_clinicos FOR INSERT
  WITH CHECK (
    paciente_id = auth.uid()
    OR get_user_role() IN ('medico', 'enfermeria')
  );

CREATE POLICY "registros_update" ON public.registros_clinicos FOR UPDATE
  USING (
    (paciente_id = auth.uid() AND registrado_por = 'paciente')
    OR is_care_team_for(paciente_id)
  );

-- ──────────────────────────────────────────────
-- ALERTAS — resolverlas es un acto clínico; el administrador solo lee
-- ──────────────────────────────────────────────
CREATE POLICY "alertas_select" ON public.alertas FOR SELECT
  USING (
    medico_id = auth.uid()
    OR paciente_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "alertas_update" ON public.alertas FOR UPDATE
  USING (medico_id = auth.uid());

-- ──────────────────────────────────────────────
-- EVOLUCIONES (SOAP) — inalterables: solo SELECT e INSERT.
-- Deliberadamente NO existen políticas de UPDATE ni DELETE.
-- ──────────────────────────────────────────────
CREATE POLICY "evoluciones_select" ON public.evoluciones FOR SELECT
  USING (
    medico_id = auth.uid()
    OR paciente_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "evoluciones_insert" ON public.evoluciones FOR INSERT
  WITH CHECK (medico_id = auth.uid());

-- ──────────────────────────────────────────────
-- EXÁMENES — el administrador solo lee
-- ──────────────────────────────────────────────
CREATE POLICY "examenes_select" ON public.examenes FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR is_care_team_for(paciente_id)
    OR get_user_role() = 'admin'
  );

CREATE POLICY "examenes_insert" ON public.examenes FOR INSERT
  WITH CHECK (
    paciente_id = auth.uid()
    OR get_user_role() IN ('medico', 'enfermeria')
  );

-- ──────────────────────────────────────────────
-- NOTIFICACIONES
-- ──────────────────────────────────────────────
CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT
  USING (usuario_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "notif_update" ON public.notificaciones FOR UPDATE
  USING (usuario_id = auth.uid());

-- ──────────────────────────────────────────────
-- AUDITORÍA — cualquier usuario autenticado puede insertar SU PROPIA
-- acción (nunca en nombre de otro); solo el admin puede leer el log.
-- No existen políticas de UPDATE ni DELETE: la auditoría es inmutable.
-- ──────────────────────────────────────────────
CREATE POLICY "audit_select" ON public.auditoria FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "audit_insert" ON public.auditoria FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- ──────────────────────────────────────────────
-- CONFIGURACIÓN DE UMBRALES — configuración de sistema, no ficha
-- clínica de un paciente puntual; el admin sí administra esto.
-- ──────────────────────────────────────────────
CREATE POLICY "config_alertas_select" ON public.config_alertas FOR SELECT
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "config_alertas_insert" ON public.config_alertas FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "config_alertas_update" ON public.config_alertas FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- CONTROLES (agenda) — la secretaría gestiona la agenda de su médico;
-- no es contenido clínico. El administrador solo lee.
-- ──────────────────────────────────────────────
CREATE POLICY "controles_select" ON public.controles FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR medico_id = get_staff_medico_id()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "controles_insert" ON public.controles FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR medico_id = get_staff_medico_id());

CREATE POLICY "controles_update" ON public.controles FOR UPDATE
  USING (medico_id = auth.uid() OR medico_id = get_staff_medico_id());
