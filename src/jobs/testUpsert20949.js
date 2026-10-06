// src/jobs/testUpsert20949.js
// Prueba UPSERT genérico contra blue_data_20949.
// Si la tabla local todavía no existe, se omite sin fallar.

import { pool, closePool } from "../database.js";
import { project20949 } from "../projects/project20949.js";
import { upsertRecord } from "../repositories/blueDataRepository.js";

const TEST_SOURCE_ID = -209490001;

async function tableExists() {
  const [rows] = await pool.query(
    `
      SELECT 1 AS ok
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'blue_data_20949'
      LIMIT 1
    `
  );

  return rows.length > 0;
}

function buildRecord(overrides = {}) {
  return {
    source_id: TEST_SOURCE_ID,
    usuario_ejecutor: "TEST_UPSERT_20949",
    usuario_propietario: "TEST_OWNER",
    trabajado_en: "in-site",
    status_blue: "FNL",
    location_status: "in-site",
    fecha_descarga: null,
    fecha_activacion: null,
    fecha_expiracion: null,
    fecha_actualizacion: "2026-09-28 19:56:56",
    fecha_creacion: "2026-09-28 19:56:56",
    fecha_edicion: "2026-09-28 19:56:00",
    fecha_recepcion: "2026-09-28 19:56:56",
    fecha_envio: "2026-09-28 19:55:00",
    fecha_guardado: "2026-09-28 19:54:00",
    visited_location_latitude: 25.7991164,
    visited_location_longitude: -100.563132,
    visited_location_altitude: 0,
    cuestionario: "1",
    alerta: null,
    codigo_barras: "TEST_20949",
    expediente: "TEST_20949",
    fecha_hora_gestion: "2026-09-28 13:47:00",
    foto_fachada_src: null,
    foto_fachada_edit_time: null,
    foto_fachada_file_size_kb: null,
    foto_fachada_location: null,
    geolocalizacion_latitude: 25.7991164,
    geolocalizacion_longitude: -100.563132,
    geolocalizacion_altitude: 664.3,
    gps_formulario_latitude: 25.7885728,
    gps_formulario_longitude: -100.5513771,
    gps_formulario_altitude: 655.5,
    fecha_notificacion: null,
    tipo_propiedad: "Residencial",
    situacion_vivienda: "Casa",
    foto_medidor_src: null,
    foto_medidor_edit_time: null,
    foto_medidor_file_size_kb: null,
    foto_medidor_location: null,
    estado_medidor: "Con medidor",
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
    fecha_gestion_pdf: "2026-09-28",
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
    console.log("🧪 PRUEBA UPSERT GENÉRICO 20949");
    console.log("========================================");

    if (!(await tableExists())) {
      console.log(
        "⏭️ Tabla blue_data_20949 no existe en la base local. UPSERT omitido."
      );
      console.log(
        "   Crea la tabla con database/create_blue_data_20949.sql y vuelve a ejecutar."
      );
      return;
    }

    await pool.query(
      `DELETE FROM blue_data_20949 WHERE source_id = ?`,
      [TEST_SOURCE_ID]
    );

    const [[totalBefore]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20949
    `);

    console.log(`Total antes: ${totalBefore.total}`);

    const testRecord = buildRecord();

    console.log("");
    console.log("1️⃣ Registro nuevo:");
    const firstResult = await upsertRecord(project20949, testRecord);
    console.log(firstResult);

    if (firstResult.action !== "inserted") {
      throw new Error(
        `Se esperaba action=inserted y se obtuvo ${firstResult.action}`
      );
    }

    console.log("");
    console.log("2️⃣ Mismo registro sin cambios:");
    const secondResult = await upsertRecord(project20949, testRecord);
    console.log(secondResult);

    if (secondResult.action !== "unchanged") {
      throw new Error(
        `Se esperaba action=unchanged y se obtuvo ${secondResult.action}`
      );
    }

    const modifiedRecord = buildRecord({
      estado_medidor: "Con medidor actualizado",
      observaciones: "PRUEBA_MODIFICADA",
    });

    console.log("");
    console.log("3️⃣ Mismo source_id con información modificada:");
    const thirdResult = await upsertRecord(project20949, modifiedRecord);
    console.log(thirdResult);

    if (thirdResult.action !== "updated") {
      throw new Error(
        `Se esperaba action=updated y se obtuvo ${thirdResult.action}`
      );
    }

    const [rows] = await pool.query(
      `
        SELECT source_id, estado_medidor, observaciones
        FROM blue_data_20949
        WHERE source_id = ?
      `,
      [TEST_SOURCE_ID]
    );

    if (rows.length !== 1) {
      throw new Error(
        `Se esperaba exactamente 1 fila y existen ${rows.length}`
      );
    }

    if (rows[0].estado_medidor !== "Con medidor actualizado") {
      throw new Error(
        `estado_medidor no fue actualizado. Valor actual: ${rows[0].estado_medidor}`
      );
    }

    await pool.query(
      `DELETE FROM blue_data_20949 WHERE source_id = ?`,
      [TEST_SOURCE_ID]
    );

    const [[totalAfter]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM blue_data_20949
    `);

    if (Number(totalBefore.total) !== Number(totalAfter.total)) {
      throw new Error(
        `El total inicial era ${totalBefore.total} y el final es ${totalAfter.total}`
      );
    }

    console.log("");
    console.log("✅ PRUEBA UPSERT 20949 SUPERADA");
    console.log("✅ inserted / unchanged / updated");
    console.log("✅ source_id único");
  } catch (error) {
    console.error("");
    console.error("❌ PRUEBA FALLIDA:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.query(
        `DELETE FROM blue_data_20949 WHERE source_id = ?`,
        [TEST_SOURCE_ID]
      );
    } catch {
      // Tabla puede no existir
    }

    await closePool();
  }
}

main();
