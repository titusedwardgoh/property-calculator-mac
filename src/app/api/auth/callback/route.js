import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a password reset flow
      // Supabase might not preserve the type parameter, so we check the session or next parameter
      const isRecovery = type === 'recovery' || next === '/reset-password'
      
      if (isRecovery) {
        const response = NextResponse.redirect(new URL('/reset-password?code=' + code, request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      }
      
      const response = NextResponse.redirect(new URL(next, request.url))
      // Force a refresh to update auth state
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
      return response
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=Could not authenticate', request.url))
}

