// src/jobs/testUpsert20532.js
// Prueba UPSERT genérico (repository) contra blue_data_20532.

import { pool, closePool } from "../database.js";
import { project20532 } from "../projects/project20532.js";
import { upsertRecord } from "../repositories/blueDataRepository.js";

const TEST_SOURCE_ID = -205320001;

async function main() {
  try {
    console.log("========================================");
    console.log("🧪 PRUEBA UPSERT GENÉRICO 20532");
    console.log("========================================");

    await pool.query(
      `
        DELETE FROM blue_data_20532
        WHERE source_id = ?
      `,
      [TEST_SOURCE_ID]
    );

    const [[totalBefore]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20532
    `);

    console.log(`Total antes: ${totalBefore.total}`);

    const testRecord = {
      source_id: TEST_SOURCE_ID,
      usuario_ejecutor: "TEST_UPSERT",
      fecha_creacion: "2026-08-10 14:00:00",
      fecha_recepcion: "2026-08-10 14:00:00",
      codigo_barras: "TEST_20532",
      expediente: "TEST_20532",
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
    };

    console.log("");
    console.log("1️⃣ Registro nuevo:");
    const firstResult = await upsertRecord(project20532, testRecord);
    console.log(firstResult);

    if (firstResult.action !== "inserted") {
      throw new Error(
        `Se esperaba action=inserted y se obtuvo ${firstResult.action}`
      );
    }

    console.log("");
    console.log("2️⃣ Mismo registro sin cambios:");
    const secondResult = await upsertRecord(project20532, testRecord);
    console.log(secondResult);

    if (secondResult.action !== "unchanged") {
      throw new Error(
        `Se esperaba action=unchanged y se obtuvo ${secondResult.action}`
      );
    }

    const modifiedRecord = {
      ...testRecord,
      estatus: "PRUEBA_MODIFICADA",
      medidor_agua: "PRUEBA_MODIFICADA",
    };

    console.log("");
    console.log("3️⃣ Mismo source_id con información modificada:");
    const thirdResult = await upsertRecord(project20532, modifiedRecord);
    console.log(thirdResult);

    if (thirdResult.action !== "updated") {
      throw new Error(
        `Se esperaba action=updated y se obtuvo ${thirdResult.action}`
      );
    }

    const [rows] = await pool.query(
      `
        SELECT
          source_id,
          estatus,
          medidor_agua
        FROM blue_data_20532
        WHERE source_id = ?
      `,
      [TEST_SOURCE_ID]
    );

    console.log("");
    console.log("Registro final:");
    console.log(rows[0]);

    if (rows.length !== 1) {
      throw new Error(
        `Se esperaba exactamente 1 fila y existen ${rows.length}`
      );
    }

    if (rows[0].estatus !== "PRUEBA_MODIFICADA") {
      throw new Error(
        `El estatus no fue actualizado. Valor actual: ${rows[0].estatus}`
      );
    }

    if (rows[0].medidor_agua !== "PRUEBA_MODIFICADA") {
      throw new Error(
        `medidor_agua no fue actualizado. Valor actual: ${rows[0].medidor_agua}`
      );
    }

    await pool.query(
      `
        DELETE FROM blue_data_20532
        WHERE source_id = ?
      `,
      [TEST_SOURCE_ID]
    );

    const [[totalAfter]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20532
    `);

    console.log("");
    console.log(
      `Total después de limpiar prueba: ${totalAfter.total}`
    );

    if (Number(totalBefore.total) !== Number(totalAfter.total)) {
      throw new Error(
        `El total inicial era ${totalBefore.total} y el final es ${totalAfter.total}`
      );
    }

    console.log("");
    console.log("✅ PRUEBA COMPLETA SUPERADA");
    console.log("✅ INSERT detectado correctamente");
    console.log("✅ UNCHANGED detectado correctamente");
    console.log("✅ UPDATE detectado correctamente");
    console.log("✅ source_id continúa siendo único");
    console.log("✅ Información modificada fue actualizada");
    console.log("✅ Tabla regresó a su cantidad original");
  } catch (error) {
    console.error("");
    console.error("❌ PRUEBA FALLIDA:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.query(
        `
          DELETE FROM blue_data_20532
          WHERE source_id = ?
        `,
        [TEST_SOURCE_ID]
      );
    } catch {
      // Sin acción
    }

    await closePool();
  }
}

main();
