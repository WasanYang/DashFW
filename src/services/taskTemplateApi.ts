import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongodb';

const COLLECTION = 'task_templates';

export async function getTaskTemplates() {
  const { db } = await connectToDatabase();
  return db.collection(COLLECTION).find().toArray();
}

export async function createTaskTemplate(template: any) {
  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTION).insertOne(template);
  return { ...template, _id: result.insertedId };
}

export async function updateTaskTemplate(id: string, template: any) {
  const { db } = await connectToDatabase();
  const { _id, ...rest } = template;
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: rest });
  return { _id: id, ...rest };
}

export async function deleteTaskTemplate(id: string) {
  const { db } = await connectToDatabase();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { _id: id };
}
