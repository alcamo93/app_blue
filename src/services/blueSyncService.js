// src/services/blueSyncService.js
// Orquestación común: API → mapRecord → UPSERT → stats.

import { iterateFills } from "./blueApiClient.js";
import { upsertRecord } from "../repositories/blueDataRepository.js";

/**
 * Sincroniza un proyecto BlueMessaging hacia su tabla MySQL allowlisted.
 *
 * @param {object} options
 * @param {object} options.project - configuración del registry
 * @param {{ from: string, to: string }} options.range
 * @param {string} [options.dateField] - override (p.ej. blue_templates.date_field)
 * @returns {Promise<{ api_received: number, inserted: number, updated: number, unchanged: number, errors: number }>}
 */
export async function syncProject({ project, range, dateField }) {
  if (!project) {
    throw new Error("syncProject requiere un project registrado");
  }

  if (!range?.from || !range?.to) {
    throw new Error("syncProject requiere range.from y range.to");
  }

  const effectiveDateField = dateField || project.defaultDateField;

  const stats = {
    api_received: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
  };

  for await (const { results, page } of iterateFills({
    templateId: project.templateId,
    from: range.from,
    to: range.to,
    dateField: effectiveDateField,
  })) {
    console.log(`📄 Página ${page}: ${results.length} registros`);

    stats.api_received += results.length;

    for (const item of results) {
      try {
        const record = project.mapRecord(item);
        const result = await upsertRecord(project, record);

        switch (result.action) {
          case "inserted":
            stats.inserted++;
            break;
          case "updated":
            stats.updated++;
            break;
          case "unchanged":
            stats.unchanged++;
            break;
          default:
            console.warn(
              `⚠️ Acción desconocida para source_id=${record.source_id}`
            );
        }
      } catch (error) {
        stats.errors++;

        console.error(
          `❌ Error procesando source_id=${item.sourceId ?? "SIN_SOURCE_ID"}:`,
          error.message
        );
      }
    }
  }

  return stats;
}

export function printSyncStats(templateId, stats) {
  console.log("");
  console.log("📊 RESUMEN DE SINCRONIZACIÓN");
  console.log("--------------------------------");
  console.log(`Template:       ${templateId}`);
  console.log(`API recibidos:  ${stats.api_received}`);
  console.log(`Insertados:     ${stats.inserted}`);
  console.log(`Actualizados:   ${stats.updated}`);
  console.log(`Sin cambios:    ${stats.unchanged}`);
  console.log(`Errores:        ${stats.errors}`);
  console.log("--------------------------------");
}
