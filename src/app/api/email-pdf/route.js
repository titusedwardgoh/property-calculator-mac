import { renderToBuffer } from '@react-pdf/renderer';
import { Resend } from 'resend';
import SurveyPDFDocument from '@/components/SurveyPDFDocument';
import React from 'react';

// Get API key from environment variable
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    const { userEmail, formData, calculations } = await request.json();

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

    // Send email with PDF attachment using Resend
    const emailResult = await resend.emails.send({
      from: 'Property Calculator <onboarding@resend.dev>', // Update this with your verified domain
      to: userEmail,
      subject: 'Your Property Purchase Summary',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Your Property Purchase Summary</h2>
          <p>Thank you for using our property calculator. Please find your detailed summary attached as a PDF.</p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <br>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Property Calculator Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'property-purchase-summary.pdf',
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return Response.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.data?.id,
    });
  } catch (error) {
    console.error('Error in email-pdf route:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

