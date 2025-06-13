// lib/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function getDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db("details"); // <-- your DB name
}
