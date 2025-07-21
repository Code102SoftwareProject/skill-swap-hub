import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ContactMessage from '@/lib/models/contactMessageSchema';
import { z } from 'zod';
// import { requireAdmin } from '@/lib/middleware/adminAuth'; // Uncomment if you have admin auth middleware

const updateSchema = z.object({
  id: z.string(),
  action: z.enum(['read', 'unread', 'archive']),
});

export async function GET() {
  await connect();
  // await requireAdmin(); // Uncomment if you have admin auth
  try {
    const messages = await ContactMessage.find({})
      .sort({ submittedAt: -1 })
      .lean();
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch messages', details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  await connect();
  // await requireAdmin(); // Uncomment if you have admin auth
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { id, action } = parsed.data;
    const status = action === 'archive' ? 'archived' : action;
    const updated = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Status updated', data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update message', details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await connect();
  // await requireAdmin(); // Uncomment if you have admin auth
  try {
    const { id } = await req.json();
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Message deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete message', details: err.message }, { status: 500 });
  }
} 