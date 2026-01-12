import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  // Default to login page for email confirmations, dashboard for other flows
  const next = requestUrl.searchParams.get('next') || '/login'
  
  // Check if this is a password reset flow (check before code exchange)
  const isRecovery = type === 'recovery' || next === '/reset-password'
  // Check if this is an email confirmation (not recovery and going to login)
  const isEmailConfirmation = !isRecovery && next === '/login'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a password reset flow
      // Supabase might not preserve the type parameter, so we check the session or next parameter
      
      if (isRecovery) {
        const response = NextResponse.redirect(new URL('/reset-password?code=' + code, request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      }
      
      // If this is an email confirmation, sign out the user after verifying email
      if (isEmailConfirmation) {
        await supabase.auth.signOut()
        const response = NextResponse.redirect(new URL('/login?emailVerified=true', request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      }
      
      const response = NextResponse.redirect(new URL(next, request.url))
      // Force a refresh to update auth state
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      return response
    } else {
      // Code exchange failed - check if this is a password reset flow
      if (isRecovery) {
        // Redirect to forgot password page with error message
        const response = NextResponse.redirect(new URL('/forgot-password?error=expired', request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      }
    }
  }

  // If there's an error or no code, check if it was a recovery flow
  if (isRecovery) {
    // Redirect to forgot password page with error message
    const response = NextResponse.redirect(new URL('/forgot-password?error=expired', request.url))
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=Could not authenticate', request.url))
}

