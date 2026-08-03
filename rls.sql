-- ============================================================
-- ARM Seguimiento Médico — Row Level Security (RLS)
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes            ENABLE ROW LEVEL SECURITY;
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

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ──────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────
-- Cada usuario ve y edita su propio perfil; admin ve todos
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- MÉDICOS
-- ──────────────────────────────────────────────
-- Médico ve su propio registro; admin ve todos
CREATE POLICY "medicos_select" ON public.medicos FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "medicos_update" ON public.medicos FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- PACIENTES
-- ──────────────────────────────────────────────
-- Médico ve solo sus pacientes; paciente ve su propio registro; admin ve todos
CREATE POLICY "pacientes_select" ON public.pacientes FOR SELECT
  USING (
    id = auth.uid()
    OR medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "pacientes_insert" ON public.pacientes FOR INSERT
  WITH CHECK (get_user_role() IN ('medico', 'admin'));

CREATE POLICY "pacientes_update" ON public.pacientes FOR UPDATE
  USING (
    medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- ──────────────────────────────────────────────
-- FICHAS CLÍNICAS
-- ──────────────────────────────────────────────
CREATE POLICY "fichas_select" ON public.fichas_clinicas FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "fichas_insert" ON public.fichas_clinicas FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "fichas_update" ON public.fichas_clinicas FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- MEDICAMENTOS
-- ──────────────────────────────────────────────
CREATE POLICY "medicamentos_select" ON public.medicamentos FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR prescrito_por = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.medico_id = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "medicamentos_insert" ON public.medicamentos FOR INSERT
  WITH CHECK (get_user_role() IN ('medico', 'admin'));

CREATE POLICY "medicamentos_update" ON public.medicamentos FOR UPDATE
  USING (prescrito_por = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- PLANES DE SEGUIMIENTO
-- ──────────────────────────────────────────────
CREATE POLICY "planes_select" ON public.planes_seguimiento FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "planes_insert" ON public.planes_seguimiento FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "planes_update" ON public.planes_seguimiento FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- REGISTROS CLÍNICOS
-- ──────────────────────────────────────────────
-- Paciente registra y ve sus propios; médico ve los de sus pacientes
CREATE POLICY "registros_select" ON public.registros_clinicos FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.medico_id = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "registros_insert" ON public.registros_clinicos FOR INSERT
  WITH CHECK (
    paciente_id = auth.uid()
    OR get_user_role() IN ('medico', 'admin')
  );

CREATE POLICY "registros_update" ON public.registros_clinicos FOR UPDATE
  USING (
    (paciente_id = auth.uid() AND registrado_por = 'paciente')
    OR EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.medico_id = auth.uid())
    OR get_user_role() = 'admin'
  );

-- ──────────────────────────────────────────────
-- ALERTAS
-- ──────────────────────────────────────────────
CREATE POLICY "alertas_select" ON public.alertas FOR SELECT
  USING (
    medico_id = auth.uid()
    OR paciente_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "alertas_update" ON public.alertas FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- EVOLUCIONES
-- ──────────────────────────────────────────────
CREATE POLICY "evoluciones_select" ON public.evoluciones FOR SELECT
  USING (
    medico_id = auth.uid()
    OR paciente_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "evoluciones_insert" ON public.evoluciones FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- EXÁMENES
-- ──────────────────────────────────────────────
CREATE POLICY "examenes_select" ON public.examenes FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.medico_id = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "examenes_insert" ON public.examenes FOR INSERT
  WITH CHECK (
    paciente_id = auth.uid()
    OR get_user_role() IN ('medico', 'admin')
  );

-- ──────────────────────────────────────────────
-- NOTIFICACIONES
-- ──────────────────────────────────────────────
CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT
  USING (usuario_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "notif_update" ON public.notificaciones FOR UPDATE
  USING (usuario_id = auth.uid());

-- ──────────────────────────────────────────────
-- AUDITORÍA (solo lectura para admins)
-- ──────────────────────────────────────────────
CREATE POLICY "audit_select" ON public.auditoria FOR SELECT
  USING (get_user_role() = 'admin');

-- Config alertas: solo médicos y admin
CREATE POLICY "config_alertas_select" ON public.config_alertas FOR SELECT
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "config_alertas_insert" ON public.config_alertas FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "config_alertas_update" ON public.config_alertas FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');

-- Controles
CREATE POLICY "controles_select" ON public.controles FOR SELECT
  USING (
    paciente_id = auth.uid()
    OR medico_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "controles_insert" ON public.controles FOR INSERT
  WITH CHECK (medico_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "controles_update" ON public.controles FOR UPDATE
  USING (medico_id = auth.uid() OR get_user_role() = 'admin');
