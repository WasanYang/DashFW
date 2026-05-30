import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Proposal } from '@/lib/types';

// GET all proposals
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const proposals = await db.collection('proposals').find().sort({ issueDate: -1 }).toArray();
    
    // Fetch clients to map client info
    const clients = await db.collection('clients').find().toArray();
    const clientMap = new Map(clients.map((c: any) => [c._id.toString(), { ...c, id: c._id.toString(), _id: undefined }]));
    
    const mapped = proposals.map((prop: any) => {
      const clientId = prop.clientId?.toString();
      const client = clientId ? clientMap.get(clientId) : undefined;
      return {
        ...prop,
        id: prop._id.toString(),
        _id: undefined,
        client: client || null
      };
    });
    
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch proposals', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create proposal
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Proposal = await request.json();
    const { id, _id, ...proposalData } = data;
    
    const result = await db.collection('proposals').insertOne(proposalData);
    return NextResponse.json(
      { message: 'Proposal created', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create proposal', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT update proposal
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id, _id, ...updateData } = await request.json();
    const proposalId = id || _id;
    if (!proposalId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const result = await db
      .collection('proposals')
      .updateOne({ _id: new ObjectId(proposalId) }, { $set: updateData });
      
    return NextResponse.json({
      message: 'Proposal updated',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update proposal', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE proposal
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const result = await db.collection('proposals').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      message: 'Proposal deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete proposal', details: (error as Error).message },
      { status: 500 }
    );
  }
}
