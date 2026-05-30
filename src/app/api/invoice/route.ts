import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Invoice } from '@/lib/types';

// GET all invoices
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const invoices = await db.collection('invoices').find().sort({ issueDate: -1 }).toArray();
    
    // Fetch clients to map client info
    const clients = await db.collection('clients').find().toArray();
    const clientMap = new Map(clients.map((c: any) => [c._id.toString(), { ...c, id: c._id.toString(), _id: undefined }]));
    
    const mapped = invoices.map((inv: any) => {
      const clientId = inv.clientId?.toString();
      const client = clientId ? clientMap.get(clientId) : undefined;
      return {
        ...inv,
        id: inv._id.toString(),
        _id: undefined,
        client: client || null
      };
    });
    
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create invoice
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Invoice = await request.json();
    const { id, _id, ...invoiceData } = data;
    
    const result = await db.collection('invoices').insertOne(invoiceData);
    return NextResponse.json(
      { message: 'Invoice created', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT update invoice
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id, _id, ...updateData } = await request.json();
    const invoiceId = id || _id;
    if (!invoiceId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const result = await db
      .collection('invoices')
      .updateOne({ _id: new ObjectId(invoiceId) }, { $set: updateData });
      
    return NextResponse.json({
      message: 'Invoice updated',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    const result = await db.collection('invoices').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      message: 'Invoice deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: (error as Error).message },
      { status: 500 }
    );
  }
}
