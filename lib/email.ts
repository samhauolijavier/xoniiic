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
