import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await connect();
    const { userId } = await params;
    const suggestions = await Suggestion.find({ userId, isHidden: { $ne: true } }).sort({ date: -1 });
    const csvRows = [
      'Title,Description,Category,Status,Date',
      ...suggestions.map(s =>
        `"${(s.title || '').replace(/"/g, '""')}","${(s.description || '').replace(/"/g, '""')}","${s.category}","${s.status}","${s.date.toISOString()}"`
      )
    ];
    const csv = csvRows.join('\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=suggestions-${userId}.csv`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export suggestions', details: (error as Error).message }, { status: 500 });
  }
} 