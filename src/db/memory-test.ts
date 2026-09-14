import { connectMongo, closeMongo } from './client.ts';

async function main() {
  try {
    const db = await connectMongo();

    const memories = db.collection('memories');

    // Insert test memory
    const result = await memories.insertOne({
      user_id: 'test-user',
      tenant_id: 'default',
      memory_type: 'test',
      content: 'Max MongoDB memory is working.',
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('Memory inserted:', result.insertedId);

    // Read it back
    const memory = await memories.findOne({
      _id: result.insertedId,
    });

    console.log('Memory retrieved:');
    console.log(memory);

    // Clean up test document
    await memories.deleteOne({
      _id: result.insertedId,
    });

    console.log('Test memory deleted.');
    console.log('MongoDB read/write test successful!');
  } catch (error) {
    console.error('Memory test failed:');
    console.error(error);
  } finally {
    await closeMongo();
  }
}

main();