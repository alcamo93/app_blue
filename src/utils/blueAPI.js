// src/utils/blueAPI.js
import axios from "axios";
import moment from "moment-timezone";
import { getAccessToken } from "../lib/auth.js";
import { insertRecord } from "../database.js";

// 🕐 Genera rango con margen ±6 h (usado si ejecutas manualmente)
function generateSafeRange(dateFrom, dateTo) {
  const fromUTC = moment(dateFrom).subtract(6, "hours").utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
  const toUTC = moment(dateTo).add(6, "hours").utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
  return { fromUTC, toUTC };
}

export async function fetchBlueData(dateFrom, dateTo, template) {
  const { fromUTC, toUTC } = generateSafeRange(dateFrom, dateTo);
  const { template_id, date_field } = template;

  const baseUrl = "https://api.bluemessaging.net/v1/rest";
  let nextCursor = null;
  let totalInserted = 0;
  let page = 1;

  do {
    const token = await getAccessToken();
    const url = `${baseUrl}/templates/${template_id}/fills${nextCursor ? `?cursor=${nextCursor}` : ""}`;

    console.log("🔎 Fetching URL:", url);
    const resp = await axios.get(url, {
      params: {
        from: fromUTC,
        to: toUTC,
        "date-type": date_field,
        limit: 100,
        count: true,
        worked: true,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const { results = [], nextCursor: newCursor } = resp.data;
    console.log(`📄 Page ${page}: ${results.length} registros, total=${totalInserted + results.length}`);

    if (template_id === 20532 && results.length) {
      for (const item of results) {
        try {
          const v = item.values || {};
          const photo1 = v.photo_1 || {};
          const loc1 = photo1.location || {};
          const photo2 = v.photo_2 || {};
          const loc2 = photo2.location || {};

          const record = {
            source_id: item.sourceId,
            usuario_ejecutor: item.user || item.altUser || null,
            fecha_creacion: item.creationDate?.replace("T", " ").substring(0, 19),
            fecha_recepcion: item.receivedDate?.replace("T", " ").substring(0, 19),
            codigo_barras: v.scanner_1 || null,
            expediente: v.Nombre_expediente || null,
            tipo_propiedad: Array.isArray(v.select_2) ? v.select_2[0] : v.select_2 || null,
            estatus: Array.isArray(v.select_1) ? v.select_1[0] : v.select_1 || null,
            medidor_agua: Array.isArray(v.select_3) ? v.select_3[0] : v.select_3 || null,

            foto_fachada_src: photo1.name
              ? `https://platform.bluemessaging.net/attachments.xsp?name=${photo1.name}&template=${template_id}&question=photo_1`
              : null,
            foto_fachada_latitude: loc1.latitude ?? null,
            foto_fachada_longitude: loc1.longitude ?? null,
            foto_fachada_altitude: loc1.altitude ?? null,

            foto_medidor_src: photo2.name
              ? `https://platform.bluemessaging.net/attachments.xsp?name=${photo2.name}&template=${template_id}&question=photo_2`
              : null,
            foto_medidor_latitude: loc2.latitude ?? null,
            foto_medidor_longitude: loc2.longitude ?? null,
            foto_medidor_altitude: loc2.altitude ?? null,
          };

          await insertRecord(record);
          totalInserted++;
        } catch (err) {
          console.error("❌ Error insertando registro:", err.message);
        }
      }
    }

    nextCursor = newCursor;
    page++;
  } while (nextCursor);

  console.log(`🎯 [Template ${template_id}] Total de registros insertados: ${totalInserted}`);
}
