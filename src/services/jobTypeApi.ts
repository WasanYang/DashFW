import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongodb';

export type JobType = {
  _id?: string;
  name: string;
  description?: string;
};

const COLLECTION = 'job_types';

export async function getJobTypes() {
  const { db } = await connectToDatabase();
  return db.collection(COLLECTION).find().toArray();
}

export async function createJobType(jobType: Omit<JobType, '_id'>) {
  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTION).insertOne(jobType);
  return { ...jobType, _id: result.insertedId };
}

export async function updateJobType(id: string, jobType: Partial<JobType>) {
  const { db } = await connectToDatabase();
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: jobType });
  return { _id: id, ...jobType };
}

export async function deleteJobType(id: string) {
  const { db } = await connectToDatabase();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { _id: id };
}
