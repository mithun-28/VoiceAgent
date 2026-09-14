import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

dotenv.config({ path: '.env.local' });

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'max_agent';

if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined in .env.local');
}

const client = new MongoClient(mongoUri);

let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  await client.connect();

  db = client.db(databaseName);

  await db.command({ ping: 1 });

  console.log(`MongoDB connected: ${databaseName}`);

  return db;
}

export function getMongoDb(): Db {
  if (!db) {
    throw new Error(
      'MongoDB is not connected. Call connectMongo() first.',
    );
  }

  return db;
}

export async function closeMongo(): Promise<void> {
  await client.close();

  db = null;

  console.log('MongoDB connection closed');
}