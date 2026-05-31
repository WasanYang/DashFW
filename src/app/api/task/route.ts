import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Task } from '@/lib/types';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/google-calendar';

// CREATE Task
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Task = await request.json();
    // Remove id if present
    const { id, ...taskData } = data;
    // Ensure jobTypeId is string or undefined
    if (taskData.jobTypeId === '') delete taskData.jobTypeId;
    
    // Insert task
    const result = await db.collection('tasks').insertOne(taskData);
    const taskId = result.insertedId;

    // Create Google Calendar event if deadline is provided
    if (taskData.deadline) {
      const googleEventId = await createCalendarEvent({
        title: taskData.title,
        deadline: taskData.deadline,
      });

      if (googleEventId) {
        await db.collection('tasks').updateOne(
          { _id: taskId },
          { $set: { googleEventId } }
        );
      }
    }

    return NextResponse.json(
      { message: 'Task created', id: taskId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// READ (list all tasks)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const tasks = await db.collection('tasks').find().toArray();
    
    // Fetch all clients and projects
    const clientsArr = await db.collection('clients').find().toArray();
    const projectsArr = await db.collection('projects').find().toArray();

    const clientMap = new Map(
      clientsArr.map((c: any) => [
        c._id?.toString(),
        { ...c, id: c._id?.toString(), _id: undefined },
      ]),
    );

    const projectMap = new Map(
      projectsArr.map((p: any) => [
        p._id?.toString(),
        p.title,
      ]),
    );

    // Map _id to id, convert deadline, and attach client & project info
    const mapped = tasks.map((t: any) => {
      const clientId = t.clientId?.toString();
      const client = clientId ? clientMap.get(clientId) : undefined;
      
      const projectId = t.projectId?.toString();
      const projectTitle = projectId ? projectMap.get(projectId) : undefined;

      return {
        ...t,
        id: t._id?.toString(),
        _id: undefined,
        deadline: t.deadline ? new Date(t.deadline) : undefined,
        client: client || null,
        projectTitle: projectTitle || 'General Project',
        jobTypeId: t.jobTypeId ? t.jobTypeId.toString() : undefined,
      };
    });
    
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// UPDATE (by id)
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updateData } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    // Remove id from updateData
    delete updateData.id;
    if (updateData.jobTypeId === '') delete updateData.jobTypeId;

    // Fetch existing task to see Google Calendar Event ID
    const existingTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    
    if (existingTask) {
      const updatedTitle = updateData.title || existingTask.title;
      const updatedDeadline = updateData.deadline || existingTask.deadline;

      if (updatedDeadline) {
        if (existingTask.googleEventId) {
          // Update event on Google Calendar
          await updateCalendarEvent(existingTask.googleEventId, {
            title: updatedTitle,
            deadline: updatedDeadline,
          });
        } else {
          // If no previous event ID, create one
          const newEventId = await createCalendarEvent({
            title: updatedTitle,
            deadline: updatedDeadline,
          });
          if (newEventId) {
            updateData.googleEventId = newEventId;
          }
        }
      }
    }

    const result = await db
      .collection('tasks')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({
      message: 'Task updated',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE (by id)
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Fetch task to delete its Google Calendar Event
    const existingTask = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
    if (existingTask && existingTask.googleEventId) {
      await deleteCalendarEvent(existingTask.googleEventId);
    }

    const result = await db
      .collection('tasks')
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: 'Task deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete task', details: (error as Error).message },
      { status: 500 },
    );
  }
}
