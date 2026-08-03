# ARM Seguimiento Médico

Sistema de monitoreo y seguimiento clínico para médicos y pacientes.

## Estructura

```
arm-seguimiento-medico/
├── index.html          → Login
├── app.html            → Aplicación principal (SPA)
├── css/
│   ├── variables.css   → Design tokens (colores, tipografía, etc.)
│   ├── login.css       → Estilos del login
│   └── app.css         → Layout + todos los componentes
├── js/
│   ├── config.js         → ⚠️ Credenciales de Supabase (a configurar)
│   ├── db.js             → Capa de datos (mock + Supabase real)
│   ├── app.js            → Entry point, router, sidebar, notificaciones
│   ├── modals.js         → Modales (ficha clínica, registro vital, evolución SOAP, cerrar sesión)
│   ├── pdf.js             → Exportación de ficha clínica a PDF (jsPDF)
│   ├── charts.js          → Gráficos de evolución (Chart.js) con filtros de rango
│   ├── validators.js      → Validación de RUT, teléfono y correo
│   └── views/
│       ├── dashboard.js         → Vista médica: lista y detalle de pacientes
│       ├── alertas.js           → Vista de alertas
│       ├── reportes.js          → Vista de reportes
│       ├── paciente.js          → Portal del paciente (rol paciente + vista previa médico)
│       ├── perfil.js            → "Mi perfil" del paciente (contacto + consentimiento)
│       ├── auditoria.js         → Vista de auditoría (rol Administrador)
│       ├── admin-dashboard.js   → Métricas del sistema (rol Administrador)
│       ├── admin-pacientes.js   → Vista global de pacientes (rol Administrador)
│       ├── admin-usuarios.js    → Gestión de médicos/pacientes (rol Administrador)
│       └── admin-config-alertas.js → Umbrales de alerta configurables (rol Administrador)
├── schema.sql          → Tablas e índices
└── rls.sql             → Políticas de seguridad (Row Level Security)
```

## Setup rápido (Modo Demo)

**No requiere Supabase.** Abre `index.html` en un servidor local:

```bash
# Opción 1: Python
python -m http.server 3000
# luego visitar http://localhost:3000

# Opción 2: VS Code → Live Server (botón "Go Live")
```

**Credenciales de demo:**
- Médico: `doctor@arm.cl` / `demo1234`
- Paciente: `paciente@arm.cl` / `demo1234`
- Administrador: `admin@arm.cl` / `demo1234` (dashboard, pacientes, usuarios, umbrales de alerta, auditoría)

## Setup con Supabase Real

1. Crear proyecto en https://supabase.com

2. Ir a **SQL Editor** y ejecutar en orden:
   ```
   sql/schema.sql
   sql/rls.sql
   ```

3. Editar `js/config.js`:
   ```javascript
   const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...tu_key...';
   ```

4. En Supabase → Storage → crear bucket `examenes` (público)

5. Crear primer usuario médico en Supabase → Authentication → Add User
   - Email: el del médico
   - En `raw_user_meta_data` poner: `{"role": "medico", "nombre_completo": "Dr. Nombre"}`

## Tecnologías

- **Frontend**: HTML5 + CSS3 + JavaScript ES Modules (sin frameworks)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Charts**: Chart.js 4.x (CDN)
- **Fuente**: Inter (Google Fonts)

## Módulos del MVP

- [x] Login (médico / paciente)
- [x] Dashboard: stats + lista pacientes + detalle
- [x] Fichas clínicas
- [x] Planes de seguimiento
- [x] Registros clínicos (vitales)
- [x] Gráficos de evolución (Chart.js)
- [x] Alertas clínicas
- [x] Exámenes adjuntos
- [x] Seguimientos overview
- [x] Módulo de evoluciones SOAP
- [x] Generación de PDF (ficha clínica / resumen de evolución)
- [x] Vista/portal del paciente (rol paciente + vista previa del médico)
- [x] Centro de notificaciones (in-app; push al navegador queda para una fase posterior)
- [x] Auditoría de cambios (quién/cuándo/qué; vista de solo lectura para rol Administrador)
- [x] Consentimiento informado (Ley 20.584) al crear ficha clínica, con estado visible en la ficha y en "Mi perfil"
- [x] Perfil del paciente ("Mi perfil": datos de contacto editables + gestión de consentimiento)
- [x] Gráficos de Presión arterial, Glicemia, Peso, Frecuencia cardíaca y Cumplimiento de medicamentos, con filtros Semana/Mes/3 meses/Personalizado
- [x] Validación de RUT (dígito verificador), teléfono y correo electrónico en ficha clínica y "Mi perfil"
- [x] Cálculo de IMC en vivo al ingresar peso y talla
- [x] Modal de confirmación de cierre de sesión con el diseño de la app (reemplaza el `confirm()` nativo)
- [x] Módulo de Administrador completo: dashboard de métricas, vista global de pacientes, gestión de médicos/pacientes (activar/desactivar/crear médico) y configuración de umbrales de alerta (afecta la generación real de alertas)
- [x] Validación de RUT/teléfono/correo en vivo (al salir del campo) en ficha clínica, "Mi perfil", nuevo médico y login
- [x] Campo "N.º de registro" de nuevo médico acepta solo dígitos
- [x] Trazabilidad de accesos (Ley 20.584): auditoría registra también cuando un médico/admin consulta (no solo modifica) la ficha de un paciente
- [x] Menú mobile: botón hamburguesa + overlay para abrir/cerrar el sidebar en pantallas ≤768px (antes quedaba oculto sin forma de reabrirlo) y tablas anchas (auditoría, pacientes admin) con scroll horizontal en vez de recortarse

## ARM Sistemas — Santiago, Chile
