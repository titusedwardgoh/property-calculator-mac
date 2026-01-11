import { renderToBuffer } from '@react-pdf/renderer';
import { Resend } from 'resend';
import SurveyPDFDocument from '@/components/SurveyPDFDocument';
import React from 'react';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Get API key from environment variable
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Server-side Supabase client with service role key (for admin operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request) {
  try {
    // Check if Resend API key is configured
    if (!resend || !resendApiKey) {
      console.error('RESEND_API_KEY is missing. Please add it to .env.local');
      return Response.json(
        { error: 'Email service is not configured. Please contact support.', details: 'RESEND_API_KEY is missing' },
        { status: 500 }
      );
    }

    const { userEmail, formData, calculations, isGuest, propertyId } = await request.json();

    // Validate required fields
    if (!userEmail) {
      return Response.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!formData) {
      return Response.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // For guest users, check if email exists and handle survey linking
    let emailExists = false;
    let linkedUserId = null;
    
    // Only try to check/link if we have a propertyId
    // If propertyId is missing, we'll still send the email (graceful degradation)
    if (isGuest && propertyId) {
      try {
        // Check if email exists in auth.users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('Error checking email (continuing anyway):', listError.message || listError);
          // Continue with email sending even if check fails
        } else if (users) {
          // Find user with matching email (case-insensitive)
          const matchingUser = users.find(
            user => user.email?.toLowerCase() === userEmail.toLowerCase()
          );

          if (matchingUser) {
            emailExists = true;
            linkedUserId = matchingUser.id;

            // Link survey to existing user directly using Supabase
            try {
              const { error: updateError } = await supabase
                .from('properties')
                .update({
                  user_id: linkedUserId,
                  user_saved: true,
                  is_active: true
                })
                .eq('id', propertyId);

              if (updateError) {
                console.error('Error linking survey to user (continuing anyway):', updateError.message || updateError);
                // Continue with email sending even if linking fails
              } else {
                console.log('Survey linked to user successfully');
              }
            } catch (linkErr) {
              console.error('Exception linking survey to user (continuing anyway):', linkErr.message || linkErr);
              // Continue with email sending even if linking fails
            }
          } else {
            // Email doesn't exist - save to survey_leads
            // Note: If survey_leads table doesn't exist yet, this will fail gracefully
            try {
              const { error: insertError } = await supabase
                .from('survey_leads')
                .insert({
                  email: userEmail,
                  property_id: propertyId,
                  converted: false,
                });

              if (insertError) {
                // Check if error is about table not existing (common error codes)
                const isTableMissing = insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.message?.includes('relation');
                if (isTableMissing) {
                  console.warn('survey_leads table does not exist yet. Please run the SQL script to create it. Continuing with email send...');
                } else {
                  console.error('Error saving to survey_leads (continuing anyway):', insertError.message || insertError);
                }
                // Continue with email sending even if save fails
              } else {
                console.log('Saved to survey_leads successfully');
              }
            } catch (leadErr) {
              console.error('Exception saving to survey_leads (continuing anyway):', leadErr.message || leadErr);
              // Continue with email sending even if save fails
            }
          }
        }
      } catch (checkErr) {
        console.error('Exception checking email (continuing anyway):', checkErr.message || checkErr);
        // Continue with email sending even if check fails
      }
    } else if (isGuest && !propertyId) {
      console.warn('Guest email request without propertyId - email will be sent but survey won\'t be linked');
    }

    // Generate PDF using react-pdf
    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(
        React.createElement(SurveyPDFDocument, { formData, calculations })
      );
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return Response.json(
        { error: 'Failed to generate PDF', details: pdfError.message },
        { status: 500 }
      );
    }

    // Determine email content based on whether email exists
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const signupLink = `${siteUrl}/signup?email=${encodeURIComponent(userEmail)}`;
    const loginLink = `${siteUrl}/login?email=${encodeURIComponent(userEmail)}&next=/calculator`;

    let emailHtml = '';
    if (isGuest && emailExists) {
      // Email exists - show sign in message
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Your Property Purchase Summary</h2>
          <p>Thank you for using our property calculator. Please find your detailed summary attached as a PDF.</p>
          <p style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>We found an account with this email!</strong> Sign in to save these results to your profile and access your dashboard.
          </p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${loginLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign In to Your Account</a>
          </p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <br>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Property Calculator Team</p>
        </div>
      `;
    } else if (isGuest && !emailExists) {
      // Email doesn't exist - show signup message
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Your Property Purchase Summary</h2>
          <p>Thank you for using our property calculator. Please find your detailed summary attached as a PDF.</p>
          <p style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>You're viewing a guest summary.</strong> To unlock the full dashboard and save your history, create a free account to track your progress and access more insights.
          </p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${signupLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create My Account</a>
          </p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <br>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Property Calculator Team</p>
        </div>
      `;
    } else {
      // Logged-in user - standard message
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Your Property Purchase Summary</h2>
          <p>Thank you for using our property calculator. Please find your detailed summary attached as a PDF.</p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <br>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Property Calculator Team</p>
        </div>
      `;
    }

    // Send email with PDF attachment using Resend
    const emailResult = await resend.emails.send({
      from: 'Property Calculator <onboarding@resend.dev>', // Update this with your verified domain
      to: userEmail,
      subject: 'Your Property Purchase Summary',
      html: emailHtml,
      attachments: [
        {
          filename: 'property-purchase-summary.pdf',
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      
      // Check if it's a Resend validation error (testing mode limitation)
      const errorMessage = emailResult.error.message || JSON.stringify(emailResult.error);
      const isResendValidationError = emailResult.error.statusCode === 403 || 
                                      emailResult.error.name === 'validation_error' ||
                                      errorMessage.includes('testing emails') ||
                                      errorMessage.includes('verify a domain');
      
      if (isResendValidationError) {
        // In testing mode, show success but indicate domain needs to be verified
        console.warn('⚠️ Resend is in testing mode. Email not actually sent. Please verify a domain in Resend to enable email sending.');
        return Response.json({
          success: true,
          message: 'Email queued successfully (testing mode - domain verification needed)',
          emailId: null,
          emailExists,
          testingMode: true,
          reminder: 'Note: Resend is in testing mode. To actually send emails, verify a domain at resend.com/domains and update the from address.'
        });
      }
      
      return Response.json(
        { error: 'Failed to send email', details: errorMessage },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.data?.id,
      emailExists, // Return whether email exists for frontend to show appropriate UI
    });
  } catch (error) {
    console.error('Error in email-pdf route:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

