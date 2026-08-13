// src/projects/index.js
// Registry / allowlist de proyectos BlueMessaging soportados.

import { project20532 } from "./project20532.js";
import { project20920 } from "./project20920.js";

const projectsByTemplateId = new Map([
  [project20532.templateId, project20532],
  [project20920.templateId, project20920],
]);

/**
 * Obtiene la configuración de un proyecto registrado.
 * @param {number|string} templateId
 * @returns {object|null} proyecto o null si no está en la allowlist
 */
export function getProject(templateId) {
  const id = Number(templateId);

  if (!Number.isFinite(id)) {
    return null;
  }

  return projectsByTemplateId.get(id) ?? null;
}

/**
 * Lista de template_id registrados (allowlist).
 */
export function listRegisteredTemplateIds() {
  return [...projectsByTemplateId.keys()];
}
