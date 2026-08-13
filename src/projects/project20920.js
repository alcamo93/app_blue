// src/projects/project20920.js
// Configuración y mapping exclusivo del proyecto 20920.
// Keys Blue confirmadas por inspector/discovery. No inventar nombres.

import {
  normalizeBlueDateOnly,
  normalizeBlueDateToMexico,
  normalizeLocalDateTime,
} from "../utils/dates.js";

const TEMPLATE_ID = 20920;
const ATTACHMENT_BASE =
  "https://platform.bluemessaging.net/attachments.xsp";

function firstValue(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapLocation(location) {
  if (!location || typeof location !== "object") {
    return {
      latitude: null,
      longitude: null,
      altitude: null,
    };
  }

  return {
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    altitude: location.altitude ?? null,
  };
}

function serializeLocation(location) {
  if (location == null) {
    return null;
  }

  return JSON.stringify(location);
}

function mapAttachment(value, questionKey) {
  if (!value || typeof value !== "object") {
    return {
      src: null,
      editTime: null,
      fileSizeKb: null,
      location: null,
    };
  }

  return {
    src: value.name
      ? `${ATTACHMENT_BASE}?name=${value.name}&template=${TEMPLATE_ID}&question=${questionKey}`
      : null,
    editTime: normalizeBlueDateToMexico(value.date ?? value.edit_time ?? null),
    fileSizeKb: value.file_size_kb ?? null,
    location: serializeLocation(value.location),
  };
}

function mapPdfSrc(fileName) {
  if (!fileName) {
    return null;
  }

  return `${ATTACHMENT_BASE}?name=${fileName}&template=${TEMPLATE_ID}&question=pdf`;
}

export const project20920 = {
  templateId: TEMPLATE_ID,
  name: "Gestión Universal Monterrey - v2",
  tableName: "blue_data_20920",
  defaultDateField: "receivedDate",

  columns: [
    "source_id",
    "usuario_ejecutor",
    "usuario_propietario",
    "trabajado_en",
    "status_blue",
    "location_status",
    "fecha_descarga",
    "fecha_activacion",
    "fecha_expiracion",
    "fecha_actualizacion",
    "fecha_creacion",
    "fecha_edicion",
    "fecha_recepcion",
    "fecha_envio",
    "fecha_guardado",
    "visited_location_latitude",
    "visited_location_longitude",
    "visited_location_altitude",
    "cuestionario",
    "alerta",
    "codigo_barras",
    "expediente",
    "fecha_hora_gestion",
    "foto_fachada_src",
    "foto_fachada_edit_time",
    "foto_fachada_file_size_kb",
    "foto_fachada_location",
    "geolocalizacion_latitude",
    "geolocalizacion_longitude",
    "geolocalizacion_altitude",
    "fecha_notificacion",
    "tipo_propiedad",
    "situacion_vivienda",
    "foto_medidor_src",
    "foto_medidor_edit_time",
    "foto_medidor_file_size_kb",
    "foto_medidor_location",
    "estado_medidor",
    "foto_puerta_src",
    "foto_puerta_edit_time",
    "foto_puerta_file_size_kb",
    "foto_puerta_location",
    "tipo_entrega_aviso",
    "nombre_recibe",
    "foto_id_o_recibido_src",
    "foto_id_o_recibido_edit_time",
    "foto_id_o_recibido_file_size_kb",
    "foto_id_o_recibido_location",
    "foto_documentopegado_src",
    "foto_documentopegado_edit_time",
    "foto_documentopegado_file_size_kb",
    "foto_documentopegado_location",
    "tipo_entrega_notificacion",
    "foto_id_frente_src",
    "foto_id_frente_edit_time",
    "foto_id_frente_file_size_kb",
    "foto_id_frente_location",
    "foto_id_posterior_src",
    "foto_id_posterior_edit_time",
    "foto_id_posterior_file_size_kb",
    "foto_id_posterior_location",
    "telefono_recibe",
    "foto_evidencia_entrega_src",
    "foto_evidencia_entrega_edit_time",
    "foto_evidencia_entrega_file_size_kb",
    "foto_evidencia_entrega_location",
    "observaciones",
    "asesor",
    "fecha_gestion_pdf",
    "foto_papeleta_visita_src",
    "foto_papeleta_visita_edit_time",
    "foto_papeleta_visita_file_size_kb",
    "foto_papeleta_visita_location",
    "estado_papeleta",
    "reporte_visita_src",
    "raw_payload",
  ],

  mapRecord(item) {
    const values = item.values || {};
    const visited = mapLocation(item.visitedLocation);
    const gps = mapLocation(values.gps);

    const fotoFachada = mapAttachment(values.foto_fachada, "foto_fachada");
    const fotoMedidor = mapAttachment(values.foto_medidor, "foto_medidor");
    const fotoPuerta = mapAttachment(values.foto_puerta, "foto_puerta");
    const fotoIdORecibido = mapAttachment(
      values.foto_id_o_recibido,
      "foto_id_o_recibido"
    );
    const fotoDocumentoPegado = mapAttachment(
      values.foto_documentopegado,
      "foto_documentopegado"
    );
    const fotoIdFrente = mapAttachment(values.foto_ID_frente, "foto_ID_frente");
    const fotoIdPosterior = mapAttachment(
      values.foto_ID_posterior,
      "foto_ID_posterior"
    );
    const fotoEvidencia = mapAttachment(
      values.foto_evidencia_entrega,
      "foto_evidencia_entrega"
    );
    const fotoPapeleta = mapAttachment(
      values.foto_papeleta_visita,
      "foto_papeleta_visita"
    );

    return {
      source_id: item.sourceId,

      usuario_ejecutor: item.user ?? null,
      usuario_propietario: item.altUser ?? null,
      trabajado_en: item.locationStatus ?? null,

      status_blue: item.status ?? null,
      location_status: item.locationStatus ?? null,

      fecha_descarga: null,
      fecha_activacion: null,
      fecha_expiracion: null,
      fecha_actualizacion: normalizeBlueDateToMexico(item.updateDate),
      fecha_creacion: normalizeBlueDateToMexico(item.creationDate),
      fecha_edicion: normalizeBlueDateToMexico(item.startDate),
      fecha_recepcion: normalizeBlueDateToMexico(item.receivedDate),
      fecha_envio: normalizeBlueDateToMexico(item.sentDate),
      fecha_guardado: normalizeBlueDateToMexico(item.saveDate),

      visited_location_latitude: visited.latitude,
      visited_location_longitude: visited.longitude,
      visited_location_altitude: visited.altitude,

      cuestionario: firstValue(values.cuestionario),
      alerta: values.alerta ?? null,
      codigo_barras: values.sc_codigobarras ?? null,
      expediente: values.clave_identificador ?? null,
      fecha_hora_gestion: normalizeLocalDateTime(values.fhh_gestion),

      foto_fachada_src: fotoFachada.src,
      foto_fachada_edit_time: fotoFachada.editTime,
      foto_fachada_file_size_kb: fotoFachada.fileSizeKb,
      foto_fachada_location: fotoFachada.location,

      geolocalizacion_latitude: gps.latitude,
      geolocalizacion_longitude: gps.longitude,
      geolocalizacion_altitude: gps.altitude,

      fecha_notificacion: normalizeBlueDateOnly(values.fh_notificacion),

      tipo_propiedad: firstValue(values.sl_tipo_propiedad),
      situacion_vivienda: firstValue(values.situacion_vivienda),

      foto_medidor_src: fotoMedidor.src,
      foto_medidor_edit_time: fotoMedidor.editTime,
      foto_medidor_file_size_kb: fotoMedidor.fileSizeKb,
      foto_medidor_location: fotoMedidor.location,

      estado_medidor: firstValue(values.estado_medidor),

      foto_puerta_src: fotoPuerta.src,
      foto_puerta_edit_time: fotoPuerta.editTime,
      foto_puerta_file_size_kb: fotoPuerta.fileSizeKb,
      foto_puerta_location: fotoPuerta.location,

      tipo_entrega_aviso: firstValue(values.tipo_entrega_aviso),
      nombre_recibe: values.nombre_recibe ?? null,

      foto_id_o_recibido_src: fotoIdORecibido.src,
      foto_id_o_recibido_edit_time: fotoIdORecibido.editTime,
      foto_id_o_recibido_file_size_kb: fotoIdORecibido.fileSizeKb,
      foto_id_o_recibido_location: fotoIdORecibido.location,

      foto_documentopegado_src: fotoDocumentoPegado.src,
      foto_documentopegado_edit_time: fotoDocumentoPegado.editTime,
      foto_documentopegado_file_size_kb: fotoDocumentoPegado.fileSizeKb,
      foto_documentopegado_location: fotoDocumentoPegado.location,

      tipo_entrega_notificacion: firstValue(values.tipo_entrega_notificacion),

      foto_id_frente_src: fotoIdFrente.src,
      foto_id_frente_edit_time: fotoIdFrente.editTime,
      foto_id_frente_file_size_kb: fotoIdFrente.fileSizeKb,
      foto_id_frente_location: fotoIdFrente.location,

      foto_id_posterior_src: fotoIdPosterior.src,
      foto_id_posterior_edit_time: fotoIdPosterior.editTime,
      foto_id_posterior_file_size_kb: fotoIdPosterior.fileSizeKb,
      foto_id_posterior_location: fotoIdPosterior.location,

      telefono_recibe: values.telefono_recibe ?? null,

      foto_evidencia_entrega_src: fotoEvidencia.src,
      foto_evidencia_entrega_edit_time: fotoEvidencia.editTime,
      foto_evidencia_entrega_file_size_kb: fotoEvidencia.fileSizeKb,
      foto_evidencia_entrega_location: fotoEvidencia.location,

      observaciones: values.observaciones ?? null,

      asesor: values.asesor ?? null,
      fecha_gestion_pdf: normalizeBlueDateOnly(values.fhh_gestion_pdf),

      foto_papeleta_visita_src: fotoPapeleta.src,
      foto_papeleta_visita_edit_time: fotoPapeleta.editTime,
      foto_papeleta_visita_file_size_kb: fotoPapeleta.fileSizeKb,
      foto_papeleta_visita_location: fotoPapeleta.location,

      estado_papeleta: firstValue(values.estado_papeleta),

      reporte_visita_src: mapPdfSrc(values.pdf),

      // mysql2 + columna JSON: string JSON estable, no rompe UPSERT genérico
      raw_payload: JSON.stringify(item),
    };
  },
};
