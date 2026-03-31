import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-on-surface-muted hover:text-on-surface-accent transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      <div className="mt-8 mb-10">
        <p className="micro-label mb-2 text-on-surface-accent">Legal</p>
        <h1 className="font-display text-3xl md:text-4xl font-normal text-on-surface mb-3">Terms and Conditions</h1>
        <div className="w-12 h-px bg-[#C89B3C]/50 mb-4"></div>
        <p className="text-on-surface-muted font-sans text-xs tracking-wide">Last updated: March 20, 2026</p>
      </div>

      <div className="space-y-10 text-on-surface-secondary font-serif italic leading-relaxed">
        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using FIREWATER, you agree to be bound by these Terms and Conditions. If you do not agree
            to all of these terms, you may not access or use our services. These terms apply to all visitors, users, and
            others who access or use the platform. You represent that you are at least 21 years of age or the legal
            drinking age in your jurisdiction, whichever is higher. We reserve the right to update or modify these terms
            at any time, and your continued use of FIREWATER following any changes constitutes acceptance of those changes.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily access and use FIREWATER for personal, non-commercial purposes. This
            is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Modify or copy the materials except for personal use</li>
            <li>Use the materials for any commercial purpose or public display</li>
            <li>Attempt to decompile or reverse-engineer any software contained within FIREWATER</li>
            <li>Remove any copyright or proprietary notations from the materials</li>
            <li>Transfer the materials to another person or mirror the materials on any other server</li>
          </ul>
          <p className="mt-4">
            This license shall automatically terminate if you violate any of these restrictions and may be terminated by
            FIREWATER at any time.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">3. User Accounts</h2>
          <p>
            You must be at least 21 years of age or the legal drinking age in your jurisdiction, whichever is higher, to
            create an account or use FIREWATER. By creating an account, you represent and warrant that you meet this age
            requirement. When you create an account with FIREWATER, you are responsible for maintaining the security of
            your account and for all activities that occur under your account. You must provide accurate and complete
            information when creating your account. You agree to notify us immediately of any unauthorized use of your
            account. FIREWATER is not liable for any loss or damage arising from your failure to comply with this section.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">4. User Content</h2>
          <p className="mb-4">
            You retain ownership of any content you submit, post, or display on or through FIREWATER, including reviews,
            star ratings, tasting notes, photographs, profile information, and community spirit submissions. By submitting
            content, you grant FIREWATER a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and
            display such content in connection with the operation of the platform. You represent and warrant that you own
            or have the necessary rights to submit such content.
          </p>
          <p>
            User-submitted photographs and community spirit submissions are subject to review and approval by FIREWATER
            administrators before being made publicly visible. FIREWATER reserves the right to reject or remove any
            user-submitted content at its discretion.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">5. AI-Powered Features</h2>
          <p className="mb-4">
            FIREWATER uses Google Gemini AI to power semantic search, spirit recommendations, and on-demand spirit data
            generation. Your search queries are sent to Google's servers for processing. AI-generated results, including
            search matches and spirit information, may contain inaccuracies. You should not rely solely on AI-generated
            content for purchasing decisions or factual accuracy.
          </p>
          <p>
            By using AI-powered features, you acknowledge that your queries are processed by third-party AI services
            subject to their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">6. Disclaimer</h2>
          <p>
            The materials on FIREWATER are provided on an "as is" basis. FIREWATER makes no warranties, expressed or
            implied, and hereby disclaims and negates all other warranties, including without limitation implied warranties
            or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
            property. FIREWATER does not warrant or make any representations concerning the accuracy, likely results,
            or reliability of the use of the materials on its platform, including AI-generated content, spirit data,
            pricing information, or user-submitted reviews.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">7. Limitations</h2>
          <p>
            In no event shall FIREWATER or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
            use the materials on FIREWATER, even if FIREWATER or an authorized representative has been notified orally
            or in writing of the possibility of such damage. Some jurisdictions do not allow limitations on implied
            warranties or limitations of liability for incidental or consequential damages, so these limitations may not
            apply to you.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the United States, and
            you irrevocably submit to the exclusive jurisdiction of the courts in that location. Any claim relating to
            FIREWATER shall be governed by the laws of the United States without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-on-surface mb-4">9. Contact</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us through the FIREWATER platform.
          </p>
        </section>
      </div>
    </div>
  );
}
