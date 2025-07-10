import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not defined');
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google credential is required' 
      }, { status: 400 });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid Google token' 
      }, { status: 401 });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

    console.log('Google OAuth payload:', {
      googleId,
      email,
      firstName,
      lastName,
      picture: picture || 'NO PICTURE PROVIDED',
      hasProfilePicture: !!picture
    });

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Required user information not available from Google' 
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (could be existing email/password user)
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.isGoogleUser = true;
        user.avatar = user.avatar || picture;
        
        console.log('Linking Google account - Avatar info:', {
          existingAvatar: user.avatar,
          googlePicture: picture,
          willUseGooglePicture: !user.avatar && !!picture,
          finalAvatar: user.avatar || picture
        });

        // Mark profile as completed for Google users (skip profile completion step)
        user.profileCompleted = true;
        
        console.log('Linking Google to existing user:', {
          email: user.email,
          hasPhone: !!user.phone,
          hasTitle: !!user.title,
          profileCompleted: user.profileCompleted
        });
        
        await user.save();
      } else {
        // Create new user with Google info
        user = new User({
          firstName,
          lastName,
          email,
          googleId,
          isGoogleUser: true,
          avatar: picture,
          profileCompleted: true, // Mark as completed for Google users (skip profile completion step)
          phone: '', // Optional for Google users
          title: '', // Optional for Google users
        });
        
        console.log('Creating new Google user - Avatar info:', {
          googlePicture: picture,
          hasGooglePicture: !!picture,
          savedAvatar: picture || 'NO AVATAR SAVED'
        });
        
        await user.save();
      }
    }

    // Check if user is suspended
    if (user.suspension?.isSuspended) {
      return NextResponse.json({ 
        success: false, 
        message: 'Account suspended' 
      }, { status: 403 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // Mark profile as completed for Google users (skip profile completion step)
    if (!user.profileCompleted) {
      user.profileCompleted = true;
      await user.save();
    }
    
    const needsProfileCompletion = false; // Always false for Google users
    
    console.log('Google login response:', {
      email: user.email,
      profileCompleted: user.profileCompleted,
      hasPhone: !!user.phone,
      hasTitle: !!user.title,
      needsProfileCompletion
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Google authentication successful',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        avatar: user.avatar,
        isGoogleUser: user.isGoogleUser,
        profileCompleted: user.profileCompleted
      },
      needsProfileCompletion
    });

  } catch (error: any) {
    console.error('Google authentication error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Google authentication failed' 
    }, { status: 500 });
  }
}
