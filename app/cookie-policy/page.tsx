import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn how Virtual Freaks uses cookies and similar technologies, and your rights to control them.',
  alternates: {
    canonical: 'https://virtualfreaks.co/cookie-policy',
  },
}

export default function CookiePolicyPage() {
  return (
    <div className="hero-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-brand-text mb-2">Cookie Policy</h1>
        <p className="text-sm text-brand-muted mb-8">
          <strong>Effective starting April 11, 2026</strong>
        </p>

        <div className="space-y-8 text-brand-muted leading-relaxed text-[15px]">
          <section>
            <p>
              This cookie policy (the &quot;Cookie Policy&quot;) is an extension of, is subject to, and incorporated into
              our <Link href="/privacy" className="text-brand-purple hover:text-purple-400 underline">Privacy Policy</Link>.
              All capitalized terms not defined herein bear the same definition as in the Privacy Policy.
            </p>
            <p className="mt-3">
              This Cookie Policy explains how Virtual Freaks (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) uses cookies and similar technologies when you visit our Website. It explains what
              these technologies are and why we use them, as well as your rights to control our use of them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a
              website. Cookies are widely used by website owners in order to make their websites work, or to
              work more efficiently, as well as to provide reporting information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">Cookies and Other Tracking Technologies</h2>
            <p>
              Cookies and similar technologies such as web beacons (collectively &quot;Cookies&quot;) are used
              by us to improve and customize our Website and the Service, as well as your experience in using them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">How Do We Use Cookies?</h2>

            <div className="space-y-4 mt-4">
              <div className="card p-5">
                <h3 className="font-semibold text-brand-text mb-2">Where Strictly Necessary</h3>
                <p className="text-sm">
                  Certain Cookies are essential in order to enable the Service to provide a feature you have
                  requested, such as remembering you have logged in. These cannot be disabled as the site
                  will not function without them.
                </p>
                <ul className="mt-3 text-sm space-y-1.5 ml-4 list-disc">
                  <li><span className="text-brand-text font-medium">next-auth.session-token</span> — Keeps you logged in to your account</li>
                  <li><span className="text-brand-text font-medium">next-auth.csrf-token</span> — Protects against cross-site request forgery attacks</li>
                  <li><span className="text-brand-text font-medium">next-auth.callback-url</span> — Remembers where to redirect you after login</li>
                </ul>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-brand-text mb-2">For Functionality</h3>
                <p className="text-sm">
                  These cookies and similar technologies remember choices you make such as language or search
                  parameters. We use these cookies to provide you with an experience more appropriate with
                  your selections and to make your use of the Service more tailored.
                </p>
                <ul className="mt-3 text-sm space-y-1.5 ml-4 list-disc">
                  <li><span className="text-brand-text font-medium">vf-cookie-consent</span> — Remembers your cookie consent preference</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">Cookies We Do NOT Use</h2>
            <p>Virtual Freaks does <span className="text-brand-text font-medium">not</span> currently use:</p>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>Advertising or targeting cookies</li>
              <li>Performance and analytics cookies (e.g., Google Analytics)</li>
              <li>Social media tracking cookies</li>
              <li>Cross-site tracking or behavioral advertising cookies</li>
            </ul>
            <p className="mt-3 text-sm">
              If we add analytics or advertising cookies in the future, this policy will be updated and you
              will be notified via the Cookie Consent Manager.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">Third-Party Cookies</h2>
            <p>
              When you sign in with Google, Google may set its own cookies to facilitate authentication.
              These cookies are governed by{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-purple hover:text-purple-400 underline"
              >
                Google&apos;s Privacy Policy
              </a>.
              We do not control these cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">How Can You Opt Out?</h2>
            <p>
              To opt out of our use of Cookies on our Website, you can instruct your browser, by changing its
              options, to stop accepting Cookies or to prompt you before accepting a Cookie from websites you
              visit. If you don&apos;t accept Cookies, you may be unable to use all aspects of our Service.
            </p>
            <p className="mt-3">
              You won&apos;t be able to opt out of any Cookies that are &quot;strictly necessary&quot; for the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">How Can I Control Cookies?</h2>
            <p>
              You have the right to decide whether to accept or reject Cookies. You can exercise your Cookie
              rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager
              allows you to select which categories of cookies you accept or reject. Essential cookies cannot
              be rejected as they are strictly necessary to provide you with access to the Website and the
              features of the Service.
            </p>
            <p className="mt-3">
              The Cookie Consent Manager can be found in the notification banner and on our Website. If you
              choose to reject Cookies, you may still use our Website though your access to some functionality
              and areas of our Website and the Service may be restricted. You may also set or amend your web
              browser controls to accept or refuse Cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">Updates to This Policy</h2>
            <p>
              This Cookie Policy may be updated from time to time. If we make any changes, we will notify you
              by revising the &quot;effective starting&quot; date at the top of this Cookie Policy. Upon such
              revision you will be deemed notified and your continued use of the Website and/or Service will be
              deemed your acceptance of and consent to the Cookie Policy, as revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-text mb-3">Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:support@virtualfreaks.co" className="text-brand-purple hover:text-purple-400 underline">
                support@virtualfreaks.co
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
