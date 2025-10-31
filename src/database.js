// src/database.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS, // usa DB_PASS tal como está en tu .env
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 👇 renombramos a insertRecord para que coincida con tu import en projectWorker.js
export async function insertRecord(record) {
  try {
    const sql = `
      INSERT INTO blue_data_20532 (
        source_id,
        usuario_ejecutor,
        fecha_creacion,
        fecha_recepcion,
        codigo_barras,
        expediente,
        tipo_propiedad,
        estatus,
        foto_fachada_src,
        foto_fachada_latitude,
        foto_fachada_longitude,
        foto_fachada_altitude,
        foto_medidor_src,
        foto_medidor_latitude,
        foto_medidor_longitude,
        foto_medidor_altitude,
        medidor_agua
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      record.source_id ?? null,
      record.usuario_ejecutor ?? null,
      record.fecha_creacion ?? null,
      record.fecha_recepcion ?? null,
      record.codigo_barras ?? null,
      record.expediente ?? null,
      record.tipo_propiedad ?? null,
      record.estatus ?? null,
      record.foto_fachada_src ?? null,
      record.foto_fachada_latitude ?? null,
      record.foto_fachada_longitude ?? null,
      record.foto_fachada_altitude ?? null,
      record.foto_medidor_src ?? null,
      record.foto_medidor_latitude ?? null,
      record.foto_medidor_longitude ?? null,
      record.foto_medidor_altitude ?? null,
      record.medidor_agua ?? null,
    ];

    await pool.query(sql, values);
  } catch (err) {
    console.error("❌ Error insertando registro:", err.message);
  }
}
