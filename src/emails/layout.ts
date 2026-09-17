const FONT_STACK = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes dynamic values (names, emails, links) before they go into the HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/**
 * Shared table-based shell for every transactional email — logo row, white
 * card, address footer — copied from the ready-to-send markup in
 * docs/design/handoff/.../emails/*.html (dark-mode media query, MSO
 * fallbacks and all) and parametrized per email.
 */
export function emailLayout({
  title,
  preheader,
  cardHtml,
  footerNote,
}: {
  title: string;
  preheader: string;
  cardHtml: string;
  footerNote: string;
}): string {
  return `<!DOCTYPE html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${title}</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, a, p, span { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style type="text/css">
  @media only screen and (max-width: 600px) {
    .wrap { width: 100% !important; }
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .btn a { display: block !important; }
  }
  @media (prefers-color-scheme: dark) {
    .page { background-color: #1c1c1a !important; }
    .card { background-color: #26261f !important; }
    .ink { color: #f0f0ea !important; }
    .muted { color: #b9b9b0 !important; }
    .soft { background-color: #2f2f28 !important; color: #c9c9c0 !important; }
    .line { border-color: #3a3a33 !important; }
  }
</style>
</head>
<body class="page" style="margin:0; padding:0; background-color:#eeeeea; -webkit-text-size-adjust:100%;">
<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;">${preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="page" style="background-color:#eeeeea;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px; max-width:600px;">
        <tr>
          <td class="pad" style="padding:0 8px 14px 8px; font-family:${FONT_STACK}; font-size:14px; line-height:20px; mso-line-height-rule:exactly; color:#5f5f58;">
            <span class="muted" style="color:#5f5f58; font-weight:bold; letter-spacing:0.04em;">STUDIO</span>
          </td>
        </tr>
        <tr>
          <td class="card line" style="background-color:#fdfdfb; border:1px solid #e3e3e0; border-radius:12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td class="pad" style="padding:28px 32px;">${cardHtml}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:16px 8px 0 8px; font-family:${FONT_STACK}; font-size:12px; line-height:19px; mso-line-height-rule:exactly; color:#5f5f58;">
            <span class="muted" style="color:#5f5f58;">Studio · Sint-Pietersnieuwstraat 14, 9000 Gent · 09 225 44 18<br>
            ${footerNote}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin:4px 0 16px 0;">
  <tr>
    <td bgcolor="#0d3b33" style="border-radius:10px;" align="center">
      <a href="${href}" style="display:inline-block; padding:14px 26px; font-family:${FONT_STACK}; font-size:15px; line-height:20px; mso-line-height-rule:exactly; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function emailSoftBox(html: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:2px 0 0 0;">
  <tr><td class="soft muted" style="background-color:#f6f6f2; border-radius:10px; padding:14px 16px; font-family:${FONT_STACK}; font-size:13px; line-height:20px; mso-line-height-rule:exactly; color:#5f5f58;">${html}</td></tr>
</table>`;
}

export function emailDataRows(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      ({ label, value }) => `<tr>
    <td class="muted line" width="150" style="width:150px; padding:9px 12px 9px 0; border-bottom:1px solid #e3e3e0; font-family:${FONT_STACK}; font-size:13px; line-height:19px; mso-line-height-rule:exactly; color:#5f5f58; vertical-align:top;">${label}</td>
    <td class="ink line" style="padding:9px 0; border-bottom:1px solid #e3e3e0; font-family:${FONT_STACK}; font-size:14px; line-height:20px; mso-line-height-rule:exactly; color:#1a1a18; font-weight:bold; vertical-align:top;">${value}</td>
  </tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 18px 0;">${cells}</table>`;
}

export const emailStyles = {
  eyebrow: `margin:0 0 10px 0; font-family:${FONT_STACK}; font-size:13px; line-height:20px; mso-line-height-rule:exactly; color:#5f5f58;`,
  title: `margin:0 0 12px 0; font-family:${FONT_STACK}; font-size:23px; line-height:30px; mso-line-height-rule:exactly; color:#1a1a18; font-weight:bold; letter-spacing:-0.01em;`,
  body: `margin:0 0 14px 0; font-family:${FONT_STACK}; font-size:15px; line-height:24px; mso-line-height-rule:exactly; color:#1a1a18;`,
  hint: `margin:0 0 16px 0; font-family:${FONT_STACK}; font-size:13px; line-height:20px; mso-line-height-rule:exactly; color:#5f5f58;`,
};
