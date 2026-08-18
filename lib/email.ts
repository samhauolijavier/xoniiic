import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendVerificationEmail(email: string, code: string, name?: string) {
  console.log(`[Verification] Code for ${email}: ${code}`)

  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping email send')
    return
  }

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: email,
      subject: 'Verify your Virtual Freaks account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">Virtual Freaks</h1>
          </div>
          <h2 style="color: #1a1a2e; font-size: 22px;">Welcome${name ? `, ${name}` : ''}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">Enter this verification code to activate your account:</p>
          <div style="background: #1a1a2e; color: #fff; padding: 24px; border-radius: 12px; text-align: center; font-size: 36px; letter-spacing: 10px; font-weight: bold; margin: 24px 0;">
            ${code}
          </div>
          <p style="color: #888; font-size: 14px;">This code expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">Virtual Freaks — The modern marketplace for remote talent</p>
        </div>
      `
    })
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error)
  }
}

/**
 * Sent the moment a seat opens.
 *
 * This is the message that closes the silence between "I sent 100 pesos" and
 * "something happened". Without it a learner pays, types a reference, and waits
 * with no idea whether it worked — which is exactly when they stop trusting the
 * next payment.
 *
 * It names the GoHighLevel invite as a SEPARATE email on purpose. GHL sends its
 * own, from its own domain, and someone waiting on one email will not go
 * looking for two.
 */
export async function sendSeatOpenEmail(opts: {
  email: string
  name?: string | null
  expiresAt: Date
  provisioned: boolean
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping seat-open email')
    return
  }

  const until = opts.expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const invite = opts.provisioned
    ? `<p style="color: #4a4740; font-size: 15px; line-height: 1.6;">
         <strong>GoHighLevel will email you separately</strong> with a link to set your password.
         It comes from GoHighLevel, not from us, so check your spam folder if it has not arrived
         within a few minutes.
       </p>`
    : `<p style="color: #4a4740; font-size: 15px; line-height: 1.6;">
         We are setting up your login now and will email it to you shortly.
       </p>`

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: 'Your practice account is open',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #16150f;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #0f6b45;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">Your practice account is open${opts.name ? `, ${opts.name}` : ''}</h2>
          <p style="color: #4a4740; font-size: 15px; line-height: 1.6;">
            We matched your GCash payment. You have a real GoHighLevel sandbox to build in,
            break, and rebuild &mdash; <strong>open until ${until}</strong>.
          </p>
          ${invite}
          <p style="color: #4a4740; font-size: 15px; line-height: 1.6;">
            Scenarios are free to attempt, always. Passing them adds days to your practice
            account, so it does not have to cost you again.
          </p>
          <p style="margin: 28px 0;">
            <a href="https://virtualfreaks.co/sandbox"
               style="background: #0f6b45; color: #fff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              See your practice account
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e3e0d9; margin: 28px 0;" />
          <p style="color: #85817a; font-size: 13px; line-height: 1.6;">
            This clock is only on the practice account. Your Virtual Freaks profile, badges and
            messages are free forever and are not affected when it runs out.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send seat-open email:', error)
  }
}
