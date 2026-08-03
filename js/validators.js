/* ============================================================
   ARM Seguimiento Médico — Validadores de formato
   RUT chileno (módulo 11) · Teléfono · Correo electrónico
   ============================================================ */

/** Valida un RUT chileno (formato y dígito verificador, módulo 11) */
export function isValidRut(rut) {
  if (!rut) return false;
  const clean = rut.replace(/[.\s]/g, '').toUpperCase();
  if (!/^\d{7,8}-[0-9K]$/.test(clean)) return false;

  const [body, dv] = clean.split('-');
  let suma = 0;
  let multiplo = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsperado;
}

/** Formatea un RUT limpio (12345678K) a formato con puntos y guión (12.345.678-K) */
export function formatRut(rut) {
  if (!rut) return '';
  const clean = rut.replace(/[.\s-]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

/** Valida un teléfono chileno (móvil o fijo, con o sin +56) */
export function isValidTelefono(tel) {
  if (!tel) return false;
  const cleaned = tel.replace(/[\s\-()]/g, '');
  return /^(\+?56)?[2-9]\d{7,8}$/.test(cleaned);
}

/** Valida formato de correo electrónico */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Muestra el error de formato de inmediato (al salir del campo) y lo limpia
 * en cuanto el valor vuelve a ser válido. No molesta mientras el usuario
 * todavía está escribiendo (recién valida ni bien pierde el foco).
 */
export function wireLiveValidation(id, validatorFn, msg, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  const check = () => {
    const val = el.value.trim();
    const group = el.closest('.input-group') || el.parentElement;
    let err = group.querySelector('.field-error');

    if (!val || validatorFn(val)) {
      el.classList.remove('error');
      err?.remove();
      if (val && opts.formatFn) el.value = opts.formatFn(val);
      return;
    }

    el.classList.add('error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      group.appendChild(err);
    }
    err.textContent = msg;
  };

  el.addEventListener('blur', check);
  el.addEventListener('input', () => { if (el.classList.contains('error')) check(); });
}
