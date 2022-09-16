import { MongoClient, Db } from "mongodb";
import { config } from "dotenv";
config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

let db: Db;

const connect = async (): Promise<Db> => {
  const client = new MongoClient(MONGODB_URI, {
    ignoreUndefined: true,
  });
  console.log("✅ : database connected");
  return client.db(DB_NAME || "test");
};

export default async (): Promise<Db> => {
  if (!db) {
    db = await connect();
    return db;
  }
  return db;
};
