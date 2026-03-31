import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      <div className="mt-8 mb-10">
        <p className="micro-label mb-2 text-[#C89B3C]">Legal</p>
        <h1 className="font-display text-3xl md:text-4xl font-normal text-[#EAE4D9] mb-3">Privacy Policy</h1>
        <div className="w-12 h-px bg-[#C89B3C]/50 mb-4"></div>
        <p className="text-[#EAE4D9]/40 font-sans text-xs tracking-wide">Last updated: March 20, 2026</p>
      </div>

      <div className="space-y-10 text-[#EAE4D9]/70 font-serif italic leading-relaxed">
        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">1. Information Collection</h2>
          <p className="mb-4">
            FIREWATER collects information you provide directly to us when you create an account, submit reviews, or
            interact with the platform. This may include:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Name, email address, and profile picture obtained through Google OAuth or email/phone sign-up</li>
            <li>Profile information you provide (bio, favorite spirit, top shelf selections)</li>
            <li>Reviews, star ratings, and detailed tasting notes (nose, palate, finish) you submit</li>
            <li>Photographs you upload of spirits or bottles</li>
            <li>"Want to Try" and "Tried" lists you create</li>
            <li>Social interactions such as follows, follower relationships, and community submissions</li>
            <li>Search queries you enter, including those processed by AI-powered semantic search</li>
            <li>Camera and barcode data when you use the barcode scanner feature</li>
          </ul>
          <p className="mt-4">
            We also automatically collect certain information when you use FIREWATER via Vercel Analytics and
            Speed Insights, including page views, navigation patterns, performance metrics, your IP address,
            device type, browser type, and operating system.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">2. Use of Information</h2>
          <p className="mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide, maintain, and improve FIREWATER</li>
            <li>Personalize your experience and deliver relevant content</li>
            <li>Process and manage your account</li>
            <li>Communicate with you about updates, features, and promotions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">3. Data Security</h2>
          <p>
            We take reasonable measures to help protect the information we collect from loss, theft, misuse, and
            unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the
            Internet or method of electronic storage is completely secure. While we strive to use commercially acceptable
            means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">4. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you with our
            services. We will retain and use your information as necessary to comply with our legal obligations, resolve
            disputes, and enforce our agreements. If you wish to delete your account, please contact us and we will delete
            your personal data within a reasonable timeframe, unless we are required to retain it by law.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">5. Third-Party Services</h2>
          <p className="mb-4">
            FIREWATER relies on the following third-party services to operate, each of which may process your data
            in accordance with their own privacy policies:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Google OAuth</strong> — Used for authentication. When you sign in with Google, we receive your name, email address, and profile picture from Google.</li>
            <li><strong>Google Gemini AI</strong> — Powers our semantic search and recommendation features. Your search queries are sent to Google's Gemini API for processing on the server side.</li>
            <li><strong>Vercel</strong> — Our hosting provider. Vercel Postgres stores your account data, reviews, social connections, and list data. Vercel Blob stores user-uploaded photographs. Vercel Analytics and Speed Insights collect anonymized usage and performance data.</li>
          </ul>
          <p className="mt-4">
            FIREWATER may also contain links to third-party websites or services that are not owned or controlled by us.
            We have no control over, and assume no responsibility for, the content, privacy policies, or practices of
            any third-party websites or services.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">6. Local Storage, Cookies, and Tracking</h2>
          <p className="mb-4">
            FIREWATER uses browser localStorage to persist your session data, tasting lists, reviews, theme preferences,
            and other application state on your device. This data remains on your device and is synced to our database
            when you are signed in.
          </p>
          <p className="mb-4">
            We use Vercel Analytics and Speed Insights to collect anonymized usage data such as page views, navigation
            patterns, and web performance metrics. These tools may use cookies or similar technologies.
          </p>
          <p>
            You can clear localStorage through your browser settings and instruct your browser to refuse cookies.
            However, doing so may cause you to lose locally stored data such as your tasting lists and reviews
            (if not signed in), and some portions of the platform may not function properly.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">7. Your Rights</h2>
          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>The right to access the personal information we hold about you</li>
            <li>The right to request correction of inaccurate data</li>
            <li>The right to request deletion of your personal data</li>
            <li>The right to object to or restrict processing of your data</li>
            <li>The right to data portability</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, please contact us through the FIREWATER platform.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">8. Age Requirement &amp; Children's Privacy</h2>
          <p className="mb-4">
            FIREWATER is an alcohol-related platform intended exclusively for individuals who are at least 21 years of age
            or the legal drinking age in their jurisdiction, whichever is higher. We do not knowingly collect, solicit, or
            maintain personal information from anyone under 21 years of age.
          </p>
          <p>
            If we learn that we have collected personal information from a person under 21, we will take steps to promptly
            delete that information. If you believe we have inadvertently collected information from someone under 21,
            please contact us through the FIREWATER platform.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">9. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last updated" date. You are advised to review this page
            periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">10. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through the FIREWATER platform.
          </p>
        </section>
      </div>
    </div>
  );
}
