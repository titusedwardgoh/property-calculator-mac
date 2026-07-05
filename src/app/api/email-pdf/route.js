import { Resend } from 'resend';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { buildResultsReportEmail } from '@/lib/email/propWizResultsReportEmail';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM = process.env.RESEND_FROM?.trim() || 'Proppers <onboarding@resend.dev>';

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

    const { userEmail, pdfBase64, filename, propertyAddress, isGuest, propertyId } = await request.json();

    // Validate required fields
    if (!userEmail) {
      return Response.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!pdfBase64) {
      return Response.json(
        { error: 'PDF attachment is required' },
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

    let pdfBuffer;
    try {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } catch (pdfError) {
      console.error('PDF decode error:', pdfError);
      return Response.json(
        { error: 'Failed to process PDF attachment', details: pdfError.message },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://property-calculator-mac.vercel.app';
    const { subject, html: emailHtml } = buildResultsReportEmail({
      propertyAddress,
      userEmail,
      isGuest,
      emailExists,
      siteUrl,
    });

    const emailResult = await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: filename || 'property-results-summary.pdf',
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

