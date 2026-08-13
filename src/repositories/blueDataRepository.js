// src/repositories/blueDataRepository.js
import { pool } from "../database.js";
import { getProject } from "../projects/index.js";

const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertSafeIdent(value, label) {
  if (typeof value !== "string" || !SAFE_IDENT.test(value)) {
    throw new Error(`Identificador SQL inválido en ${label}: ${value}`);
  }
}

/**
 * Garantiza que el project proviene del registry allowlist y que
 * tableName coincide con la configuración registrada.
 * La ejecución SQL usa siempre la config del registry, no la del caller.
 */
function resolveRegisteredProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Se requiere un project válido para el UPSERT");
  }

  if (project.templateId == null) {
    throw new Error("Se requiere project.templateId para el UPSERT");
  }

  // Defensa adicional: rechazar identificadores SQL inseguros del caller
  assertSafeIdent(project.tableName, "tableName");

  const registered = getProject(project.templateId);

  if (!registered) {
    throw new Error(
      `Proyecto templateId=${project.templateId} no está registrado en projects/index.js`
    );
  }

  if (project.tableName !== registered.tableName) {
    throw new Error(
      `tableName "${project.tableName}" no coincide con el registrado ` +
        `"${registered.tableName}" para templateId=${registered.templateId}`
    );
  }

  assertSafeIdent(registered.tableName, "tableName");

  if (!Array.isArray(registered.columns) || registered.columns.length === 0) {
    throw new Error(
      `El proyecto ${registered.templateId} no declara columns`
    );
  }

  if (!registered.columns.includes("source_id")) {
    throw new Error(
      `El proyecto ${registered.templateId} debe incluir source_id en columns`
    );
  }

  for (const column of registered.columns) {
    assertSafeIdent(column, "columns");
  }

  return registered;
}

/**
 * UPSERT idempotente por UNIQUE(source_id).
 *
 * Con mysql2 flags "-FOUND_ROWS":
 * - affectedRows === 1 -> inserted
 * - affectedRows === 2 -> updated
 * - affectedRows === 0 -> unchanged
 *
 * No hace SELECT previo. No usa INSERT IGNORE.
 * tableName y columns salen exclusivamente del registry allowlist.
 */
export async function upsertRecord(project, record) {
  const registered = resolveRegisteredProject(project);

  if (record?.source_id == null) {
    throw new Error("No se puede guardar un registro sin source_id");
  }

  const tableName = registered.tableName;
  const columns = registered.columns;

  const columnSql = columns.map((c) => `\`${c}\``).join(", ");
  const placeholders = columns.map(() => "?").join(", ");

  const updateColumns = columns.filter((c) => c !== "source_id");
  const updateSql = updateColumns
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
    .join(",\n      ");

  const sql = `
    INSERT INTO \`${tableName}\` (
      ${columnSql}
    )
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE
      ${updateSql}
  `;

  const values = columns.map((column) => record[column] ?? null);

  try {
    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 1) {
      return {
        action: "inserted",
        sourceId: record.source_id,
      };
    }

    if (result.affectedRows === 2) {
      return {
        action: "updated",
        sourceId: record.source_id,
      };
    }

    return {
      action: "unchanged",
      sourceId: record.source_id,
    };
  } catch (err) {
    console.error(
      `❌ Error guardando source_id=${record.source_id} en ${tableName}:`,
      err.message
    );

    throw err;
  }
}
