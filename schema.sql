-- ============================================================
-- ARM Seguimiento Médico — Schema de Base de Datos
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- para jobs automáticos (opcional)

-- ──────────────────────────────────────────────
-- 1. PERFILES DE USUARIO
-- ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('admin', 'medico', 'enfermeria', 'secretaria', 'paciente')),
  nombre_completo   TEXT NOT NULL,
  email             TEXT NOT NULL,
  telefono          TEXT,
  avatar_url        TEXT,
  activo            BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 2. MÉDICOS
-- ──────────────────────────────────────────────
CREATE TABLE public.medicos (
  id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  especialidad      TEXT DEFAULT 'Médico General',
  numero_registro   TEXT,
  institucion       TEXT,
  firma_url         TEXT
);

-- ──────────────────────────────────────────────
-- 2b. PERSONAL CLÍNICO/ADMINISTRATIVO (Enfermería, Secretaría)
-- ──────────────────────────────────────────────
-- Rol operativo asociado a un médico (equipo de apoyo). El detalle del
-- cargo (p.ej. "Enfermera universitaria") es texto libre; el control de
-- acceso real se basa en profiles.role ('enfermeria' | 'secretaria').
CREATE TABLE public.staff_clinico (
  id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  medico_id         UUID REFERENCES public.medicos(id),
  cargo             TEXT
);

-- ──────────────────────────────────────────────
-- 3. PACIENTES
-- ──────────────────────────────────────────────
CREATE TABLE public.pacientes (
  id                             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rut                            TEXT UNIQUE,
  fecha_nacimiento               DATE,
  sexo                           CHAR(1) CHECK (sexo IN ('M', 'F', 'O')),
  direccion                      TEXT,
  ciudad                         TEXT,
  region                         TEXT DEFAULT 'Región del Libertador General Bernardo O''Higgins',
  contacto_emergencia_nombre     TEXT,
  contacto_emergencia_telefono   TEXT,
  contacto_emergencia_relacion   TEXT,
  medico_id                      UUID REFERENCES public.medicos(id),
  activo                         BOOLEAN DEFAULT true,
  created_at                     TIMESTAMPTZ DEFAULT now(),
  updated_at                     TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 3b. CONSENTIMIENTOS INFORMADOS (versionado, Ley N.º 20.584)
-- ──────────────────────────────────────────────
-- Cada aceptación queda como una fila propia — nunca se sobrescribe.
-- El estado vigente de un paciente es la fila más reciente sin revocar.
CREATE TABLE public.consentimientos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  version_documento   TEXT NOT NULL DEFAULT '1.0',
  aceptado            BOOLEAN NOT NULL DEFAULT true,
  registrado_por       UUID REFERENCES public.profiles(id),
  fecha_aceptacion    TIMESTAMPTZ DEFAULT now(),
  revocado            BOOLEAN DEFAULT false,
  fecha_revocacion    TIMESTAMPTZ,
  motivo_revocacion   TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 4. FICHAS CLÍNICAS
-- ──────────────────────────────────────────────
CREATE TABLE public.fichas_clinicas (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id                 UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id                   UUID NOT NULL REFERENCES public.medicos(id),

  -- Diagnósticos
  diagnosticos                TEXT[],        -- ['Hipertensión arterial (I10)', 'Hipotiroidismo (E03.9)']
  alergias                    TEXT[],
  patologias_cronicas         TEXT[],
  factores_riesgo             TEXT[],

  -- Antecedentes
  antecedentes_medicos        TEXT,
  antecedentes_quirurgicos    TEXT,
  antecedentes_familiares     TEXT,
  habitos                     TEXT,

  -- Medidas base
  peso_kg                     NUMERIC(5,2),
  talla_cm                    NUMERIC(5,1),

  -- Auditoría
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 5. MEDICAMENTOS
-- ──────────────────────────────────────────────
CREATE TABLE public.medicamentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id           UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nombre                TEXT NOT NULL,
  principio_activo      TEXT,
  dosis                 TEXT NOT NULL,
  frecuencia            TEXT NOT NULL,
  horarios              TEXT[],           -- ['08:00', '20:00']
  via_administracion    TEXT DEFAULT 'oral',
  indicaciones          TEXT,
  fecha_inicio          DATE NOT NULL,
  fecha_fin             DATE,
  activo                BOOLEAN DEFAULT true,
  motivo_termino        TEXT,   -- por qué se suspendió/reemplazó (si aplica)
  reemplaza_a           UUID REFERENCES public.medicamentos(id),  -- entrada anterior que esta reemplaza (historial encadenado)
  prescrito_por         UUID REFERENCES public.medicos(id),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 6. PLANES DE SEGUIMIENTO
-- ──────────────────────────────────────────────
CREATE TABLE public.planes_seguimiento (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id         UUID NOT NULL REFERENCES public.medicos(id),
  nombre            TEXT NOT NULL,
  descripcion       TEXT,
  tipo              TEXT,   -- 'presion', 'glicemia', 'saturacion', 'peso', 'multi'
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE,
  duracion_dias     INTEGER,
  estado            TEXT DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'completado', 'cancelado', 'pausado')),
  objetivos         JSONB,  -- {'presion_sistolica_max': 140, 'glicemia_ayunas_max': 126}
  frecuencia_registros TEXT DEFAULT 'diaria', -- 'diaria', '2 veces al dia', 'semanal'
  instrucciones_paciente TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 7. REGISTROS CLÍNICOS (vitales enviados por el paciente)
-- ──────────────────────────────────────────────
CREATE TABLE public.registros_clinicos (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id             UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  plan_id                 UUID REFERENCES public.planes_seguimiento(id),

  -- Presión arterial
  presion_sistolica       INTEGER,
  presion_diastolica      INTEGER,
  pulso                   INTEGER,

  -- Glucosa
  glicemia                NUMERIC(6,2),
  glicemia_tipo           TEXT CHECK (glicemia_tipo IN ('ayunas', 'postprandial', 'aleatoria')),

  -- Saturación
  saturacion_o2           NUMERIC(5,2),

  -- Otros vitales
  peso_kg                 NUMERIC(5,2),
  temperatura_c           NUMERIC(4,1),
  frecuencia_cardiaca     INTEGER,
  frecuencia_respiratoria INTEGER,

  -- Síntomas
  sintomas                TEXT[],        -- ['cefalea', 'mareo', 'dolor_pecho']
  observaciones           TEXT,

  -- Medicamento
  medicamentos_tomados    JSONB,  -- [{"id": "...", "tomado": true, "hora_real": "08:10"}]

  -- Meta
  registrado_por          TEXT DEFAULT 'paciente' CHECK (registrado_por IN ('paciente', 'medico', 'enfermera')),
  revisado_por_medico     BOOLEAN DEFAULT false,
  fecha_revision          TIMESTAMPTZ,
  fecha_registro          TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 8. CONTROLES PROGRAMADOS
-- ──────────────────────────────────────────────
CREATE TABLE public.controles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id         UUID NOT NULL REFERENCES public.medicos(id),
  plan_id           UUID REFERENCES public.planes_seguimiento(id),
  fecha_programada  TIMESTAMPTZ NOT NULL,
  tipo              TEXT DEFAULT 'control'
                    CHECK (tipo IN ('control', 'urgencia', 'teleconsulta', 'domiciliaria')),
  estado            TEXT DEFAULT 'programado'
                    CHECK (estado IN ('programado', 'realizado', 'cancelado', 'reprogramado')),
  motivo            TEXT,
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 9. EVOLUCIONES MÉDICAS (SOAP)
-- ──────────────────────────────────────────────
CREATE TABLE public.evoluciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id         UUID NOT NULL REFERENCES public.medicos(id),
  plan_id           UUID REFERENCES public.planes_seguimiento(id),
  control_id        UUID REFERENCES public.controles(id),

  -- Formato SOAP
  subjetivo         TEXT,  -- Síntomas referidos por el paciente
  objetivo          TEXT,  -- Hallazgos del examen
  evaluacion        TEXT,  -- Diagnóstico / impresión clínica
  plan              TEXT,  -- Plan de acción

  -- Firma electrónica e inalterabilidad: no existe política de UPDATE/DELETE
  -- para esta tabla (ver rls.sql) — toda corrección se agrega como una
  -- evolución nueva que referencia a la original.
  firmada_at            TIMESTAMPTZ DEFAULT now(),
  corrige_evolucion_id  UUID REFERENCES public.evoluciones(id),

  fecha_evolucion   TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 10. EXÁMENES
-- ──────────────────────────────────────────────
CREATE TABLE public.examenes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id     UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id       UUID REFERENCES public.medicos(id),
  tipo            TEXT NOT NULL,   -- 'laboratorio', 'imagen', 'ecg', 'espirometria', 'otro'
  nombre          TEXT NOT NULL,
  fecha_examen    DATE NOT NULL,
  archivo_url     TEXT,
  mime_type       TEXT,
  tamano_bytes    INTEGER,
  comentarios     TEXT,
  estado          TEXT DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'revisado', 'validado')),
  subido_por      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 11. ALERTAS
-- ──────────────────────────────────────────────
CREATE TABLE public.alertas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         UUID NOT NULL REFERENCES public.pacientes(id),
  medico_id           UUID NOT NULL REFERENCES public.medicos(id),
  registro_id         UUID REFERENCES public.registros_clinicos(id),
  tipo                TEXT NOT NULL,
  -- tipos: presion_alta, presion_baja, taquicardia, bradicardia,
  --        hiperglicemia, hipoglicemia, saturacion_baja, fiebre,
  --        inactividad, omision_medicamento
  severidad           TEXT DEFAULT 'media'
                      CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  valor_detectado     TEXT,
  umbral_configurado  TEXT,
  leida               BOOLEAN DEFAULT false,
  leida_at            TIMESTAMPTZ,
  resuelta            BOOLEAN DEFAULT false,
  resuelta_at         TIMESTAMPTZ,
  resuelta_por        UUID REFERENCES public.medicos(id),
  fecha_alerta        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 12. CONFIGURACIÓN DE UMBRALES POR MÉDICO/PACIENTE
-- ──────────────────────────────────────────────
CREATE TABLE public.config_alertas (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id                   UUID NOT NULL REFERENCES public.medicos(id),
  paciente_id                 UUID REFERENCES public.pacientes(id),  -- null = para todos
  presion_sistolica_max       INTEGER DEFAULT 140,
  presion_sistolica_min       INTEGER DEFAULT 90,
  presion_diastolica_max      INTEGER DEFAULT 90,
  presion_diastolica_min      INTEGER DEFAULT 60,
  frecuencia_cardiaca_max     INTEGER DEFAULT 100,
  frecuencia_cardiaca_min     INTEGER DEFAULT 50,
  glicemia_ayunas_max         NUMERIC DEFAULT 126,
  glicemia_postprandial_max   NUMERIC DEFAULT 200,
  glicemia_min                NUMERIC DEFAULT 70,
  saturacion_min              NUMERIC DEFAULT 92,
  temperatura_max             NUMERIC DEFAULT 38.0,
  dias_inactividad_alerta     INTEGER DEFAULT 2,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 13. NOTIFICACIONES
-- ──────────────────────────────────────────────
CREATE TABLE public.notificaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES public.profiles(id),
  tipo            TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  mensaje         TEXT,
  leida           BOOLEAN DEFAULT false,
  datos           JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 14. AUDITORÍA
-- ──────────────────────────────────────────────
CREATE TABLE public.auditoria (
  id                BIGSERIAL PRIMARY KEY,
  usuario_id        UUID REFERENCES public.profiles(id),
  tabla             TEXT NOT NULL,
  operacion         TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  registro_id       TEXT,
  datos_anteriores  JSONB,
  datos_nuevos      JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────
CREATE INDEX idx_pacientes_medico         ON public.pacientes(medico_id);
CREATE INDEX idx_registros_paciente       ON public.registros_clinicos(paciente_id);
CREATE INDEX idx_registros_plan           ON public.registros_clinicos(plan_id);
CREATE INDEX idx_registros_fecha          ON public.registros_clinicos(fecha_registro DESC);
CREATE INDEX idx_alertas_medico           ON public.alertas(medico_id);
CREATE INDEX idx_alertas_paciente         ON public.alertas(paciente_id);
CREATE INDEX idx_alertas_resuelta         ON public.alertas(resuelta) WHERE resuelta = false;
CREATE INDEX idx_planes_paciente          ON public.planes_seguimiento(paciente_id);
CREATE INDEX idx_planes_estado            ON public.planes_seguimiento(estado) WHERE estado = 'activo';
CREATE INDEX idx_notificaciones_usuario   ON public.notificaciones(usuario_id, leida);
CREATE INDEX idx_auditoria_tabla          ON public.auditoria(tabla, created_at DESC);
CREATE INDEX idx_consentimientos_paciente ON public.consentimientos(paciente_id, created_at DESC);
CREATE INDEX idx_staff_medico             ON public.staff_clinico(medico_id);
CREATE INDEX idx_medicamentos_reemplaza   ON public.medicamentos(reemplaza_a);

-- ──────────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at       BEFORE UPDATE ON public.profiles        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pacientes_updated_at      BEFORE UPDATE ON public.pacientes       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fichas_updated_at         BEFORE UPDATE ON public.fichas_clinicas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_planes_updated_at         BEFORE UPDATE ON public.planes_seguimiento FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_config_alertas_updated_at BEFORE UPDATE ON public.config_alertas  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────
-- TRIGGER: Crear profile al registrar usuario
-- ──────────────────────────────────────────────
-- El proyecto de Supabase es compartido con otras apps (Mi Vehículo,
-- MiFran, ARM Mascotas, Drive, Emprendedores), cada una con su propio
-- trigger en auth.users. Sin el candado de abajo, CUALQUIER registro en
-- CUALQUIERA de esas apps también creaba acá un profile (role
-- 'paciente') para gente que nunca abrió esta app — de hecho, HOY esta
-- app no tiene ningún formulario de registro propio (solo login), así
-- que TODAS las filas actuales de `profiles` vinieron de otras apps.
--
-- Si en el futuro se agrega un registro/invitación real para esta app,
-- ese flujo debe mandar {"producto": "medico"} en los metadatos del
-- usuario (options.data en supabase.auth.signUp(), o user_metadata al
-- invitar desde el dashboard) para que este trigger actúe.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF coalesce(NEW.raw_user_meta_data->>'producto', '') <> 'medico' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, role, nombre_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'paciente'),
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    NEW.email
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
