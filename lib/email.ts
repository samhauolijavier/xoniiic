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

  // One wording, whether the GHL user has been created yet or not.
  //
  // The old pair said either "GoHighLevel will email you" or "we will email you
  // shortly" — and the second was wrong, because we never send the login. It
  // comes from GoHighLevel, from a GoHighLevel address, and somebody waiting on
  // an email from Virtual Freaks will not go looking for it. Naming the sender
  // is the whole job of this paragraph.
  const invite = `<p style="color: #4a4740; font-size: 15px; line-height: 1.6;">
       <strong>Your login comes from GoHighLevel, not from us.</strong> Watch for a separate
       email from them inviting you to set your own password — usually within the hour.
       We never see or send that password. If it has not arrived, check your spam folder
       before anything else; that is where it lands most often.
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

/** The invitation Spencer sends to people he has placed. */
export async function sendTestimonialInviteEmail(opts: {
  email: string
  name?: string | null
  hasAccount: boolean
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping testimonial invite')
    return
  }

  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
  // Two doors, because half of them have an account and half do not, and
  // sending someone to a signup page they do not need is how you lose them.
  const primary = opts.hasAccount
    ? { href: `${site}/login?callbackUrl=/dashboard`, label: 'Sign in and write it' }
    : { href: `${site}/register?role=seeker`, label: 'Make an account' }
  const secondary = opts.hasAccount
    ? { href: `${site}/register?role=seeker`, label: 'Make an account' }
    : { href: `${site}/login?callbackUrl=/dashboard`, label: 'Sign in' }

  try {
    await resend.emails.send({
      from: 'Spencer at Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: 'Would you write a few lines about working with us?',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 24px; color: #a21caf;">Virtual Freaks</h1>

          <p style="font-size: 15px; line-height: 1.65;">Hi${opts.name ? ` ${opts.name}` : ''},</p>

          <p style="font-size: 15px; line-height: 1.65;">
            I am putting real stories on the Virtual Freaks site, and yours is one I would like people
            to read. Business owners deciding whether to hire from here have no way to know it works
            until somebody who has done it tells them.
          </p>

          <p style="font-size: 15px; line-height: 1.65;">
            A few honest lines is plenty — what you do, how the placement came about, and what it has
            meant for you. Good and bad both welcome; a page of perfect reviews convinces nobody.
          </p>

          <p style="font-size: 15px; line-height: 1.65;"><strong>What you get for it:</strong></p>
          <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px; margin: 0 0 20px;">
            <li>
              The <strong>Placed through Virtual Freaks</strong> badge on your public profile. It tells
              an employer you were actually hired here and it worked — which is the thing they look for
              hardest.
            </li>
            <li>
              <strong>30 days on the GoHighLevel practice account</strong>, on us. A real sandbox to
              build in and break.
            </li>
          </ul>

          <p style="margin: 28px 0 12px;">
            <a href="${primary.href}"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              ${primary.label}
            </a>
          </p>
          <p style="font-size: 14px; margin: 0 0 24px;">
            Already sorted? <a href="${secondary.href}" style="color: #a21caf;">${secondary.label}</a>
          </p>

          <p style="font-size: 15px; line-height: 1.65;">
            Once you are in, it is on your dashboard — a box titled <strong>Share your story</strong>.
            Two minutes.
          </p>

          <p style="font-size: 15px; line-height: 1.65;">
            And if you would rather not, that is genuinely fine. It changes nothing between us.
          </p>

          <p style="font-size: 15px; line-height: 1.65;">Spencer</p>

          <hr style="border: none; border-top: 1px solid #e6e0e2; margin: 28px 0;" />
          <p style="color: #837b80; font-size: 12px; line-height: 1.6;">
            Nothing is published without your say-so, and you can ask for it to be taken down at any
            time — your badge and your 30 days stay either way.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send testimonial invite:', error)
  }
}

/** Sent when Spencer approves one. */
export async function sendTestimonialApprovedEmail(opts: {
  email: string
  name?: string | null
  rewarded: boolean
  expiresAt: Date | null
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping testimonial approval')
    return
  }

  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
  const until = opts.expiresAt
    ? opts.expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  try {
    await resend.emails.send({
      from: 'Spencer at Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: 'Your story is on the site — and your badge is live',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">Thank you${opts.name ? `, ${opts.name}` : ''}</h2>

          <p style="font-size: 15px; line-height: 1.65;">
            Your words are on the site now. Somebody deciding whether to hire from here will read them,
            which is worth more than anything I could write myself.
          </p>

          ${opts.rewarded ? `
          <p style="font-size: 15px; line-height: 1.65;"><strong>Both rewards are on your account:</strong></p>
          <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px; margin: 0 0 20px;">
            <li><strong>Placed through Virtual Freaks</strong> — now on your public profile, permanently.</li>
            ${until ? `<li><strong>30 days of practice account</strong>, running until ${until}.</li>` : ''}
          </ul>` : ''}

          <p style="margin: 26px 0;">
            <a href="${site}/dashboard"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              See your profile
            </a>
          </p>

          <p style="font-size: 15px; line-height: 1.65;">Spencer</p>

          <hr style="border: none; border-top: 1px solid #e6e0e2; margin: 28px 0;" />
          <p style="color: #837b80; font-size: 12px; line-height: 1.6;">
            Want it taken down? Reply and it comes off the same day. Your badge and your days stay.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send testimonial approval:', error)
  }
}

/**
 * Somebody sent you a message.
 *
 * Deliberately does not include the message body. A profile URL is something
 * people paste on LinkedIn, so a stranger can start a conversation — and
 * forwarding whatever they typed straight into an inbox turns this into a
 * delivery service for anything anyone wants to say. The email says who and
 * how many; reading it happens on the site, where blocking and reporting live.
 */
export async function sendNewMessageEmail(opts: {
  email: string
  recipientName?: string | null
  senderName: string
  conversationId: string
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping new-message email')
    return
  }

  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: `${opts.senderName} sent you a message`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 21px; margin: 0 0 12px;">
            ${opts.senderName} sent you a message
          </h2>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            ${opts.recipientName ? `Hi ${opts.recipientName}, s` : 'S'}omebody has started a
            conversation with you on Virtual Freaks. Replying quickly matters more than replying
            perfectly &mdash; most people message several profiles at once.
          </p>
          <p style="margin: 26px 0;">
            <a href="${site}/messages?c=${encodeURIComponent(opts.conversationId)}"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              Read and reply
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e6e0e2; margin: 28px 0;" />
          <p style="color: #837b80; font-size: 12px; line-height: 1.6;">
            You can turn these off in your notification settings. If a message is abusive or
            unwanted, report it from the conversation and we will look at it.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send new-message email:', error)
  }
}

/** Somebody they invited got a seat, and that earned them a month. */
export async function sendReferralRewardEmail(opts: {
  email: string
  name?: string | null
  months: number
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping referral reward email')
    return
  }

  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
  const days = opts.months * 30

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: `You have earned ${days} more days`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">
            ${days} days added${opts.name ? `, ${opts.name}` : ''}
          </h2>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            The people you brought have their practice accounts open, so
            ${opts.months === 1 ? 'a month is' : `${opts.months} months are`} on us. It has already
            been added &mdash; nothing for you to claim.
          </p>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            Thank you for that. Somebody trusting your recommendation is worth more to this place
            than anything we could say about ourselves.
          </p>
          <p style="margin: 26px 0;">
            <a href="${site}/sandbox"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              See your practice account
            </a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send referral reward email:', error)
  }
}

/**
 * Three days left.
 *
 * Sent while there is still time to do something, and it leads with the two
 * free routes rather than the payment link — somebody who cannot spare 129
 * pesos this month should not be made to feel the door is closing on them.
 */
export async function sendSeatEndingEmail(opts: {
  email: string
  name?: string | null
  expiresAt: Date
  daysLeft: number
  scenariosAvailable: boolean
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping seat-ending email')
    return
  }

  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
  const until = opts.expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: `Your practice account ends on ${until}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">
            ${opts.daysLeft} days left on your practice account
          </h2>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            ${opts.name ? `${opts.name}, y` : 'Y'}our GoHighLevel sandbox closes on
            <strong>${until}</strong>. Anything you have built in there stops being reachable, so
            if there is work you want to keep, take screenshots of it before then &mdash; those are
            what go on your profile.
          </p>

          ${opts.scenariosAvailable ? `
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            <strong>Two ways to keep it that cost nothing:</strong> pass a scenario, or bring two
            people who take a seat. Either adds thirty days, and both work as well as paying.
          </p>` : `
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            <strong>A way to keep it that costs nothing:</strong> bring two people who take a seat
            and thirty days are added automatically. It works as well as paying.
          </p>`}

          <p style="margin: 26px 0;">
            <a href="${site}/sandbox"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              See your options
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #e6e0e2; margin: 28px 0;" />
          <p style="color: #837b80; font-size: 13px; line-height: 1.6;">
            This is only the practice account. Your Virtual Freaks profile, your badges and your
            messages are free forever and are not affected when it ends.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send seat-ending email:', error)
  }
}

/**
 * A password reset link, sent to the address that owns the account.
 *
 * This route used to return the link in its own HTTP response, so anybody
 * could post any email address and be handed a working reset URL for somebody
 * else's account. The link has to travel through the inbox — that is the only
 * thing proving the person asking owns the address.
 */
export async function sendPasswordResetEmail(opts: {
  email: string
  name?: string | null
  resetUrl: string
}) {
  if (!resend) {
    console.log('[Email] No RESEND_API_KEY set, skipping password reset email')
    return
  }

  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: 'Reset your Virtual Freaks password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">Reset your password</h2>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            ${opts.name ? `${opts.name}, s` : 'S'}omebody asked to reset the password on this
            account. If that was you, use the button below. The link works once and expires in an
            hour.
          </p>
          <p style="margin: 26px 0;">
            <a href="${opts.resetUrl}"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              Set a new password
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e6e0e2; margin: 28px 0;" />
          <p style="color: #837b80; font-size: 13px; line-height: 1.6;">
            If this was not you, ignore this email &mdash; nothing has changed and your password
            still works. Nobody can reset it without opening this link.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send password reset:', error)
  }
}

/** Somebody asked to reset a password on an account that signs in with Google. */
export async function sendGoogleAccountNoticeEmail(opts: { email: string; name?: string | null }) {
  if (!resend) return
  const site = process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'
  try {
    await resend.emails.send({
      from: 'Virtual Freaks <noreply@virtualfreaks.co>',
      to: opts.email,
      subject: 'Signing in to Virtual Freaks',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; color: #1a1418;">
          <h1 style="font-size: 20px; margin: 0 0 20px; color: #a21caf;">Virtual Freaks</h1>
          <h2 style="font-size: 22px; margin: 0 0 12px;">Use Google to sign in</h2>
          <p style="color: #4d4549; font-size: 15px; line-height: 1.65;">
            ${opts.name ? `${opts.name}, s` : 'S'}omebody asked to reset the password on this
            account &mdash; but it has no password. It signs in with Google, so there is nothing to
            reset: press <strong>Continue with Google</strong> on the sign-in page.
          </p>
          <p style="margin: 26px 0;">
            <a href="${site}/login"
               style="background: #a21caf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
              Go to sign in
            </a>
          </p>
          <p style="color: #837b80; font-size: 13px; line-height: 1.6;">
            If this was not you, nothing has happened and nothing needs doing.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send Google account notice:', error)
  }
}
