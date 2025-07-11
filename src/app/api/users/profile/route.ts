// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2';
import User from '@/lib/models/userSchema';
import  connect  from '@/lib/db';
import mongoose from 'mongoose';

//To update user profile, we need to handle the following fields:
export async function PUT(req: NextRequest) {
  try {
    console.log('Starting profile update...');
    await connect();
    console.log('Database connected successfully');

    const formData = await req.formData();
    console.log('Form data received');

    const userId = formData.get('userId') as string; 
    console.log('User ID:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(userId);
    console.log('User found:', !!user);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get text fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const title = formData.get('title') as string;

    console.log('Text fields received:', { firstName, lastName, email, phone, title });

    // Get file
    const file = formData.get('avatar') as File | null;
    console.log('File received:', !!file);

    let avatarUrl = user.avatar;

    if (file && file.size > 0) {
        console.log('Processing file upload...');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
      
        const filename = `avatars/${userId}-${Date.now()}-${file.name}`;
        const mimetype = file.type;
      
        console.log('Uploading to R2...');
        const uploadResult = await uploadFileToR2(buffer, filename, mimetype);
        console.log('R2 upload result:', uploadResult);
        
        if (uploadResult.success && uploadResult.url) {
          avatarUrl = uploadResult.url;
        }
    }

    // Update user
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.title = title || user.title;
    user.avatar = avatarUrl;

    console.log('Saving user updates...');
    await user.save();
    console.log('User updated successfully');

    return NextResponse.json({ success: true, user: user.toJSON() }, { status: 200 });
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

      console.log('Fetching user profile for ID:', id);
  
      const user = await User.findById(id);
  
      if (!user) {
        console.log('User not found for ID:', id);
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }

      const userObj = user.toJSON();
      console.log('User profile found:', { 
        id: userObj._id, 
        firstName: userObj.firstName, 
        lastName: userObj.lastName,
        hasAvatar: !!userObj.avatar,
        avatarUrl: userObj.avatar
      });
  
      return NextResponse.json({ success: true, user: userObj }, { status: 200 });
    } catch (error) {
      console.error('[GET_USER_ERROR]', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  }