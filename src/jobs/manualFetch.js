import dotenv from "dotenv";
import path from "path";

// Fuerza la carga del archivo .env.local desde la raíz del proyecto
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { fetchBlueData } from "../utils/blueAPI.js";

(async () => {
  try {
    console.log("🚀 Iniciando carga manual del 27/10 al 04/11...");
    await fetchBlueData(
      "2025-11-19T00:00:00-06:00",
      "2025-11-23T23:59:59-06:00",
      { template_id: 20532, date_field: "receivedDate" }
    );
    console.log("✅ Carga manual completada correctamente.");
  } catch (err) {
    console.error("❌ Error en la carga manual:", err.message);
  }
})();
