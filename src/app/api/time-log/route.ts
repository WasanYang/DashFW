import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { TimeLog } from '@/lib/types';

// GET all time logs
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const logs = await db.collection('time_logs').find().sort({ startTime: -1 }).toArray();
    
    // Fetch all projects to map project names
    const projects = await db.collection('projects').find().toArray();
    const projectMap = new Map(projects.map((p: any) => [p._id.toString(), p.title]));
    
    const mapped = logs.map((log: any) => ({
      ...log,
      id: log._id.toString(),
      _id: undefined,
      projectTitle: log.projectId ? projectMap.get(log.projectId.toString()) || 'Unknown Project' : undefined
    }));
    
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch time logs', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create time log
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: TimeLog = await request.json();
    const { id, _id, ...logData } = data;
    
    const result = await db.collection('time_logs').insertOne({
      ...logData,
      startTime: new Date(logData.startTime).toISOString(),
      endTime: new Date(logData.endTime).toISOString()
    });
    
    return NextResponse.json(
      { message: 'Time log created', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create time log', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE time log
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const result = await db.collection('time_logs').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      message: 'Time log deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete time log', details: (error as Error).message },
      { status: 500 }
    );
  }
}
