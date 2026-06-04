/**
 * Wraps plain-text or HTML email body in properly formatted HTML.
 * The signature is added here to ensure all emails have it by default.
 */
export function formatEmailHTML(body: string, senderName: string = "The Example Team"): string {
  if (!body) return "";
  
  let innerHtml = body.trim();
  
  // Normalize newlines to \n
  innerHtml = innerHtml.replace(/\r\n/g, "\n");

  // Basic check if it's already HTML (e.g. from Rich Text Editor)
  const isHtml = /<[a-z][\s\S]*>/i.test(innerHtml) || innerHtml.includes('</p>');

  if (!isHtml) {
    innerHtml = innerHtml
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p style="margin:0 0 16px 0; line-height:1.6; color:#374151;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const signatureHtml = `
    <div style="margin-top:32px; padding-top:20px; border-top:1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin:0 0 20px 0; color:#374151; font-size:15px;">Best regards,<br><strong>${senderName}</strong></p>
      <table border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="vertical-align: top; padding-right: 12px;">
            <div style="width: 3px; height: 40px; background-color: #000000; border-radius: 2px;"></div>
          </td>
          <td>
            <p style="margin:0; font-weight:700; font-size:15px; color:#111827; letter-spacing:-0.01em;">GTM Team</p>
            <p style="margin:2px 0 0 0; font-size:13px; font-weight:500; color:#6b7280;">Example Labs</p>
          </td>
        </tr>
      </table>
      <div style="margin-top:12px; font-size:12px; color:#9ca3af;">
        <p style="margin:0;">
          <a href="mailto:hello@Examplelabs.com" style="color:#2563eb; text-decoration:none; font-weight:500;">hello@Examplelabs.com</a>
          <span style="margin:0 8px; color:#e5e7eb;">|</span>
          <span>+91 98765 43210</span>
        </p>
      </div>
    </div>`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; color:#1f2937; max-width:600px; margin:0; line-height:1.6; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
    ${innerHtml}
    ${signatureHtml}
  </div>`;
}
