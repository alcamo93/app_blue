// src/projects/project20532.js
// Configuración y mapping exclusivo del proyecto 20532.

export const project20532 = {
  templateId: 20532,
  name: "Año 2025 Gestión Universal",
  tableName: "blue_data_20532",
  defaultDateField: "receivedDate",

  columns: [
    "source_id",
    "usuario_ejecutor",
    "fecha_creacion",
    "fecha_recepcion",
    "codigo_barras",
    "expediente",
    "tipo_propiedad",
    "estatus",
    "foto_fachada_src",
    "foto_fachada_latitude",
    "foto_fachada_longitude",
    "foto_fachada_altitude",
    "foto_medidor_src",
    "foto_medidor_latitude",
    "foto_medidor_longitude",
    "foto_medidor_altitude",
    "medidor_agua",
  ],

  mapRecord(item) {
    const templateId = this.templateId;
    const values = item.values || {};

    const photo1 = values.photo_1 || {};
    const location1 = photo1.location || {};

    const photo2 = values.photo_2 || {};
    const location2 = photo2.location || {};

    return {
      source_id: item.sourceId,

      usuario_ejecutor:
        item.user ||
        item.altUser ||
        null,

      fecha_creacion:
        item.creationDate
          ?.replace("T", " ")
          .substring(0, 19) ?? null,

      fecha_recepcion:
        item.receivedDate
          ?.replace("T", " ")
          .substring(0, 19) ?? null,

      codigo_barras:
        values.scanner_1 || null,

      expediente:
        values.Nombre_expediente || null,

      tipo_propiedad:
        Array.isArray(values.select_2)
          ? values.select_2[0]
          : values.select_2 || null,

      estatus:
        Array.isArray(values.select_1)
          ? values.select_1[0]
          : values.select_1 || null,

      medidor_agua:
        Array.isArray(values.select_3)
          ? values.select_3[0]
          : values.select_3 || null,

      foto_fachada_src:
        photo1.name
          ? `https://platform.bluemessaging.net/attachments.xsp?name=${photo1.name}&template=${templateId}&question=photo_1`
          : null,

      foto_fachada_latitude:
        location1.latitude ?? null,

      foto_fachada_longitude:
        location1.longitude ?? null,

      foto_fachada_altitude:
        location1.altitude ?? null,

      foto_medidor_src:
        photo2.name
          ? `https://platform.bluemessaging.net/attachments.xsp?name=${photo2.name}&template=${templateId}&question=photo_2`
          : null,

      foto_medidor_latitude:
        location2.latitude ?? null,

      foto_medidor_longitude:
        location2.longitude ?? null,

      foto_medidor_altitude:
        location2.altitude ?? null,
    };
  },
};
