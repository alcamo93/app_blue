// src/scheduler.js
import cron from "node-cron";
import { runJob, closePool } from "./jobs/projectWorker.js";

const TIMEZONE = "America/Mexico_City";
const CRON_EXPRESSION = "0 5 * * *"; // 5:00 AM todos los días

console.log("🚀 Scheduler iniciado");
console.log(`⏰ Configurado para ejecutar a las 5:00 AM (${TIMEZONE})`);
console.log(`📅 Próxima ejecución: mañana a las 5:00 AM hora de México`);

// Programar el job
cron.schedule(
  CRON_EXPRESSION,
  async () => {
    console.log(`\n🔔 [${new Date().toISOString()}] Ejecutando job programado...`);
    try {
      await runJob();
      console.log("✅ Job completado exitosamente");
    } catch (err) {
      console.error("❌ Error durante la ejecución del job:", err);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

// Manejo de señales para cierre limpio
const shutdown = async (signal) => {
  console.log(`\n🛑 Recibida señal ${signal}. Cerrando scheduler...`);
  await closePool();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("📡 Scheduler en ejecución. Presiona Ctrl+C para detener.");

