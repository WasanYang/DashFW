import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongodb';
import type { Snippet } from '@/lib/types';

const COLLECTION = 'snippets';

export async function getSnippets() {
  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTION).find().toArray();
  return result.map(s => ({
    ...s,
    id: s._id.toString(),
    _id: s._id.toString()
  }));
}

export async function createSnippet(snippet: Omit<Snippet, 'id' | '_id'>) {
  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTION).insertOne(snippet);
  return { ...snippet, id: result.insertedId.toString(), _id: result.insertedId.toString() };
}

export async function updateSnippet(id: string, snippet: Partial<Snippet>) {
  const { db } = await connectToDatabase();
  const { id: _, _id: __, ...updateData } = snippet;
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  return { id, _id: id, ...updateData };
}

export async function deleteSnippet(id: string) {
  const { db } = await connectToDatabase();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { id, _id: id };
}
