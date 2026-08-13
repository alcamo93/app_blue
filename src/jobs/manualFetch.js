// src/jobs/manualFetch.js
//
// Uso:
//   node src/jobs/manualFetch.js <templateId> <YYYY-MM-DD> <YYYY-MM-DD>
//
// Ejemplo:
//   node src/jobs/manualFetch.js 20532 2025-11-26 2025-11-26
//
// Usa exactamente el mismo blueSyncService que el scheduler.

import "../config/env.js";

import { closePool } from "../database.js";
import { getProject } from "../projects/index.js";
import { generateManualRange } from "../utils/dates.js";
import { syncProject } from "../services/blueSyncService.js";

async function main() {
  const [, , templateIdArg, fromDate, toDate] = process.argv;

  if (!templateIdArg || !fromDate || !toDate) {
    console.error(
      "Uso: node src/jobs/manualFetch.js <templateId> <YYYY-MM-DD> <YYYY-MM-DD>"
    );
    process.exitCode = 1;
    return;
  }

  const project = getProject(templateIdArg);

  if (!project) {
    console.error(
      `❌ Template ${templateIdArg} no está registrado en projects/index.js. Se rechaza.`
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `🚀 Carga manual: template=${project.templateId} (${project.name}) ${fromDate} → ${toDate}`
  );

  const range = generateManualRange(fromDate, toDate);

  const stats = await syncProject({
    project,
    range,
    dateField: project.defaultDateField,
  });

  console.log("");
  console.log("📊 RESUMEN DE SINCRONIZACIÓN");
  console.log(`API recibidos:  ${stats.api_received}`);
  console.log(`Insertados:     ${stats.inserted}`);
  console.log(`Actualizados:   ${stats.updated}`);
  console.log(`Sin cambios:    ${stats.unchanged}`);
  console.log(`Errores:        ${stats.errors}`);
  console.log("✅ Carga manual completada correctamente.");
}

main()
  .catch((err) => {
    console.error("❌ Error en la carga manual:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
