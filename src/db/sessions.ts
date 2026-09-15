import { ObjectId } from 'mongodb';
import { connectMongo } from './client.ts';

export interface SessionTurn {
  role: string;
  content: string;
  at: Date;
}

export interface SessionRecord {
  _id?: ObjectId;
  user_id: string;
  session_id: string;
  started_at: Date;
  ended_at?: Date;
  transcript: SessionTurn[];
}

export async function startSession(userId: string, sessionId: string) {
  const db = await connectMongo();

  const session: SessionRecord = {
    user_id: userId,
    session_id: sessionId,
    started_at: new Date(),
    transcript: [],
  };

  await db.collection<SessionRecord>('sessions').insertOne(session);

  return session;
}

export async function appendTurn(sessionId: string, role: string, content: string) {
  if (!content.trim()) {
    return;
  }

  const db = await connectMongo();

  await db.collection<SessionRecord>('sessions').updateOne(
    { session_id: sessionId },
    {
      $push: {
        transcript: {
          role,
          content,
          at: new Date(),
        },
      },
    },
  );
}

export async function endSession(sessionId: string) {
  const db = await connectMongo();

  await db
    .collection<SessionRecord>('sessions')
    .updateOne({ session_id: sessionId }, { $set: { ended_at: new Date() } });
}

export async function getSession(sessionId: string) {
  const db = await connectMongo();

  return db.collection<SessionRecord>('sessions').findOne({
    session_id: sessionId,
  });
}

export async function listSessionsForUser(userId: string, limit = 20) {
  const db = await connectMongo();

  return db
    .collection<SessionRecord>('sessions')
    .find({ user_id: userId })
    .sort({ started_at: -1 })
    .limit(limit)
    .toArray();
}
