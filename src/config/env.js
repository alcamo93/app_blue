// src/config/env.js
//
// Carga centralizada de entorno.
// - Local: si existe .env.local, se carga (sin pisar vars ya definidas).
// - Railway / producción: las vars ya vienen en process.env; si no hay
//   .env.local, no se sobrescribe nada crítico.
//
// Importar este módulo (side-effect) al inicio de cualquier entrada que
// necesite credenciales, sin depender del orden entre database.js y auth.js.
// No imprime ni expone secretos.

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const LOCAL_ENV_PATH = path.resolve(process.cwd(), ".env.local");

let loaded = false;

/**
 * Idempotente: seguro de llamar / importar múltiples veces.
 */
export function loadEnv() {
  if (loaded) {
    return;
  }

  loaded = true;

  if (fs.existsSync(LOCAL_ENV_PATH)) {
    // dotenv no sobrescribe variables ya presentes en process.env
    dotenv.config({ path: LOCAL_ENV_PATH });
    return;
  }

  // Fallback opcional a .env estándar (tampoco sobrescribe existentes)
  dotenv.config();
}

loadEnv();
