import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors from Google
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/?error=${error}`)
  }

  // Check if we have an authorization code
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  try {
    // Exchange authorization code for tokens from Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info')
      throw new Error('Failed to get user info')
    }

    const userInfo = await userInfoResponse.json()

    // Create Supabase session with the ID token
    const supabase = await createClient()
    
    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.id_token,
    })

    if (signInError) {
      console.error('Supabase sign-in error:', signInError)
      return NextResponse.redirect(`${origin}/?error=supabase_signin_failed`)
    }

    // Successful login - redirect to home page
    return NextResponse.redirect(origin)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${origin}/?error=oauth_failed`)
  }
}