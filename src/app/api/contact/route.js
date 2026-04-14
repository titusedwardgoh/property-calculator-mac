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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    const message = String(body.message ?? "").trim();

    const name = `${firstName} ${lastName}`.trim();

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
    if (!message) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return Response.json({ error: "Message is too long." }, { status: 400 });
    }

    const subject = `[PropWiz contact] ${name}`;
    const text = [`Name: ${name}`, `Email: ${email}`, "", message].join("\n");
    const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr />
      <p style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(
        message
      )}</p>
    `;

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
