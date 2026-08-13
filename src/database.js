// src/database.js
import "./config/env.js";

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Necesario para que affectedRows diferencie correctamente:
  // 1 = insertado
  // 2 = actualizado
  // 0 = existente sin cambios
  flags: "-FOUND_ROWS",
});

/**
 * Cierra el pool MySQL.
 */
export async function closePool() {
  console.log("🧹 Cerrando conexión MySQL...");
  await pool.end();
}
