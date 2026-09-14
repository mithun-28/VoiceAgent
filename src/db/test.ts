import { connectMongo, closeMongo } from './client.ts';

async function main() {
  try {
    const db = await connectMongo();

    console.log('Database:', db.databaseName);
    console.log('MongoDB connection test successful!');
  } catch (error) {
    console.error('MongoDB connection failed:');
    console.error(error);
  } finally {
    await closeMongo();
  }
}

main();