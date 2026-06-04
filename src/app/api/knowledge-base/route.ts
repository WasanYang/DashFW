import { NextRequest, NextResponse } from 'next/server';
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '@/services/knowledgeBaseApi';

export async function GET() {
  try {
    const articles = await getArticles();
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base articles', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const article = await createArticle(data);
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create knowledge base article', details: (error as Error).message },
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
    const updated = await updateArticle(targetId, rest);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update knowledge base article', details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteArticle(id);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete knowledge base article', details: (error as Error).message },
      { status: 500 },
    );
  }
}
