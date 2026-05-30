import { NextRequest, NextResponse } from 'next/server';
import {
  getSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from '@/services/snippetApi';

export async function GET() {
  try {
    const snippets = await getSnippets();
    return NextResponse.json(snippets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch snippets', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const snippet = await createSnippet(data);
    return NextResponse.json(snippet);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create snippet', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, _id, ...rest } = data;
    const targetId = id || _id;
    if (!targetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updated = await updateSnippet(targetId, rest);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update snippet', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteSnippet(id);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete snippet', details: (error as Error).message },
      { status: 500 },
    );
  }
}
