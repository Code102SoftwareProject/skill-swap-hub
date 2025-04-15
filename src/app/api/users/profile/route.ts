// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2';
import User from '@/lib/models/userSchema';
import  connect  from '@/lib/db';
import mongoose from 'mongoose';

//To update user profile, we need to handle the following fields:
export async function PUT(req: NextRequest) {
  await connect();

  try {
    const formData = await req.formData();

    const userId = formData.get('userId') as string;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get text fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const title = formData.get('title') as string;

    // Get file
    const file = formData.get('avatar') as File | null;

    let avatarUrl = user.avatar;

    if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
      
        const filename = `avatars/${userId}-${Date.now()}-${file.name}`;
        const mimetype = file.type;
      
        const uploadResult = await uploadFileToR2(buffer, filename, mimetype);
        if (uploadResult.success && uploadResult.url) {
          avatarUrl = uploadResult.url;
        }
      }

    // Update user
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.title = title;
    user.avatar = avatarUrl;

    await user.save();

    return NextResponse.json({ success: true, user: user.toJSON() }, { status: 200 });
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// To get user profile, we need to handle the following fields:
export async function GET(req: NextRequest) {
    try {
      await connect();
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id'); // ✅ gets user id from URL
  
      if (!id) {
        return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
      }
  
      const user = await User.findById(id);
  
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, user }, { status: 200 });
    } catch (error) {
      console.error('[GET_USER_ERROR]', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  }