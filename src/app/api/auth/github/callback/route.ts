import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * GitHub OAuth Callback Endpoint
 * Handles the callback from GitHub after user authorizes the app
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Verify state to prevent CSRF attacks
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent('Invalid state. Please try again.')}`
    );
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent('No authorization code received')}`
    );
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error);
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent(tokenData.error_description || 'Failed to get access token')}`
      );
    }
    
    const accessToken = tokenData.access_token;
    
    // Fetch user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const githubUser = await userResponse.json();
    
    if (!githubUser.id) {
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent('Failed to fetch GitHub user data')}`
      );
    }
    
    // Fetch user emails (in case primary email is private)
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const emails = await emailsResponse.json();
    const primaryEmail = Array.isArray(emails) 
      ? emails.find((e: any) => e.primary)?.email || emails[0]?.email
      : githubUser.email;
    
    // Find or create user in database
    let user = await db.user.findFirst({
      where: {
        OR: [
          { githubId: String(githubUser.id) },
          { email: primaryEmail || `${githubUser.id}@github` }
        ]
      }
    });
    
    if (user) {
      // Update existing user with GitHub info if not already set
      if (!user.githubId) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            githubId: String(githubUser.id),
            githubUsername: githubUser.login,
            githubAvatar: githubUser.avatar_url,
            avatar: user.avatar || githubUser.avatar_url,
            lastLoginAt: new Date()
          }
        });
      } else {
        // Just update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }
    } else {
      // Create new user from GitHub data
      user = await db.user.create({
        data: {
          githubId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAvatar: githubUser.avatar_url,
          username: githubUser.login,
          email: primaryEmail || `${githubUser.id}@github.placeholder`,
          fullName: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          password: null, // No password for OAuth users
          role: 'viewer',
          isActive: true,
          emailVerified: new Date(), // GitHub emails are verified
          lastLoginAt: new Date()
        }
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.redirect(
        `${appUrl}/?error=${encodeURIComponent('Your account is deactivated')}`
      );
    }
    
    // Generate JWT token
    const token = await new jose.SignJWT({ 
      userId: user.id,
      authProvider: 'github'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .setIssuedAt()
      .sign(JWT_SECRET);
    
    // Create response with redirect to dashboard
    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    
    // Clear the state cookie
    response.cookies.delete('github_oauth_state');
    
    // Set token in cookie (for server-side auth check)
    response.cookies.set('bp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });
    
    // Also set user info cookie for client
    response.cookies.set('bp_user', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar
    }), {
      httpOnly: false, // Accessible by client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    );
  }
}
