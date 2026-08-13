// src/jobs/inspectTemplate.js
//
// Inspector READ-ONLY de la estructura REST de un template BlueMessaging.
// No escribe en MySQL. No usa registry, database ni blueSyncService.
//
// Uso:
//   node src/jobs/inspectTemplate.js <templateId> <YYYY-MM-DD> <YYYY-MM-DD>
//   node src/jobs/inspectTemplate.js 20920 2026-07-28 2026-07-28
//   node src/jobs/inspectTemplate.js 20920 2026-07-28 2026-07-28 --output /tmp/blue-20920-sample.json

import fs from "fs";
import path from "path";

import "../config/env.js";
import { iterateFills } from "../services/blueApiClient.js";
import { generateManualRange } from "../utils/dates.js";

const DEFAULT_MAX_ITEMS = 3;
const DATE_FIELD = "receivedDate";
const PHOTO_HINT_KEYS = [
  "name",
  "src",
  "location",
  "edit_time",
  "file_size_kb",
];

function parseArgs(argv) {
  const args = [...argv];
  let outputPath = null;

  const outputIdx = args.indexOf("--output");
  if (outputIdx !== -1) {
    outputPath = args[outputIdx + 1];
    if (!outputPath || outputPath.startsWith("--")) {
      throw new Error("Debe indicar una ruta tras --output");
    }
    args.splice(outputIdx, 2);
  }

  const [templateIdArg, fromDate, toDate] = args;

  if (!templateIdArg || !fromDate || !toDate) {
    throw new Error(
      "Uso: node src/jobs/inspectTemplate.js <templateId> <YYYY-MM-DD> <YYYY-MM-DD> [--output ruta.json]"
    );
  }

  const templateId = Number(templateIdArg);
  if (!Number.isFinite(templateId)) {
    throw new Error(`templateId inválido: ${templateIdArg}`);
  }

  return { templateId, fromDate, toDate, outputPath };
}

function describeTopLevelProp(name, value) {
  const isNull = value === null;
  const isArray = Array.isArray(value);
  const isObject =
    value !== null && typeof value === "object" && !Array.isArray(value);

  return {
    name,
    typeof: value === null ? "null" : typeof value,
    isNull,
    isArray,
    isObject,
  };
}

function summarizeValue(value) {
  if (value === null) {
    return { tipo: "null", resumen: null };
  }

  const tipo = Array.isArray(value) ? "array" : typeof value;

  if (tipo === "string" || tipo === "number" || tipo === "boolean") {
    return { tipo, resumen: value };
  }

  if (tipo === "array") {
    return {
      tipo: "array",
      length: value.length,
      muestra: value.slice(0, 3),
    };
  }

  if (tipo === "object") {
    const keys = Object.keys(value);
    const summary = {
      tipo: "object",
      keys,
    };

    for (const hint of PHOTO_HINT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(value, hint)) {
        if (hint === "location") {
          const location = value.location;
          summary.location = describeLocation(location);
        } else {
          summary[hint] = value[hint];
        }
      }
    }

    return summary;
  }

  return { tipo, resumen: String(value) };
}

function describeLocation(location) {
  if (location == null) {
    return { presente: false, valor: location };
  }

  if (typeof location !== "object" || Array.isArray(location)) {
    return {
      presente: true,
      typeof: Array.isArray(location) ? "array" : typeof location,
      valor: location,
    };
  }

  return {
    presente: true,
    keys: Object.keys(location),
    latitude: location.latitude ?? undefined,
    longitude: location.longitude ?? undefined,
    altitude: location.altitude ?? undefined,
    raw: location,
  };
}

function inspectItem(item, index) {
  console.log("\n============================================================");
  console.log(`📦 REGISTRO #${index + 1}`);
  console.log("============================================================");

  console.log("\n--- A. TOP LEVEL ---");
  console.log(`sourceId: ${item?.sourceId ?? "(ausente)"}`);

  const topKeys = Object.keys(item || {});
  console.log(`Object.keys(item): ${JSON.stringify(topKeys)}`);

  for (const key of topKeys) {
    const desc = describeTopLevelProp(key, item[key]);
    console.log(
      `  • ${desc.name} | typeof=${desc.typeof} | null=${desc.isNull} | Array=${desc.isArray} | Object=${desc.isObject}`
    );
  }

  console.log("\n--- B. VALUES ---");
  const values = item?.values || {};
  const valueKeys = Object.keys(values);
  console.log(`Object.keys(item.values || {}): ${JSON.stringify(valueKeys)}`);

  for (const key of valueKeys) {
    const summary = summarizeValue(values[key]);
    console.log(`\n  key: ${key}`);
    console.log(`  ${JSON.stringify(summary, null, 2).replace(/\n/g, "\n  ")}`);
  }

  return { topKeys, valueKeys };
}

async function main() {
  console.log(
    "🔎 MODO INSPECCIÓN READ-ONLY — NO SE REALIZAN ESCRITURAS MYSQL"
  );

  const { templateId, fromDate, toDate, outputPath } = parseArgs(
    process.argv.slice(2)
  );

  const range = generateManualRange(fromDate, toDate);

  console.log(`templateId: ${templateId}`);
  console.log(`dateField: ${DATE_FIELD}`);
  console.log(`rango local solicitado: ${fromDate} → ${toDate}`);
  console.log(`rango UTC: ${range.from} → ${range.to}`);
  console.log(`máximo a inspeccionar: ${DEFAULT_MAX_ITEMS}`);

  const inspected = [];
  const allTopKeys = new Set();
  const allValueKeys = new Set();
  let pagesConsulted = 0;
  let recordsFound = 0;

  for await (const { results, page } of iterateFills({
    templateId,
    from: range.from,
    to: range.to,
    dateField: DATE_FIELD,
  })) {
    pagesConsulted = page;
    recordsFound += results.length;

    console.log(`\n📄 Página ${page}: ${results.length} registros en respuesta`);

    for (const item of results) {
      if (inspected.length >= DEFAULT_MAX_ITEMS) {
        break;
      }

      const { topKeys, valueKeys } = inspectItem(item, inspected.length);
      topKeys.forEach((k) => allTopKeys.add(k));
      valueKeys.forEach((k) => allValueKeys.add(k));
      inspected.push(item);
    }

    if (inspected.length >= DEFAULT_MAX_ITEMS) {
      console.log(
        `\n⏹️ Límite de inspección alcanzado (${DEFAULT_MAX_ITEMS}). No se consultan más páginas.`
      );
      break;
    }
  }

  if (inspected.length > 0) {
    console.log("\n============================================================");
    console.log("🧾 MUESTRA JSON COMPLETA (primer registro inspeccionado)");
    console.log("============================================================");
    console.log(JSON.stringify(inspected[0], null, 2));
  } else {
    console.log("\n⚠️ No se encontraron registros en el rango indicado.");
  }

  if (outputPath) {
    const absolute = path.resolve(outputPath);
    const payload = {
      templateId,
      dateField: DATE_FIELD,
      range,
      inspectedCount: inspected.length,
      sample: inspected[0] ?? null,
      samples: inspected,
      topLevelKeys: [...allTopKeys].sort(),
      valuesKeys: [...allValueKeys].sort(),
    };

    fs.writeFileSync(absolute, JSON.stringify(payload, null, 2), "utf8");
    console.log(`\n💾 Muestra guardada localmente en: ${absolute}`);
  }

  console.log("\n============================================================");
  console.log("📊 RESUMEN DE INSPECCIÓN");
  console.log("============================================================");
  console.log(`templateId:              ${templateId}`);
  console.log(`rango UTC consultado:    ${range.from} → ${range.to}`);
  console.log(`páginas consultadas:     ${pagesConsulted}`);
  console.log(`registros encontrados:   ${recordsFound}`);
  console.log(`registros inspeccionados:${inspected.length}`);
  console.log(`keys top-level:          ${[...allTopKeys].sort().join(", ") || "(ninguna)"}`);
  console.log(`keys values:             ${[...allValueKeys].sort().join(", ") || "(ninguna)"}`);
  console.log(
    "\n🔎 FIN INSPECCIÓN READ-ONLY — ninguna escritura MySQL realizada"
  );
}

main().catch((err) => {
  console.error("❌ Error en inspectTemplate:", err.message);
  process.exitCode = 1;
});
