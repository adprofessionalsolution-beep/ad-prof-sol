import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileText, ArrowLeft, Printer, ExternalLink, Lock, Eye, Database, Mail, Phone, Building2 } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBackToHome?: () => void;
}

export function PrivacyPolicyView({ onBackToHome }: PrivacyPolicyViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-sea-green active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-sea-green/20 px-3.5 py-1.5 text-xs font-bold text-sea-green-light border border-sea-green/30">
            <Lock size={14} />
            Official Privacy & Data Protection Policy
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            This Privacy Policy describes how 8777561824 and its affiliates collect, use, share, protect or otherwise process your personal data.
          </p>

          <div className="pt-4 flex flex-wrap gap-6 text-xs text-slate-400 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-sea-green" />
              <span>Platform: <strong className="text-slate-200">A D Professional Solution</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink size={14} className="text-sea-green" />
              <span>Website: <a href="https://www.adprosol.in/" target="_blank" rel="noopener noreferrer" className="text-sea-green-light hover:underline font-mono">https://www.adprosol.in/</a></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sea-green" />
              <span>Jurisdiction: <strong className="text-slate-200">India Data Protection Laws</strong></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-slate-800 text-sm sm:text-base leading-relaxed"
      >
        {/* Introduction */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">1</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Introduction
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3">
            <p>
              This Privacy Policy describes how <strong>8777561824</strong> and its affiliates (collectively "<strong>8777561824</strong>, we, our, us") collect, use, share, protect or otherwise process your information/ personal data through our website{' '}
              <a href="https://www.adprosol.in/" target="_blank" rel="noopener noreferrer" className="font-bold text-sea-green hover:underline">
                https://www.adprosol.in/
              </a>{' '}
              (hereinafter referred to as <strong>Platform</strong>). Please note that you may be able to browse certain sections of the Platform without registering with us.
            </p>
            <p>
              We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India. By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree please do not use or access our Platform.
            </p>
          </div>
        </div>

        {/* Collection */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">2</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Collection of Data
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3">
            <p>
              We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time. Some of the information that we may collect includes but is not limited to personal data / information provided to us during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile number, email ID and/or any such information shared as proof of identity or address.
            </p>
            <p>
              Some of the sensitive personal data may be collected with your consent, such as your bank account or credit or debit card or other payment instrument information or biometric information such as your facial features or physiological information (in order to enable use of certain features when opted for, available on the Platform) etc all of the above being in accordance with applicable law(s). You always have the option to not provide information, by choosing not to use a particular service or feature on the Platform.
            </p>
            <p>
              We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis. We will also collect your information related to your transactions on Platform and such third-party business partner platforms. When such a third-party business partner collects your personal data directly from you, you will be governed by their privacy policies. We shall not be responsible for the third-party business partner’s privacy practices or the content of their privacy policies, and we request you to read their privacy policies prior to disclosing any information.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-amber-900 font-medium text-xs">
              ⚠️ <strong>Security Advisory:</strong> If you receive an email or call from a person/association claiming to be 8777561824 seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, we request you to <strong>never provide such information</strong>. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">3</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Usage of Data
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm">
            <p>
              We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses. We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, and updates; customise your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as otherwise described to you at the time of collection of information. You understand that your access to these products/services may be affected in the event permission is not provided to us.
            </p>
          </div>
        </div>

        {/* Sharing */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">4</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Sharing of Data
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3">
            <p>
              We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.
            </p>
            <p>
              We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment opted by you. These disclosures may be required for us to provide you access to our services and products offered to you, to comply with our legal obligations, to enforce our user agreement, to facilitate our marketing and advertising activities, to prevent, detect, mitigate, and investigate fraudulent or illegal activities related to our services.
            </p>
            <p>
              We may disclose personal and sensitive personal data to government agencies or other authorised law enforcement agencies if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process. We may disclose personal data to law enforcement offices, third party rights owners, or others in the good faith belief that such disclosure is reasonably necessary to: enforce our Terms of Use or Privacy Policy; respond to claims that an advertisement, posting or other content violates the rights of a third party; or protect the rights, property or personal safety of our users or the general public.
            </p>
          </div>
        </div>

        {/* Security Precautions */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">5</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Security Precautions
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm">
            <p>
              To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server. However, the transmission of information is not completely secure for reasons beyond our control. By using the Platform, the users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure, and therefore, there would always remain certain inherent risks regarding use of the Platform. Users are responsible for ensuring the protection of login and password records for their account.
            </p>
          </div>
        </div>

        {/* Data Deletion & Retention */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">6</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Data Deletion and Retention
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3">
            <p>
              You have an option to delete your account by visiting your profile and settings on our Platform, this action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests.
            </p>
            <p>
              We may in event of any pending grievance, claims, pending shipments or any other services we may refuse or delay deletion of the account. Once the account is deleted, you will lose access to the account. We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes. We may continue to retain your data in anonymised form for analytical and research purposes.
            </p>
          </div>
        </div>

        {/* Your Rights & Consent */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">7</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Your Rights & Consent
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm space-y-3">
            <p>
              <strong>Your Rights:</strong> You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.
            </p>
            <p>
              <strong>Consent:</strong> By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy. If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
            </p>
            <p>
              You consent to us (including our other corporate entities, affiliates, lending partners, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or e-mail for the purposes specified in this Privacy Policy.
            </p>
            <p>
              You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention “<em>Withdrawal of consent for processing personal data</em>” in your subject line.
            </p>
          </div>
        </div>

        {/* Changes & Grievance */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sea-green text-white font-black text-sm">8</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Changes to Privacy Policy & Grievance Officer
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 space-y-2">
              <h3 className="font-extrabold text-slate-900 uppercase text-xs">Changes to Policy</h3>
              <p>
                Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert / notify you about significant changes as required under applicable laws.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sea-green-light/40 border border-sea-green/20 text-xs sm:text-sm text-slate-800 space-y-2">
              <h3 className="font-extrabold text-sea-green-dark uppercase text-xs flex items-center gap-1.5">
                <Mail size={14} /> Grievance Officer & Contact
              </h3>
              <p><strong>Company:</strong> A D Professional Solution / 8777561824</p>
              <p><strong>Address:</strong> North 24 Parganas, West Bengal, India, 743145</p>
              <p><strong>Email:</strong> <a href="mailto:adprofessionalsolution@gmail.com" className="text-sea-green font-bold hover:underline">adprofessionalsolution@gmail.com</a></p>
              <p><strong>Contact Hours:</strong> Monday - Friday (9:00 - 18:00)</p>
            </div>
          </div>
        </div>

        {/* Footer info inside Card */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            Registered Office: North 24 Parganas, West Bengal, India, 743145
          </div>
          <div>
            © A D Professional Solution. All Rights Reserved.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
