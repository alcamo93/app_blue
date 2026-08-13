// src/jobs/testUpsert20920.js
// Prueba UPSERT genérico contra blue_data_20920.
// Si la tabla local todavía no existe, se omite sin fallar.

import { pool, closePool } from "../database.js";
import { project20920 } from "../projects/project20920.js";
import { upsertRecord } from "../repositories/blueDataRepository.js";

const TEST_SOURCE_ID = -209200001;

async function tableExists() {
  const [rows] = await pool.query(
    `
      SELECT 1 AS ok
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'blue_data_20920'
      LIMIT 1
    `
  );

  return rows.length > 0;
}

function buildRecord(overrides = {}) {
  return {
    source_id: TEST_SOURCE_ID,
    usuario_ejecutor: "TEST_UPSERT_20920",
    usuario_propietario: "TEST_OWNER",
    trabajado_en: "in-site",
    status_blue: "FNL",
    location_status: "in-site",
    fecha_descarga: null,
    fecha_activacion: null,
    fecha_expiracion: null,
    fecha_actualizacion: "2026-07-28 20:05:55",
    fecha_creacion: "2026-07-28 20:05:55",
    fecha_edicion: "2026-07-28 20:00:21",
    fecha_recepcion: "2026-07-28 20:05:55",
    fecha_envio: "2026-07-28 20:05:52",
    fecha_guardado: "2026-07-28 20:05:50",
    visited_location_latitude: 25.7886637,
    visited_location_longitude: -100.5514357,
    visited_location_altitude: 0,
    cuestionario: "1",
    alerta: null,
    codigo_barras: "TEST_20920",
    expediente: "TEST_20920",
    fecha_hora_gestion: "2026-07-28 19:38:00",
    foto_fachada_src: null,
    foto_fachada_edit_time: null,
    foto_fachada_file_size_kb: null,
    foto_fachada_location: null,
    geolocalizacion_latitude: 25.7886637,
    geolocalizacion_longitude: -100.5514357,
    geolocalizacion_altitude: 655.8,
    fecha_notificacion: null,
    tipo_propiedad: null,
    situacion_vivienda: null,
    foto_medidor_src: null,
    foto_medidor_edit_time: null,
    foto_medidor_file_size_kb: null,
    foto_medidor_location: null,
    estado_medidor: "PRUEBA",
    foto_puerta_src: null,
    foto_puerta_edit_time: null,
    foto_puerta_file_size_kb: null,
    foto_puerta_location: null,
    tipo_entrega_aviso: null,
    nombre_recibe: null,
    foto_id_o_recibido_src: null,
    foto_id_o_recibido_edit_time: null,
    foto_id_o_recibido_file_size_kb: null,
    foto_id_o_recibido_location: null,
    foto_documentopegado_src: null,
    foto_documentopegado_edit_time: null,
    foto_documentopegado_file_size_kb: null,
    foto_documentopegado_location: null,
    tipo_entrega_notificacion: null,
    foto_id_frente_src: null,
    foto_id_frente_edit_time: null,
    foto_id_frente_file_size_kb: null,
    foto_id_frente_location: null,
    foto_id_posterior_src: null,
    foto_id_posterior_edit_time: null,
    foto_id_posterior_file_size_kb: null,
    foto_id_posterior_location: null,
    telefono_recibe: null,
    foto_evidencia_entrega_src: null,
    foto_evidencia_entrega_edit_time: null,
    foto_evidencia_entrega_file_size_kb: null,
    foto_evidencia_entrega_location: null,
    observaciones: "PRUEBA",
    asesor: "TEST",
    fecha_gestion_pdf: "2026-07-28",
    foto_papeleta_visita_src: null,
    foto_papeleta_visita_edit_time: null,
    foto_papeleta_visita_file_size_kb: null,
    foto_papeleta_visita_location: null,
    estado_papeleta: "Pendiente",
    reporte_visita_src: null,
    raw_payload: JSON.stringify({ sourceId: TEST_SOURCE_ID, test: true }),
    ...overrides,
  };
}

async function main() {
  try {
    console.log("========================================");
    console.log("🧪 PRUEBA UPSERT GENÉRICO 20920");
    console.log("========================================");

    if (!(await tableExists())) {
      console.log(
        "⏭️ Tabla blue_data_20920 no existe en la base local. UPSERT omitido."
      );
      console.log(
        "   Crea la tabla con database/create_blue_data_20920.sql y vuelve a ejecutar."
      );
      return;
    }

    await pool.query(
      `DELETE FROM blue_data_20920 WHERE source_id = ?`,
      [TEST_SOURCE_ID]
    );

    const [[totalBefore]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20920
    `);

    console.log(`Total antes: ${totalBefore.total}`);

    const testRecord = buildRecord();

    console.log("");
    console.log("1️⃣ Registro nuevo:");
    const firstResult = await upsertRecord(project20920, testRecord);
    console.log(firstResult);

    if (firstResult.action !== "inserted") {
      throw new Error(
        `Se esperaba action=inserted y se obtuvo ${firstResult.action}`
      );
    }

    console.log("");
    console.log("2️⃣ Mismo registro sin cambios:");
    const secondResult = await upsertRecord(project20920, testRecord);
    console.log(secondResult);

    if (secondResult.action !== "unchanged") {
      throw new Error(
        `Se esperaba action=unchanged y se obtuvo ${secondResult.action}`
      );
    }

    const modifiedRecord = buildRecord({
      estado_medidor: "PRUEBA_MODIFICADA",
      observaciones: "PRUEBA_MODIFICADA",
    });

    console.log("");
    console.log("3️⃣ Mismo source_id con información modificada:");
    const thirdResult = await upsertRecord(project20920, modifiedRecord);
    console.log(thirdResult);

    if (thirdResult.action !== "updated") {
      throw new Error(
        `Se esperaba action=updated y se obtuvo ${thirdResult.action}`
      );
    }

    const [rows] = await pool.query(
      `
        SELECT source_id, estado_medidor, observaciones
        FROM blue_data_20920
        WHERE source_id = ?
      `,
      [TEST_SOURCE_ID]
    );

    if (rows.length !== 1) {
      throw new Error(
        `Se esperaba exactamente 1 fila y existen ${rows.length}`
      );
    }

    if (rows[0].estado_medidor !== "PRUEBA_MODIFICADA") {
      throw new Error(
        `estado_medidor no fue actualizado. Valor actual: ${rows[0].estado_medidor}`
      );
    }

    await pool.query(
      `DELETE FROM blue_data_20920 WHERE source_id = ?`,
      [TEST_SOURCE_ID]
    );

    const [[totalAfter]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20920
    `);

    if (Number(totalBefore.total) !== Number(totalAfter.total)) {
      throw new Error(
        `El total inicial era ${totalBefore.total} y el final es ${totalAfter.total}`
      );
    }

    console.log("");
    console.log("✅ PRUEBA UPSERT 20920 SUPERADA");
    console.log("✅ inserted / unchanged / updated");
    console.log("✅ source_id único");
  } catch (error) {
    console.error("");
    console.error("❌ PRUEBA FALLIDA:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.query(
        `DELETE FROM blue_data_20920 WHERE source_id = ?`,
        [TEST_SOURCE_ID]
      );
    } catch {
      // Tabla puede no existir
    }

    await closePool();
  }
}

main();
