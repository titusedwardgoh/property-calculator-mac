import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** Inbox for contact form (override with CONTACT_INBOX_EMAIL in env). */
const CONTACT_TO =
  process.env.CONTACT_INBOX_EMAIL?.trim() || "titus.edward.goh@gmail.com";

const FROM =
  process.env.RESEND_FROM?.trim() || "PropWiz <onboarding@resend.dev>";

const MAX_MESSAGE = 8000;
const MAX_NAME_PART = 80;

const CATEGORY_LABELS = {
  technical: "Technical Issue",
  calculation: "Calculation Query",
  feedback: "General Feedback",
  feature: "Feature Request",
  privacy: "Privacy or Data Enquiry",
  terms: "Terms of Service",
  partnership: "Partnership or Press",
  other: "Other",
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCategoryLabel(value) {
  return CATEGORY_LABELS[value] ?? null;
}

function buildContactEmail({ name, email, categoryLabel, message }) {
  const subject = `[PropWiz contact] ${categoryLabel} — ${name}`;

  const text = [
    "New message from the PropWiz contact form",
    "",
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Category: ${categoryLabel}`,
    "",
    "Message:",
    "--------",
    message,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PropWiz contact</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
          <tr>
            <td style="background-color:#E29578;padding:20px 24px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">PropWiz contact form</p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">New enquiry received</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#374151;">
                <tr>
                  <td style="padding:8px 0;width:100px;vertical-align:top;color:#6b7280;font-weight:500;">Name</td>
                  <td style="padding:8px 0;vertical-align:top;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;color:#6b7280;font-weight:500;">Email</td>
                  <td style="padding:8px 0;vertical-align:top;">
                    <a href="mailto:${escapeHtml(email)}" style="color:#E29578;text-decoration:none;">${escapeHtml(email)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;color:#6b7280;font-weight:500;">Category</td>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="display:inline-block;background-color:#fdf4f1;color:#9a3412;font-size:13px;font-weight:500;padding:4px 10px;border-radius:9999px;">${escapeHtml(categoryLabel)}</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e7e5e4;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Message</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${escapeHtml(message)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:#fafaf9;border-top:1px solid #e7e5e4;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject, text, html };
}

export async function POST(request) {
  try {
    if (!resend || !resendApiKey) {
      return Response.json(
        { error: "Email is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const category = String(body.category ?? "").trim();
    const message = String(body.message ?? "").trim();

    const name = `${firstName} ${lastName}`.trim();
    const categoryLabel = getCategoryLabel(category);

    if (!firstName || !lastName) {
      return Response.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }
    if (firstName.length > MAX_NAME_PART || lastName.length > MAX_NAME_PART) {
      return Response.json({ error: "Name is too long." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }
    if (!category || !categoryLabel) {
      return Response.json(
        { error: "Please select a valid category." },
        { status: 400 }
      );
    }
    if (!message) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return Response.json({ error: "Message is too long." }, { status: 400 });
    }

    const { subject, text, html } = buildContactEmail({
      name,
      email,
      categoryLabel,
      message,
    });

    const emailResult = await resend.emails.send({
      from: FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject,
      text,
      html,
    });

    if (emailResult.error) {
      console.error("Resend contact error:", emailResult.error);
      return Response.json(
        { error: "Could not send your message. Please try again later." },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, id: emailResult.data?.id ?? null });
  } catch (e) {
    console.error("Contact POST error:", e);
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
