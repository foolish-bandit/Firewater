import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function AcceptableUsePage() {
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
        <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#EAE4D9] mb-3">Acceptable Use Policy</h1>
        <div className="w-12 h-px bg-[#C89B3C]/50 mb-4"></div>
        <p className="text-[#EAE4D9]/40 font-sans text-xs tracking-wide">Last updated: March 20, 2026</p>
      </div>

      <div className="space-y-10 text-[#EAE4D9]/70 font-serif italic leading-relaxed">
        <section>
          <p>
            This Acceptable Use Policy sets forth the rules and guidelines for using BRRL Book. By accessing or using our
            platform, you agree to comply with this policy. BRRL Book reserves the right to take appropriate action
            against any user who violates this policy, including suspension or termination of access.
          </p>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">1. Permitted Use</h2>
          <p className="mb-4">
            BRRL Book is designed to be a community platform for bourbon enthusiasts. You are encouraged to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Browse and discover bourbons in our catalog</li>
            <li>Submit honest and thoughtful reviews and ratings</li>
            <li>Share your bourbon collection and experiences with the community</li>
            <li>Maintain wish lists and track bourbons you have tried</li>
            <li>Connect with other bourbon enthusiasts on the platform</li>
            <li>Submit new bourbon entries that are not already in our database</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">2. Prohibited Activities</h2>
          <p className="mb-4">
            When using BRRL Book, you must not engage in any of the following activities:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Posting false, misleading, or fraudulent reviews or content</li>
            <li>Harassing, threatening, or intimidating other users</li>
            <li>Impersonating any person or entity, or falsely stating your affiliation</li>
            <li>Uploading content that is obscene, offensive, or promotes illegal activity</li>
            <li>Attempting to gain unauthorized access to other users' accounts</li>
            <li>Using automated scripts, bots, or scrapers to access the platform</li>
            <li>Distributing spam, chain letters, or unsolicited promotions</li>
            <li>Interfering with or disrupting the integrity or performance of the platform</li>
            <li>Engaging in any activity that violates applicable local, state, national, or international law</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">3. Content Standards</h2>
          <p className="mb-4">
            All content submitted to BRRL Book, including reviews, photographs, and profile information, must adhere to
            the following standards:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Content must be accurate and honest to the best of your knowledge</li>
            <li>Content must not infringe upon the intellectual property rights of any third party</li>
            <li>Content must not contain personal or confidential information about others without their consent</li>
            <li>Content must be relevant to bourbon, whiskey, and the BRRL Book community</li>
            <li>Photographs must be your own or used with proper permission</li>
          </ul>
          <p className="mt-4">
            BRRL Book reserves the right to remove any content that violates these standards without prior notice.
          </p>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">4. Enforcement</h2>
          <p className="mb-4">
            BRRL Book reserves the right to investigate and take appropriate action against anyone who, in our sole
            discretion, violates this policy. Actions may include, but are not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Issuing a warning to the offending user</li>
            <li>Removing or editing offending content</li>
            <li>Temporarily suspending account access</li>
            <li>Permanently terminating the user's account</li>
            <li>Reporting the user to law enforcement authorities if warranted</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">5. Reporting</h2>
          <p>
            If you become aware of any violation of this Acceptable Use Policy, we encourage you to report it to us
            promptly. You can report violations through the BRRL Book platform. We take all reports seriously and will
            investigate each one thoroughly. We appreciate your help in keeping BRRL Book a respectful and enjoyable
            community for all bourbon enthusiasts.
          </p>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">6. Changes to This Policy</h2>
          <p>
            BRRL Book may revise this Acceptable Use Policy at any time. Changes will be effective when posted on the
            platform. Your continued use of BRRL Book after the posting of changes constitutes your acceptance of such
            changes. We encourage you to review this policy periodically to stay informed of any updates.
          </p>
        </section>

        <section>
          <h2 className="font-serif not-italic text-xl text-[#EAE4D9] mb-4">7. Contact</h2>
          <p>
            If you have any questions about this Acceptable Use Policy, please contact us through the BRRL Book platform.
          </p>
        </section>
      </div>
    </div>
  );
}
