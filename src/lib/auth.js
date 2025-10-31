// src/lib/auth.js
import axios from "axios";
import dotenv from "dotenv";
import { URLSearchParams } from "url";
dotenv.config();

let token = null;
let expiry = 0;

/**
 * Obtiene y cachea un token de acceso válido de BlueMessaging.
 */
export async function getAccessToken() {
  if (token && Date.now() < expiry) {
    return token;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", process.env.BM_USERNAME);
  params.append("password", process.env.BM_PASSWORD);

  try {
    const response = await axios.post(
      "https://api.bluemessaging.net/v1/oauth/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    token = response.data.access_token;
    expiry = Date.now() + (response.data.expires_in - 60) * 1000; // renovar 1 min antes
    console.log("🔐 Nuevo token obtenido. Expira en", response.data.expires_in, "segundos");
    return token;
  } catch (error) {
    console.error("❌ Error al obtener el token BlueMessaging:", error.message);
    throw error;
  }
}
