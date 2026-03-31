import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function EulaPage() {
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
        <h1 className="font-display text-3xl md:text-4xl font-normal text-[#EAE4D9] mb-3">End-User License Agreement</h1>
        <div className="w-12 h-px bg-[#C89B3C]/50 mb-4"></div>
        <p className="text-[#EAE4D9]/40 font-sans text-xs tracking-wide">Last updated: March 20, 2026</p>
      </div>

      <div className="space-y-10 text-[#EAE4D9]/70 font-serif italic leading-relaxed">
        <section>
          <p>
            This End-User License Agreement ("EULA") is a legal agreement between you and FIREWATER governing your use
            of the FIREWATER web application, including its optional progressive web app (PWA) installation, and all
            related services. You must be at least 21 years of age or the legal drinking age in your jurisdiction,
            whichever is higher, to use this application. By accessing, installing, or using FIREWATER, you confirm that
            you meet this age requirement and agree to be bound by the terms of this EULA. If you do not agree to the
            terms of this EULA, or do not meet the age requirement, do not access or use the application.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">1. License Grant</h2>
          <p>
            FIREWATER grants you a limited, non-exclusive, non-transferable, revocable license to access and use the
            web application for your personal, non-commercial purposes, provided that you are at least 21 years of age
            or the legal drinking age in your jurisdiction, whichever is higher. This license is subject to the terms and
            conditions of this EULA. You may install FIREWATER as a progressive web app (PWA) on devices you own or
            control. You may not distribute or make the application available over a network where it could be used by
            multiple devices at the same time.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">2. Restrictions</h2>
          <p className="mb-4">
            You agree not to, and you will not permit others to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>License, sell, rent, lease, transfer, assign, or otherwise dispose of the application</li>
            <li>Modify, make derivative works of, disassemble, decrypt, reverse compile, or reverse engineer any part of the application</li>
            <li>Remove, alter, or obscure any proprietary notice of FIREWATER or its affiliates</li>
            <li>Use the application for any revenue-generating endeavor or commercial enterprise</li>
            <li>Use the application to create a product, service, or software that competes with the application</li>
            <li>Use the application to send automated queries or unsolicited communications</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">3. Intellectual Property</h2>
          <p>
            The application, including without limitation all copyrights, patents, trademarks, trade secrets, and other
            intellectual property rights, is and shall remain the sole and exclusive property of FIREWATER. This EULA
            does not convey to you any interest in or to the application, but only a limited right of use that is revocable
            in accordance with the terms of this EULA. Nothing in this EULA constitutes a waiver of FIREWATER's
            intellectual property rights under any law.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">4. Updates and Modifications</h2>
          <p>
            As a web application, FIREWATER is updated by deploying new versions to its hosting infrastructure. Updates
            take effect immediately upon deployment and do not require any action on your part. You consent to such
            updates and agree that the terms of this EULA will apply to all updated versions. FIREWATER is not obligated
            to provide any updates or to continue to provide or enable any particular features or functionality of the
            application.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">5. Termination</h2>
          <p>
            This EULA is effective until terminated by you or FIREWATER. Your rights under this EULA will terminate
            automatically without notice if you fail to comply with any of its terms. Upon termination of this EULA,
            you shall cease all use of the application and delete all copies of the application from your devices.
            Termination does not limit any of FIREWATER's other rights or remedies at law or in equity.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">6. Warranty Disclaimer</h2>
          <p>
            The application is provided to you "as is" and "as available" and with all faults and defects without warranty
            of any kind. To the maximum extent permitted under applicable law, FIREWATER expressly disclaims all
            warranties, whether express, implied, statutory, or otherwise, with respect to the application, including all
            implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement, and
            warranties that may arise out of course of dealing, course of performance, usage, or trade practice.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, in no event will FIREWATER be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your
            access to or use of or inability to access or use the application.
          </p>
        </section>

        <section>
          <h2 className="font-display not-italic text-xl text-[#EAE4D9] mb-4">8. Contact</h2>
          <p>
            If you have any questions about this EULA, please contact us through the FIREWATER platform.
          </p>
        </section>
      </div>
    </div>
  );
}
