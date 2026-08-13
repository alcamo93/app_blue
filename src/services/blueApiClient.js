// src/services/blueApiClient.js
// Cliente HTTP BlueMessaging: fills + paginación.
// No conoce MySQL, mapping ni UPSERT.

import axios from "axios";
import { getAccessToken } from "../lib/auth.js";

const BASE_URL = "https://api.bluemessaging.net/v1/rest";

/**
 * Itera páginas de fills de un template.
 *
 * @param {object} options
 * @param {number|string} options.templateId
 * @param {string} options.from - ISO UTC
 * @param {string} options.to - ISO UTC
 * @param {string} options.dateField - valor de date-type
 * @yields {{ results: object[], page: number, nextCursor: string|null }}
 */
export async function* iterateFills({
  templateId,
  from,
  to,
  dateField,
}) {
  let cursor = null;
  let page = 1;

  do {
    const token = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/templates/${templateId}/fills`,
      {
        params: {
          from,
          to,
          "date-type": dateField,
          limit: 100,
          count: true,
          worked: true,
          ...(cursor && { cursor }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      }
    );

    const { results = [], nextCursor } = response.data;

    yield {
      results,
      page,
      nextCursor: nextCursor || null,
    };

    cursor = nextCursor || null;
    page++;
  } while (cursor);
}
