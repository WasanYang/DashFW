import { connectToDatabase } from './mongodb';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // timestamp in ms
}

// Get dynamic redirect URI based on origin
export function getRedirectUri(origin: string): string {
  // Clean trailing slash
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${base}/api/auth/google/callback`;
}

// Retrieve valid access token (refreshes if expired)
export async function getValidAccessToken(): Promise<string | null> {
  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth Credentials in env');
    return null;
  }

  const { db } = await connectToDatabase();
  const settings = await db.collection('settings').findOne({ key: 'google_tokens' });
  
  if (!settings || !settings.tokens) {
    return null;
  }

  const tokens = settings.tokens as GoogleTokens;
  const now = Date.now();

  // If token is still valid (with 1-minute buffer), return it
  if (tokens.expiry_date && tokens.expiry_date > now + 60000) {
    return tokens.access_token;
  }

  // Otherwise, refresh the access token
  console.log('Google access token expired. Refreshing...');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Google token:', data);
      return null;
    }

    const newExpiry = Date.now() + (data.expires_in * 1000);
    const updatedTokens: GoogleTokens = {
      access_token: data.access_token,
      refresh_token: tokens.refresh_token, // Keep old refresh token
      expiry_date: newExpiry,
    };

    await db.collection('settings').updateOne(
      { key: 'google_tokens' },
      { $set: { tokens: updatedTokens } }
    );

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

// Create Calendar Event
export async function createCalendarEvent(project: { title: string; deadline: string | Date }): Promise<string | null> {
  const token = await getValidAccessToken();
  if (!token) return null;

  const dateStr = formatGoogleDate(new Date(project.deadline));

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `ส่งงาน: ${project.title}`,
        description: 'บันทึกอัตโนมัติจากระบบติดตามงาน DashFW',
        start: { date: dateStr },
        end: { date: dateStr },
        colorId: '6', // Orange/Tangerine color
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error creating Google Calendar event:', data);
      return null;
    }

    return data.id; // Returns Google Event ID
  } catch (error) {
    console.error('Exception creating calendar event:', error);
    return null;
  }
}

// Update Calendar Event
export async function updateCalendarEvent(eventId: string, project: { title: string; deadline: string | Date }): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  const dateStr = formatGoogleDate(new Date(project.deadline));

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `ส่งงาน: ${project.title}`,
        description: 'บันทึกอัตโนมัติจากระบบติดตามงาน DashFW',
        start: { date: dateStr },
        end: { date: dateStr },
        colorId: '6',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error updating Google Calendar event:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating calendar event:', error);
    return false;
  }
}

// Delete Calendar Event
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 204 || response.status === 404) {
      // 404 means already deleted on Google, which is fine
      return true;
    }

    const data = await response.json();
    console.error('Error deleting Google Calendar event:', data);
    return false;
  } catch (error) {
    console.error('Exception deleting calendar event:', error);
    return false;
  }
}

// Helper to format date as YYYY-MM-DD
function formatGoogleDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
