import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/modals/chatRoomSchema';

export async function GET() {
  await connect();
  //use in any nessary scenarios
}
