import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ContactMessage from '@/lib/models/contactMessageSchema';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { name, email, subject, message } = parsed.data;
    // Sanitize (basic)
    const sanitized = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    };
    const newMessage = await ContactMessage.create({ ...sanitized });
    return NextResponse.json({ message: 'Message sent successfully', data: { id: newMessage._id } }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
} 