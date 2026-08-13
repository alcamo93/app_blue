// src/jobs/testMapper20920.js
// Prueba unitaria del mapper 20920 (sin MySQL).

import { getProject } from "../projects/index.js";
import { project20920 } from "../projects/project20920.js";

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

const realItem = {
  sourceId: 1807845607,
  user: "predialmty2",
  altUser: "bmp",
  status: "FNL",
  locationStatus: "in-site",
  creationDate: "2026-07-29T02:05:55",
  updateDate: "2026-07-29T02:05:55",
  startDate: "2026-07-29T02:00:21",
  receivedDate: "2026-07-29T02:05:55",
  sentDate: "2026-07-29T02:05:52",
  saveDate: "2026-07-29T02:05:50",
  visitedLocation: {
    latitude: 25.7886637,
    longitude: -100.5514357,
    altitude: 0,
  },
  values: {
    cuestionario: "1",
    sc_codigobarras: "31364714_2219",
    clave_identificador: "31364714_2219",
    fhh_gestion: "2026-07-28 19:38",
    fhh_gestion_pdf: "2026-07-28",
    foto_fachada: {
      name: "n0WHo8ozeA0dFlWzpqRf-foto_fachada.jpg",
      date: "2026-07-29T01:38:26Z",
      file_size_kb: 640,
    },
    foto_medidor: {
      name: "n0WHo8ozeA0dFlWzpqRf-foto_medidor.jpg",
      date: "2026-07-29T01:38:28Z",
      file_size_kb: 128,
    },
    gps: {
      latitude: 25.7886637,
      longitude: -100.5514357,
      altitude: 655.8,
    },
    estado_medidor: ["Conectado directo"],
    estado_papeleta: ["Pendiente"],
    asesor: "predialmty2",
    pdf: "cvlefgjukm3l.pdf",
  },
};

const aguaQroItem = {
  sourceId: -209200003,
  user: "tester",
  values: {
    cuestionario: "3",
    foto_puerta: {
      name: "puerta.jpg",
      date: "2026-07-29T01:38:26Z",
      file_size_kb: 10,
    },
    tipo_entrega_aviso: ["2"],
    nombre_recibe: "Juan Perez",
    foto_id_o_recibido: {
      name: "id-recibido.jpg",
      file_size_kb: 11,
    },
    foto_documentopegado: {
      name: "pegado.jpg",
      file_size_kb: 12,
    },
  },
};

const queretaroItem = {
  sourceId: -209200002,
  user: "tester",
  values: {
    cuestionario: "2",
    tipo_entrega_notificacion: [4],
    foto_ID_frente: {
      name: "frente.jpg",
      file_size_kb: 20,
    },
    foto_ID_posterior: {
      name: "posterior.jpg",
      file_size_kb: 21,
    },
    telefono_recibe: "8111111111",
    foto_evidencia_entrega: {
      name: "evidencia.jpg",
      file_size_kb: 22,
    },
  },
};

try {
  console.log("========================================");
  console.log("🧪 PRUEBA MAPPER 20920");
  console.log("========================================");

  assert(project20920.templateId === 20920, "templateId");
  assert(project20920.tableName === "blue_data_20920", "tableName");
  assert(
    project20920.defaultDateField === "receivedDate",
    "defaultDateField"
  );
  assert(
    getProject(20920) === project20920,
    "20920 debe estar en el registry"
  );

  const record = project20920.mapRecord(realItem);

  assertEqual(record.source_id, 1807845607, "source_id");
  assertEqual(record.usuario_ejecutor, "predialmty2", "usuario_ejecutor");
  assertEqual(record.usuario_propietario, "bmp", "usuario_propietario");
  assertEqual(record.trabajado_en, "in-site", "trabajado_en");
  assertEqual(record.location_status, "in-site", "location_status");
  assertEqual(record.status_blue, "FNL", "status_blue");

  assertNull(record.fecha_descarga, "fecha_descarga sin key REST");
  assertNull(record.fecha_activacion, "fecha_activacion sin key REST");
  assertNull(record.fecha_expiracion, "fecha_expiracion sin key REST");
  assertEqual(record.fecha_actualizacion, "2026-07-28 20:05:55", "updateDate");
  assertEqual(record.fecha_creacion, "2026-07-28 20:05:55", "creationDate naive ISO");
  assertEqual(record.fecha_edicion, "2026-07-28 20:00:21", "startDate → fecha_edicion");
  assertEqual(record.fecha_recepcion, "2026-07-28 20:05:55", "receivedDate naive ISO");
  assertEqual(record.fecha_envio, "2026-07-28 20:05:52", "sentDate → fecha_envio");
  assertEqual(record.fecha_guardado, "2026-07-28 20:05:50", "saveDate → fecha_guardado");

  assertEqual(record.cuestionario, "1", "cuestionario");
  assertNull(record.alerta, "alerta ausente");
  assertEqual(record.codigo_barras, "31364714_2219", "sc_codigobarras");
  assertEqual(record.expediente, "31364714_2219", "clave_identificador");
  assertEqual(record.fecha_hora_gestion, "2026-07-28 19:38:00", "fhh_gestion local");
  assertEqual(record.fecha_gestion_pdf, "2026-07-28", "fhh_gestion_pdf DATE");

  assertEqual(
    record.foto_fachada_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=n0WHo8ozeA0dFlWzpqRf-foto_fachada.jpg&template=20920&question=foto_fachada",
    "foto_fachada URL"
  );
  assertEqual(record.foto_fachada_edit_time, "2026-07-28 19:38:26", "foto_fachada.date Z");
  assertEqual(record.foto_fachada_file_size_kb, 640, "foto_fachada.file_size_kb");
  assertNull(record.foto_fachada_location, "foto_fachada.location ausente");

  assertEqual(
    record.foto_medidor_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=n0WHo8ozeA0dFlWzpqRf-foto_medidor.jpg&template=20920&question=foto_medidor",
    "foto_medidor URL"
  );
  assertEqual(record.foto_medidor_edit_time, "2026-07-28 19:38:28", "foto_medidor.date Z");
  assertEqual(record.foto_medidor_file_size_kb, 128, "foto_medidor.file_size_kb");

  assertEqual(record.geolocalizacion_latitude, 25.7886637, "gps.latitude");
  assertEqual(record.geolocalizacion_longitude, -100.5514357, "gps.longitude");
  assertEqual(record.geolocalizacion_altitude, 655.8, "gps.altitude");

  assertEqual(record.visited_location_latitude, 25.7886637, "visitedLocation.latitude");
  assertEqual(record.visited_location_altitude, 0, "visitedLocation.altitude");
  assertEqual(record.estado_medidor, "Conectado directo", "estado_medidor array");
  assertEqual(record.estado_papeleta, "Pendiente", "estado_papeleta array");
  assertEqual(record.asesor, "predialmty2", "asesor");
  assertEqual(
    record.reporte_visita_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=cvlefgjukm3l.pdf&template=20920&question=pdf",
    "pdf URL"
  );

  assertNull(record.foto_puerta_src, "group_5 ausente → foto_puerta null");
  assertNull(record.tipo_entrega_aviso, "group_5 ausente → tipo_entrega_aviso null");
  assertNull(record.foto_ID_frente_src ?? record.foto_id_frente_src, "group_10 ausente");
  assertNull(record.fecha_notificacion, "fh_notificacion ausente");
  assertNull(record.tipo_propiedad, "sl_tipo_propiedad ausente");

  const payload = JSON.parse(record.raw_payload);
  assertEqual(payload.sourceId, 1807845607, "raw_payload.sourceId");
  assert(
    payload.values.sc_codigobarras === "31364714_2219",
    "raw_payload conserva values"
  );

  console.log("✅ Fixture real sourceId=1807845607 OK");

  const agua = project20920.mapRecord(aguaQroItem);
  assertEqual(agua.cuestionario, "3", "cuestionario=3");
  assertEqual(
    agua.foto_puerta_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=puerta.jpg&template=20920&question=foto_puerta",
    "foto_puerta URL"
  );
  assertEqual(agua.tipo_entrega_aviso, "2", "tipo_entrega_aviso array");
  assertEqual(agua.nombre_recibe, "Juan Perez", "nombre_recibe");
  assertEqual(
    agua.foto_id_o_recibido_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=id-recibido.jpg&template=20920&question=foto_id_o_recibido",
    "foto_id_o_recibido URL"
  );
  assertEqual(
    agua.foto_documentopegado_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=pegado.jpg&template=20920&question=foto_documentopegado",
    "foto_documentopegado URL"
  );
  console.log("✅ Fixture sintético cuestionario=3 OK");

  const qro = project20920.mapRecord(queretaroItem);
  assertEqual(qro.cuestionario, "2", "cuestionario=2");
  assertEqual(qro.tipo_entrega_notificacion, 4, "tipo_entrega_notificacion");
  assertEqual(
    qro.foto_id_frente_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=frente.jpg&template=20920&question=foto_ID_frente",
    "foto_ID_frente URL"
  );
  assertEqual(
    qro.foto_id_posterior_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=posterior.jpg&template=20920&question=foto_ID_posterior",
    "foto_ID_posterior URL"
  );
  assertEqual(qro.telefono_recibe, "8111111111", "telefono_recibe");
  assertEqual(
    qro.foto_evidencia_entrega_src,
    "https://platform.bluemessaging.net/attachments.xsp?name=evidencia.jpg&template=20920&question=foto_evidencia_entrega",
    "foto_evidencia_entrega URL"
  );
  console.log("✅ Fixture sintético cuestionario=2 OK");

  console.log("");
  console.log("✅ MAPPER 20920 OK");
  console.log("✅ URLs con question keys confirmadas");
  console.log("✅ Fechas REST convertidas a America/Mexico_City");
  console.log("✅ fhh_gestion sin reconversión de zona");
  console.log("✅ arrays / gps / nulls / raw_payload");
} catch (error) {
  console.error("");
  console.error("❌ PRUEBA MAPPER 20920 FALLIDA:", error.message);
  process.exitCode = 1;
}
