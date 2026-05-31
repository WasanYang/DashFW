import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('settings').findOne({ key: 'google_tokens' });
    const isConnected = !!(settings && settings.tokens);
    return NextResponse.json({ connected: isConnected });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('settings').deleteOne({ key: 'google_tokens' });
    return NextResponse.json({ message: 'Disconnected Google Calendar successfully' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
