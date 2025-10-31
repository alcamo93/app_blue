// scripts/downloadImages.js
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAccessToken } from '../src/lib/auth.js';

dotenv.config();

// recrear __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Tabla y carpeta de destino
const TABLES = [
  { name: 'abr_25_vis', dir: 'abr_25_vis' },
];

async function main() {
  const token = await getAccessToken();
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     +process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  // Asegura carpeta de destino
  for (const { dir } of TABLES) {
    await fs.ensureDir(path.join(__dirname, '..', 'img', dir));
  }

  for (const { name: table, dir } of TABLES) {
    const [rows] = await db.query(
      `SELECT Loc, Tabla AS template_raw, photo_1_name, photo_2_name, Expediente FROM \`${table}\``
    );

    for (const row of rows) {
      const { Loc, template_raw, photo_1_name, photo_2_name, Expediente } = row;
      // Quitar sufijo _N para la llamada a la API
      const template = template_raw.replace(/_N$/, '');

      for (const [question, suffix, photoName] of [
        ['photo_1', 'F', photo_1_name],
        ['photo_2', 'M', photo_2_name],
      ]) {
        if (!photoName) continue;

        // Usar el nombre completo tal cual (incluido .jpg)
        const photoId = photoName;  // no se quita la extensión ni prefijos
        const url = `https://api.bluemessaging.net/v1/rest/attachments/${photoId}` +
                    `?template=${template}&question=${question}`;
        const outPath = path.join(
          __dirname, '..', 'img', dir,
          `${Expediente}_${suffix}_${template}.jpg`
        );

        try {
          const response = await axios.get(url, {
            responseType: 'stream',
            headers: { Authorization: `Bearer ${token}` },
          });
          await new Promise((res, rej) => {
            response.data
              .pipe(fs.createWriteStream(outPath))
              .on('finish', res)
              .on('error', rej);
          });
          console.log(`✅ ${dir}/${Expediente}_${suffix}_${template}.jpg`);
        } catch (err) {
          if (err.response && err.response.status) {
            console.error(`⚠️ Error ${err.response.status} en ${url}`);
          } else {
            console.error(`⚠️ Error en ${url}: ${err.message}`);
          }
        }
      }
    }
  }

  await db.end();
}

main().catch(err => {
  console.error('Fallo crítico:', err.message);
  process.exit(1);
});
