import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Project } from '@/lib/types';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/google-calendar';

// CREATE Project
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Project = await request.json();
    // Remove id if present
    const { id, ...projectData } = data;
    // Ensure jobTypeId is string or undefined
    if (projectData.jobTypeId === '') delete projectData.jobTypeId;
    
    // Insert project first
    const result = await db.collection('projects').insertOne(projectData);
    const projectId = result.insertedId;

    // Create Google Calendar event if deadline is provided
    if (projectData.deadline) {
      const googleEventId = await createCalendarEvent({
        title: projectData.title,
        deadline: projectData.deadline,
      });

      if (googleEventId) {
        await db.collection('projects').updateOne(
          { _id: projectId },
          { $set: { googleEventId } }
        );
      }
    }

    return NextResponse.json(
      { message: 'Project created', id: projectId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// READ (list all)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const projects = await db.collection('projects').find().toArray();
    // Fetch all clients and build a map for quick lookup
    const clientsArr = await db.collection('clients').find().toArray();
    const clientMap = new Map(
      clientsArr.map((c: any) => [
        c._id?.toString(),
        { ...c, id: c._id?.toString(), _id: undefined },
      ]),
    );
    // Map _id to id, convert deadline, and attach client info
    const mapped = projects.map((p: any) => {
      const clientId = p.clientId?.toString();
      const client = clientId ? clientMap.get(clientId) : undefined;
      return {
        ...p,
        id: p._id?.toString(),
        _id: undefined,
        deadline: p.deadline ? new Date(p.deadline) : undefined,
        client: client || null,
        jobTypeId: p.jobTypeId ? p.jobTypeId.toString() : undefined,
      };
    });
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: (error as Error).message },
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

    // Fetch existing project to see Google Calendar Event ID
    const existingProject = await db.collection('projects').findOne({ _id: new ObjectId(id) });
    
    if (existingProject) {
      const updatedTitle = updateData.title || existingProject.title;
      const updatedDeadline = updateData.deadline || existingProject.deadline;

      if (updatedDeadline) {
        if (existingProject.googleEventId) {
          // Update event on Google Calendar
          await updateCalendarEvent(existingProject.googleEventId, {
            title: updatedTitle,
            deadline: updatedDeadline,
          });
        } else {
          // If no previous event ID (e.g. connected later), create one now!
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
      .collection('projects')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({
      message: 'Project updated',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project', details: (error as Error).message },
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

    // Fetch project to delete its Google Calendar Event
    const existingProject = await db.collection('projects').findOne({ _id: new ObjectId(id) });
    if (existingProject && existingProject.googleEventId) {
      await deleteCalendarEvent(existingProject.googleEventId);
    }

    const result = await db
      .collection('projects')
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: 'Project deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete project', details: (error as Error).message },
      { status: 500 },
    );
  }
}
