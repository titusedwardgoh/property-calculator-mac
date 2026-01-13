import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client for admin operations
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serviceClient = supabaseUrl && supabaseServiceKey
  ? createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const email = requestUrl.searchParams.get('email') // Email from signup redirect URL
  // Default to login page for email confirmations, dashboard for other flows
  const next = requestUrl.searchParams.get('next') || '/login'
  
  // Check if this is a password reset flow (check before code exchange)
  const isRecovery = type === 'recovery' || next === '/reset-password'
  // Check if this is an email confirmation (explicit signup type or login next without recovery type)
  // Prioritize explicit type=signup, then check next parameter
  const isEmailConfirmation = type === 'signup' || (next === '/login' && type !== 'recovery' && !isRecovery)

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
      // Code exchange failed - handle based on flow type
      if (isRecovery) {
        // Redirect to forgot password page with error message
        const response = NextResponse.redirect(new URL('/forgot-password?error=expired', request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      } else if (isEmailConfirmation) {
        // Email confirmation code expired/invalid - try to check if email is already confirmed
        // Note: We can't extract email from expired code, so we'll check if we can get user info
        let emailStatus = 'unknown' // 'confirmed', 'unconfirmed', or 'unknown'
        
        if (serviceClient) {
          try {
            // Check if we have email from URL parameter (included in signup redirect)
            if (email) {
              // Check if this email exists and is confirmed
              const { data: { users } } = await serviceClient.auth.admin.listUsers()
              const matchingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
              if (matchingUser) {
                emailStatus = matchingUser.email_confirmed_at ? 'confirmed' : 'unconfirmed'
              } else {
                emailStatus = 'unconfirmed' // Email doesn't exist in Supabase
              }
            } else if (code) {
              // Try to verify the code - this will likely fail for expired codes
              try {
                const { data: verifyData } = await serviceClient.auth.admin.verifyOtp({
                  type: 'signup',
                  token: code,
                })
                
                if (verifyData?.user) {
                  emailStatus = verifyData.user.email_confirmed_at ? 'confirmed' : 'unconfirmed'
                }
              } catch (verifyErr) {
                // Code is expired/invalid - can't verify, will use 'unknown' status
              }
            }
          } catch (checkErr) {
            console.error('Error checking email confirmation status:', checkErr)
            // Continue with 'unknown' status
          }
        }
        
        // Redirect to login with appropriate error parameter
        const errorParam = emailStatus === 'confirmed' 
          ? 'alreadyConfirmed' 
          : emailStatus === 'unconfirmed'
          ? 'expired'
          : 'expired' // Default to expired if unknown
        
        const response = NextResponse.redirect(new URL(`/login?error=${errorParam}`, request.url))
        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        return response
      }
    }
  }

  // If there's an error or no code, check flow type
  if (isRecovery) {
    // Redirect to forgot password page with error message
    const response = NextResponse.redirect(new URL('/forgot-password?error=expired', request.url))
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  } else if (isEmailConfirmation) {
    // Email confirmation flow but no code - check email status if email is available
    let errorParam = 'expired'
    
    if (email && serviceClient) {
      try {
        const { data: { users } } = await serviceClient.auth.admin.listUsers()
        const matchingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        if (matchingUser) {
          errorParam = matchingUser.email_confirmed_at ? 'alreadyConfirmed' : 'expired'
        } else {
          errorParam = 'expired' // Email doesn't exist
        }
      } catch (checkErr) {
        console.error('Error checking email status:', checkErr)
        // Use default 'expired'
      }
    }
    
    const response = NextResponse.redirect(new URL(`/login?error=${errorParam}`, request.url))
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  // If there's an error or no code and we can't determine flow type, redirect to login
  return NextResponse.redirect(new URL('/login?error=Could not authenticate', request.url))
}

