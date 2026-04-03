import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    const result = await db.collection('tasks').insertOne(data);
    return NextResponse.json(
      { message: 'Task created', id: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task', details: (error as Error).message },
      { status: 500 },
    );
  }
}
