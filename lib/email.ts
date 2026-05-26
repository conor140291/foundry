import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Foundry <noreply@joinfoundry.io>'

export async function sendApplicationReceived(to: string, name: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: 'Application received — Foundry',
    html: `<p>Hi ${name},</p>
           <p>We've received your application to Foundry. Every application is reviewed manually, usually within 48 hours.</p>
           <p>Strong operators may receive an immediate trial allocation. We'll be in touch.</p>
           <p>— The Foundry team</p>`
  })
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