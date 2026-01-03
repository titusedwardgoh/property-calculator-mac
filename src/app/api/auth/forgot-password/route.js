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

    // Get the origin URL for the redirect
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${origin}/reset-password`

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

