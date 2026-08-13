// src/jobs/discoverTemplateFields.js
//
// Discovery READ-ONLY: unión de keys/tipos del template sobre una muestra grande.
// No escribe en MySQL. No usa registry, database ni blueSyncService.
// No guarda fills completos.
//
// Uso:
//   node src/jobs/discoverTemplateFields.js 20920 2026-07-28 2026-07-31 \
//     --max 1000 --output /tmp/blue-20920-fields.json

import fs from "fs";
import path from "path";

import "../config/env.js";
import { iterateFills } from "../services/blueApiClient.js";
import { generateManualRange } from "../utils/dates.js";

const DATE_FIELD = "receivedDate";
const DEFAULT_MAX = 1000;
const MAX_ARRAY_DISTINCT = 20;
const MAX_STRING_SAMPLES = 10;
const MAX_COORD_SAMPLES = 5;
const PHOTO_HINT_KEYS = [
  "name",
  "src",
  "location",
  "edit_time",
  "file_size_kb",
  "date",
];

function parseArgs(argv) {
  const args = [...argv];
  let outputPath = null;
  let maxItems = DEFAULT_MAX;

  const takeFlag = (flag) => {
    const idx = args.indexOf(flag);
    if (idx === -1) return null;
    const value = args[idx + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Debe indicar un valor tras ${flag}`);
    }
    args.splice(idx, 2);
    return value;
  };

  const output = takeFlag("--output");
  if (output) outputPath = output;

  const maxRaw = takeFlag("--max");
  if (maxRaw != null) {
    maxItems = Number(maxRaw);
    if (!Number.isFinite(maxItems) || maxItems < 1) {
      throw new Error(`--max inválido: ${maxRaw}`);
    }
  }

  const [templateIdArg, fromDate, toDate] = args;

  if (!templateIdArg || !fromDate || !toDate) {
    throw new Error(
      "Uso: node src/jobs/discoverTemplateFields.js <templateId> <YYYY-MM-DD> <YYYY-MM-DD> [--max N] [--output ruta.json]"
    );
  }

  const templateId = Number(templateIdArg);
  if (!Number.isFinite(templateId)) {
    throw new Error(`templateId inválido: ${templateIdArg}`);
  }

  return { templateId, fromDate, toDate, maxItems, outputPath };
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function shortString(value, maxLen = 80) {
  const s = String(value);
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

function ensureFieldStats(map, key) {
  if (!map.has(key)) {
    map.set(key, {
      key,
      appearances: 0,
      nulls: 0,
      types: new Map(), // type -> count
      objectKeys: new Map(), // nestedKey -> count
      subkeyTypes: new Map(), // nestedKey -> Map(type -> count)
      arrayDistinct: new Map(), // value -> count
      stringSamples: [],
      stringSampleSet: new Set(),
      photoHints: new Map(), // hint -> count
      isPhotoLike: false,
    });
  }
  return map.get(key);
}

function bumpType(typesMap, type) {
  typesMap.set(type, (typesMap.get(type) || 0) + 1);
}

function observeObjectShape(stats, obj) {
  for (const [subKey, subVal] of Object.entries(obj)) {
    stats.objectKeys.set(subKey, (stats.objectKeys.get(subKey) || 0) + 1);

    if (!stats.subkeyTypes.has(subKey)) {
      stats.subkeyTypes.set(subKey, new Map());
    }
    bumpType(stats.subkeyTypes.get(subKey), valueType(subVal));

    if (PHOTO_HINT_KEYS.includes(subKey)) {
      stats.photoHints.set(subKey, (stats.photoHints.get(subKey) || 0) + 1);
      stats.isPhotoLike = true;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(obj, "name") ||
    Object.prototype.hasOwnProperty.call(obj, "file_size_kb") ||
    Object.prototype.hasOwnProperty.call(obj, "location")
  ) {
    stats.isPhotoLike = true;
  }
}

function observeField(map, key, value) {
  const stats = ensureFieldStats(map, key);
  stats.appearances += 1;

  const tipo = valueType(value);
  bumpType(stats.types, tipo);

  if (value === null) {
    stats.nulls += 1;
    return;
  }

  if (tipo === "string") {
    const sample = shortString(value);
    if (
      !stats.stringSampleSet.has(sample) &&
      stats.stringSamples.length < MAX_STRING_SAMPLES
    ) {
      stats.stringSampleSet.add(sample);
      stats.stringSamples.push(sample);
    }
    return;
  }

  if (tipo === "number" || tipo === "boolean") {
    const sample = String(value);
    if (
      !stats.stringSampleSet.has(sample) &&
      stats.stringSamples.length < MAX_STRING_SAMPLES
    ) {
      stats.stringSampleSet.add(sample);
      stats.stringSamples.push(sample);
    }
    return;
  }

  if (tipo === "array") {
    for (const entry of value) {
      const label =
        entry === null
          ? "null"
          : typeof entry === "object"
            ? `[${valueType(entry)}]`
            : shortString(entry, 60);

      if (stats.arrayDistinct.size < MAX_ARRAY_DISTINCT || stats.arrayDistinct.has(label)) {
        stats.arrayDistinct.set(label, (stats.arrayDistinct.get(label) || 0) + 1);
      }
    }
    return;
  }

  if (tipo === "object") {
    observeObjectShape(stats, value);
  }
}

function bumpCounter(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function looksLikeCoordinates(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return (
    keys.includes("latitude") ||
    keys.includes("longitude") ||
    keys.includes("lat") ||
    keys.includes("lng") ||
    keys.includes("lon")
  );
}

function serializeFieldStats(stats, totalRecords) {
  const types = {};
  for (const [t, c] of [...stats.types.entries()].sort((a, b) => b[1] - a[1])) {
    types[t] = c;
  }

  const objectKeys = {};
  for (const [k, c] of [...stats.objectKeys.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    objectKeys[k] = c;
  }

  const subkeyTypes = {};
  for (const [k, typeMap] of [...stats.subkeyTypes.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    subkeyTypes[k] = Object.fromEntries(
      [...typeMap.entries()].sort((a, b) => b[1] - a[1])
    );
  }

  const photoHints = Object.fromEntries(
    [...stats.photoHints.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );

  const arrayDistinct = Object.fromEntries(
    [...stats.arrayDistinct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ARRAY_DISTINCT)
  );

  return {
    key: stats.key,
    appearances: stats.appearances,
    percent_of_records: totalRecords
      ? Number(((stats.appearances / totalRecords) * 100).toFixed(2))
      : 0,
    nulls: stats.nulls,
    types,
    objectKeys: Object.keys(objectKeys).length ? objectKeys : undefined,
    subkeyTypes: Object.keys(subkeyTypes).length ? subkeyTypes : undefined,
    arrayDistinct: Object.keys(arrayDistinct).length ? arrayDistinct : undefined,
    stringSamples: stats.stringSamples.length ? stats.stringSamples : undefined,
    photoLike: stats.isPhotoLike || undefined,
    photoHints: Object.keys(photoHints).length ? photoHints : undefined,
  };
}

function serializeMap(map, totalRecords) {
  return [...map.values()]
    .map((s) => serializeFieldStats(s, totalRecords))
    .sort((a, b) => a.key.localeCompare(b.key));
}

async function main() {
  console.log(
    "🔎 MODO DISCOVERY READ-ONLY — NO SE REALIZAN ESCRITURAS MYSQL"
  );

  const { templateId, fromDate, toDate, maxItems, outputPath } = parseArgs(
    process.argv.slice(2)
  );

  const range = generateManualRange(fromDate, toDate);

  console.log(`templateId: ${templateId}`);
  console.log(`dateField: ${DATE_FIELD}`);
  console.log(`rango local: ${fromDate} → ${toDate}`);
  console.log(`rango UTC: ${range.from} → ${range.to}`);
  console.log(`máximo registros: ${maxItems}`);

  const topLevel = new Map();
  const valuesFields = new Map();
  const statusCounts = new Map();
  const locationStatusCounts = new Map();
  const cuestionarioCounts = new Map();
  // cuestionarioValue -> { total, keys: Map(key -> count) }
  const cuestionarioProfiles = new Map();
  const coordinateFindings = [];

  let pagesConsulted = 0;
  let analyzed = 0;
  let stop = false;

  for await (const { results, page } of iterateFills({
    templateId,
    from: range.from,
    to: range.to,
    dateField: DATE_FIELD,
  })) {
    pagesConsulted = page;
    console.log(
      `📄 Página ${page}: ${results.length} registros (analizados=${analyzed}/${maxItems})`
    );

    for (const item of results) {
      if (analyzed >= maxItems) {
        stop = true;
        break;
      }

      analyzed += 1;

      // Top-level keys
      for (const [key, value] of Object.entries(item || {})) {
        observeField(topLevel, key, value);
      }

      // status / locationStatus
      if (Object.prototype.hasOwnProperty.call(item || {}, "status")) {
        bumpCounter(statusCounts, String(item.status));
      }
      if (Object.prototype.hasOwnProperty.call(item || {}, "locationStatus")) {
        bumpCounter(locationStatusCounts, String(item.locationStatus));
      }

      // Coordinates at top-level visitedLocation
      if (looksLikeCoordinates(item?.visitedLocation)) {
        if (coordinateFindings.length < MAX_COORD_SAMPLES) {
          coordinateFindings.push({
            path: "visitedLocation",
            sourceId: item.sourceId ?? null,
            keys: Object.keys(item.visitedLocation),
            sample: item.visitedLocation,
          });
        }
      }

      const values = item?.values || {};
      for (const [key, value] of Object.entries(values)) {
        observeField(valuesFields, key, value);

        if (
          (key === "gps" || key === "visitedLocation" || looksLikeCoordinates(value)) &&
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          if (coordinateFindings.length < MAX_COORD_SAMPLES) {
            coordinateFindings.push({
              path: `values.${key}`,
              sourceId: item.sourceId ?? null,
              keys: Object.keys(value),
              sample: value,
            });
          }
        }
      }

      // Cuestionario distribution + per-value key frequency
      const rawCuest = Object.prototype.hasOwnProperty.call(values, "cuestionario")
        ? values.cuestionario
        : "(ausente)";
      const cuestLabel =
        rawCuest === null
          ? "null"
          : Array.isArray(rawCuest)
            ? JSON.stringify(rawCuest)
            : String(rawCuest);

      bumpCounter(cuestionarioCounts, cuestLabel);

      if (!cuestionarioProfiles.has(cuestLabel)) {
        cuestionarioProfiles.set(cuestLabel, {
          total: 0,
          keys: new Map(),
        });
      }
      const profile = cuestionarioProfiles.get(cuestLabel);
      profile.total += 1;
      for (const key of Object.keys(values)) {
        profile.keys.set(key, (profile.keys.get(key) || 0) + 1);
      }
    }

    if (stop || analyzed >= maxItems) {
      console.log(`⏹️ Límite --max=${maxItems} alcanzado. Se detiene la paginación.`);
      break;
    }
  }

  const valuesKeysSorted = [...valuesFields.keys()].sort((a, b) =>
    a.localeCompare(b)
  );
  const topKeysSorted = [...topLevel.keys()].sort((a, b) => a.localeCompare(b));

  const cuestionarioDistribution = [...cuestionarioCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      cuestionario: value,
      registros: count,
      percent: analyzed
        ? Number(((count / analyzed) * 100).toFixed(2))
        : 0,
    }));

  const cuestionarioByValue = {};
  for (const [value, profile] of [...cuestionarioProfiles.entries()].sort(
    (a, b) => b[1].total - a[1].total
  )) {
    const keys = {};
    for (const [k, c] of [...profile.keys.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      keys[k] = {
        count: c,
        percent: profile.total
          ? Number(((c / profile.total) * 100).toFixed(2))
          : 0,
      };
    }
    cuestionarioByValue[value] = {
      total: profile.total,
      keys,
    };
  }

  const report = {
    mode: "READ_ONLY_FIELD_DISCOVERY",
    templateId,
    dateField: DATE_FIELD,
    range,
    requestedLocalRange: { fromDate, toDate },
    maxRequested: maxItems,
    pagesConsulted,
    recordsAnalyzed: analyzed,
    topLevelKeyCount: topKeysSorted.length,
    valuesKeyCount: valuesKeysSorted.length,
    topLevelKeys: topKeysSorted,
    valuesKeys: valuesKeysSorted,
    topLevel: serializeMap(topLevel, analyzed),
    values: serializeMap(valuesFields, analyzed),
    status: Object.fromEntries(
      [...statusCounts.entries()].sort((a, b) => b[1] - a[1])
    ),
    locationStatus: Object.fromEntries(
      [...locationStatusCounts.entries()].sort((a, b) => b[1] - a[1])
    ),
    cuestionario: {
      distinctValues: cuestionarioDistribution.length,
      distribution: cuestionarioDistribution,
      byValue: cuestionarioByValue,
    },
    coordinates: {
      findingsCount: coordinateFindings.length,
      samples: coordinateFindings,
    },
  };

  const outPath = path.resolve(
    outputPath || `/tmp/blue-${templateId}-fields.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\n💾 Reporte agregado guardado en: ${outPath}`);

  // Consola: resumen + cuestionario compacto (sin JSON de fills)
  console.log("\n============================================================");
  console.log("📊 RESUMEN DISCOVERY");
  console.log("============================================================");
  console.log(`templateId:                 ${templateId}`);
  console.log(`rango UTC:                  ${range.from} → ${range.to}`);
  console.log(`registros analizados:       ${analyzed}`);
  console.log(`páginas consultadas:        ${pagesConsulted}`);
  console.log(`keys top-level:             ${topKeysSorted.length}`);
  console.log(`keys values:                ${valuesKeysSorted.length}`);
  console.log(
    `valores distintos cuestionario: ${cuestionarioDistribution.length}`
  );
  console.log(`keys values (ordenadas):`);
  for (const key of valuesKeysSorted) {
    const s = valuesFields.get(key);
    const pct = analyzed
      ? ((s.appearances / analyzed) * 100).toFixed(1)
      : "0.0";
    console.log(`  - ${key} (${pct}%, types=${[...s.types.keys()].join("|")})`);
  }

  console.log("\n--- cuestionario ---");
  for (const row of cuestionarioDistribution) {
    console.log(
      `cuestionario=${row.cuestionario} → ${row.registros} registros (${row.percent}%)`
    );
    const profile = cuestionarioByValue[row.cuestionario];
    const keyEntries = Object.entries(profile.keys).sort(
      (a, b) => b[1].percent - a[1].percent
    );
    for (const [k, meta] of keyEntries) {
      console.log(`    ${k}: ${meta.percent}%`);
    }
  }

  console.log("\n--- status ---");
  console.log(JSON.stringify(report.status, null, 2));
  console.log("\n--- locationStatus ---");
  console.log(JSON.stringify(report.locationStatus, null, 2));

  if (coordinateFindings.length) {
    console.log("\n--- coordenadas (muestras) ---");
    for (const finding of coordinateFindings) {
      console.log(
        `path=${finding.path} sourceId=${finding.sourceId} keys=${finding.keys.join(",")}`
      );
    }
  }

  console.log(
    "\n🔎 FIN DISCOVERY READ-ONLY — ninguna escritura MySQL realizada"
  );
}

main().catch((err) => {
  console.error("❌ Error en discoverTemplateFields:", err.message);
  process.exitCode = 1;
});
