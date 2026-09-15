import { closeMongo, connectMongo } from './client.ts';

async function main() {
  try {
    const db = await connectMongo();

    const collections = ['users', 'memories', 'sessions', 'knowledge'];

    const existingCollections = await db.listCollections().toArray();

    const existingNames = new Set(existingCollections.map((collection) => collection.name));

    for (const name of collections) {
      if (!existingNames.has(name)) {
        await db.createCollection(name);
        console.log(`Created collection: ${name}`);
      } else {
        console.log(`Already exists: ${name}`);
      }
    }

    console.log('\nMongoDB setup complete.');
  } catch (error) {
    console.error('MongoDB setup failed:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

main();
