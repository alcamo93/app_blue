// src/jobs/manualFetch.js

import dotenv from "dotenv";
import path from "path";
import { fetchBlueData } from "../utils/blueAPI.js";

(async () => {
  try {
    console.log("🚀 Iniciando carga manual: Datos perdidos del 26/11/2025...");
    
    // RANGO DE DESCARGA: 26 de Noviembre (00:00:00) a 26 de Noviembre (23:59:59) hora de México
    await fetchBlueData(
      "2025-11-26T00:00:00-06:00", 
      "2025-11-26T23:59:59-06:00", 
      { template_id: 20532, date_field: "receivedDate" }
    );
    
    console.log("✅ Carga manual completada correctamente.");
  } catch (err) {
    console.error("❌ Error en la carga manual:", err.message);
  }
})();