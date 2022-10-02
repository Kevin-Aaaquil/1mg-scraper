import { config } from "dotenv";

config();

export default {
  MONGODB_URL: process.env.MONGODB_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  DOCUMENT_PULL_LIMIT: parseInt(process.env.DOCUMENT_PULL_LIMIT),
  DB_NAME: process.env.DB_NAME,
};
