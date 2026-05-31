import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getRedirectUri, GoogleTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = request.nextUrl.origin;
  const dashboardUrl = `${origin}/dashboard`;

  if (error || !code) {
    console.error('Google Auth callback error:', error);
    return NextResponse.redirect(`${dashboardUrl}?google_calendar=error&details=${error || 'no_code'}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(origin);

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to exchange Google OAuth code:', data);
      return NextResponse.redirect(`${dashboardUrl}?google_calendar=error`);
    }

    const expiryDate = Date.now() + (data.expires_in * 1000);
    const tokens: GoogleTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Guaranteed on first prompt with prompt=consent
      expiry_date: expiryDate,
    };

    // Store in MongoDB settings
    const { db } = await connectToDatabase();
    await db.collection('settings').updateOne(
      { key: 'google_tokens' },
      { $set: { tokens } },
      { upsert: true }
    );

    return NextResponse.redirect(`${dashboardUrl}?google_calendar=success`);
  } catch (err) {
    console.error('Google Auth callback exception:', err);
    return NextResponse.redirect(`${dashboardUrl}?google_calendar=error&details=exception`);
  }
}
