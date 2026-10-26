import React from 'react';
import { Shield, ArrowLeft, Lock, Database, Trash2, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
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
            Legal Document
          </span>
          <span className="text-xs text-[#64748B]">Last Updated: October 2026</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">Privacy Policy</h1>
        <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
          HealthAI is committed to transparent, responsible handling of personal and physiological health data. This document outlines our data collection, security architectures, tenant isolation, and your rights under applicable data protection regulations.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="bg-white p-6 sm:p-8 rounded-md border border-[#E2E8F0] space-y-8 text-xs text-[#172B3A] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Database className="w-4 h-4 text-[#0F766E]" />
            <span>1. Categories of Personal and Health Information Collected</span>
          </h2>
          <p className="text-[#64748B]">
            To deliver calibrated disease risk screenings and educational insights, HealthAI collects and processes the following categories of information:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              <strong>Account and Identity Information:</strong> Full legal name, verified email address, hashed authentication credentials, and account creation timestamps.
            </li>
            <li>
              <strong>Demographic Baseline:</strong> Age in completed years and biological sex used solely for calibrating epidemiological risk curves.
            </li>
            <li>
              <strong>Physiological Biometrics:</strong> Height in centimeters (cm), body weight in kilograms (kg), systolic and diastolic blood pressure in mmHg, fasting plasma glucose in mg/dL, serum creatinine in mg/dL, blood urea in mg/dL, and urine albumin levels.
            </li>
            <li>
              <strong>Lifestyle and Behavioral Inputs:</strong> Self-reported smoking history, alcohol consumption frequency, and weekly physical activity hours.
            </li>
            <li>
              <strong>Symptom Check Inquiries:</strong> User-selected primary symptoms, duration in days, severity grading, and associated clinical descriptors.
            </li>
            <li>
              <strong>Assessment and Screening History:</strong> Timestamped risk estimates, categorical classifications (Lower, Moderate, Elevated), and algorithmically generated factor contribution summaries.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Lock className="w-4 h-4 text-[#0F766E]" />
            <span>2. Data Storage, Tenant Isolation, and Security Protocols</span>
          </h2>
          <p className="text-[#64748B]">
            The security and confidentiality of your health data are safeguarded through multi-layered architectural protections:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
              <strong className="block text-[#172B3A] font-semibold mb-1">Cryptographic Password Hashing</strong>
              <p className="text-[#64748B] text-[11px]">
                Passwords are never stored in plaintext. Passwords undergo irreversible salting and hashing using industry standard algorithms prior to persistent database write.
              </p>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
              <strong className="block text-[#172B3A] font-semibold mb-1">Strict User-Level Tenant Isolation</strong>
              <p className="text-[#64748B] text-[11px]">
                Every screening record and biomarker entry is bound directly to the authenticated user ID. Strict backend database constraints prohibit cross-tenant record exposure.
              </p>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
              <strong className="block text-[#172B3A] font-semibold mb-1">Encrypted Communication</strong>
              <p className="text-[#64748B] text-[11px]">
                All data transmission between the client browser and backend services is encrypted using Transport Layer Security (TLS 1.3).
              </p>
            </div>

            <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F7F9FA]">
              <strong className="block text-[#172B3A] font-semibold mb-1">Immutable Security Audit Logs</strong>
              <p className="text-[#64748B] text-[11px]">
                Account access events, password resets, and destructive data purge actions are systematically logged to maintain forensic traceability.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Eye className="w-4 h-4 text-[#0F766E]" />
            <span>3. Third-Party Disclosures and Machine Learning Processing</span>
          </h2>
          <p className="text-[#64748B]">
            HealthAI maintains strict non-disclosure principles:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              <strong>No Sale of Health Information:</strong> HealthAI does not sell, rent, monetize, or trade individual health records, biometric parameters, or user identities to advertisers, brokers, or data aggregators.
            </li>
            <li>
              <strong>Internal Inference Processing:</strong> All machine learning models for Diabetes, Heart Disease, and Chronic Kidney Disease run locally within the application infrastructure. User records are not forwarded to public third-party LLM APIs for analysis.
            </li>
            <li>
              <strong>Model Training Boundaries:</strong> Submitted patient records are not used to train or retrain public foundation models without explicit, opt-in consent from the user and ethical review committee approval.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Trash2 className="w-4 h-4 text-[#0F766E]" />
            <span>4. User Control, Data Portability, and Deletion Rights</span>
          </h2>
          <p className="text-[#64748B]">
            In accordance with digital data protection principles, users maintain complete control over their recorded information:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-[#172B3A]">
            <li>
              <strong>Selective Record Removal:</strong> You may delete individual screening records directly from your Health History archive at any time.
            </li>
            <li>
              <strong>Bulk Health Data Purge:</strong> The Settings portal allows users to execute an immediate purge of all historical screenings and biometric data while retaining account access.
            </li>
            <li>
              <strong>Permanent Account Deletion:</strong> Users may permanently delete their account credentials, personal profile, and all associated assessments. Upon confirmation, data is permanently expunged from the active database.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <FileText className="w-4 h-4 text-[#0F766E]" />
            <span>5. Institutional Review and Data Controller Notice</span>
          </h2>
          <div className="p-4 rounded-md border border-[#E2E8F0] bg-[#F7F9FA] space-y-2">
            <p className="text-[#172B3A] font-medium">
              This system is governed under prototype development protocols and subject to institutional oversight:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-[#0F766E]">
              <div>Data Controller Entity: [Institution / Project Team / Data Controller Legal Entity]</div>
              <div>Lead Developer: Himanshu Sharma and Project Team</div>
              <div>Inquiries and Oversight: privacy@healthai.local</div>
            </div>
            <p className="text-[11px] text-[#64748B] pt-1">
              For academic, clinical research, or production deployment inquiries, contact the designated project team controller.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
