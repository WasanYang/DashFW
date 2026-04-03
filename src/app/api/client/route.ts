import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Client } from '@/lib/types';

// CREATE
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Client = await request.json();
    const result = await db.collection('clients').insertOne(data);
    return NextResponse.json(
      { message: 'Client created', id: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create client', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// READ (list all)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const clients = await db.collection('clients').find().toArray();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// UPDATE (by _id)
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { _id, ...updateData } = await request.json();
    if (!_id)
      return NextResponse.json({ error: 'Missing _id' }, { status: 400 });
    const { ObjectId } = require('mongodb');
    const result = await db
      .collection('clients')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
    return NextResponse.json({
      message: 'Client updated',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update client', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// DELETE (by _id)
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { _id } = await request.json();
    if (!_id)
      return NextResponse.json({ error: 'Missing _id' }, { status: 400 });
    const { ObjectId } = require('mongodb');
    const result = await db
      .collection('clients')
      .deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({
      message: 'Client deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete client', details: (error as Error).message },
      { status: 500 },
    );
  }
}
