import type { Metadata } from 'next'
import { config } from '../config'

export const metadata: Metadata = {
  title: `Privacy Policy | ${config.title}`,
  description: 'Privacy policy for curtiscode.dev',
}

export default function PrivacyPolicy() {
  return (
    <main className="container mx-auto px-4 py-8 prose max-w-3xl">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> March 2026</p>

      <h2>Who We Are</h2>
      <p>
        This website is operated by Curtis Timson (<a href={config.url}>{config.url}</a>).
        If you have any questions about this privacy policy, please contact me via the social links in the footer.
      </p>

      <h2>What Data We Collect and Why</h2>

      <h3>Analytics (Google Analytics 4)</h3>
      <p>
        If you accept cookies, we use Google Analytics 4 to understand how visitors use this site.
        Google Analytics collects information such as pages visited, time spent on pages, your browser type,
        and your approximate location (country/city level). Your IP address is anonymised before it is stored.
        Google Analytics sets the following cookies: <code>_ga</code> and <code>_ga_CMJX9JB6WE</code>.
      </p>

      <h3>Advertising (Google Adsense)</h3>
      <p>
        If you accept cookies, we display advertisements provided by Google Adsense.
        Google may use cookies to show you ads based on your interests and previous visits to this and other websites.
        You can opt out of personalised advertising at{' '}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
          google.com/settings/ads
        </a>.
      </p>

      <h2>Legal Basis for Processing</h2>
      <p>
        We only set analytics and advertising cookies with your explicit consent (Article 6(1)(a) UK GDPR).
        You can withdraw your consent at any time by clicking <strong>Cookie Settings</strong> in the footer.
      </p>

      <h2>Data Retention</h2>
      <p>
        Google Analytics data is retained for 14 months. Adsense cookie data is retained in accordance with
        Google&apos;s own retention policies.
      </p>

      <h2>Third-Party Data Processors</h2>
      <p>
        We use Google LLC as a third-party data processor for both analytics and advertising.
        Google LLC is based in the United States. Data transfers from the UK to the USA are made under
        the UK Extension to the EU-US Data Privacy Framework, which provides an adequate level of
        data protection as recognised by the UK government.
      </p>
      <p>
        For more information on how Google processes your data, see{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>.
      </p>

      <h2>Your Rights</h2>
      <p>Under UK GDPR, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> the personal data we hold about you</li>
        <li><strong>Rectification</strong> of inaccurate personal data</li>
        <li><strong>Erasure</strong> of your personal data</li>
        <li><strong>Restriction</strong> of processing</li>
        <li><strong>Data portability</strong></li>
        <li><strong>Object</strong> to processing based on legitimate interests</li>
        <li><strong>Withdraw consent</strong> at any time without affecting the lawfulness of prior processing</li>
      </ul>
      <p>
        To exercise any of these rights, please contact me via the social links in the footer.
      </p>

      <h2>How to Withdraw Consent or Manage Cookies</h2>
      <p>
        You can withdraw your consent at any time by clicking <strong>Cookie Settings</strong> in the
        footer of any page. This will reset your preferences and show the consent banner again.
        You can also clear cookies directly in your browser settings.
      </p>

      <h2>Right to Complain</h2>
      <p>
        If you believe your data has been processed unlawfully, you have the right to lodge a complaint
        with the UK&apos;s supervisory authority, the Information Commissioner&apos;s Office (ICO), at{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>
    </main>
  )
}
