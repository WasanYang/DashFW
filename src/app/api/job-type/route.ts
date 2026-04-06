import { NextRequest, NextResponse } from 'next/server';
import {
  getJobTypes,
  createJobType,
  updateJobType,
  deleteJobType,
} from '@/services/jobTypeApi';

export async function GET() {
  const jobTypes = await getJobTypes();
  return NextResponse.json(jobTypes);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const jobType = await createJobType(data);
  return NextResponse.json(jobType);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { _id, ...rest } = data;
  if (!_id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = await updateJobType(_id, rest);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url!);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteJobType(id);
  return NextResponse.json({ _id: id });
}
