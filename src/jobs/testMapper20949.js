// src/jobs/testMapper20949.js
// Prueba unitaria del mapper 20949 (sin MySQL).

import { getProject } from "../projects/index.js";
import { project20949 } from "../projects/project20949.js";

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

function assertNull(actual, label) {
  if (actual !== null) {
    throw new Error(
      `${label}: se esperaba null y se obtuvo ${JSON.stringify(actual)}`
    );
  }
}

// Registro REST real observado (sourceId=1834893809). No agregar campos que no traía.
const realItem = {
  sourceId: 1834893809,
  user: "predialmty2",
  altUser: "bmp",
  locationStatus: "in-site",
  status: "FNL",
  creationDate: "2026-09-29T01:56:56",
  updateDate: "2026-09-29T01:56:56",
  receivedDate: "2026-09-29T01:56:56",
  startDate: "2026-09-29T01:30:48",
  sentDate: "2026-09-29T01:56:54",
  saveDate: "2026-09-29T01:30:48",
  visitedLocation: {
    latitude: 25.7991164,
    longitude: -100.563132,
    altitude: 0,
  },
  values: {
    asesor: "predialmty2",
    clave_identificador: "31404942_49316",
    cuestionario: "1",
    estado_medidor: ["Con medidor"],
    estado_papeleta: ["Pendiente"],
    fhh_gestion: "2026-09-28 13:47",
    fhh_gestion_pdf: "2026-09-28",
    foto_fachada: {
      name: "zz9t2UCyAHrvNYxtFpy4-foto_fachada.jpg",
      date: "2026-09-28T19:47:57Z",
      file_size_kb: 629,
      location: {
        latitude: 25.7991164,
        longitude: -100.563132,
        altitude: 664.3,
      },
    },
    foto_medidor: {
      name: "zz9t2UCyAHrvNYxtFpy4-foto_medidor.jpg",
      date: "2026-09-28T19:48:00Z",
      file_size_kb: 149,
    },
    gps: {
      latitude: 25.7885728,
      longitude: -100.5513771,
      altitude: 655.5,
    },
    pdf: "d0tbghke90nb.pdf",
    sc_codigobarras: "31404942_49316",
  },
};

// Fixture sintético: solo para cubrir campos opcionales que el registro real no trae.
const syntheticItem = {
  ...realItem,
  sourceId: 999000001,
  values: {
    ...realItem.values,
    observaciones: "prueba",
    situacion_vivienda: ["Casa"],
    sl_tipo_propiedad: ["Residencial"],
  },
};

try {
  console.log("========================================");
  console.log("🧪 PRUEBA MAPPER 20949");
  console.log("========================================");

  assert(project20949.templateId === 20949, "templateId");
  assert(project20949.tableName === "blue_data_20949", "tableName");
  assert(
    project20949.defaultDateField === "receivedDate",
    "defaultDateField"
  );
  assert(getProject(20949) === project20949, "20949 debe estar en el registry");

  const record = project20949.mapRecord(realItem);

  assertEqual(record.source_id, 1834893809, "source_id");
  assertEqual(record.codigo_barras, "31404942_49316", "codigo_barras");
  assertEqual(record.expediente, "31404942_49316", "expediente");

  assertEqual(
    record.geolocalizacion_latitude,
    25.7991164,
    "geolocalizacion_latitude"
  );
  assertEqual(
    record.geolocalizacion_longitude,
    -100.563132,
    "geolocalizacion_longitude"
  );
  assertEqual(
    record.geolocalizacion_altitude,
    664.3,
    "geolocalizacion_altitude"
  );

  assertEqual(record.gps_formulario_latitude, 25.7885728, "gps_formulario_latitude");
  assertEqual(record.gps_formulario_longitude, -100.5513771, "gps_formulario_longitude");
  assertEqual(record.gps_formulario_altitude, 655.5, "gps_formulario_altitude");

  assertEqual(record.visited_location_latitude, 25.7991164, "visited_location_latitude");
  assertEqual(record.visited_location_longitude, -100.563132, "visited_location_longitude");
  assertEqual(record.visited_location_altitude, 0, "visited_location_altitude");

  assertEqual(
    record.foto_fachada_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=zz9t2UCyAHrvNYxtFpy4-foto_fachada.jpg&template=20949&question=foto_fachada",
    "foto_fachada_src"
  );
  assertEqual(record.foto_fachada_edit_time, "2026-09-28 13:47:57", "foto_fachada.date");

  assertEqual(
    record.reporte_visita_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=d0tbghke90nb.pdf&template=20949&question=pdf",
    "reporte_visita_src"
  );

  assertEqual(record.fecha_creacion, "2026-09-28 19:56:56", "creationDate => America/Mexico_City");
  assertEqual(record.fecha_recepcion, "2026-09-28 19:56:56", "receivedDate => America/Mexico_City");
  assertEqual(record.fecha_edicion, "2026-09-28 19:30:48", "startDate => America/Mexico_City");
  assertEqual(record.fecha_envio, "2026-09-28 19:56:54", "sentDate => America/Mexico_City");
  assertEqual(record.fecha_guardado, "2026-09-28 19:30:48", "saveDate => America/Mexico_City");
  assertEqual(record.fecha_hora_gestion, "2026-09-28 13:47:00", "fhh_gestion local");
  assertEqual(record.fecha_gestion_pdf, "2026-09-28", "fhh_gestion_pdf date");

  assertEqual(
    record.foto_medidor_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=zz9t2UCyAHrvNYxtFpy4-foto_medidor.jpg&template=20949&question=foto_medidor",
    "foto_medidor_src"
  );
  assertEqual(record.foto_medidor_file_size_kb, 149, "foto_medidor_file_size_kb");
  assertNull(record.foto_medidor_location, "foto_medidor_location");

  assertEqual(record.foto_fachada_location, JSON.stringify(realItem.values.foto_fachada.location), "foto_fachada_location");
  const payload = JSON.parse(record.raw_payload);
  assertEqual(payload.sourceId, 1834893809, "raw_payload.sourceId");
  assertEqual(payload.values.gps.latitude, 25.7885728, "raw_payload values.gps latitude");

  const fotoLocation = JSON.parse(record.foto_fachada_location);
  assertEqual(fotoLocation.latitude, 25.7991164, "foto_fachada.location.latitude");

  assertNull(record.observaciones, "real: observaciones");
  assertNull(record.situacion_vivienda, "real: situacion_vivienda");
  assertNull(record.tipo_propiedad, "real: tipo_propiedad");

  console.log("✅ Fixture real sourceId=1834893809 OK");

  const synthetic = project20949.mapRecord(syntheticItem);
  assertEqual(synthetic.observaciones, "prueba", "synthetic: observaciones");
  assertEqual(synthetic.situacion_vivienda, "Casa", "synthetic: situacion_vivienda");
  assertEqual(synthetic.tipo_propiedad, "Residencial", "synthetic: tipo_propiedad");
  assert(
    !("observaciones" in realItem.values) &&
      !("situacion_vivienda" in realItem.values) &&
      !("sl_tipo_propiedad" in realItem.values),
    "realItem no debe contener campos sintéticos"
  );

  console.log("✅ Fixture sintético (campos opcionales) OK");
  console.log("✅ geolocalización oficial = values.foto_fachada.location");
  console.log("✅ gps_formulario_* conserva values.gps para auditoría");
  console.log("✅ fecha/hora local normalizada según México");
  console.log("✅ URLs con template=20949");
  console.log("");
  console.log("✅ MAPPER 20949 OK");
} catch (error) {
  console.error("");
  console.error("❌ PRUEBA MAPPER 20949 FALLIDA:", error.message);
  process.exitCode = 1;
}
