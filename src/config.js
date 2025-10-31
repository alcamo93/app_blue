import dotenv from "dotenv";
dotenv.config();

export const config = {
  blueApi: {
    baseUrl: process.env.BLUE_API_BASE,
    token: process.env.BLUE_API_TOKEN,
  },
  mysql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  queue: {
    name: process.env.QUEUE_NAME || "fetchBlueDataQueue",
  },
  template: {
    id: process.env.TEMPLATE_ID || "20475",
    dateField: process.env.TEMPLATE_DATE_FIELD || "receivedDate",
  },
  timezone: process.env.TIMEZONE || "America/Mexico_City",
};
