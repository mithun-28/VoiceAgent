import { ObjectId } from 'mongodb';
import { getMongoDb } from '../db/client.ts';

export interface Memory {
  _id?: ObjectId;
  user_id: string;
  tenant_id: string;
  memory_type: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export async function remember(
  userId: string,
  content: string,
  memoryType = 'fact',
  tenantId = 'default',
) {
  const db = getMongoDb();

  const now = new Date();

  const memory: Memory = {
    user_id: userId,
    tenant_id: tenantId,
    memory_type: memoryType,
    content,
    created_at: now,
    updated_at: now,
  };

  const result = await db.collection<Memory>('memories').insertOne(memory);

  return {
    ...memory,
    _id: result.insertedId,
  };
}

export async function recall(userId: string, limit = 10, tenantId = 'default') {
  const db = getMongoDb();

  return db
    .collection<Memory>('memories')
    .find({
      user_id: userId,
      tenant_id: tenantId,
    })
    .sort({ updated_at: -1 })
    .limit(limit)
    .toArray();
}

export async function forget(userId: string, memoryId: string, tenantId = 'default') {
  const db = getMongoDb();

  const result = await db.collection<Memory>('memories').deleteOne({
    _id: new ObjectId(memoryId),
    user_id: userId,
    tenant_id: tenantId,
  });

  return result.deletedCount > 0;
}
