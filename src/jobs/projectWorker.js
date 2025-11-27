// src/jobs/projectWorker.js
import axios from "axios";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { getAccessToken } from "../lib/auth.js";
import { insertRecord } from "../database.js";

dotenv.config();

// ⚙️ Conexión MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// 🔁 Obtener template activo
async function getActiveTemplates() {
  const [rows] = await pool.query(`
    SELECT template_id, date_field
    FROM blue_templates
    WHERE active = 1
  `);
  return rows;
}

// 🕐 Rango de fechas con margen -6h en from, y to limitado al momento actual
function generateDailyRange(daysAgo = 1) {
  const tz = process.env.TIMEZONE || "America/Mexico_City";
  const now = moment.tz(tz);
  const startLocal = now.clone().subtract(daysAgo, "days").startOf("day");
  const endLocal = startLocal.clone().endOf("day");
  
  // Calcular el 'to' deseado (fin del día + 6h margen)
  const toDesired = endLocal.clone().add(6, "hours");
  // Limitar 'to' al momento actual para evitar fechas futuras que la API rechaza
  const toFinal = moment.min(toDesired, now);

  const from = startLocal.clone().subtract(6, "hours").utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
  const to = toFinal.utc().format("YYYY-MM-DDTHH:mm:ss[Z]");

  console.log(`📅 Rango de fechas: from=${from}, to=${to}`);
  
  return { from, to };
}

// 🚀 Ejecuta la sincronización directamente
export async function runJob() {
  const templates = await getActiveTemplates();
  const token = await getAccessToken();

  for (const { template_id, date_field } of templates) {
    console.log(`\n=== Sync Template ${template_id} (${date_field}) ===`);
    const { from, to } = generateDailyRange(1);

    let cursor = null, total = 0, page = 1;

    do {
      const resp = await axios.get(
        `https://api.bluemessaging.net/v1/rest/templates/${template_id}/fills`,
        {
          params: {
            from, to, "date-type": date_field,
            limit: 100, count: true, worked: true,
            ...(cursor && { cursor }),
          },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000, // ⏱ evita cuelgues por lentitud de red
        }
      );

      const { results = [], nextCursor } = resp.data;
      console.log(`📄 Page ${page}: ${results.length} registros`);

      for (const item of results) {
        const v = item.values || {};
        const photo1 = v.photo_1 || {}, loc1 = photo1.location || {};
        const photo2 = v.photo_2 || {}, loc2 = photo2.location || {};

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
        total++;
      }

      cursor = nextCursor;
      page++;
    } while (cursor);

    console.log(`✅ Total registros insertados: ${total}`);
  }

  console.log("\n🎯 Job completed.");
}

// 🔌 Exportar función para cerrar conexión
export async function closePool() {
  console.log("🧹 Cerrando conexión MySQL...");
  await pool.end();
}

// 🧹 Manejo de ejecución controlada (solo cuando se ejecuta directamente)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  (async () => {
    try {
      await runJob();
      console.log("🎯 Proceso completado correctamente");
    } catch (err) {
      console.error("❌ Error durante la ejecución:", err);
    } finally {
      await closePool();
      process.exit(0);
    }
  })();
}
