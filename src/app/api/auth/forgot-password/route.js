import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Construct the redirect URL using the request URL to ensure it works in production
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    // Use callback route pattern for better session handling
    const redirectTo = `${origin}/api/auth/callback?next=/reset-password&type=recovery`

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      // Don't reveal if email exists or not for security reasons
      // Always return success to prevent email enumeration
      console.error('Password reset error:', error)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    })
  }
}

