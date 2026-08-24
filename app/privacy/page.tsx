import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Virtual Freaks — the remote talent marketplace.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black gradient-text mb-3">Privacy Policy</h1>
        <p className="text-brand-muted text-sm">Effective date: 25 August 2026</p>
      </div>

      <div className="space-y-10">

        <p className="text-brand-muted leading-relaxed">
          Virtual Freaks (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our remote talent marketplace (the &quot;Service&quot;). Please read this policy carefully. By using the Service, you agree to the practices described here.
        </p>

        {/* 1 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">1. Information We Collect</h2>

          <p className="text-brand-muted font-medium mb-2">Information you provide directly:</p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted mb-4">
            <li>Account registration details (name, email address, password) or information received from third-party authentication providers such as Google OAuth (name, email address, profile picture).</li>
            <li>Profile information including your location, bio, skills, hourly rate, availability, portfolio links, languages, and certifications.</li>
            <li>Uploaded files such as avatar images, portfolio images, and certificate documents.</li>
            <li>Job post content and interest expressions submitted by Employers.</li>
            <li>Communications you send through the platform, including contact requests and messages.</li>
            <li>Billing and payment information when you subscribe to a paid plan. Payment card details are collected and processed directly by Stripe and are never stored on our servers.</li>
          </ul>

          <p className="text-brand-muted font-medium mb-2">Information collected automatically:</p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>Log data such as your IP address, browser type, referring URL, pages visited, and timestamps.</li>
            <li>Device information including operating system, hardware model, and screen resolution.</li>
            <li>Usage data such as profile views received, search queries, clicks, and feature interactions.</li>
            <li>Cookies and similar tracking technologies (see Section 5 below).</li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">2. How We Use Your Information</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>To create, maintain, and secure your account.</li>
            <li>To display your public Seeker profile to Employers and other visitors.</li>
            <li>To facilitate connections between Employers and Seekers, including contact requests and messaging.</li>
            <li>To process subscription payments and manage billing through Stripe.</li>
            <li>To provide Seeker Premium features such as profile analytics and priority search visibility.</li>
            <li>To send transactional communications including account confirmations, password resets, and billing receipts.</li>
            <li>To send platform-related notifications and updates. You may opt out of non-essential communications at any time.</li>
            <li>To monitor and analyze usage patterns in order to improve platform performance and user experience.</li>
            <li>To detect and prevent fraud, abuse, and violations of our Terms of Service.</li>
            <li>To comply with legal obligations and enforce our agreements.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">3. Information Sharing and Disclosure</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We do not sell your personal information. We may share your information in the following limited circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">With other users:</span> Public profile information (name, avatar, skills, location, bio, rates, portfolio, certifications) is visible to all visitors and registered users. This is a core function of the Service.</li>
            <li><span className="text-brand-text">With Employers (on contact):</span> When an Employer initiates a contact request, limited contact information may be shared as part of that interaction.</li>
            <li><span className="text-brand-text">Service providers:</span> We share information with trusted third-party vendors who help us operate the Service, subject to confidentiality obligations. These include Stripe (payment processing), Google (OAuth authentication), and hosting and analytics providers.</li>
            <li><span className="text-brand-text">Legal requirements:</span> We may disclose information if required by law, regulation, legal process, or governmental request.</li>
            <li><span className="text-brand-text">Business transfers:</span> In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change.</li>
            <li><span className="text-brand-text">With your consent:</span> We may share your information for other purposes if you provide explicit consent.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">4. Third-Party Services</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            The Service integrates with the following third-party services. Each has its own privacy policy governing how they handle your data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">Stripe:</span> We use Stripe to process all subscription payments. When you subscribe to Seeker Premium or Employer Verified Partner, your payment card details are collected directly by Stripe. We do not store your full card number on our servers. Stripe&apos;s privacy policy is available at stripe.com/privacy.</li>
            <li><span className="text-brand-text">Google OAuth:</span> If you choose to sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive your Google password. Google&apos;s privacy policy is available at policies.google.com/privacy.</li>
            <li><span className="text-brand-text">NextAuth.js:</span> We use NextAuth.js to manage authentication sessions. Session tokens are stored in secure, HTTP-only cookies on your browser.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">4a. Practice Accounts and GoHighLevel</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            If you take a practice account, we create a user for you inside a GoHighLevel sandbox
            sub-account that we control. To do that we pass your name and email address to
            GoHighLevel, who send you their own invitation to set a password. We never see or
            store that password.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            Anything you build inside that sandbox is held by GoHighLevel under their terms and
            privacy policy, not ours. The sandbox is shared with other members, so treat it as a
            practice environment and do not put real client data, personal records, or anything
            confidential into it.
          </p>
          <p className="text-brand-muted leading-relaxed">
            When your access period ends we remove your GoHighLevel user. Work left in the
            sandbox may be deleted or overwritten, so keep your own copies of anything you want.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">4b. Payments by GCash</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            Practice account payments are made by GCash directly to us. We record the reference
            number you enter, the amount, and the date, so a payment can be matched to your
            account. We never see your GCash login, PIN, balance, or transaction history, and we
            cannot take money from your account &mdash; you send it, we match it.
          </p>
          <p className="text-brand-muted leading-relaxed">
            If you upload a receipt screenshot, it is stored privately and is visible only to us
            while we confirm the payment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">4c. Advertising</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We show advertising to signed-in members on pages such as your dashboard, browse,
            jobs and the leaderboard. Adverts are labelled &ldquo;Sponsored&rdquo;. We do not show
            adverts on public profile pages, on payment pages, in messages, or to visitors who are
            not signed in.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            <strong className="text-brand-text">We record which adverts you view and click.</strong>{' '}
            We use this to understand what is worth showing, to report performance to advertisers,
            and to follow up with you ourselves about offers you showed interest in &mdash; but we
            will only email you about that if you agreed to marketing when you signed up. You can
            change that at any time in your settings.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            <strong className="text-brand-text">We do not tell advertisers who you are.</strong>{' '}
            Advertisers receive counts only: how many people saw an advert, how many clicked, and
            whether they were freelancers or businesses. Your name, email address and profile are
            never shared with an advertiser, and we do not sell your personal information to
            anybody.
          </p>
          <p className="text-brand-muted leading-relaxed">
            Adverts may link to third-party sites, including ones where we earn an affiliate
            commission. Those sites have their own privacy policies and we are not responsible for
            them. Clicking an advert does not send your details to the destination.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">5. Cookies and Tracking Technologies</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We use cookies and similar technologies to operate and improve the Service. Cookies are small data files stored on your device by your browser.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            We use the following types of cookies:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">Essential cookies:</span> Required for the Service to function. These include session authentication cookies managed by NextAuth.js, CSRF protection tokens, and security-related cookies. The Service cannot operate properly without these.</li>
            <li><span className="text-brand-text">Preference cookies:</span> Remember your settings and preferences (such as theme or language) to personalize your experience.</li>
            <li><span className="text-brand-text">Analytics cookies:</span> Help us understand how users interact with the Service so we can identify issues and improve the platform.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed mt-3">
            You can manage cookie preferences through your browser settings. Please note that disabling essential cookies will prevent core features of the Service, including authentication, from functioning properly.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">6. Data Retention</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We retain your personal information for as long as your account is active or as needed to provide the Service. Specific retention practices include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">Account data:</span> Retained for the lifetime of your account. When you delete your account, we will delete or anonymize your personal data within 30 days, except as noted below.</li>
            <li><span className="text-brand-text">Uploaded content:</span> Avatar images, portfolio images, and certificates are deleted when you remove them from your profile or when your account is deleted.</li>
            <li><span className="text-brand-text">Billing records:</span> Transaction and billing records may be retained for up to 7 years to comply with tax and financial reporting obligations.</li>
            <li><span className="text-brand-text">Log and analytics data:</span> Automatically collected log data is retained for up to 12 months and then aggregated or deleted.</li>
            <li><span className="text-brand-text">Legal holds:</span> We may retain information beyond these periods if required by law, to resolve disputes, or to enforce our agreements.</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">7. Data Security</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>HTTPS encryption for all data transmitted between your browser and our servers.</li>
            <li>Password hashing using industry-standard algorithms.</li>
            <li>Secure, HTTP-only cookies for session management.</li>
            <li>Regular security reviews and updates to our infrastructure.</li>
            <li>Restricted access to personal data on a need-to-know basis among our team.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed mt-3">
            No method of transmission over the internet or electronic storage is completely secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">7a. Who Processes Your Data</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            We use a small number of services to run the platform. Each holds only what it needs
            to do its job:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted mb-3">
            <li><strong className="text-brand-text">Supabase</strong> &mdash; our database and file storage. Holds your account, profile, uploads, and messages.</li>
            <li><strong className="text-brand-text">Vercel</strong> &mdash; hosting. Handles requests and keeps short-lived server logs.</li>
            <li><strong className="text-brand-text">Resend</strong> &mdash; sends our email. Receives your email address and the contents of what we send you.</li>
            <li><strong className="text-brand-text">Google</strong> &mdash; if you sign in with Google, we receive your name, email address, and profile picture.</li>
            <li><strong className="text-brand-text">GoHighLevel</strong> &mdash; only if you take a practice account. Receives your name and email to create your sandbox user.</li>
            <li><strong className="text-brand-text">Stripe</strong> &mdash; card payments, where used. Card details go to Stripe and never reach our servers.</li>
            <li><strong className="text-brand-text">Sightengine</strong> &mdash; checks uploaded images for inappropriate content. Receives the image, not your identity.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed">
            We do not sell your personal information, and we do not share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">7b. Philippine Data Privacy Act</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            Virtual Freaks operates from the Philippines and processes personal information under
            the Data Privacy Act of 2012 (RA 10173). Under that Act you have the right to be
            informed, to object, to access your data, to have it corrected, to have it erased or
            blocked, to damages, to data portability, and to complain to the National Privacy
            Commission.
          </p>
          <p className="text-brand-muted leading-relaxed">
            Our lawful bases are: performing our agreement with you (running your account and
            profile), our legitimate interests (keeping the platform working, secure and
            improving), and your consent (marketing email, and anything you choose to publish).
            Where we rely on consent you may withdraw it at any time without affecting your
            account.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">8. Your Rights and Choices</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            Depending on your location, you may have certain rights regarding your personal information under laws such as the GDPR (EU/EEA), CCPA (California), or other applicable privacy regulations. These may include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">Access:</span> Request a copy of the personal information we hold about you.</li>
            <li><span className="text-brand-text">Correction:</span> Request correction of inaccurate or incomplete information. You can update most profile information directly from your dashboard.</li>
            <li><span className="text-brand-text">Deletion:</span> Request deletion of your personal information, subject to certain legal exceptions. You may also delete your account at any time through your account settings.</li>
            <li><span className="text-brand-text">Portability:</span> Request a copy of your data in a structured, machine-readable format.</li>
            <li><span className="text-brand-text">Objection:</span> Object to certain types of processing, including processing for direct marketing purposes.</li>
            <li><span className="text-brand-text">Withdrawal of consent:</span> Where processing is based on consent, you may withdraw that consent at any time.</li>
            <li><span className="text-brand-text">Opt out of communications:</span> You may unsubscribe from non-essential emails at any time using the link provided in those emails.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed mt-3">
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:support@virtualfreaks.com" className="text-brand-purple hover:text-brand-pink transition-colors">
              support@virtualfreaks.com
            </a>
            . We will respond to your request within 30 days.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-brand-muted leading-relaxed">
            The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have inadvertently collected personal information from a child under 16, we will take steps to delete that information promptly. If you believe a child has provided us with personal information, please contact us at{' '}
            <a href="mailto:support@virtualfreaks.com" className="text-brand-purple hover:text-brand-pink transition-colors">
              support@virtualfreaks.com
            </a>
            .
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">10. International Data Transfers</h2>
          <p className="text-brand-muted leading-relaxed">
            Virtual Freaks is operated from the United States. If you access the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate. By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence. We take steps to ensure that your data receives an adequate level of protection wherever it is processed.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">11. Changes to This Policy</h2>
          <p className="text-brand-muted leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will update the effective date at the top of this page. For material changes, we will notify you via email or an in-platform notification. We encourage you to review this policy periodically. Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">12. Contact Us</h2>
          <p className="text-brand-muted leading-relaxed">
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-3 space-y-1 text-brand-muted">
            <p>Virtual Freaks</p>
            <p>
              Email:{' '}
              <a href="mailto:support@virtualfreaks.com" className="text-brand-purple hover:text-brand-pink transition-colors">
                support@virtualfreaks.com
              </a>
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-brand-border flex items-center gap-6">
        <Link href="/" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
          &larr; Back to Virtual Freaks
        </Link>
        <Link href="/terms" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
          Terms of Service
        </Link>
      </div>
    </div>
  )
}
