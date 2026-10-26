import React from 'react';
import { ArrowLeft, ShieldAlert, AlertTriangle, FileCheck, Scale, AlertOctagon } from 'lucide-react';

interface TermsPageProps {
  onBack?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#0D655E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Application</span>
        </button>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-[#0F766E] border border-teal-200">
            Legal Terms of Service
          </span>
          <span className="text-xs text-[#64748B]">Effective Date: October 2026</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">Terms and Conditions</h1>
        <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
          Please review these Terms and Conditions carefully prior to creating an account or using HealthAI. Access to and use of this platform are conditioned upon your acceptance of these operational boundaries and liability limitations.
        </p>
      </div>

      {/* Critical Red-Flag Warning Banner */}
      <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-900 flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="font-bold text-red-950 block">Emergency Medical Guidance:</strong>
          <p className="leading-relaxed">
            HealthAI is strictly not an emergency response service. If you are experiencing acute chest pain, sudden numbness, difficulty breathing, slurred speech, severe abdominal trauma, or any life-threatening symptoms, immediately contact emergency medical services (such as 112 / 102 in India or your local emergency dispatch) or proceed to the nearest emergency room.
          </p>
        </div>
      </div>

      {/* Terms Content */}
      <div className="bg-white p-6 sm:p-8 rounded-md border border-[#E2E8F0] space-y-8 text-xs text-[#172B3A] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <FileCheck className="w-4 h-4 text-[#0F766E]" />
            <span>1. Permitted Use and Scope of Service</span>
          </h2>
          <p className="text-[#64748B]">
            HealthAI is engineered as an educational health risk assessment prototype designed to evaluate user-submitted physiological metrics and symptoms against established machine learning algorithms and clinical triage heuristics.
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              <strong>Educational Screening Only:</strong> The services, machine learning models, and risk scores provided through HealthAI are intended solely for educational, preventive, and preliminary risk awareness purposes.
            </li>
            <li>
              <strong>Non-Diagnostic Status:</strong> No output produced by the application constitutes a clinical diagnosis, medical opinion, prognosis, or prescriptive treatment regimen.
            </li>
            <li>
              <strong>Healthcare Professional Consultation:</strong> You agree not to disregard, delay, or modify qualified medical advice, prescription medications, or physician appointments based on outputs from HealthAI.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <ShieldAlert className="w-4 h-4 text-[#0F766E]" />
            <span>2. User Responsibilities and Input Accuracy</span>
          </h2>
          <p className="text-[#64748B]">
            The utility of automated risk estimation depends directly upon the fidelity of submitted values:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              You certify that all health measurements, biometric logs, age disclosures, and symptom durations entered into the platform represent truthful, accurate information.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your session.
            </li>
            <li>
              You agree not to attempt to reverse engineer, disrupt, or introduce malicious payloads into the application infrastructure.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Scale className="w-4 h-4 text-[#0F766E]" />
            <span>3. Limitations of Liability and Warranty Disclaimer</span>
          </h2>
          <p className="text-[#64748B]">
            HealthAI is provided on an "as-is" and "as-available" basis without warranties of any kind, whether express or implied:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              The project team, developers, and institutional sponsors make no warranty that the risk assessments will be error-free, uninterrupted, or applicable to individual clinical outliers.
            </li>
            <li>
              In no event shall Himanshu Sharma, the project team, or affiliated entities be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use or inability to use this platform.
            </li>
            <li>
              Decisions made regarding personal healthcare following the review of platform outputs remain the exclusive responsibility of the user in consultation with licensed healthcare practitioners.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <FileCheck className="w-4 h-4 text-[#0F766E]" />
            <span>4. Intellectual Property and Attribution</span>
          </h2>
          <p className="text-[#64748B]">
            The architecture, interface designs, machine learning feature engineering pipelines, and proprietary content of HealthAI are the intellectual property of Himanshu Sharma and the project development team. All rights are reserved.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <AlertTriangle className="w-4 h-4 text-[#0F766E]" />
            <span>5. Governing Law and Legal Jurisdiction</span>
          </h2>
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] space-y-2">
            <p className="text-[#172B3A] font-medium">
              These Terms and Conditions shall be governed by and construed in accordance with applicable laws:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-[#0F766E]">
              <div>Applicable Jurisdiction: [Jurisdiction / State / Country Governing Law Entity]</div>
              <div>Institutional Sponsor: [Institution / Project Team / Data Controller Legal Entity]</div>
              <div>Legal Contact: legal@healthai.local</div>
            </div>
            <p className="text-[11px] text-[#64748B] pt-1">
              Any disputes arising in connection with the platform shall be resolved within the designated competent jurisdiction.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
