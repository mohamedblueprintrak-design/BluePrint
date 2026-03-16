import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub OAuth Initiation Endpoint
 * This route redirects the user to GitHub's authorization page
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub OAuth is not configured' } },
      { status: 500 }
    );
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();
  
  // Store state in a cookie for verification
  const redirectUri = `${appUrl}/api/auth/github/callback`;
  
  // GitHub OAuth URL
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', state);
  
  const response = NextResponse.redirect(githubAuthUrl.toString());
  
  // Set state cookie for verification (expires in 10 minutes)
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/'
  });
  
  return response;
}
