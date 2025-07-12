import { NextResponse } from "next/server";
import fetch from "node-fetch";
import base64 from "base-64";

export async function GET() {
  try {
    const zoomClientId = process.env.ZOOM_CLIENT_ID;
    const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
    const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;

    console.log('Testing Zoom credentials...');
    console.log('Client ID:', zoomClientId ? `${zoomClientId.slice(0, 5)}...` : 'Missing');
    console.log('Client Secret:', zoomClientSecret ? 'Present' : 'Missing');
    console.log('Account ID:', zoomAccountId ? `${zoomAccountId.slice(0, 5)}...` : 'Missing');

    if (!zoomClientId || !zoomClientSecret || !zoomAccountId) {
      return NextResponse.json({
        success: false,
        message: "Missing Zoom credentials",
        details: {
          clientId: !!zoomClientId,
          clientSecret: !!zoomClientSecret,
          accountId: !!zoomAccountId
        }
      }, { status: 400 });
    }

    // Test OAuth token generation with correct grant type
    const authHeaders = {
      Authorization: `Basic ${base64.encode(`${zoomClientId}:${zoomClientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    console.log('Requesting access token with client_credentials grant...');
    const response = await fetch(
      'https://zoom.us/oauth/token',
      {
        method: "POST",
        headers: authHeaders,
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          account_id: zoomAccountId
        })
      }
    );

    const responseText = await response.text();
    console.log('Zoom response status:', response.status);
    console.log('Zoom response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: "Failed to get Zoom access token",
        status: response.status,
        error: responseText
      }, { status: 500 });
    }

    const tokenData = JSON.parse(responseText);
    
    // Test API call with the token
    console.log('Testing API call with token...');
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData: any = await userResponse.json();
    console.log('User API response:', userResponse.status);

    return NextResponse.json({
      success: true,
      message: "Zoom credentials are working!",
      tokenGenerated: !!tokenData.access_token,
      apiCallSuccess: userResponse.ok,
      userInfo: userResponse.ok ? {
        email: userData.email,
        accountId: userData.account_id,
        type: userData.type
      } : null,
      error: userResponse.ok ? null : userData
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      message: "Test failed",
      error: error.message
    }, { status: 500 });
  }
}
