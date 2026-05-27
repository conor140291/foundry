import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Foundry <noreply@joinfoundry.io>'

export async function sendApplicationReceived(to: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'We got your application — Foundry',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#090909;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#090909;padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;">
              
              <!-- Header bar -->
              <tr><td style="background:#10b981;height:4px;font-size:0;">&nbsp;</td></tr>
              
              <!-- Logo -->
              <tr><td style="padding:36px 40px 0;">
                <p style="margin:0;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:0.2em;color:#e2e0db;">FOUNDRY</p>
              </td></tr>
              
              <!-- Body -->
              <tr><td style="padding:32px 40px;">
                <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#e2e0db;line-height:1.2;">We've got your application, ${name.split(' ')[0]}.</h1>
                <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.8;">Thanks for applying to Foundry. We read every single application ourselves — no algorithms, no auto-rejections.</p>
                <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.8;">We'll be in touch within 24 hours. If we think you've got what it takes, you'll hear from us with next steps.</p>
                
                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                  <tr><td style="border-top:1px solid #1e1e1e;font-size:0;">&nbsp;</td></tr>
                </table>
                
                <!-- What happens next -->
                <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#555555;">What happens next</p>
                
                ${['We review your application and ID', 'We score based on thinking, not credentials', 'You hear from us within 24 hours', 'Approved operators receive their first allocation'].map((item, i) => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td width="32" style="font-family:monospace;font-size:11px;color:#333333;vertical-align:top;padding-top:2px;">0${i + 1}</td>
                    <td style="font-size:14px;color:#888888;line-height:1.6;">${item}</td>
                  </tr>
                </table>`).join('')}
                
              </td></tr>
              
              <!-- Footer -->
              <tr><td style="padding:24px 40px;border-top:1px solid #1e1e1e;">
                <p style="margin:0;font-size:12px;color:#444444;">Foundry · <a href="https://joinfoundry.io" style="color:#10b981;text-decoration:none;">joinfoundry.io</a></p>
                <p style="margin:8px 0 0;font-size:11px;color:#333333;">Back yourself. We'll back you too.</p>
              </td></tr>
              
              <!-- Bottom bar -->
              <tr><td style="background:#10b981;height:2px;font-size:0;">&nbsp;</td></tr>
              
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
}

export async function sendApplicationApproved(to: string, name: string, allocation: number) {
  await resend.emails.send({
    from: FROM, to,
    subject: "You're in — Foundry",
    html: `<p>Hi ${name},</p>
           <p>Your application has been approved. Your initial allocation is <strong>€${allocation}</strong>.</p>
           <p>Log in to your dashboard: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard">joinfoundry.io/dashboard</a></p>
           <p>— The Foundry team</p>`
  })
}

export async function sendApplicationRejected(to: string, name: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: 'Foundry application update',
    html: `<p>Hi ${name},</p>
           <p>Thank you for applying to Foundry. On this occasion we're not moving forward with your application.</p>
           <p>You're welcome to reapply in 3 months.</p>
           <p>— The Foundry team</p>`
  })
}

export async function sendNewPlayNotification(adminEmail: string, operatorHandle: string, playTitle: string) {
  await resend.emails.send({
    from: FROM, to: adminEmail,
    subject: `New play logged — @${operatorHandle}`,
    html: `<p>@${operatorHandle} has logged a new play: <strong>${playTitle}</strong></p>
           <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/plays">Review in admin panel →</a></p>`
  })
}

export async function sendNewApplicationAlert(adminEmail: string, applicantName: string) {
  await resend.emails.send({
    from: FROM, to: adminEmail,
    subject: `New application — ${applicantName}`,
    html: `<p>A new application has been submitted by <strong>${applicantName}</strong>.</p>
           <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/applications">Review now →</a></p>`
  })
}