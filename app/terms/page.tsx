import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Virtual Freaks',
  description: 'Terms of Service for Virtual Freaks — the remote talent marketplace.',
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black gradient-text mb-3">Terms of Service</h1>
        <p className="text-brand-muted text-sm">Effective date: March 1, 2026</p>
      </div>

      <div className="space-y-10">

        {/* 1 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">1. Acceptance of Terms</h2>
          <p className="text-brand-muted leading-relaxed">
            By accessing or using Virtual Freaks (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not use the Service. These Terms constitute a binding legal agreement between you and Virtual Freaks (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We reserve the right to update these Terms at any time. When we make changes, we will update the effective date at the top of this page and, for material changes, notify you via email or an in-platform notice. Your continued use of the Service after any changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">2. Description of Service</h2>
          <p className="text-brand-muted leading-relaxed">
            Virtual Freaks is a remote talent marketplace that connects employers and businesses (&quot;Employers&quot;) with skilled freelancers and independent contractors (&quot;Seekers&quot;). Seekers create public profiles showcasing their skills, experience, portfolio work, and availability. Employers browse, search, and contact Seekers directly through the platform. Virtual Freaks acts solely as a facilitator of these connections. We are not a party to any employment, contractor, or service agreement between Employers and Seekers, and we do not guarantee the quality, safety, or legality of any work performed as a result of connections made on the platform.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">3. Account Registration</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            To access certain features of the Service, you must create an account. You may register using an email address and password, or through a supported third-party authentication provider such as Google OAuth. By creating an account, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain and promptly update your account information to keep it accurate.</li>
            <li>Keep your login credentials confidential and notify us immediately of any unauthorized access to your account.</li>
            <li>Accept responsibility for all activities that occur under your account.</li>
            <li>Not create an account if you are under 16 years of age.</li>
            <li>Not create or operate more than one account per person without our prior written consent.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed mt-3">
            We reserve the right to suspend or terminate any account that violates these Terms or that we determine, in our sole discretion, is harmful to the platform or its users.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">4. Seeker Responsibilities</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            As a Seeker, you represent and warrant that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>All information in your profile, including skills, experience, certifications, and portfolio work, is truthful, accurate, and not misleading.</li>
            <li>You have the legal right to work in the jurisdictions where you offer your services.</li>
            <li>You are solely responsible for all tax obligations arising from engagements with Employers found through the platform.</li>
            <li>You will not misrepresent your qualifications, experience, or the authorship of portfolio work.</li>
            <li>You understand that Virtual Freaks does not guarantee that any Employer will contact or hire you.</li>
            <li>You are an independent contractor and not an employee of Virtual Freaks or of any Employer by virtue of using this platform.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">5. Employer Responsibilities</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            As an Employer, you agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>You will use the Service only to find Seekers for legitimate business purposes.</li>
            <li>You will not use contact information obtained through the Service for unsolicited commercial communications unrelated to hiring.</li>
            <li>You will treat all Seekers with respect and comply with applicable employment, anti-discrimination, and equal opportunity laws.</li>
            <li>Any agreements, contracts, or arrangements entered into with Seekers are solely between you and the Seeker. Virtual Freaks bears no responsibility for the outcome of such arrangements.</li>
            <li>You will comply with all applicable local, national, and international laws when engaging Seekers.</li>
            <li>Free-tier Employers are limited to 5 contact requests per month and 2 active job posts at any time. These limits are enforced by the platform and may not be circumvented.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">6. Subscriptions and Billing</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            Virtual Freaks offers optional paid subscription plans that provide additional features. Current plans include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted mb-4">
            <li><span className="text-brand-text">Seeker Premium ($2.99/month):</span> Includes profile analytics, priority visibility in search results, and enhanced profile features.</li>
            <li><span className="text-brand-text">Employer Verified Partner ($12.99/month):</span> Includes unlimited contact requests, unlimited active job posts, and a verified badge displayed on your profile.</li>
          </ul>
          <p className="text-brand-muted leading-relaxed mb-3">
            All payments are processed securely through Stripe. By subscribing to a paid plan, you agree to the following:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>Subscriptions are billed on a recurring monthly basis. Your payment method will be charged automatically at the start of each billing cycle.</li>
            <li>You authorize us (via Stripe) to charge the payment method on file for all applicable fees.</li>
            <li>Subscription prices may change with at least 30 days&apos; prior notice. Continued use after a price change constitutes acceptance of the new pricing.</li>
            <li>You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. No prorated refunds are provided for partial months.</li>
            <li>If your payment fails, we may suspend access to premium features until the payment issue is resolved. We will attempt to notify you before suspension.</li>
            <li>We reserve the right to modify, discontinue, or restructure subscription plans at any time with reasonable notice.</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">7. User Content and Intellectual Property</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            You may upload and submit content to the Service, including profile information, avatar images, portfolio images, certificates, job posts, and other materials (&quot;User Content&quot;). You retain full ownership of all User Content you submit.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            By submitting User Content, you grant Virtual Freaks a non-exclusive, worldwide, royalty-free, sublicensable license to use, display, reproduce, and distribute that content solely for the purposes of operating, promoting, and improving the Service. This license ends when you delete the content or your account, except where the content has been shared with other users or third parties and they have not deleted it.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            You represent and warrant that you own or have the necessary rights and permissions to submit all User Content, and that your content does not infringe or violate the intellectual property rights, privacy rights, or any other rights of any third party.
          </p>
          <p className="text-brand-muted leading-relaxed">
            The Service itself, including its design, branding, logos, features, and underlying code, is the exclusive property of Virtual Freaks and its licensors. Our trademarks and trade dress may not be used without our prior written consent.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">8. Acceptable Use</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li>Post false, inaccurate, misleading, defamatory, or offensive content.</li>
            <li>Violate any applicable laws, regulations, or third-party rights.</li>
            <li>Harvest or collect personal information about other users without their consent.</li>
            <li>Distribute spam, chain letters, or other unsolicited communications.</li>
            <li>Attempt to gain unauthorized access to any part of the Service, its servers, or related systems.</li>
            <li>Use automated tools, bots, scrapers, or scripts to access or interact with the Service without our written permission.</li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
            <li>Upload content that contains malware, viruses, or any other harmful code.</li>
            <li>Circumvent or attempt to circumvent any usage limits, access restrictions, or security features of the Service.</li>
            <li>Engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service.</li>
          </ul>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">9. Account Termination</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            You may delete your account at any time through your account settings. Upon deletion, we will remove your profile and personal data in accordance with our{' '}
            <Link href="/privacy" className="text-brand-purple hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            . Some information may be retained as required by law or for legitimate business purposes (such as fraud prevention).
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            We may suspend or permanently terminate your account if you violate these Terms, engage in fraudulent or harmful activity, or if we are required to do so by law. Where possible, we will provide notice and an explanation before or at the time of termination.
          </p>
          <p className="text-brand-muted leading-relaxed">
            If your account is terminated while you have an active paid subscription, you will not receive a refund for the remaining portion of your billing period unless required by applicable law.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">10. Disclaimers</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-brand-muted leading-relaxed mb-3">
            Virtual Freaks does not verify the identity, qualifications, background, or accuracy of representations made by users. We do not endorse any Seeker or Employer, and we do not guarantee the quality, safety, or legality of any services offered or received through the platform. We encourage all users to exercise caution and conduct their own due diligence.
          </p>
          <p className="text-brand-muted leading-relaxed">
            We do not warrant that the Service will be uninterrupted, secure, error-free, or free of viruses or other harmful components. We are not responsible for any delays, delivery failures, or other damage resulting from limitations inherent to internet communications.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">11. Limitation of Liability</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIRTUAL FREAKS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF (OR INABILITY TO USE) THE SERVICE.
          </p>
          <p className="text-brand-muted leading-relaxed">
            IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICE EXCEED THE GREATER OF (A) THE AMOUNTS YOU HAVE PAID TO VIRTUAL FREAKS IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100). SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">12. Indemnification</h2>
          <p className="text-brand-muted leading-relaxed">
            You agree to indemnify, defend, and hold harmless Virtual Freaks and its officers, directors, employees, contractors, and agents from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any rights of another person or entity.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">13. Governing Law and Disputes</h2>
          <p className="text-brand-muted leading-relaxed mb-3">
            These Terms shall be governed by and construed in accordance with the laws of the United States and the State of California, without regard to conflict of law principles.
          </p>
          <p className="text-brand-muted leading-relaxed">
            Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If the dispute cannot be resolved informally within thirty (30) days, either party may pursue resolution through binding arbitration administered under the rules of the American Arbitration Association, or in the state or federal courts located in the State of California. You agree to submit to the personal jurisdiction of such courts.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">14. Privacy</h2>
          <p className="text-brand-muted leading-relaxed">
            Your use of the Service is also governed by our{' '}
            <Link href="/privacy" className="text-brand-purple hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. By using the Service, you consent to the collection, use, and sharing of your information as described in the Privacy Policy.
          </p>
        </section>

        {/* 15 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">15. General Provisions</h2>
          <ul className="list-disc list-inside space-y-2 text-brand-muted">
            <li><span className="text-brand-text">Entire Agreement:</span> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Virtual Freaks regarding the Service.</li>
            <li><span className="text-brand-text">Severability:</span> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
            <li><span className="text-brand-text">Waiver:</span> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</li>
            <li><span className="text-brand-text">Assignment:</span> You may not assign or transfer your rights under these Terms without our prior written consent. We may assign our rights and obligations without restriction.</li>
          </ul>
        </section>

        {/* 16 */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-3">16. Contact</h2>
          <p className="text-brand-muted leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:support@virtualfreaks.com" className="text-brand-purple hover:text-purple-400 transition-colors">
              support@virtualfreaks.com
            </a>
            .
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-brand-border flex items-center gap-6">
        <Link href="/" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
          &larr; Back to Virtual Freaks
        </Link>
        <Link href="/privacy" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
