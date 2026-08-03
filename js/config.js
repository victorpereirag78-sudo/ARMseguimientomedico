/* ============================================================
   ARM Seguimiento Médico — Configuración Supabase
   ============================================================

   ➡️  INSTRUCCIONES DE SETUP:
   1. Accede a https://supabase.com → tu proyecto → Settings → API
   2. Copia "Project URL" → SUPABASE_URL
   3. Copia "anon public key" → SUPABASE_ANON_KEY
   4. Mientras no tengas usuarios creados en Supabase, deja DEMO_MODE = true

   ⚠️  IMPORTANTE: Nunca publiques estas credenciales en un repo público.
   ============================================================ */

const SUPABASE_URL     = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/* ── MODO DEMO ─────────────────────────────────────────────────
   true  → usa datos de ejemplo. Login con doctor@arm.cl / demo1234
           o paciente@arm.cl / demo1234. NO toca Supabase.

   false → usa autenticación real de Supabase. Requiere que los
           usuarios existan en tu proyecto de Supabase.
──────────────────────────────────────────────────────────────── */
const DEMO_MODE = true;   // ← cambia a false cuando tengas usuarios en Supabase

/* ── Cliente Supabase (se inicializa solo si no es demo) ─────── */
let supabaseClient = null;

if (!DEMO_MODE && typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}
