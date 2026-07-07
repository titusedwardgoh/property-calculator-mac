function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const AURORA_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 140" width="100%" style="display:block;width:100%;max-width:520px;" aria-hidden="true">
  <defs>
    <radialGradient id="aurora" cx="25%" cy="30%" r="80%" fx="25%" fy="30%">
      <stop offset="0%" stop-color="#d4f5e2"/>
      <stop offset="45%" stop-color="#f2ffe5"/>
      <stop offset="100%" stop-color="#fde8d8"/>
    </radialGradient>
    <radialGradient id="aurora2" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="#fddac8" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#f2ffe5" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="520" height="140" fill="url(#aurora)"/>
  <rect width="520" height="140" fill="url(#aurora2)"/>
  <circle cx="260" cy="38" r="20" fill="#f5d95e"/>
  <rect x="68" y="26" width="52" height="18" rx="9" fill="#ffffff" opacity="0.75"/>
  <rect x="390" y="20" width="42" height="16" rx="8" fill="#ffffff" opacity="0.75"/>
  <ellipse cx="260" cy="170" rx="320" ry="110" fill="#7ec9a3"/>
  <polygon points="90,100 100,78 110,100" fill="#2d6b50"/>
  <rect x="97" y="100" width="6" height="12" fill="#2d6b50"/>
  <polygon points="122,104 130,86 138,104" fill="#2d6b50"/>
  <rect x="127" y="104" width="6" height="10" fill="#2d6b50"/>
  <polygon points="382,100 392,78 402,100" fill="#2d6b50"/>
  <rect x="389" y="100" width="6" height="12" fill="#2d6b50"/>
  <polygon points="410,104 418,86 426,104" fill="#2d6b50"/>
  <rect x="415" y="104" width="6" height="10" fill="#2d6b50"/>
  <ellipse cx="170" cy="180" rx="260" ry="100" fill="#439775"/>
  <ellipse cx="400" cy="185" rx="240" ry="95" fill="#439775"/>
</svg>`;

function buildCtaButton(href, label) {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="#E29578" style="border-radius:9999px;">
      <a href="${href}"
         style="display:inline-block;background-color:#E29578;color:#453F3C;text-decoration:none;padding:12px 32px;border-radius:9999px;font-size:15px;font-weight:600;letter-spacing:0.2px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;mso-padding-alt:12px 32px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function buildNoticeBox(contentHtml, backgroundColor = '#f2ffe5', borderColor = '#d8edd0') {
    return `
<p style="margin:0 0 24px;padding:16px 18px;background-color:${backgroundColor};border:1px solid ${borderColor};border-radius:12px;font-size:14px;color:#453F3C;line-height:1.65;text-align:left;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  ${contentHtml}
</p>`;
}

function buildProppersEmailLayout({ title, heading, bodyHtml, extraHtml = '', siteUrl }) {
    const baseUrl = siteUrl.replace(/\/$/, '');
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light only; }
  body, #__bg {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #fef6e4 !important;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  @media (prefers-color-scheme: dark) {
    body, #__bg       { background-color: #fef6e4 !important; }
    #__card           { background-color: #ffffff !important; }
    #__signoff        { background-color: #ffffff !important; border-top-color: #f5ede6 !important; }
    #__footer         { background-color: #f2ffe5 !important; }
    #__h1             { color: #453F3C !important; }
    #__body-p         { color: #7a726e !important; }
    #__signoff-p      { color: #7a726e !important; }
    #__subtext        { color: #b0a89f !important; }
    .footer-label     { color: #7a726e !important; }
    .icon-circle      { background-color: #ffffff !important; border-color: #e8ddd5 !important; }
  }
  @media only screen and (max-width: 560px) {
    #__outer  { width: 100% !important; }
    #__card   { border-radius: 12px !important; }
    .card-pad { padding: 32px 24px 24px !important; }
    .footer-td { padding: 0 8px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#fef6e4;" bgcolor="#fef6e4">
<table id="__bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fef6e4" style="background-color:#fef6e4;">
<tr><td align="center" style="padding:32px 16px;">
  <table id="__outer" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
    <tr>
      <td align="center" style="padding:0 0 20px;">
        <span style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#E29578;">Prop<span style="color:#439775;">pers</span></span>
      </td>
    </tr>
    <tr>
      <td id="__card" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8ddd5;box-shadow:0 2px 20px rgba(69,63,60,0.10);">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="card-pad" style="padding:44px 40px 32px;text-align:center;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
              <h1 id="__h1" style="margin:0 0 14px;font-size:22px;font-weight:800;color:#453F3C;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">${heading}</h1>
              ${bodyHtml}
              ${extraHtml}
              <p id="__subtext" style="margin:24px 0 0;font-size:13px;color:#b0a89f;line-height:1.6;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
                Your report is attached as a PDF with a full breakdown<br>
                of upfront costs, ongoing costs, grants, and property details.
              </p>
            </td>
          </tr>
          <tr>
            <td id="__signoff" style="padding:20px 40px 28px;border-top:1px solid #f5ede6;text-align:center;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#7a726e;">
              <p id="__signoff-p" style="margin:0;color:#7a726e;font-size:14px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
                Happy calculating,<br>
                <strong style="color:#453F3C;">The Proppers Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              ${AURORA_SVG}
            </td>
          </tr>
          <tr>
            <td id="__footer" bgcolor="#f2ffe5" style="background-color:#f2ffe5;padding:22px 20px;border-top:1px solid #d8edd0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="footer-td" align="center" style="padding:0 12px;text-align:center;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 6px;">
                      <tr>
                        <td class="icon-circle" width="36" height="36" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:50%;border:1px solid #e8ddd5;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">❓</td>
                      </tr>
                    </table>
                    <div class="footer-label" style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#7a726e;line-height:1.4;">
                      Questions?<br>
                      <a href="${baseUrl}/contact" style="color:#439775;text-decoration:underline;">We're here</a>
                    </div>
                  </td>
                  <td class="footer-td" align="center" style="padding:0 12px;text-align:center;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 6px;">
                      <tr>
                        <td class="icon-circle" width="36" height="36" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:50%;border:1px solid #e8ddd5;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">🏠</td>
                      </tr>
                    </table>
                    <div class="footer-label" style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#7a726e;line-height:1.4;">
                      Start your<br>
                      <a href="${baseUrl}/" style="color:#439775;text-decoration:underline;">calculation</a>
                    </div>
                  </td>
                  <td class="footer-td" align="center" style="padding:0 12px;text-align:center;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 6px;">
                      <tr>
                        <td class="icon-circle" width="36" height="36" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:50%;border:1px solid #e8ddd5;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">📋</td>
                      </tr>
                    </table>
                    <div class="footer-label" style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#7a726e;line-height:1.4;">
                      Read the<br>
                      <a href="${baseUrl}/faq" style="color:#439775;text-decoration:underline;">FAQ</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px;text-align:center;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#c0b8b2;line-height:1.7;">
        You requested this report from Proppers. If this wasn't you, you can safely ignore this email.<br>
        © ${year} Proppers. All rights reserved.
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildResultsReportEmail({
    propertyAddress,
    userEmail,
    isGuest,
    emailExists,
    siteUrl = 'https://proppers.com.au',
}) {
    const address = propertyAddress?.trim() || 'your property';
    const safeAddress = escapeHtml(address);
    const baseUrl = siteUrl.replace(/\/$/, '');
    const encodedEmail = encodeURIComponent(userEmail || '');
    const subject = `Your results for ${address} – Proppers`;
    const heading = `Results for ${safeAddress}`;

    const bodyHtml = `
<p id="__body-p" style="margin:0 0 24px;font-size:15px;color:#7a726e;line-height:1.65;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  Thanks for using Proppers. Your property results for<br>
  <strong style="color:#453F3C;">${safeAddress}</strong><br>
  are attached as a PDF report.
</p>`;

    let extraHtml = '';

    if (isGuest && emailExists) {
        extraHtml = `
${buildNoticeBox('<strong>We found an account with this email.</strong> Sign in to save these results to your dashboard and revisit them any time.', '#f2ffe5', '#d8edd0')}
${buildCtaButton(`${baseUrl}/login?email=${encodedEmail}&next=/dashboard`, 'Sign in to your account')}`;
    } else if (isGuest && !emailExists) {
        extraHtml = `
${buildNoticeBox('<strong>You viewed this as a guest.</strong> Create a free Proppers account to save your results, track properties, and access your dashboard.', '#fef6e4', '#e8ddd5')}
${buildCtaButton(`${baseUrl}/signup?email=${encodedEmail}`, 'Create my account')}`;
    } else {
        extraHtml = buildCtaButton(`${baseUrl}/dashboard`, 'View my dashboard');
    }

    const html = buildProppersEmailLayout({
        title: subject,
        heading,
        bodyHtml,
        extraHtml,
        siteUrl: baseUrl,
    });

    return { subject, html };
}
