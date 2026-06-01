import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/lib/types';

// CREATE
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data: Company = await request.json();
    const { _id, ...companyData } = data;

    const result = await db.collection('companies').insertOne(companyData);
    return NextResponse.json(
      { message: 'Company created', id: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create company', details: (error as Error).message },
      { status: 500 },
    );
  }
}

// READ (list all)
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const companies = await db.collection('companies').find().toArray();
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: (error as Error).message },
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
      .collection('companies')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
    return NextResponse.json({
      message: 'Company updated',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update company', details: (error as Error).message },
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
      .collection('companies')
      .deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({
      message: 'Company deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete company', details: (error as Error).message },
      { status: 500 },
    );
  }
}
