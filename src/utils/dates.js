// src/utils/dates.js
//
// Centraliza la interpretación de rangos de fechas.
// POR AHORA se conserva el margen actual ±6 horas y el clamp a "ahora".
// No se corrige timezone en esta etapa.

import "../config/env.js";
import moment from "moment-timezone";

const DEFAULT_TIMEZONE = "America/Mexico_City";

function getTimezone() {
  return process.env.TIMEZONE || DEFAULT_TIMEZONE;
}

/**
 * Rango diario usado por el scheduler/worker.
 *
 * Conserva el comportamiento previo de projectWorker:
 * - día local (America/Mexico_City) daysAgo
 * - margen ±6 horas
 * - nunca solicitar una fecha futura (clamp con now)
 * - salida en UTC YYYY-MM-DDTHH:mm:ssZ
 */
export function generateDailyRange(daysAgo = 1) {
  const timezone = getTimezone();
  const now = moment.tz(timezone);

  const startLocal = now
    .clone()
    .subtract(daysAgo, "days")
    .startOf("day");

  const endLocal = startLocal.clone().endOf("day");

  // Margen actual de 6 horas
  const toDesired = endLocal.clone().add(6, "hours");

  // Nunca solicitar una fecha futura
  const toFinal = moment.min(toDesired, now);

  const from = startLocal
    .clone()
    .subtract(6, "hours")
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss[Z]");

  const to = toFinal
    .clone()
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss[Z]");

  console.log(`📅 Rango de fechas: from=${from}, to=${to}`);

  return { from, to };
}

/**
 * Rango manual a partir de fechas YYYY-MM-DD (zona America/Mexico_City).
 *
 * Conserva el margen ±6 horas del camino manual histórico:
 * - from = inicio del día fromDate − 6h
 * - to   = fin del día toDate + 6h
 *
 * No aplica clamp a "ahora" (el fetch manual histórico tampoco lo hacía).
 */
export function generateManualRange(fromDate, toDate) {
  const timezone = getTimezone();

  const startLocal = moment.tz(fromDate, "YYYY-MM-DD", timezone).startOf("day");
  const endLocal = moment.tz(toDate, "YYYY-MM-DD", timezone).endOf("day");

  if (!startLocal.isValid() || !endLocal.isValid()) {
    throw new Error(
      `Fechas inválidas. Use YYYY-MM-DD. Recibido: from=${fromDate}, to=${toDate}`
    );
  }

  if (endLocal.isBefore(startLocal)) {
    throw new Error(
      `El rango es inválido: from=${fromDate} es posterior a to=${toDate}`
    );
  }

  const from = startLocal
    .clone()
    .subtract(6, "hours")
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss[Z]");

  const to = endLocal
    .clone()
    .add(6, "hours")
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss[Z]");

  console.log(`📅 Rango manual: from=${from}, to=${to}`);

  return { from, to };
}

/**
 * Convierte un timestamp REST de Blue a DATETIME local America/Mexico_City.
 *
 * Evidencia confirmada:
 * - 2026-07-29T02:05:55   (naive ISO) -> 2026-07-28 20:05:55
 * - 2026-07-29T01:38:26Z  (UTC)       -> 2026-07-28 19:38:26
 *
 * Un ISO sin zona se interpreta como UTC, igual que el caso con Z.
 */
export function normalizeBlueDateToMexico(value) {
  if (value == null || value === "") {
    return null;
  }

  const timezone = getTimezone();
  const raw = String(value).trim();
  let parsed;

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    parsed = moment.parseZone(raw);
  } else if (raw.includes("T")) {
    parsed = moment.utc(raw);
  } else {
    parsed = moment.utc(raw);
  }

  if (!parsed.isValid()) {
    return null;
  }

  return parsed.tz(timezone).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Normaliza una fecha/hora que ya viene en hora local de México.
 * No aplica conversión de zona. Solo formatea a DATETIME MySQL.
 *
 * Ejemplo: "2026-07-28 19:38" -> "2026-07-28 19:38:00"
 */
export function normalizeLocalDateTime(value) {
  if (value == null || value === "") {
    return null;
  }

  const raw = String(value).trim();
  const parsed = moment(
    raw,
    ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm", "YYYY-MM-DD"],
    true
  );

  if (!parsed.isValid()) {
    return null;
  }

  return parsed.format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Normaliza un valor DATE (sin conversión de zona).
 *
 * Ejemplo: "2026-07-28" -> "2026-07-28"
 */
export function normalizeBlueDateOnly(value) {
  if (value == null || value === "") {
    return null;
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = moment(
    raw,
    ["YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
    true
  );

  if (!parsed.isValid()) {
    return null;
  }

  return parsed.format("YYYY-MM-DD");
}
