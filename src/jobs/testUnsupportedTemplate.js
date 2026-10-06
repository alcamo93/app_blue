// src/jobs/testUnsupportedTemplate.js
// Verifica omit de templates no registrados + allowlist del repository.

import { pool, closePool } from "../database.js";
import {
  getProject,
  listRegisteredTemplateIds,
} from "../projects/index.js";
import { project20532 } from "../projects/project20532.js";
import { upsertRecord } from "../repositories/blueDataRepository.js";

const UNSUPPORTED_TEMPLATE_ID = 99999;
const FAKE_TEMPLATE_ID = 99999;
const ALLOWLIST_TEST_SOURCE_ID = -205320099;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectReject(label, fn) {
  try {
    await fn();
    throw new Error(`${label}: se esperaba rechazo y no ocurrió`);
  } catch (err) {
    if (err.message.startsWith(`${label}:`)) {
      throw err;
    }
    console.log(`✅ ${label}: ${err.message}`);
  }
}

/**
 * Simula la decisión del worker: sin project registrado → omitir (sin UPSERT).
 */
function resolveOrSkip(templateId) {
  const project = getProject(templateId);

  if (!project) {
    return { skipped: true, project: null };
  }

  return { skipped: false, project };
}

async function main() {
  try {
    console.log("========================================");
    console.log("🧪 PRUEBA TEMPLATE NO SOPORTADO + ALLOWLIST");
    console.log("========================================");

    const registered = listRegisteredTemplateIds();
    console.log(`Registrados: ${registered.join(", ")}`);

    assert(registered.includes(20532), "20532 debe estar registrado");
    assert(registered.includes(20920), "20920 debe estar registrado en código");
    assert(registered.includes(20949), "20949 debe estar registrado en código");
    assert(
      !registered.includes(UNSUPPORTED_TEMPLATE_ID),
      "99999 NO debe estar registrado"
    );

    assert(
      getProject(20920)?.tableName === "blue_data_20920",
      "getProject(20920) debe devolver el proyecto 20920"
    );
    assert(
      getProject(20949)?.tableName === "blue_data_20949",
      "getProject(20949) debe devolver el proyecto 20949"
    );
    assert(
      getProject(FAKE_TEMPLATE_ID) === null,
      "getProject(99999) debe devolver null"
    );
    assert(
      getProject(20532)?.tableName === "blue_data_20532",
      "getProject(20532) debe devolver el proyecto 20532"
    );

    const [[totalBefore]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20532
    `);

    console.log(`Total blue_data_20532 antes: ${totalBefore.total}`);

    // Camino worker: omitir sin UPSERT
    assert(
      resolveOrSkip(20920).skipped === false,
      "20920 registrado no debe omitirse por registry"
    );
    assert(
      resolveOrSkip(20949).skipped === false,
      "20949 registrado no debe omitirse por registry"
    );
    assert(resolveOrSkip(FAKE_TEMPLATE_ID).skipped, "99999 debe omitirse");

    // --------------------------------------------------------
    // Allowlist repository
    // --------------------------------------------------------
    console.log("");
    console.log("--- Allowlist repository ---");

    // 1) tableName con SQL inválido → rechazado
    await expectReject("tableName SQL inválido", () =>
      upsertRecord(
        {
          templateId: FAKE_TEMPLATE_ID,
          tableName: "blue_data_20532; DROP TABLE x",
          columns: ["source_id", "estatus"],
        },
        { source_id: -999, estatus: "NO" }
      )
    );

    // 2) tableName sintácticamente válido pero proyecto no registrado → rechazado
    await expectReject("proyecto no registrado", () =>
      upsertRecord(
        {
          templateId: FAKE_TEMPLATE_ID,
          tableName: "otra_tabla_segura",
          columns: ["source_id", "estatus"],
        },
        { source_id: -998, estatus: "NO" }
      )
    );

    // También: templateId registrado pero tableName distinto al allowlist
    await expectReject("tableName no coincide con registry", () =>
      upsertRecord(
        {
          templateId: 20532,
          tableName: "otra_tabla_segura",
          columns: project20532.columns,
        },
        { source_id: -997, estatus: "NO" }
      )
    );

    // 3) 20532 registrado → permitido
    await pool.query(
      `DELETE FROM blue_data_20532 WHERE source_id = ?`,
      [ALLOWLIST_TEST_SOURCE_ID]
    );

    const allowed = await upsertRecord(project20532, {
      source_id: ALLOWLIST_TEST_SOURCE_ID,
      usuario_ejecutor: "ALLOWLIST_TEST",
      fecha_creacion: "2026-08-10 15:00:00",
      fecha_recepcion: "2026-08-10 15:00:00",
      codigo_barras: "ALLOW",
      expediente: "ALLOW",
      tipo_propiedad: "PRUEBA",
      estatus: "PRUEBA",
      foto_fachada_src: null,
      foto_fachada_latitude: null,
      foto_fachada_longitude: null,
      foto_fachada_altitude: null,
      foto_medidor_src: null,
      foto_medidor_latitude: null,
      foto_medidor_longitude: null,
      foto_medidor_altitude: null,
      medidor_agua: "PRUEBA",
    });

    assert(
      allowed.action === "inserted",
      `20532 registrado debe permitir UPSERT (inserted). Obtuvo: ${allowed.action}`
    );
    console.log("✅ 20532 registrado → UPSERT permitido (inserted)");

    await pool.query(
      `DELETE FROM blue_data_20532 WHERE source_id = ?`,
      [ALLOWLIST_TEST_SOURCE_ID]
    );

    const [[totalFinal]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20532
    `);

    assert(
      Number(totalBefore.total) === Number(totalFinal.total),
      `blue_data_20532 no debe quedar alterada. Antes=${totalBefore.total}, después=${totalFinal.total}`
    );

    console.log("");
    console.log("✅ TEMPLATE NO SOPORTADO: omitido");
    console.log("✅ getProject devuelve null");
    console.log("✅ tableName SQL inválido → rechazado");
    console.log("✅ proyecto no registrado → rechazado");
    console.log("✅ 20532 registrado → permitido");
    console.log("✅ blue_data_20532 sin cambios netos");
  } catch (error) {
    console.error("");
    console.error("❌ PRUEBA FALLIDA:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.query(
        `DELETE FROM blue_data_20532 WHERE source_id = ?`,
        [ALLOWLIST_TEST_SOURCE_ID]
      );
    } catch {
      // Sin acción
    }

    await closePool();
  }
}

main();
