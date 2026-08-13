// src/jobs/projectWorker.js
// Orquestación delgada: blue_templates → registry → blueSyncService.

import "../config/env.js";

import { pool, closePool } from "../database.js";
import { getProject } from "../projects/index.js";
import { generateDailyRange } from "../utils/dates.js";
import {
  syncProject,
  printSyncStats,
} from "../services/blueSyncService.js";

async function getActiveTemplates() {
  const [rows] = await pool.query(`
    SELECT
      template_id,
      template_name,
      date_field
    FROM blue_templates
    WHERE active = 1
    ORDER BY template_id
  `);

  return rows;
}

/**
 * Ejecuta la sincronización de todos los templates activos registrados.
 */
export async function runJob() {
  const templates = await getActiveTemplates();

  if (!templates.length) {
    console.log("ℹ️ No existen templates activos.");
    return;
  }

  for (const {
    template_id,
    template_name,
    date_field,
  } of templates) {
    console.log("\n=============================================");
    console.log(`🔄 Template: ${template_id}`);
    console.log(`📋 Nombre: ${template_name || "-"}`);
    console.log(`📅 Campo fecha: ${date_field}`);
    console.log("=============================================");

    const project = getProject(template_id);

    if (!project) {
      console.warn(
        `⚠️ Template ${template_id} activo en blue_templates pero NO registrado en projects/index.js. Se omite.`
      );
      continue;
    }

    try {
      const range = generateDailyRange(1);

      const stats = await syncProject({
        project,
        range,
        dateField: date_field || project.defaultDateField,
      });

      printSyncStats(template_id, stats);
    } catch (error) {
      console.error(
        `❌ Error sincronizando template=${template_id}:`,
        error.message
      );
      // Continuar con los templates siguientes
    }
  }

  console.log("\n🎯 Job completado.");
}

export { closePool };

// ============================================================
// Ejecutar directamente:
// node src/jobs/projectWorker.js
// ============================================================
const isMainModule =
  import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  (async () => {
    try {
      await runJob();
      console.log("✅ Proceso completado correctamente");
    } catch (error) {
      console.error("❌ Error durante la ejecución:", error);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}
