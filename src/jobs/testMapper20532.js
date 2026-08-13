// src/jobs/testMapper20532.js
// Prueba unitaria del mapper del proyecto 20532 (sin MySQL).

import { project20532 } from "../projects/project20532.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: se esperaba ${JSON.stringify(expected)} y se obtuvo ${JSON.stringify(actual)}`
    );
  }
}

const sampleItem = {
  sourceId: 123456789,
  user: "usuario.test",
  altUser: "alt.user",
  creationDate: "2026-08-09T10:15:30.000Z",
  receivedDate: "2026-08-09T11:20:40.000Z",
  values: {
    scanner_1: "CB-001",
    Nombre_expediente: "EXP-999",
    select_1: ["ESTATUS_A"],
    select_2: "CASA",
    select_3: ["CON_MEDIDOR"],
    photo_1: {
      name: "fachada.jpg",
      location: {
        latitude: 25.67,
        longitude: -100.31,
        altitude: 540,
      },
    },
    photo_2: {
      name: "medidor.jpg",
      location: {
        latitude: 25.68,
        longitude: -100.32,
        altitude: 541,
      },
    },
  },
};

try {
  console.log("========================================");
  console.log("🧪 PRUEBA MAPPER 20532");
  console.log("========================================");

  const record = project20532.mapRecord(sampleItem);

  assertEqual(record.source_id, 123456789, "source_id");
  assertEqual(record.usuario_ejecutor, "usuario.test", "usuario_ejecutor");
  assertEqual(record.fecha_creacion, "2026-08-09 10:15:30", "fecha_creacion");
  assertEqual(record.fecha_recepcion, "2026-08-09 11:20:40", "fecha_recepcion");

  assertEqual(record.codigo_barras, "CB-001", "scanner_1 → codigo_barras");
  assertEqual(record.expediente, "EXP-999", "Nombre_expediente → expediente");
  assertEqual(record.estatus, "ESTATUS_A", "select_1 → estatus");
  assertEqual(record.tipo_propiedad, "CASA", "select_2 → tipo_propiedad");
  assertEqual(record.medidor_agua, "CON_MEDIDOR", "select_3 → medidor_agua");

  assertEqual(
    record.foto_fachada_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=fachada.jpg&template=20532&question=photo_1",
    "photo_1 → foto_fachada_src"
  );
  assertEqual(record.foto_fachada_latitude, 25.67, "photo_1.location.latitude");
  assertEqual(record.foto_fachada_longitude, -100.31, "photo_1.location.longitude");
  assertEqual(record.foto_fachada_altitude, 540, "photo_1.location.altitude");

  assertEqual(
    record.foto_medidor_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=medidor.jpg&template=20532&question=photo_2",
    "photo_2 → foto_medidor_src"
  );
  assertEqual(record.foto_medidor_latitude, 25.68, "photo_2.location.latitude");
  assertEqual(record.foto_medidor_longitude, -100.32, "photo_2.location.longitude");
  assertEqual(record.foto_medidor_altitude, 541, "photo_2.location.altitude");

  // select como string vs array
  const withStringSelect = project20532.mapRecord({
    ...sampleItem,
    values: {
      ...sampleItem.values,
      select_1: "SOLO_STRING",
    },
  });
  assertEqual(withStringSelect.estatus, "SOLO_STRING", "select_1 string");

  // sin fotos
  const withoutPhotos = project20532.mapRecord({
    sourceId: 1,
    values: {},
  });
  assertEqual(withoutPhotos.foto_fachada_src, null, "sin photo_1");
  assertEqual(withoutPhotos.foto_medidor_src, null, "sin photo_2");

  // altUser fallback
  const withAlt = project20532.mapRecord({
    sourceId: 2,
    altUser: "solo.alt",
    values: {},
  });
  assertEqual(withAlt.usuario_ejecutor, "solo.alt", "altUser fallback");

  assert(
    project20532.tableName === "blue_data_20532",
    "tableName debe ser blue_data_20532"
  );
  assert(project20532.templateId === 20532, "templateId debe ser 20532");

  console.log("");
  console.log("✅ MAPPER 20532 OK");
  console.log("✅ scanner_1 → codigo_barras");
  console.log("✅ Nombre_expediente → expediente");
  console.log("✅ select_1 → estatus");
  console.log("✅ select_2 → tipo_propiedad");
  console.log("✅ select_3 → medidor_agua");
  console.log("✅ photo_1 → fachada (+ location)");
  console.log("✅ photo_2 → medidor (+ location)");
} catch (error) {
  console.error("");
  console.error("❌ PRUEBA MAPPER FALLIDA:", error.message);
  process.exitCode = 1;
}
